# Architecture Board Decision — RFC-0005: Genome Diff (Phase 2 completion)

- **Process:** `docs/GOVERNANCE.md` → Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer)
- **Date:** 2026-07-13
- **RFC:** RFC-0005 — Genome Diff (Phase 2 completion)
- **Quorum:** 3/3

## Votes

| Role | Verdict |
|------|---------|
| Product Owner | Accept |
| Chief Architect | Accept with conditions |
| Lead Engineer | Accept |

**Outcome: Accepted with conditions — unanimous on substance.** The board
treated this as the smallest RFC to date: it completes a committed Phase 2
roadmap deliverable rather than opening new architecture, and its one
genuinely architectural move — extending the fixed v0.1 target set — is
additive and stays inside the compiler boundary ADR-0003 fixed. The
conditions have been applied; RFC-0005 is marked **Accepted** and its
decisions recorded in `docs/adr/0006-genome-diff-contract.md`.

## Resolution of the open questions

1. **The diff is computed over the Organization Graph.** A raw-document
   diff would resurrect exactly the formatting noise revision derivation
   was designed to erase, and an AST diff would speak a vocabulary nothing
   else exposes. The graph is the canonical compiled representation
   (RFC-0002): diff output uses the same node ids `genome graph` emits and
   runtime events attribute to. Unanimous.
2. **Exit codes follow the `diff(1)` convention (0 / 1 / 2).** The Product
   Owner endorsed the CI-guard use case ("fail the pipeline when the
   organization changes") as the command's primary scripted consumer;
   conflating "different" with "broken" would make that guard impossible.
   The deviation from the existing commands' plain 0/1 is deliberate and
   documented in the CLI help text. Unanimous.
3. **No rename detection in v0.1.** Node identity is the stable node id;
   a rename reports as removal plus addition. The Lead Engineer noted any
   heuristic matcher would guess, and a diff that guesses is worse than a
   diff that is literal. Deferred until demonstrated need. Unanimous.
4. **The `DiffReport` is not the Phase 6 proposal payload.** The Chief
   Architect ruled the reservation in RFC-0003 stands untouched: a
   proposal is an *applicable, schema-validated patch* addressed via the
   reference grammar; the `DiffReport` is a *description* of a change that
   already exists as two documents. Conflating them would let a view
   artifact become an authority artifact. The Phase 6 RFC may cite the
   diff semantics but owns its own format. Unanimous.

## Conditions (applied)

1. **`identical` is revision equality, not empty-change equality** (Chief
   Architect): the graph is a projection of the document, so equal graphs
   do not prove equal content. A report with differing revisions and empty
   change lists must be representable — it signals a compiler-surface gap
   rather than claiming equality. Recorded as normative in the RFC and the
   report shape's doc comment.
2. **One canonicalization** (Lead Engineer): the diff's attribute
   comparison must call the same canonical-JSON helper the revision hash
   uses — exported from one module, not duplicated — so "no diff" and
   "same revision" can never drift apart through a second implementation.
3. **The report is self-describing** (Product Owner): both revisions
   appear in the report itself, so a `DiffReport` pasted into a review
   thread or stored beside a deployment identifies exactly which two
   documents it compared without out-of-band context.

## Per-role review notes

### Product Owner

Confirmed this closes the last undelivered Phase 2 CLI command and that
`PROJECT_STATE.md`'s next-RFC routing (Phases 4–6) is corrected rather
than contradicted: completing an earlier phase's commitment precedes
opening a new phase. Scrutinized the human-readable output for review
usability — the revision transition leads, changes are grouped per node —
and endorsed `--json` as the stable machine surface.

### Chief Architect (rulings)

- Q1 → graph-level comparison; one canonical vocabulary for change.
- Q4 → the proposal-payload reservation stands; description is not
  authority.
- Endorsed the target-arity clarification: a target is a plain,
  provider-free function in the compiler package over compiled artifacts;
  arity was never the boundary. Extending the fixed set requires exactly
  what happened — an RFC.
- Flagged that the diff must not become a merge tool by accretion: patch
  application, three-way merge, and rename heuristics each need their own
  RFC if ever proposed.

### Lead Engineer (feasibility)

- Verified every report field derives from the two graphs alone: node
  sets from `nodes`, comparisons from canonical JSON over `attributes`
  plus the `label` pseudo-attribute, edge sets from `(from, type, to)`
  triples. No new compiler stage is needed.
- Verified determinism is cheap: sort node entries by id, changes by
  attribute, edges by triple — and testable byte-for-byte.
- Confirmed the formatting-invariance test (reordered YAML keys →
  `identical: true`, empty lists) falls out of compiling both inputs
  through the standard pipeline.
- Confirmed exit code 2 covers read failures and compile failures of
  either input uniformly, matching `diff(1)`'s "trouble" semantics.
