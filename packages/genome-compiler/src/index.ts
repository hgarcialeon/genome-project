/**
 * Genome Compiler (RFC-0002).
 *
 * Pipeline: Parse → Schema Validation → AST → Semantic Validation →
 * Organization Graph → Compilation Targets.
 *
 * Stages 1–2 are reused from `@genome/schema` (reuse contract, ADR-0003);
 * reimplementing parse or schema validation here is disallowed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createValidator, formatErrors, parseGenomeDocument } from "@genome/schema";

import { buildAst, type GenomeAst } from "./ast/index.js";
import type { CompileStage, Diagnostic } from "./diagnostics.js";
import { buildGraph, type OrganizationGraph } from "./graph/index.js";
import { validateSemantics } from "./semantics/index.js";

export * from "./ast/index.js";
export * from "./diagnostics.js";
export * from "./graph/index.js";
export * from "./semantics/index.js";
export * from "./targets/index.js";

// Canonical schema location (SPEC is the source of truth), resolved relative
// to this file so compilation works regardless of the working directory.
const DEFAULT_SCHEMA_PATH = fileURLToPath(new URL("../../../SPEC/schema/genome.schema.json", import.meta.url));

export type CompileOptions = {
  /** JSON Schema to validate against. Defaults to `SPEC/schema/genome.schema.json`. */
  schema?: object;
};

export type CompileSuccess = {
  ok: true;
  ast: GenomeAst;
  graph: OrganizationGraph;
  diagnostics: [];
};

export type CompileFailure = {
  ok: false;
  /** The stage that failed; later stages did not run. */
  stage: CompileStage;
  diagnostics: Diagnostic[];
  /** Present when the failure happened after the AST was built (semantic stage). */
  ast?: GenomeAst;
};

export type CompileResult = CompileSuccess | CompileFailure;

export function loadDefaultSchema(): object {
  return JSON.parse(readFileSync(DEFAULT_SCHEMA_PATH, "utf8"));
}

/**
 * Compile Genome YAML/JSON source into an AST and an Organization Graph.
 *
 * Never throws on invalid input: every failure is reported as diagnostics
 * tagged with the stage that produced them.
 */
export function compile(source: string, options: CompileOptions = {}): CompileResult {
  // Stage 1 — Parse (via @genome/schema).
  let document: unknown;
  try {
    document = parseGenomeDocument(source);
  } catch (error) {
    return {
      ok: false,
      stage: "parse",
      diagnostics: [
        {
          stage: "parse",
          path: "(root)",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  // Stage 2 — Schema validation (via @genome/schema).
  const schema = options.schema ?? loadDefaultSchema();
  const schemaResult = createValidator(schema)(document);
  if (!schemaResult.valid) {
    return {
      ok: false,
      stage: "schema",
      diagnostics: formatErrors(schemaResult.errors).map((message) => ({
        stage: "schema" as const,
        path: message.split(" ")[0] ?? "(root)",
        message,
      })),
    };
  }

  // Stage 3 — AST.
  const ast = buildAst(document);

  // Stage 4 — Semantic validation.
  const semanticDiagnostics = validateSemantics(ast);
  if (semanticDiagnostics.length > 0) {
    return { ok: false, stage: "semantic", diagnostics: semanticDiagnostics, ast };
  }

  // Stage 5 — Organization Graph.
  const graph = buildGraph(ast);

  return { ok: true, ast, graph, diagnostics: [] };
}
