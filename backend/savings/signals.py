from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SavingsGoal
from notifications.models import Notification

@receiver(post_save, sender=SavingsGoal)
def handle_savings_goal_notifications(sender, instance, created, **kwargs):
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
        Notification.objects.create(
            user=instance.user,
            title=f"Savings Goal Created: {instance.goal_name}",
            message=f"You have set a new savings goal of {currency_symbol}{instance.target_amount:.2f} for '{instance.goal_name}', target date: {instance.target_date}.",
            notification_type='info',
            priority='LOW'
        )
    elif instance.status == 'COMPLETED':
        # Check if we already notified the user for this specific savings goal completion
        already_notified = Notification.objects.filter(
            user=instance.user,
            notification_type='goal_milestone',
            message__icontains=f"achieved your savings goal '{instance.goal_name}'"
        ).exists()

        if not already_notified:
            Notification.objects.create(
                user=instance.user,
                title=f"Goal Achieved: {instance.goal_name}",
                message=f"Congratulations! You have achieved your savings goal '{instance.goal_name}' by saving {currency_symbol}{instance.target_amount:.2f}!",
                notification_type='goal_milestone',
                priority='HIGH'
            )
