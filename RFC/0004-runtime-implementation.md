# RFC-0004: Runtime Implementation (Phase 3)

## Status

Accepted

Accepted by the Architecture Board (Product Owner, Chief Architect, Lead
Engineer) on 2026-07-13. The board's vote was **Accept with conditions**;
the conditions have been incorporated into this document. See
`docs/reviews/RFC-0004-board-decision.md` for the decision record and
`docs/adr/0005-runtime-execution-contract.md` for the recorded
architectural decision.

This is the **Phase 3 implementation RFC** that RFC-0003/ADR-0004 gate
runtime work on. It operates entirely *inside* the boundary RFC-0003 fixed:
nothing here relaxes a boundary constraint, and where this RFC is silent,
RFC-0003 governs. Its acceptance unblocks the two queued items — the
runtime-model target in `packages/genome-compiler` and the
`packages/genome-runtime` core.

## Summary

RFC-0003 defined *what* the runtime is: a consumer of compiled artifacts
that produces an append-only, attributable, replayable event log. This RFC
defines *how* the first runtime is built:

- the normative TypeScript shape of **`RuntimeModel`** and the
  `(OrganizationGraph) => RuntimeModel` target
- the **Genome revision** derivation the model and every event depend on
- **trigger executability** for v0.1: initiation is always explicit;
  `event`/`schedule`/`webhook` binding grammars are named deferred language
  work
- **scheduling and ordering semantics**: a single total order (the log),
  non-preemptive event-driven execution, sequential steps, no retries
- the **approval-gate mechanics**: how principals are collected, requested,
  matched by `runId`, and how the supervised intrinsic floor is routed
- the **operator emergency stop**: attributable `runtime.halted` /
  `runtime.resumed` control events, not runtime-local settings
- the **replay contract** made structural: the runtime core keeps no run
  state outside the log; observed state *is* `replay(log)` by construction

## Motivation

Phase 3's goal (ROADMAP) is to execute a simple organization from a Genome
file: model intake, agent lifecycle, workflow execution, a human approval
stub, and an activity log. RFC-0003 deliberately left the execution
semantics to this RFC. Each deferred point is resolved here so that
implementation can proceed from specification, not improvisation
(Constitution Principles 1 and 10).

## Goals

- pin `RuntimeModel` so the compiler target and the runtime agree on one
  shape
- define the revision identity that makes events attributable
- give Phase 3 executable semantics that are deterministic and testable
- answer the emergency-stop question ADR-0004 posed, without
  runtime-local settings
- keep the runtime core provider-free behind the adapter seam

## Non-goals

- no provider adapter ships (the seam ships; adapters are separate packages
  when the first provider integration is queued — ADR-0004)
- no schedule expression, event selector, or webhook binding grammar (named
  deferred language work; see Trigger Executability)
- no retry, concurrency, or persistence machinery (the v0.1 log is
  in-memory; a log store is an implementation choice RFC-0003 left open)
- no proposal payload (`genome.proposal.created` stays reserved for the
  Phase 6 RFC)
- no view consumption of events (Office View, Studio)

## Genome Revision Derivation

`SPEC/language.md` (Versioning) defines a Genome revision as a content hash
of the canonical parsed document, derived by the compiler. This RFC pins
the derivation:

1. The input is the **schema-valid parsed document** (Stage 2 output).
2. Canonical form is **JSON with object keys sorted lexicographically** at
   every level; array order is preserved (it is meaningful — e.g. workflow
   steps).
3. The revision is the lowercase hex **SHA-256** of the UTF-8 canonical
   serialization.

Consequences:

- Two documents that differ only in YAML key order or formatting have the
  same revision; any semantic difference produces a new revision.
- The revision is computed at Stage 5 and carried on the Organization Graph
  as a top-level `genomeRevision` field. This is an **additive** extension
  of the RFC-0002 graph contract (node and relationship types are
  unchanged); it is required so the runtime model remains derived *only*
  from the graph (ADR-0004 constraint) while still carrying the identity
  every event attributes to.

