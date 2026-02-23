# Gmail Summary Bot Setup

This project uses OpenClaw and `browser-use` to monitor your Gmail and send daily summaries to Telegram.

## Pre-requisites
1. **Python & UV**: Ensure you have Python 3.10+ and `uv` installed.
2. **Install browser-use**:
   ```bash
   uv pip install browser-use[cli]
   browser-use install
   ```
3. **Telegram Bot**: Create a bot via @BotFather and get the `TELEGRAM_BOT_TOKEN`.
4. **Maton Gateway**: Ensure you have your Maton API Key.

## Env Vars
Create a `.env` file or export these:
- `OPENAI_API_KEY`: Your OpenAI key (GPT-4o mini).
- `TELEGRAM_BOT_TOKEN`: From BotFather.
- `MATON_GATEWAY_TOKEN`: Your Maton API Key.

## First Time Login
Since this uses your "real" browser session to avoid Google's bot detection:
1. Run: `browser-use --headed open https://mail.google.com`
2. Manually log in to your Gmail in the window that pops up.
3. Close it. OpenClaw will now be able to use that session.

## Run
```bash
OPENCLAW_HOME=. openclaw start
```
