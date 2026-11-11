from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import Throttled

from core.models import LoginAttempt, User

# --- Константы (ТЗ 3.3) ---
IP_WINDOW_MINUTES = 10
IP_MAX_ATTEMPTS = 5
IP_BLOCK_MINUTES = 10

ACCOUNT_WINDOW_MINUTES = 60      # окно, в котором считаем неудачи аккаунта
ACCOUNT_MAX_FAILS = 10
ACCOUNT_BLOCK_MINUTES = 30


def client_ip(request) -> str:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def check_ip_rate_limit(request):
    """Не более 5 НЕУДАЧНЫХ попыток за 10 минут с одного IP. Иначе — 429."""
    ip = client_ip(request)
    since = timezone.now() - timedelta(minutes=IP_WINDOW_MINUTES)
    
    # Считаем только НЕУДАЧНЫЕ попытки (success=False), чтобы не блочить своих!
    attempts = LoginAttempt.objects.filter(
        ip_address=ip, 
        attempted_at__gte=since,
        success=False  # <--- ВОТ ЭТА СТРОКА
    ).count()
    
    if attempts >= IP_MAX_ATTEMPTS:
        raise Throttled(
            detail='Слишком много попыток. Попробуйте позже.',
            wait=int(IP_BLOCK_MINUTES * 60),
        )

def account_is_blocked(email: str) -> bool:
    """10 неудач за час → блок на 30 минут после последней неудачи."""
    since = timezone.now() - timedelta(minutes=ACCOUNT_WINDOW_MINUTES)
    fails = (
        LoginAttempt.objects
        .filter(email__iexact=email, success=False, attempted_at__gte=since)
        .order_by('-attempted_at')
    )
    if fails.count() < ACCOUNT_MAX_FAILS:
        return False
    last_fail = fails.first().attempted_at
    return timezone.now() - last_fail < timedelta(minutes=ACCOUNT_BLOCK_MINUTES)


def is_staff_role(role: str) -> bool:
    return role in {User.Role.MODERATOR, User.Role.ADMIN, User.Role.CANTEEN}