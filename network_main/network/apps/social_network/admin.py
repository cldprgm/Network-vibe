from django.contrib import admin
from mptt.admin import DraggableMPTTAdmin

from .models import Post, Media, Category, Comment


class MediaInLine(admin.TabularInline):
    model = Media
    extra = 1


class PostAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title', )}
    inlines = (MediaInLine, )


@admin.register(Category)
class CategoryAdmin(DraggableMPTTAdmin):
    prepopulated_fields = {'slug': ('title', )}


@admin.register(Comment)
class CommentAdminPage(DraggableMPTTAdmin):
    pass


admin.site.register(Post, PostAdmin)
