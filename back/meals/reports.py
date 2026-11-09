from datetime import datetime, timedelta
from django.db.models import Count
from django.utils import timezone
from core.models import MealLog, StudentProfile, LoginAttempt


def parse_date(date_str, default):
    """Парсит дату из строки формата YYYY-MM-DD."""
    if not date_str:
        return default
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return default


def get_report_data(request):
    """Собирает данные для отчёта с учётом фильтров из GET-запроса."""
    # 1. Период (по умолчанию — сегодня)
    today = timezone.localdate()
    date_from = parse_date(request.query_params.get('date_from'), today)
    date_to = parse_date(request.query_params.get('date_to'), today)

    # Фильтруем выдачу
    logs = MealLog.objects.filter(
        issued_at__date__gte=date_from,
        issued_at__date__lte=date_to,
    )

    # 2. Фильтр по группе
    group_id = request.query_params.get('group_id')
    if group_id:
        logs = logs.filter(student__group_id=group_id)

    # 3. Фильтр по категории
    category_id = request.query_params.get('category_id')
    if category_id:
        logs = logs.filter(student__candidate__categories__id=category_id)

    # Считаем метрики
    total_issued = logs.count()
    unique_students = logs.values('student').distinct().count()
    
    # Разбивка по группам (для таблицы)
    by_group = list(
        logs.values('student__group__name')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # 4. Попытки (успешные/неуспешные)
    # В ТЗ п.6.4 "Количество попыток". Берем из LoginAttempt (или можно из QRSession)
    attempts = LoginAttempt.objects.filter(
        attempted_at__date__gte=date_from,
        attempted_at__date__lte=date_to,
    )
    success_attempts = attempts.filter(success=True).count()
    fail_attempts = attempts.filter(success=False).count()

    return {
        'period': {'from': date_from, 'to': date_to},
        'metrics': {
            'total_issued': total_issued,
            'unique_students': unique_students,
            'success_attempts': success_attempts,
            'fail_attempts': fail_attempts,
        },
        'by_group': by_group,
    }