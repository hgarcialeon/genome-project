# Genome Project State

Last Updated: 2026-07-13

## Current Phase

Phase 0 — Foundation

## Current Sprint

Sprint 1

## Current Milestone

Executable Genome Specification

## Active RFC

RFC-0005 — Genome Diff (Accepted 2026-07-13; completes the Phase 2 CLI
command set). RFC-0004 — Runtime Implementation was accepted 2026-07-13
and its queue is drained; RFC-0003 — Runtime Boundary was accepted
2026-07-13 and its compiler preconditions are drained; RFC-0002 — Genome
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
- Implementation Coverage: High

## Current North Star

Describe a company once. Compile it into an autonomous organization.

## Open Decisions

No open decisions. RFC-0002's were resolved 2026-07-09
(`docs/adr/0003-compiler-package-boundary.md`), RFC-0003's 2026-07-13
(`docs/adr/0004-runtime-boundary.md`), RFC-0004's 2026-07-13
(`docs/adr/0005-runtime-execution-contract.md`), and RFC-0005's open
questions were resolved by the Architecture Board on 2026-07-13
(`docs/adr/0006-genome-diff-contract.md`):

1. Comparison representation — ✅ resolved (the Organization Graph; never raw text)
2. Exit-code convention — ✅ resolved (`diff(1)`: 0 identical / 1 different / 2 trouble)
3. Rename detection — ✅ resolved (none in v0.1; identity is the node id)
4. Proposal-payload relation — ✅ resolved (the `DiffReport` is descriptive; the Phase 6 payload stays reserved)

## Next Architecture Decision

None pending. The next RFC belongs to the phase that needs it (Phase 4
Studio, Phase 5 Office View, or the Phase 6 proposal-payload RFC), or to a
trigger-binding grammar when a scheduler/selector consumer is queued.
Near-term engineering work proceeds from the Implementation Queue (the
`diff` target and CLI command, authorized by RFC-0005).

## Current Rule

No implementation before specification.

## Explicitly Out of Scope

- Office View implementation
- Marketplace
- Studio UI
- Provider-specific agent integrations (the adapter seam ships; adapters do not)
- Trigger auto-initiation (event/schedule/webhook binding grammars)

## Next Expected Deliverable

The engineering queue is drained: RFC-0005's item landed 2026-07-13 (the
`diff` target in `packages/genome-compiler` and the CLI `genome diff`
command), completing the Phase 2 roadmap's CLI command set
(`validate`/`inspect`/`graph`/`diff`). Next work enters the queue through
the next phase's RFC (Studio, Office View, or the Phase 6 proposal-payload
RFC); the Office View prototype remains queued Low for the Office Team.

## Definition of Done for RFC-0005

- `DiffReport` shape pinned and implemented as a compiler target — ✅
- one canonicalization shared between revision derivation and diff — ✅
- deterministic ordering guaranteed and tested — ✅
- `genome diff` CLI command with `--json` and the pinned exit codes — ✅
- formatting-only change produces `identical: true` and an empty report — ✅
- `SPEC/language.md` Compilation Targets updated — ✅
- open questions resolved — ✅
- ADR recorded — ✅

RFC-0005 accepted by the Architecture Board on 2026-07-13
(`docs/reviews/RFC-0005-board-decision.md`).

## Definition of Done for RFC-0004

- `RuntimeModel` shape pinned and implemented as a compiler target — ✅
- Genome revision derivation specified and implemented — ✅
- trigger executability resolved for v0.1 — ✅
- ordering and execution semantics pinned and implemented — ✅
- approval gate mechanics pinned and implemented — ✅
- emergency stop implemented as attributable control events — ✅
- `replay` implemented; `state() == replay(log)` by construction — ✅
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
