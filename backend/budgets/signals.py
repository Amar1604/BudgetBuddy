from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Budget
from notifications.models import Notification


@receiver(post_save, sender=Budget)
def create_budget_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
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
        title = f"Budget Created: {instance.get_category_display()}"
        message = f"A new budget of {currency_symbol}{instance.budget_amount:.2f} has been created for {instance.get_category_display()} in {instance.month}/{instance.year}."
        priority = "LOW"
    else:
        title = f"Budget Updated: {instance.get_category_display()}"
        message = f"The budget for {instance.get_category_display()} in {instance.month}/{instance.year} has been updated to {currency_symbol}{instance.budget_amount:.2f}."
        priority = "MEDIUM"

    Notification.objects.create(
        user=instance.user,
        title=title,
        message=message,
        notification_type="info",
        priority=priority
    )
