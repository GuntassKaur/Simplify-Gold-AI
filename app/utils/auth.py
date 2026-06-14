import base64
import hmac
import hashlib
import json
import time
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

# Use a static secret key or load from environment
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "simplify-money-super-secret-key-123456789")

security = HTTPBearer(auto_error=False)

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 (pure python, highly secure, no external dependencies)."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its PBKDF2-HMAC-SHA256 hash."""
    if not hashed_password:
        return False
    try:
        salt_hex, key_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

def create_access_token(data: dict, expires_in_seconds: int = 86400) -> str:
    """Generate a standard HS256 JWT token without external dependencies."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_seconds
    
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    unsigned_token = base64url_encode(header_json) + "." + base64url_encode(payload_json)
    signature = hmac.new(SECRET_KEY.encode('utf-8'), unsigned_token.encode('utf-8'), hashlib.sha256).digest()
    
    return unsigned_token + "." + base64url_encode(signature)

def verify_access_token(token: str) -> dict:
    """Decode and verify an HS256 JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
            
        unsigned_token = parts[0] + "." + parts[1]
        signature = base64url_decode(parts[2])
        
        expected_signature = hmac.new(SECRET_KEY.encode('utf-8'), unsigned_token.encode('utf-8'), hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected_signature):
            return None
            
        payload = json.loads(base64url_decode(parts[1]).decode('utf-8'))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Dependency to retrieve the currently authenticated user using Bearer Token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
