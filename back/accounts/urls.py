from django.urls import path
from .views import (
    LoginView, MeView, StudentRegisterView, Verify2FAView,
)

urlpatterns = [
    path('register/', StudentRegisterView.as_view(), name='student-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-2fa/', Verify2FAView.as_view(), name='verify-2fa'),
    path('me/', MeView.as_view(), name='me'),
]