from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.contrib.auth import get_user_model
from expenses.models import Expense
from income.models import Income
from budgets.models import Budget
from savings.models import SavingsGoal

User = get_user_model()

class IsAdminUserPermission(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'admin')


class AdminStatsAPIView(APIView):
    permission_classes = [IsAdminUserPermission]

    def get(self, request):
        total_users = User.objects.count()
        total_expenses_count = Expense.objects.count()
        total_incomes_count = Income.objects.count()
        total_budgets_count = Budget.objects.count()
        total_savings_count = SavingsGoal.objects.count()

        # Last 10 registered users
        recent_users = User.objects.order_by('-date_joined')[:10]
        recent_users_data = [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'date_joined': u.date_joined.isoformat()
        } for u in recent_users]

        return Response({
            'total_users': total_users,
            'total_expenses': total_expenses_count,
            'total_incomes': total_incomes_count,
            'total_budgets': total_budgets_count,
            'total_savings_goals': total_savings_count,
            'recent_users': recent_users_data
        }, status=status.HTTP_200_OK)
