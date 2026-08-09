from django.urls import path
from .views import (
    FinancialSummaryAPIView,
    CategoryExpenseAnalysisAPIView,
    MonthlyExpenseTrendAPIView,
    ExpenseExtremesAPIView,
    DashboardAPIView
)

urlpatterns = [
    path('financial-summary/', FinancialSummaryAPIView.as_view(), name='financial-summary'),
    path('category-expenses/', CategoryExpenseAnalysisAPIView.as_view(), name='category-expenses'),
    path('monthly-trends/', MonthlyExpenseTrendAPIView.as_view(), name='monthly-trends'),
    path('expense-extremes/', ExpenseExtremesAPIView.as_view(), name='expense-extremes'),
    path('dashboard/', DashboardAPIView.as_view(), name='analytics-dashboard'),
]
