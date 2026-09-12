# RFC-0009 — Phase 4 Governed Authoring — Architecture Board Review

## Status

**Ratified — Option B (accept with amendments), Product Owner, 2026-07-18.** This
is the Phase 4 *opening* architecture review. The Board recommended **Option B —
accept with four clarifying amendments**; the Product Owner ratified Option B on
2026-07-18. The four amendments have been applied to
`RFC/0009-phase-4-governed-authoring.md`, which is now **Accepted**, and **Phase
4 is Open for Milestone 1 (Governed Authoring) only**; exactly one Milestone-1
implementation item has been added to `IMPLEMENTATION_QUEUE.md`. The Product
Owner ratification record is at the end of this document; **the Board review
below is preserved as written at review time.**

Review held 2026-07-18; ratified 2026-07-18.

## Instrument and scope

- **Decision under review:** RFC-0009 — Phase 4 Governed Authoring
  (`RFC/0009-phase-4-governed-authoring.md`), the commissioned Phase 4 opening
  RFC, in Draft.
- **Commit under review:** `14148ee` (branch
  `claude/genome-bootstrap-verify-ml9b5y`; parent = merged `origin/main`
  `40320f6`). The branch changes exactly two files versus `main`:
  `RFC/0009-phase-4-governed-authoring.md` (new) and `PROJECT_STATE.md`
  (reconciliation); no package code changes.
- **Sources of truth:** `RFC/0009-phase-4-governed-authoring.md`,
  `docs/reviews/phase-4-planning-packet.md`,
  `docs/reviews/phase-4-planning-packet-amendment.md`,
  `docs/proposals/roadmap-revision.md`, `docs/PRODUCT_STRATEGY.md`,
  `ROADMAP.md`, `PROJECT_STATE.md`, `RFC/0008-self-hosting-example.md`,
  `SPEC/examples/genome-project.yaml`, and the accepted contracts governing
  compiler targets (ADR-0002/ADR-0003), runtime execution (ADR-0004/ADR-0005),
  event logs (RFC-0003 taxonomy), the reference execution contract and
  persistence gate (ADR-0008), participation-scoped policies (ADR-0009), and
  the diff contract (ADR-0006).
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner · Chief
  Architect · Lead Engineer). Every material claim was **re-executed uncached**
  at `14148ee`; the CLI was invoked directly
  (`node_modules/.bin/tsx packages/genome-cli/src/index.ts`) so true exit codes
  are captured (`pnpm run` masks nonzero child exit codes to 1).
- **State ownership (Rule 8):** current state lives only in `PROJECT_STATE.md`;
  this review cites evidence and owns no state.

## Re-executed evidence (at `14148ee`, uncached)

