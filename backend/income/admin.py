from django.contrib import admin
from .models import Income


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'source', 'amount', 'income_date', 'created_at')
    list_filter = ('source', 'income_date', 'created_at')
    search_fields = ('user__username', 'title', 'description')
    ordering = ('-income_date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Income Details', {'fields': ('title', 'source', 'amount', 'description', 'income_date')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
