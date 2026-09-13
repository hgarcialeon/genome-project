# Architecture Board — Phase 4 Milestone 1 Implementation-Close Review

**Status: Board recommendation recorded. NOT ratified. Milestone 1 is NOT
closed.**

Held 2026-09-13. Artifact under review:
`docs/reviews/phase-4-m1-implementation-close-packet.md`.
Implementation/evidence commit: **`28f0b53`**.

Board (`docs/GOVERNANCE.md`): Product Owner, Chief Architect, Lead Engineer.

**The Board recommends; it does not close.** No implementation code was modified,
no F1–F4 finding was fixed, no roadmap item moved to Done, and Milestone 2 was
not opened. Material claims were **re-executed**, including an independent
eight-step browser re-run of the remediation journey (§2).

---

## 1. Decision history — complete, and not rewritten

Every artifact in the chain is present in the repository and was read:

| # | Act | Artifact |
|---|---|---|
| 1 | RFC-0009 Governed Authoring accepted (Option B, four amendments) | `RFC/0009-phase-4-governed-authoring.md` · `docs/reviews/rfc-0009-board-review.md` |
| 2 | Checkpoints 1–7 | 7 checkpoint commits in history; Checkpoint 7 prepared the first acceptance evidence |
| 3 | First Product Owner walkthrough | `docs/reviews/phase-4-m1-product-acceptance.md` §§1–11 |
| 4 | **Original rejection** | same record §12 — **Rejected**, present verbatim |
| 5 | Remediation proposal | `docs/proposals/phase-4-m1-authoring-remediation.md` |
| 6 | Board recommendation — toolchain-owned semantic authoring (Option C) | `docs/reviews/phase-4-m1-authoring-remediation-board-review.md` |
| 7 | Product Owner ratification of Option C + A1–A8 | §8 of that review |
| 8 | RFC-0010 | `RFC/0010-semantic-authoring-operations.md` |
| 9 | RFC-0010 Board review | `docs/reviews/rfc-0010-board-review.md` |
| 10 | Amendments A1–A12 | applied to the RFC text; ratified at §28 of that review |
| 11 | ADR-0012 | `docs/adr/0012-semantic-authoring-boundary.md` |
| 12 | `@genome/authoring` implementation | Stage A, `4f68336` |
| 13 | Studio Add agent integration | Stage B, `9a11e13` |
| 14 | Repeated Product Owner walkthrough | `docs/reviews/phase-4-m1-product-acceptance.md` §13 |
| 15 | Disposition — **Accepted with follow-ups** | same §13 and the remediation record §9 |

**The rejection remains evidence.** The acceptance record is append-only: §§1–12
stand exactly as written at rejection and §13 appends the remediation. The Board
is closing a milestone that **failed its first product acceptance**, and records
that plainly rather than presenting a first-pass success.

The Board notes the chain also contains a *prior* protected-boundary crossing
handled the same way — the ADR-0011 compiler-portability authorization — so this
is the project's second use of "stop, return to the Board, ratify, then
implement". The pattern held both times.

## 2. Was the rejected criterion actually remediated?

The Board did **not** rely on the packet or on the Product Owner's report. It
drove the **built** Studio in real headless Chromium and checked all eight steps
independently.

| # | Step | Result | Observed |
|---|---|---|---|
| 1 | Recognize the organization is editable | **PASS** | framing text present; 2 Add agent controls |
| 2 | Discover Add agent from Engineering | **PASS** | control present on the engineering department |
| 3 | Provide minimum intent without YAML placement knowledge | **PASS** | focus lands on the id field; `aria-required="true"` |
| 4 | Produce canonical Genome source | **PASS** | exactly one line added: `board-review-agent: {}`; RFC-0008 disclaimer intact |
| 5 | Observe the normal source/projection lifecycle | **PASS** | stale=2 and **Run disabled** at submit; stale=0 after ~1.3 s with **no explicit compile** |
| 6 | See compiler-derived graph/tree results | **PASS** | `agent:engineering.board-review-agent` in the graph; **20 nodes, 32 relationships**; tree shows it |
| 7 | Inspect the source | **PASS** | editor present, editable, contains the agent |
| 8 | Continue governed execution | **PASS** | exactly one `approval.requested`, **zero** steps, principal `human:product-owner` |

