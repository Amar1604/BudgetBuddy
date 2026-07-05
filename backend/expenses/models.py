from django.db import models
from django.conf import settings


class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('housing', 'Housing'),
        ('food', 'Food & Dining'),
        ('transport', 'Transportation'),
        ('utilities', 'Utilities'),
        ('healthcare', 'Healthcare'),
        ('entertainment', 'Entertainment'),
        ('shopping', 'Shopping'),
        ('education', 'Education'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    merchant = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.category}: ${self.amount}"
