/**
 * CLI boundary tests: every assertion here exercises the `genome` command as
 * a subprocess — exit codes, stdout/stderr, and JSON contracts — not the
 * compiler or schema internals (those have their own suites). The exit-code
 * conventions asserted here are the ones the governance documents declare:
 * validate/compile failures exit 1, and `diff` follows diff(1)
 * (0 identical / 1 different / 2 trouble, ADR-0006).
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { replay, type RuntimeEvent } from "@genome/runtime";
import { describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("./index.ts", import.meta.url));
const TSX = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const VALID_EXAMPLE = fileURLToPath(new URL("../../../SPEC/examples/company.yaml", import.meta.url));

const fixture = (name: string): string => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

type CliResult = { status: number; stdout: string; stderr: string };

function genome(...args: string[]): CliResult {
  const result = spawnSync(TSX, [CLI, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("genome validate", () => {
  it("exits 0 for the canonical SPEC example", () => {
    const result = genome("validate", VALID_EXAMPLE);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("is a valid Genome document");
  });

  it("exits 0 for a minimal valid document", () => {
    const result = genome("validate", fixture("base.yaml"));
    expect(result.status).toBe(0);
  });

  it("exits 1 with readable errors for a schema-invalid document", () => {
    const result = genome("validate", fixture("invalid-schema.yaml"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not a valid Genome document");
    expect(result.stderr).toContain("name");
  });

  it("exits 1 for malformed YAML", () => {
    const result = genome("validate", fixture("malformed.yaml"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid YAML");
  });

  it("exits 1 for an unreadable path", () => {
    const result = genome("validate", fixture("does-not-exist.yaml"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Cannot read Genome document");
  });
});

describe("genome inspect", () => {
  it("summarizes the organization and exits 0", () => {
    const result = genome("inspect", fixture("base.yaml"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Fixture Co");
  });

  it("emits the InspectReport contract with --json", () => {
    const result = genome("inspect", fixture("base.yaml"), "--json");
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.company.name).toBe("Fixture Co");
    expect(report.counts.Agent).toBe(1);
    expect(report.workflows).toHaveLength(1);
  });

  it("exits 1 when compilation fails", () => {
    const result = genome("inspect", fixture("invalid-schema.yaml"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("failed to compile");
  });
});

describe("genome graph", () => {
  it("emits the Organization Graph as JSON", () => {
    const result = genome("graph", fixture("base.yaml"));
    expect(result.status).toBe(0);
    const graph = JSON.parse(result.stdout);
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
    expect(graph.nodes.length).toBeGreaterThan(0);
  });
});

describe("genome diff", () => {
  it("exits 0 for identical documents", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("base.yaml"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("identical");
  });

  it("exits 0 for a formatting-only change (shared canonicalization)", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("base-reformatted.yaml"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("identical");
  });

  it("exits 1 and reports structural changes", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("base-changed.yaml"));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("reviewer");
    expect(result.stdout).toContain("role");
  });

  it("emits the DiffReport contract with --json", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("base-changed.yaml"), "--json");
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.identical).toBe(false);
    expect(report.revisions.before).toMatch(/^[0-9a-f]{64}$/);
    expect(report.revisions.after).toMatch(/^[0-9a-f]{64}$/);
    expect(report.nodes.added.length).toBeGreaterThan(0);
    expect(report.nodes.changed.length).toBeGreaterThan(0);
  });

  it("reports identical: true with --json for equal revisions", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("base-reformatted.yaml"), "--json");
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.identical).toBe(true);
    expect(report.revisions.before).toBe(report.revisions.after);
  });

  it("exits 2 (trouble) when an input fails to compile", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("invalid-schema.yaml"));
    expect(result.status).toBe(2);
  });

  it("exits 2 (trouble) when an input is unreadable", () => {
    const result = genome("diff", fixture("base.yaml"), fixture("does-not-exist.yaml"));
    expect(result.status).toBe(2);
  });
});

/**
 * RFC-0006 / ADR-0008: the reference execution contract at the CLI boundary.
 * Exit codes: 0 completed / 1 failed / 2 trouble (all invocation errors) /
 * 3 blocked pending approval. The Condition 5 phase-close evidence is the
 * first test, verbatim.
 */
