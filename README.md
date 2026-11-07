---

# Women Empowerment — Problem, Solution & Social Impact

## 1. The Problem We Are Solving

Women and girls increasingly depend on digital platforms for education, communication, employment, entrepreneurship and social participation. However, online harassment, cyberstalking, fake accounts, identity misuse, blackmail and privacy violations can make their digital experiences unsafe.

Many women also face difficulties in:

- Recognising suspicious online activities and digital threats.
- Understanding what to do when someone impersonates them.
- Preserving digital evidence safely.
- Protecting personal information and online identities.
- Finding reliable cybersecurity guidance and official reporting channels.
- Accessing beginner-friendly digital safety education.

**The real problem:** Women should not have to limit their digital participation because they lack the knowledge, resources or confidence to respond to online threats.

## 2. Our Solution — CYBERAURA

CYBERAURA is an AI-assisted digital threat intelligence and privacy protection platform designed to empower women and girls.

It transforms complicated cybersecurity information into understandable guidance and practical actions.

Instead of leaving users confused about what to do after experiencing an online threat, CYBERAURA provides tools to:

- Understand potential digital threats.
- Assess personal privacy exposure.
- Organise digital evidence and verify file integrity.
- Follow personalised cybersecurity response plans.
- Access relevant Pakistani support and reporting resources.
- Develop long-term digital safety skills.
- Share experiences and contribute to improving the platform.

**Our mission is to help women move from digital vulnerability and uncertainty towards awareness, confidence and independence.**

## 3. How CYBERAURA Empowers Women

| Challenge | CYBERAURA Feature | Expected Benefit |
|---|---|---|
| Difficulty recognising online threats | AI Threat Interpreter | Improves threat awareness |
| Fake accounts and impersonation | Incident analysis and Evidence Vault | Helps organise evidence and understand reporting options |
| Uncertainty about digital evidence | SHA-256 integrity verification | Checks whether saved files remain unchanged |
| Not knowing how to respond to harassment | Cyber Response Center | Provides practical response checklists |
| Exposure of personal information | Digital Exposure Assessment | Helps improve privacy awareness |
| Difficulty finding reliable support | Pakistan Resource Navigator | Connects users with relevant official organisations |
| Limited cybersecurity knowledge | Digital Safety Learning Hub | Builds digital literacy |
| Women's experiences being overlooked | Anonymous Feedback & Community Hub | Gives women a voice in shaping the solution |

## 4. How the Solution Works

CYBERAURA follows five simple stages:

1. **Recognise:** Users describe an online incident and receive a preliminary threat assessment.
2. **Understand:** The platform explains potential warning signs, risks and recommended actions.
3. **Preserve:** Users organise evidence locally and check file integrity through SHA-256 hashing.
4. **Respond:** Personalised checklists guide users through appropriate account security and reporting steps.
5. **Learn & Connect:** Users access digital safety lessons, verified support resources and community guidance.

This creates a practical journey from identifying a digital threat to understanding possible responses and developing better online safety habits.

## 5. Who Benefits?

CYBERAURA is designed for:

- **Students:** To understand online harassment, privacy and digital safety.
- **Young women:** To recognise impersonation, suspicious messages and privacy risks.
- **Women entrepreneurs and freelancers:** To protect their professional digital identities.
- **Women entering technology careers:** To build cybersecurity awareness and confidence.
- **Women with limited technical knowledge:** To access simple, beginner-friendly security guidance.

## 6. Women's Participation — Building the Platform Together

Women should not simply use a platform designed for them; they should help shape it.

CYBERAURA encourages participation through:

- Anonymous digital safety challenge submissions.
- Community suggestions and support voting.
- Feedback on accessibility and usability.
- Beginner-friendly educational resources.
- Future usability testing with female students and professionals.
- Consultation with cybersecurity experts, educators and women's support organisations.

This ensures that future improvements reflect women's real experiences, needs and challenges.

## 7. Limitations and Future Improvements

CYBERAURA is an educational and functional prototype. It does not replace professional cybersecurity investigations, law enforcement or emergency services.

