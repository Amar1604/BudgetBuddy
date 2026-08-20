import queue
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core import mail
from django.conf import settings
from .models import Notification

# Global thread-safe queue for emails
email_queue = queue.Queue()

def email_worker():
    while True:
        # Block until at least one email is available
        first_task = email_queue.get()
        print(f"[EMAIL QUEUE] Dequeued first task: '{first_task[0]}' for recipient {first_task[3]}")
        
        # Gather all currently available tasks in the queue to send them in a batch
        tasks = [first_task]
        while not email_queue.empty():
            try:
                task = email_queue.get_nowait()
                tasks.append(task)
                print(f"[EMAIL QUEUE] Dequeued subsequent task: '{task[0]}' for recipient {task[3]}")
            except queue.Empty:
                break
                
        # Open connection and send all gathered emails in a single session
        try:
            print(f"[EMAIL QUEUE] Opening SMTP connection to send {len(tasks)} emails...")
            connection = mail.get_connection()
            connection.open()
            
            emails_to_send = []
            for subject, body, from_email, recipient_list in tasks:
                email = mail.EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=from_email,
                    to=recipient_list,
                    connection=connection
                )
                emails_to_send.append(email)
                
            connection.send_messages(emails_to_send)
            print(f"[EMAIL QUEUE] Successfully sent batch of {len(tasks)} emails!")
        except Exception as e:
            print(f"[EMAIL QUEUE] Failed to send email batch: {e}")
        finally:
            # Mark all processed tasks as done
            for _ in tasks:
                email_queue.task_done()

# Start the single worker thread to process emails sequentially
email_thread = threading.Thread(target=email_worker, name="EmailQueueWorker")
email_thread.daemon = True
email_thread.start()

def send_email_in_background(subject, body, from_email, recipient_list):
    print(f"[EMAIL QUEUE] Enqueuing email task: '{subject}' for recipient {recipient_list}")
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

