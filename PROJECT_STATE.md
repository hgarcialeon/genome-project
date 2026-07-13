# Genome Project State

Last Updated: 2026-07-13

This file is the **only** source for current project state (Governance
Rule 8). Other documents point here; none may restate what this file owns.
Consistency with the repository is checked by `pnpm check-state` in CI.

## Current Phase

Phase 3 — Runtime Prototype (all deliverables landed; phase transition
review pending).

Determined against `ROADMAP.md` acceptance criteria, not asserted: Phase 0
(foundation docs, schema, `genome validate`), Phase 1 (compiler pipeline
through the Organization Graph and targets), Phase 2 (the
`validate`/`inspect`/`graph`/`diff` CLI set, now covered by CLI-boundary
tests), and Phase 3 (runtime core per RFC-0004) all have their deliverables
classified in `ROADMAP.md` with evidence. Phases 0–3 remain formally open
until the Architecture Board holds the phase transition reviews defined in
`docs/GOVERNANCE.md` (first application of that process); one Phase 2
de-scoping (schema type generation) awaits ratification there.

## Current Iteration

No formal sprint cadence. Work proceeds RFC-by-RFC through
`IMPLEMENTATION_QUEUE.md`. The current iteration is governance alignment:
reconciling the project's self-describing documents with the implemented
system and making that reconciliation mechanical (`scripts/check-state.mjs`).

## Current Milestone

Close Phases 0–3 via phase transition reviews, then open the next phase
with its RFC (Phase 4 Studio, Phase 5 Office View, or the Phase 6
proposal-payload RFC reserved by ADR-0006).

## Current Objective

Declared project state accurately and mechanically reflects the system that
exists. After the reviews close, the objective moves to the next phase's
RFC.

## Active Architectural Decision

None open. RFC-0002 through RFC-0005 are accepted and their queues drained
(see Completed RFCs below). The next architectural decision is the next
phase's RFC.

## Current Blockers

None for engineering. The phase transition reviews for Phases 0–3 require
the Architecture Board (Product Owner, Chief Architect, Lead Engineer) —
a decision gate, not an implementation gate. The Phase 2 review must
ratify or overturn the de-scoping of "TypeScript types generated from
schema" recorded in `ROADMAP.md`.

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
- Schema-to-TypeScript code generation (de-scoped in `ROADMAP.md`, Phase 2;
  reopening requires an RFC)

## Next Expected Deliverable

The engineering queue is drained. Next: the Architecture Board holds the
Phase 0–3 transition reviews; new engineering work enters the queue through
the next phase's RFC.

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
