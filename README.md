# AHL Wash — ahlwash.com

Residential pressure washing in Springfield, VA 22153. Static site + one Vercel serverless function.

## Stack

- `index.html` / `styles.css` / `script.js` — static one-page site, quote form is the hero
- `api/quote.js` — serverless endpoint: validates the lead, throttles abuse, emails it to **ahlwashinfo@gmail.com** via [Resend](https://resend.com)
- `vercel.json` — security headers (CSP, HSTS, nosniff, frame denial)
- No build step, no npm dependencies

## Deploy (Vercel)

1. Push this repo to GitHub (already done if you're reading this there)
2. vercel.com → Add New → Project → import this repo → Deploy (no settings needed)
3. Project → Settings → Environment Variables → add `RESEND_API_KEY` (from resend.com → API Keys) → redeploy
4. Test: submit the quote form on the live URL, confirm the email arrives

## Changing things

- **Lead inbox:** set `LEADS_TO_EMAIL` env var in Vercel (default ahlwashinfo@gmail.com)
- **Jobs-completed stat:** `data-count="25"` in `index.html`
- **Photos:** drop new ones in `Photos/` locally and re-run `python process_photos.py`, commit the `images/` output (Photos/ itself stays out of git)
- **Sender address:** after verifying ahlwash.com in Resend (Domains → Add), set `LEADS_FROM_EMAIL` to e.g. `AHL Wash <quotes@ahlwash.com>`
