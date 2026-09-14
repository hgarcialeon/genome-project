# Product Discovery: Make Engineering Perform Governed Work

*(commissioned as "Create and Operate a Governed Team"; refocused by Product
Owner disposition 2026-09-14 — §8. The file path is retained so the
commissioning record resolves; §§1–7 are preserved as written at commissioning
and are not rewritten.)*

## Status

**Commissioned 2026-09-14 by the Product Owner. Q1–Q5 dispositioned and the
experiment refocused the same day (§8). The empirical pre-RFC analysis the
disposition authorized is complete (§9), and its conclusion is that
`add-workflow` alone is sufficient (§10).** Discovery is a **pre-RFC**
instrument: this document **decides nothing**. It opens no phase and no
milestone, commissions no RFC, adds no item to `IMPLEMENTATION_QUEUE.md`,
changes no roadmap deliverable, crosses no protected boundary, and authorizes
no implementation. Per this repository's queue entry rules, nothing enters the
queue until an RFC is approved.

It exists to answer one product question with repository evidence, surface the
decisions that question forces, and hand the Product Owner a decision it does
not pre-empt.

Current project state lives only in `PROJECT_STATE.md` (Governance Rule 8) and
is not restated here.

Baseline commit for every claim below: `9d969af`. Every capability statement is
cited to source and was read at that commit, not recalled.

---

## 1. The product question

> Can a user **create** a team, **govern** it, and **operate** it — end to end,
> without hand-editing Genome source and without reading architecture
> documentation?

The phrase names three verbs. This discovery's first finding is that **they fail
at three different layers, owned by three different parts of the system.** That
is the structural result; everything else follows from it.

## 2. Why this question, now

Phase 4 Milestone 1 closed complete on 2026-09-13. It shipped the projection and
governed-execution half of the experience and, after the RFC-0010 remediation,
the first semantic authoring operation. Its product acceptance was **Accepted
with follow-ups**.

The milestone that closed was scoped to *Governed Authoring* — a single
organizational change, demonstrated. "Create and operate a governed team" is the
first product framing that exercises the whole chain at once, which is precisely
why it is the right discovery subject and why it does not fit inside any
milestone already opened.

The rejection that preceded that closure is the reason this question is worth
asking carefully. On 2026-09-13 Milestone 1 was rejected because

