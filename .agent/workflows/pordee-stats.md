---
description: Show pordee token usage stats when a supported session provider is available.
---

# pordee Stats Workflow

Use this workflow for `/pordee-stats` in Antigravity.

## Execute

1. Run `node bin/pordee.js stats`.

For share output:

2. For share output, run `node bin/pordee.js stats --share`.

## Report

If stats output is available, return the exact numbers.

If Antigravity `.token-monitor` logs exist, return exact token numbers from them.

If only `brain/*/.system_generated/logs/overview.txt` exists, report approximate output tokens and keep the `(approx)` label. Do not present approximate numbers as exact.

If no Antigravity logs exist, say that no Antigravity session logs were found. Do not fall back to non-Antigravity session logs.
