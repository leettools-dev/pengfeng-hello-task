---
name: general-operating-safely
description: "Apply destructive-command warnings, production safety checklists, and scope restriction rules before risky debugging, data changes, or deployments."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Operating Safely

## Overview

This skill defines safety controls for risky work: preventing destructive
operations, protecting production environments, and restricting scope during
debugging to avoid collateral damage.

It is not a step in any sequence — it is always active. Reference it whenever
you are working with production data, running destructive commands, or
debugging a deployed system.

## Destructive Operation Warnings

Before executing any of these commands, **stop and confirm** with the user or team:

### Git Operations
| Command | Risk | Safer Alternative |
|---------|------|-------------------|
| `git push --force` | Overwrites remote history, can destroy others' work | `git push --force-with-lease` (fails if remote changed) |
| `git reset --hard` | Discards all uncommitted changes | `git stash` first, then reset |
| `git branch -D` | Deletes branch even if not merged | `git branch -d` (fails if unmerged) |
| `git checkout -- .` | Discards all unstaged changes | `git stash` to save changes first |
| `git rebase` on a shared branch | Rewrites history others may depend on | `git merge` for shared branches |
| `git clean -fd` | Permanently removes untracked files and directories | `git clean -fdn` (dry run first) |

### File System Operations
| Command | Risk | Safer Alternative |
|---------|------|-------------------|
| `rm -rf` | Recursive permanent deletion | `rm -ri` (interactive) or move to trash first |
| `chmod -R 777` | Removes all security restrictions | Use specific permissions (644 for files, 755 for dirs) |
| Overwriting files without backup | Loss of original content | Copy original first: `cp file file.bak` |

### Database Operations
| Command | Risk | Safer Alternative |
|---------|------|-------------------|
| `DROP TABLE` / `DROP DATABASE` | Permanent data loss | Rename table first (`_deprecated_`), drop after confirming |
| `DELETE FROM` without `WHERE` | Deletes all rows | Always include `WHERE` clause; run `SELECT` first |
| `UPDATE` without `WHERE` | Updates all rows | Always include `WHERE` clause; run `SELECT` first |
| `TRUNCATE TABLE` | Removes all data, not logged | Use `DELETE` with `WHERE` for selective removal |
| Schema migrations that drop columns | Data loss | Add new column first, migrate data, then drop old column |

### Deployment Operations
| Command | Risk | Safer Alternative |
|---------|------|-------------------|
| Deploying directly to production | No rollback if broken | Deploy to staging first, verify, then promote |
| Rolling back without checking | May lose data from recent transactions | Check data dependencies before rollback |
| Scaling to zero | Service outage | Scale to minimum (1 instance), not zero |

### The Confirmation Protocol

For any destructive operation:

1. **State what you're about to do** in plain language
2. **State what will be lost** if it goes wrong
3. **Confirm the safer alternative** has been considered
4. **Get explicit approval** before executing

```
About to: force-push to origin/main
What could be lost: any commits pushed by others since last pull
Safer alternative: git push --force-with-lease
Proceeding? [yes/no]
```

## Production Safety Checklist

Before making any change to a production system:

### Pre-Change
- [ ] Change has been tested in staging/dev first
- [ ] Rollback plan is documented (how to undo this change)
- [ ] Monitoring is in place to detect problems
- [ ] Team is aware of the change (if during business hours)
- [ ] Backup exists for any data being modified
- [ ] Change window is appropriate (not during peak traffic, not on Friday evening)

### During Change
- [ ] Following the documented steps exactly
- [ ] Monitoring for errors in real-time
- [ ] Ready to rollback at any point
- [ ] Logging what is being done for audit trail

### Post-Change
- [ ] Verified the change works as expected
- [ ] No new errors in logs
- [ ] Performance has not degraded
- [ ] Monitoring thresholds are still within normal range
- [ ] Communicated completion to the team

## Scope Restriction

When debugging production issues, restrict the scope of what you can change to minimize risk of making things worse.

### The Freeze Protocol

When investigating a production issue:

1. **Define the freeze boundary** — only files in the affected module can be edited
2. **Read-only outside the boundary** — look at any file, but only change files within scope
3. **No speculative fixes** — every change must be tied to a specific hypothesis
4. **One change at a time** — make a change, verify, then move to the next

```
FREEZE BOUNDARY: src/services/search/
REASON: Investigating search timeout in production
ALLOWED: Read any file. Edit only files in src/services/search/
NOT ALLOWED: "While I'm here, let me also fix this unrelated thing in auth"
```

### Why Scope Restriction Matters

When debugging under pressure:
- You're tempted to make "quick fixes" in unrelated code
- Side changes can introduce new bugs that mask the original issue
- Unscoped debugging sessions often end with more bugs than they started with

### Lifting the Freeze

The freeze lifts when:
- The production issue is resolved and verified
- Or the investigation concludes that the issue is outside the freeze boundary (expand the boundary explicitly)

## Emergency Response

For production outages or critical bugs:

1. **Mitigate first, investigate second.** Can you rollback, disable the feature, or redirect traffic? Do that before debugging.
2. **Communicate immediately.** Let the team know there's an issue and you're on it.
3. **Restrict scope.** Apply the freeze protocol above.
4. **Log everything.** Document what you observe, what you try, and what happens.
5. **Don't skip tests.** Even in an emergency, run the test suite before deploying a fix. A fix that breaks something else is not a fix.

## Anti-Patterns

- **"It's just a quick fix."** Quick fixes in production without testing are how outages cascade.
- **Force-pushing to shared branches.** Use `--force-with-lease` at minimum. Better yet, don't rewrite shared history.
- **Debugging production by editing production code directly.** Always reproduce locally first. If you must change production, use the freeze protocol.
- **"I'll add the WHERE clause after testing."** Write the complete query from the start. Copy-paste mistakes with DELETE/UPDATE are irreversible.
- **Friday deploys.** Deploy when you have time to monitor and respond. Not before a weekend or holiday.
