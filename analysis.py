"""Incident interpretation.

Two engines, always labelled honestly in the response:
  * "ai"          — a configured OpenAI-compatible chat API, used only when credentials exist.
  * "rule-based"  — a transparent local pattern engine, used otherwise or on any API failure.

The rule engine never claims to be a model. Its matched patterns are returned so the
user can see exactly why a classification was produced.
"""

import json
import os
import re
import urllib.error
import urllib.request

from .content import (
    ACCOUNT_SECURITY,
    CATEGORIES,
    CATEGORY_BASE_RISK,
    CATEGORY_LABELS,
    CATEGORY_SIGNALS,
    DISCLAIMER,
    ESCALATIONS,
    EVIDENCE_PRESERVATION,
    IMMEDIATE_ACTIONS,
    NEXT_STEPS,
    WHY_RISKY,
)

VALID_KEYS = {c["key"] for c in CATEGORIES}


def ai_configured():
    return bool(os.environ.get("CYBERAURA_AI_API_KEY", "").strip())


def _normalise(text):
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _risk_band(score):
    if score >= 7:
        return "High"
    if score >= 3:
        return "Medium"
    return "Low"


def rule_based_analysis(description, selected_category, platform):
    text = _normalise(description)
    scores = {}
    matched = {}

    for key, patterns in CATEGORY_SIGNALS.items():
        hits = []
        for pattern, label, detail in patterns:
            if key == "other":
                continue
            if re.search(pattern, text):
                hits.append({"label": label, "detail": detail})
        matched[key] = hits
        scores[key] = len(hits)

    # The user's own selection is a strong prior, but corroborating language can
    # still surface a different dominant pattern.
    if selected_category in VALID_KEYS and selected_category != "other":
        scores[selected_category] = scores.get(selected_category, 0) + 2

    best = max(scores, key=lambda k: (scores[k], k == selected_category)) if scores else "other"
    if scores.get(best, 0) == 0:
        best = selected_category if selected_category in VALID_KEYS else "other"

    warning_signs = list(matched.get(best, []))
    escalations = []
    escalation_score = 0
    for pattern, weight, label, detail in ESCALATIONS:
        if re.search(pattern, text):
            escalations.append({"label": label, "detail": detail, "weight": weight})
            escalation_score += weight

    if not warning_signs:
        warning_signs = [{
            "label": "No strong pattern match",
            "detail": "The description did not contain language that matches the known detection patterns. "
                      "The result below is therefore conservative general guidance.",
        }]

    score = CATEGORY_BASE_RISK.get(best, 0) + escalation_score + min(len(matched.get(best, [])), 3)
    risk = _risk_band(score)

    return {
        "engine": "rule-based",
        "engine_label": "Rule-based interpreter (simulated analysis)",
        "simulated": True,
        "category": best,
        "category_label": CATEGORY_LABELS.get(best, "Other"),
        "selected_category": selected_category,
        "reclassified": bool(selected_category in VALID_KEYS and selected_category != "other" and best != selected_category),
        "platform": platform,
        "risk_level": risk,
        "risk_score": score,
        "pattern_matches": len(matched.get(best, [])),
        "escalations": escalations,
        "warning_signs": warning_signs,
        "why_risky": WHY_RISKY.get(best, WHY_RISKY["other"]),
        "immediate_actions": IMMEDIATE_ACTIONS.get(best, IMMEDIATE_ACTIONS["other"]),
        "account_security": ACCOUNT_SECURITY,
        "evidence_preservation": EVIDENCE_PRESERVATION,
        "next_steps": NEXT_STEPS.get(best, NEXT_STEPS["other"]),
        "disclaimer": DISCLAIMER,
        "method_note": (
            "Produced by CYBERAURA's local pattern engine, not by a language model. "
            "The matched signals above are the exact rules that fired."
        ),
    }


