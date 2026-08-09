from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Income
from notifications.models import Notification

@receiver(post_save, sender=Income)
def create_income_notification(sender, instance, created, **kwargs):
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
        title = f"Income Added: {instance.get_source_display()}"
        message = f"An income of {currency_symbol}{instance.amount:.2f} has been added from '{instance.get_source_display()}' on {instance.income_date}."
        priority = "LOW"
    else:
        title = f"Income Updated: {instance.get_source_display()}"
        message = f"The income from '{instance.get_source_display()}' has been updated to {currency_symbol}{instance.amount:.2f}."
        priority = "LOW"

    Notification.objects.create(
        user=instance.user,
        title=title,
        message=message,
        notification_type="info",
        priority=priority
    )
