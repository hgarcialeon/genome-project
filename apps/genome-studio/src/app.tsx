/**
 * Studio — Governed Authoring (Milestone 1, checkpoint 2).
 *
 * Studio is a view and interaction layer. Everything it presents was produced
 * by the accepted compiler; everything it will execute will be produced by the
 * accepted runtime. The product hierarchy it is growing into is organization →
 * governance → execution → source; this checkpoint ships the source workspace,
 * the compiler's verdict on it, and the freshness invariant that the later
 * panels depend on.
 */

import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { CANONICAL_DOCUMENT, CANONICAL_DOCUMENT_NAME } from "./canonical.js";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel.js";
import { DocumentEditor } from "./components/DocumentEditor.js";
import { StatusBar } from "./components/StatusBar.js";
import {
  compileCurrent,
  editSource,
  openDocument,
  type CompilationState,
} from "./genome/compilation-state.js";

const DIAGNOSTICS_SUMMARY_ID = "diagnostics-summary";

/** Idle delay before the current source is compiled without being asked. */
export const DEFAULT_AUTO_COMPILE_DELAY_MS = 400;

export function App({ autoCompileDelayMs = DEFAULT_AUTO_COMPILE_DELAY_MS }: { autoCompileDelayMs?: number } = {}) {
  const [state, setState] = useState<CompilationState>(() => openDocument(CANONICAL_DOCUMENT));
  const [announcement, setAnnouncement] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

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

  const organization = state.lastSuccessful?.inspect.company;

  return (
    <div class="studio">
      <header class="studio__header">
        <p class="studio__product">Genome Studio</p>
        <h1 class="studio__organization" data-testid="organization-name">
          {organization?.name ?? "No organization compiled yet"}
        </h1>
        {organization?.mission !== undefined ? (
          <p class="studio__mission" data-testid="organization-mission">
            {organization.mission}
          </p>
        ) : null}
      </header>

      <section class="panel panel--state" aria-labelledby="state-heading">
        <h2 id="state-heading" class="panel__heading">
          Compilation state
        </h2>
        <StatusBar state={state} documentName={CANONICAL_DOCUMENT_NAME} />
      </section>

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

      <section class="panel panel--diagnostics">
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
      </section>

      <p class="visually-hidden" role="status" data-testid="locate-announcement">
        {announcement}
      </p>
    </div>
  );
}
