# Phase 4 Milestone 1 — Product Acceptance (Remediation Walkthrough)

**Status: ACCEPTED WITH FOLLOW-UPS — Product Owner walkthrough performed 2026-09-13.**

This is a **new** acceptance record, not an amendment of
`docs/reviews/phase-4-m1-product-acceptance.md`. That record's disposition
stands as **Rejected** and is not reused, reopened, or overwritten.

Prepared by the Lead Engineer under RFC-0009 §14.8 (Amendment 4) and RFC-0010
§14. §§1–8 and §§10–11 are the evidence as prepared; **§9 records the Product
Owner's disposition**.

The product-acceptance **gate passes**. Nothing here marks Milestone 1 complete,
drains a queue item, or closes Phase 4 — the milestone closes only through the
Board's implementation-close review.

---

## 1. The question this walkthrough answers

> Can a first-time user understand that Studio is for describing and operating a
> governed organization, and successfully **add an agent to Engineering without
> external instruction or prior knowledge of Genome YAML structure**?

The original rejection (`docs/reviews/phase-4-m1-product-acceptance.md` §12):

> Milestone 1 successfully demonstrates organization projection, compilation,
> and governed execution, but fails Governed Authoring product acceptance
> because a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

Secondary observation:

> The primary visible actions are Run workflow and Compile now, causing Studio
> to communicate execution and compilation more strongly than organizational
> authoring.

## 2. Commit under review

| Field | Value |
|---|---|
| Repository | `hgarcialeon/genome-project` |
| Branch | `claude/fervent-hypatia-9ul9ed` |
| **Commit under review** | `f149a7532fd1008c387e226554d2ba22e0c1ef2a` |
| Stage A | `4f68336` — `@genome/authoring` |
| Stage B | `9a11e13` — Studio integration |
| Date prepared | 2026-09-13 |

## 3. Governing documents

| Document | Bearing |
|---|---|
| `RFC/0010-semantic-authoring-operations.md` | Accepted 2026-09-13 under Option B, amendments A1–A12 applied |
| `docs/reviews/rfc-0010-board-review.md` | Board review; Product Owner ratification (§28) |
| `docs/adr/0012-semantic-authoring-boundary.md` | The durable `source → meaning` / `intent → source` split |
| `docs/reviews/phase-4-m1-product-acceptance.md` | The rejection this remediates — **still Rejected** |
| `RFC/0009-phase-4-governed-authoring.md` | Milestone 1; §10.1 criteria that must still pass |

## 4. What changed, and what deliberately did not

**Added.** A toolchain package `@genome/authoring` owning one operation,
`add-agent`; and in Studio, an **Add agent** control on each department in the
organization outline, a small form, and one line of framing text.

**Not changed.** The graph, the tree, the compilation-state machine, the runtime
session, the governance panel, the event stream, the grant flow, and the
error-recovery architecture. Checkpoints 1–7 stand as accepted evidence.

**The one lifecycle.** The authored source enters Studio through the *ordinary*
edit path. There is no authoring-specific compile path: the Checkpoint-2 state
machine marks projections stale, and the existing 400 ms debounce compiles it
exactly as it would after typing. Studio never updates graph or tree directly.

## 5. The walkthrough sequence

| # | Step | Expected |
|---|---|---|
| 1 | Open Studio | The organization reads first, and reads as something you can change |
| 2 | Find Engineering in the organization outline | Present, with its agents |
| 3 | Choose **+ Add agent** | A small form opens beneath Engineering; focus lands in the first field |
| 4 | Enter an id — say `technical-writer` | Id is marked required; role and autonomy are marked optional |
| 5 | Submit | The Genome source below changes; a confirmation names what was added |
| 6 | Read the source | Exactly two lines added; everything else, including the governance header, untouched |
| 7 | Wait, or press Compile now | Projections go stale, then current — the ordinary lifecycle |
| 8 | Read the graph and tree | `technical-writer` present, **because the compiler put it there** |

## 6. Evidence table — the remediation criterion

**Automated** and **visual** evidence are inputs. They are necessary and **not
sufficient**. Only the Product Owner, performing the walkthrough item, can find
a criterion met (RFC-0009 Amendment 4).

