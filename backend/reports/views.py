from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
import datetime
import csv
import calendar
from django.http import HttpResponse

from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from savings.models import SavingsGoal
from notifications.models import Notification
from .models import Report
from .serializers import ReportSerializer


def generate_report_data(user, report_type, start_date, end_date):
    if report_type == 'income_summary':
        incomes = Income.objects.filter(user=user, income_date__range=(start_date, end_date))
        total_income = incomes.aggregate(total=Sum('amount'))['total'] or 0.0
        
        grouped = {}
        for source, label in Income.INCOME_SOURCES:
            amount = incomes.filter(source=source).aggregate(total=Sum('amount'))['total'] or 0.0
            if amount > 0:
                grouped[source] = float(amount)
                
        return {
            "total_income": float(total_income),
            "by_source": grouped,
            "count": incomes.count()
        }
        
    elif report_type == 'expense_summary':
        expenses = Expense.objects.filter(user=user, expense_date__range=(start_date, end_date))
        total_expense = expenses.aggregate(total=Sum('amount'))['total'] or 0.0
        
        grouped = {}
        for cat, label in Expense.EXPENSE_CATEGORIES:
            amount = expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or 0.0
            if amount > 0:
                grouped[cat] = float(amount)
                
        return {
            "total_expense": float(total_expense),
            "by_category": grouped,
            "count": expenses.count()
        }
        
    elif report_type == 'budget_vs_actual':
        expenses = Expense.objects.filter(user=user, expense_date__range=(start_date, end_date))
        
        # Find all months between start_date and end_date
        months_years = set()
        import calendar
        curr = start_date.replace(day=1)
        while curr <= end_date:
            months_years.add((curr.month, curr.year))
            if curr.month == 12:
                curr = curr.replace(year=curr.year + 1, month=1)
            else:
                curr = curr.replace(month=curr.month + 1)
                
        category_budgets = {}
        for m, y in months_years:
            buds = Budget.objects.filter(user=user, month=m, year=y)
            for b in buds:
                category_budgets[b.category] = category_budgets.get(b.category, 0.0) + float(b.budget_amount)
                
        category_expenses = {}
        for cat, label in Expense.EXPENSE_CATEGORIES:
            amount = expenses.filter(category=cat).aggregate(total=Sum('amount'))['total'] or 0.0
            if amount > 0 or cat in category_budgets:
                category_expenses[cat] = float(amount)
                
        comparisons = {}
        all_cats = set(list(category_budgets.keys()) + list(category_expenses.keys()))
        for cat in all_cats:
            b_val = category_budgets.get(cat, 0.0)
            a_val = category_expenses.get(cat, 0.0)
            comparisons[cat] = {
                "budget": b_val,
                "actual": a_val,
                "variance": b_val - a_val
            }
            
        return {
            "categories": comparisons,
            "total_budget": sum(category_budgets.values()),
            "total_actual": sum(category_expenses.values())
        }
        
    elif report_type == 'net_worth' or report_type == 'custom':
        incomes = Income.objects.filter(user=user, income_date__range=(start_date, end_date))
        expenses = Expense.objects.filter(user=user, expense_date__range=(start_date, end_date))
        total_income = incomes.aggregate(total=Sum('amount'))['total'] or 0.0
        total_expense = expenses.aggregate(total=Sum('amount'))['total'] or 0.0
        
        return {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "net_savings": float(total_income) - float(total_expense)
        }
        
    return {}


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        validated_data = serializer.validated_data
        report_type = validated_data.get('report_type')
        start_date = validated_data.get('date_range_start')
        end_date = validated_data.get('date_range_end')
        
        calculated_data = generate_report_data(user, report_type, start_date, end_date)
        serializer.save(user=user, data=calculated_data)


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


