#!/usr/bin/env node
/**
 * render-architecture-svg.ts - dependency-free primitives for a code-generated
 * system architecture diagram, plus a worked example that exercises all of
 * them.
 *
 * This is the starting point referenced by the general-diagramming-architecture
 * skill. Copy it into a product repository next to the design document it
 * illustrates, replace the `exampleDiagram()` declarations with the real
 * components, and run it. The generated SVG is committed; this file, not the
 * SVG, is the thing you edit.
 *
 * Policy behind every rule enforced here — band model, edge vocabulary, the
 * fit budget, the failure modes — is in the skill's
 * references/architecture-diagrams.md.
 *
 * Usage (Node 24 strips the types natively; `tsx` also works):
 *   node scripts/render-architecture-svg.ts                  # write the SVG
 *   node scripts/render-architecture-svg.ts --check          # CI sync gate
 *   node scripts/render-architecture-svg.ts --output docs/architecture.svg
 *
 * Two properties are load-bearing and easy to lose:
 *   1. Output is deterministic. Nothing here iterates a Set or Map keyed by
 *      hash order, reads the clock, or formats by locale. `--check` is
 *      meaningless the moment one of those creeps in.
 *   2. Text fit is asserted, not hoped for. SVG neither wraps nor clips, so
 *      `assertCardsFit` is the only thing standing between a long label and a
 *      line of text lying across a border.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --------------------------------------------------------------- primitives

/** accent (text, borders), band fill, band stroke. */
export interface Palette {
  accent: string;
  fill: string;
  stroke: string;
}

export type Anchor = "start" | "middle" | "end";
export type Advance = "regular" | "bold" | "mono";

/**
 * Estimated advance width as a fraction of font size. Deliberately pessimistic:
 * measured system sans lands nearer 0.52, so a line that trips the assertion
 * still has headroom. Shorten it anyway — you have no real measurement.
 */
const ADVANCE: Record<Advance, number> = { regular: 0.55, bold: 0.6, mono: 0.6 };

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Escape the five XML entities. Component names contain generics and paths. */
export function escapeXml(body: string): string {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface TextOptions {
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: Anchor;
  mono?: boolean;
}

/**
 * One line of text. There is no wrapping: a string longer than its box simply
 * runs past it, which is what `assertCardsFit` exists to catch.
 *
 * Never build columns by padding a single string with spaces — XML collapses
 * runs of whitespace, so the padding disappears at render time. Emit one text
 * element per column at a fixed x instead.
 */
export function text(x: number, y: number, body: string, options: TextOptions = {}): string {
  const { size = 14, weight = 400, fill = "#16324F", anchor = "start", mono = false } = options;
  const anchorAttr = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
  const family = mono ? ` font-family="${MONO}"` : "";
  return (
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" ` +
    `fill="${fill}"${anchorAttr}${family}>${escapeXml(body)}</text>`
  );
}

export function band(x: number, y: number, w: number, h: number, palette: Palette): string {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" ` +
    `fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2"/>`
  );
}

/** Width a tab will occupy. Needed to keep inbound edges out of its x-range. */
export function tabWidth(label: string): number {
  return 34 + Math.round(label.length * 7.9);
}

/**
 * A band label rendered as a tab rather than a full-width heading. A heading
 * that spans the band is crossed by the first vertical edge entering it; a tab
 * leaves the rest of the width free for routing.
 */
export function tab(x: number, y: number, label: string, palette: Palette): string {
  return (
    `<rect x="${x}" y="${y}" width="${tabWidth(label)}" height="34" rx="17" ` +
    `fill="#FFFFFF" stroke="${palette.stroke}" stroke-width="2"/>` +
    text(x + 17, y + 23, label, { size: 15, weight: 700, fill: palette.accent })
  );
}

/** One component: what it is, and what it is responsible for. */
export interface Card {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: readonly string[];
  accent: string;
  stroke?: string;
  fill?: string;
  /** Short badge (a step number) drawn in a filled circle before the title. */
  badge?: string;
  titleSize?: number;
  lineSize?: number;
  lineStep?: number;
  /** Thicker border, for the component the diagram is about. */
  emphasis?: boolean;
}

const CARD_PAD = 16;
const BADGE_COLUMN = 32;

