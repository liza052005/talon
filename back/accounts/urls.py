from django.urls import path

from .views import (
    LoginView, MeView, StaffLoginView, StaffTOTPSetupView,
    StaffTOTPVerifyView, StudentRegisterView, Verify2FAView,
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

    # общее
    path('me/', MeView.as_view(), name='me'),
]