/**
 * Stage 4 — Semantic validation.
 *
 * Owns *coherence* (cross-node references, ownership, uniqueness, dependency
 * resolution); shape belongs to schema validation (RFC-0002 layer partition).
 *
 * Implements the v0.1 minimal set (RFC-0002 Stage 4 acceptance criteria):
 *   1. `agent.autonomy` is one of `manual`, `supervised`, `autonomous`.
 *   2. No two sibling identifiers collide within a level.
 *   3. `workflow.owner` resolves to an existing agent.
 *   4. `policy.*.requiresApprovalFrom` principals are valid.
 *   5. No dangling references in `workflows`, `objectives`, or `metrics`.
 * Plus the RFC-0003 / ADR-0004 policy-scope rule:
 *   6. `policy.*.appliesTo` entries resolve to an existing workflow (single
 *      segment) or agent (dotted reference); a policy without `appliesTo` is
 *      unbound and produces a warning, not an error.
 */

import type { GenomeAst } from "../ast/index.js";
import type { Diagnostic } from "../diagnostics.js";

export const AUTONOMY_LEVELS = ["manual", "supervised", "autonomous"] as const;

const IDENTIFIER = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;
const HUMAN_PRINCIPAL = /^human:(.+)$/;

/**
 * Index of resolvable agent references, per the reference-resolution rules in
 * `SPEC/language.md`: dotted references skip the `teams`/`agents` container
 * keys, so `engineering.platform.backend` is a team-level agent and
 * `operations.coordinator` a department-level agent.
 */
export function buildAgentIndex(ast: GenomeAst): Set<string> {
  const index = new Set<string>();
  for (const department of ast.departments) {
    for (const agent of department.agents) {
      index.add(`${department.id}.${agent.id}`);
    }
    for (const team of department.teams) {
      for (const agent of team.agents) {
        index.add(`${department.id}.${team.id}.${agent.id}`);
      }
    }
  }
  return index;
}

export function validateSemantics(ast: GenomeAst): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const agentIndex = buildAgentIndex(ast);

  const error = (rule: number, path: string, message: string): void => {
    diagnostics.push({ stage: "semantic", rule, path, message });
  };

  const checkDuplicates = (rule2Path: string, ids: string[]): void => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        error(2, `${rule2Path}.${id}`, `duplicate identifier '${id}'`);
      }
      seen.add(id);
    }
  };

  // Rule 3 / Rule 5 share the same resolution check; only the field differs.
  const checkAgentReference = (rule: number, path: string, reference: string): void => {
    if (!agentIndex.has(reference)) {
      error(rule, path, `'${reference}' does not resolve to an existing agent`);
    }
  };

  // Rules 1 and 2 — structure-local checks.
  checkDuplicates("departments", ast.departments.map((d) => d.id));
  for (const department of ast.departments) {
    const base = `departments.${department.id}`;
    checkDuplicates(`${base}.teams`, department.teams.map((t) => t.id));
    checkDuplicates(`${base}.agents`, department.agents.map((a) => a.id));

    for (const agent of department.agents) {
      checkAutonomy(`${base}.agents.${agent.id}`, agent.autonomy, error);
    }
    for (const team of department.teams) {
      const teamBase = `${base}.teams.${team.id}`;
      checkDuplicates(`${teamBase}.agents`, team.agents.map((a) => a.id));
      for (const agent of team.agents) {
        checkAutonomy(`${teamBase}.agents.${agent.id}`, agent.autonomy, error);
      }
    }
  }
  checkDuplicates("workflows", ast.workflows.map((w) => w.id));
  checkDuplicates("policies", ast.policies.map((p) => p.id));
  checkDuplicates("integrations", ast.integrations.map((i) => i.id));
  checkDuplicates("objectives", ast.objectives.map((o) => o.id));
  checkDuplicates("metrics", ast.metrics.map((m) => m.id));
  if (ast.memory) {
    checkDuplicates("memory.stores", ast.memory.stores);
  }

  // Rule 3 — workflow ownership.
  for (const workflow of ast.workflows) {
    if (workflow.owner !== undefined) {
      checkAgentReference(3, `workflows.${workflow.id}.owner`, workflow.owner);
    }
  }

  // Rule 4 — policy principals: `human:<id>` or a resolvable agent reference.
  for (const policy of ast.policies) {
    for (const principal of policy.requiresApprovalFrom) {
      const path = `policies.${policy.id}.requiresApprovalFrom`;
      const human = HUMAN_PRINCIPAL.exec(principal);
      if (human) {
        if (!IDENTIFIER.test(human[1])) {
          error(4, path, `'${principal}' is not a valid human principal: '${human[1]}' is not a valid identifier`);
        }
      } else {
        if (!agentIndex.has(principal)) {
          error(4, path, `'${principal}' is neither a 'human:<id>' principal nor an existing agent reference`);
        }
      }
    }
  }

  // Rule 6 — policy scope (`SPEC/language.md`, Policy Scope): entries with a
  // dot are agent references; single segments are workflow ids.
  const workflowIds = new Set(ast.workflows.map((w) => w.id));
  for (const policy of ast.policies) {
    if (policy.appliesTo.length === 0) {
      diagnostics.push({
        stage: "semantic",
        severity: "warning",
        rule: 6,
        path: `policies.${policy.id}`,
        message: `unbound policy: '${policy.id}' declares no 'appliesTo' and governs nothing`,
      });
      continue;
    }
    for (const entry of policy.appliesTo) {
      const path = `policies.${policy.id}.appliesTo`;
      if (entry.includes(".")) {
        checkAgentReference(6, path, entry);
      } else if (!workflowIds.has(entry)) {
        error(6, path, `'${entry}' does not resolve to an existing workflow`);
      }
    }
  }

  // Rule 5 — no dangling references in objectives or metrics (workflow owners
  // are covered by rule 3).
  for (const objective of ast.objectives) {
    if (objective.owner !== undefined) {
      checkAgentReference(5, `objectives.${objective.id}.owner`, objective.owner);
    }
  }
  for (const metric of ast.metrics) {
    if (metric.owner !== undefined) {
      checkAgentReference(5, `metrics.${metric.id}.owner`, metric.owner);
    }
  }

  return diagnostics;
}

function checkAutonomy(
  agentPath: string,
  autonomy: string | undefined,
  error: (rule: number, path: string, message: string) => void,
): void {
  if (autonomy !== undefined && !(AUTONOMY_LEVELS as readonly string[]).includes(autonomy)) {
    error(
      1,
      `${agentPath}.autonomy`,
      `'${autonomy}' is not a valid autonomy level (expected one of: ${AUTONOMY_LEVELS.join(", ")})`,
    );
  }
}
