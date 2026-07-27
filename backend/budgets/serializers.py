from rest_framework import serializers
from .models import Budget
import datetime
import calendar


class BudgetSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    # Define fields explicitly or make them read_only=False
    budget_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    month = serializers.IntegerField(required=False)
    year = serializers.IntegerField(required=False)
    
    # Backward-compatible fields
    amount = serializers.DecimalField(source='budget_amount', max_digits=12, decimal_places=2, required=False)
    period = serializers.CharField(default='monthly', read_only=True)
    period_display = serializers.CharField(default='Monthly', read_only=True)
    start_date = serializers.DateField(required=False, read_only=True)
    end_date = serializers.DateField(required=False, read_only=True)

    class Meta:
        model = Budget
        fields = (
            'id', 'category', 'category_display', 'budget_amount', 'amount',
            'month', 'year', 'period', 'period_display', 'start_date', 'end_date',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def to_internal_value(self, data):
        # Make a mutable copy of data
        data_copy = {}
        for k, v in data.items():
            data_copy[k] = v
            
        # Map amount to budget_amount if needed
        if 'amount' in data_copy and 'budget_amount' not in data_copy:
            data_copy['budget_amount'] = data_copy['amount']
            
        # Extract month and year from start_date if needed
        if 'start_date' in data_copy and data_copy['start_date']:
            try:
                dt = datetime.datetime.strptime(str(data_copy['start_date']), '%Y-%m-%d')
                if 'month' not in data_copy:
                    data_copy['month'] = dt.month
                if 'year' not in data_copy:
                    data_copy['year'] = dt.year
            except ValueError:
                pass

        # If month and year are still missing, use current date
        now = datetime.datetime.now()
        if 'month' not in data_copy or not data_copy['month']:
            data_copy['month'] = now.month
        if 'year' not in data_copy or not data_copy['year']:
            data_copy['year'] = now.year

        # Parse integer values for month and year
        try:
            data_copy['month'] = int(data_copy['month'])
            data_copy['year'] = int(data_copy['year'])
        except (ValueError, TypeError):
            pass

        return super().to_internal_value(data_copy)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure budget_amount and amount are floats/decimals
        ret['budget_amount'] = float(instance.budget_amount)
        ret['amount'] = float(instance.budget_amount)
        ret['period'] = 'monthly'
        ret['period_display'] = 'Monthly'
        
        # compute start_date and end_date
        s_date = datetime.date(instance.year, instance.month, 1)
        ret['start_date'] = s_date.strftime('%Y-%m-%d')
        
        _, last_day = calendar.monthrange(instance.year, instance.month)
        e_date = datetime.date(instance.year, instance.month, last_day)
        ret['end_date'] = e_date.strftime('%Y-%m-%d')
        
        return ret

    def validate(self, attrs):
        user = self.context['request'].user
        category = attrs.get('category')
        month = attrs.get('month')
        year = attrs.get('year')

        # Run checks for duplicates
        qs = Budget.objects.filter(user=user, category=category, month=month, year=year)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
            
        if qs.exists():
            raise serializers.ValidationError("A budget for this category and month already exists.")
            
        return attrs

