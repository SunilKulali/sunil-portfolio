# Sunil Kulali: AI Engineer Portfolio

Static site (HTML, CSS, vanilla JS) plus Vercel serverless functions for the visitor, feedback, and chatbot APIs.

## Structure
```
sunil-portfolio/
├── index.html              page markup and welcome overlay
├── css/styles.css          design tokens, layout, components
├── js/
│   ├── data.js             SKILLS (SK) and PROJECTS (PR): edit content here
│   ├── utils.js            small helpers
│   ├── art.js              per-project SVG illustrations
│   ├── main.js             projects, modal, skills filter, nav, theme
│   ├── welcome.js          welcome form, consent, location, entry animation
│   ├── feedback.js         feedback modal, validation, star rating, submit
│   └── chat.js             Sunil AI Assistant chat panel
├── assets/                 hero.jpg, favicon.svg
├── resumes/                the two resume PDFs
├── api/visitor.js          POST /api/visitor (welcome form email)
├── api/feedback.js         POST /api/feedback (feedback email)
├── api/chat.js             POST /api/chat (LLM answers grounded in the knowledge base)
├── api/_knowledge.js       verified facts the chatbot may use (edit this to update answers)
├── api/_lib.js             shared helpers (not deployed as a route)
├── tests/                  visitor.test.js, feedback.test.js, chat.test.js
├── vercel.json             security headers and CSP
├── robots.txt, sitemap.xml
├── .env.example            environment variable template (safe to commit)
└── package.json
```

## Run locally
- Static preview: `npx serve .`
- With the API: copy `.env.example` to `.env.local`, fill in your keys, sign in once with `npx vercel login`, then run `npm run dev` (serves on port 8000).
- Tests: `npm test`

## Deploy
Push to GitHub and import the repo in Vercel (no build step, framework "Other"). Add the required variables listed below under Project Settings > Environment Variables, then redeploy.

## Visitor email setup
1. Create a Resend account and an API key. Verify the sender domain if you are not using Resend's test sender.
2. Set `RESEND_API_KEY`, `RESEND_FROM` (for example `Portfolio <onboarding@resend.dev>`) and `NOTIFY_TO` (the destination inbox).
3. Without these, the form says delivery failed and lets the visitor in.

## Before you publish
- Add the correct CGPA yourself (your resumes disagree: 8.82 vs 7.82). It is not shown on the site.
- Confirm the IT Vedant title (Data Analyst Intern vs Data Science Intern).
- Add `repo` / `demo` URLs to projects in `js/data.js`; the modal shows a source link only when `repo` is set.
- The privacy notice promises deleting visitor emails after 90 days. Do that or edit the text in `index.html`.

## Known limits
- Rate limiting is in memory per serverless instance; use Vercel KV or Upstash for a strict limit.
- No CAPTCHA yet; add Cloudflare Turnstile if spam appears.
- City lookup is optional: set `geocode` in `js/welcome.js` to an endpoint returning `{ "city": "..." }`.
- Project art is original SVG, not AI-generated images.

## Feedback feature
Floating button (bottom-right) and footer link open a modal: name, email (any provider), category chips, optional 1 to 5 stars, required feedback text (no minimum, up to 2,000 characters), optional follow-up consent.
- `POST /api/feedback` validates everything server-side, then emails sskulali3@gmail.com through Resend. Visitors see success only after Resend accepts the email for delivery; feedback is emailed and is not stored in a database. `reply_to` is the visitor's email, so you can reply from Gmail.
- Protections: origin check (same host or `ALLOWED_ORIGINS`), 10 KB body limit, 3 submissions per 10 minutes per IP, honeypot field, duplicate-submission key, escaped HTML, newline stripping.
- No database and no message logging. Feedback lives only in your inbox; delete emails per your retention policy.
- Uses three required Vercel environment variables: `RESEND_API_KEY`, `RESEND_FROM` (a sender/domain verified in Resend), and `NOTIFY_TO`. Optional: `ALLOWED_ORIGINS`, `SITE_URL`. Resend request failures log only safe status/code diagnostics; no feedback body, address, or credentials are logged. Retries use Resend idempotency keys.
- Tests: `npm test` covers validation, escaping, provider errors, retries, duplicates, and rate limits. Real email delivery is not covered until you configure Resend and send a test from the deployed site.

## Sunil AI Assistant (chatbot)
Launcher above the feedback button; panel with welcome cards, Recruiter mode, markdown answers, source links, copy, optional listen (text-to-speech) and optional dictation (mic only starts when pressed).
- `POST /api/chat` sends the question and the last 8 messages to the Anthropic Messages API with a system prompt plus `api/_knowledge.js`. The key stays on the server. Conversation content is not stored or logged; safe provider failure codes and statuses are logged for diagnosis. Conversations are not emailed.
- Env vars: `ANTHROPIC_API_KEY` (required), `CHAT_MODEL` (optional; defaults to `claude-haiku-5-5`, a supported Anthropic API model ID), `ALLOWED_ORIGINS` (optional), and `SITE_URL` (optional for feedback emails). Add required values in Vercel Project Settings > Environment Variables, then redeploy.
- Protections: origin check, 16 KB body limit, 500-character questions, 10 requests/minute and 60/hour per IP (in memory), 20 s timeout, safe markdown (escaped HTML, only http(s) and #anchor links).
- Without the key the panel shows "isn't switched on yet" and a retry button. It never fakes answers.
- Keep `api/_knowledge.js` accurate: the bot is told to answer only from it. Check the internship dates and titles match your latest resume.
- Cost: every question is a paid model call; the rate limits are your cost guard. Add Vercel KV/Upstash for strict limits.
- Tests: `npm test` (46 tests; the UI was exercised in a headless browser with a mocked API). A real model reply requires a configured key and available Anthropic API credits.

## Certificates
Real files live in `assets/certificates/` (original PDFs plus JPEG renderings used for thumbnails and the viewer; the JPEGs are plain renders of the PDFs, nothing edited). The viewer is `js/certs.js`; edit the `CERTS` map there to add one. Only details printed on the certificates are shown. The IBM entry links to the verification URL printed on that certificate; the Microsoft certificate says "Online Verifiable" but prints no URL, so there is no verify button.
