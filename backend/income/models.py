from django.db import models
from django.conf import settings


class Income(models.Model):
    INCOME_SOURCES = [
        ('SALARY', 'Salary'),
        ('POCKET_MONEY', 'Pocket Money'),
        ('SCHOLARSHIP', 'Scholarship'),
        ('FREELANCING', 'Freelancing'),
        ('BUSINESS', 'Business'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='incomes')
    title = models.CharField(max_length=200, default="Income Log")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=50, choices=INCOME_SOURCES)
    description = models.TextField(blank=True, null=True)
    income_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-income_date']

    def __str__(self):
        return f"{self.user.username} - {self.source}: ${self.amount}"
