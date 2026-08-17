---
name: ops-responding-to-incidents
description: "Write runbooks in ops/runbooks/ and run incidents with a solo-founder-sized flow — verify, mitigate, communicate, then a blameless postmortem whose action items land on the roadmap."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Responding to Incidents

## Overview

`ops/runbooks/` is what future-you (or an agent) follows at 3 a.m. when an
alert fires. This skill covers writing runbooks before they're needed, the
incident flow while one is happening, and the postmortem that stops the repeat.

Use this skill when:
- Adding an alert (every alert needs a runbook — see `ops-defining-alerts-and-slos`)
- An incident is happening (follow *Incident Flow*, skip everything else)
- Writing a postmortem after mitigation
- A production surprise revealed a missing runbook

Safety rules from `general-operating-safely` apply doubly during incidents:
pressure is when destructive shortcuts look attractive.

## Runbook Template

One file per alert or failure mode, `ops/runbooks/<name>.md`:

```markdown
# Runbook: <symptom, e.g. API error rate high>

**Alert:** ../alerts/api-error-rate.yml
**Last verified:** <date someone actually executed these steps>

## 1. Confirm impact (2 min)
- <exact command or dashboard link showing user impact, not just the metric>

## 2. Mitigate first
- <fastest action returning users to service: rollback, restart, failover,
  feature-flag off — with exact commands>
- Rollback beats diagnosis. Understand it after users are unblocked.

## 3. Diagnose (after mitigation)
- <where to look: log queries, correlation ids, recent deploys>

## 4. Known causes
| Symptom detail | Likely cause | Fix |
|----------------|--------------|-----|

## 5. Escalate / give up criteria
- <when to call the provider, restore from backup, or post a status update>
```

Runbook rules: exact commands, not prose ("check the logs" is not a step);
mitigation before diagnosis; verified by execution, with the date recorded.

## Incident Flow

1. **Assess severity** — is user impact ongoing? If not, it's a ticket; stop.
2. **Mitigate** via the runbook. No runbook? Default mitigation order:
   rollback last deploy → restart → feature-flag off → status update.
3. **Communicate** — if impact exceeds ~15 minutes, post a short honest note
   (status page, email, or in-app banner): what's affected, that you're on it.
   Drafting is agent work; a human sends it.
4. **Log the timeline as you go** — timestamps of detection, actions, effects.
   Memory reconstructs badly after adrenaline.
5. **Declare the end** when the SLI recovers, not when the fix "should" work.

## Postmortem (within a week, blameless)

`ops/runbooks/postmortems/<date>-<slug>.md`:

```markdown
# Postmortem: <title> (<date>)
**Impact:** <who, what, how long>  **Detection:** <alert or human? lag?>
## Timeline
## Root cause          <the condition, not the person or the typo>
## What worked / what didn't
## Action items
| Action | Type (fix / alert / runbook / process) | Roadmap link |
```

Every action item lands on the roadmap (`dev-cycle-managing-roadmaps`) or is
done in the postmortem PR itself. An action item table with no owner-of-record
is how the same incident happens twice.

## Anti-Patterns

- **Diagnosis before mitigation.** Users wait while you satisfy curiosity.
- **Prose runbooks.** Steps that require thinking are steps that fail at 3 a.m.
- **Heroic memory.** No timeline logged, postmortem reconstructed from vibes.
- **Blameful root cause.** "Engineer pushed a bad config" — why *could* one bad config take production down?
- **Postmortem theater.** Action items written, never roadmapped, incident repeats.

## Checklist

- [ ] Every alert has a runbook with exact commands
- [ ] Mitigation section precedes diagnosis in every runbook
- [ ] Runbooks execution-verified, date recorded
- [ ] Incident timelines logged during, not after
- [ ] Postmortem within a week; action items on the roadmap
