#!/usr/bin/env node
// pordee CLI. Antigravity command surface for IDE agents and humans.

const { spawnSync } = require('child_process');
const path = require('path');
const {
  getState,
  setState,
  makePromptReminder,
  makeSessionStartReminder,
  VALID_LEVELS,
  STATE_PATH
} = require('../lib/pordee-core');

function usage() {
  return [
    'Usage: node bin/pordee.js <command>',
    '',
    'Commands:',
    '  status              Show enabled/level/state path',
    '  on                  Enable pordee mode',
    '  off                 Disable pordee mode',
    '  level lite|full     Enable pordee and set level',
    '  reminder            Print active reminder text',
    '  rules               Print full session-start ruleset',
    '  stats [--share]     Show token stats when a session provider is available',
  ].join('\n');
}

function printStatus() {
  const state = getState();
  process.stdout.write(
    `pordee ${state.enabled ? 'on' : 'off'}\n` +
    `level: ${state.level}\n` +
    `state: ${STATE_PATH}\n`
  );
}

function runStats(args) {
  const statsScript = path.join(__dirname, '..', 'lib', 'pordee-stats.js');
  const statsArgs = [];
  if (args.includes('--share')) statsArgs.push('--share');

  const result = spawnSync(process.execPath, [statsScript, ...statsArgs], {
    encoding: 'utf8',
    env: process.env,
    timeout: 5000,
  });

  if (result.status === 0) {
    process.stdout.write(result.stdout);
    return;
  }

  const message = (result.stderr || result.stdout || result.error?.message || '').toString().trim();
  if (message) {
    if (
      message.includes('Antigravity session provider') ||
      message.includes('no Antigravity session logs found')
    ) {
      process.stdout.write(message + '\n');
      return;
    }
  }

  throw new Error(message || 'pordee-stats failed');
}

function main(argv) {
  const [cmd, ...args] = argv;

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    process.stdout.write(usage() + '\n');
    return 0;
  }

  if (cmd === 'status') {
    printStatus();
    return 0;
  }

  if (cmd === 'on') {
    const state = setState({ enabled: true });
    process.stdout.write(`pordee on (${state.level})\n`);
    return 0;
  }

  if (cmd === 'off') {
    setState({ enabled: false });
    process.stdout.write('pordee off\n');
    return 0;
  }

  if (cmd === 'level') {
    const level = args[0];
    if (!VALID_LEVELS.has(level)) {
      process.stderr.write(`Invalid level: ${level || ''}. Use lite or full.\n`);
      return 2;
    }
    setState({ enabled: true, level });
    process.stdout.write(`pordee on (${level})\n`);
    return 0;
  }

  if (cmd === 'reminder') {
    process.stdout.write(makePromptReminder(getState()) + '\n');
    return 0;
  }

  if (cmd === 'rules') {
    process.stdout.write(makeSessionStartReminder(getState()) + '\n');
    return 0;
  }

  if (cmd === 'stats') {
    runStats(args);
    return 0;
  }

  process.stderr.write(`Unknown command: ${cmd}\n\n${usage()}\n`);
  return 2;
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  }
}

module.exports = { main, usage };
