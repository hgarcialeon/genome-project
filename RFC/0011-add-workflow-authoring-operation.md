# RFC-0011: Semantic Authoring Operations — `add-workflow`

## Status

**Accepted 2026-09-15 under Option B** — accept with the Architecture Board
amendments **A1–A7** applied. Board review
`docs/reviews/rfc-0011-board-review.md` (held 2026-09-14 on commit `8f7a559`,
every material claim re-executed); Product Owner ratification recorded there.

**No new ADR is required**: `docs/adr/0012-semantic-authoring-boundary.md`
continues to own the semantic-authoring boundary (§21, §23 OQ1).

Acceptance adds **exactly one** item to `IMPLEMENTATION_QUEUE.md`. It opens no
phase and no milestone: Phase 4 Milestone 2 remains unopened and Phase 5 remains
uncommissioned.

Commissioned 2026-09-14 by the Product Owner, on the completed product discovery
"Make Engineering Perform Governed Work"
(`docs/discovery/create-and-operate-a-governed-team.md` §8–§11), whose empirical
pre-RFC analysis established that a single `add-workflow` operation is sufficient
for the experiment using existing agents, existing policies, the reference
adapter and ephemeral execution.

Current project state lives only in `PROJECT_STATE.md` (Governance Rule 8) and is
not restated here.

Every material claim below was **re-verified against the working tree while
drafting**, not carried over from discovery. Verification commit: `aad69ac`
(identical to `main` for every file exercised).

---

## 1. Product objective

One product outcome justifies this capability:

> A first-time user can make Engineering capable of performing one new governed
> piece of work **without knowing Genome YAML structure**.

The journey: Engineering → Create work → define workflow → choose an existing
agent as owner → **understand what governance applies** → create → canonical
Genome source changes → ordinary Studio compile lifecycle → workflow appears →
Run → deny-safe park if approval is required → human grants → reference adapter
executes steps → attributable completion.

**This is not a general workflow-authoring RFC.** Scope is confined to what that
journey requires.

## 2. Operation scope

Exactly one named semantic authoring operation: **`add-workflow`**.

Not introduced, and explicitly out of scope: `add-policy`, `edit-workflow`,
`delete-workflow`, `add-team`, generic CRUD, a generic mutation dispatcher, a
generic operation language, a visual workflow designer, provider configuration,
and any trigger authoring beyond the accepted `manual` constraint.

Following ADR-0012, unchanged: Studio captures **intent**; `@genome/authoring`
owns **intent → canonical Genome source**; the compiler owns **source → meaning**
(projections, runtime model); the runtime **executes the accepted runtime model**.

**Studio must not learn workflow YAML placement rules.** Knowing that a workflow
is a keyed entry under `workflows.<id>` is language structure and stays in
`@genome/authoring`.

As with `add-agent`, there is **no dispatcher**: the public surface gains one
named function, `applyAddWorkflow`. A third operation remains a governed
decision, not a parameter.

## 3. Current semantics this RFC relies on (re-verified)

These are **accepted Genome semantics**, established independently of this RFC.
They are recorded because the operation's design depends on them and because the
RFC must not be read as changing them.

