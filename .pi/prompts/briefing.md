---
description: Generate today's AI briefing post (Exa search + RSS + markets), update the index, and commit
---

# Daily AI Briefing

Generate today's edition of The AI Brief. Follow these steps in order.

## 1. Setup

- Run `date +%F` to get today's date `YYYY-MM-DD`.
- If `posts/YYYY-MM-DD.html` already exists, stop and say so — never overwrite an existing edition.

## 2. Gather

**Search** — call `web_search` with `provider: "exa"`, `recencyFilter: "day"`, `numResults: 8`, and these 4 query angles (rephrase as you like, keep the spread):
1. biggest AI announcements and news today
2. new AI model releases and AI tools launch
3. AI companies funding acquisitions business news
4. Nvidia AI stocks market news today

**RSS** — for each non-comment line in `feeds.txt` (format `Name — URL`), fetch titles and links only. Feeds embed full article bodies — never dump them into context:

```bash
curl -s -m 15 -A "Mozilla/5.0" "$URL" | grep -oE '<title>[^<]+</title>|<link>[^<]+</link>' | head -40
```

A feed that fails or rate-limits is skipped, not an error.

**Quotes** — `python3 scripts/quotes.py` for the markets table (NVDA MSFT GOOGL META AMZN TSM AMD PLTR).

## 3. Select

Dedupe across all sources (the same story often appears in search and feeds; prefer the original publisher over aggregators). Only report what a source actually says — link it, no fabrication, no filling gaps from memory. Aim for:

- **Top stories**: 4–6 items, 2–4 sentences each
- **Tools & releases**: 4–6 items (new models, APIs, products)
- **Money & deals**: 4–6 items (funding, M&A, licensing)
- **Markets**: the full 8-ticker table + 1–2 paragraphs of commentary tying moves to the day's news
- **Quick hits**: 4–6 one-liners

Prioritize: major model/product launches > big money moves > safety/policy > research > everything else. Prefer the last 24h; anything older than 48h needs a reason to be in.

## 4. Write

- Copy `template.html` structure into `posts/YYYY-MM-DD.html` (same head, fonts, section markup, relative links to `../index.html`).
- Post title: `AI Briefing — <Month D, YYYY>`.
- Green `text-green-400` for gains, red `text-red-400` for losses in the markets table.
- Footer notes the quote timestamp ("last close <date>") and sources (Exa, RSS, Yahoo Finance).

## 5. Index

Prepend to `posts.json` (newest first, valid JSON):

```json
{ "date": "YYYY-MM-DD", "title": "AI Briefing — <Month D, YYYY>", "summary": "<2-sentence summary of the day>", "file": "posts/YYYY-MM-DD.html" }
```

## 6. Commit

```bash
git add posts/YYYY-MM-DD.html posts.json
git commit -m "feat: briefing for YYYY-MM-DD"
```

Do not push. Report back: item count per section and a one-line recap of the day.
