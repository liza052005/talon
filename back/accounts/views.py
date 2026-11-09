from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import StudentRegisterSerializer


class StudentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.save()

        return Response(
            {
                'detail': 'Регистрация успешна.',
                'student': {
                    'full_name': profile.full_name,
                    'group': profile.group.name,
                    'email': profile.user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import LoginAttempt
from .serializers import (
    LoginSerializer, StudentRegisterSerializer, Verify2FASerializer,
)


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _log_login(request, email, success):
    LoginAttempt.objects.create(
        email=email,
        ip_address=_client_ip(request) or '0.0.0.0',
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        success=success,
    )

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        return Response(
            {'detail': 'Код подтверждения отправлен на email.'},
            status=status.HTTP_200_OK,
        )


class Verify2FAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = Verify2FASerializer(data=request.data)
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                },
            },
            status=status.HTTP_200_OK,
        )
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({'id': u.id, 'email': u.email, 'role': u.role})