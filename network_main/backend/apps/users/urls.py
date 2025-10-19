from django.urls import path

from .views import (
    CustomUserView,
    CustomUserInfoView,
    UserRegistrationView,
    LogoutView,
    LoginView,
    VerifyCodeView,
    ResendVerificationView,
    CookieTokenRefreshView
)


urlpatterns = [
    path('user-info/', CustomUserInfoView.as_view(), name='user-info'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='refresh'),
    path('verify/', VerifyCodeView.as_view(), name='verify_code'),
    path('resend/', ResendVerificationView.as_view(), name='resend_code'),
    path('<slug:slug>/', CustomUserView.as_view(), name='user'),
]
