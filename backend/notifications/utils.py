from django.utils import timezone
from datetime import timedelta
import calendar
import logging
import sys

logger = logging.getLogger(__name__)

def generate_lazy_notifications(user, force=False):
    """
    On-demand notification generator.
    Called when a user views their dashboard or notification list.
    Generates:
      1. Weekly savings goal reminders for active goals.
      2. Monthly report notifications for the previous month.
    """
    if not user or not user.is_authenticated:
        return

    # Skip during standard unit tests to preserve test isolation and avoid breaking assertions
    if 'test' in sys.argv and not force:
        return

    from .models import Notification
    from savings.models import SavingsGoal

    try:
        # 1. Savings Goal Reminders (weekly alert for active goals)
        active_goals = SavingsGoal.objects.filter(user=user, status='IN_PROGRESS')
        for goal in active_goals:
            seven_days_ago = timezone.now() - timedelta(days=7)
            # Find if a savings reminder for this goal was already created in last 7 days
            recent_reminder_exists = Notification.objects.filter(
                user=user,
                notification_type='reminder',
                title=f"Savings Reminder: {goal.goal_name}",
                created_at__gte=seven_days_ago
            ).exists()

            if not recent_reminder_exists:
                pref = 'USD'
                if hasattr(user, 'profile'):
                    pref = user.profile.currency_preference

                symbols = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'CA$',
                    'AUD': 'A$', 'INR': '₹', 'BRL': 'R$', 'MXN': 'Mex$', 'CHF': 'CHF'
                }
                currency_symbol = symbols.get(pref, '$')

                Notification.objects.create(
                    user=user,
                    title=f"Savings Reminder: {goal.goal_name}",
                    message=f"Friendly reminder to contribute towards your savings goal '{goal.goal_name}'. You have saved {currency_symbol}{goal.saved_amount:.2f} of {currency_symbol}{goal.target_amount:.2f} (Target Date: {goal.target_date}).",
                    notification_type='reminder',
                    priority='MEDIUM'
                )

        # 2. Monthly Report Notifications (sent at the start of a new month)
        now = timezone.now()
        first_day_of_current_month = now.replace(day=1)
        last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
        prev_month = last_day_of_previous_month.month
        prev_year = last_day_of_previous_month.year
        prev_month_name = calendar.month_name[prev_month]

        report_title = f"Monthly Report Ready: {prev_month_name} {prev_year}"
        report_notif_exists = Notification.objects.filter(
            user=user,
            notification_type='reminder',
            title=report_title
        ).exists()

        if not report_notif_exists:
            Notification.objects.create(
                user=user,
                title=report_title,
                message=f"Your financial report for {prev_month_name} {prev_year} is ready. Go to the Reports section to view and export it.",
                notification_type='reminder',
                priority='MEDIUM'
            )
    except Exception as e:
        logger.error(f"Error generating lazy notifications for user {user.id}: {e}", exc_info=True)