**8/8 verified independently.** The Board's run used a different agent id
(`board-review-agent`) from the Product Owner's (`po-review-agent`) and reached
the same 19/31 → **20/32** graph counts the Product Owner reported. The journey
is reproducible with an arbitrary id.

**This is a genuine remediation, not a scripted workaround.** Three observations
support that:

1. The operation is reached only through `@genome/authoring`; Studio holds no
   placement knowledge to script against (§3).
2. The Board typed an id the implementation had never seen, with **no optional
   fields**, and the emitted source was `board-review-agent: {}` — the deny-safe
   `autonomy` default was not materialized. A workaround keyed to a fixture
   would not behave this way.
3. The lifecycle observed was the **ordinary** one: Run disabled while stale,
   then the accepted debounce compiled it. No authoring-specific path exists
   (§3, E19).

## 3. RFC-0010 architecture — verified from implementation

```
Studio → captures add-agent intent → @genome/authoring
  → resulting Genome source → ordinary Studio edit lifecycle
  → compiler → projections
```

| Check | Verification |
|---|---|
| Studio imports and invokes `@genome/authoring` | `app.tsx:35` import; `app.tsx:215` the **only** call site |
| Studio does not parse or serialize YAML for add-agent | **Zero** matches for a `yaml` import, `YAML.parse`, `parseDocument`, `YAML.stringify` in Studio production source |
| Studio does not know semantic placement rules | No `departments`/`agents` path construction anywhere in Studio; E12 scans for it |
| No direct graph/tree mutation | Both render from `state.lastSuccessful`; E12 forbids setting a projection from an authoring result |
| Graph/tree remain compiler-derived | §2 step 6 re-executed; rendered nodes equal `graphTarget` output |
| Source remains canonical | §2 steps 4 and 7 |
| Authoring never derives `genomeRevision` | **Zero** occurrences of `revision` in the package's production source |
| **No generic operation dispatcher** | The only `dispatch` matches in the workspace are pre-existing runtime **adapter** comments in `session.ts` and the line in `index.ts` stating there is none. `@genome/authoring` exports exactly **one** `apply*` function |
| Only `add-agent` implemented | `applyAddAgent` is the sole operation export |
| Team-scoped creation absent | No team path is written; E8's second case proves no team fallback |
| CLI authoring absent | Zero references to authoring in `packages/genome-cli/src`; the package declares no `bin` |

The Board specifically re-ran the dispatcher check after an initial keyword scan
flagged two hits, and confirms both are pre-existing runtime-adapter prose, not a
dispatcher. **No operation language was introduced.**

## 4. RFC-0010 evidence — E1–E19, individually

All re-run uncached. Locations: `A` = `packages/genome-authoring/src/add-agent.test.ts`;
`S` = `apps/genome-studio/src/authoring.test.tsx`.

