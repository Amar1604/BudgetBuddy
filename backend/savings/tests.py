from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
import datetime
from .models import SavingsGoal

User = get_user_model()


class SavingsGoalAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', password='password123')

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.other_client = APIClient()
        self.other_client.force_authenticate(user=self.other_user)

    def test_jwt_authentication_required(self):
        anon_client = APIClient()
        response = anon_client.get(reverse('savings-goal-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_savings_goal_success(self):
        url = reverse('savings-goal-list')
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        data = {
            "goal_name": "New Car",
            "target_amount": "15000.00",
            "saved_amount": "3000.00",
            "target_date": tomorrow.strftime('%Y-%m-%d'),
            "status": "IN_PROGRESS"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['goal_name'], "New Car")
        self.assertEqual(float(response.data['remaining_amount']), 12000.00)
        self.assertEqual(float(response.data['progress_percentage']), 20.00)

    def test_create_savings_goal_invalid_target_amount(self):
        url = reverse('savings-goal-list')
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        data = {
            "goal_name": "Invalid Goal",
            "target_amount": "0.00",
            "saved_amount": "100.00",
            "target_date": tomorrow.strftime('%Y-%m-%d')
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('target_amount', response.data)

    def test_create_savings_goal_negative_saved_amount(self):
        url = reverse('savings-goal-list')
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        data = {
            "goal_name": "Negative Saved",
            "target_amount": "5000.00",
            "saved_amount": "-10.00",
            "target_date": tomorrow.strftime('%Y-%m-%d')
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('saved_amount', response.data)

    def test_create_savings_goal_past_date(self):
        url = reverse('savings-goal-list')
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        data = {
            "goal_name": "Past Goal",
            "target_amount": "5000.00",
            "saved_amount": "100.00",
            "target_date": yesterday.strftime('%Y-%m-%d')
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('target_date', response.data)

    def test_list_savings_goals_restricted_to_owner(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        SavingsGoal.objects.create(
            user=self.user,
            goal_name="User1 Goal",
            target_amount=1000.00,
            saved_amount=500.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )
        SavingsGoal.objects.create(
            user=self.other_user,
            goal_name="User2 Goal",
            target_amount=2000.00,
            saved_amount=200.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )

        url = reverse('savings-goal-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['goal_name'], "User1 Goal")

    def test_update_savings_goal_success(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="User1 Goal",
            target_amount=1000.00,
            saved_amount=500.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )
        url = reverse('savings-goal-detail', kwargs={'pk': goal.pk})
        data = {
            "saved_amount": "800.00",
            "status": "COMPLETED"
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['saved_amount']), 800.00)
        self.assertEqual(response.data['status'], "COMPLETED")
        self.assertEqual(float(response.data['remaining_amount']), 200.00)

    def test_delete_savings_goal_success(self):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="User1 Goal",
            target_amount=1000.00,
            saved_amount=500.00,
            target_date=tomorrow,
            status='IN_PROGRESS'
        )
        url = reverse('savings-goal-detail', kwargs={'pk': goal.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavingsGoal.objects.filter(pk=goal.pk).exists())
