# RFC-0008 — Self-Hosting Example — Implementation Closure Review

## Status

**Ratified — Option A, Product Owner, 2026-07-15.** RFC-0008 is **closed,
complete as implemented** at commit
`f07e5f32b06fa92bcf35db0c19965c7bdb6e85cc`. The Product Owner accepts the
Architecture Board's closure findings exactly as recorded below and directs
that the closure be applied: `RFC/0008-self-hosting-example.md` is marked
accepted — implemented and closed, `PROJECT_STATE.md` records the closure (no
"close review pending"), and the `IMPLEMENTATION_QUEUE.md` item remains Done
and drained. No implementation, `SPEC`, compiler, runtime, schema, CLI, or
test change is made; no ADR is created (the RFC makes no architectural
decision); Phase 4 is not opened and no further RFC is drafted by this step.
The Language Complexity Budget remains **non-binding review evidence and
guidance** — it is not promoted to a standing governance requirement by this
closure. The review below is preserved as written at review time.

Review held 2026-07-15.

## Decision Under Review

- **Decision:** close RFC-0008 as implemented (Option A), close with
  documentation-only corrections (Option B), or keep it open (Option C), on the
  implementation landed at commit `f07e5f3` (the single self-hosting example
  plus its additive CLI-boundary evidence).
- **Sources of truth:** `RFC/0008-self-hosting-example.md`,
  `docs/reviews/rfc-0008-board-review.md`, `SPEC/examples/genome-project.yaml`,
  `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`.
- **Base (pre-implementation):** `92872ca` — all protected-boundary diffs
  computed `92872ca..f07e5f3`.
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer). Every material claim re-executed at
  `f07e5f3`, uncached (`pnpm test -- --force`); the CLI invoked directly so
  true exit codes are captured (`pnpm run` masks nonzero child exit codes
  to 1).

## Verified Evidence (all re-run at `f07e5f3`)

| Claim | Re-execution | Result |
|---|---|---|
| Change scope is exactly four files | `git diff --name-only 92872ca..f07e5f3` | ✅ `SPEC/examples/genome-project.yaml`, `packages/genome-cli/src/cli.test.ts`, `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md` — nothing else |
| Shipped example equals accepted RFC appendix | `diff` appendix vs file | ✅ byte-for-byte identical (113 = 113 lines) |
| Full suite, uncached | `pnpm test -- --force` | ✅ 113/113, 0 cached — schema 4 · adapter 7 · runtime 18 · compiler 40 · CLI 44 |
| State consistency | `pnpm check-state` | ✅ exit 0 |
| Typecheck | `pnpm typecheck` | ✅ 5/5 |
| Schema diff | `git diff 92872ca..f07e5f3 -- SPEC/schema/genome.schema.json` | ✅ 0 bytes |
| Compiler production source diff | `git diff … packages/genome-compiler/src` | ✅ 0 bytes |
| Runtime production source diff | `git diff … packages/genome-runtime/src` | ✅ 0 bytes |
| CLI surface diff | `git diff … packages/genome-cli/src/index.ts` | ✅ 0 bytes |
| Events taxonomy diff (new event types) | `git diff … packages/genome-runtime/src/events` | ✅ 0 bytes |
| CLI test additive-only | `git diff --numstat … cli.test.ts` | ✅ 189 insertions / 0 deletions |
| No exported-log reader / persistence in added tests | scan added lines | ✅ none — E1–E9 use `--json` stdout only |
| Single canonical source | whole-tree search | ✅ only `SPEC/examples/genome-project.yaml`; no second copy |
| E1 — validates | direct CLI | ✅ exit 0 |
| E2 — compiles, no diagnostic | direct CLI | ✅ exit 0; stderr 0 bytes |
| E3 — graph shape | parse graph JSON | ✅ 19 nodes (Company 1 · Dept 2 · Agent 3 · Workflow 3 · Policy 2 · Integration 1 · Objective 1 · Metric 2 · MemoryStore 4), 31 edges, exactly four `requires` edges incl. derived `implement-queue-item → queue-discipline` |
| E4 — deny-safe (rfc-lifecycle, no grant) | direct CLI | ✅ exit 3; one `approval.requested` via `policy:ratification` → `human:product-owner`; 0 steps |
| E5 — granted run | direct CLI, grant + clock | ✅ exit 0; completed; 5 steps |
| E6 — attributed record | E5 `--json` | ✅ `approval.granted` attributed to `human:product-owner` (source and principal), before the first step event |
| E7 — executor gate (implement-queue-item, no grant) | direct CLI | ✅ exit 3; exactly one `approval.requested` via `policy:queue-discipline` → `human:product-owner`; 0 steps |
| E8 — executor gate satisfied | direct CLI, grant + clock | ✅ exit 0; completed; 5 steps |
| E9 — determinism | two clocked E5 runs | ✅ byte-identical stdout |