| E | Location | Result | Invariant protected |
|---|---|---|---|
| **E1** | A §"E1" (2 cases) | **PASS** | The operation works at all, and works with **only** the required fields — the minimum intent is genuinely minimum. |
| **E2** | A §"E2" | **PASS** | The compiler accepts the output. Authoring cannot emit a document the toolchain rejects. |
| **E3** | A §"E3" | **PASS** | Identity is `agent:<dept>.<id>` and **exactly one** node is added — no collateral graph change. |
| **E4** | A §"E4" | **PASS** | The inspect projection lists the agent under its department and `counts.Agent` increments — the tree's source of truth moved correctly. |
| **E5** | A §"E5" (5 cases: R6, R1 comments, R1 no-reflow, R2/R3/R5, R4) | **PASS** | Tier-1 preservation. **R6** pins the canonical diff to exactly the agent's lines; the no-reflow case guards the `lineWidth: 0` property whose absence the RFC-0010 Board review measured as a 100-line no-edit diff. |
| **E6** | A §"E6" | **PASS** | The RFC-0008 non-normative governance disclaimer survives — a governance property, not cosmetics. |
| **E7** | A §"E7" (3 cases) | **PASS** | Determinism from the **same original input** each run; **intent identity includes presence-or-absence** of each optional field; stable across four fixtures. Protects revision stability. |
| **E8** | A §"E8" (2 cases) | **PASS** | Unknown department refused as `conflict` with **no `source`**; and **no team fallback** — placement is exact. |
| **E9** | A §"E9" (3 cases) | **PASS** | Duplicate refused **only in the target mapping**; explicitly **not** refused for an id in another department, nor for one in a team beneath the target. **Guards against inventing a global uniqueness semantic Genome does not have.** |
| **E10** | A §"E10" (2 cases) | **PASS** | `invalid-result` carries the compiler's diagnostics; every `ok: true` source compiles. The compiler stays the authority. |
| **E11** | A §"E11" (2 cases) | **PASS** | An invalid input is refused **before** any transformation, with diagnostics `toEqual` the compiler's own — verbatim, not re-worded. |
| **E12** | S §"E12" (4 cases) | **PASS** | Scans Studio's production sources for YAML imports/parse/serialize, hand-built agent fragments, encoded placement rules, and any projection set from an authoring result. **The Principle 5 tripwire.** |
| **E13** | A §"E13" (2) + S §"E13" | **PASS** | Authoring exposes no revision and mentions none; Studio shows only compiled revisions and predicts none. Compiler ownership of identity. |
| **E14** | A §"E14" (2 cases) | **PASS** | Omitted optional fields stay omitted; the emitted mapping is `{}`; **the deny-safe `manual` default is never materialized**. Prevents the toolchain asserting what the language merely defaults. |
| **E15** | A §"E15" (3 cases) | **PASS** | Supplied `role`, `autonomy` and **`skills`** are written with their values; an autonomy outside the accepted set is `invalid-intent`; missing department/id is `invalid-intent`. |
| **E16** | A §"E16" | **PASS** | The caller's source string is unchanged — purity. |
| **E17** | A §"E17" | **PASS** | A department with **no `agents` key** gets one created and still compiles. |
| **E18** | A §"E18" (2 cases) | **PASS** | Authoring failures carry no `stage`/`severity`/`path`; compiler failures carry unmodified `Diagnostic`s whose `stage` is one of the three accepted values. **Guards the A8 boundary** — the reason `CompileStage` needed no widening. |
| **E19** | S §"remediation journey" | **PASS** | With the accepted debounce the projections come current **without any explicit compile** — no authoring-specific compile lifecycle. |

Plus, beyond E1–E19: `A §"Tier 3"` documents the **disclosed normalizations**
(CRLF → LF, mixed indentation) as tests rather than promises, and
`A §"failure atomicity"` asserts **no failure result carries a `source` field**
across all four classes.

**Every item the Product Owner asked to be confirmed specifically is green**:
optional role/autonomy, omitted autonomy stays omitted, skills behavior,
target-mapping-only duplicates, cross-scope ids not made unique, invalid-source
and invalid-result compiler diagnostics, failure atomicity, determinism, the
preservation fixture, RFC-0008 disclaimer, `Diagnostic`/`CompileStage`
unchanged, no Studio-owned mutation, no authoring-specific compile path, no
revision derivation.

## 5. F1–F4 against accepted close criteria

Severity labels are **not** dispositive. Each was tested against normative text.

### F1 — "View change in source" — **the decision the Board was asked to make explicit**

The clause is RFC-0010 §9.2 (amendment A11):

> The resulting source is **immediately inspectable** in Studio. Visual authoring
> does not hide or replace the durable Genome artifact.

**Interpretation 1** — an ownership/concealment requirement.
**Interpretation 2** — additionally a navigational-reachability requirement.

**The Board finds Interpretation 1 is the accepted meaning.** Four grounds, from
the accepted text and review history:

1. **The clause's own second sentence defines its concern**: "does not **hide or
   replace** the durable Genome artifact". Hiding and replacing are concealment
   verbs. Reachability is not mentioned.
2. **The originating Board reasoning names concealment**
   (`docs/reviews/rfc-0010-board-review.md` §17): the amendment exists because
   "an authoring surface that **concealed** the source would break a criterion
   that already passed" — the Milestone-1 traceability criterion. The risk
   identified was a UI that substitutes a structured view for the document, not
   one that places the document lower on a page.
