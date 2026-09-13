/**
 * Governance and execution: what the organization requires, the explicit human
 * act, and what the runtime recorded.
 *
 * The three are deliberately separate on screen. A button that turns into the
 * word "Approved" teaches nothing; a requirement, an act, and the evidence the
 * runtime emitted are the product. Every fact below is read from accepted
 * output — `state()` for the run, the runtime's own `approval.requested` and
 * `approval.granted` events for what was asked and who answered — and the only
 * thing Studio contributes is the arrangement.
 */

import type { Ref } from "preact";

import { INTRINSIC_FLOOR_PRINCIPAL } from "@genome/runtime";

import { STUDIO_OPERATOR, type StudioSession } from "../genome/session.js";

import type { RuntimeEvent, RunState } from "@genome/runtime";
import type { RuntimeModel } from "@genome/compiler";

export type SessionView = {
  session: StudioSession;
  run?: RunState;
  events: readonly RuntimeEvent[];
  /** The runtime's refusal of the most recent grant, if it refused. */
  grantRefusal?: string;
};

const STATUS_TEXT: Record<string, { mark: string; label: string }> = {
  "pending-approval": { mark: "⏸", label: "Parked — waiting for approval" },
  running: { mark: "▶", label: "Running" },
  completed: { mark: "✓", label: "Completed" },
  failed: { mark: "✕", label: "Failed" },
};

/** Resolves an id the runtime reported to the label the same model declares. */
const policyLabel = (model: RuntimeModel, id: string): string | undefined =>
  model.policies.find((policy) => policy.id === id)?.policyId;

type PendingRequest = {
  eventId: number;
  /** The runtime's attribution for the request: a policy id, or the initiator for the intrinsic floor. */
  source: string;
  label?: string;
  principals: readonly string[];
  /** Those the runtime still reports as pending. */
  outstanding: readonly string[];
};

/**
 * The approval requests the runtime emitted, paired with what it still reports
 * as pending. Structurally plural: one card per request, one action per
 * outstanding principal, whatever their number.
 */
const pendingRequests = (view: SessionView): PendingRequest[] => {
  const stillPending = new Set(view.run?.pendingApprovals ?? []);
  return view.events
    .filter((event) => event.type === "approval.requested")
    .map((event) => {
      const principals = (event.payload.principals as string[] | undefined) ?? [];
      return {
        eventId: event.id,
        source: event.source,
        label: policyLabel(view.session.model, event.source),
        principals,
        outstanding: principals.filter((principal) => stillPending.has(principal)),
      };
    });
};

