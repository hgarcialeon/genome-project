# RFC-0007 — Executor-Scoped Policies — Architecture Board Review

## Status

Review held 2026-07-14. **Awaiting Product Owner ratification.** This
review modifies nothing: the RFC text is untouched (the amendments below
are recorded here and applied only upon ratification), no implementation
exists, no queue entry is created, and no accepted document changes.

## Decision Under Review

- **Decision:** accept, accept-with-amendments, or return
  `RFC/0007-executor-scoped-policies.md` (draft, commissioned 2026-07-14
  by the Product Owner under the adopted Option A of
  `docs/PRODUCT_STRATEGY.md`, addressing Gap 1 of the ratified
  self-hosting evidence disposition).
- **Additional Product Owner direction for this review:** a **Language
  Complexity Budget** quantifying new syntax, new semantics, compiler
  changes, runtime changes, schema changes, CLI changes, and new
  language concepts — with an explicit Board evaluation of whether the
  added expressive power justifies the added complexity (§ Language
  Complexity Budget below).
- **HEAD under review:** `5e64377`, clean working tree, branch
  `claude/genome-bootstrap-report-wl08h4`.
- **Inputs read in full:** the RFC; `SPEC/language.md`;
  `SPEC/schema/genome.schema.json`; `SPEC/examples/company.yaml`;
  `docs/CONSTITUTION.md`; `docs/GOVERNANCE.md`; `docs/ARCHITECT.md`;
  ADR-0002/0003/0004/0005/0006/0008;
  `docs/reviews/self-hosting-evidence-board-review.md`; the compiler,
  runtime, and CLI sources and suites at the lines cited below.
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer). Per house discipline, every evidence
  claim in the RFC was re-executed against the repository rather than
  trusted from the RFC's word.

## Verified Evidence

All commands re-run at HEAD `5e64377` during this review. CLI commands
were invoked directly (true exit codes captured — `pnpm run` masks
nonzero child exit codes to 1, re-confirmed during this review). The
Gap 1 fixtures were reconstructed from the self-hosting proposal's
description, not copied from any prior artifact.

| RFC claim | Re-execution | Result |
|---|---|---|
| Mis-modeled variant runs ungated | Agent-scoped policy (`appliesTo: [engineering.engineering-agent]`) + `supervised` owner; `genome run … --workflow implement-queue-item`, no grant | ✅ **exit 0, 10 events, zero approval events, `Run run-1: completed`** — reproduced exactly |
| Corrected variant parks deny-safe | Same document, policy restated workflow-scoped; same ungated invocation | ✅ exit 3, `approval.requested`, `pending approvals: human:product-owner`, zero steps |
| Granted path attributes | Same, `--grant human:product-owner --clock 2026-07-14T00:00:00Z` | ✅ exit 0, `approval.granted` with `human:product-owner` as source and payload, completed |
| Behavior is specified, not a bug | `SPEC/language.md` Policy Scope ("initiation *by* that agent"); initiator resolution and policy union at `packages/genome-runtime/src/runtime/index.ts:122-159` | ✅ behavior matches spec text |
| Executor = owner in v0.1 | Every step assigned to `workflow.owner` (`runtime/index.ts:111-120`) | ✅ confirmed at source |
| Runtime already honors `workflow.governedBy` (zero-runtime-change basis) | `governingPolicies` unions workflow's and initiating agent's `governedBy`, deduplicated by id via `Set` (`runtime/index.ts:122-128`) | ✅ confirmed at source — derived edges would gate with no runtime change; dedup makes the workaround transition a no-op |
| Derivation target: no workflow→policy edge exists today | `genome graph` on the mis-modeled fixture | ✅ exactly one `requires` edge: `agent:engineering.engineering-agent → policy:queue-discipline` |
| "Extend the existing unbound-policy warning" has a real base | `packages/genome-compiler/src/semantics/index.ts:129-134`, warning severity; tested (`compiler.test.ts`, rule 6) | ✅ the diagnostic exists as claimed |
| `SPEC/examples/company.yaml` unaffected (Condition 5 safe) | Read in full: its only policy is workflow-scoped (`appliesTo: [build-feature]`) | ✅ confirmed; no agent-scoped policy in any shipped fixture either (see Finding 2) |
| Schema untouched by the proposal | `appliesTo` grammar in `SPEC/schema/genome.schema.json` | ✅ no change required |
| Repository health | `pnpm check-state`; `pnpm test -- --force` | ✅ exit 0; ✅ **93/93, 0 cached** (7/4/36/17/29) |