3. **ADR-0012 states the durable property in ownership terms**: "the canonical
   artifact is always Genome source" and "no authoring surface may conceal it."
   Again concealment, not distance.
4. **No accepted text anywhere imposes a layout, viewport, or scroll-distance
   obligation.** RFC-0009 §8 expressly prescribes no framework or layout, and the
   acceptance floor's six bullets are about keyboard operability, focus,
   names, contrast, error association and non-pointer-only input — none about
   proximity.

Re-executed evidence: the editor is present, editable, contains the change, and
the success confirmation names it ("The Genome source below has changed"). The
Board measured the editor at **1150 px** from the document top in a 1440×900
viewport with no pending session; the Product Owner observed **~2814 px** with a
pending session in a 583 px viewport. Both are *present and reachable by
scrolling*; neither is concealed.

**The Board declines to invent a stronger requirement because the improvement
would be useful.** It would be useful. It is not owed by the accepted text.

> **F1 is classified NON-BLOCKING.**

The Board records the counter-consideration honestly: a reviewer on a short
viewport with a pending session has a genuinely poor path to the artifact the
architecture calls canonical, and F1 should be done. That is a product-quality
judgement, correctly expressed as a follow-up rather than retro-fitted into an
accepted clause.

### F2 — stale success confirmation

Tested against canonical-source ownership, projection-freshness invariants,
authoring semantics, and the accepted product criteria.

- **Canonical-source ownership** — RFC-0009 §3 forbids Studio becoming "a second
  source of truth — for the document". The confirmation is not consulted by
  anything: it feeds no projection, no run-readiness, no revision, no execution.
  The Board verified the source and projections behaved correctly through the
  same edit sequence (§2 steps 4–6). **Not violated.**
- **Projection freshness** — the Checkpoint-2 invariant is stated over
  *projections*, and projections were correct. **Not violated.**
- **Authoring semantics** — RFC-0010 defines the operation's contract, not the
  lifetime of a UI message. **Not engaged.**
- **Accepted product criteria** — RFC-0009 §10.1 and RFC-0010 §14 contain no
  clause about confirmation lifetime. **Not engaged.**

**UI message staleness is distinct from semantic state.** The semantic state was
correct throughout; a message outlived its truth. That is a real defect — a user
could misread it — and it should be fixed, using existing source/edit state and
**never** by reparsing YAML in Studio.

> **F2 is classified NON-BLOCKING.**

### F3 — ambiguous projection-status copy

"Everything below was compiled…" sits beneath graph/tree content and is
ambiguous about the referent. Tested against the accessibility floor's
"diagnostics and errors programmatically associated with the relevant content":
this is **status copy, not a diagnostic or error**, and it is correctly
associated with its own panel (`aria-labelledby`, verified). No accepted clause
governs the clarity of status wording.

> **F3 is classified NON-BLOCKING** — wording polish.

### F4 — Escape cancellation

Re-executed in the browser:

| Property | Observed |
|---|---|
| Cancel keyboard-operable | **Yes** — Cancel closes the form |
| Focus restored | **Yes** — focus returns to the opening control |
| Keyboard trap | **None** — Tab and Cancel both escape the form |
| Essential action pointer-only | **No** — the full journey completes by keyboard (`S §"completes the whole journey from the keyboard alone"`) |
| Escape dismisses | **No** — confirmed: the form remains open after Escape |

Is Escape dismissal **required**? Searched: **RFC-0009 — no**; **RFC-0010 — no**;
the **Milestone-1 acceptance floor — no**. WCAG 2.2 AA contains **no
success criterion requiring Escape dismissal**; the nearest is SC 2.1.2 *No
Keyboard Trap* (Level A), which is satisfied.

The Board will not elevate a desirable convention into a close criterion.

> **F4 is classified NON-BLOCKING** — interaction polish.

**Summary: none of F1–F4 violates an explicit accepted close criterion.**

## 6. Product acceptance

The Board was not asked to redo subjective acceptance, and does not.

It asks only whether an **explicit contradiction with an accepted normative
requirement** would invalidate the disposition. **It finds none.** The
disposition **Accepted with follow-ups** is valid and stands. The evidence
supporting it was independently reproduced (§2), which is the strongest form of
confirmation available to this Board without a second human reviewer.