| # | Claim (from the RFC) | Re-execution | Result |
|---|---|---|---|
| 1 | Repository healthy, suite green uncached | `pnpm test -- --force` | ✅ 113/113, **0 cached** — schema 4 · adapter 7 · runtime 18 · compiler 40 · CLI 44 |
| 2 | Typecheck clean | `turbo typecheck --force` | ✅ 5/5, 0 cached |
| 3 | State consistent | `pnpm check-state` | ✅ exit 0 |
| 4 | RFC change scope is docs-only | `git diff --name-only 40320f6..14148ee` | ✅ only `RFC/0009-...md` (new) + `PROJECT_STATE.md`; **no package code** |
| 5 | Canonical example unchanged (no mutation) | `git diff 40320f6..14148ee -- SPEC/examples/genome-project.yaml` | ✅ empty |
| 6 | E1 — validates | `genome validate <example>` | ✅ exit 0 |
| 7 | Graph projection exists (via `graphTarget`) | `genome graph <example>` | ✅ exit 0; stderr 0 bytes; **19 nodes, 31 edges** |
| 8 | Graph has exactly four `requires` edges incl. the RFC-0007-derived one | parse graph JSON | ✅ `rfc-lifecycle→ratification`, `phase-transition-review→ratification`, `agent:engineering.engineering-agent→queue-discipline`, **derived** `implement-queue-item→queue-discipline` |
| 9 | Tree projection exists (via `inspectTarget`) | `genome inspect <example> --json` | ✅ 2 departments, 3 agents, 3 workflows (`rfc-lifecycle` 5 steps, `implement-queue-item` 5, `phase-transition-review` 4) |
| 10 | Deny-safe park without grant | `genome run … --workflow rfc-lifecycle` (direct) | ✅ exit 3; one `approval.requested` via `policy:ratification` → `human:product-owner`; `finalState.completedSteps = 0` |
| 11 | Completes with the grant | `genome run … --grant human:product-owner --clock 2026-07-15T00:00:00Z` | ✅ exit 0; `workflow.completed` present |
| 12 | Attributed `approval.granted` **before** the first step | inspect `--json` NDJSON | ✅ `approval.granted` at id 2, `source = human:product-owner`, `payload.principal = human:product-owner`; first `workflow.started` at id 3 (granted precedes it) |
| 13 | Determinism under `--clock` | two clocked runs, `sha256sum` | ✅ byte-identical stdout |
| 14 | `runtimeModelTarget` is a public `@genome/compiler` export | `packages/genome-compiler/src/targets/runtime-model.ts` | ✅ `export function runtimeModelTarget(...)`, re-exported via `targets/index.ts` |
| 15 | `createRuntime`/`subscribe` are public `@genome/runtime` surface | `runtime/index.ts`, `log/index.ts` | ✅ `createRuntime` returns `startWorkflow`/`submitApproval`/`reportTask`/`state`/`events`/`subscribe`; `EventLog.subscribe` observes appends and cannot mutate |
| 16 | `@genome/adapter-reference` is provider-free | `package.json` deps; src scan | ✅ deps = `{@genome/runtime}` only; no `http`/`fetch`/`net`/provider/`process.env`; header states "no provider, no network, no I/O, and no nondeterminism… not precedent for provider adapters (ADR-0008)" |
| 17 | No exported-log reader in production | grep `readFileSync`/`readFile` in `packages/*/src` non-test | ✅ the only prod reads are input Genome source docs (`readTextFile`) and the JSON schema; `--export-log` uses `writeFileSync` only (never read back) |
| 18 | Example is structure-only (Rule 8 / RFC-0008 §1) | grep mutable-state keys | ✅ no `phase/milestone/status/blocker/sprint/iteration/priority/current` field; only `phase` tokens are the durable workflow name `phase-transition-review` and the header comment |

No claim failed re-execution. The RFC's own drafting evidence and RFC-0008 E1–E9
reproduce exactly.

**One immaterial documentation imprecision noted (not an error in the RFC's
claims):** `genome graph` emits JSON by default and has **no** `--json` flag
(that flag is on `inspect`/`diff`/`run`). RFC-0009 §5 does not claim
`graph --json`; it correctly references `genome graph` for the graph and
`genome inspect --json` for the tree. No amendment required on this point.

## Answers to the Board's questions

**1. Coherent and sufficiently bounded opening milestone?** Yes. RFC-0009 scopes
a single first milestone (Governed Authoring), pins nine protected boundaries
with a stop-and-return tripwire, defers the one gated deliverable (durable logs)
to Milestone 2, and consumes only already-shipping, regression-protected
surfaces. The boundary is the tightest available for a first view.

**2. Is Governed Authoring the correct product scope
(author · validate · visualize · execute ephemerally · observe · approve ·
complete)?** Yes. It is the Product-Owner-adopted planned opening experience
(`docs/reviews/phase-4-planning-packet-amendment.md`, Option A, 2026-07-18), a
superset of the earlier adopted Candidate C, and every element maps to executed,
uncached evidence (E1–E9). It matches capability C3 + the ephemeral form of C4
in `docs/PRODUCT_STRATEGY.md` §6.2 and honors adopted Option B (Phase 4 next,
opening with Governed Authoring).

**3. Principle 5 preserved?** Yes, and it is the load-bearing constraint of §3.
The RFC's must-not list is complete and correct: Studio must not independently
parse Genome semantics, derive the Organization Graph, reimplement validation,
decide policy applicability, synthesize/reorder/suppress approval (or any)
events, own workflow execution semantics, or become a second source of truth.
The evidence confirms each capability lives below the view: validation is
`compile` diagnostics; the graph is `graphTarget`; the tree is `inspectTarget`;
execution and the approval decision are the runtime's (`submitApproval`,
deny-safe gate, `state()==replay(log)`). Deny-safe is enforced in the runtime,
not the view (E10: park with zero steps regardless of any UI).

