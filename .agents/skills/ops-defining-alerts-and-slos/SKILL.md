---
name: ops-defining-alerts-and-slos
description: "Define SLOs and alert rules as code under ops/alerts/ — golden-signal SLIs, page-vs-ticket severity, and a runbook link on every alert, sized for a solo founder on call."
layer: lifecycle
peers:
  - general-setting-up-observability
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Defining Alerts and SLOs

## Overview

`ops/alerts/` holds the product's alert rules and SLO definitions as committed
files. For a solo founder, the alerting budget is brutal: every page interrupts
the only engineer, so each alert must be actionable, user-impacting, and linked
to a runbook. Instrumentation itself (structured logs, metrics endpoints,
tracing) is defined in [observability](../general-setting-up-observability/references/observability.md);
this skill defines what watches those signals.

Use this skill when:
- Standing up monitoring for a newly deployed product
- A new feature adds a failure mode worth watching
- After an incident that no alert caught (or that a noisy alert obscured)

## SLOs First

Define 2–4 SLOs before writing any alert rule, in `ops/alerts/slos.md`:

```markdown
## SLO: API availability
- SLI: proportion of non-5xx responses on user-facing routes
- Objective: 99.5% over 30 days
- Error budget: ~3.6 h / 30 days
```

Start from the golden signals — availability, latency, error rate, saturation —
plus one **product-critical flow** (e.g., "exports complete within 10 minutes").
An SLO no user would notice being violated is decoration; delete it.

## Alert Rules as Code

One file per alert (or one YAML list) in `ops/alerts/`, provider-agnostic
fields first, provider syntax second:

```yaml
# ops/alerts/api-error-rate.yml
name: api-error-rate-high
signal: 5xx ratio on user-facing routes
condition: "> 2% for 10m"
severity: page          # page | ticket
runbook: ../runbooks/api-error-rate.md
verified: 2026-07-10    # date the alert was last tested to fire
```

Severity has exactly two levels:

| Severity | Meaning | Rule |
|----------|---------|------|
| `page` | Users are impacted **now**; act within minutes | Must have a runbook with a mitigation, not just diagnosis |
| `ticket` | Needs action this week, not this minute | Reviewed in a weekly sweep |

If a proposed alert is neither, it's a dashboard line, not an alert.

## Rules

- **Every alert links a runbook** in `ops/runbooks/` (see
  `ops-responding-to-incidents`). An alert with no runbook is a guaranteed
  3 a.m. improvisation.
- **Alert on symptoms, not causes.** Page on "users see errors", ticket on
  "disk 80% full". Cause-based pages fire when nothing is wrong.
- **Test that it fires.** Trigger the condition (kill the service in staging,
  inject errors) and record the `verified` date. An unverified alert is a hope.
- **Certificate/renewal and backup-failure alerts are mandatory tickets** —
  the quiet failures that end products (see `system-managing-domains-and-tls`).
- **Tune or delete after every false page.** A page that was ignorable twice
  will be ignored the third time, when it's real.

## Anti-Patterns

- **Alert-per-metric.** Coverage theater; pages that don't map to user impact.
- **Three-plus severity taxonomies.** A solo founder has two states: "get up" and "this week".
- **Threshold folklore.** Copied thresholds ("CPU > 80%") with no link to an SLO or incident.
- **Write-only alerting.** Rules committed at launch and never re-verified.

## Checklist

- [ ] 2–4 SLOs defined, each violation user-noticeable
- [ ] Every alert has severity `page` or `ticket` and a runbook link
- [ ] Page alerts are symptom-based with a mitigation in the runbook
- [ ] Every alert test-fired, `verified` date recorded
- [ ] Cert-renewal and backup-failure alerts present
