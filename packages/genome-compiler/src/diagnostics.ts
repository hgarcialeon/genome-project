export type CompileStage = "parse" | "schema" | "semantic";

export type Diagnostic = {
  stage: CompileStage;
  /** Semantic rule number (1–5 per RFC-0002 Stage 4) when applicable. */
  rule?: number;
  /** Dotted document path the diagnostic refers to, e.g. `workflows.build-feature.owner`. */
  path: string;
  message: string;
};
