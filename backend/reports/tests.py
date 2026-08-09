from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
import datetime
from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from reports.models import Report

User = get_user_model()


class ReportsAndDashboardTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Setup test data
        self.income = Income.objects.create(
            user=self.user,
            amount=5000.00,
            source='SALARY',
            income_date=datetime.date(2026, 7, 10),
            title="Monthly Salary"
        )
        self.expense = Expense.objects.create(
            user=self.user,
            amount=1500.00,
            category='FOOD',
            expense_date=datetime.date(2026, 7, 12),
            title="Grocery Shopping"
        )
        self.budget = Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=2000.00,
            month=7,
            year=2026
        )

    def test_dashboard_api(self):
        url = reverse('dashboard')
        response = self.client.get(url, {'month': 7, 'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_income'], 5000.00)
        self.assertEqual(response.data['total_expense'], 1500.00)
        self.assertEqual(response.data['current_balance'], 3500.00)
        self.assertEqual(response.data['total_budget'], 2000.00)
        self.assertEqual(response.data['remaining_budget'], 500.00)
        self.assertEqual(len(response.data['recent_transactions']), 2)

    def test_report_generation_income_summary(self):
        url = reverse('report-list')
        data = {
            "title": "July Income Summary",
            "report_type": "income_summary",
            "date_range_start": "2026-07-01",
            "date_range_end": "2026-07-31"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['total_income'], 5000.0)
        self.assertEqual(response.data['data']['by_source']['SALARY'], 5000.0)

    def test_report_generation_expense_summary(self):
        url = reverse('report-list')
        data = {
            "title": "July Expense Summary",
            "report_type": "expense_summary",
            "date_range_start": "2026-07-01",
            "date_range_end": "2026-07-31"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['total_expense'], 1500.0)
        self.assertEqual(response.data['data']['by_category']['FOOD'], 1500.0)

    def test_report_generation_budget_vs_actual(self):
        url = reverse('report-list')
        data = {
            "title": "July Budget vs Actual",
            "report_type": "budget_vs_actual",
            "date_range_start": "2026-07-01",
            "date_range_end": "2026-07-31"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['total_budget'], 2000.0)
        self.assertEqual(response.data['data']['total_actual'], 1500.0)
        self.assertEqual(response.data['data']['categories']['FOOD']['budget'], 2000.0)
        self.assertEqual(response.data['data']['categories']['FOOD']['actual'], 1500.0)
        self.assertEqual(response.data['data']['categories']['FOOD']['variance'], 500.0)

    def test_report_generation_net_worth(self):
        url = reverse('report-list')
        data = {
            "title": "July Net Worth",
            "report_type": "net_worth",
            "date_range_start": "2026-07-01",
            "date_range_end": "2026-07-31"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['total_income'], 5000.0)
        self.assertEqual(response.data['data']['total_expense'], 1500.0)
        self.assertEqual(response.data['data']['net_savings'], 3500.0)

    def test_monthly_financial_report(self):
        url = reverse('monthly-financial-report')
        response = self.client.get(url, {'month': 7, 'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_income'], 5000.0)
        self.assertEqual(response.data['total_expense'], 1500.0)
        self.assertEqual(response.data['current_balance'], 3500.0)
        self.assertEqual(response.data['remaining_budget'], 500.0)

    def test_expense_report(self):
        url = reverse('expense-report')
        response = self.client.get(url, {
            'filter_type': 'custom',
            'start_date': '2026-07-01',
            'end_date': '2026-07-31'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Grocery Shopping')
        self.assertEqual(response.data[0]['category'], 'Food')
        
    def test_expense_report_csv_export(self):
        url = reverse('expense-report')
        response = self.client.get(url, {
            'filter_type': 'custom',
            'start_date': '2026-07-01',
            'end_date': '2026-07-31',
            'export': 'csv'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename=', response['Content-Disposition'])
        content = response.content.decode('utf-8')
        self.assertIn('Expense Title,Category,Amount,Date,Description', content)
        self.assertIn('Grocery Shopping,Food,1500.0,2026-07-12', content)

    def test_savings_report(self):
        from savings.models import SavingsGoal
        # Clean existing savings goals generated by signals to avoid unexpected count issues
        SavingsGoal.objects.filter(user=self.user).delete()
        
        SavingsGoal.objects.create(
            user=self.user,
            goal_name='House Deposit',
            target_amount=50000.00,
            saved_amount=5000.00,
            target_date=datetime.date(2026, 12, 31)
        )
        url = reverse('savings-report')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['goal_name'], 'House Deposit')
        self.assertEqual(response.data[0]['remaining_amount'], 45000.0)
        self.assertEqual(response.data[0]['progress_percentage'], 10.0)

    def test_combined_summary_report(self):
        url = reverse('combined-summary-report')
        response = self.client.get(url, {
            'filter_type': 'custom',
            'start_date': '2026-07-01',
            'end_date': '2026-07-31'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('financial_summary', response.data)
        self.assertIn('expense_summary', response.data)
        self.assertIn('income_summary', response.data)
        self.assertIn('budget_summary', response.data)
        self.assertIn('savings_summary', response.data)
        self.assertIn('latest_notifications', response.data)
        self.assertEqual(response.data['financial_summary']['total_income'], 5000.0)
        self.assertEqual(response.data['financial_summary']['total_expense'], 1500.0)

    def test_combined_summary_csv_export(self):
        url = reverse('combined-summary-report')
        response = self.client.get(url, {
            'filter_type': 'custom',
            'start_date': '2026-07-01',
            'end_date': '2026-07-31',
            'export': 'csv'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename=', response['Content-Disposition'])
        content = response.content.decode('utf-8')
        self.assertIn('--- FINANCIAL SUMMARY REPORT ---', content)
        self.assertIn('Total Income,5000.0', content)

