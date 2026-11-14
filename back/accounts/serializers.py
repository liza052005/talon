import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from core.models import (
    Category, Group, StudentCandidate, StudentProfile, VerificationCode,
    MealLog,
)
from .totp import generate_secret, provisioning_uri, verify_code

User = get_user_model()

# ==========================================
# СЕРИАЛИЗАТОРЫ ДЛЯ СТУДЕНТОВ
# ==========================================

class StudentRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    group_name = serializers.CharField(max_length=50)
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
        try:
            group = Group.objects.get(name__iexact=attrs['group_name'])
        except Group.DoesNotExist:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        categories = Category.objects.filter(id__in=attrs['category_ids'])
        if categories.count() != len(attrs['category_ids']):
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # Ищем заготовку
        candidates = StudentCandidate.objects.filter(
            full_name__iexact=attrs['full_name'].strip(),
            group=group,
            is_budget=attrs['is_budget'],
            is_registered=False,
        ).distinct()

        valid_candidate = None
        for c in candidates:
            # Проверяем, есть ли пересечение по категориям
            candidate_cat_ids = set(c.categories.values_list('id', flat=True))
            input_cat_ids = set(attrs['category_ids'])
            if candidate_cat_ids & input_cat_ids:
                valid_candidate = c
                break

        if not valid_candidate:
            # Если не нашли, выводим детальную ошибку (для тебя)
            same_name = StudentCandidate.objects.filter(full_name__iexact=attrs['full_name'].strip()).first()
            if not same_name:
                raise serializers.ValidationError(f"Заготовка с ФИО '{attrs['full_name']}' не найдена в базе.")
            if same_name.is_registered:
                raise serializers.ValidationError('Вы уже зарегистрированы.')
            if same_name.group.name != group.name:
                raise serializers.ValidationError(f"Группа не совпадает (в базе {same_name.group.name}).")
            if same_name.is_budget != attrs['is_budget']:
                raise serializers.ValidationError("Не совпадает бюджет.")
            
            db_cats = set(same_name.categories.values_list('id', flat=True))
            raise serializers.ValidationError(f"Категории не совпадают. В базе: {db_cats}, вы ввели: {attrs['category_ids']}")

        attrs['_candidate'] = valid_candidate
        attrs['_group'] = group
        return attrs
    @transaction.atomic
    def create(self, validated_data):
        candidate = validated_data['_candidate']

        candidate = StudentCandidate.objects.select_for_update().get(pk=candidate.pk)
        if candidate.is_registered:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.STUDENT,
        )

        profile = StudentProfile.objects.create(
            user=user,
            candidate=candidate,
            full_name=candidate.full_name,
            group=candidate.group,
        )

        candidate.is_registered = True
        candidate.save(update_fields=['is_registered'])

        return profile


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs['email'].lower()
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=attrs['password'],
        )
        if user is None:
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Аккаунт заблокирован.')

        attrs['_user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['_user']

        VerificationCode.objects.filter(user=user, used=False).update(used=True)

        code = f'{random.randint(0, 999999):06d}'
        VerificationCode.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        send_mail(
            subject='Код подтверждения входа',
            message=f'Ваш код для входа: {code}\nКод действует 10 минут.',
            from_email=None,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user


class Verify2FASerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs['email'].lower()
        code = attrs['code'].strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный код.')

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


# ==========================================
# СЕРИАЛИЗАТОРЫ ДЛЯ СОТРУДНИКОВ
# ==========================================

class StaffLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate

        email = attrs['email'].lower()
        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=attrs['password'],
        )
        if user is None:
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Аккаунт заблокирован.')
        if user.role == User.Role.STUDENT:
            raise serializers.ValidationError('Неверный email или пароль.')

        attrs['_user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['_user']

        if not user.totp_confirmed:
            secret = user.totp_secret or generate_secret()
            user.totp_secret = secret
            user.save(update_fields=['totp_secret'])
            return user, 'setup'

        return user, 'verify'


class StaffTOTPSetupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs['email'].lower()
        code = attrs['code'].strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный код.')
            
        if user.role == User.Role.STUDENT:
            raise serializers.ValidationError('Неверный код.')
        if user.totp_confirmed:
            raise serializers.ValidationError('TOTP уже подтверждён.')
            
        if not user.totp_secret:
            raise serializers.ValidationError('Сначала пройдите вход.')

        if not verify_code(user.totp_secret, code):
            raise serializers.ValidationError('Неверный код.')

        attrs['_user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['_user']
        user.totp_confirmed = True
        user.save(update_fields=['totp_confirmed'])
        return user


class StaffTOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs['email'].lower()
        code = attrs['code'].strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный код.')
            
        if user.role == User.Role.STUDENT or not user.totp_confirmed:
            raise serializers.ValidationError('Неверный код.')
            
        if not verify_code(user.totp_secret, code):
            raise serializers.ValidationError('Неверный код.')

        attrs['_user'] = user
        return attrs

    def create(self, validated_data):
        return validated_data['_user']