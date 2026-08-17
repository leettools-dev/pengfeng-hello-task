#!/usr/bin/env node
/**
 * capability-preflight.ts - probe, read-only, every external capability a later
 * lifecycle step depends on, and record the verdicts in
 * `.agents/capabilities.json`.
 *
 * The problem it exists for: a `must` item at step 09, 11, or 13 blocks on a
 * capability the environment never had — a GitHub remote, a staging
 * environment, a usage meter, a telemetry sink, an analytics sink. Discovered
 * at the step that consumes it, that is the most expensive possible moment:
 * the invocation that finds "there is no staging environment" cannot create
 * one. Every one of those facts is knowable before the first line of product
 * code is written, so step 00 probes them once and writes the result down;
 * `lifecycle-instantiate` resolves later-step items against that record and
 * `check-checklist` refuses to accept a capability claim the record does not
 * support.
 *
 * Every probe is strictly read-only: it may inspect the environment, run a
 * `--version`/`status`/`preflight` command, and read repository files. It
 * creates, mutates, and deletes nothing. Probe commands come from the
 * repository's own declarations (`.agents/environments.json`,
 * `.agents/budgets.json`), never from this file's assumptions.
 *
 * Credential values are never read into the record — only the *names* of the
 * variables that are present, so the file is safe to commit.
 *
 * It is self-contained (node builtins only) so it can be copied whole into a
 * product's `.agents/tools/` and run there directly with `node` (Node 24's
 * built-in type stripping needs no build step) or `bun`, with no dependency on
 * the guide package and no `tsx`/esbuild in the loop.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CAPABILITIES_REL = path.join(".agents", "capabilities.json");
const ENVIRONMENTS_REL = path.join(".agents", "environments.json");
const BUDGETS_REL = path.join(".agents", "budgets.json");
const COMPOSE_REL = path.join("deploy", "local", "docker-compose.yml");

/**
 * `available` — the capability was reached and proved usable.
 * `unavailable` — it was reached for and is genuinely not there. This is the
 *   only verdict that licenses an `N/A` on an item the capability unblocks.
 * `not-applicable` — the repository declares it out of scope (no remote
 *   environment at all, so nothing to deploy to).
 * `unprobed` — the probe could not decide: a declaration is still undecided, a
 *   required input is missing, the command timed out. Never treat this as
 *   "absent"; it means the question is still open.
 */
type Verdict = "available" | "unavailable" | "not-applicable" | "unprobed";

type Probe = {
  id: string;
  title: string;
  verdict: Verdict;
  evidence: string;
  unblocks: string[];
};

type CapabilityRecord = {
  schema_version: 1;
  generated_at: string;
  product_root: string;
  probes: Probe[];
};

/** Baseline checklist items each capability class gates. */
const UNBLOCKS: Record<string, string[]> = {
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

const COMMAND_TIMEOUT_MS = 30_000;
const EVIDENCE_MAX_CHARS = 600;

function expandHome(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(homedir(), input.slice(2));
  }
  return input;
}