| Fact | Evidence (re-verified at `aad69ac`) |
|---|---|
| The JSON Schema does not materially constrain workflow shape | `workflows` is `{"type":"object","additionalProperties":{"type":"object"}}`; the only required top-level keys are `genomeVersion` and `company`; the schema has no `$defs` |
| An ownerless workflow compiles | Semantic rule 3 checks `owner` only when present; `validate` exits 0 |
| An ownerless workflow cannot run | Runtime refuses: `✗ run refused: ownerless-workflow`, exit 2 |
| A zero-step workflow compiles and reaches undesirable runtime behaviour | Runs to "completion" emitting `agent.task.assigned … step=undefined`; `workflow.steps[index]` is `undefined` |
| Ownership resolves through **agents** | `buildAgentIndex` indexes department- and team-level agents only; a reference can never resolve to a team |
| Governance is **derived** from existing accepted relationships | RFC-0007 / ADR-0009 participation binding derives a `workflow → policy` `requires` edge for every workflow owned by an agent-scoped policy's agent |
| The same workflow may be governed or ungoverned depending on owner | Owned by `engineering.engineering-agent`: `governedBy: ["policy:queue-discipline"]`. Owned by `governance.chief-architect`: `governedBy: []` |
| Workflow id uniqueness is scoped to the `workflows` mapping | `checkDuplicates("workflows", …)`; a workflow id equal to an existing **policy** id compiles with **0 diagnostics** |
| Studio already populates runnable workflows from the compiled runtime model | The selector maps over `RuntimeModel.workflows`; `CANONICAL_WORKFLOW` is only the initial selection |
| No special Studio run-path is required | A newly added workflow is immediately selectable and runnable |
| Studio initiates as a human principal | `STUDIO_OPERATOR = "human:operator"` |

**No existing compiler or runtime semantics are changed to make authoring
simpler.** In particular, the ownerless and zero-step documents described above
**remain accepted by the compiler**. This RFC constrains only what the *authoring
operation* will produce (§4).

## 4. The `add-workflow` intent contract

```ts
export type AddWorkflowIntent = {
  /** Id for the new workflow: `workflows.<id>`. */
  id: string;
  /** Dotted reference to an existing agent, e.g. `engineering.engineering-agent`. */
  owner: string;
  /** Ordered work steps; at least one, each a non-empty string. */
  steps: readonly string[];
  /** Optional; when present must be `"manual"` (§7). */
  trigger?: "manual";
};
```

`applyAddWorkflow(source: string, intent: AddWorkflowIntent): AuthoringResult` —
source text in, canonical Genome source out, or a structured failure. The result
type is the one RFC-0010 already accepts.

### 4.1 The four constraints, and what they are not

1. **`owner` is required** and must resolve to an existing agent.
2. **`steps` is required and must contain at least one** non-empty entry.
3. **`trigger` is omitted or `"manual"`.**
4. **Governance visibility is provided before the user commits or runs** (§8).

These are **authoring-operation constraints**, not language rules.
**Genome language validity is not redefined around them.** A document the
compiler accepts today is still accepted: ownerless workflows, zero-step
workflows and non-`manual` triggers all continue to compile exactly as they do
now, and a user may still hand-write them in the editor. The operation simply
refuses to *generate* them, because each produces work that cannot run, work
that reports a step it does not have, or work that declares execution intent v0.1
cannot honour.

This mirrors `add-agent`, whose intent requires `department` and `id` while the
language requires neither.

## 5. Owner resolution

The intent carries a **dotted agent reference**, resolved by the compiler's
accepted rules. **`@genome/authoring` resolves nothing.** *(Amendment A1.)*

### 5.1 The accepted preflight mechanism (normative)

Owner existence is established **only** from compiler-derived meaning, obtained
from the operation's own step-1 compile of the original source:

```text
original source → compile → runtimeModelTarget(before.graph)
               → agents[].reference → membership check
```

`@genome/authoring` may test whether the requested owner **appears in that
compiler-derived set**. It must resolve nothing independently.

If the original source does not compile, the operation returns the accepted
**`invalid-source`** failure **before** owner preflight — the set does not exist
until the compiler has produced it.

### 5.2 Explicitly prohibited

The operation **must not** determine owner existence by traversing
`departments`/`teams` directly, rebuilding dotted owner references, reproducing
`buildAgentIndex`, or independently interpreting agent identity rules. Also
prohibited: implicitly creating an agent; accepting a **team** as owner;
inventing team execution semantics; introducing global identity semantics.

This keeps the compiler's ownership of *source → meaning* intact. The candidate
compile (step 5) remains the backstop: a failure there returns `invalid-result`
with compiler diagnostics verbatim, and the two paths must agree.

