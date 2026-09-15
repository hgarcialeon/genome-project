# Architecture Board Review — RFC-0011: Semantic Authoring Operations (`add-workflow`)

**Convened:** 2026-09-14
**RFC under review:** `RFC/0011-add-workflow-authoring-operation.md` (Draft)
**Commit under review:** `8f7a559`
**Board:** Product Owner · Chief Architect · Lead Engineer (process, per `docs/GOVERNANCE.md`)

This review **applies nothing**. It is a Board recommendation; the disposition
belongs to the Product Owner. RFC-0011 was not modified, `add-workflow` was not
implemented, Studio was not modified, no implementation-queue item was added,
Milestone 2 was not opened, Phase 5 was not opened.

**Method.** Every material claim was **re-executed against the repository**, not
read from the draft. Probes ran in throwaway files inside the workspace (removed
immediately) and in the scratchpad; **no repository file was modified to produce
this evidence**. Where the draft and the repository disagree, the repository
wins — and in one case (§7) it does.

---

## 1. Problem classification — CONFIRMED

The demonstrated consumer is real and is recorded, not hypothetical. Milestone-1
product acceptance was **rejected** on 2026-09-13 because a user could not
perform the canonical organizational change without editing Genome source.
RFC-0010 closed that for `add-agent` only. "Make Engineering Perform Governed
Work" is the next product experiment, dispositioned by the Product Owner on
2026-09-14.

Re-executed: the journey reuses existing agents, existing policies, existing
compiler semantics, the existing runtime, the reference adapter and ephemeral
execution. Adding **one** workflow owned by an existing agent, with `policies:`
untouched, produces a complete governed run — park at exit 3, attributed grant,
three attributed steps, completion at exit 0.

**No scope expansion is evidenced as necessary.** The Board explicitly rejects
`add-policy`: the canonical scenario is satisfied by an existing policy through
RFC-0007 participation binding.

## 2. ADR-0012 consumer gate — CLEARED

The gate asks for a demonstrated consumer, not symmetry. The justification on
record is the product experiment and the acceptance failure that preceded it —
**not** "`add-agent` exists, so workflow CRUD should too." The Board notes
approvingly that the RFC declines `edit-workflow` and `delete-workflow`, which a
symmetry argument would have carried along and a consumer argument does not.

The gate is cleared **for this one operation only**. A third operation returns to
this gate on its own evidence.

## 3. Operation ownership — INTACT, WITH ONE AMENDMENT REQUIRED (see §5)

The durable split is preserved in the draft's structure: Studio captures intent
and presents compiler-derived meaning; `@genome/authoring` owns intent → source;
the compiler owns source → meaning; the runtime executes the accepted model. No
new package: this is an expansion of `@genome/authoring` under ADR-0012. No
workflow placement rule moves into Studio.

One wording defect threatens this and is addressed in §5.

## 4. Intent contract — CONFIRMED as authoring constraints, not language rules

Re-executed against the compiler. Every shape the operation declines to generate
**still compiles today**:

| Document shape | Compiles? | Runtime consequence |
|---|---|---|
| no `steps` key | **yes** → `steps: []` | one task emitted with `step=undefined` |
| `steps: []` | **yes** → `steps: []` | same |
| `steps: [""]` (empty string) | **yes** → `steps: [""]` | a task with an empty step label |
| one step / three ordered steps | yes | dispatched in order |
| ownerless workflow | **yes** (exit 0 on `validate`) | runtime refuses: `ownerless-workflow`, exit 2 |

The contract (`id`, `owner`, ≥1 non-empty step required; `trigger` optional and
`"manual"` only) therefore constrains **generation**, not validity. Documents
Genome accepts remain accepted, and a user may still hand-write any of the above
in the editor. This matches the `add-agent` precedent, whose intent requires
`department` and `id` while the language requires neither.

**Trigger:** confirmed not broadened. An omitted trigger is resolved by the
compiler to `manual` (deny-safe); `event`/`schedule`/`webhook` remain accepted
vocabulary with no executable grammar in v0.1, and the operation correctly
refuses to offer them.

## 5. Owner resolution — **AMENDMENT REQUIRED (A1)**

This is the review's principal boundary finding.

