---
name: pordee
description: Antigravity-facing workflow skill for terse Thai+English responses.
---

# pordee for Antigravity

Use pordee when the user requests `/pordee`, `/pordee lite`, `/pordee full`, `/pordee stop`, `พอดี`, `พอดีโหมด`, `พูดสั้นๆ`, `หยุดพอดี`, or `พูดปกติ`.

Control mode through the project CLI:

```bash
node bin/pordee.js on
node bin/pordee.js level lite
node bin/pordee.js level full
node bin/pordee.js off
node bin/pordee.js status
node bin/pordee.js reminder
```

When active, answer in concise Thai, keep technical English terms, remove polite particles and hedging, and preserve code/paths/errors exactly.

For stats, use:

```bash
node bin/pordee.js stats
node bin/pordee.js stats --share
```

Never fabricate stats when no session provider exists.
