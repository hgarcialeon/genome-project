# RFC-0009: Phase 4 Opening — Governed Authoring (Studio Milestone 1)

## Status

**Accepted — Option B (accept with amendments), Product Owner, 2026-07-18.**
Commissioned 2026-07-18 by the Product Owner as the Phase 4 opening RFC,
following the closed RFC-0008
(`docs/reviews/rfc-0008-implementation-close-review.md`, Option A) per adopted
strategy Option A sequencing (`docs/PRODUCT_STRATEGY.md` §7). Reviewed by the
Architecture Board 2026-07-18 (`docs/reviews/rfc-0009-board-review.md`), which
re-executed every material claim uncached and recommended **Option B — accept
with four clarifying amendments**. The Product Owner ratified Option B
2026-07-18; the four amendments are applied in this document (ephemeral session
boundary as the normative invariant — §4; additive public application interfaces
permitted and not counted as semantic changes — §4/§11; `runtimeModelTarget`
named in the compiler-integration section — §5; product-acceptance evidence
classed as a recorded reviewer walkthrough, not a CI gate — §10.1/§14). The
amendments change no milestone scope, no canonical demo, no evidence case, and no
protected boundary. The Board's resolutions of the six open questions (§15) are
recorded in the review and are binding as classified there.

**Acceptance opens Phase 4 for Milestone 1 (Governed Authoring) only.** As of
this ratification, Phase 4 is **Open for Milestone 1** (`PROJECT_STATE.md`), and
exactly one Milestone-1 implementation item is added to
`IMPLEMENTATION_QUEUE.md`. No Studio code is implemented by this acceptance; the
remaining Phase 4 deliverable that carries an architecture gate (durable runtime
logs) stays a later milestone (§12), unopened and undesigned here.

This RFC **defines the Studio boundary and scopes the first Phase 4 milestone.
Acceptance authorizes implementation of Milestone 1 only** and authorizes no
language, schema, compiler-semantic, runtime-semantic, or event-taxonomy change
(§11). The Language Complexity Budget (§16) remains non-binding review evidence
and guidance; this acceptance does not promote it to a standing requirement.

## Commissioning and authority

- **Commissioning act:** Product Owner, 2026-07-18 (this session), directing the
  drafting of `RFC/0009-phase-4-governed-authoring.md` to open Phase 4 with the
  Governed Authoring milestone. Commissioning authorizes drafting and Board
  review only; it opens no phase and adds no queue item.
- **Product input this RFC consumes (all merged on `main`):**
  - `docs/reviews/phase-4-planning-packet.md` — the original packet; Candidate C
    (Edit-and-see) adopted 2026-07-15 as the planned opening milestone (product
    input only).
  - `docs/reviews/phase-4-planning-packet-amendment.md` — Governed Authoring;
    **adopted 2026-07-18 (Option A)** as the planned opening experience,
    superseding Candidate C *as the planned milestone*.
  - `docs/proposals/roadmap-revision.md` — **Option B (Autonomy First) adopted
    2026-07-18** as strategic sequencing direction; keeps Phase 4 next and
    opening with Governed Authoring.
  - `docs/PRODUCT_STRATEGY.md` (adopted Option A "Trust first"; §5 users; §6
    two roadmaps, C3/C4; A3 Studio boundary; A5 persistence gate),
    `ROADMAP.md` (Phase 4 deliverables), `PROJECT_STATE.md`.
- **Architecture input this RFC is bound by:** `docs/CONSTITUTION.md`
  (Principles 2, 5, 6, 9), `docs/ARCHITECT.md`, `docs/GOVERNANCE.md`,
  `RFC/0008-self-hosting-example.md` and `SPEC/examples/genome-project.yaml` (the
  canonical demo document and its evidence), and the accepted contracts:
  ADR-0002/ADR-0003 (compiler boundary and reuse), ADR-0004/ADR-0005 (runtime
  boundary and execution contract), ADR-0006 (diff contract),
  ADR-0008 (reference execution contract), ADR-0009 (participation-scoped
  policies).
- **State ownership (Governance Rule 8).** Phase, milestone, objective, and
  blockers live only in `PROJECT_STATE.md`. This RFC cites repository evidence
  but owns no state and restates none.

## Summary