**4. Compiler integration sufficient and correctly bounded?** Yes. The exact
targets are the shipped set: `compile` (schema- and semantic-stage diagnostics),
`graphTarget` (Organization Graph, incl. the ADR-0009 participation-derived
edges — E8), `inspectTarget` (tree/counts — E9), and `runtimeModelTarget`
(the model the runtime consumes — E14). No compiler semantic change is needed;
the participation binding already ships (`git` shows the derived edge produced by
base code). **A dedicated compiler-facing application service is not necessary**
for the first consumer; direct package consumption is acceptable (see Q7). One
clarity amendment: §5 should cross-reference `runtimeModelTarget` explicitly (it
is currently named in §4 only). See Amendment 3.

**5. Runtime integration truly ephemeral?** Yes. It uses accepted runtime
behavior (E10–E13), stores session state only in memory (the runtime "holds no
run state outside the log"; `EventLog` is an in-memory array), may discard events
on refresh/close, introduces no exported-log reader (E17), promises no durable
history, and does not cross the persistence gate (ADR-0008 §5). The persistence
gate remains intact and unpre-decided.

**6. Is "in-process execution" an architectural requirement or an over-specific
constraint?** The Board finds the **true architectural invariant is
ephemerality** — session-scoped, in-memory, discardable, no persistence,
`state()==replay(log)` within the session — **not** the process topology.
"In-process" is a sufficient *mechanism* for that invariant and the natural one
for the reference stack, but pinning it as the authorized form creates tension
with OQ1 (browser-only vs local companion), which treats topology as open. The
RFC should make the **ephemeral session boundary** normative and reclassify
"in-process" as the expected reference mechanism, not a topology-independent
requirement. See **Amendment 1**.

**7. Is the accepted runtime surface safe for Studio consumption
(`createRuntime`, `subscribe`, `runtimeModelTarget`, `@genome/adapter-reference`)?**
Yes. `createRuntime` is provider-free, synchronous, deterministic; `subscribe`
is observe-only and cannot mutate the log; `runtimeModelTarget` is a pure
function of the graph; `@genome/adapter-reference` is provider-free (E16). **The
first consumer may consume these packages directly**; a dedicated Studio
application-service boundary is **permitted but not required**. The Board
explicitly declines to mandate the heavier option: "do not design more
abstraction than the first consumer requires" (Charter; ADR-0003 minimalism). If
an application-service seam is introduced, it must be additive and expose only
already-accepted behavior (see Amendment 2).

**8. Is `@genome/adapter-reference` appropriate for the canonical demo, without
setting provider precedent?** Yes. ADR-0008 §7 and the package header pin it as
provider-free and **not precedent** for provider adapters; §9 of the RFC
excludes provider integration and external side effects; the demo is explicitly a
demonstration through the reference adapter, "not real work." Using it establishes
no provider precedent and implies no external work. The Board affirms the RFC
must retain the §9 exclusion language verbatim.

**9. Approval interaction correctly defined?** Yes. §6 presents
`approval.requested` as runtime evidence (the run parked; zero steps), keeps the
policy identity (`ratification`) and required principal (`human:product-owner`)
visible and traceable to the Genome document, treats the grant as an explicit
runtime input via `submitApproval` (an operator assertion, ADR-0008 §3),
preserves attributed `approval.granted` (E12: attributed and ordered before the
first step), and forbids reducing approval to a generic confirmation dialog. The
runtime owns the decision, so the UI **cannot** auto-grant: the gate binds in the
runtime (E10). Correct as drafted.

**10. Canonical demonstration executable and faithful?** Yes — re-run at
`14148ee`: the document validates (E1/E6) and compiles; graph (E7/E8) and tree
(E9) projections exist; without a grant execution parks deny-safe (E10, exit 3,
0 steps); with the `human:product-owner` grant it completes (E11, exit 0);
`approval.granted` is attributed before the workflow steps (E12); the run is
byte-deterministic under `--clock` (E13); and no mutable repository state is
encoded in the example (E18). Faithful.

**11. Product success criteria reviewable and falsifiable?** Yes, once the
evidence *classes* are separated, which the RFC mostly does and this review pins.
Three distinct classes must not be conflated:
- **Executable conformance evidence** — mechanical, CI-enforced: projections
  equal the compiler targets; runs park/complete/attribute as E4–E9; no
  persistence/log-reader (§10.2). These are falsifiable and belong in CI.
- **Product acceptance evidence** — a structured, recorded reviewer walkthrough
  against the six §10.1 conclusions (the graph responds understandably to an
  edit; the user can explain why the run parked; principal and policy are
  visible; the grantor is identifiable; events are understood as ephemeral; the
  surface does not read as a generic YAML editor / workflow runner). This is a
  human acceptance record, **not** a CI gate.
- **Subjective usability research** — out of scope for closing the milestone.
The Board directs (Amendment 4) that §10.1/§14 state plainly that product
acceptance is a recorded reviewer judgment and **must not** become a mechanical
CI requirement, and that CLI/unit conformance passing is **necessary but not
sufficient** to close the milestone.

**12. Protected boundaries correct?** Yes, the nine are correct and complete (no
schema, language-semantic, compiler-semantic, production-runtime-semantic, or
event-taxonomy change; no durable-log reader; no persistence; no provider
integration; no trigger behavior). The Board adds a needed clarification: an
**additive public application interface** — a Studio application-service seam, or
a thin re-export exposing already-accepted behavior — does **not** count as a
schema/language/compiler/runtime *semantic* change, provided the semantic diffs
are empty and no runtime behavior changes. Without this pin, §11 could be read to
forbid the very surface §4/§8 contemplate. See **Amendment 2**.

**13. Milestone 2 correctly out of scope?** Yes. §12 records durable runtime logs
as a later Phase 4 concern, draws the ephemeral-vs-durable line, and explicitly
does **not** pre-decide the persistence model, exported-log reading, a replay UI,
or cross-session history. Correct.

**14. Autonomy First sequencing preserved?** Yes. §9 and §13 open only Governed
Authoring and commission no real provider adapter, trigger-driven initiation,
durable observability, simulation, Office View, or self-improvement. The RFC
correctly records Option B as *sequencing after* this milestone, not authorization
within it, and notes the `ROADMAP.md` re-sequencing remains a separate ratified
act.

**15. Resolution of the six open questions.** See the dedicated section below.

**16. Definition of Done sufficient?** Yes, with Amendment 4. §14 already
separates repository health (`check-state`/`typecheck`/`test --force`),
protected-boundary evidence, executable conformance, canonical demonstration,
and product acceptance, and includes explicit no-exported-log-reader and
no-persistence tripwires. The Board requires only that the DoD state that a
product milestone **does not close solely because unit and CLI tests pass** —
product acceptance evidence (a recorded walkthrough) is a distinct, required
closing artifact (Amendment 4).

**17. Does acceptance constitute the Phase 4 opening act?** Yes — the lifecycle
is pinned in "Phase-opening lifecycle" below. The RFC states it correctly (§1);
the Board affirms it.

**18. Amendments and Language Complexity Budget.** See "Required amendments" and
"Language Complexity Budget review" below. The Board finds the product value
justifies the one new application-boundary concept (the Studio projection/A3
boundary): it is the adopted wedge, it introduces zero language/schema/compiler/
runtime/event cost, and the additive-boundary allowance is bounded to
already-accepted behavior.

## Resolution of the six open questions (Q15)

For each: the Board's resolution and its status (**normative for RFC-0009** /
**implementation choice** / **deferred to later evidence**).

