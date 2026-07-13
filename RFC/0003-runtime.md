# RFC-0003: Runtime Boundary

## Status

Accepted

Accepted by the Architecture Board (Product Owner, Chief Architect, Lead
Engineer) on 2026-07-13. The board's vote was **Request Changes**; the
conditions have been incorporated into this document. See
`docs/reviews/RFC-0003-board-decision.md` for the decision record and
`docs/adr/0004-runtime-boundary.md` for the recorded architectural decision.

This RFC defines the boundary of the Genome Runtime before any runtime code
is written (Constitution Principle 10). It does **not** authorize runtime
implementation: `packages/genome-runtime` and the runtime-model target remain
gated on the Phase 3 implementation RFC. Compiler-side preconditions named in
this RFC enter the Implementation Queue.

## Summary

The Genome Runtime executes compiled organizations and observes the results.

This RFC fixes the runtime's architectural boundary:

- the runtime consumes **compiled artifacts**, never raw Genome documents
- the runtime produces **events**, never durable organizational change
- durable change flows through **new Genome revisions**, reconciled by recompilation
- **human approval** is a first-class execution gate, not an add-on
- **provider adapters** isolate the runtime core from any specific agent vendor

The boundary is the deliverable. Execution semantics (scheduling, retries,
concurrency, delivery ordering) are intentionally left to the Phase 3
implementation RFCs that follow acceptance of this one.

## Motivation

RFC-0002 deferred the runtime-model compilation target to "Phase 3 —
Runtime" to avoid building ahead of a live consumer. Before that consumer can
exist, its boundary must be specified, or the runtime will grow by accretion
into what the project's governance forbids:

- a second source of truth that drifts from the Genome (Constitution Principle 2)
- hidden state that cannot be reconciled with the Genome (Governance Rule 6)
- provider-specific assumptions leaking into the core (Governance Rule 7 for
  the language core; the Architecture Charter's portable-abstractions bias
  for the runtime core)
- autonomy without explicit human governance (Constitution Principle 9)

The same failure happened industry-wide with configuration management:
systems that mutate live state without a declarative source drift until the
declared state is fiction. Genome's answer is the Kubernetes-style split:
**desired state is declared (Genome), observed state is derived (events),
and reconciliation is explicit.**

## Goals

- define what the runtime consumes (the runtime model, a compilation target)
- define what the runtime produces (an append-only event log)
- define the reconciliation contract between runtime state and the Genome
- make human approval an execution primitive gated by compiled policies
- define the provider-adapter seam that keeps the runtime core portable
- give Phase 3 a stable, testable boundary to implement against

## Non-goals

The runtime boundary RFC does not:

- implement any runtime component (no code ships from this RFC)
- specify scheduling, concurrency, retry, delivery, or event-ordering semantics
- specify event persistence technology (log store is an implementation choice)
- define Office View, Studio, or any view consumption of events
- define the marketplace or SDK surfaces
- integrate any specific agent provider

## Position in the Architecture

```text
Genome Document (source of truth)
→ Compiler (interpretation)          ← RFC-0002
→ Runtime Model (compiled artifact)  ← this RFC, target deferred by RFC-0002
→ Runtime (execution + observation)  ← this RFC (boundary), Phase 3 (implementation)
→ Events (observed state)
→ Reconciliation → new Genome revision → recompile
```

Layer partition (extends the RFC-0002 rule):

- **Genome document** owns *truth*: the declared, versioned desired state.
- **Compiler** owns *interpretation*: parsing, validation, graph, targets.
- **Runtime** owns *execution and observation*: running workflows and agents,
  emitting events, requesting approvals.
- **Views** own *projection*: rendering compiled models and events, never
  producing either.

## The Runtime Model

The runtime consumes a **runtime model**: a compilation target of the form
`(OrganizationGraph) => RuntimeModel`, produced by `packages/genome-compiler`
alongside the existing `inspect`/`graph`/`docs` targets. ("Runtime model" is
the canonical name across this RFC, `SPEC/language.md`, and the roadmap; it
supersedes the earlier "runtime graph" phrasing, which now denotes nothing —
"graph" refers only to the Organization Graph.)

Normative constraints:

1. The runtime model is derived **only** from the Organization Graph. If the
   runtime needs information the graph does not carry, the fix is a compiler
   or specification change — never a runtime-side reading of Genome YAML
   (ADR-0002).
2. The runtime model is **immutable**, like the graph it derives from. A new
   Genome revision produces a new runtime model; the mapping is 1:1.
3. The runtime model carries the organizational hierarchy (Company,
   Department, Team) — required for event attribution and approval routing —
   plus Agents (with autonomy levels), Workflows (with triggers and owners),
   Policies (with scope and approval principals), Integrations, Objectives,
   and Metrics. MemoryStore nodes are carried as declared data but have no
   runtime behavior before Phase 6.

The precise TypeScript shape of `RuntimeModel` is specified in the Phase 3
implementation RFC, mirroring how RFC-0002 pinned the graph contract before
the compiler shipped.

### Known compiler/spec preconditions for Phase 3

