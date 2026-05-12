const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CLI = path.join(__dirname, '..', 'bin', 'pordee.js');

function makeTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pordee-cli-'));
}

function runCli(home, args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, PORDEE_HOME: home, ...env },
    encoding: 'utf8',
    timeout: 5000
  });
}

function readState(home) {
  return JSON.parse(fs.readFileSync(path.join(home, 'state.json'), 'utf8'));
}

test('cli status shows default state', () => {
  const home = makeTempHome();
  try {
    const result = runCli(home, ['status']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /pordee off/);
    assert.match(result.stdout, /level: full/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('cli on and off update state', () => {
  const home = makeTempHome();
  try {
    assert.equal(runCli(home, ['on']).status, 0);
    assert.equal(readState(home).enabled, true);
    assert.equal(runCli(home, ['off']).status, 0);
    assert.equal(readState(home).enabled, false);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('cli level updates state and enables mode', () => {
  const home = makeTempHome();
  try {
    const result = runCli(home, ['level', 'lite']);
    assert.equal(result.status, 0);
    const state = readState(home);
    assert.equal(state.enabled, true);
    assert.equal(state.level, 'lite');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('cli invalid level exits 2', () => {
  const home = makeTempHome();
  try {
    const result = runCli(home, ['level', 'tiny']);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Invalid level/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('cli reminder prints active reminder', () => {
  const home = makeTempHome();
  try {
    runCli(home, ['level', 'full']);
    const result = runCli(home, ['reminder']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /PORDEE MODE ACTIVE \(full\)/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('cli stats uses Antigravity provider by default', () => {
  const home = makeTempHome();
  const antigravityHome = path.join(home, 'antigravity-empty');
  try {
    const result = runCli(home, ['stats'], { ANTIGRAVITY_HOME: antigravityHome });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /no Antigravity session logs found/);
    assert.equal(result.stderr.trim(), '');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