1. **Browser-only vs. local companion / process-neutral boundary.**
   **Resolution:** the normative requirement is an **ephemeral session boundary**
   (in-memory, session-scoped, discardable, no persistence); the browser-vs-
   companion topology is an **implementation choice**, provided ephemerality and
   the persistence gate hold. *(Implementation choice; the ephemerality invariant
   is normative — Amendment 1.)*
2. **Direct package consumption vs. a Studio application service.**
   **Resolution:** direct consumption of `@genome/compiler`, `@genome/runtime`,
   and `@genome/adapter-reference` is **acceptable for the first consumer**; an
   application-service seam is **permitted but not required** and, if used, must
   be additive over already-accepted behavior. Do not over-abstract.
   *(Implementation choice, bounded by Amendment 2; normative that no heavier
   boundary is mandated.)*
3. **Ownership of ephemeral session state.** **Resolution:** wherever it lives
   (tab, companion, service), it must be **in-memory, session-scoped, and
   discardable**, and `state()==replay(log)` must hold within the session.
   *(Location is an implementation choice; the in-memory/ephemeral constraint is
   normative.)*
4. **Grant submission and attribution.** **Resolution:** the grant is an
   **explicit runtime input** (`submitApproval`) attributed to the named
   principal; Milestone 1 does **not** authenticate principals (an authenticated-
   principal surface is a future RFC); the UI must **not** auto-grant or infer
   approval. *(Normative for RFC-0009 — already in §6; affirmed.)*
