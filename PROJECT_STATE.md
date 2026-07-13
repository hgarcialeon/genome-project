# Genome Project State

Last Updated: 2026-07-13

## Current Phase

Phase 0 — Foundation

## Current Sprint

Sprint 1

## Current Milestone

Executable Genome Specification

## Active RFC

RFC-0003 — Runtime Boundary (Accepted 2026-07-13). RFC-0002 — Genome
Compiler was accepted 2026-07-09 and its queue is drained.

## Governance Status

- Constitution: ✅ established
- Architecture Charter: ✅ established
- Bootstrap Protocol: ✅ established
- Architecture Bootstrap Checklist: ✅ established
- Governance Model: ✅ established
- Implementation Queue: ✅ established

## Repository Health

- Architecture Debt: Low
- Specification Coverage: High
- Implementation Coverage: Medium

## Current North Star

Describe a company once. Compile it into an autonomous organization.

## Open Decisions

All RFC-0002 open decisions resolved by the Architecture Board on 2026-07-09
(`docs/adr/0003-compiler-package-boundary.md`). All RFC-0003 open questions
resolved by the Architecture Board on 2026-07-13
(`docs/adr/0004-runtime-boundary.md`):

1. Event-type ownership — ✅ resolved (`genome-runtime`, dependency-free `events/` module)
2. Taxonomy normativity — ✅ resolved (envelope + taxonomy normative, additive-only)
3. Supervised checkpoints — ✅ resolved (layered semantics; deny-safe `manual` default)
4. Revision adoption — ✅ resolved (drain, normative)
5. Proposal format — ✅ resolved (payload reserved; Phase 6 RFC under binding constraints)

## Next Architecture Decision

Approve the Phase 3 implementation RFC (runtime implementation: `RuntimeModel`
shape, trigger executability, scheduling/ordering semantics, operator
emergency-stop story) when drafted. Near-term engineering work proceeds from
the Implementation Queue (compiler preconditions from RFC-0003).

## Current Rule

No implementation before specification.

## Explicitly Out of Scope

- Office View implementation
- Runtime implementation
- Marketplace
- Studio UI
- Provider-specific agent integrations

## Next Expected Deliverable

The RFC-0003 compiler preconditions from the Implementation Queue: policy
`appliesTo` semantic validation + `requires` edges, and `owns` edges for
objective/metric owners. Runtime implementation stays gated on the Phase 3
RFC and remains out of scope for Phase 0.

## Definition of Done for RFC-0003

- runtime input contract defined — ✅
- runtime output contract defined — ✅
- reconciliation contract defined — ✅
- human approval contract defined — ✅
- provider boundary defined — ✅
- open questions resolved — ✅
- specification preconditions landed — ✅
- ADR recorded — ✅

RFC-0003 accepted by the Architecture Board on 2026-07-13
(`docs/reviews/RFC-0003-board-decision.md`).

## Definition of Done for RFC-0002

- compiler stages defined — ✅
- AST responsibility defined — ✅
- semantic validation defined — ✅
- Organization Graph defined — ✅
- compilation targets defined — ✅
- runtime boundary clarified — ✅

RFC-0002 accepted by the Architecture Board on 2026-07-09
(`docs/reviews/RFC-0002-board-decision.md`).
