---
description: Enable, disable, or switch pordee terse Thai+English mode for this project.
---

# pordee Mode Workflow

Use this workflow when the user asks to enable, disable, or change pordee mode in Antigravity.

## Detect

Recognize these exact triggers outside code fences:

- `/pordee`
- `/pordee lite`
- `/pordee full`
- `/pordee stop`
- `พอดี`
- `พอดีโหมด`
- `พูดสั้นๆ`
- `หยุดพอดี`
- `พูดปกติ`

## Execute

Run the matching CLI command:

1. If the user typed `/pordee`, `พอดี`, `พอดีโหมด`, or `พูดสั้นๆ`, run `node bin/pordee.js on`.
2. If the user typed `/pordee lite`, run `node bin/pordee.js level lite`.
3. If the user typed `/pordee full`, run `node bin/pordee.js level full`.
4. If the user typed `/pordee stop`, `หยุดพอดี`, or `พูดปกติ`, run `node bin/pordee.js off`.

## Confirm

5. Use `node bin/pordee.js status` to verify state when needed.

Confirm briefly:

- `pordee on (full)`
- `pordee on (lite)`
- `pordee off`

## Apply

For later responses, apply:

6. Apply the reminder from `node bin/pordee.js reminder` to later responses.

Keep technical English exact. Keep code and file references exact.
