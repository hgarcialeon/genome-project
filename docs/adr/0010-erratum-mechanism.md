# ADR-0010: Erratum Mechanism (Specification Maintenance)

## Status

Accepted (2026-07-15). Ratified by the Product Owner under the recommended
disposition of `docs/reviews/maintenance-self-hosting-disposition-packet.md`
(Decision 1, Option 1A). Recorded as a **governance-process ADR** following
the ADR-0007 precedent for governance-process decisions that are
decision-worthy but not RFC-worthy (no system-boundary change).

## Context

The RFC-0006 case-4 correction (`docs/reviews/phase-3-close-packet.md` §3)
was the first case where an accepted, ratified document carried a textual
defect that was neither an architectural decision nor new architecture — a
one-sentence wording slip with zero behavioral change. Governance offered
only the full RFC/Board cycle for any change to accepted text, which is
disproportionate for such a correction, and doing nothing leaves accepted
documents wrong. `phase-3-close-packet.md` §4 proposed a lightweight
instrument to close this gap; it was carried forward and disposed in
`docs/reviews/maintenance-self-hosting-disposition-packet.md`.

Two further defects of the same class were already identified and waiting on
this instrument: the stale `Status: Draft` headers of `RFC/0000-genome.md`
and `RFC/0001-language.md`, whose content ships as v0.1 and which
`ROADMAP.md` Phase 0 classifies Done.

## Decision

1. **A single registry.** Errata are recorded in one file, `docs/ERRATA.md`.
   It is a registry, not a subsystem: no script, no `check-state` rule, no
   automated verifier is created (a verifier would be a new reader and a
   larger commitment than the defect class warrants; introducing one later
   would be its own decision).

2. **The erratum litmus (pinned).**

   > If behavior or tests must change, it is not an erratum.

   Errata are editorial or normative-wording corrections to **accepted**
   documents with **zero behavioral change** — no test, contract, event, or
   exit code moves. Anything that fails this litmus is ADR or RFC territory
   and uses those channels. The litmus is load-bearing, not decorative: it
   is what keeps every consequential change out of this lightweight path.

3. **Entry fields.** Each erratum entry carries: an id (`ERR-NNNN`); the
   affected document and section; the wording *before* and *after*; the
   reason; an explicit **no-behavioral-change confirmation**; the approving
   roles; and the date.

4. **Application.** An erratum is applied by direct commit citing its id.
   The corrected site gains a one-line pointer to the erratum id, so accepted
   text never silently diverges from its ratified form.

5. **Weight and authority.** Registry entry + Board sign-off. No lifecycle,
   no queue, no phase gate. The Board sign-off on an entry affirms that the
   corrected text is true; the litmus governs only that nothing executable
   changes.

6. **Lifecycle semantics are otherwise unchanged.** This ADR modifies no RFC
   or ADR lifecycle semantics beyond recognizing errata as a distinct,
   narrower instrument and recording them. The instrument hierarchy is:
   **erratum** (zero-behavioral-change wording) < **ADR** (accepted
   architectural or governance-process decisions) < **RFC** (new or changed
   architecture, contracts, or scope).

## Consequences

- Accepted documents can be corrected proportionately; the disproportion
  between a one-sentence fix and a full RFC cycle is removed for the
  zero-behavioral-change class only.
- The registry is the durable, auditable record of every such correction;
  corrected documents point back to it and never diverge silently from their
  ratified form.
- The pinned litmus prevents scope creep: a correction that would move any
  test or behavior is, by definition, not an erratum and must go through ADR
  or RFC review.
- The first entries recorded under this ADR (`ERR-0001`, `ERR-0002`) correct
  the RFC-0000/RFC-0001 status headers to `Accepted`, anchored to the Phase 0
  close (`docs/reviews/phase-0-3-board-review.md`); see
  `docs/reviews/maintenance-self-hosting-disposition-packet.md`, Decision 3.
- Future governance-process decisions of this weight continue to record
  their ADR in the same change (ADR-0007 pattern), not retroactively.