describe("genome run", () => {
  const CLOCK = "2026-07-13T00:00:00.000Z";
  const exportDir = mkdtempSync(join(tmpdir(), "genome-run-"));

  /** Events from `--json` stdout: every line but the final-state line. */
  const events = (stdout: string): RuntimeEvent[] =>
    stdout
      .trim()
      .split("\n")
      .slice(0, -1)
      .map((line) => JSON.parse(line) as RuntimeEvent);

  const finalLine = (stdout: string): { finalState: Record<string, unknown>; exitCode: number } =>
    JSON.parse(stdout.trim().split("\n").at(-1)!);

  it("drives the designated example workflow to completion (Board Condition 5)", () => {
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "build-feature",
      "--grant",
      "human:engineering-manager",
    );
    expect(result.status).toBe(0);
    // The Board-verified 16-event sequence: approval, start, six steps, completion.
    expect(result.stdout).toContain("#1 approval.requested");
    expect(result.stdout).toContain("#16 workflow.completed");
    expect(result.stdout).toContain("Run run-1: completed");
    expect(result.stdout).toContain("completed steps: 6");
  });

  it("exits 2 when --workflow is missing (parser default overridden)", () => {
    const result = genome("run", VALID_EXAMPLE);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--workflow");
  });

  it("exits 2 for an unknown option (parser default overridden)", () => {
    const result = genome("run", VALID_EXAMPLE, "--workflow", "build-feature", "--no-such-option");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("unknown option");
  });

  it("exits 2 with the reason for an unknown workflow", () => {
    const result = genome("run", VALID_EXAMPLE, "--workflow", "no-such-workflow");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("unknown-workflow");
  });

  it("exits 2 with the refusal reason verbatim for a reserved principal", () => {
    const result = genome("run", VALID_EXAMPLE, "--workflow", "build-feature", "--as", "human:*");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("reserved-principal");
  });

  it("parks deny-safe at exit 3 when a required approval has no grant", () => {
    const result = genome("run", VALID_EXAMPLE, "--workflow", "build-feature");
    expect(result.status).toBe(3);
    expect(result.stdout).toContain("approval.requested");
    expect(result.stdout).toContain("pending approvals: human:engineering-manager");
  });

  it("runs the gated workflow with a matching grant, attributed in the log", () => {
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "build-feature",
      "--grant",
      "human:engineering-manager",
      "--json",
    );
    expect(result.status).toBe(0);
    // The grant is an operator assertion: the log attributes the response to
    // the named principal (RFC-0006 test case 4, as corrected by the
    // normative erratum approved in the Phase 3 close review —
    // docs/reviews/phase-3-close-board-review.md; zero behavioral change).
    const granted = events(result.stdout).find((event) => event.type === "approval.granted");
    expect(granted?.source).toBe("human:engineering-manager");
    expect(granted?.payload.principal).toBe("human:engineering-manager");
    expect(finalLine(result.stdout)).toEqual({
      finalState: { runId: "run-1", status: "completed", completedSteps: 6, pendingApprovals: [] },
      exitCode: 0,
    });
  });

  it("satisfies the supervised intrinsic floor with a concrete human grant", () => {
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "incident-response",
      "--as",
      "engineering.platform.backend",
      "--grant",
      "human:ops-lead",
      "--json",
    );
    expect(result.status).toBe(0);
    const log = events(result.stdout);
    const requested = log.find((event) => event.type === "approval.requested");
    expect(requested?.payload.principals).toEqual(["human:*"]);
    const granted = log.find((event) => event.type === "approval.granted");
    expect(granted?.source).toBe("human:ops-lead");
  });

  it("warns on stderr for an unmatched grant without changing the exit code", () => {
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "build-feature",
      "--grant",
      "human:engineering-manager",
      "--grant",
      "human:bystander",
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("grant human:bystander matched no requested approval");
  });

  it("exits 1 on --fail-step with agent.task.failed then workflow.failed", () => {
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "build-feature",
      "--grant",
      "human:engineering-manager",
      "--fail-step",
      "implement",
      "--json",
    );
    expect(result.status).toBe(1);
    const types = events(result.stdout).map((event) => event.type);
    expect(types.indexOf("agent.task.failed")).toBeGreaterThan(-1);
    expect(types.indexOf("workflow.failed")).toBe(types.indexOf("agent.task.failed") + 1);
    const failed = events(result.stdout).find((event) => event.type === "agent.task.failed");
    expect(failed?.payload.detail).toBe("simulated failure");
    expect(finalLine(result.stdout).exitCode).toBe(1);
  });

  it("exports NDJSON whose replay equals the reported final state", () => {
    const exportPath = join(exportDir, "replay-equality.ndjson");
    const result = genome(
      "run",
      VALID_EXAMPLE,
      "--workflow",
      "build-feature",
      "--grant",
      "human:engineering-manager",
      "--json",
      "--export-log",
      exportPath,
    );
    expect(result.status).toBe(0);

    // Pinned framing: one envelope per line, LF separators, trailing newline.
    const raw = readFileSync(exportPath, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    const parsed = raw
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as RuntimeEvent);
    expect(parsed).toHaveLength(16);

    // The required equality is state-level (RFC-0006): replay of the parsed
    // log reproduces the reported final state exactly.
    const reported = finalLine(result.stdout).finalState;
    const run = replay(parsed).runs[reported.runId as string];
    expect(run.status).toBe(reported.status);
    expect(run.completedSteps).toBe(reported.completedSteps);
    expect(run.pendingApprovals).toEqual(reported.pendingApprovals);
  });

  it("produces byte-identical stdout and export across runs under --clock", () => {
    const invoke = (exportPath: string) =>
      genome(
        "run",
        VALID_EXAMPLE,
        "--workflow",
        "build-feature",
        "--grant",
        "human:engineering-manager",
        "--json",
        "--clock",
        CLOCK,
        "--export-log",
        exportPath,
      );
    const first = invoke(join(exportDir, "determinism-1.ndjson"));
    const second = invoke(join(exportDir, "determinism-2.ndjson"));
    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    // stdout and the export are asserted separately; stderr is excluded.
    expect(second.stdout).toBe(first.stdout);
    expect(readFileSync(join(exportDir, "determinism-2.ndjson"), "utf8")).toBe(
      readFileSync(join(exportDir, "determinism-1.ndjson"), "utf8"),
    );
  });

  it("produces identical event sequences without --clock (timestamps excluded)", () => {
    const invoke = () =>
      genome("run", VALID_EXAMPLE, "--workflow", "build-feature", "--grant", "human:engineering-manager", "--json");
    const strip = (stdout: string) => events(stdout).map(({ timestamp, ...rest }) => rest);
    expect(strip(invoke().stdout)).toEqual(strip(invoke().stdout));
  });
});