Studio presents owners by reading the **existing compiled model**
(`RuntimeModel.agents`), not by parsing source.

## 6. Steps

Steps remain the **existing accepted ordered opaque strings**. The operation
accepts an ordered list of at least one step string and writes it unchanged.

Not introduced: branching, conditions, structured tool calls, IO contracts,
artifacts, nested workflows, retries, step ownership, or a visual step DSL.
Gap 3 (artifact primitive) and Gap 4 (control flow) remain untouched and
un-needed.

This preserved simplicity is deliberate: the experiment tests **governed
organizational work**, not workflow-language expressiveness. It is also why
`add-workflow` stays one operation — `add-agent` already accepts an optional
string list (`skills`, with an `invalid-skills` intent problem), so a required
string list is an established shape, not a new authoring surface.

## 7. Trigger

`trigger` may be **omitted** — the compiler resolves an omitted trigger to
`manual`, deny-safe — or explicitly **`"manual"`**.

The operation **must not expose `event`, `schedule` or `webhook`**. Those values
are accepted vocabulary but declare execution intent v0.1 cannot execute: no
event selector, schedule expression or webhook binding grammar exists, and all
initiation is explicit. Offering them would let a user author a workflow they
reasonably expect to start by itself.

**No trigger semantics are added and no Phase 5 trigger work is opened.**

## 8. Governance visibility (in scope)

Required for the product experiment, and part of this RFC.

### 8.1 Why

Governance applied to a new workflow is a consequence of accepted semantics and,
critically, **of the selected owner** — re-verified:

- owner `engineering.engineering-agent` → `governedBy: ["policy:queue-discipline"]`,
  `requiresApprovalFrom: ["human:product-owner"]`;
- owner `governance.chief-architect` → `governedBy: []`, and the run completes
  with no approval.

Both are **correct current behaviour**. The product must expose the consequence
before the user mistakes one for the other.

### 8.2 The accepted source of the fact

**The runtime model of the compiled candidate.** Concretely:
`runtimeModelTarget(compile(candidate).graph)`, then the new workflow's
`governedBy` (policy node ids), resolved against `RuntimePolicy.requiresApprovalFrom`.

Evaluated and rejected:

- **`graphTarget` `requires` edges** — carries the same fact but leaves Studio to
  join edges to principals itself. The runtime model already performs that join.
- **Reading the *current* model's `RuntimeAgent.governedBy`** — **incorrect.**
  Predicting the derived workflow→policy edge before compiling would mean
  reproducing RFC-0007 participation binding in the view — precisely what is
  forbidden.

Compiling the candidate is the same operation Studio already performs on every
edit; only the input differs. **No Studio-owned "which policies apply?"
implementation is created, and no governance semantics are added.**

### 8.2.1 The preview is initiator-scoped (normative) *(Amendment A3)*

**Governance is not a universal intrinsic property of a workflow.** A run's gates
are the union of the workflow's policies and the *initiating principal's*, plus
the supervised intrinsic floor when the initiator is a supervised agent. The
preview is therefore defined as:

> **governance preview = the effective approval requirements for the candidate
> workflow when initiated by the principal Studio will actually use.**

Studio currently initiates through `STUDIO_OPERATOR = "human:operator"`. Because
that is a human principal and not a declared agent, `governingPolicies` finds no
initiating agent and the effective gate set **for that principal** is exactly the
candidate's `RuntimeWorkflow.governedBy`. The equality holds *because of* the
initiator, not independently of it.

**The divergence is real, not theoretical.** Re-executed: a supervised agent
owning a workflow whose compiled `governedBy` is `[]` —

```text
initiator human:operator          → status=running            approval.requested=(none)
initiator <supervised agent>      → status=pending-approval   approval.requested=["human:*"]
```

Identical compiled `governedBy`; different effective gates.

Consequently: the UI **must not** imply the preview is intrinsic to the
workflow, and **any future change to Studio's execution principal requires the
preview to be re-evaluated and returned to the Architecture Board.** No runtime
governance semantics are changed by this requirement.

