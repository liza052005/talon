from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    

    """Кастомный пользователь: логин по email, роль в системе."""

    class Role(models.TextChoices):
        STUDENT = 'student', 'Студент'
        MODERATOR = 'moderator', 'Модератор'
        ADMIN = 'admin', 'Администратор'
        CANTEEN = 'canteen', 'Сотрудник выдачи'
    totp_secret = models.CharField('TOTP-секрет', max_length=32, blank=True)
    totp_confirmed = models.BooleanField('TOTP подтверждён', default=False)
    email = models.EmailField('email', unique=True)
    role = models.CharField('роль', max_length=20, choices=Role.choices, default=Role.STUDENT)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'

from django.db import models


class Group(models.Model):
    """Учебная группа. Может быть на практике — тогда питание не выдаётся."""
    name = models.CharField('название', max_length=50, unique=True)
    is_active = models.BooleanField('активна', default=True,
                                    help_text='Снять галочку = группа на практике')
    created_at = models.DateTimeField('создана', auto_now_add=True)

    class Meta:
        verbose_name = 'группа'
        verbose_name_plural = 'группы'
        ordering = ['name']

    def __str__(self):
        return self.name


class Category(models.Model):
    """Категория питания: общежитие, соц. группа, специальность."""
    name = models.CharField('название', max_length=100, unique=True)
    description = models.TextField('описание', blank=True)

    class Meta:
        verbose_name = 'категория питания'
        verbose_name_plural = 'категории питания'
        ordering = ['name']

    def __str__(self):
        return self.name


class StudentCandidate(models.Model):
    """
    Заготовка из Excel, загруженная модератором.
    Студент ещё не зарегистрирован в системе.
    """
    full_name = models.CharField('ФИО', max_length=200)
    group = models.ForeignKey(Group, on_delete=models.PROTECT,
                              related_name='candidates', verbose_name='группа')
    is_budget = models.BooleanField('бюджетник', default=True)
    categories = models.ManyToManyField(Category, blank=True,
                                        related_name='candidates',
                                        verbose_name='категории питания')
    is_registered = models.BooleanField('зарегистрирован', default=False)
    created_at = models.DateTimeField('загружен', auto_now_add=True)

    class Meta:
        verbose_name = 'заготовка студента'
        verbose_name_plural = 'заготовки студентов'
        ordering = ['full_name']
        indexes = [
            models.Index(fields=['full_name', 'group']),
        ]

    def __str__(self):
        return f'{self.full_name} ({self.group})'


class StudentProfile(models.Model):
    """Зарегистрированный студент — привязан к User."""
    user = models.OneToOneField('core.User', on_delete=models.CASCADE,
                                related_name='student_profile',
                                verbose_name='пользователь')
    candidate = models.OneToOneField(StudentCandidate, on_delete=models.PROTECT,
                                     related_name='profile',
                                     verbose_name='заготовка')
    full_name = models.CharField('ФИО', max_length=200)
    group = models.ForeignKey(Group, on_delete=models.PROTECT,
                              related_name='students', verbose_name='группа')

    # Статус на сегодня — сбрасывается ночью cron-задачей (п. 4.1, шаг 6)
    status_today = models.CharField(
        'статус сегодня',
        max_length=20,
        choices=[('not_issued', 'Не получено'), ('issued', 'Выдано')],
        default='not_issued',
    )
    # Привязка к текущему QR-токену (п. 4.2, шаг 3-4)
    current_qr_session = models.ForeignKey(
        'QRSession', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='assigned_to', verbose_name='текущая QR-сессия',
    )
    token_assigned_at = models.DateTimeField('токен привязан в', null=True, blank=True)
    token_used_today = models.BooleanField('токен использован сегодня', default=False)

    created_at = models.DateTimeField('создан', auto_now_add=True)

    class Meta:
        verbose_name = 'студент'
        verbose_name_plural = 'студенты'
        ordering = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.group})'

class QRSession(models.Model):
    """
    Одноразовый QR-токен. Генерируется планшетом сотрудника,
    обновляется каждые 3-5 минут (п. 4.1).
    """
    token = models.CharField('токен', max_length=64, unique=True, db_index=True)
    created_by = models.ForeignKey('core.User', on_delete=models.PROTECT,
                                   related_name='qr_sessions',
                                   verbose_name='создал (сотрудник)')
    created_at = models.DateTimeField('создан', auto_now_add=True)
    expires_at = models.DateTimeField('истекает')
    used = models.BooleanField('использован', default=False)
    used_at = models.DateTimeField('использован в', null=True, blank=True)
    used_by = models.ForeignKey(StudentProfile, null=True, blank=True,
                                on_delete=models.SET_NULL,
                                related_name='used_qr_sessions',
                                verbose_name='использован студентом')
    reserved_by = models.ForeignKey(
    'StudentProfile', null=True, blank=True, on_delete=models.SET_NULL,
    related_name='reserved_qr_sessions', verbose_name='зарезервирован студентом',
)

    class Meta:
        verbose_name = 'QR-сессия'
        verbose_name_plural = 'QR-сессии'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'used', 'expires_at']),
        ]

    def __str__(self):
        return f'{self.token[:8]}... ({"used" if self.used else "active"})'

class MealLog(models.Model):
    """Лог успешных выдач питания. Одна запись = одна выданная порция."""
    student = models.ForeignKey(StudentProfile, on_delete=models.PROTECT,
                                related_name='meal_logs', verbose_name='студент')
    qr_session = models.ForeignKey(QRSession, on_delete=models.PROTECT,
                                   related_name='meal_logs',
                                   verbose_name='QR-сессия')
    issued_at = models.DateTimeField('выдано', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'запись о выдаче'
        verbose_name_plural = 'записи о выдаче'
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['issued_at']),
        ]

    def __str__(self):
        return f'{self.student.full_name} — {self.issued_at:%d.%m.%Y %H:%M}'

class LoginAttempt(models.Model):
    """Лог всех попыток входа — успешных и неуспешных (п. 3.3)."""
    email = models.EmailField('email')
    ip_address = models.GenericIPAddressField('IP')
    user_agent = models.TextField('User-Agent', blank=True)
    success = models.BooleanField('успешно')
    attempted_at = models.DateTimeField('попытка в', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'попытка входа'
        verbose_name_plural = 'попытки входа'
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['email', 'attempted_at']),
            models.Index(fields=['ip_address', 'attempted_at']),
        ]

    def __str__(self):
        return f'{self.email} — {"OK" if self.success else "FAIL"} — {self.attempted_at:%d.%m %H:%M}'


class VerificationCode(models.Model):
    """6-значный email-код для 2FA студентов (п. 3.2)."""
    user = models.ForeignKey('core.User', on_delete=models.CASCADE,
                             related_name='verification_codes',
                             verbose_name='пользователь')
    code = models.CharField('код', max_length=6)
    created_at = models.DateTimeField('создан', auto_now_add=True)
    expires_at = models.DateTimeField('истекает')
    used = models.BooleanField('использован', default=False)

    class Meta:
        verbose_name = '2FA-код'
        verbose_name_plural = '2FA-коды'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.code}'