No evidence claim in the RFC failed re-execution. One claim required
correction of scope rather than substance (Finding 1).

## Findings

### Finding 1 (material) — evidence case 3 and DoD item 6 are mutually unsatisfiable as written

The RFC's evidence case 3 ("initiator binding retained… runtime-suite
level") requires a test in which **an agent initiates** a run governed by
an agent-scoped policy. This review verified that:

- **no such test exists today** — `runtime.test.ts` contains no
  agent-scoped policy at all (its autonomy fixture's only policy is
  workflow-scoped, `appliesTo: [guarded]`), and no reference to
  `governedBy`; the initiating-agent half of the `governingPolicies`
  union (`runtime/index.ts:126`) is exercised by **zero tests** at any
  boundary — a pre-existing coverage gap the RFC did not create but
  case 3 would close;
- agent initiation is **unreachable from the CLI** — `genome run`
  initiates as `human:operator` with no initiator option, so the test
  cannot live in the CLI suite;
- therefore case 3 requires a **new test in the runtime suite** — which
  DoD item 6 forbids (`git diff` under `packages/genome-runtime` empty,
  "the runtime suite (17 tests) passes byte-unchanged").

This is the same defect shape as the RFC-0006 case-4 erratum — an
evidence requirement inconsistent with the RFC's own constraints —
caught this time at review rather than after implementation, which is
where the house process wants it caught. Resolved by Amendment 1; the
RFC's substance is unaffected (the no-behavior-change evidence is
carried by the *existing* tests remaining byte-unchanged, not by the
suite being frozen against additive coverage).

### Finding 2 (supporting) — no existing assertion anywhere depends on the old binding

Searched every fixture and suite: no shipped fixture declares an
agent-scoped policy naming an agent that owns workflows (the compiler's
`dangling-applies-to.yaml` entries deliberately resolve to nothing; the
runtime-model test uses a workflow-scoped policy; the canonical example
is workflow-scoped). Consequently **no existing test asserts the
ungated behavior**, and the RFC's expectation that implementation is
additive-only outside the derivation site is confirmed. The RFC's
hedge ("none is known; an inventory is part of implementation") can be
discharged now: the inventory was done in this review and is empty.

### Finding 3 (minor) — determinism surface

The derived edges enter `genome graph` and diff-target output;
deterministic ordering must hold over them. Evidence case 9 already
pins byte-determinism for gated fixtures; the Board records that the
implementation's graph-construction ordering for derived edges must be
deterministic by construction (same discipline as ADR-0006's shared
canonicalization), and case 6 should assert a stable order, not just
presence.

## Open Questions — Board Answers

