const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseTrigger,
  stripCodeFences,
  makeSessionStartReminder,
  makePromptReminder
} = require('../lib/pordee-core');

test('core parses slash pordee commands', () => {
  assert.deepEqual(parseTrigger('/pordee'), { enabled: true });
  assert.deepEqual(parseTrigger('/pordee lite'), { enabled: true, level: 'lite' });
  assert.deepEqual(parseTrigger('/pordee full'), { enabled: true, level: 'full' });
  assert.deepEqual(parseTrigger('/pordee stop'), { enabled: false });
});

test('core parses Antigravity stats slash commands', () => {
  assert.deepEqual(parseTrigger('/pordee-stats'), { action: 'stats', share: false });
  assert.deepEqual(parseTrigger('/pordee-stats --share'), { action: 'stats', share: true });
});

test('core parses exact Thai triggers only', () => {
  assert.deepEqual(parseTrigger('พอดี'), { enabled: true });
  assert.deepEqual(parseTrigger('พอดีโหมด'), { enabled: true });
  assert.deepEqual(parseTrigger('พูดสั้นๆ'), { enabled: true });
  assert.deepEqual(parseTrigger('หยุดพอดี'), { enabled: false });
  assert.deepEqual(parseTrigger('พูดปกติ'), { enabled: false });
  assert.equal(parseTrigger('ไม่พอดีกับขนาดกล่อง'), null);
});

test('core ignores triggers inside code fences', () => {
  const cleaned = stripCodeFences('before\n```\n/pordee lite\n```\nafter');
  assert.equal(cleaned.includes('/pordee lite'), false);
  assert.equal(parseTrigger('```\n/pordee lite\n```'), null);
});

test('core builds reminders with active level', () => {
  assert.match(makeSessionStartReminder({ enabled: true, level: 'lite' }), /level: lite/);
  assert.match(makePromptReminder({ enabled: true, level: 'full' }), /PORDEE MODE ACTIVE \(full\)/);
});
