# The AI Brief

A daily AI news briefing — **[live site](https://dspachos.github.io/ai-brief/)**.

Every day, a [pi](https://github.com/earendil-works/pi-coding-agent) agent researches what moved in AI (news, tools, deals, markets), writes a briefing, and publishes it as plain static HTML. No CMS, no build step, no framework — the agent *is* the site generator.

## How a briefing is made

1. **Exa search** — four angled queries over the last 24h: top news, model/tool releases, funding & M&A, markets
2. **RSS** — a curated feed list (TechCrunch AI, The Verge AI, Ars Technica, MIT Tech Review, Import AI, Simon Willison, MarkTechPost, VentureBeat AI)
3. **Market data** — Yahoo Finance quotes for NVDA, MSFT, GOOGL, META, AMZN, TSM, AMD, PLTR
4. The agent dedupes, selects 4–6 items per section, writes the post, updates the index, and commits

Every item links its source. Nothing is published without a citation.

## Repo structure

```
index.html               # homepage — latest briefing (Alpine.js + posts.json)
archive.html             # all briefings, grouped by month, paginated
posts.json               # post index, newest first
posts/YYYY-MM-DD.html    # one self-contained briefing per day
template.html            # markup scaffold for new posts
feeds.txt                # RSS sources (Name — URL per line)
scripts/quotes.py        # 8-ticker market snapshot (no API key)
.pi/prompts/briefing.md  # the /briefing prompt — the whole editorial pipeline
```

## Daily workflow

```bash
cd ai-brief
pi          # then type:  /briefing
```

The agent gathers sources, writes `posts/YYYY-MM-DD.html`, prepends it to `posts.json`, commits, and pushes to GitHub — Pages redeploys automatically (it never overwrites an existing day). To preview locally before it goes live, run the server while the agent works:

```bash
python3 -m http.server 8080
open http://localhost:8080
```

Headless variant: `pi -p @.pi/prompts/briefing.md`

## Tech

- **Static HTML** — Tailwind CSS (CDN) + Alpine.js, zero build step
- **GitHub Pages** — served from the root of `main`
- **Design** — editorial look inspired by [kami](https://github.com/) typesetting: warm parchment `#f5f4ed`, ink-blue accent `#1B365D`, Charter serif, hairline rules

All relative paths, so it works locally, under the `/ai-brief/` subpath, or on a custom domain.

## Tuning

| What | Where |
|---|---|
| RSS sources | `feeds.txt` |
| Stock tickers | `TICKERS` in `scripts/quotes.py` |
| Sections, tone, item counts | `.pi/prompts/briefing.md` |
| Layout | `template.html` |

## License

Content © 2026 The AI Brief. Code is provided as-is for personal use.
