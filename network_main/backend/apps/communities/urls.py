from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

from .views import CommunityViewSet, MembershipViewSet

router = DefaultRouter()
router.register(r'', CommunityViewSet, basename='community')
router.register(r'(?P<community_pk>\d+)/memberships',
                MembershipViewSet, basename='community-members')


urlpatterns = [
    path('', include(router.urls)),
]
