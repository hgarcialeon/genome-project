# Phase 0–3 Reconciliation — Architecture Board Review Packet

- **Process:** `docs/GOVERNANCE.md` → Phase Transition Review (Product
  Owner · Chief Architect · Lead Engineer)
- **Date prepared:** 2026-07-13
- **Status:** **Decided 2026-07-13** — see
  `docs/reviews/phase-0-3-board-review.md` (Outcome B, amended; ratified
  by the Product Owner). This packet is preserved as the reviewed
  proposal; the decision record and applied conditions live in the board
  review document.
- **Source:** branch `claude/project-principles-audit-lwif7s` (2026-07-13
  governance audit and alignment); evidence verified by `pnpm test`
  (73 passing), `pnpm typecheck`, and `pnpm check-state`.

This is the first application of the phase transition review defined in
`docs/GOVERNANCE.md`. It covers Phases 0–3 retrospectively, because those
phases' deliverables landed before the review process existed.

## 1–2. Evidence and proposed classification, per deliverable

Classifications proposed here use the governance vocabulary: **Done**
(executable or explicitly documented evidence), **Deferred** (queue entry
exists), **De-scoped** (stated reason). No Phase 0–3 deliverable is
proposed as Deferred.

### Phase 0 — Foundation

| Deliverable | Proposed | Evidence |
|-------------|----------|----------|
| Repository structure | Done | Tree in `README.md` matches the repository; top-level entries verified mechanically by `scripts/check-state.mjs`, nested entries by inspection |
| README | Done | `README.md` |
| VISION | Done | `docs/VISION.md` |
| Constitution | Done | `docs/CONSTITUTION.md` |
| Architecture Charter | Done | `docs/ARCHITECT.md` |
| Governance Model | Done | `docs/GOVERNANCE.md` |
| Bootstrap Protocol | Done | `docs/BOOTSTRAP.md` |
| Project State | Done | `PROJECT_STATE.md` (single source of truth per Governance Rule 8) |
| Implementation Queue | Done | `IMPLEMENTATION_QUEUE.md` |
| RFC-0000 | Done | `RFC/0000-genome.md` |
| RFC-0001 | Done | `RFC/0001-language.md` |
| RFC-0002 draft | Done | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` |
| Genome Language v0.1 | Done | `SPEC/language.md` |
| JSON Schema v0.1 | Done | `SPEC/schema/genome.schema.json` |
| Example company.yaml | Done | `SPEC/examples/company.yaml`; validates via the success criterion below |
| CLI validate command | Done | `packages/genome-cli`; exit codes now tested at the CLI boundary (`packages/genome-cli/src/cli.test.ts`) |

Phase 0 success criterion (`genome validate SPEC/examples/company.yaml`)
executed 2026-07-13: exit 0, "valid Genome document".

### Phase 1 — Genome Compiler

| Deliverable | Proposed | Evidence |
|-------------|----------|----------|
| Compiler pipeline | Done | RFC-0002 Stages 1–5 in `packages/genome-compiler/src/index.ts`; revision derivation at Stage 5 per ADR-0005 |
| AST model | Done | `packages/genome-compiler/src/ast/index.ts`; optional source spans per ADR-0003 |
| Semantic validation | Done | `packages/genome-compiler/src/semantics/index.ts`; full v0.1 set incl. `appliesTo` and owner edges (RFC-0003 preconditions) |
| Organization Graph | Done | `packages/genome-compiler/src/graph/index.ts`; plain adjacency list per ADR-0003 |
| Compilation targets | Done | `packages/genome-compiler/src/targets/` — inspect, graph, docs, runtime-model (RFC-0004), diff (RFC-0005); fixed set per ADR-0003 |
| Compiler tests | Done | 36 tests: `compiler.test.ts` (19), `runtime-model.test.ts` (9), `diff.test.ts` (8), with valid and invalid fixtures |

### Phase 2 — CLI & Schema

| Deliverable | Proposed | Evidence |
|-------------|----------|----------|
| genome validate | Done | CLI-boundary tests: exit 0 valid / 1 invalid, malformed YAML, unreadable path |
| genome inspect | Done | CLI-boundary tests incl. the `--json` InspectReport contract |
| genome diff | Done | CLI-boundary tests: diff(1) exit codes 0/1/2 (ADR-0006), formatting-only change → identical, DiffReport JSON contract |
| genome graph | Done | CLI-boundary test: nodes/edges JSON |
| TypeScript types generated from schema | **De-scoped** (ratification requested — see below) | Never implemented; no RFC/ADR ever adopted it |
| Valid and invalid fixtures | Done | `__fixtures__` directories in all three tested packages plus `packages/genome-cli/src/__fixtures__` |

Evidence note: until 2026-07-13 the CLI commands were declared Done with
no test exercising the CLI boundary; `packages/genome-cli/src/cli.test.ts`
(16 tests) closed that gap. The Definition-of-Done checkmarks recorded in
the RFC-0005 board decision were accurate about behavior but ahead of
their evidence; this is recorded transparently in `PROJECT_STATE.md`.

### Ratification requested: schema-to-TypeScript code generation

The Board is asked to ratify the following disposition, recorded
provisionally in `ROADMAP.md`:

> De-scoped from the current roadmap; may be reconsidered through a future
> RFC if schema-driven public SDK types become a concrete requirement.

Reasoning: the deliverable predates RFC-0002, which made the hand-written
AST in `packages/genome-compiler` the typed representation of a Genome
document, and ADR-0002 directs every consumer to compiled artifacts rather
than raw document shapes. A generated raw-document type set would today
have no consumer and would create a second typed source of truth able to
drift from the AST — the exact failure mode this reconciliation exists to
eliminate. No accepted decision is contradicted by de-scoping; reopening
it (e.g. for a public SDK) requires an RFC per ADR-0003's precedent of
gating on a real external consumer.

### Phase 3 — Runtime Prototype

| Deliverable | Proposed | Evidence |
|-------------|----------|----------|
| Runtime model intake (per RFC-0003) | Done | `runtimeModelTarget` in the compiler; `packages/genome-runtime` consumes only the `RuntimeModel` |
| Agent lifecycle | Done | Task assignment/completion/failure through the provider-adapter seam (`AgentAdapter`), RFC-0004 §execution |
| Event bus | Done | Append-only `EventLog` with sequential ids and subscribe hook, `packages/genome-runtime/src/log/index.ts` |
| Workflow execution | Done | Explicit initiation, autonomy/policy gates, sequential steps, halt/resume, drain adoption — `packages/genome-runtime/src/runtime/index.ts` |
| Human approval stub | Done | Exceeds "stub": deny-safe approvals matched by `runId`, intrinsic `human:*` floor, attributable control events (RFC-0004/ADR-0005) |
| Activity log | Done | The event log is the activity log; `state() == replay(log)` holds by construction; 17 tests |

## 3. Phase 3: active versus complete

These are different claims, and the Board should rule on them separately:

- **Phase 3 active** (the present state, asserted by `PROJECT_STATE.md`):
  Phase 3 is the project's current phase. Every roadmap deliverable in its
  table has landed *as scoped by RFC-0003/RFC-0004*, but the phase has not
  been closed, and further runtime-adjacent work (reference adapter,
  execution CLI, event persistence) could still be scoped into Phase 3 by
  a new RFC if the Board wishes.
- **Phase 3 complete** (what this review could, but need not, conclude):
  the Board judges the phase goal — *"execute a simple organization from a
  Genome file"* — satisfied by the delivered scope, closes the phase, and
  assigns all remaining runtime-adjacent work to later phases.

The repository evidence establishes "all deliverables landed." Whether
that equals "complete" is a judgment about the goal sentence, not about
the table — because of the gap documented next.

## 4. Phase 3 acceptance criteria that remain incomplete

The deliverable table is fully Done, but the phase goal sentence is only
partially demonstrable today:

1. **Execution is demonstrable only in-process with an injected adapter.**
   The runtime test suite compiles a Genome document, builds its
   `RuntimeModel`, and drives workflows to completion — but through a test
   adapter. No provider adapter ships; this was an explicit RFC-0004
   non-goal, not an omission.
2. **No user-facing execution surface exists.** There is no `genome run`
   command; the roadmap never promised one, but a reader of the goal
   sentence would expect the demonstration to be invocable.
3. **The activity log is in-memory only.** Event persistence was an
   RFC-0004 non-goal; a restarted runtime has an empty log.
4. **Trigger auto-initiation is absent by decision, not by gap** —
   ADR-0005 pinned explicit initiation as the only v0.1 initiation path.
   Listed for completeness; no action implied.

Items 1–3 are the delta between the deliverable table and the goal
sentence. Because each was declared out of scope by an *accepted* RFC,
they are not unmet deliverables — but the Board must decide which side of
the Phase 3 boundary they fall on. That decision determines whether
Phase 3 closes now or stays active.

## 5. Recommended next architectural objective

**Recommendation (for decision, not decided): an RFC for a reference
provider adapter plus a `genome run` CLI command.**

Rationale: the adapter seam is the one shipped contract with no real
consumer — exactly the situation ADR-0003 treats as the trigger for the
next increment ("gated on a real external consumer"), and the Architecture
Charter prefers examples before abstractions. A minimal reference adapter
would prove the seam, close the Phase 3 goal-sentence gap end-to-end, and
de-risk every later phase that builds on runtime events (Studio's runtime
logs, Office View's event-driven animations, the Phase 6 loop) — all
without UI investment.

Alternative if the Board prioritizes product visibility: the Phase 4
Studio RFC. Either choice enters work through the queue via its RFC; this
packet deliberately does not advance the phase.

## 6. State changes to apply after Board approval

To be applied only after the Board records its decision in this document
(votes and outcome appended per house style). Two prepared outcomes;
apply exactly one.

### Outcome A — Phases 0–2 closed; Phase 3 closed as scoped

`PROJECT_STATE.md`:

- Replace the Current Phase section body with:
  "Phase 3 — Runtime Prototype (closed <decision date> by the Phase 0–3
  transition review, `docs/reviews/phase-0-3-reconciliation.md`). The next
  phase opens with its RFC; see Current Milestone."
- Current Milestone → "The next phase's RFC: <the Board's §5 choice>."
- Current Objective → "Draft and review the RFC named in Current
  Milestone."
- Current Blockers → "None."
- Active Architectural Decision → "None open; next is the RFC named in
  Current Milestone."
- Next Expected Deliverable → "The RFC named in Current Milestone, then
  its queue items."
- Explicitly Out of Scope → drop "pending ratification" phrasing from the
  schema-codegen line; cite this review as the ratifying decision.

`IMPLEMENTATION_QUEUE.md`:

- Flip "Phase 0–3 transition reviews (incl. schema-codegen de-scope
  ratification)" to **Done**.
- Add: "| High | <chosen next RFC> draft and Board review | Phase 0–3
  review | Architecture Board | Not Started |".

Consequential (for coherence, same change): in `ROADMAP.md`, the
schema-codegen row's note changes from "De-scoping to be ratified at the
Phase 2 transition review" to "De-scoping ratified <decision date>,
`docs/reviews/phase-0-3-reconciliation.md`".

### Outcome B — Phases 0–2 closed; Phase 3 stays active

`PROJECT_STATE.md`:

- Replace the Current Phase section body with:
  "Phase 3 — Runtime Prototype (active). Phases 0–2 closed <decision date>
  (`docs/reviews/phase-0-3-reconciliation.md`); Phase 3 deliverables are
  landed as scoped, and the Board has scoped the remaining goal-sentence
  work (§4 items 1–3) into Phase 3 via a new RFC."
- Current Milestone → "Reference provider adapter + `genome run` RFC
  accepted and its queue drained; then the Phase 3 close review."
- Current Blockers → "None."
- The remaining sections update analogously to Outcome A, with the new
  RFC as the active decision once drafted.

`IMPLEMENTATION_QUEUE.md`:

- Flip the transition-reviews row to **Done** with the note "Phases 0–2
  closed; Phase 3 held open by decision".
- Add: "| High | Reference adapter + `genome run` RFC draft and review |
  Phase 0–3 review | Architecture Board | Not Started |".

Same consequential `ROADMAP.md` ratification-note change as Outcome A.

## 7. Explicitly not done by this packet

- The retrospective transition review is **not approved** here; approval
  is the Board's, recorded by appending votes and an outcome section.
- The project is **not advanced to Phase 4**.
- No historical RFC decision (`docs/reviews/RFC-000*-board-decision.md`)
  is modified; the RFC-0005 evidence-gap note lives in `PROJECT_STATE.md`
  and §2 above, leaving the historical record intact.
