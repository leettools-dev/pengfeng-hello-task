#!/usr/bin/env node
/**
 * check-scaffold.ts - validate the product venture scaffold layout.
 *
 * This script is generated into new projects so agents and CI can check the
 * expected PRD, design, source, test, deployment, GTM, ops, and agent-tool paths
 * without depending on the original dev-guide repository. Node 24 (see
 * engines.node) runs a .ts file directly via built-in type stripping, so this
 * never needs tsx/esbuild in the loop; run it with node or bun, not tsx — a
 * long-lived container that hangs at tsx's esbuild-service startup has no
 * fallback to plain node otherwise.
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const REQUIRED_PATHS = [
  ".github/workflows/ci.yml",
  ".agents/prompts/README.md",
  ".agents/prompts/expand-prd.md",
  ".agents/prompts/instantiate-lifecycle.md",
  ".agents/prompts/work-dev-cycle.md",
  ".agents/prompts/work-lifecycle.md",
  ".agents/skill-instantiation.json",
  ".agents/skill-overlays/README.md",
  ".agents/skill-overlays/dev-cycle-writing-dev-specs.md",
  ".agents/skills/README.md",
  ".claude/skills",
  ".agents/toolchain.json",
  ".agents/toolchain-lock.json",
  ".agents/budgets.json",
  ".agents/environments.json",
  ".agents/tools/README.md",
  ".agents/tools/check-scaffold.ts",
  ".agents/tools/check-checklist.ts",
  ".agents/tools/capability-preflight.ts",
  "docs/research/README.md",
  "docs/roadmap.md",
  "docs/lifecycle/app-building.md",
  "docs/lifecycle/checklist-baseline/README.md",
  "design/architecture.md",
  "design/schemas/README.md",
  "design/tokens.json",
  "src/app/src/server.ts",
  "src/components/README.md",
  "tests/unit/health.test.ts",
  "tests/e2e/README.md",
  "deploy/local/docker-compose.yml",
  "deploy/staging/README.md",
  "deploy/production/README.md",
  "gtm/documentation/README.md",
  "gtm/marketing/release-notes.md",
  "gtm/sales/README.md",
  "ops/alerts/README.md",
  ".gitignore",
  ".nvmrc",
  ".env.example",
  "package.json",
  "tsconfig.json",
];

// Directories that must contain at least one Markdown file. The starter puts a
// hello-world example in each; the workflow expects agents to replace those with
// real PRDs and runbooks, so the check requires content, not a specific filename.
const REQUIRED_MD_DIRS = ["docs/prd", "ops/runbooks"];

function expandHome(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(homedir(), input.slice(2));
  }
  return input;
}

function dirHasMarkdown(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some((entry) => entry.endsWith(".md"));
}

function check(root: string): string[] {
  const missing = REQUIRED_PATHS.filter((requiredPath) => {
    return !existsSync(path.join(root, requiredPath));
  });
  for (const dir of REQUIRED_MD_DIRS) {
    if (!dirHasMarkdown(path.join(root, dir))) {
      missing.push(dir + "/*.md");
    }
  }
  return missing;
}

function usage(): void {
  console.log("Usage: check-scaffold.ts [root] [--json]");
}

function main(argv: string[]): number {
  let rootArg = ".";
  let asJson = false;

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") {
      usage();
      return 0;
    }
    if (arg === "--json") {
      asJson = true;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error("Unknown option: " + arg);
      usage();
      return 2;
    }
    rootArg = arg;
  }

  const root = path.resolve(expandHome(rootArg));
  const missing = check(root);

  if (asJson) {
    console.log(JSON.stringify({ root, ok: missing.length === 0, missing }, null, 2));
  } else if (missing.length > 0) {
    console.log("Scaffold check failed for " + root);
    for (const missingPath of missing) {
      console.log("missing: " + missingPath);
    }
  } else {
    console.log("Scaffold check passed for " + root);
  }

  return missing.length > 0 ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
