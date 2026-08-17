# Frontend Spec Checklist

Fill section 4 of the dev spec from this checklist. The UI standards (section 3 below) are stack-neutral and apply whether the project uses the default React stack or the Vue backup stack — name the chosen stack in the spec either way.

Implementation patterns for the default stack live in `frontend-typescript-building-react-frontends` (and `frontend/typescript/react.dev.md`). For Vue projects, swap framework/library defaults for `frontend-typescript-building-vue-frontends` (and `frontend/typescript/vue.dev.md`); the checklist structure is unchanged.

## 1. Foundation

| Item | Type / Degree | Default |
|------|---------------|---------|
| 1.1 Language / build | Specification, must-have | TypeScript (strict mode), Vite, npm |
| 1.2 Framework | Specification, must-have | React 19 (function components + hooks). Vue 3 only when the project chooses it (Architecture Decision) — see the Vue checklist defaults |
| 1.3 UI libraries | Specification, must-have | shadcn/ui (Radix) + TailwindCSS on the default stack (Element Plus + Tailwind on Vue); one component library per project, no mixing |
| 1.4 API integration | Specification, must-have | One API client generated or typed from backend OpenAPI, with centralized auth, errors, and request-id behavior, consumed via TanStack Query hooks; components never call `fetch` directly |

## 2. Structure and State

| Item | Type / Degree | Default |
|------|---------------|---------|
| 2.1 Module layout | Specification, must-have | `src/features/` (feature modules), `src/components/` (incl. `ui/`), `src/hooks/`, `src/stores/`, `src/api/`, `src/i18n/`, `src/routes/`, `src/lib/` (DOM-free) |
| 2.2 State management | Specification, must-have | Server state in TanStack Query; client/UI state in Zustand stores per domain (Pinia on Vue). Never duplicate server data into a client store |
| 2.3 Routing | Specification, must-have | Type-safe routing (TanStack Router; React Router as the recorded alternative) with route-level code splitting and centralized authentication-aware UX guards; backend authorization remains authoritative |
| 2.4 i18n | Specification, should-have | react-i18next with module-based dictionaries; language switch in the nav; `Accept-Language` propagated via the API client |
| 2.5 Cross-platform layering | Specification + Guidance, should-have | Keep shared logic (generated transport types, frontend schemas, API client, Query hooks, stores, `lib/`) DOM-free (Specification) so it ports to VS Code webviews and React Native; use a workspace package for the shared layer when targeting more than one (Guidance, Architecture Decision) |

## 3. UI Standards

| Item | Type / Degree | Default |
|------|---------------|---------|
| 3.1 Dark/light mode | Specification, must-have | A dark/light mode switch in the nav from day one; semantic CSS variables (`--background`, `--foreground`, tokens) — no hardcoded light-only colors in components |
| 3.2 Tables | Specification, must-have | Column headers sortable wherever the data is orderable; number formats match the value semantics (counts with separators, money with currency, percentages with `%`); horizontal/vertical scrollbars for overflow; resizable column splitters |
| 3.3 Page layout for data-heavy views | Guidance, should-have | Prefer the 3-pane master–detail reader layout over browser-style page navigation: left pane lists items, middle pane shows the selected item's details, right pane shows metadata/related items/actions. Left and right panes collapsible to maximize the middle pane |
| 3.4 Loading / empty / error states | Specification, must-have | Every async view defines loading, empty, and error states; no blank screens while fetching |
| 3.5 Forms | Specification, should-have | Schema-driven validation (React Hook Form + Zod on the default stack; Vee-Validate + Zod on Vue); inline field errors; disable submit while pending |

## 4. Quality Gates

| Item | Type / Degree | Default |
|------|---------------|---------|
| 4.1 Lint / type-check | Specification, must-have | Lint + `tsc --noEmit` (or `vue-tsc` on Vue) type-check pass in CI on every PR |
| 4.2 UI verification | Specification, should-have | Maintain Playwright tests for critical journeys and use focused browser verification for changed UI (see `testing-with-playwright`); test relevant theme, role, browser, and viewport configurations |
| 4.3 Accessibility | Guidance, should-have | Keyboard navigation for primary flows; labels on form controls; sufficient contrast in both themes |
| 4.4 Component testing | Specification, must-have | Vitest + Testing Library + user-event; MSW for network behavior; cover loading, success, empty, validation, and error states where applicable |
