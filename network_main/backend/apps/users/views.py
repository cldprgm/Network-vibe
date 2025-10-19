from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

from apps.services.verification import send_verification_code

from .models import CustomUser, VerificationCode
from .serializers import (
    CustomUserSerializer,
    CustomUserInfoSerializer,
    RegisterUserSerializer,
    LoginUserSerializer,
    VerifyCodeSerializer,
    ResendVerificationSerializer
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
    permission_classes = [AllowAny]


class VerifyCodeView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = VerifyCodeSerializer(data=request.data)
        if serializer.is_valid():
            user = CustomUser.objects.get(
                email=serializer.validated_data['email']
            )
            user.is_active = True
            user.save()
            VerificationCode.objects.filter(user=user).delete()
            return Response({"message": "Email verified successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key=email_key, rate='5/h', method='POST', block=False))
    @method_decorator(ratelimit(key=email_key, rate='1/m', method='POST', block=False))
    def post(self, request, *args, **kwargs):

        if getattr(request, "limited", False):
            return Response(status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']

        user = CustomUser.objects.filter(email=email, is_active=False).first()
        if user:
            send_verification_code(user=user)

        return Response(
            {'message': 'Verification code resent if email is registered'},
            status=status.HTTP_200_OK
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginUserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response(
                data={
                    'user': CustomUserInfoSerializer(
                        user,
                        context={'request': request}).data
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
