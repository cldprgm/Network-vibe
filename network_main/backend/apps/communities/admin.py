from django.contrib import admin

from mptt.admin import DraggableMPTTAdmin

from .models import Community, Category


@admin.register(Community)
class ApiCommunityAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Category)
class ApiCategoryAdmin(DraggableMPTTAdmin):
    prepopulated_fields = {'slug': ('title',)}
