# RFC-0005: Genome Diff (Phase 2 completion)

## Status

Accepted

Accepted by the Architecture Board (Product Owner, Chief Architect, Lead
Engineer) on 2026-07-13. The board's vote was **Accept with conditions**;
the conditions have been incorporated into this document. See
`docs/reviews/RFC-0005-board-decision.md` for the decision record and
`docs/adr/0006-genome-diff-contract.md` for the recorded architectural
decision.

This RFC completes the **Phase 2 roadmap** (CLI & Schema): `genome diff`
is the last of the four committed CLI commands. It opens no new phase and
operates entirely inside the compiler boundary ADR-0003 fixed.

## Summary

RFC-0004 gave every Genome document a derived **revision** — an opaque
content hash that says *that* two documents differ, but not *what* changed.
This RFC specifies the missing Phase 2 CLI deliverable, `genome diff`, and
the compiler `diff` target behind it: a **structural comparison of two
compiled Organization Graphs** that explains a revision change as added,
removed, and changed nodes and relationships.

- the `diff` target: `diffTarget(before, after): DiffReport`, owned by
  `packages/genome-compiler` beside `inspect`/`graph`/`docs`/`runtime-model`
- the normative `DiffReport` shape and its comparison semantics (node
  identity, canonical attribute comparison, deterministic ordering)
- the `genome diff <before> <after>` CLI contract, including exit codes

## Motivation

The Phase 2 roadmap (ROADMAP, "CLI & Schema") commits four commands:
`validate`, `inspect`, `graph`, and `diff`. The first three shipped with
RFC-0002; `diff` did not, because a principled diff needs an identity to
anchor to — *when* do two documents count as the same? — and that identity
(the Genome revision, canonical-form content hashing) was only pinned by
RFC-0004. With revision derivation landed, the deferral reason is gone.

Two governance facts make this an RFC rather than a queue item:

1. `SPEC/language.md` (Compilation Targets) declares the v0.1 target set
   **fixed**. Adding `diff` extends a normative set, which requires an RFC
   (Governance Rule 2).
2. Diff semantics are an architectural commitment: whatever `genome diff`
   reports becomes the vocabulary humans use to review organizational
   change, and it must stay consistent with the revision semantics
   (formatting-invisible, content-sensitive) and must not preempt the
   Phase 6 proposal-payload design that RFC-0003 reserves.

`PROJECT_STATE.md` currently routes the next RFC to Phases 4–6; that
routing overlooked this committed Phase 2 deliverable. This RFC corrects
the record: completing an earlier phase's roadmap commitment precedes
opening a new phase.

## Goals

- make a revision change explainable: `genome diff` answers "what changed
  in this organization?" at the same granularity the compiler itself uses
- keep one canonical form: the diff compares exactly what the revision
  hashes, so "no diff" and "same revision" can never drift apart silently
- deterministic, scriptable output (stable ordering, JSON mode, exit codes)

## Non-goals

- **Not the Phase 6 proposal payload.** `genome.proposal.created` payloads
  stay reserved (RFC-0003, Reconciliation): they must be structured patches
  addressed via the reference grammar, designed by the Phase 6 RFC. The
  `DiffReport` is a *descriptive, human-facing inspection artifact* — it
  reports what differs; it is not an applicable patch and confers no
  authority to change anything.
- **No rename detection.** Node identity is the stable graph node id; a
  renamed agent is a removal plus an addition in v0.1. Heuristic rename
  matching is deferred until demonstrated need.
- **No three-way merge, no patch application.** Durable change happens by
  producing a new Genome revision and recompiling (RFC-0002, Immutability).
- **No runtime consumption.** No shipped consumer reads the `DiffReport`;
  drain adoption (ADR-0005) needs no diff.

## Diff Semantics (normative)

### Input representation

The diff is computed over the **Organization Graph** — the canonical
compiled representation (RFC-0002) — never over raw YAML text or the
unvalidated document. Both inputs must therefore compile successfully.
Consequences:

- Documents that differ only in YAML formatting or key order share a
  revision (RFC-0004) and produce an empty diff: the two notions of
  "unchanged" coincide by construction.
- The diff speaks the graph's vocabulary (node ids like
  `agent:engineering.platform.backend`, relationship types like `requires`),
  the same vocabulary `genome graph` emits and the runtime attributes to.

### Node identity and comparison

1. **Identity is the graph node id.** A node present in both graphs is
   *the same* node; compared attribute-by-attribute. A node id present only
   in `after` is **added**; only in `before` is **removed**.
2. **Attributes are compared in canonical JSON** — the same
   canonicalization (object keys sorted at every level, array order
   preserved) that revision derivation uses. One canonical form exists in
   the compiler; the diff must not invent a second.
