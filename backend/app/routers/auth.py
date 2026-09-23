import os
import hashlib
import base64
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    import jwt as pyjwt  # PyJWT
    _PYJWT_AVAILABLE = True
except ImportError:
    _PYJWT_AVAILABLE = False
    import hmac
    import json
    import time

from backend.app.database import get_db
from backend.app.models.schemas_v1 import User
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
TOKEN_EXPIRE_SECONDS = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

# ---------------------------------------------------------------------------
# Password hashing — per-user random salt (PBKDF2-SHA256, 260000 iterations)
# Stored format: "salt$hash" (both base64-encoded)
# ---------------------------------------------------------------------------

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Return 'salt$hash' string. Generates a new random salt if not provided."""
    if salt is None:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        260000,
    )
    hash_b64 = base64.b64encode(key).decode("utf-8")
    return f"{salt}${hash_b64}"


def verify_password(plain: str, stored: str) -> bool:
    """Verify a plain password against a stored 'salt$hash' string."""
    if "$" not in stored:
        # Legacy format (static salt) — migrate on next login
        return _legacy_verify(plain, stored)
    salt, _ = stored.split("$", 1)
    return hash_password(plain, salt) == stored


def _legacy_verify(plain: str, stored: str) -> bool:
    """Fallback for old static-salt hashed passwords."""
    old_salt = "ufis_salt"
    key = hashlib.pbkdf2_hmac("sha256", plain.encode(), old_salt.encode(), 100000)
    return base64.b64encode(key).decode() == stored


# ---------------------------------------------------------------------------
# JWT helpers — uses PyJWT when available, falls back to manual HS256
# ---------------------------------------------------------------------------

def create_jwt_token(data: dict, expires_in_seconds: int = TOKEN_EXPIRE_SECONDS) -> str:
    if _PYJWT_AVAILABLE:
        import time
        payload = data.copy()
        payload["exp"] = int(time.time()) + expires_in_seconds
        return pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    else:
        # Manual fallback (correct hmac usage)
        import time, json, hmac as _hmac
        header = {"alg": "HS256", "typ": "JWT"}
        payload = data.copy()
        payload["exp"] = int(time.time()) + expires_in_seconds

        h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        sig_input = f"{h_b64}.{p_b64}"
        # ✅ Correct: hmac.new() signature
        mac = _hmac.new(SECRET_KEY.encode(), sig_input.encode(), hashlib.sha256)
        sig_b64 = base64.urlsafe_b64encode(mac.digest()).decode().rstrip("=")
        return f"{h_b64}.{p_b64}.{sig_b64}"


# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "operator"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    # Allow default demo login fast-path (credentials from settings/env when enabled)
    demo_email = settings.DEMO_EMAIL
    demo_pass  = settings.DEMO_PASSWORD

    if settings.ENABLE_DEMO_LOGIN and req.email == demo_email and req.password == demo_pass:
        if not user:
            user = User(
                email=demo_email,
                hashed_password=hash_password(demo_pass),
                full_name="Control Room Operator",
                role="operator",
                tenant_id=settings.DEFAULT_TENANT_ID,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        # If user exists but used legacy static salt, migrate password hash
        elif "$" not in user.hashed_password:
            user.hashed_password = hash_password(demo_pass)
            db.commit()
    else:
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    token = create_jwt_token({
        "sub": user.user_id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": user.tenant_id,
        },
    )


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    new_user = User(
        email=req.email,
        hashed_password=hash_password(req.password),  # random salt auto-generated
        full_name=req.full_name,
        role=req.role or "operator",
        tenant_id=settings.DEFAULT_TENANT_ID,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_jwt_token({
        "sub": new_user.user_id,
        "email": new_user.email,
        "role": new_user.role,
        "full_name": new_user.full_name,
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": new_user.user_id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "tenant_id": new_user.tenant_id,
        },
    )
