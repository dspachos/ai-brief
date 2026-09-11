#!/usr/bin/env python3
"""Daily quotes for the AI Brief. Yahoo Finance chart API, no key needed."""
import json, subprocess, sys

TICKERS = ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "TSM", "AMD", "PLTR"]

for t in TICKERS:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{t}?interval=1d&range=5d"
    out = subprocess.run(["curl", "-s", "-m", "10", "-A", "Mozilla/5.0", url],
                         capture_output=True, text=True).stdout
    try:
        m = json.loads(out)["chart"]["result"][0]["meta"]
        print(f'{t}: {m["regularMarketPrice"]} {m["regularMarketChangePercent"]:+.2f}%')
    except Exception as e:
        print(f"{t}: ERROR {e}", file=sys.stderr)