> a user cannot discover or perform the canonical organizational change ("add an
> agent") without understanding and manually editing the Genome source
> structure.

RFC-0010 closed that gap **for one operation**. This discovery asks whether the
same failure mode remains for the operations a team actually requires.

---

## 3. What ships today

Read from source at `9d969af`. This is the baseline discovery reasons from, not
a plan.

### 3.1 The language can describe a team richly

`SPEC/language.md` and `packages/genome-compiler/src/ast/index.ts`:

| Concept | Shape |
|---|---|
| `DepartmentNode` | `id`, `mission?`, `teams[]`, `agents[]` |
| `TeamNode` | `id`, `mission?`, `agents[]` |
| `AgentNode` | `id`, `role?`, `autonomy?`, `skills[]` |
| `WorkflowNode` | `id`, `owner?`, `trigger?`, `steps[]` |
| `PolicyNode` | `id`, `appliesTo[]`, `requiresApprovalFrom[]` |

**`teams` is a first-class container, not a workaround.** Dotted references
resolve `engineering.platform.backend` to a team-level agent by skipping the
`teams`/`agents` container keys (`SPEC/language.md`, Reference resolution).
Teams carry `belongs_to` edges in the Organization Graph
(`packages/genome-compiler/src/graph/index.ts`) and survive into the runtime
model as `teams: Array<{ id, label, department }>`
(`packages/genome-compiler/src/targets/runtime-model.ts`).

### 3.2 Governance primitives are real and deny-safe

- Autonomy: `manual` / `supervised` / `autonomous`, defaulting to `manual`.
  "Absence of a declared autonomy level never grants autonomy."
- Policies gate by `appliesTo` — workflow ids and/or agent references — with
  `requiresApprovalFrom` principals. Agent-scoped policies gate every run the
  agent participates in (RFC-0007 / ADR-0009 participation binding).
- Approval is deny-safe at every level; `human:*` is a reserved intrinsic floor.
- An unbound policy raises a warning diagnostic rather than passing silently.

### 3.3 Execution is governed, observable, and ephemeral

`packages/genome-runtime`: explicit initiation, autonomy/policy gates, approvals
matched by `runId`, sequential task lifecycle through the adapter seam,
halt/resume, append-only event log with `state() == replay(log)` by
construction. Event taxonomy: `workflow.*`, `agent.task.*`, `approval.*`,
`policy.enforced`, `genome.proposal.created` (payload reserved), plus
`runtime.halted` / `runtime.resumed`.

### 3.4 Authoring owns exactly one operation

`packages/genome-authoring` exposes `applyAddAgent` and nothing else. Its own
module documentation is explicit about why:

> There is deliberately no dispatcher and no operation language: a second
> operation is a governed decision, not a parameter.

---

## 4. Findings

### F1 — "Create" is an authoring gap, and it is the M1 rejection recurring

`applyAddAgent` is **department-scoped only**. The implementation refuses
anything else by construction — `packages/genome-authoring/src/add-agent.ts`
carries the comment:

> Department-scoped only: no fallback to teams, no creation, no inference.

Consequences, in order of severity for this product question:

1. **There is no operation that creates a team.** No `add-team`, no
   `add-department`.
2. **An agent cannot be added to a team at all.** The one shipped operation
   writes to `departments.<id>.agents.<id>`; the team path is refused.
3. **There is no operation that gives a team work or governance** — no
   `add-workflow`, no `add-policy`.
4. **There is no remove, rename, or move.** Organizational change is
   additive-only today.

So creating a team is possible only by hand-editing source in the Studio editor
— which is exactly the experience that failed product acceptance on 2026-09-13.
**RFC-0010 fixed the instance; the class remains open for every operation a team
needs.**

### F2 — "Govern" is a language gap: a team is not a governable subject

This is the finding with the longest reach, and it is not visible from the
product surface.

`buildAgentIndex` in `packages/genome-compiler/src/semantics/index.ts` indexes
**agents only** — department-level and team-level. Therefore:

- a policy's `appliesTo` entry **can never resolve to a team**;
- a workflow's `owner` **can never resolve to a team**;
- `TeamNode` carries no policies, no workflows, and no objectives.

A team is a **containment grouping end to end** — in the AST, in the graph, and
in the runtime model. Nothing in the runtime references a team; there is no
team-scoped event and no team-scoped gate.

"Govern the team" today means enumerating the team's agents and binding a policy
to each, or binding to the workflows those agents own. That is *derivable* but
not *expressible* — and the difference is the whole question. The intent "this
team requires approval from the engineering manager" has no representation, so
it cannot be stated, validated, diffed, or projected.

**This is a language question, and it must not be answered in a view.**
Constitution Principle 5 and the ADR-0012 boundary both put it outside Studio
and outside the compiler's `source → meaning` direction.

### F3 — "Operate" is a phase gap, and it is three separate gates

| What "operate" implies | What ships | Gate |
|---|---|---|
| Survives the session | Ephemeral only — session-scoped, discardable, no durable history, no exported-log reader (RFC-0009 Amendment 1) | Milestone 2 / persistence, gated on first consumer |
| Does real work | Reference adapter only — enqueue-only dispatch | Phase 5; requires its own accepted contract |
| Acts without being hand-started | Explicit initiation only; `event`/`schedule`/`webhook` declare intent but define no grammar | Requires an RFC |

A team can therefore be operated today **for the length of one browser session,
performing no real work, leaving no record.** That is a legitimate and
deliberately-chosen demonstration boundary — not a defect — but it is not what
"operate" means in the commissioned phrase, and the difference is a Product
Owner decision rather than an engineering one.

### F4 — Two previously deferred gaps now bear directly on this question

Both were deferred at **named gates**, not rejected
(`docs/reviews/self-hosting-evidence-board-review.md`).

- **Gap 2 — humans are principals, not declarable members.** Its named gate is
  the "first view-phase RFC rendering principals (Phase 4 Studio / Phase 5
  Office View)." **Phase 4 Studio has now shipped and renders principals**, and
  Milestone-1 product acceptance recorded that the required principal and policy
  are visible and traceable to the document. On the face of the record the gate
  condition appears to have been reached. A team with human members cannot be
  declared — humans exist only where a policy happens to name them. *Whether the
  gate has in fact tripped is a Board/Product Owner determination; this
  discovery surfaces it and does not decide it.*
