from rest_framework import serializers

from core.models import QRSession


class QRSessionCreateSerializer(serializers.Serializer):
    """Создание новой QR-сессии сотрудником. Тело пустое."""

    def create(self, validated_data):
        from django.conf import settings
        from django.utils import timezone
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

from django.utils import timezone

from core.models import StudentProfile


DENY_MESSAGE = 'К сожалению, вам питание не доступно.'


class QRScanSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, attrs):
        request = self.context['request']
        user = request.user

        # Студент должен иметь профиль
        try:
            profile = user.student_profile
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError(DENY_MESSAGE)

        # Атомарно: блокируем строку профиля, чтобы двойной клик не прошёл
        from django.db import transaction
        with transaction.atomic():
            profile = (
                StudentProfile.objects
                .select_for_update()
                .get(pk=profile.pk)
            )

            # 1. Токен существует и валиден
            try:
                session = QRSession.objects.get(token=attrs['token'])
            except QRSession.DoesNotExist:
                raise serializers.ValidationError(DENY_MESSAGE)

            # 2. Не истёк
            if session.expires_at <= timezone.now():
                raise serializers.ValidationError(DENY_MESSAGE)

            # 3. Не использован
            if session.used:
                raise serializers.ValidationError(DENY_MESSAGE)

            # 4. Студент уже получил питание сегодня
            if profile.status_today == 'issued':
                raise serializers.ValidationError(DENY_MESSAGE)

            # 5. Студент уже сканировал сегодня
            if profile.token_used_today:
                raise serializers.ValidationError(DENY_MESSAGE)

            # 6. Группа активна
            if not profile.group.is_active:
                raise serializers.ValidationError(DENY_MESSAGE)

            # 7. Право на питание
            candidate = profile.candidate
            if not candidate.is_budget or not candidate.categories.exists():
                raise serializers.ValidationError(DENY_MESSAGE)

            # --- Успех: привязываем токен к студенту ---
            profile.current_qr_session = session
            profile.token_assigned_at = timezone.now()
            profile.token_used_today = True
            profile.save(update_fields=[
                'current_qr_session', 'token_assigned_at', 'token_used_today',
            ])

        attrs['_profile'] = profile
        attrs['_session'] = session
        return attrs

    def create(self, validated_data):
        return validated_data['_profile']

from core.models import MealLog


class MealConfirmSerializer(serializers.Serializer):
    """Подтверждение питания. Тело пустое, студент берётся из JWT."""

    def validate(self, attrs):
        request = self.context['request']
        user = request.user

        try:
            profile_id = user.student_profile.pk
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError(DENY_MESSAGE)

        from django.db import transaction
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
            from django.conf import settings
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