RFC-0009 §14 item 8 (Amendment 4) requires a **recorded reviewer walkthrough**,
not a mechanical gate. Two are recorded — one rejecting, one accepting — and
both are preserved.

## 7. Checkpoint preservation — targeted evidence

Beyond the aggregate suite, the Board ran the Checkpoint 1–7 suites in
isolation: **96 tests, 8 files, all passing.**

| Checkpoint area | Targeted evidence | Result |
|---|---|---|
| Compilation-state model | `genome/compilation-state.test.ts` (10) | **PASS** |
| Stale/current invariant | same, plus `projections.test.tsx` stale cases | **PASS** |
| Diagnostics behavior | `a11y.test.tsx` invalid-source case; `app.test.tsx` | **PASS** |
| Organization Graph | `projections.test.tsx` (9) — drawn nodes equal `graphTarget` | **PASS** |
| Organization tree | same — rendered items equal `inspectTarget` | **PASS** |
| Runtime session isolation | `execution.test.tsx` (14) incl. divergence and "persists nothing" | **PASS** |
| Deny-safe parking | `execution.test.tsx`, `grant.test.tsx`, and §2 step 8 in-browser | **PASS** |
| Approval attribution | `grant.test.tsx` (9) | **PASS** |
| Event stream | `execution.test.tsx` fidelity cases | **PASS** |
| Reset/discard | `grant.test.tsx` discard-after-completion; `hardening.test.tsx` | **PASS** |
| Accessibility / error recovery | `hardening.test.tsx` (12), `a11y.test.tsx` (18), `contrast.test.ts` (22) | **PASS** |
| RFC-0009 §7 canonical journey | `acceptance.test.tsx` (2) | **PASS** |
| Browser conformance | `@genome/browser-conformance` 11/11 in real Chromium | **PASS** |

**No Checkpoint 1–7 regression.** The `a11y` suite grew from 14 to 18 by
addition, not modification.

## 8. Health — re-executed, uncached, from clean

| Gate | Result |
|---|---|
| `pnpm check-state` | consistent |
| `pnpm typecheck` | **8/8 packages**, 0 cached |
| `pnpm test -- --force` | **8/8 packages**, **0 cached**, **0 failures** |
| `pnpm build` | 1/1, 0 cached |

**Package count: 8. Test count: 309.** adapter-reference 7 · authoring 37 ·
browser-conformance 11 · cli 44 · compiler 60 · runtime 18 · schema 4 · studio
128. **Cached: 0 of 8 tasks** on every gate.

Browser conformance ran in **real Chromium** (it fails rather than skips when no
browser is found), confirming Node ↔ browser equality still holds.

These match the close packet's numbers; the Board reports its own execution, not
the packet's.

## 9. Protected boundaries — from the RFC-0010 accepted baseline `620e7f8`

| Boundary | Diff |
|---|---|
| `SPEC/schema/genome.schema.json` | **EMPTY** |
| `SPEC/language.md` | **EMPTY** |
| `packages/genome-compiler/src` | **EMPTY** |
| `…/diagnostics.ts` (`Diagnostic` / `CompileStage`) | **EMPTY** |
| `…/revision.ts`, `…/sha256.ts` | **EMPTY** |
| `packages/genome-runtime/src` | **EMPTY** |
| `packages/genome-runtime/src/events` | **EMPTY** |
| `packages/genome-cli/src` | **EMPTY** |
| `packages/genome-adapter-reference/src` | **EMPTY** |
| `packages/genome-schema/src` | **EMPTY** |
| `docs/GOVERNANCE.md`, `docs/CONSTITUTION.md` | **EMPTY** |
| `docs/adr/0011-platform-neutral-compiler.md` | **EMPTY** |
| Golden revisions + compiler fixtures | **EMPTY** — **ADR-0011 intact** |
| Persistence · exported-log reader · provider adapters · triggers | **ABSENT** |

The three keyword hits for persistence/log/trigger terms are pre-existing
accepted surfaces — the CLI's `--json`/`--export-log` options (RFC-0006) and the
compiler's `RuntimeTrigger` type (RFC-0004) — all in files with **empty diffs**.
Nothing new.

