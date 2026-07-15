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
