import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  compile,
  docsTarget,
  edgesOf,
  graphTarget,
  inspectTarget,
  type CompileFailure,
  type CompileSuccess,
} from "./index.js";

const read = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const compileFixture = (relativePath: string) => compile(read(relativePath));

const expectFailure = (relativePath: string): CompileFailure => {
  const result = compileFixture(relativePath);
  expect(result.ok).toBe(false);
  return result as CompileFailure;
};

const compileExample = (): CompileSuccess => {
  const result = compileFixture("../../../SPEC/examples/company.yaml");
  expect(result.ok).toBe(true);
  return result as CompileSuccess;
};

describe("compile pipeline", () => {
  it("compiles the canonical company example", () => {
    const { ast, graph, diagnostics } = compileExample();

    expect(diagnostics).toHaveLength(0);
    expect(ast.company.name).toBe("Acme Billing");
    expect(ast.departments.map((d) => d.id)).toEqual(["engineering", "operations"]);

    const types = Object.values(graph.nodes).map((node) => node.type);
    const count = (type: string) => types.filter((t) => t === type).length;
    expect(count("Company")).toBe(1);
    expect(count("Department")).toBe(2);
    expect(count("Team")).toBe(1);
    expect(count("Agent")).toBe(5);
    expect(count("Workflow")).toBe(2);
    expect(count("Policy")).toBe(1);
    expect(count("Integration")).toBe(1);
    expect(count("Objective")).toBe(1);
    expect(count("Metric")).toBe(2);
    expect(count("MemoryStore")).toBe(4);
  });

  it("reports parse failures with stage 'parse'", () => {
    const result = compile("company: [unclosed");

    expect(result.ok).toBe(false);
    expect((result as CompileFailure).stage).toBe("parse");
    expect((result as CompileFailure).diagnostics.length).toBeGreaterThan(0);
  });

  it("reports schema failures with stage 'schema'", () => {
    const result = compile("company:\n  mission: no name or version\n");

    expect(result.ok).toBe(false);
    const failure = result as CompileFailure;
    expect(failure.stage).toBe("schema");
    expect(failure.diagnostics.map((d) => d.message).join("\n")).toContain("genomeVersion");
  });
});

describe("semantic validation (RFC-0002 v0.1 rules)", () => {
  it("rule 1: rejects an unknown autonomy level", () => {
    const failure = expectFailure("./__fixtures__/invalid-autonomy.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toEqual([
      expect.objectContaining({
        rule: 1,
        path: "departments.engineering.agents.backend.autonomy",
        message: expect.stringContaining("unrestricted"),
      }),
    ]);
  });

  it("rule 2: rejects sibling agents whose ids collide after normalization", () => {
    const failure = expectFailure("./__fixtures__/duplicate-agent-id.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toEqual([
      expect.objectContaining({
        rule: 2,
        message: expect.stringContaining("duplicate identifier 'backend'"),
      }),
    ]);
  });

  it("rule 3: rejects a workflow owner that does not resolve to an agent", () => {
    const failure = expectFailure("./__fixtures__/dangling-workflow-owner.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toEqual([
      expect.objectContaining({
        rule: 3,
        path: "workflows.build-feature.owner",
        message: expect.stringContaining("engineering.platform.missing"),
      }),
    ]);
  });

  it("rule 4: rejects malformed human principals and dangling agent principals", () => {
    const failure = expectFailure("./__fixtures__/invalid-principal.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toHaveLength(2);
    expect(failure.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 4, message: expect.stringContaining("human:Engineering Manager!") }),
        expect.objectContaining({ rule: 4, message: expect.stringContaining("sales.nobody") }),
      ]),
    );
  });

  it("rule 5: rejects dangling owners on objectives and metrics", () => {
    const failure = expectFailure("./__fixtures__/dangling-objective-owner.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 5, path: "objectives.reliability.owner" }),
        expect.objectContaining({ rule: 5, path: "metrics.deployment-frequency.owner" }),
      ]),
    );
  });

  it("rule 6: rejects appliesTo entries that resolve to no workflow or agent", () => {
    const failure = expectFailure("./__fixtures__/dangling-applies-to.yaml");

    expect(failure.stage).toBe("semantic");
    expect(failure.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 6,
          path: "policies.production-deploy.appliesTo",
          message: expect.stringContaining("missing-workflow"),
        }),
        expect.objectContaining({
          rule: 6,
          path: "policies.production-deploy.appliesTo",
          message: expect.stringContaining("engineering.platform.nobody"),
        }),
      ]),
    );
  });

  it("rule 6: an unbound policy warns but still compiles", () => {
    const result = compileFixture("./__fixtures__/unbound-policy.yaml");

    expect(result.ok).toBe(true);
    const success = result as CompileSuccess;
    expect(success.diagnostics).toEqual([
      expect.objectContaining({
        rule: 6,
        severity: "warning",
        path: "policies.after-hours-change",
        message: expect.stringContaining("unbound policy"),
      }),
    ]);
  });
});

