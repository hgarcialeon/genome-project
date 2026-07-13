# Genome Project State

Last Updated: 2026-07-13

## Current Phase

Phase 0 — Foundation

## Current Sprint

Sprint 1

## Current Milestone

Executable Genome Specification

## Active RFC

RFC-0002 — Genome Compiler (Accepted 2026-07-09)

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
(see `docs/adr/0003-compiler-package-boundary.md`):

1. Compiler pipeline — ✅ resolved
2. AST model — ✅ resolved (same package, optional source spans)
3. Organization Graph — ✅ resolved (normative nodes/relationships, adjacency list)
4. Compilation targets — ✅ resolved (fixed functions; scope trimmed to inspect/graph/docs)
5. Compiler package boundaries — ✅ resolved (single `genome-compiler` package)

## Next Architecture Decision

Approve RFC-0003 — Runtime boundary (when drafted). Near-term engineering work
proceeds from the Implementation Queue.

## Current Rule

No implementation before specification.

## Explicitly Out of Scope

- Office View implementation
- Runtime implementation
- Marketplace
- Studio UI
- Provider-specific agent integrations

## Next Expected Deliverable

Draft RFC-0003 — Runtime boundary. The RFC-0002 implementation queue is
drained: `packages/genome-compiler` (Stages 1–5) and the CLI `inspect`/`graph`
commands shipped 2026-07-13.

## Definition of Done for RFC-0002

- compiler stages defined — ✅
- AST responsibility defined — ✅
- semantic validation defined — ✅
- Organization Graph defined — ✅
- compilation targets defined — ✅
- runtime boundary clarified — ✅

RFC-0002 accepted by the Architecture Board on 2026-07-09
(`docs/reviews/RFC-0002-board-decision.md`).
