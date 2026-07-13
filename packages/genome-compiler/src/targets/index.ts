/**
 * Compilation targets — plain `(OrganizationGraph) => T` functions.
 *
 * v0.1 is a small, fixed, internal set (no plugin system, per ADR-0003):
 * CLI inspection, graph output, documentation output, and the runtime model
 * (RFC-0004). Office, workflow, and memory targets are deferred to their
 * consuming phases.
 */

export * from "./runtime-model.js";

import {
  COMPANY_NODE_ID,
  edgesOf,
  type GraphEdge,
  type GraphNode,
  type NodeType,
  type OrganizationGraph,
} from "../graph/index.js";

const byType = (graph: OrganizationGraph, type: NodeType): GraphNode[] =>
  Object.values(graph.nodes).filter((node) => node.type === type);

const incoming = (graph: OrganizationGraph, to: string, type: GraphEdge["type"]): GraphNode[] =>
  edgesOf(graph)
    .filter((edge) => edge.to === to && edge.type === type)
    .map((edge) => graph.nodes[edge.from]);

/** Counts and hierarchy summary consumed by `genome inspect`. */
export type InspectReport = {
  company: { name: string; mission?: string };
  counts: Record<NodeType, number>;
  departments: Array<{
    id: string;
    agents: string[];
    teams: Array<{ id: string; agents: string[] }>;
  }>;
  workflows: Array<{ id: string; owner?: string; trigger?: string; steps: number }>;
};

export function inspectTarget(graph: OrganizationGraph): InspectReport {
  const company = graph.nodes[COMPANY_NODE_ID];
  const counts = Object.fromEntries(
    (
      ["Company", "Department", "Team", "Agent", "Workflow", "Policy", "Integration", "Objective", "Metric", "MemoryStore"] as const
    ).map((type) => [type, byType(graph, type).length]),
  ) as Record<NodeType, number>;

  return {
    company: {
      name: company.label,
      mission: company.attributes.mission as string | undefined,
    },
    counts,
    departments: incoming(graph, COMPANY_NODE_ID, "belongs_to")
      .filter((node) => node.type === "Department")
      .map((department) => ({
        id: department.label,
        agents: incoming(graph, department.id, "belongs_to")
          .filter((node) => node.type === "Agent")
          .map((agent) => agent.label),
        teams: incoming(graph, department.id, "belongs_to")
          .filter((node) => node.type === "Team")
          .map((team) => ({
            id: team.label,
            agents: incoming(graph, team.id, "belongs_to").map((agent) => agent.label),
          })),
      })),
    workflows: byType(graph, "Workflow").map((workflow) => ({
      id: workflow.label,
      owner: workflow.attributes.owner as string | undefined,
      trigger: workflow.attributes.trigger as string | undefined,
      steps: (workflow.attributes.steps as string[]).length,
    })),
  };
}

/** JSON-serializable nodes + edges view of the graph. */
export type GraphOutput = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function graphTarget(graph: OrganizationGraph): GraphOutput {
  return {
    nodes: Object.values(graph.nodes),
    edges: edgesOf(graph),
  };
}

/** Markdown documentation of the organization. */
export function docsTarget(graph: OrganizationGraph): string {
  const company = graph.nodes[COMPANY_NODE_ID];
  const report = inspectTarget(graph);
  const lines: string[] = [`# ${company.label}`, ""];

  const mission = company.attributes.mission;
  if (typeof mission === "string") {
    lines.push(mission, "");
  }

  lines.push("## Organization", "");
  for (const department of report.departments) {
    lines.push(`- **${department.id}**`);
    for (const agent of department.agents) {
      lines.push(`  - ${agent}`);
    }
    for (const team of department.teams) {
      lines.push(`  - **${team.id}**`);
      for (const agent of team.agents) {
        lines.push(`    - ${agent}`);
      }
    }
  }
  lines.push("");

  if (report.workflows.length > 0) {
    lines.push("## Workflows", "");
    for (const workflow of report.workflows) {
      const owner = workflow.owner === undefined ? "" : ` — owner: \`${workflow.owner}\``;
      const trigger = workflow.trigger === undefined ? "" : ` — trigger: \`${workflow.trigger}\``;
      lines.push(`- **${workflow.id}**${owner}${trigger} (${workflow.steps} steps)`);
    }
    lines.push("");
  }

  const policies = byType(graph, "Policy");
  if (policies.length > 0) {
    lines.push("## Policies", "");
    for (const policy of policies) {
      const appliesTo = policy.attributes.appliesTo as string[];
      const scope = appliesTo.length === 0 ? "" : ` — applies to: ${appliesTo.map((a) => `\`${a}\``).join(", ")}`;
      const principals = policy.attributes.requiresApprovalFrom as string[];
      lines.push(`- **${policy.label}**${scope} — requires approval from: ${principals.map((p) => `\`${p}\``).join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