## The RuntimeModel Shape (normative)

The target is `runtimeModelTarget: (OrganizationGraph) => RuntimeModel`,
living in `packages/genome-compiler` beside `inspect`/`graph`/`docs`
(ADR-0004). The type is owned by the compiler package;
`packages/genome-runtime` imports it — the model is a compiled artifact,
and the compiler owns interpretation.

```ts
type RuntimeModel = {
  genomeRevision: string;
  company: { name: string; timezone?: string };
  /** Hierarchy nodes, for attribution and approval routing. */
  departments: Array<{ id: string; label: string }>;
  teams: Array<{ id: string; label: string; department: string }>;
  agents: Array<{
    id: string;             // graph node id, e.g. agent:engineering.platform.backend
    reference: string;      // dotted reference, e.g. engineering.platform.backend
    label: string;
    role?: string;
    autonomy: "manual" | "supervised" | "autonomous";  // resolved, never absent
    skills: string[];
    memberOf: string;       // team or department node id
    governedBy: string[];   // policy node ids (from `requires` edges)
  }>;
  workflows: Array<{
    id: string;             // graph node id, e.g. workflow:build-feature
    workflowId: string;     // document identifier, e.g. build-feature
    owner?: string;         // agent node id
    trigger: "manual" | "event" | "schedule" | "webhook";  // resolved, never absent
    steps: string[];
    governedBy: string[];   // policy node ids (from `requires` edges)
  }>;
  policies: Array<{
    id: string;             // graph node id
    policyId: string;
    appliesTo: string[];    // governed node ids (workflow/agent)
    requiresApprovalFrom: string[];  // principals as declared (`human:<id>` or dotted reference)
  }>;
  /** Declared data carried through uninterpreted. */
  integrations: Array<{ id: string; type?: string; provider?: string }>;
  objectives: Array<{ id: string; owner?: string }>;
  metrics: Array<{ id: string; owner?: string }>;
  memoryStores: string[];   // no runtime behavior before Phase 6 (RFC-0003)
};
```

Normative resolution rules applied by the target (the compiler owns
interpretation; the runtime never re-derives these):

1. **Autonomy is resolved.** An omitted `autonomy` becomes `manual`
   (deny-safe default, `SPEC/language.md`). The runtime model never carries
   an absent autonomy.
2. **Trigger is resolved.** An omitted `trigger` becomes `manual`
   (deny-safe: an untriggerable workflow can only be started explicitly).
   Added to `SPEC/language.md` with this RFC.
3. **`governedBy` is derived from `requires` edges** (RFC-0003 policy
   scope), not re-parsed from `appliesTo`.
4. **Principals stay declared.** `requiresApprovalFrom` entries pass
   through as declared strings; `human:<id>` principals are not graph nodes
   by design.
5. **Provider identifiers are data.** `integration.provider` passes through
   uninterpreted (ADR-0004 provider boundary).

The shape is normative the way the Organization Graph is (RFC-0002):
extension is additive-only within v0.1.

## Trigger Executability (v0.1)

The language enumerates `manual` / `event` / `schedule` / `webhook`, but
defines no schedule expression, event selector, or webhook binding. This
RFC resolves executability for v0.1 rather than inventing those grammars
ahead of need:

1. **All workflow initiation in v0.1 is explicit**: a `startWorkflow`
   instruction from a principal (`human:<id>` or an agent reference). The
   runtime auto-initiates nothing.
2. A declared `trigger` is carried as intent. `manual` means exactly the
   v0.1 behavior. `event`, `schedule`, and `webhook` declare *how the
   organization intends* the workflow to start, but have **no executable
   binding in v0.1**: the language cannot yet say *which* event, *what*
   schedule, or *which* endpoint, and binding grammars designed without a
   live scheduler/selector consumer would be build-ahead (the RFC-0002
   plugin-target precedent).
