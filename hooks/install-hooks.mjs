#!/usr/bin/env node
// Installs the git hooks shipped in this folder into the repository's hooks
// directory. Runs from the "prepare" npm script (npm install) — or the
// equivalent lifecycle hook of the project's package manager.
//
// Honest about where hooks live: it asks git (`git rev-parse --git-path
// hooks`), which resolves linked worktrees (hooks are shared through the
// common git dir) and a configured `core.hooksPath`. It never overwrites a
// hook it did not write: an existing, different pre-push is backed up next
// to it first, and an identical one is left alone.
//
// .mjs on purpose: runs as ESM whatever the project's "type" field says —
// the same lesson as the .cjs of the tier gate, from the other side.
//
// ADAPT: this assumes an npm-based JS/TS project. For another ecosystem,
// port the same idea into that ecosystem's install lifecycle.

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

let hooksDir;
try {
  const out = execSync("git rev-parse --git-path hooks", {
    cwd: root,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
  hooksDir = resolve(root, out);
} catch {
  console.log("install-hooks: not a git repository (CI, tarball or exported source) — nothing to install.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const hooks = ["pre-push"];

for (const hook of hooks) {
  const src = join(here, hook);
  if (!existsSync(src)) continue;
  const dest = join(hooksDir, hook);

  if (existsSync(dest)) {
    if (readFileSync(src, "utf8") === readFileSync(dest, "utf8")) {
      console.log(`install-hooks: ${hook} already installed (${dest})`);
      continue;
    }
    const backup = `${dest}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    renameSync(dest, backup);
    console.log(`install-hooks: existing ${hook} differed — backed up to ${backup}`);
  }

  copyFileSync(src, dest);
  try {
    chmodSync(dest, 0o755);
  } catch {
    /* Windows: chmod not critical */
  }
  console.log(`install-hooks: installed ${hook} → ${dest}`);
}
