/**
 * Stage 5 — Organization Graph.
 *
 * The canonical compiled representation. Node and relationship types are the
 * normative v0.1 contract from RFC-0002. The graph is a plain adjacency list
 * owned by this package (no third-party graph library, per ADR-0003) and is
 * deeply frozen: durable change happens by producing a new Genome version and
 * recompiling.
 */

import type { GenomeAst } from "../ast/index.js";

export const NODE_TYPES = [
  "Company",
  "Department",
  "Team",
  "Agent",
  "Workflow",
  "Policy",
  "Integration",
  "Objective",
  "Metric",
  "MemoryStore",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "belongs_to",
  "owns",
  "uses",
  "requires",
  "triggers",
  "approves",
  "measures",
  "depends_on",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type GraphNode = {
  /** Stable node id: `<kind>:<dotted-path>`, e.g. `agent:engineering.platform.backend`. */
  id: string;
  type: NodeType;
  /** Identifier within the source document (company name for the Company node). */
  label: string;
  /** Source-document attributes relevant to downstream targets. */
  attributes: Record<string, unknown>;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: RelationshipType;
};

export type OrganizationGraph = {
  nodes: Record<string, GraphNode>;
  /** Outgoing edges per node id. Every node id has an entry, possibly empty. */
  adjacency: Record<string, GraphEdge[]>;
};

export const COMPANY_NODE_ID = "company";

export const nodeId = (type: NodeType, path: string): string =>
  type === "Company" ? COMPANY_NODE_ID : `${type.toLowerCase().replace("memorystore", "memory-store")}:${path}`;

/** All edges of the graph in one flat list (derived from the adjacency list). */
export const edgesOf = (graph: OrganizationGraph): GraphEdge[] => Object.values(graph.adjacency).flat();

/**
 * Build the Organization Graph from a semantically valid AST.
 *
 * v0.1 relationship producers:
 * - `belongs_to`: the containment hierarchy (departments → company, teams →
 *   departments, agents → teams/departments) and top-level resources
 *   (workflows, policies, integrations, objectives, metrics, memory stores →
 *   company).
 * - `owns`: owner agent → workflow/objective/metric.
 * - `approves`: agent principal → policy (human principals are recorded in the
 *   policy node's attributes; humans are not graph nodes in v0.1).
 * - `requires`: governed workflow/agent → policy, from the policy's declared
 *   scope (`appliesTo`, RFC-0003/ADR-0004).
 * - `uses`: company → integration.
 * - `measures`: metric → company.
 * The remaining relationship types (`triggers`, `depends_on`) are part of the
 * normative contract but have no v0.1 language construct that produces them
 * yet.
 */
export function buildGraph(ast: GenomeAst): OrganizationGraph {
  const nodes: Record<string, GraphNode> = {};
  const adjacency: Record<string, GraphEdge[]> = {};

  const addNode = (type: NodeType, path: string, label: string, attributes: Record<string, unknown>): string => {
    const id = nodeId(type, path);
    nodes[id] = { id, type, label, attributes };
    adjacency[id] = [];
    return id;
  };

  const addEdge = (from: string, type: RelationshipType, to: string): void => {
    adjacency[from].push({ from, to, type });
  };

  const companyId = addNode("Company", COMPANY_NODE_ID, ast.company.name, {
    mission: ast.company.mission,
    timezone: ast.company.timezone,
  });

  // Agent references (dept.agent / dept.team.agent) → graph node ids, for
  // resolving `owns` and `approves` edges below.
  const agentNodeIds = new Map<string, string>();

  for (const department of ast.departments) {
    const departmentId = addNode("Department", department.id, department.id, { mission: department.mission });
    addEdge(departmentId, "belongs_to", companyId);

    for (const agent of department.agents) {
      const reference = `${department.id}.${agent.id}`;
      const agentId = addNode("Agent", reference, agent.id, {
        role: agent.role,
        autonomy: agent.autonomy,
        skills: agent.skills,
      });
      addEdge(agentId, "belongs_to", departmentId);
      agentNodeIds.set(reference, agentId);
    }

    for (const team of department.teams) {
      const teamPath = `${department.id}.${team.id}`;
      const teamId = addNode("Team", teamPath, team.id, { mission: team.mission });
      addEdge(teamId, "belongs_to", departmentId);

      for (const agent of team.agents) {
        const reference = `${teamPath}.${agent.id}`;
        const agentId = addNode("Agent", reference, agent.id, {
          role: agent.role,
          autonomy: agent.autonomy,
          skills: agent.skills,
        });
        addEdge(agentId, "belongs_to", teamId);
        agentNodeIds.set(reference, agentId);
      }
    }
  }

  const workflowNodeIds = new Map<string, string>();

  // Validated owners (semantic rules 3 and 5) must survive into the graph so
  // the runtime model can see them (RFC-0003, "derived only from the graph").
  const addOwnerEdge = (owner: string | undefined, ownedId: string): void => {
    const ownerId = owner === undefined ? undefined : agentNodeIds.get(owner);
    if (ownerId !== undefined) {
      addEdge(ownerId, "owns", ownedId);
    }
  };

  for (const workflow of ast.workflows) {
    const workflowId = addNode("Workflow", workflow.id, workflow.id, {
      owner: workflow.owner,
      trigger: workflow.trigger,
      steps: workflow.steps,
    });
    addEdge(workflowId, "belongs_to", companyId);
    workflowNodeIds.set(workflow.id, workflowId);
    addOwnerEdge(workflow.owner, workflowId);
  }

  for (const policy of ast.policies) {
    const humanPrincipals = policy.requiresApprovalFrom.filter((p) => p.startsWith("human:"));
    const policyId = addNode("Policy", policy.id, policy.id, {
      appliesTo: policy.appliesTo,
      requiresApprovalFrom: policy.requiresApprovalFrom,
      humanPrincipals,
    });
    addEdge(policyId, "belongs_to", companyId);
    for (const principal of policy.requiresApprovalFrom) {
      const approverId = agentNodeIds.get(principal);
      if (approverId !== undefined) {
        addEdge(approverId, "approves", policyId);
      }
    }
    // Policy scope: dotted entries are agent references, single segments are
    // workflow ids (SPEC/language.md, Policy Scope).
    for (const entry of policy.appliesTo) {
      const governedId = entry.includes(".") ? agentNodeIds.get(entry) : workflowNodeIds.get(entry);
      if (governedId !== undefined) {
        addEdge(governedId, "requires", policyId);
      }
    }
  }

  for (const integration of ast.integrations) {
    const integrationId = addNode("Integration", integration.id, integration.id, {
      type: integration.type,
      provider: integration.provider,
    });
    addEdge(integrationId, "belongs_to", companyId);
    addEdge(companyId, "uses", integrationId);
  }

  for (const objective of ast.objectives) {
    const objectiveId = addNode("Objective", objective.id, objective.id, {
      description: objective.description,
      owner: objective.owner,
    });
    addEdge(objectiveId, "belongs_to", companyId);
    addOwnerEdge(objective.owner, objectiveId);
  }

  for (const metric of ast.metrics) {
    const metricId = addNode("Metric", metric.id, metric.id, { type: metric.type, owner: metric.owner });
    addEdge(metricId, "belongs_to", companyId);
    addEdge(metricId, "measures", companyId);
    addOwnerEdge(metric.owner, metricId);
  }

  if (ast.memory) {
    for (const store of ast.memory.stores) {
      const storeId = addNode("MemoryStore", store, store, { retention: ast.memory.retention });
      addEdge(storeId, "belongs_to", companyId);
    }
  }

  return deepFreeze({ nodes, adjacency });
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
