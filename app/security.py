
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.config import settings

import secrets


password_hasher = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12


def hash_password(password: str) -> str:
    """Store only a password hash, never the original password."""
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its stored hash."""
    return password_hasher.verify(password, hashed_password)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[JWT_ALGORITHM],
        )
        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.isdigit():
            return None

        return int(subject)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        return None

def create_csrf_token() -> str:
    return jwt.encode(
        {
            "csrf": secrets.token_urlsafe(32),
            "purpose": "csrf",
        },
        settings.jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


def verify_csrf_token(token: str) -> bool:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[JWT_ALGORITHM],
        )
        return (
            payload.get("purpose") == "csrf"
            and isinstance(payload.get("csrf"), str)
        )
    except jwt.InvalidTokenError:
        return False