| Current Limitation | Current Approach | Future Improvement |
|---|---|---|
| Rule-based analysis may miss complex threats | Transparent simulated analysis | Properly configured and evaluated AI integration |
| No automatic fake-account detection | Manual incident assessment | Authorised platform integrations |
| Evidence is browser-local and unencrypted | Privacy warnings and local storage | Independently audited encrypted storage |
| Privacy assessment relies on user answers | Transparent self-assessment | Consent-based privacy integrations |
| Cannot remove harmful online content | Official reporting guidance | Partnerships with relevant support organisations |
| No live emergency response service | Verified resource directory | Partnerships with qualified support providers |

**Our commitment:** CYBERAURA does not promise to eliminate cybercrime. It aims to improve awareness, preparedness, digital confidence and access to appropriate support.

## 8. Expected Social Impact

We evaluate the prototype through measurable indicators:

- Number of privacy assessments completed.
- Number of incident response plans generated.
- Number of evidence integrity checks performed.
- Number of digital safety lessons completed.
- Number of security recommendations completed.
- Number of community feedback contributions.

These indicators measure platform usage and learning engagement, not proven reductions in cybercrime.

All demonstration statistics are clearly labelled as sample data. Real-world impact would require user testing, feedback and further evaluation.

## 9. Why CYBERAURA Matters

Digital empowerment means more than simply having access to technology. Women also need the knowledge and confidence to use it safely.

By combining cybersecurity awareness, privacy assessment, evidence organisation, practical response guidance, education and community participation, CYBERAURA aims to support women's safer participation in education, employment, entrepreneurship and digital communities.

**We believe women should not have to leave the digital world to feel safe in it. They deserve the knowledge, tools and confidence to control their own digital identities.**

**CYBERAURA — Your Identity. Your Privacy. Your Digital Control.**

---



# CYBERAURA

**Your Identity. Your Privacy. Your Digital Control.**

An AI-assisted digital threat intelligence and privacy-protection platform built for
women and girls — **Special category: Women Empowerment**. CYBERAURA turns confusing,
frightening online threats into clear understanding, organised evidence, a measured
privacy score and a calm, phased response plan, then connects users to verified
Pakistani support services.

> This is a working prototype. Demonstration statistics are **sample data**, simulated
> analyses are **labelled as simulated**, and evidence is stored **only in your browser**.

---

## Quick start

Requires **Python 3.11+** (developed on 3.14). No database server or API key is needed.

```bash
# 1. (optional) create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 2. install the only direct dependency
pip install -r requirements.txt

# 3. (optional) copy the example config
cp .env.example .env        # Windows: copy .env.example .env

# 4. run
python app.py
```

Open **http://127.0.0.1:5000**. The SQLite database and a persistent secret key are
created automatically in `instance/` on first run.

Click **Try Demo** anywhere (hero, login, register, mobile menu) to open a disposable
workspace pre-filled with fictional sample data — no personal information required.

---

## The judge demo journey (≈2 minutes)

Everything below works with safe, fictional data:

1. **Try Demo** → lands on the Security Dashboard (seeded sample records, clearly labelled).
2. **Threat Analysis** → press *Load sample incident* (the impersonation scenario),
   tick the consent box, **Analyse incident**. Watch the staged scan, then the structured
   result: category, risk band, warning signs, why it is risky, and recommended actions.
   The engine is honestly labelled **rule-based / simulated** when no AI key is set.
3. **Build response plan** from the result → jumps to the Response Center with the right
   playbook selected.
4. **Evidence Vault** → *Add sample evidence* creates a fictional text record, fingerprints
   it with **SHA-256** (Web Crypto), then **Verify integrity** recalculates and compares the
   hash. You can also drag in your own *non-sensitive* demo file.
5. **Response Center** → tick checklist items; the progress ring and bar update live.
   **Download summary** exports a plain-text plan.
6. **Privacy Check** → answer the eight questions, **Calculate my score**; see the
   transparent deduction breakdown, exposure meters and prioritised recommendations.
