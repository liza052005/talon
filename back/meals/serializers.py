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