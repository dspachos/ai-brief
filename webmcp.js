// WebMCP — expose The AI Brief's data as tools for browser agents.
// Spec (W3C draft): https://webmachinelearning.github.io/webmcp/
// Current draft: document.modelContext.registerTool(); older drafts:
// navigator.modelContext.provideContext(). Both supported, feature-detected.
// Silently no-ops in browsers without support.
(async () => {
  const mc = document.modelContext || navigator.modelContext;
  if (!mc || !(mc.registerTool || mc.provideContext)) return;

  const j = async f => (await fetch(f)).json();
  const reply = obj => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

  const tools = [
    {
      name: 'get-latest-briefing',
      description: 'Get the latest AI Brief daily briefing: date, title, summary, and link.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => reply((await j('posts.json'))[0])
    },
    {
      name: 'search-briefing-items',
      description: 'Full-text search over individual items (stories, tools, deals, market commentary, quick hits) from the last 30 days of AI Brief briefings. Returns matching items with links.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term, e.g. "nvda", "gpt-6", "stripe"' }
        },
        required: ['query']
      },
      execute: async ({ query }) => {
        const q = String(query || '').toLowerCase();
        const items = await j('search.json');
        const hits = items
          .filter(it => (it.title + ' ' + it.text).toLowerCase().includes(q))
          .slice(0, 10)
          .map(({ date, section, title, url }) => ({ date, section, title, url }));
        return reply({ query, matches: hits.length, items: hits });
      }
    }
  ];

  if (mc.registerTool) {
    for (const t of tools) await mc.registerTool(t);
  } else {
    mc.provideContext({ tools });
  }
  console.info('[webmcp] registered tools:', tools.map(t => t.name).join(', '));
})();
