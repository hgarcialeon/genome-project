# RFC-0006 Architecture Board Review

## Status

Ratified — Option B (Approve with Amendments), by the Product Owner on
2026-07-13, issuing the Option B statement verbatim. The eleven
amendments are applied to `RFC/0006-reference-adapter-and-genome-run.md`,
the six open questions are resolved per the Joint Board Recommendation,
the RFC is marked **Accepted**, and the decision is recorded as
`docs/adr/0008-reference-execution-contract.md`. Implementation is queued
in `IMPLEMENTATION_QUEUE.md`, scoped to the amended RFC; no changes
beyond the eleven amendments are authorized.

## Decision Under Review

- **Document:** `RFC/0006-reference-adapter-and-genome-run.md` (Draft)
- **PR:** #11, branch `docs/rfc-0006-reference-execution`, HEAD `f0d89d4`
- **Process:** `docs/GOVERNANCE.md` / ADR-0007 — Architecture Board
  (Product Owner · Chief Architect · Lead Engineer); review-only
  iteration. Two independent role reviews were conducted 2026-07-13, each
  reading the full governance set, RFC-0003/0004/0005, ADR-0003/0004/0005/0007,
  the Phase 0–3 board review, and the compiler/runtime/CLI code and tests,
  without access to the other's conclusions.
- **Bound by:** Phase 0–3 review Condition 4 (boundary constraints) and
  Condition 5 (phase-close evidence standard).

Nothing in this document approves RFC-0006, implements any capability,
closes Phase 3, or advances any phase.

## Verified Repository Evidence

Both reviewers ran the validation commands independently on the PR branch
(clean tree, HEAD `f0d89d4`); results agreed:

| Command | Result (both reviewers) |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ lockfile up to date |
| `pnpm check-state` | ✅ exit 0 — consistent with the repository |
| `pnpm typecheck` | ✅ 4/4 packages (LE also uncached: `turbo typecheck --force`, 4/4, 3.65 s) |
| `pnpm test -- --force` | ✅ **73/73, 0 cached** — schema 4, compiler 36, runtime 17, CLI 16 |
| `pnpm genome run …` (today) | exit 1, `unknown command 'run'` — no existing contract collides |

