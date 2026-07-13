# ADR-0004: Runtime Boundary

## Status

Accepted

## Context

RFC-0002 established the compiler boundary and deliberately deferred the
runtime-model compilation target to its consuming phase. Before Phase 3 can
implement a runtime, its boundary must be fixed, or the runtime accretes
into a second source of truth with hidden state and provider coupling —
exactly what Constitution Principles 2, 6, and 9 and Governance Rules 6–7
forbid. RFC-0003 was reviewed and accepted by the Architecture Board on
2026-07-13 (`docs/reviews/RFC-0003-board-decision.md`).

## Decision

1. **Four-layer partition.** The Genome document owns truth; the compiler
   owns interpretation; the runtime owns execution and observation; views
   own projection.
2. **Compiled artifacts only.** The runtime consumes a runtime model —
   `(OrganizationGraph) => RuntimeModel` — and never reads Genome YAML.
   Missing information is fixed in the compiler or specification, never by
   runtime-side interpretation. The target lives in
   `packages/genome-compiler`; adding it supersedes the runtime-model
   deferral noted in ADR-0003/RFC-0002, though implementation waits for the
   Phase 3 RFC to pin the `RuntimeModel` shape.
3. **Append-only attributable events.** The runtime's output is an
   append-only event log with a normative envelope (`id`, `timestamp`,
   `genomeRevision`, `runId`, `source`, `type`, `payload`) and a normative,
   additive-only taxonomy. `source` is a graph node id or a `human:<id>`
   principal. Events attribute to the derived Genome revision
   (`SPEC/language.md`, "Versioning"), which maps 1:1 to the runtime model.
4. **Event types live in `packages/genome-runtime`**, in a dependency-free
   `events/` module; a shared events package waits for the first
   non-runtime consumer (ADR-0003 rule).
5. **Reconstructibility via replay.** The runtime core (above the adapter
   seam) must expose a normative `replay` operation; observed state is
   defined as `replay(log)`.
6. **Propose, never mutate; drain adoption.** Durable change is a new
   Genome revision plus recompilation. The runtime may emit
   `genome.proposal.created` (payload reserved until the Phase 6 RFC). On a
   new revision, in-flight work drains on its original model; new work
   starts on the new one.
7. **Deny-safe, policy-scoped approval.** Policies declare their scope with
   `appliesTo` (compiled to `requires` edges); governed workflow initiation
   requires `approval.granted` from each declared principal, matched by
   `runId`. Autonomy semantics are layered (`SPEC/language.md`): `manual`
   (explicit instruction only, and the default when omitted), `supervised`
   (intrinsic approval floor per workflow initiation plus policy
   checkpoints), `autonomous` (policy checkpoints only).
8. **Provider adapter seam.** No provider types or logic above the seam;
   provider identifiers as declared data pass through uninterpreted.
   Adapter-held provider state must be disposable (loss degrades to
   retry/re-observation, never divergent truth). Adapters ship as separate
   packages when Phase 3 needs the first one.

## Consequences

- Phase 3 has a stable, testable boundary: normative envelope, taxonomy,
  replay contract, drain rule, and approval gate.
- Compiler preconditions are explicit and queued: policy-scope semantic
  validation and `requires` edges; `owns` edges for objective/metric
  owners. Trigger executability and the `RuntimeModel` shape belong to the
  Phase 3 RFC; the proposal payload belongs to the Phase 6 RFC.
- The specification gained the constructs the boundary depends on:
  Genome-revision identity, autonomy behavioral semantics with a deny-safe
  default, and policy scope.
- No runtime implementation is authorized by this decision;
  `packages/genome-runtime` remains gated on the Phase 3 RFC.
