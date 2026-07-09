import calendar
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum, Q
from .models import Expense
from budgets.models import Budget
from notifications.models import Notification


@receiver(post_save, sender=Expense)
def check_budget_breach(sender, instance, created, **kwargs):
    # Find active budgets for this user and category on the date of the expense
    budgets = Budget.objects.filter(
        user=instance.user,
        category=instance.category,
        start_date__lte=instance.date
    ).filter(Q(end_date__isnull=True) | Q(end_date__gte=instance.date))

    for budget in budgets:
        b_start = budget.start_date
        b_end = budget.end_date

        if not b_end:
            if budget.period == 'monthly':
                b_start = instance.date.replace(day=1)
                last_day = calendar.monthrange(instance.date.year, instance.date.month)[1]
                b_end = instance.date.replace(day=last_day)
            elif budget.period == 'weekly':
                b_start = instance.date - timedelta(days=instance.date.weekday())
                b_end = b_start + timedelta(days=6)
            elif budget.period == 'yearly':
                b_start = instance.date.replace(month=1, day=1)
                b_end = instance.date.replace(month=12, day=31)
            else:
                b_start = budget.start_date
                b_end = instance.date

        # Sum all expenses in this budget's active period
        total_spent = Expense.objects.filter(
            user=instance.user,
            category=instance.category,
            date__gte=b_start,
            date__lte=b_end
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        if total_spent > budget.amount:
            # Check if we already notified the user for this specific budget breach in this period
            already_notified = Notification.objects.filter(
                user=instance.user,
                notification_type='budget_alert',
                message__icontains=f"exceeds your budget of ${budget.amount:.2f}",
                created_at__date__gte=b_start
            ).exists()

            if not already_notified:
                Notification.objects.create(
                    user=instance.user,
                    title=f"Budget Alert: {instance.get_category_display()}",
                    message=f"You have spent ${total_spent:.2f} on {instance.get_category_display()}, which exceeds your budget of ${budget.amount:.2f} for this period.",
                    notification_type='budget_alert'
                )
