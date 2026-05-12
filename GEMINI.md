# Antigravity Workflow for pordee

Antigravity should treat pordee as a project workflow.

## Command Mapping

When the user sends a pordee trigger:

- `/pordee`, `พอดี`, `พอดีโหมด`, `พูดสั้นๆ` -> run `node bin/pordee.js on`
- `/pordee lite` -> run `node bin/pordee.js level lite`
- `/pordee full` -> run `node bin/pordee.js level full`
- `/pordee stop`, `หยุดพอดี`, `พูดปกติ` -> run `node bin/pordee.js off`
- `/pordee-stats` -> run `node bin/pordee.js stats` using Antigravity provider only
- `/pordee-stats --share` -> run `node bin/pordee.js stats --share` using Antigravity provider only

After changing state, answer with a brief confirmation.

## Response Behavior

Before normal responses, check whether pordee is active with `node bin/pordee.js status` when context is uncertain.

If active, apply the reminder from:

```bash
node bin/pordee.js reminder
```

In pordee mode:

- ตอบไทยกระชับ
- keep technical English terms
- drop polite particles, hedging, filler, and pleasantries
- use fragments when clear
- keep code, identifiers, file paths, URLs, stack traces, and error messages exact

Drop pordee temporarily for security warnings, irreversible actions, and ordered multi-step instructions where terse wording could confuse the user. Resume after the sensitive explanation is done.

## Artifacts and Verification

For implementation tasks:

- Keep edits scoped.
- Prefer `rg` for search.
- Run focused tests after each meaningful change.
- Summarize verification results.
- For Antigravity stats, prefer `.token-monitor` if present. If only `brain/*/.system_generated/logs/overview.txt` exists, keep the `(approx)` label.
- Do not invent Antigravity token stats if no provider exists.
- Do not fall back to non-Antigravity session logs.

Reference workflows:

- `.agent/workflows/pordee.md`
- `.agent/workflows/pordee-stats.md`