5. **Graph layout — product contract vs. implementation detail.**
   **Resolution:** **legibility** (the user can read their organization back out
   of the graph — who sits where, which workflows are owned by whom, which
   policies gate which work) is a **product contract**; the specific layout
   algorithm/engine is an **implementation detail**. *(Split: legibility
   normative via success criteria; algorithm an implementation choice.)*
6. **Accessibility and error-recovery minimum.** **Resolution:** a floor is
   **normative** — invalid-document recovery (no crash; diagnostics shown) and
   run-failure/halt presentation must exist; the specific accessibility
   conformance target is **deferred** to the implementation item's acceptance,
   where it must be stated and met. *(Floor normative; specific a11y level
   deferred to later evidence.)*

## Language Complexity Budget review (Q18)

| Dimension | Expected | Board finding at `14148ee` |
|---|---|---|
| New syntax | 0 | **0** |
| Language semantics | 0 | **0** |
| Schema | 0 | **0** (empty diff required, §11) |
| Compiler semantics | 0 | **0** (empty diff required; participation binding already ships) |
| Runtime semantics | 0 | **0** (empty diff required; consumes shipped surface) |
| Event taxonomy | 0 | **0** (no new event types) |
| Public application boundaries | ≤1, additive | **≤1** — an *optional*, additive Studio application-service seam or direct consumption; must expose only accepted behavior (Amendment 2) |
| Studio-specific concepts | minimal | **1** — the Studio projection/interaction boundary (A3), which a first-view RFC exists to define |
| Maintained product surfaces | 1 | **1** — Studio Milestone 1 |
| Product-acceptance obligations | defined | present; must be pinned as non-CI (Amendment 4) |
| Hidden coupling / precedent risk | none | reference adapter sets **no** provider precedent (E16; ADR-0008 §7); persistence gate intact (E17); ephemerality keeps Studio↔runtime coupling bounded |

**Verdict:** language cost is **zero**; the only new architectural concept is the
Studio boundary itself. **The product value (the adopted wedge) justifies the one
new application-boundary concept**, which is bounded to already-accepted behavior.

## Required amendments (before acceptance under Option B)

Each is a clarification or normativity fix; **none changes the milestone's scope,
the canonical demo, the evidence set, or any protected boundary.**

1. **Ephemeral session boundary is the normative invariant (§4, §6, OQ1/OQ3).**
   Reframe "authorized: ephemeral, in-process execution only" as "authorized:
   ephemeral, session-scoped, in-memory, discardable execution," with
   "in-process" named as the expected reference mechanism, not a
   topology-independent requirement. The persistence gate — not the process
   topology — is the boundary.
2. **Additive public application interfaces are permitted and are not semantic
   changes (§11, §4).** State explicitly that a Studio application-service seam or
   a thin re-export exposing already-accepted compiler/runtime behavior is
   additive and does **not** count against the schema/language/compiler/runtime
   **semantic** protected boundaries, provided those semantic diffs are empty and
   no runtime behavior changes. Direct package consumption remains acceptable and
   no heavier boundary is mandated.
