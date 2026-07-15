# Product Owner Disposition Packet — Specification Maintenance & Self-Hosting

- **Instrument:** disposition packet. This document **decides nothing and
  applies nothing.** It assembles the pending items, fixes the exact
  governance instrument each requires, and offers minimal, severable
  options with ready-to-use ratification text. Adopting any option follows
  the normal governance lifecycle (`docs/GOVERNANCE.md`); until the Product
  Owner ratifies, nothing here has force.
- **Prepared by:** Architecture Board (packet assembly), for Product Owner
  disposition.
- **Date prepared:** 2026-07-15.
- **Source of truth:** the repository. Base HEAD `62aaff0`, clean tree,
  `pnpm check-state` green.
- **Inputs:** `docs/reviews/phase-3-close-packet.md` §4 (the
  specification-maintenance proposal), `docs/proposals/self-hosting.md`
  (Levels 1–3), `RFC/0000-genome.md` and `RFC/0001-language.md` (stale
  status headers), `docs/GOVERNANCE.md`, `docs/adr/0007-phase-transition-governance.md`
  (the governance-process-ADR precedent), `docs/PRODUCT_STRATEGY.md`
  (adopted Option A, items A2 and the Level 1 disposition).
- **State ownership:** phase, milestone, objective, and blockers live only
  in `PROJECT_STATE.md` (Governance Rule 8). This packet cites repository
  evidence but owns no state and restates none.

---

## How to read this packet

Five decisions are presented, each **independently severable**: the
specification-maintenance mechanism (Decision 1); self-hosting Level 1
(Decision 2a), Level 2 (Decision 2b), and Level 3 (Decision 2c); and the
RFC-0000/RFC-0001 status headers (Decision 3). The Product Owner may
ratify, defer, or decline each on its own.

There is exactly **one dependency**, and it runs one way: **Decision 3
depends on Decision 1.** The stale-header corrections have a lightweight,
governance-compliant instrument *only if* the erratum mechanism exists.
Every other pair of decisions is independent (confirmed by the adopted
strategy: A2, Level 1, and Phase 4 are mutually independent —
`docs/PRODUCT_STRATEGY.md` §6.1).

### The sorting principle used throughout — the preserved erratum litmus

> **If behavior or any test must change, it is not an erratum.**

This litmus (from `phase-3-close-packet.md` §4) is preserved verbatim and
is the key that assigns each item to its instrument:

- A change that moves **no test, contract, event, or exit code** and only
  corrects accepted *text* → **erratum** (Decision 3).
- A change that adds tests or an example on normative surface → **RFC**
  (Decision 2a).
- A change to the **governance process itself**, with no system-boundary
  change → **governance-process ADR**, Board-reviewed, per the ADR-0007
  precedent (Decision 1; the decision-record half of Decision 2b).
- A pure **deferral** that records intent and changes nothing → **simple
  Product Owner ratification** (Decision 2c).

Each decision below states plainly whether its options change **behavior**,
**architecture**, the **roadmap**, or **only documentation**.

---

## Decision 1 — Specification-maintenance mechanism (erratum registry)

**What is pending.** `phase-3-close-packet.md` §4 proposed a lightweight
instrument for correcting accepted documents that contain a textual defect
which is neither an architectural decision nor new architecture — the class
the RFC-0006 case-4 erratum first exposed. Governance today offers only the
full RFC/Board cycle for any change to accepted text, which is
disproportionate for a one-sentence correction, and doing nothing leaves
accepted documents wrong.

