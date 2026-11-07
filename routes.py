"""Page routes and the JSON API."""

import json
import uuid
from collections import Counter

from flask import (
    Blueprint, Response, current_app, g, jsonify, redirect, render_template,
    request, session, url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from .analysis import ai_configured, analyse
from .content import (
    ASSESSMENT_MAX, ASSESSMENT_QUESTIONS, BEGINNER_GUIDES, CATEGORIES, CATEGORY_LABELS,
    CATEGORY_SIGNALS, DEMO_INCIDENT, DISCLAIMER, HUB_CHALLENGE_CATEGORIES,
    HUB_SUGGESTION_CATEGORIES, LEARNING_RESOURCES, PLATFORMS, PLAYBOOK_DISCLAIMER,
    PLAYBOOKS, QUIZ, REPORT_SITUATIONS, RESOURCES, RESOURCE_TYPES, SCORE_BANDS,
)
from .db import (
    bump_counter, counters, create_user, delete_user_data, execute, json_field,
    log_activity, now_iso, query, user_by_email,
)
from .security import (
    current_user, login_required, password_problem, sign_in, sign_out, valid_email,
)

main = Blueprint("main", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def band_for(score):
    for threshold, label, tone, note in SCORE_BANDS:
        if score >= threshold:
            return {"label": label, "tone": tone, "note": note}
    return {"label": "Priority", "tone": "danger", "note": SCORE_BANDS[-1][3]}


def score_answers(answers):
    score = ASSESSMENT_MAX
    breakdown = []
    recommendations = []
    categories = {}
    for question in ASSESSMENT_QUESTIONS:
        value = bool(answers.get(question["key"]))
        risky = value == question["risky_when"]
        deduction = question["weight"] if risky else 0
        score -= deduction
        breakdown.append({
            "key": question["key"],
            "question": question["question"],
            "category": question["category"],
            "weight": question["weight"],
            "deduction": deduction,
            "risky": risky,
            "answer": value,
        })
        bucket = categories.setdefault(question["category"], {"exposure": 0, "possible": 0})
        bucket["possible"] += question["weight"]
        bucket["exposure"] += deduction
        if risky:
            recommendations.append({
                "key": question["key"],
                "category": question["category"],
                "weight": question["weight"],
                "title": question["question"],
                "action": question["recommendation"],
                "icon": question["icon"],
            })
    score = max(0, score)
    recommendations.sort(key=lambda r: -r["weight"])
    exposure = [
        {"category": name, "exposure": v["exposure"], "possible": v["possible"],
         "percent": round(100 * v["exposure"] / v["possible"])}
        for name, v in categories.items()
    ]
    return score, breakdown, recommendations, exposure


def build_plan(category):
    book = PLAYBOOKS.get(category, PLAYBOOKS["other"])
    items = []
    for phase, entries in book["phases"]:
        for label, detail in entries:
            items.append({
                "id": uuid.uuid4().hex[:10],
                "phase": phase,
                "label": label,
                "detail": detail,
                "done": False,
            })
    return book, items


def plan_payload(row):
    items = json_field(row, "items", [])
    done = sum(1 for i in items if i.get("done"))
    return {
        "id": row["id"],
        "category": row["category"],
        "category_label": CATEGORY_LABELS.get(row["category"], "Other"),
        "title": row["title"],
        "summary": PLAYBOOKS.get(row["category"], PLAYBOOKS["other"])["summary"],
        "items": items,
        "done": done,
        "total": len(items),
        "percent": round(100 * done / len(items)) if items else 0,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "disclaimer": PLAYBOOK_DISCLAIMER,
    }


def latest_assessment(user_id):
    return query("SELECT * FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,), one=True)


def seed_demo(user_id):
    """Populate a fresh demo workspace with clearly fictional sample records."""
    samples = [
        ("impersonation", "Instagram", "High", ["Duplicate identity", "Photographs reused without consent"]),
        ("phishing", "WhatsApp", "Medium", ["Urgency pretext", "Link-based lure"]),
        ("exposure", "Facebook", "Low", ["Over-broad visibility"]),
    ]
    for category, platform, risk, signals in samples:
        execute(
            "INSERT INTO analyses (user_id, category, platform, risk_level, engine, signals, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, category, platform, risk, "rule-based", json.dumps(signals), now_iso()),
        )
    answers = {
        "phone_public": True, "email_public": False, "social_public": True,
        "location_shared": False, "routine_visible": True, "unknown_apps": True,
        "no_2fa": False, "passwords_reused": True,
    }
    score, _b, _r, _e = score_answers(answers)
    execute(
        "INSERT INTO assessments (user_id, answers, score, band, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, json.dumps(answers), score, band_for(score)["label"], now_iso()),
    )
    book, items = build_plan("impersonation")
    for item in items[:2]:
        item["done"] = True
    execute(
        "INSERT INTO plans (user_id, category, title, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, "impersonation", book["title"], json.dumps(items), now_iso(), now_iso()),
    )
    for kind, label in [
        ("analysis", "Sample analysis · Impersonation · High risk"),
        ("assessment", "Sample privacy assessment completed"),
        ("plan", "Sample response plan created · Impersonation"),
        ("checklist", "Sample checklist item completed"),
    ]:
        log_activity(user_id, kind, label)


# ---------------------------------------------------------------------------
# Public pages
# ---------------------------------------------------------------------------

@main.route("/")
def index():
    return render_template("index.html", page="home", categories=CATEGORIES, impact=counters())


@main.route("/about")
def about():
    return render_template("about.html", page="about", impact=counters(), quiz=QUIZ)


@main.route("/resources")
def resources():
    return render_template(
        "resources.html", page="resources", resources=RESOURCES,
        resource_types=RESOURCE_TYPES, quiz=QUIZ,
    )


def hub_suggestions():
    rows = query("SELECT * FROM hub_suggestions WHERE shared = 1 ORDER BY supports DESC, id DESC")
    return [
        {"id": r["id"], "category": r["category"], "title": r["title"], "body": r["body"],
         "supports": r["supports"], "sample": bool(r["is_sample"]), "created": r["created_at"]}
        for r in rows
    ]


def hub_themes():
    rows = query("SELECT category, COUNT(*) AS n FROM hub_challenges GROUP BY category ORDER BY n DESC")
    return [{"label": r["category"], "value": r["n"]} for r in rows]


@main.route("/community")
def community():
    return render_template(
        "community.html", page="community", resources=RESOURCES,
        situations=REPORT_SITUATIONS, guides=BEGINNER_GUIDES, lessons=LEARNING_RESOURCES,
        challenge_categories=HUB_CHALLENGE_CATEGORIES, suggestion_categories=HUB_SUGGESTION_CATEGORIES,
        suggestions=hub_suggestions(), themes=hub_themes(), platforms=PLATFORMS,
    )


@main.route("/threat-analysis")
def threat():
    return render_template(
        "threat.html", page="threat", categories=CATEGORIES, platforms=PLATFORMS,
        demo_incident=DEMO_INCIDENT, ai_enabled=ai_configured(), disclaimer=DISCLAIMER,
    )


@main.route("/evidence-vault")
def vault():
    return render_template("vault.html", page="vault")


@main.route("/privacy-check")
def privacy():
    return render_template(
        "privacy.html", page="privacy", questions=ASSESSMENT_QUESTIONS, max_score=ASSESSMENT_MAX,
    )


def ensure_workspace():
    """Open a disposable demo workspace for logged-out visitors instead of a login wall."""
    if current_user() is None:
        user_id = create_user("Ayesha (Demo workspace)", is_demo=True)
        sign_in(user_id)
        seed_demo(user_id)


@main.route("/response-center")
def response():
    ensure_workspace()
    rows = query("SELECT * FROM plans WHERE user_id = ? ORDER BY id DESC", (current_user()["id"],))
    return render_template(
        "response.html", page="response", categories=CATEGORIES,
        plans=[plan_payload(r) for r in rows], disclaimer=PLAYBOOK_DISCLAIMER,
    )


@main.route("/dashboard")
def dashboard():
    ensure_workspace()
    return render_template("dashboard.html", page="dashboard", categories=CATEGORIES)


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@main.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        row = user_by_email(email)
        if row is None or not row["password_hash"] or not check_password_hash(row["password_hash"], password):
            return render_template("login.html", page="login", error="Email or password not recognised."), 401
        sign_in(row["id"])
        log_activity(row["id"], "session", "Signed in")
        target = request.args.get("next") or url_for("main.dashboard")
        return redirect(target if target.startswith("/") else url_for("main.dashboard"))
    return render_template("login.html", page="login")


@main.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()[:60]
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        confirm = request.form.get("confirm") or ""
        error = None
        if len(name) < 2:
            error = "Enter the name you would like to be called."
        elif not valid_email(email):
            error = "Enter a valid email address."
        elif password_problem(password):
            error = password_problem(password)
        elif password != confirm:
            error = "The two passwords do not match."
        elif user_by_email(email):
            error = "An account already exists with that email."
        if error:
            return render_template("register.html", page="register", error=error, name=name, email=email), 400
        user_id = create_user(name, email=email, password_hash=generate_password_hash(password))
        sign_in(user_id)
        log_activity(user_id, "session", "Workspace created")
        return redirect(url_for("main.dashboard"))
    return render_template("register.html", page="register")


@main.route("/demo", methods=["POST"])
def demo():
    """Create an isolated, disposable demo workspace. No real data required."""
    user_id = create_user("Ayesha (Demo workspace)", is_demo=True)
    sign_in(user_id)
    seed_demo(user_id)
    return redirect(request.form.get("next") or url_for("main.dashboard"))


@main.route("/logout", methods=["POST"])
def logout():
    sign_out()
    return redirect(url_for("main.index"))


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

@main.get("/api/status")
def api_status():
    return jsonify(
        ai_configured=ai_configured(),
        engine="Configured AI API" if ai_configured() else "Local rule-based interpreter",
        storage="Browser IndexedDB for evidence · SQLite for non-sensitive records",
    )


@main.post("/api/analyze")
@login_required
def api_analyze():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()
    category = data.get("category") or "other"
    platform = (data.get("platform") or "Other").strip()[:40]

    if category not in CATEGORY_LABELS:
        return jsonify(error="Choose a valid incident category."), 400
    if platform not in PLATFORMS:
        platform = "Other"
    if len(description) < 20:
        return jsonify(error="Describe what happened in at least 20 characters so the interpreter has something to work with."), 400
    if len(description) > 4000:
        return jsonify(error="Keep the description under 4000 characters."), 400
    if not data.get("consent"):
        return jsonify(error="Confirm the processing notice before submitting."), 400

    result = analyse(description, category, platform)
    user_id = current_user()["id"]
    signals = [s["label"] for s in result["warning_signs"]][:6]
    analysis_id = execute(
        "INSERT INTO analyses (user_id, category, platform, risk_level, engine, signals, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, result["category"], platform, result["risk_level"], result["engine"], json.dumps(signals), now_iso()),
    )
    log_activity(user_id, "analysis", f"Threat analysis · {result['category_label']} · {result['risk_level']} risk")
    result["id"] = analysis_id
    result["created_at"] = now_iso()
    # The narrative itself is never written to disk.
    return jsonify(result)


@main.get("/api/analyses")
@login_required
def api_analyses():
    rows = query("SELECT * FROM analyses WHERE user_id = ? ORDER BY id DESC LIMIT 30", (current_user()["id"],))
    return jsonify(items=[{
        "id": r["id"], "category": r["category"], "category_label": CATEGORY_LABELS.get(r["category"], "Other"),
        "platform": r["platform"], "risk_level": r["risk_level"], "engine": r["engine"],
        "signals": json_field(r, "signals", []), "created_at": r["created_at"],
    } for r in rows])


@main.post("/api/plans")
@login_required
def api_create_plan():
    data = request.get_json(silent=True) or {}
    category = data.get("category")
    if category not in PLAYBOOKS:
        return jsonify(error="Choose a valid incident type for the response plan."), 400
    user_id = current_user()["id"]
    book, items = build_plan(category)
    plan_id = execute(
        "INSERT INTO plans (user_id, category, title, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, category, book["title"], json.dumps(items), now_iso(), now_iso()),
    )
    bump_counter("response_plans_generated")
    log_activity(user_id, "plan", f"Response plan created · {CATEGORY_LABELS[category]}")
    row = query("SELECT * FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id), one=True)
    return jsonify(plan_payload(row)), 201


@main.get("/api/plans")
@login_required
def api_plans():
    rows = query("SELECT * FROM plans WHERE user_id = ? ORDER BY id DESC", (current_user()["id"],))
    return jsonify(items=[plan_payload(r) for r in rows])


@main.post("/api/plans/<int:plan_id>/toggle")
@login_required
def api_toggle(plan_id):
    data = request.get_json(silent=True) or {}
    item_id = data.get("item_id")
    done = bool(data.get("done"))
    user_id = current_user()["id"]
    row = query("SELECT * FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id), one=True)
    if row is None:
        return jsonify(error="That plan is not in your workspace."), 404
    items = json_field(row, "items", [])
    found = next((i for i in items if i["id"] == item_id), None)
    if found is None:
        return jsonify(error="That checklist item no longer exists."), 404
    if done and not found["done"]:
        bump_counter("recommendations_completed")
        log_activity(user_id, "checklist", f"Checklist item completed · {CATEGORY_LABELS.get(row['category'], 'Other')}")
    found["done"] = done
    execute("UPDATE plans SET items = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (json.dumps(items), now_iso(), plan_id, user_id))
    return jsonify(plan_payload(query("SELECT * FROM plans WHERE id = ?", (plan_id,), one=True)))


@main.delete("/api/plans/<int:plan_id>")
@login_required
def api_delete_plan(plan_id):
    user_id = current_user()["id"]
    row = query("SELECT id FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id), one=True)
    if row is None:
        return jsonify(error="That plan is not in your workspace."), 404
    execute("DELETE FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id))
    log_activity(user_id, "plan", "Response plan removed")
    return jsonify(ok=True)


@main.get("/api/plans/<int:plan_id>/report")
@login_required
def api_plan_report(plan_id):
    user_id = current_user()["id"]
    row = query("SELECT * FROM plans WHERE id = ? AND user_id = ?", (plan_id, user_id), one=True)
    if row is None:
        return Response("Not found", status=404)
    plan = plan_payload(row)
    lines = [
        "CYBERAURA — PERSONALISED CYBER RESPONSE SUMMARY",
        "=" * 58,
        f"Plan:      {plan['title']}",
        f"Incident:  {plan['category_label']}",
        f"Created:   {plan['created_at']}",
        f"Progress:  {plan['done']} of {plan['total']} steps complete ({plan['percent']}%)",
        "",
        plan["summary"],
        "",
    ]
    phase = None
    for item in plan["items"]:
        if item["phase"] != phase:
            phase = item["phase"]
            lines += ["", f"-- {phase.upper()} " + "-" * (52 - len(phase))]
        lines.append(f"[{'x' if item['done'] else ' '}] {item['label']}")
        lines.append(f"      {item['detail']}")
    lines += [
        "", "-" * 58,
        "IMPORTANT",
        PLAYBOOK_DISCLAIMER,
        "This summary was generated locally by CYBERAURA as preparedness guidance.",
        "It is not a legal document and not a verified record of an incident.",
        "", "Verified support routes: https://www.nccia.gov.pk/ · https://pkcert.gov.pk/",
        "Digital Rights Foundation Cyber Harassment Helpline: 0800-39393",
    ]
    return Response(
        "\n".join(lines),
        mimetype="text/plain",
        headers={"Content-Disposition": f'attachment; filename="cyberaura-response-plan-{plan_id}.txt"'},
    )


@main.post("/api/assessment")
@login_required
def api_assessment():
    data = request.get_json(silent=True) or {}
    raw = data.get("answers")
    if not isinstance(raw, dict):
        return jsonify(error="Answer the assessment questions before calculating a score."), 400
    keys = {q["key"] for q in ASSESSMENT_QUESTIONS}
    if set(raw.keys()) != keys:
        return jsonify(error="Answer all eight questions to get a complete score."), 400
    answers = {k: bool(raw[k]) for k in keys}
    score, breakdown, recommendations, exposure = score_answers(answers)
    band = band_for(score)
    user_id = current_user()["id"]
    execute(
        "INSERT INTO assessments (user_id, answers, score, band, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, json.dumps(answers), score, band["label"], now_iso()),
    )
    bump_counter("assessments_completed")
    log_activity(user_id, "assessment", f"Privacy assessment completed · score {score}/100")
    return jsonify(score=score, band=band, breakdown=breakdown, recommendations=recommendations,
                   exposure=exposure, max_score=ASSESSMENT_MAX, created_at=now_iso(),
                   note="Self-assessment based only on your answers. CYBERAURA does not scan the internet or your accounts.")


@main.get("/api/assessment/latest")
@login_required
def api_latest_assessment():
    row = latest_assessment(current_user()["id"])
    if row is None:
        return jsonify(available=False)
    answers = json_field(row, "answers", {})
    score, breakdown, recommendations, exposure = score_answers(answers)
    history = query("SELECT score, created_at FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 8",
                    (current_user()["id"],))
    return jsonify(available=True, score=row["score"], band=band_for(row["score"]), answers=answers,
                   breakdown=breakdown, recommendations=recommendations, exposure=exposure,
                   created_at=row["created_at"],
                   history=[{"score": h["score"], "created_at": h["created_at"]} for h in reversed(history)])


@main.post("/api/impact/integrity")
@login_required
def api_integrity():
    bump_counter("integrity_checks_completed")
    log_activity(current_user()["id"], "integrity", "Evidence integrity check completed")
    return jsonify(ok=True, total=counters()["integrity_checks_completed"])


@main.post("/api/learn")
@login_required
def api_learn():
    data = request.get_json(silent=True) or {}
    try:
        correct = int(data.get("correct", 0))
        total = int(data.get("total", 0))
    except (TypeError, ValueError):
        return jsonify(error="Invalid learning result."), 400
    if total != len(QUIZ) or not 0 <= correct <= total:
        return jsonify(error="Invalid learning result."), 400
    bump_counter("learning_completed")
    log_activity(current_user()["id"], "learning", f"Digital safety learning completed · {correct}/{total} correct")
    return jsonify(ok=True, total=counters()["learning_completed"])


@main.post("/api/feedback")
def api_feedback():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    role = (data.get("role") or "Community member").strip()[:60]
    if len(message) < 10:
        return jsonify(error="Tell us a little more — at least 10 characters."), 400
    if len(message) > 2000:
        return jsonify(error="Keep feedback under 2000 characters."), 400
    if not data.get("consent"):
        return jsonify(error="Confirm that your feedback contains no personal or sensitive information."), 400
    user = current_user()
    execute("INSERT INTO feedback (user_id, role, message, created_at) VALUES (?, ?, ?, ?)",
            (user["id"] if user else None, role, message, now_iso()))
    return jsonify(ok=True, message="Thank you. Your feedback has been recorded for the community design review.")


@main.post("/api/hub/challenge")
def api_hub_challenge():
    """Anonymous safety-challenge feedback. No identity is stored or required."""
    data = request.get_json(silent=True) or {}
    category = (data.get("category") or "").strip()
    platform = (data.get("platform") or "").strip()
    message = (data.get("message") or "").strip()
    if category not in HUB_CHALLENGE_CATEGORIES:
        return jsonify(error="Choose the category that best fits your challenge."), 400
    if platform and platform not in PLATFORMS:
        return jsonify(error="Choose a valid platform."), 400
    if len(message) < 20:
        return jsonify(error="Describe the challenge in at least 20 characters (no personal details)."), 400
    if len(message) > 2000:
        return jsonify(error="Keep your description under 2000 characters."), 400
    if not data.get("consent"):
        return jsonify(error="Confirm your note contains no personal or identifying information."), 400
    execute("INSERT INTO hub_challenges (category, platform, message, is_sample, created_at) VALUES (?, ?, ?, 0, ?)",
            (category, platform, message, now_iso()))
    return jsonify(ok=True, themes=hub_themes(),
                   message="Thank you. Your anonymous note helps shape safer guidance for every woman.")


@main.post("/api/hub/suggestion")
def api_hub_suggestion():
    """Anonymous suggestion; optionally shared on the public community board."""
    data = request.get_json(silent=True) or {}
    category = (data.get("category") or "").strip()
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    shared = 1 if data.get("share") else 0
    if category not in HUB_SUGGESTION_CATEGORIES:
        return jsonify(error="Choose a suggestion category."), 400
    if len(title) < 6 or len(title) > 120:
        return jsonify(error="Give your suggestion a short title (6-120 characters)."), 400
    if len(body) < 20 or len(body) > 1200:
        return jsonify(error="Describe your idea in 20-1200 characters."), 400
    if not data.get("consent"):
        return jsonify(error="Confirm your suggestion contains no personal or identifying information."), 400
    cur = execute("INSERT INTO hub_suggestions (category, title, body, supports, shared, is_sample, created_at) VALUES (?, ?, ?, 0, ?, 0, ?)",
                  (category, title, body, shared, now_iso()))
    payload = None
    if shared:
        payload = {"id": cur, "category": category, "title": title, "body": body,
                   "supports": 0, "sample": False, "created": now_iso()}
    return jsonify(ok=True, suggestion=payload,
                   message="Shared on the community board." if shared else "Saved privately. Thank you for shaping CYBERAURA.")


@main.post("/api/hub/suggestion/<int:sid>/support")
def api_hub_support(sid):
    data = request.get_json(silent=True) or {}
    row = query("SELECT * FROM hub_suggestions WHERE id = ? AND shared = 1", (sid,), one=True)
    if row is None:
        return jsonify(error="That suggestion is not on the public board."), 404
    delta = 1 if data.get("vote") else -1
    supports = max(0, row["supports"] + delta)
    execute("UPDATE hub_suggestions SET supports = ? WHERE id = ?", (supports, sid))
    return jsonify(ok=True, supports=supports)


@main.post("/api/workspace/clear")
@login_required
def api_clear():
    user_id = current_user()["id"]
    delete_user_data(user_id)
    log_activity(user_id, "session", "Workspace records cleared by user")
    return jsonify(ok=True, message="Your analyses, plans, assessments and activity have been deleted.")


@main.get("/api/dashboard")
@login_required
def api_dashboard():
    user_id = current_user()["id"]
    analyses = query("SELECT * FROM analyses WHERE user_id = ? ORDER BY id DESC", (user_id,))
    plans = query("SELECT * FROM plans WHERE user_id = ? ORDER BY id DESC", (user_id,))
    activity = query("SELECT * FROM activity WHERE user_id = ? ORDER BY id DESC LIMIT 10", (user_id,))
    assessment = latest_assessment(user_id)

    plan_items_done = 0
    plan_items_total = 0
    plan_list = []
    for row in plans:
        payload = plan_payload(row)
        plan_items_done += payload["done"]
        plan_items_total += payload["total"]
        plan_list.append({k: payload[k] for k in ("id", "title", "category_label", "percent", "done", "total")})

    risk_counts = Counter(r["risk_level"] for r in analyses)
    category_counts = Counter(r["category"] for r in analyses)
    trend = query("SELECT score, created_at FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 8", (user_id,))

    recommendations = []
    answers = {}
    if assessment is not None:
        answers = json_field(assessment, "answers", {})
        _s, _b, recommendations, _e = score_answers(answers)
    if not recommendations:
        recommendations = [{
            "key": "no_2fa", "category": "Account access", "weight": 16, "icon": "shield",
            "title": "Enable two-factor authentication on your main accounts",
            "action": "Start with email, then social and banking. Use an authenticator app where supported.",
        }, {
            "key": "baseline", "category": "Getting started", "weight": 14, "icon": "globe",
            "title": "Complete your first Digital Exposure Assessment",
            "action": "Eight questions produce a transparent readiness score and a prioritised action list.",
        }]

    return jsonify(
        user={"name": current_user()["name"], "is_demo": bool(current_user()["is_demo"])},
        readiness={"available": assessment is not None,
                   "score": assessment["score"] if assessment else None,
                   "band": band_for(assessment["score"]) if assessment else None,
                   "answers": answers,
                   "updated": assessment["created_at"] if assessment else None},
        analyses={
            "total": len(analyses),
            "high": risk_counts.get("High", 0),
            "medium": risk_counts.get("Medium", 0),
            "low": risk_counts.get("Low", 0),
            "by_category": [{"key": k, "label": CATEGORY_LABELS.get(k, k), "count": v}
                            for k, v in category_counts.most_common()],
            "recent": [{"id": r["id"], "category_label": CATEGORY_LABELS.get(r["category"], "Other"),
                        "platform": r["platform"], "risk_level": r["risk_level"], "created_at": r["created_at"]}
                       for r in analyses[:5]],
        },
        plans={"total": len(plans), "items_done": plan_items_done, "items_total": plan_items_total,
               "percent": round(100 * plan_items_done / plan_items_total) if plan_items_total else 0,
               "list": plan_list[:4]},
        activity=[{"kind": a["kind"], "label": a["label"], "created_at": a["created_at"]} for a in activity],
        recommendations=recommendations[:4],
        trend=[{"score": t["score"], "created_at": t["created_at"]} for t in reversed(trend)],
        impact=counters(),
    )