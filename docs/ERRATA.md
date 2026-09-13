# Errata Registry

This registry records **errata**: editorial or normative-wording corrections
to **accepted** documents that carry **zero behavioral change**. The
instrument is established by `docs/adr/0010-erratum-mechanism.md`.

## Litmus (pinned)

> If behavior or tests must change, it is not an erratum.

An erratum moves **no test, contract, event, or exit code**. Anything that
fails this litmus is ADR or RFC territory and uses those channels.

## Scope note (clarification of ADR-0010; not a new rule)

The instrument's subject is **accepted documents** — documents that carry a
ratified form from which text could silently diverge (ADR-0010, Decision 2 and
4). `PROJECT_STATE.md` is **not** one of them: Governance Rule 8 makes it the
living register of current state, and the RFC Completion Criteria in
`docs/GOVERNANCE.md` require it to change whenever work lands. It has no
ratified form to diverge from, and the erratum pointer ADR-0010 Decision 4
requires at each corrected site would itself go stale at the next landing.

Reconciling `PROJECT_STATE.md` to acts already ratified elsewhere is therefore
ordinary Rule 8 reconciliation, applied by direct commit, and takes **no
`ERR-NNNN` id**. The zero-behavioral-change litmus is necessary for an erratum
but does not by itself make a correction one. Determined 2026-09-13 when the
Product Owner commissioned a documentation-only reconciliation of stale
present-tense claims in `PROJECT_STATE.md` following the Phase 4 Milestone 1
closure; no erratum was issued.

## Entry format

Each entry carries: an id (`ERR-NNNN`); the affected document and section;
the wording *before* and *after*; the reason; an explicit no-behavioral-change
confirmation; the approving roles; and the date. An erratum is applied by
direct commit citing its id, and the corrected site carries a one-line
pointer back to the entry.

---

## ERR-0001 — RFC-0000 status header

- **Affected document:** `RFC/0000-genome.md`
- **Affected section:** `## Status`
- **Before:** `Draft`
- **After:** `Accepted` — anchored to the Phase 0 close
  (`docs/reviews/phase-0-3-board-review.md`, ratified by the Product Owner,
  2026-07-13), in which RFC-0000 is a Phase 0 deliverable classified Done
  (`ROADMAP.md`, Phase 0).
- **Reason:** the header was stale. RFC-0000's content is shipped as v0.1 and
  `ROADMAP.md` classifies it Done, but the header still read `Draft`,
  contradicting the record. Corrected to reflect its true, already-ratified
  status; no new "Foundational" status was introduced, and the RFC's
  normative content is unchanged.
- **No behavioral change:** confirmed. No test, contract, event, or exit code
  moves; the change is a status-header wording correction only.
- **Approving roles:** Product Owner (ratification,
  `docs/reviews/maintenance-self-hosting-disposition-packet.md`, Decision 3);
  Architecture Board (sign-off).
- **Date:** 2026-07-15

## ERR-0002 — RFC-0001 status header

- **Affected document:** `RFC/0001-language.md`
- **Affected section:** `## Status`
- **Before:** `Draft`
- **After:** `Accepted` — anchored to the Phase 0 close
  (`docs/reviews/phase-0-3-board-review.md`, ratified by the Product Owner,
  2026-07-13), in which RFC-0001 is a Phase 0 deliverable classified Done
  (`ROADMAP.md`, Phase 0).
- **Reason:** the header was stale. RFC-0001 defines Genome Language v0.1,
  which ships today (`SPEC/language.md`, `SPEC/schema/genome.schema.json`) and
  is classified Done in `ROADMAP.md`, but the header still read `Draft`,
  contradicting the record. Corrected to reflect its true, already-ratified
  status; no new "Foundational" status was introduced, and the RFC's
  normative content is unchanged.
- **No behavioral change:** confirmed. No test, contract, event, or exit code
  moves; the change is a status-header wording correction only.
- **Approving roles:** Product Owner (ratification,
  `docs/reviews/maintenance-self-hosting-disposition-packet.md`, Decision 3);
  Architecture Board (sign-off).
- **Date:** 2026-07-15

## ERR-0003 — ROADMAP Phase 4 editor deliverable named a framework

- **Affected document:** `ROADMAP.md`
- **Affected section:** `## Phase 4 — Studio Prototype`, deliverable table
- **Before:** the deliverable read `Monaco editor for Genome YAML`, with the
  note "Requires the Phase 4 RFC".
- **After:** the deliverable reads `Genome document editor`, with the note
  "Product-level deliverable per RFC/0009-phase-4-governed-authoring.md §8.1;
  no editor framework is prescribed (ERR-0003)".
