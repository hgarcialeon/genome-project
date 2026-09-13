/**
 * The compiler boundary, as Studio sees it (RFC-0009 §3, Constitution
 * Principle 5).
 *
 * Every projection Studio renders comes from here, and everything here comes
 * from `@genome/compiler`. Studio parses no Genome semantics, derives no
 * revision, builds no graph, reconstructs no tree, and decides no policy: it
 * calls the accepted compiler and carries the result to the view.
 */

import {
  compile,
  graphTarget,
  inspectTarget,
  runtimeModelTarget,
  type Diagnostic,
  type OrganizationGraph,
} from "@genome/compiler";

export type CompiledDocument = {
  ok: true;
  /** Warnings only; error diagnostics fail the compile. */
  diagnostics: readonly Diagnostic[];
  revision: string;
  graph: OrganizationGraph;
  /** The Organization Graph projection, rendered as-is. */
  graphProjection: ReturnType<typeof graphTarget>;
  /** The inspect/tree projection, rendered as-is. */
  inspectProjection: ReturnType<typeof inspectTarget>;
  /** The runtime model the runtime executes. */
  runtimeModel: ReturnType<typeof runtimeModelTarget>;
};

export type FailedCompilation = {
  ok: false;
  stage: string;
  diagnostics: readonly Diagnostic[];
};

export type CompilationResult = CompiledDocument | FailedCompilation;

/** Compiles the current document. Never throws: failures arrive as diagnostics. */
export function compileDocument(source: string): CompilationResult {
  const result = compile(source);
  if (!result.ok) {
    return { ok: false, stage: result.stage, diagnostics: result.diagnostics };
  }
  return {
    ok: true,
    diagnostics: result.diagnostics,
    revision: result.graph.genomeRevision,
    graph: result.graph,
    graphProjection: graphTarget(result.graph),
    inspectProjection: inspectTarget(result.graph),
    runtimeModel: runtimeModelTarget(result.graph),
  };
}
