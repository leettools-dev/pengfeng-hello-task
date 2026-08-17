---
name: frontend-typescript-building-react-frontends
description: "Build React 19 + TypeScript frontends on the default stack — TanStack Router/Query, Zustand, shadcn/ui + Tailwind, React Hook Form + Zod, react-i18next — with portability to VS Code webviews and React Native."
layer: lifecycle
applies_when:
  frontend: [react]
peers:
  - system-developing-with-docker
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# React Frontend Development

## Overview

Use this skill when implementing frontend changes on the **default** stack: React 19 + TypeScript + Vite, with TanStack Router/Query, Zustand, shadcn/ui + Tailwind, React Hook Form + Zod, and react-i18next. This is the default for new projects because it keeps TypeScript on both ends and ports across our targets — web SPA, VS Code webviews, and React Native mobile.

Read [the canonical React guide](references/react.dev.md) for
the full conventions. Load only the sections relevant to the current task so
the main skill stays small.

For projects that explicitly choose Vue (an Architecture Decision in the dev spec) or for existing Vue codebases, use `frontend-typescript-building-vue-frontends` instead.

## Use This Skill When

- Creating or modifying React components, hooks, stores, routes, or feature modules
- Wiring API calls, data tables, forms, validation, i18n, or theming
- Structuring a frontend for cross-platform reuse (web + VS Code webview + mobile)
- Reviewing whether frontend code follows the documented React stack conventions

## Hard Rules

These come from the dev-spec frontend checklist and are not stylistic preferences:

1. Function components and hooks only; no class components; no `any` in committed code.
2. Server state lives in TanStack Query; client/UI state in Zustand — never duplicate server data into a store.
3. Every async view renders explicit loading, error, and empty states.
4. Components never call `fetch`/`axios` directly — go through the OpenAPI-derived API client and Query hooks.
5. A dark/light switch from day one; semantic theme tokens (`bg-background`, `text-foreground`) — no hardcoded colors.
6. Tables: sortable headers, semantic number formats (centralized in `lib/format.ts`), resizable columns, scroll/virtualization for overflow.
7. Prefer the 3-pane master–detail layout for data-heavy pages.
8. Keep shared logic (generated transport types, frontend schemas, API client, Query hooks, stores, `lib/`) DOM-free so it ports to webviews and React Native.
9. Frontend permission checks only control presentation; backend authorization remains authoritative.
10. Use Vitest + Testing Library + MSW for component behavior and Playwright for critical browser journeys.
11. No hardcoded user-facing strings — use react-i18next; `logger` (loglevel), never `console.log`.

## Reference Map

- Stack and rationale: `Technology Stack`, `Why React for Our Targets`
- Layout and conventions: `Project Structure`, `Code Organization Patterns`, `Component Development Guidelines`
- Data: `State Management`, `API Integration`
- UI: `Styling Guidelines`, `Dark Mode Implementation`, `Data Display & Page Layout`, `Form Handling & Validation`
- Multi-target: `Cross-Platform: VS Code Webviews & Mobile`
- Quality gates: `Code Quality & Linting`, `Build & Deployment`, `Best Practices`

If the task spans several areas, keep the reference open and pull in only the exact sections you need.