### 8.4 The preview occurs before Create (normative) *(Amendment A4, OQ4)*

The user must be able to see the effective approval consequence **before
committing the workflow**. A preview available only after creation cannot satisfy
"understand what governance will apply" before commitment, which is the whole
purpose of the experiment (§15).

Canonical governed case — owner `engineering.engineering-agent`, existing policy
`queue-discipline`, Studio initiator `human:operator` → **expected effective
requirement: `human:product-owner`**.

Negative case — owner `governance.chief-architect`, Studio initiator
`human:operator` → **expected: no approval requirement** under currently accepted
semantics. The UI communicates this **neutrally**: an ungoverned workflow is not
an error, and the requirement is transparency.

### 8.3 What the UI must be able to communicate

- **Governed:** "This work is governed by *&lt;policy&gt;* / requires
  *&lt;principal&gt;*."
- **Ungoverned:** "No approval policy applies to this workflow with the selected
  owner."

Exact wording is product/UI and not normative. **The semantic facts shown must
originate from accepted compiler outputs.**

## 9. Source remains canonical

Identical to RFC-0010:

```text
intent → @genome/authoring → Genome source → ordinary Studio source lifecycle
       → compiler → projections / runtime model
```

The returned source becomes the editor source through the **existing ordinary
edit lifecycle**. There is **no authoring-specific compile path**, no direct
graph/tree/runtime update, and **no hidden workflow model becomes authoritative**.
Studio never inserts YAML. The resulting source stays visible, inspectable and
editable.

The governance preview of §8 is a **read**, not a commit: it compiles a candidate
to display a consequence and makes no document authoritative.

## 10. Source preservation

**Reuse RFC-0010's accepted model and its existing implementation.** No second
mutation engine, and no broader preservation contract: workflow insertion
demonstrates no need for one.

At minimum, and to be evidenced:

- unrelated semantic content is unchanged;
- comments survive, including the canonical example's top-of-file
  non-normative-for-governance disclaimer;
- the transformation is deterministic — identical input and intent produce
  byte-identical output;
- no unnecessary document-wide semantic rewrite occurs.

`SPEC/examples/genome-project.yaml` is a required preservation fixture.

## 11. Failure model

**Reuse the accepted RFC-0010 failure architecture**, unchanged in shape: four
classes, an authoring-owned representation for authoring-owned problems, and
compiler diagnostics **verbatim** where the compiler is the authority.

| Class | Raised for |
|---|---|
| `invalid-source` | the input does not parse or compile — compiler diagnostics verbatim |
| `invalid-intent` | missing/invalid `id`; missing/invalid `owner`; missing `steps`, empty `steps`, or a non-string/empty step; a `trigger` other than `manual` |
| `conflict` | `workflows.<id>` already present; `workflows` present but not a mapping |
| `invalid-result` | the produced candidate fails to compile — compiler diagnostics verbatim |

`unknown-owner` (the reference resolves to no existing agent) is raised as an
intent problem by preflight; if it ever reached the compiler it would surface as
`invalid-result`, and both paths must agree.

**Failure atomicity:** a failed operation returns **no `source` field**. No
partially mutated document escapes.

**The compiler's `Diagnostic` and `CompileStage` types are not widened**, and no
new diagnostic is introduced.

## 12. Duplicate / conflict scope (empirically determined)

**Determined, not assumed.** The accepted target mapping is the **top-level
`workflows` mapping**, and `checkDuplicates("workflows", …)` scopes workflow-id
uniqueness to exactly that mapping. Workflows are flat: there is no second scope,
and therefore no cross-scope question of the kind `add-agent` had to answer.

### 12.1 The invariant: `add-workflow` must be non-destructive *(Amendment A2)*

