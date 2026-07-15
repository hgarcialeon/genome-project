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
RFC-0007 implementation item landed, was drained, and RFC-0007 was
**closed complete 2026-07-15** by the Board's implementation closure
review (Option A, `docs/reviews/rfc-0007-implementation-close-review.md`).
No engineering item is queued. The Level 1 self-hosting RFC was commissioned
2026-07-15 (`docs/reviews/maintenance-self-hosting-disposition-packet.md`) and
is now **drafted as `RFC/0008-self-hosting-example.md` (Draft — under
Architecture Board review, 2026-07-15)**; it adds no queue item until it is
accepted. The Phase 4 opening RFC remains uncommissioned.

## Current Milestone

The RFC-0007 queue item (participation-binding derivation, inert-policy
diagnostic, `SPEC/language.md` Policy Scope wording, the nine amended
evidence cases) is **implemented, drained, and closed** (2026-07-15)
against its acceptance criteria in `IMPLEMENTATION_QUEUE.md` and the
amended `RFC/0007-executor-scoped-policies.md`, within the pinned
protected boundaries (empty schema, runtime-production, and CLI-surface
diffs). The Board's implementation closure review
(`docs/reviews/rfc-0007-implementation-close-review.md`) ratified Option
A on that evidence; no milestone is active.

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
`docs/ERRATA.md`); the Level 1 self-hosting RFC is commissioned (not yet
drafted); Level 2 (durable exported-log records) is deferred under the
persistence gate; and Level 3 (operative governance) is deferred to Phase 6.
Phase 4 remains unopened; no Phase 4 work is authorized without its own RFC
and ratification.

## Active Architectural Decision

None open. RFC-0007 was decided 2026-07-14 (Option A ratified,
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
severably — Level 1 commissioned as an RFC (now drafted as
`RFC/0008-self-hosting-example.md`, under Board review), Level 2 deferred
under the persistence gate, Level 3 deferred to Phase 6. No architectural
decision is open.

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

The Level 1 self-hosting RFC — commissioned 2026-07-15
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`) and now
drafted as `RFC/0008-self-hosting-example.md` (Draft — under Architecture
Board review) — is the next expected deliverable. It follows the normal
lifecycle (draft → Board review → ratification → queue); no engineering item
exists until it is accepted. The Phase 4 opening RFC follows per the adopted
Option A sequencing (`docs/PRODUCT_STRATEGY.md`) and remains uncommissioned.

## Completed RFCs

| RFC | Decision | ADR | Queue |
|-----|----------|-----|-------|
| RFC-0002 — Genome Compiler | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` | `docs/adr/0003-compiler-package-boundary.md` | Drained |
| RFC-0003 — Runtime Boundary | Accepted 2026-07-13, `docs/reviews/RFC-0003-board-decision.md` | `docs/adr/0004-runtime-boundary.md` | Drained |
| RFC-0004 — Runtime Implementation | Accepted 2026-07-13, `docs/reviews/RFC-0004-board-decision.md` | `docs/adr/0005-runtime-execution-contract.md` | Drained |
| RFC-0005 — Genome Diff | Accepted 2026-07-13, `docs/reviews/RFC-0005-board-decision.md` | `docs/adr/0006-genome-diff-contract.md` | Drained |
| RFC-0006 — Reference Adapter & `genome run` | Accepted 2026-07-13 (Option B), `docs/reviews/rfc-0006-board-review.md`; case-4 erratum applied 2026-07-13 per the Phase 3 close review | `docs/adr/0008-reference-execution-contract.md` | Drained |
| RFC-0007 — Executor-Scoped Policies | Accepted 2026-07-14 (Option A, five amendments applied), `docs/reviews/rfc-0007-board-review.md`; closed complete 2026-07-15, `docs/reviews/rfc-0007-implementation-close-review.md` | `docs/adr/0009-participation-scoped-policies.md` | Drained (closed 2026-07-15) |

Definition-of-Done evidence for each lives in its board decision document.
One evidence gap found by the 2026-07-13 audit is now closed: the RFC-0005
item "`genome diff` CLI command with the pinned exit codes" was checked off
before any test exercised the CLI boundary; `packages/genome-cli/src/cli.test.ts`
now covers the exit-code and JSON contracts for every shipped command.
