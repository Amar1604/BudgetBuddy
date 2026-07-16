from rest_framework import serializers
from .models import Income


class IncomeSerializer(serializers.ModelSerializer):
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    date = serializers.DateField(required=False)
    income_date = serializers.DateField(required=False)

    class Meta:
        model = Income
        fields = ('id', 'title', 'amount', 'source', 'source_display', 'description', 'date', 'income_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        date_val = attrs.get('date')
        income_date_val = attrs.get('income_date')

        if not date_val and not income_date_val:
            raise serializers.ValidationError({
                "income_date": "This field or 'date' is required."
            })
        
        if not income_date_val:
            attrs['income_date'] = date_val
        
        attrs.pop('date', None)
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['date'] = instance.income_date
        ret['income_date'] = instance.income_date
        return ret
