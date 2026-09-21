# ADOPTION.md — per-project decisions

This file is the long version of step 3 in the `README.md`. Each section is
a question that `CLAUDE.template.md` deliberately leaves open — answer it
before considering the adoption finished.

---

## 1. Which tiers apply

The template's 8-tier table assumes a project with its own database,
row-level authorization rules (RLS-like) and financial operations. Not
every project has all three.

| Tier | Always keep? | When to reduce/merge |
|------|---|---|
| NON-CODE | Yes — invokes no agents in any project | — |
| DISPLAY | Yes | — |
| DEPS | Yes, if the project has a package manager with a lockfile | Merge into LOGIC if there is no cooldown gate nor a distinct bump process |
| LOGIC | Yes | — |
| SECURITY | Yes, if there is any notion of authorization/auth | If the project is a lib with no auth, this tier may never fire — keep it in the table anyway, for the day it does |
| DATA-MIGRATION | Only if there is production data that can be corrupted | Merge into SCHEMA if the project has no real data yet |
| SCHEMA | Only if there is a schema (database, versioned API contract) | Rename to whatever fits (e.g. "CONTRACT" for a public API) |
| FEATURE | Yes — it is the tier that triggers the full fan-out | — |

The question to ask per tier, not the answer: **what is the worst possible
mistake in this kind of change, and is the proposed process proportional to
that mistake?** A project with no money and no personal data can reasonably
run LOGIC and FEATURE without Security at full strength — but declare that
explicitly in the adapted `CLAUDE.md`, instead of letting the generic table
lie about what actually runs.

## 2. Which agents make sense

The template's 6 agents (Architect, Security, QA, Product, Frontend,
Backend) came from a full-stack project with its own frontend, backend and
database. Questions per project:

- **Frontend/Backend as separate vertical agents only make sense if the
  project really has that separation.** A CLI, a lib, a data pipeline have
  no "frontend" — in that case, either rename the vertical to the real
  layer (e.g. "CLI agent", "pipeline agent") or merge into a single
  implementation agent.
- **Product only pays off when there is real, frequent UX ambiguity.** An
  internal tooling project with no external users may never need this
  agent — don't force it to exist just because the template has it.
- **Architect and Security are the two you cut last.** Even in small
  projects, design-before-writing and review-before-merging pay off early —
  they are the ones to keep even when everything else is trimmed.

**Where agent context lives.** The files in `agents/` are generic by design
and every agent starts by reading the project's `CLAUDE.md` — that is where
you invest the specificity, not in the agent files (which, on the plugin
path, are read-only and shared). The level of detail worth having in
`CLAUDE.md` to feed, say, the Security agent (fictional example):

- Auth: NextAuth (JWT) — session in an httpOnly cookie
- Authorization: per-role middleware + row-level checks in the data layer —
  first line of defense
- Roles: admin, team manager, end user — role-specific access rules
- Server-only routes: use the service key (never exposed to the client)
- Critical operations: atomic transactions with SELECT ... FOR UPDATE

Anything less specific than this and the agent reviews blind; its
instruction for that case is to point out the gap, not to pretend to
review.

## 3. Which CI gates

The `ci.yml` of a real project with automated deploys (not included in this
template — every project is tied to its own deploy provider and its own
DB-as-a-service) tends to have this shape, which generalizes well:

```
job "ci":     dependency gate (if any) → install → vulnerability audit
              → lint → test → typecheck → build → bundle size budget
              (if applicable)
job "e2e":    depends on "ci", but deploy does NOT depend on "e2e" — an
              explicit, documented decision, revisited as e2e matures
job "deploy": depends on "ci" only
```

Per-project decisions, to be made consciously and documented in the adapted
`CLAUDE.md` ("What actually blocks" section):

- **Is typecheck a gate or manual discipline?** In the source project it
  was manual discipline for months — and that hid real bugs before it
  became a gate. Decide early, not by omission.
- **Does E2E block the deploy?** If it doesn't, say so explicitly instead
  of leaving the implicit assumption that "green = safe for production".
- **Is there mandatory human review (PR + code owners), or direct pushes
  to the main branch?** Rules like "CODEOWNERS only acts on PRs" are
  useless if the real flow is direct pushes — don't document a protection
  that never fires.

## 4. Where the single list of open items lives

