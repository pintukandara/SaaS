from django.contrib import admin
from .models import (
    SubscriptionPlan, Organisation, Subscription,
    OrganisationMember, UsageTracking, Invoice
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'price', 'billing_period', 'max_users', 'is_active']
    list_filter = ['is_active', 'billing_period']


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email', 'owner__username']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['organisation', 'plan', 'status', 'start_date', 'end_date', 'is_trial']
    list_filter = ['status', 'is_trial', 'plan']
    search_fields = ['organisation__name']


@admin.register(OrganisationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'organisation', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active']
    search_fields = ['user__username', 'organization__name']


@admin.register(UsageTracking)
class UsageTrackingAdmin(admin.ModelAdmin):
    list_display = ['organisation', 'year', 'month', 'tasks_created', 'storage_used_mb']
    list_filter = ['year', 'month']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'organisation', 'total_amount', 'status', 'due_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'organisation__name']