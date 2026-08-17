# Frontend Development Guidelines (React — Default Stack)

React + TypeScript is the **default** frontend stack for new projects. It lets us write TypeScript on both the frontend and backend, and it ports across our distribution targets: web SPA, VS Code webviews, and React Native mobile apps. Use the `frontend-typescript-building-vue-frontends` skill only when a project explicitly chooses Vue (recorded as an Architecture Decision in the dev spec).

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Why React for Our Targets](#why-react-for-our-targets)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Code Organization Patterns](#code-organization-patterns)
6. [Component Development Guidelines](#component-development-guidelines)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Styling Guidelines](#styling-guidelines)
11. [Dark Mode Implementation](#dark-mode-implementation)
12. [Data Display & Page Layout](#data-display--page-layout)
13. [Form Handling & Validation](#form-handling--validation)
14. [Cross-Platform: VS Code Webviews & Mobile](#cross-platform-vs-code-webviews--mobile)
15. [Code Quality & Linting](#code-quality--linting)
16. [Build & Deployment](#build--deployment)
17. [Best Practices](#best-practices)

---

## Technology Stack

The defaults below are deliberately chosen to mirror the Vue backup stack (Tailwind, shadcn, TanStack Table, Zod) so the dev-spec frontend checklist transfers one-to-one, and to keep the whole data layer fully typed.

### Core Framework
- **React 19** — function components and hooks only (no class components)
- **TypeScript 5.x** — `"strict": true`, no `any` in committed code
- **Vite 6** — dev server and build

### Routing
- **TanStack Router** — type-safe, file-based routing with typed search params. (React Router v7 is the acceptable alternative when a team already standardizes on it — record it as an Architecture Decision.)

### State Management
- **TanStack Query** — all server state (fetching, caching, mutations, invalidation)
- **Zustand** — client/UI state (the React counterpart of Pinia: small, store-per-domain)

### UI & Styling
- **shadcn/ui** — Radix UI primitives + Tailwind, copied into the repo under `src/components/ui/` (the React counterpart of shadcn-vue)
- **TailwindCSS 4** — utility-first styling with CSS-variable theme tokens
- **lucide-react** — icons

### Forms & Validation
- **React Hook Form** — form state
- **Zod** — frontend form, local-state, and non-API boundary validation; API transport types come from generated OpenAPI

### Data
- **@tanstack/react-table** — headless table features (sorting, resizing, virtualization)
- **TanStack Query** for server data; **Axios** or `fetch` wrapper for transport

### Utilities
- **react-i18next** — internationalization
- **date-fns** — date/time (tree-shakeable; prefer over Moment)
- **loglevel** — logging (`logger`, never `console.log`)

### Tooling
- **Biome** (or ESLint + Prettier) — lint and format
- **Vitest + React Testing Library** — unit/component tests
- **Playwright** — end-to-end and UI verification (see `testing-with-playwright`)

---

## Why React for Our Targets

| Target | How React serves it |
|--------|--------------------|
| Web SPA | React 19 + Vite, standard DOM rendering |
| VS Code plugin | Extension webviews render a React app in an embedded WebView; the same component code and design system are reused |
| Mobile apps | React Native (Expo) shares the **non-UI** layer — TypeScript types, Zod schemas, API client, TanStack Query hooks, Zustand stores — while presentational components are platform-specific |

**The portability rule:** keep business logic, types, validation, and data fetching free of DOM/`window` assumptions so they can be shared across web, webview, and native. The presentational layer (shadcn/ui is DOM-only) is rewritten per target. See [Cross-Platform](#cross-platform-vs-code-webviews--mobile).

---

## Development Environment Setup

### Prerequisites
- **Node.js**: >= 24.x (use a `.nvmrc`; see [Node.js Version Policy](../../system-developing-with-docker/references/docker-guide.md#nodejs-version-policy))
- **Package Manager**: npm (matches the backend; `npm install`, `npm run dev`)

### Environment Variables

Vite exposes only variables prefixed with `VITE_`. Create `.env`:

```bash
# Backend API base URL
VITE_API_BASE=http://localhost:3000

# Feature flags
VITE_ENABLE_SWITCH_LANGUAGE=true
VITE_ENABLE_DEBUG=false
```

Read them through a single typed config module (`src/config/env.ts`) — never scatter `import.meta.env` across components.

### Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # type-check + production build
npm run preview    # preview production build
npm run lint       # lint
npm run test       # vitest
```

---

## Project Structure

```
frontend/
├── public/                    # static assets
├── src/
│   ├── api/                   # API client modules, one file per domain
│   │   ├── client.ts          # axios/fetch instance + interceptors
│   │   ├── chat.ts
│   │   └── auth.ts
│   ├── app/                   # app shell, providers, root layout
│   │   ├── App.tsx
│   │   └── providers.tsx      # Query, Router, i18n, Theme providers
│   ├── components/            # reusable presentational components
│   │   ├── ui/                # shadcn/ui components (generated)
│   │   └── layout/            # MasterDetailLayout, nav, etc.
│   ├── features/              # feature-scoped UI + hooks + api
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   ├── hooks/         # useChatHistory (TanStack Query)
│   │   │   └── api.ts
│   │   └── documents/
│   ├── hooks/                 # cross-feature hooks (useTheme, useDebounce)
│   ├── i18n/                  # react-i18next setup + locale dictionaries
│   │   ├── en/
│   │   ├── ja/
│   │   ├── zh/
│   │   └── index.ts
│   ├── lib/                   # framework-free utilities
│   │   ├── format.ts          # number/money/percent/date formatters
│   │   ├── logger.ts          # loglevel wrapper
│   │   └── utils.ts           # cn() etc.
│   ├── routes/                # TanStack Router route tree
│   ├── stores/                # Zustand stores, one per domain
│   │   ├── globalStore.ts
│   │   └── themeStore.ts
│   ├── types/                 # shared TS types (ideally generated from backend)
│   ├── config/
│   │   └── env.ts             # typed env access
│   └── main.tsx               # entry
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

Conventions:
- **`features/` over a flat `pages/`**: each feature owns its components, hooks, and API calls. Cross-feature reusable pieces live in `components/`, `hooks/`, `lib/`.
- **`lib/` is DOM-free** so it can be shared with React Native and webview builds.

---

## Code Organization Patterns

### Import Organization

Order imports consistently; group with blank lines:

```typescript
// 1. External / third-party
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal absolute imports — components, then hooks/stores
import { Button } from "@/components/ui/button";
import { useGlobalStore } from "@/stores/globalStore";

// 3. API and types
import { getChatHistory } from "@/features/chat/api";
import type { ChatMessage } from "@/types/chat";

// 4. Logger (always last)
import { logger } from "@/lib/logger";
```

### Component File Organization

Order the body of a component top-to-bottom: hooks → derived values → handlers → effects → render.

```tsx
export function UsagePanel({ orgId }: UsagePanelProps) {
  // 1. Hooks (stores, queries, router, i18n)
  const { t } = useTranslation();
  const canExportUsage = useGlobalStore((s) => s.can("usage:export"));
  const { data, isLoading, isError } = useQuery({
    queryKey: ["usage", orgId],
    queryFn: () => getUsageSummary(orgId),
  });

  // 2. Derived values (useMemo for expensive derivations)
  const rows = useMemo(() => data?.items ?? [], [data]);

  // 3. Handlers
  const handleExport = () => logger.debug("UsagePanel: export", orgId);

  // 4. Render — handle loading/error/empty explicitly
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState />;
  if (rows.length === 0) return <EmptyState />;

  return (
    <UsageTable
      rows={rows}
      onExport={canExportUsage ? handleExport : undefined}
    />
  );
}
```

---

## Component Development Guidelines

### Naming
- **Components**: `PascalCase` files and exports (`UsagePanel.tsx`)
- **Hooks**: `camelCase` starting with `use` (`useChatHistory.ts`)
- **Non-component modules**: `camelCase` (`api.ts`, `format.ts`)
- One component per file; colocate a component's styles/tests beside it.

### Props
- Always type props with an explicit interface; never `any`.
- Prefer required props; give optional props sensible defaults via destructuring.

```tsx
interface PagerProps {
  start: number;
  limit: number;
  total: number;
  onChange: (next: { start: number; limit: number }) => void;
}

export function Pager({ start, limit, total, onChange }: PagerProps) { /* … */ }
```

### Rules
- Function components and hooks only.
- Every async view renders explicit **loading**, **error**, and **empty** states — never a blank screen while fetching.
- Use the `logger` (loglevel) for diagnostics; no `console.log` in committed code.
- Keep components presentational; put data fetching in feature hooks (TanStack Query) and shared logic in `lib/`.

---

## State Management

Two tools, clear split:

### Server State — TanStack Query

All data that lives on the server is fetched, cached, and mutated through Query. Never copy server data into a Zustand store.

```typescript
// src/features/chat/hooks/useChatHistory.ts
import { useQuery } from "@tanstack/react-query";
import { getChatHistory } from "../api";

export function useChatHistory(orgName: string, kbName: string) {
  return useQuery({
    queryKey: ["chat-history", orgName, kbName],
    queryFn: () => getChatHistory({ orgName, kbName }),
    staleTime: 30_000,
  });
}
```

```typescript
// Mutations invalidate the relevant queries
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postChat } from "../api";

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postChat,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-history"] }),
  });
}
```

### Client State — Zustand

UI/session state (current user, theme, selection, panel visibility). One store per domain; select narrowly to avoid re-renders.

```typescript
// src/stores/globalStore.ts
import { create } from "zustand";
import type { User } from "@/types/user";

interface GlobalState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  can: (permission: string) => boolean;
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  currentUser: null,
  setCurrentUser: (currentUser) => set({ currentUser }),
  can: (permission) =>
    get().currentUser?.permissions.includes(permission) ?? false,
}));
```

Effective permissions returned by the backend may control which actions the UI
offers. They never replace backend authorization for the request itself.

```tsx
// Select only what you use
const currentUser = useGlobalStore((s) => s.currentUser);
```

Best practices:
1. Server data → Query; client/UI data → Zustand. Don't mix.
2. One store per feature/domain; no god stores.
3. Derive, don't duplicate (compute from `data`/state with `useMemo` or store selectors).

---

## API Integration

### One Typed Client, One Module per Domain

Components never call `fetch`/`axios` directly. A single client carries auth, request-id, and error handling; per-domain modules expose typed functions.

```typescript
// src/api/client.ts
import axios from "axios";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

export const apiClient = axios.create({ baseURL: env.apiBase, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  config.headers["x-request-id"] = crypto.randomUUID();
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (error) => {
    logger.error("api error", error?.response?.status, error?.config?.url);
    if (error?.response?.status === 401) {
      // redirect to login / clear session
    }
    return Promise.reject(error);
  },
);
```

```typescript
// src/features/chat/api.ts
import { apiClient } from "@/api/client";
import type { ChatMessage } from "@/types/chat";

export function getChatHistory(params: { orgName: string; kbName: string }) {
  return apiClient.get<unknown, ChatMessage[]>("/api/v1/chat/articles", { params });
}

export function postChat(data: { message: string }) {
  return apiClient.post<unknown, ChatMessage>("/api/v1/chat", data);
}
```

Best practices:
1. One API file per backend domain; functions are typed by request and response.
2. Use the generated OpenAPI client/types for first-party API transport. Validate third-party responses, local storage, and extension messages with Zod.
3. All calls go through the client interceptors — never inline a raw `fetch`.
4. Wrap calls in TanStack Query hooks; components consume hooks, not API functions directly.

---

## Internationalization (i18n)

Use **react-i18next** with module-based dictionaries (one file per feature), mirroring the Vue backup stack.

```typescript
// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ja from "./ja";
import zh from "./zh";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja }, zh: { translation: zh } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
```

```tsx
import { useTranslation } from "react-i18next";

function SaveButton() {
  const { t } = useTranslation();
  return <Button>{t("common.save")}</Button>;
}
```

Best practices:
1. Never hardcode display strings; every user-facing string goes through `t()`.
2. Dot-notation keys grouped by feature (`common.save`, `chat.sendTooltip`).
3. Keep the language switch in the nav; propagate `Accept-Language` from the API client.
4. Add a key to all locales at once.

---

## Styling Guidelines

Tailwind for layout and spacing; **CSS variables for theme colors** so light/dark switching is automatic. shadcn/ui components are styled with these tokens out of the box.

```css
/* src/styles/theme.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --muted: 0 0% 96%;
  --border: 0 0% 88%;
}
.dark {
  --background: 0 0% 14%;
  --foreground: 0 0% 95%;
  --muted: 0 0% 18%;
  --border: 0 0% 24%;
}
```

```tsx
// Use the semantic tokens, not hardcoded colors
<div className="bg-background text-foreground border border-border rounded-lg p-4">
  Content
</div>
```

Best practices:
1. Use semantic theme tokens (`bg-background`, `text-foreground`) — never hardcoded `bg-white`/hex in components.
2. Tailwind utilities for layout; extract repeated class lists with the `cn()` helper or a component.
3. Test every new surface in both light and dark mode.

---

## Dark Mode Implementation

A dark/light switch in the nav from day one. Theme is a Zustand store that toggles the `dark` class on `<html>` and persists to localStorage; initialize from system preference on first visit.

```typescript
// src/stores/themeStore.ts
import { create } from "zustand";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    set({ theme: next });
  },
}));
```

```tsx
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeSwitch() {
  const { theme, toggle } = useThemeStore();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
```

Apply the persisted theme class before first paint (a small inline script in `index.html`) to avoid a flash.

Checklist when adding components:
- [ ] Uses semantic theme tokens for all colors
- [ ] Verified in both light and dark mode
- [ ] Sufficient text contrast in both themes
- [ ] Borders and shadows visible in dark mode

---

## Data Display & Page Layout

### Table Conventions

Tables are the default surface for structured data; they must behave like data tools, not static HTML. Use **@tanstack/react-table** (headless) rendered with shadcn/ui table primitives:

- **Sortable headers**: every column whose data is orderable is sortable (`enableSorting`, `getSortedRowModel`).
- **Number formats match value semantics**: counts with thousand separators (`1,234`), money with currency and two decimals (`$1,234.50`), percentages with `%` and one decimal (`12.3%`). Centralize formatters in `src/lib/format.ts` — never inline `toFixed` in JSX.
- **Overflow handling**: vertical and horizontal scroll for overflow; large lists use row virtualization (`@tanstack/react-virtual`); never let a wide table break the page.
- **Resizable columns**: enable column resizing (`enableColumnResizing`, `columnResizeMode: "onChange"`) where content width varies.
- Right-align numeric columns; left-align text.

```tsx
const columns: ColumnDef<UsageRow>[] = [
  { accessorKey: "name", header: "Name", enableSorting: true },
  {
    accessorKey: "count",
    header: "Items",
    enableSorting: true,
    cell: ({ getValue }) => <span className="text-right">{formatCount(getValue<number>())}</span>,
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    enableSorting: true,
    cell: ({ getValue }) => <span className="text-right">{formatMoney(getValue<number>())}</span>,
  },
];
```

### 3-Pane Master–Detail Layout

For data-heavy pages, prefer the 3-pane master–detail reader layout over browser-style page navigation:

```text
┌────────────┬──────────────────────────┬────────────┐
│ Left pane  │ Middle pane              │ Right pane │
│ item list  │ details of selected item │ metadata,  │
│ (master)   │ (detail)                 │ related    │
│            │                          │ items,     │
│            │                          │ actions    │
└────────────┴──────────────────────────┴────────────┘
```

- **Left pane**: the list of items (search/filter on top; selection drives the middle pane).
- **Middle pane**: the details of the selected item — the primary reading/working surface.
- **Right pane**: metadata, related items, or actions for the selected item.
- Left and right panes are **collapsible** to maximize the middle pane; persist collapsed state (localStorage or a Zustand store).
- Selection belongs in the URL (`/items/$itemId` with TanStack Router) so deep links and refresh restore the same view.
- Use this layout especially when users scan many items and inspect them one at a time (inboxes, logs, runs, documents). Plain pages remain fine for forms, dashboards, and settings.

---

## Form Handling & Validation

**React Hook Form + Zod** — the same Zod schema validates the form and can validate the API payload.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({ onSave }: { onSave: (v: FormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <input {...register("name")} />
        {errors.name && <span className="text-destructive">{errors.name.message}</span>}
      </div>
      <div>
        <input type="email" {...register("email")} />
        {errors.email && <span className="text-destructive">{errors.email.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting}>Save</Button>
    </form>
  );
}
```

Best practices:
1. One Zod schema per form; derive the TS type with `z.infer`.
2. Show inline field errors; disable submit while pending (`isSubmitting`).
3. Reuse schemas across form and API boundary where the shapes match.

---

## Cross-Platform: VS Code Webviews & Mobile

The same React knowledge serves all three distribution targets, but **share logic, not presentation**.

### What is shareable (keep it DOM-free)
- TypeScript types (`src/types/`) — ideally generated from the backend's TypeBox/OpenAPI schemas
- Zod schemas and validation
- API client and TanStack Query hooks
- Zustand stores and pure logic in `lib/`

Keep these modules free of `window`, `document`, and DOM-only libraries so they import cleanly into a React Native bundle and a webview bundle.

### VS Code webview
- The extension host renders a React app inside a webview panel; build it with Vite as a separate entry.
- Communicate with the extension via `acquireVsCodeApi()` message passing — wrap it in a typed `postMessage`/`onMessage` module rather than calling it ad hoc.
- Respect the webview Content-Security-Policy: no inline scripts, nonce your bundle, load assets via `webview.asWebviewUri`.
- Use VS Code theme CSS variables (`--vscode-*`) so the webview matches the user's editor theme, in addition to the app's own tokens.
- Routing: prefer in-memory/hash routing — there is no browser address bar in a webview.

### Mobile (React Native / Expo)
- Reuse the shared logic layer above; rebuild the presentational layer with React Native components (shadcn/ui and Tailwind classes are DOM-only and do not render in RN — use NativeWind or a RN component kit).
- Navigation uses React Navigation (or Expo Router), not TanStack Router.
- Centralize platform-specific code behind small adapters (storage, navigation, theming) so feature code stays portable.

**Architecture rule for the dev spec:** when a project targets more than one of these, structure the repo so the shared layer is a workspace package consumed by each app (web, extension webview, mobile) — record the chosen monorepo layout as an Architecture Decision.

---

## Code Quality & Linting

- **Biome** (or ESLint + Prettier) for lint/format; CI fails on violations.
- **`tsc --noEmit`** type-check passes in CI on every PR — no `any` in committed code.
- **Vitest + React Testing Library + MSW** for component and hook tests; **Playwright** for end-to-end and UI verification (`testing-typescript-applications`, `testing-with-playwright`).

```bash
npm run lint
npm run check      # tsc --noEmit
npm run test
```

---

## Build & Deployment

- `npm run build` runs the type-check then the Vite production build.
- Code-split by route (TanStack Router lazy routes) and vendor chunks; keep an eye on bundle size.
- Web SPA deploys as static assets behind the edge/CDN or served by the backend; the VS Code webview bundle ships inside the extension; the mobile app builds through Expo/EAS.
- Containerized static serving for the web SPA mirrors the backend Docker guidance (see `system-developing-with-docker`).

---

## Best Practices

### General
1. Function components and hooks only; no class components.
2. Server state in TanStack Query, client state in Zustand — never duplicate server data into a store.
3. Every async view renders explicit loading, error, and empty states.
4. Type everything; no `any` in committed code.
5. Use `logger` (loglevel), never `console.log`.
6. Never hardcode user-facing strings — use i18n.
7. Use semantic theme tokens for color; verify light and dark mode.
8. Keep shared logic DOM-free so it ports to webview and React Native.

### Performance
1. Lazy-load routes and heavy components (`React.lazy`, lazy routes).
2. Select narrowly from Zustand and memoize derived values to avoid re-renders.
3. Debounce search/filter inputs.
4. Virtualize long lists and large tables.

### Security
1. Validate untrusted data with Zod; never trust client-side validation alone — the backend validates too.
2. Avoid `dangerouslySetInnerHTML`; sanitize if unavoidable.
3. Always use HTTPS; keep secrets out of the frontend bundle.

### Accessibility
1. Semantic HTML and ARIA labels; shadcn/ui (Radix) gives accessible primitives — keep their semantics.
2. Full keyboard navigation for primary flows; visible focus states.
3. Meet WCAG AA contrast in both themes.

### Code Review Checklist
- [ ] Imports organized; logger used (no `console.log`)
- [ ] Props and state fully typed; no `any`
- [ ] Server state via Query, client state via Zustand (no duplication)
- [ ] Loading / error / empty states present
- [ ] Strings localized in all locales
- [ ] Semantic theme tokens; light and dark verified
- [ ] Shared logic kept DOM-free where cross-platform is in scope
- [ ] Lint, type-check, and tests pass
