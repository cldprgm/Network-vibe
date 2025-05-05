from django.contrib import admin
from mptt.admin import DraggableMPTTAdmin

from .models import Post, Media, Category, Comment, Rating, Community


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


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    pass


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name', )}


admin.site.register(Post, PostAdmin)