3. The three binding grammars are **named deferred language work**, each
   gated on the phase that consumes it: an event selector needs the event
   bus consumer, a schedule expression needs a scheduler, a webhook binding
   needs an ingress. When they land, auto-initiation must route through the
   same approval gate as explicit initiation (no bypass).

An explicitly started workflow may have any declared trigger — an operator
can always run a workflow by hand.

## Execution Semantics

### Ordering

1. The event log is the **single total order**. `EventLog.append` assigns
   `id` as a strictly increasing integer sequence starting at 1; log order,
   id order, and causal order coincide.
2. `timestamp` is informational only and never used for ordering (clocks
   are injectable, so tests are deterministic).
3. `replay` folds events strictly in id order. This resolves the ordering
   question RFC-0003 dropped to Phase 3.

### Execution model

1. The runtime core is **event-driven and non-preemptive**: each operation
   (`startWorkflow`, `submitApproval`, `reportTask`, `halt`, `resume`) runs
   synchronously to completion, appending its events before returning.
   There is no internal scheduler, queue, or timer in v0.1.
2. **Steps are sequential** within a run: step *n+1* is assigned only after
   step *n* completes. Concurrent runs interleave at operation boundaries.
3. **No retries in v0.1.** A failed task fails its run: `agent.task.failed`
   is followed by `workflow.failed` (payload `reason: "task-failed"`).
   Retry policy is a future concern gated on demonstrated need.
4. A run is identified by `runId`, assigned as `run-<n>` where *n* counts
   initiation requests in the log (so `replay` rebuilds the counter and the
   runtime holds none).

### Task lifecycle and the adapter seam

1. A workflow **must have an owner to be initiable** in v0.1: the owner
   agent is who tasks are assigned to. Initiating an ownerless workflow is
   refused (it remains valid, declarative-only content).
2. On start, each step becomes an agent task: the core emits
   `agent.task.assigned` (source: the workflow node; payload: agent node
   id, step name, index) and hands the task to the **provider adapter**
   (`AgentAdapter.dispatch(task)`, fire-and-forget).
3. The adapter reports outcomes back through `reportTask(runId, outcome)`;
   the core emits `agent.task.completed` / `agent.task.failed` (source: the
   agent node). After the last step completes the core emits
   `workflow.completed` (source: the workflow node).
4. The core ships with **no adapter**. Tests (and the Phase 3 prototype)
   drive `reportTask` directly — the human approval stub and stub adapter
   the roadmap calls for. Nothing above the seam names a provider
   (ADR-0004).

### Refusals

An operation the gates reject (halted runtime, unknown workflow, ownerless
workflow, a `manual` agent initiating, an unmatched approval principal, a
task report for nothing assigned) is **refused**: the call returns a
structured refusal and appends nothing. Refusals change no state, so replay
equivalence is unaffected; they are results, not observations.

Because a refusal is invisible in the log, the refusal result is the only
operator-facing signal, and its shape is **normative** (board condition 3):
`{ ok: false, reason: <machine-readable code> }`, with one stable code per
refusal cause above.

## The Approval Gate

Mechanics for RFC-0003's deny-safe, policy-scoped approval contract:

1. **Principal collection.** For `startWorkflow(workflowId, source)`, the
   governing policies are the workflow's `governedBy` plus, when `source`
   is an agent, that agent's `governedBy` (a policy applying to an agent
   gates every initiation by that agent). The required principals are the
   union of those policies' `requiresApprovalFrom`.
2. **Autonomy gates** (per `SPEC/language.md`):
   - a `manual` agent may not initiate — refused; a human starts the
     workflow directly instead;
   - a `supervised` agent gets the **intrinsic floor** (below) in addition
     to policy checkpoints;
   - an `autonomous` agent is gated by policy checkpoints only;
   - a `human:<id>` source is an explicit human instruction and adds no
     intrinsic requirement beyond the policies.