**OQ1 — Versioning: correct within v0.1.** Unanimous. No external
document exists to rely on the initiator-only reading (pre-adoption
stage, verified: the only affected declarations anywhere are the
self-hosting proposal's reconstructed variants); the change is monotone
deny-safe; and a v0.2 bump would imply v0.1's reading remains a
supported dialect — permanently freezing the one place the deny-safe
posture inverts into the language's first version. The Board treats
this as the specification-integrity correction the classification
already named.

**OQ2 — Autonomy boundary: confirmed, and the sentence becomes
normative.** "Autonomy governs the agent's initiative; policies govern
the agent's work" is adopted as the boundary rule. The Board verified
the load-bearing counterexample: manual agents owning governance
workflows execute correctly under human initiation today (runtime
suite; self-hosting evidence), and executor-scoped autonomy would refuse
those runs. Future autonomy RFCs inherit this sentence.

**OQ3 — Retain binding (a): confirmed (participation = initiate ∪
execute).** Executor-only binding would release the only gate on a
governed agent's *initiations* of workflows it does not own — a
deny-safe regression introduced by the very RFC that exists to close a
deny-safe inversion. Rejected without dissent.

**OQ4 — Diagnostic: keep, pinned to warning severity.** It extends an
existing diagnostic (verified above) rather than adding machinery, and
the inert shape it names (a policy applying only to manual, workflow-less
agents) is provably binding-free under the new semantics. Pinned: it
must remain a warning forever — a declared-ahead-of-wiring organization
is legitimate authoring, and this project does not hard-fail intent.

## Language Complexity Budget

Directed by the Product Owner for this review. Method: each dimension
is counted at the surface an author, tool author, or adapter author
touches; internal (implementation-side) cost is listed separately so
surface complexity is not hidden inside it. Counts are against the RFC
as amended.

| Dimension | Cost | Accounting |
|---|---|---|
| New syntax | **0** | No grammar production, field, token, or prefix. `appliesTo` accepts exactly what it accepts today. |
| New semantics | **1 widened rule (+1 boundary made explicit)** | The one real spend: agent-scoped `appliesTo` moves from initiator-binding to participation-binding. The autonomy sentence (OQ2) adds no behavior — it promotes an existing implicit boundary (verified in spec text and source) to normative text. |
| Compiler changes | **1 derivation rule + 1 diagnostic extension** | `requires` edges from owned workflows at graph construction; unbound-policy warning extended. 0 new stages, 0 new targets, 0 AST changes, 0 new diagnostic machinery. |
| Runtime changes | **0** | Verified at source: the shipped policy union already honors `workflow.governedBy`; the empty-diff expectation is real, subject only to Amendment 1's additive-test carve-out. No new events, no contract change. |
| Schema changes | **0** | `SPEC/schema/genome.schema.json` untouched. |
| CLI changes | **0** | No command, option, exit code, or output contract moves. `genome graph` output gains derived edges — more data through an unchanged contract. |
| New language concepts | **0 new constructs; 1 defined term** | "Participation" (an agent initiates or executes a run), with "executor = workflow owner" pinned for v0.1. This term is the budget's only durable liability: every future RFC touching policies, ownership, or multi-agent steps must respect it. |

**Hidden-complexity audit** (costs the table's zeros could conceal):

1. *One new cross-reference in the author's mental model:* an
   agent-scoped policy's binding set now depends on `owner` declarations
   elsewhere in the document. Assessed acceptable because the dependency
   direction is exactly the author's intent (that is the fix), it is
   resolved at compile time, and it is observable in `genome graph`
   (evidence case 6).
2. *A retained asymmetry:* workflow-scoped means "initiation of this
   workflow"; agent-scoped means "participation of this agent." Assessed
   coherent rather than complex: the two scopes now correspond
   one-to-one with the two governance sentences authors actually write
   ("this workflow needs sign-off" / "this agent's work needs
   sign-off").
3. *The v0.1 executor definition will move:* when multi-agent steps
   arrive (post-Gap-4 evidence, if ever), "executor" must generalize
   from "owner" to "any step performer." The term is defined so that
   this is an extension, not a redefinition; the Board records it as
   the known future cost.

**Expressive power gained, against that spend:**

- The dominant governance sentence becomes writable in one declaration,
  correct by construction, with the gate following every future owned
  workflow automatically — eliminating the hand-maintained enumeration
  invariant this review re-verified nobody enforces.
- The demonstrated silent-failure class closes: the one place a present
  declaration under-binds without diagnostic disappears, restoring the
  deny-safe posture everywhere.
- Corrected documents (the workaround shape) transition as no-ops
  (dedup verified at source) — the power is gained without a migration
  tax on anyone who did the right thing.

**Board evaluation (the Product Owner's question, answered
explicitly):** the added expressive power **justifies the added
complexity, unanimously** — and the budget shows why in an unusual
form. This RFC does not purchase new power with new surface; it makes
an *existing* declaration mean what it already reads as meaning. The
entire spend is one semantic rule and one defined term; syntax, schema,
CLI, and runtime surfaces are untouched. Author-facing complexity
*decreases*: the post-RFC language is simpler to use correctly than the
pre-RFC language plus its enumeration workaround. The Board has no
cheaper correction available: every alternative that spends less
(diagnostics-only, deprecation) leaves one of the two ratified grounds
unanswered, and every alternative that spends more (scope qualifiers)
buys expressiveness nobody has evidenced needing. As process, the Board
found the budget itself clarifying and **recommends (non-binding) that
future language-evolution RFCs carry a Language Complexity Budget
section** — adoption of that as standing process would belong to a
governance ADR, not this review.

## Amendments (recorded here; applied to the RFC only upon ratification)

1. **DoD item 6 rewording (resolves Finding 1):** "No runtime behavior
   change: `git diff` under `packages/genome-runtime` empty **except
   for additive test cases in `runtime.test.ts`**; the existing 17
   tests byte-unchanged and passing. (If implementation discovers a
   runtime *source* change is required, work stops and returns to the
   Board.)"
2. **Evidence case 3 placement pinned:** case 3 is a new runtime-suite
   case (agent initiation is unreachable from the CLI — verified), and
   it doubles as closure of the pre-existing coverage gap on the
   initiating-agent half of the policy union (Finding 1).
3. **Evidence case 6 sharpened (resolves Finding 3):** `genome graph`
   must show the derived workflow→policy `requires` edges **in a
   deterministic, pinned order**, not merely their presence.
4. **Open-question resolutions folded into the RFC text:** correct
   within v0.1 (OQ1); the autonomy boundary sentence becomes normative
   (OQ2); participation binding confirmed as initiate ∪ execute (OQ3);
   the extended diagnostic ships pinned to warning severity (OQ4).
5. **The case-3 hedge discharged:** replace "none is known; an
   inventory is part of implementation" with the review's verified
   result — no existing fixture or assertion anywhere depends on the
   old binding (Finding 2).

## Chief Architect Position

**Accept with the amendments.** Constitutionally, this is the rare RFC
whose acceptance *restores* a principle rather than trading against
one: Principle 9 (human governance first-class) is currently violated
in effect by the one construct that reads as governance and does not
govern, and Principle 3 (everything declarative) is served by removing
the imperative-flavored enumeration workaround. Boundary hygiene is
exemplary: the fix lives entirely behind the ADR-0002/0003 compiler
boundary, the rejected runtime-side alternative would have moved
language semantics below that boundary and was correctly rejected, and
the RuntimeModel shape is untouched so ADR-0004/0005 are undisturbed.
The complexity budget confirms the smallest-primitive test (Principle
8): one rule, one term, zero surface. The specification text (§3 of the
RFC) is the actual product change; the Board should hold implementation
to the amended evidence cases exactly.

## Lead Engineer Position

**Accept with the amendments.** Empirically: every claim re-executed
clean; the zero-runtime-diff expectation is not aspiration but verified
mechanics (the union is already shipped and already deduplicates); the
implementation is additive at every site — a derivation loop at graph
construction, a warning-condition extension, fixtures, and tests — with
no existing assertion anywhere to modify (Finding 2 closes the RFC's
own hedge). The one drafting defect (case 3 vs DoD 6) is exactly the
class this house now catches at review, and Amendment 1 both fixes it
and buys coverage for a shipped-but-untested code path — the review's
one genuine free lunch. Estimated implementation scope is small and
CLI-suite growth is bounded (two new subprocess cases; ~1.3 s at
current spawn cost — noted against the standing suite-runtime risk, not
blocking). One watch item for the record: the "executor = owner"
definition is load-bearing for replay semantics if multi-agent steps
ever arrive; Amendment 4's normative sentence is what future reviewers
will hold that RFC to.

## Agreements Between Reviewers

1. Every RFC evidence claim reproduced at HEAD; the two fixtures
   reconstructed independently behave exactly as the RFC states
   (exit 0 ungated / exit 3 parked / exit 0 attributed).
2. Finding 1 is a drafting defect, not a design defect; Amendment 1
   resolves it without weakening the no-behavior-change evidence.
3. All four open questions answered as recorded above, without dissent.
4. The complexity budget verdict: justified, unanimously — and the
   correct framing is "making an existing declaration true," not
   "adding a feature."
5. Nothing in this review opens Phase 4, touches the pending §4 or
   Level 1–3 dispositions, or reprioritizes the roadmap.

## Disagreements Between Reviewers

None material. One recorded emphasis difference: the Chief Architect
counts the OQ2 autonomy sentence as pure clarity gain (budget-neutral);
the Lead Engineer records it as the review's most consequential export,
since it pre-constrains every future autonomy RFC — both agree it
should be normative, and both bases are recorded for that future RFC's
reviewers.

## Decision Options

### Option A — Accept RFC-0007 with the five amendments

- **Consequences:** the RFC is accepted; the amendments are applied to
  its text; an ADR (next free number: `docs/adr/0009-…`) records the
  participation-binding decision and the autonomy/policy boundary; one
  implementation item enters `IMPLEMENTATION_QUEUE.md` (High) with the
  amended evidence cases as acceptance criteria; state documents are
  reconciled per the standing requirement.
- **Authorizes:** exactly the amended RFC's scope. **Prohibits:**
  everything else — no Phase 4, no schema change, no runtime source
  change, no new CLI surface.
- **Board assessment: recommended.**

### Option B — Accept narrowed to executor-only binding

- **Consequences:** as A, but agent-scoped policies bind execution
  only; initiator binding (a) is dropped.
- **Risks:** releases the existing gate on a governed agent's
  initiations of non-owned workflows — a deny-safe regression, from the
  RFC whose purpose is closing one. The Board notes the released path
  is currently exercised by zero tests, which would make the regression
  silent as well.
- **Board assessment: not recommended.**

### Option C — Return for revision

- For the case where the Product Owner disputes the v0.1 disposition
  (OQ1), an amendment, or the budget's accounting. No state changes;
  the draft remains a draft.

## Joint Board Recommendation

**Option A.** The evidence is fully reproduced, the design spends the
smallest possible budget on the largest verified defect in the
language, the one drafting flaw is resolved by amendment at review time
(where this house's process wants flaws caught), and the complexity
budget answers the Product Owner's question in the strongest available
form: the language becomes *simpler to use correctly*, not merely more
expressive.

## Exact Ratification Statements

For **Option A** (recommended):

> As Product Owner, I ratify Option A: RFC-0007 — Executor-Scoped
> Policies is accepted with the five amendments recorded in
> `docs/reviews/rfc-0007-board-review.md`, which shall be applied to
> the RFC text. The open questions are resolved as recorded (correction
> within v0.1; the autonomy/policy boundary sentence is normative;
> participation binding is initiate-or-execute; the extended diagnostic
> is pinned to warning severity). An ADR shall record the decision, and
> one implementation item shall enter `IMPLEMENTATION_QUEUE.md` with
> the amended evidence cases as its acceptance criteria. No other work
> is authorized.

For **Option B**:

> As Product Owner, I ratify Option B: RFC-0007 is accepted narrowed to
> executor-only binding, with the amendments otherwise applied as
> recorded. I acknowledge the Board's recorded deny-safe regression
> risk on initiator binding.

For **Option C**:

> As Product Owner, I return RFC-0007 for revision with the following
> direction: (state direction). No acceptance is recorded; the draft
> remains a draft.
