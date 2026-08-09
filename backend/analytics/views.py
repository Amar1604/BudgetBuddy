from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import ExtractMonth, ExtractYear
from django.utils import timezone
import calendar

from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from savings.models import SavingsGoal
from notifications.models import Notification

from expenses.serializers import ExpenseSerializer
from income.serializers import IncomeSerializer
from savings.serializers import SavingsGoalSerializer
from notifications.serializers import NotificationSerializer


class FinancialSummaryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Total Income (all time)
        total_income = Income.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        total_income = float(total_income)

        # Total Expense (all time)
        total_expense = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = float(total_expense)

        # Current Balance = Total Income - Total Expense
        current_balance = total_income - total_expense

        # Total Savings (sum of saved_amount from all savings goals)
        total_savings = SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.00
        total_savings = float(total_savings)

        # Remaining Budget (defaults to current month/year)
        now = timezone.now()
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except ValueError:
            return Response(
                {"error": "month and year must be integers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_budget = Budget.objects.filter(user=user, month=month, year=year).aggregate(total=Sum('budget_amount'))['total'] or 0.00
        total_budget = float(total_budget)

        month_expense = Expense.objects.filter(
            user=user,
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        month_expense = float(month_expense)

        remaining_budget = total_budget - month_expense

        return Response({
            "total_income": total_income,
            "total_expense": total_expense,
            "current_balance": current_balance,
            "total_savings": total_savings,
            "remaining_budget": remaining_budget
        })


class CategoryExpenseAnalysisAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Optional filters
        month_param = request.query_params.get('month')
        year_param = request.query_params.get('year')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        expenses = Expense.objects.filter(user=user)

        if start_date and end_date:
            try:
                expenses = expenses.filter(expense_date__range=[start_date, end_date])
            except Exception:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
        elif month_param and year_param:
            try:
                month = int(month_param)
                year = int(year_param)
                expenses = expenses.filter(expense_date__year=year, expense_date__month=month)
            except ValueError:
                return Response({"error": "month and year must be integers"}, status=status.HTTP_400_BAD_REQUEST)

        total_spending = expenses.aggregate(total=Sum('amount'))['total'] or 0.00
        total_spending = float(total_spending)

        category_totals = {}
        for expense in expenses:
            category_totals[expense.category] = category_totals.get(expense.category, 0.0) + float(expense.amount)

        choices_dict = dict(Expense.EXPENSE_CATEGORIES)
        category_data = []

        for cat, amount in category_totals.items():
            percentage = (amount / total_spending * 100) if total_spending > 0 else 0.0
            category_data.append({
                "category": cat,
                "category_display": choices_dict.get(cat, cat.capitalize()),
                "total_amount": amount,
                "percentage": round(percentage, 2)
            })

        category_data.sort(key=lambda x: x['total_amount'], reverse=True)
        return Response(category_data)


class MonthlyExpenseTrendAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        year_param = request.query_params.get('year')
        expenses = Expense.objects.filter(user=user)

        if year_param:
            try:
                year = int(year_param)
                expenses = expenses.filter(expense_date__year=year)
            except ValueError:
                return Response({"error": "year must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        trends = expenses.annotate(
            m=ExtractMonth('expense_date'),
            y=ExtractYear('expense_date')
        ).values('m', 'y').annotate(
            total=Sum('amount')
        ).order_by('y', 'm')

        trend_data = []
        for item in trends:
            month_num = item['m']
            year_num = item['y']
            total_amount = float(item['total'] or 0.0)
            month_name = calendar.month_name[month_num] if 1 <= month_num <= 12 else ""
            trend_data.append({
                "month": month_num,
                "month_name": month_name,
                "year": year_num,
                "total_amount": total_amount
            })

        return Response(trend_data)


class ExpenseExtremesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        highest = Expense.objects.filter(user=user).order_by('-amount').first()
        lowest = Expense.objects.filter(user=user).order_by('amount').first()
        latest = Expense.objects.filter(user=user).order_by('-expense_date', '-id').first()
        oldest = Expense.objects.filter(user=user).order_by('expense_date', 'id').first()

        return Response({
            "highest_expense": ExpenseSerializer(highest).data if highest else None,
            "lowest_expense": ExpenseSerializer(lowest).data if lowest else None,
            "latest_expense": ExpenseSerializer(latest).data if latest else None,
            "oldest_expense": ExpenseSerializer(oldest).data if oldest else None
        })


class DashboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except ValueError:
            return Response(
                {"error": "month and year must be integers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Financial Summary
        total_income = Income.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        total_income = float(total_income)

        total_expense = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = float(total_expense)

        current_balance = total_income - total_expense

        total_savings = SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.00
        total_savings = float(total_savings)

        total_budget = Budget.objects.filter(user=user, month=month, year=year).aggregate(total=Sum('budget_amount'))['total'] or 0.00
        total_budget = float(total_budget)

        month_expense = Expense.objects.filter(
            user=user,
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        month_expense = float(month_expense)

        remaining_budget = total_budget - month_expense

        financial_summary = {
            "total_income": total_income,
            "total_expense": total_expense,
            "current_balance": current_balance,
            "total_savings": total_savings,
            "remaining_budget": remaining_budget,
            "total_budget": total_budget,
            "month_expense": month_expense
        }

        # 2. Category-wise Analysis (All time for pie chart default)
        all_expenses = Expense.objects.filter(user=user)
        category_totals = {}
        for expense in all_expenses:
            category_totals[expense.category] = category_totals.get(expense.category, 0.0) + float(expense.amount)

        choices_dict = dict(Expense.EXPENSE_CATEGORIES)
        category_analysis = []
        for cat, amount in category_totals.items():
            percentage = (amount / total_expense * 100) if total_expense > 0 else 0.0
            category_analysis.append({
                "category": cat,
                "category_display": choices_dict.get(cat, cat.capitalize()),
                "total_amount": amount,
                "percentage": round(percentage, 2)
            })
        category_analysis.sort(key=lambda x: x['total_amount'], reverse=True)

        # 3. Monthly Trend
        trends = all_expenses.annotate(
            m=ExtractMonth('expense_date'),
            y=ExtractYear('expense_date')
        ).values('m', 'y').annotate(
            total=Sum('amount')
        ).order_by('y', 'm')

        monthly_trend = []
        for item in trends:
            month_num = item['m']
            year_num = item['y']
            total_amount = float(item['total'] or 0.0)
            month_name = calendar.month_name[month_num] if 1 <= month_num <= 12 else ""
            monthly_trend.append({
                "month": month_num,
                "month_name": month_name,
                "year": year_num,
                "total_amount": total_amount
            })

        # 4. Recent Transactions (latest 10 combined)
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
                "category_display": inc.get_source_display(),
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
                "category_display": exp.get_category_display(),
                "date": exp.expense_date.strftime('%Y-%m-%d'),
                "created_at": exp.created_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            })
        transactions.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
        recent_transactions = transactions[:10]

        # 5. Latest Notifications
        latest_notifications = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        serialized_notifications = NotificationSerializer(latest_notifications, many=True).data

        # 6. Active Savings Goals
        active_goals = SavingsGoal.objects.filter(user=user, status='IN_PROGRESS').order_by('target_date')
        serialized_savings_goals = SavingsGoalSerializer(active_goals, many=True).data

        # 7. Budget Usage for progress bars
        budgets = Budget.objects.filter(user=user, month=month, year=year)
        budget_usage = []
        for b in budgets:
            spent = Expense.objects.filter(
                user=user, 
                category=b.category, 
                expense_date__year=year, 
                expense_date__month=month
            ).aggregate(total=Sum('amount'))['total'] or 0.00
            spent = float(spent)
            pct = (spent / float(b.budget_amount) * 100) if b.budget_amount > 0 else 0.0
            budget_usage.append({
                "id": b.id,
                "category": b.category,
                "category_display": b.get_category_display(),
                "amount": float(b.budget_amount),
                "spent": spent,
                "pct": round(pct, 2),
                "month": b.month,
                "year": b.year
            })

        return Response({
            "financial_summary": financial_summary,
            "category_analysis": category_analysis,
            "monthly_trend": monthly_trend,
            "recent_transactions": recent_transactions,
            "latest_notifications": serialized_notifications,
            "active_savings_goals": serialized_savings_goals,
            "budget_usage": budget_usage
        })