Constraint 1 makes these compiler or specification work, named now rather
than discovered in Phase 3 (each is queued or assigned to a future RFC):

- **Policy scope.** `appliesTo` grammar added to `SPEC/language.md` with this
  RFC; semantic validation of its references and compilation to `requires`
  edges (workflow/agent `requires` policy) is queued compiler work.
- **Objective/metric ownership.** The compiler validates `objective.owner`
  and `metric.owner` (semantic rule 5) but drops them from the graph — no
  `owns` edges are produced. Queued compiler fix.
- **Trigger executability.** Workflow `trigger` values are enumerated
  (`manual`/`event`/`schedule`/`webhook`) but the language defines no
  schedule expression, event selector, or webhook binding. Specifying these
  belongs to the Phase 3 RFC.
- **Autonomy default.** Resolved with this RFC: an omitted `autonomy`
  defaults to `manual` (`SPEC/language.md`, deny-safe).

## Events

The runtime's output channel is an **append-only event log**. Constitution
Principle 6 permits the runtime to produce "events, logs, metrics, and
recommendations"; this RFC *decides* to express all of these as events in
one log, so there is a single observable to reconcile against.

Normative constraints:

1. **Append-only.** Events are immutable once emitted; corrections are new
   events, never edits.
2. **Attributable.** Every event names the Genome revision it executed under
   (which, being 1:1, identifies the runtime model) and the source that
   produced it.
3. **Reconstructible (runtime core).** The runtime core must expose a
   normative **replay** operation, and observed state is defined by it: after
   any restart, `replay(log)` must equal the observed runtime state. No
   runtime-core component may hold state that `replay` cannot rebuild — the
   mechanical enforcement of Governance Rule 6. This constraint binds the
   core **above the adapter seam**; adapter-held state is governed by the
   Provider Boundary rules below.
4. **Provider-neutral.** Event payloads must not require knowledge of a
   specific agent provider to interpret.

### Event envelope (v0.1, normative)

```yaml
event:
  id:             # unique within the log; ordering semantics are Phase 3 scope
  timestamp:
  genomeRevision: # content hash of the compiled Genome document
                  # (SPEC/language.md "Versioning"); 1:1 with the runtime model
  runId:          # the workflow execution (or approval-request correlation
                  # scope) this event belongs to
  source:         # graph node id (e.g. agent:engineering.platform.backend)
                  # or a human principal (e.g. human:engineering-manager)
  type:           # from the normative taxonomy below
  payload:        # type-specific, provider-neutral
```

`source` accepts either a graph node id — whose dotted path skips the
`teams`/`agents` container keys, per the reference grammar in
`SPEC/language.md` — or a `human:<id>` principal, since humans are
deliberately not graph nodes in v0.1 but must be attributable (e.g. as the
source of an `approval.granted`).

### Event taxonomy (v0.1, normative)

- `workflow.started` / `workflow.completed` / `workflow.failed`
- `agent.task.assigned` / `agent.task.completed` / `agent.task.failed`
- `approval.requested` / `approval.granted` / `approval.denied`
- `policy.enforced`
- `genome.proposal.created` — payload **reserved/opaque** in v0.1 (see
  Reconciliation)

The envelope and taxonomy are the v0.1 event contract. Extension is
**additive-only**: the Phase 3 RFC may add event types but may not rename or
remove these (Constitution Principle 8).

## Reconciliation

The Genome describes desired state; the event log describes observed state.
The runtime **never** closes that loop by mutating the organization.

Normative constraints:

1. Durable organizational change happens by producing a **new Genome
   revision** and recompiling (RFC-0002 "Immutability").
2. The runtime may **propose** change — emitting a `genome.proposal.created`
   event — but a proposal has no effect until a governed actor (human, or
   the Phase 6 self-improvement loop under its own RFC) accepts it into a
   new Genome revision. The proposal payload is reserved in v0.1; its format
   is designed by the Phase 6 RFC under two binding constraints: it must be
   a structured, schema-validated patch addressed via the reference grammar
   in `SPEC/language.md` (never a raw text diff), and it must satisfy event
   constraint 4 (provider-neutral).
3. **Adoption is by drain (normative for v0.1).** When a new Genome revision
   compiles, in-flight workflow executions complete against the runtime
   model they started under and continue to attribute the old revision; new
   work starts on the new model. Migration of in-flight work is deferred to
   a future RFC gated on demonstrated need.
4. Runtime configuration that changes behavior is organizational state and
   therefore lives in the Genome, not in runtime-local settings. (v0.1 of
   the language cannot yet express operational overrides such as pausing an
   agent — that is a named spec gap, and the operator emergency-stop story
   must be addressed by the Phase 3 RFC without resorting to runtime-local
   settings.)

## Human Approval

Human governance is a first-class execution primitive (Constitution
Principle 9), not middleware.

Normative constraints:

1. Compiled policies **gate execution** through their declared scope: a
   policy's `appliesTo` entries (`SPEC/language.md`, "Policy Scope") name
   the workflows and agents it governs. The runtime must not initiate a
   governed workflow before an `approval.granted` event exists from each
   principal in `requiresApprovalFrom`, matched to the request by `runId`.
