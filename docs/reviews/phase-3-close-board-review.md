# Phase 3 Close — Architecture Board Review

## Status

**Awaiting Product Owner ratification.** No decision in this document is
applied. Phase 3 remains open, the RFC-0006 erratum remains unapplied,
and no repository state changes with this review's landing except the
review itself.

## Decision Under Review

- **Decision:** Phase 3 closure.
- **Packet:** `docs/reviews/phase-3-close-packet.md` (prepared by the
  Lead Engineer, 2026-07-13)
- **Inputs read in full:** the packet;
  `RFC/0006-reference-adapter-and-genome-run.md` (Accepted, as amended);
  `docs/adr/0008-reference-execution-contract.md`; `PROJECT_STATE.md`;
  `IMPLEMENTATION_QUEUE.md`; the Phase 0–3 review's binding Conditions 4
  and 5 (`docs/reviews/phase-0-3-board-review.md`); the adapter, CLI,
  runtime, and compiler sources and suites.
- **HEAD under review:** `2e07d82`, clean working tree, branch
  `claude/rfc-0006-genome-bootstrap-bt067h`.
- **Process:** `docs/GOVERNANCE.md` / ADR-0007 — Phase Transition Review
  (Product Owner · Chief Architect · Lead Engineer); review-only
  iteration. Two role reviews were conducted 2026-07-13 against the
  repository, not the packet's word: every evidence claim was re-executed.
- **Scope locks honored:** no implementation, runtime, compiler, or
  RFC-0006 modification; no new RFC drafted; no decision applied.

The review answers exactly six questions, then presents the decision
options. The packet's §4 specification-maintenance proposal is **not
decided here** — it is severable from closure and awaits its own
disposition; nothing below depends on it.

## Verified Repository Evidence

All commands re-run at HEAD `2e07d82` on a clean tree; uncached where the
governance rules require it.

| Command | Result |
|---|---|
| `pnpm check-state` | ✅ exit 0 — consistent with the repository |
| `turbo typecheck --force` | ✅ 5/5 packages, 0 cached |
| `pnpm test -- --force` | ✅ **93/93, 0 cached** — adapter-reference 7, schema 4, compiler 36, runtime 17, CLI 29 |
| `git diff f576593..HEAD -- packages/genome-compiler packages/genome-runtime` | ✅ empty (0 lines) — `f576593` is the commit the RFC-0006 board review examined |
| `genome run SPEC/examples/company.yaml --workflow build-feature --grant human:engineering-manager` | ✅ exit 0, 16 events, `Run run-1: completed`, 6 steps — Condition 5, verbatim |
| `policy.enforced` emission sites in the runtime | exactly one, on the denial path (`packages/genome-runtime/src/runtime/index.ts:211`, `effect: "denied"`) — the erratum's factual basis confirmed at source |

The compiler (36) and runtime (17) suites are the ones the RFC-0006
review verified, unchanged and passing — together with the empty diff,
both halves of the no-contract-change Definition-of-Done item hold.

## The Six Questions

### Q1 — Is the implementation evidence sufficient to demonstrate that Phase 3 objectives were completed?

**Yes.** The phase's goal sentence — *execute a simple organization from
a Genome file* — is demonstrable at the CLI boundary, which is where this
project's evidence standard lives (Condition 5). The designated
invocation runs to completion through the reference adapter with exit 0
and the Board-verified 16-event sequence, reproduced at HEAD during this
review. All eight RFC-0006 evidence cases are implemented as named tests
and pass uncached; the amendment-specific behaviors (settle termination
on refusal, unmatched-grant warnings, operator-assertion attribution,
parser-default overrides) each have their own executable assertion. Every
Phase 3 roadmap deliverable is classified Done with evidence; none is
Deferred or De-scoped. One evidence item — case 4 — is currently
justified under a corrected reading of defective RFC text; that is Q2–Q4's
subject, not an evidence gap: the behavior it asserts is the verified,
accepted behavior of ADR-0005/RFC-0004.

### Q2 — Is the proposed erratum editorial, normative, or architectural?

