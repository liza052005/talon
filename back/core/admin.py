from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Group, Category, StudentCandidate, StudentProfile,
    QRSession, MealLog, LoginAttempt, VerificationCode,
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Роль и 2FA', {'fields': ('role', 'totp_secret', 'totp_confirmed')}),
    )
    list_display = ('email', 'username', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'username')


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(StudentCandidate)
class StudentCandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'group', 'is_budget', 'is_registered')
    list_filter = ('group', 'is_budget', 'is_registered', 'categories')
    search_fields = ('full_name',)
    filter_horizontal = ('categories',)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'group', 'status_today', 'token_used_today')
    list_filter = ('group', 'status_today', 'token_used_today')
    search_fields = ('full_name',)
    readonly_fields = ('created_at',)


@admin.register(QRSession)
class QRSessionAdmin(admin.ModelAdmin):
    list_display = ('token', 'created_by', 'created_at', 'expires_at', 'used')
    list_filter = ('used',)
    readonly_fields = ('token', 'created_at', 'used_at')


@admin.register(MealLog)
class MealLogAdmin(admin.ModelAdmin):
    list_display = ('student', 'issued_at')
    list_filter = ('issued_at',)
    search_fields = ('student__full_name',)
    readonly_fields = ('student', 'qr_session', 'issued_at')


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('email', 'success', 'ip_address', 'attempted_at')
    list_filter = ('success', 'attempted_at')
    search_fields = ('email', 'ip_address')
    readonly_fields = ('email', 'ip_address', 'user_agent', 'success', 'attempted_at')


@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'expires_at', 'used')
    list_filter = ('used',)
    readonly_fields = ('user', 'code', 'created_at', 'expires_at', 'used')