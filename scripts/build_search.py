#!/usr/bin/env python3
"""Build search.json — item-level search index over the last 31 days of briefings.

Parses posts/*.html (sections -> articles/quick-hits/markets commentary) into
flat items: {date, section, sid, title, text, url}. Deterministic, stdlib only.
Run by the /briefing pipeline after each new post; also runnable by hand.
"""
import json
import sys
from datetime import date, timedelta
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WINDOW = 31


class ItemParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []
        self.sid = None
        self.sect_title = None
        self.in_article = False
        self.div_depth = 0
        self.capture = None
        self.buf = []
        self.art_title = ''
        self.art_body = ''
        self.art_has_body = False

    def _txt(self):
        return ' '.join(''.join(self.buf).split())

    def _push(self, title, text):
        self.items.append({'section': self.sect_title or '', 'sid': self.sid,
                           'title': title, 'text': text})

    def handle_starttag(self, tag, attrs):
        if tag == 'section':
            self.sid = dict(attrs).get('id')
            self.sect_title = None
            self.in_article = False
            self.div_depth = 0
        elif tag == 'div' and self.sid is not None:
            self.div_depth += 1
        elif tag == 'article' and self.sid is not None:
            self.in_article = True
            self.art_title = ''
            self.art_body = ''
            self.art_has_body = False
        elif self.sid is not None and tag in ('h2', 'h3', 'p', 'li'):
            self.capture = tag
            self.buf = []

    def handle_endtag(self, tag):
        if tag == 'section':
            self.sid = None
        elif tag == 'div' and self.div_depth:
            self.div_depth -= 1
        elif tag == 'article':
            self.in_article = False
        elif tag == self.capture:
            text = self._txt()
            self.capture = None
            if not text:
                return
            if tag == 'h2' and self.sect_title is None:
                self.sect_title = text
            elif tag == 'h3' and self.in_article:
                self.art_title = text
            elif tag == 'p':
                if self.in_article:
                    if not self.art_has_body:
                        self.art_body = text
                        self.art_has_body = True
                elif self.sid == 'markets' and self.div_depth == 0 and len(text) > 80:
                    self._push('Market commentary', text)
            elif tag == 'li':
                self._push(text.split(' — ')[0], text)
            if tag == 'p' and self.in_article and self.art_has_body and self.art_title:
                self._push(self.art_title, self.art_body)
                self.in_article = False

    def handle_data(self, d):
        if self.capture:
            self.buf.append(d)


def main():
    cutoff = (date.today() - timedelta(days=WINDOW)).isoformat()
    out = []
    for f in sorted(ROOT.glob('posts/*.html'), reverse=True):
        d = f.stem
        if len(d) != 10 or d[4] != '-' or d < cutoff:
            continue
        p = ItemParser()
        p.feed(f.read_text())
        out.extend({'date': d, 'url': f'posts/{f.name}#{it["sid"]}', **it} for it in p.items)

    (ROOT / 'search.json').write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
    dates = sorted({i['date'] for i in out}, reverse=True)
    span = f'{dates[-1]}..{dates[0]}' if dates else 'none'
    print(f'search.json: {len(out)} items from {len(dates)} briefing(s) [{span}]')

    if '--check' in sys.argv:
        assert out, 'no items parsed'
        assert all(i.get('title') and i.get('url') and i.get('sid') for i in out), 'missing fields'
        sids = {i['sid'] for i in out}
        assert {'top-stories', 'markets', 'quick-hits'} <= sids, f'missing sections: {sids}'
        print('check: ok')


if __name__ == '__main__':
    main()
