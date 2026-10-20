# Dashie

**Dashie helps IE students commuting between Madrid and Segovia find or offer a car seat so they stop hunting through WhatsApp groups.**

Student project, not affiliated with IE University.

## Features

- **Public landing page** (`/`) explaining what Dashie is, with a single "Sign up" button and example rides.
- **Email + password accounts** (`/signup`, `/login`) with Supabase Auth. No email confirmation, no extra fields.
- **Ride board** (`/app`, logged-in users only):
  - Post a ride with a one-line description, a direction (Madrid → Segovia / Segovia → Madrid), seats (1–8) and an optional departure time.
  - See every student's rides, newest first, with an optional direction filter.
  - Request a seat on someone else's ride (once per ride).
  - **My rides**: see who requested a seat on each of your rides, with their email, and **Accept** or **Decline** each request (never more than the seats you offered). Requesters see "Accepted ✓" or "Declined" on the ride.
  - Delete your own rides.
- **Privacy**: phone numbers are blocked in ride descriptions, and ride cards show no names or emails. Requesters' emails are visible only to the ride's author, enforced by Row Level Security.
- **Accessible and mobile first**: labelled inputs, visible focus, 44px tap targets, errors announced to screen readers, and a layout that works at 360px wide.

## Tech

Next.js 16 (App Router, TypeScript, Tailwind CSS 4) and Supabase (Auth + Postgres with RLS) via `@supabase/ssr`.

- `lib/supabase/client.ts`: browser client
- `lib/supabase/server.ts`: server client (Server Components)
- `proxy.ts` + `lib/supabase/proxy.ts`: refreshes the session on every request and guards `/app`. Next.js 16 renamed "middleware" to "proxy".
- `supabase/schema.sql`: tables, indexes, RLS policies and the seat-limit trigger (everything a new database needs)
- `supabase/upgrade-accept-decline.sql`: only for databases created before Accept/Decline existed

## Run locally

1. Install Node.js 20 or newer.
2. Create `.env.local` in the project folder:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Use only the **publishable** key. Never the secret/service_role key.
3. In Supabase, open **SQL Editor → New query**, paste `supabase/schema.sql` and click **Run**.
4. In Supabase, go to **Authentication → Sign In / Providers → Email** and turn **Confirm email** off.
5. Install and start:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000.

## Deploy (Vercel)

Import the repo in Vercel and add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) under **Settings → Environment Variables**.
