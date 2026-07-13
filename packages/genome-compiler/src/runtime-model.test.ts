import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { compile, deriveGenomeRevision, runtimeModelTarget, type CompileSuccess } from "./index.js";

const readExample = (): string =>
  readFileSync(fileURLToPath(new URL("../../../SPEC/examples/company.yaml", import.meta.url)), "utf8");

const compileExample = (): CompileSuccess => {
  const result = compile(readExample());
  expect(result.ok).toBe(true);
  return result as CompileSuccess;
};

describe("genome revision derivation (RFC-0004)", () => {
  it("is a lowercase hex sha-256 carried on the graph", () => {
    const { graph } = compileExample();

    expect(graph.genomeRevision).toMatch(/^[0-9a-f]{64}$/);
    expect(deriveGenomeRevision(JSON.parse(JSON.stringify({ a: 1 })))).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable across YAML key order and formatting", () => {
    const a = compile("genomeVersion: 0.1\ncompany:\n  name: Acme\n  timezone: UTC\n") as CompileSuccess;
    const b = compile("genomeVersion: 0.1\ncompany:\n  timezone: UTC\n  name: 'Acme'\n") as CompileSuccess;

    expect(a.ok && b.ok).toBe(true);
    expect(a.graph.genomeRevision).toBe(b.graph.genomeRevision);
  });

  it("changes on any semantic difference, including array order", () => {
    const base = compile("genomeVersion: 0.1\ncompany:\n  name: Acme\n") as CompileSuccess;
    const renamed = compile("genomeVersion: 0.1\ncompany:\n  name: Acme Billing\n") as CompileSuccess;

    expect(base.graph.genomeRevision).not.toBe(renamed.graph.genomeRevision);
    expect(deriveGenomeRevision({ steps: ["a", "b"] })).not.toBe(deriveGenomeRevision({ steps: ["b", "a"] }));
  });
});

describe("runtime-model target (RFC-0004)", () => {
  it("derives the model only from the graph, carrying the revision and hierarchy", () => {
    const { graph } = compileExample();
    const model = runtimeModelTarget(graph);

    expect(model.genomeRevision).toBe(graph.genomeRevision);
    expect(model.company).toEqual({ name: "Acme Billing", timezone: "America/Mexico_City" });
    expect(model.departments.map((d) => d.id)).toEqual(["department:engineering", "department:operations"]);
    expect(model.teams).toEqual([
      { id: "team:engineering.platform", label: "platform", department: "department:engineering" },
    ]);
    expect(model.memoryStores).toContain("memory-store:decisions");
    expect(model.integrations).toEqual([{ id: "integration:github", type: "source-control", provider: "github" }]);
  });

  it("carries agents with membership, resolved autonomy, and governance", () => {
    const model = runtimeModelTarget(compileExample().graph);
    const backend = model.agents.find((agent) => agent.id === "agent:engineering.platform.backend");
    const coordinator = model.agents.find((agent) => agent.id === "agent:operations.coordinator");

    expect(backend).toMatchObject({
      reference: "engineering.platform.backend",
      autonomy: "supervised",
      memberOf: "team:engineering.platform",
      governedBy: [],
    });
    expect(coordinator?.memberOf).toBe("department:operations");
  });

  it("carries workflows with owner node ids, steps, and policy governance", () => {
    const model = runtimeModelTarget(compileExample().graph);
    const build = model.workflows.find((workflow) => workflow.workflowId === "build-feature");

    expect(build).toMatchObject({
      id: "workflow:build-feature",
      owner: "agent:engineering.platform.architect",
      trigger: "manual",
      governedBy: ["policy:production-deploy"],
    });
    expect(build?.steps).toHaveLength(6);

    const policy = model.policies.find((p) => p.policyId === "production-deploy");
    expect(policy).toMatchObject({
      appliesTo: ["workflow:build-feature"],
      requiresApprovalFrom: ["human:engineering-manager"],
    });
  });

  it("resolves deny-safe defaults: omitted autonomy and trigger become manual", () => {
    const result = compile(
      [
        "genomeVersion: 0.1",
        "company:",
        "  name: Minimal",
        "departments:",
        "  ops:",
        "    agents:",
        "      runner:",
        "        role: Runner",
        "workflows:",
        "  daily-report:",
        "    owner: ops.runner",
        "    steps:",
        "      - collect",
        "      - publish",
      ].join("\n"),
    ) as CompileSuccess;
    expect(result.ok).toBe(true);

    const model = runtimeModelTarget(result.graph);
    expect(model.agents[0].autonomy).toBe("manual");
    expect(model.workflows[0].trigger).toBe("manual");
    expect(model.workflows[0].owner).toBe("agent:ops.runner");
  });

  it("carries objective and metric owners as agent node ids", () => {
    const model = runtimeModelTarget(compileExample().graph);

    expect(model.objectives).toEqual([{ id: "objective:reliability", owner: "agent:engineering.platform.architect" }]);
    expect(model.metrics).toContainEqual({
      id: "metric:deployment-frequency",
      owner: "agent:engineering.platform.backend",
    });
  });

  it("is immutable, like the graph it derives from", () => {
    const model = runtimeModelTarget(compileExample().graph);

    expect(Object.isFrozen(model)).toBe(true);
    expect(() => {
      model.workflows[0].steps.push("extra");
    }).toThrow();
  });
});
