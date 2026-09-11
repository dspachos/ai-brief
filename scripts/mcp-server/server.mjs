#!/usr/bin/env node
// The AI Brief — MCP server (stdio).
// Stateless: every call fetches the live public index from the deployed site,
// so users always get the latest briefing. Override target with AI_BRIEF_URL.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE = (process.env.AI_BRIEF_URL || 'https://dspachos.github.io/ai-brief').replace(/\/?$/, '/');
const j = async f => (await fetch(new URL(f, BASE).href)).json();
const reply = data => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

async function briefing(date) {
  const [posts, items] = await Promise.all([j('posts.json'), j('search.json')]);
  const meta = posts.find(p => p.date === date) || posts[0];
  if (!meta) throw new Error('no briefings published yet');
  const sections = [];
  for (const it of items.filter(i => i.date === meta.date)) {
    let s = sections.find(x => x.section === it.section);
    if (!s) sections.push(s = { section: it.section, items: [] });
    s.items.push({ title: it.title, text: it.text, url: new URL(it.url, BASE).href });
  }
  return { date: meta.date, title: meta.title, summary: meta.summary, url: new URL(meta.file, BASE).href, sections };
}

async function search(query, limit = 10) {
  const items = await j('search.json');
  const q = String(query || '').toLowerCase();
  return items
    .filter(it => (it.title + ' ' + it.text).toLowerCase().includes(q))
    .slice(0, limit)
    .map(({ date, section, title, text, url }) => ({
      date, section, title,
      text: text.length > 400 ? text.slice(0, 400) + '…' : text,
      url: new URL(url, BASE).href
    }));
}

const server = new McpServer({ name: 'ai-brief', version: '1.0.0' });

server.tool(
  'get-latest-briefing',
  'The latest AI Brief daily briefing, with full content: date, title, summary, every section (top stories, tools & releases, money & deals, markets, quick hits) and all items with links.',
  {},
  async () => reply(await briefing())
);

server.tool(
  'get-briefing-by-date',
  'A specific AI Brief daily briefing by date (YYYY-MM-DD), with full sections and items.',
  { date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').describe('Briefing date') },
  async ({ date }) => reply(await briefing(date))
);

server.tool(
  'search-briefing-items',
  'Full-text search across individual items (stories, tools, deals, market commentary, quick hits) from the last 30 days of AI Brief briefings.',
  { query: z.string().min(2).describe('Search term, e.g. "nvda", "gpt-6", "stripe"') },
  async ({ query }) => reply({ query, matches: await search(query) })
);

await server.connect(new StdioServerTransport());
