/**
 * The Genome runtime core (RFC-0003 boundary, RFC-0004 semantics).
 *
 * Consumes compiled runtime models, produces the append-only event log —
 * and holds no run state outside it: every operation derives its view via
 * `replay(log)`, decides, and appends, so `state() == replay(log)` holds by
 * construction (Governance Rule 6, mechanically enforced). Execution is
 * event-driven and non-preemptive; nothing above the adapter seam names a
 * provider.
 */

import type { RuntimeModel } from "@genome/compiler";

import { INTRINSIC_FLOOR_PRINCIPAL, isHumanPrincipal, type EventType, type RuntimeEvent } from "../events/index.js";
import { createEventLog, type EventListener } from "../log/index.js";
import { replay, type RunStatus, type RuntimeState } from "../replay/index.js";

/** Machine-readable refusal codes (normative, RFC-0004 board condition 3). */
export type RefusalReason =
  | "halted"
  | "not-halted"
  | "unknown-workflow"
  | "ownerless-workflow"
  | "unknown-agent"
  | "manual-agent"
  | "unknown-run"
  | "not-pending"
  | "not-running"
  | "no-assigned-task"
  | "unmatched-principal"
  | "reserved-principal"
  | "non-human-operator"
  | "duplicate-revision";

export type Refusal = { ok: false; reason: RefusalReason };

export type InitiationResult = { ok: true; runId: string; status: RunStatus } | Refusal;
export type ApprovalResult = { ok: true; runId: string; status: RunStatus } | Refusal;
export type TaskResult = { ok: true; runId: string; status: RunStatus } | Refusal;
export type ControlResult = { ok: true } | Refusal;

/** A dispatched unit of work: one workflow step assigned to the owner agent. */
export type AgentTask = {
  runId: string;
  workflowId: string;
  /** Owner agent node id. */
  agent: string;
  step: string;
  index: number;
};

/**
 * The provider adapter seam (ADR-0004). `dispatch` is fire-and-forget; the
 * adapter reports outcomes back through `reportTask`. Adapter-held provider
 * state must be disposable — a report refused during a halt degrades to
 * retry after resume, never to divergent truth.
 */
export type AgentAdapter = {
  dispatch(task: AgentTask): void;
};

export type RuntimeOptions = {
  model: RuntimeModel;
  adapter?: AgentAdapter;
  /** Injectable for deterministic tests; timestamps are informational only. */
  clock?: () => string;
};

export type Runtime = {
  /** Explicit initiation (the only initiation path in v0.1). */
  startWorkflow(workflowId: string, source: string): InitiationResult;
  /** Approval response, matched to the run by runId (deny-safe). */
  submitApproval(runId: string, principal: string, granted: boolean): ApprovalResult;
  /** Adapter-facing outcome report for the currently assigned step. */
  reportTask(runId: string, outcome: "completed" | "failed", detail?: string): TaskResult;
  /** Operator emergency stop — an attributable control event, human-only. */
  halt(source: string): ControlResult;
  resume(source: string): ControlResult;
  /** Drain adoption: new work on the new model, in-flight work unaffected. */
  adoptRevision(model: RuntimeModel): ControlResult;
  /** Observed state — literally `replay(log)` (RFC-0004). */
  state(): RuntimeState;
  events(): readonly RuntimeEvent[];
  subscribe(listener: EventListener): () => void;
  currentRevision(): string;
};