Open Phase 4 (Studio Prototype) with a single first milestone — **Governed
Authoring** — that lets a user author a Genome document and watch the
organization it describes *govern itself* as it runs, entirely in-process and
entirely ephemeral. The milestone is built strictly as a **projection and
interaction layer** over already-shipping, provider-free surfaces: the
`@genome/compiler` targets (validation diagnostics, the Organization Graph, the
inspect/tree projection) and the `@genome/runtime` execution and append-only
event log through the `@genome/adapter-reference` reference adapter. Studio owns
no business logic (Constitution Principle 5): the compiler validates and derives
the graph, the runtime executes and decides approvals, and Studio renders their
output and collects the user's intent (edit, run, grant).

The canonical demonstration is the shipped self-hosting document
`SPEC/examples/genome-project.yaml` driven through its `rfc-lifecycle` workflow —
the exact behavior RFC-0008 already proves uncached at the CLI boundary
(E4–E6, E9). The milestone's premise is that it can be built with an **empty
schema / language / compiler-semantic / runtime-semantic / event-taxonomy
production diff**; confirming that is the implementation's job under the
protected boundaries pinned in §11.

## 1. Phase-opening act

Stated explicitly, as the commissioning requires:

1. **Phase 4 is currently positioned but unopened.** It is named as the next
   phase in `PROJECT_STATE.md` and carries five Not Started deliverables in
   `ROADMAP.md`; no Phase 4 work is authorized and no opening RFC has previously
   been commissioned.
2. **Acceptance and Product Owner ratification of this RFC are the authorization
   to open Phase 4.** Opening Phase 4 requires this RFC's acceptance by the
   Architecture Board and ratification by the Product Owner (Governance Rule 2).
   Nothing short of that opens the phase.
3. **Implementation begins only after acceptance.** No Studio code, test, or
   queue item exists or is authorized until this RFC is ratified; ratification
   adds exactly one implementation item to `IMPLEMENTATION_QUEUE.md`, scoped to
   Milestone 1.
4. **This RFC opens Phase 4 for Milestone 1 only.** It opens the phase to build
   Governed Authoring and nothing else. The remaining Phase 4 deliverable that
   carries an architecture gate — durable runtime logs — is recorded as a later
   milestone (§12) and is neither opened nor designed here.

Drafting alone changes nothing: this document is a Draft awaiting review, and its
existence does not open Phase 4, authorize implementation, or add a queue item.

## 2. Product outcome

The opening experience must allow a user to, in one continuous session:

- open a Genome document;
- edit it;
- receive inline validation as they type;
- see a live Organization Graph;
- inspect an organization tree;
- execute an existing workflow ephemerally;
- observe deny-safe parking when a required approval is absent;
- grant the required approval;
- observe attributed completion after the grant.

**Canonical demo (binding for this milestone):**

- **document:** `SPEC/examples/genome-project.yaml`
- **workflow:** `rfc-lifecycle`

**Target user conclusion (the sentence the milestone must earn, unprompted):**

> "Genome understood the organization I described, enforced its governance, and
> showed me exactly what happened."

