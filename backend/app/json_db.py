"""
JSON Database Helper Module
Handles read/write operations for the JSON-based database.
"""

import json
import os
from pathlib import Path
import threading

# Thread-safe lock for file operations
_db_lock = threading.Lock()

DB_PATH = Path(__file__).resolve().parent.parent / "db.json"


def _ensure_db():
    """Ensure the JSON database file exists with proper structure."""
    if not DB_PATH.exists():
        default_data = {
            "users": [],
            "feedback": [],
            "test_results": [],
            "captcha_sessions": []
        }
        with open(DB_PATH, "w") as f:
            json.dump(default_data, f, indent=2)


def read_db():
    """Read the entire JSON database."""
    _ensure_db()
    with _db_lock:
        with open(DB_PATH, "r") as f:
            return json.load(f)


def write_db(data):
    """Write the entire JSON database."""
    with _db_lock:
        with open(DB_PATH, "w") as f:
            json.dump(data, f, indent=2)


# ---------------- USERS ----------------

def get_users():
    """Get all users."""
    return read_db()["users"]


def get_user_by_username(username):
    """Find a user by username (case-insensitive)."""
    users = get_users()
    for user in users:
        if user["username"].lower() == username.lower():
            return user
    return None


def get_user_by_email(email):
    """Find a user by email (case-insensitive)."""
    users = get_users()
    for user in users:
        if user["email"].lower() == email.lower():
            return user
    return None


def add_user(user_data):
    """Add a new user to the database."""
    db = read_db()
    db["users"].append(user_data)
    write_db(db)
    return user_data


# ---------------- FEEDBACK ----------------

def get_feedback():
    """Get all feedback entries."""
    return read_db()["feedback"]


def add_feedback(feedback_data):
    """Add a new feedback entry."""
    db = read_db()
    db["feedback"].append(feedback_data)
    write_db(db)
    return feedback_data


# ---------------- TEST RESULTS ----------------

def get_test_results():
    """Get all test results."""
    return read_db()["test_results"]



def add_test_result(result_data):
    """Add a new test result."""
    db = read_db()
    db["test_results"].append(result_data)
    write_db(db)
    return result_data


# ---------------- CAPTCHA SESSIONS ----------------

def get_captcha_sessions():
    """Get all CAPTCHA sessions."""
    return read_db()["captcha_sessions"]


def add_captcha_session(session_data):
    """Add a new CAPTCHA session."""
    db = read_db()
    db["captcha_sessions"].append(session_data)
    write_db(db)
    return session_data


def clear_old_captcha_sessions(max_count=100):
    """Keep only the most recent CAPTCHA sessions to prevent bloat."""
    db = read_db()
    if len(db["captcha_sessions"]) > max_count:
        db["captcha_sessions"] = db["captcha_sessions"][-max_count:]
        write_db(db)

