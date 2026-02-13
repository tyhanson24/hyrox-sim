# HYROX SIM - Project Context

## What This Is
A full-featured web app for HYROX athletes — training, race simulation, pacing, leaderboards, race logging, and structured training plans. Built as a static frontend with Supabase backend (PostgreSQL + Auth).

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (ES6 modules, no bundler)
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Libraries:** Chart.js (CDN), Google Fonts (Bebas Neue, Inter)
- **Database:** 7 tables with Row-Level Security

## Project Structure
```
├── index.html              Landing page (hero, workouts, timer, leaderboard)
├── login.html              Sign in
├── signup.html             Account creation
├── reset-password.html     Password recovery
├── dashboard.html          Authenticated user hub (stats, quick actions, activity)
├── workouts.html           Workout library with filters
├── workout-detail.html     Single workout view + logging
├── pace-calculator.html    PaceMe — split calculator for race pacing
├── training-plans.html     4 structured multi-week plans
├── race-history.html       Log & view HYROX race results + Chart.js viz
├── profile.html            User settings (name, division, target time)
├── contact.html            Contact form
├── css/global.css          All styles (custom properties, responsive)
├── js/supabase-client.js   Supabase SDK init (URL + anon key)
├── js/auth.js              signUp, signIn, signOut, resetPassword, getSession
├── js/shared.js            UI utils, auth nav, requireAuth, toast, formatTime
├── schema.sql              Full DB schema + RLS policies + triggers
├── seed-workouts.sql       28 HYROX workouts
└── seed-plans.sql          4 training plans (beginner → advanced)
```

## Database Tables
- **profiles** — user data (display_name, division, target_time, active_plan)
- **workouts** — public library (28+ entries, JSONB stations, equipment array)
- **workout_logs** — user activity (duration, heart rate, notes)
- **simulation_results** — timer results (total_time_ms, JSONB splits)
- **race_results** — actual HYROX race logs (splits, rankings, location)
- **training_plans** — public plan library (JSONB schedule, weekly structure)
- **contact_submissions** — contact form entries

## Auth Flow
- Supabase email/password auth
- Auto-profile creation via PostgreSQL trigger (`handle_new_user`)
- Email confirmation bypassed — auto-redirect to dashboard after signup
- `requireAuth()` guards protected pages (redirects to login)
- Session persisted via Supabase SDK localStorage

## Design System
- **Colors:** Neon lime `#c8ff00`, orange accent `#ff3c00`, dark bg `#0a0a0a`
- **Fonts:** Bebas Neue (headings), Inter (body)
- **Components:** Skewed clip-path buttons, left-border hover cards, fade-in on scroll, toast notifications, skeleton loading shimmer
- **Responsive:** Mobile-first, breakpoints at 768px/480px, hamburger menu

## Key Patterns
- Each HTML page has inline `<script type="module">` at bottom
- All Supabase queries are client-side (no custom backend)
- RLS policies enforce user data isolation
- Supabase anon key is intentionally public (RLS provides security)
- No build process — files served directly

## Divisions
men_open, women_open, men_pro, women_pro, men_doubles, women_doubles, mixed_doubles

## Supabase Config
- Project URL: `https://yehktkkjjuyhlwpkmfgh.supabase.co`
- Client initialized in `/js/supabase-client.js`

## Git History
```
d2af956 Remove email confirmation step — auto-redirect after signup
d622142 Add full app: dashboard, workouts, pace calculator, race history, training plans
31fc4fb Foundation: shared CSS/JS, Supabase client, auth pages, live leaderboard
e32a2b5 Add explicit X close button to mobile menu overlay
112eb52 Fix hamburger button z-index so X close is visible over mobile menu
053bb3c Add hamburger menu and contact page
569bc77 Initial commit: Hyrox Sim landing page
```

## Stats
~4,800 lines of code across 19 files. Production-ready static site with full Supabase integration.
