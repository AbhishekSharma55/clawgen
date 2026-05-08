# ClawGen 🦞

**An AI agent that scaffolds [OpenClaw](https://openclaw.ai) projects from a one-line description.**

Describe what you want — *"a Telegram bot that watches Gmail and posts a daily 9am summary"* — and ClawGen researches [ClawHub](https://github.com/openclaw/clawhub) skills, asks you the missing details as multiple-choice questions, draws the architecture live on a React Flow canvas, and writes a complete, runnable `.openclaw/` project folder you can download as a ZIP.

## What this project does

- 🧠 **LLM agent with 17 tools** — file ops, ClawHub search/install, Tavily web search & extract, bash execution, JSON validation, binary detection, live architecture updates.
- 🎯 **Multiple-choice clarification flow** — the agent uses an `ask_user` tool that pauses execution and renders an in-chat MCQ card; the answer becomes the next user message.
- 🗺️ **Live architecture diagram** — every time the agent calls `update_architecture`, the right-hand React Flow canvas re-renders.
- 📦 **One-click ZIP export** — `.openclaw/` gets zipped on demand and streamed to the browser.
- 💾 **Conversation persistence** — every message and every tool call (with inputs and outputs) is saved to SQLite, so reopening a project replays the full history.
- 🔌 **Provider-agnostic** — any OpenAI-compatible endpoint works (OpenAI, OpenRouter, Groq, Together, Ollama).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Vercel AI SDK v6 · Drizzle ORM + better-sqlite3 · sqlite-vec · @xyflow/react · Tailwind v4 · shadcn/ui · Tavily.

## Quickstart

**Prerequisites**

- Node 20+ and [Bun](https://bun.sh) (npm also works — the repo ships both `bun.lock` and `package-lock.json`)
- An OpenAI-compatible API key
- A [Tavily](https://app.tavily.com) API key (for the agent's web research tools)
- *(Optional)* The [`clawhub`](https://github.com/openclaw/clawhub) CLI on `$PATH` if you want the agent to actually install community skills

**Install & run**

```bash
bun install                     # or: npm install
cp .env.example .env.local      # then edit with your keys
bunx drizzle-kit push           # creates ./clawgen.db
bun dev                         # http://localhost:3000
```

**Production build**

```bash
bun run build
bun run start
```

## Usage

1. Open http://localhost:3000.
2. Click **New Project**, give it a name and a one-line description.
3. On the project page, type your requirement in the chat — e.g.
   > Build a Telegram bot that monitors my Gmail inbox and sends me a daily summary at 9am IST.
4. Answer the agent's MCQ prompts (channel, model, deployment target, schedule…).
5. Watch the architecture canvas fill in as the agent writes files.
6. Click **Download** to grab a ZIP of the generated `.openclaw/` folder.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌──────────────────────────┐   ┌──────────────────────────┐    │
│  │ AgentChat (useChat)      │   │ ArchitectureFlow         │    │
│  │  - StepCard per tool     │   │  - @xyflow/react canvas  │    │
│  │  - MCQCard for ask_user  │   │  - re-renders on update  │    │
│  └────────────┬─────────────┘   └────────▲─────────────────┘    │
└───────────────┼──────────────────────────┼──────────────────────┘
                │ POST /api/chat           │ GET /api/projects/:id
                ▼                          │
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API routes (Node runtime)                              │
│  ┌──────────────────────────┐   ┌──────────────────────────┐    │
│  │ /api/chat                │   │ /api/projects/:id/...    │    │
│  │  streamText()            │   │  CRUD + download (zip)   │    │
│  │  + 17 agent tools        │   │                          │    │
│  └────────────┬─────────────┘   └────────────┬─────────────┘    │
└───────────────┼──────────────────────────────┼──────────────────┘
                │ tool calls                   │
                ▼                              ▼
   ┌────────────────────────┐    ┌──────────────────────────┐
   │ External services      │    │ Local filesystem + DB    │
   │  - OpenAI / OpenRouter │    │  - generated-projects/   │
   │  - Tavily search       │    │  - clawgen.db (SQLite)   │
   │  - clawhub CLI         │    │                          │
   └────────────────────────┘    └──────────────────────────┘
```

A more detailed walkthrough lives in [`DOCS/REPO_OVERVIEW.md`](./DOCS/REPO_OVERVIEW.md).

## For interviews

Things that are technically interesting in this repo:

- **Human-in-the-loop tool calling**: `ask_user` is registered as a tool with no `execute` handler. The Vercel AI SDK surfaces it as an `input-available` part; the React UI renders an MCQ card; the user's selection is sent back as the next user message — completing the loop without any custom protocol on top of `useChat`.
- **Tool-call replay**: tool inputs/outputs are persisted alongside assistant messages and re-hydrated as `parts` on page reload, so the chat UI shows the full historical step trail (file writes, web searches, etc.) — not just text.
- **Live architecture sync**: an `update_architecture` tool writes React Flow nodes/edges to SQLite; the chat watches for that tool's `output-available` events and triggers a refetch on the canvas. No websockets — just AI-SDK streaming + a polled refetch.
- **Sandboxed shell tool**: `run_bash` runs inside `generated-projects/<id>/.openclaw/`, blocks an explicit dangerous-command list, isolates `$HOME`, and caps wall time / output size. Combined with `resolveSafePath()`'s path-traversal guard, this lets the agent actually install npm packages and validate JSON without escaping its sandbox.
- **Prompt engineering as control flow**: the [system prompt](./src/lib/agent/system-prompt.ts) is a 14-section operating manual that *forces* the agent to research ClawHub before writing custom skills, ask MCQs one at a time, and validate every JSON it emits. It's a good case study in steering an agent through ordered phases via prompt structure.
- **OpenAI-compatible by default**: swapping providers is a `.env` change — the same code runs against OpenAI, OpenRouter, Groq, or local Ollama.

## Project status

Working prototype. Outstanding items are tracked in [`TODO.md`](./TODO.md) and called out under "Known issues" in [`DOCS/REPO_OVERVIEW.md`](./DOCS/REPO_OVERVIEW.md). **Before pushing this repo anywhere public, read [`DOCS/SECURITY_NOTE.md`](./DOCS/SECURITY_NOTE.md) — `.env.local` is currently tracked.**
