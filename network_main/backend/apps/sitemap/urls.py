from django.urls import path

from .views import PostSitemapView, CommunitySitemapView

urlpatterns = [
    path('posts/', PostSitemapView.as_view(), name='sitemap-post'),
    path('communities/', CommunitySitemapView.as_view(), name='sitemap-community'),
]
