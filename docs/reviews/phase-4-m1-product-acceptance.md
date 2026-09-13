# Phase 4 Milestone 1 — Governed Authoring: Product Acceptance Record

**Status: REJECTED — Product Owner acceptance performed 2026-09-13.**

The walkthrough was conducted. Most of Milestone 1 passed. Acceptance was
**rejected** on one blocking product failure: **authoring discoverability**
(§12). This is a *product-acceptance* rejection of Milestone 1. It is **not** a
rejection of the compiler/runtime architecture, and **not** a rejection of the
technical implementation of Checkpoints 1–7 — the passing evidence below stands
and remains valuable.

This document is the recorded reviewer walkthrough required by RFC-0009 §14.8
(Amendment 4) and by the Milestone-1 acceptance floor
(`IMPLEMENTATION_QUEUE.md`, Product Owner disposition 2026-09-12). It is
prepared by the Lead Engineer; §§1–11 are the evidence as prepared, preserved
unchanged. §12 records the Product Owner's disposition.

Nothing in this document marks Milestone 1 complete, drains the queue item, or
closes Phase 4.

---

## 1. Commit under review

| Field | Value |
|---|---|
| Repository | `hgarcialeon/genome-project` |
| Branch | `claude/fervent-hypatia-9ul9ed` |
| **Commit under review** | `4bc643dfb8d8375c74d3b2495e122ddf7bdf23a1` |
| Base of record | merged `main` at `5996adf` plus the Checkpoint-7 evidence commit |
| Date prepared | 2026-09-13 |

The commit under review contains the Rule 8 state reconciliation, the
Checkpoint-7 acceptance evidence, and the screenshots referenced below. The
health results in §10 were executed against that tree.

## 2. Governing documents

| Document | Bearing |
|---|---|
| `RFC/0009-phase-4-governed-authoring.md` | Accepted 2026-07-18 under Option B, four amendments applied |
| `docs/reviews/rfc-0009-board-review.md` | Board review; Product Owner ratification of Option B |
| **Amendment 2** (RFC-0009 §11) | Additive public application interfaces are not semantic changes |
| **Amendment 4** (RFC-0009 §10.1, §14.8) | Product acceptance is a recorded reviewer walkthrough, **not** a CI gate and **not** usability research |
| `IMPLEMENTATION_QUEUE.md` → Milestone-1 acceptance floor | WCAG 2.2 AA target; browser-first topology; direct package consumption; this record's required contents |
| `IMPLEMENTATION_QUEUE.md` → Milestone-1 portability authorization | One-time §11 compiler-boundary crossing, ratified 2026-09-13 |
| `docs/adr/0011-platform-neutral-compiler.md` | The accepted architectural property for that crossing |
| `docs/reviews/rfc-0009-m1-compiler-portability-board-review.md` | Board review recommending Option A; PO ratification recorded verbatim |

## 3. Canonical document and workflow

| Field | Value |
|---|---|
| Document | `SPEC/examples/genome-project.yaml` |
| Workflow | `rfc-lifecycle` (5 steps) |
| Gating policy | `policy:ratification` |
| Required principal | `human:product-owner` |
| Initiating principal | `human:operator` (Studio authenticates nobody; an operator assertion, shown rather than hidden) |
| Genome revision | `f86a6a1b0736bfba1b7c2b5209818740082b0e9fea0246f47201653f3074571b` |
| Graph | 19 nodes, 31 relationships |

The document is structure-only and **non-normative for governance** (RFC-0008
§1). The `rfc-lifecycle` run is a *projection of* governance, not an act *of*
it: it governs nothing in this repository, commits nothing, and changes no
project state (RFC-0009 §9).

## 4. The walkthrough sequence (RFC-0009 §7, binding)

Executed in this exact order, both as automated evidence and in the browser.

