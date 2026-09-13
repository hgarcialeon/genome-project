# Phase 4 Milestone 1 — Governed Authoring: Implementation-Close Packet

**Status: PREPARED for Architecture Board implementation-close review. Milestone
1 is NOT closed.**

Prepared 2026-09-13 by the Lead Engineer. This packet assembles everything the
Board needs to hold the close review. **It closes nothing**: no milestone is
marked complete, no queue item is drained, no `ROADMAP.md` deliverable moves to
Done, and Phase 4 is not closed. Those are the Board's acts, followed by Product
Owner ratification.

Current project state lives in `PROJECT_STATE.md` (Governance Rule 8).

---

## 1. What is being closed

**Phase 4 Milestone 1 — Governed Authoring**, authorized by
`RFC/0009-phase-4-governed-authoring.md` (Accepted 2026-07-18, Option B, four
amendments), and remediated under
`RFC/0010-semantic-authoring-operations.md` (Accepted 2026-09-13, Option B,
amendments A1–A12) with `docs/adr/0012-semantic-authoring-boundary.md`.

RFC-0009 §14 requires **both** uncached executable conformance **and** a recorded
reviewer-walkthrough product acceptance. Both are now present. The first
walkthrough **rejected** the milestone; the second, after remediation,
**accepted it with follow-ups**.

## 2. The original rejection — preserved, not erased

Product Owner acceptance, 2026-09-13, disposition **Rejected**
(`docs/reviews/phase-4-m1-product-acceptance.md` §12).

**Primary blocker, as recorded:**

> Milestone 1 successfully demonstrates organization projection, compilation,
> and governed execution, but fails Governed Authoring product acceptance
> because a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

**Secondary observation:**

> The primary visible actions are Run workflow and Compile now, causing Studio
> to communicate execution and compilation more strongly than organizational
> authoring.

That record is **append-only**. §§1–12 stand exactly as written at rejection;
§13 appends the remediation walkthrough. The Board is asked to close a milestone
that **failed its first acceptance**, and the packet says so plainly.

### 2.1 What passed even then

Organization projection, compiler feedback, stale/current behavior, governed
execution, deny-safe parking, policy and principal visibility, explicit grant,
attributed completion, ephemeral session behavior, and the
accessibility/error-recovery evidence. The vertical slice did not fail as a
whole.

## 3. The remediation decision

The rejection exposed an **architectural gap**, not a defect: Genome had accepted
surfaces for `source → meaning` and none for `intent → source`. Studio was
correct to own no language semantics and therefore could not author.

| Act | Record |
|---|---|
| Remediation proposal | `docs/proposals/phase-4-m1-authoring-remediation.md` |
| Board review (Options A–E) | `docs/reviews/phase-4-m1-authoring-remediation-board-review.md` |
| Product Owner ratification | Option C + amendments A1–A8, 2026-09-13 (§8 of that review) |
| Commissioned RFC | `RFC/0010-semantic-authoring-operations.md` |
| RFC Board review | `docs/reviews/rfc-0010-board-review.md` — every material claim re-executed |
| RFC ratification | Option B + amendments A1–A12, 2026-09-13 (§28) |
| Architectural property | `docs/adr/0012-semantic-authoring-boundary.md` |

**The ratified direction:**

```
user organizational intent → Studio interaction
  → toolchain-owned semantic authoring capability
  → canonical Genome source → existing compiler → projections / runtime
```

The Board review found and corrected three defects in the RFC draft before
acceptance: an unachievable preservation contract (measured — a no-edit
round-trip differed on 100 lines), a diagnostics model that would have forced a
compiler production diff the RFC's own boundary forbade, and a duplicate-agent
rationale attributing to Genome a uniqueness semantic it does not have.

## 4. Implementation evidence

Delivered in two stages; Stage A was independently green before Stage B began.

| Stage | Commit | Content |
|---|---|---|
| A | `4f68336` | `@genome/authoring` — `add-agent` only |
| B | `9a11e13` | Minimal Studio integration |
| Evidence | `f149a75` | Acceptance evidence + Rule 8 reconciliation |
| Pin | `c316e73` | Commit-under-review and health pinned into the record |

**`@genome/authoring`.** `applyAddAgent(source, intent) → AuthoringResult`.
Source text in, canonical source out. Pure — no I/O, no browser or server
dependency, no Studio dependency, input never mutated. A named function, not a
dispatcher: a second operation is a governed decision, not a parameter.

**Order of work:** the input must already compile (`invalid-source`, compiler
diagnostics verbatim) → the intent must be well-formed (`invalid-intent`) → it
must apply to *this* document (`conflict`) → a candidate is produced → the
candidate must compile (`invalid-result`, compiler diagnostics verbatim). No
failure result carries a `source` field, so misuse is a type error.

**Studio.** `+ Add agent` on each department in the organization outline. The
returned source enters through the ordinary edit path; the Checkpoint-2 machine
marks projections stale; the existing 400 ms debounce compiles it. Studio never
touches graph or tree and predicts no revision.

