/**
 * Stage 3 — Genome AST.
 *
 * The AST stays close to the source document: it normalizes identifiers,
 * preserves the declared hierarchy, and represents organizational intent.
 * Source spans are optional and best-effort (ADR-0003): the current parse
 * layer (`YAML.parse` in `@genome/schema`) discards locations, so nodes are
 * valid without one.
 */

export type SourceSpan = {
  start: { line: number; column: number };
  end: { line: number; column: number };
};

export type AstNode = {
  span?: SourceSpan;
};

export type CompanyNode = AstNode & {
  name: string;
  mission?: string;
  timezone?: string;
};

export type AgentNode = AstNode & {
  id: string;
  role?: string;
  autonomy?: string;
  skills: string[];
};

export type TeamNode = AstNode & {
  id: string;
  mission?: string;
  agents: AgentNode[];
};

export type DepartmentNode = AstNode & {
  id: string;
  mission?: string;
  teams: TeamNode[];
  agents: AgentNode[];
};

export type WorkflowNode = AstNode & {
  id: string;
  owner?: string;
  trigger?: string;
  steps: string[];
};

export type PolicyNode = AstNode & {
  id: string;
  requiresApprovalFrom: string[];
};

export type IntegrationNode = AstNode & {
  id: string;
  type?: string;
  provider?: string;
};

export type MemoryNode = AstNode & {
  retention?: string;
  stores: string[];
};

export type ObjectiveNode = AstNode & {
  id: string;
  description?: string;
  owner?: string;
};

export type MetricNode = AstNode & {
  id: string;
  type?: string;
  owner?: string;
};

export type GenomeAst = {
  genomeVersion: string;
  company: CompanyNode;
  departments: DepartmentNode[];
  workflows: WorkflowNode[];
  policies: PolicyNode[];
  integrations: IntegrationNode[];
  memory?: MemoryNode;
  objectives: ObjectiveNode[];
  metrics: MetricNode[];
};

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Raw) : {};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value === undefined || value === null ? undefined : String(value);

const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

/** Identifier normalization: identifiers are compared and stored trimmed. */
export const normalizeId = (id: string): string => id.trim();

const entries = (value: unknown): Array<[string, Raw]> =>
  Object.entries(asRecord(value)).map(([key, raw]) => [normalizeId(key), asRecord(raw)]);

/**
 * Build the Genome AST from a schema-valid document (Stage 2 output).
 *
 * The document must already have passed schema validation; this builder
 * normalizes rather than validates. Coherence checks belong to Stage 4.
 */
export function buildAst(document: unknown): GenomeAst {
  const doc = asRecord(document);
  const company = asRecord(doc.company);
  const memory = doc.memory === undefined ? undefined : asRecord(doc.memory);

  return {
    genomeVersion: String(doc.genomeVersion),
    company: {
      name: String(company.name),
      mission: asOptionalString(company.mission),
      timezone: asOptionalString(company.timezone),
    },
    departments: entries(doc.departments).map(([id, department]) => ({
      id,
      mission: asOptionalString(department.mission),
      teams: entries(department.teams).map(([teamId, team]) => ({
        id: teamId,
        mission: asOptionalString(team.mission),
        agents: entries(team.agents).map(buildAgent),
      })),
      agents: entries(department.agents).map(buildAgent),
    })),
    workflows: entries(doc.workflows).map(([id, workflow]) => ({
      id,
      owner: asOptionalString(workflow.owner),
      trigger: asOptionalString(workflow.trigger),
      steps: asStringList(workflow.steps),
    })),
    policies: entries(doc.policies).map(([id, policy]) => ({
      id,
      requiresApprovalFrom: asStringList(policy.requiresApprovalFrom),
    })),
    integrations: entries(doc.integrations).map(([id, integration]) => ({
      id,
      type: asOptionalString(integration.type),
      provider: asOptionalString(integration.provider),
    })),
    memory:
      memory === undefined
        ? undefined
        : {
            retention: asOptionalString(memory.retention),
            stores: asStringList(memory.stores).map(normalizeId),
          },
    objectives: entries(doc.objectives).map(([id, objective]) => ({
      id,
      description: asOptionalString(objective.description),
      owner: asOptionalString(objective.owner),
    })),
    metrics: entries(doc.metrics).map(([id, metric]) => ({
      id,
      type: asOptionalString(metric.type),
      owner: asOptionalString(metric.owner),
    })),
  };
}

function buildAgent([id, agent]: [string, Raw]): AgentNode {
  return {
    id,
    role: asOptionalString(agent.role),
    autonomy: asOptionalString(agent.autonomy),
    skills: asStringList(agent.skills),
  };
}