**The pre-check does not exist to avoid a malformed duplicate YAML key.** The
accepted preservation mechanism writes with a set/update operation
(`document.setIn`) that **silently overwrites an existing entry**. Re-executed on
the canonical example: setting `workflows.rfc-lifecycle` replaced its owner and
all five steps, and the resulting candidate **compiled cleanly with no parse
error**. Without the pre-check the operation would **silently destroy an existing
workflow and return success.**

The invariant this protects is therefore:

> **`add-workflow` must be non-destructive. It must never silently replace or
> modify an existing workflow.**

Two consequences, both required:

1. **Refuse** when `workflows.<id>` is already present, as a `conflict`, checked
   **before writing** — exactly as `add-agent` does, and for this stronger
   reason.
2. **Do not refuse** an id that collides across a *different* mapping. Verified:
   a workflow named `ratification`, colliding with an existing **policy** id,
   compiles with **0 diagnostics**; the same holds for an existing **agent** id.
   Genome defines no cross-mapping id uniqueness, and **authoring must not add
   language uniqueness semantics by convention.**

The accepted uniqueness scope is preserved exactly: **workflow ids are unique
only within the top-level `workflows` mapping**, enforced by the authoring
operation. **No global id uniqueness is introduced.**

## 13. Revision semantics

Identical boundary to RFC-0010 and ADR-0011: **`@genome/authoring` never derives,
predicts, carries or assigns `genomeRevision`.** The compiler owns revision,
derived at Stage 5 from the resulting source. Authoring returns source text; it
never returns or embeds an identity.

## 14. Studio integration scope

The **minimum** experience for the experiment. **Studio is not redesigned.**

The primary affordance is labelled for the product action, not the architecture
object — conceptually **"Create work"** rather than requiring the user to
understand "workflow" before acting. The term *workflow* may appear secondarily,
because it is an accepted Genome concept and the canonical source will show it.

The user must be able to:

- start from **Engineering** (the organizational surface they are already on);
- create new work;
- provide the workflow id/name accepted semantics require;
- select an **existing agent** owner;
- enter at least one work step;
- **understand what governance will apply** (§8);
- create the work;
- see the resulting canonical source;
- see the normal projections update through the ordinary lifecycle;
- select and run the new workflow on the **existing execution surface**, which
  needs no change.

## 15. Governance before execution

The RFC must protect against one specific failure mode:

> The user chooses an owner that yields no approval gate, creates the workflow,
> runs it, sees it complete immediately, and concludes that **Genome failed to
> govern the work**.

The product makes the governance consequence visible **before or at creation**,
using compiler-owned meaning.

This does **not** mean every workflow must be governed. An intentionally
ungoverned workflow remains valid where Genome permits it. **The requirement is
understanding, not forced governance.**

## 16. Existing policies only

**No `add-policy`.** The canonical acceptance scenario uses a policy already
present in `SPEC/examples/genome-project.yaml`.

**The exact canonical combination for the product test:**

| | |
|---|---|
| Owner | `engineering.engineering-agent` (existing, `autonomy: supervised`) |
| Policy | `queue-discipline` (existing, **agent-scoped** — `appliesTo: [engineering.engineering-agent]`) |
| Principal | `human:product-owner` (existing) |
| Binding | derived by RFC-0007 participation binding; **no policy added or edited** |

This is the scenario that proves `add-workflow` alone is sufficient. It also
makes the new workflow a second standing witness for RFC-0007 participation
binding, alongside RFC-0008 E3/E7.

## 17. Product acceptance scenario

A **recorded reviewer walkthrough**, as RFC-0009 Amendment 4 and RFC-0010 §14
require. **Not a CI gate.** Automated evidence is necessary but not sufficient.

The reviewer is asked:

> **"Make Engineering able to perform a new governed task."**

They are **not** asked to "create a workflow", and **receive no YAML
instructions**. A successful first-time journey lets them: recognize Engineering
can be given new work; discover Create work; identify and select an existing
responsible agent; describe at least one step; **see which existing governance
will apply**; create the work; see that canonical Genome source changed; see the
new work appear through compiler-derived projections; run it; understand why it
parks; identify the required policy and principal; grant approval; and observe
attributable work and completion.

