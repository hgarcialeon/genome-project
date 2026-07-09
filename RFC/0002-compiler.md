# RFC-0002: Genome Compiler

## Status

Draft

## Summary

The Genome Compiler transforms Genome documents into stable intermediate representations that can power runtimes, views, workflows, analysis, and tooling.

The compiler is the boundary between declarative organization documents and executable systems.

## Motivation

Subsystems should not interpret raw Genome YAML independently.

Without a compiler boundary:

- validation logic is duplicated
- views may introduce domain logic
- runtime behavior becomes inconsistent
- provider-specific assumptions may leak into the language
- future tooling becomes harder to build

The compiler makes Genome executable while preserving the specification as the source of truth.

## Goals

- parse Genome YAML or JSON
- validate schema
- perform semantic validation
- produce an AST
- produce an Organization Graph
- expose compilation targets
- centralize interpretation rules

## Non-goals

The compiler does not:

- execute workflows
- run agents
- render the office
- store runtime events
- call external integrations
- make product decisions

## Compiler Pipeline

```text
Genome Document
→ Parse
→ Schema Validation
→ AST
→ Semantic Validation
→ Organization Graph
→ Compilation Targets
```

## Stage 1 — Parse

Input:

- YAML
- JSON

Output:

- raw parsed document

Responsibilities:

- parse syntax
- report syntax errors
- preserve source locations where possible

## Stage 2 — Schema Validation

Input:

- raw parsed document

Output:

- schema-valid document

Responsibilities:

- required fields
- allowed value types
- structural validation
- version compatibility

## Stage 3 — AST

Input:

- schema-valid document

Output:

- Genome AST

Responsibilities:

- normalize identifiers
- preserve hierarchy
- preserve source mappings
- represent declared organizational intent

The AST should remain close to the source document.

## Stage 4 — Semantic Validation

Input:

- AST

Output:

- semantically valid AST

Responsibilities:

- reference validation
- ownership validation
- workflow owner validation
- autonomy value validation
- duplicate detection
- unresolved dependency detection

## Stage 5 — Organization Graph

Input:

- semantically valid AST

Output:

- immutable Organization Graph

Responsibilities:

- model nodes and relationships
- support dependency analysis
- support impact analysis
- support compilation targets

## Organization Graph

The Organization Graph is the canonical compiled representation.

Example nodes:

- Company
- Department
- Team
- Agent
- Workflow
- Policy
- Integration
- Objective
- Metric
- Memory Store

Example relationships:

- belongs_to
- owns
- uses
- requires
- triggers
- approves
- measures
- depends_on

## Compilation Targets

Initial targets:

- CLI inspection
- graph output
- runtime model
- office layout input
- workflow model
- memory graph seed
- documentation output

## Immutability

The Organization Graph is immutable.

Runtime execution produces events.

Durable organizational change happens by producing a new Genome version and recompiling.

## Open Questions

1. Should AST and Organization Graph live in the same package?
2. Should the graph use adjacency lists or a graph library?
3. How much source location metadata should be preserved?
4. Should compilation targets be plugins from day one?
5. What is the minimal semantic validation set for v0.1?
