# 🚀 Milestone AI — Adaptive Learning Blueprints & Curriculum Architecture

> Transform ambitious goals into structured, week-by-week curriculum blueprints with verified resources, deliverable checklists, real-time gamification, and a 24/7 context-injected AI mentor. Built on a production-ready **$0 free-tier architecture**.

[![Live App](https://img.shields.io/badge/Live%20App-milestonegen.vercel.app-00dfa2?style=flat-square&logo=vercel)](https://milestonegen.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20Edge-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20AI-4285f4?style=flat-square&logo=google)](https://ai.google.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-ff5722?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 🌐 Live Deployment

- **Production App**: [https://milestonegen.vercel.app/](https://milestonegen.vercel.app/)
- **Documentation & Technical Spec**: [https://milestonegen.vercel.app/docs](https://milestonegen.vercel.app/docs)

---

## 🌟 Key Features

### 1. Guided Multi-Step Course Creation Flow
- **4-Step Wizard**: Streamlined progression (Goal & Focus → Timeline & Frequency → Review & Customization → Generate) eliminates configuration fatigue.
- **Smart Title Suggestions**: AI suggests clean, professional curriculum titles with independent multi-select flexibility.
- **Automated Milestone Scheduling**: Milestone counts calculate automatically based on duration and pacing frequency (e.g., 24 months + Quarterly = 8 milestones; 12 months + Monthly = 12 milestones) with zero manual math.
- **Distraction-Free Goal Setting**: Open-ended goal prompts without forced templates or redundant difficulty barriers.

### 2. Adaptive Learning Roadmaps & Deliverables
- **Actionable Sequencing**: Every milestone includes concrete, testable deliverables rather than passive reading lists.
- **Dynamic Progress Rings**: Real-time recalculation of completion percentages, milestone statuses, and XP rewards.
- **Curated Learning Resources**: Verified official documentation, course playlists, and technical guides.
- **Micro-Quiz Verification Gates**: Test knowledge retention before unlocking milestone completion.
- **Adaptive Rebalancing**: 1-click schedule rebalancing adjusts upcoming deadlines if life gets in the way, without resetting progress.

### 3. Context-Aware AI Mentor Chat
- **Milestone State Injection**: The AI mentor understands your current milestone, completed deliverables, and active roadblocks without repeating context.
- **Pedagogical Personas**: Switch between Socratic Tutor, Strict Code Coach, and Supportive Peer.
- **Domain Guardrails**: Guardrailed against prompt injection and curriculum derailment to keep learners focused on their targets.

### 4. Blueprint & Course Management
- **Dashboard Overview**: View all active courses, completed achievements, and XP statistics at a glance.
- **Safe Deletion Flow**: Dedicated delete action with confirmation modals for courses and blueprints to prevent accidental data loss.

### 5. UI/UX & Theme Customization
- **Dark & Light Mode**: Instant toggle with theme persistence in `localStorage` and zero flash-of-unauthenticated-theme (FOUC).
- **Web Interface Guidelines & Impeccable Craft**: Adheres to modern ergonomic web guidelines, smooth micro-interactions, accessible contrast ratios, and responsive layouts across mobile, tablet, and desktop.
- **PWA Support**: Full offline caching and installable home screen experience.

---

## 🛠️ Architecture & Tech Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                Vite 8 + React 19 Frontend                    │
   │  (Tailwind CSS v4 · Framer Motion · Lucide Icons · PWA)       │
   └───────────────┬──────────────────────────────┬───────────────┘
                   │                              │
         Supabase Auth (JWT)             Supabase Edge Functions
                   │                              │
                   ▼                              ▼
   ┌──────────────────────────────┐    ┌──────────────────────────┐
   │  Supabase Postgres Database  │    │  Google Gemini 2.5 Flash │
   │  - 8 Tables with strict RLS  │    │  - Curriculum Generator  │
   │  - profiles, roadmaps, etc.  │    │  - Context-Aware Mentor  │
   └──────────────────────────────┘    └──────────────────────────┘
```

| Layer | Technology | Free Tier Notes |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Fast HMR, concurrent React rendering, PWA enabled |
| **Styling** | Tailwind CSS v4 | Dark/Light token system, zero-runtime CSS |
| **Routing** | React Router v7 | Clean navigation with protected private routes |
| **Motion** | Framer Motion | Smooth layout transitions and progress indicators |
| **Database & Auth** | Supabase Postgres + GoTrue | Row-Level Security (RLS) on all user data |
| **Serverless Compute** | Supabase Edge Functions (Deno) | Zero client key exposure for AI API calls |
| **AI Engine** | Google Gemini 2.5 Flash | Structured JSON output & streaming mentor chat |
| **Deployment** | Vercel | Automatic CI/CD builds connected to GitHub `main` |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Free [Supabase](https://supabase.com) account
- Free [Google AI Studio](https://aistudio.google.com) API key

### 2. Clone Repository
```bash
git clone https://github.com/Aw4k3/MileStoneAI.git
cd MileStoneAI
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root:
```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key # Optional fallback for direct client mode
```

### 4. Database Setup
1. In your [Supabase Dashboard](https://supabase.com), open the **SQL Editor**.
2. Run the migration script located at:
   ```
   supabase/migrations/20261120000000_init_schema.sql
   ```
   This initializes tables (`profiles`, `roadmaps`, `milestones`, `deliverables`, `resources`, `chat_messages`, `user_stats`, `user_settings`) and applies strict Row Level Security (RLS) policies.

### 5. Supabase Edge Functions (Optional for local dev, recommended for production)
Deploy the Deno edge functions to your Supabase project:
```bash
npx supabase functions deploy generate-roadmap
npx supabase functions deploy chat-mentor
npx supabase functions deploy estimate-duration
npx supabase functions deploy gemini-proxy
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

### 6. Run Local Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Linting

```bash
# Check code syntax and lint rules
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔐 Security & Privacy

- **Row Level Security (RLS)**: Enforced across all Postgres tables (`auth.uid() = user_id`) so users can only view and modify their own roadmaps and progress.
- **Protected API Keys**: AI inference is routed through Supabase Edge Functions so backend Gemini keys remain server-side.
- **Clean Authentication**: Secure session persistence with automatic stale-token purging and optional Google OAuth sign-in.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for lifelong self-directed learners and technical builders.