**The decisive question, asked afterward:**

> **"What caused this work to require approval?"**

**If the answer depends on documentation outside Studio, product acceptance has
failed.**

The walkthrough should also record which of these Studio reads as: **(A)** a tool
for building and operating an organization; **(B)** a workflow engine with an org
chart; **(C)** a YAML editor with buttons.

## 18. Negative product scenario

The walkthrough must **also** exercise one owner choice that produces no approval
requirement — `governance.chief-architect` in the canonical example.

The user must be told **accurately** that the workflow will not be governed by an
approval policy under that owner. The product must not imply every workflow is
governed merely because Genome supports governance.

This is **evidence of transparency**, not a requirement that the ungoverned owner
appear in the main canonical journey.

## 19. Accessibility

The existing Studio floor: **WCAG 2.2 AA**, as fixed for Milestone 1. This RFC
does **not** expand into a general Studio accessibility RFC.

At minimum: Create work discoverable by keyboard; owner selector accessible;
steps fields accessible; validation errors programmatically associated; the
**governance preview programmatically available** (not colour- or
placement-only); predictable focus on successful creation; cancel returns focus;
no pointer-only essential interaction.

**Two items are non-negotiable, not illustrative** *(Amendment A6)*: the
governance preview **must be programmatically exposed**, because it carries the
decisive product meaning and cannot be visual-only; and the **ungoverned state
must not be conveyed by colour alone**.

## 20. Protected boundaries

Expected **zero semantic change** to: Genome syntax; Genome language semantics;
schema semantics; compiler normative semantics; runtime semantics; event
taxonomy; revision semantics; governance semantics; persistence; providers;
triggers; team semantics.

Additionally, as RFC-0010 pins: no compiler `Diagnostic` or `CompileStage`
change; no new event type; no durable-log reader; no authoring-specific compile
path in Studio; no Studio-owned YAML mutation; Checkpoints 1–7 and the shipped
`add-agent` behaviour preserved.

**Stop condition.** If drafting or implementation reveals a required change to
any of the above, **work stops and returns to the Architecture Board and Product
Owner**. The change must **not** be hidden inside `@genome/authoring`.

*Drafting status: no protected boundary was found to need crossing.* The two
latent runtime sharp edges this work touches — the ownerless refusal and the
zero-step `step=undefined` emission — are handled **entirely** by refusing to
generate such documents at the authoring boundary, leaving compiler and runtime
behaviour byte-unchanged.

## 21. Language Complexity Budget

Non-binding review evidence (Board guidance, 2026-07-14).

**New:** the `add-workflow` semantic authoring operation; a workflow
transformation contract; a `@genome/authoring` public API expansion
(`applyAddWorkflow`, `AddWorkflowIntent`, and its intent/conflict problem
variants); a minimal Studio Create-work interaction; and a governance-visibility
interaction built on existing compiler-derived meaning.

**Unchanged:** language; schema; compiler semantics; runtime; events; revision;
governance; team semantics; persistence; providers; triggers.

The budget is **non-zero but strictly smaller than RFC-0010's**: that RFC created
the package, the boundary, the failure architecture and the preservation model.
This one adds a second operation *inside* all of them.

**The ratified amendments do not expand the accepted budget.** A1 *reduces*
semantic duplication, A2 corrects the protected invariant, and A3 *narrows* the
governance-preview claim to the actual initiator. The accepted new capability
remains: the `add-workflow` operation; the workflow transformation contract; the
`@genome/authoring` public API expansion; the minimal Studio Create-work
interaction; and the compiler/runtime-derived governance preview **for the actual
Studio initiator**.

