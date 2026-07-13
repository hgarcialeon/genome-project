# RFC-0003: Runtime Boundary

## Status

Draft

Submitted to the Architecture Board for review. This RFC defines the boundary
of the Genome Runtime — its contract with the compiler, the Genome document,
and human governance — before any runtime code is written (Constitution
Principle 10). It does **not** authorize runtime implementation; Phase 3
implementation work requires this RFC to be accepted and queued.

## Summary

The Genome Runtime executes compiled organizations and observes the results.

This RFC fixes the runtime's architectural boundary:

- the runtime consumes **compiled artifacts**, never raw Genome documents
- the runtime produces **events**, never durable organizational change
- durable change flows through **new Genome versions**, reconciled by recompilation
- **human approval** is a first-class execution gate, not an add-on
- **provider adapters** isolate the runtime core from any specific agent vendor

The boundary is the deliverable. Execution semantics (scheduling, retries,
concurrency) are intentionally left to the Phase 3 implementation RFCs that
follow acceptance of this one.

## Motivation

RFC-0002 deferred the `runtime model` compilation target to "Phase 3 —
Runtime" to avoid building ahead of a live consumer. Before that consumer can
exist, its boundary must be specified, or the runtime will grow by accretion
into exactly what the Constitution forbids:

- a second source of truth that drifts from the Genome (Principle 2)
- hidden state that cannot be reconciled with the Genome (Governance Rule 6)
- provider-specific assumptions leaking into the core (Governance Rule 7)
- autonomy without explicit human governance (Principle 9)

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
- give Phase 3 a stable boundary to implement against

## Non-goals

The runtime boundary RFC does not:

- implement any runtime component (no code ships from this RFC)
- specify scheduling, concurrency, retry, or delivery semantics
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
→ Reconciliation → new Genome version → recompile
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
alongside the existing `inspect`/`graph`/`docs` targets.

Normative constraints:

1. The runtime model is derived **only** from the Organization Graph. If the
   runtime needs information the graph does not carry, the fix is a compiler
   or specification change — never a runtime-side reading of Genome YAML
   (ADR-0002).
2. The runtime model is **immutable**, like the graph it derives from. A new
   Genome version produces a new runtime model.
3. The runtime model carries the compiled forms of exactly the concepts the
   graph already models: agents (with autonomy levels), workflows (with
   triggers and owners), policies (with resolved approval principals),
   integrations, objectives, and metrics.

The precise TypeScript shape of `RuntimeModel` is specified in the Phase 3
implementation RFC once this boundary is accepted, mirroring how RFC-0002
pinned the graph contract before the compiler shipped.

## Events

The runtime's only output channel is an **append-only event log**
(Constitution Principle 6).

Normative constraints:

1. **Append-only.** Events are immutable once emitted; corrections are new
   events, never edits.
2. **Attributable.** Every event names the runtime-model version (and thus the
   Genome version) it executed against, and the node (agent, workflow,
   policy) that produced it.
