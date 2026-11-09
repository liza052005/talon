from django.core.management.base import BaseCommand
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from meals.tasks import reset_expired_qr_assignments, reset_daily_statuses


class Command(BaseCommand):
    help = 'Запускает APScheduler для периодических задач (таймаут QR + ночной сброс).'

    def handle(self, *args, **options):
        scheduler = BlockingScheduler(timezone='Europe/Moscow')

        # Каждую минуту: сброс «зависших» привязок (ТЗ 4.4)
        scheduler.add_job(
            reset_expired_qr_assignments,
            trigger=IntervalTrigger(minutes=1),
            id='reset_expired_qr_assignments',
            max_instances=1,
            replace_existing=True,
        )

        # Ночью в 00:00: сброс статусов (ТЗ 4.1)
        scheduler.add_job(
            reset_daily_statuses,
            trigger=CronTrigger(hour=0, minute=0),
            id='reset_daily_statuses',
            max_instances=1,
            replace_existing=True,
        )

        self.stdout.write(self.style.SUCCESS('APScheduler запущен. Ctrl+C для остановки.'))
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            self.stdout.write(self.style.WARNING('APScheduler остановлен.'))