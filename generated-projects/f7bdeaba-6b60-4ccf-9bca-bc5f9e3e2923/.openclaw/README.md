# News Intelligence Bot Setup

This project sets up an OpenClaw agent that sends daily news summaries from BBC, Reuters, and NPR to your Telegram.

## Environment Variables
Create a `.env` file or export these variables:
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather.

## Installation
1. Ensure you have `openclaw` installed.
2. Place this `.openclaw` folder in your project directory.
3. Run:
   ```bash
   OPENCLAW_HOME=. openclaw start
   ```

## Usage
1. Open your Telegram bot and send `/start`.
2. The agent will pair with you.
3. Every day at 9:00 AM UTC, you will receive your news briefing.
4. You can also ask "Give me a news update" at any time.

## Project Structure
- `openclaw.json`: Master configuration (Crons, Channels).
- `newsbot/`: The agent's workspace.
- `newsbot/skills/news-summary/`: Custom skill for fetching RSS news.
