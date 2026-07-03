from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'report_type', 'date_range_start', 'date_range_end', 'generated_at')
    list_filter = ('report_type', 'generated_at')
    search_fields = ('user__username', 'title')
    ordering = ('-generated_at',)
    readonly_fields = ('generated_at',)
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Report Details', {'fields': ('title', 'report_type')}),
        ('Date Range', {'fields': ('date_range_start', 'date_range_end')}),
        ('Data', {'fields': ('data',)}),
        ('Timestamps', {'fields': ('generated_at',), 'classes': ('collapse',)}),
    )
