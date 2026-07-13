# Genome Project State

Last Updated: 2026-07-13

This file is the **only** source for current project state (Governance
Rule 8). Other documents point here; none may restate what this file owns.
Consistency with the repository is checked by `pnpm check-state` in CI.

## Current Phase

Phase 3 — Runtime Prototype (active). Phases 0–2 closed 2026-07-13 by the
phase transition review (`docs/reviews/phase-0-3-board-review.md`,
ratified by the Product Owner). Phase 3 deliverables are landed as scoped
by RFC-0003/RFC-0004; the Board scoped the remaining goal-sentence work —
the reference provider adapter and the `genome run` CLI command — into
Phase 3 via RFC-0006. Event persistence is assigned to a later phase,
gated on the first consumer requiring a durable log. Phase 3 closes only
on CLI-boundary evidence (Board review, Condition 5).

## Current Iteration

No formal sprint cadence. Work proceeds RFC-by-RFC through
`IMPLEMENTATION_QUEUE.md`. The current iteration: implement the RFC-0006
queue item (reference adapter, `genome run`, CLI-boundary evidence),
scoped strictly to the amended RFC.

## Current Milestone

RFC-0006 accepted and its queue drained; then the Phase 3 close review
with CLI-boundary evidence (`genome run` driving a workflow to completion
through the reference adapter).

## Current Objective

Implement RFC-0006 as amended: the `@genome/adapter-reference` package,
the `genome run` command, and the eight CLI-boundary test cases — with no
change to compiler or runtime public contracts (empty git diff required)
and no work beyond the amended RFC's scope.

## Active Architectural Decision

None open. RFC-0006 — Reference Adapter & `genome run` was **Accepted**
2026-07-13 under Option B (`docs/reviews/rfc-0006-board-review.md`,
Product Owner ratification recorded;
`docs/adr/0008-reference-execution-contract.md`). The next architectural
decision is the Phase 3 close review, held after the RFC-0006 evidence
lands.

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

The RFC-0006 implementation item from `IMPLEMENTATION_QUEUE.md`, followed
by the Phase 3 close review on its CLI-boundary evidence.

## Completed RFCs

| RFC | Decision | ADR | Queue |
|-----|----------|-----|-------|
| RFC-0002 — Genome Compiler | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` | `docs/adr/0003-compiler-package-boundary.md` | Drained |
| RFC-0003 — Runtime Boundary | Accepted 2026-07-13, `docs/reviews/RFC-0003-board-decision.md` | `docs/adr/0004-runtime-boundary.md` | Drained |
| RFC-0004 — Runtime Implementation | Accepted 2026-07-13, `docs/reviews/RFC-0004-board-decision.md` | `docs/adr/0005-runtime-execution-contract.md` | Drained |
| RFC-0005 — Genome Diff | Accepted 2026-07-13, `docs/reviews/RFC-0005-board-decision.md` | `docs/adr/0006-genome-diff-contract.md` | Drained |

Definition-of-Done evidence for each lives in its board decision document.
One evidence gap found by the 2026-07-13 audit is now closed: the RFC-0005
item "`genome diff` CLI command with the pinned exit codes" was checked off
before any test exercised the CLI boundary; `packages/genome-cli/src/cli.test.ts`
now covers the exit-code and JSON contracts for every shipped command.
