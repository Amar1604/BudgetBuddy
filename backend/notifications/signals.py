import queue
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

# Global thread-safe queue for emails
email_queue = queue.Queue()

def email_worker():
    while True:
        subject, body, from_email, recipient_list = email_queue.get()
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email in sequential queue: {e}")
        finally:
            email_queue.task_done()

# Start the single worker thread to process emails sequentially
email_thread = threading.Thread(target=email_worker, name="EmailQueueWorker")
email_thread.daemon = True
email_thread.start()

def send_email_in_background(subject, body, from_email, recipient_list):
    # Enqueue the email to be sent sequentially
    email_queue.put((subject, body, from_email, recipient_list))

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
        
        # Enqueue email task to queue
        send_email_in_background(subject, body, from_email, recipient_list)


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

