# Genome Project State

Last Updated: 2026-07-15

This file is the **only** source for current project state (Governance
Rule 8). Other documents point here; none may restate what this file owns.
Consistency with the repository is checked by `pnpm check-state` in CI.

## Current Phase

Phase 4 — Studio Prototype (named as next; **not started**). Phases 0–3
are closed: Phases 0–2 by the 2026-07-13 phase transition review
(`docs/reviews/phase-0-3-board-review.md`), Phase 3 by the Phase 3 close
review the same day (`docs/reviews/phase-3-close-board-review.md`,
Option B ratified by the Product Owner) on CLI-boundary evidence, with
the RFC-0006 case-4 erratum applied first. Naming Phase 4 as current is
a statement of position, not a work authorization: opening Phase 4
requires its own RFC, Architecture Board review, and Product Owner
ratification (Governance Rule 2). Event persistence remains assigned to
a later phase, gated on the first consumer requiring a durable log.

## Current Iteration

No formal sprint cadence. Work proceeds RFC-by-RFC through
`IMPLEMENTATION_QUEUE.md`. No implementation iteration is active: the
RFC-0007 implementation item landed and was drained 2026-07-15, and its
Board close review is the next governance step. The Phase 4 opening RFC
remains uncommissioned.

## Current Milestone

The RFC-0007 queue item (participation-binding derivation, inert-policy
diagnostic, `SPEC/language.md` Policy Scope wording, the nine amended
evidence cases) is **implemented and drained** (2026-07-15) against its
acceptance criteria in `IMPLEMENTATION_QUEUE.md` and the amended
`RFC/0007-executor-scoped-policies.md`, within the pinned protected
boundaries (empty schema, runtime-production, and CLI-surface diffs).
The Board close review on that evidence is the outstanding step.

## Current Objective

Execute the adopted **Option A ("Trust first") of
`docs/PRODUCT_STRATEGY.md`** (adopted 2026-07-14). Its first act is
complete through implementation: **RFC-0007 — Executor-Scoped Policies**
was accepted 2026-07-14 under Option A with the five amendments applied
(`docs/reviews/rfc-0007-board-review.md`, Product Owner ratification
recorded there; `docs/adr/0009-participation-scoped-policies.md`), and
its implementation item **landed and drained 2026-07-15** to the amended
Definition of Done — the nine evidence cases passing uncached, the
protected boundaries held. Its Board close review is the outstanding
step; acceptance and implementation do not substitute for it. Phase 4
remains unopened; no Phase 4 work is authorized without its own RFC and
ratification.

## Active Architectural Decision

None open. RFC-0007 was decided 2026-07-14 (Option A ratified,
`docs/reviews/rfc-0007-board-review.md`; ADR-0009). The Board's
Language Complexity Budget recommendation is recorded as non-binding
review guidance only (Product Owner disposition, 2026-07-14) — not a
standing governance requirement. Still
awaiting their own dispositions (sequenced next under the adopted
Option A of the product strategy): the specification-maintenance proposal
(`docs/reviews/phase-3-close-packet.md`, §4) and the self-hosting
proposal's Level 1–3 adoption recommendations
(`docs/proposals/self-hosting.md`), which the ratified evidence review
left severable.

## Current Blockers

None.

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

The RFC-0007 Board close review, on the drained implementation's
evidence (the nine amended cases uncached; empty schema, runtime-source,
and CLI-surface diffs). Per the adopted Option A sequencing
(`docs/PRODUCT_STRATEGY.md`), the specification-maintenance disposition
(Phase 3 close packet §4) and the self-hosting Level 1 disposition
follow, with the Phase 4 opening RFC thereafter, each at the Product
Owner's direction.

## Completed RFCs

| RFC | Decision | ADR | Queue |
|-----|----------|-----|-------|
| RFC-0002 — Genome Compiler | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` | `docs/adr/0003-compiler-package-boundary.md` | Drained |
| RFC-0003 — Runtime Boundary | Accepted 2026-07-13, `docs/reviews/RFC-0003-board-decision.md` | `docs/adr/0004-runtime-boundary.md` | Drained |
| RFC-0004 — Runtime Implementation | Accepted 2026-07-13, `docs/reviews/RFC-0004-board-decision.md` | `docs/adr/0005-runtime-execution-contract.md` | Drained |
| RFC-0005 — Genome Diff | Accepted 2026-07-13, `docs/reviews/RFC-0005-board-decision.md` | `docs/adr/0006-genome-diff-contract.md` | Drained |
| RFC-0006 — Reference Adapter & `genome run` | Accepted 2026-07-13 (Option B), `docs/reviews/rfc-0006-board-review.md`; case-4 erratum applied 2026-07-13 per the Phase 3 close review | `docs/adr/0008-reference-execution-contract.md` | Drained |
| RFC-0007 — Executor-Scoped Policies | Accepted 2026-07-14 (Option A, five amendments applied), `docs/reviews/rfc-0007-board-review.md` | `docs/adr/0009-participation-scoped-policies.md` | Drained 2026-07-15 (close review pending) |

Definition-of-Done evidence for each lives in its board decision document.
One evidence gap found by the 2026-07-13 audit is now closed: the RFC-0005
item "`genome diff` CLI command with the pinned exit codes" was checked off
before any test exercised the CLI boundary; `packages/genome-cli/src/cli.test.ts`
now covers the exit-code and JSON contracts for every shipped command.
