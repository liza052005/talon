from django.shortcuts import render
from .totp import provisioning_uri
# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .security import account_is_blocked, check_ip_rate_limit, client_ip
from rest_framework.exceptions import Throttled
from .serializers import (
    LoginSerializer, StaffLoginSerializer, StaffTOTPSetupSerializer,
    StaffTOTPVerifySerializer, StudentRegisterSerializer, Verify2FASerializer,
)

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
        # 1) Rate limit по IP
        check_ip_rate_limit(request)

        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # 2) Блокировка аккаунта (до успешного ответа — но после проверки пароля,
        #    чтобы не палить существование email)
        if account_is_blocked(user.email):
            _log_login(request, user.email, success=False)
            raise Throttled(
                detail='Аккаунт временно заблокирован. Попробуйте позже.',
                wait=30 * 60,
            )

        _log_login(request, user.email, success=True)
        return Response(
            {'detail': 'Код подтверждения отправлен на email.'},
            status=status.HTTP_200_OK,
        )

class Verify2FAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        check_ip_rate_limit(request)

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

def _issue_jwt(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': user.id, 'email': user.email, 'role': user.role},
    }


class StaffLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        check_ip_rate_limit(request)

        serializer = StaffLoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user, mode = serializer.save()

        if account_is_blocked(user.email):
            _log_login(request, user.email, success=False)
            raise Throttled(detail='Аккаунт временно заблокирован. Попробуйте позже.', wait=30 * 60)

        _log_login(request, user.email, success=True)

        if mode == 'setup':
            return Response({
                'detail': 'Первый вход. Настройте TOTP.',
                'mode': 'setup',
                'secret': user.totp_secret,
                'otpauth_uri': provisioning_uri(user.totp_secret, user.email),
            })

        return Response({
            'detail': 'Введите TOTP-код.',
            'mode': 'verify',
        })


class StaffTOTPSetupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        check_ip_rate_limit(request)

        serializer = StaffTOTPSetupSerializer(data=request.data)
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        return Response({
            'detail': 'TOTP привязан. Выполните вход.',
            **_issue_jwt(user),
        }, status=status.HTTP_201_CREATED)


class StaffTOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        check_ip_rate_limit(request)

        serializer = StaffTOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        return Response(_issue_jwt(user), status=status.HTTP_200_OK)