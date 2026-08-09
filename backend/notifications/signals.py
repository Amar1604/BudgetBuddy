from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

@receiver(post_save, sender=Notification)
def send_notification_email_alert(sender, instance, created, **kwargs):
    if created and instance.user.email:
        subject = f"[BudgetBuddy] {instance.title}"
        body = f"""Hello {instance.user.username},

You have a new {instance.get_notification_type_display()} alert on BudgetBuddy:

{instance.message}

Please log in to your dashboard to review this alert.

Best regards,
The BudgetBuddy Team"""
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@budgetbuddy.com'),
                recipient_list=[instance.user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email notification to {instance.user.email}: {e}")
