# ADR-0007: Phase Transition Governance

## Status

Accepted (2026-07-13, `docs/reviews/phase-0-3-board-review.md`, Condition 1)

## Context

The 2026-07-13 governance audit found the architecture faithful to the
Constitution while the self-describing state documents had drifted:
`PROJECT_STATE.md` was frozen at Phase 0 with Phases 1–3 shipped, the
agent prompt still instructed Phase 0 work, roadmap deliverables carried
no statuses (one — schema-to-TypeScript codegen — was silently dropped),
and Definition-of-Done checkmarks existed without executable evidence at
the CLI boundary. The systemic cause: document updates were event-driven
and RFC-scoped, standing state had no owner and was duplicated across
four documents, and no invariant was enforced mechanically.

The remedies landed in `docs/GOVERNANCE.md` by direct commit; the
Architecture Board ruled them decision-worthy (though not RFC-worthy — no
system boundary changes) and required this ADR so the decision has an
immutable record explaining why.

## Decision

1. **Phase closure requires a phase transition review** held by the
   Architecture Board. A phase closes only when every one of its roadmap
   deliverables is classified as exactly one of: Done (executable or
   explicitly documented evidence), Deferred (with an
   `IMPLEMENTATION_QUEUE.md` entry), or De-scoped (with a stated reason,
   and an RFC/ADR reference when the de-scoping follows from an
   architectural decision). The review reconciles `PROJECT_STATE.md`,
   `ROADMAP.md`, `IMPLEMENTATION_QUEUE.md`, and the phase's
   Definition-of-Done evidence in the same change.
2. **Current project state is single-sourced** (Governance Rule 8):
   phase, iteration, milestone, objective, active decision, and blockers
   live only in `PROJECT_STATE.md`; other documents point to it and must
   not restate it.
3. **Every RFC's Definition of Done includes the standing criterion**
   "Project state and governance documents reconciled."
4. **The mechanical half of the review is `scripts/check-state.mjs`**
   (`pnpm check-state`, run in CI): a deliberately repository-specific
   tripwire, not a reusable subsystem — introducing a generalized
   governance reconciler would require its own RFC. The judgment half —
   whether evidence actually supports "Done" — remains the Board's and is
   not automated.
5. **Evidence runs bypass the build cache.** Turbo replays cached test
   logs; evidence cited in Board reviews and phase transition reviews
   must come from uncached runs (`pnpm test -- --force` or a clean
   environment).

## Consequences

- Standing state has an owner and a reconciliation trigger; the Phase-0
  freeze failure mode (stale phase, dropped deliverable, unevidenced
  checkmark) now fails CI or fails the review.
- Phase closure is auditable: the first application closed Phases 0–2 and
  held Phase 3 open (`docs/reviews/phase-0-3-board-review.md`).
- `check-state` is a tripwire, not a proof: it parses this repository's
  markdown conventions and must be updated when those conventions change;
  it fails loudly rather than adapting.
- Future governance-process changes of this weight record their ADR in
  the same change, not retroactively.
