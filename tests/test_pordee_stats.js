#!/usr/bin/env node
// Tests for Antigravity-only pordee-stats.

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STATS = path.join(ROOT, 'lib', 'pordee-stats.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pordee-stats-test-'));
  try {
    fn(tmp);
    passed++;
    console.log(`  ok ${name}`);
  } catch (e) {
    failed++;
    console.error(`  fail ${name}\n    ${e.message}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function makeSession(dir, lines) {
  const logDir = path.join(dir, 'antigravity', '.token-monitor');
  fs.mkdirSync(logDir, { recursive: true });
  const sessFile = path.join(logDir, 's.jsonl');
  fs.writeFileSync(sessFile, lines.map(l => JSON.stringify(l)).join('\n'));
  return sessFile;
}

function makePordeeState(dir, state = { enabled: true, level: 'full', version: 1 }) {
  const pordeeDir = path.join(dir, '.pordee');
  fs.mkdirSync(pordeeDir, { recursive: true });
  fs.writeFileSync(path.join(pordeeDir, 'state.json'), JSON.stringify(state));
  return pordeeDir;
}

function envFor(tmp, extra = {}) {
  return {
    ...process.env,
    PORDEE_HOME: path.join(tmp, '.pordee'),
    ANTIGRAVITY_HOME: path.join(tmp, 'antigravity'),
    ...extra,
  };
}

console.log('pordee-stats tests\n');

test('reads --session-file directly and sums Antigravity usage tokens', (tmp) => {
  const sess = makeSession(tmp, [
    { source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'done', model: 'kimi-for-coding', usage: { output_tokens: 100, cache_read_input_tokens: 200 } },
    { source: 'USER_EXPLICIT', type: 'USER_INPUT', content: 'hi' },
    { source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'done again', usage: { output_tokens: 50, cache_read_input_tokens: 50 } },
  ]);
  makePordeeState(tmp);

  const out = execFileSync(process.execPath, [STATS, '--session-file', sess], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.match(out, /Output tokens:\s+150/);
  assert.match(out, /Cache-read tokens:\s+250/);
  assert.match(out, /USD/);
  assert.match(out, /kimi-for-coding/);
});

test('reports unavailable when Antigravity has no session source', (tmp) => {
  let err = null;
  try {
    execFileSync(process.execPath, [STATS], {
      encoding: 'utf8',
      env: envFor(tmp),
    });
  } catch (e) { err = e; }
  assert.ok(err, 'should exit non-zero');
  assert.match(err.stderr, /no Antigravity session logs found/);
});

test('reads Antigravity overview logs with approximate output tokens', (tmp) => {
  const overviewDir = path.join(tmp, 'antigravity', 'brain', 'session-a', '.system_generated', 'logs');
  fs.mkdirSync(overviewDir, { recursive: true });
  fs.writeFileSync(path.join(overviewDir, 'overview.txt'), [
    JSON.stringify({ source: 'USER_EXPLICIT', type: 'USER_INPUT', content: 'hi' }),
    JSON.stringify({ source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'short technical response' }),
    JSON.stringify({ source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'another response' }),
  ].join('\n'));
  makePordeeState(tmp);

  const out = execFileSync(process.execPath, [STATS], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.match(out, /overview\.txt/);
  assert.match(out, /Output tokens \(approx\):/);
});

test('formatStats handles empty session gracefully', () => {
  const { formatStats } = require(STATS);
  const out = formatStats({ outputTokens: 0, cacheReadTokens: 0, turns: 0, level: 'full', model: null });
  assert.match(out, /Stats/);
});

test('--share prints single-line summary', (tmp) => {
  const sess = makeSession(tmp, [
    { source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'done', model: 'kimi-for-coding', usage: { output_tokens: 350 } },
  ]);
  makePordeeState(tmp);

  const out = execFileSync(process.execPath, [STATS, '--session-file', sess, '--share'], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.strictEqual(out.split('\n').filter(Boolean).length, 1);
  assert.match(out.trim(), /pordee$/);
});

test('appends to lifetime history on each run', (tmp) => {
  const sess = makeSession(tmp, [
    { source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'done', model: 'kimi-for-coding', usage: { output_tokens: 350 } },
  ]);
  makePordeeState(tmp);

  execFileSync(process.execPath, [STATS, '--session-file', sess], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  const histPath = path.join(tmp, '.pordee', 'history.jsonl');
  assert.ok(fs.existsSync(histPath), 'history file should be created');
  const lines = fs.readFileSync(histPath, 'utf8').split('\n').filter(Boolean);
  assert.strictEqual(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.strictEqual(entry.session_id, 's');
  assert.strictEqual(entry.output_tokens, 350);
  assert.strictEqual(entry.level, 'full');
  assert.strictEqual(entry.model, 'kimi-for-coding');
});

test('--all aggregates latest entry per session', (tmp) => {
  makePordeeState(tmp);
  const histPath = path.join(tmp, '.pordee', 'history.jsonl');
  fs.writeFileSync(histPath, [
    { ts: 1000, session_id: 'a', level: 'full', output_tokens: 100, est_saved_tokens: 138, est_saved_usd: 0.0021 },
    { ts: 2000, session_id: 'b', level: 'full', output_tokens: 50, est_saved_tokens: 69, est_saved_usd: 0.0010 },
    { ts: 3000, session_id: 'b', level: 'full', output_tokens: 200, est_saved_tokens: 276, est_saved_usd: 0.0041 },
  ].map(o => JSON.stringify(o)).join('\n') + '\n');

  const out = execFileSync(process.execPath, [STATS, '--all'], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.match(out, /Sessions:\s+2/);
  assert.match(out, /414/);
  assert.match(out, /\$0\.0062/);
});

test('--since filters by time window', (tmp) => {
  makePordeeState(tmp);
  const histPath = path.join(tmp, '.pordee', 'history.jsonl');
  const now = Date.now();
  fs.writeFileSync(histPath, [
    { ts: now - 2 * 86_400_000, session_id: 'old', level: 'full', output_tokens: 100, est_saved_tokens: 138, est_saved_usd: 0.002 },
    { ts: now - 10 * 60_000, session_id: 'new', level: 'full', output_tokens: 50, est_saved_tokens: 69, est_saved_usd: 0.001 },
  ].map(o => JSON.stringify(o)).join('\n') + '\n');

  const out = execFileSync(process.execPath, [STATS, '--since', '1d'], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.match(out, /Sessions:\s+1/);
  assert.match(out, /\(last 1d\)/);
});

test('--since rejects malformed durations', (tmp) => {
  makePordeeState(tmp);
  let err = null;
  try {
    execFileSync(process.execPath, [STATS, '--since', 'sometime'], {
      encoding: 'utf8',
      env: envFor(tmp),
    });
  } catch (e) { err = e; }
  assert.ok(err, 'should exit non-zero');
  assert.match(err.stderr, /--since takes Nh or Nd/);
});

test('--all reports empty when no history', (tmp) => {
  makePordeeState(tmp);
  const out = execFileSync(process.execPath, [STATS, '--all'], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  assert.match(out, /Stats/);
});

test('writes statusline suffix file after a stats run', (tmp) => {
  const sess = makeSession(tmp, [
    { source: 'MODEL', type: 'PLANNER_RESPONSE', content: 'done', model: 'kimi-for-coding', usage: { output_tokens: 1500 } },
  ]);
  makePordeeState(tmp);

  execFileSync(process.execPath, [STATS, '--session-file', sess], {
    encoding: 'utf8',
    env: envFor(tmp),
  });
  const suffixPath = path.join(tmp, '.pordee', 'statusline-suffix');
  assert.ok(fs.existsSync(suffixPath));
  assert.ok(fs.readFileSync(suffixPath, 'utf8').trim());
});

test('humanizeTokens formats small/medium/large correctly', () => {
  const { humanizeTokens } = require(STATS);
  assert.strictEqual(humanizeTokens(0), '0');
  assert.strictEqual(humanizeTokens(42), '42');
  assert.strictEqual(humanizeTokens(2786), '2.8k');
  assert.strictEqual(humanizeTokens(1_250_000), '1.3M');
});

test('priceForModel matches Antigravity model prefixes', () => {
  const { priceForModel } = require(STATS);
  assert.strictEqual(priceForModel('kimi-for-coding'), 15.00);
  assert.strictEqual(priceForModel('kimi-for-coding-20260501'), 15.00);
  assert.strictEqual(priceForModel('kimi-k2-5'), 15.00);
  assert.strictEqual(priceForModel(null), null);
  assert.strictEqual(priceForModel('gpt-4'), null);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