- **Gap 5 — approvals are conjunctive only.** Every named principal must
  approve; quorum and either/or approval are not expressible. For a single
  agent this rarely bites. For a *team*, "any two of the four leads" is an
  ordinary governance sentence and currently has no representation. Gap 5 was
  **rejected on the evidence then at hand**; a team-shaped consumer is new
  evidence, which is the stated route to reopening it.

Gap 3 (no artifact primitive) and Gap 4 (workflows are straight lines) also
touch this question but remain behind their existing gates; discovery flags them
without arguing them.

### F5 — The three verbs have three different owners

The structural result:

| Verb | Failing layer | Owning instrument |
|---|---|---|
| Create | Authoring (`intent → source`) | RFC under the ADR-0012 consumer gate |
| Govern | Language / compiler semantics | Language RFC + ADR |
| Operate | Runtime and phase sequencing | Milestone opening and/or Phase 5 RFCs |

**"Create and Operate a Governed Team" is not one feature.** Treating it as one
would produce a single RFC crossing three boundaries at once — precisely the
"large feature bundle" the Constitution's Principle 8 warns against, and the
kind of scope that the RFC-0010 remediation deliberately avoided by shipping one
operation. Discovery's strongest recommendation is therefore about *shape*
before content: whatever is commissioned should be severable along these three
seams.

---

## 5. Open questions for the Product Owner

These are the decisions the question forces. Each is genuinely open; none is
pre-answered above.

**Q1 — Is the team the unit of governance, or is the agent?**
If a team should be a policy subject and a workflow owner, F2 is a language gap
requiring an RFC and an ADR. If a team is deliberately only a grouping — an
org-chart convenience — then F2 is a **non-goal**, and "governed team" means
"the agents of a team, each governed." Both are defensible; they lead to
different systems. This is the highest-leverage question in this document, and
nothing else should be commissioned before it is answered.

**Q2 — Does "operate" mean a live session, or a durable organization?**
Milestone 1 shipped the former by accepted design. If the answer is the latter,
this discovery is plausibly the *first consumer requiring a durable log* — the
exact condition on which event persistence has been gated since 2026-07-13. That
would make Milestone 2 the next act rather than a later one. If the answer is
the former, the ephemeral boundary stands and persistence stays gated.

**Q3 — Does "operate" require real effect?**
A governed team that performs no real work may still be the product (governed
rehearsal before real-effect execution — the sequencing Phase 5 already
records). If real effect is required, the first provider adapter is in scope and
Phase 5 sequencing is engaged.

**Q4 — Which authoring operations must exist for "create" to be discoverable?**
ADR-0012 makes each new operation a governed decision rather than a parameter.
Discovery's evidence says a *team* minimally needs team creation and
team-scoped agent placement; work and governance (`add-workflow`, `add-policy`)
may or may not belong in the same increment. The consumer-gated boundary holds
either way — the question is which consumers are now demonstrated.

**Q5 — Has the Gap-2 gate been reached?**
See F4. If yes, declarable human members become live design work for this
question rather than deferred work.

---

## 6. What discovery must produce to exit

Proposed exit criteria, for Product Owner confirmation. Discovery is complete —
and an RFC may be commissioned — only when:

1. the **primary user** and the job they are hiring Genome for are named;
2. the **smallest end-to-end scenario** that would count as "created and
   operated" is written down concretely, in the manner of the canonical
   `rfc-lifecycle` demonstration;