| # | Criterion | Automated evidence | Visual evidence | Product Owner walkthrough item |
|---|---|---|---|---|
| 1 | The user can recognize the organization is editable | `authoring.test.tsx` asserts the framing text and an Add agent control per department | `01-organization-is-editable.png` | Open Studio. Before scrolling, can you tell this organization can be changed? |
| 2 | **Add agent** is discoverable from the organization surface | The journey test locates the control by its department, never via the editor | `01`, `02` | Find where you would add someone to Engineering, without being told |
| 3 | An agent can be added **without Genome YAML knowledge** | The journey test enters only an id and a role — no document structure anywhere in the test's inputs | `02`, `04` | Add `technical-writer` to Engineering. Did you need to know where agents live in the file? |
| 4 | The resulting source is visible | Test asserts the editor holds exactly the returned source | `05-source-changed-and-stale.png` | After adding, find what changed in the document |
| 5 | The source remains canonical | Test asserts added lines are exactly the agent's, and the RFC-0008 disclaimer survives | `05` | Does the document still look like your document? |
| 6 | Projections go stale, then update **from the compiler** | Test compares rendered nodes to `graphTarget` output; E19 proves the ordinary debounce compiles it | `05` (stale) → `06` (compiled) | Watch the organization go stale and then catch up. Where did the new agent come from? |
| 7 | Failures are comprehensible | Duplicate and blank-id cases asserted with their wording | `03-conflict-refused.png` | Try adding `engineering-agent` again. Is the refusal clear? |
| 8 | Studio still communicates authoring, not only execution | *(not mechanizable)* | `01` | Having done the walkthrough: is this an organization tool now? |
| 9 | Governed execution still works | The Checkpoint 1–7 suites, unchanged and passing | prior record's `03`/`04` | Optionally run `rfc-lifecycle`, park, and grant as before |

## 7. Accessibility evidence (WCAG 2.2 AA floor, both paths)

| Requirement | Evidence |
|---|---|
| Focus enters the interaction on open | `authoring.test.tsx`; asserted against `document.activeElement` |
| Focus returns to the opening control on cancel | `authoring.test.tsx` — this caught a real bug: the opener was held as a DOM node that Preact discards, and is now located by a stable id |
| Focus moves to the confirmation on success | `authoring.test.tsx`; never stranded when the form disappears |
| Errors announced, not focus-stealing | `role="alert"`, asserted; focus stays on the field being corrected |
| Errors programmatically associated | `aria-invalid` + `aria-describedby` → the error region's id, asserted |
| Required vs optional explicit | `aria-required`, visible `(required)` / `(optional)`, asserted |
| Accessible names | Every field has a `<label for>`; the form is `aria-label`ed with its department; asserted |
| Keyboard-only completion | Whole journey driven by keyboard alone in `authoring.test.tsx` |
| Axe clean | `a11y.test.tsx` — form open, failure shown, and after a successful change |
| Contrast | New surfaces reuse existing tokens; `contrast.test.ts` unchanged and passing |
| Native controls | `<form>`, `<input>`, `<select>`, `<button>` — no custom widgets |

**Product Owner walkthrough item:** complete the whole §5 sequence using only
the keyboard.

## 8. Known limitations and caveats

1. **The stale window is brief.** With the accepted 400 ms auto-compile, the
   stale state after an authoring change lasts about 400 ms — exactly as after
   typing. This is the ratified A10 consequence, not an oversight; screenshot
   `05` is captured immediately and asserts staleness so the image is honest.
   If you want stale to persist until an explicit compile, that is a change to
   the Checkpoint-2 lifecycle **for all edits** and a separate decision.
2. **One operation only.** `add-agent`, department-scoped. No edit, no delete, no
   workflow, no policy, no team placement. The point is to prove the authoring
   model, not to build a no-code editor.
3. **Optional stays optional.** The form does not require a role, because Genome
   does not. An agent with neither role nor autonomy is valid today, and the
   toolchain must not be stricter than the language.
4. **Formatting normalization is disclosed, not hidden.** CRLF line endings and
   mixed indentation are normalized; the canonical example is unaffected and its
   diff is exactly the added lines. Tested and documented rather than promised
   away.
5. **Graph drawing still clips horizontally at 1440 px** — unchanged from the
   prior record; all nodes remain listed as text.
6. **Studio still authenticates nobody** — unchanged from the prior record.
7. **The organization column was widened** from 200 px to 260 px so a labelled
   form fits. This is the only presentation change to an existing surface.

