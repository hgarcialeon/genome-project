# RFC-0000: Genome

## Status

Accepted

Accepted as a Phase 0 foundational RFC by the Phase 0 close
(`docs/reviews/phase-0-3-board-review.md`, ratified by the Product Owner,
2026-07-13; `ROADMAP.md` Phase 0 records it Done). Status corrected from
`Draft` by erratum `ERR-0001` (`docs/ERRATA.md`, 2026-07-15); normative
content unchanged.

## Summary

Genome is a declarative language and runtime model for autonomous organizations.

It describes a company as a structured, versioned, and executable specification.

## Motivation

AI agents are becoming capable of performing specialized work, but most agent platforms focus on isolated tasks instead of modeling organizations.

Genome introduces a higher-level abstraction:

> An organization as code.

This allows teams to define:

- company structure
- departments
- teams
- agents
- workflows
- policies
- knowledge
- tools
- integrations
- metrics

in a single declarative document.

## Non-goals

Genome v0.1 does not attempt to:

- replace ERPs
- replace CRMs
- replace project management tools
- define legal corporate entities
- fully automate human decision-making

Genome is a coordination and execution layer.

## Core Concepts

### Genome Document

A YAML or JSON document that describes the desired state of an organization.

### Compiler

A system that validates and transforms a Genome document into runtime objects.

### Runtime

The execution layer responsible for workflows, agents, memory, events, and observability.

### Views

Different visualizations derived from the same Genome:

- Office View
- Graph View
- Timeline View
- Workflow View
- Metrics View
- Knowledge View

## Design Principle

The Genome document is the source of truth.

All systems should derive state from it rather than maintaining disconnected configuration.