3. **The intrinsic floor is routed to `human:*`.** The v0.1 language has no
   construct naming a supervising human for an agent, so the floor's
   requirement is the wildcard principal `human:*`: any `human:<id>` may
   grant it. It is added **only when the policy-derived principal set
   contains no human principal** — a policy-required human approval already
   satisfies "a human approved this initiation," and requiring the same
   human to approve twice serves nothing. Routing the floor to a *specific*
   human requires a language construct (a named deferred spec item).
   Deny-safety is preserved: a supervised initiation always requires at
   least one human grant. `human:*` is **reserved** (board condition 2): it
   is not a valid identifier, so it can never be declared in a Genome
   document — semantic rule 4 enforces this, and `SPEC/language.md` now
   states it.
4. **Requests.** If the required set is non-empty the run enters
   `pending-approval`: one `approval.requested` per governing policy
   (source: the policy node; payload: workflowId and that policy's
   principals), plus one for the floor when present (source: the initiating
   agent node; payload principal `human:*`). If the set is empty the run
   starts immediately.
5. **Matching.** `submitApproval(runId, principal, verdict)` matches the
   responding principal against the run's pending set — exactly, or a
   `human:<id>` response against a pending `human:*`. `approval.granted` /
   `approval.denied` events carry the responder as `source` and the matched
   requirement in the payload. When the pending set empties,
   `workflow.started` is emitted (source: the initiating principal) and the
   first task is assigned.
6. **Denial terminates.** One `approval.denied` ends the run: the core
   emits `policy.enforced` for each governing policy that declared the
   denied principal (source: the policy node), then `workflow.failed`
   (payload `reason: "approval-denied"`). Deny-safe: absence of a response
   simply leaves the run pending forever; nothing defaults to granted.

## Operator Emergency Stop

ADR-0004 required an emergency-stop story that does not resort to
runtime-local settings. The resolution: **the stop is an event, not a
setting.**

1. `halt(source)` and `resume(source)` append `runtime.halted` /
   `runtime.resumed` control events. Only a `human:<id>` principal may halt
   or resume (Constitution Principle 9: override is explicit and human).
2. While halted the runtime **dispatches nothing**: initiation, approval
   submission, and task reports are refused. In-flight adapter work that
   completes during a halt is reported after resume — adapter state is
   disposable, so a delayed report degrades to retry, never divergence
   (ADR-0004).
3. Because the stop lives in the log it is **attributable** (who stopped
   the organization, when) and **replayable** (`replay` rebuilds the halted
   flag) — observed state stays `replay(log)`. A runtime-local pause flag
   would have been exactly the unreconcilable hidden state Governance
   Rule 6 forbids.
4. The halt is an *operational* control: it does not survive into a new
   runtime and is not organizational truth. *Durably* pausing an agent or
   workflow remains Genome content and needs a language construct (a named
   deferred spec item, unchanged from RFC-0003).

### Event contract extension (additive)

`runtime.halted` and `runtime.resumed` extend the RFC-0003 taxonomy —
exactly the additive extension ADR-0004 authorizes this RFC to make. They
are runtime-scoped, not run-scoped, so their envelope carries
`runId: null`; the ten RFC-0003 event types keep a required, non-null
`runId`. (The envelope's `runId` type widens to `string | null` for the
control events only; no shipped consumer exists, and no RFC-0003 type
changes meaning.)

## Replay and Observed State

RFC-0003 made `replay` normative; this RFC makes it **structural**:

1. `replay(events): RuntimeState` is a pure function folding events in id
   order into `{ halted, runs }`, where each run carries `workflowId`,
   `revision`, `status` (`pending-approval` | `running` | `completed` |
   `failed`), the pending principal set, the currently assigned step, and
   the count of completed steps. Replay is **forward-tolerant** (board
   condition 1): the taxonomy is additive-only, so unknown event types are
   inert — a v0.1 replayer must never crash on a log written under a later,
   additively-extended taxonomy.
