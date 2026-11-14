from django.urls import path

from .views import (
    LoginView, MeView, StaffLoginView, StaffTOTPSetupView,
    StaffTOTPVerifyView, StudentRegisterView, Verify2FAView, StaffListCreateView, StaffDetailView, StaffResetTOTPView,
)

urlpatterns = [
    # студент
    path('register/', StudentRegisterView.as_view(), name='student-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-2fa/', Verify2FAView.as_view(), name='verify-2fa'),

    # сотрудник
    path('staff/login/', StaffLoginView.as_view(), name='staff-login'),
    path('staff/totp-setup/', StaffTOTPSetupView.as_view(), name='staff-totp-setup'),
    path('staff/verify-totp/', StaffTOTPVerifyView.as_view(), name='staff-verify-totp'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
      path('staff/<int:pk>/reset-totp/', StaffResetTOTPView.as_view(), name='staff-reset-totp'),

    # общее
    path('me/', MeView.as_view(), name='me'),
]