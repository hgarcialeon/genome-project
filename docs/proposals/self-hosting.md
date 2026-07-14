# Self-Hosting — Can Genome Describe and Govern the Genome Project Itself?

- **Instrument:** design proposal. This document decides nothing and
  authorizes nothing; it is the deliverable of an investigation
  commissioned by the Product Owner on 2026-07-14, scoped explicitly to
  "no implementation, design proposal only."
- **Prepared by:** Engineering Agent (bootstrapped per `docs/BOOTSTRAP.md`;
  Bootstrap Report delivered and approved 2026-07-14).
- **Evidence base:** HEAD `535eb70`, clean tree. All executable evidence
  below was produced with the shipped v0.1 toolchain against a *scratchpad*
  sketch document that was **not** committed; the sketch is reproduced in
  the appendix so every result is reproducible from this document alone.
- **Adjacent, not decided here:** the specification-maintenance proposal
  (`docs/reviews/phase-3-close-packet.md` §4) and the Phase 4 opening RFC,
  both awaiting their own dispositions.

## The Question

> Can Genome describe and govern the Genome project itself?

Split into its two verbs, because they have different answers:

- **Describe** — can a Genome v0.1 document express this project's
  organizational structure: its roles, its Board process, its RFC and
  phase-transition workflows, its ratification discipline?
- **Govern** — can the compiled document and the shipped runtime carry
  actual governance weight: produce decision records, gate work, or
  enforce process?

## Method

The investigation was performed against the repository, not from
recollection: the governance documents (`docs/CONSTITUTION.md`,
`docs/GOVERNANCE.md`, `docs/ARCHITECT.md`) were mapped element-by-element
onto the v0.1 language surface (`SPEC/language.md`,
`SPEC/schema/genome.schema.json`); a candidate self-describing document
was written; and — because this project's evidence standard lives at the
CLI boundary — the sketch was driven through the shipped `genome
validate`, `genome graph`, and `genome run` commands rather than assessed
by reading. One finding below exists *only* because of the execution step.

## Part A — Describing the Project: the Mapping

| Project reality | Genome v0.1 primitive | Fidelity |
|---|---|---|
| North Star ("Describe a company once…") | `company.mission` | Exact |
| Product Owner (ratification authority) | Human principal `human:product-owner` in `policies.*.requiresApprovalFrom` | Exact for the authority; the *person/role* itself is not declarable (Gap 2) |
| Chief Architect, Lead Engineer | Agents with `autonomy: manual` ("acts only on explicit human instruction") | Workable; conflates human roles with agents (Gap 2) |
| Engineering Agent (implements queue items when commissioned) | Agent with `autonomy: supervised` | Conceptually exact — the intrinsic approval floor *is* this project's "Bootstrap approved" commissioning pattern — but see Gap 1 for who the gate actually binds |
| Architecture Board ("a process, not a fixed group of people") | Workflows: `rfc-lifecycle`, `phase-transition-review` | Good fit — the Board being a process is precisely why it maps to a workflow, not an agent |
| Decision lifecycle (Idea → RFC → Review → Approved → Queue → PR → Merge → ADR) | Workflow `steps` | Shape yes; loops and branches no (Gap 4) |
| Ratification, deny-safe (Governance approval rules, Principle 9) | `requiresApprovalFrom: [human:product-owner]`; absence of approval blocks | Exact — demonstrated below |
| Decision records (RFC/, docs/adr/, docs/reviews/) | `memory.stores: [rfcs, adrs, board-reviews, retrospectives]` | Labels only (Gap 3) |
| GitHub | `integrations.github` | Exact |
| Mechanical checks (uncached suite, `check-state`) | `metrics` | Declarative labels with owners; adequate |
| Phases, roadmap statuses, implementation queue | — none — | Not expressible — and correctly so (Part C) |

### Executable evidence

All commands run 2026-07-14 at HEAD `535eb70` against the appendix sketch
(`$SELF` below). Every claim is a command anyone can re-run.

| Command | Result |
|---|---|
| `genome validate $SELF` | ✅ exit 0 — the self-description is a valid Genome document |
| `genome graph $SELF` | ✅ exit 0 — compiles to an Organization Graph with `owns`, `measures`, `belongs_to`, and policy `requires` edges |
| `genome run $SELF --workflow rfc-lifecycle` (no grant) | ✅ exit 3 — parks deny-safe: `approval.requested`, `pending approvals: human:product-owner`, zero steps executed |
| `genome run $SELF --workflow rfc-lifecycle --grant human:product-owner --clock 2026-07-14T00:00:00Z` | ✅ exit 0 — `approval.granted` attributed to `human:product-owner`, then draft → board-review → ratify → record-adr → queue-work, 14 events, `Run run-1: completed` |
| `genome run $SELF --workflow implement-queue-item` (no grant, workflow-scoped policy) | ✅ exit 3 — engineering work parks pending Product Owner commissioning |

