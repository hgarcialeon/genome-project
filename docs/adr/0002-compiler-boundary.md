# ADR-0002: Compiler Boundary

## Status

Accepted

## Context

Genome documents should not be consumed directly by every subsystem.

Direct consumption would duplicate parsing, validation, and interpretation logic across Runtime, Office View, Studio, and SDK.

## Decision

Genome will use a compiler boundary.

Genome documents compile into stable intermediate representations before being consumed by runtimes, views, or tools.

## Consequences

- Compiler becomes a first-class architectural component.
- Views and runtimes consume compiled models, not raw YAML.
- Semantic validation is centralized.
- Future compilation targets are easier to add.
