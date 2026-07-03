from rest_framework import serializers
from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    period_display = serializers.CharField(source='get_period_display', read_only=True)

    class Meta:
        model = Budget
        fields = ('id', 'category', 'category_display', 'amount', 'period', 'period_display', 'start_date', 'end_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
