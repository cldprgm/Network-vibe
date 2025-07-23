from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

from .views import CommunityViewSet, MembershipViewSet, CommunityPostsListView, CommunityNameCheck

router = DefaultRouter()
router.register(r'', CommunityViewSet, basename='community')
router.register(r'(?P<community_pk>\d+)/memberships',
                MembershipViewSet, basename='community-members')
router.register(r'(?P<community_slug>[-\w]+)/posts',
                CommunityPostsListView, basename='community-posts')


urlpatterns = [
    path('check-community-name/', CommunityNameCheck.as_view(),
         name='check-community-name'),
    path('', include(router.urls)),
]
