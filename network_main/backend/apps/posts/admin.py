from django.contrib import admin

from .models import Post


@admin.register(Post)
class ApiPostAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
