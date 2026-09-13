/**
 * The `add-agent` operation (RFC-0010).
 *
 * Shape of the work, in order:
 *
 *   1. the input source must already compile          → `invalid-source`
 *   2. the intent must be well-formed                 → `invalid-intent`
 *   3. the intent must apply to *this* document       → `conflict`
 *   4. produce a candidate, preserving the document
 *   5. the candidate must compile                     → `invalid-result`
 *
 * Every Genome judgement in steps 1 and 5 is the compiler's, carried verbatim.
 * Steps 2 and 3 are the only ones this package owns, and they describe the
 * *operation* — never the language (RFC-0010 §4).
 */

import { compile, type Diagnostic } from "@genome/compiler";
import { parseDocument, type Document } from "yaml";

/**
 * The accepted autonomy levels, as `SPEC/language.md` defines them.
 *
 * Mirrored here only to reject a malformed *intent* before a document is built;
 * the compiler remains the authority and re-checks the candidate (step 5). An
 * omitted autonomy is never defaulted — absence is meaningful and deny-safe.
 */
export const AUTONOMY_LEVELS = ["manual", "supervised", "autonomous"] as const;

export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

/**
 * What the caller wants, in organizational terms.
 *
 * Only `department` and `id` are required, because an agent with neither a role
 * nor an autonomy level is a valid Genome agent today. Requiring more here would
 * make this package stricter than the language (RFC-0010 §2.2). A view may ask
 * for more; that is a product decision, not a semantic one.
 */
export type AddAgentIntent = {
  /** Id of an existing department: `departments.<department>`. */
  department: string;
  /** Id for the new agent: `departments.<department>.agents.<id>`. */
  id: string;
  role?: string;
  autonomy?: AutonomyLevel;
  skills?: readonly string[];
};

/** Why an intent is not well-formed. Describes the operation, never the language. */
export type IntentProblem =
  | { kind: "missing-department" }
  | { kind: "missing-id" }
  | { kind: "invalid-autonomy"; value: string; allowed: readonly string[] }
  | { kind: "invalid-role" }
  | { kind: "invalid-skills" };

/** Why a well-formed intent cannot apply to this document. */
export type ConflictProblem =
  | { kind: "unknown-department"; department: string }
  | { kind: "duplicate-agent"; department: string; id: string }
  | { kind: "departments-not-a-mapping" }
  | { kind: "agents-not-a-mapping"; department: string };

export type InvalidSourceFailure = {
  failure: "invalid-source";
  /** The compiler's own diagnostics, unchanged. */
  diagnostics: readonly Diagnostic[];
};

export type InvalidIntentFailure = {
  failure: "invalid-intent";
  /** Authoring-owned: never a compiler `Diagnostic` (RFC-0010 §4.2). */
  problems: readonly IntentProblem[];
};

export type ConflictFailure = {
  failure: "conflict";
  /** Authoring-owned: never a compiler `Diagnostic`. */
  problem: ConflictProblem;
};

export type InvalidResultFailure = {
  failure: "invalid-result";
  /** The compiler's own diagnostics, unchanged. */
  diagnostics: readonly Diagnostic[];
};

export type AuthoringFailure =
  | InvalidSourceFailure
  | InvalidIntentFailure
  | ConflictFailure
  | InvalidResultFailure;

export type AuthoringSuccess = { ok: true; source: string };

/**
 * A failure carries no `source` field at all — not the original, not the
 * candidate. `source` exists only on the `ok: true` branch, so reading it
 * without checking `ok` is a type error rather than a runtime surprise
 * (RFC-0010 §5).
 */
export type AuthoringFailureResult = { ok: false } & AuthoringFailure;

export type AuthoringResult = AuthoringSuccess | AuthoringFailureResult;

/**
 * Serialization settings under which the preservation contract holds.
 *
 * `lineWidth: 0` disables line folding. Without it the library re-wraps long
 * scalars, which displaces every line after them — enough to make an unrelated
 * mission statement reflow when an agent is added elsewhere. With it, the
 * canonical example round-trips byte-identically (RFC-0010 §6.4).
 */
const STRINGIFY_OPTIONS = { lineWidth: 0 } as const;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