/**
 * RFC-0007 / ADR-0009: participation binding at the CLI boundary. The Gap 1
 * fixture is the reconstructed self-hosting mis-model — an agent-scoped policy
 * naming a supervised agent that owns the workflow — which ran ungated (exit 0)
 * before this change and now parks deny-safe (exit 3). Cases 3 (initiator half,
 * runtime suite) and 7 (inert diagnostic, compiler suite) live where the
 * behavior is reachable; the remaining acceptance cases are here.
 */
describe("participation binding (RFC-0007 / ADR-0009)", () => {
  const CLOCK = "2026-07-14T00:00:00.000Z";
  const exportDir = mkdtempSync(join(tmpdir(), "genome-participation-"));

  const requestedCount = (stdout: string): number =>
    stdout.split("\n").filter((line) => line.includes("approval.requested")).length;

  it("case 1 — operator-initiated Gap 1 fixture, no grant, parks deny-safe at exit 3", () => {
    const result = genome("run", fixture("participation-gap1.yaml"), "--workflow", "implement-queue-item");
    expect(result.status).toBe(3);
    expect(result.stdout).toContain("approval.requested");
    expect(result.stdout).toContain("pending approvals: human:product-owner");
    // Deny-safe: no step executed.
    expect(result.stdout).not.toContain("workflow.completed");
  });

  it("case 2 — the same fixture completes with the matching grant, attributed in the log", () => {
    const result = genome(
      "run",
      fixture("participation-gap1.yaml"),
      "--workflow",
      "implement-queue-item",
      "--grant",
      "human:product-owner",
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("approval.granted human:product-owner");
    expect(result.stdout).toContain("Run run-1: completed");
  });

  it("case 4 — a policy on the agent and its owned workflow gates exactly once (no double-gating)", () => {
    const parked = genome("run", fixture("participation-double.yaml"), "--workflow", "implement-queue-item");
    expect(parked.status).toBe(3);
    expect(requestedCount(parked.stdout)).toBe(1);
    expect(parked.stdout).toContain("pending approvals: human:product-owner");

    const granted = genome(
      "run",
      fixture("participation-double.yaml"),
      "--workflow",
      "implement-queue-item",
      "--grant",
      "human:product-owner",
    );
    expect(granted.status).toBe(0);
    expect(granted.stdout).toContain("Run run-1: completed");
  });

  it("case 5 — the corrected workaround (workflow-scoped) parks identically", () => {
    const result = genome("run", fixture("participation-workaround.yaml"), "--workflow", "implement-queue-item");
    expect(result.status).toBe(3);
    expect(requestedCount(result.stdout)).toBe(1);
    expect(result.stdout).toContain("pending approvals: human:product-owner");
  });

  it("case 6 — genome graph shows derived workflow→policy edges in deterministic, pinned order", () => {
    const result = genome("graph", fixture("participation-order.yaml"));
    expect(result.status).toBe(0);
    const graph = JSON.parse(result.stdout) as { edges: Array<{ from: string; to: string; type: string }> };
    const derived = graph.edges
      .filter((edge) => edge.type === "requires" && edge.to === "policy:oversight" && edge.from.startsWith("workflow:"))
      .map((edge) => edge.from);
    expect(derived).toEqual(["workflow:alpha", "workflow:beta", "workflow:gamma"]);
    // The retained initiator edge is present alongside the derived ones.
    expect(graph.edges).toContainEqual({ from: "agent:engineering.lead", to: "policy:oversight", type: "requires" });
  });

  it("case 9 — a gated run is byte-identical across invocations under --clock", () => {
    const invoke = (exportPath: string) =>
      genome(
        "run",
        fixture("participation-gap1.yaml"),
        "--workflow",
        "implement-queue-item",
        "--grant",
        "human:product-owner",
        "--json",
        "--clock",
        CLOCK,
        "--export-log",
        exportPath,
      );
    const first = invoke(join(exportDir, "participation-1.ndjson"));
    const second = invoke(join(exportDir, "participation-2.ndjson"));
    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    expect(second.stdout).toBe(first.stdout);
    expect(readFileSync(join(exportDir, "participation-2.ndjson"), "utf8")).toBe(
      readFileSync(join(exportDir, "participation-1.ndjson"), "utf8"),
    );
  });
});
