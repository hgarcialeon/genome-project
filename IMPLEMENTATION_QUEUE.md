# Implementation Queue

Work enters this queue only after:

- RFC approved
- ADR recorded if required
- Specification updated if required
- Acceptance criteria defined

Claude Code or any engineering agent should consume this queue instead of acting from chat history.

| Priority | Item | Depends On | Owner | Status |
|----------|------|------------|-------|--------|
| High | Complete Genome CLI validation | Genome Schema v0.1 | Engineering | Done |
| High | Genome Compiler package design | RFC-0002 | Architecture | Done |
| High | Compiler Stages 1–4 (parse/schema reuse, AST, semantic) | RFC-0002 | Engineering | Done |
| High | Organization Graph model | RFC-0002 | Architecture | Done |
| Medium | CLI inspect command | Compiler AST | Engineering | Done |
| Medium | CLI graph command | Organization Graph | Engineering | Done |
| High | RFC-0003 Runtime Boundary review | RFC-0003 draft | Architecture Board | Done |
| High | Policy `appliesTo`: semantic validation + `requires` edges | RFC-0003 / ADR-0004 | Engineering | Done |
| Medium | `owns` edges for objective/metric owners | RFC-0003 / ADR-0004 | Engineering | Done |
| High | RFC-0004 Runtime Implementation review | RFC-0004 draft | Architecture Board | Done |
| High | Genome revision derivation + runtime-model target in `genome-compiler` | RFC-0004 / ADR-0005 | Engineering | Done |
| High | `packages/genome-runtime` core | RFC-0004 / ADR-0005 | Engineering | Done |
| High | RFC-0005 Genome Diff review | RFC-0005 draft | Architecture Board | Done |
| Medium | `diff` target in `genome-compiler` + CLI `genome diff` | RFC-0005 / ADR-0006 | Engineering | Done |
| High | CLI-boundary test suite (exit codes, JSON contracts) | 2026-07-13 audit | Engineering | Done |
| High | `check-state` consistency script + CI step | 2026-07-13 audit | Engineering | Done |
| High | Governance/state reconciliation (phase reviews, single source of truth) | 2026-07-13 audit | Engineering | Done |
| High | Phase 0–3 transition reviews (incl. schema-codegen de-scope ratification) | Governance: Phase Transition Review | Architecture Board | Done |
| High | RFC-0006 — Reference Adapter & `genome run`: draft and Board review | Phase 0–3 review (`docs/reviews/phase-0-3-board-review.md`) | Architecture Board | Done |
| High | RFC-0006 implementation: `@genome/adapter-reference` package + CLI `genome run` + eight CLI-boundary tests | RFC-0006 / ADR-0008 | Engineering | Done |
| High | Phase 3 close review (erratum disposition + phase closure) | RFC-0006 evidence | Architecture Board | Done |
| High | Self-hosting evidence classification (Board review + ratification) | `docs/proposals/self-hosting.md` | Architecture Board | Done |
| High | RFC-0007 implementation: participation-binding derivation in `genome-compiler` + inert-policy diagnostic + `SPEC/language.md` Policy Scope wording + the nine amended evidence cases | RFC-0007 / ADR-0009 | Engineering | Done |
| Medium | RFC-0008 implementation: the self-hosting example file SPEC/examples/genome-project.yaml (structure-only, agent-scoped `queue-discipline`, top-of-file non-normative marking) + additive CLI-boundary evidence E1–E9; seven protected boundaries held; state reconciled | RFC-0008 (`RFC/0008-self-hosting-example.md`) | Engineering | Done |
| High | RFC-0009 Studio Milestone 1 — Governed Authoring: a Studio surface (code editor, inline validation, live Organization Graph, organization tree, ephemeral governed execution, live session event stream, deny-safe park, explicit grant, attributed approval, completion) built strictly as a projection/interaction layer over the shipped compiler targets (`compile`/`graphTarget`/`inspectTarget`/`runtimeModelTarget`) and the ephemeral in-process runtime event stream (`createRuntime`/`subscribe`, `@genome/adapter-reference`); canonical demo `SPEC/examples/genome-project.yaml` via `rfc-lifecycle`; nine protected boundaries held; close requires uncached executable conformance **and** a recorded product-acceptance walkthrough (RFC-0009 §14); acceptance floor for this item — WCAG 2.2 AA, browser-first topology behind a compatibility spike, direct package consumption — recorded under "Milestone-1 acceptance floor" below | RFC-0009 (`RFC/0009-phase-4-governed-authoring.md`) | Engineering | In Progress |
| High | RFC-0010 semantic authoring: the `@genome/authoring` package implementing **`add-agent` only** (department-scoped; intent = required `department` + `id`, optional `role`/`autonomy`/`skills`; a named `applyAddAgent(source, intent)` and no dispatcher; source text in, canonical Genome source out; four failure classes with compiler diagnostics verbatim for `invalid-source`/`invalid-result` and an authoring-owned representation for `invalid-intent`/`conflict`; failure returns no `source` field; three-tier source preservation with `SPEC/examples/genome-project.yaml` as a required fixture; byte-determinism per RFC-0010 §7; authoring never derives `genomeRevision`), **plus the minimal Studio integration required to repeat Milestone-1 product acceptance** (Add agent from the organization surface; the returned source becomes the editor source through the existing ordinary edit lifecycle — no authoring-specific compile path, no direct graph/tree update; source stays visible; WCAG 2.2 AA on both success and failure paths incl. focus behavior). Evidence E1–E19 uncached; eleven protected boundaries held incl. no compiler `Diagnostic`/`CompileStage` change; Checkpoints 1–7 preserved. Close requires a repeated **recorded product-acceptance walkthrough** (RFC-0010 §14) — not a CI gate | RFC-0010 (`RFC/0010-semantic-authoring-operations.md`), ADR-0012 | Engineering | In Progress |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

