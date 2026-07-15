# RFC-0007 — Executor-Scoped Policies — Implementation Closure Review

## Status

**Ratified — Option A, Product Owner, 2026-07-15.** RFC-0007 is **closed,
complete as implemented** at commit
`c97de3dd8d3a7e3c646586ba907c6af95897290a`. The Product Owner accepts the
Architecture Board's closure findings exactly as recorded below and directs
that the closure be applied: `PROJECT_STATE.md` records the closure (no
"close review pending"), the `IMPLEMENTATION_QUEUE.md` item remains Done and
drained, and no implementation, test, `SPEC` semantic, or ADR-0009 change is
made. The Language Complexity Budget remains **non-binding review evidence
and guidance** — it is not promoted to a standing governance requirement by
this closure. The review below is preserved as written at review time.

Review held 2026-07-15.

## Decision Under Review

- **Decision:** close RFC-0007 as implemented, close with documentation-only
  corrections, or keep it open, on the implementation landed at commit
  `c97de3d` (participation binding, ADR-0009).
- **Sources of truth:** `RFC/0007-executor-scoped-policies.md`,
  `docs/reviews/rfc-0007-board-review.md`,
  `docs/adr/0009-participation-scoped-policies.md`, `PROJECT_STATE.md`,
  `IMPLEMENTATION_QUEUE.md`.
- **Base (pre-implementation):** `854e529` — all protected-boundary diffs
  computed `854e529..c97de3d`.
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer). Every material claim re-executed at
  `c97de3d`, uncached (`pnpm test -- --force`); CLI invoked directly so true
  exit codes are captured (`pnpm run` masks nonzero child exit codes to 1).

## Verified Evidence (all re-run at `c97de3d`)

| Claim | Re-execution | Result |
|---|---|---|
| Full suite, uncached | `pnpm test -- --force` | ✅ 104/104, 0 cached — schema 4 · adapter 7 · runtime 18 · compiler 40 · CLI 35 |
| State consistency | `pnpm check-state` | ✅ exit 0 |
| Typecheck | `pnpm typecheck` | ✅ 5/5 |
| Schema diff | `git diff 854e529..c97de3d -- SPEC/schema/genome.schema.json` | ✅ 0 bytes |
| Runtime production source diff | `git diff … packages/genome-runtime/src ':!runtime.test.ts'` | ✅ 0 bytes |
| CLI surface diff | `git diff … packages/genome-cli/src/index.ts` | ✅ 0 bytes |
| Events taxonomy diff (new event types) | `git diff … packages/genome-runtime/src/events/index.ts` | ✅ 0 bytes |
| Existing 17 runtime tests byte-unchanged | SHA-256 of base file vs first 337 lines of HEAD | ✅ identical (`7d2bf535…382b2`) |
| Runtime test additive-only | `git diff --numstat … runtime.test.ts` | ✅ 58 insertions / 0 deletions |
| Only compiler production source changed | commit name-only, non-test `.ts` under `packages/` | ✅ `graph/index.ts`, `semantics/index.ts` only |
| Case 1 (Gap 1, no grant) | direct CLI | ✅ exit 3, one `approval.requested` → `human:product-owner`, 0 steps |
| Case 2 (grant) | direct CLI | ✅ exit 0, attributed `approval.granted` |
| Case 3 (initiator half) | runtime suite, by name | ✅ "gates a run a governed agent initiates of a workflow it does not own" passes |
| Case 4 (double-gating) | `genome graph` + `genome run` | ✅ one workflow→policy edge; one `approval.requested`; one grant → exit 0 |
| Case 5 (workaround) | direct CLI | ✅ exit 3, one request — identical parking |
| Case 6 (pinned order) | `genome graph` | ✅ derived edges `[alpha, beta, gamma]`; agent edge retained |
| Case 7 (inert diagnostic) | `genome graph` | ✅ warning on stderr, exit 0, no compile failure |
| Case 8 (Condition 5) | `genome run … build-feature` | ✅ exit 0, 16-event sequence identical |
| Case 9 (determinism) | two `--clock` runs | ✅ byte-identical |

