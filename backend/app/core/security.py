import hmac
import hashlib
import json
import math
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from app.core.config import settings

# Argon2id password hasher with secure parameters
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,
    parallelism=1,
    hash_len=32,
    type=Type.ID
)

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def check_password_needs_rehash(hashed_password: str) -> bool:
    """Determines whether password hash parameters should be updated."""
    try:
        return ph.check_needs_rehash(hashed_password)
    except Exception:
        return False

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": settings.APP_NAME,
        "type": "access"
    })
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Creates a signed JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": settings.APP_NAME,
        "type": "refresh"
    })
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.APP_NAME
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None

def generate_secure_otp(length: int = 6) -> str:
    """Generates a cryptographically strong numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))

def hash_otp(otp: str, salt: str = "") -> str:
    """Hashes an OTP with SHA256 and optional salt."""
    key = (settings.APP_SECRET_KEY + salt).encode("utf-8")
    return hmac.new(key, otp.encode("utf-8"), hashlib.sha256).hexdigest()

def create_signed_qr_token(
    lecture_session_id: int,
    teacher_id: int,
    expires_in_minutes: int = 30
) -> Tuple[str, datetime]:
    """
    Creates an HMAC-signed, tamper-proof, expiring QR token.
    Contains session ID, expiration timestamp, and nonce.
    Never exposes sensitive student information.
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_in_minutes)
    nonce = secrets.token_hex(8)

    payload = {
        "sid": lecture_session_id,
        "tid": teacher_id,
        "exp": int(expires_at.timestamp()),
        "iat": int(now.timestamp()),
        "nonce": nonce
    }
    payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    signature = hmac.new(
        settings.APP_SECRET_KEY.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    token_data = {
        "p": payload,
        "s": signature
    }
    # Encoded into a clean JSON string for QR serialization
    return json.dumps(token_data, separators=(',', ':')), expires_at

def verify_signed_qr_token(token_str: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Verifies the HMAC signature and expiration of a QR token.
    Returns (is_valid, payload, error_message).
    """
    try:
        data = json.loads(token_str)
        payload = data.get("p")
        signature = data.get("s")

        if not payload or not signature:
            return False, None, "Malformed QR token structure."

        payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        expected_sig = hmac.new(
            settings.APP_SECRET_KEY.encode("utf-8"),
            payload_str.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            return False, None, "Invalid QR token signature or tamper detected."

        now_ts = int(datetime.now(timezone.utc).timestamp())
        if now_ts > payload.get("exp", 0):
            return False, None, "QR code has expired. Please ask the teacher to refresh."

        return True, payload, "Valid QR token."
    except json.JSONDecodeError:
        return False, None, "Invalid QR token format."
    except Exception as e:
        return False, None, f"QR verification error: {str(e)}"

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two GPS coordinates in meters
    using the Haversine formula.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

def verify_gps_geofence(
    student_lat: float,
    student_lon: float,
    accuracy: float,
    target_lat: float,
    target_lon: float,
    allowed_radius: float,
    accuracy_threshold: float = 50.0
) -> Tuple[bool, float, str]:
    """
    Checks if student's reported coordinates fall within the institute geofence.
    Enforces device GPS accuracy thresholds.
    """
    if accuracy > accuracy_threshold:
        return False, 0.0, f"GPS accuracy ({accuracy:.1f}m) is too poor. Threshold is {accuracy_threshold}m."

    distance = calculate_haversine_distance(student_lat, student_lon, target_lat, target_lon)
    if distance > allowed_radius:
        return False, distance, f"Location is outside campus perimeter ({distance:.1f}m from center; max {allowed_radius}m)."

    return True, distance, "Within campus geofence boundary."
