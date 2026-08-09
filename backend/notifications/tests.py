from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
import datetime
from budgets.models import Budget
from savings.models import SavingsGoal
from .models import Notification

User = get_user_model()


class NotificationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', password='password123')

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.other_client = APIClient()
        self.other_client.force_authenticate(user=self.other_user)

    def test_jwt_authentication_required(self):
        anon_client = APIClient()
        response = anon_client.get(reverse('notification-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_retrieve_notification(self):
        url = reverse('notification-list')
        data = {
            "title": "Welcome Alert",
            "message": "Welcome to BudgetBuddy!",
            "notification_type": "info",
            "priority": "LOW"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "Welcome Alert")
        self.assertEqual(response.data['priority'], "LOW")

        # Get list of notifications
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_mark_as_read_endpoint(self):
        notif = Notification.objects.create(
            user=self.user,
            title="Read Me",
            message="Please read this message",
            notification_type="info",
            priority="MEDIUM",
            is_read=False
        )

        url = reverse('notification-mark-as-read', kwargs={'pk': notif.pk})
        response = self.client.patch(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reload and check database
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_budget_created_signal_trigger(self):
        # Create a new budget and verify that a notification was created
        Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=500.00,
            month=8,
            year=2026
        )

        notifs = Notification.objects.filter(user=self.user, notification_type='info')
        self.assertEqual(notifs.count(), 1)
        self.assertIn("Budget Created", notifs.first().title)
        self.assertEqual(notifs.first().priority, "LOW")

    def test_budget_updated_signal_trigger(self):
        budget = Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=500.00,
            month=8,
            year=2026
        )
        # Clear creation notification
        Notification.objects.filter(user=self.user).delete()

        # Update budget amount
        budget.budget_amount = 750.00
        budget.save()

        notifs = Notification.objects.filter(user=self.user)
        self.assertEqual(notifs.count(), 1)
        self.assertIn("Budget Updated", notifs.first().title)
        self.assertEqual(notifs.first().priority, "MEDIUM")

    def test_savings_goal_created_signal_trigger(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        SavingsGoal.objects.create(
            user=self.user,
            goal_name="Vacation Fund",
            target_amount=1200.00,
            saved_amount=0.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )

        notifs = Notification.objects.filter(user=self.user, notification_type='info')
        self.assertEqual(notifs.count(), 1)
        self.assertIn("Savings Goal Created", notifs.first().title)
        self.assertEqual(notifs.first().priority, "LOW")

    def test_savings_goal_completed_signal_trigger(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Emergency Cash",
            target_amount=1000.00,
            saved_amount=500.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )
        # Clear creation notification
        Notification.objects.filter(user=self.user).delete()

        # Mark completed
        goal.status = 'COMPLETED'
        goal.save()

        notifs = Notification.objects.filter(user=self.user, notification_type='goal_milestone')
        self.assertEqual(notifs.count(), 1)
        self.assertIn("Goal Achieved", notifs.first().title)
        self.assertEqual(notifs.first().priority, "HIGH")

    def test_email_sent_on_notification_creation(self):
        from django.core import mail
        self.user.email = "test@example.com"
        self.user.save()

        Notification.objects.create(
            user=self.user,
            title="High Budget Warning",
            message="Your food budget is at 90%",
            notification_type="budget_alert",
            priority="HIGH"
        )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "[BudgetBuddy] High Budget Warning")
        self.assertIn("test@example.com", mail.outbox[0].to)

