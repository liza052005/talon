from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from core.models import QRSession, StudentProfile, MealLog

DENY_MESSAGE = 'К сожалению, вам питание не доступно.'


class QRSessionCreateSerializer(serializers.Serializer):
    """Создание новой QR-сессии сотрудником. Тело пустое."""

    def create(self, validated_data):
        import secrets
        user = self.context['request'].user
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(
            seconds=settings.QR_TOKEN_TTL_SECONDS
        )
        return QRSession.objects.create(
            token=token,
            created_by=user,
            expires_at=expires_at,
        )


class QRSessionSerializer(serializers.ModelSerializer):
    """Ответ планшету: токен + срок жизни."""
    class Meta:
        model = QRSession
        fields = ('token', 'expires_at', 'created_at')
        read_only_fields = fields


class QRScanSerializer(serializers.Serializer):
    """Сканирование QR студентом."""
    token = serializers.CharField()

    def validate(self, attrs):
        request = self.context['request']
        user = request.user

        # Студент должен иметь профиль
        try:
            profile = user.student_profile
        except StudentProfile.DoesNotExist:
            print("ОШИБКА 0: У пользователя нет профиля студента")
            raise serializers.ValidationError(DENY_MESSAGE)

        with transaction.atomic():
            profile = (
                StudentProfile.objects
                .select_for_update()
                .select_related('group', 'candidate')
                .get(pk=profile.pk)
            )

            # 1. Токен существует
            try:
                session = QRSession.objects.get(token=attrs['token'])
            except QRSession.DoesNotExist:
                print("ОШИБКА 1: Токен вообще не найден в базе")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 2. Не истёк
            if session.expires_at <= timezone.now():
                print(f"ОШИБКА 2: Токен истек. Время истечения: {session.expires_at}, Сейчас: {timezone.now()}")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 3. Не использован
            if session.used:
                print("ОШИБКА 3: Токен уже использован (used=True)")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 4. Не зарезервирован другим
            if session.reserved_by_id and session.reserved_by_id != profile.id:
                print(f"ОШИБКА 4: Токен зарезервирован другим студентом (ID: {session.reserved_by_id})")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 5. Студент уже получил питание
            if profile.status_today == 'issued':
                print("ОШИБКА 5: Студент уже получил питание сегодня (status_today='issued')")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 6. Студент уже сканировал
            if profile.token_used_today:
                print("ОШИБКА 6: Студент уже сканировал сегодня (token_used_today=True)")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 7. Группа активна
            if not profile.group.is_active:
                print("ОШИБКА 7: Группа студента не активна (на практике)")
                raise serializers.ValidationError(DENY_MESSAGE)

            # 8. Право на питание
            candidate = profile.candidate
            if not candidate.is_budget or not candidate.categories.exists():
                print(f"ОШИБКА 8: Нет права на питание. Бюджет: {candidate.is_budget}, Категорий: {candidate.categories.count()}")
                raise serializers.ValidationError(DENY_MESSAGE)

            # --- Успех: привязываем токен к студенту ---
            profile.current_qr_session = session
            profile.token_assigned_at = timezone.now()
            profile.token_used_today = True
            profile.save(update_fields=[
                'current_qr_session', 'token_assigned_at', 'token_used_today',
            ])

            session.reserved_by = profile
            session.save(update_fields=['reserved_by'])
            
            print("УСПЕХ: Токен успешно привязан к студенту")

        attrs['_profile'] = profile
        attrs['_session'] = session
        return attrs

    def create(self, validated_data):
        return validated_data['_profile']


class MealConfirmSerializer(serializers.Serializer):
    """Подтверждение питания. Тело пустое, студент берется из JWT."""

    def validate(self, attrs):
        request = self.context['request']
        user = request.user

        try:
            profile_id = user.student_profile.pk
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError(DENY_MESSAGE)

        with transaction.atomic():
            profile = (
                StudentProfile.objects
                .select_for_update()
                .select_related('current_qr_session', 'group', 'candidate')
                .get(pk=profile_id)
            )

            # Уже получил — отказ
            if profile.status_today == 'issued':
                raise serializers.ValidationError(DENY_MESSAGE)

            # Нет активной привязки токена — отказ
            session = profile.current_qr_session
            if session is None:
                raise serializers.ValidationError(DENY_MESSAGE)

            # Проверка таймаута: если с привязки прошло больше 10 минут — отказ
            if (
                profile.token_assigned_at is None
                or timezone.now() - profile.token_assigned_at
                > timezone.timedelta(seconds=settings.QR_ASSIGNMENT_TIMEOUT_SECONDS)
            ):
                raise serializers.ValidationError(DENY_MESSAGE)

            # Токен не должен быть уже использован
            if session.used:
                raise serializers.ValidationError(DENY_MESSAGE)

            # --- Успех: фиксируем выдачу ---
            session.used = True
            session.used_at = timezone.now()
            session.used_by = profile
            session.save(update_fields=['used', 'used_at', 'used_by'])

            profile.status_today = 'issued'
            profile.save(update_fields=['status_today'])

            MealLog.objects.create(student=profile, qr_session=session)

        attrs['_profile'] = profile
        attrs['_session'] = session
        return attrs

    def create(self, validated_data):
        return validated_data['_profile']