/** Collapse and cap captured output so one chatty command cannot swamp the record. */
function condense(text: string): string {
  const trimmed = text.replace(/\s+$/, "").replace(/\r\n/g, "\n").trim();
  if (trimmed.length <= EVIDENCE_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, EVIDENCE_MAX_CHARS)}… (truncated)`;
}

export type CommandResult = {
  ran: boolean;
  code: number | null;
  output: string;
  /** The command did not produce a conclusive result (for example, it timed out). */
  indeterminate: boolean;
};

/**
 * Run a read-only command and capture what it said. A command that is not
 * installed is a result, not an exception: "not installed" is exactly the
 * verdict a preflight exists to record.
 */
export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = COMMAND_TIMEOUT_MS,
): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: timeoutMs,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) {
    const errorCode = (result.error as NodeJS.ErrnoException).code;
    const message = errorCode === "ENOENT"
      ? `${command}: not installed / not on PATH`
      : `${command}: ${result.error.message}`;
    return {
      ran: false,
      code: null,
      output: message,
      // A missing binary is a settled absence. Timeouts and other execution
      // failures are indeterminate and must never license an N/A.
      indeterminate: errorCode !== "ENOENT",
    };
  }
  const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return { ran: true, code: result.status, output: condense(combined), indeterminate: false };
}

function redactValues(text: string, values: string[]): string {
  return [...new Set(values.filter((value) => value !== ""))]
    .sort((left, right) => right.length - left.length)
    .reduce((redacted, value) => redacted.split(value).join("***"), text);
}

/** Keep variable names as evidence without ever rendering their values. */
function redactVariableReferences(input: string): string {
  return input.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, "<env:$1>");
}

/** `$ cmd args -> exit N: output`, with credential-bearing substitutions redacted. */
export function transcript(
  command: string,
  args: string[],
  result: CommandResult,
  displayInvocation = [command, ...args].join(" "),
  sensitiveValues: string[] = [],
): string {
  const invocation = redactValues(displayInvocation, sensitiveValues);
  const output = redactValues(result.output, sensitiveValues);
  if (!result.ran) return `$ ${invocation} -> ${output}`;
  return `$ ${invocation} -> exit ${result.code}: ${output || "(no output)"}`;
}

/** Names — never values — of the environment variables that are set and non-empty. */
function presentEnv(names: string[]): string[] {
  return names.filter((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim() !== "";
  });
}

function readJson(file: string): unknown {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

/** Substitute `${VAR}` for execution while retaining values solely for redaction. */
export function expandVars(input: string): { text: string; missing: string[]; values: string[] } {
  const missing: string[] = [];
  const values: string[] = [];
  const text = input.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => {
    const value = process.env[name];
    if (typeof value !== "string" || value.trim() === "") {
      missing.push(name);
      return "";
    }
    values.push(value);
    return value;
  });
  return { text, missing, values };
}

/** Split a declared command line on whitespace. Declarations stay simple on purpose. */
function splitCommand(line: string): string[] {
  return line.split(/\s+/).filter((part) => part !== "");
}

type EnvironmentDeclaration = {
  name?: string;
  declared?: boolean | null;
  deploy_target?: string | null;
  domain?: string | null;
  preflight?: string | null;
  required_env?: string[];
};

function environments(root: string): EnvironmentDeclaration[] | undefined {
  const parsed = readJson(path.join(root, ENVIRONMENTS_REL)) as
    | { environments?: EnvironmentDeclaration[] }
    | undefined;
  if (!parsed || !Array.isArray(parsed.environments)) return undefined;
  return parsed.environments;
}

function probe(id: string, title: string, verdict: Verdict, evidence: string): Probe {
  return { id, title, verdict, evidence, unblocks: UNBLOCKS[id] ?? [] };
}

/** Remove credentials from an HTTP(S) remote before it enters committed evidence. */
function sanitizeRemoteUrl(input: string): string {
  try {
    const parsed = new URL(input);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return input;
  }
}

/** Resolve the host and owner/repository path that `gh repo view` accepts. */
function hostedRepository(input: string): { host: string; slug: string } | undefined {
  let host: string;
  let pathname: string;
  try {
    const parsed = new URL(input);
    host = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    const scp = /^(?:[^@/]+@)?([^:/]+):(.+)$/.exec(input);
    if (!scp) return undefined;
    host = scp[1];
    pathname = scp[2];
  }
  const slug = pathname.replace(/^\/+/, "").replace(/\.git$/i, "").replace(/\/+$/, "");
  if (!host || slug.split("/").filter(Boolean).length < 2) return undefined;
  return { host: host.toLowerCase(), slug };
}

/**
 * Can this repository open and read a pull request on a hosting provider? A
 * `file://` origin is a real answer, not a failure: the step-09 items resolve
 * against it rather than an agent inventing a PR that cannot exist.
 */
function probeGitHosting(root: string): Probe {
  const id = "git-hosting";
  const title = "Git hosting (pull requests, CI status, review records)";

  const remote = runCommand("git", ["-C", root, "remote", "get-url", "origin"], root);
  if (remote.indeterminate) {
    return probe(id, title, "unprobed", `${transcript("git", ["remote", "get-url", "origin"], remote)} — the origin lookup was indeterminate`);
  }
  if (!remote.ran || remote.code !== 0) {
    return probe(id, title, "unavailable", `${transcript("git", ["remote", "get-url", "origin"], remote)} — no origin remote, so there is no host to open a pull request on`);
  }

  const rawUrl = remote.output.split("\n")[0]?.trim() ?? "";
  const url = sanitizeRemoteUrl(rawUrl);
  if (url.startsWith("file://") || url.startsWith("/") || url.startsWith(".")) {
    return probe(id, title, "unavailable", `origin is a local path (${url}) — no hosting provider, so pull request, CI-status, and approval records do not exist for this venture`);
  }

  const repository = hostedRepository(rawUrl);
  if (!repository) {
    return probe(id, title, "unavailable", `origin ${url} does not identify a hosted owner/repository that the gh CLI can read`);
  }

  const tokens = presentEnv(["GH_TOKEN", "GITHUB_TOKEN"]);
  const repositoryArg = `${repository.host}/${repository.slug}`;
  const args = ["repo", "view", repositoryArg, "--json", "nameWithOwner"];
  const status = runCommand("gh", args, root);
  if (status.ran && status.code === 0) {
    return probe(id, title, "available", `origin ${url}\n${transcript("gh", args, status)}`);
  }
  if (status.indeterminate) {
    return probe(id, title, "unprobed", `origin ${url}\n${transcript("gh", args, status)}\ntoken variables present (names only): ${tokens.join(", ") || "none"}`);
  }
  return probe(id, title, "unavailable", `origin ${url}\n${transcript("gh", args, status)}\ntoken variables present (names only): ${tokens.join(", ") || "none"}`);
}

