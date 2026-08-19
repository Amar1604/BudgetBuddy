import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

def send_email_in_background(subject, body, from_email, recipient_list):
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email async: {e}")

@receiver(post_save, sender=Notification)
def send_notification_email_alert(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created and instance.user.email:
        subject = f"[BudgetBuddy] {instance.title}"
        body = f"""Hello {instance.user.username},

You have a new {instance.get_notification_type_display()} alert on BudgetBuddy:

{instance.message}

Please log in to your dashboard to review this alert.

Best regards,
The BudgetBuddy Team"""
        
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@budgetbuddy.com')
        recipient_list = [instance.user.email]
        
        # Dispatch email asynchronously in a daemon thread so it doesn't block the request
        thread = threading.Thread(
            target=send_email_in_background,
            args=(subject, body, from_email, recipient_list)
        )
        thread.daemon = True
        thread.start()


@receiver(post_save, sender=Notification)
def send_notification_push_alert(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created:
        # Retrieve all user device tokens registered in the system
        tokens = list(instance.user.fcm_tokens.values_list('token', flat=True))
        if tokens:
            from .fcm import send_push_notification
            send_push_notification(tokens, instance.title, instance.message)

