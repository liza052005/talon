from django.urls import path

from .views import (
    MealConfirmView, QRSessionCreateView, QRScanView, TodayStatsView,
    StudentStatusView, StudentUploadView, ReportSummaryView, ReportExportView,
)


urlpatterns = [
    path('qr/sessions/', QRSessionCreateView.as_view(), name='qr-session-create'),
    path('qr/scan/', QRScanView.as_view(), name='qr-scan'),
    path('qr/stats/today/', TodayStatsView.as_view(), name='qr-stats-today'),
    path('meals/confirm/', MealConfirmView.as_view(), name='meal-confirm'),
    path('students/me/status/', StudentStatusView.as_view(), name='student-status'),
    path('students/upload/', StudentUploadView.as_view(), name='students-upload'),
  path('reports/summary/', ReportSummaryView.as_view(), name='report-summary'),
    path('reports/export/', ReportExportView.as_view(), name='report-export'),
]