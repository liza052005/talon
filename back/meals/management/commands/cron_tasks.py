from django.core.management.base import BaseCommand
from meals.tasks import reset_expired_qr_assignments, reset_daily_statuses

class Command(BaseCommand):
    help = 'Запускает задачи для Cron (таймаут и сброс)'

    def handle(self, *args, **options):
        # Мы не можем знать, какая именно задача нужна, поэтому запускаем обе.
        # Это быстро и не навредит.
        reset_expired_qr_assignments()
        reset_daily_statuses()