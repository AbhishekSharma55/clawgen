# ClawGen — Repo Overview

## What this project does

ClawGen is a **Next.js web app that scaffolds [OpenClaw](https://openclaw.ai) projects from natural-language requirements**. The user describes what they want (e.g. *"a Telegram bot that summarizes my Gmail every morning at 9am"*), and an LLM-powered agent — backed by tool calls and a multiple-choice clarification flow — generates a complete `.openclaw/` directory: master config, agent workspaces, skills, crons, and a README. The result is downloadable as a ZIP.

The agent has built-in knowledge of OpenClaw's architecture and the [ClawHub](https://github.com/openclaw/clawhub) skill registry, and is forced (via system prompt) to research existing ClawHub skills and verify external APIs before writing any custom skill.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| LLM SDK | Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) |
| Models | OpenAI-compatible endpoint (default `gpt-4o`, configurable via `CHAT_MODEL` and `OPENAI_BASE_URL` — works with OpenRouter, Groq, Ollama, etc.) |
| Web research | Tavily API (`web_search`, `web_extract` agent tools) |
| ClawHub integration | Shells out to local `clawhub` CLI for `search` / `install` |
| DB | SQLite via `better-sqlite3` + Drizzle ORM |
| Vector store | `sqlite-vec` (loaded as a SQLite extension — see caveat below) |
| Diagram | `@xyflow/react` (React Flow) for the live architecture canvas |
| UI | Tailwind v4, shadcn/ui (new-york style), Radix primitives, Lucide icons |
| Markdown | `react-markdown` + `remark-gfm` |

## Directory layout

```
clawgen/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Project registry / new-project dialog
│   │   ├── layout.tsx                     # Root layout, fonts, top loader
│   │   ├── globals.css                    # Tailwind + theme tokens
│   │   ├── projects/
│   │   │   ├── [id]/page.tsx              # Split view: chat (left) + architecture (right)
│   │   │   └── new/page.tsx               # (empty — dead route, dialog on / handles creation)
│   │   └── api/
│   │       ├── chat/route.ts              # POST: streams LLM responses with tool calls
│   │       └── projects/
│   │           ├── route.ts               # GET (list) / POST (create) projects
│   │           └── [id]/
│   │               ├── route.ts           # GET / DELETE single project
│   │               └── download/route.ts  # GET zipped .openclaw bundle
│   ├── components/
│   │   ├── agent-chat.tsx                 # Streaming chat UI, MCQ + StepCard rendering
│   │   ├── architecture-flow.tsx          # React Flow canvas (the one actually used)
│   │   ├── architecture-panel.tsx         # (older variant — superseded by architecture-flow.tsx)
│   │   ├── mcq-card.tsx                   # ask_user multiple-choice card
│   │   ├── step-card.tsx                  # Per-tool-call status pill + details dialog
│   │   ├── project-list.tsx               # (empty — dead component, list lives in page.tsx)
│   │   └── ui/                            # shadcn/ui primitives (Button, Card, Dialog, …)
│   └── lib/
│       ├── agent/
│       │   ├── system-prompt.ts           # 14-section operating manual for the agent
│       │   └── tools.ts                   # 17 agent tools (file ops, ClawHub, web, bash, …)
│       ├── db/
│       │   ├── index.ts                   # better-sqlite3 + drizzle init, sqlite-vec load
│       │   └── schema.ts                  # projects / messages / openclaw_docs tables
│       └── utils.ts                       # cn() class merger
├── generated-projects/                    # runtime output — one folder per project ID
├── public/                                # static assets
├── drizzle.config.ts                      # drizzle-kit config (sqlite, ./clawgen.db)
├── components.json                        # shadcn/ui config
└── package.json
```

## Runtime data flow

1. User creates a project on `/` → `POST /api/projects` writes a row in SQLite and creates an empty `generated-projects/<id>/.openclaw/` folder.
2. User navigates to `/projects/<id>` → split view loads: `AgentChat` on the left, `ArchitectureFlow` on the right.
3. User types a requirement → `useChat` from `@ai-sdk/react` POSTs to `/api/chat`.
4. `/api/chat` builds the system prompt (injecting the current `projectId`), persists the user message, and calls `streamText` with `agentTools` and `stopWhen: stepCountIs(20)`.
5. The agent loops through tool calls — `clawhub_search`, `web_search`, `ask_user`, `write_file`, `validate_json`, `update_architecture`, `zip_export`, etc. — each call shows up live in the chat as a `StepCard`.
6. `update_architecture` writes a `{ nodes, edges }` JSON blob to the `projects.architecture` column. The chat UI watches for completed `tool-update_architecture` parts and refetches the project so React Flow re-renders.
7. `ask_user` is a **human-in-the-loop tool with no `execute` function** — the frontend renders an `MCQCard` and forwards the selected answer as the next user message.
8. When the agent calls `zip_export` (or the user clicks **Download**), `/api/projects/[id]/download` zips `.openclaw/` on demand and streams it back.

## How to run it right now

Prereqs: Node 20+, Bun (project ships a `bun.lock`; npm works too), an OpenAI-compatible API key, a Tavily key, and optionally the `clawhub` CLI on `$PATH`.

```bash
bun install              # or: npm install
cp .env.example .env.local
# edit .env.local with your keys

bunx drizzle-kit push    # apply schema to ./clawgen.db
bun dev                  # http://localhost:3000
```

Build / start:

```bash
bun run build
bun run start
```

## Known issues / TODOs

- **🔴 Security: `.env.local` is currently tracked in git with live API keys.** See [SECURITY_NOTE.md](./SECURITY_NOTE.md). Rotate the keys, untrack the file, and add it to `.gitignore`.
- **`sqlite-vec` is hardcoded to the Linux x64 binary** in `src/lib/db/index.ts`. The app will throw on macOS/Windows unless that line is generalized to use the `sqlite-vec` package's platform-aware loader. The `openclaw_docs` table (with the `embedding` blob column) is defined for RAG but no ingest/retrieval code is wired up yet — `{{RAG_CONTEXT}}` in the system prompt is never substituted.
- **Dead code**: `src/components/project-list.tsx` and `src/app/projects/new/page.tsx` are empty files. `src/components/architecture-panel.tsx` is an older variant of `architecture-flow.tsx` and is unimported.
- **TODO.md** mentions outstanding work: provider/model selection from the app UI, vector DB hookup.
- `console.log(process.env.OPENAI_API_KEY?.toString().substring(0, 5) + '...')` in `src/app/api/chat/route.ts:14` should be removed for production.
- The architecture diagram is persisted as a JSON string in a single column rather than normalized — fine for this scope but worth knowing.
