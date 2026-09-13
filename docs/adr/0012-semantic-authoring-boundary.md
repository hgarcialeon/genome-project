# ADR-0012: Semantic Authoring Boundary

## Status

Accepted — 2026-09-13.

Recorded on acceptance of `RFC/0010-semantic-authoring-operations.md` (Option B,
accept with amendments A1–A12; Architecture Board review
`docs/reviews/rfc-0010-board-review.md`, Product Owner ratification recorded
there).

## Context

Genome had strong accepted surfaces in exactly one direction:

```
Genome source → schema validation → compiler → projections / runtime model → governed execution
```

Every layer had an owner, a contract and evidence. The inverse direction —
turning a person's organizational intent into a valid Genome document change —
had **no owner at all**.

That gap surfaced as a product failure, not a design review. Phase 4 Milestone 1
product acceptance was rejected on 2026-09-13
(`docs/reviews/phase-4-m1-product-acceptance.md` §12) because a user could not
discover or perform the canonical organizational change — "add an agent" —
without understanding and hand-editing the Genome source structure.

The Architecture Board established that this was architectural rather than a
defect: Studio was *correct* to own no language semantics, and therefore could
not author. Three candidate homes for the missing capability were evaluated and
rejected — Studio (violates Principle 5), `@genome/schema` (creates a dependency
cycle, since authoring must call the compiler while the compiler depends on
`@genome/schema`), and a compiler target (runs the opposite direction and needs a
parse path the compiler otherwise has no use for, since the compiler's canonical
path discards comments and formatting at parse).

A separate finding sharpened the case: `SPEC/schema/genome.schema.json` types
`departments` as `object → object` with no `$defs` and constrains agent shape not
at all. Agent structure lives solely in the compiler's AST and semantics, so no
schema-derived alternative was ever available.

## Decision

1. **The compiler owns `source → meaning`.** Parsing, validation, semantic
   analysis, diagnostics, projections and revision derivation remain exclusively
   the compiler's. This ADR does not widen that boundary; ADR-0002 and ADR-0003
   stand, and ADR-0011 is not reopened.

2. **Authoring owns `intent → source`.** A distinct toolchain package
   (`@genome/authoring`) owns how a declared organizational intent becomes a
   valid Genome document change: placement, the transformation itself, and source
   preservation. It is a peer of the compiler, not a part of it.

3. **Views collect intent and present results.** A view may capture user intent,
   invoke an accepted authoring operation, place the returned source into its
   ordinary source lifecycle, and display the resulting source and diagnostics. A
   view may do none of the rest.

4. **Genome source remains the canonical artifact.** Authoring consumes source
   and produces source. No structured representation — AST, graph, document
   object, or view state — competes with the document as the durable artifact,
   and no authoring surface may conceal it.

5. **Semantic mutation does not belong in views.** Knowledge of where a construct
   belongs in a Genome document is language structure, not presentation. A view
   that encodes it becomes a second implementation of the language with no test
   that fails when it drifts (Constitution Principle 5, Governance Rule 5).

6. **Authoring does not own compiler interpretation.** Authoring proposes; the
   compiler judges. An authoring operation validates a candidate by compiling it
   and must fail rather than return a document the compiler rejects. It
   reimplements no cross-reference rule, re-words no compiler diagnostic, and
   never derives, predicts, stores or supplies `genomeRevision` — the compiler
   derives the revision from the resulting source, as for any hand-edited
   document.

7. **Authoring operations are consumer-gated and are not a generic mutation
   language by default.** The operation vocabulary grows by decision, never by
   convenience: each operation requires a demonstrated consumer. A generic
   dispatcher is deliberately not adopted, because it would constitute an
   operation language built on a single operation, and would recast every future
   operation as a parameter addition rather than a governed choice.

## Consequences

- Genome gains a coherent answer to "how is an organization changed?" — one that
  is owned, testable, and available to consumers beyond any single view.
- The capability is available to non-view consumers by construction. The Phase 6
  self-improvement work, where an agent proposes an organizational change,
  consumes the same operation rather than a second implementation.
- The cost is real and was accepted deliberately: a new maintained package, a new
  public toolchain surface, a document-transformation contract, and a semantic
  operation. Nothing already accepted moves — language, syntax, schema, compiler
  semantics, runtime, events, revision identity, governance and persistence are
  all unchanged.
- Source preservation becomes a correctness property rather than a nicety,
  because the canonical self-hosting example carries a governance-relevant
  non-normative marking (RFC-0008 §1) that a careless rewrite would destroy.
- Views stay thin. The prohibition that made Milestone 1's projections
  trustworthy is preserved rather than traded away to obtain authoring.

## Notes

Implementation-specific detail lives in RFC-0010, deliberately **not** here: the
`add-agent` intent vocabulary, the four failure classes, the three-tier source
preservation model and its disclosed normalizations, the determinism contract,
Studio integration, and the executable evidence (E1–E19).

This ADR records the durable boundary. RFC-0010 will one day be closed; the
boundary outlives it.