3. Q1–Q5 carry recorded answers;
4. every gap is assigned an **owner layer** (language / compiler / authoring /
   runtime / view) and an **instrument** (RFC, ADR, milestone opening, queue
   item);
5. every **existing gate** the work would cross is named explicitly — the
   persistence gate, the ADR-0012 consumer gate, the provider-adapter contract,
   the trigger RFC, the RFC-0009 protected boundaries;
6. the result is **severable** along the F5 seams, so the Product Owner can
   commission one part without implicitly commissioning the rest.

Until then, no RFC is drafted — Governance Rule 1: specification before
implementation, and Rule 2: no major architectural change without an RFC.

---

## 7. Explicitly not authorized by this discovery

No phase is opened. No milestone is opened — **Phase 4 Milestone 2 / Runtime
Logs remains unopened**. No RFC is commissioned. No ADR is recorded. No queue
item is added. No roadmap deliverable changes status. The Autonomy Substrate is
not commissioned; Office View, Marketplace, simulation, event persistence,
provider adapters, triggers and additional semantic-authoring operations remain
unauthorized. The F1–F4 Studio follow-up item remains Low / Not Started and
uncommissioned.

No language, schema, compiler, runtime, event, revision, authoring or governance
semantics change. No code changes.

---

## Constitutional check

| Principle | This document |
|---|---|
| 1 — The specification is the product | Asks what specification is missing before proposing any implementation |
| 2 — The Genome is the source of truth | Treats canonical source as the artifact every verb must produce or consume |
| 5 — Views do not own business logic | Names F2 a language gap explicitly so it cannot be answered in Studio |
| 7 — Decisions are versioned | Committed to the repository; understandable without chat history |
| 8 — Prefer stable primitives | F5 exists to keep the answer severable rather than one bundle |
| 10 — Write the missing specification first | The entire instrument |

---

## 8. Product Owner disposition — 2026-09-14

Recorded as given. This disposition answers Q1–Q5, refocuses the experiment, and
**authorizes the empirical pre-RFC analysis only**. It opens no milestone, opens
no phase, commissions no persistence, providers, triggers, team-governance
semantics, Gap 2 or Gap 5, and **does not authorize `add-workflow`
implementation**.

### Q1 — Unit of governance: the **agent**

For the next product experiment the **agent remains the execution and governance
subject**; the **team remains an organizational grouping**. The following are
**not** to be introduced: team-owned workflows, team-scoped policies, team-scoped
runtime gates, team-scoped events, or team identity as an executable principal.

This is a deliberate **current product constraint, not a claim that Genome can
never govern teams**. Changing the boundary later requires explicit new consumer
evidence and a language/compiler RFC.

**Effect on this discovery: the Govern gap (F2) is NOT commissioned.** F2's
analysis stands recorded as evidence for that future decision.

### Q2 — Durability: **not required**

Session-scoped execution and evidence are sufficient. The purpose is to test
whether a user can define meaningful work and understand Genome's governance
over it. Therefore **Phase 4 Milestone 2 remains UNOPENED, the event-persistence
gate remains CLOSED, Runtime Logs remain Not Started, and no persistence RFC is
commissioned.** F3's first-consumer observation is explicitly *not* exercised.

### Q3 — Real external effects: **not required**

Governed rehearsal through the accepted reference adapter is sufficient. The
product question is whether a user can define work, assign responsibility, run
it, understand why Genome parks or allows it, grant the required approval, and
observe attributable completion. A real provider is not needed to answer it.
**Phase 5 remains uncommissioned; no provider adapter and no trigger work is
commissioned.**

### Q4 — Minimum authoring capability: candidate **`add-workflow`**

The candidate minimum next semantic-authoring operation is **`add-workflow`**.
Explicitly **not** commissioned: `add-team`, `add-policy`, `edit-workflow`,
`delete-workflow`, generic workflow CRUD, generic operation dispatch, and any
visual workflow designer.

The experiment reuses an existing organizational container, an existing agent,
and existing accepted governance. The goal is to let a user define **one new
piece of work** and have the **existing** organization govern its execution.