This extends the original packet's Candidate-C outcome ("Genome understood the
organization I described") with the governance half the amendment added
(enforcement, made visible). The product-experience bar — the "first five
minutes" and its failure modes — is inherited from
`docs/reviews/phase-4-planning-packet.md` ("The First Five Minutes") and
`docs/reviews/phase-4-planning-packet-amendment.md` ("The expanded first five
minutes") and is not restated here.

## 3. Studio boundary

Studio is defined as a **projection and interaction layer only** — a view in the
Constitution Principle 5 sense, and the pattern-setting first view named as move
A3 on the adopted architecture roadmap (`docs/PRODUCT_STRATEGY.md` §6.1).

**Studio must:**

- consume accepted compiler outputs (validation diagnostics, the Organization
  Graph, the inspect/tree projection);
- invoke accepted runtime behavior (execution and the approval gate) through the
  shipped seam;
- present diagnostics, the graph, the tree, and the event stream;
- collect user intent — edit, run, grant — and hand it to the compiler/runtime
  as input.

**Studio must not:**

- parse or interpret Genome semantics independently of the compiler;
- derive the Organization Graph itself;
- reimplement validation;
- decide policy applicability;
- synthesize, reorder, or suppress approval or any other events;
- own workflow execution semantics (stepping, gate evaluation, deny-safe
  parking, `runId` matching, the `human:*` intrinsic floor);
- become a second source of truth — for the document (the Genome file is the
  source), for observed state (`state() == replay(log)` is the runtime's
  guarantee), or for governance (the governance documents and, for mutable
  state, `PROJECT_STATE.md`, remain authoritative).

The single sentence: **Studio presents accepted compiler and runtime behavior
and owns no business logic.** A design in which the UI validated YAML itself,
derived the graph, decided an approval, evaluated a policy, ordered steps, or
computed state independently of the runtime breaches Principle 5 and must be
rejected regardless of product appeal. Deny-safe means deny-safe: if the surface
renders nothing, the run still parks, because the gate lives in the runtime, not
the view.

## 4. Runtime integration

**Authorized for Milestone 1: ephemeral, session-scoped execution.** *(Amendment
1 — Board review, ratified Option B 2026-07-18.)* The **normative invariant is
the ephemeral session boundary**, not the process topology: execution state and
events are session-scoped and may be discarded when the session ends, no durable
history is promised, no exported-log reader is introduced, and no persistence
gate is crossed. **"In-process" is the reference mechanism** — the natural way to
achieve the invariant on the shipped stack, in which Studio invokes the runtime
in the same process and subscribes to the live event stream — but it is **not** a
required browser/process topology; the browser-only vs. local-companion choice is
an implementation matter (§15, OQ1) provided the invariant below holds.

The accepted invariant (binding for this milestone):

- execution state and events are **session-scoped**;
- they **may be discarded when the session ends** (e.g. on refresh or close);
  nothing is retained;
- **no durable history is promised** by this surface;
- **no exported-log reader is introduced** — no shipped code path reads a
  committed or exported NDJSON log;
- **no persistence gate is crossed** — the ephemeral form is the exact variant
  the planning packet and strategy identify as *not* tripping the persistence
  gate (`docs/reviews/phase-4-planning-packet.md`, "The runtime-logs gate";
  `docs/PRODUCT_STRATEGY.md` §6.2 C4). A durable/exported-log reader is a
  *different* capability and remains gated behind the event-persistence RFC (A5;
  ADR-0008 §5; RFC-0008 "What this RFC authorizes and prohibits");
- **no production path reads committed or exported NDJSON.**

Wherever ephemeral session state lives (browser tab, a local companion, or an
application service), it must be **in-memory, session-scoped, and discardable**,
and `state() == replay(log)` must hold **within the session** (§15, OQ3).

**The exact accepted runtime surface Studio may consume.** The behavior Studio
needs already ships and is regression-protected; Milestone 1 composes it exactly
as the CLI `genome run` command already composes it, but in-process and with the
event stream rendered live:

- `@genome/runtime` — `createRuntime({ model, adapter, clock })` returning the
  `Runtime` with `startWorkflow(workflowId, source)`,
  `submitApproval(runId, principal, granted)`, `reportTask(...)`, `state()`,
  `events()`, and **`subscribe(listener)`** (the append hook on the append-only
  `EventLog`; subscribers observe and can never mutate — `log/index.ts`).
- `@genome/adapter-reference` — the shipped reference adapter
  (`dispatch`/`settle`, ADR-0008) below the provider seam; the only adapter in
  scope.
- `@genome/compiler` — `runtimeModelTarget` for the model the runtime consumes
  (see §5).

The runtime's semantics (sequential stepping, the union-of-governing-policies
approval gate, deny-safe parking at exit-3 equivalent, `runId` matching, the
`human:*` intrinsic floor, `state() == replay(log)`, byte-determinism under an
injected `clock`) are **RFC-0004/ADR-0005 and must not change**. Studio consumes
this surface; it does not reach around the adapter seam and does not reimplement
any of it.

**On new boundaries (Amendment 2 — Board review, ratified Option B 2026-07-18).**
The premise of this milestone is that the shipped public exports above are
**sufficient** to build ephemeral governed execution as a composition over them,
with an empty runtime-semantics diff — the RFC-0006/0007/0008 precedent applied
to a view. Direct package consumption is acceptable for this first consumer, and
no heavier boundary is mandated (§15, OQ2). A **minimal Studio
application-service seam, or thin re-exports of already-accepted compiler/runtime
behavior, are permitted**, and such additive public application interfaces **do
not count as language, compiler-semantic, runtime-semantic, schema, or
event-taxonomy changes**, provided they:

