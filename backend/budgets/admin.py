from django.contrib import admin
from .models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'budget_amount', 'month', 'year')
    list_filter = ('category', 'month', 'year')
    search_fields = ('user__username',)
    ordering = ('-year', '-month')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Budget Details', {'fields': ('category', 'budget_amount')}),
        ('Time Period', {'fields': ('month', 'year')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
