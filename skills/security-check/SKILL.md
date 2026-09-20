---
name: security-check
description: Security analysis of recent changes — runs the Security agent over the git diff of the modified area. Use after implementing in the SECURITY, DATA-MIGRATION, SCHEMA or FEATURE tiers, before the commit.
---

Analyzes the security of the recently modified code area.

## Workflow

1. **Identify scope**: check `git diff` to see which files changed
2. **Analyze**: invoke the Security agent (`.claude/agents/security.md`) for a full analysis
3. **Checklist**: verify every item in `docs/security-checklist.md`
4. **Backend**: if tables/authorization rules/privileged functions are
   involved, invoke the Backend agent (`.claude/agents/backend.md`) to validate
5. **Dependencies**: if deps were added or updated, run the project's
   package-manager vulnerability audit
6. **Fix**: on CRITICAL or HIGH issues, fix immediately
7. **Report**: produce a report in the format below

## Output

```
## Security Analysis — [area reviewed]

### Issues found
[CRITICAL/HIGH/MEDIUM/LOW] — Description
- File: path/to/file:line
- Risk: what can happen
- Fix: how to resolve it (or already fixed)

### Checks OK
- List of what is correct

### Recommendations
- Optional improvements
```