No claim failed re-execution.

## Answers to the Board's Questions

**1. Implemented exactly as accepted, with all five Board dispositions?** Yes.
The shipped `SPEC/examples/genome-project.yaml` is byte-for-byte the ratified
appendix. **OQ1** — `queue-discipline` agent-scoped
(`appliesTo: [engineering.engineering-agent]`), with the derived
`implement-queue-item → queue-discipline` edge present (E3/E7); **OQ2** —
canonical name `SPEC/examples/genome-project.yaml`; **OQ3** — top-of-file YAML
comment is the marking, no verifier and no index file created; **OQ4** —
divergence control is review-discipline-only; **OQ5** — `ROADMAP.md` unchanged,
no deliverable row added.

**2. Single canonical source?** Yes. A whole-tree search finds exactly one
self-hosting document under `SPEC/examples/`; no second copy exists anywhere.

**3. Durable structure only; `PROJECT_STATE.md` preserved as the sole source of
mutable state?** Yes. Excluding comment lines, the document contains no
mutable-status field (milestone, blocker, priority, status, phase value,
sprint, iteration). The only `phase` tokens are the durable workflow name
`phase-transition-review` and the marking comment naming what must never be
restated.

**4. Faithful to governance without becoming a second governance source?** Yes.
Product Owner → `human:product-owner`; Board-as-process → the `rfc-lifecycle`
and `phase-transition-review` workflows; Chief Architect / Lead Engineer →
`manual` agents (Charter-defensible; Gap 2 deferred, not reopened);
Engineering Agent → `supervised`; workflow steps mirror the real lifecycles;
review (a workflow step) is separated from ratification (the approval
principal). It governs nothing and is marked non-normative-for-governance;
`check-state`'s single-source rule passes.

**5. Does RFC-0007 participation binding eliminate the old per-workflow
workaround?** Yes — verified at source and boundary.
`packages/genome-compiler/src/graph/index.ts` is byte-identical to base (0-byte
diff): the derived edge is produced by already-shipped RFC-0007 code, not
introduced here. E3 shows the single agent-scoped policy yielding both the
retained agent edge and the derived workflow edge (deduplicated); E7 shows
exactly one `approval.requested`. The per-workflow enumeration and its
unenforced invariant are retired.

**6. E1–E9 satisfied at the CLI boundary?** Yes — all nine, re-executed at the
direct CLI subprocess boundary with true exit codes (table above), landed
additively in `packages/genome-cli/src/cli.test.ts` (35 → 44 CLI tests),
passing uncached.

**7. All protected boundaries satisfied?** Yes, all seven — each a verified
empty diff or absence: schema 0 · compiler production 0 · runtime production 0
· CLI surface 0 · events taxonomy 0 (no new types) · no exported-log reader ·
no persistence. Only production diff is the one example file; only test diff is
additive (189/0).

**8. Correctly classified toolchain-normative and governance-non-normative?**
Yes. On `SPEC/` and test-protected like `company.yaml`, it is normative for the
language/toolchain (it must keep compiling and running; the E1–E9 suite
enforces this) and non-normative for governance (the governance documents
remain solely authoritative; `PROJECT_STATE.md` remains the sole source of
state). The acceptance-review precedent pin (Q10/OQ3) is honored.

**9. `PROJECT_STATE.md` and `IMPLEMENTATION_QUEUE.md` reconciled correctly?**
Yes, without overclaiming at implementation time. The queue row is Done with a
drained note; `PROJECT_STATE.md` recorded the item as "landed and drained" and
RFC-0008 as "ready for its implementation close review" (explicitly not yet
closed); the RFC file was unchanged; RFC-0008 was correctly absent from the
Completed RFCs table; `check-state` green. This closure now advances that
record to closed.

**10. Residual risks justifying keeping it open?** None. Two risks remain, both
already accepted by the RFC and inherent to the Level-1 design, neither a
defect in this commit: (a) divergence over time, mitigated by review discipline
only (OQ4, ADR-0010 minimalism); (b) the toolchain-normative /
governance-non-normative precedent, contained by the marking and pinned in the
record (OQ3/Q10). Neither is an unmet acceptance criterion; neither is curable
by keeping the RFC open.

