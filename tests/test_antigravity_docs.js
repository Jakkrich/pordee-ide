const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('AGENTS.md documents shared agent rules', () => {
  const text = read('AGENTS.md');
  assert.match(text, /pordee/);
  assert.match(text, /Antigravity workflow/);
  assert.match(text, /lib\/pordee-core\.js/);
  assert.match(text, /state\.json/);
});

test('GEMINI.md documents Antigravity command mapping', () => {
  const text = read('GEMINI.md');
  assert.match(text, /Antigravity/);
  assert.match(text, /node bin\/pordee\.js on/);
  assert.match(text, /node bin\/pordee\.js reminder/);
  assert.match(text, /Do not invent Antigravity token stats/);
});

test('Antigravity workflow docs exist', () => {
  assert.match(read('.agent/workflows/pordee.md'), /description: Enable, disable, or switch pordee/);
  assert.match(read('.agent/workflows/pordee.md'), /pordee Mode Workflow/);
  assert.match(read('.agent/workflows/pordee-stats.md'), /description: Show pordee token usage stats/);
  assert.match(read('.agent/workflows/pordee-stats.md'), /Do not present approximate numbers as exact/);
  assert.match(read('.agent/skills/pordee/SKILL.md'), /name: pordee/);
});
