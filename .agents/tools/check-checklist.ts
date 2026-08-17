#!/usr/bin/env node
/**
 * check-checklist.ts - validate a product's instantiated lifecycle plan and
 * per-step checklists.
 *
 * This is the deterministic backstop for the agentic `lifecycle-instantiate`
 * step. It does not judge the product; it proves the *tracker* is well-formed:
 * the plan links a real checklist for every applicable step, every item carries
 * a degree, an invariant, evidence, an applicability finding, and a single
 * well-shaped `Status`, and every `MET`/`N/A` carries its proof or citation.
 * `--complete` additionally fails on in-scope `PENDING` items, which is how a
 * cycle gate asserts "nothing left open". Use `--cycle dev-cycle` to require
 * only the development-cycle steps while still structurally validating the
 * whole instantiated plan.
 *
 * Its capability rules guard against claims nothing verified. An `N/A` that
 * blames a missing external capability must cite a `capability:<id>` that
 * actually gates the item and is recorded as absent; a capability-gated `MET`
 * requires an `available` verdict in a complete, valid record. Thus "there is
 * no staging environment" is a recorded probe result rather than an assertion
 * made at the gate. Applicability is the same idea one level up:
 * an item whose `Applies when` is conditional must record the finding that
 * decided it, so `PENDING` carries the positive reason it applies instead of
 * surviving to the completion gate unexamined.
 *
 * It is self-contained (node builtins only) so it can be copied whole into a
 * product's `.agents/tools/` and run there directly with `node` (Node 24's
 * built-in type stripping needs no build step) or `bun`, with no dependency on
 * the guide package and no `tsx`/esbuild in the loop.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PLAN_REL = path.join("docs", "lifecycle", "plan.md");
const CHECKLIST_DIR_REL = path.join("docs", "lifecycle", "checklist");
const CAPABILITIES_REL = path.join(".agents", "capabilities.json");

/** An `Applies when` clause that needs no applicability finding to justify it. */
const UNCONDITIONAL = /^(always|the step runs)\b/i;

/** How an item's Status or Applicability line names the probe it rests on. */
const CAPABILITY_CITATION = /\bcapability:([a-z0-9][a-z0-9-]*)\b/gi;

/** Trusted capability-to-baseline mapping; the generated record must agree. */
const CAPABILITY_UNBLOCKS: Record<string, string[]> = {
  "git-hosting": ["pr.description", "pr.ci-green", "pr.independent-approval"],
  "deploy-target": [
    "deploy.health-check",
    "deploy.smoke-critical-flows",
    "deploy.error-observation",
    "deploy.rollback-confirmed",
    "deploy.secrets-present",
    "deploy.long-lived-dependencies",
  ],
  "environment-set": ["deploy.staging-first"],
  "budget-meter": ["scaffold.baseline.budget.metered"],
  "telemetry-sink": ["ops.telemetry-flowing"],
  "analytics-sink": ["ops.analytics-events"],
};

const CAPABILITY_VERDICTS = new Set(["available", "unavailable", "not-applicable", "unprobed"]);

type Problem = { file: string; message: string };

type ItemStatus = "PENDING" | "MET" | "N/A";
type Cycle = "full-lifecycle" | "dev-cycle";

const CYCLE_COMPLETION_STEPS: Record<Cycle, Set<number> | "all"> = {
  "full-lifecycle": "all",
  "dev-cycle": new Set([0, 2, 4, 5, 6, 7, 8, 9, 11]),
};

type Report = {
  root: string;
  present: boolean;
  ok: boolean;
  cycle: Cycle;
  problems: Problem[];
  counts: { steps: number; items: number; met: number; pending: number; na: number };
};

function expandHome(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(homedir(), input.slice(2));
  }
  return input;
}

/** Markdown table rows as raw cell arrays, header separators dropped. */
function tableRows(markdown: string): string[][] {
  const rows: string[][] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (/^\|[\s|:-]+\|?$/.test(trimmed)) continue; // separator row
    const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    rows.push(cells);
  }
  return rows;
}

/** First relative markdown link target in a cell, or undefined. */
function linkTarget(cell: string): string | undefined {
  const match = /\]\(([^)\s]+)\)/.exec(cell);
  if (!match) return undefined;
  const target = match[1].split("#")[0];
  return target && !/^[a-z][a-z0-9+.-]*:/i.test(target) ? target : undefined;
}