export function createRuntime(options: RuntimeOptions): Runtime {
  const log = createEventLog();
  const clock = options.clock ?? (() => new Date().toISOString());
  const models = new Map<string, RuntimeModel>([[options.model.genomeRevision, options.model]]);
  let currentRevision = options.model.genomeRevision;

  const state = (): RuntimeState => replay(log.events());

  const refuse = (reason: RefusalReason): Refusal => ({ ok: false, reason });

  const emit = (
    type: EventType,
    revision: string,
    runId: string | null,
    source: string,
    payload: Record<string, unknown>,
  ): void => {
    log.append({ timestamp: clock(), genomeRevision: revision, runId, source, type, payload });
  };

  const workflowOf = (model: RuntimeModel, workflowId: string) =>
    model.workflows.find((workflow) => workflow.workflowId === workflowId);

  const assignStep = (model: RuntimeModel, runId: string, workflowId: string, index: number): void => {
    const workflow = workflowOf(model, workflowId)!;
    const task: AgentTask = { runId, workflowId, agent: workflow.owner!, step: workflow.steps[index], index };
    emit("agent.task.assigned", model.genomeRevision, runId, workflow.id, {
      agent: task.agent,
      step: task.step,
      index,
    });
    options.adapter?.dispatch(task);
  };

  /** Governing policies for a run: the workflow's plus the initiating agent's (RFC-0003). */
  const governingPolicies = (model: RuntimeModel, workflowId: string, initiatedBy: string) => {
    const workflow = workflowOf(model, workflowId)!;
    const agent = model.agents.find((candidate) => candidate.id === initiatedBy);
    const ids = [...new Set([...workflow.governedBy, ...(agent?.governedBy ?? [])])];
    return ids.map((id) => model.policies.find((policy) => policy.id === id)!);
  };

  return {
    startWorkflow(workflowId, source) {
      const current = state();
      if (current.halted) return refuse("halted");

      const model = models.get(currentRevision)!;
      const workflow = workflowOf(model, workflowId);
      if (workflow === undefined) return refuse("unknown-workflow");
      if (workflow.owner === undefined) return refuse("ownerless-workflow");

      // Resolve the initiating principal: a concrete human, or an agent
      // gated by its autonomy level (SPEC/language.md).
      let initiatedBy: string;
      let floorNeeded = false;
      if (source === INTRINSIC_FLOOR_PRINCIPAL) return refuse("reserved-principal");
      if (isHumanPrincipal(source)) {
        initiatedBy = source;
      } else {
        const agent = model.agents.find((candidate) => candidate.id === source || candidate.reference === source);
        if (agent === undefined) return refuse("unknown-agent");
        if (agent.autonomy === "manual") return refuse("manual-agent");
        initiatedBy = agent.id;
        floorNeeded = agent.autonomy === "supervised";
      }

      const policies = governingPolicies(model, workflowId, initiatedBy);
      const required = policies.flatMap((policy) => policy.requiresApprovalFrom);
      // The intrinsic floor: only when no policy already requires a human
      // (a policy-required human grant already satisfies it).
      const floor = floorNeeded && !required.some(isHumanPrincipal);

      const runId = `run-${Object.keys(current.runs).length + 1}`;

      if (required.length === 0 && !floor) {
        emit("workflow.started", model.genomeRevision, runId, initiatedBy, { workflowId, initiatedBy });
        assignStep(model, runId, workflowId, 0);
        return { ok: true, runId, status: "running" };
      }

      for (const policy of policies) {
        emit("approval.requested", model.genomeRevision, runId, policy.id, {
          workflowId,
          initiatedBy,
          principals: policy.requiresApprovalFrom,
        });
      }
      if (floor) {
        emit("approval.requested", model.genomeRevision, runId, initiatedBy, {
          workflowId,
          initiatedBy,
          principals: [INTRINSIC_FLOOR_PRINCIPAL],
        });
      }
      return { ok: true, runId, status: "pending-approval" };
    },

    submitApproval(runId, principal, granted) {
      const current = state();
      if (current.halted) return refuse("halted");
      if (principal === INTRINSIC_FLOOR_PRINCIPAL) return refuse("reserved-principal");

      const run = current.runs[runId];
      if (run === undefined) return refuse("unknown-run");
      if (run.status !== "pending-approval") return refuse("not-pending");

      // Match exactly, or a concrete human against the pending floor.
      const matched = run.pendingApprovals.includes(principal)
        ? principal
        : isHumanPrincipal(principal) && run.pendingApprovals.includes(INTRINSIC_FLOOR_PRINCIPAL)
          ? INTRINSIC_FLOOR_PRINCIPAL
          : undefined;
      if (matched === undefined) return refuse("unmatched-principal");

      // Drain adoption: the run stays on the model it started under.
      const model = models.get(run.revision)!;
      const workflow = workflowOf(model, run.workflowId)!;

      if (!granted) {
        emit("approval.denied", run.revision, runId, principal, { principal: matched });
        for (const policy of governingPolicies(model, run.workflowId, run.initiatedBy)) {
          if (policy.requiresApprovalFrom.includes(matched)) {
            emit("policy.enforced", run.revision, runId, policy.id, { principal: matched, effect: "denied" });
          }
        }
        emit("workflow.failed", run.revision, runId, workflow.id, { reason: "approval-denied" });
        return { ok: true, runId, status: "failed" };
      }

      emit("approval.granted", run.revision, runId, principal, { principal: matched });
      if (run.pendingApprovals.length > 1) {
        return { ok: true, runId, status: "pending-approval" };
      }
      emit("workflow.started", run.revision, runId, run.initiatedBy, {
        workflowId: run.workflowId,
        initiatedBy: run.initiatedBy,
      });
      assignStep(model, runId, run.workflowId, 0);
      return { ok: true, runId, status: "running" };
    },

    reportTask(runId, outcome, detail) {
      const current = state();
      if (current.halted) return refuse("halted");

      const run = current.runs[runId];
      if (run === undefined) return refuse("unknown-run");
      if (run.status !== "running") return refuse("not-running");
      if (run.assignedStep === null) return refuse("no-assigned-task");

      const model = models.get(run.revision)!;
      const workflow = workflowOf(model, run.workflowId)!;
      const index = run.assignedStep;
      const step = workflow.steps[index];

      if (outcome === "failed") {
        emit("agent.task.failed", run.revision, runId, workflow.owner!, { step, index, detail });
        emit("workflow.failed", run.revision, runId, workflow.id, { reason: "task-failed" });
        return { ok: true, runId, status: "failed" };
      }

      emit("agent.task.completed", run.revision, runId, workflow.owner!, { step, index });
      if (index + 1 < workflow.steps.length) {
        assignStep(model, runId, run.workflowId, index + 1);
        return { ok: true, runId, status: "running" };
      }
      emit("workflow.completed", run.revision, runId, workflow.id, { workflowId: run.workflowId });
      return { ok: true, runId, status: "completed" };
    },

    halt(source) {
      if (!isHumanPrincipal(source)) return refuse("non-human-operator");
      if (state().halted) return refuse("halted");
      emit("runtime.halted", currentRevision, null, source, {});
      return { ok: true };
    },

    resume(source) {
      if (!isHumanPrincipal(source)) return refuse("non-human-operator");
      if (!state().halted) return refuse("not-halted");
      emit("runtime.resumed", currentRevision, null, source, {});
      return { ok: true };
    },

    adoptRevision(model) {
      if (models.has(model.genomeRevision)) return refuse("duplicate-revision");
      models.set(model.genomeRevision, model);
      currentRevision = model.genomeRevision;
      return { ok: true };
    },

    state,
    events: () => log.events(),
    subscribe: (listener) => log.subscribe(listener),
    currentRevision: () => currentRevision,
  };
}
