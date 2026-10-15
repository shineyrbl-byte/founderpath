# FounderPath: your AI co-founder

Great ideas die because turning an idea into a product is hard, and mentors, developers and connections cost money most aspiring founders don't have. **FounderPath** turns a raw idea into a personalised **Launch Kit**: an idea scorecard, Lean Canvas, MVP scope, a build plan matched to the founder's skills and budget, a 6-week roadmap with progress tracking, a customer-validation kit, and a co-founder chat that knows the plan.

## Run it

```bash
cp .env.example .env.local   # add a GEMINI_API_KEY (free) or an ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

FounderPath works with two AI providers, picked from `.env.local`:
- **Gemini** (free tier): get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY`.
- **Claude** (paid): set `ANTHROPIC_API_KEY`.

If both are set, `AI_PROVIDER=gemini|claude` decides. Without any key the app runs in **demo mode** (template-based kits), so the whole flow still works.

## User flow

1. **/new**: describe the idea, then skill level, hours/week, budget and goal (plus an optional cohort code).
2. The AI asks **4 tailored follow-up questions**.
3. The AI generates the **Launch Kit** (structured JSON validated with Zod), stored in SQLite.
4. **/kit/[id]**: tabs for Overview, Validate, Lean Canvas, MVP & Build, Roadmap (checklist + progress) and Business & Pitch, plus a streaming **co-founder chat**.
5. **/cohort/[code]**: incubators and schools see every student's idea score, current week and progress.

## Architecture

```
Next.js 16 (App Router, React 19, Tailwind 4)
├─ src/app/            pages (client components) + API route handlers
│  └─ api/questions    POST  → AI → 4 questions
│  └─ api/ideas        POST  → AI (structured output) → Launch Kit → SQLite
│  └─ api/ideas/[id]   GET / PATCH (task progress, owner-checked)
│  └─ api/ideas/[id]/chat  POST → streamed AI reply
│  └─ api/cohort/[code]    GET   → cohort analytics
├─ src/lib/ai.ts       prompts + provider switch; Claude calls (claude-opus-5-5, structured outputs, refusal fallback)
├─ src/lib/gemini.ts   Gemini calls (free tier, gemini-flash-latest, JSON-schema output, streaming)
├─ src/lib/schema.ts   Zod schemas: single source of truth for AI output + types
├─ src/lib/db.ts       data access (node:sqlite), the only file that touches the DB
└─ src/lib/demo.ts     offline template generator
```

Key choices:
- **Structured outputs + Zod**: the model must return JSON matching `KitSchema`, so the UI never has to parse free text. The same Zod schema is sent to Claude and (as JSON Schema) to Gemini.
- **Provider-agnostic**: prompts live in one place and each provider is a thin adapter, so FounderPath isn't locked into one vendor's pricing.
- **Personalisation by constraint**: skill, time and budget go into the prompt, so a no-code founder gets Softr/Airtable while a developer gets Next.js/Supabase.
- **Prompt caching** (Claude): the founder's kit sits in a cached system block, so follow-up chat turns are cheaper and faster.
- **Streaming chat**: tokens stream to the browser; the first chunk is awaited so API errors still return proper HTTP status codes.

## Scalability

- Stateless API routes scale horizontally on Vercel / any Node host.
- The DB layer is isolated in `db.ts`; swap SQLite for **Postgres (Supabase/Neon)** without touching routes or UI.
- Chat history is capped at the last 20 turns, so per-message cost stays flat as conversations grow.
- The AI provider is a config switch: start on Gemini's free tier, move to a paid model when revenue justifies it.
- Next steps at scale: real auth (anonymous localStorage id today), a job queue for kit generation, rate limits per plan, and the Batch API for nightly cohort reports.

## Business model

| Plan | Price | For |
|---|---|---|
| Free | $0 | 1 idea, full Launch Kit, limited chat (acquisition) |
| Pro | $9/mo | Unlimited ideas + chat, exports, weekly check-ins |
| Campus | $499/yr per cohort | Schools, incubators, hackathons: mentor dashboard, unlimited students |

B2B Campus licences are the main revenue engine: one sale brings in dozens of students, who become the free-to-Pro funnel. AI cost per kit is a few cents at most (zero on Gemini's free tier while small), so gross margins stay high.
