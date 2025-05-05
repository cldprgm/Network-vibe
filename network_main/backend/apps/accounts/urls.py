from django.urls import path
from .views import ProfileDetailView, ProfileUpdateView, UserRegisterView, UserLoginView, UserLogoutView

urlpatterns = [
    path('user/edit/', ProfileUpdateView.as_view(), name='profile_update'),
    path('user/<str:slug>/', ProfileDetailView.as_view(), name='profile_detail'),
    path('register/', UserRegisterView.as_view(), name='user_register'),
    path('login/', UserLoginView.as_view(), name='user_login'),
    path('logout/', UserLogoutView.as_view(), name='user_logout'),
]