### 4.1 RFC-0010 E1–E19 — verified against the implementation

All green, uncached. Verified by direct inspection as well as by the browser
walkthrough, as the Product Owner required:

| Claim | Verification |
|---|---|
| Studio calls `@genome/authoring` for `add-agent` | `app.tsx:35` imports `applyAddAgent`; `app.tsx:215` is the only call site |
| Studio contains no semantic YAML mutation | Zero matches for a `yaml` import, `YAML.parse`, `parseDocument` or `YAML.stringify` anywhere in Studio production source; E12 scans for these plus hand-built fragments and encoded placement rules |
| The ordinary 400 ms edit lifecycle is used | `app.tsx` has one compile effect, keyed on `state.status === "editing"` and `autoCompileDelayMs`; the authoring result flows through `editSource` |
| No authoring-specific compile path exists | E19 asserts the default debounce alone brings projections current after authoring |
| Graph/tree changes originate from compiler outputs | Both render from `state.lastSuccessful`; E12 forbids setting a projection from an authoring result |
| Authoring never derives `genomeRevision` | Zero occurrences of `revision` in the package's production source; E13 asserts the result exposes none and that Studio predicts none |

**Test counts:** `@genome/authoring` 37 (E1–E18); `@genome/studio` 128, of which
14 are the authoring journey and tripwires and 18 the accessibility floor.

## 5. The repeated Product Owner walkthrough

Performed 2026-09-13 against commit `f149a75`. Recorded in full at
`docs/reviews/phase-4-m1-product-acceptance.md` §13 and
`docs/reviews/phase-4-m1-product-acceptance-remediation.md` §9.

- `+ Add agent` was **discoverable directly under Engineering** on the initial
  organization surface.
- The form focused the agent-id field automatically; empty and duplicate values
  were rejected with understandable messages.
- `po-review-agent` was added with **no optional fields**, and the source changed
  by **exactly `po-review-agent: {}`** — the deny-safe `autonomy` default was not
  materialized.
- The ordinary lifecycle was observed: source updated → projections stale → Run
  disabled → automatic compilation → current. **No explicit Compile was
  required.**
- The compiler-derived graph moved **19 nodes / 31 relations → 20 / 32**; the
  tree showed the new agent.
- Governed execution still worked: `rfc-lifecycle` parked deny-safe awaiting
  `human:product-owner` with **zero** steps executed.
- Invalid YAML blocked new execution while the running session stayed bound to
  its original revision and showed the existing divergence warning.

**No YAML knowledge was required at any point.** The rejected criterion is
satisfied.

## 6. Disposition

**Product Owner disposition: Accepted with follow-ups** (2026-09-13).

**The Milestone-1 product-acceptance gate PASSES.** The §12.1 blocker is
resolved. This is a remediation of the original rejection, not a new
architecture finding against RFC-0010.

## 7. Remaining findings — F1–F4, all non-blocking

| # | Pri | Finding | Scope |
|---|---|---|---|
| F1 | P2 | **Source-change navigation.** After authoring, the canonical source is available and editable but far from the interaction (~2814 px down, 583 px viewport). Add a discoverable *"View change in source"* action that navigates/focuses the source area. | Studio navigation only. No second representation; no change to canonical-source ownership. |
| F2 | P2 | **Stale success confirmation.** After the added agent was removed by a later source edit, the UI still showed "Added po-review-agent…". Clear the confirmation when the source changes again, using existing source/edit state. | **Not** by reparsing YAML in Studio. |
| F3 | P3 | **Projection-status copy.** "Everything below was compiled…" is ambiguous about what "below" means. Name the projections explicitly. | Copy only; no semantic change. |
| F4 | P3 | **Escape cancellation.** Cancel works and restores focus; Escape does not close the form. Add it, preserving focus restoration, keyboard-only operation, and no mutation on cancel. | Interaction polish; no new authoring semantic. |

### 7.1 Close-criterion analysis

Assessed against **accepted criteria**, not severity labels — RFC-0009 §10.1 and
§14, RFC-0010 §13 and §14, the Milestone-1 acceptance floor, and RFC-0009 §3.

**None of F1–F4 violates an explicit accepted close criterion.** The Lead
Engineer's recommendation is **option B — non-blocking follow-ups**; the
milestone is not held open for polish. The full clause-by-clause table is at
`docs/reviews/phase-4-m1-product-acceptance.md` §13.8. In summary:

- **F1** — RFC-0010 §9.2 / A11 requires the source be "immediately inspectable"
  and not hidden or replaced. The source is present, visible, editable and
  named by the confirmation. **This is the closest call**, and the Board should
  decide it explicitly: if "immediately" carries a *reachability* obligation
  rather than only a *non-concealment* one, F1 becomes a close blocker and this
  recommendation should be overturned. The Lead Engineer does not so find, and
  flags the ambiguity rather than burying it.