No claim failed re-execution.

## Answers to the Board's Questions

**1. Implemented exactly as accepted, all five amendments?** Yes.
- *A1 (additive runtime carve-out):* runtime production source diff is 0 bytes;
  `runtime.test.ts` is additive-only.
- *A2 (case 3 in the runtime suite):* the initiator-binding case lives in
  `runtime.test.ts`, not the CLI (agent initiation is CLI-unreachable).
- *A3 (deterministic pinned order):* case 6 yields `[alpha, beta, gamma]`;
  source iterates owned workflows in document order.
- *A4 (OQ resolutions folded):* v0.1 (schema 0 bytes, no version bump);
  autonomy sentence present verbatim in `SPEC/language.md`; participation =
  initiate ∪ execute (source); diagnostic warning-only (case 7).
- *A5 (hedge discharged / no fixture depends on old binding):* the three
  pre-existing policy-bearing fixtures are workflow-scoped or dangling;
  existing tests are byte-identical and green — no assertion depended on the
  old binding.

**2. Accepted semantics preserved?** Yes, verified at source
(`graph/index.ts`, `runtime/index.ts`):
- *Initiation ∪ execution:* the agent→policy edge is retained and an edge per
  owned workflow is added — a union, not a replacement.
- *Execution = ownership (v0.1):* owned-workflow map keyed by `workflow.owner`.
- *Autonomy governs initiative:* the autonomy gate (0-byte diff) refuses
  `manual` initiation and applies the supervised floor at initiation only.
- *Policies govern work:* derived workflow edges gate execution regardless of
  initiator (case 1: operator-initiated, parked).
- *No currently-gated run released:* edge derivation only adds (dedup guard),
  never removes; monotone in the deny-safe direction — confirmed by the
  byte-identical, green existing suites.

**3. Compiler the only production boundary changed?** Yes. The sole non-test
`.ts` files in the commit are `graph/index.ts` and `semantics/index.ts`.
Runtime, CLI, adapter, and schema-package production sources are all 0-byte
diffs.

**4. Protected boundaries satisfied?** Yes, all six. Schema 0 · runtime
production 0 · CLI surface 0 · events taxonomy 0 (no new types) · existing 17
runtime tests byte-identical (SHA-256 match) · runtime evidence additive-only
(58/0).

**5. Dedup by id at both boundaries?** Yes.
- *Graph:* `participation-double` → exactly one workflow→policy `requires`
  edge (the dedup guard collapses the explicit + derived duplicate).
- *Execution:* the same fixture yields exactly one `approval.requested`,
  drained by one grant — the runtime's set-union of `governedBy` (unchanged).

**6. Inert diagnostic exactly as accepted?** Yes. Fires only on the
provably-inert shape (a policy binding only `manual`, workflow-less agents);
warning severity; compiles (exit 0); no new error condition. No false
positives — `participation-gap1` (supervised owner), `company.yaml`, and
`invalid-principal` (whose test asserts exactly two diagnostics) produce zero
inert warnings.

**7. All nine evidence cases satisfied at their required boundaries?** Yes —
cases 1–2, 4–6, 8–9 at the CLI subprocess boundary; case 3 in the runtime
suite; case 7 as the compiler diagnostic. Each re-executed above.

**8. Condition 5 unchanged?** Yes. `genome run SPEC/examples/company.yaml
--workflow build-feature --grant human:engineering-manager` → exit 0 with the
identical 16-event sequence (`approval.requested → approval.granted →
workflow.started → 6×(assigned,completed) → workflow.completed`).

**9. State reconciled correctly?** Yes. `IMPLEMENTATION_QUEUE.md` RFC-0007 row
status = Done with a dated drained note; `PROJECT_STATE.md` RFC table records
the drain; Current Phase unchanged (Phase 4, not started); `pnpm check-state`
green.

**10. Residual risks justifying keeping it open?** None. The one standing item
— "executor = owner" is load-bearing if multi-agent steps ever arrive — is
already recorded in ADR-0009 as an extension point, not a defect, and is
inherited by any future RFC. It does not gate closure.

