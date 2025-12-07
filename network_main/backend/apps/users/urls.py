from django.urls import path

from .views import (
    CustomUserView,
    CustomUserInfoView,
    UserRegistrationView,
    LogoutView,
    LoginView,
    VerifyEmailView,
    CookieTokenRefreshView,
    CustomUserPostsView,
    CustomUserCommunitiesView,
    CustomUserStatusCheck,
    GoogleLoginView,
    GithubLoginView,
)


urlpatterns = [
    path('user-info/', CustomUserInfoView.as_view(), name='user-info'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('login/google/', GoogleLoginView.as_view(), name='google_login'),
    path('login/github/', GithubLoginView.as_view(), name='github_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='refresh'),
    path('verify-email/<str:uidb64>/<str:token>/',
         VerifyEmailView.as_view(), name='verify_email'),
    # path('verify-code/', VerifyCodeView.as_view(), name='verify_code'),
    # path('resend/', ResendVerificationView.as_view(), name='resend_code'),
    path('heartbeat/', CustomUserStatusCheck.as_view(), name='user_status'),
    path('<slug:slug>/', CustomUserView.as_view(), name='user'),
    path('<slug:slug>/communities/',
         CustomUserCommunitiesView.as_view(), name='user_communities'),
    path('<slug:slug>/posts/', CustomUserPostsView.as_view(), name='user_posts'),
    # path('<slug:slug>/comments/', CustomUserPostsView.as_view(), name='user_posts'),
]
