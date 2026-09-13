/**
 * `@genome/authoring` — semantic authoring operations (RFC-0010, ADR-0012).
 *
 * This package owns exactly one direction: **intent → source**.
 *
 * The compiler owns `source → meaning` and stays the semantic authority: this
 * package never re-implements a Genome rule, never re-words a compiler
 * diagnostic, and never derives a `genomeRevision`. It takes Genome source and a
 * declared organizational intent, and returns either new canonical Genome source
 * or a structured failure.
 *
 * Its single operation is `add-agent`, department-scoped. There is deliberately
 * no dispatcher and no operation language: a second operation is a governed
 * decision, not a parameter (RFC-0010 §2.5, §3.3).
 *
 * `yaml` is used internally to preserve the comments and formatting that the
 * compiler's canonical path discards at parse. It is an implementation choice,
 * not a public contract — no library object crosses this module's boundary.
 */

export {
  applyAddAgent,
  AUTONOMY_LEVELS,
  type AddAgentIntent,
  type AutonomyLevel,
  type AuthoringResult,
  type AuthoringSuccess,
  type AuthoringFailureResult,
  type AuthoringFailure,
  type InvalidSourceFailure,
  type InvalidIntentFailure,
  type ConflictFailure,
  type InvalidResultFailure,
  type IntentProblem,
  type ConflictProblem,
} from "./add-agent.js";
