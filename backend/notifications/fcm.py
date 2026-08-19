import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK if credentials exist
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    
    cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK successfully initialized from credential path.")
    elif os.environ.get('FIREBASE_CREDENTIALS_JSON'):
        import json
        cred_dict = json.loads(os.environ.get('FIREBASE_CREDENTIALS_JSON'))
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK successfully initialized from JSON string.")
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped or failed: {e}")

def send_push_notification(tokens, title, body):
    """
    Sends a push notification to registered FCM device tokens.
    If Firebase credentials are not configured, it gracefully falls back
    to logging the simulated payload.
    """
    if not tokens:
        return

    if not firebase_initialized:
        logger.info(f"[SIMULATED PUSH NOTIFICATION] User Devices: {len(tokens)} | Title: {title} | Message: {body}")
        return

    try:
        from firebase_admin import messaging
        # Send a multicast message to multiple registered devices
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            tokens=tokens,
        )
        response = messaging.send_multicast(message)
        logger.info(f"FCM push notification dispatched: {response.success_count} success, {response.failure_count} failed.")
    except Exception as e:
        logger.error(f"Error executing FCM push notification: {e}", exc_info=True)
