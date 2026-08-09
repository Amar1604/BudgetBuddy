import datetime
from rest_framework import serializers
from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = (
            'id', 'goal_name', 'target_amount', 'saved_amount', 'target_date',
            'status', 'remaining_amount', 'progress_percentage', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_remaining_amount(self, obj):
        val = obj.target_amount - obj.saved_amount
        return max(float(val), 0.0)

    def get_progress_percentage(self, obj):
        if obj.target_amount <= 0:
            return 0.0
        pct = (obj.saved_amount / obj.target_amount) * 100
        return round(float(pct), 2)

    def validate(self, data):
        target_amount = data.get('target_amount', self.instance.target_amount if self.instance else None)
        saved_amount = data.get('saved_amount', self.instance.saved_amount if self.instance else 0)
        target_date = data.get('target_date', self.instance.target_date if self.instance else None)

        if target_amount is not None and target_amount <= 0:
            raise serializers.ValidationError({"target_amount": "Target amount must be greater than zero."})

        if saved_amount is not None and saved_amount < 0:
            raise serializers.ValidationError({"saved_amount": "Saved amount cannot be negative."})

        if self.instance is None:  # Creation mode
            if target_date and target_date < datetime.date.today():
                raise serializers.ValidationError({"target_date": "Target date cannot be in the past."})

        return data
