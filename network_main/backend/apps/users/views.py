from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from django.core.exceptions import PermissionDenied

from .models import CustomUser
from .serializers import CustomUserSerializer, RegisterUserSerializer, LoginUserSerializer


class CustomUserView(RetrieveUpdateAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        if self.get_object() != self.request.user:
            raise PermissionDenied('You cannot edit this profile.')
        serializer.save()


class UserRegistrationView(CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    def post(self, request):
        serializer = LoginUserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response(
                data={
                    'user': CustomUserSerializer(
                        user,
                        context={'request': request}).data
                },
                status=status.HTTP_200_OK
            )
            response.set_cookie(key='access_token',
                                value=access_token,
                                httponly=True,
                                secure=False,
                                samesite='Lax')
            response.set_cookie(key='refresh_token',
                                value=str(refresh),
                                httponly=True,
                                secure=False,
                                samesite='Lax')
            return response
        else:
            return Response(data=serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh.blacklist()
            except Exception as e:
                return Response(
                    {'error': 'Error invalidating token: ' + str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
                                secure=False,
                                samesite='Lax')
            return response
        except TokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
