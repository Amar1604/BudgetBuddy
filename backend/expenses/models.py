from django.db import models
from django.conf import settings


class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('FOOD', 'Food'),
        ('TRAVEL', 'Travel'),
        ('SHOPPING', 'Shopping'),
        ('EDUCATION', 'Education'),
        ('ENTERTAINMENT', 'Entertainment'),
        ('HEALTHCARE', 'Healthcare'),
        ('BILLS', 'Bills'),
        ('MISCELLANEOUS', 'Miscellaneous'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    description = models.TextField(blank=True, null=True)
    expense_date = models.DateField()
    merchant = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def date(self):
        return self.expense_date

    @date.setter
    def date(self, value):
        self.expense_date = value

    class Meta:
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.user.username} - {self.category}: ${self.amount}"