/**
 * Is the environment set an actual decision, and does it include staging? An
 * undecided declaration is `unprobed`, not `unavailable` — nobody has chosen
 * yet, and "nobody chose" must never read as "there is none".
 */
function probeEnvironmentSet(root: string): Probe {
  const id = "environment-set";
  const title = "Declared environment set (which environments this venture has)";

  const declared = environments(root);
  if (!declared) {
    return probe(id, title, "unprobed", `${ENVIRONMENTS_REL} is missing or unreadable — the venture's environment set has not been declared`);
  }

  const undecided = declared.filter((entry) => entry.declared === null || entry.declared === undefined);
  if (undecided.length > 0) {
    const names = undecided.map((entry) => entry.name ?? "(unnamed)").join(", ");
    return probe(id, title, "unprobed", `${ENVIRONMENTS_REL} still has undecided environments: ${names}. Decide each ("declared": true/false) with its deploy target and domain before later steps consume this record.`);
  }

  const staging = declared.find((entry) => entry.name === "staging" && entry.declared === true);
  const names = declared.filter((entry) => entry.declared === true).map((entry) => entry.name ?? "(unnamed)");
  if (!staging) {
    return probe(id, title, "unavailable", `${ENVIRONMENTS_REL} declares ${names.join(", ") || "no"} environment(s) and no staging environment — this venture is production-only by decision, so the staging rehearsal is replaced by the production-shaped local rehearsal`);
  }
  if (!staging.deploy_target) {
    return probe(id, title, "unprobed", `${ENVIRONMENTS_REL} declares staging but names no deploy_target for it`);
  }
  return probe(id, title, "available", `${ENVIRONMENTS_REL} declares ${names.join(", ")}; staging deploy_target=${staging.deploy_target}, domain=${staging.domain ?? "(none)"}`);
}

/**
 * Run each declared remote environment's own preflight command. The command is
 * the repository's declaration, so this probe stays provider-agnostic and the
 * captured transcript is the same evidence step 11 requires.
 */