7. **Resources** → search/filter the verified directory; complete the four-scenario
   **Digital safety learning** quiz and record completion.
8. **Community** → the Women's Safety Feedback & Resource Hub. Open a beginner guide
   (or press **Larger text**), read a lesson and **Mark as learned** to move the progress
   ring, pick a situation to get its verified reporting route, submit an **anonymous**
   challenge note and watch the theme chart update, then post a suggestion to the
   community board and **support** it. No account is needed for any of this.
9. **About** → read the empowerment mission and submit feedback via the community form.

---

## Features

| Module | What it does |
| --- | --- |
| **Landing** | Animated hero, bento feature grid, how-it-works, impact counters, empowerment banner. |
| **Security Dashboard** | Readiness ring + trend, threat donut, response progress, category bars, activity timeline, local vault status, prioritised recommendations. |
| **AI Threat Interpreter** | 8 incident categories, rule-based pattern engine with escalation signals, optional OpenAI-compatible API, structured guidance, honest engine labelling. |
| **Evidence Vault** | Browser-IndexedDB records, file upload, SHA-256 fingerprinting, integrity verification, search/filter/sort, JSON manifest export, undo-after-delete. |
| **Cyber Response Center** | Per-incident phased playbooks, live checklists, progress tracking, downloadable summary. |
| **Digital Exposure Assessment** | 8 weighted questions, transparent 0–100 score, exposure categories, personalised recommendations, history. |
| **Pakistan Resource Navigator** | 8 verified organisations, live search + type filters, safe external links, learning quiz. |
| **Women's Safety Feedback & Resource Hub** | 4 accessible beginner guides with a larger-text toggle, 6 digital-safety lessons with device-local progress, situation-based reporting routes to verified organisations, anonymous safety-challenge feedback with a live theme chart, and a community suggestions board with support votes, category filters and sorting. |
| **About & Empowerment** | Mission, co-design/participation, privacy & accessibility commitments, sample impact indicators, feedback form. |

---

## Configuration (environment variables)

All are optional; real environment variables override `.env` values. See `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `CYBERAURA_HOST` | `127.0.0.1` | Bind address. |
| `PORT` | `5000` | Port. |
| `CYBERAURA_DEBUG` | `0` | `1` enables the dev debugger (local only). |
| `CYBERAURA_SECRET_KEY` | auto-generated | Session signing key; persisted to `instance/secret_key` if unset. |
| `CYBERAURA_SECURE_COOKIE` | `0` | `1` marks the session cookie Secure (use behind HTTPS). |
| `CYBERAURA_DATABASE` | `instance/cyberaura.sqlite3` | Non-sensitive records database. |
| `CYBERAURA_AI_API_KEY` | *(blank)* | When set, enables the external AI engine. Blank = rule-based fallback. |
| `CYBERAURA_AI_API_URL` | `https://api.openai.com/v1/chat/completions` | OpenAI-compatible endpoint. |
| `CYBERAURA_AI_MODEL` | `gpt-4o-mini` | Model name. |

**No API key is hardcoded.** Without a key the local rule-based interpreter runs and every
result is labelled as a simulated analysis. If a configured API fails, the app falls back
to the rule engine and records the fallback reason — it never pretends a model ran.

---

## Privacy & security architecture

- **Evidence never leaves the browser.** Files and hashes live in IndexedDB
  (`cyberaura-vault`). They are never uploaded to the server or any AI service.
- **Narratives are not stored.** Incident text is processed in memory; only non-sensitive
  metadata (category, platform, risk band, matched signal names) is saved.
- **Per-user isolation.** Every query is scoped to the signed-in user; demo workspaces are
  disposable and separate. One user can never read another's records.