**New production files since baseline — five, exactly as scoped:**
`packages/genome-authoring/{package.json,tsconfig.json,src/index.ts,src/add-agent.ts}`
and `apps/genome-studio/src/components/AddAgentForm.tsx`.

**No protected boundary was crossed.**

## 10. Language Complexity Budget — shipped vs accepted

| Accepted new capability | Shipped | Match |
|---|---|---|
| Semantic `add-agent` operation | one operation, one export | ✅ |
| Transformation contract | source → source, three preservation tiers | ✅ |
| `@genome/authoring` package + public surface | one package; `applyAddAgent` + its result types | ✅ |
| Studio authoring interaction | one form, one control per department | ✅ |

| Accepted unchanged | Verified |
|---|---|
| Genome syntax · language semantics · Genome fields | **0** — output is ordinary Genome; no new field |
| Schema semantics | **0** — empty diff |
| Compiler semantics (incl. `Diagnostic`/`CompileStage`) | **0** — empty diff, E18 |
| Runtime · event taxonomy | **0** — empty diffs |
| Revision semantics | **0** — E13; ADR-0011 intact |
| Governance semantics | **0** — empty diffs |
| Persistence | **0** — absent |

**No hidden expansion found.** The Board specifically checked the two places
expansion would hide: a dispatcher (absent — §3) and a widened `Diagnostic`
(absent — E18). Shipped budget equals accepted budget.

## 11. Scope containment

| Not to be introduced | Present? |
|---|---|
| `edit-agent` · `delete-agent` · `add-workflow` · `add-policy` | **ABSENT** |
| Team-scoped `add-agent` | **ABSENT** |
| Generic mutation dispatcher | **ABSENT** (§3) |
| Arbitrary YAML patching | **ABSENT** |
| Schema-generated generic forms | **ABSENT** — the form is three fixed fields |
| Authoring CLI | **ABSENT** — no `bin`, no CLI reference |
| Persistence · providers · triggers · simulation · Office View · Marketplace | **ABSENT** |

**No scope creep.** The package exposes exactly one `apply*` function.

## 12. Milestone 2 and Phase 4 state

**Milestone 2 (durable runtime logs) remains UNOPENED** — not scoped, not
designed, not implied. RFC-0009 §12 records it as a later Phase 4 milestone
requiring its own RFC; event persistence stays gated on its first consumer.
`ROADMAP.md` "Runtime logs" is **Not Started** and must remain so.

**Closing M1 does not open M2, and does not close Phase 4.** Phase 4 contains
future, unopened work; that distinction is preserved.

**State that should become true after ratification — recorded, not applied:**

| Item | After ratification |
|---|---|
| Milestone 1 | **Closed complete** |
| Milestone-1 queue item | Drained (**Done**) |
| RFC-0010 queue item | Drained (**Done**) |
| `ROADMAP.md` Phase 4: editor, schema validation, live preview, organization tree | **Done** |
| `ROADMAP.md` Phase 4: **Runtime logs** | **Not Started** — unchanged |
| Phase 4 | **Remains open**, now with no authorized milestone until one is opened |
| Milestone 2 | **Unopened** |
| Autonomy Substrate, Office View, Marketplace, simulation, persistence, providers, triggers | **Not authorized** |
| Follow-up item (§13) | **Not Started** |

Nothing above is applied by this review.

## 13. Follow-up disposition

F1–F4 are non-blocking, but **Governance Rule 4 is decisive**: *"Implementation
follows the queue, never chat history."* Findings recorded only in a review
document are not work anyone is scheduled to do. If they are to be done, the
queue is where they belong.

**One item, not four.** F1–F4 are all small, all Studio-local, all
presentation/interaction, and all traceable to a single acceptance record
section. Four governance items would misrepresent four notes as four workstreams.

The Board recommends **a single `IMPLEMENTATION_QUEUE.md` item**:

- **Scope:** Studio authoring follow-ups — source-change navigation (F1), stale
  success confirmation (F2), projection-status copy (F3), Escape cancellation
  (F4).
- **Source:** `docs/reviews/phase-4-m1-product-acceptance.md` §13.7.
- **Owner:** Engineering. **Status:** Not Started. **Priority:** Low.
- **Constraint, stated in the item:** it **expands no RFC-0010 semantics** —
  no new operation, no new intent field, no change to the authoring contract,
  no reparsing of YAML in Studio, and no change to canonical-source ownership.