**The defect.** RFC-0011 §5 permits the operation to preflight the owner
"against the agents of the parsed source." Enumerating agents from *parsed
source* is exactly `buildAgentIndex` — dotted references that skip the
`teams`/`agents` container keys, with department-level and team-level forms. That
is compiler-owned semantics, and the wording as drafted permits it to be
reimplemented inside `@genome/authoring`.

**The `add-agent` precedent does not cover it.** Re-read at source:
`applyAddAgent` compiles the original document first ("The compiler decides; we
do not re-check"), and its step-3 preflight is purely **structural** —
`mappingAt(document, ["departments", id])` asks whether a mapping key exists. Owner
resolution is **semantic**, not structural. The precedent authorizes the former
only.

**The fix is already available in the operation's own shape.** `applyAddWorkflow`
must compile the original source anyway to produce `invalid-source`. That compile
yields compiler-derived meaning. Re-executed:

```
compile(original).ok: true
runtimeModelTarget(before.graph).agents[].reference
  → ["governance.chief-architect","governance.lead-engineer","engineering.engineering-agent"]
```

Membership-testing the intent's owner against that **compiler-produced** list
resolves nothing itself and reproduces no rule. This is Option **A** of the
Board's brief, and it is viable today.

**A1 (required).** Amend §5 to state that owner preflight **must** consume an
accepted compiler-derived representation obtained from the step-1 compile of the
original source, and **must not** enumerate, resolve or interpret agent
references from parsed source. Authoring performs a membership test over
compiler output; it never performs resolution. The compiler remains authority,
and the candidate compile (step 5) remains the backstop.

## 6. `unknown-owner` classification — CONFIRMED as `invalid-intent`, conditional on A1

The classification must follow ownership, and with A1 applied it does: the fact
"this reference is not an existing agent" is **established from compiler-derived
meaning**, so refusing it as an intent problem does not relocate a semantic
judgment into authoring. Without A1 the classification would be a distortion of
the taxonomy for friendlier UI, which the Board would reject.

The Board requires that both paths agree: an owner that passes preflight but
fails the candidate compile must still surface as `invalid-result` with compiler
diagnostics verbatim. The taxonomy is not bent; the compiler keeps the last word.

## 7. Workflow-id conflict scope — **AMENDMENT REQUIRED (A2): the draft's rationale is factually wrong**

The Board re-executed this and found the RFC's stated justification incorrect in
a way that matters.

**What the draft says.** §12: a duplicate id must be refused because "a duplicate
key would otherwise fail at parse — `Map keys must be unique`."

**What actually happens.** That parse error occurs only for a *hand-written*
document containing two literal keys (confirmed: `Map keys must be unique at line
75, column 3`). It **cannot** arise from this operation, because the preservation
machinery writes with `document.setIn(...)`, which **silently overwrites**:

```
setIn(["workflows","rfc-lifecycle"], {owner: engineering.engineering-agent, steps:["hijacked"]})
  candidate compiles: true          ← no parse error at all
  rfc-lifecycle now: owner=agent:engineering.engineering-agent, steps=["hijacked"]
  original 5 steps survived: FAIL
```

Without the pre-check, `add-workflow` would **silently destroy an existing
workflow — its owner, trigger and every step — and return `ok`, with a candidate
that compiles cleanly.** The hazard is not malformed YAML; it is **undetectable
data loss in the user's canonical source**.

The RFC reaches the right *requirement* (pre-check before writing) from the wrong
*reason*, and consequently under-specifies its evidence: E23 as drafted asserts
only that a duplicate is refused.

**A2 (required).** Correct §12's rationale to state the actual hazard — `setIn`
overwrites silently, so the pre-check exists to prevent destruction of an
existing workflow, not to avoid a parse error. Strengthen the evidence
accordingly (see A7/E38).

**Confirmed unchanged by this amendment:**

- workflows are **one** top-level mapping; `checkDuplicates("workflows", …)`
  scopes uniqueness to exactly that mapping;
- a workflow id equal to an existing **policy** id compiles with **0
  diagnostics** — re-executed;
- a workflow id equal to an existing **agent** id likewise compiles — re-executed;
- therefore **no cross-category or global uniqueness rule is introduced**, and
  the conflict remains operation-level, not new language semantics.

## 8. Steps semantics — CONFIRMED

Re-executed (table in §4). Requiring ≥1 non-empty step is a **product/authoring
constraint** whose purpose is to avoid exposing the known zero-step runtime sharp
edge — `assignStep` indexes `workflow.steps[0]`, emitting
`agent.task.assigned … step=undefined` and reporting "completed steps: 1" for a
workflow with none.

The Board confirms: **no runtime behaviour is modified by this RFC**, and no
structured steps, branching, artifacts, IO, retries or step DSL are introduced.
Gap 3 and Gap 4 remain untouched and un-needed.

## 9. Governance consequence — CONFIRMED, both cases

Re-executed against the canonical example with `policies:` untouched:

| Owner | `governedBy` | Required principals |
|---|---|---|
| `engineering.engineering-agent` | `["policy:queue-discipline"]` | `["human:product-owner"]` |
| `governance.chief-architect` | `[]` | none — run completes unapproved |

Both are **correct existing semantics**: the first through RFC-0007 / ADR-0009
participation binding (agent-scoped policy → derived workflow→policy `requires`
edge), the second because no policy scopes that owner or that workflow. No policy
mutation occurs in either case.

## 10. Governance preview source — CONFIRMED

`candidate source → compiler → runtimeModelTarget → RuntimeWorkflow.governedBy →
RuntimePolicy.requiresApprovalFrom` uses compiler-derived meaning throughout.
Studio joins no raw YAML and reimplements no policy applicability; the join from
policy id to principals is performed **by the runtime-model target**, not by the
view.

The Board endorses the draft's rejection of the two alternatives, and
particularly its rejection of reading the *current* model's
`RuntimeAgent.governedBy`: predicting the derived edge before compiling would
reproduce participation binding inside the view.

## 11. Initiator dependency — **AMENDMENT REQUIRED (A3): the claim is true for Studio today but not stated normatively, and does not generalise**

The Board re-executed the gate calculation and found the draft's claim correct
for Studio's current default **and materially incomplete as written**.

**Verified.** `STUDIO_OPERATOR = "human:operator"` is a human principal, so
`governingPolicies` finds no initiating agent and the effective gate set equals
the workflow's compiled `governedBy`. On the canonical scenario both initiators
happen to coincide.

**But `initiatedBy` is a parameter, not a constant.** `startSession({… initiatedBy
= STUDIO_OPERATOR …})` takes `initiatedBy?: string` as an overridable default —
the same seam pattern as `failSteps` and `clock`, which the Milestone-1 UI also
never sets.

**And the sets genuinely diverge.** Constructed and re-executed — a supervised
agent with no agent-scoped policy, owning an ungoverned workflow:

```
compiled governedBy: []        → preview: "No approval policy applies…"
initiator human:operator      → status=running          approval.requested=(none)
initiator engineering.dev     → status=pending-approval approval.requested=["human:*"]
```

Identical compiled `governedBy`; different effective gates. The supervised
intrinsic floor is a property of **the initiator**, and it appears in no
workflow's `governedBy`.

**A3 (required).** Amend §8 to scope the preview normatively to **the execution
principal Studio actually initiates as** (`STUDIO_OPERATOR`), stating that the
equality "effective gates = `RuntimeWorkflow.governedBy`" holds *because* that
principal is a human and not a declared agent, and that it does not hold for
agent-initiated runs. The UI must not imply governance is intrinsic to the
workflow. If a future milestone lets Studio initiate as an agent, the preview
returns to the Board.

**No runtime governance semantics are changed**; this is an accuracy and wording
requirement on the RFC.

## 12. Candidate compilation — OQ1 and OQ2 RESOLVED

**OQ1 — no new ADR.** The Board agrees with the drafter. ADR-0012 already decides
that the compiler owns *source → meaning*, authoring owns *intent → source*, and
views collect intent and present results. Compiling a **transient** candidate to
display a compiler-derived consequence is that decision applied to a
non-canonical input: Studio already compiles on every keystroke-driven edit, and
only the input's lifetime differs. No new durable boundary is established, so
**no ADR is required.** The Board records the reasoning here so a future view can
cite it without inferring a precedent that was never decided.

**OQ2 — `applyAddWorkflow` stays source-oriented.** It must **not** return
compiler targets. The Board adopts the recommended shape: Studio calls the pure
operation speculatively to obtain candidate source without committing it, then
compiles that candidate through the existing compiler for the preview. Widening
the authoring result contract to save one synchronous compile of a small document
is unjustified — no evidence of harmful duplication was offered, and a narrow
"source in, source out" contract is the thing keeping the boundary legible.

## 13. Preview timing — OQ4 RESOLVED: **before Create**

The experiment exists so the user understands governance over work they are
defining. A preview available only after creation cannot satisfy "understand what
governance will apply" *before commitment*, and the failure mode in RFC-0011 §15
is precisely a user who learns the consequence too late.

**Accepted:** after selecting or changing the owner, Studio previews the
compiler-derived governance consequence of the candidate **before Create**.
Illustrative copy — governed: "Approval required from `human:product-owner` via
`queue-discipline`."; ungoverned: "No approval policy applies to this work with
the selected owner." Exact copy is product/UI; **the facts must be
compiler-derived**, and per A3 scoped to Studio's execution principal.

## 14. Candidate state authority — CONFIRMED, evidence to be strengthened (A4)

The draft is correct in principle: before Create the canonical source is
unchanged and the candidate exists only for preview; after Create the returned
source enters the ordinary editor lifecycle and the compiler produces normal
projections. No hidden second source of truth.

The Board requires this be **visible in tests** rather than asserted in prose —
see A4. Candidate graph/runtime models must never replace the current
organization projections before Create.

## 15. Public API shape — CONFIRMED

One named operation, `applyAddWorkflow`. No dispatcher, no generic operation
vocabulary, no edit/delete. The existing `AuthoringResult` architecture is reused
without breaking RFC-0010: the four failure classes are unchanged in shape, and
`add-agent`'s exported surface is untouched.

## 16. Workflow id — OQ3 RESOLVED: **user-supplied**

`id` remains explicitly supplied in the intent. No slug generation or id-shaping
semantics are introduced without consumer evidence; deriving an identifier from a
typed name would place a durable identifier rule inside the product where no
decision records one.

Studio may present the concept in understandable language. The Board records the
residual first-time-user friction — a user must supply an identifier in the
accepted form — as a **product UX concern for the acceptance walkthrough**, not
as a reason to hide id derivation inside this RFC. If the walkthrough shows it
blocks the journey, it returns as its own decision.

## 17. Ungoverned wording — OQ5 RESOLVED

Ungoverned work is **valid** and must not be presented as an error. The copy must
accurately state that no approval policy applies under the selected owner, and
must not imply Genome malfunctioned, imply that all workflows require approval,
or pressure the user toward a governed owner to make the demo work. The canonical
journey may deliberately use the governed owner; the negative case exists as
transparency evidence (§18 of the RFC).

## 18. Source preservation — CONFIRMED by re-execution

RFC-0011 reuses RFC-0010's accepted mechanism and defines no new one. The Board
re-executed a representative insertion into `SPEC/examples/genome-project.yaml`
using the same machinery (`parseDocument` + `setIn` + `toString({lineWidth:0})`):

| Check | Result |
|---|---|
| Governance disclaimer (`NON-NORMATIVE FOR GOVERNANCE`) preserved | **PASS** |
| `policies:` block byte-identical | **PASS** |
| Every original comment line preserved | **PASS** |
| Unrelated agents and workflows intact | **PASS** |
| Deterministic — byte-identical across repeated runs | **PASS** |
| Added lines only; no document-wide rewrite (every original line present) | **PASS** |
| Net line delta | **+7** |

## 19. Failure model — CONFIRMED, with §6 and A2 applied

Reuse of `invalid-source` / `invalid-intent` / `conflict` / `invalid-result` is
correct. Compiler diagnostics remain verbatim where compiler-owned; `Diagnostic`
and `CompileStage` do not widen; no failed operation returns `source`; conflict is
limited to an actual `workflows` mapping collision. With A1 and A2 applied, no
semantic failure is reclassified as an authoring failure for UI convenience.

## 20. Runtime sharp edges — CONFIRMED handled by constraint only

Both the ownerless refusal and the zero-step `step=undefined` emission are
handled **solely** by constraining what authoring generates. **No compiler or
runtime fix is authorized.** The RFC's §20 stop condition stands: if
implementation requires changing those accepted behaviours, work stops and
returns to the Board, and the change must not be hidden inside
`@genome/authoring`.

## 21. Existing policy reuse — CONFIRMED

Canonical product acceptance completes with existing agent
`engineering.engineering-agent`, existing policy `queue-discipline` and principal
`human:product-owner`. Re-executed with `policies:` byte-identical: park at exit
3 → attributed `approval.granted` before any step → three attributed task pairs →
`workflow.completed` at exit 0. **No `add-policy`, no policy edit, no
fixture-only mutation.**

## 22. Studio execution path — CONFIRMED

The selector is populated from the compiled runtime model
(`workflows.map(…)` over `RuntimeModel.workflows`), and `CANONICAL_WORKFLOW`
appears exactly once outside tests — as the initial value of
`useState<string>(CANONICAL_WORKFLOW)`. It is a default selection, **not** an
execution restriction. A newly created workflow appears and runs through the
existing surface; **no special `add-workflow` run path is added.**

## 23. Accessibility — CONFIRMED, one clarification folded into A3/A4

The WCAG 2.2 AA floor is correctly inherited and not expanded. The Board
emphasises two items as load-bearing for *this* surface: the governance preview
must be **programmatically exposed** (it carries the decisive product meaning, so
it cannot be visual-only), and the ungoverned state must **not be conveyed by
colour alone**. Both are already in RFC-0011 §19; the Board records them as
non-negotiable rather than illustrative.

## 24. Evidence E1–E37 — necessary, non-redundant, **six additions required (A4–A7)**

The Board reviewed all 37 cases. They are necessary and materially
non-redundant; the authoring, boundary, preservation and execution families are
well covered. Four gaps and two strengthenings:

| # | Required addition |
|---|---|
| **E38** | **Conflict is non-destructive**: on a duplicate workflow id the operation refuses **and** the existing workflow is byte-unchanged — its owner, trigger and every step intact. Directly evidences the §7 hazard. *(strengthens E23)* |
| **E39** | **Owner preflight is compiler-derived**: authoring resolves no reference itself; the accepted-owner set originates in a compiler projection of the original source. Evidences A1. |
| **E40** | **Preview is initiator-scoped**: the previewed gate set equals the effective gate set **for `STUDIO_OPERATOR`**, with the divergence under an agent initiator recorded so the scoping cannot silently regress. Evidences A3. |
| **E41** | **Candidate is not canonical before Create**: canonical source, graph and tree projections are unchanged while a preview is displayed; candidate projections never replace current ones. Evidences §14. |
| **E42** | **No generic dispatcher**: the public surface exposes exactly two named operations (`applyAddAgent`, `applyAddWorkflow`) and no dispatch/operation-name vocabulary. |
| **E43** | **Ungoverned run emits no false approval evidence**: the ungoverned-owner case completes with **zero** `approval.*` and zero `policy.enforced` events. *(complements E17, which covers projection only)* |

Product acceptance remains **mandatory and not replaceable by CI** — confirmed
unchanged.

## 25. Language Complexity Budget — VERIFIED

**New cost, as claimed:** the `add-workflow` authoring operation; a workflow
source transformation; a `@genome/authoring` API expansion; a minimal Studio
Create-work interaction; a compiler-derived governance-preview interaction.

**Claimed-zero dimensions, checked:** Genome language, schema, compiler, runtime,
event taxonomy, revision, policy semantics, team semantics, persistence,
providers, triggers — **all genuinely zero.** The Board specifically checked the
two dimensions most at risk of a concealed non-zero: the runtime sharp edges
(§20 — handled by constraint, not by change) and policy semantics (§9 —
governance is *derived* by existing participation binding, with no policy
mutation).

The amendments A1–A3 **reduce** rather than increase the budget: A1 removes a
permitted semantic duplication, A2 corrects a rationale, A3 narrows a claim.

## 26. Scope containment — VERIFIED

RFC-0011 authorizes none of: `add-policy`, `add-team`, `edit-workflow`,
`delete-workflow`, a generic workflow builder, a generic mutation dispatcher,
team ownership, team governance, declarable humans (Gap 2), Gap 5 approval
expansion, persistence, Runtime Logs / Milestone 2, providers, external triggers,
Phase 5, Office View, Marketplace, or simulation. The RFC's closing section
states this explicitly and the Board confirms the body does not contradict it.

## 27. Product acceptance — CONFIRMED

The test remains **"Make Engineering able to perform a new governed task,"** the
reviewer receives no YAML instructions, and the decisive comprehension question
remains **"What caused this work to require approval?"** A technically successful
run is insufficient if the reviewer cannot explain the governance consequence
from Studio alone. The negative owner case is exercised as transparency evidence.

The Board endorses the A/B/C characterisation question (organization tool /
workflow engine with an org chart / YAML editor with buttons) as a genuine signal
rather than decoration.

## 28. Governance sequencing — RECORDED

On acceptance: the Product Owner ratifies; RFC-0011 becomes **Accepted**; **no
new ADR** (§12); **exactly one** implementation-queue item may then be created,
covering `@genome/authoring` plus the minimal Studio integration; implementation
follows; a recorded product acceptance follows; an implementation-close review
follows as governance requires. **Milestone 2 and Phase 5 are not opened as a
consequence.**

## 29. Board disposition

Consolidated required amendments:

- **A1** — owner preflight must consume a compiler-derived representation from
  the step-1 compile; authoring performs a membership test, never resolution (§5).
- **A2** — correct §12's conflict rationale: `setIn` silently overwrites, so the
  pre-check prevents destruction of an existing workflow, not a parse error (§7).
- **A3** — scope the governance preview normatively to Studio's execution
  principal; the gate-set equality does not hold for agent initiators (§11).
- **A4** — record OQ1–OQ5 resolutions in the RFC: no new ADR; source-oriented
  result contract; preview **before** Create; user-supplied `id`; neutral
  ungoverned copy (§12, §13, §16, §17).
- **A5** — add evidence **E38–E43** (§24).
- **A6** — state the two accessibility items as non-negotiable: programmatically
  exposed preview, ungoverned state not colour-only (§23).
- **A7** — record the id-supply friction as a product UX concern to be observed
  in the acceptance walkthrough, not resolved by hidden derivation (§16).

---

### OPTION A — ACCEPT AS DRAFTED

- **Consequence:** RFC-0011 becomes Accepted unchanged; one queue item may follow.
- **Required amendments:** none.
- **Architectural-boundary effect:** **Unacceptable.** §5 as drafted permits
  `@genome/authoring` to enumerate and resolve agent references from parsed
  source — reimplementing `buildAgentIndex` inside authoring. This is the exact
  duplication ADR-0012 and Principle 5 exist to prevent, and no compiler test
  would catch its drift. §12 additionally records a rationale the repository
  contradicts, leaving the operation's most severe hazard — silent destruction of
  an existing workflow — unevidenced.
- **Language Complexity Budget effect:** nominally as claimed, but with a latent
  semantic duplication that raises the true cost.
- **Implementation-queue effect:** exactly one item.
- **Main risk:** a second implementation of Genome reference semantics ships
  inside the toolchain, and a duplicate-id bug silently deletes a user's
  workflow while reporting success.
- **Not recommended.**

### OPTION B — ACCEPT WITH AMENDMENTS *(recommended)*

- **Consequence:** RFC-0011 becomes Accepted with **A1–A7** applied. The
  architecture, intent contract, preview source, preservation reuse, failure
  model and scope containment all stand as drafted; the amendments correct one
  boundary wording defect, one factually wrong rationale, one over-general
  accuracy claim, and close six evidence gaps.
- **Required amendments:** A1–A7 above.
- **Architectural-boundary effect:** **Strengthened.** Owner resolution stays
  exclusively compiler-owned; the preview stays compiler-derived and correctly
  scoped; authoring's contract stays source-oriented; no new durable boundary is
  created, so ADR-0012 continues to own the space.
- **Language Complexity Budget effect:** as claimed, and slightly **reduced** by
  A1. Every claimed-zero dimension verified genuinely zero.
- **Implementation-queue effect:** **exactly one** item — `@genome/authoring`
  (`add-workflow` only) plus the minimal Studio integration required to run the
  product experiment. No second item.
- **Main risk:** the product risk, not the architectural one — a first-time user
  may still not connect the preview to the park. That is precisely what the
  mandatory walkthrough and its comprehension question exist to detect, and A3
  and A6 are what make the preview trustworthy enough to be understood.
- **Exact Product Owner ratification statement:**

> As Product Owner, I ratify Option B from `docs/reviews/rfc-0011-board-review.md`.
>
> `RFC/0011-add-workflow-authoring-operation.md` is **Accepted** with amendments
> A1–A7 applied:
>
> - A1 — owner preflight consumes a compiler-derived representation from the
>   step-1 compile; authoring performs a membership test, never resolution.
> - A2 — the conflict rationale is corrected: `setIn` silently overwrites, so the
>   pre-check prevents destruction of an existing workflow.
> - A3 — the governance preview is normatively scoped to Studio's execution
>   principal; the gate-set equality does not hold for agent initiators.
> - A4 — OQ1–OQ5 are resolved in the RFC: no new ADR; source-oriented result
>   contract; preview before Create; user-supplied `id`; neutral ungoverned copy.
> - A5 — evidence E38–E43 are added.
> - A6 — the programmatically-exposed preview and the non-colour-only ungoverned
>   state are non-negotiable.
> - A7 — the id-supply friction is recorded as a product UX concern for the
>   acceptance walkthrough.
>
> **No new ADR is required**; ADR-0012 continues to own the semantic-authoring
> boundary.
>
> Acceptance adds **exactly one** implementation item to
> `IMPLEMENTATION_QUEUE.md`, covering `@genome/authoring` (`add-workflow` only)
> and the minimal Studio integration needed to run the product experiment.
>
> Closure requires uncached executable evidence **and** a recorded product
> acceptance walkthrough; the walkthrough is not a CI gate and cannot be replaced
> by one.
>
> **Stop condition.** This ratification opens no phase and no milestone. Phase 4
> Milestone 2, Phase 5, persistence, providers, triggers, team governance, Gap 2,
> Gap 5, `add-policy` and any further authoring operation remain unauthorized. If
> implementation requires changing accepted compiler or runtime behaviour, work
> stops and returns to the Board; the change must not be hidden inside
> `@genome/authoring`.

### OPTION C — RETURN FOR REVISION

- **Consequence:** RFC-0011 returns to Draft for redrafting; no queue item; the
  product experiment is delayed by a full drafting and review cycle.
- **Required amendments:** the same A1–A7, applied before re-review.
- **Architectural-boundary effect:** identical to Option B once applied — the
  boundary questions are already resolved in this review.
- **Language Complexity Budget effect:** unchanged.
- **Implementation-queue effect:** none until re-review.
- **Main risk:** cost with no architectural gain. A1–A3 are precise, local
  corrections to three passages; A4–A7 are additive records. None reopens the
  operation's design, its intent contract, its ownership split or its scope, so a
  second full review cycle would re-litigate settled ground.
- **Not recommended**, unless the Product Owner judges that a rationale
  contradicted by the repository (§7) indicates the draft should be re-verified
  end to end rather than amended.

---

**Board recommendation: OPTION B.** Not applied. Awaiting Product Owner
ratification.

---

## 30. Product Owner ratification — RATIFIED

**Product Owner disposition: RATIFIED — 2026-09-15 — Option B (accept RFC-0011
with amendments A1–A7).** Recorded verbatim:

> As Product Owner, I ratify OPTION B — ACCEPT RFC-0011 WITH AMENDMENTS.
>
> `RFC/0011-add-workflow-authoring-operation.md` is **Accepted** with the
> Architecture Board amendments A1–A7 applied.
>
> **A1 — owner preflight must be compiler-derived.** `@genome/authoring` must not
> reconstruct owner-resolution semantics. Remove any wording permitting authoring
> to determine owner existence by traversing departments/teams directly,
> rebuilding dotted owner references, reproducing `buildAgentIndex`, or
> independently interpreting agent identity rules. The accepted pattern is
> original source → compile → `runtimeModelTarget(before.graph)` →
> `agents[].reference` → membership check. If the original source does not
> compile, return `invalid-source` before owner preflight. Unknown owner may
> remain `invalid-intent` **only because** the fact is obtained from
> compiler-derived accepted meaning.
>
> **A2 — duplicate workflow conflict rationale.** The reason for the pre-check is
> not that the candidate would contain an invalid duplicate YAML key; the
> accepted mutation mechanism can overwrite an existing workflow silently. The
> protected invariant is that **`add-workflow` must be non-destructive** and must
> never silently replace or modify an existing workflow. Strengthen the Definition
> of Done accordingly. Preserve the actual uniqueness scope — unique only within
> the top-level `workflows` mapping — and introduce no global id uniqueness.
>
> **A3 — governance preview is initiator-scoped.** Correct any wording implying
> governance is determined universally by `RuntimeWorkflow.governedBy`. The
> preview is the effective approval requirements for the candidate workflow when
> initiated by the principal Studio will actually use. A future change to Studio's
> initiator requires the preview to be re-evaluated. No runtime governance
> semantics change.
>
> **A4** — record the resolved questions and the candidate preview architecture:
> no new ADR; the authoring result stays source-oriented; the preview occurs
> before Create; the user supplies the workflow id; ungoverned wording stays
> neutral and accurate.
>
> **A5** — add E38–E43 exactly as recorded, and strengthen E23 to prove
> non-destructive conflict behaviour. Do not remove E1–E37.
>
> **A6** — the programmatically-exposed governance preview and the
> non-colour-only ungoverned state are non-negotiable.
>
> **A7** — the id-supply friction is recorded as a product UX concern for the
> acceptance walkthrough, not resolved by hidden derivation.
>
> **No new ADR is required**; ADR-0012 continues to own the semantic-authoring
> boundary.
>
> The amendments do not expand the accepted Language Complexity Budget: A1
> reduces semantic duplication, A2 corrects the protected invariant, A3 narrows
> the governance-preview claim.
>
> Acceptance adds **exactly one** implementation item to
> `IMPLEMENTATION_QUEUE.md` covering `@genome/authoring` `add-workflow`, the
> governance preview, the minimal Studio Create-work integration, E1–E43, and a
> recorded human product acceptance.
>
> **Do not implement `add-workflow` yet.** Implementation does not occur in the
> same commit as acceptance and state reconciliation.
>
> **Stop condition.** This ratification opens no phase and no milestone. Phase 4
> Milestone 2 remains unopened, Phase 5 remains uncommissioned, Gap 2 remains
> re-deferred, and Gap 5 remains not reopened.

### 30.1 Applied

| Act | Result |
|---|---|
| A1 — compiler-derived owner preflight | Applied — RFC §5.1 (normative mechanism), §5.2 (prohibitions) |
| A2 — non-destructive conflict invariant | Applied — RFC §12.1, with the corrected rationale and preserved uniqueness scope |
| A3 — initiator-scoped preview | Applied — RFC §8.2.1, including the empirical divergence and the return-to-Board condition |
| A4 — resolved questions + preview architecture | Applied — RFC §8.4 (before Create), §23 (OQ1–OQ5), §23.1 (candidate preview architecture) |
| A5 — evidence | Applied — RFC §22: E23 strengthened; **E38–E43 added**; E1–E37 retained |
| A6 — accessibility non-negotiables | Applied — RFC §19 |
| A7 — id-supply UX concern | Applied — RFC §23 (OQ3), referred to the acceptance walkthrough |
| RFC-0011 status | **Accepted 2026-09-15 under Option B** |
| New ADR | **None created** — ADR-0012 continues to own the boundary |
| `IMPLEMENTATION_QUEUE.md` | **One** item added (High, Not Started) |
| Phase 4 Milestone 2 · Phase 5 · Gap 2 · Gap 5 | **Unopened / uncommissioned / re-deferred / not reopened** |
| Implementation | **Not begun** — no production code changed by this act |

**RFC-0011 is ACCEPTED, 2026-09-15.** No implementation is authorized to begin
until separately instructed.
