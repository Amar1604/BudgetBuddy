from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = ('id', 'amount', 'category', 'category_display', 'description', 'date', 'merchant', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