function probeDeployTarget(root: string): Probe {
  const id = "deploy-target";
  const title = "Deploy target (remote environments the product is published to)";

  const declared = environments(root);
  if (!declared) {
    return probe(id, title, "unprobed", `${ENVIRONMENTS_REL} is missing or unreadable — no deploy target is declared to probe`);
  }

  const remote = declared.filter((entry) => entry.declared === true && entry.name !== "local");
  if (remote.length === 0) {
    const undecided = declared.some((entry) => entry.declared === null || entry.declared === undefined);
    if (undecided) {
      return probe(id, title, "unprobed", `${ENVIRONMENTS_REL} has undecided environments; decide the environment set before probing deploy targets`);
    }
    return probe(id, title, "not-applicable", `${ENVIRONMENTS_REL} declares no remote environment — this venture publishes nothing beyond the local stack`);
  }

  const lines: string[] = [];
  let worst: Verdict = "available";
  const downgrade = (verdict: Verdict) => {
    const order: Verdict[] = ["available", "unprobed", "unavailable"];
    if (order.indexOf(verdict) > order.indexOf(worst)) worst = verdict;
  };

  for (const entry of remote) {
    const name = entry.name ?? "(unnamed)";
    const missingCredentials = (entry.required_env ?? []).filter((variable) => presentEnv([variable]).length === 0);
    const presentCredentials = presentEnv(entry.required_env ?? []);
    lines.push(`[${name}] deploy_target=${entry.deploy_target ?? "(none)"} domain=${entry.domain ?? "(none)"}`);
    if (!entry.deploy_target) {
      lines.push(`[${name}] no deploy_target declared — the environment exists by decision, but its destination is still unknown`);
      downgrade("unprobed");
    }
    if (presentCredentials.length > 0) lines.push(`[${name}] credentials present (names only): ${presentCredentials.join(", ")}`);
    if (missingCredentials.length > 0) {
      lines.push(`[${name}] credentials MISSING: ${missingCredentials.join(", ")}`);
      downgrade("unavailable");
    }

    if (!entry.preflight) {
      lines.push(`[${name}] no preflight command declared — presence of a credential is not proof of the account, target, or permission`);
      downgrade("unprobed");
      continue;
    }

    const { text, missing, values } = expandVars(entry.preflight);
    if (missing.length > 0) {
      lines.push(`[${name}] preflight not run: unset variable(s) in the declared command: ${missing.join(", ")}`);
      downgrade("unprobed");
      continue;
    }
    const [command, ...args] = splitCommand(text);
    const result = runCommand(command, args, root);
    const requiredValues = (entry.required_env ?? [])
      .map((variable) => process.env[variable])
      .filter((value): value is string => typeof value === "string" && value !== "");
    lines.push(
      `[${name}] ${transcript(
        command,
        args,
        result,
        redactVariableReferences(entry.preflight),
        [...values, ...requiredValues],
      )}`,
    );
    if (result.indeterminate) downgrade("unprobed");
    else if (!result.ran || result.code !== 0) downgrade("unavailable");
  }

  return probe(id, title, worst, lines.join("\n"));
}

/**
 * A declared ceiling is not a budget; a meter that reports against it is. The
 * supervisor's meter usually lives outside this container, so the repository
 * must declare how to read it — an undeclared meter is `unavailable`, which is
 * what licenses the metering item to resolve `N/A` at instantiation instead of
 * sitting `PENDING` until the completion gate.
 */
function probeBudgetMeter(root: string): Probe {
  const id = "budget-meter";
  const title = "Usage meter enforcing the declared spend ceilings";

  const budgets = readJson(path.join(root, BUDGETS_REL)) as { meter?: { command?: string } | null } | undefined;
  const declaredCommand = budgets?.meter?.command;
  const envCommand = process.env.LEET_USAGE_METER_CMD;
  const command = (typeof declaredCommand === "string" && declaredCommand.trim() !== "" ? declaredCommand : envCommand) ?? "";

  if (command.trim() === "") {
    return probe(id, title, "unavailable", `no meter declared: ${BUDGETS_REL} has no "meter".command and LEET_USAGE_METER_CMD is unset. The supervisor's meter, if any, is not readable from inside this workspace, so no invocation here can produce a meter reading.`);
  }

  const { text, missing, values } = expandVars(command);
  if (missing.length > 0) {
    return probe(id, title, "unprobed", `declared meter command has unset variable(s): ${missing.join(", ")}`);
  }
  const [binary, ...args] = splitCommand(text);
  const result = runCommand(binary, args, root);
  const displayInvocation = declaredCommand
    ? redactVariableReferences(declaredCommand)
    : "<command from LEET_USAGE_METER_CMD>";
  const evidence = transcript(binary, args, result, displayInvocation, values);
  if (result.ran && result.code === 0) {
    return probe(id, title, "available", evidence);
  }
  return probe(id, title, result.indeterminate ? "unprobed" : "unavailable", evidence);
}

/**
 * Is there anywhere for structured logs and traces to go? Instrumentation with
 * no reachable destination is the gap step 13 keeps finding after the product
 * is already deployed.
 */
function probeTelemetrySink(root: string): Probe {
  const id = "telemetry-sink";
  const title = "Telemetry sink (queryable destination for logs, metrics, traces)";

  const otlp = presentEnv(["OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"]);
  if (otlp.length > 0) {
    return probe(id, title, "available", `OTLP endpoint configured; variables present (names only): ${otlp.join(", ")}`);
  }

  const gcp = presentEnv(["GOOGLE_APPLICATION_CREDENTIALS_JSON", "GOOGLE_CLOUD_PROJECT"]);
  if (gcp.length === 2) {
    return probe(id, title, "available", `no OTLP endpoint, but the deploy target's own sink is reachable: GCP Cloud Logging via ${gcp.join(", ")} (names only). Structured stdout from the deployed container is queryable there with no additional credential.`);
  }

  const compose = path.join(root, COMPOSE_REL);
  if (existsSync(compose)) {
    const text = readFileSync(compose, "utf8");
    const match = /^\s{2}([\w.-]*(?:signoz|otel|collector|jaeger|grafana|loki)[\w.-]*):/im.exec(text);
    if (match) {
      return probe(id, title, "available", `${COMPOSE_REL} runs a self-hosted telemetry service: ${match[1]}`);
    }
  }

  return probe(id, title, "unavailable", `no OTEL_EXPORTER_OTLP_ENDPOINT, no GCP credentials for a provider-native sink, and no telemetry service in ${COMPOSE_REL}. Logs would be visible only on the host that runs the container.`);
}

