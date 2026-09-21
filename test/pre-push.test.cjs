// Tests for hooks/pre-push — the hook actually running, not just installed.
// No dependencies: node + npm + a POSIX sh. Run: node test/pre-push.test.cjs
//
// Each case is a throwaway project whose lint/test scripts succeed or fail
// on purpose; the real hook script runs against it and the exit code is
// what git would see. On Windows the sh is the one Git for Windows ships.

'use strict';

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PRE_PUSH = path.resolve(__dirname, '..', 'hooks', 'pre-push');

function findSh() {
  if (process.platform !== 'win32') return 'sh';
  // git --exec-path → <Git root>/mingw64/libexec/git-core; sh.exe lives in <Git root>/bin
  try {
    const execPath = execSync('git --exec-path', { encoding: 'utf8' }).trim();
    const root = path.resolve(execPath, '..', '..', '..');
    for (const candidate of [path.join(root, 'bin', 'sh.exe'), path.join(root, 'usr', 'bin', 'sh.exe')]) {
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch { /* fall through */ }
  return 'sh';
}

const SH = findSh();

function project(lintExit, testExit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-push-'));
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'throwaway', private: true, scripts: { lint: `exit ${lintExit}`, test: `exit ${testExit}` } }, null, 2)
  );
  return dir;
}

function runHook(dir) {
  const r = spawnSync(SH, [PRE_PUSH.replace(/\\/g, '/')], { cwd: dir, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const cases = [
  ['lint fails → push blocked (exit 1)', 1, 0, 1, /Lint failed/],
  ['tests fail → push blocked (exit 1)', 0, 1, 1, /Tests failed/],
  ['lint and tests pass → push allowed (exit 0)', 0, 0, 0, /Pushing/],
];

let failed = 0;
for (const [name, lintExit, testExit, expected, message] of cases) {
  const dir = project(lintExit, testExit);
  let r;
  try {
    r = runHook(dir);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* windows lock */ }
  }
  const ok = r.status === expected && message.test(r.out);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}  (exit ${r.status}, expected ${expected})${ok ? '' : '\n' + r.out}`);
}

console.log(failed ? `\n${failed} test(s) failed` : `\nall ${cases.length} pre-push tests passed`);
process.exit(failed ? 1 : 0);
