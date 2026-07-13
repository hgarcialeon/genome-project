# ADR-0005: Runtime Execution Contract

## Status

Accepted

## Context

ADR-0004 fixed the runtime *boundary* and gated all runtime work on a
Phase 3 implementation RFC that would pin the `RuntimeModel` shape, trigger
executability, scheduling/ordering semantics, and the operator
emergency-stop story. RFC-0004 was drafted and accepted by the Architecture
Board on 2026-07-13 (`docs/reviews/RFC-0004-board-decision.md`). This ADR
records the resulting execution contract; it authorizes the two gated
implementation items (the runtime-model compiler target and
`packages/genome-runtime`).

## Decision

1. **Genome revision derivation.** A revision is the lowercase hex SHA-256
   of the canonical JSON serialization (object keys sorted lexicographically,
   array order preserved) of the schema-valid parsed document. The compiler
   computes it at Stage 5 and carries it as `genomeRevision` on the
   Organization Graph — an additive extension of the RFC-0002 graph
   contract, so the runtime model stays a pure function of the graph.
2. **`RuntimeModel` is normative and compiler-owned.** The target
   `runtimeModelTarget: (OrganizationGraph) => RuntimeModel` lives in
   `packages/genome-compiler`; the shape (RFC-0004) carries the hierarchy,
   agents and workflows with *resolved* deny-safe defaults (`autonomy` and
   `trigger` default to `manual`), `governedBy` derived from `requires`
   edges, principals as declared, and provider identifiers as
   uninterpreted data. Extension is additive-only within v0.1.
3. **All v0.1 initiation is explicit.** The runtime auto-initiates nothing.
   `event`/`schedule`/`webhook` triggers are carried intent with no
   executable binding; their binding grammars are deferred language work,
   each gated on the phase that consumes it, and must route through the
   same approval gate when they land.
4. **The log is the single total order.** Event `id` is a strictly
   increasing integer assigned on append; `timestamp` is informational.
   Execution is event-driven and non-preemptive; steps are sequential per
   run; there are no retries in v0.1 (a failed task fails its run).
5. **Approval-gate mechanics.** Required principals are the union over the
   workflow's governing policies plus, for an agent initiator, the agent's
   governing policies. `manual` agents may not initiate. The supervised
   intrinsic floor is the reserved wildcard principal `human:*`
   (grantable by any `human:<id>`, fully attributed), added only when no
   human principal is already required; `human:*` is never declarable in a
   Genome document. Approvals match by `runId`; one denial terminates the
   run (`policy.enforced`, then `workflow.failed`). Deny-safe throughout.
6. **Emergency stop is an event, not a setting.** `runtime.halted` /
   `runtime.resumed` are attributable control events emitted only by
   `human:<id>` principals; while halted the runtime dispatches nothing and
   refuses operations; in-flight adapter work reports after resume
   (disposable adapter state degrades to retry). Control events extend the
   taxonomy additively and carry `runId: null` (the ten RFC-0003 types keep
   a required `runId`). Durable pausing remains future Genome content.
7. **Replay is structural.** The runtime core holds no run state outside
   the log: `state()` is `replay(log)` on every operation, so
   reconstructibility (Governance Rule 6) holds by construction. Replay is
   forward-tolerant: unknown event types are inert. Compiled models are
   inputs, not observed state.
8. **Drain mechanics.** New initiations use the latest adopted model;
   every event of a run carries the revision it started under; adoption
   appends no event. `run-<n>` counters derive from the log.
9. **Refusals are structured.** Operations rejected by the gates append
   nothing and return `{ ok: false, reason: <machine-readable code> }` —
   the normative operator-facing signal for non-events.

## Consequences

- The two gated Implementation Queue items are authorized with concrete,
  testable acceptance criteria; runtime work proceeds from specification.
- The runtime core is provider-free and deterministic: injectable clock,
  log-derived state, synchronous operations — every contract above is
  assertable in tests, including `state() == replay(log)`.
- The v0.1 runtime cannot start work by itself; scheduler/selector/webhook
  machinery arrives only with the language constructs that make it
  expressible.
- `SPEC/language.md` gains: the revision-derivation algorithm, the
  `trigger` default and executability note, the `human:*` reservation, and
  the runtime-model entry in Compilation Targets.
