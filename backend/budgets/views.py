from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from expenses.models import Expense
from .models import Budget
from .serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        budget = self.get_object()
        
        total_expense = Expense.objects.filter(
            user=request.user,
            category=budget.category,
            expense_date__year=budget.year,
            expense_date__month=budget.month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        remaining = float(budget.budget_amount) - float(total_expense)
        overspent = abs(remaining) if remaining < 0 else 0.00
        
        return Response({
            "budget_amount": float(budget.budget_amount),
            "total_expense": float(total_expense),
            "remaining_budget": remaining,
            "overspent_amount": overspent
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def list_summary(self, request):
        category = request.query_params.get('category')
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        if not category or not month or not year:
            return Response(
                {"error": "category, month, and year query parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"error": "month and year must be integers"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            budget = Budget.objects.get(user=request.user, category=category, month=month, year=year)
            budget_amount = float(budget.budget_amount)
        except Budget.DoesNotExist:
            budget_amount = 0.00
            
        total_expense = Expense.objects.filter(
            user=request.user,
            category=category,
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        remaining = budget_amount - float(total_expense)
        overspent = abs(remaining) if remaining < 0 else 0.00
        
        return Response({
            "budget_amount": budget_amount,
            "total_expense": float(total_expense),
            "remaining_budget": remaining,
            "overspent_amount": overspent
        })

    @action(detail=False, methods=['get'], url_path='alerts')
    def alerts(self, request):
        budgets = self.get_queryset()
        data = []
        for budget in budgets:
            # Calculate total spent for this budget's month and year
            import calendar
            from datetime import date
            b_start = date(budget.year, budget.month, 1)
            last_day = calendar.monthrange(budget.year, budget.month)[1]
            b_end = date(budget.year, budget.month, last_day)

            total_spent = Expense.objects.filter(
                user=request.user,
                category=budget.category,
                expense_date__gte=b_start,
                expense_date__lte=b_end
            ).aggregate(total=Sum('amount'))['total'] or 0.00
            
            total_spent = float(total_spent)
            budget_amount = float(budget.budget_amount)
            
            if budget_amount > 0:
                utilization = (total_spent / budget_amount) * 100
            else:
                utilization = 0.00
                
            category_name = budget.get_category_display()
            if utilization >= 100:
                alert_level = "Budget Exceeded Alert"
                alert_message = f"Budget Exceeded: Your {category_name} Budget has been exceeded."
            elif utilization >= 90:
                alert_level = "High Warning Alert"
                alert_message = f"High Alert: You have used 90% of your monthly {category_name} Budget."
            elif utilization >= 80:
                alert_level = "Warning Alert"
                alert_message = f"Warning: You have used 80% of your monthly {category_name} Budget."
            else:
                alert_level = "Normal"
                alert_message = ""
                
            data.append({
                "budget_category": category_name,
                "category": budget.category,
                "budget_amount": budget_amount,
                "total_expense": total_spent,
                "budget_utilization_percentage": utilization,
                "alert_level": alert_level,
                "alert_message": alert_message
            })
            
        return Response(data, status=status.HTTP_200_OK)


