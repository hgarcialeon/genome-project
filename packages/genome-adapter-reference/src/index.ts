/**
 * The deterministic local reference adapter (RFC-0006, ADR-0008) — the first
 * real consumer of the RFC-0004 adapter seam. It simulates agent work with
 * no provider, no network, no I/O, and no nondeterminism: `dispatch` only
 * enqueues, and `settle()` drives the FIFO to quiescence synchronously.
 *
 * Adapter-held state (the FIFO and the dispatch record) is disposable per
 * the seam contract and, for this adapter, derivable from replay of the
 * event log it was driven by — a property stronger than the seam requires
 * and not precedent for provider adapters (ADR-0008).
 */

import type { AgentAdapter, AgentTask, Runtime } from "@genome/runtime";

export type ReferenceAdapterOptions = {
  /** Steps to fail, as "workflowId:step" or bare "step". */
  failSteps?: string[];
};

export type ReferenceAdapter = AgentAdapter & {
  /** Attach the runtime whose `reportTask` receives outcomes. */
  bind(runtime: Runtime): void;
  /** Drive all queued tasks to quiescence, synchronously, FIFO. */
  settle(): void;
  /**
   * Every task ever dispatched, in dispatch order. An inspection aid only —
   * the event log, not this record, is the observation surface.
   */
  readonly dispatched: readonly AgentTask[];
};

const FAILURE_DETAIL = "simulated failure";

export function createReferenceAdapter(options: ReferenceAdapterOptions = {}): ReferenceAdapter {
  const failSteps = options.failSteps ?? [];
  const queue: AgentTask[] = [];
  const dispatched: AgentTask[] = [];
  let runtime: Runtime | undefined;

  // Qualified match wins over bare match: a "workflowId:step" entry scopes
  // the failure to that workflow; a bare "step" entry fails the step in any
  // workflow.
  const fails = (task: AgentTask): boolean =>
    failSteps.includes(`${task.workflowId}:${task.step}`) || failSteps.includes(task.step);

  return {
    dispatch(task) {
      // Never re-enters the runtime: all reporting happens inside settle().
      queue.push(task);
      dispatched.push(task);
    },

    bind(target) {
      runtime = target;
    },

    settle() {
      while (queue.length > 0) {
        if (runtime === undefined) {
          throw new Error("reference adapter: settle() called before bind()");
        }
        const task = queue[0];
        const result = fails(task)
          ? runtime.reportTask(task.runId, "failed", FAILURE_DETAIL)
          : runtime.reportTask(task.runId, "completed");
        if (!result.ok) {
          // A refused report (e.g. the runtime was halted between dispatch
          // and settle) ends the settle() call immediately, leaving the
          // refused task at the head for a later settle(). settle()
          // therefore always terminates.
          return;
        }
        queue.shift();
        // Completing a step may have enqueued the next dispatch; the loop
        // drains it in the same call.
      }
    },

    dispatched,
  };
}
