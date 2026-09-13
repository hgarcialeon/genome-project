/**
 * Governance and execution: what is running, what it is waiting for, and why.
 *
 * Every fact here is read from accepted output — the runtime's `state()` for
 * the run, its `approval.requested` events for what was asked and of whom, and
 * the runtime model the session was created from for the labels behind the ids.
 * Studio decides nothing about approval: if the runtime says a run is parked
 * with a pending principal, that is what appears; if it says nothing, nothing
 * appears.
 */

import { STUDIO_OPERATOR, type StudioSession } from "../genome/session.js";

import type { RuntimeEvent, RunState } from "@genome/runtime";
import type { RuntimeModel } from "@genome/compiler";

export type SessionView = {
  session: StudioSession;
  run?: RunState;
  events: readonly RuntimeEvent[];
  refusal?: string;
};

const STATUS_TEXT: Record<string, { mark: string; label: string }> = {
  "pending-approval": { mark: "⏸", label: "Parked — waiting for approval" },
  running: { mark: "▶", label: "Running" },
  completed: { mark: "✓", label: "Completed" },
  failed: { mark: "✕", label: "Failed" },
};

/** Approval requests the runtime emitted for this run, as it emitted them. */
const approvalRequests = (events: readonly RuntimeEvent[]) =>
  events
    .filter((event) => event.type === "approval.requested")
    .map((event) => ({
      /** The runtime attributes the request to its origin: a policy id, or the initiator for the intrinsic floor. */
      source: event.source,
      principals: (event.payload.principals as string[] | undefined) ?? [],
      eventId: event.id,
    }));

/** Resolves an id the runtime reported to the label the same model declares. */
const policyLabel = (model: RuntimeModel, id: string): string | undefined =>
  model.policies.find((policy) => policy.id === id)?.policyId;

export function ExecutionPanel({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  canRun,
  runBlockedReason,
  onRun,
  onReset,
  view,
  sourceRevision,
}: {
  workflows: RuntimeModel["workflows"];
  selectedWorkflowId: string;
  onSelectWorkflow: (workflowId: string) => void;
  canRun: boolean;
  runBlockedReason?: string;
  onRun: () => void;
  onReset: () => void;
  view?: SessionView;
  /** Revision of the source now in the editor, or `undefined` while it is edited or invalid. */
  sourceRevision?: string;
}) {
  const run = view?.run;
  const status = run === undefined ? undefined : STATUS_TEXT[run.status];
  const requests = view === undefined ? [] : approvalRequests(view.events);
  // The session belongs to the revision it started under. It diverges the
  // moment the editor no longer holds that revision's source — including while
  // the text is merely edited, when there is no current revision at all.
  const divergent = view !== undefined && sourceRevision !== view.session.genomeRevision;

  return (
    <section class="execution" aria-labelledby="execution-heading">
      <h2 id="execution-heading" class="panel__heading">
        Governance &amp; execution
      </h2>

      <div class="execution__controls">
        <label class="execution__label" for="workflow-select">
          Workflow
        </label>
        <select
          id="workflow-select"
          class="execution__select"
          data-testid="workflow-select"
          value={selectedWorkflowId}
          onChange={(event) => onSelectWorkflow((event.currentTarget as HTMLSelectElement).value)}
          disabled={workflows.length === 0}
        >
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.workflowId}>
              {workflow.workflowId} — {workflow.steps.length} steps
            </option>
          ))}
        </select>

        <button type="button" class="button" data-testid="run-workflow" onClick={onRun} disabled={!canRun}>
          Run workflow
        </button>

        {view !== undefined ? (
          <button type="button" class="button button--quiet" data-testid="reset-session" onClick={onReset}>
            Discard session
          </button>
        ) : null}
      </div>

      <p class="execution__run-note" data-testid="run-eligibility">
        {canRun
          ? `Runs the current revision as ${STUDIO_OPERATOR}. The session is ephemeral: a refresh discards it.`
          : (runBlockedReason ?? "Nothing can run right now.")}
      </p>

      {view === undefined ? (
        <p class="execution__idle" data-testid="session-idle">
          No session. Nothing has been executed in this page.
        </p>
      ) : (
        <div class="session" data-testid="session">
          <p class={`status status--${run?.status ?? "refused"}`} data-testid="session-status">
            <span class="status__mark" aria-hidden="true">
              {view.refusal !== undefined ? "✕" : (status?.mark ?? "•")}
            </span>
            <span class="status__label">
              {view.refusal !== undefined ? `Refused by the runtime: ${view.refusal}` : (status?.label ?? run?.status)}
            </span>
          </p>

          <dl class="session__facts">
            <dt>Workflow</dt>
            <dd data-testid="session-workflow">{view.session.workflowId}</dd>
            <dt>Run</dt>
            <dd data-testid="session-run-id">{view.session.runId}</dd>
            <dt>Initiated by</dt>
            <dd data-testid="session-initiator">{view.session.initiatedBy}</dd>
            <dt>Revision</dt>
            <dd data-testid="session-revision">
              <code>{view.session.genomeRevision}</code>
            </dd>
            <dt>Steps completed</dt>
            <dd data-testid="session-steps">{run?.completedSteps ?? 0}</dd>
          </dl>

          {divergent ? (
            <p class="session__divergent" data-testid="session-divergent">
              <span aria-hidden="true">⧗ </span>
              This session belongs to the revision it started under. The document in the editor has changed since.
            </p>
          ) : null}

          {run?.status === "pending-approval" ? (
            <div class="waiting" data-testid="waiting">
              <h3 class="panel__subheading">Waiting for approval</h3>
              <p class="waiting__lead">
                Execution parked before any step ran. The runtime holds it until the required approval is granted.
              </p>

              <p class="waiting__principals">
                Required principals:{" "}
                {run.pendingApprovals.map((principal) => (
                  <code key={principal} class="principal" data-testid="required-principal">
                    {principal}
                  </code>
                ))}
              </p>

              <ul class="waiting__requests" data-testid="approval-requests">
                {requests.map((request) => {
                  const label = policyLabel(view.session.model, request.source);
                  return (
                    <li key={request.eventId}>
                      <span class="waiting__requested-by">Requested by </span>
                      {label !== undefined ? (
                        <>
                          policy <strong data-testid="approval-policy-label">{label}</strong>{" "}
                        </>
                      ) : null}
                      <code data-testid="approval-source">{request.source}</code>
                      <span class="waiting__of">
                        , requiring{" "}
                        {request.principals.map((principal) => (
                          <code key={principal} class="principal" data-testid="approval-principal">
                            {principal}
                          </code>
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p class="waiting__deny-safe">
                No approval is inferred or issued automatically. Granting arrives in the next milestone increment.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