- **F2** — RFC-0009 §3's "second source of truth" prohibition and the
  Checkpoint-2 invariant are stated over the document and over **projections**;
  projections behaved correctly, and nothing in the system consumes the
  confirmation. A stale *message*, not a competing source of truth — a real
  defect, but not a criterion breach.
- **F3** — status copy, not a diagnostic; the accessibility floor's association
  requirement is not engaged.
- **F4** — the floor requires keyboard operability and no pointer-only essential
  interaction; Cancel satisfies both. **WCAG 2.2 AA contains no Escape-dismissal
  success criterion**, and SC 2.1.2 (No Keyboard Trap) is satisfied.

## 8. Repository health — uncached, from clean

```
$ pnpm check-state
check-state: project state documents are consistent with the repository.

$ pnpm typecheck
 Tasks:    8 successful, 8 total     Cached: 0 cached, 8 total

$ pnpm test -- --force
@genome/adapter-reference     Tests    7 passed (7)
@genome/authoring             Tests   37 passed (37)    <- RFC-0010 E1-E18
@genome/browser-conformance   Tests   11 passed (11)    <- Node <-> browser, real Chromium
@genome/cli                   Tests   44 passed (44)
@genome/compiler              Tests   60 passed (60)
@genome/runtime               Tests   18 passed (18)
@genome/schema                Tests    4 passed (4)
@genome/studio                Tests  128 passed (128)   <- incl. 14 authoring, 18 a11y
                              TOTAL  309 passed (309)
 Tasks:    8 successful, 8 total     Cached: 0 cached, 8 total

$ pnpm build
@genome/studio:build: vite v6.4.3 building for production... built
 Tasks:    1 successful, 1 total     Cached: 0 cached, 1 total
```

**Browser conformance** (`@genome/browser-conformance`, 11/11) bundles the
accepted packages for a browser with no Studio-specific Node shims and compares
against Node — the ADR-0011 property still holds.

## 9. Protected-boundary evidence

Diffed from `620e7f8`, the last commit before any RFC-0010 implementation:

| Boundary | Result |
|---|---|
| `SPEC/schema/genome.schema.json` | **empty** |
| `SPEC/language.md` | **empty** |
| `packages/genome-compiler/src` | **empty** — including `diagnostics.ts` byte-unchanged, so the `Diagnostic` / `CompileStage` contract is untouched (A8) |
| `packages/genome-runtime/src` | **empty** |
| `packages/genome-runtime/src/events` | **empty** |
| `packages/genome-cli/src` | **empty** |
| `packages/genome-adapter-reference/src` | **empty** |
| `packages/genome-schema/src` | **empty** |
| Revision derivation / canonicalization | **unchanged** — ADR-0011 not reopened |
| Persistence | **absent** |
| Exported-log reader | **absent** |
| Provider integration | **absent** |
| Trigger behavior | **absent** |

The only production additions are the new package and the Studio authoring
surface. The one presentation change to an existing surface is the organization
column widening from 200 px to 260 px.

### 9.1 Language Complexity Budget, as shipped

**New capability (5):** semantic operation `add-agent`; document-transformation
contract; public toolchain surface; maintained package; Studio authoring
interaction.

**Unchanged (zero on all):** Genome syntax, language semantics, Genome fields,
schema semantics, compiler semantics, runtime, events, revision, governance,
persistence.

## 10. Milestone 2 remains unopened

**Milestone 2 (durable runtime logs) is not opened, not scoped, and not
designed.** RFC-0009 §12 records it as a later Phase 4 milestone requiring its
own RFC; event persistence remains gated on its first consumer. Nothing in this
packet or in RFC-0010 touches it.

Equally unopened: the **Autonomy Substrate** (Phase 5), **Office View**,
**Marketplace**, and **simulation**.

## 11. What the Board is asked to decide

Whether Phase 4 Milestone 1 — Governed Authoring is **complete**, on:

1. uncached executable conformance (§8) — RFC-0009 §14 items 1–7;
2. the recorded reviewer walkthrough (§5) — RFC-0009 §14 item 8, Amendment 4;
3. protected boundaries held (§9);
4. the disposition of F1–F4 (§7.1) — the Board may accept the non-blocking
   recommendation, or find F1 a close blocker under RFC-0010 §9.2.

If the Board recommends closure and the Product Owner ratifies, then and only
then: the Milestone-1 and RFC-0010 queue items drain, the Phase 4 roadmap
deliverables move to Done, and `PROJECT_STATE.md` reconciles. **None of that is
done here.**

## 12. Governance state at packet time

- Milestone 1: **In Progress** — product acceptance passed, close review pending.
- Queue items: Milestone 1 **In Progress**; RFC-0010 **In Progress**.
- Phase 4: **open for Milestone 1 only**.
- `ROADMAP.md`: no Phase 4 deliverable is **Done**.
- Blockers: **none open**.

**Board disposition: PENDING**
