---
name: news-summary
description: Fetches and summarizes news from trusted international RSS feeds (BBC, Reuters, NPR).
metadata: {"openclaw":{"requires":{"bins":["curl","grep","sed"]}}}
---

# News Summary Instructions

When asked to fetch news, use the following RSS feeds:

### Sources:
- BBC World: `https://feeds.bbci.co.uk/news/world/rss.xml`
- Reuters: `https://www.reutersagency.com/feed/?best-regions=world&post_type=best`
- NPR: `https://feeds.npr.org/1001/rss.xml`

### Extraction Command:
Use curl to fetch and basic text processing to extract headlines and descriptions:
```bash
curl -s "https://feeds.bbci.co.uk/news/world/rss.xml" | grep -E "<title>|<description>" | sed 's/<[^>]*>//g' | head -20
```

### Response Style:
1. **Headline**: Bold and clear.
2. **Summary**: 2-3 sentences max.
3. **Tone**: Objective and professional.
4. **Format**: Use Telegram-friendly Markdown (e.g., *bold* for titles).
