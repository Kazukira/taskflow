
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, UserResponse
from app.security import (
    create_access_token,
    create_csrf_token,
    decode_access_token,
    hash_password,
    verify_csrf_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "taskflow_access_token"
CSRF_COOKIE_NAME = "taskflow_csrf_token"
COOKIE_SECURE = False  # Set True when deployed behind HTTPS.

cookie_scheme = APIKeyCookie(name=COOKIE_NAME, auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_csrf(
    x_csrf_token: str | None = Header(default=None, alias="X-CSRF-Token"),
):
    if not x_csrf_token or not verify_csrf_token(x_csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing or invalid CSRF token",
        )


def get_current_user(
    token: str | None = Depends(cookie_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return user


def set_auth_cookies(response: Response, user_id: int) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=create_access_token(user_id),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=12 * 60 * 60,
        path="/",
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=create_csrf_token(),
        httponly=False,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=12 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path="/",
        httponly=False,
        secure=COOKIE_SECURE,
        samesite="lax",
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
    _csrf: None = Depends(require_csrf),
):
    existing = db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(email=data.email, hashed_password=hash_password(data.password))
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists") from None

    set_auth_cookies(response, user.id)
    return user


@router.post("/login", response_model=UserResponse)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    _csrf: None = Depends(require_csrf),
):
    user = db.scalar(select(User).where(User.email == data.email))
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    set_auth_cookies(response, user.id)
    return user


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    _user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    clear_auth_cookies(response)


@router.get("/csrf")
def get_csrf_token(response: Response):
    token = create_csrf_token()
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=12 * 60 * 60,
        path="/",
    )
    return {"csrf_token": token}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user
