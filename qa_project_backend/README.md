# Mini Q&A Knowledge Base

## Setup
1. Create a virtualenv and activate it.
2. `pip install -r requirements.txt`
3. Run seed data (optional): `python seed_data.py`
4. Start server: `uvicorn app.main:app --reload`
5. Open http://127.0.0.1:8000

## Notes
- Login stores JWT in localStorage. You must login before creating questions/answers.
- SEO features: per-question meta, JSON-LD QAPage, `/sitemap.xml`, `/robots.txt`.