`packages/genome-compiler` implements RFC-0002 Stages 1–5 (2026-07-13): it
reuses `@genome/schema` for Stages 1–2, enforces the full v0.1 semantic set,
and exposes the `inspect`/`graph`/`docs`/`runtime-model` targets as plain
functions, deriving the Genome revision at Stage 5. The CLI `inspect` and
`graph` commands consume those targets (2026-07-13).
`packages/genome-runtime` (2026-07-13) consumes only the runtime-model
target and produces only the append-only event log; its observed state is
`replay(log)` by construction, and nothing above the adapter seam names a
provider. No interpretation of raw Genome YAML happens outside the compiler
boundary.

RFC-0004 — Runtime Implementation was accepted 2026-07-13
(`docs/adr/0005-runtime-execution-contract.md`), resolving everything the
Phase 3 gate required: the `RuntimeModel` shape, revision derivation,
trigger executability (explicit initiation only in v0.1), ordering and
execution semantics, approval-gate mechanics (deny-safe, `runId`-matched,
`human:*` intrinsic floor), the emergency stop as attributable control
events, and the structural replay contract. It authorizes two items with
concrete acceptance criteria:

1. **Compiler** — derive the Genome revision (SHA-256 of canonical JSON of
   the schema-valid document) at Stage 5, carry it as `genomeRevision` on
   the Organization Graph, and add `runtimeModelTarget` producing the
   normative `RuntimeModel` (resolved deny-safe `autonomy`/`trigger`
   defaults, `governedBy` from `requires` edges, principals and provider
   identifiers as declared data).
2. **Runtime core** — `packages/genome-runtime`: dependency-free `events/`
   module (RFC-0003 envelope + taxonomy, plus `runtime.halted`/`runtime.resumed`
   with `runId: null`), append-only `EventLog` with sequential ids and a
   subscribe hook, normative forward-tolerant `replay`, and the core
   (explicit initiation with autonomy/policy gates, approvals matched by
   `runId`, sequential task lifecycle through the provider-adapter seam,
   halt/resume, drain adoption, structured refusals). `state()` must equal
   `replay(log)` by construction; no provider code above the seam.

Provider adapters, trigger auto-initiation, retries, and event persistence
remain out of scope (RFC-0004 non-goals). No interpretation of raw Genome
YAML happens outside the compiler boundary.

RFC-0005 — Genome Diff was accepted 2026-07-13
(`docs/adr/0006-genome-diff-contract.md`) and its item landed the same day,
completing the Phase 2 roadmap's CLI command set: the `diff` compilation
target in `packages/genome-compiler` (graph-level comparison, node identity
by id, one shared canonicalization, `identical` = revision equality,
deterministic ordering) and the CLI `genome diff <before> <after> [--json]`
with `diff(1)` exit codes (0 identical / 1 different / 2 trouble). Rename
detection, patch application, merge, and the Phase 6 proposal payload
remain out of scope (RFC-0005 non-goals).