The disposition required verification, before any RFC, that one `add-workflow`
operation can produce the intended governed run **using existing governance** —
and instructed: if it cannot, **stop and report the exact missing semantic
capability**, and **do not silently expand scope to `add-policy`.** That
verification is §9.

Any such capability must satisfy ADR-0012: Studio expresses *intent*;
`@genome/authoring` owns *intent → source*; the compiler owns *source →
meaning*; the runtime executes the accepted runtime model. **Studio must not
learn workflow YAML placement rules.**

### Q5 — Gap 2: gate **reached**, and deliberately **re-deferred**

The Product Owner determines that Gap 2's named deferral condition — *"first
view-phase RFC rendering principals"* — **has now occurred through Phase 4
Studio**, so Gap 2 is legitimately eligible for reconsideration.

**Gap 2 is nevertheless NOT commissioned now.** The next experiment does not
require declarable human members, because existing human principals are
sufficient for its approval flow. Re-deferred with this new rationale, recorded
verbatim:

> Gate reached; consumer not yet sufficient to justify language expansion.
> Revisit when a product flow requires authoring, inspecting, or managing humans
> as declarable organizational members rather than using them only as external
> principals.

It is further recorded that the team-shaped discovery provides **new evidence
relevant to Gap 5** (conjunctive-only approvals). **Gap 5 is not reopened and not
commissioned by this act**; existing approval semantics are sufficient for the
next experiment.

### Refocus — "Make Engineering Perform Governed Work"

The commissioning phrase "Create and Operate a Governed Team" overloaded team
structure, governance subject, and execution. The experiment is refocused.

**Target outcome:** a first-time user can enter Studio and make Engineering
capable of performing one new governed piece of work **without knowing Genome
YAML structure**.

**Canonical candidate journey:** Engineering → Create work → define a workflow →
choose an existing agent as owner → use existing accepted governance → Run →
Genome evaluates governance → deny-safe park if approval is required → human
grants → the reference adapter performs the modeled work → attributable
completion. **Genome source remains visible and canonical throughout.**

---

## 9. Empirical pre-RFC analysis

Authorized by §8. Executed 2026-09-14 against the working tree at `a86489c`
(identical to `main` for every file exercised). Fixtures were built in a
scratchpad; **no repository file was modified to produce this evidence.**

Method: take the canonical `SPEC/examples/genome-project.yaml`, add exactly one
workflow owned by an existing agent — simulating precisely what an
`add-workflow` operation would emit — **change no policy**, and observe the
compiler and runtime at the CLI boundary.

> Note on reading exit codes: invoking the CLI through `pnpm` collapses
> non-zero exits to 1. Every exit code below was taken from a direct invocation.

### 9.1 Current workflow language shape (Q-analysis 1, 7)

`WorkflowNode` (`packages/genome-compiler/src/ast/index.ts`): `id`, `owner?`,
`trigger?`, `steps: string[]`.

| Property | Standing | Evidence |
|---|---|---|
| `owner` | **Accepted semantics.** Optional to the compiler, but required for execution and the sole carrier of governance | Semantic rule 3; `owns` edge; runtime refusal below |
| `trigger` | **Accepted vocabulary, non-executable beyond `manual`.** `event`/`schedule`/`webhook` declare intent only — v0.1 defines no selector, schedule expression or webhook binding, and all initiation is explicit | `SPEC/language.md` Executability (v0.1) |
| `steps` | **Accepted semantics, opaque strings.** Each dispatches as one task, in order. No inputs, outputs, artifacts, branches or conditions | `assignStep`; Gap 3, Gap 4 |
| step *content* | **Demo convention.** No semantics attach to a step's text | — |

**The JSON Schema constrains workflows not at all** — `workflows` is
`{"type":"object","additionalProperties":{"type":"object"}}`, and the document's
only required top-level keys are `genomeVersion` and `company`. Every constraint
below is compiler or runtime semantics, never schema. This mirrors RFC-0010 §1.3
for agents and means an authoring operation cannot be derived from the schema.

