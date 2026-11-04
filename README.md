# Smart Money Tracker

Independent, read-only trader discovery dashboard. Initial version has no data ingestion, verified rankings, or trade execution.

## Setup
1. Run `npm install` and `npm run dev`.
2. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel (never commit credentials).
3. Supabase tables already exist in project `gloupftrmatfwfrvrjdv`. Current public dashboard cannot read them without an appropriate read-only policy or server-side access. Do not expose service-role keys to the browser.

## Data integrity
Do not label self-reported or simulated returns as verified. Store source URLs and observation times. Never present stale positions as live signals.