The queue precedent for a non-RFC engineering item exists: the 2026-07-13
governance audit added three such items. This is the existing mechanism, used as
intended.

## 14. Board recommendation

### OPTION B — CLOSE M1 WITH REQUIRED FOLLOW-UP RECORD *(recommended)*

The implementation satisfies Milestone 1. Product acceptance stands as **Accepted
with follow-ups**, RFC-0010 evidence satisfies the accepted contract (§4),
protected boundaries are clean (§9), F1–F4 are non-blocking (§5), and health is
green (§8).

Governance nonetheless requires the accepted follow-ups to be **durably entered
in the queue before closure takes effect** (Governance Rule 4, §13). Closing the
milestone while its acknowledged defects live only in a review document would
leave them unscheduled by construction.

**Minimum record required before closure:** the **single** queue item described
in §13. **No implementation of F1–F4 is required** — no accepted criterion
demands it (§5).

**After Product Owner ratification** the state in §12 becomes true: Milestone 1
closed complete; both queue items drained; the four Phase 4 deliverables Done;
**Runtime logs unchanged at Not Started**; Phase 4 **open**; Milestone 2
**unopened**; the follow-up item **Not Started**.

**Main risk.** A follow-up item filed at closure can become a permanent
backlog entry nobody returns to. The Board accepts that risk over the
alternative — losing the findings entirely — and notes that F1 in particular
affects the reviewer's path to the artifact the architecture calls canonical.

### Why not Option A

Option A is defensible on the technical merits: every close criterion is met and
nothing requires the queue entry. The Board prefers B because the difference in
cost is one queue row, and the difference in outcome is whether four
Product-Owner-observed defects survive closure as tracked work. Rule 4 exists
for exactly this.

### Why not Option C

No finding violates an explicit accepted close criterion. §5 tested each against
normative text and found none engaged. Option C would require inventing a
requirement — for F1, by reading "immediately inspectable" as a reachability
obligation that the clause's own wording, the originating Board reasoning, and
ADR-0012 do not support. **The Board declines.**

## 15. Product Owner ratification statement

> I ratify the Board's recommendation on the Phase 4 Milestone 1
> implementation-close review: **Option B — close Milestone 1 with a required
> follow-up record.**
>
> **Before closure takes effect**, a single item is added to
> `IMPLEMENTATION_QUEUE.md` covering the four accepted follow-ups F1–F4
> (source-change navigation, stale success confirmation, projection-status copy,
> Escape cancellation), scoped to Studio, Not Started, and expanding no RFC-0010
> semantics. Implementation of those follow-ups is **not** required for closure.
>
> **Milestone 1 closure.** Phase 4 Milestone 1 — Governed Authoring is **closed
> complete**, on uncached executable conformance, held protected boundaries, and
> a recorded reviewer walkthrough whose disposition is *Accepted with
> follow-ups*. The Milestone-1 and RFC-0010 queue items are drained. The Phase 4
> deliverables *Genome document editor*, *Schema validation*, *Live preview* and
> *Organization tree* move to **Done**.
>
> **Phase 4 state.** Phase 4 **remains open**. Its opening authorized Milestone 1
> only; with Milestone 1 closed, **no Phase 4 milestone is authorized** until one
> is opened by a separate act.
>
> **Milestone 2 state.** Milestone 2 — durable runtime logs — **remains
> unopened**, unscoped and undesigned. `ROADMAP.md` *Runtime logs* stays **Not
> Started**. Closing Milestone 1 does not open it, and event persistence remains
> gated on its first consumer.
>
> **Follow-ups.** F1–F4 are recorded as non-blocking and carried by the single
> queue item above.
>
> **No subsequent roadmap work is authorized by this ratification** — not the
> Autonomy Substrate, not Office View, not Marketplace, not simulation, not
> persistence, not provider adapters, not triggers.

---

**Board recommendation: Option B — close Milestone 1 with a required follow-up
record.**

**Product Owner disposition: PENDING**

*(Not preselected. Nothing in this review is applied: Milestone 1 is not closed,
no roadmap item is Done, no queue item was added, and Milestone 2 is not
opened.)*
