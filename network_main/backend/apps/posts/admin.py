from django.contrib import admin

from .models import Post, Media, Comment


class MediaInLine(admin.TabularInline):
    model = Media
    extra = 1


@admin.register(Post)
class ApiPostAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    inlines = (MediaInLine, )


@admin.register(Comment)
class ApiPostAdmin(admin.ModelAdmin):
    pass
