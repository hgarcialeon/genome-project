/**
 * Runtime-model target (RFC-0003 boundary, RFC-0004 shape).
 *
 * `(OrganizationGraph) => RuntimeModel` — the compiled artifact the runtime
 * consumes; it never reads Genome YAML (ADR-0004). The shape is normative
 * and additive-only within v0.1. The compiler owns interpretation, so the
 * deny-safe defaults (`autonomy`/`trigger` → `manual`) are resolved here;
 * the runtime never re-derives them.
 */

import { COMPANY_NODE_ID, edgesOf, type GraphNode, type NodeType, type OrganizationGraph } from "../graph/index.js";

export const AUTONOMY_DEFAULT = "manual";
export const TRIGGER_DEFAULT = "manual";

export type RuntimeAutonomy = "manual" | "supervised" | "autonomous";
export type RuntimeTrigger = "manual" | "event" | "schedule" | "webhook";

export type RuntimeAgent = {
  /** Graph node id, e.g. `agent:engineering.platform.backend`. */
  id: string;
  /** Dotted reference, e.g. `engineering.platform.backend`. */
  reference: string;
  label: string;
  role?: string;
  /** Resolved: an omitted autonomy is `manual` (deny-safe, SPEC/language.md). */
  autonomy: RuntimeAutonomy;
  skills: string[];
  /** Team or department node id. */
  memberOf: string;
  /** Policy node ids governing every initiation by this agent (`requires` edges). */
  governedBy: string[];
};

export type RuntimeWorkflow = {
  /** Graph node id, e.g. `workflow:build-feature`. */
  id: string;
  /** Document identifier, e.g. `build-feature`. */
  workflowId: string;
  /** Owner agent node id. Ownerless workflows are declarative-only in v0.1. */
  owner?: string;
  /** Resolved: an omitted trigger is `manual` (deny-safe, SPEC/language.md). */
  trigger: RuntimeTrigger;
  steps: string[];
  /** Policy node ids gating initiation of this workflow (`requires` edges). */
  governedBy: string[];
};

export type RuntimePolicy = {
  id: string;
  policyId: string;
  /** Governed node ids (workflows/agents), from the policy's `requires` edges. */
  appliesTo: string[];
  /** Principals as declared: `human:<id>` or a dotted agent reference. */
  requiresApprovalFrom: string[];
};

export type RuntimeModel = {
  genomeRevision: string;
  company: { name: string; timezone?: string };
  departments: Array<{ id: string; label: string }>;
  teams: Array<{ id: string; label: string; department: string }>;
  agents: RuntimeAgent[];
  workflows: RuntimeWorkflow[];
  policies: RuntimePolicy[];
  /** Declared data carried through uninterpreted (ADR-0004 provider boundary). */
  integrations: Array<{ id: string; type?: string; provider?: string }>;
  objectives: Array<{ id: string; owner?: string }>;
  metrics: Array<{ id: string; owner?: string }>;
  /** MemoryStore node ids; no runtime behavior before Phase 6 (RFC-0003). */
  memoryStores: string[];
};

export function runtimeModelTarget(graph: OrganizationGraph): RuntimeModel {
  const edges = edgesOf(graph);
  const byType = (type: NodeType): GraphNode[] => Object.values(graph.nodes).filter((node) => node.type === type);

  const parentOf = (id: string): string => graph.adjacency[id].find((edge) => edge.type === "belongs_to")!.to;
  const governing = (id: string): string[] =>
    graph.adjacency[id].filter((edge) => edge.type === "requires").map((edge) => edge.to);
  /** Owner agent node id, from the validated `owns` edge into this node. */
  const ownerOf = (id: string): string | undefined =>
    edges.find((edge) => edge.type === "owns" && edge.to === id)?.from;

  const optional = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

  const company = graph.nodes[COMPANY_NODE_ID];

  return deepFreeze({
    genomeRevision: graph.genomeRevision,
    company: { name: company.label, timezone: optional(company.attributes.timezone) },
    departments: byType("Department").map((node) => ({ id: node.id, label: node.label })),
    teams: byType("Team").map((node) => ({ id: node.id, label: node.label, department: parentOf(node.id) })),
    agents: byType("Agent").map((node) => ({
      id: node.id,
      reference: node.id.replace(/^agent:/, ""),
      label: node.label,
      role: optional(node.attributes.role),
      autonomy: (optional(node.attributes.autonomy) ?? AUTONOMY_DEFAULT) as RuntimeAutonomy,
      skills: [...(node.attributes.skills as string[])],
      memberOf: parentOf(node.id),
      governedBy: governing(node.id),
    })),
    workflows: byType("Workflow").map((node) => ({
      id: node.id,
      workflowId: node.label,
      owner: ownerOf(node.id),
      trigger: (optional(node.attributes.trigger) ?? TRIGGER_DEFAULT) as RuntimeTrigger,
      steps: [...(node.attributes.steps as string[])],
      governedBy: governing(node.id),
    })),
    policies: byType("Policy").map((node) => ({
      id: node.id,
      policyId: node.label,
      appliesTo: edges.filter((edge) => edge.type === "requires" && edge.to === node.id).map((edge) => edge.from),
      requiresApprovalFrom: [...(node.attributes.requiresApprovalFrom as string[])],
    })),
    integrations: byType("Integration").map((node) => ({
      id: node.id,
      type: optional(node.attributes.type),
      provider: optional(node.attributes.provider),
    })),
    objectives: byType("Objective").map((node) => ({ id: node.id, owner: ownerOf(node.id) })),
    metrics: byType("Metric").map((node) => ({ id: node.id, owner: ownerOf(node.id) })),
    memoryStores: byType("MemoryStore").map((node) => node.id),
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}
