# Architecture Board Decision — RFC-0003: Runtime Boundary

- **Process:** `docs/GOVERNANCE.md` → Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer)
- **Date:** 2026-07-13
- **RFC:** RFC-0003 — Runtime Boundary
- **Quorum:** 3/3

## Votes

| Role | Verdict |
|------|---------|
| Product Owner | Request Changes |
| Chief Architect | Request Changes |
| Lead Engineer | Request Changes |

**Outcome: Request Changes — unanimous.** The boundary is the right one and
is sequenced correctly (specification before any runtime code, Constitution
Principle 10), but the draft could not be Accepted: its own Definition of
Done required the open questions closed; it contained factual errors against
the shipped compiler; its central approval-gate contract had no language
construct to bind a policy to the action it governs; and its version
attribution rested on a document-revision identity the specification did not
define.

The conditions have since been applied. RFC-0003 is now marked **Accepted**,
its decisions recorded in `docs/adr/0004-runtime-boundary.md`.

## Consensus

1. **Right boundary, right time.** Compiled artifacts in, append-only events
   out, change through new Genome revisions, deny-safe approval, provider
   adapters — all three roles endorsed the contract. This is what keeps
   Genome "describe once, compile" rather than another agent builder.
2. **Event types live in `packages/genome-runtime`** (dependency-free
   `events/` module), not in the compiler (which never produces or consumes
   events) and not in a `genome-events` package (no second consumer exists —
   the ADR-0003 rule, and the same YAGNI the board applied to plugin targets
   in RFC-0002).
3. **Envelope and taxonomy are normative, additive-only.** The Lead
   Engineer's argument was decisive: the RFC's normative constraints are
   defined in terms of taxonomy members, so a non-normative taxonomy leaves
   the contract untestable — the RFC-0002 graph precedent applies. (The
   Product Owner had preferred pinning the taxonomy in Phase 3; resolved
   2–1, with the additive-only rule and the envelope fixes addressing the
   freeze-too-early concern.)
4. **Supervised = layered semantics.** The Chief Architect's ruling closed
   the deny-safety hole in "policy-declared checkpoints only" (a supervised
   agent with no applicable policy would have behaved as autonomous): an
   intrinsic approval floor before each workflow initiation, plus
   policy-declared checkpoints. This simultaneously satisfies the Product
   Owner's conservative-default requirement. Omitted autonomy defaults to
   `manual`. Added to `SPEC/language.md` as an acceptance precondition.
5. **Drain adoption, normative now** — the only semantic that keeps
   attribution coherent, trivially testable, and needing no migration
   machinery. Unanimous.
6. **Proposal payload reserved, format deferred to Phase 6** with two
   binding constraints (structured schema-validated patch via the reference
   grammar; provider-neutral). (The Product Owner had preferred removing
   `genome.proposal.created` from the taxonomy entirely as Phase 6
   build-ahead; resolved 2–1 — the reconciliation contract needs a named
   observable, and a reserved payload designs nothing ahead of its
   consumer.)

## Per-role contributions

### Product Owner
Caught the two scope leaks (Phase 6 via the proposal event, Phase 4/5 via
the `genome-events` package option), the `genomeVersion` concept collision,
the stale `SPEC/language.md` Compilation Targets section that RFC-0002's
trim never updated, the three-name drift ("runtime model" / "runtime graph"
/ ROADMAP), and the over-broad Governance Rule 7 and Principle 6 citations.
Flagged the operator emergency-stop story ("pausing an agent" has no
language construct) as a product concern the Phase 3 RFC must answer without
runtime-local settings.

### Chief Architect (rulings)
- Q1 → runtime package, dependency-free `events/` module, split on second
  consumer.
