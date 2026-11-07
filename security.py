"""Session handling, CSRF protection and route guards."""

import functools
import hmac
import re
import secrets

from flask import g, jsonify, redirect, request, session, url_for

from .db import user_by_id

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$")


def csrf_token():
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token


def protect_requests():
    """Reject any state-changing request without a matching session CSRF token."""
    if request.method in SAFE_METHODS:
        return None
    supplied = request.headers.get("X-CSRFToken") or request.form.get("csrf_token") or ""
    expected = session.get("csrf_token", "")
    if not expected or not hmac.compare_digest(str(supplied), str(expected)):
        if request.path.startswith("/api/"):
            return jsonify(error="Your session security token expired. Reload the page and try again."), 400
        return redirect(url_for("main.login"))
    return None


def load_user():
    g.user = None
    user_id = session.get("uid")
    if user_id:
        row = user_by_id(user_id)
        if row is None:
            session.pop("uid", None)
        else:
            g.user = dict(row)


def current_user():
    return getattr(g, "user", None)


def sign_in(user_id):
    session.clear()
    session["uid"] = user_id
    session["csrf_token"] = secrets.token_urlsafe(32)
    session.permanent = True


def sign_out():
    session.clear()


def login_required(view):
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            if request.path.startswith("/api/"):
                return jsonify(error="Sign in or start a demo workspace to use this feature."), 401
            return redirect(url_for("main.login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def valid_email(value):
    return bool(EMAIL_RE.match(value or "")) and len(value) <= 180


def password_problem(password):
    if not password or len(password) < 8:
        return "Use a password of at least 8 characters."
    if len(password) > 200:
        return "That password is too long."
    if password.isdigit() or password.isalpha():
        return "Mix letters with numbers or symbols."
    return None