2. Approval requests and responses are ordinary events in the log, fully
   attributable: the request's `source` is the policy node; a response's
   `source` is the responding principal (`human:<id>` or agent reference).
3. `agent.autonomy` binds the runtime per the behavioral semantics in
   `SPEC/language.md`: `manual` agents act only on explicit human
   instruction; `supervised` agents additionally require approval before
   each workflow initiation (an intrinsic floor) plus any policy-declared
   checkpoints; `autonomous` agents are gated only by policy-declared
   checkpoints. An omitted autonomy level defaults to `manual`.
4. Approval must be **deny-safe**: absence of a response blocks the action;
   it never defaults to granted.

## Provider Boundary

The runtime core must survive multiple agent providers (the Architecture
Charter's portable-abstractions bias, extending Governance Rule 7's intent
beyond the language core).

Normative constraints:

1. Agent execution goes through a **provider adapter** interface owned by the
   runtime package. The core schedules and observes; adapters translate to a
   concrete provider.
2. Nothing above the adapter seam may contain provider-specific **types or
   logic**. Provider **identifiers as declared data** (e.g. an integration
   node's `provider: github` from the Genome) pass through unchanged — the
   core carries them; it never interprets them.
3. Adapters may hold provider-scoped state (job ids, thread handles) only if
   it is **disposable**: losing it degrades to retry or re-observation,
   never to observed truth that diverges from the event log. Durable
   observations must be emitted as events.
4. Adapters are packaged separately from the runtime core, so a provider
   integration never becomes a core dependency.
5. Adapter configuration (credentials, endpoints) is a deployment concern,
   not Genome content; the Genome's `integrations` section declares *that* a
   capability is used, never *how* to authenticate to it.

## Package Boundary

Following the ADR-0003 precedent (one package until a second consumer
appears):

- `packages/genome-runtime` — runtime core: model intake, event log,
  workflow/agent lifecycle, approval gate, replay. No provider code.
- The event envelope and taxonomy types live in `packages/genome-runtime`,
  in a dedicated dependency-free `events/` module (types only, importing
  nothing from the runtime core), so extraction into a shared package when
  the first non-runtime consumer appears is mechanical. No
  `packages/genome-events` in v0.1.
- Provider adapters as separate packages (`packages/genome-adapter-*`) when
  Phase 3 needs the first one — not before.
- The runtime-model target lives in `packages/genome-compiler` with the
  existing targets (it is `(OrganizationGraph) => RuntimeModel`, a compiler
  concern). This supersedes the deferral of the runtime-model target in
  RFC-0002/ADR-0003; implementation still waits for the Phase 3 RFC to pin
  the `RuntimeModel` shape.

## Decisions

These resolve the RFC's original open questions, per the Architecture Board
decision of 2026-07-13.

1. **Event types live in `packages/genome-runtime`**, in a dependency-free
   `events/` module; split into a shared package only when the first
   non-runtime consumer (a view) actually appears. Not the compiler — the
   compiler owns interpretation and never produces or consumes events.
2. **The event envelope and taxonomy are normative in v0.1**, extension
   additive-only. The RFC's own normative constraints are defined in terms
   of taxonomy members (`approval.granted`), so a non-normative taxonomy
   would leave the contract untestable — the same reasoning that made the
   Organization Graph normative in RFC-0002.
3. **Supervised autonomy has layered semantics**: an intrinsic deny-safe
   floor (approval before each workflow initiation) plus policy-declared
   checkpoints via `appliesTo`; autonomous agents are gated by policy
   checkpoints only; omitted autonomy defaults to `manual`. Specified in
   `SPEC/language.md` with this RFC.
4. **Revision adoption is by drain, normative for v0.1.** In-flight work
   completes on the model it started under; migration needs a future RFC.
5. **The proposal payload is reserved in v0.1** and designed by the Phase 6
   RFC under the two binding constraints in Reconciliation constraint 2. The
   event type stays in the taxonomy so the reconciliation contract has a
   named observable.
6. **Policies gain a declared scope** (`appliesTo`), giving the approval
   gate a subject; it compiles to `requires` edges in the Organization
   Graph (queued compiler work).
7. **Reconstructibility is scoped and testable**: it binds the runtime core
   above the adapter seam, and is defined by the normative `replay`
   operation (`replay(log) == observed state`).

## Definition of Done

- runtime input contract defined — ✅ (runtime model, compiled only)
- runtime output contract defined — ✅ (append-only, attributable events;
  normative envelope and taxonomy)
- reconciliation contract defined — ✅ (propose, never mutate; drain adoption)
- human approval contract defined — ✅ (deny-safe, policy-scoped gates)
- provider boundary defined — ✅ (adapter seam, disposable adapter state)
- open questions resolved by the Architecture Board — ✅ (Decisions above)
- specification preconditions landed — ✅ (`SPEC/language.md`: versioning,
  autonomy semantics and default, policy scope)
- ADR recorded on acceptance — ✅ (`docs/adr/0004-runtime-boundary.md`)
