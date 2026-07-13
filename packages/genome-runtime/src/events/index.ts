/**
 * Genome runtime event contract — the dependency-free events module
 * (RFC-0003/ADR-0004: types only, importing nothing, so extraction into a
 * shared package when the first non-runtime consumer appears is mechanical).
 *
 * The envelope and taxonomy are normative for v0.1; extension is
 * additive-only. `runtime.halted`/`runtime.resumed` are the RFC-0004
 * control-event extension: runtime-scoped, so they carry `runId: null`;
 * the ten RFC-0003 types always carry a run id.
 */

/** Run-scoped event types (RFC-0003 taxonomy v0.1, normative). */
export const RUN_EVENT_TYPES = [
  "workflow.started",
  "workflow.completed",
  "workflow.failed",
  "agent.task.assigned",
  "agent.task.completed",
  "agent.task.failed",
  "approval.requested",
  "approval.granted",
  "approval.denied",
  "policy.enforced",
  "genome.proposal.created", // payload reserved until the Phase 6 RFC
] as const;

/** Runtime-scoped control events (RFC-0004, additive extension). */
export const CONTROL_EVENT_TYPES = ["runtime.halted", "runtime.resumed"] as const;

export const EVENT_TYPES = [...RUN_EVENT_TYPES, ...CONTROL_EVENT_TYPES] as const;

export type RunEventType = (typeof RUN_EVENT_TYPES)[number];
export type ControlEventType = (typeof CONTROL_EVENT_TYPES)[number];
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * The normative v0.1 event envelope (RFC-0003).
 *
 * `type` is a string, not `EventType`: the taxonomy is additive-only, so
 * consumers (replay above all) must tolerate types added by later RFCs.
 */
export type RuntimeEvent = {
  /** Strictly increasing integer assigned on append; log order is THE order. */
  id: number;
  /** Informational only; never used for ordering (RFC-0004). */
  timestamp: string;
  /** The Genome revision this event executed under (1:1 with the runtime model). */
  genomeRevision: string;
  /** Correlation scope of the run; `null` only on control events. */
  runId: string | null;
  /** Graph node id (e.g. `agent:engineering.platform.backend`) or `human:<id>`. */
  source: string;
  type: string;
  /** Type-specific, provider-neutral. */
  payload: Record<string, unknown>;
};

export const HUMAN_PRINCIPAL_PREFIX = "human:";

/**
 * The reserved wildcard principal for the supervised intrinsic approval
 * floor (RFC-0004): grantable by any `human:<id>`, never declarable in a
 * Genome document, and never itself a valid actor.
 */
export const INTRINSIC_FLOOR_PRINCIPAL = "human:*";

/** A concrete, attributable human principal (`human:<id>`, not the reserved wildcard). */
export const isHumanPrincipal = (principal: string): boolean =>
  principal.startsWith(HUMAN_PRINCIPAL_PREFIX) && principal !== INTRINSIC_FLOOR_PRINCIPAL;
