---
name: general-frontend-audit
description: "Audit frontend interface quality across accessibility, responsiveness, theming, performance, privacy, workflow clarity, copy, and design-system consistency. Use when asked to inspect, assess, critique, review UI quality, produce a design QA report, or prioritize frontend issues without immediately fixing them."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Frontend Audit

Run a systematic frontend quality review and report prioritized findings. Do
not fix issues during the audit unless the user explicitly asks for fixes.

Read `general-frontend-design` before judging visual quality. Use browser
evidence when practical instead of relying only on code inspection.

## Scope

Inspect the relevant routes, components, styles, API-client states, and user
flows. Include these categories when they apply:

- Accessibility: labels, landmarks, heading order, keyboard paths,
  focus-visible states, contrast, touch targets, reduced motion, and
  screen-reader-safe state.
- Responsive behavior: narrow screens, typical laptop width, wide desktop,
  high zoom, dialogs, tables, toolbars, and long text.
- Workflow clarity: primary action, state transitions, empty states,
  validation, recovery, and whether the user can tell what to do next.
- Privacy and security: no secrets, raw sensitive data, local paths, tokens,
  credentials, or internal error details in broad UI, logs, screenshots, or
  browser storage.
- Theming and design system: semantic tokens, light/dark contrast, component
  consistency, spacing rhythm, and one-off styles.
- Performance: heavy initial bundles, unbounded lists, repeated expensive work,
  expensive layout animations, broad refetches, and avoidable client-side
  recomputation.
- Copy: vague labels, unclear confirmations, unsafe destructive-action wording,
  and error messages without recovery steps.

## Severity

- `Critical`: blocks core work, leaks sensitive data, breaks auth/permissions,
  or creates a major accessibility failure.
- `High`: significant usability, correctness, privacy, responsive, or WCAG AA
  issue.
- `Medium`: meaningful quality issue, confusing workflow, performance risk, or
  design-system drift.
- `Low`: polish, minor consistency, or future improvement.

## Output

Lead with findings, then summarize.

```markdown
## Findings

### 1. <title>
Severity: <Critical | High | Medium | Low>
Location: `<file>:<line or component>`
Category: <accessibility | privacy | responsive | performance | theming | workflow | copy>
Problem: ...
Impact: ...
Recommendation: ...
Suggested follow-up skill: `<skill-name>`

## Positive Notes
- ...

## Priority Plan
1. Immediate: ...
2. Next: ...
3. Later: ...
```

Suggest only real local follow-up skills, such as `general-frontend-hardening`,
`general-frontend-responsive-design`, `general-frontend-ux-copy`,
`general-performance-optimization`, `general-frontend-design`, or
`general-frontend-verify`.
