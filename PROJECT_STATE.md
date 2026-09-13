# Genome Project State

Last Updated: 2026-09-13

This file is the **only** source for current project state (Governance
Rule 8). Other documents point here; none may restate what this file owns.
Consistency with the repository is checked by `pnpm check-state` in CI.

## Current Phase

Phase 4 — Studio Prototype: **Open for Milestone 1 — Governed Authoring — only**
(opened 2026-07-18). Phases 0–3 are closed: Phases 0–2 by the 2026-07-13 phase
transition review (`docs/reviews/phase-0-3-board-review.md`), Phase 3 by the
Phase 3 close review the same day (`docs/reviews/phase-3-close-board-review.md`,
Option B ratified by the Product Owner) on CLI-boundary evidence, with
the RFC-0006 case-4 erratum applied first. Phase 4 was opened by the acceptance
and Product Owner ratification of `RFC/0009-phase-4-governed-authoring.md`
(**Accepted 2026-07-18 under Option B** — accept with four clarifying amendments
applied; Board review `docs/reviews/rfc-0009-board-review.md`, Product Owner
ratification recorded there; Governance Rule 2). The opening authorizes
**Milestone 1 (Governed Authoring) only**; the remaining Phase 4 deliverable that
carries an architecture gate (durable runtime logs) stays a later milestone,
unopened. Event persistence remains assigned to a later phase, gated on the first
consumer requiring a durable log.

## Current Iteration

