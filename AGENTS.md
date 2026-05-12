# pordee Agent Guide

## Project

`pordee` is a Thai+English terse communication mode for coding agents. It keeps technical English terms intact while removing polite particles, hedging, filler, and verbose Thai phrasing.

The project targets Antigravity IDE through the Antigravity workflow files in `.agent/`, plus `GEMINI.md` and `bin/pordee.js`.

## Development Rules

- Runtime is Node.js 18+.
- Module format is CommonJS.
- Do not add runtime dependencies unless a task explicitly requires them.
- Shared behavior belongs in `lib/pordee-core.js`.
- IDE-specific behavior belongs in `.agent/` workflow docs or `lib/session-providers/`.
- Keep `~/.pordee/state.json` backward-compatible.

## Commands

- Run focused tests with `node --test tests/test_core.js tests/test_cli.js`.
- Run the project CLI with `node bin/pordee.js status`.
- Use `node -c <file>` for syntax checks.
- `npm test` may be blocked on Windows PowerShell if script execution is disabled; use `node --test` directly.

## State Contract

State is stored at `$PORDEE_HOME/state.json`, defaulting to `~/.pordee/state.json`.

```json
{
  "enabled": true,
  "level": "full",
  "version": 1,
  "lastChanged": "2026-05-12T16:30:00.000Z"
}
```

Valid levels are `lite` and `full`.

## Triggers

- `/pordee`: enable
- `/pordee lite`: enable lite
- `/pordee full`: enable full
- `/pordee stop`: disable
- `พอดี`, `พอดีโหมด`, `พูดสั้นๆ`: enable
- `หยุดพอดี`, `พูดปกติ`: disable
- `/pordee-stats`, `/pordee-stats --share`: stats

Thai triggers are exact-line only. Ignore triggers inside fenced code blocks.

## Safety

- Never fabricate token stats. If a session provider is unavailable, say so.
- Do not auto-run destructive commands without explicit user confirmation.
- Keep code blocks, file paths, URLs, identifiers, stack traces, commits, PR text, and review comments exact or normal English as appropriate.