function validateIntent(intent: AddAgentIntent): IntentProblem[] {
  const problems: IntentProblem[] = [];

  if (!isNonEmptyString(intent.department)) problems.push({ kind: "missing-department" });
  if (!isNonEmptyString(intent.id)) problems.push({ kind: "missing-id" });

  // Optional fields are never required — but a value that *is* supplied must be
  // usable, so a caller learns now rather than from a compiler error later.
  if (intent.role !== undefined && typeof intent.role !== "string") {
    problems.push({ kind: "invalid-role" });
  }
  if (intent.autonomy !== undefined && !(AUTONOMY_LEVELS as readonly string[]).includes(intent.autonomy)) {
    problems.push({
      kind: "invalid-autonomy",
      value: String(intent.autonomy),
      allowed: AUTONOMY_LEVELS,
    });
  }
  if (
    intent.skills !== undefined &&
    (!Array.isArray(intent.skills) || intent.skills.some((skill) => typeof skill !== "string"))
  ) {
    problems.push({ kind: "invalid-skills" });
  }

  return problems;
}

/**
 * The agent mapping to insert, carrying only what the intent declared.
 *
 * An omitted field is omitted from the document. In particular an omitted
 * `autonomy` is never written as `manual`: the language's deny-safe default is a
 * *default*, and materializing it would turn it into an assertion and change
 * what the document says (RFC-0010 §2.2).
 */
function agentValue(intent: AddAgentIntent): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  if (intent.role !== undefined) value.role = intent.role;
  if (intent.autonomy !== undefined) value.autonomy = intent.autonomy;
  if (intent.skills !== undefined) value.skills = [...intent.skills];
  return value;
}

/** Whether a path resolves to something that can hold keys. */
function mappingAt(document: Document, path: readonly string[]): "absent" | "mapping" | "other" {
  if (!document.hasIn(path)) return "absent";
  const node: unknown = document.getIn(path);
  if (node === null || node === undefined) return "absent";
  // A YAML mapping node, or a plain object once resolved.
  const hasItems = typeof node === "object" && "items" in (node as object);
  return hasItems || (typeof node === "object" && !Array.isArray(node)) ? "mapping" : "other";
}

/**
 * Adds one agent to a department, returning new canonical Genome source.
 *
 * Pure: performs no I/O, and never mutates the string it is given.
 */
export function applyAddAgent(source: string, intent: AddAgentIntent): AuthoringResult {
  // ---- 1. The document must already be valid ------------------------------
  // An operation is never applied to a document that does not compile, so every
  // later failure is attributable. The compiler decides; we do not re-check.
  const before = compile(source);
  if (!before.ok) {
    return { ok: false, failure: "invalid-source", diagnostics: before.diagnostics };
  }

  // ---- 2. The intent must be well-formed ----------------------------------
  const problems = validateIntent(intent);
  if (problems.length > 0) {
    return { ok: false, failure: "invalid-intent", problems };
  }

  // ---- 3. The intent must apply to this document --------------------------
  // Parsed a second time, as a document rather than as data: the compiler's
  // canonical path discards the comments and formatting we have to preserve.
  const document = parseDocument(source);

  if (mappingAt(document, ["departments"]) !== "mapping") {
    return { ok: false, failure: "conflict", problem: { kind: "departments-not-a-mapping" } };
  }

  const departmentPath = ["departments", intent.department];
  if (mappingAt(document, departmentPath) === "absent") {
    // Department-scoped only: no fallback to teams, no creation, no inference.
    return {
      ok: false,
      failure: "conflict",
      problem: { kind: "unknown-department", department: intent.department },
    };
  }

  const agentsPath = [...departmentPath, "agents"];
  const agentsState = mappingAt(document, agentsPath);
  if (agentsState === "other") {
    return {
      ok: false,
      failure: "conflict",
      problem: { kind: "agents-not-a-mapping", department: intent.department },
    };
  }

  // Uniqueness is scoped to this mapping alone. Genome defines no cross-scope
  // agent-id uniqueness — the same id in another department, or in a team
  // beneath this one, is valid and must not be refused (RFC-0010 §2.4).
  // Checked *before* writing: a duplicate key would otherwise fail at parse and
  // surface YAML mechanics to someone who asked to add a colleague.
  if (agentsState === "mapping" && document.hasIn([...agentsPath, intent.id])) {
    return {
      ok: false,
      failure: "conflict",
      problem: { kind: "duplicate-agent", department: intent.department, id: intent.id },
    };
  }

  // ---- 4. Produce the candidate -------------------------------------------
  document.setIn([...agentsPath, intent.id], agentValue(intent));
  const candidate = document.toString(STRINGIFY_OPTIONS);

  // ---- 5. The candidate must compile --------------------------------------
  // The compiler is the authority. Nothing here re-derives a cross-reference
  // rule; we produce a document and ask.
  const after = compile(candidate);
  if (!after.ok) {
    return { ok: false, failure: "invalid-result", diagnostics: after.diagnostics };
  }

  return { ok: true, source: candidate };
}