No formal sprint cadence. Work proceeds RFC-by-RFC through
`IMPLEMENTATION_QUEUE.md`. No implementation iteration is active: the
RFC-0007 implementation item landed, was drained, and RFC-0007 was
**closed complete 2026-07-15** by the Board's implementation closure
review (Option A, `docs/reviews/rfc-0007-implementation-close-review.md`).
The Level 1 self-hosting RFC — commissioned 2026-07-15
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`), drafted as
`RFC/0008-self-hosting-example.md` — was **accepted 2026-07-15 under Option B**
(`docs/reviews/rfc-0008-board-review.md`, Product Owner ratification; the five
Board open-question dispositions folded into the RFC). Acceptance added one
engineering item to `IMPLEMENTATION_QUEUE.md`: the descriptive/evidentiary
self-hosting example plus its additive CLI-boundary evidence. That item
**landed and was drained 2026-07-15**: `SPEC/examples/genome-project.yaml`
ships as the single canonical, structure-only example, its nine evidence cases
E1–E9 pass uncached at the CLI boundary, and the seven protected boundaries
held as empty diffs. RFC-0008 was **closed complete 2026-07-18** by the Board's
implementation closure review (Option A,
`docs/reviews/rfc-0008-implementation-close-review.md`, Product Owner
ratification) on evidence re-executed uncached at merged `main`. The Phase 4
opening RFC `RFC/0009-phase-4-governed-authoring.md` was **accepted 2026-07-18
under Option B** (`docs/reviews/rfc-0009-board-review.md`, Product Owner
ratification), opening Phase 4 for Milestone 1 and adding exactly one engineering
item to `IMPLEMENTATION_QUEUE.md` — the **Studio Milestone 1 — Governed
Authoring** implementation. The current implementation iteration is that
Milestone-1 item, now **In Progress**: the authorized compiler-portability work
and Studio implementation checkpoints 1–6 have landed on `main`, and the
milestone is **awaiting Product Owner acceptance**. It is not complete, not
drained, and Phase 4 is not closed.

## Current Milestone

The RFC-0008 queue item (the single canonical, structure-only
`SPEC/examples/genome-project.yaml` — agent-scoped `queue-discipline`,
top-of-file non-normative marking — plus the additive E1–E9 CLI-boundary
evidence) is **implemented and drained** (2026-07-15) against its acceptance
criteria in `IMPLEMENTATION_QUEUE.md` and `RFC/0008-self-hosting-example.md`,
within the seven pinned protected boundaries (all held as empty diffs: schema,
compiler-production, runtime-production, CLI-surface, and event-taxonomy, plus
no exported-log reader and no persistence). E1–E9 pass uncached at the CLI
boundary; the example doubles as a standing regression witness for RFC-0007
participation binding (E3/E7). RFC-0008 was **closed complete 2026-07-18**
(Option A, `docs/reviews/rfc-0008-implementation-close-review.md`). The active
milestone is now **Studio Milestone 1 — Governed Authoring**, authorized by the
acceptance of `RFC/0009-phase-4-governed-authoring.md` (Option B, 2026-07-18) and
queued as a single **In Progress** item in `IMPLEMENTATION_QUEUE.md`. Its scope is
fixed by the accepted (amended) RFC: a Studio surface providing a code editor,
inline validation, a live Organization Graph, an organization tree, ephemeral
governed execution, a live session event stream, deny-safe park, explicit grant,
attributed approval, and completion — demonstrated on
`SPEC/examples/genome-project.yaml` via `rfc-lifecycle` — built strictly as a
projection/interaction layer (Principle 5) with the nine protected boundaries
held. Close requires uncached executable conformance **and** a recorded
reviewer-walkthrough product-acceptance record (RFC-0009 §14, Amendment 4).
Implementation checkpoints 1–6 landed on `main` 2026-09-13 (scaffold; editor,
diagnostics and compilation state; graph and tree projections; ephemeral runtime
and live event stream; explicit grant and attributed completion; accessibility
and error-recovery hardening), preceded by the authorized compiler-portability
work (ADR-0011) in its ratified order — goldens frozen, platform-neutral change,
permanent Node ↔ browser conformance harness. Checkpoint 7 prepared the
end-to-end product evidence and the acceptance record
`docs/reviews/phase-4-m1-product-acceptance.md`. **The milestone is awaiting
Product Owner acceptance: the disposition is PENDING, the milestone is not
complete, the queue item is not drained, and Phase 4 is not closed.**
The prior RFC-0007 queue item was **implemented, drained, and closed**
(2026-07-15) by the Board's implementation closure review
(`docs/reviews/rfc-0007-implementation-close-review.md`, Option A).

## Current Objective

Execute the adopted **Option A ("Trust first") of
`docs/PRODUCT_STRATEGY.md`** (adopted 2026-07-14). Its first act is
**complete and closed**: **RFC-0007 — Executor-Scoped Policies** was
accepted 2026-07-14 under Option A with the five amendments applied
(`docs/reviews/rfc-0007-board-review.md`, Product Owner ratification
recorded there; `docs/adr/0009-participation-scoped-policies.md`); its
implementation landed and drained to the amended Definition of Done — the
nine evidence cases passing uncached, the protected boundaries held — and
RFC-0007 was **closed complete 2026-07-15** by the Board's implementation
closure review (Option A ratified,
`docs/reviews/rfc-0007-implementation-close-review.md`). The severable
dispositions that followed were ratified by the Product Owner 2026-07-15
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`): the
specification-maintenance (erratum) mechanism is adopted as a
governance-process decision (`docs/adr/0010-erratum-mechanism.md`,
`docs/ERRATA.md`); the Level 1 self-hosting RFC is commissioned, drafted, and
**accepted 2026-07-15 under Option B** (`RFC/0008-self-hosting-example.md`,
`docs/reviews/rfc-0008-board-review.md`), placing one descriptive/evidentiary
example item on the queue that **landed and drained 2026-07-15**
(`SPEC/examples/genome-project.yaml` plus additive E1–E9 evidence, the seven
protected boundaries held as empty diffs) and was **closed complete 2026-07-18**
(Option A, `docs/reviews/rfc-0008-implementation-close-review.md`); Level 2
(durable exported-log records) is deferred under the persistence gate; and Level
3 (operative governance) is deferred to Phase 6. Two Product Owner product/
strategy dispositions have since been recorded (both 2026-07-18): **Governed
Authoring** was adopted as Phase 4's planned opening experience
(`docs/reviews/phase-4-planning-packet-amendment.md`, Option A), superseding the
2026-07-15 Candidate C — Edit-and-see disposition as the *planned* milestone; and
**Option B — Autonomy First** was adopted as strategic sequencing direction
(`docs/proposals/roadmap-revision.md`), keeping Phase 4 next and opening with
Governed Authoring, then prioritizing the autonomy spine ahead of a standalone
Office View phase. Neither disposition opened a phase, commissioned an RFC, added
a queue item, or modified `ROADMAP.md`/`docs/PRODUCT_STRATEGY.md`. On that basis
the **Phase 4 opening RFC** `RFC/0009-phase-4-governed-authoring.md` was
commissioned, drafted, Board-reviewed, and **accepted 2026-07-18 under Option B**
(accept with four clarifying amendments applied;
`docs/reviews/rfc-0009-board-review.md`, Product Owner ratification). That
acceptance **opened Phase 4 for Milestone 1 — Governed Authoring — only** and
added one implementation item to `IMPLEMENTATION_QUEUE.md`. **The current
objective is to implement Studio Milestone 1 (Governed Authoring)** to the
accepted RFC's Definition of Done — a projection/interaction layer over the
shipped compiler targets and the ephemeral runtime event stream (Principle 5),
with the nine protected boundaries held and a recorded product-acceptance
walkthrough required to close. That implementation is **In Progress**:
checkpoints 1–6 have landed and the Checkpoint-7 acceptance evidence is prepared
in `docs/reviews/phase-4-m1-product-acceptance.md`, whose Product Owner
disposition is **PENDING**. Only Milestone 1 is authorized. Re-sequencing `ROADMAP.md` per adopted Option B was
**performed 2026-09-12** (Product Owner direction) as the separate ratified act
that disposition reserved: the autonomy substrate now holds the Phase 5 slot,
Self-Improvement remains Phase 6, and Office View is recorded as a future
capability whose placement is governed separately — not cancelled, not
de-scoped. The reconciliation commissioned nothing and changed no gate.

