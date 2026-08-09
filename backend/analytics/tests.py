from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import datetime

from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from savings.models import SavingsGoal
from notifications.models import Notification

User = get_user_model()

class AnalyticsAPITests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
        
        # Create Incomes
        self.income1 = Income.objects.create(
            user=self.user,
            title='Salary',
            amount=5000.00,
            source='SALARY',
            income_date=datetime.date(2026, 8, 1)
        )
        self.income2 = Income.objects.create(
            user=self.user,
            title='Freelancing',
            amount=3000.00,
            source='FREELANCING',
            income_date=datetime.date(2026, 8, 2)
        )
        
        # Create Expenses
        self.expense1 = Expense.objects.create(
            user=self.user,
            title='Grocery',
            amount=1500.00,
            category='FOOD',
            expense_date=datetime.date(2026, 8, 1)
        )
        self.expense2 = Expense.objects.create(
            user=self.user,
            title='Clothes',
            amount=2500.00,
            category='SHOPPING',
            expense_date=datetime.date(2026, 8, 2)
        )
        self.expense3 = Expense.objects.create(
            user=self.user,
            title='Fast Food',
            amount=500.00,
            category='FOOD',
            expense_date=datetime.date(2026, 8, 3)
        )

        # Create Savings Goals
        self.goal1 = SavingsGoal.objects.create(
            user=self.user,
            goal_name='Emergency Fund',
            target_amount=10000.00,
            saved_amount=2000.00,
            target_date=datetime.date(2026, 12, 31),
            status='IN_PROGRESS'
        )
        self.goal2 = SavingsGoal.objects.create(
            user=self.user,
            goal_name='Vacation',
            target_amount=5000.00,
            saved_amount=5000.00,
            target_date=datetime.date(2026, 10, 1),
            status='COMPLETED'
        )

        # Create Budget
        self.budget1 = Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=3000.00,
            month=8,
            year=2026
        )

        # Create Notification (clean up signal-created notifications first)
        Notification.objects.filter(user=self.user).delete()
        self.notif1 = Notification.objects.create(
            user=self.user,
            title='Welcome',
            message='Welcome to BudgetBuddy',
            notification_type='info',
            priority='LOW'
        )

    def test_financial_summary_api(self):
        url = reverse('financial-summary')
        response = self.client.get(url, {'month': 8, 'year': 2026})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Total Income = 5000 + 3000 = 8000
        self.assertEqual(response.data['total_income'], 8000.0)
        
        # Total Expense = 1500 + 2500 + 500 = 4500
        self.assertEqual(response.data['total_expense'], 4500.0)
        
        # Current Balance = 8000 - 4500 = 3500
        self.assertEqual(response.data['current_balance'], 3500.0)
        
        # Total Savings = 2000 + 5000 = 7000
        self.assertEqual(response.data['total_savings'], 7000.0)
        
        # Remaining Budget for FOOD = 3000 - 4500 = -1500
        self.assertEqual(response.data['remaining_budget'], -1500.0)

    def test_category_expense_analysis_api(self):
        url = reverse('category-expenses')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Grouped and sorted by total_amount desc: Shopping first (2500), then Food (2000)
        self.assertEqual(response.data[0]['category'], 'SHOPPING')
        self.assertEqual(response.data[0]['total_amount'], 2500.0)
        self.assertEqual(response.data[0]['percentage'], 55.56)
        
        self.assertEqual(response.data[1]['category'], 'FOOD')
        self.assertEqual(response.data[1]['total_amount'], 2000.0)
        self.assertEqual(response.data[1]['percentage'], 44.44)

    def test_monthly_expense_trend_api(self):
        url = reverse('monthly-trends')
        response = self.client.get(url, {'year': 2026})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['month_name'], 'August')
        self.assertEqual(response.data[0]['total_amount'], 4500.0)

    def test_expense_extremes_api(self):
        url = reverse('expense-extremes')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Highest = Clothes (2500)
        self.assertEqual(response.data['highest_expense']['title'], 'Clothes')
        self.assertEqual(float(response.data['highest_expense']['amount']), 2500.0)
        
        # Lowest = Fast Food (500)
        self.assertEqual(response.data['lowest_expense']['title'], 'Fast Food')
        self.assertEqual(float(response.data['lowest_expense']['amount']), 500.0)
        
        # Latest = Fast Food (logged Aug 3)
        self.assertEqual(response.data['latest_expense']['title'], 'Fast Food')
        
        # Oldest = Grocery (logged Aug 1)
        self.assertEqual(response.data['oldest_expense']['title'], 'Grocery')

    def test_dashboard_api(self):
        url = reverse('analytics-dashboard')
        response = self.client.get(url, {'month': 8, 'year': 2026})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('financial_summary', response.data)
        self.assertIn('category_analysis', response.data)
        self.assertIn('monthly_trend', response.data)
        self.assertIn('recent_transactions', response.data)
        self.assertIn('latest_notifications', response.data)
        self.assertIn('active_savings_goals', response.data)
        self.assertIn('budget_usage', response.data)
        
        # Validate values
        self.assertEqual(response.data['financial_summary']['total_income'], 8000.0)
        self.assertEqual(len(response.data['active_savings_goals']), 1) # only IN_PROGRESS
        self.assertEqual(response.data['active_savings_goals'][0]['goal_name'], 'Emergency Fund')
        self.assertEqual(len(response.data['latest_notifications']), 1)
        self.assertEqual(len(response.data['recent_transactions']), 5) # 3 expenses + 2 incomes