The 2026-07-13 governance audit added three drained items: CLI-boundary
tests in `packages/genome-cli` (exit-code and JSON contracts, previously
asserted without executable evidence), the `scripts/check-state.mjs`
consistency check wired into CI, and the reconciliation of
`PROJECT_STATE.md`, `ROADMAP.md`, `CLAUDE_CODE_PROMPT.md`, `README.md`, and
`docs/GOVERNANCE.md` (phase transition reviews; current state lives only in
`PROJECT_STATE.md`). The Phase 0–3 transition reviews were held 2026-07-13
(`docs/reviews/phase-0-3-board-review.md`, ratified by the Product Owner):
Phases 0–2 closed — with the note "Phases 0–2 closed; Phase 3 held open by
decision" — the schema-codegen de-scoping ratified as worded in
`ROADMAP.md`, and Phase 3 held active with the reference provider adapter
and `genome run` scoped in via RFC-0006 (boundary constraints pinned in
the review's Condition 4; the governance process itself is recorded as
`docs/adr/0007-phase-transition-governance.md`). Event persistence is
excluded from Phase 3, gated on its first consumer.

The self-hosting evidence classification was ratified 2026-07-14 under
Option A (`docs/reviews/self-hosting-evidence-board-review.md`): Gap 1
(initiator- vs executor-scoped gating) is an RFC candidate whose
commissioning and sequencing remain with the Product Owner; Gaps 2–3
(human members, artifact primitive) are deferred at named gates (first
view-phase RFC rendering principals; the Phase 6 proposal-payload RFC or
an adopted Level 2 disposition); Gap 4 (workflow control flow) requires
additional consumer evidence (two or more independent consumers with
executable need); Gap 5 (conjunctive-only approvals) is rejected on the
evidence at hand. **The classification adds no engineering item to this
queue**: no RFC is approved, so per this queue's entry rules nothing
enters it. A Gap 1 RFC, if and when the Product Owner commissions one,
follows the normal lifecycle (draft → Board review → ratification →
queue).

RFC-0006 — Reference Adapter and Genome Run was accepted 2026-07-13 under
Option B (`docs/reviews/rfc-0006-board-review.md`, ratified by the
Product Owner; `docs/adr/0008-reference-execution-contract.md`). It
authorizes one implementation item with the Lead Engineer's change
inventory as its scope: the `@genome/adapter-reference` package (dispatch
enqueues only; `settle()` returns on first refusal; qualified-over-bare
`failSteps`; unit-tested with a `test` script), the CLI `genome run`
command (explicit `--workflow`, deny-safe `--grant`, `--fail-step`,
`--json`, `--export-log` with pinned NDJSON framing, public `--clock`,
exit codes 0/1/2/3 with parser defaults overridden), and the eight
CLI-boundary test cases including the Condition 5 evidence
(`genome run SPEC/examples/company.yaml --workflow build-feature --grant
human:engineering-manager` → exit 0). Compiler and runtime public
contracts must not change (empty git diff required). Phase 3 closes only
through a follow-up transition review on that evidence.

The RFC-0006 item was drained 2026-07-13: `packages/genome-adapter-reference`
landed with the normative settle contract and its own unit suite, and the
CLI `genome run` landed with the pinned option set, output contracts, and
exit codes; all evidence cases pass uncached at the subprocess boundary
(`packages/genome-cli/src/cli.test.ts`), the replay-equality and
byte-determinism tests among them, with empty git diffs under
`packages/genome-compiler` and `packages/genome-runtime`. One RFC erratum
was found during implementation: the RFC's test case 4 named
`policy.enforced` attribution on the granted path, but the shipped runtime
emits `policy.enforced` only on the denial path (verified in its suite) —
since the RFC itself prohibits runtime changes, the granted-path evidence
is the attributed `approval.granted` event. The Phase 3 close review
(held 2026-07-13, Option B ratified —
`docs/reviews/phase-3-close-board-review.md`) approved that erratum as a
normative correction with zero behavioral change, applied it to the RFC,
and closed Phase 3 on the re-verified evidence.

