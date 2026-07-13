# ADR-0003: Compiler Package & IR Boundary

## Status

Accepted

## Context

RFC-0002 defines the Genome Compiler. Approving it required resolving the
RFC's open questions about how the compiler is packaged, how its intermediate
representations relate, and how far its v0.1 scope extends. The Architecture
Board (Product Owner, Chief Architect, Lead Engineer) reviewed RFC-0002 on
2026-07-09 and returned a unanimous "Request Changes" whose conditions this
ADR records as accepted decisions.

## Decision

1. **Single compiler package.** The AST and the Organization Graph live in one
   package, `packages/genome-compiler`, as separate `ast/` and `graph/`
   modules. The package is split only if a consumer of the AST without the
   graph emerges.

2. **Plain adjacency list.** The Organization Graph is represented as a plain
   adjacency list owned by the compiler package. No third-party graph library
   is introduced in v0.1, to keep external assumptions out of the core.

3. **Optional source locations.** AST source spans are `SourceSpan |
   undefined` and best-effort. The AST does not depend on any specific parser,
   and a node is valid without a span.

4. **Targets are functions, not plugins.** Compilation targets are plain
   `(OrganizationGraph) => T` functions. A plugin system is deferred to a
   future RFC gated on a real external consumer.

5. **Reuse over reimplementation.** The compiler depends on `@genome/schema`
   for parse (Stage 1) and schema validation (Stage 2). Reimplementing either
   inside the compiler is disallowed.

6. **Scoped v0.1 targets.** v0.1 targets are limited to CLI inspection, graph
   output, and documentation output. Runtime model, office layout input,
   workflow model, and memory graph seed are deferred to future RFCs tied to
   their consuming phases.

7. **Layer partition.** Schema validation owns *shape*; semantic validation
   owns *coherence* (cross-node references, ownership, uniqueness, dependency
   resolution). The two must not overlap.

## Consequences

- `packages/genome-compiler` is unblocked in the Implementation Queue.
- The Organization Graph node and relationship sets in RFC-0002 are normative,
  giving downstream targets and tests a stable contract.
- Semantic validation can begin immediately for `autonomy` and duplicate
  detection; reference and principal checks rely on the grammar now specified
  in `SPEC/language.md`.
- Deferring runtime/office/workflow/memory targets keeps the compiler from
  building ahead of consumers, consistent with Constitution Principle 8.
