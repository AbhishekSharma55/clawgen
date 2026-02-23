---
name: email-daily-summary
description: Uses browser-use to login to Gmail and extract unread emails from today for summarization.
metadata: {"openclaw":{"requires":{"bins":["uv","browser-use"]}}}
---

## Instructions

1. Use `browser-use --browser real open https://mail.google.com` to access the Gmail inbox.
2. Filter for unread emails from "today".
3. Extract sender, subject, and a brief snippet of the body for each unread email.
4. Provide a structured summary.
5. If not logged in, prompt the user to perform a manual login using `--headed` mode once.
