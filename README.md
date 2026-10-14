# FounderPath: your AI co-founder

Great ideas die because turning an idea into a product is hard, and mentors, developers and connections cost money most aspiring founders don't have. **FounderPath** turns a raw idea into a personalised **Launch Kit**: an idea scorecard, Lean Canvas, MVP scope, a build plan matched to the founder's skills and budget, a 6-week roadmap with progress tracking, a customer-validation kit, and a co-founder chat that knows the plan.

## Run it

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Without a key the app runs in **demo mode** (template-based kits) so the whole flow still works.

## User flow

1. **/new**: describe the idea, then skill level, hours/week, budget and goal (plus an optional cohort code).
2. Claude asks **4 tailored follow-up questions**.
3. Claude generates the **Launch Kit** (structured JSON validated with Zod), stored in SQLite.
4. **/kit/[id]**: tabs for Overview, Validate, Lean Canvas, MVP & Build, Roadmap (checklist + progress) and Business & Pitch, plus a streaming **co-founder chat**.
5. **/cohort/[code]**: incubators and schools see every student's idea score, current week and progress.

## Architecture

```
Next.js 16 (App Router, React 19, Tailwind 4)
├─ src/app/            pages (client components) + API route handlers
│  └─ api/questions    POST  → Claude (effort low)  → 4 questions
│  └─ api/ideas        POST  → Claude (effort medium, structured output) → Launch Kit → SQLite
│  └─ api/ideas/[id]   GET / PATCH (task progress, owner-checked)
│  └─ api/ideas/[id]/chat  POST → streamed Claude reply (kit cached in the system prompt)
│  └─ api/cohort/[code]    GET   → cohort analytics
├─ src/lib/ai.ts       all Claude calls (claude-opus-5-5, structured outputs, server-side refusal fallback)
├─ src/lib/schema.ts   Zod schemas: single source of truth for AI output + types
├─ src/lib/db.ts       data access (node:sqlite), the only file that touches the DB
└─ src/lib/demo.ts     offline template generator
```

Key choices:
- **Structured outputs + Zod**: the model must return JSON matching `KitSchema`, so the UI never has to parse free text.
- **Personalisation by constraint**: skill, time and budget go into the prompt, so a no-code founder gets Softr/Airtable while a developer gets Next.js/Supabase.
- **Prompt caching**: the founder's kit sits in a cached system block, so follow-up chat turns are cheaper and faster.
- **Streaming chat**: tokens stream to the browser; the first chunk is awaited so API errors still return proper HTTP status codes.

## Scalability

- Stateless API routes scale horizontally on Vercel / any Node host.
- The DB layer is isolated in `db.ts`; swap SQLite for **Postgres (Supabase/Neon)** without touching routes or UI.
- Chat history is capped at the last 20 turns, and the cached kit prefix keeps per-message cost flat as conversations grow.
- Effort is tuned per route (low for questions and chat, medium for kits), which sets the cost/quality trade-off per feature.
- Next steps at scale: real auth (anonymous localStorage id today), a job queue for kit generation, rate limits per plan, and the Batch API for nightly cohort reports.

## Business model

| Plan | Price | For |
|---|---|---|
| Free | $0 | 1 idea, full Launch Kit, limited chat (acquisition) |
| Pro | $9/mo | Unlimited ideas + chat, exports, weekly check-ins |
| Campus | $499/yr per cohort | Schools, incubators, hackathons: mentor dashboard, unlimited students |

B2B Campus licences are the main revenue engine: one sale brings in dozens of students, who become the free-to-Pro funnel. AI cost per kit is a few cents, so gross margins stay high.
