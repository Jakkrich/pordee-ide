#!/usr/bin/env node
// pordee-stats — read Antigravity session logs and print token usage + savings.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getState } = require('./pordee-core');
const antigravityProvider = require('./session-providers/antigravity');

const MODEL_OUTPUT_PRICE_PER_M = [
  ['kimi-for-coding', 15.00],
  ['kimi-k2-5', 15.00],
];

const DEFAULT_COMPRESSION = Object.freeze({
  full: 0.58,
  lite: 0.42,
});

function loadCompression() {
  const benchmarkDir = process.env.PORDEE_BENCHMARK_DIR || null;
  if (!benchmarkDir) return { ...DEFAULT_COMPRESSION };
  const compressionPath = path.join(benchmarkDir, 'compression.json');
  try {
    const data = JSON.parse(fs.readFileSync(compressionPath, 'utf8'));
    return data.compression || { ...DEFAULT_COMPRESSION };
  } catch {
    return { ...DEFAULT_COMPRESSION };
  }
}

function priceForModel(model) {
  if (!model) return null;
  for (const [prefix, price] of MODEL_OUTPUT_PRICE_PER_M) {
    if (model.startsWith(prefix)) return price;
  }
  return null;
}

function formatUsd(amount) {
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  if (amount >= 0.01) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(4)}`;
}

function deriveSavings({ outputTokens, level, model }) {
  const compression = loadCompression();
  const ratio = compression[level] != null ? compression[level] : null;
  const price = priceForModel(model);
  if (ratio === null) return { estSavedTokens: 0, estSavedUsd: 0 };
  const estNormal = Math.round(outputTokens / (1 - ratio));
  const estSavedTokens = estNormal - outputTokens;
  const estSavedUsd = price !== null ? (estSavedTokens / 1_000_000) * price : 0;
  return { estSavedTokens, estSavedUsd };
}

function parseDuration(spec) {
  if (!spec) return null;
  const m = /^(\d+)([dh])$/.exec(spec.trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return m[2] === 'd' ? n * 86_400_000 : n * 3_600_000;
}

function readHistory(historyPath) {
  try {
    return fs.readFileSync(historyPath, 'utf8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function appendHistory(historyPath, line) {
  try {
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.appendFileSync(historyPath, line + '\n');
  } catch {
    // Best-effort.
  }
}

function aggregateHistory(historyPath, sinceMs) {
  const cutoff = sinceMs ? Date.now() - sinceMs : null;
  const latestPerSession = new Map();
  for (const line of readHistory(historyPath)) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (!entry || typeof entry !== 'object') continue;
    if (cutoff !== null && (entry.ts || 0) < cutoff) continue;
    const id = entry.session_id || '_';
    const prev = latestPerSession.get(id);
    if (!prev || (entry.ts || 0) >= (prev.ts || 0)) latestPerSession.set(id, entry);
  }

  let outputTokens = 0;
  let estSavedTokens = 0;
  let estSavedUsd = 0;
  for (const entry of latestPerSession.values()) {
    outputTokens += entry.output_tokens || 0;
    estSavedTokens += entry.est_saved_tokens || 0;
    estSavedUsd += entry.est_saved_usd || 0;
  }
  return { sessions: latestPerSession.size, outputTokens, estSavedTokens, estSavedUsd };
}

function humanizeTokens(n) {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}

function formatHistory({ sessions, outputTokens, estSavedTokens, estSavedUsd, since }) {
  const sep = '──────────────────────────────────';
  const window = since ? ` (last ${since})` : '';
  if (sessions === 0) {
    return `\nพอดี Stats — สะสม${window}\n${sep}\nยังไม่มี session — รัน /pordee-stats ใน session ใดก็ได้เพื่อเริ่มเก็บข้อมูล\n${sep}\n`;
  }
  const usdLine = estSavedUsd > 0 ? `ประหยัด (USD):        ~${formatUsd(estSavedUsd)}\n` : '';
  return `\nพอดี Stats — สะสม${window}\n${sep}\n` +
    `Sessions:   ${sessions.toLocaleString()}\n${sep}\n` +
    `Output tokens:         ${outputTokens.toLocaleString()}\n` +
    `ประหยัดโทเค็น:        ${estSavedTokens.toLocaleString()}\n` +
    usdLine + sep + '\n';
}

function formatShare({ outputTokens, turns, level, model, approximate }) {
  if (turns === 0) return '⚡ พอดีพร้อม แต่ยังไม่มีเทิร์น — pordee';

  const compression = loadCompression();
  const ratio = compression[level] != null ? compression[level] : null;
  const label = approximate ? 'output tokens (approx)' : 'output tokens';
  const price = priceForModel(model);

  if (ratio !== null) {
    const estSaved = Math.round(outputTokens / (1 - ratio)) - outputTokens;
    let usd = '';
    if (price !== null) {
      usd = ` (~${formatUsd((estSaved / 1_000_000) * price)})`;
    }
    return `⚡ ประหยัด ${estSaved.toLocaleString()} ${label}${usd} จาก ${turns} เทิร์นใน session นี้ — pordee`;
  }
  return `⚡ ${turns} เทิร์น, ${outputTokens.toLocaleString()} ${label} ใน session นี้ — pordee`;
}

function formatStats({ outputTokens, cacheReadTokens, turns, level, model, sessionPath, approximate }) {
  const sep = '──────────────────────────────────';
  const shortPath = sessionPath && sessionPath.length > 45
    ? '...' + sessionPath.slice(-45)
    : (sessionPath || '');

  if (turns === 0) {
    return `\nพอดี Stats\n${sep}\nยังไม่มีบทสนทนา — แสดงสถิติหลังจากได้รับ response แรก\n${sep}\n`;
  }

  const compression = loadCompression();
  const ratio = compression[level] != null ? compression[level] : null;
  const price = priceForModel(model);
  let savings;
  let footer = '';

  if (ratio !== null) {
    const estNormal = Math.round(outputTokens / (1 - ratio));
    const estSaved = estNormal - outputTokens;
    let usdLine = '';
    if (price !== null) {
      usdLine = `ประหยัด (USD):        ~${formatUsd((estSaved / 1_000_000) * price)}\n`;
      footer = `คำนวณประหยัดจาก compression profile ของ pordee. ราคาสำหรับ ${model}. ตัวเลขจริงขึ้นกับ task.`;
    } else {
      footer = 'คำนวณประหยัดจาก compression profile ของ pordee. ตัวเลขจริงขึ้นกับ task.';
    }
    savings = `โทเค็นโดยประมาณ (ไม่ใช้พอดี): ${estNormal.toLocaleString()}\n` +
      `ประหยัดโทเค็น:        ${estSaved.toLocaleString()} (~${Math.round(ratio * 100)}%)\n` +
      usdLine.replace(/\n$/, '');
  } else if (level) {
    savings = `ไม่มี compression profile สำหรับ level '${level}'`;
  } else {
    savings = 'พอดีไม่ active ใน session นี้';
  }

  return `\nพอดี Stats\n${sep}\n` +
    (shortPath ? `Session:  ${shortPath}\n` : '') +
    `เทิร์น:    ${turns}\n${sep}\n` +
    `${approximate ? 'Output tokens (approx):' : 'Output tokens:'} ${outputTokens.toLocaleString().padStart(10)}\n` +
    `Cache-read tokens:     ${cacheReadTokens.toLocaleString()}\n${sep}\n` +
    `${savings}\n` +
    (footer ? footer + '\n' : '');
}

function main() {
  const args = process.argv.slice(2);
  const sessionIdx = args.indexOf('--session-file');
  const sessionFileArg = sessionIdx !== -1 ? args[sessionIdx + 1] : null;
  const share = args.includes('--share');
  const all = args.includes('--all');
  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : null;

  const pordeeDir = process.env.PORDEE_HOME || path.join(os.homedir(), '.pordee');
  const historyPath = path.join(pordeeDir, 'history.jsonl');

  if (all || sinceArg) {
    const sinceMs = parseDuration(sinceArg);
    if (sinceArg && sinceMs === null) {
      process.stderr.write(`pordee-stats: --since takes Nh or Nd (e.g. 7d, 24h), got: ${sinceArg}\n`);
      process.exit(2);
    }
    process.stdout.write(formatHistory({ ...aggregateHistory(historyPath, sinceMs), since: sinceArg || null }));
    return;
  }

  const sessionFile = sessionFileArg || antigravityProvider.findRecentSession();
  if (!sessionFile) {
    process.stderr.write(antigravityProvider.unavailableMessage() + '\n');
    process.exit(1);
  }

  const parsed = antigravityProvider.parseSession(sessionFile);
  const state = getState();
  const level = state.enabled ? state.level : null;

  if (parsed.turns > 0) {
    const { estSavedTokens, estSavedUsd } = deriveSavings({ ...parsed, level });
    appendHistory(historyPath, JSON.stringify({
      ts: Date.now(),
      session_id: path.basename(sessionFile, path.extname(sessionFile)),
      level: level || null,
      model: parsed.model || null,
      output_tokens: parsed.outputTokens,
      approximate: Boolean(parsed.approximate),
      est_saved_tokens: estSavedTokens,
      est_saved_usd: estSavedUsd,
    }));

    const agg = aggregateHistory(historyPath, null);
    const suffix = agg.estSavedTokens > 0 ? `⚡ ${humanizeTokens(agg.estSavedTokens)}` : '';
    try {
      fs.mkdirSync(pordeeDir, { recursive: true });
      fs.writeFileSync(path.join(pordeeDir, 'statusline-suffix'), suffix);
    } catch {
      // Best-effort.
    }
  }

  if (share) {
    process.stdout.write(formatShare({ ...parsed, level }) + '\n');
  } else {
    process.stdout.write(formatStats({ ...parsed, level, sessionPath: sessionFile }));
  }
}

if (require.main === module) main();

module.exports = {
  aggregateHistory,
  deriveSavings,
  formatHistory,
  formatShare,
  formatStats,
  formatUsd,
  humanizeTokens,
  loadCompression,
  parseDuration,
  priceForModel,
};
