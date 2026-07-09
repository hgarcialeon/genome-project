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
