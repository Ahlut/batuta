#!/usr/bin/env node
// PreToolUse hook (Claude Code) — the flow's step-0 gate, enforced by the
// harness instead of merely requested in prose.
//
// Blocks Edit/Write on code files unless a valid BLOCK MARKER exists: the
// file `.claude/tier-block` (gitignored), written by the orchestrator when
// declaring the tier, with an mtime later than the last commit (the commit
// closes the previous work block; a new block = redeclare and rewrite the
// marker).
//
// Why a marker and not the transcript: v1 parsed the transcript and blocked
// FALSELY in production — the prose declaration ended up behind an
// intermediate commit, outside the read window (256KB ≈ 2-3 min in a
// payload-heavy session), or not yet flushed when the hook ran. The
// transcript format is not a contract; a file's mtime is.
//
// The .cjs extension is deliberate: in a "type": "module" project a .js
// file would be ESM and `require` would crash — and since exit != 2 in a
// PreToolUse does NOT block, the gate would die open.
//
// Limits, stated honestly:
// - The model can write the marker reflexively. The gate's value is not
//   preventing that — the command (echo > .claude/tier-block) shows up in
//   the terminal, VISIBLE to the user, who pushes back. Ignored prose was
//   invisible; a reflexive echo is not.
// - The matcher is Edit|Write: writing files via shell redirection (Bash)
//   bypasses the gate. Known and accepted hole.
// - Blocks spanning several commits must rewrite the marker after each
//   commit — deliberate friction: every commit closes a block.
// - 1s edge: the commit timestamp (git %cI) has second resolution — a
//   marker and a commit within the SAME second compare at 1s granularity.
//   Irrelevant for a friction gate; measured in the tests.
// - Fail-open on infrastructure errors (unreadable stdin, git unavailable
//   when dating the commit). Fail-closed on the target case: marker
//   missing, invalid, or older than the last commit.
//
// Installation: see hooks/README.md (in Craveira) / CLAUDE.md (hooks table).
// Exemptions: .md/.txt, docs/ and .claude/ — step 0 applies to code.
// .json is NOT exempt on purpose: package.json is the DEPS tier, not
// documentation.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TIER_RE = /TIER:\s*(NON-CODE|DISPLAY|DEPS|LOGIC|SECURITY|DATA-MIGRATION|SCHEMA|FEATURE)/i;
const EXEMPT_RE = /\.(md|txt)$|(^|[\\/])docs[\\/]|(^|[\\/])\.claude[\\/]|(^|[\\/])scratchpad[\\/]/i;

function block(reason) {
  process.stderr.write(
    'Tier gate (step 0 of the flow): ' + reason + ' ' +
      'Declare the tier to the user ("TIER: X. Agents: Y. Local test: yes/no.") ' +
      'and write the block marker: echo "TIER: X. Agents: Y. Local test: ..." > .claude/tier-block ' +
      '— see the tier table in CLAUDE.md.'
  );
  process.exit(2);
}

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || toolInput.notebook_path || '';
  if (!filePath || EXEMPT_RE.test(filePath)) process.exit(0);

  const cwd = input.cwd || process.cwd();
  const markerPath = path.join(cwd, '.claude', 'tier-block');

  let st, content;
  try {
    st = fs.statSync(markerPath);
    // strip NULs: `>` in PowerShell writes UTF-16LE
    content = fs.readFileSync(markerPath, 'utf8').replace(/\u0000/g, '');
  } catch {
    block('there is no block marker (.claude/tier-block).');
    return;
  }

  if (!TIER_RE.test(content)) {
    block('the .claude/tier-block marker exists but contains no valid "TIER: <tier>" declaration.');
    return;
  }

  // Block boundary: the last commit. Repo with no commits (or git
  // unavailable) => a valid marker is enough.
  let lastCommitTs = 0;
  try {
    const iso = execSync('git log -1 --format=%cI', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    lastCommitTs = Date.parse(iso) || 0;
  } catch {
    lastCommitTs = 0;
  }

  if (st.mtimeMs >= lastCommitTs) process.exit(0);

  block('the .claude/tier-block marker predates the last commit — that block closed; redeclare the tier for this new block.');
});
