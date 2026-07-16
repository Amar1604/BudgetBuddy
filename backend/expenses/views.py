from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Expense.objects.filter(user=self.request.user)
        
        # Category filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        # Dynamic Sorting
        sort = self.request.query_params.get('sort')
        if sort == 'latest':
            queryset = queryset.order_by('-expense_date', '-id')
        elif sort == 'oldest':
            queryset = queryset.order_by('expense_date', 'id')
        elif sort == 'highest':
            queryset = queryset.order_by('-amount')
        elif sort == 'lowest':
            queryset = queryset.order_by('amount')
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def total(self, request):
        # We compute total for all expenses of the user (or filtered by category if they filter)
        qs = self.get_queryset()
        total_val = qs.aggregate(total=Sum('amount'))['total'] or 0.00
        return Response({"total_expenses": float(total_val)})
