/**
 * What the compiler said about the source in the editor.
 *
 * Diagnostics are rendered as the compiler produced them: its stage, its
 * severity, its dotted document path, its message. Studio adds no location it
 * was not given — the accepted diagnostics carry a document path, not a line
 * and column, so activating one moves focus to the editor and announces the
 * path rather than jumping to a position Studio would have had to invent by
 * parsing the document itself.
 */

import type { Diagnostic } from "@genome/compiler";

const severityOf = (diagnostic: Diagnostic): "error" | "warning" => diagnostic.severity ?? "error";

export function DiagnosticsPanel({
  diagnostics,
  status,
  failedStage,
  panelId,
  onLocate,
}: {
  diagnostics: readonly Diagnostic[];
  status: "current" | "editing" | "invalid";
  failedStage?: string;
  panelId: string;
  onLocate: (diagnostic: Diagnostic) => void;
}) {
  const errors = diagnostics.filter((diagnostic) => severityOf(diagnostic) === "error");
  const warnings = diagnostics.filter((diagnostic) => severityOf(diagnostic) === "warning");

  return (
    <section class="diagnostics" aria-labelledby="diagnostics-heading">
      <h2 id="diagnostics-heading" class="panel__heading">
        Diagnostics
      </h2>

      <p id={panelId} class="diagnostics__summary" data-testid="diagnostics-summary">
        {status === "editing"
          ? "Not compiled yet. Compile to see what the compiler says about this source."
          : errors.length === 0 && warnings.length === 0
            ? "The compiler accepted this source with no diagnostics."
            : `${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${
                warnings.length === 1 ? "" : "s"
              }${failedStage !== undefined ? ` — rejected at the ${failedStage} stage` : ""}.`}
      </p>

      {diagnostics.length > 0 ? (
        <ul class="diagnostics__list" data-testid="diagnostics-list">
          {diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.stage}:${diagnostic.path}:${index}`} class="diagnostic">
              <p class="diagnostic__head">
                <span class={`badge badge--${severityOf(diagnostic)}`} data-testid="diagnostic-severity">
                  <span aria-hidden="true">{severityOf(diagnostic) === "error" ? "✕" : "!"}</span>{" "}
                  {severityOf(diagnostic) === "error" ? "Error" : "Warning"}
                </span>
                <span class="diagnostic__stage">{diagnostic.stage} stage</span>
                {diagnostic.rule !== undefined ? (
                  <span class="diagnostic__rule">rule {diagnostic.rule}</span>
                ) : null}
              </p>
              <p class="diagnostic__message" data-testid="diagnostic-message">
                {diagnostic.message}
              </p>
              <p class="diagnostic__where">
                <span class="visually-hidden">Document path: </span>
                <code data-testid="diagnostic-path">{diagnostic.path}</code>
                <button
                  type="button"
                  class="button button--quiet"
                  onClick={() => onLocate(diagnostic)}
                  data-testid="diagnostic-locate"
                >
                  Show in editor
                  <span class="visually-hidden"> — {diagnostic.path}</span>
                </button>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
