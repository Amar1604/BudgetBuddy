from django.contrib import admin
from .models import SavingsGoal


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'current_amount', 'target_amount', 'deadline', 'is_completed')
    list_filter = ('is_completed', 'deadline', 'created_at')
    search_fields = ('user__username', 'name')
    ordering = ('deadline',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Goal Details', {'fields': ('name', 'description')}),
        ('Progress', {'fields': ('target_amount', 'current_amount', 'is_completed')}),
        ('Timeline', {'fields': ('deadline',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