- add no new business semantics;
- do not reinterpret existing compiler outputs or runtime events;
- do not own policy or workflow decisions;
- preserve the protected boundaries recorded in §11.

**Any interface that changes semantics, events, persistence, or execution
behavior must stop the work and return to the Architecture Board** (§11). Whether
Studio consumes the packages directly or through such a seam is an
implementation-boundary choice (§15, OQ2), not a semantic change.

## 5. Compiler integration

Studio consumes exactly the accepted, shipped compilation targets
(`packages/genome-compiler`, ADR-0002/ADR-0003; no plugin system, internal
fixed set):

- **Validation:** `compile(source)` — diagnostics (schema-stage and
  semantic-stage), the same result the CLI `genome validate` surfaces. Studio
  renders these; it never re-implements parsing or validation (Stages 1–2 are
  reused from `@genome/schema` behind the compiler boundary).
- **Organization Graph** (the milestone's defining visualization):
  `graphTarget(graph)` — the JSON-serializable nodes-and-edges view, including
  the `requires`/`owns` edges and the RFC-0007/ADR-0009 participation-derived
  edges. This is the same graph `genome graph` emits.
- **Organization tree / inspect projection:** `inspectTarget(graph)` — the
  hierarchy-and-counts summary the CLI `genome inspect --json` surfaces, rendered
  as a secondary projection beside the graph.
- **Runtime model:** `runtimeModelTarget(graph)` *(Amendment 3 — Board review,
  ratified Option B 2026-07-18)* — the compiler-facing target that produces the
  normative `RuntimeModel` (ADR-0005) the runtime consumes for the ephemeral
  governed run (§4). It is a pure function of the Organization Graph and is named
  here alongside the validation, graph, and inspect targets to list the full
  compiler-target set the milestone uses; it introduces no compiler semantic
  change.

**No compiler semantic change is expected.** The graph and inspect projections
already carry everything the milestone renders; the participation binding
(RFC-0007) already ships. This RFC **requires empty protected diffs for the
schema and for compiler semantics** (`SPEC/schema/genome.schema.json` and
`packages/genome-compiler/src` production sources), **unless the Architecture
Board explicitly approves otherwise** during review. A discovered need to change
either stops the work and returns to the Board (§11).

## 6. Approval interaction

Approval is the governance heart of the milestone and must be represented as
such — never reduced to a generic confirmation dialog.

Studio must represent, drawn faithfully from the event stream and the compiled
model (not synthesized by the UI):

- **`approval.requested`** — that the run has **parked** at a gate and taken no
  steps, shown as the organization declining to proceed on its own, not as a UI
  pause.
- **the required principal** — the concrete principal(s) the gate requires (for
  the canonical demo, `human:product-owner`), named and **traceable to the
  Genome document** (the `policies.*.requiresApprovalFrom` entry that produced
  the requirement).
- **the policy identity** — which policy gated the run (for the demo,
  `ratification`), visible and traceable to the document, so the user reads *why*
  the run parked, in the organization's own terms.
- **the explicit grant** — collected as the user acting as the required
  principal; the grant is an **input to the runtime's gate**
  (`submitApproval(runId, principal, granted)`), matched by the runtime's rules
  (exact principal, or a concrete `human:<id>` against a pending `human:*`
  floor). It is an **operator assertion** attributed to the named principal
  (ADR-0008 §3); Studio does not decide the approval and does not authenticate
  the principal (surfaces where principals respond for themselves require
  authentication and their own RFC — out of scope here, §9).
- **`approval.granted` attribution** — the granted approval shown as an
  **attributed** event (`source = human:product-owner`,
  `payload.principal = human:product-owner`), recorded **before the first step**
  (RFC-0008 E6), so the user sees *who* authorized the run and that the
  authorization came *first*.
- **continuation after grant** — the workflow's steps executing in order to
  `workflow.completed` once the matching grant is supplied.

The required principal and policy identity must remain **visible and traceable
to the Genome document** throughout — the user must be able to connect what they
declared in the file to what gated the run.

## 7. Canonical demonstration

`SPEC/examples/genome-project.yaml` is the **primary conformance/demo document**;
its `rfc-lifecycle` workflow is the demonstrated run. Using this pairing means
every claim the demo makes is already an executed, uncached evidence case in
`packages/genome-cli/src/cli.test.ts` (RFC-0008 E4–E6, E9) — the milestone
renders behavior the repository already proves.

**Exact demo sequence (binding):**

1. **Edit a durable structural element** of the document (e.g. rename a
   department, add an agent, attach a policy) — a change to *structure*, never to
   mutable repository state.
2. **Observe the Organization Graph change** in lockstep with the edit — the
   graph is *derived*, not drawn.
3. **Run `rfc-lifecycle`** with no grant.
4. **Park for `human:product-owner`** — the stream shows one `approval.requested`
   via the `ratification` policy and **zero** steps executed (RFC-0008 E4).
5. **Grant** the approval as `human:product-owner`.
6. **Complete** — the five `rfc-lifecycle` steps execute to `workflow.completed`
   (RFC-0008 E5), with the attributed `approval.granted` recorded before the
   first step (RFC-0008 E6).
7. **Inspect the event sequence** — the ordered, attributed events, rendered live
   and then discardable.

**Do not encode mutable repository state into the example.** The self-hosting
document is structure-only and non-normative for governance (RFC-0008 §1; OQ3);
this milestone preserves that classification exactly — the `rfc-lifecycle` run is
a *projection of* governance, not an act *of* it, and governs nothing in the
actual repository (§9). Under a fixed clock the whole run is byte-deterministic
(RFC-0008 E9), so the demonstration is reproducible frame-for-frame.

## 8. Milestone 1 deliverables

Product-level deliverables (not framework choices):

1. **Genome document editor** — open and edit a Genome document.
2. **Inline diagnostics** — validation surfaced at the point of the mistake, in
   the organization's terms.
3. **Live Organization Graph** — the defining visualization, updating as the
   author edits.
4. **Organization tree** — the inspect projection, rendered as a secondary view.
5. **Ephemeral governed execution** — run an existing workflow in-process through
   the reference adapter.
6. **Live event stream** — the runtime's events rendered as they are appended,
   ephemeral.
7. **Approval interaction** — park → required-principal/policy display → grant →
   attributed completion, per §6.
8. **Canonical self-hosting demo** — the §7 sequence on
   `SPEC/examples/genome-project.yaml` / `rfc-lifecycle`.

**No framework choice is prescribed.** This RFC does not mandate Monaco, React,
any rendering framework, any process model, or any transport. Such choices are
implementation details for the accepted milestone unless the Board finds a
specific choice architecturally necessary; the questions that *are*
architecturally load-bearing are raised in §15.

## 9. Explicit exclusions

Milestone 1 does **not** include, each keeping its existing home (nothing here is
de-scoped from the project):

- **durable runtime logs** (recorded as Milestone 2, §12);
- **exported-log reading**;
- **event persistence**;
- **provider-specific adapters** (the reference adapter only; the seam ships,
  adapters do not — `docs/PRODUCT_STRATEGY.md` §3, A6);
- **trigger auto-initiation** (explicit initiation only; RFC-0004 non-goal);
- **external side effects** (runs are demonstrations through the reference
  adapter, not real work);
- **operative repository governance** (the `rfc-lifecycle` run governs nothing in
  the repository, commits nothing, changes no project state; RFC-0008
  classification preserved — Constitution Principle 2);
- **workflow branching** (Gap 4; the runtime is strictly sequential);
- **concurrency**;
- **Office View** (Phase 5; prototype queued Low);
- **Marketplace**;
- **simulation** (must not be treated as free or implied by deterministic
  replay; its own RFC and milestone — `docs/proposals/roadmap-revision.md` §6);
- **self-improvement** (Phase 6; reserved by ADR-0006).

**Autonomy First is the adopted sequencing *after* Governed Authoring, not an
authorization to pull those capabilities into this RFC.** The adopted Option B
direction (`docs/proposals/roadmap-revision.md`, Product Owner disposition
2026-07-18) sequences the autonomy spine after this milestone; it commissions
none of it here (§13).

## 10. Success criteria

Both product and executable evidence are required for the accepted milestone; how
a future implementation meets them is out of scope for this Draft.

### 10.1 Product evidence

Demonstrated with a first-time user who has not read the architecture:

- a new user can understand the core value **without reading architecture docs**;
- an edit causes an **understandable Organization Graph update** the user can
  connect to what they changed;
- the user can **explain why execution parked** (the gate was real, not a UI
  pause);
- the **required principal and policy are visible** and traceable to the document;
- the user can **identify who granted the approval**;
- the user understands the **event stream is ephemeral** (a window, not a
  ledger);
- the experience **does not read as a generic YAML editor or a generic workflow
  runner**.

These operationalize the "first five minutes" and failure modes in the planning
packet and its amendment; a milestone that ships the features but earns none of
these convictions has not shipped the product outcome.

**This is product-acceptance evidence, not a CI gate (Amendment 4 — Board review,
ratified Option B 2026-07-18).** Product acceptance is a **recorded reviewer
walkthrough** against the six conclusions above — a human acceptance record — and
is explicitly **not** a mechanical CI requirement and **not** subjective
usability research. Repository health, unit tests, and CLI/executable
conformance (§10.2) are **necessary but not sufficient** to close Milestone 1;
the milestone close review must additionally include a recorded reviewer
walkthrough covering the first-five-minutes experience and these product success
criteria (§14).

### 10.2 Executable evidence

At the appropriate boundary (compiler-target projections and the runtime
event stream; exit-code-style outcomes captured with true results as the CLI
suite does), covering:

- **validation projection** — Studio surfaces the compiler's diagnostics
  faithfully (matches `compile` / `genome validate`);
- **graph projection** — Studio's graph equals `graphTarget` output (no
  independent derivation);