function isEmptyCell(cell: string): boolean {
  return cell === "" || cell === "—" || cell === "-" || cell === "n/a" || cell.toLowerCase() === "none";
}

function parseStepNumber(step: string): number | undefined {
  const match = /^\s*(\d+)/.exec(step);
  if (!match) return undefined;
  return Number.parseInt(match[1], 10);
}

function cycleIncludesStep(cycle: Cycle, step: string): boolean {
  const scope = CYCLE_COMPLETION_STEPS[cycle];
  if (scope === "all") return true;
  const stepNumber = parseStepNumber(step);
  return stepNumber !== undefined && scope.has(stepNumber);
}

/**
 * Read the plan table. Returns, for each data row, its step label, whether it
 * applies, its reason, and the checklist link if any. Column positions are
 * resolved from the header so small layout changes do not break parsing.
 */
function parsePlan(markdown: string): {
  rows: { step: string; applies: boolean; reason: string; checklist?: string }[];
  headerFound: boolean;
} {
  const rows = tableRows(markdown);
  if (rows.length === 0) return { rows: [], headerFound: false };

  const header = rows[0].map((c) => c.toLowerCase());
  const col = (needle: string) => header.findIndex((h) => h.includes(needle));
  const appliesCol = col("applies");
  const reasonCol = col("reason");
  const checklistCol = col("checklist");
  if (appliesCol === -1) return { rows: [], headerFound: false };

  const out: { step: string; applies: boolean; reason: string; checklist?: string }[] = [];
  for (const cells of rows.slice(1)) {
    if (cells.length <= appliesCol) continue;
    const appliesRaw = cells[appliesCol].toUpperCase();
    if (!appliesRaw.includes("APPLIES") && !appliesRaw.includes("SKIP")) continue;
    out.push({
      step: cells[0],
      applies: appliesRaw.includes("APPLIES"),
      reason: reasonCol >= 0 && reasonCol < cells.length ? cells[reasonCol] : "",
      checklist: checklistCol >= 0 && checklistCol < cells.length ? linkTarget(cells[checklistCol]) : undefined,
    });
  }
  return { rows: out, headerFound: true };
}

type Item = {
  id: string;
  /**
   * The bare item id — the first token of the heading, before the short name.
   * Instantiation expands a collection item into `<id>.<entity>` children, so
   * capability lookups match on this prefix rather than the whole heading.
   */
  key: string;
  degree?: "must" | "should";
  fields: Map<string, string>;
  status?: { kind: ItemStatus; detail: string };
};