The pattern worth copying: one single file/board as "the only list that
counts" — everything open (findings, pending decisions, follow-ups) goes
there, and only there, the moment it is discovered. The alternative to
avoid is having 3-4 different places (code comments, issues, a notes doc,
Claude's own memory) silently drifting apart.

Decide per project:
- **Where does it live?** A Markdown file in the repo (simple, versioned,
  read by Claude); an external board (Linear/Jira, more visible for a
  larger team); a pinned issue.
- **Who writes to it?** If it is a file in the repo, Claude itself writes
  to it directly the moment it discovers a follow-up — it does not
  "remember it for later".
- **Point to it from the adapted `CLAUDE.md`**, in the "Reference
  documentation" table, with the phrase "the only list that counts" or
  equivalent — that phrase is what prevents the same item from being
  rediscovered by different sessions.

## 5. Where the visual source of truth lives

The same problem §4 solves for open items, applied to design: without a
declared home, tokens, palette, typography and component rules scatter
across three or four places and silently diverge. And without that pointer,
the Frontend agent is in the same position Security would be without a
declared authorization model — reviewing blind.

Decide per project (the questions, not the answers):

- **Where does the visual source of truth live?** A doc in the repo (e.g.
  `docs/design-system.md`), a token export from a design tool, an installed
  design skill — or nothing formal. If you want it machine-readable, the
  `DESIGN.md` format (google-labs-code/design.md: YAML front matter with the
  tokens, prose for the rationale, a contrast lint) is one option; a plain
  markdown doc the agents read first is another. Neither is required.
- **Who can change it, and what happens when the code and it diverge?**
  (which of the two gets fixed?)
- **Point to it from the adapted `CLAUDE.md`'s "Reference documentation"
  table** — that is where the Frontend agent will read it from.
- **If the project has none, say so explicitly** in `CLAUDE.md` instead of
  letting the agent assume one that doesn't exist.

Deliberately agnostic: no tool named. Each project points to whatever it
has.

## 6. The orchestration manual (optional, late)

The source project of this framework has a second document, separate from
`CLAUDE.md`, with the orchestrator-role rituals specific to that project
(isolated working environments per block, its own tools for rehearsing
schema changes, local-machine conventions). It did not come into this
template because **it is too early** — those rituals are only written after
they exist, that is, after the project has been through enough incidents
and sessions for there to be a pattern worth documenting.

When the new project reaches that point (typically: a pattern has repeated
2-3 times and is worth not reinventing every session), create the
equivalent and point to it from `CLAUDE.md`, as mature projects tend to do.
Writing it too early produces a document describing hypothetical rituals,
not real ones — and that is indistinguishable from fiction until someone
tries to follow it.

## 7. Supply chain: audit + dependency cooldown gate

Two layers, two decisions:

- **Vulnerability audit in CI** (*old* dependencies with CVEs) — the
  canonical shape is in §3; it is wired into the project's CI, Craveira ships
  no CI at all.
- **Cooldown gate** (*too-new* dependencies, supply-chain defense) — see
  `hooks/README.md`, the decision is explained there. Summary: optional,
  ecosystem-specific, only worth it once the project has serious CI.

**How vulnerabilities are detected** (the sensor without which the layers
don't work): an auditor compares the lockfile's versions against a public
advisory database (GitHub Advisory Database, OSV) and fails when it finds a
known vulnerability above the threshold. Each ecosystem has its own —
`npm audit` (Node), `pip-audit` (Python), `cargo audit` (Rust),
`govulncheck` (Go), `osv-scanner` (multi-ecosystem). Three places to run
it, strongest to lightest:

1. **In CI, as a gate** — fails the pipeline on HIGH/CRITICAL in
   production dependencies (e.g. `npm audit --omit=dev`). This is the layer
   that blocks deploys.
2. **Platform alerts** (Dependabot/Renovate or equivalent) — continuous
   watching between pushes, with automated bump PRs if you want them.
3. **Session-start information** — a startup hook that prints the status
   (the source project runs the audit in a SessionStart hook and shows
   "0 high/critical" at the start of every session): it doesn't block, it
   keeps the number in sight of whoever is working.

Honest note: the auditor only sees KNOWN vulnerabilities — ones with a
published advisory. That is exactly why the cooldown exists as a separate
layer: it covers the window in which a freshly published malicious package
has no advisory yet.

What is NOT optional is making the decision explicit: adopt the layers, or
declare their absence in the "What actually blocks (and what doesn't)"
section of the adapted `CLAUDE.md`. A project with no audit and no cooldown
can be a reasonable choice at its stage — no gate at all *and unsaid* is
the silence this framework exists to eliminate.

## 8. Final checklist before calling the adoption done

- [ ] The project's `CLAUDE.md` has no `{{PLACEHOLDER}}` left unfilled
- [ ] Every `<!-- ADAPT -->` section was read and resolved (adapted or
      explicitly removed — not left as it came)
- [ ] The tier table reflects what the project actually has (section 1)
- [ ] The existing agents make sense for the real stack (section 2)
- [ ] The pre-push hook is installed and running real commands
      (`npm install` prints the confirmation)
- [ ] The single list of open items exists and is referenced in
      `CLAUDE.md` (section 4)
- [ ] The visual source of truth is declared in `CLAUDE.md` — or its
      absence is explicit (section 5)
- [ ] Supply chain decided explicitly: vulnerability audit in CI and/or
      cooldown gate adopted, OR the absence declared in `CLAUDE.md`'s
      "What actually blocks" (section 7)
- [ ] `docs/security-checklist.md` and `docs/test-conventions.md` were
      created (even if short) — `CLAUDE.md` points to them but does not
      replace them