- **inspect/tree projection** — matches `inspectTarget` / `genome inspect --json`;
- **deterministic update behavior where applicable** — projections are a pure
  function of the document; runs are byte-deterministic under a fixed clock
  (RFC-0008 E9);
- **ephemeral run** — a workflow executes in-process through the reference
  adapter;
- **deny-safe park** — `rfc-lifecycle` with no grant parks with one
  `approval.requested` and zero steps (RFC-0008 E4);
- **grant** — the explicit grant is accepted as a runtime input;
- **attributed approval** — `approval.granted` attributed to
  `human:product-owner`, before the first step (RFC-0008 E6);
- **completion** — the run completes after the grant (RFC-0008 E5);
- **no persistence or exported-log reads** — no shipped path writes or reads a
  durable/exported log (the persistence tripwire, §11/§14).

## 11. Protected boundaries

The implementation that follows acceptance must hold every one of these, each a
verifiable diff or absence:

- **no schema change** (`SPEC/schema/genome.schema.json` diff empty);
- **no language semantic change** (`SPEC/language.md` semantics unchanged);
- **no compiler semantic change** (no production diff under
  `packages/genome-compiler/src`);
- **no production runtime semantic change** (no production diff under
  `packages/genome-runtime/src`);
- **no new event types** (no diff under `packages/genome-runtime/src/events`);
- **no durable log reader** (no shipped path reads a committed or exported log);
- **no persistence** (nothing durable written or read by any shipped path);
- **no provider integration** (reference adapter only);
- **no trigger behavior** (explicit initiation only).