export function card(spec: Card): string {
  const {
    x, y, w, h, title, lines = [], accent,
    stroke = accent, fill = "#FFFFFF", badge,
    titleSize = 16, lineSize = 13, lineStep = 18, emphasis = false,
  } = spec;
  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="${emphasis ? 3 : 1.6}"/>`,
  ];
  let titleX = x + CARD_PAD;
  if (badge) {
    const cx = x + 26;
    const cy = y + 26;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="13" fill="${accent}"/>`);
    parts.push(text(cx, cy + 5, badge, { size: 14, weight: 700, fill: "#FFFFFF", anchor: "middle" }));
    titleX = x + CARD_PAD + BADGE_COLUMN;
  }
  parts.push(text(titleX, y + 29, title, { size: titleSize, weight: 700, fill: accent }));
  let lineY = y + 29 + 21;
  for (const line of lines) {
    parts.push(text(x + CARD_PAD, lineY, line, { size: lineSize, fill: "#5A7085" }));
    lineY += lineStep;
  }
  return parts.join("");
}

export interface EdgeLabel {
  x: number;
  y: number;
  body: string;
  anchor?: Anchor;
}

/**
 * A connector between components. Points are routed by hand: pass the corners
 * of an orthogonal path through a gutter, not a diagonal across a dense band.
 *
 * When both directions carry a payload worth naming, draw two edges 30px apart
 * rather than one double-headed arrow with two labels on it.
 */
export interface Edge {
  points: readonly (readonly [number, number])[];
  color: string;
  /** Dash pattern. Vary it as well as hue so the legend survives grayscale. */
  dash?: string;
  width?: number;
  head?: "end" | "start" | "both" | "none";
  labels?: readonly EdgeLabel[];
}

export function edge(spec: Edge): string {
  const { points, color, dash, width = 2.4, head = "end", labels = [] } = spec;
  const key = color.replace("#", "");
  const points_ = points.map(([x, y]) => `${x},${y}`).join(" ");
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  let markerAttr = "";
  if (head === "end" || head === "both") markerAttr += ` marker-end="url(#head-${key})"`;
  if (head === "start" || head === "both") markerAttr += ` marker-start="url(#tail-${key})"`;
  const parts = [
    `<polyline points="${points_}" fill="none" stroke="${color}" stroke-width="${width}" ` +
      `stroke-linecap="round" stroke-linejoin="round"${dashAttr}${markerAttr}/>`,
  ];
  for (const label of labels) {
    parts.push(
      text(label.x, label.y, label.body, {
        size: 12.5, weight: 600, fill: color, anchor: label.anchor ?? "start",
      }),
    );
  }
  return parts.join("");
}

/**
 * Arrowhead definitions, one pair per colour.
 *
 * Takes an ordered array, never a Set: iteration order of a hash-keyed
 * collection is not stable across processes, and unstable output defeats
 * `--check`.
 */
export function markers(colors: readonly string[]): string {
  return colors
    .map((color) => {
      const key = color.replace("#", "");
      return (
        `<marker id="head-${key}" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" ` +
        `orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${color}"/></marker>` +
        `<marker id="tail-${key}" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" ` +
        `orient="auto-start-reverse"><path d="M0,0 L9,4.5 L0,9 Z" fill="${color}"/></marker>`
      );
    })
    .join("");
}

// ------------------------------------------------------------- fit checking

export function estimateWidth(body: string, size: number, kind: Advance = "regular"): number {
  return body.length * size * ADVANCE[kind];
}

/**
 * Fail the build when a line cannot fit its card. This is the only guard
 * against the most common defect in a generated diagram: SVG neither wraps nor
 * clips, so an over-long label lies across a border and nothing complains.
 */
