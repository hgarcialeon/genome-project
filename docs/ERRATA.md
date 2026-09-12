# Errata Registry

This registry records **errata**: editorial or normative-wording corrections
to **accepted** documents that carry **zero behavioral change**. The
instrument is established by `docs/adr/0010-erratum-mechanism.md`.

## Litmus (pinned)

> If behavior or tests must change, it is not an erratum.

An erratum moves **no test, contract, event, or exit code**. Anything that
fails this litmus is ADR or RFC territory and uses those channels.

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
