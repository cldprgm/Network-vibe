from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

from .views import CommunityViewSet, MembershipViewSet

router = DefaultRouter()
router.register(r'', CommunityViewSet, basename='community')

urlpatterns = [
    path('', include(router.urls)),
    path('<slug:slug>/memberships/',
         MembershipViewSet.as_view({'post': 'create', 'delete': 'destroy'}),
         name='membership'),
]
