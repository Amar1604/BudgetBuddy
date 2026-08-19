import datetime
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ValidationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='validationuser',
            email='val@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_expense_negative_amount_fails(self):
        url = reverse('expense-list')  # Default Router creates expense-list name
        data = {
            "title": "Negative Expense",
            "amount": -100.00,
            "category": "FOOD",
            "date": "2026-08-01"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', res.data)

    def test_create_expense_zero_amount_fails(self):
        url = reverse('expense-list')
        data = {
            "title": "Zero Expense",
            "amount": 0.00,
            "category": "FOOD",
            "date": "2026-08-01"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_future_date_fails(self):
        url = reverse('expense-list')
        future_date = (datetime.date.today() + datetime.timedelta(days=2)).strftime('%Y-%m-%d')
        data = {
            "title": "Future Expense",
            "amount": 50.00,
            "category": "FOOD",
            "date": future_date
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expense_date', res.data)

    def test_create_income_negative_amount_fails(self):
        url = reverse('income-list')
        data = {
            "title": "Negative Income",
            "amount": -500.00,
            "source": "SALARY",
            "date": "2026-08-01"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', res.data)

    def test_create_income_zero_amount_fails(self):
        url = reverse('income-list')
        data = {
            "title": "Zero Income",
            "amount": 0.00,
            "source": "SALARY",
            "date": "2026-08-01"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_budget_negative_amount_fails(self):
        url = reverse('budget-list')
        data = {
            "category": "FOOD",
            "amount": -200.00,
            "month": 8,
            "year": 2026
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('budget_amount', res.data)

    def test_create_budget_zero_amount_fails(self):
        url = reverse('budget-list')
        data = {
            "category": "FOOD",
            "amount": 0.00,
            "month": 8,
            "year": 2026
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_savings_goal_negative_amount_fails(self):
        url = reverse('savings-goal-list')
        data = {
            "goal_name": "Negative Goal",
            "target_amount": -1000.00,
            "saved_amount": 0.00,
            "target_date": "2027-01-01"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('target_amount', res.data)
