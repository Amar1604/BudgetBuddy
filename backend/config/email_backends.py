import os
import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

class BrevoHTTPBackend(BaseEmailBackend):
    """
    Custom Django Email Backend that dispatches emails via Brevo's HTTP API.
    Bypasses standard SMTP port blocks, making it ideal for Render free-tier hosting.
    """
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        api_key = os.getenv('BREVO_API_KEY')
        if not api_key:
            print("[BREVO BACKEND] Missing BREVO_API_KEY environment variable!")
            return 0
            
        sent_count = 0
        for message in email_messages:
            try:
                headers = {
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
                
                # Format recipients
                to_list = [{"email": email} for email in message.to]
                
                data = {
                    "sender": {
                        "name": "BudgetBuddy",
                        "email": message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'budgetbuddy1604@gmail.com')
                    },
                    "to": to_list,
                    "subject": message.subject,
                    "textContent": message.body,
                }
                
                print(f"[BREVO BACKEND] Dispatching email: '{message.subject}' to {message.to}...")
                response = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers=headers,
                    json=data,
                    timeout=10
                )
                
                if response.status_code in [200, 201, 202]:
                    sent_count += 1
                    print(f"[BREVO BACKEND] Email successfully sent to {message.to}")
                else:
                    print(f"[BREVO BACKEND] API failed with status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"[BREVO BACKEND] Error dispatching email: {e}")
                
        return sent_count
