from django.contrib import admin
from .models import CustomUser


# Register your models here.
admin.site.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'phone', 'avatar')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('role',)
    list_per_page = 10
    list_editable = ('role', 'phone', 'avatar')
    list_display_links = ('username', 'email')
    list_max_show_all = 100
    list_max_show_all = 100