**If implementation requires crossing any one of these boundaries, it must stop
and return to the Architecture Board.**

**Additive public application interfaces are permitted and are not semantic
changes (Amendment 2 — Board review, ratified Option B 2026-07-18).** A minimal
Studio application-service seam, or thin re-exports of already-accepted
compiler/runtime behavior (§4), do **not** count against the schema,
language-semantic, compiler-semantic, runtime-semantic, or event-taxonomy
boundaries above, **provided** they add no new business semantics, do not
reinterpret existing compiler outputs or runtime events, do not own policy or
workflow decisions, and preserve every protected boundary in this list. Any
interface that changes semantics, events, persistence, or execution behavior is
**not** covered by this allowance and must stop the work and return to the
Architecture Board.

## 12. Milestone 2 (recorded, not designed)

Runtime logs are recorded here as a **later Phase 4 milestone**, so the phase's
fifth `ROADMAP.md` deliverable keeps a home; this RFC **does not open, scope, or
design it**.

The line Milestone 2 must draw, and Milestone 1 already respects:

- **ephemeral session events** (Milestone 1) — in-process, live, discardable;
  persist nothing; trip no gate.
- **durable runtime history** (Milestone 2) — saved, replayable, cross-session
  records. This is event persistence's first consumer and requires its own RFC
  (A5; ADR-0008 §5), whether via the ephemeral-to-durable step or a durable
  exported-log reader.