## Active Architectural Decision

**Decided 2026-09-13: browser portability of the accepted Genome revision
derivation.** No architectural decision is open. The decision was required by the
browser-first topology recorded in the Milestone-1 acceptance floor
(`IMPLEMENTATION_QUEUE.md`). The Milestone-1
browser-compatibility spike established that `packages/genome-compiler` cannot be
bundled for a browser as it stands — `node:crypto` is exercised on the canonical
compilation path, `node:fs` and `node:url` are inert but must still resolve — and
that no view-side fix is acceptable (Constitution Principles 2 and 5; RFC-0009
§3). Making the compiler platform-neutral crosses the RFC-0009 §11 protected
boundary "no production diff under `packages/genome-compiler/src`", which §11
answers with a return to the Board. The Board review
`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md` (evidence
independently re-executed uncached; three options) recommended Option A, and the
Product Owner **ratified Option A on 2026-09-13** — a **one-time
protected-boundary implementation authorization for Milestone 1 only**, recorded
verbatim in that review. The accepted architectural property is recorded as
`docs/adr/0011-platform-neutral-compiler.md`: revision derivation stays
exclusively compiler-owned and normatively unchanged, `compile` stays
synchronous, callers cannot inject the algorithm, the compiler's canonical path
becomes platform-neutral, and views consume compiler-owned identity instead of
reproducing it. The authorization amends no RFC-0009 semantics, authorizes no
broader compiler redesign, and gives Studio no ownership of the derivation; the
review's stop conditions return the work to the Board if it is exceeded.

Previously decided and unchanged: `RFC/0009-phase-4-governed-authoring.md` — the Phase 4 opening RFC
defining the Studio boundary (strategy move A3) and scoping the Governed
Authoring Milestone 1 — was **accepted 2026-07-18 under Option B** (accept with
four clarifying amendments applied; `docs/reviews/rfc-0009-board-review.md`, every
material claim re-executed uncached and confirmed, Product Owner ratification
recorded there). Its acceptance opened Phase 4 for Milestone 1 only; no ADR is
required (the RFC decides a view boundary and makes no language/compiler/runtime
change). RFC-0007 was decided 2026-07-14 (Option A ratified,
`docs/reviews/rfc-0007-board-review.md`; ADR-0009). The Board's
Language Complexity Budget recommendation is recorded as non-binding
review guidance only (Product Owner disposition, 2026-07-14) — not a
standing governance requirement. The dispositions previously awaited are
now made (Product Owner, 2026-07-15,
`docs/reviews/maintenance-self-hosting-disposition-packet.md`): the
specification-maintenance proposal (`docs/reviews/phase-3-close-packet.md`,
§4) is adopted as the erratum mechanism
(`docs/adr/0010-erratum-mechanism.md`); the self-hosting proposal's Level
1–3 adoption recommendations (`docs/proposals/self-hosting.md`) are disposed
severably — Level 1 commissioned, drafted, and accepted as
`RFC/0008-self-hosting-example.md` (Option B, 2026-07-15), Level 2 deferred
under the persistence gate, Level 3 deferred to Phase 6. No architectural
decision is open; RFC-0009 is decided (accepted) as noted above.

