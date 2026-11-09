from django.shortcuts import render

# Create your views here.
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import MealLog, QRSession
from .permissions import IsStaffForQR
from .serializers import QRSessionCreateSerializer, QRSessionSerializer


def today_issued_count() -> int:
    """Сколько порций выдано сегодня."""
    today = timezone.localdate()
    return MealLog.objects.filter(issued_at__date=today).count()


class QRSessionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def post(self, request):
        serializer = QRSessionCreateSerializer(
            data={}, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.save()

        return Response(
            {
                **QRSessionSerializer(session).data,
                'issued_today': today_issued_count(),
            },
            status=status.HTTP_201_CREATED,
        )


class TodayStatsView(APIView):
    """Счётчик для автообновления на планшете."""
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def get(self, request):
        return Response({
            'issued_today': today_issued_count(),
            'server_time': timezone.now(),
        })