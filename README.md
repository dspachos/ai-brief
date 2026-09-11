# The AI Brief

A daily AI news briefing — static site, no build step. Every post is written by a [pi](https://github.com/earendil-works/pi-coding-agent) agent from live search (Exa), RSS feeds, and market data, then committed as plain HTML.

## Structure

```
index.html               # homepage — Alpine.js fetches posts.json and renders the list
posts.json               # post index, newest first
posts/YYYY-MM-DD.html    # one self-contained briefing per day
template.html            # markup scaffold for new posts
feeds.txt                # RSS sources (one per line: Name — URL)
scripts/quotes.py        # 8-ticker market snapshot (Yahoo Finance, no key)
.pi/prompts/briefing.md  # the /briefing prompt — the whole editorial pipeline
```

## Daily run

In this repo:

```
pi        # then type:  /briefing
```

Headless: `pi -p @.pi/prompts/briefing.md`

The agent searches, reads feeds, pulls quotes, writes the post, updates `posts.json`, and commits. It does not push — review, then `git push`.

## Local preview

`fetch()` needs http, not `file://`:

```
python3 -m http.server 8080
open http://localhost:8080
```

## Tuning

- **Sources**: edit `feeds.txt` (skip-comment lines are ignored).
- **Tickers**: edit `TICKERS` in `scripts/quotes.py`.
- **Format/sections**: edit `.pi/prompts/briefing.md` and `template.html` together.

## Publish (later)

GitHub Pages, served from the root of `main` — no Actions needed for the site itself.