## 9. Product Owner disposition

**Product Owner disposition: Accepted with follow-ups** — 2026-09-13.

| Field | Value |
|---|---|
| Disposition | **Accepted with follow-ups** |
| Date | 2026-09-13 |
| Result | **The M1 product acceptance gate PASSES** |
| Blocker status | The §12.1 rejection blocker is **resolved** |
| Follow-ups | F1–F4, **non-blocking** — see the acceptance record §13.7–§13.8 |

The full walkthrough observations, the follow-ups, and the close-criterion
analysis are recorded in `docs/reviews/phase-4-m1-product-acceptance.md` §13,
appended to the original rejection rather than replacing it.

In summary: the reviewer discovered `+ Add agent` directly under Engineering on
the initial surface, added `po-review-agent` with no optional fields, and the
source changed by exactly `po-review-agent: {}`. The ordinary lifecycle was
observed — stale, Run disabled, automatic compilation, current — with **no
explicit Compile required**. The compiler-derived graph moved 19/31 → 20/32 and
the tree showed the agent. Governed execution still parked deny-safe for
`human:product-owner` with zero steps, and invalid YAML blocked new execution
while the running session stayed bound to its own revision. **No YAML knowledge
was required at any point.**

This disposition is **not** a new architecture finding against RFC-0010.

## 10. Screenshot provenance

| Field | Value |
|---|---|
| Exercised artefact | the **built** Studio (`pnpm build`), served locally — not a dev server, not a test renderer |
| Browser | headless **Chromium** (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) over CDP |
| Viewport | **1440 × 900**, `deviceScaleFactor: 2` |
| Capture | full-page; each state **asserted before capture** |
| Commit rendered | `f149a7532fd1008c387e226554d2ba22e0c1ef2a` |
| Document | `SPEC/examples/genome-project.yaml` |
| Reproduce | `pnpm --filter @genome/studio build && node scripts/capture-authoring-evidence.mjs` |

Screenshots are evidence, **not normative state**; §11 is the standing evidence.

| File | State |
|---|---|
| `evidence/phase-4-m1-remediation/01-organization-is-editable.png` | The organization on open, with Add agent available per department |
| `evidence/phase-4-m1-remediation/02-add-agent-form.png` | The form open beneath Engineering |
| `evidence/phase-4-m1-remediation/03-conflict-refused.png` | A duplicate refused, in the organization's terms |
| `evidence/phase-4-m1-remediation/04-intent-entered.png` | A valid intent entered |
| `evidence/phase-4-m1-remediation/05-source-changed-and-stale.png` | Source changed; projections stale (asserted at capture) |
| `evidence/phase-4-m1-remediation/06-compiled-projections.png` | Compiled by the ordinary debounce; the agent in graph and tree |

## 11. Repository health and RFC-0010 evidence

```
$ pnpm check-state
check-state: project state documents are consistent with the repository.

$ pnpm typecheck
 Tasks:    8 successful, 8 total     Cached: 0 cached, 8 total

$ pnpm test -- --force
@genome/adapter-reference     Tests    7 passed (7)
@genome/authoring             Tests   37 passed (37)   <- RFC-0010 E1-E19
@genome/browser-conformance   Tests   11 passed (11)
@genome/cli                   Tests   44 passed (44)
@genome/compiler              Tests   60 passed (60)
@genome/runtime               Tests   18 passed (18)
@genome/schema                Tests    4 passed (4)
@genome/studio                Tests  128 passed (128)  <- incl. 14 authoring
                              TOTAL  309 passed (309)
 Tasks:    8 successful, 8 total     Cached: 0 cached, 8 total   <- uncached

$ pnpm build
@genome/studio:build: vite v6.4.3 building for production... built in 1.46s
 Tasks:    1 successful, 1 total     Cached: 0 cached, 1 total
```

**Protected boundaries**, diffed from the pre-implementation commit `620e7f8`:
`SPEC/schema/genome.schema.json`, `SPEC/language.md`,
`packages/genome-compiler/src` (including `diagnostics.ts` byte-unchanged),
`packages/genome-runtime/src`, the event taxonomy, `packages/genome-cli/src`,
`packages/genome-adapter-reference/src` and `packages/genome-schema/src` — **all
empty**. No persistence, no exported-log reader, no provider integration, no
trigger behavior.
