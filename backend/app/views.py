import json
import re
import hashlib
import secrets
import hmac
import base64
import time
from datetime import datetime
from django.conf import settings

from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .json_db import (
    get_users, get_user_by_username, get_user_by_email,
    add_user, add_feedback, add_test_result, read_db, write_db
)
from .captcha_data import generate_captcha_challenge, verify_captcha, get_captcha_session

# ========== PASSWORD HASHING ==========

def hash_password(password):
    """Simple SHA-256 hash with salt for demo purposes."""
    salt = "smriti_salt_2025"
    return hashlib.sha256((password + salt).encode()).hexdigest()


def verify_password(stored_hash, password):
    """Verify a password against its hash."""
    return stored_hash == hash_password(password)


def generate_token():
    """Generate a random auth token."""
    return secrets.token_urlsafe(32)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_jwt(payload, expires_in_seconds=60 * 60 * 24):
    """Create a compact JWT (HS256)."""
    now = int(time.time())
    claims = {
        **payload,
        "iat": now,
        "exp": now + expires_in_seconds,
    }
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_jwt(token):
    """Verify HS256 JWT and return claims or None."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(signature_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        exp = int(payload.get("exp", 0))
        if exp and int(time.time()) > exp:
            return None
        return payload
    except Exception:
        return None


def get_bearer_token(request):
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:].strip()


# ========== VALIDATION HELPERS ==========

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_username(username):
    """Validate username: 3-20 chars, alphanumeric + underscore."""
    if not username:
        return False, "Username is required"
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 20:
        return False, "Username must be at most 20 characters"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    return True, ""


def validate_password(password):
    """Validate password strength."""
    if not password:
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password must be at most 128 characters"
    return True, ""


# ========== USER AUTHENTICATION ==========

@api_view(['POST'])
def register(request):
    """
    Register a new user with validation.
    Stores user in JSON database.
    """
    data = request.data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirmPassword', password)

    errors = {}

    # Validate username
    valid, msg = validate_username(username)
    if not valid:
        errors['username'] = msg
    elif get_user_by_username(username):
        errors['username'] = "Username already exists"

    # Validate email
    if not email:
        errors['email'] = "Email is required"
    elif not validate_email(email):
        errors['email'] = "Invalid email format"
    elif get_user_by_email(email):
        errors['email'] = "Email already registered"

    # Validate password
    valid, msg = validate_password(password)
    if not valid:
        errors['password'] = msg
    elif password != confirm_password:
        errors['confirmPassword'] = "Passwords do not match"

    if errors:
        return Response({"errors": errors}, status=400)

    # Create user
    user = {
        "id": secrets.token_hex(8),
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.now().isoformat(),
        "is_admin": False
    }

    add_user(user)
    jwt_token = create_jwt(
        {
            "sub": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": "participant",
        }
    )

    return Response({
        "message": "Account created successfully",
        "jwt": jwt_token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }, status=201)


@api_view(['POST'])
def login(request):
    """
    Login a user against JSON database.
    Returns auth token on success.
    """
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=400
        )

    user = get_user_by_username(username)
    if not user:
        return Response(
            {"error": "Invalid username or password"},
            status=401
        )

    if not verify_password(user["password_hash"], password):
        return Response(
            {"error": "Invalid username or password"},
            status=401
        )

    # Generate legacy token + JWT
    token = generate_token()
    jwt_token = create_jwt(
        {
            "sub": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": "participant",
        }
    )
    user["token"] = token
    user["jwt"] = jwt_token
    user["last_login"] = datetime.now().isoformat()

    # Update in DB
    db = read_db()
    for i, u in enumerate(db["users"]):
        if u["id"] == user["id"]:
            db["users"][i] = user
            break
    write_db(db)

    return Response({
        "message": "Login successful",
        "token": token,
        "jwt": jwt_token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    })


@api_view(['POST'])
def admin_login(request):
    """
    Admin login with hardcoded credentials.
    username: admin, password: awdx1234
    """
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if username == "admin" and password == "awdx1234":
        token = generate_token()
        jwt_token = create_jwt(
            {
                "sub": "admin",
                "username": "admin",
                "email": "",
                "role": "admin",
            }
        )
        return Response({
            "message": "Admin login successful",
            "token": token,
            "jwt": jwt_token,
            "user": {
                "username": "admin",
                "role": "admin"
            }
        })

    return Response(
        {"error": "Invalid admin credentials"},
        status=401
    )


@api_view(['GET'])
def get_all_users(request):
    """Get all registered users (admin endpoint)."""
    users = get_users()
    # Don't return password hashes
    safe_users = []
    for u in users:
        safe_users.append({
            "id": u.get("id"),
            "username": u.get("username"),
            "email": u.get("email"),
            "created_at": u.get("created_at"),
            "is_admin": u.get("is_admin", False)
        })
    return Response({"users": safe_users})


# ========== FEEDBACK ==========

@api_view(['POST'])
def submit_feedback(request):
    """
    Submit feedback. Stored in JSON format.
    """
    data = request.data

    feedback_entry = {
        "id": secrets.token_hex(8),
        "ratings": data.get('ratings', {}),
        "comments": data.get('comments', {}),
        "submitted_at": datetime.now().isoformat(),
        "user_agent": request.META.get('HTTP_USER_AGENT', ''),
    }

    add_feedback(feedback_entry)

    return Response({
        "message": "Feedback submitted successfully",
        "feedback_id": feedback_entry["id"]
    })


@api_view(['GET'])
def get_all_feedback(request):
    """Get all feedback entries (admin endpoint)."""
    db = read_db()
    return Response({"feedback": db["feedback"]})


# ========== CAPTCHA IMAGE TEST ==========

@api_view(['GET'])
def captcha_challenge(request):
    """
    Generate a new CAPTCHA challenge.
    Returns a grid of images with a target category.
    """
    challenge = generate_captcha_challenge()
    return Response(challenge)


@api_view(['POST'])
def captcha_verify(request):
    """
    Verify a CAPTCHA submission.
    Expects: { session_id, selected_indices }
    """
    data = request.data
    session_id = data.get('session_id')
    selected_indices = data.get('selected', [])

    if not session_id:
        return Response({"error": "Session ID required"}, status=400)

    result = verify_captcha(session_id, selected_indices)
    return Response(result)


# ========== TEST RESULTS ==========

@api_view(['POST'])
def save_result(request):
    """
    Save a test result.
    Expects at minimum: { score, total, test_type, username }

    For Number Memory Test we may also receive:
      - attempts
      - correctCount
      - wrongCount
      - digit_span_max
    """
    data = request.data

    result = {
        "id": secrets.token_hex(8),
        "score": data.get('score', 0),
        "total": data.get('total', 10),
        "test_type": data.get('test_type', 'captcha'),
        "username": data.get('username', 'anonymous'),
        "attempts": data.get('attempts'),
        "correctCount": data.get('correctCount'),
        "wrongCount": data.get('wrongCount'),
        "digit_span_max": data.get('digit_span_max'),
        "submitted_at": datetime.now().isoformat()
    }


    add_test_result(result)

    return Response({
        "message": "Result saved",
        "result": result
    })


@api_view(['GET'])
def get_results(request):
    """Get all test results."""
    db = read_db()
    return Response({"results": db["test_results"]})


@api_view(['GET'])
def get_my_results(request):
    """Get test results for a specific username.

    Query params:
      - username (required)
    """
    username = request.query_params.get("username")
    if not username:
        return Response({"error": "username query param is required"}, status=400)

    db = read_db()
    filtered = [
        r for r in db.get("test_results", [])
        if r.get("username") == username
    ]

    return Response({"results": filtered})


@api_view(['GET'])
def get_my_profile(request):
    """Get profile details from JWT bearer token."""
    token = get_bearer_token(request)
    if not token:
        return Response({"error": "Authorization Bearer token required"}, status=401)

    claims = verify_jwt(token)
    if not claims:
        return Response({"error": "Invalid or expired JWT token"}, status=401)

    role = claims.get("role", "participant")
    username = claims.get("username")

    if role == "admin":
        return Response(
            {
                "profile": {
                    "id": "admin",
                    "username": "admin",
                    "email": "",
                    "role": "admin",
                }
            }
        )

    user = get_user_by_username(username or "")
    if not user:
        return Response({"error": "User not found"}, status=404)

    return Response(
        {
            "profile": {
                "id": user.get("id"),
                "username": user.get("username"),
                "email": user.get("email", ""),
                "role": "participant",
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login"),
            }
        }
    )



# ========== HEALTH CHECK ==========

@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint."""
    return Response({
        "status": "ok",
        "service": "Smriti Backend",
        "database": "json"
    })