**ADR assessment — none required, ratified.** The Board resolved OQ1 and the
Product Owner ratified it on 2026-09-15: **no new ADR.** ADR-0012 already owns the
durable architectural decision (compiler owns *source → meaning*; authoring owns
*intent → source*; views collect intent and present results; source stays
canonical; operations are consumer-gated). `add-workflow` **applies** that
decision with a demonstrated consumer; it establishes no new durable boundary.

The judgment once referred to the Board — whether a view compiling a
**candidate** document to display a compiler-derived consequence before commit is
merely the existing projection model applied to a new input, or a durable pattern
deserving its own ADR — is **resolved as the former** (§23, OQ1).

## 22. Definition of Done

In addition to the standing requirement — *project state and governance
documents reconciled*, `pnpm check-state` passing — permanent executable
evidence, all **uncached** (`pnpm test -- --force`):

**Authoring contract.** E1 valid `add-workflow` produces canonical source; E2
minimum required intent suffices; E3 missing `owner` refused (`invalid-intent`);
E4 missing/empty `steps` refused; E5 zero-step refused by authoring; E6
non-string/empty step refused; E7 unsupported `trigger` refused; E8 omitted
trigger accepted; E9 explicit `manual` accepted; E10 `unknown-owner` refused;
E11 a **team** as owner refused.

**Compiler agreement.** E12 the resulting source compiles; E13 the new workflow
appears in the compiler-derived model with the correct `owner`; E14 existing
policy applicability appears **without any policy mutation**; E15 the `policies`
block is byte-identical before and after.

**Governance visibility.** E16 the governed owner yields
`governedBy: ["policy:queue-discipline"]` → `["human:product-owner"]`; E17 the
ungoverned owner yields `governedBy: []` and is projected accurately as "no
approval policy applies".

**Execution.** E18 the governed case parks deny-safe (exit 3, zero steps); E19
the required principal is correctly projected; E20 `approval.granted` attribution
**precedes** the first step; E21 all steps execute via the reference adapter,
attributed to the owner; E22 the workflow completes (exit 0).

**Conflict and failure.** E23 duplicate workflow id refused with the **actual
accepted scope** (the `workflows` mapping), proving **non-destructive** behaviour
rather than mere parser-failure avoidance *(strengthened, A5)*; E24 a
cross-mapping id collision is **accepted**, not refused; E25 `invalid-source` handling; E26 `invalid-result`
carries compiler diagnostics verbatim; E27 failure atomicity — no `source` on any
failure.

**Preservation and boundaries.** E28 deterministic, byte-identical
transformation; E29 the `SPEC/examples/genome-project.yaml` preservation fixture,
disclaimer comment intact; E30 no Studio YAML mutation; E31 no
authoring-specific compile path; E32 no revision derivation in authoring; E33 no
policy mutation; E34 no team semantics introduced; E35 no provider, trigger or
persistence expansion; E36 protected-boundary diffs empty.

**Accessibility.** E37 the §19 floor on both success and failure paths, including
focus behaviour and the programmatically-available governance preview.

**Board additions (Amendment A5).** Six further permanent cases, added exactly as
the Board recorded them. None of E1–E37 is superseded or removed.

| Case | Requirement |
|---|---|
| **E38** | **Non-destructive duplicate conflict** — on a duplicate workflow id the operation reports `conflict`, returns **no candidate source**, and the existing workflow is **unchanged**: its owner, trigger and every step intact. Cross-category collisions remain accepted where Genome accepts them |
| **E39** | **Compiler-derived owner preflight** — authoring resolves no reference itself; the accepted-owner set originates in a compiler projection of the original source (§5.1) |
| **E40** | **Initiator-scoped governance preview** — the previewed gate set equals the effective gate set **for `STUDIO_OPERATOR`**, with the divergence under an agent initiator recorded so the scoping cannot silently regress (§8.2.1) |
| **E41** | **Candidate state is not canonical before Create** — canonical source, graph and tree projections are unchanged while a preview is displayed; candidate projections never replace current ones (§23.1) |
| **E42** | **No generic authoring dispatcher** — the public surface exposes exactly two named operations (`applyAddAgent`, `applyAddWorkflow`) and no dispatch or operation-name vocabulary |
| **E43** | **Ungoverned execution emits no false approval evidence** — the ungoverned-owner case completes with **zero** `approval.*` and zero `policy.enforced` events |

