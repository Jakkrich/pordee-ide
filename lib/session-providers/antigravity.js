const fs = require('fs');
const path = require('path');
const os = require('os');

function antigravityHome() {
  return process.env.ANTIGRAVITY_HOME || path.join(os.homedir(), '.gemini', 'antigravity');
}

function walkFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let st;
    try { st = fs.statSync(current); } catch { continue; }
    if (st.isDirectory()) {
      let children;
      try { children = fs.readdirSync(current); } catch { continue; }
      for (const child of children) stack.push(path.join(current, child));
    } else {
      out.push({ file: current, mtimeMs: st.mtimeMs });
    }
  }
  return out;
}

function findRecentSession(root = antigravityHome()) {
  const tokenDir = path.join(root, '.token-monitor');
  const tokenFiles = walkFiles(tokenDir)
    .filter(x => /\.(jsonl?|log|txt)$/i.test(x.file))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (tokenFiles.length) return tokenFiles[0].file;

  const brainDir = path.join(root, 'brain');
  const overviewFiles = walkFiles(brainDir)
    .filter(x => path.basename(x.file) === 'overview.txt')
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (overviewFiles.length) return overviewFiles[0].file;

  return null;
}

function numeric(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function approxTokens(text) {
  if (!text) return 0;
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return 0;
  // Transparent fallback for Antigravity overview logs that expose text, not usage.
  return Math.max(1, Math.ceil(clean.length / 4));
}

function collectUsage(obj, totals) {
  if (!obj || typeof obj !== 'object') return;
  const usage = obj.usage || obj.token_usage || obj.tokenUsage || obj.usageMetadata || obj.metadata?.usage;
  if (usage && typeof usage === 'object') {
    totals.outputTokens += numeric(usage.output_tokens) + numeric(usage.outputTokens) + numeric(usage.candidatesTokenCount);
    totals.cacheReadTokens += numeric(usage.cache_read_input_tokens) + numeric(usage.cacheReadInputTokens);
    totals.inputTokens += numeric(usage.input_tokens) + numeric(usage.inputTokens) + numeric(usage.promptTokenCount);
    if (!totals.model && (usage.model || usage.model_id || usage.modelId)) {
      totals.model = usage.model || usage.model_id || usage.modelId;
    }
  }
  if (!totals.model && (obj.model || obj.model_id || obj.modelId)) {
    totals.model = obj.model || obj.model_id || obj.modelId;
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') collectUsage(value, totals);
  }
}

function parseJsonLineFile(filePath) {
  let raw;
  try { raw = fs.readFileSync(filePath, 'utf8'); }
  catch { return { outputTokens: 0, cacheReadTokens: 0, turns: 0, model: null, approximate: false }; }

  const totals = { outputTokens: 0, cacheReadTokens: 0, inputTokens: 0, turns: 0, model: null };
  let approximate = false;

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const outputBefore = totals.outputTokens;
    collectUsage(entry, totals);
    const hasUsageForLine = totals.outputTokens > outputBefore;

    if (entry.source === 'MODEL' && typeof entry.content === 'string' && entry.content.trim()) {
      totals.turns++;
      if (!hasUsageForLine) {
        totals.outputTokens += approxTokens(entry.content);
        approximate = true;
      }
    } else if (entry.type === 'assistant' || entry.role === 'assistant') {
      totals.turns++;
    }
  }

  return {
    outputTokens: totals.outputTokens,
    cacheReadTokens: totals.cacheReadTokens,
    turns: totals.turns,
    model: totals.model,
    approximate,
  };
}

function parseSession(filePath) {
  const parsed = parseJsonLineFile(filePath);
  return {
    ...parsed,
    provider: 'antigravity',
  };
}

function isAvailable(root = antigravityHome()) {
  return Boolean(findRecentSession(root));
}

function unavailableMessage() {
  return [
    'pordee-stats: no Antigravity session logs found.',
    `Checked: ${path.join(antigravityHome(), 'brain')} and ${path.join(antigravityHome(), '.token-monitor')}`
  ].join('\n');
}

module.exports = {
  name: 'antigravity',
  antigravityHome,
  findRecentSession,
  parseSession,
  isAvailable,
  unavailableMessage,
  approxTokens,
};
