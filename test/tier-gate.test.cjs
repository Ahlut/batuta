// Tests for hooks/check-tier-declared.cjs — the step-0 gate.
// No dependencies: node + git. Run: node test/tier-gate.test.cjs
//
// Each case spawns the real hook with the JSON a PreToolUse hook receives and
// asserts the exit code: 2 blocks the tool call, 0 lets it through. The
// first six cases are the battery an external reviewer ran by hand; the
// prefix case is the hole that review found.

'use strict';

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOK = path.resolve(__dirname, '..', 'hooks', 'check-tier-declared.cjs');

function git(cwd, args) {
  return execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function tmpRepo({ commit = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tier-gate-'));
  git(dir, 'init -q');
  git(dir, 'config user.email test@example.com');
  git(dir, 'config user.name test');
  git(dir, 'config commit.gpgsign false');
  if (commit) git(dir, 'commit -q --allow-empty -m base');
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  return dir;
}

function marker(dir, content, { ageSeconds = 0, encoding = 'utf8' } = {}) {
  const file = path.join(dir, '.claude', 'tier-block');
  if (encoding === 'utf16le') {
    const bom = String.fromCharCode(0xfeff);
    fs.writeFileSync(file, Buffer.from(bom + content, 'utf16le'));
  } else {
    fs.writeFileSync(file, content);
  }
  if (ageSeconds) {
    const t = Date.now() / 1000 - ageSeconds;
    fs.utimesSync(file, t, t);
  }
}

function runHook(cwd, filePath, rawStdin) {
  const input = rawStdin !== undefined
    ? rawStdin
    : JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: filePath }, cwd });
  const r = spawnSync(process.execPath, [HOOK], { input, cwd, encoding: 'utf8' });
  return r.status;
}

const cases = [
  ['code file, no marker → blocked', (d) => runHook(d, 'src/app.ts'), 2],
  ['code file, fresh valid marker → allowed', (d) => { marker(d, 'TIER: LOGIC. Agents: QA. Local test: yes.'); return runHook(d, 'src/app.ts'); }, 0],
  ['marker without a TIER declaration → blocked', (d) => { marker(d, 'working on it'); return runHook(d, 'src/app.ts'); }, 2],
  ['prefix abuse "TIER: LOGICALLY_INVALID" → blocked', (d) => { marker(d, 'TIER: LOGICALLY_INVALID'); return runHook(d, 'src/app.ts'); }, 2],
  ['prefix abuse "TIER: SCHEMATIC" → blocked', (d) => { marker(d, 'TIER: SCHEMATIC'); return runHook(d, 'src/app.ts'); }, 2],
  ['tier followed by punctuation "TIER: LOGIC." → allowed', (d) => { marker(d, 'TIER: LOGIC. Agents: none.'); return runHook(d, 'src/app.ts'); }, 0],
  ['tier followed by slash "TIER: DISPLAY/docs" → allowed', (d) => { marker(d, 'TIER: DISPLAY/docs'); return runHook(d, 'src/app.ts'); }, 0],
  ['marker older than the last commit → blocked', (d) => { marker(d, 'TIER: LOGIC', { ageSeconds: 120 }); return runHook(d, 'src/app.ts'); }, 2],
  ['docs/ path, no marker → allowed (exempt)', (d) => runHook(d, 'docs/notes.md'), 0],
  ['.claude/ path, no marker → allowed (exempt)', (d) => runHook(d, '.claude/settings.json'), 0],
  ['package.json, no marker → blocked (.json is not exempt)', (d) => runHook(d, 'package.json'), 2],
  ['malformed JSON on stdin → allowed (fail-open on infrastructure errors)', (d) => runHook(d, 'src/app.ts', '{not json'), 0],
  ['UTF-16LE marker (PowerShell redirection) → allowed', (d) => { marker(d, 'TIER: DEPS. Agents: none.', { encoding: 'utf16le' }); return runHook(d, 'src/app.ts'); }, 0],
  ['repo with no commits, valid marker → allowed', (d) => { marker(d, 'TIER: LOGIC'); return runHook(d, 'src/app.ts'); }, 0, { commit: false }],
];

let failed = 0;
for (const [name, fn, expected, repoOpts] of cases) {
  const dir = tmpRepo(repoOpts);
  let got;
  try {
    got = fn(dir);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* windows lock */ }
  }
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}  (exit ${got}, expected ${expected})`);
}

console.log(failed ? `\n${failed} test(s) failed` : `\nall ${cases.length} tests passed`);
process.exit(failed ? 1 : 0);
