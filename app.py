"""Run CYBERAURA locally: python app.py  →  http://127.0.0.1:5000"""

import os

from backend import create_app


def _load_dotenv(path):
    """Minimal .env loader (standard library only).

    Real environment variables always take precedence; values here are defaults.
    Lines starting with '#' and blank lines are ignored. Surrounding quotes are
    stripped. No third-party dependency is required.
    """
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.environ.get("CYBERAURA_HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("CYBERAURA_DEBUG", "0") == "1",
    )