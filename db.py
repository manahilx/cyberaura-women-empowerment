"""SQLite persistence for non-sensitive application records.

Deliberately NOT stored here: incident narratives, evidence files, screenshots or
any uploaded material. Evidence lives only in the browser (IndexedDB) and incident
text is processed in memory and discarded. What is stored is metadata: category,
platform, risk band, checklist state, self-assessment answers and activity labels.
"""

import json
import os
import sqlite3
from datetime import datetime, timezone

from flask import current_app, g

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT,
    is_demo       INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS analyses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    platform    TEXT NOT NULL,
    risk_level  TEXT NOT NULL,
    engine      TEXT NOT NULL,
    signals     TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    title       TEXT NOT NULL,
    items       TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assessments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers     TEXT NOT NULL,
    score       INTEGER NOT NULL,
    band        TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activity (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,
    label       TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    role        TEXT NOT NULL,
    message     TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS counters (
    key   TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS hub_challenges (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    category   TEXT NOT NULL,
    platform   TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    is_sample  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hub_suggestions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    category   TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    supports   INTEGER NOT NULL DEFAULT 0,
    shared     INTEGER NOT NULL DEFAULT 1,
    is_sample  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_user ON plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assess_user ON assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at DESC);
"""

# Sample baseline so the impact panel is never empty. Always labelled as demo data.
SAMPLE_COUNTERS = {
    "assessments_completed": 1248,
    "response_plans_generated": 863,
    "integrity_checks_completed": 2107,
    "recommendations_completed": 3492,
    "learning_completed": 671,
}

# Fictional community board seed so the hub is never empty. Labelled as sample in UI.
SAMPLE_SUGGESTIONS = [
    ("Accessibility", "Add Urdu and regional-language safety guides",
     "Many women I work with are more comfortable reading Urdu than English. Beginner guides in Urdu would reach far more people.", 24),
    ("Platform features", "One-tap evidence checklist for impersonation",
     "A pre-filled checklist of exactly what to screenshot when a fake profile appears would save time in a stressful moment.", 18),
    ("Resources & helplines", "List helplines that serve rural areas",
     "Please mark which helplines work outside the big cities and whether they support voice calls for low-literacy users.", 15),
    ("Learning & awareness", "Short video-style lessons for beginners",
     "Step-by-step visual lessons would help women who are new to smartphones follow along without reading long text.", 11),
]
SAMPLE_CHALLENGES = [
    ("Impersonation / fake profiles", "Instagram", "A fake account using my photos contacted my relatives."),
    ("Impersonation / fake profiles", "Facebook", "Someone recreated my profile after I reported the first one."),
    ("Online harassment or threats", "WhatsApp", "Repeated threatening messages from an unknown number."),
    ("Image-based abuse", "Instagram", "A private photo was reposted without my permission."),
    ("Phishing / account compromise", "Email", "I clicked a link and my account was taken over."),
    ("Privacy gaps / data exposure", "Facebook", "My phone number was visible to everyone by default."),
    ("Platform reporting failures", "Instagram", "My impersonation report was rejected twice with no reason."),
]


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"], timeout=10)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rows = cur.fetchall()
    cur.close()
    return (rows[0] if rows else None) if one else rows


def execute(sql, args=()):
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid


def init_db(app):
    os.makedirs(app.instance_path, exist_ok=True)
    with app.app_context():
        db = sqlite3.connect(app.config["DATABASE"])
        db.executescript(SCHEMA)
        for key, value in SAMPLE_COUNTERS.items():
            db.execute("INSERT OR IGNORE INTO counters (key, value) VALUES (?, ?)", (key, value))
        if not db.execute("SELECT 1 FROM hub_suggestions LIMIT 1").fetchone():
            for cat, title, body, supports in SAMPLE_SUGGESTIONS:
                db.execute(
                    "INSERT INTO hub_suggestions (category, title, body, supports, is_sample, created_at) VALUES (?, ?, ?, ?, 1, ?)",
                    (cat, title, body, supports, now_iso()),
                )
        if not db.execute("SELECT 1 FROM hub_challenges LIMIT 1").fetchone():
            for cat, platform, message in SAMPLE_CHALLENGES:
                db.execute(
                    "INSERT INTO hub_challenges (category, platform, message, is_sample, created_at) VALUES (?, ?, ?, 1, ?)",
                    (cat, platform, message, now_iso()),
                )
        db.commit()
        db.close()
    app.teardown_appcontext(close_db)


def log_activity(user_id, kind, label):
    execute(
        "INSERT INTO activity (user_id, kind, label, created_at) VALUES (?, ?, ?, ?)",
        (user_id, kind, label, now_iso()),
    )


def bump_counter(key, amount=1):
    execute(
        "INSERT INTO counters (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = value + excluded.value",
        (key, amount),
    )


def counters():
    return {row["key"]: row["value"] for row in query("SELECT key, value FROM counters")}


def create_user(name, email=None, password_hash=None, is_demo=False):
    return execute(
        "INSERT INTO users (email, name, password_hash, is_demo, created_at) VALUES (?, ?, ?, ?, ?)",
        (email, name, password_hash, 1 if is_demo else 0, now_iso()),
    )


def user_by_id(user_id):
    return query("SELECT * FROM users WHERE id = ?", (user_id,), one=True)


def user_by_email(email):
    return query("SELECT * FROM users WHERE email = ?", (email,), one=True)


def delete_user_data(user_id):
    """Erase everything belonging to one workspace. Used by 'Clear my data'."""
    db = get_db()
    for table in ("analyses", "plans", "assessments", "activity"):
        db.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM feedback WHERE user_id = ?", (user_id,))
    db.commit()


def json_field(row, field, default):
    if row is None:
        return default
    try:
        return json.loads(row[field])
    except (json.JSONDecodeError, TypeError, KeyError):
        return default