/**
 * The runtime boundary, as Studio sees it (RFC-0009 §3/§4).
 *
 * A Studio session is an ephemeral, in-memory execution of one workflow
 * through the accepted runtime and the reference adapter. This module owns the
 * lifecycle — build the adapter and runtime, subscribe *before* anything can be
 * emitted, start the workflow, drive the adapter to quiescence, hand back what
 * the runtime reported, and forget all of it on disposal.
 *
 * It owns no Genome semantics. It does not decide whether an approval is
 * required, which principal must grant it, which policy caused a wait, whether
 * a run is parked, or what a step means: every one of those is read from the
 * runtime's own event stream and `state()`. It synthesizes no event, reorders
 * nothing, suppresses nothing, and persists nothing — there is no storage call
 * in this file, by design (RFC-0009 §11, ADR-0011).
 */

import { createReferenceAdapter, type ReferenceAdapter } from "@genome/adapter-reference";
import type { RuntimeModel } from "@genome/compiler";
import {
  createRuntime,
  type Runtime,
  type RuntimeEvent,
  type RunState,
} from "@genome/runtime";

/**
 * The operator identity Studio initiates runs as. The runtime requires an
 * initiating principal; Milestone 1 authenticates nobody, so this is an
 * operator assertion, shown in the UI rather than hidden (ADR-0008 §3).
 */
export const STUDIO_OPERATOR = "human:operator";

export type SessionRefusal = { reason: string };

export type StudioSession = {
  /** Runtime-assigned run id. */
  runId: string;
  /** The workflow identifier the runtime was asked to start. */
  workflowId: string;
  /**
   * The revision of the runtime model this session was created from. A session
   * belongs to it for its whole life: editing the document cannot move it.
   */
  genomeRevision: string;
  /** The principal the run was initiated as. */
  initiatedBy: string;
  /**
   * The accepted runtime model this session executes. Carried so the UI can
   * resolve ids the runtime reports (a policy node id, a workflow id) to the
   * labels that same model declares — a lookup in accepted output, never a
   * re-derivation.
   */
  model: RuntimeModel;
  runtime: Runtime;
  adapter: ReferenceAdapter;
  /** Stops the subscription and drops the session's runtime objects. */
  dispose: () => void;
};

export type StartOutcome =
  | { ok: true; session: StudioSession }
  | { ok: false; refusal: SessionRefusal; events: readonly RuntimeEvent[] };

/**
 * Starts a workflow and returns the live session.
 *
 * `onEvent` is subscribed before the run is initiated, so the record the UI
 * accumulates is the runtime's emission order from the first event onward.
 */
export function startSession({
  model,
  workflowId,
  onEvent,
  initiatedBy = STUDIO_OPERATOR,
}: {
  model: RuntimeModel;
  workflowId: string;
  onEvent: (event: RuntimeEvent) => void;
  initiatedBy?: string;
}): StartOutcome {
  const adapter = createReferenceAdapter({});
  const runtime = createRuntime({ model, adapter });
  adapter.bind(runtime);

  const seen: RuntimeEvent[] = [];
  const unsubscribe = runtime.subscribe((event) => {
    seen.push(event);
    onEvent(event);
  });

  const initiation = runtime.startWorkflow(workflowId, initiatedBy);
  if (!initiation.ok) {
    unsubscribe();
    return { ok: false, refusal: { reason: initiation.reason }, events: seen };
  }

  // Drive dispatched work to quiescence. A parked run has dispatched nothing,
  // so this is a no-op until an approval is granted (checkpoint 5).
  adapter.settle();

  return {
    ok: true,
    session: {
      runId: initiation.runId,
      workflowId,
      model,
      genomeRevision: model.genomeRevision,
      initiatedBy,
      runtime,
      adapter,
      dispose: unsubscribe,
    },
  };
}

/** The run as the runtime reports it. Studio reconstructs no run state. */
export function runState(session: StudioSession): RunState | undefined {
  return session.runtime.state().runs[session.runId];
}

/** Whether the runtime halted — read, never inferred. */
export function isHalted(session: StudioSession): boolean {
  return session.runtime.state().halted;
}
