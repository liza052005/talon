from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from core.models import Category, Group, StudentCandidate, StudentProfile

User = get_user_model()


class StudentRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    group_name = serializers.CharField(max_length=50)          # имя группы строкой
    category_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False,
    )
    is_budget = serializers.BooleanField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value.lower()

    def validate(self, attrs):
        # 1. Группа должна существовать и быть активной
        try:
            group = Group.objects.get(name__iexact=attrs['group_name'])
        except Group.DoesNotExist:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # 2. Категории должны существовать
        categories = Category.objects.filter(id__in=attrs['category_ids'])
        if categories.count() != len(attrs['category_ids']):
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # 3. Ищем заготовку: ФИО + группа + бюджетник + хотя бы одна категория
        candidates = StudentCandidate.objects.filter(
            full_name__iexact=attrs['full_name'].strip(),
            group=group,
            is_budget=attrs['is_budget'],
            is_registered=False,
            categories__in=categories,
        ).distinct()

        if not candidates.exists():
            # Одинаковый текст — защита от перебора (п. 3.1, 7.5)
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        attrs['_candidate'] = candidates.first()
        attrs['_group'] = group
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        candidate = validated_data['_candidate']

        # На случай гонки — перепроверяем, что заготовку ещё не заняли
        candidate = StudentCandidate.objects.select_for_update().get(pk=candidate.pk)
        if candidate.is_registered:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # Создаём User
        user = User.objects.create_user(
            username=validated_data['email'],       # username = email, чтобы не плодить поля
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.STUDENT,
        )

        # Создаём профиль
        profile = StudentProfile.objects.create(
            user=user,
            candidate=candidate,
            full_name=candidate.full_name,
            group=candidate.group,
        )

        # Помечаем заготовку занятой
        candidate.is_registered = True
        candidate.save(update_fields=['is_registered'])

        return profile

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from core.models import (
    Category, Group, StudentCandidate, StudentProfile, VerificationCode,
)

class LoginSerializer(serializers.Serializer):
    """Шаг 1: email + пароль → отправка 2FA-кода на почту."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs['email'].lower()
        user = authenticate(
            request=self.context.get('request'),
            username=email,       # USERNAME_FIELD = email
            password=attrs['password'],
        )
        if user is None:
            # Одинаковый текст — не раскрываем, существует ли email (ТЗ 7.5)
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Аккаунт заблокирован.')

        attrs['_user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['_user']

        # Гасим старые неиспользованные коды этого пользователя
        VerificationCode.objects.filter(user=user, used=False).update(used=True)

        # Генерируем новый 6-значный код
        code = f'{random.randint(0, 999999):06d}'
        VerificationCode.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        # Отправка на email (на разработке — в консоль Django)
        send_mail(
            subject='Код подтверждения входа',
            message=f'Ваш код для входа: {code}\nКод действует 10 минут.',
            from_email=None,   # возьмёт DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user


class Verify2FASerializer(serializers.Serializer):
    """Шаг 2: email + код → выдача JWT."""
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs['email'].lower()
        code = attrs['code'].strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный код.')

        # Ищем последний валидный код
        vc = (
            VerificationCode.objects
            .filter(user=user, code=code, used=False, expires_at__gt=timezone.now())
            .order_by('-created_at')
            .first()
        )
        if vc is None:
            raise serializers.ValidationError('Неверный или истёкший код.')

        attrs['_user'] = user
        attrs['_code_obj'] = vc
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        vc = validated_data['_code_obj']
        vc.used = True
        vc.save(update_fields=['used'])
        return validated_data['_user']