3. **The node label participates as the pseudo-attribute `label`.** Most
   labels are derived from the id, but the Company node's label is the
   company name — without this rule a company rename would be invisible.
4. **Edges are compared as `(from, type, to)` triples** — present in one
   graph and not the other means added/removed. Edges carry no attributes
   in v0.1, so there is no "changed" edge.

### The DiffReport shape (normative)

```ts
type DiffReport = {
  revisions: { before: string; after: string };
  /** Revision equality — NOT merely "no entries below" (see next section). */
  identical: boolean;
  nodes: {
    added: Array<{ id: string; type: NodeType }>;
    removed: Array<{ id: string; type: NodeType }>;
    changed: Array<{
      id: string;
      type: NodeType;
      changes: Array<{ attribute: string; before: unknown; after: unknown }>;
    }>;
  };
  edges: {
    added: GraphEdge[];
    removed: GraphEdge[];
  };
};
```

Ordering is **deterministic**: node entries sorted by id, attribute changes
by attribute name, edges by `(from, type, to)`. Same inputs, same report,
byte for byte.

Like the Organization Graph and `RuntimeModel`, the shape is normative and
extension is additive-only within v0.1.

### Revision is identity; the graph diff is the explanation

`identical` is defined as **revision equality**, not as emptiness of the
change lists. The graph is a *projection* of the document: if a future
language field were carried into the revision but not into any graph
attribute, two documents could differ in revision yet project to equal
graphs. Such a report — different revisions, empty change lists — is
well-formed and meaningful: it says "the content changed in a way the
graph does not surface," which is a signal (likely a compiler gap), never
a claim of equality. Conversely `identical: true` guarantees empty change
lists, since the graph is a pure function of the document.

## Target Arity

RFC-0002/ADR-0003 define targets as plain functions of the Organization
Graph. `diffTarget` is a plain function of **two** graphs — the first
binary target. This is an additive extension of the target *set* and a
clarification of the target *notion*: a target is a plain, provider-free
function in the compiler package whose inputs are compiled artifacts. No
plugin machinery, no new package (ADR-0003's boundary holds: one owner
layer for interpretation of compiled documents).

## CLI Contract

```bash
genome diff <before> <after> [--json]
```

1. Both arguments are Genome documents; each is compiled with the standard
   pipeline. Compile diagnostics for either input are reported exactly as
   `inspect`/`graph` report them.
2. Human output leads with the revision transition, then one line per
   added (`+`), removed (`-`), and changed (`~`) node with attribute
   transitions indented beneath, then edge additions/removals. `--json`
   emits the `DiffReport` verbatim.
3. **Exit codes follow the `diff(1)` convention** (normative):
   - `0` — identical (same revision)
   - `1` — the documents differ
   - `2` — trouble: either input failed to read or compile

   This makes `genome diff` usable as a guard in scripts and CI ("fail the
   pipeline if the organization changed") — the same reason `diff(1)` and
   `git diff --exit-code` distinguish these cases.

## Package Layout

- `packages/genome-compiler/src/targets/diff.ts` — `diffTarget` and the
  `DiffReport` type. The canonicalization helper moves to a shared export
  so revision derivation and diff comparison provably use one form.
- `packages/genome-cli` — the `diff` command, consuming the target as a
  plain function (no interpretation of raw YAML outside the compiler).

## Decisions

These resolve the RFC's original open questions, per the Architecture
Board decision of 2026-07-13.

1. **The diff is computed over the Organization Graph** — the canonical
   compiled representation. A raw-document diff would resurrect the
   formatting noise revision derivation erases; an AST diff would speak a
   vocabulary nothing else exposes. Unanimous.
2. **Exit codes follow the `diff(1)` convention** (0 identical /
   1 different / 2 trouble). The command's primary scripted consumer is a
   CI guard, which needs "different" and "broken" distinguishable. The
   deviation from the existing commands' plain 0/1 is deliberate.
3. **No rename detection in v0.1.** Identity is the node id; a diff that
   guesses is worse than a diff that is literal. Deferred until
   demonstrated need.
4. **The `DiffReport` is not the Phase 6 proposal payload.** A proposal
   is an applicable, schema-validated patch; the diff is a description of
   a change that already exists as two documents. Description is not
   authority; the reservation in RFC-0003 stands untouched.

## Definition of Done

- `DiffReport` shape pinned and implemented as a compiler target
- one canonicalization shared between revision derivation and diff
- deterministic ordering guaranteed and tested
- `genome diff` CLI command with `--json` and the pinned exit codes
- formatting-only change produces `identical: true` and an empty report
  (tested)
- `SPEC/language.md` Compilation Targets updated — ✅
- open questions resolved by the Architecture Board — ✅ (Decisions above)
- ADR recorded on acceptance — ✅
  (`docs/adr/0006-genome-diff-contract.md`)