RFC-0007 — Executor-Scoped Policies was accepted 2026-07-14 under
Option A with five amendments
(`docs/reviews/rfc-0007-board-review.md`, Product Owner ratification
recorded there; `docs/adr/0009-participation-scoped-policies.md`). It
authorizes one implementation item with the amended RFC's Definition of
Done as its scope: the participation-binding derivation in
`packages/genome-compiler` (agent-scoped `appliesTo` entries yield
workflow→policy `requires` edges for every workflow owned by the named
agent, in a deterministic pinned order; the existing agent→policy edge
is retained), the extended unbound-policy diagnostic (warning severity,
pinned forever), the `SPEC/language.md` Policy Scope wording from the
RFC's §3 (including the normative autonomy/policy boundary sentence),
and the nine amended evidence cases — including the reconstructed Gap 1
fixture now parking at exit 3, the Condition 5 regression case, and the
additive runtime-suite case covering the previously untested
initiating-agent binding path. Protected boundaries: no schema change
(`SPEC/schema/genome.schema.json` diff empty), no runtime production
source change (`git diff` under `packages/genome-runtime` empty except
additive cases in `runtime.test.ts`; the existing 17 tests
byte-unchanged), no CLI surface change (commands, options, exit codes,
output contracts), no new event types. A discovered need for a runtime
source change stops work and returns to the Board. Evidence must be
uncached (`pnpm test -- --force`).

The RFC-0007 item was drained 2026-07-15. The participation binding
landed entirely at the compiler boundary: `packages/genome-compiler`
graph construction now derives, for each agent-scoped `appliesTo` entry,
one workflow→policy `requires` edge per workflow owned by that agent —
in document (pinned) order, deduplicated by id — alongside the retained
agent→policy edge; the unbound-policy diagnostic was extended to the
inert manual, workflow-less shape (warning); and `SPEC/language.md`
Policy Scope carries the accepted §3 wording with the normative
autonomy/policy boundary sentence. The nine amended evidence cases pass
uncached: cases 1–2, 4–6, 8–9 at the CLI subprocess boundary
(`packages/genome-cli/src/cli.test.ts`), case 3 as the additive
runtime-suite case closing the previously untested initiating-agent half
of the policy union (`packages/genome-runtime/src/runtime.test.ts`), and
case 7 as the compiler diagnostic
(`packages/genome-compiler/src/compiler.test.ts`). The protected
boundaries held with empty diffs: `SPEC/schema/genome.schema.json`,
`packages/genome-runtime` production source (`runtime.test.ts` gained the
one additive case; the existing 17 tests are byte-unchanged), and the
CLI surface (`packages/genome-cli/src/index.ts`) all unchanged; no new
event types. Autonomy semantics were not widened and "executor" was not
generalized beyond workflow ownership. The Board's implementation closure
review (`docs/reviews/rfc-0007-implementation-close-review.md`) ratified
Option A on 2026-07-15, closing RFC-0007 complete on this evidence.

