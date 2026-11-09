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

    email = models.EmailField('email', unique=True)
    role = models.CharField('роль', max_length=20, choices=Role.choices, default=Role.STUDENT)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'