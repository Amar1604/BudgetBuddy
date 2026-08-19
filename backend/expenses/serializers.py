import datetime
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    date = serializers.DateField(required=False)
    expense_date = serializers.DateField(required=False)

    class Meta:
        model = Expense
        fields = ('id', 'title', 'amount', 'category', 'category_display', 'description', 'date', 'expense_date', 'merchant', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        date_val = attrs.get('date')
        expense_date_val = attrs.get('expense_date')

        if not date_val and not expense_date_val:
            raise serializers.ValidationError({
                "expense_date": "This field or 'date' is required."
            })
        
        if not expense_date_val:
            attrs['expense_date'] = date_val
            expense_date_val = date_val
        
        # Pop 'date' if it is a property to prevent model save issues
        attrs.pop('date', None)

        # Validate amount must be greater than zero
        amount = attrs.get('amount')
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({
                "amount": "Expense amount must be greater than zero."
            })

        # Validate expense_date is not in the future
        if expense_date_val and expense_date_val > datetime.date.today():
            raise serializers.ValidationError({
                "expense_date": "Expense date cannot be in the future."
            })

        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['date'] = instance.expense_date
        ret['expense_date'] = instance.expense_date
        return ret

