import hashlib
import hmac
import base64
import json
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.schemas_v1 import User
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "ufis_sih_2026_jwt_secret_key_super_secure")

def hash_password(password: str) -> str:
    salt = "ufis_salt"
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return base64.b64encode(key).decode('utf-8')

def create_jwt_token(data: dict, expires_in_seconds: int = 86400) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_seconds
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signature_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(SECRET_KEY.encode(), signature_input.encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

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

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    # Allow default demo login fast path
    if req.email == "operator@bbmp.gov.in" and req.password == "admin123":
        if not user:
            user = User(
                email="operator@bbmp.gov.in",
                hashed_password=hash_password("admin123"),
                full_name="Control Room Operator",
                role="operator",
                tenant_id=settings.DEFAULT_TENANT_ID
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    elif not user or user.hashed_password != hash_password(req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_jwt_token({
        "sub": user.user_id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    )

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    new_user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role or "operator",
        tenant_id=settings.DEFAULT_TENANT_ID
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_jwt_token({
        "sub": new_user.user_id,
        "email": new_user.email,
        "role": new_user.role,
        "full_name": new_user.full_name
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={
            "user_id": new_user.user_id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "tenant_id": new_user.tenant_id
        }
    )