Key shared findings, each verified against code (not the RFC's word):

1. The path `compile → runtimeModelTarget → createRuntime` exists and
   suffices; no compiler bypass is needed and no compiler/runtime contract
   changes.
2. The adapter sits below the `AgentAdapter` seam; dependency direction
   adapter → `@genome/runtime` (types only) is acyclic and
   workspace-feasible; RFC-0003 already names the `packages/genome-adapter-*`
   pattern.
3. No runtime state outside `replay(log)` is introduced. The adapter FIFO
   and `dispatched` record are strictly derivable from replay of the log
   (LE traced the refused-mid-settle case; the derivation still holds).
4. Export/replay equality holds — verified empirically by the LE with a
   JSON-round-tripped full gated run. One caveat drives an amendment:
   `undefined` payload values do not survive JSON, so equality must be
   pinned at state level.
5. Determinism is enforceable: sequential event ids, replay-derived
   `runId`s, FIFO settle, injectable clock (`RuntimeOptions.clock` exists
   today). Gaps found (NDJSON framing, multi-grant order, stdout/stderr
   split) drive amendments.
6. Exit codes 0/1/2/3 conflict with nothing shipped; exit 3 is directly
   implementable from `RunState.status`. Trap: commander's defaults exit 1
   where the RFC pins 2 — drives an amendment.
7. `--grant` is deny-safe (exact match or concrete human against the
   `human:*` floor; `human:*` itself refused) — but the RFC's option-table
   wording ("this exact principal") contradicts its own floor guarantee —
   drives an amendment.
8. Workflow selection is unambiguous (`--workflow` required, no default).
9. The never-re-enter `dispatch` + FIFO `settle()` contract is safe (the
   runtime is never re-entered; both reviewers traced the synchronous
   dispatch-inside-settle chain), but the RFC's behaviors 1 and 3
   contradict each other on refusal (drain-until-empty vs hold-at-head =
   livelock under halt). LE verified the terminating reading empirically —
   drives the joint first amendment.
10. No silent scope expansion into persistence, Studio, Office View, or
    providers; `--export-log` is write-once with no read path (CA adds a
    mechanical tripwire amendment).
11. The Definition of Done is executable except one item ("untouched test
    suites" does not prove an unchanged contract) — drives an amendment.
12. The designated Condition-5 evidence exists in the example:
    `genome run SPEC/examples/company.yaml --workflow build-feature
    --grant human:engineering-manager` (policy `production-deploy`
    requires exactly `human:engineering-manager`; LE reproduced the full
    16-event sequence in-process).

## Chief Architect Review

### Verdict

**Approve with amendments.** A disciplined proposal composing shipped
contracts without inventing anything above the seam; satisfies both
binding Phase 0–3 conditions; contradicts no accepted ADR. Five bounded
wording amendments close genuine specification gaps.

### Constitutional Alignment

All ten principles assessed; all hold. Notable rulings: the final-state
line is a projection, correctly not an event (P5/P6); exit 3 is an honest
encoding of Principle 9 (deny-safe blockage as a first-class, non-failure
outcome); and on Principle 8 — the hardest question — the reference
adapter is **not a throwaway toy**: it is the permanent conformance
implementation of the seam, the only adapter that can demonstrate the
failure path, halt-window behavior, and determinism by construction, and
it will outlive the first provider adapter as what tests, docs, and demos
run against. `genome run` is likewise a lasting surface: every option
remains meaningful when real adapters arrive (with `--fail-step` scoped
per Q4). This is a primitive, not a bundle.

### Boundary Analysis

All eleven evidence requirements verified (summarized above). ADR
conflicts: **none** — where the RFC touches accepted decisions
(ADR-0004 §8, ADR-0005 explicit initiation, ADR-0006 exit codes and the
Phase 6 payload reservation) it cites and conforms; no superseding ADR is
needed. One precision put on the record: the adapter's
derivable-from-log property is *stronger* than the seam contract requires
(ADR-0004 demands disposability, not derivability); future provider
adapters holding non-derivable job ids must not be held to behavior 4 as
precedent.

### Risks

`settle()` non-termination under refusal (latent in the CLI, live for any
future halting host); grant attribution as operator assertion must be
said out loud — the log is the project's truth artifact; `--export-log`
is one `--resume` flag away from being the persistence the Board
excluded — make the gate mechanical; `--fail-step` couples the top-level
CLI to one adapter unless scoped; CLI suite runtime grows (~8 more
spawns; recorded mitigation stands); `human:*` shown raw at exit 3 is
cryptic (cosmetic; implementation note).

### Required Amendments

1. **Pin `settle()` termination on refusal**: "…until the queue is empty
   **or a report is refused; a refusal ends the `settle()` call
   immediately**, leaving the refused task at the head and everything
   behind it queued for a later `settle()`. `settle()` therefore always
   terminates."
2. **State grant attribution semantics**: a grant is an **operator
   assertion** — the CLI submits on the named principal's behalf and the
   log attributes it to that principal, exactly as a test driving
   `submitApproval` would; simulation semantics, appropriate to a local
   reference run; any surface where principals respond for themselves
   must authenticate responders and needs its own RFC.
3. **Make the no-contract-change DoD item executable**: verified by an
   **empty git diff under `packages/genome-compiler` and
   `packages/genome-runtime`** plus their unchanged suites passing.
4. **Make persistence non-expansion mechanical**: "No shipped code path
   reads an exported log as input: `genome run` accepts no log or resume
   argument, and the only reader of an export is the replay-equality
   test. Any command or flag that consumes an exported log is the 'first
   consumer' the Board's gate names, and requires its own RFC."
5. **Pin parser-failure exit codes**: all invocation-level failures exit
   2; the implementation must override the argument parser's default exit
   behavior so the pinned codes, not the library's, are the contract.

### Open-Question Recommendations

- **Q1 `--grant` in v0.1 — Yes** (with Amendment 2). Approval is the
  constitutional execution primitive; without it the deny-safe gate is
  invisible at the evidence boundary and Condition 5 on the gated example
  is impossible. Cost low; user impact high; deferral repeats the
  evidence-gap failure and invites a TTY shortcut.
- **Q2 `--export-log` in v0.1 — Yes.** It is the executable witness of
  `state() == replay(log)` outside the runtime's process; tests 6–7
  depend on it. Cost trivial; deferral costs the strongest evidence.
- **Q3 `--clock` — optional and public**, documented as a testing aid.
  A contract users cannot verify is chat-history architecture; mandatory
  would make default output lie about time. Cost near zero.
- **Q4 `--fail-step` — public, explicitly scoped to the reference
  adapter** ("defined by the reference adapter; a future adapter-selection
  surface does not inherit it"). The failure half of the exit-code
  contract must be demonstrable; a test-only seam repeats the evidence
  gap.
- **Q5 package name — `genome-adapter-reference`.** RFC-0003 already
  writes the `genome-adapter-*` pattern; the alternative contradicts an
  accepted RFC's convention on first instantiation. Close it in the
  acceptance ADR.
- **Q6 SPEC pinning of the export format — wait for a second consumer**,
  with clarifications: the format is still normative in this RFC and its
  ADR (tests 6–7 pin it), and the second consumer's RFC pins it in the
  appropriate spec surface. Pinning now is abstraction-before-example.

## Lead Engineer Review

### Verdict

**Approve with amendments.** Implementable against the code as it stands;
no compiler or runtime contract changes; the evidence plan matches
Conditions 4/5. Four normative ambiguities must be fixed before queue
intake — most seriously `settle()` termination and the `--grant` floor
matching rule, both verified empirically to behave differently than the
RFC's literal wording implies.

### Feasibility

All ten assigned verification points confirmed against code, with
empirical probes (scratch scripts under /tmp; no repository files
touched): the full pipeline was driven end-to-end (`build-feature`
completes, 16 events, 6 steps); JSON-round-tripped replay equality holds;
the halt-between-dispatch-and-settle case holds head and resumes cleanly;
`--grant human:*` is refused while a concrete human grant satisfies the
floor; commander's `requiredOption` exits 1 (vs the pinned 2). Findings
that drive amendments: the settle behaviors 1/3 contradiction (the only
terminating reading is return-on-first-refusal); the `--grant`
option-table wording contradicts the Security section's supervised-
initiation guarantee; `detail: undefined` payload keys drop under JSON
round-trip (equality must be state-level); NDJSON framing and multi-grant
attribution order are unpinned; "approval denied" is unreachable via
`genome run` v0.1 (no deny surface), so exit 1's rationale overstates.
Precision note: FIFO contents are derivable *from replay of* the log
(`workflowId` is not in the assigned-event payload) — the RFC should say
so exactly.

### Proposed Implementation Surface

New package `packages/genome-adapter-reference` (`@genome/adapter-reference`,
depends on `@genome/runtime` workspace-only, `test`/`typecheck` scripts —
check-state rule 4 covers it mechanically): `src/index.ts` ~70–90 LOC
(`createReferenceAdapter`, dispatch = enqueue+record only, `bind`,
`settle` with return-on-first-refusal, `dispatched` readonly,
qualified-over-bare `failSteps`, fixed `"simulated failure"` detail) plus
~120–160 LOC unit tests. `packages/genome-cli`: add `@genome/runtime` +
adapter deps; `run` command ~150–200 LOC reusing `compileOrFail(file, 2)`;
two-phase construction (adapter → runtime → `bind`); subscribe printer;
grant pass over `pendingApprovals` in event order; manual `--workflow`
validation to keep exit 2; +8–10 subprocess test cases (~180–220 LOC)
via the existing `genome()` helper. **No changes** to compiler, runtime,
schema, check-state, turbo, workspace glob, or CI. Total ~550–700 LOC
across ~7 files, two-thirds tests. Suite impact: ~595 ms/spawn measured;
+6–7 s → CLI suite ~17 s, full `--force` run ~20 s; the recorded
dist-spawn mitigation would require introducing `build` scripts no
package has today — flag before improvising.

### Test Evidence Required

(1) Condition 5 verbatim: `genome run SPEC/examples/company.yaml
--workflow build-feature --grant human:engineering-manager` → exit 0 with
the verified 16-event sequence; (2) missing/unknown `--workflow` and one
more refusal (e.g. `--as human:*` → `reserved-principal`) → exit 2 with
the reason verbatim; (3) gated run, no grant → exit 3, pending
`human:engineering-manager` listed; (4) granted run → exit 0 with
attribution; plus the **floor variant** — `--as engineering.platform.backend
--grant human:<anyone>` on an ungoverned workflow → exit 0 (the only test
exercising the corrected matching rule); (5) `--fail-step` → exit 1,
`agent.task.failed` (detail `simulated failure`) then `workflow.failed`;
qualified-beats-bare in adapter unit tests; (6) export parses per-line,
`replay(parsedLog)` equals final state at **state level**, pinned
framing asserted; (7) determinism: byte-identical stdout and export under
`--clock` across two runs, **plus** one run without `--clock` asserting
sequence equality excluding timestamps (else guarantee 1 is never
tested); (8) adapter unit suite and `pnpm check-state` green.

### Risks

The settle-loop ambiguity is a real correctness trap (livelock under the
literal reading — copies into future adapters); commander defaults fight
the exit-code table (typo'd option would exit 1 while a missing required
option exits 2 — incoherent seam without the amendment); test-suite
runtime grows linearly; `--export-log` scope-creep pressure the moment
anything reads it; byte-identical claims are brittle without pinned
framing and stream split; `dispatched` invites misuse as an observation
surface competing with the log (doc-comment it as inspection-only);
multi-grant floor attribution would make the *log* nondeterministic
across CLI versions if unpinned.

### Required Amendments

1. **Pin `settle()` termination**: pops the head, reports, continues on
   `ok: true`; on a refusal leaves the task at the head and **returns
   immediately**; `settle()` therefore terminates on every call.
2. **Correct the `--grant` matching rule**: matched by the runtime's
   rules — the exact requested principal, or a concrete `human:<id>`
   grant against a pending `human:*` intrinsic floor; `--grant human:*`
   itself is refused (`reserved-principal`).
3. **Define unmatched-grant behavior**: stderr warning, no exit-code
   change; multiple grants matching one pending `human:*` → first in
   command-line order (log attribution must be deterministic).
4. **Pin export framing and equality level**: UTF-8, one
   `JSON.stringify(envelope)` per line, LF, trailing newline; the
   required equality is `replay(parsedLog) == reported final state`
   (state-level; `undefined` payload values do not survive JSON); the
   byte-identical test asserts stdout and the export file separately
   (stderr excluded).
5. **Fix the exit-1 rationale**: approval denial is unreachable through
   `genome run` v0.1 (no deny surface; absent grants park at exit 3) —
   reword to "task failure; approval denial is reachable only through
   the runtime API in v0.1".
6. **Pin `run` invocation-error exits**: all invocation errors — missing
   `--workflow`, unknown options, malformed values — exit 2; requires
   overriding commander's default exit 1 (manual validation or
   `exitOverride`).

### Open-Question Recommendations

- **Q1 `--grant` — Yes, v0.1** (with Amendment 2). Only non-interactive
  way to demonstrate RFC-0004's approval mechanics at the boundary; the
  Condition-5 workflow is gated. Cost: a collector + ~15-line grant pass +
  two tests. Deferral: every governed workflow exits 3 forever; evidence
  degrades to the ungoverned workflow.
- **Q2 `--export-log` — Yes, v0.1.** CLI-boundary proof of the central
  invariant surviving serialization; ~20 LOC; deferral leaves the
  round-trip invariant untested and re-litigates persistence later with
  less context.
- **Q3 `--clock` — optional and public.** The guarantee is a public
  contract; `RuntimeOptions.clock` already exists; mandatory corrupts
  informational timestamps; hidden flags rot.
- **Q4 `--fail-step` — public, documented as a simulation aid.** Exit 1
  is a pinned public contract needing a public exercise path; it is
  configuration of the reference adapter below the seam. Test-only =
  a hidden flag anyone can find in the tests — worst of both worlds.
- **Q5 — `genome-adapter-reference`.** Makes "below the seam" a lexical
  property of the workspace; the alternative forces the naming decision
  again at the second adapter with an inconsistency already shipped.
- **Q6 — wait for a second consumer; pin the framing in the CLI contract
  now** (Amendment 4). The envelope is already spec-normative; only the
  governance home of the framing is deferred; pinning now is
  abstraction-before-example.

Operational note for evidence-runners: `pnpm typecheck -- --force` fails
(pnpm forwards `--force` into `tsc`, TS5093); `pnpm test -- --force`
happens to work. Uncached evidence runs should invoke turbo directly
(`turbo <task> --force`) or the DoD should name the exact incantations.

## Agreements Between Reviewers

Reached independently:

1. Verdict: **Approve with amendments** — neither found grounds to
   return; neither found an ADR conflict.
2. The `settle()` behaviors 1/3 contradiction is the most serious defect;
   both converged on the identical fix (return on first refusal).
3. All six open-question dispositions are **identical**: Q1 yes; Q2 yes,
   v0.1; Q3 optional/public; Q4 public, scoped/documented as a
   reference-adapter simulation aid; Q5 `genome-adapter-reference`;
   Q6 wait for a second consumer.
4. Commander's default exit behavior must be overridden to honor the
   pinned exit-2 class.
5. The adapter's derivable-from-log property is true (verified two ways)
   and the seam contract requires only disposability — derivability must
   not become precedent for provider adapters.
6. `--export-log` is not persistence today, and the boundary needs a
   mechanical guard (CA's tripwire; LE's no-read-path verification at
   phase close).
7. All 73 tests pass uncached; check-state is green; the Condition-5
   evidence invocation exists in the example document as written.

## Disagreements Between Reviewers

No material disagreements. Two differences of emphasis, both resolved by
union rather than choice:

1. On `--grant`, the CA amended *attribution semantics* (operator
   assertion, said out loud) while the LE amended the *matching rule*
   (floor compatibility) and *unmatched/multiple-grant determinism* —
   complementary; all three are carried into the consolidated list.
2. On DoD executability, the CA requires the git-diff check; the LE
   additionally requires naming exact uncached incantations — both
   carried.

## Decision Options

### Option A — Approve as Written

- **Consequences:** RFC-0006 is marked Accepted verbatim; queue intake
  proceeds on the current text.
- **Risks:** ships the settle() livelock ambiguity and the
  floor-incompatible `--grant` wording into a normative package contract;
  the exit-code table is violated by the parser's defaults; the DoD's
  no-contract-change item is unenforceable. Both reviewers verified these
  are textual defects, not hypotheticals.
- **Exact changes authorized:** marking the RFC Accepted; ADR + decision
  record; queue intake of the implementation item.
- **Exact changes prohibited:** any edit to the RFC text; any
  implementation beyond the RFC as written.
- **Board assessment: not recommended.**

### Option B — Approve with Amendments

- **Consequences:** the eleven consolidated amendments (§Joint Board
  Recommendation) are applied to the RFC text; the six open questions are
  resolved per the joint recommendations and folded in (open-questions
  section replaced by resolutions); the RFC is then marked Accepted; the
  acceptance ADR records the contracts; the implementation item enters
  the queue with the LE's change inventory as its scope.
- **Risks:** low — every amendment is a bounded wording change inside the
  RFC's existing structure; none alters the architecture both reviewers
  verified. Residual risks (suite runtime, export scope-creep pressure)
  are recorded and re-checked at the Phase 3 close review.
- **Exact changes authorized:** the eleven amendments, verbatim; the six
  open-question resolutions; status flip to Accepted; the acceptance ADR;
  queue and `PROJECT_STATE.md`/`IMPLEMENTATION_QUEUE.md` reconciliation
  per ADR-0007; implementation strictly per the amended RFC.
- **Exact changes prohibited:** any change to compiler or runtime public
  contracts; any log-reading code path; provider, persistence, trigger,
  Studio, or Office View work; any amendment beyond the eleven without
  returning to the Board.

### Option C — Return for Revision

- **Consequences:** RFC-0006 stays Draft; the author revises against the
  amendment list and resubmits for a second full Board review.
- **Risks:** pure process latency — both reviewers judged the amendments
  bounded and the architecture sound; a second full review would
  re-verify what has already been verified twice. Phase 3 stays blocked
  meanwhile.
- **Exact changes authorized:** RFC text revision only.
- **Exact changes prohibited:** everything else — no Accepted mark, no
  ADR, no queue intake, no implementation.
- **Board assessment: disproportionate** — reserved for the case where
  the Product Owner disputes an open-question disposition or amendment
  substance.

## Joint Board Recommendation

**Option B — Approve with Amendments**, with the following consolidated
amendment list (deduplicated; CA/LE origins noted):

1. `settle()` returns immediately on the first refused report; termination
   guaranteed. (CA-1 = LE-1)
2. `--grant` matching follows the runtime's rules: exact principal, or a
   concrete `human:<id>` against a pending `human:*` floor; `human:*`
   itself ungrantable. (LE-2)
3. Grant attribution is an operator assertion, stated normatively;
   self-responding principals need authentication and their own RFC. (CA-2)
4. Unmatched grants warn on stderr without changing exit codes; multiple
   grants matching one floor resolve to first-in-command-line-order. (LE-3)
5. Export framing pinned (UTF-8, one envelope per line, LF, trailing
   newline); equality pinned at state level; byte-identity asserted on
   stdout and export separately, stderr excluded. (LE-4)
6. Exit 1 rationale corrected: approval denial unreachable via `genome
   run` v0.1. (LE-5)
7. All `run` invocation errors exit 2; parser defaults overridden. (CA-5 = LE-6)
8. DoD no-contract-change item verified by empty git diff under
   `packages/genome-compiler` and `packages/genome-runtime` plus their
   unchanged suites. (CA-3)
9. DoD names exact uncached evidence incantations (`turbo <task> --force`
   or equivalents verified to work). (LE operational note)
10. Persistence tripwire: no shipped code path reads an exported log; any
    reader is the gate's "first consumer" and requires its own RFC. (CA-4)
11. `--fail-step` documented as defined by the reference adapter; a
    future adapter-selection surface does not inherit it. (CA/LE Q4)

Open questions resolved per the identical independent recommendations:
**Q1** `--grant` ships in v0.1; **Q2** `--export-log` ships in v0.1;
**Q3** `--clock` optional and public, a documented testing aid;
**Q4** `--fail-step` public, scoped per amendment 11; **Q5** the package
is `packages/genome-adapter-reference`; **Q6** the export format's spec
home waits for its second consumer, framing pinned in the RFC now.

## Decisions Requiring Product Owner Ratification

1. Which decision option (A / B / C) is ratified — the Board recommends B.
2. Adoption of the six open-question dispositions (identical independent
   recommendations; listed above).
3. Acceptance of the eleven-amendment list as the exact and complete set
   of authorized RFC changes.

## Exact Ratification Statements

For **Option B** (recommended):

> As Product Owner, I ratify RFC-0006 under Option B — Approve with
> Amendments: the eleven consolidated amendments in
> `docs/reviews/rfc-0006-board-review.md` are to be applied to
> `RFC/0006-reference-adapter-and-genome-run.md` exactly as written, the
> six open questions are resolved per the Joint Board Recommendation, and
> the RFC is then marked Accepted with its ADR and decision record.
> Implementation enters the Implementation Queue scoped to the amended
> RFC; no changes beyond the eleven amendments are authorized.

For **Option A**:

> As Product Owner, I ratify RFC-0006 under Option A — Approve as
> Written: the RFC is marked Accepted verbatim, over the Board's
> recommendation; the eleven amendments are declined; implementation
> enters the Implementation Queue scoped to the RFC text as drafted.

For **Option C**:

> As Product Owner, I ratify Option C — Return for Revision: RFC-0006
> remains Draft; the author revises against the Board's amendment list
> and resubmits for a new Architecture Board review; no ADR is recorded
> and no implementation is authorized.

## Status

Ratified 2026-07-13 — Option B. See the Status section at the top of this
document for the applied outcome.
