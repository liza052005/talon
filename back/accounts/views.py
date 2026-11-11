from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import LoginAttempt
from .serializers import (
    LoginSerializer,
    StaffLoginSerializer,
    StaffTOTPSetupSerializer,
    StaffTOTPVerifySerializer,
    StudentRegisterSerializer,
    Verify2FASerializer,
)

User = get_user_model()


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


def _issue_jwt(user):
    """Вспомогательная функция для генерации токенов."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
        },
    }


class StudentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.save()

        # Генерируем токены СРАЗУ после регистрации
        refresh = RefreshToken.for_user(profile.user)

        return Response(
            {
                'detail': 'Регистрация успешна.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': profile.user.id,
                    'email': profile.user.email,
                    'role': profile.user.role,
                },
                'student': {
                    'full_name': profile.full_name,
                    'group': profile.group.name,
                    'email': profile.user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .security import check_ip_rate_limit, account_is_blocked
        check_ip_rate_limit(request)

        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        if account_is_blocked(user.email):
            _log_login(request, user.email, success=False)
            from rest_framework.exceptions import Throttled
            raise Throttled(detail='Аккаунт временно заблокирован. Попробуйте позже.', wait=30 * 60)

        _log_login(request, user.email, success=True)
        return Response(
            {'detail': 'Код подтверждения отправлен на email.'},
            status=status.HTTP_200_OK,
        )


class Verify2FAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .security import check_ip_rate_limit
        check_ip_rate_limit(request)

        serializer = Verify2FASerializer(data=request.data)
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        return Response(_issue_jwt(user), status=status.HTTP_200_OK)


class StaffLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .security import check_ip_rate_limit, account_is_blocked
        from .totp import provisioning_uri
        check_ip_rate_limit(request)

        serializer = StaffLoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user, mode = serializer.save()

        if account_is_blocked(user.email):
            _log_login(request, user.email, success=False)
            from rest_framework.exceptions import Throttled
            raise Throttled(detail='Аккаунт временно заблокирован. Попробуйте позже.', wait=30 * 60)

        _log_login(request, user.email, success=True)

        if mode == 'setup':
            return Response({
                'detail': 'Первый вход. Настройте TOTP.',
                'mode': 'setup',
                'secret': user.totp_secret,
                'otpauth_uri': provisioning_uri(user.totp_secret, user.email),
            })

        return Response({'detail': 'Введите TOTP-код.', 'mode': 'verify'})


class StaffTOTPSetupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .security import check_ip_rate_limit
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
        from .security import check_ip_rate_limit
        check_ip_rate_limit(request)

        serializer = StaffTOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            email = str(request.data.get('email', '')).lower()
            _log_login(request, email, success=False)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        _log_login(request, user.email, success=True)

        return Response(_issue_jwt(user), status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({'id': u.id, 'email': u.email, 'role': u.role})

from core.models import User

class StaffListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Разрешаем и админу, и модератору смотреть список
        if request.user.role not in [User.Role.ADMIN, User.Role.MODERATOR]:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        staff = User.objects.exclude(role=User.Role.STUDENT).values('id', 'email', 'first_name', 'last_name', 'role')
        return Response(staff)

    def post(self, request):
        # А вот создавать новых сотрудников может ТОЛЬКО админ
        if request.user.role != User.Role.ADMIN:
            return Response({'detail': 'Только администратор может создавать сотрудников'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        if User.objects.filter(email=data['email']).exists():
            return Response({'detail': 'Этот email уже занят'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Создаем сотрудника (пароль по умолчанию qwerty123)
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data.get('password', 'qwerty123'),
            first_name=data.get('firstName', ''),
            last_name=data.get('lastName', ''),
            role=data['role']
        )
        return Response({'id': user.id, 'email': user.email}, status=status.HTTP_201_CREATED)