- **Reason:** the row named a specific editor framework as the deliverable,
  contradicting the accepted Phase 4 opening RFC. `RFC/0009-phase-4-governed-authoring.md`
  §8 states the deliverables are product-level and that "**No framework choice
  is prescribed.** This RFC does not mandate Monaco, React, any rendering
  framework, any process model, or any transport." The roadmap wording predates
  that acceptance (2026-07-18) and would have read as a standing framework
  requirement for Milestone 1. Corrected to the RFC's product-level wording — a
  Genome document editor — leaving the framework an implementation choice. The
  note's stale precondition ("Requires the Phase 4 RFC") is replaced by the
  citation to the RFC that now exists and is accepted.
- **No behavioral change:** confirmed. No test, contract, event, or exit code
  moves; the deliverable's status is unchanged (**Not Started**), no deliverable
  is added, removed, de-scoped, or reclassified, and no RFC, ADR, or SPEC
  normative content changes. The correction is roadmap wording only.
- **Approving roles:** Product Owner (disposition, 2026-09-12 — "Correct the
  current 'Monaco editor for Genome YAML' wording through ERR-0003 … a
  zero-behavior-change documentation correction"); Architecture Board
  (sign-off).
- **Date:** 2026-09-12

## ERR-0004 — PRODUCT_STRATEGY capability-status rows stated superseded facts

- **Affected document:** `docs/PRODUCT_STRATEGY.md`
- **Affected section:** §"Planned / Candidate / Aspirational" capability-status
  table (the two rows named below)
- **Before (Studio prototype row):** the capability read "Studio prototype
  (Monaco editing, schema validation, live preview, organization tree, runtime
  logs)" and its standing read "Phase 4 on ROADMAP.md; opening RFC not
  commissioned".
- **After (Studio prototype row):** the capability reads "Studio prototype
  (document editing, …)" and its standing reads "Phase 4 on ROADMAP.md; opening
  RFC accepted — RFC/0009-phase-4-governed-authoring.md (ERR-0004); current
  phase state in PROJECT_STATE.md".
- **Before (Office View row):** the standing read "Phase 5; prototype queued Low
  in IMPLEMENTATION_QUEUE.md".
- **After (Office View row):** the standing reads "ROADMAP.md section 'Office
  View — Future Capability'; placement governed separately (ERR-0004); prototype
  queued Low in IMPLEMENTATION_QUEUE.md".
- **Reason:** three statements had been superseded by ratified acts and now
  contradicted the record. (1) "Monaco editing" named a specific editor
  framework as the planned Studio capability, which
  `RFC/0009-phase-4-governed-authoring.md` §8 forbids prescribing — the same
  defect corrected in `ROADMAP.md` by ERR-0003. (2) "opening RFC not
  commissioned" was false: the Phase 4 opening RFC was commissioned, drafted,
  Board-reviewed, and accepted 2026-07-18
  (`docs/reviews/rfc-0009-board-review.md`). (3) "Phase 5" placed Office View at
  a phase number it no longer holds after the ratified Option B — Autonomy First
  sequencing was applied to `ROADMAP.md` on 2026-09-12; the row now points at
  the roadmap section that holds it, preserving the ratified requirement that
  its final form and placement are governed separately
  (`docs/proposals/roadmap-revision.md` §4 disposition). Per Governance Rule 8
  the corrected row points to `PROJECT_STATE.md` for current phase state instead
  of restating it.
- **Deliberately not corrected:** §6.2 "Capability Roadmap (proposed
  sequencing)" row C7 still reads "Phase 5, A4". That table records a *proposal
  as prepared*, not a status claim, and this repository preserves proposal
  bodies verbatim across dispositions (`docs/proposals/roadmap-revision.md`).
  Rewriting it would edit a record rather than correct a stale fact. Two further
  rows in the status table — Gap 1 gating ("commissioning with the Product
  Owner", now shipped through RFC-0007) and "Descriptive self-hosting, Level 1"
  ("disposition pending", now accepted and closed as RFC-0008) — are likewise
  stale but would move capability tiers, which exceeds a zero-behavioral-change
  correction; they are referred to the Product Owner for a separate disposition.
- **No behavioral change:** confirmed. No test, contract, event, or exit code
  moves; no capability tier changes; no strategy is introduced; no work is
  commissioned; Office View is not redesigned; no RFC, ADR, SPEC, source, or
  test file changes. The correction is capability-status wording only.
- **Approving roles:** Product Owner (disposition, 2026-09-13 — ERR-0004 to
  reconcile the three superseded statements as zero-behavior-change
  documentation corrections); Architecture Board (sign-off).
- **Date:** 2026-09-13
