from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'amount', 'date', 'merchant', 'created_at')
    list_filter = ('category', 'date', 'created_at')
    search_fields = ('user__username', 'description', 'merchant')
    ordering = ('-date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Expense Details', {'fields': ('category', 'amount', 'description', 'date', 'merchant')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