/** Split a checklist file into `## ` items and read their bullet fields. */
function parseChecklist(markdown: string): Item[] {
  const items: Item[] = [];
  const blocks = markdown.split(/\r?\n(?=## )/);
  for (const block of blocks) {
    const headingMatch = /^##\s+(.+)$/m.exec(block);
    if (!headingMatch) continue;
    const heading = headingMatch[1].trim();
    const degreeMatch = /\[(must|should)\]/i.exec(heading);
    const id = heading.replace(/\s*\[(must|should)\]\s*$/i, "").trim();

    const fields = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const field = /^[-*]\s+([A-Za-z][\w /]*?):\s*(.*)$/.exec(line.trim());
      if (field) fields.set(field[1].trim().toLowerCase(), field[2].trim());
    }

    let status: Item["status"];
    const statusRaw = fields.get("status");
    if (statusRaw) {
      const detail = statusRaw.replace(/^[A-Za-z/]+\s*[—:-]?\s*/, "").trim();
      const head = statusRaw.toUpperCase();
      if (head.startsWith("PENDING")) status = { kind: "PENDING", detail: "" };
      else if (head.startsWith("MET")) status = { kind: "MET", detail };
      else if (head.startsWith("N/A") || head.startsWith("NA")) status = { kind: "N/A", detail };
    }

    items.push({
      id,
      key: id.split(/\s+/)[0] ?? id,
      degree: degreeMatch ? (degreeMatch[1].toLowerCase() as "must" | "should") : undefined,
      fields,
      status,
    });
  }
  return items;
}

type CapabilityProbe = { id: string; verdict: string; unblocks: string[] };

type CapabilityRecord = {
  present: boolean;
  valid: boolean;
  byId: Map<string, CapabilityProbe>;
  errors: string[];
};

/**
 * Read and validate `.agents/capabilities.json` — the step-00 preflight record.
 * The trusted mapping above is duplicated deliberately in this self-contained
 * checker: otherwise a missing or edited `unblocks` list could remove the very
 * gate the record is meant to enforce.
 */
function readCapabilities(root: string): CapabilityRecord {
  const byId = new Map<string, CapabilityProbe>();
  const errors: string[] = [];
  const file = path.join(root, CAPABILITIES_REL);
  if (!existsSync(file)) return { present: false, valid: false, byId, errors };

  let parsed: { schema_version?: unknown; probes?: unknown } | undefined;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    errors.push("record is not valid JSON");
    return { present: true, valid: false, byId, errors };
  }
  if (parsed?.schema_version !== 1) errors.push("schema_version must be 1");
  if (!Array.isArray(parsed?.probes)) {
    errors.push("probes must be an array");
    return { present: true, valid: false, byId, errors };
  }

  for (const raw of parsed.probes) {
    if (!raw || typeof raw !== "object") {
      errors.push("every probe must be an object");
      continue;
    }
    const probe = raw as Partial<CapabilityProbe>;
    if (typeof probe.id !== "string" || probe.id === "") {
      errors.push("every probe must have a non-empty id");
      continue;
    }
    if (byId.has(probe.id)) {
      errors.push(`duplicate probe id: ${probe.id}`);
      continue;
    }
    const normalized: CapabilityProbe = {
      id: probe.id,
      verdict: typeof probe.verdict === "string" ? probe.verdict : "",
      unblocks: Array.isArray(probe.unblocks)
        ? probe.unblocks.filter((item): item is string => typeof item === "string")
        : [],
    };
    if (!CAPABILITY_VERDICTS.has(normalized.verdict)) {
      errors.push(`probe ${normalized.id} has invalid verdict "${normalized.verdict}"`);
    }
    byId.set(normalized.id, normalized);
  }

  for (const [id, expectedUnblocks] of Object.entries(CAPABILITY_UNBLOCKS)) {
    const probe = byId.get(id);
    if (!probe) {
      errors.push(`required probe missing: ${id}`);
      continue;
    }
    const actual = [...probe.unblocks].sort();
    const expected = [...expectedUnblocks].sort();
    if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) {
      errors.push(`probe ${id} has an unexpected unblocks list`);
    }
  }

  return { present: true, valid: errors.length === 0, byId, errors };
}

/**
 * Capability ids that gate this item. An instantiated collection item
 * (`<id>.<entity>`) inherits the gate of the baseline id it was expanded from.
 */
function gatingCapabilityIds(key: string): string[] {
  const found: string[] = [];
  for (const [id, gatedItems] of Object.entries(CAPABILITY_UNBLOCKS)) {
    if (gatedItems.some((gated) => key === gated || key.startsWith(`${gated}.`))) {
      found.push(id);
    }
  }
  return found;
}

function citedCapabilities(text: string): string[] {
  const ids: string[] = [];
  for (const match of text.matchAll(CAPABILITY_CITATION)) ids.push(match[1].toLowerCase());
  return ids;
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => path.join(dir, entry))
    .sort();
}

/**
 * An item whose `Applies when` is conditional must record the finding that
 * decided it. Without this, an item whose condition the PRD never satisfied is
 * instantiated `PENDING` and survives, unexamined, to the completion gate —
 * where the same conclusion costs a whole invocation to reach. The check is
 * structural: the field is present with content, or it is not. What the finding
 * says is the instantiating agent's judgment, not this checker's.
 */
function checkApplicability(item: Item, rel: string, problems: Problem[]): void {
  const appliesWhen = item.fields.get("applies when");
  if (!appliesWhen) {
    problems.push({
      file: rel,
      message: `item "${item.id}": missing "Applies when" (carry the baseline's clause into the instantiated item, specialized to this PRD)`,
    });
    return;
  }
  if (UNCONDITIONAL.test(appliesWhen)) return;
  if (!item.fields.get("applicability")) {
    problems.push({
      file: rel,
      message: `item "${item.id}": conditional "Applies when" with no "Applicability" finding — quote the clause, state the PRD/profile/capability evidence for or against, then set the status`,
    });
  }
}