function WaitingSection({ view, requests }: { view: SessionView; requests: PendingRequest[] }) {
  return (
    <div class="waiting" data-testid="waiting">
      <h3 class="block__heading">
        <span class="block__kicker">Waiting</span> what the organization requires
      </h3>
      <p class="waiting__lead">
        Execution parked before any step ran. The runtime holds it until the required approval is granted — no timeout,
        no default, no inference.
      </p>

      <p class="waiting__principals">
        Approval required from:{" "}
        {(view.run?.pendingApprovals ?? []).map((principal) => (
          <code key={principal} class="principal" data-testid="required-principal">
            {principal}
          </code>
        ))}
      </p>

      <ul class="waiting__requests" data-testid="approval-requests">
        {requests.map((request) => (
          <li key={request.eventId}>
            <span class="waiting__requested-by">Requested by </span>
            {request.label !== undefined ? (
              <>
                policy <strong data-testid="approval-policy-label">{request.label}</strong>{" "}
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
        ))}
      </ul>
    </div>
  );
}

function ActionSection({
  view,
  requests,
  onGrant,
}: {
  view: SessionView;
  requests: PendingRequest[];
  onGrant: (principal: string) => void;
}) {
  const actionable = requests.flatMap((request) =>
    request.outstanding.map((principal) => ({ request, principal })),
  );

  return (
    <div class="action" data-testid="action">
      <h3 class="block__heading">
        <span class="block__kicker">Action</span> the explicit human grant
      </h3>

      <ul class="action__list">
        {actionable.map(({ request, principal }) => (
          <li key={`${request.eventId}:${principal}`}>
            {principal === INTRINSIC_FLOOR_PRINCIPAL ? (
              <p class="action__floor" data-testid="floor-principal-note">
                <code class="principal">{principal}</code> is the runtime's supervised floor: a concrete human
                principal must grant it. Studio does not choose one for you.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  class="button button--grant"
                  data-testid="grant-button"
                  data-principal={principal}
                  onClick={() => onGrant(principal)}
                >
                  Grant as {principal}
                </button>
                <span class="action__note">
                  {" "}
                  for{" "}
                  {request.label !== undefined ? (
                    <>
                      policy <strong>{request.label}</strong>{" "}
                    </>
                  ) : null}
                  <code>{request.source}</code>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      <p class="action__identity" data-testid="action-identity">
        Studio authenticates nobody. Initiating as <code>{view.session.initiatedBy}</code> and granting as the named
        principal are operator assertions, recorded by the runtime as stated.
      </p>

      {view.grantRefusal !== undefined ? (
        <p class="action__refusal" data-testid="grant-refusal">
          <span aria-hidden="true">✕ </span>
          The runtime refused that grant: <strong>{view.grantRefusal}</strong>. Nothing was approved.
        </p>
      ) : null}
    </div>
  );
}

function EvidenceSection({ view, evidenceRef }: { view: SessionView; evidenceRef?: Ref<HTMLDivElement> }) {
  const granted = view.events.filter((event) => event.type === "approval.granted");
  const run = view.run;
  const completed = run?.status === "completed";
  const failures = view.events.filter(
    (event) => event.type === "agent.task.failed" || event.type === "workflow.failed",
  );

  return (
    <div class="evidence" data-testid="evidence" tabIndex={-1} ref={evidenceRef}>
      <h3 class="block__heading">
        <span class="block__kicker">Evidence</span> what the runtime recorded
      </h3>

      {granted.length === 0 ? (
        <p class="evidence__none" data-testid="evidence-none">
          No approval has been granted. The runtime has recorded none.
        </p>
      ) : (
        <ul class="evidence__list" data-testid="granted-list">
          {granted.map((event) => (
            <li key={event.id} data-testid="granted-record">
              <span class="evidence__event">
                #{event.id} <code>approval.granted</code>
              </span>{" "}
              — granted by{" "}
              <code class="principal principal--granted" data-testid="granted-by">
                {event.source}
              </code>
              {typeof event.payload.principal === "string" ? (
                <span class="visually-hidden"> (principal {event.payload.principal})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {failures.length > 0 ? (
        <ul class="evidence__failures" data-testid="failure-records">
          {failures.map((event) => (
            <li key={event.id} data-testid="failure-record">
              <span class="evidence__event">
                #{event.id} <code>{event.type}</code>
              </span>{" "}
              — reported by <code>{event.source}</code>
              {typeof event.payload.step === "string" ? (
                <>
                  {" "}
                  at step <code>{event.payload.step}</code>
                </>
              ) : null}
              {typeof event.payload.detail === "string" ? <>: {event.payload.detail}</> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {run?.status === "failed" ? (
        <p class="evidence__failed" data-testid="failure-summary">
          <span aria-hidden="true">✕ </span>
          <strong>{view.session.workflowId}</strong> failed after {run.completedSteps} completed steps. The runtime
          recorded no completion, and Studio offers no retry the runtime does not have.
        </p>
      ) : null}

      {completed ? (
        <p class="evidence__completed" data-testid="completion-record">
          <span aria-hidden="true">✓ </span>
          <strong>{view.session.workflowId}</strong> completed {run?.completedSteps} steps under revision{" "}
          <code>{view.session.genomeRevision}</code>, initiated by <code>{view.session.initiatedBy}</code>.
        </p>
      ) : null}
    </div>
  );
}

export function ExecutionPanel({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  canRun,
  runBlockedReason,
  onRun,
  onReset,
  onGrant,
  view,
  startRefusal,
  sourceRevision,
  evidenceRef,
  runButtonRef,
}: {
  workflows: RuntimeModel["workflows"];
  selectedWorkflowId: string;
  onSelectWorkflow: (workflowId: string) => void;
  canRun: boolean;
  runBlockedReason?: string;
  onRun: () => void;
  onReset: () => void;
  onGrant: (principal: string) => void;
  view?: SessionView;
  /** The runtime's refusal of the last attempt to start, when no session exists. */
  startRefusal?: { workflowId: string; reason: string };
  /** Revision of the source now in the editor, or `undefined` while it is edited or invalid. */
  sourceRevision?: string;
  /** Focus lands here when the grant control it replaces disappears. */
  evidenceRef?: Ref<HTMLDivElement>;
  /** Focus returns here when a session is discarded. */
  runButtonRef?: Ref<HTMLButtonElement>;
}) {
  const run = view?.run;
  const status = run === undefined ? undefined : STATUS_TEXT[run.status];
  const requests = view === undefined ? [] : pendingRequests(view);
  const waiting = run?.status === "pending-approval";
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

        <button
          type="button"
          class="button"
          data-testid="run-workflow"
          onClick={onRun}
          disabled={!canRun}
          ref={runButtonRef}
        >
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

      {startRefusal !== undefined && view === undefined ? (
        <p class="execution__refusal" data-testid="start-refusal">
          <span aria-hidden="true">✕ </span>
          The runtime refused to start <strong>{startRefusal.workflowId}</strong>:{" "}
          <strong data-testid="start-refusal-reason">{startRefusal.reason}</strong>. Nothing ran, and nothing was
          recorded.
        </p>
      ) : null}

      {view === undefined ? (
        <p class="execution__idle" data-testid="session-idle">
          No session. Nothing has been executed in this page.
        </p>
      ) : (
        <div class="session" data-testid="session">
          <p class={`status status--${run?.status ?? "refused"}`} data-testid="session-status">
            <span class="status__mark" aria-hidden="true">
              {status?.mark ?? "•"}
            </span>
            <span class="status__label">{status?.label ?? run?.status}</span>
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
              This session belongs to the revision it started under. The document in the editor has changed since;
              granting acts on this session, never on the edited source.
            </p>
          ) : null}

          {waiting ? <WaitingSection view={view} requests={requests} /> : null}
          {waiting ? <ActionSection view={view} requests={requests} onGrant={onGrant} /> : null}
          <EvidenceSection view={view} evidenceRef={evidenceRef} />
        </div>
      )}
    </section>
  );
}