export function assertCardsFit(cards: readonly Card[]): void {
  const problems: string[] = [];
  for (const spec of cards) {
    const titleBudget = spec.w - 2 * CARD_PAD - (spec.badge ? BADGE_COLUMN : 0);
    const titleWidth = estimateWidth(spec.title, spec.titleSize ?? 16, "bold");
    if (titleWidth > titleBudget) {
      problems.push(
        `title "${spec.title}" needs ~${Math.ceil(titleWidth)}px, has ${titleBudget}px`,
      );
    }
    const lineBudget = spec.w - 2 * CARD_PAD;
    for (const line of spec.lines ?? []) {
      const lineWidth = estimateWidth(line, spec.lineSize ?? 13);
      if (lineWidth > lineBudget) {
        problems.push(
          `line "${line}" in "${spec.title}" needs ~${Math.ceil(lineWidth)}px, has ${lineBudget}px`,
        );
      }
    }
    const lines = spec.lines?.length ?? 0;
    const contentHeight = 29 + 21 + Math.max(0, lines - 1) * (spec.lineStep ?? 18) + 10;
    if (lines > 0 && contentHeight > spec.h) {
      problems.push(`"${spec.title}" needs ${contentHeight}px of height, has ${spec.h}px`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Diagram content does not fit:\n  - ${problems.join("\n  - ")}`);
  }
}

// ------------------------------------------------------------ the document

export interface Document {
  width: number;
  height: number;
  /** Names the diagram for assistive technology and for the browser tab. */
  title: string;
  /** Describes the bands and what crosses between them, without the picture. */
  desc: string;
  background?: string;
  markerColors: readonly string[];
  body: readonly string[];
  /** Filename of this generator, stamped into the SVG banner. */
  generator: string;
}

export function svgDocument(doc: Document): string {
  const background = doc.background ?? "#FBFCFE";
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<!-- Generated by ${doc.generator}; edit the generator, not this SVG. -->\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" ` +
    `viewBox="0 0 ${doc.width} ${doc.height}" role="img" aria-labelledby="title desc">\n` +
    `  <title id="title">${escapeXml(doc.title)}</title>\n` +
    `  <desc id="desc">${escapeXml(doc.desc)}</desc>\n` +
    `  <defs>\n    ${markers(doc.markerColors)}\n` +
    `    <style>text { font-family: ${SANS}; }</style>\n` +
    "  </defs>\n" +
    // An explicit background: without it the diagram inherits the viewer's
    // page colour and the dark-theme reader gets dark text on dark.
    `  <rect width="${doc.width}" height="${doc.height}" fill="${background}"/>\n  ` +
    doc.body.join("\n  ") +
    "\n</svg>\n"
  );
}

// --------------------------------------------------------- worked example

const INK = "#16324F";
const MUTED = "#5A7085";

const CALLERS: Palette = { accent: "#7C3AED", fill: "#F7F4FF", stroke: "#C9BCF7" };
const SERVICE: Palette = { accent: "#2563EB", fill: "#F0F6FF", stroke: "#A9C6F5" };
const BACKING: Palette = { accent: "#0F766E", fill: "#F2FDFA", stroke: "#8FD8C6" };

const EDGE_CONTROL = "#2563EB";
const EDGE_DATA = "#0F766E";

const W = 1280;
const H = 724;
const BAND_X = 32;
const BAND_W = W - 2 * BAND_X;
const INNER_X = BAND_X + 24;
const INNER_W = BAND_W - 48;
const BAND_RIGHT = BAND_X + BAND_W;

/** Evenly spaced column origins — the shared grid that keeps edges straight. */
function columns(count: number, gap: number): { xs: number[]; w: number } {
  const w = Math.floor((INNER_W - (count - 1) * gap) / count);
  return { xs: Array.from({ length: count }, (_, i) => INNER_X + i * (w + gap)), w };
}

function exampleDiagram(): { body: string[]; cards: Card[] } {
  const callers = columns(2, 48);
  const service = columns(4, 24);
  const backing = columns(3, 32);

  const cards: Card[] = [
    {
      x: callers.xs[0], y: 158, w: callers.w, h: 84,
      title: "Browser app",
      lines: ["signed-in users; session cookie", "never reaches the database directly"],
      accent: CALLERS.accent, stroke: CALLERS.stroke,
    },
    {
      x: callers.xs[1], y: 158, w: callers.w, h: 84,
      title: "Scheduled jobs",
      lines: ["cron-triggered; service token", "same routes as any other caller"],
      accent: CALLERS.accent, stroke: CALLERS.stroke,
    },
    {
      x: service.xs[0], y: 348, w: service.w, h: 104,
      title: "HTTP router", badge: "1",
      lines: ["validates and authenticates", "maps errors to status codes"],
      accent: SERVICE.accent, stroke: SERVICE.accent, emphasis: true,
    },
    {
      x: service.xs[1], y: 348, w: service.w, h: 104,
      title: "Domain services", badge: "2",
      lines: ["the only place policy lives", "no HTTP or SQL types cross in"],
      accent: SERVICE.accent, stroke: SERVICE.stroke,
    },
    {
      x: service.xs[2], y: 348, w: service.w, h: 104,
      title: "Authorization", badge: "3",
      lines: ["one decision point per action", "denies by default"],
      accent: SERVICE.accent, stroke: SERVICE.stroke,
    },
    {
      x: service.xs[3], y: 348, w: service.w, h: 104,
      title: "Outbox worker", badge: "4",
      lines: ["publishes only after commit", "at-least-once, idempotent keys"],
      accent: SERVICE.accent, stroke: SERVICE.stroke,
    },
    {
      x: backing.xs[0], y: 578, w: backing.w, h: 84,
      title: "Postgres",
      lines: ["system of record; versioned migrations"],
      accent: BACKING.accent, stroke: BACKING.stroke,
    },
    {
      x: backing.xs[1], y: 578, w: backing.w, h: 84,
      title: "Object store",
      lines: ["user uploads; signed URLs, never proxied"],
      accent: BACKING.accent, stroke: BACKING.stroke,
    },
    {
      x: backing.xs[2], y: 578, w: backing.w, h: 84,
      title: "Queue",
      lines: ["outbound events; consumers retry"],
      accent: BACKING.accent, stroke: BACKING.stroke,
    },
  ];

  const serviceTab = "2 · Service — owns request handling and policy";
  const backingTab = "3 · Backing services";

  const body = [
    text(BAND_X, 44, "Example service — architecture", { size: 28, weight: 800 }),
    text(BAND_X, 70, "Who accepts a request, who decides whether it is allowed, and what holds the state.", {
      size: 14, fill: MUTED,
    }),

    // Legend. Mandatory once more than one edge kind is present.
    `<line x1="960" y1="60" x2="992" y2="60" stroke="${EDGE_CONTROL}" stroke-width="3" stroke-linecap="round"/>`,
    text(1002, 65, "request path", { size: 13, fill: MUTED }),
    `<line x1="1112" y1="60" x2="1144" y2="60" stroke="${EDGE_DATA}" stroke-width="3" ` +
      'stroke-linecap="round" stroke-dasharray="7 6"/>',
    text(1154, 65, "persistence", { size: 13, fill: MUTED }),

    band(BAND_X, 96, BAND_W, 160, CALLERS),
    tab(BAND_X + 16, 110, "1 · Callers", CALLERS),

    band(BAND_X, 286, BAND_W, 190, SERVICE),
    // Right-aligned tab: the inbound edge lands on the leftmost column, so the
    // tab is moved out of that column's x-range rather than crossed by it.
    tab(BAND_RIGHT - 16 - tabWidth(serviceTab), 300, serviceTab, SERVICE),

    band(BAND_X, 516, BAND_W, 160, BACKING),
    tab(BAND_X + 16, 530, backingTab, BACKING),

    ...cards.map(card),

    // Orthogonal routing through the gutter between bands, never a diagonal.
    edge({
      points: [[336, 242], [336, 266], [193, 266], [193, 348]],
      color: EDGE_CONTROL,
      labels: [{ x: 348, y: 262, body: "HTTPS · session cookie or service token" }],
    }),
    edge({
      points: [[491, 452], [491, 494], [260, 494], [260, 578]],
      color: EDGE_DATA, dash: "7 6",
      labels: [{ x: 503, y: 490, body: "SQL, inside one transaction" }],
    }),
    edge({
      points: [[1087, 452], [1087, 494], [1040, 494], [1040, 578]],
      color: EDGE_DATA, dash: "7 6",
    }),

    text(BAND_X, H - 16, "Generated by render-architecture-svg.ts — edit the generator, not the SVG.", {
      size: 12, fill: "#94A3B8",
    }),
  ];

  return { body, cards };
}

export function render(): string {
  const { body, cards } = exampleDiagram();
  assertCardsFit(cards);
  return svgDocument({
    width: W,
    height: H,
    title: "Example service — architecture",
    desc:
      "Three bands. Callers (browser app, scheduled jobs) reach the service over HTTPS. " +
      "The service band owns the HTTP router, domain services, authorization, and an outbox " +
      "worker. The backing band holds Postgres, an object store, and a queue, reached only " +
      "from the service band.",
    markerColors: [EDGE_CONTROL, EDGE_DATA],
    body,
    generator: "render-architecture-svg.ts",
  });
}

// ---------------------------------------------------------------------- cli

function main(argv: readonly string[]): number {
  const outputFlag = argv.indexOf("--output");
  const here = path.dirname(fileURLToPath(import.meta.url));
  const output =
    outputFlag === -1 ? path.join(here, "architecture.svg") : path.resolve(argv[outputFlag + 1]);
  const expected = render();

  if (argv.includes("--check")) {
    if (!existsSync(output)) {
      console.error(`Missing generated SVG: ${output}`);
      return 1;
    }
    if (readFileSync(output, "utf8") !== expected) {
      console.error(`Generated SVG is out of date: ${output}`);
      return 1;
    }
    console.log(`Generated SVG is up to date: ${output}`);
    return 0;
  }

  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, expected, "utf8");
  console.log(`Wrote ${output}`);
  return 0;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