Milestone 2 is planned only when its consumer exists and the persistence
disposition (A5) is made; it is not designed in this RFC.

## 13. Relationship to Autonomy First

The Product Owner adopted **Option B — Autonomy First** as strategic sequencing
direction (`docs/proposals/roadmap-revision.md`, disposition 2026-07-18). For
this RFC that means only: Phase 4 remains next and opens with Governed Authoring,
and the strategic capabilities prioritized **after** this milestone are, in
dependency order and each behind its own gate:

- a real provider adapter;
- trigger-driven initiation;
- durable evidence / observability, when justified by a first consumer;
- simulation, when its prerequisites and product boundary are defined.

**This RFC commissions none of them** and authorizes no work beyond Milestone 1.
Re-sequencing `ROADMAP.md` per Option B is a separate ratified act the
disposition names and this RFC does not perform.

## 14. Definition of Done

For the eventual Milestone 1 implementation (recorded now so acceptance fixes the
bar; **no work is authorized until ratification**).

Standing governance requirement (Governance, RFC Completion Criteria):
`PROJECT_STATE.md`, `ROADMAP.md` deliverable statuses, and
`IMPLEMENTATION_QUEUE.md` reflect the work at the moment it lands, and
`pnpm check-state` passes.

RFC-specific, all evidence **uncached** (Governance: evidence from uncached
runs):

1. **State consistency:**

   ```bash
   pnpm check-state
   ```

2. **Typecheck:**

   ```bash
   pnpm typecheck
   ```

3. **Full suite, uncached:**

   ```bash
   pnpm test -- --force
   ```

4. **Protected-boundary diffs (§11)** — each a verified empty diff or absence:
   schema, language semantics, compiler semantics, runtime semantics, event
   taxonomy; no durable-log reader; no persistence; no provider integration; no
   trigger behavior.

5. **Canonical demo evidence** — the §7 sequence on
   `SPEC/examples/genome-project.yaml` / `rfc-lifecycle` executed and asserted:
   edit → graph change → run → deny-safe park (RFC-0008 E4) → grant → attributed
   completion (E5/E6) → inspect the event sequence; byte-deterministic under a
   fixed clock (E9).

6. **No exported-log reader tripwire** — an explicit check that no shipped path
   reads a committed or exported NDJSON log (scan added surface; boundary diffs),
   mirroring the RFC-0008 closure check.

7. **No persistence behavior** — an explicit check that nothing durable is
   written or read by any shipped path.

8. **Explicit product-acceptance evidence** for the first-five-minutes journey
   (§10.1) — *(Amendment 4 — Board review, ratified Option B 2026-07-18)* a
   **recorded reviewer walkthrough** covering the first-five-minutes experience
   and the six product success criteria (§10.1), **not** a CI gate and **not**
   subjective usability research. Items 1–7 (repository health, protected-boundary
   evidence, executable conformance, and the canonical demonstration) are
   **necessary but not sufficient** to close Milestone 1; the milestone close
   review must additionally carry this recorded walkthrough.

Done means: the milestone ships as a projection/interaction layer, the demo and
projections are protected by uncached evidence, every §11 boundary held, the
recorded product-acceptance walkthrough is in the close review, and the state
documents reconcile — with no language, schema, compiler-semantic,
runtime-semantic, or event-taxonomy change.

## 15. Open questions for the Architecture Board

Only questions that must be decided before implementation are raised; questions
that can remain implementation choices are deliberately left to the
implementation (§8).

1. **Deployment boundary — browser-only vs. local companion process.** Does
   Milestone 1 run the runtime in a browser context, or does Studio pair with a
   local companion process that hosts the in-process runtime? This shapes where
   §4's "in-process, ephemeral" execution actually lives.
