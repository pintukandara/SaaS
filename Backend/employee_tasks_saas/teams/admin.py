from django.contrib import admin


from teams.models import Team, TeamMember,Department


from django.contrib import admin
from .models import Department, Team, TeamMember

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'manager', 'created_at']
    list_filter = ['department']
    search_fields = ['name']

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'team', 'role', 'joined_at']
    list_filter = ['team', 'role']
