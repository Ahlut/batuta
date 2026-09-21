// Tests for hooks/install-hooks.mjs.
// No dependencies: node + git. Run: node test/install-hooks.test.cjs
//
// Covers what an external review found missing: linked worktrees, a
// configured core.hooksPath, an existing hook that must not be overwritten
// silently, and a directory that is not a git repository at all.

'use strict';

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOKS_SRC = path.resolve(__dirname, '..', 'hooks');
const PRE_PUSH = fs.readFileSync(path.join(HOOKS_SRC, 'pre-push'), 'utf8');

function git(cwd, args) {
  return execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function project({ init = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-hooks-'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(HOOKS_SRC, 'pre-push'), path.join(dir, 'scripts', 'pre-push'));
  fs.copyFileSync(path.join(HOOKS_SRC, 'install-hooks.mjs'), path.join(dir, 'scripts', 'install-hooks.mjs'));
  if (init) {
    git(dir, 'init -q');
    git(dir, 'config user.email test@example.com');
    git(dir, 'config user.name test');
    git(dir, 'config commit.gpgsign false');
    git(dir, 'add -A');
    git(dir, 'commit -q -m base');
  }
  return dir;
}

function install(cwd, env = {}) {
  const r = spawnSync(process.execPath, ['scripts/install-hooks.mjs'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, BATUTA_HOOKS: '', ...env },
  });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// realpath on purpose: on Windows CI the temp dir comes back as an 8.3 short
// name (RUNNER~1) while git answers with the long one — same folder, two
// spellings.
function hooksPath(cwd) {
  return fs.realpathSync.native(path.resolve(cwd, git(cwd, 'rev-parse --git-path hooks')));
}

let failed = 0;
function check(name, cond, detail) {
  if (cond) console.log('ok   ' + name);
  else { failed++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function cleanup(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* windows lock */ } }

// 1. plain repository
{
  const dir = project();
  const r = install(dir);
  const dest = path.join(hooksPath(dir), 'pre-push');
  check('plain repo: installs pre-push into .git/hooks', r.status === 0 && fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') === PRE_PUSH, r.out);

  const again = install(dir);
  const backups = fs.readdirSync(hooksPath(dir)).filter((f) => f.startsWith('pre-push.bak-'));
  check('plain repo: second run is a no-op, no backup created', again.status === 0 && /already installed/.test(again.out) && backups.length === 0, again.out);

  const theirs = '#!/bin/sh\necho someone else\n';
  fs.writeFileSync(dest, theirs);
  const third = install(dir);
  const backups2 = fs.readdirSync(hooksPath(dir)).filter((f) => f.startsWith('pre-push.bak-'));
  check('plain repo: a different existing hook is left untouched, and the installer says so', third.status === 0 && /not touching it/.test(third.out) && fs.readFileSync(dest, 'utf8') === theirs && backups2.length === 0, third.out);

  const fourth = install(dir, { BATUTA_HOOKS: 'replace' });
  const backups3 = fs.readdirSync(hooksPath(dir)).filter((f) => f.startsWith('pre-push.bak-'));
  check('plain repo: BATUTA_HOOKS=replace backs the old hook up and installs ours', fourth.status === 0 && backups3.length === 1 && fs.readFileSync(dest, 'utf8') === PRE_PUSH && fs.readFileSync(path.join(hooksPath(dir), backups3[0]), 'utf8') === theirs, fourth.out);
  cleanup(dir);
}

// 2. linked worktree — hooks live in the common git dir, shared by all worktrees
{
  const dir = project();
  const wt = dir + '-wt';
  git(dir, `worktree add -q "${wt}" -b wt`);
  const r = install(wt);
  const dest = path.join(hooksPath(wt), 'pre-push');
  check('worktree: installs into the shared hooks dir instead of skipping', r.status === 0 && fs.existsSync(dest) && !/nothing to install/.test(r.out), r.out);
  check('worktree: the shared hooks dir is the main repo\'s', path.resolve(hooksPath(wt)) === path.resolve(hooksPath(dir)), `${hooksPath(wt)} vs ${hooksPath(dir)}`);
  git(dir, `worktree remove --force "${wt}"`);
  cleanup(dir);
}

// 3. core.hooksPath
{
  const dir = project();
  git(dir, 'config core.hooksPath .githooks');
  const r = install(dir);
  const dest = path.join(dir, '.githooks', 'pre-push');
  check('core.hooksPath: installs where git says hooks live', r.status === 0 && fs.existsSync(dest), r.out);
  cleanup(dir);
}

// 4. not a git repository
{
  const dir = project({ init: false });
  const r = install(dir);
  check('no git repo: exits 0 with an honest message', r.status === 0 && /not a git repository/.test(r.out), r.out);
  cleanup(dir);
}

console.log(failed ? `\n${failed} test(s) failed` : '\nall install-hooks tests passed');
process.exit(failed ? 1 : 0);