## Language Complexity Budget — Actual vs. Approved

| Dimension | Approved default (RFC §8) | Actual (measured at `f07e5f3`) | Match |
|---|---|---|---|
| New syntax | 0 | 0 — existing v0.1 fields only (schema 0 bytes) | ✅ |
| New semantics | 0 | 0 — relies on shipped v0.1 + RFC-0007; adds none | ✅ |
| Compiler production change | 0 | 0 — `genome-compiler/src` 0-byte diff | ✅ |
| Runtime production change | 0 | 0 — `genome-runtime/src` 0-byte diff | ✅ |
| Schema change | 0 | 0 | ✅ |
| CLI surface change | 0 | 0 — `index.ts` 0-byte diff | ✅ |
| New maintained example | 1 | 1 — `SPEC/examples/genome-project.yaml` | ✅ |
| New executable tests | allowed | 9 additive CLI-boundary cases (E1–E9) | ✅ |

Actual equals approved on every dimension — no overspend. The Language
Complexity Budget remains non-binding review evidence and guidance; this
closure does not promote it to a standing governance requirement.

## Reviewer Positions

- **Chief Architect — close (Option A).** The example is byte-for-byte the
  accepted artifact; boundary hygiene is exact (nothing normative moved; the
  derived edge comes from shipped RFC-0007 code); the structure/state line
  holds; the toolchain-normative / governance-non-normative precedent is
  correctly pinned. It strengthens Principle 1 (dogfooding is direct pressure
  on the spec) and honors Principles 2/5 strictly. No architectural objection.
- **Lead Engineer — close (Option A).** Every claim reproduced clean and
  uncached (113/113, 0 cached); E1–E9 sit at the correct boundary and are
  additive; the seven protected diffs are empty by construction; reconciliation
  is accurate and did not overclaim closure. No source change was required, so
  the DoD stop-and-return tripwire never triggered. No implementation risk.

Disagreements: none material.

## Decision Options

### Option A — Close RFC-0008 as implemented

- **Consequences:** RFC-0008 is closed complete; the queue item remains
  Done/drained; `PROJECT_STATE.md` drops "close review pending" and records the
  closure (Completed RFCs table row added); `RFC/0008-self-hosting-example.md`
  is marked accepted — implemented and closed. All Definition-of-Done items are
  met on re-executed evidence; every protected boundary held; the complexity
  budget matched approval exactly.
- **Board assessment: recommended.**

### Option B — Close with documentation-only corrections

- **Consequences:** closure conditioned on narrow documentation edits (no
  code/test/SPEC change). The Board identified no such correction — the example
  matches the appendix exactly, the dispositions are all honored, and the
  reconciliation is accurate.
- **Board assessment: available, but no defect on record motivates it.**

### Option C — Keep RFC-0008 open

- **Consequences:** the item stays open pending further work. The Board found
  no unmet acceptance criterion, boundary breach, or residual risk requiring
  this.
- **Board assessment: not recommended.**

## Joint Board Recommendation

**Option A.** At `f07e5f3` the shipped example is byte-for-byte the accepted
appendix, all five dispositions hold, E1–E9 pass uncached at the CLI boundary,
all seven protected boundaries are empty by construction, the participation
binding is shipped-not-introduced, the structure/state boundary holds, the
classification is correctly pinned, and the state documents reconcile without
overclaiming. The Language Complexity Budget actual equals the approved default
on every dimension. Nothing remains open.

## Exact Ratification Statement

For **Option A** (recommended, ratified):

> As Product Owner, I ratify Option A: RFC-0008 — Self-Hosting Example is
> closed, complete as implemented at commit
> `f07e5f32b06fa92bcf35db0c19965c7bdb6e85cc`. I accept the Architecture Board's
> closure findings exactly as recorded here. The closure is applied:
> `RFC/0008-self-hosting-example.md` is marked accepted — implemented and
> closed; `PROJECT_STATE.md` records it and removes "close review pending"; the
> `IMPLEMENTATION_QUEUE.md` item remains Done and drained. No implementation,
> `SPEC`, compiler, runtime, schema, CLI, or test change is made; no ADR is
> created; Phase 4 is not opened and no further RFC is drafted by this step.
> The Language Complexity Budget remains non-binding review guidance.
