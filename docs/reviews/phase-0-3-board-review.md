# Architecture Board Review — Phase 0–3 Reconciliation

- **Process:** `docs/GOVERNANCE.md` → Phase Transition Review (Product
  Owner · Chief Architect · Lead Engineer)
- **Date:** 2026-07-13
- **Under review:** `docs/reviews/phase-0-3-reconciliation.md` (branch
  `claude/project-principles-audit-lwif7s`, PR #10)
- **Quorum:** 3/3

## Votes

| Role | Verdict |
|------|---------|
| Product Owner | Ratify — Outcome B (amended) and the codegen de-scoping as worded (2026-07-13) |
| Chief Architect | Accept with conditions — Outcome B, amended |
| Lead Engineer | Accept with conditions |

**Outcome: APPROVED — Outcome B, amended, ratified by the Product Owner
on 2026-07-13.** Phases 0–2 are closed; the codegen de-scoping is
ratified with the reviewed wording verbatim; Phase 3 stays active with
the reference adapter and `genome run` scoped in via RFC-0006; event
persistence is excluded from Phase 3 and gated on its first consumer.
Both role reviews were conducted independently against the repository,
with all executable evidence re-run rather than trusted. Conditions 1–3,
6, 7, 9 (governance note), and 10 are applied in the application change;
conditions 4, 5, and the operational half of 8–9 bind future work
(RFC-0006 and the Phase 3 close review).

## Converged recommendation to the Product Owner

Both reviewers independently recommend **Outcome B, amended**:

1. **Close Phases 0–2.** Every deliverable classification in the packet
   is accepted as proposed; no overturns, no amendments beyond the
   evidence-wording correction already applied to the packet (see Lead
   Engineer condition 1).
2. **Ratify the codegen de-scoping** with the packet's wording verbatim:
   *"De-scoped from the current roadmap; may be reconsidered through a
   future RFC if schema-driven public SDK types become a concrete
   requirement."*
3. **Hold Phase 3 active**, scoping packet §4 items 1–2 (reference
   provider adapter, `genome run` CLI command) into Phase 3 via a new
   RFC. Item 3 (event persistence) is **excluded** from Phase 3 and
   assigned to a later phase, gated on the first consumer that needs a
   durable log (Studio runtime logs or the Phase 6 observe step).
4. Phase 3 then closes through a follow-up transition review whose
   evidence is executable at the CLI boundary (`genome run` driving a
   workflow to completion, tested like the other four commands).

The decisive architectural ground (Chief Architect): **ADR-0004
Decision 8 already places the first adapter inside Phase 3** — "Adapters
ship as separate packages when Phase 3 needs the first one" — so closing
Phase 3 without one (Outcome A) would contradict the plain reading of an
accepted ADR. Reinforced by ADR-0003's real-consumer precedent (the
adapter seam is the one shipped contract with no real consumer), the
Charter's examples-before-abstractions bias, and the evidence standard
this project set on 2026-07-13: closing a phase whose goal sentence is
demonstrable only inside a vitest process would repeat, at phase
granularity, the checkmark-ahead-of-evidence failure this reconciliation
exists to eliminate.

## Consolidated conditions

Applied with, or before, the outcome application. CA = Chief Architect,
LE = Lead Engineer.

1. **(CA) Record ADR-0007 for the governance changes.** The Phase
   Transition Review process, the standing RFC-completion clause, and
   Governance Rule 8 landed in `docs/GOVERNANCE.md` by direct commit with
   no decision record. Not RFC-worthy (no system boundary changes), but
   decision-worthy: record a short ADR and cite it from
   `docs/GOVERNANCE.md`.
2. **(CA) The ratified codegen wording is recorded verbatim** in the
   `ROADMAP.md` row, plus the citation "ratified <decision date>,
   `docs/reviews/phase-0-3-board-review.md`", so the recorded and
   ratified dispositions cannot drift.
3. **(CA) Outcome B's `PROJECT_STATE.md` wording is amended before
   application:** scoped work is "§4 items 1–2"; event persistence stays
   in Explicitly Out of Scope with its consumer gate stated.
4. **(CA) Boundary constraints bind the new RFC, stated now:** (a) the
   reference adapter lives below the seam as a separate package
   (ADR-0004 §8); nothing above the seam names a provider; (b)
   `genome run` consumes compiled artifacts only and introduces no state
   not reconstructible as `replay(log)`; (c) retries, persistence, and
   trigger binding grammars stay out — each gated on its own consumer.
5. **(CA) Phase 3 close evidence standard:** the follow-up review closes
   Phase 3 only on CLI-boundary evidence — `genome run` on a designated
   example drives at least one workflow to completion through the
   reference adapter, with exit codes and output contract covered in
   `packages/genome-cli/src/cli.test.ts`.
