from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)

    class Meta:
        model = Report
        fields = ('id', 'title', 'report_type', 'report_type_display', 'date_range_start', 'date_range_end', 'data', 'generated_at')
        read_only_fields = ('id', 'generated_at')
