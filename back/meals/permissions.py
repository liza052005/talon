from rest_framework.permissions import BasePermission

from core.models import User


STAFF_ROLES = {User.Role.CANTEEN, User.Role.MODERATOR, User.Role.ADMIN}


class IsStaffForQR(BasePermission):
    """Только сотрудники могут создавать QR-сессии."""
    message = 'Недостаточно прав.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in STAFF_ROLES
        )