The headline: **the shipped v0.1 stack already executes this project's own
ratification discipline with the correct deny-safe semantics** — an
un-ratified Board workflow cannot proceed, a ratified one runs to
completion, and the run log carries the attributed `approval.granted`
event. Notably, that attributed event is exactly the artifact whose
absence the 2026-07-14 Bootstrap Report flagged (the Phase 3 ratification
act exists only as commit-message assertion). The language can already
express, and the runtime already produce, the record this project's
governance currently keeps informally.

**Answer to "describe": yes, with useful fidelity today** — the
structural core (roles, Board process, ratification gates, deny-safe
defaults) maps cleanly. The gaps are real but bounded, and are catalogued
next.

## Part B — Gaps Found

Ordered by significance. None is a defect: in every case the shipped
behavior matches the specification as written. These are expressiveness
limits, surfaced by dogfooding — each is a *candidate* for future
language work, and per the project's own discipline (deferred trigger
grammars, RFC-0004) each should stay unbuilt until a concrete consumer
gates on it.

### Gap 1 — Initiator-scoped vs. executor-scoped gating

*Found by execution, not by reading.* The first sketch modeled "no
engineering work without commissioning" as a policy applying to the
Engineering Agent (`appliesTo: [engineering.engineering-agent]`) plus
`autonomy: supervised`. Driven through `genome run`, that workflow **ran
to completion with no approval at all**.

The behavior is specified: an agent-applied policy "gates every workflow
initiation *by* that agent" (`SPEC/language.md`), and the supervised
floor gates workflows the agent *initiates*
(`packages/genome-runtime/src/runtime/index.ts:140-159`). But `genome
run` initiates as `human:operator` — the owning agent *executes* the
steps without ever being the initiator, so neither gate fires. The
governance rule this project actually has is **executor-scoped** ("work
performed by the Engineering Agent requires commissioning"), and v0.1
has no owner-scoped gate. The workaround is to restate the policy per
workflow (`appliesTo: [implement-queue-item, …]`) — verified to park
deny-safe at exit 3 — but that must be maintained by hand for every
future workflow the agent owns: a quiet failure mode where adding a
workflow silently adds ungated work.

*Candidate future work:* owner-scoped `appliesTo` semantics (or a
workflow-set selector). *Weight:* the most consequential finding here —
both because self-governance would depend on it and because any real
customer organization writing "everything this agent does needs
sign-off" will hit the same surprise.

### Gap 2 — Humans are principals, not members

Humans appear in v0.1 only as approval principals (`human:<id>`). The
Product Owner — the project's highest authority — cannot be *declared*
anywhere; they exist only where a policy happens to name them. Modeling
the Chief Architect and Lead Engineer as `autonomy: manual` agents is
semantically defensible ("acts only on explicit human instruction," and
the Charter says the roles may be fulfilled by humans or automated
systems) but conflates two things the org chart should distinguish.
*Candidate:* first-class human members or role declarations.

### Gap 3 — No artifact primitive

This project's actual work products are documents — RFCs, ADRs, review
packets, evidence logs. Workflow steps are opaque strings; there is no
way to express "the `board-review` step produces a review document" or
"ratification consumes the packet." `memory.stores` gestures at the
archive but carries no structure. *Candidate:* step inputs/outputs or an
artifact type — plausibly the same machinery the Phase 6 proposal
payload will need.

### Gap 4 — Workflows are straight lines

The decision lifecycle loops (Request Changes → revise → re-review) and
branches (accept / amend / return). v0.1 steps are a flat sequential
list, and the runtime executes them in order. The self-description can
name the happy path only. *Candidate:* conditional/iterative flow — a
large language decision that should wait for more than one consumer.

### Gap 5 — Approval is conjunctive only

`requiresApprovalFrom` requires every listed principal. The Board's
two-independent-role-reviews-then-ratification shape can be approximated
(list all three principals) but quorums, role-differentiated review
content, and ordering are out of reach. Adequate for present governance;
noted for completeness.

## Part C — The State Boundary (why part of the project *must not* be described)

Phases, roadmap statuses, the implementation queue, blockers — none of it
maps to v0.1, and the investigation's conclusion is that this is a
feature, not a gap. Governance Rule 8 gives current state exactly one
home, `PROJECT_STATE.md`. A self-Genome that restated the current phase
or objective would create the second source of truth the project's own
`check-state` script exists to prevent.

Genome's architecture already draws this exact line for its customers:
the Genome document declares durable *structure*; current *status* lives
in the event log; observed state is `replay(log)` by construction. The
symmetry is precise — **`PROJECT_STATE.md` is this project's
`replay(log)`** — and it means self-description is achievable without
contradiction *if and only if* the self-Genome is restricted to
structure: roles, workflows, policies, integrations, memory, objectives,
metrics. This restriction should be a binding constraint on any adoption
of this proposal.

## Part D — What "Govern" Could Mean: Three Levels

### Level 1 — Descriptive self-hosting (recommended)

Commit the self-describing document as a second example alongside
`SPEC/examples/company.yaml`. Governance documents remain solely
authoritative; the example is a *projection* of them, explicitly
non-normative for governance, with CLI-boundary evidence (the
validate/graph/run cases above) protecting it like any other shipped
surface.

Value: permanent dogfooding pressure on the language (Gap 1 was found
this way in an afternoon); a worked "the Genome describes an
organization that governs by approval" example for outsiders — the
strategic pitch demonstrated on the project itself; and a natural demo
document for the Phase 4 Studio (an IDE whose sample file is the project
that built it). Cost: one YAML file, a handful of CLI tests, and a
divergence risk handled by review discipline (below).

Since `SPEC/` is normative surface and examples have historically been
Board-reviewed, adoption should go through a small RFC.

### Level 2 — Evidentiary self-hosting (worth a Board agenda item, not more)

Use the runtime as the *recorder* of governance acts: a ratification is
performed as `genome run … --grant human:product-owner --export-log`,
and the exported NDJSON — carrying the attributed `approval.granted`
event — is committed beside the review document as the durable,
machine-checkable ratification record. This directly closes the
Bootstrap Report's observation 2 (ratification acts currently exist only
as commit-message assertions).

