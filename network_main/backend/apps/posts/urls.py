from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

from .views import PostViewSet, CommentViewSet, CommentRepliesViewSet


router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')
router.register(r'(?P<slug>[^/.]+)/comments',
                CommentViewSet, basename='post-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('<slug:slug>/comments/<int:pk>/replies/',
         CommentRepliesViewSet.as_view({'get': 'list'}),
         name='post-comment-replies'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
