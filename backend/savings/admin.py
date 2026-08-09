from django.contrib import admin
from .models import SavingsGoal


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'goal_name', 'saved_amount', 'target_amount', 'target_date', 'status')
    list_filter = ('status', 'target_date', 'created_at')
    search_fields = ('user__username', 'goal_name')
    ordering = ('target_date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Goal Details', {'fields': ('goal_name',)}),
        ('Progress', {'fields': ('target_amount', 'saved_amount', 'status')}),
        ('Timeline', {'fields': ('target_date',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
