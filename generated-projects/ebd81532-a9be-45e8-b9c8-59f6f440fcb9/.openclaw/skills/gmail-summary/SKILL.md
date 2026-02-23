---
name: gmail-summary
description: Uses browser-use to log into Gmail (real mode) and summarize recent emails.
metadata: {"openclaw":{"requires":{"bins":["browser-use"]}}}
---

## Instructions

When asked to summarize Gmail:
1. Run `browser-use --browser real open https://mail.google.com`.
2. Use `browser-use state` to find unread emails.
3. If unread emails exist, for each important-looking one:
   - Click the email index.
   - Use `browser-use state` to read the snippet or content.
   - Summarize the key takeaway (Sender, Subject, 1-sentence summary).
4. Return the final formatted summary.

Note: Since the user is using a 'real' browser session, you should already be logged in if they are logged in on their local machine.