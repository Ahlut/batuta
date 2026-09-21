# Contributing to Batuta

Thank you for considering a contribution. Batuta is a process framework,
not a product — the value is in the rules and the "why" behind them, so
the rigor of a contribution is measured more by its justification than by
the size of its diff.

## The framework's principle

**Proportionality to risk.** Any proposal that adds process has to answer:
where does this reduce an expensive mistake, and where does it add
friction with no matching real risk? A rule that applies always,
regardless of the change's risk, is usually a symptom that a condition is
missing ("only when X") rather than the rule itself being missing.

## How to propose a change

1. **Issue first for structural changes** (new tier, new agent, new
   reference file) — to align the shape before the content. For small
   fixes (typo, missing example, broken link), a direct PR is enough.
2. **Small, focused PRs** — one process change per PR, not several
   unrelated adjustments bundled together.
3. **Describe the "before"**: what real situation (even anonymized)
   exposed the missing rule, or what went wrong without it.
4. **Run the tests** if you touch `hooks/`, `agents/` or `skills/` — the
   plain-Node files in `test/`, no dependencies (see `hooks/README.md`,
   "Tests"). CI runs them on Linux and Windows; a hook change without a
   case in the battery is a change nobody can check.

## The golden rule for contributions

**A new rule only lands with its "why" written down** — ideally the
anonymized lesson that originated it, not just the rule itself.
`docs/token-costs.md` and the "BLOCKING rules" sections in the `agents/`
files follow this pattern on purpose: every line exists because something
went wrong without it, and the text says so, generically, instead of only
prescribing the behavior.

This applies with equal weight to example content: if you share a real
incident that motivated a rule, first remove anything that identifies the
product, the organization or the people involved (names, calendar dates,
business domains, internal identifiers). The lesson survives perfectly
without those details — that is precisely the pattern already followed in
the rest of the repository.

## What is NOT a good contribution here

- Hypothetical rules ("this could be useful one day") without a real case
  behind them — see `ADOPTION.md` §6 on why rituals written too early are
  indistinguishable from fiction.
- Coupling the framework to a specific stack in the core
  (`CLAUDE.template.md`, `agents/`, `docs/`) — concrete stack examples are
  welcome as `<!-- ADAPT -->` comments, never as defaults.
- Automation that writes code without human supervision — out of scope by
  design (see the "Routines" section of `CLAUDE.template.md`).

## License

By contributing, you accept that your contribution is distributed under
the repository's MIT license (see `LICENSE`).