/**
 * Guard the two capability claims an agent cannot be allowed to simply assert.
 * An `N/A` blamed on a missing capability must cite a probe the step-00 record
 * shows as `unavailable`, and nothing may be `MET` on top of a capability whose
 * probe never reached a verdict.
 */
function checkCapabilityClaims(
  item: Item,
  rel: string,
  capabilities: CapabilityRecord,
  problems: Problem[],
): void {
  const status = item.status;
  if (!status) return;

  if (status.kind === "N/A") {
    const cited = citedCapabilities(status.detail);
    const gates = new Set(gatingCapabilityIds(item.key));
    for (const id of cited) {
      if (!capabilities.present) {
        problems.push({
          file: rel,
          message: `item "${item.id}": N/A cites capability:${id} but ${CAPABILITIES_REL} does not exist — run the capability preflight and cite its recorded verdict`,
        });
        continue;
      }
      const probe = capabilities.byId.get(id);
      if (!probe) {
        problems.push({
          file: rel,
          message: `item "${item.id}": N/A cites capability:${id}, which ${CAPABILITIES_REL} does not record`,
        });
      } else if (!gates.has(id)) {
        problems.push({
          file: rel,
          message: `item "${item.id}": N/A cites capability:${id}, but that capability does not gate this item`,
        });
      } else if (probe.verdict !== "unavailable" && probe.verdict !== "not-applicable") {
        problems.push({
          file: rel,
          message: `item "${item.id}": N/A cites capability:${id}, but its recorded verdict is "${probe.verdict}" — only "unavailable" or "not-applicable" licenses an N/A`,
        });
      }
    }
    return;
  }

  if (status.kind === "MET") {
    for (const id of gatingCapabilityIds(item.key)) {
      const probe = capabilities.byId.get(id);
      if (!probe) {
        problems.push({
          file: rel,
          message: `item "${item.id}": MET without a recorded capability:${id} verdict`,
        });
      } else if (probe.verdict !== "available") {
        problems.push({
          file: rel,
          message: `item "${item.id}": MET while capability:${probe.id} is "${probe.verdict}" in ${CAPABILITIES_REL} — rerun the probe and require "available" before claiming an item it gates`,
        });
      }
    }
  }
}

export function check(root: string, options: { complete: boolean; cycle: Cycle }): Report {
  const problems: Problem[] = [];
  const counts = { steps: 0, items: 0, met: 0, pending: 0, na: 0 };

  const planPath = path.join(root, PLAN_REL);
  const checklistDir = path.join(root, CHECKLIST_DIR_REL);
  const checklistFiles = markdownFiles(checklistDir);
  const capabilities = readCapabilities(root);

  // Nothing instantiated yet is a valid pre-instantiation state, not a failure.
  if (!existsSync(planPath) && checklistFiles.length === 0) {
    return { root, present: false, ok: true, cycle: options.cycle, problems, counts };
  }

  if (!capabilities.present) {
    problems.push({ file: CAPABILITIES_REL, message: "capability record is missing — run the capability preflight before validating an instantiated lifecycle" });
  } else if (!capabilities.valid) {
    for (const error of capabilities.errors) {
      problems.push({ file: CAPABILITIES_REL, message: error });
    }
  }

  if (!existsSync(planPath)) {
    problems.push({ file: PLAN_REL, message: "checklist files exist but there is no plan.md to link them" });
    return { root, present: true, ok: false, cycle: options.cycle, problems, counts };
  }

  const { rows, headerFound } = parsePlan(readFileSync(planPath, "utf8"));
  if (!headerFound) {
    problems.push({ file: PLAN_REL, message: "no plan table with an 'Applies' column was found" });
  }

  const linkedFiles = new Set<string>();
  const completionFiles = new Set<string>();
  for (const row of rows) {
    counts.steps += 1;
    if (row.applies) {
      if (row.checklist) {
        const resolved = path.resolve(path.dirname(planPath), row.checklist);
        if (!existsSync(resolved)) {
          problems.push({ file: PLAN_REL, message: `step ${row.step}: linked checklist not found: ${row.checklist}` });
        } else {
          linkedFiles.add(resolved);
          if (cycleIncludesStep(options.cycle, row.step)) {
            completionFiles.add(resolved);
          }
        }
      }
      // A step with no checklist link is allowed (artifact-only gate).
    } else if (isEmptyCell(row.reason)) {
      problems.push({ file: PLAN_REL, message: `step ${row.step}: SKIPPED without a reason` });
    }
  }

  for (const file of checklistFiles) {
    const rel = path.relative(root, file);
    if (!linkedFiles.has(path.resolve(file))) {
      problems.push({ file: rel, message: "checklist file is not linked from any applicable step in plan.md" });
    }

    const items = parseChecklist(readFileSync(file, "utf8"));
    if (items.length === 0) {
      problems.push({ file: rel, message: "no checklist items (`## ` headings) found" });
    }
    for (const item of items) {
      counts.items += 1;
      if (!item.degree) {
        problems.push({ file: rel, message: `item "${item.id}": missing degree tag [must] or [should]` });
      }
      if (!item.fields.get("invariant")) {
        problems.push({ file: rel, message: `item "${item.id}": missing Invariant` });
      }
      if (!item.fields.get("evidence required") && !item.fields.get("evidence")) {
        problems.push({ file: rel, message: `item "${item.id}": missing Evidence` });
      }
      checkApplicability(item, rel, problems);
      checkCapabilityClaims(item, rel, capabilities, problems);
      if (!item.status) {
        problems.push({ file: rel, message: `item "${item.id}": missing or unrecognized Status (want PENDING | MET | N/A)` });
        continue;
      }
      if (item.status.kind === "MET") {
        counts.met += 1;
        if (!item.status.detail) {
          problems.push({ file: rel, message: `item "${item.id}": MET without evidence` });
        }
      } else if (item.status.kind === "N/A") {
        counts.na += 1;
        if (!item.status.detail) {
          problems.push({ file: rel, message: `item "${item.id}": N/A without a PRD citation` });
        }
      } else {
        counts.pending += 1;
        if (options.complete && completionFiles.has(path.resolve(file))) {
          problems.push({
            file: rel,
            message: `item "${item.id}": still PENDING (${options.cycle} completion requires this item resolved)`,
          });
        }
      }
    }
  }

  return { root, present: true, ok: problems.length === 0, cycle: options.cycle, problems, counts };
}

