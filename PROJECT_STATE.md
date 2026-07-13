# Genome Project State

Last Updated: 2026-07-13

## Current Phase

Phase 0 — Foundation

## Current Sprint

Sprint 1

## Current Milestone

Executable Genome Specification

## Active RFC

RFC-0004 — Runtime Implementation (Accepted 2026-07-13). RFC-0003 — Runtime
Boundary was accepted 2026-07-13 and its compiler preconditions are
drained; RFC-0002 — Genome Compiler was accepted 2026-07-09 and its queue
is drained.

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

No open decisions. RFC-0002's were resolved 2026-07-09
(`docs/adr/0003-compiler-package-boundary.md`), RFC-0003's 2026-07-13
(`docs/adr/0004-runtime-boundary.md`), and RFC-0004's open questions were
resolved by the Architecture Board on 2026-07-13
(`docs/adr/0005-runtime-execution-contract.md`):

1. Supervised intrinsic floor — ✅ resolved (routed to reserved `human:*`; any human may grant)
2. Control-event envelope — ✅ resolved (`runId: null` on `runtime.halted`/`runtime.resumed` only)
3. Halt semantics — ✅ resolved (suspend dispatch; never hard-fail in-flight runs)
4. Adoption events — ✅ resolved (adoption appends nothing; runs carry their revision)

## Next Architecture Decision

None pending. The next RFC belongs to the phase that needs it (Phase 4
Studio, Phase 5 Office View, or the Phase 6 proposal-payload RFC), or to a
trigger-binding grammar when a scheduler/selector consumer is queued.
Near-term engineering work proceeds from the Implementation Queue
(runtime-model target and `genome-runtime` core, authorized by RFC-0004).

## Current Rule

No implementation before specification.

## Explicitly Out of Scope

- Office View implementation
- Marketplace
- Studio UI
- Provider-specific agent integrations (the adapter seam ships; adapters do not)
- Trigger auto-initiation (event/schedule/webhook binding grammars)

## Next Expected Deliverable

The RFC-0004 implementation items from the Implementation Queue: Genome
revision derivation + the runtime-model target in `packages/genome-compiler`,
and the `packages/genome-runtime` core (events module, append-only log,
replay, approval gate, halt/resume, drain adoption).

## Definition of Done for RFC-0004

- `RuntimeModel` shape pinned and implemented as a compiler target — ☐
- Genome revision derivation specified and implemented — ☐
- trigger executability resolved for v0.1 — ✅
- ordering and execution semantics pinned and implemented — ☐
- approval gate mechanics pinned and implemented — ☐
- emergency stop implemented as attributable control events — ☐
- `replay` implemented; `state() == replay(log)` by construction — ☐
- open questions resolved — ✅
- ADR recorded — ✅

RFC-0004 accepted by the Architecture Board on 2026-07-13
(`docs/reviews/RFC-0004-board-decision.md`).

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