**Product acceptance.** A **recorded reviewer walkthrough** (§17) including the
negative scenario (§18) and the "What caused this work to require approval?"
question. **Mandatory, and not a CI gate.**

## 23. Resolved questions (Architecture Board, ratified 2026-09-15)

All five questions the Draft referred to the Board are **resolved and ratified**
(`docs/reviews/rfc-0011-board-review.md`). *(Amendment A4.)*

**OQ1 — no new ADR.** Candidate compilation is **ADR-0012 applied to transient
source**, not a new durable architectural boundary. Studio already compiles on
every edit; only the input's lifetime differs. ADR-0012 continues to own the
semantic-authoring boundary.

**OQ2 — the authoring result stays source-oriented.** `applyAddWorkflow` returns
source or a structured failure and **must not return compiler targets** merely to
save the extra compile. A narrow "source in, source out" contract is what keeps
the boundary legible.

**OQ3 — the user supplies the workflow id.** No id-generation, slug or
identifier-shaping semantics are introduced. Studio may present the concept in
understandable language but creates no durable identifier rule. The residual
first-time-user friction is recorded as a **product UX concern to be observed in
the acceptance walkthrough** (§17), not resolved by hidden derivation
*(Amendment A7)*.

**OQ4 — the preview occurs before Create** (§8.4).

**OQ5 — ungoverned wording stays neutral and accurate** (§18).

### 23.1 Candidate preview architecture (normative)

**Before Create:**

1. canonical source remains **unchanged**;
2. Studio gathers `add-workflow` intent;
3. `@genome/authoring` produces **candidate source**;
4. Studio compiles that candidate using the **accepted compiler**;
5. Studio derives effective governance **for the actual Studio initiator** (§8.2.1);
6. Studio presents that governance consequence;
7. candidate projections are **preview-only** and **never** replace the current
   canonical organization projections.

**After Create:**

1. the successful source returned by `add-workflow` enters the **existing editor
   source lifecycle**;
2. existing auto-compile behaviour applies;
3. normal compiler-derived projections replace the canonical projections when
   current;
4. the existing execution UI discovers the workflow from the compiled runtime
   model.

## Constitutional check

| Principle | This RFC |
|---|---|
| 1 — Specification is the product | Specifies the operation before any implementation |
| 2 — The Genome is the source of truth | Canonical source remains the artifact; no hidden model |
| 3 — Everything is declarative | The user declares work; the toolchain produces the declaration |
| 5 — Views do not own business logic | Studio collects intent and displays compiler-owned facts only |
| 7 — Decisions are versioned | This RFC plus the discovery record |
| 8 — Prefer stable primitives | One operation inside an existing boundary; no dispatcher |
| 9 — Human governance first-class | Governance made *understandable* before execution |
| 10 — Write the missing specification first | Drafted before implementation, on empirical evidence |

## Explicitly not authorized / not done by this RFC

No phase or milestone is opened; **Phase 4 Milestone 2 remains unopened and Phase
5 remains uncommissioned.** Acceptance authorizes **exactly one** queue item —
`@genome/authoring` (`add-workflow` only), the governance preview, and the
minimal Studio Create-work integration — and nothing beyond it. **Gap 2 remains
re-deferred and Gap 5 remains not reopened.** Not commissioned: `add-policy`,
`add-team`, `add-department`, any edit/delete/move operation, generic CRUD or
dispatch, a visual designer, team-governance semantics, Gap 2 (declarable human
members), Gap 5 (non-conjunctive approvals), Gap 3 (artifacts), Gap 4 (control
flow), event persistence, provider adapters, trigger auto-initiation, simulation,
Office View and Marketplace.