describe("participation binding (RFC-0007 / ADR-0009)", () => {
  const compileOk = (relativePath: string): CompileSuccess => {
    const result = compileFixture(relativePath);
    expect(result.ok).toBe(true);
    return result as CompileSuccess;
  };

  it("derives an executor edge from an owned workflow to an agent-scoped policy, keeping the initiator edge", () => {
    const { graph } = compileOk("./__fixtures__/participation-binding.yaml");
    const requires = edgesOf(graph).filter((edge) => edge.type === "requires" && edge.to === "policy:queue-discipline");

    // (a) initiator binding — retained; (b) executor binding — derived.
    expect(requires).toContainEqual({
      from: "agent:engineering.engineering-agent",
      to: "policy:queue-discipline",
      type: "requires",
    });
    expect(requires).toContainEqual({
      from: "workflow:implement-queue-item",
      to: "policy:queue-discipline",
      type: "requires",
    });
  });

  it("derives an edge for every owned workflow in deterministic document order (amendment 3)", () => {
    const { graph } = compileOk("./__fixtures__/participation-order.yaml");
    const derived = edgesOf(graph)
      .filter((edge) => edge.type === "requires" && edge.to === "policy:oversight" && edge.from.startsWith("workflow:"))
      .map((edge) => edge.from);

    expect(derived).toEqual(["workflow:alpha", "workflow:beta", "workflow:gamma"]);
  });

  it("deduplicates: a policy on an agent and its owned workflow yields one edge (no double-gating)", () => {
    const { graph } = compileOk("./__fixtures__/participation-double.yaml");
    const workflowEdges = edgesOf(graph).filter(
      (edge) =>
        edge.type === "requires" && edge.from === "workflow:implement-queue-item" && edge.to === "policy:queue-discipline",
    );

    expect(workflowEdges).toHaveLength(1);
  });

  it("warns, not errors, for a policy binding only manual workflow-less agents (inert)", () => {
    const result = compileFixture("./__fixtures__/inert-policy.yaml");

    expect(result.ok).toBe(true);
    expect((result as CompileSuccess).diagnostics).toEqual([
      expect.objectContaining({
        rule: 6,
        severity: "warning",
        path: "policies.never-binds",
        message: expect.stringContaining("can never gate a run"),
      }),
    ]);
  });
});

describe("organization graph", () => {
  it("links the hierarchy with belongs_to edges", () => {
    const { graph } = compileExample();
    const edges = edgesOf(graph);

    expect(edges).toContainEqual({ from: "department:engineering", to: "company", type: "belongs_to" });
    expect(edges).toContainEqual({ from: "team:engineering.platform", to: "department:engineering", type: "belongs_to" });
    expect(edges).toContainEqual({
      from: "agent:engineering.platform.backend",
      to: "team:engineering.platform",
      type: "belongs_to",
    });
    expect(edges).toContainEqual({
      from: "agent:operations.coordinator",
      to: "department:operations",
      type: "belongs_to",
    });
  });

  it("links workflow owners with owns edges", () => {
    const { graph } = compileExample();

    expect(edgesOf(graph)).toContainEqual({
      from: "agent:engineering.platform.architect",
      to: "workflow:build-feature",
      type: "owns",
    });
  });

  it("links objective and metric owners with owns edges", () => {
    const { graph } = compileExample();
    const edges = edgesOf(graph);

    expect(edges).toContainEqual({
      from: "agent:engineering.platform.architect",
      to: "objective:reliability",
      type: "owns",
    });
    expect(edges).toContainEqual({
      from: "agent:engineering.platform.backend",
      to: "metric:deployment-frequency",
      type: "owns",
    });
    expect(edges).toContainEqual({
      from: "agent:engineering.platform.qa",
      to: "metric:defect-escape-rate",
      type: "owns",
    });
    expect(graph.nodes["objective:reliability"].attributes.owner).toBe("engineering.platform.architect");
    expect(graph.nodes["metric:deployment-frequency"].attributes.owner).toBe("engineering.platform.backend");
  });

  it("links policy scope with requires edges (governed workflow → policy)", () => {
    const { graph } = compileExample();

    expect(edgesOf(graph)).toContainEqual({
      from: "workflow:build-feature",
      to: "policy:production-deploy",
      type: "requires",
    });
  });

  it("keeps human principals as policy attributes, not nodes", () => {
    const { graph } = compileExample();
    const policy = graph.nodes["policy:production-deploy"];

    expect(policy.attributes.humanPrincipals).toEqual(["human:engineering-manager"]);
    expect(Object.values(graph.nodes).every((node) => !node.id.startsWith("human"))).toBe(true);
  });

  it("is immutable", () => {
    const { graph } = compileExample();

    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.nodes["company"])).toBe(true);
    expect(() => {
      graph.adjacency["company"].push({ from: "company", to: "company", type: "depends_on" });
    }).toThrow();
  });
});

describe("compilation targets", () => {
  it("inspectTarget summarizes counts and hierarchy", () => {
    const { graph } = compileExample();
    const report = inspectTarget(graph);

    expect(report.company.name).toBe("Acme Billing");
    expect(report.counts.Agent).toBe(5);
    expect(report.departments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "engineering",
          teams: [expect.objectContaining({ id: "platform", agents: expect.arrayContaining(["backend", "qa"]) })],
        }),
        expect.objectContaining({ id: "operations", agents: ["coordinator"] }),
      ]),
    );
    expect(report.workflows).toContainEqual({
      id: "build-feature",
      owner: "engineering.platform.architect",
      trigger: "manual",
      steps: 6,
    });
  });

  it("graphTarget emits a JSON-serializable nodes+edges view", () => {
    const { graph } = compileExample();
    const output = graphTarget(graph);

    expect(output.nodes.length).toBe(Object.keys(graph.nodes).length);
    expect(output.edges.length).toBe(edgesOf(graph).length);
    expect(() => JSON.stringify(output)).not.toThrow();
  });

  it("docsTarget renders markdown documentation", () => {
    const { graph } = compileExample();
    const docs = docsTarget(graph);

    expect(docs).toContain("# Acme Billing");
    expect(docs).toContain("## Organization");
    expect(docs).toContain("- **engineering**");
    expect(docs).toContain("## Workflows");
    expect(docs).toContain("`engineering.platform.architect`");
    expect(docs).toContain("## Policies");
    expect(docs).toContain("applies to: `build-feature`");
    expect(docs).toContain("`human:engineering-manager`");
  });
});
