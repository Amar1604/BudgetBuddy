from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'category', 'amount', 'expense_date', 'created_at')
    list_filter = ('category', 'expense_date', 'created_at')
    search_fields = ('user__username', 'title', 'description', 'merchant')
    ordering = ('-expense_date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Expense Details', {'fields': ('title', 'category', 'amount', 'description', 'expense_date', 'merchant')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
