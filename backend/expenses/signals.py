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
    # Safe date parsing if instance.date is a string
    from django.utils.dateparse import parse_date
    d = instance.date
    if isinstance(d, str):
        d = parse_date(d)
        
    if not d:
        return

    # Find budgets matching the user, category, month, and year of the expense date
    budgets = Budget.objects.filter(
        user=instance.user,
        category=instance.category,
        month=d.month,
        year=d.year
    )

    for budget in budgets:
        # Sum all expenses in this budget's month and year
        from datetime import date
        b_start = date(budget.year, budget.month, 1)
        last_day = calendar.monthrange(budget.year, budget.month)[1]
        b_end = date(budget.year, budget.month, last_day)

        total_spent = Expense.objects.filter(
            user=instance.user,
            category=instance.category,
            expense_date__gte=b_start,
            expense_date__lte=b_end
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        if total_spent > budget.budget_amount:
            pref = 'USD'
            if hasattr(instance.user, 'profile'):
                pref = instance.user.profile.currency_preference
            
            symbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'CAD': 'CA$',
                'AUD': 'A$',
                'INR': '₹',
                'BRL': 'R$',
                'MXN': 'Mex$',
                'CHF': 'CHF'
            }
            currency_symbol = symbols.get(pref, '$')

            # Check if we already notified the user for this specific budget breach in this period
            message_contains = f"exceeds your budget of {currency_symbol}{budget.budget_amount:.2f}"
            already_notified = Notification.objects.filter(
                user=instance.user,
                notification_type='budget_alert',
                message__icontains=message_contains,
                created_at__date__gte=b_start
            ).exists()

            if not already_notified:
                Notification.objects.create(
                    user=instance.user,
                    title=f"Budget Alert: {instance.get_category_display()}",
                    message=f"You have spent {currency_symbol}{total_spent:.2f} on {instance.get_category_display()}, which exceeds your budget of {currency_symbol}{budget.budget_amount:.2f} for this period.",
                    notification_type='budget_alert'
                )

