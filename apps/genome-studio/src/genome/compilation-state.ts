/**
 * Studio's compilation state (RFC-0009 §3; Product Owner constraint 2).
 *
 * This module owns one UI lifecycle question — *is what the user is looking at
 * current?* — and no Genome-domain question. It never parses, validates,
 * derives, or interprets: it calls the accepted compiler through
 * `compileDocument` and records which source text the result came from.
 *
 * The invariant, enforced by construction:
 *
 *   a projection is CURRENT only if it was produced from exactly the source
 *   text now in the editor.
 *
 * Everything else follows from it: an edit makes the last projection stale
 * immediately, a failed compile never restores currency, and nothing stale is
 * executable.
 */

import { compileDocument, type CompilationResult, type CompiledDocument } from "./compilation.js";

import type { Diagnostic } from "@genome/compiler";

/** A successful compilation, tied to the exact source text that produced it. */
export type Projection = {
  /** The source text this projection was compiled from. */
  source: string;
  revision: string;
  graph: CompiledDocument["graphProjection"];
  inspect: CompiledDocument["inspectProjection"];
  runtimeModel: CompiledDocument["runtimeModel"];
  /** Warnings the compiler reported for this source. */
  diagnostics: readonly Diagnostic[];
};

export type CompilationStatus =
  /** The editor text is exactly the text the last successful compile used. */
  | "current"
  /** The editor text changed since the last compile; nothing has been compiled from it yet. */
  | "editing"
  /** The editor text was compiled and the compiler rejected it. */
  | "invalid";

export type CompilationState = {
  source: string;
  status: CompilationStatus;
  /** Diagnostics for the *current* source. Empty while editing. */
  diagnostics: readonly Diagnostic[];
  /** The stage that rejected the current source, when invalid. */
  failedStage?: string;
  /** The last projection the compiler produced, whatever the current source is. */
  lastSuccessful?: Projection;
};

const projectionOf = (source: string, compiled: CompiledDocument): Projection => ({
  source,
  revision: compiled.revision,
  graph: compiled.graphProjection,
  inspect: compiled.inspectProjection,
  runtimeModel: compiled.runtimeModel,
  diagnostics: compiled.diagnostics,
});

const settle = (source: string, result: CompilationResult, previous?: Projection): CompilationState =>
  result.ok
    ? {
        source,
        status: "current",
        diagnostics: result.diagnostics,
        lastSuccessful: projectionOf(source, result),
      }
    : {
        source,
        status: "invalid",
        diagnostics: result.diagnostics,
        failedStage: result.stage,
        lastSuccessful: previous,
      };

/** Opens a document and compiles it once, so the user starts from evidence. */
export function openDocument(source: string): CompilationState {
  return settle(source, compileDocument(source));
}

/**
 * Records an edit. The last projection survives for continuity but stops being
 * current the moment the text differs from the text it was compiled from.
 * Typing the previous text back restores currency without a recompile, because
 * the invariant is about the text, not about the sequence of edits.
 */
export function editSource(state: CompilationState, source: string): CompilationState {
  if (state.lastSuccessful !== undefined && state.lastSuccessful.source === source) {
    return {
      source,
      status: "current",
      diagnostics: state.lastSuccessful.diagnostics,
      lastSuccessful: state.lastSuccessful,
    };
  }
  return { source, status: "editing", diagnostics: [], lastSuccessful: state.lastSuccessful };
}

/** Compiles the current source through the accepted compiler. */
export function compileCurrent(state: CompilationState): CompilationState {
  return settle(state.source, compileDocument(state.source), state.lastSuccessful);
}

/**
 * True when a projection is being shown that the current source did not
 * produce. Stale projections stay inspectable; they never read as current.
 */
export function isStale(state: CompilationState): boolean {
  return state.status !== "current" && state.lastSuccessful !== undefined;
}

/** The revision of the current source, or `undefined` when nothing current exists. */
export function currentRevision(state: CompilationState): string | undefined {
  return state.status === "current" ? state.lastSuccessful?.revision : undefined;
}

/**
 * The runtime model the runtime may execute — only ever one produced by the
 * source now in the editor. A stale or invalid document has nothing runnable,
 * and the last valid model is never silently substituted for it.
 */
export function executableRuntimeModel(state: CompilationState): Projection["runtimeModel"] | undefined {
  return state.status === "current" ? state.lastSuccessful?.runtimeModel : undefined;
}
