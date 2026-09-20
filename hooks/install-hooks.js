#!/usr/bin/env node
// Installs git hooks from scripts/ into .git/hooks/.
// Runs automatically via the "prepare" npm script (npm install) — or the
// equivalent lifecycle hook of the project's package manager.
//
// ADAPT: this assumes an npm-based JS/TS project. For another ecosystem,
// port the same idea (copy hooks/pre-push into .git/hooks/pre-push and mark
// it executable) into that ecosystem's install lifecycle.

import { copyFileSync, chmodSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const hooksDir = join(root, ".git", "hooks");

if (!existsSync(hooksDir)) {
  console.log("install-hooks: .git/hooks not found — skipping (CI environment).");
  process.exit(0);
}

const hooks = ["pre-push"];

for (const hook of hooks) {
  const src = join(__dirname, hook);
  const dest = join(hooksDir, hook);
  if (!existsSync(src)) continue;
  copyFileSync(src, dest);
  try { chmodSync(dest, 0o755); } catch { /* Windows: chmod not critical */ }
  console.log(`install-hooks: installed ${hook}`);
}