6. **(CA) Queue hygiene:** the transition-review row flips to Done with
   the note "Phases 0–2 closed; Phase 3 held open by decision"; the new
   RFC enters the queue so the queue, not this review thread, carries the
   work forward.
7. **(LE, applied 2026-07-13) Packet evidence wording corrected:** the
   Phase 0 "Repository structure" row now says top-level tree entries are
   verified mechanically, nested entries by inspection — the script
   checks no more than that.
8. **(LE) Outcome-application phrasing constraint:** whoever applies the
   outcome runs `pnpm check-state` before committing and keeps the
   Current Phase first line prefixed with a verbatim `ROADMAP.md` phase
   heading (em dash included) — both prepared outcome phrasings were
   empirically verified to pass; deviations ("Phase 3 (Runtime
   Prototype)", en dash) fail.
9. **(LE) Evidence runs bypass the turbo cache:** plain `pnpm test` can
   replay cached logs; Board evidence and phase-review runs use
   `pnpm test -- --force` or an uncached environment. Note this in the
   Phase Transition Review section on application.
10. **(LE) Fix the stale queue row** "Genome Compiler package design —
    Approved" → Done in the application commit; `check-state` does not
    parse that table, so it will not self-heal.

## Lead Engineer — evidence verification (summary)

All runs 2026-07-13 on the PR branch; working tree verified clean before
and after; test counts from a forced uncached run (`pnpm test -- --force`,
"0 cached, 4 total").

| Claim | Result |
|-------|--------|
| `pnpm install --frozen-lockfile` | ✅ lockfile up to date |
| `pnpm typecheck` | ✅ 4/4 packages |
| 73 passing tests (4 schema / 36 compiler / 17 runtime / 16 CLI) | ✅ exact match, uncached |
| `pnpm check-state` | ✅ exit 0; CI-wired |
| check-state detects breaks | ✅ proven: renamed phase → `[current-phase]` failure; temp NUL file → `[control-bytes]` failure; both restored byte-identical (sha256) |
| Phase 0 success criterion | ✅ `genome validate SPEC/examples/company.yaml` exit 0 |
| CLI tests exercise the boundary | ✅ every test spawns the CLI as a subprocess; no compiler imports |
| NUL fix behavior-preserving | ✅ pre-fix blob had raw 0x00; backslash-u0000 escapes produce the identical runtime string; 8 diff tests pass |
| `state() == replay(log)` structural | ✅ literally `replay(log.events())` at the source |
| Shared canonicalization | ✅ diff imports `canonicalJson` from `revision.js` |
| §6 outcomes check-state-compatible | ✅ both Current Phase phrasings applied temporarily → exit 0; restored byte-identical |

## Recorded risks

- **check-state is a tripwire, not a proof:** regex-over-markdown parsing
  (reformatted tables or renamed headings silently change what is
  checked); the phase rule is `startsWith`, so a suffix like "is
  abandoned" would pass; path check sees only backticked known-prefix
  references; the single-source heading check skips `RFC/` and `SPEC/`.
- **CLI suite runtime** (~9s; ~560ms per subprocess) grows linearly; when
  `genome run` scenarios land, compile once to `dist/` and spawn `node`
  to keep the subprocess boundary without the per-test transpile.
- **The in-memory event log** is honestly disclosed and fine now; it
  becomes a real gap the moment anything reads events across restarts —
  which is exactly why persistence is sequenced behind its first consumer
  rather than inherited silently.
- **Supersession precision (CA):** "superseded by RFC-0002/ADR-0003" is
  accurate about the deliverable's purpose, not a formal revocation —
  RFC-0002 never names schema codegen; it fulfilled the need through the
  AST. That is exactly why Board ratification, not citation alone, is the
  correct instrument here.

## Product Owner ratification (recorded 2026-07-13)

1. **Codegen disposition — ratified as worded:** "De-scoped from the
   current roadmap; may be reconsidered through a future RFC if
   schema-driven public SDK types become a concrete requirement."
2. **Phase 3 outcome — Outcome B, amended**, per the reviewers' joint
   recommendation: Phases 0–2 closed; Phase 3 active with §4 items 1–2
   scoped in via RFC-0006; event persistence consumer-gated to a later
   phase.

The decision is applied by the accompanying application change:
`PROJECT_STATE.md`, `ROADMAP.md`, `IMPLEMENTATION_QUEUE.md`,
`docs/GOVERNANCE.md` (ADR citation, uncached-evidence note), and
`docs/adr/0007-phase-transition-governance.md` (Condition 1).
