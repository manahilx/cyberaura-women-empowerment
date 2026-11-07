"""CYBERAURA application factory."""

import os
import secrets
from datetime import timedelta

from flask import Flask, jsonify, render_template, request

from .db import init_db
from .security import csrf_token, current_user, load_user, protect_requests

NAV = [
    ("main.index", "Home", "home"),
    ("main.dashboard", "Dashboard", "dashboard"),
    ("main.threat", "Threat Analysis", "threat"),
    ("main.vault", "Evidence Vault", "vault"),
    ("main.response", "Response Center", "response"),
    ("main.privacy", "Privacy Check", "privacy"),
    ("main.resources", "Resources", "resources"),
    ("main.community", "Community", "community"),
    ("main.about", "About", "about"),
]


def _secret_key(instance_path):
    configured = os.environ.get("CYBERAURA_SECRET_KEY")
    if configured:
        return configured
    path = os.path.join(instance_path, "secret_key")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read().strip()
    os.makedirs(instance_path, exist_ok=True)
    key = secrets.token_hex(32)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(key)
    return key


def create_app():
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
        instance_relative_config=True,
    )
    app.config.update(
        SECRET_KEY=_secret_key(app.instance_path),
        DATABASE=os.environ.get("CYBERAURA_DATABASE", os.path.join(app.instance_path, "cyberaura.sqlite3")),
        MAX_CONTENT_LENGTH=1 * 1024 * 1024,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("CYBERAURA_SECURE_COOKIE", "0") == "1",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
        TEMPLATES_AUTO_RELOAD=True,
    )

    init_db(app)

    from .routes import main
    app.register_blueprint(main)

    app.before_request(load_user)
    app.before_request(protect_requests)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'",
        )
        if request.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response

    @app.context_processor
    def inject_globals():
        from .analysis import ai_configured
        return {
            "nav_items": NAV,
            "csrf_token": csrf_token(),
            "current_user": current_user(),
            "ai_enabled": ai_configured(),
        }

    @app.errorhandler(404)
    def not_found(_error):
        if request.path.startswith("/api/"):
            return jsonify(error="Not found."), 404
        return render_template("error.html", page="error", code=404,
                               title="Page not found",
                               message="The page you asked for is not part of CYBERAURA."), 404

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify(error="That request is too large. Evidence files stay in your browser and are never uploaded."), 413

    @app.errorhandler(500)
    def server_error(_error):
        if request.path.startswith("/api/"):
            return jsonify(error="Something went wrong on the server. Please try again."), 500
        return render_template("error.html", page="error", code=500,
                               title="Something went wrong",
                               message="An unexpected error occurred. Your local evidence was not affected."), 500

    return app