## Current Blockers

None. The Milestone-1 portability blocker raised on 2026-09-13 was cleared the
same day by the Product Owner's ratification of Option A
(`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md`,
`docs/adr/0011-platform-neutral-compiler.md`). Phase 4 Milestone 1 — Governed
Authoring remains the current authorized work. The gate that held substantive
Studio UI implementation — the authorized portability change, its permanent
conformance evidence, and the browser-first re-spike recorded with the
Milestone-1 acceptance floor in `IMPLEMENTATION_QUEUE.md` — was satisfied before
checkpoint 1, and checkpoints 1–6 have since landed. The milestone is not
blocked; it is **awaiting Product Owner acceptance**, which is a governance act
reserved to the Product Owner and not an engineering blocker.

## Governance Status

- Constitution: ✅ established (`docs/CONSTITUTION.md`)
- Architecture Charter: ✅ established (`docs/ARCHITECT.md`)
- Bootstrap Protocol: ✅ established (`docs/BOOTSTRAP.md`)
- Governance Model: ✅ established, including phase transition reviews and
  the standing RFC reconciliation requirement (`docs/GOVERNANCE.md`)
- Implementation Queue: ✅ established (`IMPLEMENTATION_QUEUE.md`)
- Mechanical state check: ✅ established (`scripts/check-state.mjs`, in CI)
- Product Strategy: ✅ adopted — Option A, 2026-07-14
  (`docs/PRODUCT_STRATEGY.md`)
- Strategic sequencing direction: ✅ adopted — Option B "Autonomy First",
  2026-07-18 (`docs/proposals/roadmap-revision.md`); the reserved `ROADMAP.md`
  re-sequencing was applied 2026-09-12 (Product Owner direction), commissioning
  no autonomy work
- Phase 4 planned opening experience: ✅ adopted — Governed Authoring,
  2026-07-18 (`docs/reviews/phase-4-planning-packet-amendment.md`, Option A)
- Phase 4 opening RFC: ✅ Accepted — `RFC/0009-phase-4-governed-authoring.md`,
  Option B (accept with four amendments applied), 2026-07-18
  (`docs/reviews/rfc-0009-board-review.md`, Product Owner ratification)
- Phase 4: 🚧 **Open for Milestone 1 — Governed Authoring — only** (2026-07-18);
  the one Milestone-1 implementation item is **In Progress** — checkpoints 1–6
  landed, Checkpoint-7 acceptance evidence prepared, Product Owner disposition
  **PENDING** (`docs/reviews/phase-4-m1-product-acceptance.md`); durable runtime
  logs remain a later, unopened Phase 4 milestone
- Specification-maintenance mechanism: ✅ established — erratum registry
  adopted 2026-07-15 (`docs/adr/0010-erratum-mechanism.md`, `docs/ERRATA.md`)

## Current North Star

Describe a company once. Compile it into an autonomous organization.

## Explicitly Out of Scope

- Office View implementation (prototype queued Low)
- Marketplace
- Studio UI
- Provider-specific agent integrations (the adapter seam ships; adapters do not)
- Trigger auto-initiation (event/schedule/webhook binding grammars)
- Event persistence (assigned to a later phase, gated on the first
  consumer requiring a durable log — Studio runtime logs or the Phase 6
  observe step; Board review 2026-07-13)
