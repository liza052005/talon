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


import pyotp
import time
import pyotp
import time

def verify_code(secret: str, code: str, valid_window: int = 5) -> bool:
    if not secret or not code:
        return False
    
    # Очищаем секрет от возможных пробелов
    clean_secret = str(secret).strip()
    
    totp = pyotp.TOTP(clean_secret)
    
    # Явно передаем текущее время в секундах (UNIX time)
    current_time = int(time.time())
    
    # Проверяем код с большим окном погрешности (5 * 30 = 150 секунд)
    return totp.verify(str(code).strip(), for_time=current_time, valid_window=valid_window)