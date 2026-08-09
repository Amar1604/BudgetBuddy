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

        total_spent = float(total_spent)
        budget_amount = float(budget.budget_amount)

        if budget_amount > 0:
            utilization = (total_spent / budget_amount) * 100
        else:
            utilization = 0.00

        category_name = budget.get_category_display()

        alerts_to_check = []
        if utilization >= 100:
            alerts_to_check.append({
                'title': f"Budget Exceeded: {category_name}",
                'message': f"Budget Exceeded: Your {category_name} Budget has been exceeded.",
                'priority': 'HIGH'
            })
        if utilization >= 90:
            alerts_to_check.append({
                'title': f"Budget High Alert: {category_name}",
                'message': f"High Alert: You have used 90% of your monthly {category_name} Budget.",
                'priority': 'MEDIUM'
            })
        if utilization >= 80:
            alerts_to_check.append({
                'title': f"Budget Warning: {category_name}",
                'message': f"Warning: You have used 80% of your monthly {category_name} Budget.",
                'priority': 'LOW'
            })

        for alert in alerts_to_check:
            # Check if we already notified the user for this specific threshold since the budget was last updated
            already_notified = Notification.objects.filter(
                user=instance.user,
                notification_type='budget_alert',
                message=alert['message'],
                created_at__gte=budget.updated_at
            ).exists()

            if not already_notified:
                Notification.objects.create(
                    user=instance.user,
                    title=alert['title'],
                    message=alert['message'],
                    notification_type='budget_alert',
                    priority=alert['priority']
                )


@receiver(post_save, sender=Expense)
def create_expense_notification(sender, instance, created, **kwargs):
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

    if created:
        title = f"Expense Logged: {instance.get_category_display()}"
        message = f"An expense of {currency_symbol}{instance.amount:.2f} has been logged under '{instance.get_category_display()}' on {instance.expense_date}."
        priority = "LOW"
    else:
        title = f"Expense Updated: {instance.get_category_display()}"
        message = f"The expense under '{instance.get_category_display()}' has been updated to {currency_symbol}{instance.amount:.2f}."
        priority = "LOW"

    Notification.objects.create(
        user=instance.user,
        title=title,
        message=message,
        notification_type="info",
        priority=priority
    )


