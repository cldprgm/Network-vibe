from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import CursorPagination

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from django.db.models import ExpressionWrapper, F, FloatField
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django_redis import get_redis_connection
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator

import time
import requests
import jwt

from apps.posts.serializers import PostListSerializer
from apps.communities.models import Community
from apps.posts.views import get_optimized_post_queryset
from apps.services.oauth_tokens import get_google_tokens, get_github_tokens
from apps.services.utils import (
    get_or_create_social_user,
    get_github_user_email,
    get_github_user_data
)

from .models import CustomUser, VerificationCode
from .serializers import (
    CustomUserSerializer,
    CustomUserInfoSerializer,
    RegisterUserSerializer,
    LoginUserSerializer,
    VerifyCodeSerializer,
    ResendVerificationSerializer,
    CustomUserCommunitiesSerializer,
    GoogleAuthSerializer,
    GithubAuthSerializer
)
from .throttles import (
    RegistrationThrottle,
    EmailVerifyThrottle,
    UserStatusUpdateThrottle
)


def email_key(group, request):
    email = request.data.get("email")
    return (email or '').lower()


class CustomUserView(RetrieveAPIView):
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class CustomUserInfoView(RetrieveUpdateAPIView):
    serializer_class = CustomUserInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserRegistrationView(CreateAPIView):
    serializer_class = RegisterUserSerializer
    throttle_classes = [RegistrationThrottle]
    permission_classes = [AllowAny]


class SetJWTCookiesMixin():
    """Adds method to create a response with JWT cookies."""

    def get_response_with_jwt_in_cookies(self, user, request):
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response(
            data={
                'user': CustomUserInfoSerializer(user, context={'request': request}).data
            },
            status=status.HTTP_200_OK
        )
        response.set_cookie(key='access_token',
                            value=access_token,
                            httponly=True,
                            domain=None,
                            path='/',
                            secure=False,
                            samesite='Lax')
        response.set_cookie(key='refresh_token',
                            value=str(refresh),
                            httponly=True,
                            domain=None,
                            path='/',
                            secure=False,
                            samesite='Lax')
        return response


