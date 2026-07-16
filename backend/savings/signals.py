from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SavingsGoal
from notifications.models import Notification

@receiver(post_save, sender=SavingsGoal)
def check_savings_goal_completion(sender, instance, created, **kwargs):
    if instance.is_completed:
        # Check if we already notified the user for this specific savings goal completion
        already_notified = Notification.objects.filter(
            user=instance.user,
            notification_type='goal_milestone',
            message__icontains=f"achieved your savings goal '{instance.name}'"
        ).exists()

        if not already_notified:
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

            Notification.objects.create(
                user=instance.user,
                title=f"Goal Achieved: {instance.name}",
                message=f"Congratulations! You have achieved your savings goal '{instance.name}' by saving {currency_symbol}{instance.target_amount:.2f}!",
                notification_type='goal_milestone'
            )
