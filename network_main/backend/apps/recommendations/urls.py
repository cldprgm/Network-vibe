from django.urls import path

from .views import CommunityRecommendationView

urlpatterns = [
    path('communities/', CommunityRecommendationView.as_view(),
         name='community-recommendations'),
]
