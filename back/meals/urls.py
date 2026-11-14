from django.urls import path

from .views import (
    MealConfirmView, QRSessionCreateView, QRScanView, TodayStatsView,
    StudentStatusView, StudentUploadView, ReportSummaryView, ReportExportView,QRStatsMonthView,AdminResetStudentView, 
    AdminStudentListView, AdminStudentCreateView,  AdminMealLogsView,AdminGroupDetailView,
      AdminGroupListView, AdminCategoryDetailView, AdminCategoryListView, AdminStudentDetailView
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
    path('qr/stats/month/', QRStatsMonthView.as_view(), name='qr-stats-month'),
     path('admin/students/', AdminStudentListView.as_view(), name='admin-students'),
    path('admin/students/<int:pk>/reset/', AdminResetStudentView.as_view(), name='admin-student-reset'),
        path('admin/students/', AdminStudentListView.as_view(), name='admin-students'),
    path('admin/students/create/', AdminStudentCreateView.as_view(), name='admin-student-create'),
    
    path('admin/students/<str:pk>/reset/', AdminResetStudentView.as_view(), name='admin-student-reset'),
    path('admin/meal-logs/', AdminMealLogsView.as_view(), name='admin-meal-logs'),
    path('admin/groups/', AdminGroupListView.as_view(), name='admin-groups'),
path('admin/groups/<int:pk>/', AdminGroupDetailView.as_view(), name='admin-group-detail'),
path('admin/categories/', AdminCategoryListView.as_view(), name='admin-categories'),
path('admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
path('admin/meal-logs/', AdminMealLogsView.as_view(), name='admin-meal-logs'),
path('admin/students/<str:pk>/', AdminStudentDetailView.as_view()),
]