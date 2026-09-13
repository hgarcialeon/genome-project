/**
 * Studio — Governed Authoring (Milestone 1, checkpoint 3).
 *
 * The workspace reads organization first: the graph the compiler produced is
 * the centre of the product, the organization outline sits beside it, the
 * compiler's verdict on the current source sits with them, and the source
 * document itself is below — important, but not the identity of the product.
 *
 * Every projection on screen came from the accepted compiler, and none of them
 * is ever presented as describing a source it was not compiled from.
 */

import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { CANONICAL_DOCUMENT, CANONICAL_DOCUMENT_NAME, CANONICAL_WORKFLOW } from "./canonical.js";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel.js";
import { DocumentEditor } from "./components/DocumentEditor.js";
import { EventStream } from "./components/EventStream.js";
import { ExecutionPanel, type SessionView } from "./components/ExecutionPanel.js";
import { GraphIndex } from "./components/GraphIndex.js";
import { OrganizationGraph } from "./components/OrganizationGraph.js";
import { addAgentOpenerId, OrganizationTree, type AuthoringHandlers } from "./components/OrganizationTree.js";
import { StatusBar } from "./components/StatusBar.js";
import {
  compileCurrent,
  currentRevision,
  editSource,
  executableRuntimeModel,
  isStale,
  openDocument,
  type CompilationState,
} from "./genome/compilation-state.js";
import { grantApproval, runState, startSession, type StudioSession } from "./genome/session.js";

import { applyAddAgent, type AddAgentIntent } from "@genome/authoring";

import type { RuntimeEvent } from "@genome/runtime";

const DIAGNOSTICS_SUMMARY_ID = "diagnostics-summary";
const STALE_NOTE_ID = "projection-stale-note";

/** Idle delay before the current source is compiled without being asked. */
export const DEFAULT_AUTO_COMPILE_DELAY_MS = 400;

function StaleMark({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <p class="projection-stale" data-testid="projection-stale">
      <span class="projection-stale__mark" aria-hidden="true">
        ⧗
      </span>
      Last successful revision — not the source in the editor.
    </p>
  );
}

