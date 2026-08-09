from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportViewSet,
    MonthlyFinancialReportView,
    ExpenseReportView,
    SavingsReportView,
    CombinedSummaryReportView
)

router = DefaultRouter()
router.register(r'', ReportViewSet, basename='report')

urlpatterns = [
    path('monthly-financial/', MonthlyFinancialReportView.as_view(), name='monthly-financial-report'),
    path('expenses/', ExpenseReportView.as_view(), name='expense-report'),
    path('savings/', SavingsReportView.as_view(), name='savings-report'),
    path('combined-summary/', CombinedSummaryReportView.as_view(), name='combined-summary-report'),
    path('', include(router.urls)),
]
