# Gmail & Telegram Daily Summary Bot

This OpenClaw project monitors your Gmail and sends a daily summary via Telegram at 10:00 AM.

## Setup

1. **Telegram Bot**: 
   - Create a bot via @BotFather on Telegram.
   - Get the `TELEGRAM_BOT_TOKEN`.

2. **Browser Use**:
   - Ensure `browser-use` is installed: `pip install browser-use[cli] && browser-use install`
   - Ensure you are logged into Gmail in your default Google Chrome profile.

3. **Environment Variables**:
   Create a `.env` file or export:
   ```bash
   export TELEGRAM_BOT_TOKEN="your_bot_token"
   ```

4. **Run**:
   ```bash
   openclaw start
   ```

## Configuration
- **Cron**: Set to `0 10 * * *` (10 AM daily).
- **Tool**: Uses `browser-use` in `--browser real` mode to leverage your existing browser session.
- **Model**: Powered by Claude 3.5 Sonnet.