**Governance instrument required.** A **governance-process ADR**, Board-reviewed
and Product-Owner-ratified — **not** an RFC. Basis: the mechanism changes no
system boundary, contract, or scope; it adds a governance procedure. That is
exactly the class ADR-0007 established is "decision-worthy (though not
RFC-worthy — no system boundary changes)" and recorded directly as an ADR.
The §4 proposal itself specifies this instrument ("would itself be recorded
as a short ADR, following the ADR-0007 precedent"). Next free ADR number is
0010 (illustrative; this packet reserves nothing).

### Options (minimal)

| Option | Action | Changes |
|---|---|---|
| **1A — Adopt** *(recommended)* | Establish a single erratum registry via a short governance-process ADR. | **Documentation / governance-process only.** No behavior, no tests, no system architecture, no roadmap deliverable. |
| **1B — Defer** | Take no action now; revisit when document count or a second defect forces it. | Nothing changes. Accepted-text defects keep their only recourse: the full RFC/Board cycle. |
| **1C — Decline** | Rule that no such instrument will exist; all accepted-text corrections go through RFC/ADR/Board permanently. | Nothing changes now; makes the disproportion permanent and blocks Decision 3 forever. |

### Recommended smallest durable maintenance mechanism

Adopt **Option 1A** in the minimal form already sketched in §4 — nothing
larger:

- **One registry**, `docs/ERRATA.md`. Not a subsystem, not a script, not a
  `check-state` rule (a verifier would be a new reader and a larger commitment
  than the defect warrants).
- **Each entry carries:** an id; the affected document and section; the
  wording *before* and *after*; the reason; an explicit **no-behavioral-change
  confirmation**; the approving roles; and the date.
- **Eligibility is the preserved litmus, pinned into the ADR:** *if any test
  or any runtime behavior would have to change, it is not an erratum* — it is
  ADR or RFC territory. Errata are for editorial or normative-wording
  corrections to accepted documents with **zero behavioral change**.
- **Application:** by direct commit citing the erratum id; the corrected site
  gains a one-line pointer to the entry, so accepted text never silently
  diverges from its ratified form.
- **Weight:** registry entry + Board sign-off. No lifecycle, no queue.

This is durable because it is small: it introduces one file and one rule,
both bounded by a litmus that keeps every consequential change in the
existing RFC/ADR channels. It is recorded once, as the ADR, and thereafter
runs by convention.

*This packet does not create `docs/ERRATA.md`, does not write the ADR, and
does not file any erratum. Adoption is the Product Owner's act.*

---

## Decision 2 — Self-hosting Levels 1–3

Source: `docs/proposals/self-hosting.md`, Part D. The ratified evidence
review left the three levels **severable** (`PROJECT_STATE.md`, Active
Architectural Decision). They are classified below exactly as requested and
disposed independently.

### Decision 2a — Level 1: a possible official example

**Classification.** Level 1 is *descriptive self-hosting*: committing the
self-describing Genome (structure only, per the proposal's Part C
restriction) as a **second official example** alongside
`SPEC/examples/company.yaml`, marked non-normative for governance, with
CLI-boundary tests protecting it like any shipped surface. It is a *possible
official example*, not a governance change.

**Governance instrument required.** A **full RFC** → Board review → Product
Owner ratification → queue → implementation. Basis: `SPEC/` is normative
surface and examples have historically been Board-reviewed; the proposal
states adoption "should go through a small RFC." No ADR is expected (it makes
no architectural decision; the RFC-0006 precedent of an empty
compiler/runtime protected diff applies). Next free RFC number is 0008
(illustrative). **The litmus confirms the instrument:** Level 1 *adds a new
example document and new CLI tests* — tests change — so it is categorically
**not** an erratum.

| Option | Action | Changes |
|---|---|---|
| **2a-i — Commission the Level 1 RFC** *(recommended if a canonical non-toy example is wanted now)* | Commission drafting of the small RFC as scoped in the proposal (structure-only example, non-normative marking, CLI-boundary evidence, empty protected diff). | Commissioning itself changes **nothing** (an RFC is not implementation). *Eventual* adoption would add **documentation (one example file) and tests**; **no behavior change** (empty protected diff by design), **no architecture change**, and at most a small **capability-roadmap** example (strategy C2). |
| **2a-ii — Amend then commission** | Adjust scope (e.g. defer the example, keep only the mapping) before commissioning. | Same as 2a-i, narrower. |
| **2a-iii — Decline / defer** | Do not commission now; keep the self-Genome as the proposal's non-committed appendix sketch. | Nothing changes; dogfooding pressure stays ad hoc. |

### Decision 2b — Level 2: a durable-evidence decision near the persistence boundary

**Classification.** Level 2 is *evidentiary self-hosting*: using the runtime
as the **recorder** of governance acts — a ratification performed as
`genome run … --grant human:product-owner --export-log`, with the exported
NDJSON (carrying the attributed `approval.granted` event) committed beside
the review as a durable, machine-checkable ratification record. It is a
**durable-evidence decision that sits close to the persistence boundary** and
overlaps the decision-record territory of Decision 1 — which is why the
proposal asks that the two be shaped together.

**Governance instrument required.** **Board review, disposed jointly with
Decision 1**, and — if adopted — recorded as a **decision-record /
governance-process ADR** with Product Owner ratification. It is *not* an RFC
**as long as** it stays a manual, human-read practice: the export remains
write-once and **no shipped code path reads an exported log**. The moment any
shipped reader appears (for example, teaching `check-state` to *verify* those
logs), the pinned persistence tripwire fires in full and Level 2 becomes
**event persistence's first consumer — requiring its own RFC**
(`phase-3-close-packet.md` §2/§5; self-hosting proposal Part D, Level 2,
interaction 1).

| Option | Action | Changes |
|---|---|---|
| **2b-i — Adopt as manual practice** | Commit exported ratification logs beside review documents as records; humans-and-reviews read them only; no automated reader, no `check-state` verification. | **Documentation / process only** — *provided the no-reader condition holds.* No behavior, no architecture, no roadmap change. Strengthens Principle 7 (versioned decisions). |
| **2b-ii — Defer, disposed with the persistence gate** *(recommended)* | Hold Level 2 with Decision 1 acknowledged; revisit if/when a durable-log consumer (plausibly Studio runtime logs) reaches its gate. | Nothing changes now; avoids walking the tripwire before a real consumer exists. |
| **2b-iii — Decline** | Rule that ratification records stay as review prose and commit messages. | Nothing changes; leaves the Bootstrap Report's "ratification exists only as commit-message assertion" observation open. |
| *(escalation, not an option to pick)* | Any automated verification of committed logs. | **Behavior + architecture + roadmap:** trips the persistence gate → its own RFC. Named here so it is never done by accident. |

### Decision 2c — Level 3: operative governance deferred to Phase 6

**Classification.** Level 3 is *operative self-hosting*: the runtime actually
**gating repository operations** (CI refusing a merge without a matching
approval event, governance state reconstructed from durable logs, proposals
flowing through the Phase-6 `genome.proposal.created` payload). It requires
durable event persistence as its very first ingredient and is therefore
*defined* to be the persistence gate's first consumer. It is **operative
governance, deferred to Phase 6.**

**Governance instrument required.** **Simple Product Owner ratification of the
deferral** now — no RFC, no ADR. When Phase 6 opens, Level 3 carries **its
own RFC** (Phase 6 is already on `ROADMAP.md`; the proposal-payload RFC is
reserved by ADR-0006).

| Option | Action | Changes |
|---|---|---|
| **2c-i — Confirm deferral to Phase 6** *(recommended)* | Record that "govern the Genome project" is a named candidate first-consumer for event persistence, to be taken up in Phase 6 planning, not before. | **Documentation only** — records intent. No behavior, no architecture; no roadmap change (Phase 6 already exists). |
| **2c-ii — Leave unstated** | Say nothing; Level 3 remains an unclassified aspiration. | Nothing changes; loses the value of naming a concrete Phase-6 consumer. |

*(Pursuing Level 3 now is not offered: it would require the persistence RFC,
which is out of scope and gated on a consumer.)*

---

## Decision 3 — RFC-0000 and RFC-0001 stale Draft-status headers *(contingent on Decision 1)*

**What is pending.** `RFC/0000-genome.md` and `RFC/0001-language.md` both
still read `Status: Draft`, while `ROADMAP.md` Phase 0 classifies both
**Done** and their content ships as v0.1 (`SPEC/language.md`, the schema).
The record contradicts itself. Adopted strategy A2 names exactly these
"stale RFC-0000/0001 status headers" as what the maintenance mechanism
unblocks.

**Dependency.** This decision is presented **only insofar as it depends on
Decision 1**. A status-header correction moves no test, contract, event, or
exit code, so by the preserved litmus it is **erratum-eligible** — and the
erratum registry is its smallest governance-compliant instrument. **If
Decision 1 is not adopted (1B/1C), Decision 3 has no lightweight vehicle**
and must either wait or be carried by a heavier instrument; this packet does
not recommend that path.

**Governance instrument required (given Decision 1 = Adopt).** One **erratum
entry per file**: registry entry + Board sign-off + direct commit with a
one-line pointer at the corrected header. No RFC, no ADR. The Board's sign-off
on each entry is where the *truth* of the new status is affirmed (the litmus
governs only that nothing executable changes; it does not itself decide which
status is correct — that is the substance of this decision).

### What status should they carry?

The four candidate statuses, assessed against the record:

- **Accepted** — *recommended.* Their content is shipped and evidenced, and
  the Phase 0 close (`docs/reviews/phase-0-3-board-review.md`, ratified by
  the Product Owner) classifies "RFC-0000 Done" and "RFC-0001 Done" among the
  Phase 0 deliverables. That Board act **is** an acceptance record on the
  books; an erratum relabeling `Draft → Accepted` **records an existing
  ratification** rather than manufacturing one, and stays within the existing
  status vocabulary. Anchor each header to the Phase 0 close review as its
  evidence, mirroring how RFC-0002+ cite their board decisions.
- **Foundational** — accurate in spirit (they are originating documents later
  elaborated by `SPEC/` and superseded-in-detail by no single RFC), **but it
  mints a new status term.** Introducing a status-vocabulary word is a
  governance addition that belongs in the Decision-1 ADR's definition, not in
  a pure erratum — so it is strictly *heavier* than Accepted for no
  correctness gain. Offered as the documented alternative if the Board judges
  the Phase 0 close insufficient as an acceptance act.
- **Historical** — **rejected on accuracy.** "Historical" reads as
  *superseded / no longer governing*, but RFC-0001's language *is* v0.1, still
  in force. Labeling it Historical would be a fresh inaccuracy, not a
  correction.
- **Retain Draft** — **rejected**; this is the defect. It contradicts the
  ROADMAP's Done classification and the shipped implementation, and is exactly
  the stale header A2 exists to fix.

| Option | Action | Changes |
|---|---|---|
| **3-i — Correct both to Accepted** *(recommended; requires 1A)* | Two erratum entries relabel `Draft → Accepted`, each anchored to the Phase 0 close review; one-line pointer added at each header. | **Documentation only.** No behavior, no tests, no architecture, no roadmap change. |
| **3-ii — Correct both to Foundational** *(requires 1A + a status-term definition in the ADR)* | Define "Foundational" in the Decision-1 ADR, then relabel via errata. | **Documentation + a governance-vocabulary addition.** Still no behavior/tests/architecture/roadmap change, but larger than 3-i. |
| **3-iii — Retain Draft** | Decline; leave the contradiction standing. | Nothing changes. |

*This packet edits neither RFC header and files no erratum.*

---

## Consolidated change classification

| Decision | Recommended option | Behavior | Architecture | Roadmap | Documentation |
|---|---|---|---|---|---|
| 1 — Maintenance mechanism | 1A Adopt (governance-process ADR) | — | — | — | ✓ (adds `docs/ERRATA.md` + ADR) |
| 2a — Level 1 example | 2a-i Commission RFC | — | — | small (capability example) | ✓ (RFC now; later an example + tests) |
| 2b — Level 2 records | 2b-ii Defer with persistence gate | — | — | — | — (defers) |
| 2c — Level 3 operative | 2c-i Confirm Phase 6 deferral | — | — | — | ✓ (records deferral) |
| 3 — Stale headers | 3-i Correct to Accepted (needs 1A) | — | — | — | ✓ (two errata) |

No recommended option changes runtime behavior, moves a test, or alters an
accepted system boundary. The one architectural-scope tripwire — automated
reading of committed logs (Decision 2b escalation) — is explicitly *not*
recommended and is flagged so it is never triggered inadvertently.

---

## Severability summary

- **Decision 1** (maintenance mechanism): independent. Ratify / defer /
  decline on its own.
- **Decision 2a / 2b / 2c** (self-hosting levels): mutually independent;
  each ratified, deferred, or declined on its own.
- **Decision 3** (stale headers): **depends on Decision 1 = Adopt.** If
  Decision 1 is deferred or declined, Decision 3 is automatically held.
- No other cross-dependencies. In particular, none of these decisions gates,
  or is gated by, the Phase 4 opening RFC (strategy §6.1); this packet
  neither opens Phase 4 nor drafts its RFC.

---

## Smallest governance-compliant sequence (for reference, not applied here)

If the Product Owner ratifies the recommended options, the minimal compliant
order is:

1. **Adopt Decision 1** (1A) — one Board sitting + ratification records the
   governance-process ADR and establishes `docs/ERRATA.md`; in the same
   sitting, settle **2b** (recommended: defer) and **2c** (confirm Phase 6
   deferral), since both are decision-record dispositions the proposal asks
   to shape together.
2. **Apply Decision 3** (3-i) — with the registry now existing, file the two
   errata correcting the RFC-0000/0001 headers to Accepted. No new instrument.
3. **Commission Decision 2a** (2a-i) — the Level 1 RFC runs its own full
   lifecycle, independent of steps 1–2 and of Phase 4; may proceed in
   parallel.

Step 2 cannot precede step 1 (the erratum needs its authorizing mechanism);
Decision 2a cannot ride the ADR (normative-surface + tests → its own RFC).
Nothing collapses further without breaking Governance Rule 2 or the erratum
dependency. The Phase 4 opening RFC follows this work per adopted Option A and
is **out of scope for this packet.**

---

## Exact Product Owner ratification statements

Ready-to-use text for the recommended disposition of each severable decision.
The Product Owner may instead select any option above; where the recommended
option is *defer* or *decline*, alternative statements are noted inline.

**Decision 1 — Maintenance mechanism (recommended: 1A Adopt):**

> As Product Owner, I adopt the specification-maintenance mechanism as a
> governance-process decision, to be recorded as a short ADR (ADR-0007
> precedent): a single `docs/ERRATA.md` registry for zero-behavioral-change
> corrections to accepted documents, each entry carrying id, affected
> document and section, wording before and after, reason, an explicit
> no-behavioral-change confirmation, approving roles, and date, applied by
> direct commit with a one-line pointer at the corrected site. The eligibility
> litmus is pinned: *if any test or any runtime behavior would have to change,
> it is not an erratum.* I direct that the ADR be written and the registry
> created as a separate act; this ratification applies no correction by
> itself.
>
> *(Alternatives: "I defer the maintenance mechanism" (1B) / "I decline the
> maintenance mechanism; accepted-text corrections remain RFC/ADR/Board work"
> (1C).)*

**Decision 2a — Self-hosting Level 1 (recommended: 2a-i Commission):**

> As Product Owner, I commission the Level 1 self-hosting RFC (next free
> number), scoped to a structure-only, non-normative self-describing example
> committed alongside `SPEC/examples/company.yaml`, with CLI-boundary evidence
> and an empty compiler/runtime protected diff (RFC-0006 precedent), and no
> language, schema, compiler, or runtime change. Commissioning authorizes
> drafting and Board review only; it implements nothing and adds no queue item
> until the RFC is ratified.
>
> *(Alternatives: "I amend the scope and then commission" (2a-ii) / "I decline
> Level 1 for now" (2a-iii).)*

**Decision 2b — Self-hosting Level 2 (recommended: 2b-ii Defer):**

> As Product Owner, I defer the Level 2 evidentiary-self-hosting decision,
> to be disposed together with the maintenance mechanism and revisited when a
> durable-log consumer reaches its gate. No exported log is committed as a
> record under this ratification, and no shipped code path is authorized to
> read an exported log; any automated verification of such logs is the
> persistence gate's first consumer and requires its own RFC.
>
> *(Alternatives: "I adopt Level 2 as a manual, human-read records practice,
> no automated reader" (2b-i) / "I decline Level 2" (2b-iii).)*

**Decision 2c — Self-hosting Level 3 (recommended: 2c-i Confirm deferral):**

> As Product Owner, I confirm that Level 3 operative self-hosting is deferred
> to Phase 6 planning, where "govern the Genome project" is named as a
> candidate first consumer for event persistence and will carry its own RFC.
> Nothing in Level 3 is authorized now.

**Decision 3 — Stale headers (recommended: 3-i Correct to Accepted, contingent
on Decision 1 = 1A):**

> As Product Owner, contingent on the erratum mechanism being adopted, I
> direct that the `Status: Draft` headers of `RFC/0000-genome.md` and
> `RFC/0001-language.md` be corrected to `Accepted`, each anchored to the
> Phase 0 close review (`docs/reviews/phase-0-3-board-review.md`) as its
> acceptance evidence, via two erratum entries. This is a zero-behavioral-change
> documentation correction: no test, contract, event, or exit code moves. If
> the erratum mechanism is not adopted, this correction is held.
>
> *(Alternatives: "correct to Foundational, with the term defined in the
> maintenance-mechanism ADR" (3-ii) / "retain Draft" (3-iii).)*

---

## Explicitly not done by this packet

- No ADR written; `docs/ERRATA.md` not created; no erratum filed.
- No RFC drafted; no `IMPLEMENTATION_QUEUE.md` entry added.
- Neither RFC-0000 nor RFC-0001 header edited.
- No language, schema, compiler, runtime, or CLI change of any kind.
- No Phase 4 work and no Phase 4 opening RFC.
- No option applied. Every decision above awaits the Product Owner.
