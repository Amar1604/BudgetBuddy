from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from expenses.models import Expense
from .models import Income
from .serializers import IncomeSerializer


class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_income = self.get_queryset().aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = Expense.objects.filter(user=request.user).aggregate(total=Sum('amount'))['total'] or 0.00
        balance = float(total_income) - float(total_expense)
        return Response({
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "current_balance": balance
        })
