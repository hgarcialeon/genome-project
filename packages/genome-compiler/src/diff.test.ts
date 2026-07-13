import { describe, expect, it } from "vitest";

import { compile, diffTarget, type CompileSuccess, type DiffReport } from "./index.js";

const BASE = `
genomeVersion: 0.1
company:
  name: Acme Billing
  mission: Reliable billing.
departments:
  engineering:
    mission: Build the product.
    agents:
      backend:
        role: Backend Engineer
        autonomy: supervised
        skills:
          - node
          - postgres
workflows:
  ship:
    owner: engineering.backend
    trigger: manual
    steps:
      - implement
      - release
policies:
  deploys:
    appliesTo:
      - ship
    requiresApprovalFrom:
      - "human:cto"
`;

/** BASE with reordered keys and different formatting — same content. */
const BASE_REFORMATTED = `
company:
  mission: Reliable billing.
  name: Acme Billing
genomeVersion: 0.1
policies:
  deploys:
    requiresApprovalFrom: ["human:cto"]
    appliesTo: [ship]
workflows:
  ship:
    trigger: manual
    steps: [implement, release]
    owner: engineering.backend
departments:
  engineering:
    agents:
      backend:
        skills: [node, postgres]
        autonomy: supervised
        role: Backend Engineer
    mission: Build the product.
`;

const compileSource = (source: string): CompileSuccess => {
  const result = compile(source);
  expect(result.ok).toBe(true);
  return result as CompileSuccess;
};

const diffSources = (before: string, after: string): DiffReport =>
  diffTarget(compileSource(before).graph, compileSource(after).graph);

const empty = (report: DiffReport): void => {
  expect(report.nodes.added).toEqual([]);
  expect(report.nodes.removed).toEqual([]);
  expect(report.nodes.changed).toEqual([]);
  expect(report.edges.added).toEqual([]);
  expect(report.edges.removed).toEqual([]);
};

describe("diffTarget", () => {
  it("reports a document as identical to itself", () => {
    const report = diffSources(BASE, BASE);

    expect(report.identical).toBe(true);
    expect(report.revisions.before).toBe(report.revisions.after);
    empty(report);
  });

  it("is invisible to formatting and key order, like the revision", () => {
    const report = diffSources(BASE, BASE_REFORMATTED);

    expect(report.identical).toBe(true);
    empty(report);
  });

  it("carries both revisions so the report is self-describing", () => {
    const after = BASE.replace("Reliable billing.", "Effortless billing.");
    const report = diffSources(BASE, after);

    expect(report.revisions.before).toBe(compileSource(BASE).graph.genomeRevision);
    expect(report.revisions.after).toBe(compileSource(after).graph.genomeRevision);
    expect(report.identical).toBe(false);
  });

  it("reports an added agent as a new node plus its belongs_to edge", () => {
    const after = BASE.replace(
      "workflows:",
      `      frontend:
        role: Frontend Engineer
        autonomy: manual
        skills:
          - react
workflows:`,
    );
    const report = diffSources(BASE, after);

    expect(report.identical).toBe(false);
    expect(report.nodes.added).toEqual([{ id: "agent:engineering.frontend", type: "Agent" }]);
    expect(report.nodes.removed).toEqual([]);
    expect(report.nodes.changed).toEqual([]);
    expect(report.edges.added).toEqual([
      { from: "agent:engineering.frontend", type: "belongs_to", to: "department:engineering" },
    ]);
    expect(report.edges.removed).toEqual([]);
  });

  it("reports a removed workflow with its edges", () => {
    // BASE without the workflow; the policy scope moves to the agent so the
    // document stays semantically valid.
    const after = `
genomeVersion: 0.1
company:
  name: Acme Billing
  mission: Reliable billing.
departments:
  engineering:
    mission: Build the product.
    agents:
      backend:
        role: Backend Engineer
        autonomy: supervised
        skills:
          - node
          - postgres
policies:
  deploys:
    appliesTo:
      - engineering.backend
    requiresApprovalFrom:
      - "human:cto"
`;
    const report = diffSources(BASE, after);

    expect(report.nodes.removed).toEqual([{ id: "workflow:ship", type: "Workflow" }]);
    expect(report.edges.removed).toEqual(
      expect.arrayContaining([
        { from: "workflow:ship", type: "belongs_to", to: "company" },
        { from: "agent:engineering.backend", type: "owns", to: "workflow:ship" },
        { from: "workflow:ship", type: "requires", to: "policy:deploys" },
      ]),
    );
    expect(report.edges.added).toEqual([
      { from: "agent:engineering.backend", type: "requires", to: "policy:deploys" },
    ]);
  });

  it("reports changed attributes with before and after values", () => {
    const after = BASE.replace("autonomy: supervised", "autonomy: autonomous").replace(
      "      - release\n",
      "      - verify\n      - release\n",
    );
    const report = diffSources(BASE, after);

    expect(report.nodes.added).toEqual([]);
    expect(report.nodes.removed).toEqual([]);
    expect(report.nodes.changed).toEqual([
      {
        id: "agent:engineering.backend",
        type: "Agent",
        changes: [{ attribute: "autonomy", before: "supervised", after: "autonomous" }],
      },
      {
        id: "workflow:ship",
        type: "Workflow",
        changes: [
          { attribute: "steps", before: ["implement", "release"], after: ["implement", "verify", "release"] },
        ],
      },
    ]);
  });

  it("reports a company rename via the label pseudo-attribute", () => {
    const report = diffSources(BASE, BASE.replace("Acme Billing", "Acme Payments"));

    expect(report.nodes.changed).toEqual([
      {
        id: "company",
        type: "Company",
        changes: [{ attribute: "label", before: "Acme Billing", after: "Acme Payments" }],
      },
    ]);
  });

  it("orders every section deterministically", () => {
    const after = BASE.replace(
      "workflows:",
      `  zeta:
    mission: Last department.
    agents:
      zed:
        role: Z
  alpha:
    mission: First department.
    agents:
      abe:
        role: A
workflows:`,
    );
    const report = diffSources(BASE, after);

    expect(report.nodes.added.map((node) => node.id)).toEqual([
      "agent:alpha.abe",
      "agent:zeta.zed",
      "department:alpha",
      "department:zeta",
    ]);
    const keys = report.edges.added.map((edge) => `${edge.from} ${edge.type} ${edge.to}`);
    expect(keys).toEqual([...keys].sort());
  });
});
