/**
 * What the user is looking at, and whether it is current.
 *
 * Status is carried by text and a shape, never by colour alone (WCAG 2.2 AA,
 * 1.4.1). The revision is the compiler's; when it is not the current source's
 * revision it is labelled as the last successful one, so no reading of this bar
 * can suggest that a stale identity belongs to the text in the editor.
 */

import { currentRevision, isStale, type CompilationState } from "../genome/compilation-state.js";

const STATUS_TEXT: Record<CompilationState["status"], { mark: string; label: string; detail: string }> = {
  current: {
    mark: "✓",
    label: "Compiled",
    detail: "Everything below was compiled from the source you are looking at.",
  },
  editing: {
    mark: "●",
    label: "Edited — not compiled yet",
    detail: "The source changed. What is shown is the last successful revision, not this source.",
  },
  invalid: {
    mark: "✕",
    label: "Invalid — the compiler rejected this source",
    detail: "Diagnostics below describe the current source. Nothing here can run until they are resolved.",
  },
};

export function StatusBar({ state, documentName }: { state: CompilationState; documentName: string }) {
  const status = STATUS_TEXT[state.status];
  const revision = currentRevision(state);
  const stale = isStale(state);
  const runnable = state.status === "current";

  return (
    <div class="status-bar">
      <p class="status-bar__document">
        <span class="visually-hidden">Document: </span>
        {documentName}
      </p>

      <p class={`status status--${state.status}`} role="status" data-testid="compilation-status">
        <span class="status__mark" aria-hidden="true">
          {status.mark}
        </span>
        <span class="status__label">{status.label}</span>
      </p>

      <p class="status-bar__detail" data-testid="compilation-detail">
        {status.detail}
      </p>

      <dl class="status-bar__facts">
        <dt>Genome revision</dt>
        <dd data-testid="revision">
          {revision !== undefined ? (
            <code>{revision}</code>
          ) : state.lastSuccessful !== undefined ? (
            <>
              <span data-testid="revision-stale-label">Last successful revision (not this source): </span>
              <code>{state.lastSuccessful.revision}</code>
            </>
          ) : (
            "None — this source has never compiled."
          )}
        </dd>

        <dt>Execution</dt>
        <dd data-testid="run-readiness">
          {runnable
            ? "Ready to run the current revision."
            : stale
              ? "Not runnable: the last compiled revision is not this source."
              : "Not runnable: this source has not compiled."}
        </dd>
      </dl>

      {stale ? (
        <p class="stale-banner" data-testid="stale-banner">
          <span class="stale-banner__mark" aria-hidden="true">
            ⧗
          </span>
          Showing the last successful revision. It does not describe the source in the editor.
        </p>
      ) : null}
    </div>
  );
}