/** Is there a product-analytics destination configured for adoption events? */
function probeAnalyticsSink(): Probe {
  const id = "analytics-sink";
  const title = "Product-analytics sink (adoption/activation events)";

  const keys = presentEnv([
    "ANALYTICS_WRITE_KEY",
    "POSTHOG_API_KEY",
    "POSTHOG_PROJECT_API_KEY",
    "SEGMENT_WRITE_KEY",
    "AMPLITUDE_API_KEY",
  ]);
  if (keys.length > 0) {
    return probe(id, title, "available", `analytics credentials present (names only): ${keys.join(", ")}`);
  }
  return probe(id, title, "unavailable", "no analytics write key in the environment (checked ANALYTICS_WRITE_KEY, POSTHOG_API_KEY, POSTHOG_PROJECT_API_KEY, SEGMENT_WRITE_KEY, AMPLITUDE_API_KEY) — nothing to send adoption events to");
}

export function probeAll(root: string): CapabilityRecord {
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    product_root: root,
    probes: [
      probeGitHosting(root),
      probeEnvironmentSet(root),
      probeDeployTarget(root),
      probeBudgetMeter(root),
      probeTelemetrySink(root),
      probeAnalyticsSink(),
    ],
  };
}

function usage(): void {
  console.log(`Usage: capability-preflight [root] [--json] [--no-write]

Probes, read-only, every external capability a later lifecycle step depends on
and writes the verdicts to ${CAPABILITIES_REL}.

Verdicts:
  available       reached and proved usable
  unavailable     reached for and genuinely absent — the only verdict that
                  licenses an N/A on an item this capability unblocks
  not-applicable  the repository declares it out of scope
  unprobed        undecided or indeterminate; the question is still open, and
                  an item it unblocks may not be marked MET

Options:
  --json          print the full record to stdout
  --no-write      probe and report without writing ${CAPABILITIES_REL}

Nothing here creates, mutates, or deletes a resource, and no credential value
is read into the record — only the names of the variables that are present.`);
}

export function run(argv: string[] = process.argv.slice(2)): number {
  let root = ".";
  let asJson = false;
  let write = true;

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") {
      usage();
      return 0;
    }
    if (arg === "--json") asJson = true;
    else if (arg === "--no-write") write = false;
    else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      usage();
      return 2;
    } else root = arg;
  }

  const resolvedRoot = path.resolve(expandHome(root));
  const record = probeAll(resolvedRoot);

  if (write) {
    const destination = path.join(resolvedRoot, CAPABILITIES_REL);
    if (!existsSync(path.dirname(destination))) {
      console.error(`Cannot write ${CAPABILITIES_REL}: ${path.dirname(destination)} does not exist. Run this inside a scaffolded product repository.`);
      return 2;
    }
    writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  }

  if (asJson) {
    console.log(JSON.stringify(record, null, 2));
  } else {
    console.log(`Capability preflight for ${resolvedRoot}`);
    for (const entry of record.probes) {
      console.log(`\n${entry.verdict.toUpperCase().padEnd(15)} ${entry.id} — ${entry.title}`);
      for (const line of entry.evidence.split("\n")) console.log(`  ${line}`);
      if (entry.unblocks.length > 0) console.log(`  unblocks: ${entry.unblocks.join(", ")}`);
    }
    const unprobed = record.probes.filter((entry) => entry.verdict === "unprobed").map((entry) => entry.id);
    console.log("");
    if (unprobed.length > 0) {
      console.log(`Still undecided (resolve before later steps depend on them): ${unprobed.join(", ")}`);
    }
    if (write) console.log(`Wrote ${CAPABILITIES_REL}`);
  }

  // A recorded "unavailable" is a successful probe, not a failure: the point is
  // to write the answer down early, not to block step 00 on it.
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run();
}