class GoogleLoginView(SetJWTCookiesMixin, APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']

        # Exchange code for tokens
        try:
            google_tokens = get_google_tokens(code)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        id_token = google_tokens.get('id_token')

        # Get or create user
        try:
            payload = jwt.decode(id_token, options={'verify_signature': False})
        except jwt.PyJWTError:
            return Response(
                {'error': 'Invalid ID token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = payload.get('email')
        google_user_id = payload.get('sub')

        if not email or not google_user_id:
            return Response({"error": "Incomplete data from Google"}, status=status.HTTP_400_BAD_REQUEST)

        user = get_or_create_social_user(
            provider_field='google_id',
            social_id=google_user_id,
            email=email,
            username=payload.get('name'),
            first_name=payload.get('given_name', ''),
            last_name=payload.get('family_name', ''),
            avatar=payload.get('picture'),
        )

        # Send jwt
        return self.get_response_with_jwt_in_cookies(user, request)


class GithubLoginView(SetJWTCookiesMixin, APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = GithubAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']

        with requests.Session() as session:
            try:
                # Exchange code for tokens
                response = get_github_tokens(session, code)
                access_token = response.get('access_token')

                # Get user data
                user_data = get_github_user_data(session, access_token)
                github_id = str(user_data.get("id"))
                email = user_data.get("email")

                # Get email if missing
                if not email:
                    email = get_github_user_email(session, access_token)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        full_name = user_data.get('name') or ''
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = get_or_create_social_user(
            provider_field='github_id',
            social_id=github_id,
            email=email,
            username=user_data.get('login'),
            first_name=first_name,
            last_name=last_name,
            avatar=user_data.get('avatar_url'),
        )

        # Send jwt
        return self.get_response_with_jwt_in_cookies(user, request)


class VerifyEmailView(SetJWTCookiesMixin, APIView):
    throttle_classes = [EmailVerifyThrottle]
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if not user.is_active:
                user.is_active = True
                user.save()

            return self.get_response_with_jwt_in_cookies(user, request)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# it's not necessary yet
#
# class VerifyCodeView(APIView):
#     def post(self, request, *args, **kwargs):
#         serializer = VerifyCodeSerializer(data=request.data)
#         if serializer.is_valid():
#             user = CustomUser.objects.get(
#                 email=serializer.validated_data['email']
#             )
#             user.is_active = True
#             user.save()
#             VerificationCode.objects.filter(user=user).delete()
#             return Response({"message": "Email verified successfully"}, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class ResendVerificationView(APIView):
#     permission_classes = [AllowAny]

#     @method_decorator(ratelimit(key=email_key, rate='5/h', method='POST', block=False))
#     @method_decorator(ratelimit(key=email_key, rate='1/m', method='POST', block=False))
#     def post(self, request, *args, **kwargs):

#         if getattr(request, "limited", False):
#             return Response(status=status.HTTP_429_TOO_MANY_REQUESTS)

#         serializer = ResendVerificationSerializer(data=request.data)
#         if not serializer.is_valid():
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         email = serializer.validated_data['email']

#         user = CustomUser.objects.filter(email=email, is_active=False).first()
#         if user:
#             send_verification_code(user=user)

#         return Response(
#             {'message': 'Verification code resent if email is registered'},
#             status=status.HTTP_200_OK
#         )


class LoginView(SetJWTCookiesMixin, APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginUserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data
            return self.get_response_with_jwt_in_cookies(user, request)
        else:
            return Response(data=serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()
            except Exception:
                pass

        response = Response(
            {'message': 'Successfully logged out!'},
            status=status.HTTP_200_OK
        )
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token not provided'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response(
                {'message': 'Access token refreshed successfully'},
                status=status.HTTP_200_OK
            )
            response.set_cookie(key='access_token',
                                value=access_token,
                                httponly=True,
                                domain=None,
                                path='/',
                                secure=False,
                                samesite='Lax')
            return response
        except TokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)


class PostListCursorPagination(CursorPagination):
    page_size = 25
    ordering = None

    def get_ordering(self, request, queryset, view):
        filter_type = self.request.query_params.get('filter', 'popular')

        if filter_type == 'new':
            return '-created', '-id'
        elif filter_type == 'popular':
            return '-user_posts_score', '-id'

        return '-id'


class CustomUserPostsView(ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [AllowAny]
    pagination_class = PostListCursorPagination

    def get_queryset(self):
        request = self.request
        queryset = get_optimized_post_queryset(request)
        queryset = queryset.filter(author__slug=self.kwargs['slug'])

        filter_type = request.query_params.get('filter', 'popular')

        # optimize later
        if filter_type == 'popular':
            queryset = queryset.annotate(
                user_posts_score=ExpressionWrapper(
                    (F('sum_rating') + 0.5) * (F('comment_count') + 0.5) * 0.01,
                    output_field=FloatField()
                )
            )

        return queryset

    def list(self, request, *args, **kwargs):
        cursor = request.query_params.get('cursor')

        if cursor is None:
            filter_type = request.query_params.get('filter', 'popular')
            cache_key = f"user_posts_first_page:{self.kwargs['slug']}:{filter_type}"
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, timeout=60 * 15)
            return response

        return super().list(request, *args, **kwargs)


class CommunityListCursorPagination(CursorPagination):
    page_size = 7
    ordering = '-id'


class CustomUserCommunitiesView(ListAPIView):
    serializer_class = CustomUserCommunitiesSerializer
    permission_classes = [AllowAny]
    pagination_class = CommunityListCursorPagination

    def get_queryset(self):
        slug = self.kwargs['slug']
        target_user = get_object_or_404(CustomUser, slug=slug)

        queryset = Community.objects.filter(
            members__user=target_user
        ).select_related('creator')

        return queryset

    def list(self, request, *args, **kwargs):
        slug = self.kwargs['slug']
        cursor = request.query_params.get('cursor')

        if cursor is None:
            cache_key = f'user_communities_first_page:{slug}'
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, timeout=600)
            return response

        return super().list(request, *args, **kwargs)


class CustomUserStatusCheck(APIView):
    throttle_classes = [UserStatusUpdateThrottle]
    http_method_names = ['post']

    def post(self, request):
        user = request.user
        if user.is_authenticated:
            community_ids = user.user_memberships.values_list(
                'community_id',
                flat=True
            )

            if community_ids:
                current_timestamp = int(time.time())

                r = get_redis_connection("default")
                pipe = r.pipeline()

                for community_id in community_ids:
                    key = f'community:{community_id}:online'
                    pipe.zadd(key, {user.pk: current_timestamp})
                    pipe.expire(key, 60 * 15)

                pipe.execute()

        return Response(status=status.HTTP_204_NO_CONTENT)
