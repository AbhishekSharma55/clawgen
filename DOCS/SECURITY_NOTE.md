# Security Note — Action Required

During the docs pass on this repo, I noticed that **`.env.local` is committed to git** and contains live secrets:

- `OPENAI_API_KEY` (an OpenRouter `sk-or-v1-…` key, plus commented-out OpenAI and Groq keys)
- `TAVILY_API_KEY` (a `tvly-dev-…` key)

The current `.gitignore` deliberately leaves env files untracked-by-default disabled (the `# .env*` line is commented out), so any new `.env.local` will keep getting committed unless this is changed.

## Recommended steps (in order)

1. **Rotate every key that appears in `.env.local`** — assume they are public.
   - OpenRouter: https://openrouter.ai/settings/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Groq: https://console.groq.com/keys
   - Tavily: https://app.tavily.com/home
2. Add env files to `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```
3. Untrack the file without deleting your local copy:
   ```bash
   git rm --cached .env.local
   git commit -m "Stop tracking .env.local"
   ```
4. (Optional but recommended for a public repo) Purge the secrets from git history with `git filter-repo` or BFG, then force-push. If the repo is already public on GitHub, the keys should be considered compromised regardless.
5. Use the new `.env.example` at the repo root as the committed template — no secrets, just variable names.

I did **not** modify `.gitignore` or remove `.env.local` automatically because that touches in-progress work. The fix is one commit when you're ready.
