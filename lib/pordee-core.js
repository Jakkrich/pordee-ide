#!/usr/bin/env node
// pordee shared core.
// Keep this file focused on shared pordee behavior, separate from IDE workflow files.

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME_DIR = process.env.PORDEE_HOME || path.join(os.homedir(), '.pordee');
const STATE_PATH = path.join(HOME_DIR, 'state.json');
const ERROR_LOG_PATH = path.join(HOME_DIR, 'error.log');

const DEFAULT_STATE = Object.freeze({
  enabled: false,
  level: 'full',
  version: 1
});

const VALID_LEVELS = new Set(['lite', 'full']);

function logError(msg) {
  try {
    fs.mkdirSync(HOME_DIR, { recursive: true });
    fs.appendFileSync(ERROR_LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    // Logging is best-effort.
  }
}

function getState() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      return { ...DEFAULT_STATE };
    }
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_STATE.enabled,
      level: VALID_LEVELS.has(parsed.level) ? parsed.level : DEFAULT_STATE.level,
      version: typeof parsed.version === 'number' ? parsed.version : DEFAULT_STATE.version,
      lastChanged: parsed.lastChanged || undefined
    };
  } catch (e) {
    logError(`getState: ${e.message}`);
    return { ...DEFAULT_STATE };
  }
}

function setState(patch) {
  try {
    fs.mkdirSync(HOME_DIR, { recursive: true });
    const current = getState();
    const merged = {
      ...current,
      ...patch,
      version: 1,
      lastChanged: new Date().toISOString()
    };
    if (!VALID_LEVELS.has(merged.level)) {
      merged.level = DEFAULT_STATE.level;
    }
    const tmpPath = STATE_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(merged, null, 2));
    fs.renameSync(tmpPath, STATE_PATH);
    return merged;
  } catch (e) {
    logError(`setState: ${e.message}`);
    return null;
  }
}

function stripCodeFences(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/```[\s\S]*$/, '');
}

function parseTrigger(prompt) {
  const cleaned = stripCodeFences(prompt);
  const trimmed = cleaned.trim();

  if (/^\/pordee-stats(?:\s+--share)?$/.test(trimmed)) {
    return { action: 'stats', share: trimmed.includes('--share') };
  }

  const slashMatch = trimmed.match(/^\/pordee(?:\s+(\w+))?$/i);
  if (slashMatch) {
    const arg = (slashMatch[1] || '').toLowerCase();
    if (arg === 'lite') return { enabled: true, level: 'lite' };
    if (arg === 'full') return { enabled: true, level: 'full' };
    if (arg === 'stop') return { enabled: false };
    if (arg === '') return { enabled: true };
    return null;
  }

  const enableThai = ['พอดีโหมด', 'พูดสั้นๆ', 'พอดี'];
  const disableThai = ['หยุดพอดี', 'พูดปกติ'];

  for (const phrase of disableThai) {
    if (trimmed === phrase) return { enabled: false };
  }
  for (const phrase of enableThai) {
    if (trimmed === phrase) return { enabled: true };
  }

  return null;
}

function normalizeLevel(level) {
  return level === 'lite' ? 'lite' : 'full';
}

function makeSessionStartReminder(state) {
  const level = normalizeLevel(state.level);
  return (
    `PORDEE MODE ACTIVE — level: ${level}\n\n` +
    'Respond terse like simple Thai. Keep technical English terms. ' +
    'Drop polite particles (ครับ, ค่ะ, นะคะ, นะครับ), hedging (อาจจะ, น่าจะ, จริงๆแล้ว), ' +
    'pleasantries (ได้เลยครับ, แน่นอน), and English-style filler (just/really/basically/actually/simply). ' +
    'Fragments OK. Use short Thai synonyms (ดู not ตรวจสอบ, แก้ not ทำการแก้ไข, เพราะ not เนื่องจาก).\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. No drift. Off only via "หยุดพอดี", "พูดปกติ", or "/pordee stop".\n\n' +
    `Current level: **${level}**. Switch: \`/pordee lite|full\`.\n\n` +
    '## Pattern\n\n' +
    '`[ของ] [ทำ] [เหตุผล]. [ขั้นต่อ].`\n\n' +
    '## Auto-Clarity\n\n' +
    'Drop pordee for: security warnings, irreversible actions (DROP TABLE, rm -rf, git push --force, git reset --hard), ' +
    'multi-step sequences where order matters, user asks "อะไรนะ" / "พูดอีกที" / "อธิบายชัดๆ". ' +
    'Resume after clarification done.\n\n' +
    '## Boundaries\n\n' +
    'Code/commits/PRs/code comments: write normal English. Errors: exact quote. ' +
    'File paths, URLs, identifiers, function names: exact.'
  );
}

function makePromptReminder(state) {
  const level = normalizeLevel(state.level);
  return (
    `PORDEE MODE ACTIVE (${level}). ` +
    'ตอบไทยกระชับ. Keep technical English terms. ' +
    'Drop polite particles, hedging, pleasantries. Fragments OK. ' +
    'Code/commits/security: write normal.'
  );
}

module.exports = {
  HOME_DIR,
  STATE_PATH,
  ERROR_LOG_PATH,
  DEFAULT_STATE,
  VALID_LEVELS,
  getState,
  setState,
  logError,
  stripCodeFences,
  parseTrigger,
  makeSessionStartReminder,
  makePromptReminder,
};
