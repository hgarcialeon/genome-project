/**
 * The normative replay operation (RFC-0003 constraint 3, RFC-0004
 * mechanics): observed state is DEFINED as `replay(log)`. A pure fold over
 * events in id order; forward-tolerant, so event types added by later RFCs
 * (the taxonomy is additive-only) are inert rather than fatal.
 */

import type { RuntimeEvent } from "../events/index.js";

export type RunStatus = "pending-approval" | "running" | "completed" | "failed";

export type RunState = {
  runId: string;
  workflowId: string;
  /** The Genome revision the run started under (drain adoption: never changes). */
  revision: string;
  /** The initiating principal: `human:<id>` or an agent node id. */
  initiatedBy: string;
  status: RunStatus;
  /** Principals whose approval is still required (may include the reserved `human:*`). */
  pendingApprovals: string[];
  /** Index of the currently assigned step, if any. */
  assignedStep: number | null;
  completedSteps: number;
};

export type RuntimeState = {
  halted: boolean;
  runs: Record<string, RunState>;
};

export function replay(events: readonly RuntimeEvent[]): RuntimeState {
  let halted = false;
  const runs: Record<string, RunState> = {};

  const run = (event: RuntimeEvent): RunState => {
    const runId = event.runId as string;
    return (runs[runId] ??= {
      runId,
      workflowId: String(event.payload.workflowId ?? ""),
      revision: event.genomeRevision,
      initiatedBy: String(event.payload.initiatedBy ?? event.source),
      status: "pending-approval",
      pendingApprovals: [],
      assignedStep: null,
      completedSteps: 0,
    });
  };

  for (const event of [...events].sort((a, b) => a.id - b.id)) {
    switch (event.type) {
      case "approval.requested": {
        const state = run(event);
        for (const principal of (event.payload.principals as string[]) ?? []) {
          if (!state.pendingApprovals.includes(principal)) {
            state.pendingApprovals.push(principal);
          }
        }
        break;
      }
      case "approval.granted": {
        const state = run(event);
        state.pendingApprovals = state.pendingApprovals.filter((p) => p !== event.payload.principal);
        break;
      }
      case "workflow.started": {
        run(event).status = "running";
        break;
      }
      case "agent.task.assigned": {
        run(event).assignedStep = event.payload.index as number;
        break;
      }
      case "agent.task.completed": {
        const state = run(event);
        state.completedSteps = (event.payload.index as number) + 1;
        state.assignedStep = null;
        break;
      }
      case "agent.task.failed": {
        run(event).assignedStep = null;
        break;
      }
      case "workflow.completed": {
        run(event).status = "completed";
        break;
      }
      case "workflow.failed": {
        run(event).status = "failed";
        break;
      }
      case "runtime.halted": {
        halted = true;
        break;
      }
      case "runtime.resumed": {
        halted = false;
        break;
      }
      // approval.denied changes no state itself (the terminating
      // workflow.failed follows it); unknown types are inert
      // (forward-tolerant, board condition 1).
      default:
        break;
    }
  }

  return { halted, runs };
}
