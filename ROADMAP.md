# Genome Roadmap

Every deliverable carries one of five statuses — **Not Started**,
**In Progress**, **Done**, **Deferred**, or **De-scoped** — checked
mechanically by `pnpm check-state`. **Done** requires evidence. **Deferred**
requires an `IMPLEMENTATION_QUEUE.md` entry. **De-scoped** requires a stated
reason. A phase closes only through the phase transition review defined in
`docs/GOVERNANCE.md`.

## Phase Sequencing

The committed order below is **Option B — Autonomy First**
(`docs/proposals/roadmap-revision.md`, Product Owner disposition 2026-07-18),
applied to this roadmap 2026-09-12 as the separate ratified act that disposition
reserved. It re-sequences committed phases only; it commissions nothing, opens no
phase, authorizes no implementation, and changes no evidence gate or
deferred-capability condition.

What it means here:

- Phase 4 — Studio Prototype remains the current phase, opened for Milestone 1
  (Governed Authoring) by `RFC/0009-phase-4-governed-authoring.md`.
- After that milestone, the autonomy spine — Phase 5 — Autonomy Substrate — is
  sequenced ahead of a standalone Office View phase, each deliverable still
  behind its own RFC and evidence gate.
- Phase 6 — Self-Improvement Loop remains last.
- **Office View is not cancelled and not de-scoped.** It leaves the numbered
  sequence because its standalone placement is no longer presumed; its final
  form and placement — standalone phase, Studio projection, or later capability
  — must be proposed separately and governed before it is re-placed. It is
  recorded below as a future capability with its deliverables intact.

Phase numbers are stable identifiers: Phases 0–4 and Phase 6 keep the numbers
accepted documents already cite, and Phase 5's slot carries the autonomy
substrate. References in accepted documents to "Office View (Phase 5)" resolve
to the Office View section at the end of this roadmap.

## Phase 0 — Foundation

Closed 2026-07-13 (`docs/reviews/phase-0-3-board-review.md`).

Goal: establish Genome as a specification-first project.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| Repository structure | Done | See `README.md` |
| README | Done | `README.md` |
| VISION | Done | `docs/VISION.md` |
| Constitution | Done | `docs/CONSTITUTION.md` |
| Architecture Charter | Done | `docs/ARCHITECT.md` |
| Governance Model | Done | `docs/GOVERNANCE.md` |
| Bootstrap Protocol | Done | `docs/BOOTSTRAP.md` |
| Project State | Done | `PROJECT_STATE.md` |
| Implementation Queue | Done | `IMPLEMENTATION_QUEUE.md` |
| RFC-0000 | Done | `RFC/0000-genome.md` |
| RFC-0001 | Done | `RFC/0001-language.md` |
| RFC-0002 draft | Done | Accepted 2026-07-09, `docs/reviews/RFC-0002-board-decision.md` |
| Genome Language v0.1 | Done | `SPEC/language.md` |
| JSON Schema v0.1 | Done | `SPEC/schema/genome.schema.json` |
| Example company.yaml | Done | `SPEC/examples/company.yaml` |
| CLI validate command | Done | `packages/genome-cli`; exit codes tested in `packages/genome-cli/src/cli.test.ts` |

Success criteria (met):

```bash
genome validate SPEC/examples/company.yaml
```

## Phase 1 — Genome Compiler

Closed 2026-07-13 (`docs/reviews/phase-0-3-board-review.md`).

Goal: make the Genome specification executable through a compiler boundary.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| Compiler pipeline | Done | RFC-0002 Stages 1–5, `packages/genome-compiler/src/index.ts` |
| AST model | Done | `packages/genome-compiler/src/ast/index.ts` |
| Semantic validation | Done | `packages/genome-compiler/src/semantics/index.ts` |
| Organization Graph | Done | `packages/genome-compiler/src/graph/index.ts` |
| Compilation targets | Done | `packages/genome-compiler/src/targets/index.ts` (inspect, graph, docs, runtime-model, diff) |
| Compiler tests | Done | 36 tests across `packages/genome-compiler` |

## Phase 2 — CLI & Schema

Closed 2026-07-13 (`docs/reviews/phase-0-3-board-review.md`).

Goal: make the specification usable from local development.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| genome validate | Done | CLI-boundary tests in `packages/genome-cli/src/cli.test.ts` |
| genome inspect | Done | Same suite; `--json` contract tested |
| genome diff | Done | Same suite; diff(1) exit codes 0/1/2 tested (ADR-0006) |
| genome graph | Done | Same suite |
| TypeScript types generated from schema | De-scoped | "De-scoped from the current roadmap; may be reconsidered through a future RFC if schema-driven public SDK types become a concrete requirement." Ratified 2026-07-13, `docs/reviews/phase-0-3-board-review.md`. Rationale: the need (a typed representation) is fulfilled by RFC-0002's AST behind the ADR-0002 compiler boundary; a generated raw-document type set would be a second typed source of truth with no consumer. |
| Valid and invalid fixtures | Done | `packages/genome-schema/src/__fixtures__`, `packages/genome-compiler/src/__fixtures__`, `packages/genome-cli/src/__fixtures__` |