## Language Complexity Budget — Actual vs. Approved

| Dimension | Approved (review) | Actual (measured at `c97de3d`) | Match |
|---|---|---|---|
| New syntax | 0 | 0 — `appliesTo` grammar untouched (schema 0 bytes) | ✅ |
| New semantics | 1 widened rule (+1 boundary explicit) | 1 widened rule (agent → participation) + the normative autonomy sentence in `SPEC` | ✅ |
| Compiler changes | 1 derivation rule + 1 diagnostic extension | 1 derivation loop + 1 extended warning; 0 new stages/targets/AST | ✅ |
| Runtime changes | 0 | 0 production (0-byte diff); +1 additive test only | ✅ |
| Schema changes | 0 | 0 | ✅ |
| CLI changes | 0 | 0 surface; `genome graph` carries more edges through an unchanged contract | ✅ |
| New language concepts | 0 constructs; 1 defined term | 0 constructs; 1 term ("participation", executor = owner) in `SPEC` + ADR | ✅ |

Actual equals approved on every dimension — no overspend. The Language
Complexity Budget remains non-binding review evidence and guidance; this
closure does not promote it to a standing governance requirement.

## Reviewer Positions

- **Chief Architect — close (Option A).** The change restores Principle 9 (the
  one construct that read as governance now governs) and serves Principle 3
  (the enumeration workaround is gone). Boundary hygiene is exact: the fix
  lives wholly behind the ADR-0002/0003 compiler boundary; the `RuntimeModel`
  shape and runtime source are untouched, so ADR-0004/0005 are undisturbed.
  Spec, ADR, and code agree.
- **Lead Engineer — close (Option A).** Every claim reproduced clean and
  uncached; the zero-runtime-diff expectation held as verified mechanics, not
  aspiration; the existing 17 tests are byte-identical by hash; dedup is
  demonstrated at both boundaries; the additive case buys the shipped-but-
  untested initiator path its first coverage. No source change was required,
  so the DoD-6 stop-and-return tripwire never triggered.

Disagreements: none material.

## Decision Options

### Option A — Close RFC-0007 as implemented

- **Consequences:** RFC-0007 is closed complete; the queue item remains
  Done/drained; `PROJECT_STATE.md` drops "close review pending" and records
  the closure. All Definition-of-Done items (1–8) are met on re-executed
  evidence; every protected boundary held; the complexity budget matched
  approval exactly.
- **Board assessment: recommended.**

### Option B — Close with documentation-only corrections

- **Consequences:** closure conditioned on narrow documentation edits (no
  code/test change). The Board identified no such correction needed — spec,
  ADR, queue, and state are already consistent.
- **Board assessment: available, but no defect on record motivates it.**

### Option C — Keep RFC-0007 open

- **Consequences:** the item stays open pending further work. The Board found
  no unmet acceptance criterion, boundary breach, or residual risk requiring
  this.
- **Board assessment: not recommended.**

## Joint Board Recommendation

**Option A.** The implementation matches the accepted RFC and all five
amendments; the semantics are preserved and monotone; every protected
boundary is a verified empty diff; dedup is demonstrated at graph and
execution; the nine evidence cases pass uncached at their required
boundaries; Condition 5 is byte-for-byte unchanged; and the complexity spend
equals what was approved. Nothing remains open.

## Exact Ratification Statement

For **Option A** (recommended, ratified):

> As Product Owner, I ratify Option A: RFC-0007 — Executor-Scoped Policies is
> closed, complete as implemented at commit
> `c97de3dd8d3a7e3c646586ba907c6af95897290a`. I accept the Architecture
> Board's closure findings exactly as recorded here. The closure is applied:
> `PROJECT_STATE.md` records it and removes "close review pending"; the
> `IMPLEMENTATION_QUEUE.md` item remains Done and drained. No implementation,
> test, `SPEC` semantic, or ADR-0009 change is made; Phase 4 is not opened and
> no further RFC is drafted by this step. The Language Complexity Budget
> remains non-binding review guidance.