### 9.2 Minimum fields for a valid workflow (Q-analysis 2)

**Schema-valid: none.** A workflow with no owner and no steps validates (exit 0).
Validity is therefore the wrong bar; *runnability under governance* is the bar,
and it requires an owner and at least one step.

### 9.3 How ownership resolves (Q-analysis 3)

`owner` is a dotted agent reference resolved by `buildAgentIndex` — agents only,
department-level or team-level. It produces the `owns` edge and becomes
`RuntimeWorkflow.owner`; `assignStep` attributes every task to it.

### 9.4 How existing policies gate the workflow and its owner (Q-analysis 4)

A run's gates are the **union** of the workflow's own policies and the
*initiating* principal's (`governingPolicies`). Two independent routes therefore
govern a workflow: a workflow-scoped policy naming it, and — decisively here —
an **agent-scoped policy on its owner**, which RFC-0007 participation binding
turns into a derived `workflow → policy` `requires` edge for every workflow that
agent owns.

### 9.5 Can existing policy govern a *newly added* workflow, with no policy change? (Q-analysis 5)

**Yes — demonstrated.** Adding only `ship-release`, owned by the existing
`engineering.engineering-agent`, with `policies:` byte-unchanged:

```text
BASELINE (canonical, untouched)          AFTER add-workflow (policies untouched)
agent:…engineering-agent → queue-…       agent:…engineering-agent → queue-…
workflow:rfc-lifecycle   → ratification  workflow:rfc-lifecycle   → ratification
workflow:implement-…     → queue-…       workflow:implement-…     → queue-…
workflow:phase-…         → ratification  workflow:phase-…         → ratification
                                         workflow:ship-release    → queue-discipline   ← derived
```

The new workflow inherited governance **automatically**, through the accepted
RFC-0007 participation binding. **`add-policy` is not required.**

### 9.6 Is one workflow sufficient for the complete journey? (Q-analysis 6)

**Yes — the whole journey executes.**

| Journey step | Result |
|---|---|
| Define work, existing agent as owner | `validate` exit 0; `inspect` shows `ship-release (manual) — owner engineering.engineering-agent, 3 steps` |
| Run; Genome evaluates governance | `approval.requested` from **`policy:queue-discipline`**, principal `human:product-owner` |
| Deny-safe park | **exit 3**, 0 completed steps |
| Human grants | `approval.granted human:product-owner` — attributed, before any step |
| Adapter performs the modeled work | three `agent.task.assigned`/`completed` pairs, each attributed to `agent:engineering.engineering-agent` |
| Attributable completion | `workflow.completed`, **exit 0** |

Studio needs **no run-path change**: its workflow selector is populated from the
compiled runtime model (`workflows.map(...)`), and `CANONICAL_WORKFLOW` is only
the initially-selected value. A newly added workflow is immediately selectable
and runnable.

### 9.7 Do steps make `add-workflow` too large to be one operation? (Q-analysis 8)

**No.** Steps are an **ordered list of opaque strings** — no branching, no
conditions, no inputs or outputs (Gap 4 and Gap 3 both remain untouched and
un-needed). Collecting them is a string-list input, and **`add-agent` already
establishes exactly that precedent**: its intent accepts `skills?: readonly
string[]` with an `invalid-skills` intent problem.

The resulting intent — workflow id, owner, steps, optional trigger — is directly
comparable in size to the shipped `AddAgentIntent`. **This is one operation, not
a workflow designer.**

### 9.8 Four constraints the evidence imposes on the operation

Each is an **authoring-intent constraint** inside RFC-0010's accepted failure
model. **None requires a compiler, runtime, schema or event change.**

1. **`owner` must be required** and must resolve to an existing agent. An
   ownerless workflow validates (exit 0) but carries **no** `requires` edge and
   the runtime refuses it: `✗ run refused: ownerless-workflow`, **exit 2**. The
   user would author work that cannot run and cannot be governed.
