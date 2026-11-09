from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from core.models import StudentProfile


def reset_expired_qr_assignments():
    """
    Сбрасывает «зависшие» привязки QR (ТЗ 4.4).
    Если студент отсканировал, но не подтвердил за 10 минут —
    попытка сбрасывается, он может попробовать снова.
    """
    threshold = timezone.now() - timedelta(seconds=settings.QR_ASSIGNMENT_TIMEOUT_SECONDS)

    stale = StudentProfile.objects.filter(
        token_used_today=True,
        token_assigned_at__lt=threshold,
        status_today='not_issued',
    )
    count = stale.count()

    # Снимаем резерв с QR-сессий, чтобы токен мог использовать другой студент
    from core.models import QRSession
    QRSession.objects.filter(reserved_by__in=stale, used=False).update(reserved_by=None)

    stale.update(
        current_qr_session=None,
        token_assigned_at=None,
        token_used_today=False,
    )

    if count:
        print(f'[reset_expired_qr_assignments] Сброшено попыток: {count}')
    return count


def reset_daily_statuses():
    """
    Ночной сброс статусов (ТЗ 4.1, шаг 6).
    Всем студентам: status_today='not_issued', token_used_today=False,
    current_qr_session=None.
    """
    from core.models import QRSession

    # Снимаем все активные резервы QR
    QRSession.objects.filter(used=False, reserved_by__isnull=False).update(reserved_by=None)

    count = StudentProfile.objects.filter(
        status_today='issued'
    ).update(status_today='not_issued')

    total = StudentProfile.objects.update(
        token_used_today=False,
        current_qr_session=None,
        token_assigned_at=None,
    )

    print(f'[reset_daily_statuses] Сброшено статусов: {count}, всего профилей: {total}')
    return count