function usage(): void {
  console.log(`Usage: check-checklist [root] [--complete] [--cycle <name>] [--json]

Validates docs/lifecycle/plan.md and docs/lifecycle/checklist/*.md. Passes when
no plan has been instantiated yet. With --complete, also fails on in-scope
PENDING items.

Every item carries an "Applies when" clause; a conditional one also carries an
"Applicability" finding recording what decided it. An N/A that blames a missing
external capability cites it as "capability:<id>" and must match an
"unavailable" (or "not-applicable") probe that actually gates the item. A
capability-gated MET requires an "available" verdict in a complete, valid
.agents/capabilities.json record.

Cycles:
  full-lifecycle  Require every applicable checklist item to be resolved.
  dev-cycle       Require only applicable steps 0, 2, 4-9, and 11 to be
                  resolved; structurally validate the complete plan.`);
}

export function run(argv: string[] = process.argv.slice(2)): number {
  let root = ".";
  let asJson = false;
  let complete = false;
  let cycle: Cycle = "full-lifecycle";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      return 0;
    }
    if (arg === "--json") asJson = true;
    else if (arg === "--complete") complete = true;
    else if (arg === "--cycle") {
      const value = argv[index + 1];
      if (value !== "full-lifecycle" && value !== "dev-cycle") {
        console.error(`Invalid --cycle value: ${value ?? "(missing)"}`);
        usage();
        return 2;
      }
      cycle = value;
      index += 1;
    }
    else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      usage();
      return 2;
    } else root = arg;
  }

  const resolvedRoot = path.resolve(expandHome(root));
  const report = check(resolvedRoot, { complete, cycle });

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  }

  if (!report.present) {
    console.log(`No lifecycle plan instantiated yet in ${resolvedRoot} (nothing to check).`);
    return 0;
  }

  const { steps, items, met, pending, na } = report.counts;
  if (report.ok) {
    console.log(`Checklist check passed for ${resolvedRoot}`);
  } else {
    console.log(`Checklist check failed for ${resolvedRoot}`);
    for (const problem of report.problems) console.log(`  ${problem.file}: ${problem.message}`);
  }
  if (complete) console.log(`completion cycle: ${cycle}`);
  console.log(`steps: ${steps}  items: ${items}  (met ${met}, pending ${pending}, n/a ${na})`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run();
}