Two interactions require explicit Board judgment before any adoption:

1. **The persistence tripwire.** The pinned gate says any shipped code
   path that *reads* an exported log is event persistence's first
   consumer and requires an RFC. Committed logs read by humans and
   reviews do not literally trip it — the export stays write-once and no
   shipped reader exists — but this walks close enough to the line that
   proceeding without a ruling would be gate erosion. If anyone ever
   wants `check-state` to *verify* those logs, that verification is a
   reader, and the gate fires in full.
2. **Instrument overlap.** A committed ratification log is a
   decision-record instrument, exactly the territory of the deferred
   specification-maintenance proposal (`phase-3-close-packet.md` §4).
   The two should be disposed together, not piecemeal.

### Level 3 — Operative self-hosting (defer to Phase 6, explicitly)

The runtime actually gating repository operations: CI refusing a merge
without a matching approval event, governance state reconstructed from
durable logs, proposals flowing through `genome.proposal.created` (whose
payload RFC-0005/ADR-0006 reserve for Phase 6). This is the
roadmap's Phase 6 — "allow Genome to improve Genome" — arriving through
the govern door. It requires durable event persistence as its very first
ingredient, and is therefore *defined* to be the persistence gate's first
consumer, requiring its own RFC. Nothing here should be pursued now; the
value of naming it is that Phase 6 planning can treat "govern the Genome
project" as a candidate concrete consumer instead of an abstraction.

## Constitutional Check

- **P1 (specification is the product):** dogfooding is direct pressure on
  the specification's quality; Gap 1 is the proof.
- **P2/P5 (source of truth; views own no logic):** honored only under the
  Part C restriction — the self-Genome must never restate state.
- **P7 (decisions are versioned):** this proposal, and any adoption, are
  repository documents; Level 2 would *strengthen* P7.
- **P8 (small stable primitives):** the gap list must not become a v0.2
  feature bundle; each gap waits for its consumer, per the deferred
  trigger-grammar precedent.
- **P9 (human governance first-class):** the demonstrated deny-safe
  parking of an un-ratified Board workflow is P9, executable.
- **P10 / Charter ("examples before abstractions"):** Level 1 is
  precisely an example before any abstraction; Gaps 1–5 stay abstractions
  until consumers exist.

## Risks

1. **Navel-gazing.** Self-description is a test case, not the design
   driver; external organizations remain the language's audience. The
   gap list is *input* to future RFCs, not a commitment.
2. **Second source of truth.** If the self-Genome drifts into state or
   its projection of the governance docs goes stale, it becomes the
   contradiction generator the project is built to prevent. Mitigations:
   the Part C restriction; explicit non-normative marking; and review
   discipline treating governance-doc changes as triggers to re-check the
   example (mechanical checking would be a Level-2/3 decision).
3. **Premature language growth.** Adopting Gap fixes now would invert
   the project's consumer-gated discipline. Recommended handling: record,
   wait.
4. **Governance theater.** Level 2's exported logs are records, not
   enforcement; presenting them as enforcement would overclaim. Levels
   are kept separate for exactly this reason.