2. **Consumption boundary — packages directly vs. a dedicated application
   service.** Does Studio import `@genome/compiler`, `@genome/runtime`, and
   `@genome/adapter-reference` directly, or consume them through a defined
   application-service seam? Either can honor §3/§4; the Board should decide which
   is the pattern-setting A3 boundary.
3. **Where ephemeral runtime session state lives** — in the browser tab, a
   companion process, or a service — given that it must remain ephemeral and
   `state() == replay(log)` must hold within the session (§4).
4. **How grants are supplied without weakening attribution.** The grant is an
   operator assertion attributed to the named principal (ADR-0008 §3); Milestone
   1 does not authenticate principals. The Board should confirm the collection
   mechanism preserves attribution and does not imply an authentication guarantee
   the milestone does not make (and does not foreclose the future
   authenticated-principal RFC).
5. **Graph layout behavior — product concern vs. implementation detail.** Which
   aspects of graph layout are product-load-bearing (legibility of the
   organization the user described) versus free implementation choices
   (specific layout algorithm)?
6. **Minimum accessibility and error-recovery behavior** required for the
   milestone to be accepted (e.g. invalid-document recovery, run failure and
   halt presentation) — the floor below which the milestone is not "done."

## 16. Language Complexity Budget (non-binding review evidence)

Presented as review evidence and guidance only, mirroring the RFC-0007/RFC-0008
precedent; this RFC does not promote it to a standing requirement.

| Dimension | Expected default | This RFC |
|---|---|---|
| New syntax | 0 | **0** |
| New semantics | 0 | **0** |
| Schema change | 0 | **0** |
| Compiler production change | 0 | **0** (empty diff required, §11) |
| Runtime production (semantic) change | 0 | **0** (empty diff required, §11) |
| Event-taxonomy change | 0 | **0** |
| Studio-specific architectural concepts | minimal | the Studio projection/interaction boundary (A3) and the ephemeral-execution line — **no new language/runtime concept** |
| New maintained product surface | 1 | **1** — the Studio Milestone 1 surface |

Expected language cost is **zero**: the milestone is a view over shipped,
accepted surfaces. The only new architectural concept is the Studio boundary
itself (A3), which is exactly what a first-view RFC exists to define.

## Constitutional check

- **P2 (source of truth):** Studio is a projection; the Genome document, the
  event log (`state() == replay(log)`), and the governance/state documents remain
  authoritative. Studio becomes no second source of truth (§3).
- **P5 (views own no business logic):** the load-bearing constraint of the whole
  milestone; §3 pins it across projection *and* execution.
- **P6 (runtime produces events):** Studio renders events the runtime appended;
  durable organizational change still flows only through Genome revisions, not
  through the view (§4, §9 — no operative governance).
- **P9 (human governance first-class):** the deny-safe park → attributed grant →
  complete loop makes Principle 9 *visible and executable* (§6, §7); the gate
  lives in the runtime, not the view.
- **P10 / Charter ("examples before abstractions," "define the model before the
  UI"):** the model and its evidence ship first (RFC-0008); this RFC defines the
  view boundary before any UI is built.

## Explicitly not authorized / not done by this RFC

- **No phase opened by drafting.** Phase 4 opens only on acceptance +
  ratification, and then for Milestone 1 only (§1).
- **No implementation** of Studio or anything else; no framework, process model,
  or transport chosen (§8).
- **No `IMPLEMENTATION_QUEUE.md` item added** — added only upon acceptance.
- **No modification to `ROADMAP.md` or `docs/PRODUCT_STRATEGY.md`** (the Option B
  re-sequencing is a separate ratified act; §13).
- **No language, schema, compiler-semantic, runtime-semantic, CLI-surface, or
  event-taxonomy change** of any kind (§11).
- **No persistence, no exported-log reader, no provider adapter, no trigger
  behavior** (§4, §9, §11).
- **Milestone 2 is not opened or designed** (§12); the autonomy spine is not
  commissioned (§13).
- `PROJECT_STATE.md` is reconciled only to record that this RFC is now the
  commissioned active RFC in Draft, under Board review; no state is duplicated
  into the RFC or the example (Governance Rule 8).
