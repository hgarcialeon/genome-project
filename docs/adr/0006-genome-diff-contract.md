# ADR-0006: Genome Diff Contract

## Status

Accepted

## Context

The Phase 2 roadmap commits a `genome diff` CLI command that never
shipped: a principled diff needs a document identity to anchor to, and
that identity (the Genome revision — canonical-form content hash) was
only pinned by RFC-0004/ADR-0005. `SPEC/language.md` also declares the
v0.1 compilation-target set fixed, so adding a `diff` target required an
RFC (Governance Rule 2). RFC-0005 was drafted and accepted by the
Architecture Board on 2026-07-13
(`docs/reviews/RFC-0005-board-decision.md`). This ADR records the
resulting diff contract; it authorizes the implementation items (the
`diff` target in `packages/genome-compiler` and the CLI command).

## Decision

1. **The diff is graph-level.** `diffTarget(before, after): DiffReport`
   compares two compiled Organization Graphs — never raw YAML text or the
   unvalidated document — so diff output speaks the same node-id and
   relationship vocabulary as `genome graph` and runtime attribution, and
   formatting-only changes are invisible, exactly as they are to the
   revision.
2. **Node identity is the graph node id.** Same id in both graphs → the
   same node, compared attribute-by-attribute; otherwise added/removed.
   No rename detection in v0.1: a rename reports as removal plus
   addition. Edges compare as `(from, type, to)` triples.
3. **One canonicalization.** Attribute comparison uses the same
   canonical-JSON form (keys sorted at every level, array order
   preserved) as revision derivation, exported from one module. The node
   label participates as the pseudo-attribute `label` (a company rename
   must be visible).
4. **`identical` means revision equality**, not empty change lists. The
   graph is a projection of the document; a report with differing
   revisions and no surfaced changes is well-formed and signals a
   compiler-surface gap, never equality. `identical: true` guarantees
   empty change lists (the graph is a pure function of the document).
5. **The report is normative, self-describing, and deterministic.** It
   carries both revisions; node entries sort by id, attribute changes by
   attribute, edges by triple. Extension is additive-only within v0.1.
6. **CLI contract.** `genome diff <before> <after> [--json]` exits with
   the `diff(1)` convention: `0` identical, `1` different, `2` trouble
   (either input failed to read or compile). `--json` emits the
   `DiffReport` verbatim.
7. **Targets are plain, provider-free compiler-owned functions over
   compiled artifacts; arity is not the boundary.** `diffTarget` is the
   first binary target and an additive extension of the fixed v0.1 set.
8. **The `DiffReport` is not the Phase 6 proposal payload.** Proposals
   remain reserved (RFC-0003): they are applicable, schema-validated
   patches; the diff is a description, and description is not authority.
   Patch application, three-way merge, and rename heuristics each require
   their own RFC if ever proposed.

## Consequences

- The last undelivered Phase 2 CLI command is authorized with concrete,
  testable acceptance criteria; Phase 2's command set is complete.
- "No diff" and "same revision" cannot drift apart: both derive from one
  canonical form in one module.
- `genome diff` is scriptable as a CI guard (fail when the organization
  changes) because "different" and "broken" have distinct exit codes.
- `SPEC/language.md` gains the `diff` entry in Compilation Targets and a
  Versioning note that the diff explains a revision transition.
- The Phase 6 proposal-payload design space is untouched.
