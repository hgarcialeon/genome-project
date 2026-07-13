export type CompileStage = "parse" | "schema" | "semantic";

export type DiagnosticSeverity = "error" | "warning";

export type Diagnostic = {
  stage: CompileStage;
  /** Defaults to `error` when absent. Warnings never fail a compile. */
  severity?: DiagnosticSeverity;
  /** Semantic rule number (1–5 per RFC-0002 Stage 4; 6 per RFC-0003/ADR-0004). */
  rule?: number;
  /** Dotted document path the diagnostic refers to, e.g. `workflows.build-feature.owner`. */
  path: string;
  message: string;
};

export const isWarning = (diagnostic: Diagnostic): boolean => diagnostic.severity === "warning";