export function App({ autoCompileDelayMs = DEFAULT_AUTO_COMPILE_DELAY_MS }: { autoCompileDelayMs?: number } = {}) {
  const [state, setState] = useState<CompilationState>(() => openDocument(CANONICAL_DOCUMENT));
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [announcement, setAnnouncement] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);

  // The ephemeral session: in memory, discarded on reset or refresh. Nothing
  // here is written anywhere (RFC-0009 §4, Amendment 1).
  const [session, setSession] = useState<StudioSession | undefined>(undefined);
  const [events, setEvents] = useState<readonly RuntimeEvent[]>([]);
  const [refusal, setRefusal] = useState<{ workflowId: string; reason: string } | undefined>(undefined);
  const [grantRefusal, setGrantRefusal] = useState<string | undefined>(undefined);
  const [sessionAnnouncement, setSessionAnnouncement] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(CANONICAL_WORKFLOW);
  /**
   * Focus recovery, applied after the render that removes a control rather than
   * on a later frame: a keyboard user who moves on immediately must not have
   * focus pulled away underneath them.
   */
  const [focusTarget, setFocusTarget] = useState<"evidence" | "run" | undefined>(undefined);

  /**
   * The authoring interaction. Studio holds which department's form is open,
   * what was last added, and where focus should return — and nothing about
   * Genome document structure.
   */
  const [authoringDepartment, setAuthoringDepartment] = useState<string | undefined>(undefined);
  const [lastAdded, setLastAdded] = useState<{ department: string; id: string } | undefined>(undefined);
  const [authoringAnnouncement, setAuthoringAnnouncement] = useState("");
  const [authoringOpener, setAuthoringOpener] = useState<string | undefined>(undefined);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const [authoringFocus, setAuthoringFocus] = useState<"confirmation" | "opener" | undefined>(undefined);

  const compileNow = useCallback(() => {
    setState((previous) => compileCurrent(previous));
  }, []);

  const onInput = useCallback((source: string) => {
    setState((previous) => editSource(previous, source));
  }, []);

  // Inline validation: the current source is compiled once typing pauses. The
  // editing state in between is not cosmetic — it is the interval in which no
  // projection describes the source.
  useEffect(() => {
    if (state.status !== "editing") return undefined;
    const timer = setTimeout(compileNow, autoCompileDelayMs);
    return () => clearTimeout(timer);
  }, [state.status, state.source, autoCompileDelayMs, compileNow]);

  useEffect(() => {
    if (focusTarget === undefined) return;
    (focusTarget === "evidence" ? evidenceRef.current : runButtonRef.current)?.focus();
    setFocusTarget(undefined);
  }, [focusTarget]);

  // Focus after the authoring form closes, applied on the render that removes
  // it so a keyboard user is never left standing on a control that is gone.
  useEffect(() => {
    if (authoringFocus === undefined) return;
    const target =
      authoringFocus === "confirmation"
        ? confirmationRef.current
        : authoringOpener === undefined
          ? null
          : document.getElementById(addAgentOpenerId(authoringOpener));
    (target as HTMLElement | null)?.focus();
    setAuthoringFocus(undefined);
  }, [authoringFocus, authoringOpener]);

  const projection = state.lastSuccessful;
  const stale = isStale(state);
  const runnableModel = executableRuntimeModel(state);
  const workflows = runnableModel?.workflows ?? projection?.runtimeModel.workflows ?? [];

  const run = session === undefined ? undefined : runState(session);
  const view: SessionView | undefined =
    session === undefined ? undefined : { session, run, events, grantRefusal };

  const startRun = useCallback(() => {
    if (runnableModel === undefined) return;
    // Repeated activation replaces the session rather than accumulating one:
    // the previous subscription is disposed before another is created.
    setSession((previous) => {
      previous?.dispose();
      return undefined;
    });
    // Subscription happens inside startSession, before initiation, so no
    // emitted event can be missed. Events append for the life of the session:
    // the record after a grant continues the one from before it.
    setEvents([]);
    setGrantRefusal(undefined);
    const outcome = startSession({
      model: runnableModel,
      workflowId: selectedWorkflowId,
      onEvent: (event) => setEvents((previous) => [...previous, event]),
    });
    if (!outcome.ok) {
      setSession(undefined);
      setRefusal({ workflowId: selectedWorkflowId, reason: outcome.refusal.reason });
      setSessionAnnouncement(`The runtime refused to start ${selectedWorkflowId}: ${outcome.refusal.reason}.`);
      return;
    }
    setRefusal(undefined);
    setSession(outcome.session);
    const started = runState(outcome.session);
    setSessionAnnouncement(
      started?.status === "pending-approval"
        ? `${selectedWorkflowId} parked before any step ran, waiting for ${started.pendingApprovals.join(", ")}.`
        : `${selectedWorkflowId} is ${started?.status ?? "started"}.`,
    );
  }, [runnableModel, selectedWorkflowId]);

  /**
   * The explicit human grant. The runtime decides: Studio submits the
   * assertion and reports what came back, and the evidence the UI shows is the
   * event the runtime emitted, never the fact that a button was pressed.
   */
  const grant = useCallback(
    (principal: string) => {
      if (session === undefined) return;
      const outcome = grantApproval(session, principal);
      if (!outcome.ok) {
        setGrantRefusal(outcome.reason);
        setSessionAnnouncement(`The runtime refused the grant as ${principal}: ${outcome.reason}.`);
        return;
      }
      setGrantRefusal(undefined);
      const after = runState(session);
      // The activated control no longer exists — the runtime reports nothing
      // pending — so focus moves to the evidence it produced rather than being
      // stranded on a removed button.
      setFocusTarget("evidence");
      setSessionAnnouncement(
        after?.status === "completed"
          ? `${session.workflowId} completed ${after.completedSteps} steps after the approval by ${principal}.`
          : `Approval submitted as ${principal}. The run is ${after?.status ?? "updated"}.`,
      );
    },
    [session],
  );

  /**
   * The authoring operation, invoked with the intent the form collected.
   *
   * Studio does exactly two things with the result: on success it feeds the
   * returned source into the ordinary edit path — the same one a keystroke
   * takes — and on failure it hands the result back to the form to render.
   *
   * There is no authoring-specific compile path: the Checkpoint-2 state machine
   * marks the projections stale, and the existing debounced compile picks it up
   * like any other edit. Studio never touches the graph or the tree directly;
   * they change only when the compiler produces new output (RFC-0010 §9.1).
   */
  const submitAddAgent = useCallback(
    (intent: AddAgentIntent) => {
      const result = applyAddAgent(state.source, intent);
      if (!result.ok) return result;

      setState((previous) => editSource(previous, result.source));
      setAuthoringDepartment(undefined);
      setLastAdded({ department: intent.department, id: intent.id });
      setAuthoringAnnouncement(
        `Added ${intent.id} to ${intent.department}. The Genome source changed and the organization will recompile from it.`,
      );
      setAuthoringFocus("confirmation");
      return result;
    },
    [state.source],
  );

  const openAddAgent = useCallback((department: string) => {
    setAuthoringOpener(department);
    setLastAdded(undefined);
    setAuthoringDepartment(department);
  }, []);

  const cancelAddAgent = useCallback(() => {
    setAuthoringDepartment(undefined);
    setAuthoringFocus("opener");
  }, []);

  /**
   * Authoring is offered whenever there is an organization on screen. It is not
   * gated on the projection being current: the operation validates against the
   * source itself and refuses with a reason, which is better than a control that
   * disappears for 400 ms after every edit.
   */
  const authoring: Omit<AuthoringHandlers, "openDepartment"> = {
    onOpen: openAddAgent,
    onCancel: cancelAddAgent,
    onSubmit: submitAddAgent,
  };

  const resetSession = useCallback(() => {
    setSession((previous) => {
      previous?.dispose();
      return undefined;
    });
    setEvents([]);
    setRefusal(undefined);
    setGrantRefusal(undefined);
    setSessionAnnouncement("Session discarded.");
    setFocusTarget("run");
  }, []);

  return (
    <div class="studio">
      {/* The graph's accessible index is a long list of controls by design.
          These let a keyboard user step over it to the two places where work
          happens, rather than decoupling visual order from focus order. */}
      <nav class="skip-links" aria-label="Skip links">
        <a class="skip-link" href="#execution-panel">Skip to governance and execution</a>
        <a class="skip-link" href="#source-panel">Skip to the source document</a>
      </nav>

      <header class="studio__header">
        <p class="studio__product">Genome Studio</p>
        <h1 class="studio__organization" data-testid="organization-name">
          {projection?.inspect.company.name ?? "No organization compiled yet"}
        </h1>
        {projection?.inspect.company.mission !== undefined ? (
          <p class="studio__mission" data-testid="organization-mission">
            {projection.inspect.company.mission}
          </p>
        ) : null}
        <p id={STALE_NOTE_ID} class="visually-hidden">
          {stale
            ? "The organization shown is the last successful revision and does not describe the source currently in the editor."
            : "The organization shown was compiled from the source currently in the editor."}
        </p>
      </header>

      <p class="visually-hidden" role="status" data-testid="authoring-announcement">
        {authoringAnnouncement}
      </p>

      <div class="studio__workspace">
        <aside
          class={`panel panel--tree${stale ? " panel--stale" : ""}`}
          aria-labelledby="tree-heading"
          aria-describedby={STALE_NOTE_ID}
        >
          <StaleMark stale={stale} />
          {projection !== undefined ? (
            <OrganizationTree
              report={projection.inspect}
              headingId="tree-heading"
              authoring={{ ...authoring, openDepartment: authoringDepartment }}
              confirmationRef={confirmationRef}
              lastAdded={lastAdded}
            />
          ) : (
            <p data-testid="tree-empty">Nothing has compiled yet, so there is no organization to show.</p>
          )}
        </aside>

        <div class="studio__centre">
        <section
          class={`panel panel--graph${stale ? " panel--stale" : ""}`}
          aria-labelledby="graph-heading"
          aria-describedby={STALE_NOTE_ID}
        >
          <h2 id="graph-heading" class="panel__heading">
            Organization Graph
          </h2>
          <StaleMark stale={stale} />
          {projection !== undefined ? (
            <>
              <OrganizationGraph
                graph={projection.graph}
                stale={stale}
                selectedNodeId={selectedNodeId}
                onSelect={setSelectedNodeId}
                describedBy={STALE_NOTE_ID}
              />
              <GraphIndex
                graph={projection.graph}
                selectedNodeId={selectedNodeId}
                onSelect={setSelectedNodeId}
                headingId="graph-index-heading"
              />
            </>
          ) : (
            <p data-testid="graph-empty">Nothing has compiled yet, so there is no graph to show.</p>
          )}
        </section>

        <section class="panel panel--events">
          <EventStream events={events} headingId="events-heading" announcement={sessionAnnouncement} />
        </section>
        </div>

        <div class="studio__side">

        <aside
          id="execution-panel"
          class="panel panel--execution"
          aria-labelledby="execution-heading"
          tabIndex={-1}
        >
          <ExecutionPanel
            workflows={workflows}
            selectedWorkflowId={selectedWorkflowId}
            onSelectWorkflow={setSelectedWorkflowId}
            canRun={runnableModel !== undefined}
            runBlockedReason={
              stale
                ? "Nothing can run: the compiled revision is not the source in the editor. Compile the current source first."
                : "Nothing can run: this source has not compiled."
            }
            onRun={startRun}
            onReset={resetSession}
            onGrant={grant}
            evidenceRef={evidenceRef}
            runButtonRef={runButtonRef}
            view={view}
            startRefusal={refusal}
            sourceRevision={currentRevision(state)}
          />
        </aside>

        <aside class="panel panel--state" aria-labelledby="state-heading">
          <h2 id="state-heading" class="panel__heading">
            Compilation state
          </h2>
          <StatusBar state={state} documentName={CANONICAL_DOCUMENT_NAME} />
          <DiagnosticsPanel
            diagnostics={state.diagnostics}
            status={state.status}
            failedStage={state.failedStage}
            panelId={DIAGNOSTICS_SUMMARY_ID}
            onLocate={(diagnostic) => {
              editorRef.current?.focus();
              setAnnouncement(`Editor focused. The compiler reported this at ${diagnostic.path}.`);
            }}
          />
        </aside>
        </div>
      </div>

      <section id="source-panel" class="panel panel--source" aria-labelledby="source-heading" tabIndex={-1}>
        <h2 id="source-heading" class="panel__heading">
          Source document
        </h2>
        <DocumentEditor
          source={state.source}
          invalid={state.status === "invalid"}
          describedBy={DIAGNOSTICS_SUMMARY_ID}
          errorMessageId={DIAGNOSTICS_SUMMARY_ID}
          textareaRef={editorRef}
          onInput={onInput}
          onCompile={compileNow}
        />
      </section>

      <p class="visually-hidden" role="status" data-testid="locate-announcement">
        {announcement}
      </p>
    </div>
  );
}