3. **Name `runtimeModelTarget` in the compiler-integration section (§5).**
   Cross-reference `runtimeModelTarget` as the compiler-facing target that yields
   the runtime model consumed in §4, so §5 lists the full compiler-target set
   used by the milestone.
4. **Pin the product-acceptance evidence class as non-CI (§10.1, §14).** State
   that product acceptance is a **recorded reviewer walkthrough** against the six
   §10.1 conclusions — explicitly **not** a mechanical CI requirement and
   **not** subjective usability research — and that passing executable
   conformance (unit/CLI) is **necessary but not sufficient** to close the
   milestone.

Optional (editorial, non-blocking): note in §5 that `genome graph` emits JSON by
default (no `--json` flag). Not required for acceptance.

## Reviewer positions

- **Chief Architect — accept with amendments (Option B).** The RFC defines the
  Studio boundary (A3) with the tightest possible first-view scope, preserves
  Principle 5 across projection *and* execution, keeps the persistence gate and
  provider seam intact, and imposes zero language/schema/compiler/runtime/event
  cost. The four amendments are refinements — making ephemerality (not topology)
  the invariant, pinning the additive-boundary allowance, naming
  `runtimeModelTarget` in §5, and classing product acceptance as non-CI. No
  architectural objection; the concept is sound and the boundary is correct.
- **Lead Engineer — accept with amendments (Option B).** Every material claim
  reproduced clean and uncached (113/113, 0 cached; E1–E9; provider-freeness; no
  log reader). The DoD is executable and correctly separated; Amendment 4 keeps a
  product milestone from closing on unit/CLI tests alone, and Amendment 2 removes
  the only genuine ambiguity an implementer would hit (whether a Studio service
  seam trips a protected boundary). No implementation risk beyond the normal A3
  boundary work; the stop-and-return tripwire is correctly placed.

Disagreements: none material. Both reviewers prefer Option B over Option A solely
to land the four clarifications before implementation begins; neither considers
the RFC unsound.

## Phase-opening lifecycle (Q17)

The Board pins the exact lifecycle; acceptance of RFC-0009 **is** the Phase 4
opening act, in this order:

1. **Board recommends acceptance** (this review — Option B).
2. **Product Owner ratifies** (adopts Option A, B, or C).
3. On ratification of A or B, **RFC-0009 becomes Accepted** (with amendments
   applied first, under B).
4. **Phase 4 becomes Open for Milestone 1 only** — recorded in
   `PROJECT_STATE.md`; `ROADMAP.md` Phase 4 statuses may move to In Progress for
   the Milestone-1 deliverables at that point (a reconciliation act, not
   performed here).
5. **Exactly one implementation item then enters `IMPLEMENTATION_QUEUE.md`**,
   scoped to Milestone 1 per the (amended) RFC's Definition of Done.

Until step 2, Phase 4 stays positioned-but-unopened and the queue gains nothing.

## Decision options

### Option A — Accept RFC-0009 as drafted and open Phase 4 for Milestone 1 upon Product Owner ratification

- **Consequence.** RFC-0009 becomes Accepted as written; Phase 4 opens for
  Milestone 1; one Milestone-1 implementation item enters
  `IMPLEMENTATION_QUEUE.md` on ratification.
- **Required amendments.** None.
- **Phase-state effect.** Phase 4 → Open (Milestone 1 only).
- **Implementation-queue effect.** One Milestone-1 item added on ratification.
- **Main risk.** The four ambiguities ship unresolved: "in-process" vs the
  ephemeral invariant (implementers may over-constrain topology), whether a
  Studio service seam trips a protected boundary (could force an unnecessary
  return-to-Board mid-implementation), and the risk that product acceptance is
  read as either a CI gate or as satisfied by CLI tests alone. All are cheap to
  fix now and costly to discover mid-build.
- **Exact Product Owner ratification statement:**
  > As Product Owner, I ratify **Option A**: I accept RFC-0009 — Phase 4 Governed
  > Authoring as drafted at `14148ee`, and I open **Phase 4 for Milestone 1
  > (Governed Authoring) only**. `RFC/0009-phase-4-governed-authoring.md` is
  > marked Accepted; `PROJECT_STATE.md` records Phase 4 as Open for Milestone 1;
  > exactly one Milestone-1 implementation item is added to
  > `IMPLEMENTATION_QUEUE.md` per the RFC's Definition of Done. No Studio code is
  > written by this act; `ROADMAP.md` re-sequencing (Option B — Autonomy First)
  > remains a separate ratified act.

