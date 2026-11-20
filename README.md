# 🚀 Milestone AI — Adaptive Learning Blueprints

> Transform natural language goals into adaptive, time-bound learning blueprints powered by Google Gemini, featuring milestone tracking, curated resources, a guardrailed AI mentor, gamification, and adaptive rescheduling. Built on a strict **$0 free-tier architecture**.

---

## 🌟 Key Features

- **Smart Roadmap Wizard**: Natural-language goal prompt + 1-click curated starter blueprints (Jetpack Compose, 10K Running, Conversational French, Indie Startup MVP, Machine Learning).
- **3-Question AI Diagnostic**: Calibrates difficulty and pacing automatically.
- **AI Duration Estimator & Pacing Guardrails**: Recommends realistic timelines (1–24 months) with overload guardrails (blocks daily pacing on plans > 6 months).
- **Milestone Tracking & Deliverables Checklist**: Dynamic completion checkboxes recalculate progress rings in real time.
- **Micro-Quiz Gate**: Major milestones require passing a 3-question conceptual verification quiz before claiming completion and XP.
- **Guardrailed AI Mentor Chat**: Persona switcher (Socratic Tutor, Strict Coach, Encouraging Peer), active milestone context injection, and strict curriculum domain lock with jailbreak resistance.
- **Dual Gemini Engine**: Switchable between **Gemini 1.5 Flash** (speed) and **Gemini 1.5 Pro** (deep reasoning).
- **Adaptive Rebalance Schedule**: 1-click rescheduling of remaining milestones when life happens — without losing completed progress.
- **Data Portability**: Export complete blueprints to Markdown (`.md`), iCalendar (`.ics`), or complete application state to JSON.
- **Progressive Web App (PWA)**: Installable on iOS/Android/Desktop with service worker offline caching.

---

## 🛠️ Free Tier Tech Stack

| Layer | Technology | Free Tier Notes |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Ultra-fast HMR, PWA installable |
| **Styling** | Tailwind CSS v4 | Native dark-mode first design tokens |
| **Routing** | React Router v7 | Client-side routing with clean URL parameters |
| **Animations** | Framer Motion | Smooth springs, progress rings, and step transitions |
| **Backend & DB** | Supabase (Postgres + Auth + RLS) | Free tier: 500MB DB, 50,000 MAU auth |
| **AI Intelligence** | Google Gemini 1.5 Flash / Pro | Google AI Studio free tier (no credit card needed) |
| **Hosting & CI/CD** | Vercel | Free hobby tier with automated GitHub git pushes |

---

## 🚀 Quickstart Local Development

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/<your-username>/milestone-ai.git
cd milestone-ai
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key # Optional, or enter in Settings UI
```

### 3. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** (`>_`).
3. Paste and run the complete migration script from:
   `supabase/migrations/20261120000000_init_schema.sql`

### 4. Run Dev Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔐 Security & Row Level Security (RLS)

- **Postgres RLS**: All 8 tables (`profiles`, `roadmaps`, `milestones`, `deliverables`, `resources`, `chat_messages`, `user_stats`, `user_settings`) enforce user-scoped RLS policies (`auth.uid() = user_id`).
- **Secret Isolation**: Production deployments utilize a Deno Supabase Edge Function (`supabase/functions/gemini-proxy`) so client code never exposes backend service role keys.
- **Zero Accidental Leaks**: `.env` and `.env.local` are strictly ignored by `.gitignore`.

---

## 📄 License
MIT License. Built for lifelong learners and builders.