| # | Step | Expected |
|---|---|---|
| 1 | Open the canonical document | Organization Graph, tree and compilation state render from the compiler |
| 2 | Make a structural edit (add agent `technical-writer`) | Projections mark themselves **stale**; the old revision stays on screen and says so; run is refused |
| 3 | Compile | Graph and tree adopt the compiler's new output; new revision; stale marking clears |
| 4 | Restore the canonical document and compile | Back to revision `f86a6a1b…` |
| 5 | Run `rfc-lifecycle` with no grant | **Deny-safe park**: exactly one `approval.requested`, **zero** steps executed |
| 6 | Read the gate | Required principal `human:product-owner` and policy `ratification`, both traceable to the document |
| 7 | Grant as `human:product-owner` | `approval.granted`, attributed, recorded **before** the first step |
| 8 | Completion | 5 steps execute to `workflow.completed` |
| 9 | Inspect the event sequence | The ordered, attributed record; ephemeral |

**Observed event sequence** (14 events, rendered in the runtime's order):

```
approval.requested → approval.granted → workflow.started
→ agent.task.assigned → agent.task.completed   (×5)
→ workflow.completed
```

## 5. Evidence table — RFC-0009 §10.1 product success criteria

Three evidence columns, deliberately distinct. **Automated** and **Visual**
evidence are *inputs to* the walkthrough; they are necessary but **not
sufficient** and they are **not** acceptance (Amendment 4). Only the Product
Owner, performing the walkthrough item, can find a criterion met.

| # | §10.1 criterion | Automated evidence | Visual evidence | Product Owner walkthrough item |
|---|---|---|---|---|
| 1 | A new user understands the core value **without reading architecture docs** | *(none — not mechanizable)* | `01-compiled-organization.png`: organization name, mission, graph and tree are the first things on screen; the source document sits below them | Open the built Studio. Before scrolling, say what this product is for. Does the organization read first, and the file second? |
| 2 | An edit causes an **understandable graph update** connectable to the change | `acceptance.test.tsx` §2–3: stale marking appears on edit; after compile the rendered node set equals `graphTarget` output and contains exactly the added agent | `02-edited-stale-projection.png` (stale, old revision retained and marked) | Add an agent. Confirm the projection refuses to pretend, then compile and confirm you can point at what changed and why |
| 3 | The user can **explain why execution parked** (a real gate, not a UI pause) | `acceptance.test.tsx` §5: exactly one `approval.requested`, no `agent.task.assigned`, `completedSteps === 0` | `03-deny-safe-park.png`: "Parked — waiting for approval"; "Execution parked before any step ran… no timeout, no default, no inference"; Steps completed **0** | Run `rfc-lifecycle` without granting. In your own words, why did it stop, and who is holding it? |
| 4 | The **required principal and policy are visible** and traceable to the document | `acceptance.test.tsx` §5: `required-principal` contains `human:product-owner`; policy label and source both present and non-empty | `03-deny-safe-park.png`: "Approval required from `human:product-owner`", "Requested by policy **ratification**" | Find the required principal on screen, then find the line in the source document that put it there |
| 5 | The user can **identify who granted the approval** | `acceptance.test.tsx` §7: `granted-by` contains `human:product-owner`; grant index precedes first `agent.task.assigned` | `04-attributed-completion.png`: "#2 `approval.granted` — granted by `human:product-owner`"; "completed 5 steps after the approval by human:product-owner" | After granting, identify the grantor from the record alone — not from the button you pressed |
| 6 | The user understands the stream is **ephemeral** (a window, not a ledger) | Persistence tripwire: `execution.test.tsx` "persists nothing" asserts empty `localStorage`/`sessionStorage` and no `indexedDB.open` | `03`/`04`: "This stream is a window, not a ledger: it lives in this page only and is discarded with the session." | Reload the page. Confirm the run is gone, and that you expected it to be |
| 7 | Does **not** read as a generic YAML editor or generic workflow runner | *(none — not mechanizable)* | `01`–`05`: governance panel is framed as WAITING / ACTION / EVIDENCE, not start/stop | Having done the walkthrough: is this an organization tool, or a YAML editor with a run button? |

Criteria 1 and 7 have **no automated evidence by design** — they are
conviction judgements, and Amendment 4 places them with the Product Owner.

## 6. Accessibility evidence (acceptance floor: WCAG 2.2 AA target)

This is a **product acceptance target, not a claim of formal external
certification**.

| Floor requirement | Evidence |
|---|---|
| Keyboard operability for all essential interactions | `hardening.test.tsx` "runs, grants and discards without a single pointer event"; `a11y.test.tsx` "keeps every essential interaction reachable by keyboard"; `projections.test.tsx` tree "collapses and expands from the keyboard" |
| Visible focus | `contrast.test.ts` asserts focus-indicator styles in `styles.css` |
| Accessible names/labels for interactive controls | `a11y.test.tsx` "gives every interactive control an accessible name"; "names the workflow selector and the run control, and reflects their state" |
| AA contrast for essential UI and state indicators | `contrast.test.ts` computes contrast ratios from the shipped `styles.css` |
| Diagnostics/errors programmatically associated with content | `a11y.test.tsx` no-violations case with invalid source and diagnostics shown; `DiagnosticsPanel` wiring |
| No essential interaction pointer-only | as keyboard row above |
| Automated audit | `axe-core` run over five states — compiled, invalid source, parked, parked + stale, completed — with **no violations** (`a11y.test.tsx`) |
| Non-colour state communication | `execution.test.tsx` "communicates session state with text, not colour alone" |
| Focus management | `hardening.test.tsx` focus recovery when the grant control disappears; returns focus to Run after discard; never steals focus from the editor |

`axe-core` is an automated audit and does not by itself establish AA
conformance. The walkthrough item below is the acceptance evidence.

**Product Owner walkthrough item (accessibility):** complete the entire §4
sequence using only the keyboard — Tab, Shift+Tab, Enter/Space, and
Ctrl+Enter to compile. Confirm you always know where focus is.

## 7. Browser evidence and screenshot provenance

| Field | Value |
|---|---|
| Exercised artefact | the **built** Studio (`apps/genome-studio/dist`, `pnpm build`), served over a local static server — not a dev server, not a test renderer |
| Browser | headless **Chromium** (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) driven directly over CDP |
| Viewport | **1440 × 900**, `deviceScaleFactor: 2` (images are 2880 px wide) |
| Capture mode | full-page (`captureBeyondViewport`), so images are taller than the viewport |
| Commit rendered | `4bc643dfb8d8375c74d3b2495e122ddf7bdf23a1` |
| Document / workflow | `SPEC/examples/genome-project.yaml` / `rfc-lifecycle` |
| Reproduce with | `pnpm --filter @genome/studio build && node scripts/capture-acceptance-evidence.mjs` |

**Screenshots are evidence, not normative state.** The normative evidence is
the executable conformance in §10. Images may lag the code; the commit above is
what they show.

| File | State |
|---|---|
| `evidence/phase-4-m1/01-compiled-organization.png` | The canonical organization as opened — graph, tree, compilation state, revision |
| `evidence/phase-4-m1/02-edited-stale-projection.png` | After a structural edit, before compiling: projections marked stale, run refused |
| `evidence/phase-4-m1/03-deny-safe-park.png` | Deny-safe park showing policy `ratification`, required principal `human:product-owner`, 0 steps |
| `evidence/phase-4-m1/04-attributed-completion.png` | Completed run with the attributed grant and 5 steps |
| `evidence/phase-4-m1/05-event-record-expanded.png` | The whole ordered record with every event envelope expanded |

**Disclosure on image 05:** in the product the session stream is a scrolling
region (`.events__list`, capped at 22rem). For that image only, the capture
lifts the height cap so all 14 events fit one frame. No event content is
altered, reordered, or synthesized — only the container's height. Images 01–04
show the product's own unmodified layout.

The browser-first gate of the portability authorization is independently
re-evidenced by `@genome/browser-conformance` (§10), which bundles the accepted
packages for a browser with **no Studio-specific Node shims** and compares
results against Node.

## 8. Protected-boundary evidence (RFC-0009 §11)

Diffed from the RFC-0009 acceptance commit `ca8b01b` to the commit under review.

| Boundary | Result |
|---|---|
| No schema change (`SPEC/schema/genome.schema.json`) | **empty diff** ✅ |
| No language semantic change (`SPEC/language.md`) | **empty diff** ✅ |
| No production runtime semantic change (`packages/genome-runtime/src`) | **empty diff** ✅ |
| No new event types (`packages/genome-runtime/src/events`) | **empty diff** ✅ |
| No CLI surface change (`packages/genome-cli/src/index.ts`) | **empty diff** ✅ |
| No durable log reader | **absent** — no NDJSON/`--export-log`/`.jsonl` reference anywhere in `apps/genome-studio/src` ✅ |
| No persistence | **absent** — no `localStorage`/`sessionStorage`/`indexedDB`/`fs` write on any shipped path; asserted by `execution.test.tsx` "persists nothing" ✅ |
| No provider integration | **absent** — reference adapter only; no provider name in Studio ✅ |
| No trigger behavior | **absent** — explicit initiation only ✅ |
| No compiler semantic change (`packages/genome-compiler/src`) | **non-empty — and authorized** ⚠️ |

**On the one non-empty boundary.** The compiler diff is confined to the
portability work the Product Owner authorized on 2026-09-13 (Option A;
ADR-0011): `sha256.ts` (new, dependency-free), `revision.ts`, `index.ts`, and
the golden fixtures and tests that froze pre-change behavior first. Revision
derivation stays compiler-owned and normatively unchanged, `compile` stays
synchronous, no caller can inject the algorithm, and Studio reproduces no
compiler semantics. The permanent goldens
(`packages/genome-compiler/src/revision-goldens.test.ts`, committed literals,
no recomputation) and the Node↔browser conformance harness hold that property.
**No golden revision changed.**

`node:fs` appears in Studio only in `vite.config.ts` (build-time YAML inlining)
and `contrast.test.ts` (reads the stylesheet to compute ratios). Neither is a
shipped runtime path.

### Additive interfaces used (Amendment 2)

`startSession` gained an optional `clock?: () => string`, passed straight to the
accepted `createRuntime({ clock })` (RFC-0004; the CLI's `--clock`). The
Milestone-1 surface never sets it — Studio runs on the runtime's wall clock. It
exists so determinism evidence uses the **accepted** mechanism rather than
Studio normalizing events after the fact, and it mirrors the `failSteps` seam
already present. It adds no business semantics, reinterprets no output, and
owns no policy or workflow decision.

## 9. Known limitations and caveats

Recorded so acceptance is informed, not clean.

1. **Graph drawing clips horizontally at 1440 px.** In `03`/`04` the two policy
   nodes are cut off at the panel's right edge. Nothing is unreachable — GRAPH
   CONTENTS lists all 19 nodes and 31 relationships as text, and the accessible
   representation is complete — but the *drawing* does not fit this viewport.
   Cosmetic; no evidence depends on the clipped region.
2. **The session stream scrolls internally** (22rem cap), so at most ~3 events
   are visible at once without scrolling. See the image-05 disclosure in §7.
3. **Studio authenticates nobody.** Initiating as `human:operator` and granting
   as `human:product-owner` are *operator assertions*, recorded by the runtime
   as stated. This is correct for Milestone 1 (no identity deliverable is in
   scope) but means attribution is only as trustworthy as the operator.
4. **Screenshots are point-in-time.** They are not regenerated by CI and can
   drift from the code; §10 is the standing evidence.
5. **`axe-core` is not certification.** It catches a subset of WCAG failures.
6. **The `technical-writer` edit is illustrative.** It exercises the
   edit→stale→compile→projection path; it is not part of the canonical
   document and is reverted before the governed run.
7. **Milestone 2 is untouched.** No durable log, no persistence, no exported-log
   reader — by boundary, not by omission.

## 10. Repository health evidence

All re-executed **uncached from a clean state** (caches removed) at the commit
under review.

```
$ pnpm check-state
check-state: project state documents are consistent with the repository.

$ pnpm typecheck
 Tasks:    7 successful, 7 total
Cached:    0 cached, 7 total

$ pnpm test -- --force
@genome/adapter-reference   Test Files  1 passed (1)    Tests    7 passed (7)
@genome/browser-conformance Test Files  1 passed (1)    Tests   11 passed (11)
@genome/cli                 Test Files  1 passed (1)    Tests   44 passed (44)
@genome/compiler            Test Files  5 passed (5)    Tests   60 passed (60)
@genome/runtime             Test Files  1 passed (1)    Tests   18 passed (18)
@genome/schema              Test Files  1 passed (1)    Tests    4 passed (4)
@genome/studio              Test Files 10 passed (10)   Tests  110 passed (110)
                                                        TOTAL  254 passed (254)
 Tasks:    7 successful, 7 total
Cached:    0 cached, 7 total          <- uncached, as RFC-0009 §14 requires

$ pnpm build
@genome/studio:build: vite v6.4.3 building for production...
@genome/studio:build: 288 modules transformed
@genome/studio:build: dist/index.html                 0.40 kB
@genome/studio:build: dist/assets/index-*.css        11.29 kB
@genome/studio:build: dist/assets/index-*.js        300.32 kB
@genome/studio:build: ✓ built in 1.81s
 Tasks:    1 successful, 1 total
Cached:    0 cached, 1 total
```

## 11. Product Owner walkthrough checklist

To be performed by the Product Owner against the built Studio. Automated and
visual evidence above are inputs; this walkthrough is the acceptance.

Build and open:

```bash
pnpm install --frozen-lockfile
pnpm --filter @genome/studio build
pnpm --filter @genome/studio preview     # then open the printed URL
```

| # | Item | Criterion | Met? |
|---|---|---|---|
| 1 | Without reading any architecture doc, say what this product is for | §10.1.1 | ☐ |
| 2 | Add an agent. Watch the projections mark themselves stale, then compile and connect the graph change to your edit | §10.1.2 | ☐ |
| 3 | Run `rfc-lifecycle` without granting. Explain why it stopped | §10.1.3 | ☐ |
| 4 | Find the required principal and policy on screen, then find them in the source document | §10.1.4 | ☐ |
| 5 | Grant, then identify the grantor from the record alone | §10.1.5 | ☐ |
| 6 | Reload. Confirm the run is gone and that you expected that | §10.1.6 | ☐ |
| 7 | Judge whether this reads as an organization tool or a YAML editor with a run button | §10.1.7 | ☐ |
| 8 | Repeat the whole sequence using only the keyboard | Acceptance floor — WCAG 2.2 AA | ☐ |
| 9 | Review §9 known limitations and decide whether any blocks acceptance | — | ☐ |

## 12. Product Owner disposition

**Product Owner disposition: Rejected**

| Field | Value |
|---|---|
| Disposition | **Rejected** |
| Date | 2026-09-13 |
| Scope of rejection | Milestone 1 **product acceptance** only |
| Not rejected | the compiler/runtime architecture; the technical implementation of Checkpoints 1–7 |

Available dispositions were: Accepted · Accepted with follow-ups · **Rejected**.

### 12.1 Primary blocker

> Milestone 1 successfully demonstrates organization projection, compilation,
> and governed execution, but fails Governed Authoring product acceptance
> because a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

### 12.2 Secondary observation

> The primary visible actions are Run workflow and Compile now, causing Studio
> to communicate execution and compilation more strongly than organizational
> authoring.

### 12.3 Walkthrough observations

The Product Owner opened Studio without consulting architecture documentation.

Initial experience:

- the Organization tree was visible;
- the Organization Graph was visible and understandable as an organizational
  projection;
- Governance & Execution exposed workflows and allowed a workflow to run;
- governed execution was sufficiently discoverable to interact with.

However, the Product Owner did not understand what they were expected to do in
Studio beyond running a workflow, reporting:

> "I don't know what I'm doing in Studio or what it's for."

On further inspection this refined to a more specific finding: **the
visualization and governed-execution portions communicate useful behavior, but
organizational authoring is not discoverable.**

The canonical acceptance task requires adding an agent. The Product Owner could
not determine how to add an agent. After scrolling to SOURCE DOCUMENT, Studio
presented raw Genome YAML and a prominent "Compile now" action, but no
discoverable path explaining:

- where an agent belongs;
- what structure must be edited;
- what valid agent properties exist;
- how the source edit relates to the organization shown above.

Completing the canonical authoring task would therefore require prior knowledge
of the Genome language/schema, or external instruction.

**This is not to be reinterpreted as merely a documentation problem.**

### 12.4 Disposition of the evidence

The rejection is narrow. The record distinguishes:

**PASSING EVIDENCE** — accepted as demonstrated, and preserved:

| Area | Status |
|---|---|
| Organization projection (graph and tree) | ✅ passing |
| Compiler feedback / diagnostics | ✅ passing |
| Stale vs. current projection behavior | ✅ passing |
| Governed execution | ✅ passing |
| Deny-safe parking | ✅ passing |
| Required policy / principal visibility | ✅ passing |
| Explicit grant | ✅ passing |
| Attributed completion | ✅ passing |
| Ephemeral session behavior | ✅ passing |
| Accessibility and error-recovery evidence | ✅ passing |

**BLOCKING PRODUCT FAILURE**:

| Area | Status |
|---|---|
| Authoring discoverability | ❌ **blocking** |
| Performing the canonical "add an agent" task without external knowledge of the Genome source structure | ❌ **blocking** |

Against §5, this resolves the §10.1 criteria as: criterion 2 (understandable
graph update) passes *mechanically* but is **unreachable** for a first-time
user, because the edit that triggers it cannot be discovered; criteria 3–6 pass;
criteria 1 and 7 fail — the user could not say what Studio is for beyond running
a workflow, and the strongest visible actions read as execution and compilation
rather than authoring. The vertical slice did **not** fail as a whole.

### 12.5 Consequences

- Milestone 1 remains **In Progress**. It is **not** complete.
- The `IMPLEMENTATION_QUEUE.md` item remains **In Progress**. It is **not** Done.
- Phase 4 remains **open for Milestone 1 only**. It is **not** closed.
- No `ROADMAP.md` Milestone-1 deliverable moves to Done.
- Remediation requires **Architecture Board disposition before implementation**.
  No implementation is authorized by this rejection.

This rejection authorizes **nothing** beyond preparing a remediation proposal
for Board review. It does **not** authorize Milestone 2, the Autonomy
Substrate, Office View, or persistence.

### 12.6 Referred to the Architecture Board

The failure exposes an architectural gap rather than a defect: Genome has
accepted surfaces for *source → compiler → projections → governed execution*,
but none for *organizational intent → valid Genome document change*.

The remediation proposal is
`docs/proposals/phase-4-m1-authoring-remediation.md`; the Architecture Board
review is `docs/reviews/phase-4-m1-authoring-remediation-board-review.md`.
**Neither is ratified.** The next governance act is **Product Owner
ratification** of a Board-recommended option. No remediation implementation is
authorized before that.
