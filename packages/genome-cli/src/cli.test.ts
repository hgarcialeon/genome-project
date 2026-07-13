/**
 * CLI boundary tests: every assertion here exercises the `genome` command as
 * a subprocess — exit codes, stdout/stderr, and JSON contracts — not the
 * compiler or schema internals (those have their own suites). The exit-code
 * conventions asserted here are the ones the governance documents declare:
 * validate/compile failures exit 1, and `diff` follows diff(1)
 * (0 identical / 1 different / 2 trouble, ADR-0006).
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("./index.ts", import.meta.url));
const TSX = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));
const VALID_EXAMPLE = fileURLToPath(new URL("../../../SPEC/examples/company.yaml", import.meta.url));

const fixture = (name: string): string => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

type CliResult = { status: number; stdout: string; stderr: string };

function genome(...args: string[]): CliResult {
  try {
    const stdout = execFileSync(TSX, [CLI, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const failure = error as { status?: number | null; stdout?: unknown; stderr?: unknown };
    return {
      status: failure.status ?? -1,
      stdout: String(failure.stdout ?? ""),
      stderr: String(failure.stderr ?? ""),
    };
  }
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
