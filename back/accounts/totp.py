import pyotp
from django.conf import settings


def build_totp(secret: str) -> pyotp.TOTP:
    return pyotp.TOTP(secret)


def generate_secret() -> str:
    return pyotp.random_base32()


def provisioning_uri(secret: str, email: str) -> str:
    """otpauth://-ссылка — её можно вставить в Google Authenticator вручную."""
    return pyotp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name='TALON',
    )


def verify_code(secret: str, code: str, valid_window: int = 1) -> bool:
    """valid_window=1 допускает ±30 секунд (часы на телефоне могут отставать)."""
    if not secret or not code:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=valid_window)