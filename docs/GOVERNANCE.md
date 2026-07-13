# Genome Governance

Genome evolves through documented decisions.

The purpose of governance is to make the project reproducible, reviewable, and durable beyond any individual contributor or conversation.

## Decision Lifecycle

```text
Idea
→ Discussion
→ RFC Draft
→ Architecture Review
→ Approved
→ Implementation Queue
→ Pull Request
→ Architecture Review
→ Merge
→ ADR if architectural
→ Release
```

## Roles

### Product Owner

Owns business priorities, customer value, and sequencing.

### Chief Architect

Owns architecture, specifications, system boundaries, and long-term coherence.

### Lead Engineer

Owns implementation quality, maintainability, and delivery feasibility.

### Engineering Agent

Implements approved work from the Implementation Queue.

## Governance Rules

1. Specification before implementation.
2. No major architectural change without an RFC.
3. Accepted architectural decisions are recorded as ADRs.
4. Implementation follows the queue, never chat history.
5. Views do not own domain logic.
6. Runtime state must be reconcilable with the Genome.
7. Provider-specific assumptions must not leak into the language core.
8. Current project state lives only in `PROJECT_STATE.md`; every other
   document may point to it but must not restate it.

## RFC Completion Criteria

Every RFC's Definition of Done includes, in addition to its own items, the
standing requirement:

> Project state and governance documents reconciled.

Concretely: `PROJECT_STATE.md`, `ROADMAP.md` deliverable statuses, and
`IMPLEMENTATION_QUEUE.md` reflect the work at the moment it lands, and
`pnpm check-state` passes. An RFC whose implementation is merged without
this reconciliation is not complete.

## Phase Transition Review

Phases are defined in `ROADMAP.md`. A phase may be closed only by a phase
transition review, held by the Architecture Board.

A phase closes only when every one of its roadmap deliverables is
classified as exactly one of:

- **Done** — with executable or explicitly documented evidence;
- **Deferred** — with a corresponding `IMPLEMENTATION_QUEUE.md` entry;
- **De-scoped** — with a stated reason recorded in `ROADMAP.md` (and an RFC
  or ADR reference when the de-scoping follows from an architectural
  decision).

The review must also reconcile, in the same change:

- `PROJECT_STATE.md` (current phase, milestone, objective, blockers);
- `ROADMAP.md` (deliverable statuses);
- `IMPLEMENTATION_QUEUE.md` (deferred items queued, drained items marked);
- the Definition of Done evidence for the phase's RFCs.

The mechanical half of this review is `pnpm check-state`, which runs in CI;
the judgment half (does the evidence actually support "Done"?) belongs to
the Board and cannot be automated away.

## Architecture Board

The Architecture Board is a process, not a fixed group of people.

For now, it includes:

- Product Owner
- Chief Architect
- Lead Engineer

Future versions may include specialized architects for:

- Compiler
- Runtime
- Office View
- Studio
- Marketplace
- SDK

## Approval

A proposal is approved only when:

- it aligns with the Constitution
- it has a clear owner layer
- it does not duplicate existing concepts
- it has an RFC or ADR if architectural
- it can be understood without chat history
