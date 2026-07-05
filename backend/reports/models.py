from django.db import models
from django.conf import settings


class Report(models.Model):
    REPORT_TYPES = [
        ('income_summary', 'Income Summary'),
        ('expense_summary', 'Expense Summary'),
        ('budget_vs_actual', 'Budget vs Actual'),
        ('net_worth', 'Net Worth'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    date_range_start = models.DateField()
    date_range_end = models.DateField()
    data = models.JSONField(blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
