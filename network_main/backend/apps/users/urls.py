from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import CustomUserView, UserRegistrationView, LogoutView, LoginView,  \
    CookieTokenRefreshView


urlpatterns = [
    path('user-info/', CustomUserView.as_view(), name='user-info'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='refresh'),

]