3. **Reconstructible.** Observed runtime state is a fold over the event log.
   No runtime component may hold state that cannot be rebuilt from the log —
   this is the mechanical enforcement of Governance Rule 6 ("runtime state
   must be reconcilable with the Genome").
4. **Provider-neutral.** Event payloads must not require knowledge of a
   specific agent provider to interpret.

### Event envelope (v0.1)

```yaml
event:
  id:            # unique, monotonic within the log
  timestamp:
  genomeVersion: # the compiled Genome version executing
  source:        # graph node id, e.g. agent:departments.engineering.agents.backend
  type:          # from the event taxonomy
  payload:       # type-specific, provider-neutral
```

### Event taxonomy (proposed, minimal)

- `workflow.started` / `workflow.completed` / `workflow.failed`
- `agent.task.assigned` / `agent.task.completed` / `agent.task.failed`
- `approval.requested` / `approval.granted` / `approval.denied`
- `policy.enforced`
- `genome.proposal.created` (see Reconciliation)

The taxonomy is deliberately small; whether it is normative in v0.1 or pinned
by the Phase 3 RFC is Open Question 2.

## Reconciliation

The Genome describes desired state; the event log describes observed state.
The runtime **never** closes that loop by mutating the organization.

Normative constraints:

1. Durable organizational change happens by producing a **new Genome
   version** and recompiling (RFC-0002 "Immutability").
2. The runtime may **propose** change — emitting a `genome.proposal.created`
   event carrying a suggested Genome diff — but a proposal has no effect
   until a governed actor (human, or the Phase 6 self-improvement loop under
   its own RFC) accepts it into a new Genome version.
3. When a new Genome version is compiled, the runtime **adopts** the new
   runtime model at a defined boundary (in-flight work drains or migrates —
   semantics deferred to Phase 3), and subsequent events attribute to the new
   version.
4. Runtime configuration that changes behavior (autonomy overrides, pausing
   an agent) is itself organizational state and therefore lives in the
   Genome, not in runtime-local settings.

## Human Approval

Human governance is a first-class execution primitive (Constitution
Principle 9), not middleware.

Normative constraints:

1. Compiled policies with `requiresApprovalFrom` **gate execution**: the
   runtime must not perform the governed action before an
   `approval.granted` event exists for that request.
2. Approval requests and responses are ordinary events in the log, fully
   attributable to the policy node and principal (`human:<id>` or agent
   reference, per `SPEC/language.md`).
3. `agent.autonomy` binds the runtime: `manual` agents act only on explicit
   human instruction; `supervised` agents require approval at policy-defined
   checkpoints; `autonomous` agents act within policy limits. The precise
   checkpoint semantics for `supervised` are Open Question 3.
4. Approval must be **deny-safe**: absence of a response blocks the action;
   it never defaults to granted.

## Provider Boundary

The runtime core must survive multiple agent providers (Governance Rule 7,
Architect bias "portable abstractions").

Normative constraints:

1. Agent execution goes through a **provider adapter** interface owned by the
   runtime package. The core schedules and observes; adapters translate to a
   concrete provider.
2. Nothing above the adapter seam (runtime model, event log, reconciliation,
   approval) may reference a provider concept.
3. Adapters are packaged separately from the runtime core, so a provider
   integration never becomes a core dependency.
4. Adapter configuration (credentials, endpoints) is deployment concern,
   not Genome content; the Genome's `integrations` section declares *that* a
   capability is used, never *how* to authenticate to it.

## Package Boundary (proposed)

Following the ADR-0003 precedent (one package until a second consumer
appears):

- `packages/genome-runtime` — runtime core: model intake, event log,
  workflow/agent lifecycle, approval gate. No provider code.
- Provider adapters as separate packages (`packages/genome-adapter-*`) when
  Phase 3 needs the first one — not before.
- The `runtime model` target lives in `packages/genome-compiler` with the
  existing targets (it is `(OrganizationGraph) => RuntimeModel`, a compiler
  concern).

Whether the event-log types live in the compiler package, the runtime
package, or a shared package is Open Question 1.

## Open Questions

For Architecture Board resolution before acceptance:

1. **Event-type ownership.** Do the event envelope and taxonomy types live in
   `packages/genome-runtime`, in `packages/genome-compiler`, or in a small
   shared `packages/genome-events`? (Views will eventually consume events
   without depending on the runtime.)
2. **Taxonomy normativity.** Is the v0.1 event taxonomy normative in this RFC
   (stable test target, per the RFC-0002 graph precedent) or pinned by the
   Phase 3 implementation RFC?
3. **Supervised checkpoints.** What exactly does `supervised` autonomy gate —
   every action, workflow boundaries, or policy-declared checkpoints only?
   This likely needs a `SPEC/language.md` addition.
4. **Version adoption semantics.** When a new Genome version compiles, do
   in-flight workflows drain on the old model or migrate? (May be deferrable
   to Phase 3 with a placeholder rule: drain, as the simpler semantic.)
5. **Proposal format.** Is a `genome.proposal.created` payload a textual diff
   of the Genome document, a structured patch, or deferred to the Phase 6
   self-improvement RFC?

## Definition of Done

- runtime input contract defined — ✅ (runtime model, compiled only)
- runtime output contract defined — ✅ (append-only, attributable events)
- reconciliation contract defined — ✅ (propose, never mutate)
- human approval contract defined — ✅ (deny-safe policy gates)
- provider boundary defined — ✅ (adapter seam, core stays neutral)
- open questions resolved by the Architecture Board — ⬜
- ADR recorded on acceptance — ⬜
