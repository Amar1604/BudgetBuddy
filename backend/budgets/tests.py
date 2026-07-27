from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
import datetime

from budgets.models import Budget
from expenses.models import Expense
from income.models import Income

User = get_user_model()


class BudgetAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', password='password123')
        
        # Authenticate main user
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Authenticate other user
        self.other_client = APIClient()
        self.other_client.force_authenticate(user=self.other_user)

    def test_jwt_authentication_required(self):
        # Create an unauthenticated client
        anon_client = APIClient()
        response = anon_client.get(reverse('budget-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_budget_creation(self):
        url = reverse('budget-list')
        data = {
            "category": "FOOD",
            "budget_amount": 500.00,
            "month": 7,
            "year": 2026
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Budget.objects.filter(user=self.user).count(), 1)
        budget = Budget.objects.first()
        self.assertEqual(budget.category, "FOOD")
        self.assertEqual(float(budget.budget_amount), 500.00)
        self.assertEqual(budget.month, 7)
        self.assertEqual(budget.year, 2026)

    def test_budget_creation_backward_compatible(self):
        url = reverse('budget-list')
        # React frontend sends 'amount' and 'start_date'
        data = {
            "category": "TRAVEL",
            "amount": 250.50,
            "start_date": "2026-08-15"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        budget = Budget.objects.get(category="TRAVEL")
        self.assertEqual(float(budget.budget_amount), 250.50)
        self.assertEqual(budget.month, 8)
        self.assertEqual(budget.year, 2026)

    def test_duplicate_budget_validation(self):
        # Create first budget
        Budget.objects.create(user=self.user, category="FOOD", budget_amount=500.00, month=7, year=2026)
        
        url = reverse('budget-list')
        data = {
            "category": "FOOD",
            "budget_amount": 600.00,
            "month": 7,
            "year": 2026
        }
        # Attempt to create duplicate
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A budget for this category and month already exists.", str(response.data))

    def test_budget_crud_operations(self):
        # Create a budget
        budget = Budget.objects.create(user=self.user, category="FOOD", budget_amount=500.00, month=7, year=2026)
        
        # View
        url = reverse('budget-detail', kwargs={'pk': budget.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['category'], "FOOD")
        self.assertEqual(float(response.data['amount']), 500.00)  # check backward compatible key
        
        # Update
        update_data = {"budget_amount": 600.00}
        response = self.client.patch(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        budget.refresh_from_db()
        self.assertEqual(float(budget.budget_amount), 600.00)
        
        # Delete
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Budget.objects.filter(pk=budget.pk).count(), 0)

    def test_budget_summary_api(self):
        budget = Budget.objects.create(user=self.user, category="FOOD", budget_amount=1000.00, month=7, year=2026)
        
        # Log expenses
        Expense.objects.create(user=self.user, title="Groceries", amount=400.00, category="FOOD", expense_date="2026-07-10")
        Expense.objects.create(user=self.user, title="Dinner", amount=150.00, category="FOOD", expense_date="2026-07-15")
        # Expense in different month or category should not count
        Expense.objects.create(user=self.user, title="Rent", amount=1000.00, category="BILLS", expense_date="2026-07-20")
        Expense.objects.create(user=self.user, title="Lunch", amount=50.00, category="FOOD", expense_date="2026-08-01")
        
        # Detail summary URL: /api/budgets/<id>/summary/
        url = reverse('budget-summary', kwargs={'pk': budget.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['budget_amount'], 1000.00)
        self.assertEqual(response.data['total_expense'], 550.00)  # 400 + 150
        self.assertEqual(response.data['remaining_budget'], 450.00)  # 1000 - 550
        self.assertEqual(response.data['overspent_amount'], 0.00)

        # Let's add overspending
        Expense.objects.create(user=self.user, title="Expensive Dinner", amount=600.00, category="FOOD", expense_date="2026-07-25")
        response = self.client.get(url)
        self.assertEqual(response.data['total_expense'], 1150.00)
        self.assertEqual(response.data['remaining_budget'], -150.00)
        self.assertEqual(response.data['overspent_amount'], 150.00)

        # List summary URL: /api/budgets/summary/?category=FOOD&month=7&year=2026
        list_url = reverse('budget-list-summary') + "?category=FOOD&month=7&year=2026"
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['budget_amount'], 1000.00)
        self.assertEqual(response.data['total_expense'], 1150.00)
        self.assertEqual(response.data['remaining_budget'], -150.00)
        self.assertEqual(response.data['overspent_amount'], 150.00)

    def test_transaction_dashboard_api(self):
        # Create incomes
        Income.objects.create(user=self.user, title="Monthly Salary", amount=25000.00, source="SALARY", income_date="2026-07-01")
        Income.objects.create(user=self.user, title="Freelance", amount=5000.00, source="FREELANCING", income_date="2026-07-15")
        
        # Create expenses
        Expense.objects.create(user=self.user, title="Rent Payment", amount=12000.00, category="BILLS", expense_date="2026-07-02")
        Expense.objects.create(user=self.user, title="Supermarket", amount=3000.00, category="FOOD", expense_date="2026-07-10")
        
        # Create budgets
        Budget.objects.create(user=self.user, category="FOOD", budget_amount=5000.00, month=7, year=2026)
        Budget.objects.create(user=self.user, category="BILLS", budget_amount=15000.00, month=7, year=2026)
        
        url = reverse('dashboard') + "?month=7&year=2026"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data['total_income'], 30000.00)
        self.assertEqual(response.data['total_expense'], 15000.00)
        self.assertEqual(response.data['current_balance'], 15000.00)
        self.assertEqual(response.data['total_budget'], 20000.00)  # 5000 + 15000
        self.assertEqual(response.data['remaining_budget'], 5000.00)  # 20000 - 15000 (spent)
        
        # Check recent transactions formatting and order
        recent = response.data['recent_transactions']
        self.assertTrue(len(recent) >= 4)
        # Verify sorting (descending by date)
        self.assertEqual(recent[0]['title'], "Freelance")
        self.assertEqual(recent[0]['type'], "income")
        self.assertEqual(recent[1]['title'], "Supermarket")
        self.assertEqual(recent[1]['type'], "expense")