### Option B — Accept RFC-0009 with amendments and open Phase 4 for Milestone 1 upon Product Owner ratification (Board recommendation)

- **Consequence.** The four required amendments are applied to RFC-0009 (scope,
  demo, evidence set, and protected boundaries unchanged); the amended RFC becomes
  Accepted; Phase 4 opens for Milestone 1; one Milestone-1 item enters
  `IMPLEMENTATION_QUEUE.md` on ratification.
- **Required amendments.** The four in "Required amendments" (ephemeral-session
  invariant; additive-public-boundary allowance; name `runtimeModelTarget` in §5;
  product-acceptance evidence pinned non-CI). Optional editorial `graph`-flag note.
- **Phase-state effect.** Phase 4 → Open (Milestone 1 only), after amendments are
  applied.
- **Implementation-queue effect.** One Milestone-1 item added on ratification,
  scoped to the amended DoD.
- **Main risk.** Minimal — a short amendment pass before implementation; the
  amendments are clarifications with no scope change, so the risk is only the
  small delay of applying them. This is the Board's recommended path precisely
  because it removes the Option-A ambiguities at negligible cost.
- **Exact Product Owner ratification statement:**
  > As Product Owner, I ratify **Option B**: I accept RFC-0009 — Phase 4 Governed
  > Authoring with the four amendments recorded in
  > `docs/reviews/rfc-0009-board-review.md` (ephemeral session boundary as the
  > normative invariant; additive public application interfaces permitted and not
  > counted as semantic changes; `runtimeModelTarget` named in §5; product
  > acceptance evidence pinned as a recorded reviewer walkthrough, not a CI gate),
  > the milestone scope, canonical demo, evidence set, and protected boundaries
  > unchanged. The amendments are applied to
  > `RFC/0009-phase-4-governed-authoring.md`, which is then marked Accepted; I
  > open **Phase 4 for Milestone 1 (Governed Authoring) only**;
  > `PROJECT_STATE.md` records Phase 4 as Open for Milestone 1; exactly one
  > Milestone-1 implementation item is added to `IMPLEMENTATION_QUEUE.md` per the
  > amended Definition of Done. No Studio code is written by this act;
  > `ROADMAP.md` re-sequencing (Option B — Autonomy First) remains a separate
  > ratified act.

### Option C — Return RFC-0009 for revision; Phase 4 remains unopened

- **Consequence.** RFC-0009 returns to Draft for revision; no acceptance is
  recorded; Phase 4 stays positioned-but-unopened.
- **Required amendments.** At the Product Owner's direction; the Board records no
  defect requiring a full return (the four items are in-place amendments, not a
  redesign).
- **Phase-state effect.** None; Phase 4 remains unopened.
- **Implementation-queue effect.** None.
- **Main risk.** Delay without commensurate benefit: the Board found the RFC sound
  and every material claim true, so a full revision cycle costs a Phase-4 opening
  window while resolving nothing that Option B's in-place amendments do not.
- **Exact Product Owner ratification statement:**
  > As Product Owner, I return RFC-0009 — Phase 4 Governed Authoring to the
  > Architecture Board for revision before any acceptance, with the concerns I
  > have noted. Phase 4 remains positioned-but-unopened; no acceptance is
  > recorded, no phase is opened, and no implementation-queue item is added.

## Explicitly not done by this review

- **No edit to `RFC/0009-phase-4-governed-authoring.md`.** The four amendments
  are recorded here; applying them is a post-ratification act under Option B.
- **No phase opened; no option applied.** Phase 4 remains positioned-but-unopened
  pending Product Owner ratification.
- **No `IMPLEMENTATION_QUEUE.md` item added.**
- **No Studio implementation; no `ROADMAP.md` or `docs/PRODUCT_STRATEGY.md`
  change.**
- **No language, schema, compiler, runtime, CLI, event-taxonomy, or test change;
  no ADR created.**