SYSTEM_PROMPT = """You are the CYBERAURA incident interpreter, a digital-safety assistant for women and girls.
You give preliminary, practical guidance. You are not a lawyer, not a police officer and not a verifier of facts.
Never state that an allegation is proven. Never encourage payment to an extortionist, confrontation with a
potentially dangerous person, or redistribution of intimate material. Never invent phone numbers, agencies or laws.
Respond with a single JSON object only, using exactly these keys:
category (one of: cyberstalking, impersonation, harassment, blackmail, compromise, exposure, phishing, other),
risk_level (Low|Medium|High),
warning_signs (array of {label, detail}),
why_risky (string),
immediate_actions (array of strings),
account_security (array of strings),
evidence_preservation (array of strings),
next_steps (array of strings).
Keep each array to 3-5 items and each string under 40 words."""


def _call_ai(description, selected_category, platform):
    api_url = os.environ.get("CYBERAURA_AI_API_URL", "https://api.openai.com/v1/chat/completions").strip()
    api_key = os.environ["CYBERAURA_AI_API_KEY"].strip()
    model = os.environ.get("CYBERAURA_AI_MODEL", "gpt-4o-mini").strip()

    payload = {
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({
                "user_selected_category": selected_category,
                "platform": platform,
                "description": description[:4000],
            })},
        ],
    }
    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        body = json.loads(response.read().decode("utf-8"))

    content = body["choices"][0]["message"]["content"]
    data = json.loads(content)

    category = data.get("category")
    if category not in VALID_KEYS:
        raise ValueError("model returned an unknown category")
    risk = data.get("risk_level")
    if risk not in ("Low", "Medium", "High"):
        raise ValueError("model returned an unknown risk level")

    def string_list(key, fallback):
        value = data.get(key)
        if not isinstance(value, list):
            return fallback
        cleaned = [str(v)[:400] for v in value if isinstance(v, (str, int, float))][:6]
        return cleaned or fallback

    signs = []
    for item in data.get("warning_signs", [])[:6]:
        if isinstance(item, dict) and item.get("label"):
            signs.append({"label": str(item["label"])[:120], "detail": str(item.get("detail", ""))[:400]})
        elif isinstance(item, str):
            signs.append({"label": item[:120], "detail": ""})

    return {
        "engine": "ai",
        "engine_label": f"Configured AI model ({model})",
        "simulated": False,
        "category": category,
        "category_label": CATEGORY_LABELS[category],
        "selected_category": selected_category,
        "reclassified": bool(selected_category in VALID_KEYS and selected_category != "other" and category != selected_category),
        "platform": platform,
        "risk_level": risk,
        "risk_score": None,
        "pattern_matches": None,
        "escalations": [],
        "warning_signs": signs or [{"label": "Model output", "detail": "No structured warning signs were returned."}],
        "why_risky": str(data.get("why_risky", ""))[:1200] or WHY_RISKY[category],
        "immediate_actions": string_list("immediate_actions", IMMEDIATE_ACTIONS[category]),
        "account_security": string_list("account_security", ACCOUNT_SECURITY),
        "evidence_preservation": string_list("evidence_preservation", EVIDENCE_PRESERVATION),
        "next_steps": string_list("next_steps", NEXT_STEPS[category]),
        "disclaimer": DISCLAIMER,
        "method_note": "Produced by the configured AI API. The model can be wrong; treat this as preliminary guidance.",
    }


def analyse(description, selected_category, platform):
    """Return an analysis plus an honest note about which engine produced it."""
    if ai_configured():
        try:
            return _call_ai(description, selected_category, platform)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError,
                ValueError, TypeError, OSError) as exc:
            result = rule_based_analysis(description, selected_category, platform)
            result["fallback_reason"] = (
                f"The configured AI API could not be reached ({type(exc).__name__}). "
                "This result was produced by the local rule-based interpreter instead."
            )
            return result
    return rule_based_analysis(description, selected_category, platform)