The 2026-07-15 Product Owner dispositions
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`) **add no
engineering item to this queue**. The specification-maintenance (erratum)
mechanism was adopted as a governance-process decision
(`docs/adr/0010-erratum-mechanism.md`, `docs/ERRATA.md`) — a
documentation/process change, not queued work. The Level 1 self-hosting RFC
was commissioned but not approved; per this queue's entry rules nothing
enters until it is ratified. Level 2 (durable exported-log records) is
deferred under the persistence gate, and Level 3 (operative governance) is
deferred to Phase 6 — neither is queued work. No production language,
compiler, runtime, schema, CLI, or test change accompanies these
dispositions; the RFC-0000/RFC-0001 status corrections were zero-behavioral-change
errata (`ERR-0001`, `ERR-0002`).

RFC-0008 — Self-Hosting Example was accepted 2026-07-15 under Option B
(`docs/reviews/rfc-0008-board-review.md`, Product Owner ratification;
`RFC/0008-self-hosting-example.md`), which added the one **Not Started**
item above. Its scope is fixed by the accepted RFC and the five folded
open-question dispositions: ship a single canonical, structure-only
self-describing example under `SPEC/examples/` (name per RFC-0008 §3;
`queue-discipline` bound **agent-scoped**, relying on the shipped RFC-0007
participation binding; a top-of-file non-normative-for-governance marking, no
verifier) plus the additive CLI-boundary evidence cases E1–E9. Acceptance
requires the seven protected boundaries to hold as empty diffs — no schema,
compiler-semantic, runtime-production, CLI-surface, or event-taxonomy change,
no exported-log reader, no persistence — with the only production diff being
the one example file and the only test diff additive, all evidence uncached,
and `PROJECT_STATE.md`/`IMPLEMENTATION_QUEUE.md` reconciled per Rule 8. No ADR
is required (the RFC makes no architectural decision) and no `ROADMAP.md`
deliverable row is added (Board disposition OQ5). Phase 4 is not opened.

The RFC-0008 item was drained 2026-07-15. `SPEC/examples/genome-project.yaml`
ships as the single canonical, structure-only self-describing example: the two
Board roles modeled `manual`, the engineering agent `supervised`, the three
governance workflows (`rfc-lifecycle`, `implement-queue-item`,
`phase-transition-review`), and the two deny-safe policies (`ratification`
workflow-scoped, `queue-discipline` **agent-scoped**), with a top-of-file
non-normative-for-governance marking and no field that restates mutable state.
The nine evidence cases E1–E9 pass uncached at the CLI subprocess boundary,
added additively to `packages/genome-cli/src/cli.test.ts` (35 → 44 CLI tests):
schema validation (E1), compilation with no inert-policy diagnostic (E2), the
19-node / 31-edge graph with exactly the four `requires` edges including the
RFC-0007-derived `implement-queue-item → queue-discipline` (E3), deny-safe
parking on both the ratification (E4) and executor (E7) paths, completion on
both once granted (E5, E8), the attributed `approval.granted` record (E6), and
byte-determinism under `--clock` (E9). E7/E3 make the example a standing
regression witness for RFC-0007 participation binding — the executor gate binds
through the single agent-scoped policy, with the old per-workflow workaround
retired. The seven protected boundaries held with empty diffs: no change to
`SPEC/schema/genome.schema.json`, `packages/genome-compiler/src`,
`packages/genome-runtime/src`, `packages/genome-cli/src/index.ts`, or the event
taxonomy; no exported-log reader; no persistence. The only production diff is
the one example file; the only test diff is the additive E1–E9 block. RFC-0008
was **closed complete 2026-07-18** by the Board's implementation closure review
(Option A, `docs/reviews/rfc-0008-implementation-close-review.md`, Product Owner
ratification); the queue item remains Done and drained. Current state lives in
`PROJECT_STATE.md`.

RFC-0009 — Phase 4 Governed Authoring was **accepted 2026-07-18 under Option B**
(accept with four clarifying amendments applied;
`docs/reviews/rfc-0009-board-review.md`, Product Owner ratification;
`RFC/0009-phase-4-governed-authoring.md`), which **opened Phase 4 for Milestone 1
only** and added the one **Not Started** item above. Its scope is fixed by the
accepted (amended) RFC: a Studio surface — code editor, inline validation, a live
Organization Graph (the defining visualization), an organization tree, ephemeral
governed execution, a live session event stream, deny-safe park, explicit grant,
attributed approval, and completion — demonstrated on
`SPEC/examples/genome-project.yaml` via the `rfc-lifecycle` workflow, built
strictly as a projection/interaction layer that owns no business logic
(Constitution Principle 5). It consumes only shipped surfaces: the compiler
targets `compile` (diagnostics), `graphTarget`, `inspectTarget`, and
`runtimeModelTarget`; and the runtime's ephemeral, in-process execution and
append-only event stream via `createRuntime`/`subscribe` and
`@genome/adapter-reference` (the reference adapter only — no provider precedent).
The normative runtime invariant is the **ephemeral session boundary** (Amendment
1): session-scoped state and events, discardable on session end, no durable
history, no exported-log reader, no persistence gate crossed; "in-process" is the
reference mechanism, not a required topology. Additive public application
interfaces (a minimal Studio application-service seam or thin re-exports of
already-accepted behavior) are permitted and do not count as
semantic/schema/event changes provided they add no new semantics, reinterpret no
outputs or events, own no policy or workflow decisions, and preserve the
protected boundaries (Amendment 2). Acceptance requires the nine protected
boundaries to hold (no schema, language-semantic, compiler-semantic,
production-runtime-semantic, or event-taxonomy change; no durable-log reader; no
persistence; no provider integration; no trigger behavior), all evidence
uncached, and — beyond executable conformance and the canonical demo — a
**recorded product-acceptance walkthrough** of the first-five-minutes experience
and product success criteria to close (Amendment 4; RFC-0009 §14). Milestone 2
(durable runtime logs) is not opened or designed; the adopted Option B autonomy
spine is not commissioned. Current state lives in `PROJECT_STATE.md`.

### Milestone-1 acceptance floor (Product Owner disposition, 2026-09-12)

Recorded here, on the authorized item, because RFC-0009 delegates the concrete
accessibility target to item acceptance (Board resolution of open question 6)
and leaves topology and consumption pattern as implementation choices (open
questions 1–3). This disposition fixes them for Milestone 1 only. It changes no
RFC, opens no milestone, and adds no deliverable: every RFC-0009 protected
boundary and Definition-of-Done item stands unchanged.

**Accessibility target — WCAG 2.2 AA** for the Studio surface. This is a
product acceptance target, **not** a claim of formal external certification. At
minimum, Milestone-1 acceptance must demonstrate:

- keyboard operability for all essential interactions;
- visible focus;
- accessible names/labels for interactive controls;
- AA contrast for essential UI and state indicators;
- diagnostics and errors programmatically associated with the relevant content;
- no essential interaction requiring pointer-only input.

**Topology — browser-first.** Before substantive UI work, a minimal
compatibility spike must prove the accepted surfaces are consumable in a browser
application: `@genome/compiler` (including `graphTarget`, `inspectTarget`, and
`runtimeModelTarget`), `@genome/runtime` (`createRuntime`/`subscribe`), and
`@genome/adapter-reference`. The spike must not change compiler or runtime
semantics, add persistence, introduce a server merely to bypass a browser
incompatibility, or fork/reproduce Genome semantics in the UI. If browser
consumption is blocked by a concrete dependency or runtime assumption, work
stops and the exact incompatibility is reported before any local-companion
topology is chosen. Browser-first is an implementation choice, not a new
language or architecture contract.

**Consumption — direct package consumption** for this first Studio consumer. No
Studio application-service layer is introduced preemptively; a thin additive
boundary may follow later only on a demonstrated consumer need and only within
RFC-0009 Amendment 2.

**Product acceptance.** The Lead Engineer prepares and records the walkthrough
evidence; the Product Owner conducts the Milestone-1 product acceptance. At
milestone-close time — and not before — the record is created at
docs/reviews/phase-4-m1-product-acceptance.md, covering: the commit under
review; the canonical scenario; the first-five-minutes journey; each RFC-0009
§10.1 product success criterion; accessibility acceptance evidence; screenshots
or other durable evidence where useful; observed defects or caveats; and the
Product Owner disposition. This walkthrough is **not** a CI gate (RFC-0009
Amendment 4).

### Milestone-1 portability authorization (Product Owner ratification, 2026-09-13)

Binding on this item; it adds **no second queue item**. The Product Owner
ratified Option A of
`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md` — a one-time
authorization to cross the RFC-0009 §11 compiler boundary for the narrow
portability work only — and the accepted architectural property is recorded as
`docs/adr/0011-platform-neutral-compiler.md`.

Normative order for the authorized work:

1. **Freeze first.** Permanent golden revision fixtures pinning the pre-change
   behavior, as committed literals, covering minimal valid input, ASCII,
   Unicode, formatting-only differences that canonicalize identically,
   semantically different documents, and the canonical
   `SPEC/examples/genome-project.yaml`. The test exercises public compiler
   behavior and must not recompute SHA-256 or canonicalization to derive its
   expectations. Committed before any production change.
2. **Smallest portability change**, preserving synchronous `compile` and its
   defaulting, the accepted canonicalization, SHA-256, lowercase hex, Stage-5
   derivation, `graphTarget`, `inspectTarget`, `runtimeModelTarget`, CLI
   behavior, and diff canonicalization compatibility. No caller-injected
   hashing, no async compilation, no Studio-local hashing, no Node-crypto shims
   in Studio, no semantic fork, no provider dependency.
3. **Permanent cross-platform conformance harness** owned by the repository,
   exercising compiler and runtime behavior rather than reproducing Genome
   semantics, proving Node ↔ browser equality of `genomeRevision` across the
   golden fixture classes, `graphTarget`, `inspectTarget`, `runtimeModelTarget`
   where directly comparable, deny-safe park, granted execution, event sequence,
   `approval.granted` attribution and ordering, and determinism under a fixed
   clock — failing CI on divergence. Smallest tooling addition that provides the
   evidence; the harness must not decide the Studio UI framework.
4. **Protected-boundary re-evidence**: `pnpm check-state`, `pnpm typecheck`,
   `pnpm test -- --force`, plus explicit diffs or absences for schema, language
   semantics, runtime semantics, event taxonomy, persistence, exported-log
   reader, provider adapter, and trigger behavior.
5. **Browser-first gate**: repeat the original compatibility spike with no
   Studio-specific Node shims. Substantive Studio UI implementation is unblocked
   only after that gate passes.

Stop and return to the Architecture Board if any existing golden revision must
change, `compile` must become asynchronous, a caller-supplied hash primitive
becomes necessary, the accepted canonicalization must change, runtime or event
behavior must change, browser portability would require Studio to reproduce
compiler semantics, or the change grows materially beyond the authorized scope.