## Recommendation

1. **Adopt Level 1 via a small RFC** (next free number), scoped to: the
   self-describing example document (structure only, per Part C),
   marked non-normative for governance; CLI-boundary evidence cases
   equivalent to the table in Part A; no language changes; no
   compiler/runtime changes (empty protected diff, per the RFC-0006
   precedent).
2. **Record Gaps 1–5 as language-evolution candidates**, each gated on a
   concrete consumer. Gap 1 deserves priority attention in whichever RFC
   first touches policy semantics, since it affects customers, not just
   self-hosting.
3. **Put Level 2 on the Board agenda together with the deferred §4
   maintenance-mechanism proposal** — both are decision-record
   instruments and should be shaped as one coherent answer.
4. **Defer Level 3 to Phase 6 planning explicitly**, naming
   "govern the Genome project" as a candidate first consumer for event
   persistence.

None of this displaces or delays the Phase 4 opening RFC; Level 1 is
independent of it (and feeds it a demo document if Phase 4 wants one).

## Decisions Requested from the Product Owner

1. Disposition of this proposal: commission the Level 1 RFC, amend, or
   decline.
2. Whether Level 2 joins the pending §4 disposition on the Board agenda.
3. Confirmation that Level 3 is deferred to Phase 6 planning.

## Explicitly Not Done by This Investigation

- No example file committed (`SPEC/` untouched); the sketch lived in a
  scratchpad and is preserved only in the appendix below.
- No language, schema, compiler, runtime, or CLI change of any kind.
- No RFC drafted; no queue entry added; no governance document modified.
- No Phase 4 work.

## Appendix — The Sketch and Its Evidence

Non-normative. This is the exact document the Part A evidence was
produced against (after the Gap 1 correction: `queue-discipline` applies
to the workflow, not the agent). It validates and compiles under the
shipped v0.1 toolchain.

```yaml
genomeVersion: 0.1

company:
  name: Genome Project
  mission: Describe a company once. Compile it into an autonomous organization.
  timezone: UTC

departments:
  governance:
    mission: Keep decisions documented, reviewed, and reproducible beyond any individual contributor or conversation.
    agents:
      chief-architect:
        role: Chief Architect
        autonomy: manual
        skills:
          - architecture-review
          - specification-writing
          - boundary-analysis
      lead-engineer:
        role: Lead Engineer
        autonomy: manual
        skills:
          - implementation-review
          - evidence-verification
          - delivery-feasibility

  engineering:
    mission: Implement approved work from the Implementation Queue.
    agents:
      engineering-agent:
        role: Engineering Agent
        autonomy: supervised
        skills:
          - typescript
          - compiler-construction
          - runtime-implementation
          - cli-boundary-testing

workflows:
  rfc-lifecycle:
    owner: governance.chief-architect
    trigger: manual
    steps:
      - draft
      - board-review
      - ratify
      - record-adr
      - queue-work

  implement-queue-item:
    owner: engineering.engineering-agent
    trigger: manual
    steps:
      - bootstrap
      - implement
      - test-uncached
      - reconcile-state
      - merge

  phase-transition-review:
    owner: governance.chief-architect
    trigger: manual
    steps:
      - prepare-packet
      - board-review
      - ratify
      - apply-closure

policies:
  ratification:
    appliesTo:
      - rfc-lifecycle
      - phase-transition-review
    requiresApprovalFrom:
      - human:product-owner

  queue-discipline:
    appliesTo:
      - implement-queue-item
    requiresApprovalFrom:
      - human:product-owner

integrations:
  github:
    type: source-control
    provider: github

memory:
  retention: long-term
  stores:
    - rfcs
    - adrs
    - board-reviews
    - retrospectives

objectives:
  north-star:
    description: Genome becomes the declarative language for autonomous organizations.
    owner: governance.chief-architect

metrics:
  uncached-suite-green:
    type: quality
    owner: engineering.engineering-agent
  state-consistency:
    type: governance
    owner: governance.lead-engineer
```

Granted-path transcript (fixed clock `2026-07-14T00:00:00Z`), abridged to
the governance-relevant events:

```text
#1  approval.requested  policy:ratification  workflowId=rfc-lifecycle  principals=["human:product-owner"]
#2  approval.granted    human:product-owner  principal=human:product-owner
#3  workflow.started    human:operator       workflowId=rfc-lifecycle
#4–#13  agent.task.assigned / agent.task.completed  (draft, board-review, ratify, record-adr, queue-work)
#14 workflow.completed  workflow:rfc-lifecycle
Run run-1: completed   → exit 0
```

Ungated path: `approval.requested` only, `Run run-1: pending-approval`,
zero steps, exit 3.