def get_date_range(filter_type, start_date_str=None, end_date_str=None):
    from datetime import date
    import calendar
    today = timezone.localdate()
    
    if filter_type == 'current_month':
        start_date = date(today.year, today.month, 1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_date = date(today.year, today.month, last_day)
    elif filter_type == 'previous_month':
        if today.month == 1:
            prev_month = 12
            prev_year = today.year - 1
        else:
            prev_month = today.month - 1
            prev_year = today.year
        start_date = date(prev_year, prev_month, 1)
        last_day = calendar.monthrange(prev_year, prev_month)[1]
        end_date = date(prev_year, prev_month, last_day)
    elif filter_type == 'custom':
        try:
            start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else date(2000, 1, 1)
            end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else date(2100, 12, 31)
        except (ValueError, TypeError):
            start_date = date(today.year, today.month, 1)
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = date(today.year, today.month, last_day)
    else:
        start_date = date(today.year, today.month, 1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_date = date(today.year, today.month, last_day)
        
    return start_date, end_date


class MonthlyFinancialReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.localdate()
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except ValueError:
            return Response({"error": "month and year must be integers"}, status=status.HTTP_400_BAD_REQUEST)

        # Monthly Income
        total_income = Income.objects.filter(
            user=user,
            income_date__year=year,
            income_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        total_income = float(total_income)

        # Monthly Expense
        total_expense = Expense.objects.filter(
            user=user,
            expense_date__year=year,
            expense_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = float(total_expense)

        current_balance = total_income - total_expense

        total_savings = SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.00
        total_savings = float(total_savings)

        total_budget = Budget.objects.filter(user=user, month=month, year=year).aggregate(total=Sum('budget_amount'))['total'] or 0.00
        total_budget = float(total_budget)
        
        remaining_budget = total_budget - total_expense

        return Response({
            "month": month,
            "year": year,
            "total_income": total_income,
            "total_expense": total_expense,
            "current_balance": current_balance,
            "total_savings": total_savings,
            "remaining_budget": remaining_budget
        })


class ExpenseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        filter_type = request.query_params.get('filter_type', 'current_month')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date, end_date = get_date_range(filter_type, start_date_str, end_date_str)
        expenses = Expense.objects.filter(user=user, expense_date__range=[start_date, end_date]).order_by('-expense_date')

        if request.query_params.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="expense_report_{start_date}_{end_date}.csv"'
            writer = csv.writer(response)
            writer.writerow(['Expense Title', 'Category', 'Amount', 'Date', 'Description'])
            for exp in expenses:
                writer.writerow([
                    exp.title,
                    exp.get_category_display(),
                    float(exp.amount),
                    exp.expense_date.strftime('%Y-%m-%d'),
                    exp.description or ''
                ])
            return response

        data = []
        for exp in expenses:
            data.append({
                "title": exp.title,
                "category": exp.get_category_display(),
                "amount": float(exp.amount),
                "date": exp.expense_date.strftime('%Y-%m-%d'),
                "description": exp.description or ''
            })
        return Response(data)


class SavingsReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        goals = SavingsGoal.objects.filter(user=user).order_by('target_date')

        data = []
        for g in goals:
            remaining = max(float(g.target_amount - g.saved_amount), 0.0)
            pct = (float(g.saved_amount) / float(g.target_amount) * 100) if g.target_amount > 0 else 0.0
            data.append({
                "goal_name": g.goal_name,
                "target_amount": float(g.target_amount),
                "saved_amount": float(g.saved_amount),
                "remaining_amount": remaining,
                "progress_percentage": round(pct, 2),
                "status": g.get_status_display()
            })
        return Response(data)


class CombinedSummaryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        filter_type = request.query_params.get('filter_type', 'current_month')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date, end_date = get_date_range(filter_type, start_date_str, end_date_str)

        incomes = Income.objects.filter(user=user, income_date__range=[start_date, end_date]).order_by('-income_date')
        expenses = Expense.objects.filter(user=user, expense_date__range=[start_date, end_date]).order_by('-expense_date')

        total_income = float(incomes.aggregate(total=Sum('amount'))['total'] or 0.00)
        total_expense = float(expenses.aggregate(total=Sum('amount'))['total'] or 0.00)
        current_balance = total_income - total_expense

        total_savings = float(SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.00)

        months_years = set()
        curr = start_date.replace(day=1)
        while curr <= end_date:
            months_years.add((curr.month, curr.year))
            if curr.month == 12:
                curr = curr.replace(year=curr.year + 1, month=1)
            else:
                curr = curr.replace(month=curr.month + 1)

        total_budget = 0.0
        budget_details = []
        for m, y in months_years:
            buds = Budget.objects.filter(user=user, month=m, year=y)
            for b in buds:
                b_amount = float(b.budget_amount)
                total_budget += b_amount
                spent = float(Expense.objects.filter(
                    user=user,
                    category=b.category,
                    expense_date__year=y,
                    expense_date__month=m
                ).aggregate(total=Sum('amount'))['total'] or 0.00)
                budget_details.append({
                    "category": b.get_category_display(),
                    "month": b.month,
                    "year": b.year,
                    "budget_amount": b_amount,
                    "actual_spent": spent,
                    "remaining": b_amount - spent
                })

        remaining_budget = total_budget - total_expense

        financial_summary = {
            "total_income": total_income,
            "total_expense": total_expense,
            "current_balance": current_balance,
            "total_savings": total_savings,
            "remaining_budget": remaining_budget,
            "total_budget": total_budget
        }

        choices_dict_exp = dict(Expense.EXPENSE_CATEGORIES)
        category_totals = {}
        for exp in expenses:
            category_totals[exp.category] = category_totals.get(exp.category, 0.0) + float(exp.amount)

        expense_summary_grouped = []
        for cat, amt in category_totals.items():
            pct = (amt / total_expense * 100) if total_expense > 0 else 0.0
            expense_summary_grouped.append({
                "category": choices_dict_exp.get(cat, cat.capitalize()),
                "total_amount": amt,
                "percentage": round(pct, 2)
            })
        expense_summary_grouped.sort(key=lambda x: x['total_amount'], reverse=True)

        choices_dict_inc = dict(Income.INCOME_SOURCES)
        source_totals = {}
        for inc in incomes:
            source_totals[inc.source] = source_totals.get(inc.source, 0.0) + float(inc.amount)

        income_summary_grouped = []
        for src, amt in source_totals.items():
            pct = (amt / total_income * 100) if total_income > 0 else 0.0
            income_summary_grouped.append({
                "source": choices_dict_inc.get(src, src.capitalize()),
                "total_amount": amt,
                "percentage": round(pct, 2)
            })
        income_summary_grouped.sort(key=lambda x: x['total_amount'], reverse=True)

        savings_goals = []
        goals = SavingsGoal.objects.filter(user=user).order_by('target_date')
        for g in goals:
            remaining = max(float(g.target_amount - g.saved_amount), 0.0)
            pct = (float(g.saved_amount) / float(g.target_amount) * 100) if g.target_amount > 0 else 0.0
            savings_goals.append({
                "goal_name": g.goal_name,
                "target_amount": float(g.target_amount),
                "saved_amount": float(g.saved_amount),
                "remaining_amount": remaining,
                "progress_percentage": round(pct, 2),
                "status": g.get_status_display()
            })

        notifications = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        notification_list = []
        for n in notifications:
            notification_list.append({
                "title": n.title,
                "message": n.message,
                "type": n.get_notification_type_display(),
                "priority": n.get_priority_display(),
                "is_read": n.is_read,
                "created_at": n.created_at.strftime('%Y-%m-%d %H:%M')
            })

        if request.query_params.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="financial_summary_report_{start_date}_{end_date}.csv"'
            writer = csv.writer(response)
            
            writer.writerow(['--- FINANCIAL SUMMARY REPORT ---'])
            writer.writerow(['Date Range', f'{start_date} to {end_date}'])
            writer.writerow([])
            writer.writerow(['Metric', 'Amount'])
            writer.writerow(['Total Income', total_income])
            writer.writerow(['Total Expense', total_expense])
            writer.writerow(['Net Balance', current_balance])
            writer.writerow(['Total Savings (All Time)', total_savings])
            writer.writerow(['Remaining Budget', remaining_budget])
            writer.writerow([])

            writer.writerow(['--- EXPENSE BY CATEGORY ---'])
            writer.writerow(['Category', 'Total Amount', 'Percentage'])
            for item in expense_summary_grouped:
                writer.writerow([item['category'], item['total_amount'], f"{item['percentage']}%"])
            writer.writerow([])

            writer.writerow(['--- INCOME BY SOURCE ---'])
            writer.writerow(['Source', 'Total Amount', 'Percentage'])
            for item in income_summary_grouped:
                writer.writerow([item['source'], item['total_amount'], f"{item['percentage']}%"])
            writer.writerow([])

            writer.writerow(['--- BUDGET VS ACTUAL ---'])
            writer.writerow(['Category', 'Month/Year', 'Budget Amount', 'Actual Spent', 'Remaining'])
            for b in budget_details:
                writer.writerow([b['category'], f"{b['month']}/{b['year']}", b['budget_amount'], b['actual_spent'], b['remaining']])
            writer.writerow([])

            writer.writerow(['--- SAVINGS GOALS ---'])
            writer.writerow(['Goal Name', 'Target Amount', 'Saved Amount', 'Remaining', 'Progress', 'Status'])
            for s in savings_goals:
                writer.writerow([s['goal_name'], s['target_amount'], s['saved_amount'], s['remaining_amount'], f"{s['progress_percentage']}%", s['status']])
            
            return response

        return Response({
            "date_range": {
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d')
            },
            "financial_summary": financial_summary,
            "expense_summary": expense_summary_grouped,
            "income_summary": income_summary_grouped,
            "budget_summary": budget_details,
            "savings_summary": savings_goals,
            "latest_notifications": notification_list
        })