- Schema-to-TypeScript code generation (de-scoped; ratified 2026-07-13,
  `docs/reviews/phase-0-3-board-review.md`; reopening requires an RFC)

## Next Expected Deliverable

With **RFC-0008 closed complete 2026-07-18**
(`docs/reviews/rfc-0008-implementation-close-review.md`, Option A), no
governance close-out is pending and no implementation objective is active. The
strategic reconsideration once anticipated here has been made: the Phase 4
Planning Packet amendment adopting **Governed Authoring** and the separate
**roadmap revision proposal** adopting **Option B — Autonomy First** are both
merged and disposed (2026-07-18). Under the adopted Option A sequencing
(`docs/PRODUCT_STRATEGY.md`) the **Phase 4 opening RFC**
`RFC/0009-phase-4-governed-authoring.md` was commissioned, drafted,
Board-reviewed, and **accepted 2026-07-18 under Option B**
(`docs/reviews/rfc-0009-board-review.md`, Product Owner ratification), which
**opened Phase 4 for Milestone 1 — Governed Authoring — only** and added one
implementation item to `IMPLEMENTATION_QUEUE.md`. That implementation is **In
Progress**: checkpoints 1–6 landed and Checkpoint 7 prepared the end-to-end
product evidence and the acceptance record. The next expected deliverable is
therefore the **Product Owner's Milestone-1 product acceptance** against
`docs/reviews/phase-4-m1-product-acceptance.md` (disposition **PENDING**),
followed — only if accepted — by the Board implementation close review, which
requires both uncached executable conformance and that recorded
product-acceptance walkthrough (RFC-0009 §14). Neither act has occurred; nothing
authorizes marking the milestone complete, draining the queue item, or closing
Phase 4 ahead of them. Only Milestone 1 is authorized;
durable runtime logs remain a later, unopened Phase 4 milestone. Re-sequencing
`ROADMAP.md` per adopted Option B was performed 2026-09-12 and is no longer
outstanding; it commissioned no autonomy work and opened no phase.

## Completed RFCs

| RFC | Decision | ADR | Queue |
|-----|----------|-----|-------|
| RFC-0002 — Genome Compiler | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` | `docs/adr/0003-compiler-package-boundary.md` | Drained |
| RFC-0003 — Runtime Boundary | Accepted 2026-07-13, `docs/reviews/RFC-0003-board-decision.md` | `docs/adr/0004-runtime-boundary.md` | Drained |
| RFC-0004 — Runtime Implementation | Accepted 2026-07-13, `docs/reviews/RFC-0004-board-decision.md` | `docs/adr/0005-runtime-execution-contract.md` | Drained |
| RFC-0005 — Genome Diff | Accepted 2026-07-13, `docs/reviews/RFC-0005-board-decision.md` | `docs/adr/0006-genome-diff-contract.md` | Drained |
| RFC-0006 — Reference Adapter & `genome run` | Accepted 2026-07-13 (Option B), `docs/reviews/rfc-0006-board-review.md`; case-4 erratum applied 2026-07-13 per the Phase 3 close review | `docs/adr/0008-reference-execution-contract.md` | Drained |
| RFC-0007 — Executor-Scoped Policies | Accepted 2026-07-14 (Option A, five amendments applied), `docs/reviews/rfc-0007-board-review.md`; closed complete 2026-07-15, `docs/reviews/rfc-0007-implementation-close-review.md` | `docs/adr/0009-participation-scoped-policies.md` | Drained (closed 2026-07-15) |
| RFC-0008 — Self-Hosting Example | Accepted 2026-07-15 (Option B), `docs/reviews/rfc-0008-board-review.md`; closed complete 2026-07-18, `docs/reviews/rfc-0008-implementation-close-review.md` | None required | Drained (closed 2026-07-18) |

Definition-of-Done evidence for each lives in its board decision document.
One evidence gap found by the 2026-07-13 audit is now closed: the RFC-0005
item "`genome diff` CLI command with the pinned exit codes" was checked off
before any test exercised the CLI boundary; `packages/genome-cli/src/cli.test.ts`
now covers the exit-code and JSON contracts for every shipped command.
