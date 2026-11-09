from django.urls import path

from .views import QRSessionCreateView, TodayStatsView

urlpatterns = [
    path('qr/sessions/', QRSessionCreateView.as_view(), name='qr-session-create'),
    path('qr/stats/today/', TodayStatsView.as_view(), name='qr-stats-today'),
]