2. **`steps` must be required, with at least one entry.** A zero-step workflow
   validates and runs, but emits `agent.task.assigned … step=undefined` and
   reports "completed steps: 1" for a workflow with no steps. The runtime's
   `workflow.steps[index]` is simply `undefined`. This is a latent sharp edge
   today, reachable only by hand-editing; an authoring operation must not open a
   discoverable path to it.
3. **`trigger` must be omitted or `manual`.** Any other value declares intent
   v0.1 cannot execute and would quietly mislead the user.
4. **Governance must be projected before the run** — see the risk below.

### 9.9 The product risk this analysis surfaces

**Governance is not automatic; it is a consequence of the owner the user
chooses.** The same one-workflow addition, owned instead by
`governance.chief-architect` — an existing, perfectly valid choice — produces
**no** `requires` edge and runs **to completion with no approval at all**
(exit 0, three steps, never parked).

The experiment's entire purpose is for the user to *understand Genome's
governance over the work they defined*. A user who picks the wrong owner sees
their work complete instantly and learns the opposite lesson.

This is **correct accepted behaviour**, not a defect: policy scope and RFC-0007
participation binding are working exactly as ratified. It is a **product and
experiment-design constraint**, and it is satisfiable without new semantics —
Studio can project the compiler-owned consequence ("this work will be governed
by *queue-discipline*" / "this work will not be governed") from the `requires`
edges it already consumes. That is projection of compiler-owned facts, which
Principle 5 and ADR-0012 permit; it is **not** Studio learning governance rules.

---

## 10. Conclusion of the empirical analysis

**`add-workflow` alone is sufficient. There is no missing semantic capability,
and no expansion to `add-policy` is warranted.**

The accepted language, compiler and runtime already carry the whole journey:
participation binding (RFC-0007) makes existing governance apply to new work
automatically, the runtime parks deny-safe and completes attributably, and
Studio's existing run path needs no change. The work required is confined to one
new authoring operation plus Studio intent collection and one projection.

Per §8's instruction — *"If `add-workflow` alone is enough: prepare the smallest
RFC proposal required by ADR-0012"* — the condition for commissioning that RFC is
met. **This discovery does not commission it**; commissioning remains the Product
Owner's act.

The smallest RFC would carry: the single `add-workflow` operation and its intent
shape; the four §9.8 constraints; the §9.9 governance projection; the ADR-0012
layering; and the protected boundaries RFC-0010 already pins. It would change no
language, schema, compiler, runtime, event or revision semantics.

---

## 11. Product Owner commissioning disposition — 2026-09-14 (second act)

**The discovery condition is recorded as satisfied and the RFC is commissioned.**

The Product Owner records that, on this discovery's evidence: `add-workflow`
alone is sufficient for the complete experiment; existing agents are sufficient;
existing policies are sufficient; the reference adapter is sufficient; ephemeral
execution is sufficient; and **no** provider, trigger, persistence,
team-governance, Gap 2, Gap 5 or `add-policy` capability is required.

**Commissioned: the smallest ADR-0012-conformant RFC for exactly one new
semantic authoring operation, `add-workflow`** — drafted as
`RFC/0011-add-workflow-authoring-operation.md`.

Governance effect of this act, stated exactly: it **commissions RFC drafting
only**. It does **not** add an implementation queue item, open Phase 4
Milestone 2, open Phase 5, or authorize `add-workflow` implementation. The RFC
stands as **Draft** for Architecture Board review; nothing enters
`IMPLEMENTATION_QUEUE.md` unless and until it is accepted.

**Governance visibility is in scope of that RFC** (§8 of the RFC), on this
discovery's §9.9 finding: governance is a consequence of the owner chosen, and
the experiment fails its own purpose if the user cannot see that consequence.
The RFC adds no governance semantics and gives Studio no policy-applicability
implementation of its own.

**This discovery is complete.** Its remaining findings — F1's uncommissioned
operations, F2's Govern gap, F3's durability and real-effect gates, and F4's
Gap 2 / Gap 5 observations — stand recorded as evidence for future decisions and
are commissioned by nothing here.
