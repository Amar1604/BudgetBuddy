from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from budgets.models import Budget
from savings.models import SavingsGoal

User = get_user_model()

class RBACAPITests(APITestCase):

    def setUp(self):
        # 1. Student User
        self.student = User.objects.create_user(
            username='student_user',
            email='student@example.com',
            password='testpassword123',
            role='student'
        )
        # 2. Admin User
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='testpassword123',
            role='admin'
        )

    def test_student_budget_limit(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('budget-list')
        
        # Create 3 budgets
        for i in range(3):
            Budget.objects.create(
                user=self.student,
                category='FOOD',
                budget_amount=100.00,
                month=i+1,
                year=2026
            )
            
        # Try to create a 4th budget - should fail
        data = {
            "category": "TRAVEL",
            "budget_amount": 150.00,
            "month": 1,
            "year": 2026
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', res.data)

        # Upgrade to premium and try again
        self.student.role = 'premium'
        self.student.save()
        
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_student_savings_goal_limit(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('savings-goal-list')
        
        # Create 2 savings goals
        for i in range(2):
            SavingsGoal.objects.create(
                user=self.student,
                goal_name=f'Goal {i}',
                target_amount=1000.00,
                target_date="2026-12-31"
            )
            
        # Try to create a 3rd goal - should fail
        data = {
            "goal_name": "Goal 3",
            "target_amount": 5000.00,
            "target_date": "2026-12-31"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', res.data)

        # Upgrade to premium and try again
        self.student.role = 'premium'
        self.student.save()
        
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_admin_stats_access(self):
        url = reverse('admin-stats')
        
        # 1. Student access - Forbidden
        self.client.force_authenticate(user=self.student)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Admin access - Success
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', res.data)

    def test_premium_upgrade_endpoint(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('subscribe_premium')
        
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['role'], 'premium')
        
        # Refresh user from DB
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'premium')
