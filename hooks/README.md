# Hooks — installation

> **Before installing any hook from this folder, read its content.**
> Whoever clones a project that uses Batuta ends up with scripts running
> automatically (on push, or on every assistant edit) without necessarily
> having noticed. They are ~25-100 lines each — reading them costs a
> minute, and it is the difference between adopting a gate and running
> someone else's code blind.

## Pre-push (core)

`pre-push` runs lint + tests before every `git push` and blocks the push
if they fail. It is the base safety net of the 9-step flow — it always
runs, whatever the change's tier.

Fail-closed note: `npm test` **fails in a project with no test script**
(npm's default exits with an error) — which blocks the push. That is
deliberate (a project without tests shouldn't have its safety net silently
pretending to run), but it's worth knowing before it surprises you: either
add a suite, or adapt the command in `pre-push`.

Installation (Node/npm project):

1. Copy `pre-push` and `install-hooks.js` into `scripts/` in the project.
2. Edit `pre-push` — swap `npm run lint` / `npm test` for the project's
   real commands if it is another stack.
3. Add to `package.json`:
   ```json
   { "scripts": { "prepare": "node scripts/install-hooks.js" } }
   ```
   `prepare` runs automatically after `npm install`, which copies the hook
   into `.git/hooks/pre-push` on any machine that clones the repository —
   no manual install needed.
4. Confirm: `npm install` should print
   `install-hooks: installed pre-push`.

For another package manager/ecosystem, port the same idea: copy
`pre-push` into `.git/hooks/pre-push` and mark it executable, triggered
from the lifecycle hook equivalent to npm's `prepare` (e.g. another
manager's `postinstall`, or a `Makefile`/setup script run once).

## check-tier-declared (the step-0 gate, harness hook)

Step 0 of the flow ("declare the TIER before writing code") used to be
prose — and prose gets ignored, as CLAUDE.md's own "anti-skip rule"
documents. `check-tier-declared.cjs` makes it mechanical: it is a Claude
Code **PreToolUse** hook that intercepts Edit/Write and blocks editing
code files without a valid **block marker** — the file
`.claude/tier-block` (gitignored), written in the terminal when the tier
is declared:

```
echo "TIER: X. Agents: Y. Local test: yes/no." > .claude/tier-block
```

The gate requires the marker to contain a valid `TIER: <tier>`
declaration and to have an mtime **later than the last commit** (the
commit closes the block; new block = redeclare to the user + rewrite the
marker).

Why a marker and not the transcript: v1 parsed the session transcript and
**blocked falsely in production** — the prose declaration ended up behind
an intermediate commit, outside the read window (256KB ≈ 2-3 minutes in a
payload-heavy session), or not yet flushed when the hook ran. The
transcript format is not a contract; a file's mtime is.

Scope and limits (declared at the top of the script itself):
- `.md`/`.txt` files, `docs/` and `.claude/` are exempt — step 0 applies
  to code. `.json` is NOT exempt (package.json is the DEPS tier).
- The model can write the marker reflexively — but the echo shows up in
  the terminal, **visible to the user**, who pushes back. It is
  deliberate friction and a role signal, not a sandbox.
- Bash stays outside the matcher; multi-commit blocks rewrite the marker
  after each commit; git's timestamp has 1s resolution (documented edge);
  fail-open on infrastructure errors.

The `.cjs` extension is not taste: with `.js`, any `"type": "module"`
project treated the script as ESM, `require` crashed, and — since exit ≠ 2
in a PreToolUse does not block — the gate died OPEN with a stack trace on
stderr. Keep `.cjs` when copying.

Manual installation (without the plugin):

0. Add `.claude/tier-block` to the project's `.gitignore` (the marker is
   ephemeral, per session/worktree — it is never committed).
1. Copy `check-tier-declared.cjs` into `.claude/hooks/` in the project.
2. Add to the project's `.claude/settings.json` (merge, don't replace):
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Edit|Write",
           "hooks": [
             { "type": "command", "command": "node .claude/hooks/check-tier-declared.cjs" }
           ]
         }
       ]
     }
   }
   ```

Installation via plugin: this folder's `hooks/hooks.json` is Batuta's
plugin hooks manifest — installing the plugin **activates this gate
automatically** (the `${CLAUDE_PLUGIN_ROOT}` path resolves to the
installed plugin's folder). If you don't want the gate, use manual
adoption and don't copy this hook.

Planned evolution (not implemented): a second gate validating, when a
block closes, that the declared tier's mandatory agents actually ran. It
requires state tracking across harness events; it stays documented as a
next step instead of shipped half-done.

## Dependency cooldown gate — optional, not included

A real source project had a second gate,
`scripts/check-dependency-cooldown.mjs`: it blocks, in CI, the adoption of
dependencies published less than 7 days ago, as a defense against
supply-chain attacks that get detected and removed by the community within
days — but not in time for `npm audit` to catch them.

**It did not come into this template** because:
- It is npm-registry specific (it queries `registry.npmjs.org` directly)
  — in another ecosystem (PyPI, crates.io, RubyGems) the mechanics of
  querying publish timestamps change completely.
- It has real weight (~340 lines): lockfile parsing, an allowlist with its
  own schema, a fail-closed guard, network retries. It is worth rewriting
  against the new project's real package manager, not adapting in a hurry.
- It only pays its maintenance cost once the project has serious CI and a
  real appetite for that extra supply-chain layer — not every new project
  is there on day 1.

If the project adopts this gate later, document in the adapted `CLAUDE.md`
("Security" → "Supply chain" section) the same things a mature project
should document: which layers exist (local install vs CI gate vs
checklist), where the allowlist lives, and who can edit it.
