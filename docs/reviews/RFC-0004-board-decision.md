# Architecture Board Decision — RFC-0004: Runtime Implementation (Phase 3)

- **Process:** `docs/GOVERNANCE.md` → Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer)
- **Date:** 2026-07-13
- **RFC:** RFC-0004 — Runtime Implementation (Phase 3)
- **Quorum:** 3/3

## Votes

| Role | Verdict |
|------|---------|
| Product Owner | Accept |
| Chief Architect | Accept with conditions |
| Lead Engineer | Accept with conditions |

**Outcome: Accepted with conditions — unanimous on substance.** Unlike
RFC-0002 and RFC-0003, this RFC arrived inside an already-fixed boundary
(ADR-0004) and proposed implementation semantics rather than new
architecture; the board found the semantics sound and the conditions
narrow. The conditions have been applied; RFC-0004 is marked **Accepted**
and its decisions recorded in `docs/adr/0005-runtime-execution-contract.md`.

## Resolution of the open questions

1. **The intrinsic supervised floor routes to `human:*`.** The Product
   Owner had preferred waiting for a language construct naming a
   supervising human, arguing a wildcard weakens accountability. Resolved
   2–1 for the wildcard: the Chief Architect ruled that deny-safety — at
   least one attributable human grant per supervised initiation — is the
   invariant the Constitution requires (Principle 9), while *routing* is an
   authorization-model concern the v0.1 language genuinely cannot express;
   waiting would leave supervised agents unimplementable for the whole
   phase. The grant is still fully attributable (`source: human:<id>`).
   The named-supervisor construct stays a named deferred spec item.
2. **Control events carry `runId: null`.** The Lead Engineer disposed of
   the alternatives: a sentinel string (`runId: "runtime"`) could collide
   with the run-id namespace and lies about being a correlation scope; a
   second envelope would fork the log and break the single-total-order
   contract RFC-0003's reconciliation rests on. Widening `runId` to
   `string | null` for the two control types only, before any consumer
   exists, changes the meaning of no shipped event.
3. **Halt suspends dispatch; it does not hard-fail in-flight runs.**
   Unanimous. Events are observations; a hard stop that emits
   `workflow.failed` for work that did not fail fabricates observations
   and poisons replay. Suspension is also the halt that composes with
   drain adoption — the operator can halt, adopt a fixed revision, and
   resume with attribution intact.
4. **Revision adoption emits no event.** The Product Owner initially
   wanted an adoption audit trail; withdrawn after the Chief Architect's
   distinction held: the log records what the organization *did* (each
   run's events carry the revision it ran under); which revisions were
   *made available* is deployment history, owned by the Genome's own
   version control, not by the runtime's observations.

## Conditions (applied)

1. **Replay must be forward-tolerant** (Chief Architect): the taxonomy is
   additive-only, so a v0.1 replayer handed a log containing event types
   added by a later RFC must treat them as inert, not crash. Recorded as a
   normative replay property.
2. **`human:*` is reserved** (Lead Engineer): the wildcard must never be
   declarable in a Genome document. Verified already enforced: semantic
   rule 4 rejects `*` as a human-principal identifier
   (`packages/genome-compiler/src/semantics/index.ts`); the reservation is
   now also stated in `SPEC/language.md` so the enforcement is
   specification, not accident.
3. **Refusals carry machine-readable reason codes** (Product Owner):
   refused operations append nothing to the log, so the refusal result is
   the only operator-facing signal; a bare boolean would make the runtime
   undebuggable. The refusal contract (`{ ok: false, reason: <code> }`) is
   now normative.

## Per-role review notes

### Product Owner
Confirmed the RFC ships exactly the Phase 3 roadmap deliverables (model
intake, agent lifecycle via the seam, workflow execution, human approval
stub, activity log) with nothing from Phases 4–6 smuggled in; the
trigger-executability resolution was scrutinized as a possible scope cut
and endorsed as the opposite — binding grammars without a scheduler or
ingress would be RFC-0002's plugin-target mistake again. Flagged that
"explicit initiation only" must be prominently documented as a v0.1
limitation, not a hidden surprise (applied to `SPEC/language.md`).

### Chief Architect (rulings)
- Q1 → wildcard floor, deny-safe invariant over routing precision.
- Q2 → nullable `runId` on control events only.
- Q3 → suspension; observations are never fabricated.
- Q4 → no adoption event; inputs are not observations.
- Endorsed the structural replay contract (`state()` derived from the log
  on every operation) as the mechanically-enforced form of Governance
  Rule 6 — the runtime *cannot* hold hidden run state, rather than
  *promising* not to. O(n²) accepted for the prototype; the contract, not
  the implementation strategy, is normative.
- Endorsed carrying `genomeRevision` on the Organization Graph as an
  additive extension of the RFC-0002 contract, required to keep the
  runtime model a pure function of the graph.

### Lead Engineer (feasibility)
- Verified the revision derivation is implementable exactly as specified
  (canonical JSON with sorted keys over the Stage 2 output; SHA-256), and
  that key-order-independence is testable.
- Verified every `RuntimeModel` field is derivable from the shipped graph:
  hierarchy from `belongs_to`, ownership from `owns`, governance from
  `requires`, principals from policy attributes — no compiler gap besides
  the revision itself.
- Caught that the draft's approval-request event for the intrinsic floor
  had no policy node to use as `source`; confirmed the RFC's answer (the
  initiating agent node) is attributable and unambiguous.
- Confirmed the ownerless-workflow refusal is the only new initiation
  precondition and matches the graph (owner is optional in the language;
  the runtime needs an assignee).
- Verified `run-<n>` counters, pending-approval sets, step indices, and
  the halted flag are all rebuildable from the taxonomy as specified —
  replay needs no out-of-log inputs.
