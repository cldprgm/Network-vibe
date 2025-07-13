from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, CategoryCommunityListView

router = DefaultRouter()
router.register(r'', CategoryViewSet, basename='category')

urlpatterns = [
    path('subcategories/<int:subcategory_id>/communities/',
         CategoryCommunityListView.as_view(), name='subcategory-communities'),
    path('', include(router.urls)),
]