- **No pull request opened.**
- `PROJECT_STATE.md` is reconciled only to record that this Board review has been
  held and its recommendation stands pending ratification (Rule 8);
  `pnpm check-state` remains green.

## Product Owner Ratification (2026-07-18)

The Board review above is **preserved verbatim as recorded at review time**. On
2026-07-18 the Product Owner **ratified Option B** and accepted RFC-0009 — Phase
4 Governed Authoring with the four amendments exactly as recorded above, opening
**Phase 4 for Milestone 1 — Governed Authoring — only** after the amendments are
applied.

**Recorded ratification (verbatim):**

> As Product Owner, I ratify Option B for RFC-0009. Accept RFC-0009 with the four
> amendments exactly as recorded in `docs/reviews/rfc-0009-board-review.md`. This
> ratification opens Phase 4 for Milestone 1 — Governed Authoring — only after
> the amendments are applied. Apply no design changes beyond those four
> amendments.

**The four amendments as ratified** (applied to
`RFC/0009-phase-4-governed-authoring.md`; scope, canonical demo, evidence set,
and protected boundaries unchanged):

1. **Ephemeral session boundary.** The ephemeral session boundary is the
   normative invariant; "in-process" remains the reference mechanism, not a
   required browser/process topology. The accepted invariant: execution state and
   events are session-scoped; they may be discarded when the session ends; no
   durable history is promised; no exported-log reader is introduced; no
   persistence gate is crossed. (RFC §4.)
2. **Additive public application interfaces.** A minimal Studio
   application-service seam or thin re-exports of already-accepted
   compiler/runtime behavior are permitted and do **not** count as language,
   compiler-semantic, runtime-semantic, schema, or event-taxonomy changes,
   provided they add no new business semantics, do not reinterpret existing
   outputs or events, do not own policy or workflow decisions, and preserve the
   protected boundaries. Any interface that changes semantics, events,
   persistence, or execution behavior must return to the Architecture Board.
   (RFC §4, §11.)
3. **Compiler integration.** `runtimeModelTarget` is named explicitly in the
   compiler-integration section alongside the accepted validation, graph, and
   inspect targets. (RFC §5.)
4. **Product-acceptance evidence.** Product acceptance is a recorded reviewer
   walkthrough, not a CI gate; repository health, unit tests, and CLI evidence are
   necessary but not sufficient to close Milestone 1; the milestone close review
   must include a recorded reviewer walkthrough covering the first-five-minutes
   experience and the product success criteria. (RFC §10.1, §14.)

**What this ratification does:**

- **Accepts** RFC-0009 under Option B with the four amendments applied;
  `RFC/0009-phase-4-governed-authoring.md` is marked **Accepted** with this review
  and this ratification referenced.
- **Opens Phase 4 for Milestone 1 (Governed Authoring) only** — recorded in
  `PROJECT_STATE.md`.
- **Adds exactly one accepted Milestone-1 implementation item** to
  `IMPLEMENTATION_QUEUE.md`, scoped to the accepted RFC's Definition of Done.
- **Preserves the adopted scope** (code editor; inline validation; live
  Organization Graph; organization tree; ephemeral governed execution; live
  session event stream; deny-safe park; explicit grant; attributed approval;
  completion; canonical self-hosting demonstration) and **all exclusions** (no
  durable logs; no exported-log reader; no persistence; no provider-specific
  adapter; no trigger auto-initiation; no external side effects; no operative
  repository governance; no branching or concurrency; no Office View; no
  Marketplace; no simulation; no self-improvement).

**What this ratification does not do:**

- **Implements no Studio.** No Studio code, framework, process model, or transport
  is created by this act; implementation follows from the queued Milestone-1 item.
- **Modifies no `ROADMAP.md` or `docs/PRODUCT_STRATEGY.md`.** The Option B —
  Autonomy First `ROADMAP.md` re-sequencing remains a separate ratified act.
- **Changes no language, schema, compiler, runtime, CLI, event taxonomy, ADR, or
  test.** The Language Complexity Budget remains non-binding review guidance and
  is not promoted to a standing requirement by this step.

`pnpm check-state` accompanies this change and remains green.
