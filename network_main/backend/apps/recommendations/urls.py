from django.urls import path

from .views import CommunityRecommendationView, PostRecommendationView

urlpatterns = [
    path('posts/', PostRecommendationView.as_view(),
         name='post-recommendations'),
    path('communities/', CommunityRecommendationView.as_view(),
         name='community-recommendations'),
]