**A normative correction — with zero behavioral change.** It is not
merely editorial: the affected sentence sits in the RFC's *Testing and
Executable Evidence* section and states a required assertion, so
correcting it changes what the specification demands as evidence. It is
not architectural: no contract, boundary, event, exit code, or behavior
moves; ADR-0008 is untouched in every decision; the runtime's
`policy.enforced` semantics (denial-path attribution, RFC-0004/ADR-0005)
are exactly what shipped and exactly what the correction defers to. The
current wording is self-contradictory as written — case 4 requires
exit 0 *and* an event that, in v0.1, is emitted only on a path that
terminates the run as `failed` (exit 1). A specification sentence that no
conforming implementation could satisfy is a defect in the text, not in
the implementation; both role reviews confirmed the RFC-0006 board
review's own verified 16-event sequence contains no `policy.enforced`
event, so the accepted evidence base never relied on the defective
wording.

### Q3 — Can the erratum be approved independently from Phase 3 closure?

**Yes.** The erratum corrects accepted RFC text to match the verified,
already-ratified runtime contract; its validity does not depend on
whether Phase 3 is open or closed, and closing or holding the phase does
not alter the text's defectiveness. The only coupling is prudential and
runs one way: closure *benefits from* the erratum being disposed first
(Q4), while the erratum needs nothing from closure. Since no errata
mechanism exists yet, this Board review is itself the approval vehicle,
with Product Owner ratification below.

### Q4 — Should Phase 3 close before or after disposition of the erratum?

