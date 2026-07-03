from rest_framework import serializers
from .models import Income


class IncomeSerializer(serializers.ModelSerializer):
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = Income
        fields = ('id', 'amount', 'source', 'source_display', 'description', 'date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