- **Passwords** are stored only as salted Werkzeug hashes; never in plain text.
- **CSRF protection** on every state-changing request (session token via header or form).
- **Security headers**: CSP (`script-src 'self'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HttpOnly/SameSite cookies.
- **Input validation & output escaping** throughout; SHA-256 via the Web Crypto API with a
  pure-JS fallback for non-secure contexts.
- **Quick exit** (button or double-Escape) clears session storage and leaves the site.
- **Clear my data** removes server-side records on demand from the dashboard.
- **Community hub input is anonymous by design.** Challenge notes and suggestions store no
  user id, name, email or IP — only the category, optional platform and the text the visitor
  chose to share. A consent checkbox confirms the note contains no identifying details.
  Suggestions are published to the board only when the author leaves *Share* ticked.
  Lesson progress and support votes are kept in `localStorage` on the visitor's own device.

### Important honesty notes

- A matching SHA-256 hash proves a file is **byte-for-byte unchanged** since fingerprinting.
  It is **not** proof that an allegation is true or that content is authentic.
- Browser-local demo storage is **not** an encrypted evidence vault.
- The privacy score is a **self-assessment**; CYBERAURA does not scan the internet or
  discover personal information automatically.
- Following a checklist **does not guarantee** an attacker is stopped or an incident resolved.
- Impact counters are **sample demonstration data**, not real-world impact claims.
- The community board and theme chart are seeded with **clearly labelled sample** notes and
  ideas so the page is never empty; they are not claims about real submissions.
- The hub is **peer guidance, not a monitored emergency or crisis channel**. Every reporting
  route links only to organisations that publish their own contact details, and the page
  states the emergency numbers (police 15, rescue 1122) up front.

---

## Project structure

```
app.py                  Entry point + tiny stdlib .env loader
backend/
  __init__.py           App factory, security headers, error handlers
  routes.py             Pages + JSON API
  analysis.py           Rule-based engine + optional AI API (honest fallback)
  content.py            Categories, playbooks, questions, verified resources, quiz, hub guides/lessons/routes
  db.py                 SQLite schema + helpers (incl. anonymous hub_challenges / hub_suggestions)
  security.py           Sessions, CSRF, auth guards, password rules
templates/              Jinja2 pages + macro-based inline SVG icon system
static/
  css/main.css          Full design system (palette, components, responsive, motion)
  js/                   core + per-page modules (vanilla JS, no build step)
  img/                  Original generated illustrations (WebP) + favicon.svg
instance/               Auto-created SQLite DB + secret key (git-ignored)
```

---

## Testing

The backend was verified with Flask's test client across every route and API flow
(analysis, scoring, plan toggle/report/delete, learning, feedback, integrity counter,
anonymous hub challenge/suggestion/support, validation, CSRF rejection, workspace clear).
The full app was also driven end to end in headless Chromium (Playwright) at desktop and
mobile widths: every page, the complete demo journey, all community-hub flows, header fit
from 360px to 1920px, image loading, console/page errors and horizontal overflow.
For UI testing, run the app and exercise the demo journey above on desktop and mobile widths.

Manual checklist:
- Every navigation item and footer link resolves.
- Forms validate (short description, missing consent, password rules, feedback length,
  hub challenge 20–2000 characters, hub suggestion title/body limits).
- File hashing + integrity verification produce matching/mismatching states correctly.
- Privacy score matches the transparent weight table (e.g. the demo answers score 40/100).
- Reduced-motion preference disables animations; keyboard navigation reaches all controls.
- Hub: larger-text toggle, lesson progress persists per device, reporting routes show only
  verified organisations, anonymous submissions update the theme chart and board live.

---

## Limitations (prototype)

- The AI engine is optional; without a key, analysis is a transparent rule-based simulation.
- Evidence storage is browser-local and unencrypted — suitable for demonstration, not for
  storing real sensitive material. Do **not** upload intimate or private images.
- Resource contacts are included only where organisations publish them; always confirm on
  the official site. CYBERAURA does not operate these services.
- No real authentication hardening (rate limiting, email verification, MFA) is implemented;
  do not deploy publicly as-is without adding these.
- Impact counters reset when the local database is recreated.

---

## License / intent

Built as an educational and empowerment prototype. Guidance is preliminary and is **not**
legal advice or a verified threat determination. In an emergency, contact local emergency
services first (see the Resource Navigator).