2. The runtime core holds **no run state outside the log**: every
   operation derives its view by replaying its own log, decides, and
   appends. `runtime.state()` *is* `replay(log)` — the reconstructibility
   constraint is satisfied by construction, not by discipline. (Replaying
   the full log per operation is O(n²); acceptable for the Phase 3
   prototype, an optimization concern later — the *contract* is what is
   normative.)
3. The compiled models themselves are **inputs, not observed state**: the
   runtime keeps a revision→model map populated by intake/adoption, the
   same way a process keeps its code. Replay rebuilds everything the
   runtime *observed*, which never includes model content.

## Revision Adoption (drain mechanics)

Per ADR-0004 the semantics are drain; this RFC pins the mechanics:

1. `createRuntime({ model })` intakes the initial model;
   `adoptRevision(model)` intakes a successor (refused if the revision is
   already known).
2. New initiations always use the **latest adopted model**, and every event
   of a run carries the revision the run started under — in-flight runs
   keep attributing their original revision until they drain. Control
   events carry the latest adopted revision.
3. Adoption itself appends no event: which model is current is an input,
   not an observation; a run's revision is observable on its own events.

## Package Layout

- `packages/genome-runtime/src/events/` — the dependency-free events
  module (ADR-0004): envelope type, taxonomy constants, control-event
  types. Imports nothing.
- `packages/genome-runtime/src/log/` — `EventLog`: append (id assignment),
  read, subscribe. The subscribe hook is the Phase 3 "event bus": views and
  tests observe the log; subscribers can never mutate it.
- `packages/genome-runtime/src/replay/` — the normative `replay`.
- `packages/genome-runtime/src/runtime/` — the core: intake, gates,
  lifecycle, halt/resume, adoption. Depends on `@genome/compiler` for the
  `RuntimeModel` type only.
- `packages/genome-compiler/src/targets/` gains `runtimeModelTarget`;
  revision derivation lands beside the existing stages.

## Decisions

These resolve the RFC's original open questions, per the Architecture Board
decision of 2026-07-13.

1. **The intrinsic supervised floor routes to `human:*`** rather than
   waiting for a named-supervisor language construct. Deny-safety (at least
   one attributable human grant per supervised initiation) is the
   constitutional invariant; routing precision is an authorization concern
   the v0.1 language cannot express, and waiting would leave supervised
   agents unimplementable for the phase. Resolved 2–1; the
   named-supervisor construct remains a named deferred spec item.
2. **Control events carry `runId: null`.** A sentinel string could collide
   with the run-id namespace, and a second envelope would fork the log and
   break the single total order. The widening touches only the two new
   control types; the ten RFC-0003 types keep a required `runId`.
3. **Halt suspends dispatch; it never hard-fails in-flight runs.** Events
   are observations: emitting `workflow.failed` for work that did not fail
   would fabricate observations and poison replay. Suspension also
   composes with drain adoption (halt → adopt fixed revision → resume).
4. **Revision adoption emits no event.** The log records what the
   organization did (each run's events carry its revision); which models
   were made available is deployment history owned by the Genome's own
   version control.

## Definition of Done

- `RuntimeModel` shape pinned and implemented as a compiler target — ☐
- Genome revision derivation specified and implemented — ☐
- trigger executability resolved for v0.1 — ✅ (explicit initiation only;
  binding grammars deferred to their consuming phases)
- ordering and execution semantics pinned and implemented — ☐
- approval gate mechanics pinned and implemented (deny-safe, `runId`-matched) — ☐
- emergency stop implemented as attributable control events — ☐
- `replay` implemented; `state() == replay(log)` holds by construction — ☐
- open questions resolved by the Architecture Board — ✅ (Decisions above)
- ADR recorded on acceptance — ✅
  (`docs/adr/0005-runtime-execution-contract.md`)
