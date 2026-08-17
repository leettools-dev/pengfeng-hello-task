---
name: general-managing-design-tokens
description: "Own design/tokens.json as the single source of visual truth — token structure, naming, mapping into the CSS-variable/Tailwind theme, and the change process from token edit to verified UI."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Managing Design Tokens

## Overview

`design/tokens.json` is the contract between design intent and UI code. When it
is real, changing a brand color or spacing scale is a one-file edit that flows
into every component; when it is decorative, the theme drifts and every visual
change becomes a grep hunt. This skill defines the token structure, how tokens
reach the frontend theme, and the change process.

Use this skill when:
- Setting up or auditing `design/tokens.json` in a product scaffold
- Changing brand colors, typography, spacing, radii, or shadows
- Importing tokens exported from Figma or another design tool
- A component hardcodes a value that should be a token

For component-level design quality, use `general-frontend-design`; this skill
owns the token layer beneath it.

## Token Structure

Two layers, in one file:

```json
{
  "primitive": {
    "color": { "blue-600": "#2563eb", "gray-900": "#111827" },
    "space": { "1": "0.25rem", "2": "0.5rem", "4": "1rem" },
    "radius": { "sm": "0.25rem", "md": "0.5rem" },
    "font": { "sans": "Inter, system-ui, sans-serif" }
  },
  "semantic": {
    "color": {
      "primary": "{primitive.color.blue-600}",
      "text": "{primitive.color.gray-900}",
      "danger": "#dc2626"
    }
  }
}
```

Rules:
- **Primitives** name raw values (`blue-600`), never usage.
- **Semantic tokens** name usage (`primary`, `danger`, `surface`), never raw
  values, and reference primitives where possible.
- Components consume **semantic tokens only**. A component referencing
  `blue-600` directly is a defect — it breaks theming and dark mode.
- Dark mode is a second semantic mapping over the same primitives, not a
  second primitive palette.

## Mapping into the Frontend

The scaffold's React stack (shadcn/ui + Tailwind) consumes tokens as CSS
variables. Keep the flow one-directional:

```
design/tokens.json  →  src generated theme (CSS variables / tailwind config)  →  components
```

- Emit semantic tokens as CSS variables on `:root` (and `.dark` for the dark
  mapping); wire Tailwind theme colors to those variables.
- Generate the theme file from `tokens.json` with a small script under
  `.agents/tools/` or a build step — do not hand-edit the generated output.
- If tokens are exported from Figma (Tokens Studio or similar), the export
  lands in `tokens.json` and goes through the same generation step. The design
  tool is an input, not a bypass.

See `frontend-typescript-building-react-frontends` for the theming mechanics
on the React side.

## Change Process

1. Edit `design/tokens.json` (or import a design-tool export into it).
2. Regenerate the theme output; commit both together.
3. Run the visual check: load key screens in light and dark themes
   (`general-frontend-verify`), confirm contrast on text/surface pairs.
4. If a component needed a raw value with no fitting semantic token, add the
   token first, then use it — never inline the value "temporarily".

## Anti-Patterns

- **Decorative tokens.** A `tokens.json` that exists but nothing reads it.
- **Usage-named primitives** (`primary-blue`) or **value-named semantics** (`color-2563eb`).
- **Hand-edited generated theme files.** The edit is lost on next regeneration.
- **Dark mode as component overrides.** Per-component dark styles instead of a second semantic mapping.

## Checklist

- [ ] Tokens split into primitive and semantic layers
- [ ] Components consume semantic tokens only
- [ ] Theme output generated from tokens.json, not hand-maintained
- [ ] Token change and regenerated theme committed together
- [ ] Light and dark themes visually verified after token changes
