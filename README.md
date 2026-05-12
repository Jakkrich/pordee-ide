# pordee-ide

Thai+English terse mode for Antigravity IDE agents.

`pordee` keeps technical English terms exact while shortening Thai responses: less filler, fewer polite particles, less hedging, same technical meaning.

## Credit / Inspiration

`pordee-ide` is an Antigravity IDE adaptation inspired by [kerlos/pordee](https://github.com/kerlos/pordee).

Credit to the original `pordee` project by `kerlos`, which introduced the Thai terse communication mode for coding agents: concise Thai, preserved technical English, and less token waste without losing technical meaning.

This project focuses on making that idea work inside Antigravity through project workflows, `GEMINI.md`, `.agent/workflows/`, and the `bin/pordee.js` CLI.

## Use In Antigravity

Clone and enter the project:

```powershell
git clone https://github.com/Jakkrich/pordee-ide
cd pordee-ide
```

Optional global CLI setup:

```powershell
npm link
pordee status
```

Open the cloned `pordee-ide` folder in Antigravity and use:

```text
/pordee
/pordee lite
/pordee full
/pordee stop
/pordee-stats
/pordee-stats --share
```

Antigravity reads workflows from:

```text
.agent/workflows/pordee.md
.agent/workflows/pordee-stats.md
.agent/skills/pordee/SKILL.md
GEMINI.md
AGENTS.md
```

If `/pordee` does not appear, reload the workspace and make sure the folder is named `.agent`.

## CLI

Run from this repo:

```powershell
node bin\pordee.js status
node bin\pordee.js on
node bin\pordee.js level lite
node bin\pordee.js level full
node bin\pordee.js off
node bin\pordee.js reminder
node bin\pordee.js stats
```

Install as a global command during development:

```powershell
npm link
pordee status
pordee on
pordee stats
```

Install a fixed global copy:

```powershell
npm install -g .
```

Unlink:

```powershell
npm unlink -g pordee
```

## Install Into Another Antigravity Project

Copy the workflow files:

```powershell
Copy-Item -Recurse -Force D:\pordee-ide\.agent D:\my-project\.agent
Copy-Item -Force D:\pordee-ide\GEMINI.md D:\my-project\GEMINI.md
Copy-Item -Force D:\pordee-ide\AGENTS.md D:\my-project\AGENTS.md
```

Then open or reload `D:\my-project` in Antigravity.

If `pordee` is installed globally, the workflows can call:

```powershell
pordee on
pordee reminder
pordee stats
```

If not global, call the repo path directly:

```powershell
node D:\pordee-ide\bin\pordee.js on
node D:\pordee-ide\bin\pordee.js reminder
node D:\pordee-ide\bin\pordee.js stats
```

## State And Stats

State is stored in:

```text
~\.pordee\state.json
```

Stats read Antigravity local logs from:

```text
~\.gemini\antigravity\.token-monitor\
~\.gemini\antigravity\brain\*\.system_generated\logs\overview.txt
```

`.token-monitor` data is treated as exact when usage metadata exists. `overview.txt` only exposes text, so `pordee-stats` labels those numbers as `Output tokens (approx)`.

## Development

```powershell
npm test
node -c lib\pordee-core.js
node -c lib\pordee-stats.js
node bin\pordee.js status
```
