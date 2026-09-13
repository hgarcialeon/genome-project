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
import { OrganizationTree } from "./components/OrganizationTree.js";
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
import { runState, startSession, type StudioSession } from "./genome/session.js";

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

  // The ephemeral session: in memory, discarded on reset or refresh. Nothing
  // here is written anywhere (RFC-0009 §4, Amendment 1).
  const [session, setSession] = useState<StudioSession | undefined>(undefined);
  const [events, setEvents] = useState<readonly RuntimeEvent[]>([]);
  const [refusal, setRefusal] = useState<string | undefined>(undefined);
  const [sessionAnnouncement, setSessionAnnouncement] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(CANONICAL_WORKFLOW);

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

  const projection = state.lastSuccessful;
  const stale = isStale(state);
  const runnableModel = executableRuntimeModel(state);
  const workflows = runnableModel?.workflows ?? projection?.runtimeModel.workflows ?? [];

  const run = session === undefined ? undefined : runState(session);
  const view: SessionView | undefined =
    session === undefined ? undefined : { session, run, events, refusal };

  const startRun = useCallback(() => {
    if (runnableModel === undefined) return;
    // Subscription happens inside startSession, before initiation, so no
    // emitted event can be missed.
    const collected: RuntimeEvent[] = [];
    const outcome = startSession({
      model: runnableModel,
      workflowId: selectedWorkflowId,
      onEvent: (event) => collected.push(event),
    });
    setEvents(collected);
    if (!outcome.ok) {
      setSession(undefined);
      setRefusal(outcome.refusal.reason);
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

  const resetSession = useCallback(() => {
    setSession((previous) => {
      previous?.dispose();
      return undefined;
    });
    setEvents([]);
    setRefusal(undefined);
    setSessionAnnouncement("Session discarded.");
  }, []);

  return (
    <div class="studio">
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

      <div class="studio__workspace">
        <aside
          class={`panel panel--tree${stale ? " panel--stale" : ""}`}
          aria-labelledby="tree-heading"
          aria-describedby={STALE_NOTE_ID}
        >
          <StaleMark stale={stale} />
          {projection !== undefined ? (
            <OrganizationTree report={projection.inspect} headingId="tree-heading" />
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

        <aside class="panel panel--execution" aria-labelledby="execution-heading">
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
            view={view}
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

      <section class="panel panel--source" aria-labelledby="source-heading">
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