**After.** The phase-close evidence standard should be judged against
specification text that the evidence actually satisfies. Closing first
would ratify the phase on a case whose specification sentence is known to
be unsatisfiable, then repair the sentence afterward — the causal chain
in the decision record would be backwards, and this project's governance
exists precisely to keep such chains readable without oral history. The
correct order is: dispose of the erratum, apply it to the RFC text, then
close the phase on evidence that conforms to the corrected text as
written. A single ratification act may authorize both, provided it fixes
this order of application (see Option A's risk note).

### Q5 — Does the repository now satisfy every accepted Phase 3 contract?

**Yes.** Walked explicitly:

- **Condition 4(a):** the adapter lives below the seam as the separate
  package `packages/genome-adapter-reference`, depending only on
  `@genome/runtime`; nothing above the seam names a provider — the
  reference adapter names none either. ✅
- **Condition 4(b):** `genome run` consumes compiled artifacts only
  (`compile → runtimeModelTarget → createRuntime`; the existing
  `compileOrFail` path) and introduces no state not reconstructible as
  `replay(log)` — its view derives exclusively from `subscribe()` and
  `state()`. ✅
- **Condition 4(c):** no retries, no persistence, no trigger binding
  grammars; the export is write-once with no shipped reader (tripwire
  re-verified at source: the CLI's only file reads are input documents
  and the schema). ✅
- **Condition 5:** reproduced verbatim at HEAD, covered by CLI-boundary
  tests in `packages/genome-cli/src/cli.test.ts`. ✅
- **ADR-0008 decisions 1–7:** naming convention instantiated (1); settle
  contract implemented and unit-tested including the hold-at-head refusal
  case (2); grant semantics deny-safe with event-order application,
  first-in-command-line-order floor resolution, stderr warnings (3); exit
  codes 0/1/2/3 with parser defaults overridden and tested (4); export
  framing pinned and asserted, replay equality at state level (5);
  determinism tested under `--clock` byte-identically and without it by
  timestamp-excluded sequence equality (6); scope locks held — no
  providers, persistence, triggers, Studio, or Office View, and
  `--fail-step` documented as reference-adapter-scoped (7). ✅
- **RFC-0006 Definition of Done:** every item checked, including the
  empty-diff verification and the named uncached incantations, which this
  review re-ran. The standing reconciliation clause is satisfied
  (`PROJECT_STATE.md`, `ROADMAP.md`, `IMPLEMENTATION_QUEUE.md` reflect
  the landed work; `check-state` green). ✅

The single caveat is the case-4 wording itself — resolved by the erratum
under Q2–Q4, not by any repository change.

### Q6 — Are there any remaining architectural risks that justify keeping Phase 3 open?

**No.** The packet's six recorded risks were each examined:

1. *Pending erratum* — a text-disposition question, answered by the
   ordering in Q4; keeping the phase open does not repair text.
2. *CLI suite runtime growth* — operational; the recorded mitigation
   path exists and is explicitly flagged as requiring its own decision
   (build scripts) before use. Not a phase-scope risk.
3. *Export scope-creep pressure* — the mechanical gate stands (any
   reader of an exported log is the persistence gate's first consumer
   and requires an RFC); holding the phase open adds no protection the
   gate does not already provide.
4. *`dispatched` misuse* — doc-commented inspection aid; the event log
   remains the sole observation surface. Monitoring item.
5. *Raw `human:*` at exit 3* — cosmetic output polish; explicitly not a
   contract defect.
6. *Derivability-not-precedent* — already recorded normatively in
   ADR-0008; binds future adapter RFCs, not this phase.

None of these is discharged by keeping Phase 3 open, and none impairs the
phase's contracts. Phase 3's remaining function — producing its evidence —
is complete; the phase now has no undone work an open status would track.

## Chief Architect Review

### Verdict

**Close, with the erratum disposed first.** The packet is disciplined: it
answers one question, its evidence is executable, and its two proposals
(erratum, maintenance mechanism) are correctly severed from the closure
decision. Constitutional check: the closure claims rest on executable
artifacts, not narrative (Principle 7); the erratum path honors
Principle 1 — the specification is the product, so defective accepted
text is repaired deliberately and on the record, never silently; and the
refusal to patch the runtime to match a defective sentence is exactly the
right direction of authority — implementations serve the specification's
*ratified intent*, which the verified 16-event sequence documents. The
boundary analysis under Q5 found no drift: the seam, the compiler
boundary, and the replay invariant are all as accepted. On Q2, the
classification matters beyond this case: calling a normative-but-
behavior-preserving correction "editorial" would understate it, and
calling it "architectural" would force a full RFC cycle for a sentence —
either misclassification damages the precedent this first erratum sets.

### Risks put on the record

Closing Phase 3 obliges `PROJECT_STATE.md` to name a new current phase,
and `check-state` requires its Current Phase line to begin with a
verbatim `ROADMAP.md` phase heading. Naming "Phase 4 — Studio Prototype"
as current-but-not-started is a statement of position, not a work
authorization — Phase 4 work still requires its own RFC (Governance
Rule 2), and the application wording must say so explicitly, or the state
file will read as an opened phase. This is an application condition, not
a reason to hold Phase 3.

## Lead Engineer Review

### Verdict

**Close, with the erratum disposed first.** Every packet claim was
re-executed rather than trusted: the uncached suite (93/93), typecheck
(5/5), `check-state`, the empty protected diff against the exact commit
the RFC-0006 review examined, the Condition 5 run (exit 0, 16 events,
6 steps), and the single `policy.enforced` emission site with
`effect: "denied"` at `runtime/index.ts:211`. The eight evidence cases
map to real, named tests; the mapping in the packet's §1 is accurate,
including the extras (floor variant, unmatched-grant warning, no-clock
sequence equality) from the review-time evidence inventory. On Q2, the
empirical framing: the erratum's litmus is whether any test or behavior
must change — none does; the shipped case-4 test already asserts the
corrected reading and passes, and applying the erratum changes zero
executable artifacts. On Q4: dispose first — the alternative leaves a
window where the phase-close decision record cites evidence its own
specification text contradicts, which is exactly the class of latent
confusion the bootstrap protocol exists to prevent.

### Operational notes

Erratum application, when ratified, is a text edit to the RFC plus a
pointer at the corrected site and removal of the deviation comment in
`cli.test.ts` *if the Board wishes* — the comment is accurate history and
may equally stand; recommend leaving it, rewritten to cite the erratum.
Post-closure application must keep the `PROJECT_STATE.md` Current Phase
line `startsWith`-compatible with a `ROADMAP.md` heading (both candidate
wordings should be verified against `pnpm check-state` before commit, per
the Phase 0–3 review's Condition 8 precedent).

## Agreements Between Reviewers

1. Q1 **yes**; Q5 **yes** — every accepted contract verified at source.
2. Q2: **normative correction, zero behavioral change** — unanimously
   neither editorial nor architectural.
3. Q3 **yes** — severable; Q4 **after** (erratum first).
4. Q6 **no** — all six recorded risks are monitoring or application
   items; none is discharged by an open phase.
5. The application conditions: (a) erratum applied before the closure
   state change; (b) closure wording names the next phase without opening
   it — Phase 4 work requires its own RFC; (c) `check-state` verified on
   the application commit.

## Disagreements Between Reviewers

None material. One emphasis difference: the CA weighs the erratum-first
order as precedent-setting for specification maintenance; the LE weighs
it as decision-record hygiene. Both land on the same order.

## Decision Options

### Option A — Close Phase 3 and approve the erratum

- **Consequences:** one ratification act authorizes both; application
  order is fixed within it (erratum text applied to RFC-0006 case 4
  exactly as worded in the packet's §3, then the closure state change),
  followed by one reconciliation commit satisfying the application
  conditions above.
- **Risks:** low — identical end state to Option B. The single act must
  pin the internal order explicitly; an application that closes first and
  corrects second would reproduce the backwards causal chain Q4 rejects.
- **Exact changes authorized:** the erratum wording, verbatim; the Phase
  3 closure updates to `PROJECT_STATE.md`, `ROADMAP.md`,
  `IMPLEMENTATION_QUEUE.md`; nothing else.
- **Exact changes prohibited:** any compiler/runtime change; any other
  RFC-0006 edit; opening Phase 4 work; adopting the maintenance
  mechanism (separate disposition).
- **Board assessment: acceptable** — materially equivalent to B when the
  internal order is honored.

### Option B — Approve the erratum first, then close Phase 3

- **Consequences:** two ratification acts. First: the erratum is
  approved and applied to RFC-0006 (the packet §3 wording, verbatim, plus
  a pointer at the corrected site). Second: Phase 3 is closed on evidence
  that conforms to the corrected text as written, with the same
  reconciliation and application conditions.
- **Risks:** minimal — pure process cost of a second ratification. In
  exchange, each ratification is bounded to one decision class, the
  decision record's causal chain reads forward, and the first-ever
  erratum has its own clean precedent artifact.
- **Exact changes authorized:** step 1 — the erratum edit only; step 2 —
  the closure state changes only.
- **Exact changes prohibited:** as Option A.
- **Board assessment: recommended.**

### Option C — Keep Phase 3 open

- **Consequences:** the phase remains active with no undone deliverable
  to track; the erratum may still be disposed independently (Q3).
- **Risks:** the state file's "active" claim stops corresponding to any
  remaining work, eroding the single-source-of-truth discipline the
  project enforces mechanically everywhere else; the evidence base does
  not improve with time.
- **Exact changes authorized:** none.
- **Exact changes prohibited:** everything above.
- **Board assessment: not recommended** — Q6 found no risk an open phase
  mitigates; reserved for the case where the Product Owner disputes the
  erratum's classification or the evidence's sufficiency.

## Joint Board Recommendation

**Option B — approve the erratum first, then close Phase 3**, with the
application conditions recorded in Agreements item 5. Option A is an
acceptable single-act alternative when its internal order is pinned.

## Decisions Requiring Product Owner Ratification

1. Which option (A / B / C) is ratified — the Board recommends B.
2. The erratum's classification (normative correction, zero behavioral
   change) and its wording, exactly as in the packet's §3.
3. Confirmation that the packet's §4 maintenance-mechanism proposal is
   deferred to its own disposition and is not decided by this review.

## Exact Ratification Statements

For **Option B** (recommended):

> As Product Owner, I ratify the Phase 3 close review under Option B:
> the RFC-0006 case-4 erratum is approved as a normative correction with
> zero behavioral change and is to be applied to
> `RFC/0006-reference-adapter-and-genome-run.md` exactly as worded in
> `docs/reviews/phase-3-close-packet.md` §3; upon its application,
> Phase 3 is closed on the evidence verified in this review, applying
> the recorded application conditions. Phase 4 is not opened; its work
> requires its own RFC.

For **Option A**:

> As Product Owner, I ratify the Phase 3 close review under Option A:
> in a single act, the RFC-0006 case-4 erratum is approved and applied
> exactly as worded in `docs/reviews/phase-3-close-packet.md` §3, and
> Phase 3 is then closed on the evidence verified in this review,
> applying the recorded application conditions in that order. Phase 4
> is not opened; its work requires its own RFC.

For **Option C**:

> As Product Owner, I ratify Option C: Phase 3 remains open. The erratum
> and the maintenance-mechanism proposal await separate disposition; no
> state change is applied.