## Phase 3 — Runtime Prototype

Closed 2026-07-13 by the Phase 3 close review
(`docs/reviews/phase-3-close-board-review.md`, Option B ratified by the
Product Owner) on CLI-boundary evidence, with the RFC-0006 case-4
erratum applied first.

Goal: execute a simple organization from a Genome file.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| Runtime model intake (per RFC-0003) | Done | `runtimeModelTarget` in the compiler; consumed by `packages/genome-runtime` |
| Agent lifecycle | Done | Task assignment/completion through the provider-adapter seam (RFC-0004); provider adapters themselves are an RFC-0004 non-goal |
| Event bus | Done | Append-only `EventLog` with subscribe hook, `packages/genome-runtime/src/log/index.ts` |
| Workflow execution | Done | Sequential step execution with autonomy/policy gates, `packages/genome-runtime/src/runtime/index.ts` |
| Human approval stub | Done | Full deny-safe approval mechanics (exceeds stub), RFC-0004/ADR-0005 |
| Activity log | Done | The event log is the activity log; `state() == replay(log)` by construction, 17 tests |
| Reference adapter (RFC-0006) | Done | `packages/genome-adapter-reference`: enqueue-only dispatch, FIFO settle with return-on-first-refusal, unit-tested (ADR-0008) |
| genome run (RFC-0006) | Done | CLI-boundary tests in `packages/genome-cli/src/cli.test.ts`; exit codes 0/1/2/3, `--grant`/`--fail-step`/`--json`/`--export-log`/`--clock` contracts, replay equality, byte-determinism |

## Phase 4 — Studio Prototype

Goal: create an Organization IDE.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| Genome document editor | Not Started | Product-level deliverable per `RFC/0009-phase-4-governed-authoring.md` §8.1; no editor framework is prescribed (ERR-0003) |
| Schema validation | Not Started | |
| Live preview | Not Started | |
| Organization tree | Not Started | |
| Runtime logs | Not Started | |

## Phase 5 — Autonomy Substrate

Goal: make governed autonomous execution real, in dependency order.

**Named and sequenced only — nothing here is commissioned.** Each deliverable
requires its own RFC, Board review, and Product Owner ratification before any
work enters `IMPLEMENTATION_QUEUE.md`. Every existing architecture and evidence
gate is preserved exactly as recorded: provider adapters require their own
accepted contract and evidence; trigger auto-initiation requires an RFC;
exported-log readers and durable event persistence remain gated on their first
consumer; simulation must not be treated as free or implied by deterministic
replay.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| First real provider adapter | Not Started | Behind the ADR-0008 seam; requires its own accepted contract and evidence, including an empty runtime-core diff |
| Trigger-driven initiation | Not Started | Requires an RFC; explicit initiation remains the only v0.1 behavior (RFC-0004 non-goal) |
| Durable evidence and observability | Not Started | Gate unchanged — event persistence stays gated on the first consumer requiring a durable log; the Phase 4 "Runtime logs" deliverable keeps its Phase 4 home |
| Simulation | Not Started | Requires its own RFC and product boundary; sequenced as the rehearsal layer before real-effect execution |

## Phase 6 — Self-Improvement Loop

Goal: allow Genome to improve Genome.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| Observe | Not Started | Requires the Phase 6 proposal-payload RFC (reserved by ADR-0006) |
| Diagnose | Not Started | |
| Propose | Not Started | |
| Branch | Not Started | |
| Validate | Not Started | |
| Promote | Not Started | |
| Update Genome | Not Started | |

## Office View — Future Capability

Placement governed separately. Sequenced behind the autonomy substrate by the
adopted Option B direction; **not cancelled, not de-scoped**. Its final form —
standalone phase, Studio projection, or later capability — requires its own
proposal and ratification before it is re-placed in the committed sequence
(`docs/proposals/roadmap-revision.md` §4, Product Owner disposition 2026-07-18).

Goal: render the company as a living isometric organization.

| Deliverable | Status | Evidence / Notes |
|-------------|--------|------------------|
| PixiJS renderer | Not Started | Requires the Office View RFC |
| Office layout engine | Not Started | |
| Agent sprites | Not Started | |
| Agent states | Not Started | |
| Event-driven animations | Not Started | Prototype queued Low in `IMPLEMENTATION_QUEUE.md` |
