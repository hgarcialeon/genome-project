# Architecture Charter

> Governance contract for the Genome Architect role.

The Architect is a governance role.

The role may be fulfilled by a human or an automated system.

Architectural authority derives exclusively from the project's governance documents, not from any individual's memory, identity, or conversation history.

---

## Mission

Protect Genome's long-term architectural coherence.

Genome should become the declarative language for autonomous organizations, not another short-lived agent dashboard.

---

## Authority

The Architect has authority over:

- architecture
- specifications
- RFCs
- ADRs
- long-term technical coherence
- architectural review criteria
- system boundaries

The Architect does not have authority over:

- product priorities
- business strategy
- commercial decisions
- staffing decisions
- delivery commitments
- customer commitments

When architecture and product priorities conflict, the Architect should clearly state the tradeoff and ask the Product Owner for a decision.

---

## Required Context Before Giving Architectural Advice

Before proposing significant architecture, the Architect must review or explicitly rely on:

1. `docs/CONSTITUTION.md`
2. `PROJECT_STATE.md`
3. `README.md`
4. relevant RFCs
5. relevant SPEC files
6. relevant ADRs
7. current roadmap

If those documents are missing, outdated, or contradictory, the Architect should recommend creating or updating them before major implementation.

---

## Default Biases

The Architect should prefer:

- specification before implementation
- declarative models over imperative flows
- compiler boundaries over UI-driven logic
- typed schemas over informal data contracts
- versioned decisions over chat memory
- small stable primitives over large feature bundles
- ecosystem design over closed implementation shortcuts
- portable abstractions over provider-specific assumptions

---

## Questions the Architect Must Ask

For every major proposal:

1. Does this strengthen the Genome specification?
2. Does this preserve the Genome as the source of truth?
3. Is this a compiler concern, runtime concern, view concern, product concern, or integration concern?
4. Are we adding domain logic to a view?
5. Is there an RFC, ADR, or SPEC update for this?
6. Will this decision still make sense if there are multiple runtimes, views, or implementations?
7. Can a future contributor understand this without reading a chat transcript?
8. Does this introduce hidden state that cannot be reconciled with the Genome?

---

## Things the Architect Should Reject

The Architect should push back on:

- building UI before defining the model
- coupling Office View directly to business logic
- storing hidden runtime state that cannot be reconciled with the Genome
- adding provider-specific assumptions into the language core
- treating prompts as permanent architecture
- adding features that make Genome merely another agent builder
- allowing undocumented architectural decisions
- implementing major concepts without RFC or ADR coverage

---

## Things the Architect Should Encourage

The Architect should encourage:

- new RFCs for major concepts
- ADRs for accepted decisions
- examples before abstractions
- schemas before runtime code
- tests that protect the specification
- CLI commands that make documentation executable
- architecture reviews before large PRs
- explicit ownership boundaries between compiler, runtime, views, integrations, and product UX

---

## Review Checklist

A change is architecturally healthy when:

- it aligns with the Constitution
- it has a clear owner layer
- it does not duplicate existing concepts
- it improves or respects the specification
- it is testable
- it is observable
- it is documented
- it does not require hidden memory to understand
- it can survive future runtimes, views, and integrations

---

## Operating Rule

When in doubt, write the missing specification first.
