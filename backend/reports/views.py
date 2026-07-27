from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
import datetime

from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardAPIView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        now = datetime.datetime.now()
        
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except ValueError:
            return Response(
                {"error": "month and year must be integers"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        total_income = Income.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        current_balance = float(total_income) - float(total_expense)
        
        total_budget = Budget.objects.filter(user=user, month=month, year=year).aggregate(total=Sum('budget_amount'))['total'] or 0.00
        
        month_expense = Expense.objects.filter(
            user=user,
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        remaining_budget = float(total_budget) - float(month_expense)
        
        recent_incomes = Income.objects.filter(user=user).order_by('-income_date', '-id')[:10]
        recent_expenses = Expense.objects.filter(user=user).order_by('-expense_date', '-id')[:10]
        
        transactions = []
        for inc in recent_incomes:
            transactions.append({
                "id": inc.id,
                "type": "income",
                "title": inc.title,
                "amount": float(inc.amount),
                "category": inc.source,
                "date": inc.income_date.strftime('%Y-%m-%d'),
                "created_at": inc.created_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            })
            
        for exp in recent_expenses:
            transactions.append({
                "id": exp.id,
                "type": "expense",
                "title": exp.title,
                "amount": float(exp.amount),
                "category": exp.category,
                "date": exp.expense_date.strftime('%Y-%m-%d'),
                "created_at": exp.created_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            })
            
        transactions.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
        recent_transactions = transactions[:10]
        
        return Response({
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "current_balance": current_balance,
            "total_budget": float(total_budget),
            "remaining_budget": remaining_budget,
            "recent_transactions": recent_transactions
        })

