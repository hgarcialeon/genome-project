# Genome Constitution

> The highest-level principles governing Genome.

## Principle 1 — The Specification Is the Product

Genome exists first as a specification.

Implementations must serve the specification, not the other way around.

## Principle 2 — The Genome Is the Source of Truth

The Genome document describes the desired state of the organization.

Subsystems may derive state from it, but they must not silently replace it.

## Principle 3 — Everything Is Declarative

Users should describe the desired organization, not manually orchestrate every step.

## Principle 4 — Every Organization Is Compilable

A valid Genome must compile into internal representations that can power runtimes, views, workflows, and analysis.

## Principle 5 — Views Do Not Own Business Logic

Office View, Graph View, Timeline View, and Studio are projections of the Genome.

They must not become the source of organizational truth.

## Principle 6 — Runtime Produces Events

The Runtime executes and observes.

It may produce events, logs, metrics, and recommendations, but durable organizational change must be reconciled through Genome updates.

## Principle 7 — Decisions Are Versioned

Important architectural decisions live in RFCs and ADRs, not chat history.

## Principle 8 — Prefer Stable Primitives

Genome should grow from small stable primitives rather than large feature bundles.

## Principle 9 — Human Governance Remains First-Class

Autonomy does not eliminate accountability.

Human approval, review, and override must remain explicit parts of the system.

## Principle 10 — Write the Missing Specification First

When in doubt, write the missing specification before implementation.