- Q2 → envelope and taxonomy normative, additive-only.
- Q3 → layered supervised semantics with an intrinsic deny-safe floor.
- Q4 → drain, normative, not a placeholder.
- Q5 → payload deferred to Phase 6 under two binding constraints.
- Found the one real boundary hole: event-log reconstructibility ("no
  runtime component may hold unrebuildable state") plus provider-neutral
  payloads jointly made a functioning adapter impossible — adapters must
  hold provider correlation handles. Resolved by scoping reconstructibility
  to the core above the adapter seam and requiring adapter state to be
  disposable.
- Legitimized the un-deferral: adding the runtime-model target to
  `packages/genome-compiler` is exactly the "future RFC tied to the
  consuming phase" that ADR-0003 anticipated; ADR-0004 records the
  supersession.

### Lead Engineer (feasibility)
- **The approval gate had no subject**: nothing in the language, schema,
  AST, or graph said what a policy governs (`PolicyNode` was
  `{id, requiresApprovalFrom}` only). Largest gap in the draft → the
  `appliesTo` policy-scope grammar, which also supplies the checkpoint
  construct Q3 needed.
- The envelope could not support its own constraints: no run/correlation id
  (two concurrent runs of the same workflow were indistinguishable, and
  approval grants could not be matched to requests), no way to attribute a
  human approver (humans are deliberately not graph nodes), and
  `genomeVersion` — the language version, `0.1` for every document — cannot
  attribute anything. → `runId`, `source` accepting `human:<id>`, and the
  derived Genome-revision identity added to `SPEC/language.md`.
- "State reconstructible from the log" was an untestable universal
  prohibition → inverted into the normative `replay` operation.
- Verified the graph carries autonomy (optional, defaultless → deny-safe
  default `manual` added to the spec) and triggers (enumerated but not
  executable → named Phase 3 spec work), and that the compiler validates
  but then drops `objective.owner`/`metric.owner` (no `owns` edges) →
  queued compiler fix.
- Caught the provider-boundary self-contradiction: the runtime model carries
  `provider: github` as declared data, which the draft's "nothing above the
  seam may reference a provider concept" forbade → identifiers-as-data rule.

## Corrections to input material

- The draft's event example used `source:
  agent:departments.engineering.agents.backend`. **Incorrect** — graph node
  ids skip the `teams`/`agents` container keys
  (`agent:engineering.platform.backend`), per the reference grammar RFC-0002
  itself added to `SPEC/language.md` and the shipped `nodeId` in
  `packages/genome-compiler/src/graph/index.ts`. Caught by the Chief
  Architect and Lead Engineer.
- The draft claimed the runtime model carries "exactly the concepts the
  graph already models" while listing six of the ten normative node types.
  **Incorrect** — Company, Department, Team, and MemoryStore were omitted;
  the hierarchy is needed for attribution and approval routing. Caught by
  all three roles.
- The draft said policies arrive "with resolved approval principals."
  **Overstated** — agent principals resolve to `approves` edges; human
  principals remain unresolved strings by design. Caught by the Lead
  Engineer.

## Applied changes

- `RFC/0003-runtime.md` — status Accepted; open questions → Decisions;
  envelope fixed (`genomeRevision`, `runId`, principal-capable `source`,
  corrected node-id example, "monotonic" ordering dropped to Phase 3);
  taxonomy normative additive-only; reconstructibility scoped to the core
  with normative `replay`; drain adoption normative; proposal payload
  reserved; policy scope wired to `appliesTo`; provider
  identifiers-as-data rule; runtime-model node list corrected; known
  Phase 3 preconditions named; citations corrected.
- `SPEC/language.md` — Versioning section (language version vs. derived
  Genome revision); autonomy behavioral semantics and deny-safe `manual`
  default; Policy Scope (`appliesTo`) grammar; Compilation Targets section
  reconciled with the RFC-0002 trim and the "runtime model" name.
- `SPEC/examples/company.yaml` — `production-deploy` policy now declares
  `appliesTo: [build-feature]`.
- `ROADMAP.md` — Phase 3 "Runtime graph" renamed to "Runtime model intake
  (per RFC-0003)".
- `docs/adr/0004-runtime-boundary.md` — recorded decision.
- `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md` — state advanced; queued
  compiler preconditions (policy-scope compilation, objective/metric `owns`
  edges); `packages/genome-runtime` and the runtime-model target remain
  gated on the Phase 3 RFC.
