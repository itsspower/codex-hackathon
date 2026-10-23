# Relink

AI-powered student networking and opportunity platform. Students, alumni, recruiters and
administrators share one Next.js app with role-aware navigation, opportunity discovery,
application tracking, mentorship, messaging and an OpenAI-backed career assistant.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (theme + component classes in `src/app/globals.css`)
- **SQLite** via `better-sqlite3` (`data/app.db`, created on first run)
- **OpenAI SDK** for the AI assistant with platform tools (search, recommendations, people)
- Sessions in SQLite with an httpOnly cookie; passwords hashed with bcryptjs

## Quick start

```bash
npm install
npm run db:reset      # wipes data/app.db and seeds demo data
npm run dev           # http://localhost:3000
```

Enable the AI assistant by copying `.env.example` to `.env.local` and setting
`OPENAI_API_KEY`, then restart the dev server. Without it the assistant still loads and
explains how to configure it.

### Demo logins (after `npm run db:reset`)

| Role      | Email                     | Password       |
| --------- | ------------------------- | -------------- |
| Admin     | admin@relink.app          | admin1234      |
| Student   | student@relink.app        | student1234    |
| Student   | thabo@student.example     | student1234    |
| Alumni    | alumni@relink.app         | alumni1234     |
| Recruiter | recruiter@relink.app      | recruiter1234  |

## Scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the dev server                                |
| `npm run build`    | Production build (type-checks first)                |
| `npm run start`    | Serve the production build                          |
| `npm run lint`     | ESLint (eslint-config-next)                         |
| `npm run seed`     | Seed demo data (idempotent)                         |
| `npm run db:reset` | Delete the database file, recreate + seed           |
| `node scripts/smoke.mjs` | With `npm run start` running: fetch every key route as each demo role and report failures |

## Feature map

- **Students** — browse/filter opportunities, AI-ranked recommendations, save postings,
  apply with cover letter + CV (PDF/DOC/DOCX), track application statuses with history,
  request alumni mentorship, build a public profile (education, certifications, projects).
- **Recruiters** — company profile, post/close/delete opportunities, review applicants by
  status (submitted → under_review → interview → offer/rejected), download CVs, message
  applicants.
- **Alumni** — verified profile with career info, accept mentorship requests, post
  opportunities, mentor students, message anyone.
- **Admins** — `/admin` console: platform stats, user management (suspend/reinstate/verify),
  report moderation, opportunity moderation, categories & skills catalog, platform-wide
  announcements, AI usage logs.
- **Everyone** — people directory (connect + message), notifications, and the AI assistant
  (sidebar widget + full-screen `/chat`) with tools for opportunities, recommendations,
  applications, people and platform help.

## Project structure

```
src/
  app/
    (app)/            # authenticated shell (sidebar/topbar) — dashboard, opportunities,
                      # applications, saved, network, mentorship, messages, profile,
                      # notifications, chat, admin
    api/chat/         # AI assistant endpoint (GET history, POST message)
    login|register/   # auth screens
  components/         # shared UI (cards, chat panel, forms, icons)
  lib/
    actions/          # server actions (auth, profile, opportunities, applications,
                      # social, admin) — all mutations go through here
    ai.ts             # OpenAI tool-calling loop + platform tools
    auth.ts db.ts     # sessions, SQLite schema
    queries.ts        # data access used by pages
  scripts/            # seed.ts, reset-db.mjs
```

Notes: pages that read `cookies()` render dynamically (classic rendering, no cache
components). Uploads land in `public/uploads/`; the SQLite file lives in `data/` (both are
runtime artifacts, not source).
