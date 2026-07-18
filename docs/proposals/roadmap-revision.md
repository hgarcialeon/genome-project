# Roadmap Revision Proposal — Governed Autonomy vs. Visualization on the Critical Path

- **Instrument:** product-strategy proposal. This document **decides nothing,
  opens nothing, commissions nothing, applies nothing, and modifies no
  committed artifact.** It evaluates whether the committed roadmap sequences
  Genome's defining capability — *governed autonomous organizations* — onto the
  critical path, or over-prioritizes visualization, and it puts three
  mutually-exclusive re-sequencing options to the Product Owner. It is **not an
  RFC and not an implementation plan.** Adopting any option follows the normal
  governance lifecycle (`docs/GOVERNANCE.md`); until the Product Owner acts,
  nothing here has force.
- **Relationship to existing strategy.** This proposal is the **roadmap
  revision proposal** anticipated in `PROJECT_STATE.md` ("Next Expected
  Deliverable") and in the Governed Authoring amendment
  (`docs/reviews/phase-4-planning-packet-amendment.md`, Sequencing note). It
  extends, and does not override, `docs/PRODUCT_STRATEGY.md` (adopted Option A,
  "Trust first"). Where the strategy separated an architecture roadmap from a
  capability roadmap (§6), this proposal asks a sharper question the two-roadmap
  split left open: *of the work that is actually committed, how much is
  presentation and how much is autonomy?*
- **Prepared by:** Architecture Board (proposal assembly), for Product Owner
  disposition.
- **Date prepared:** 2026-07-18.
- **Source of truth:** the repository. Base HEAD `61e4677` (= `origin/main`);
  clean tree; `pnpm check-state` green; RFC-0008 closed
  (`docs/reviews/rfc-0008-implementation-close-review.md`); Governed Authoring
  adopted as Phase 4's planned opening experience
  (`docs/reviews/phase-4-planning-packet-amendment.md`, Product Owner
  disposition 2026-07-18).
- **Inputs:** `ROADMAP.md`, `docs/PRODUCT_STRATEGY.md`, `docs/VISION.md`,
  `docs/CONSTITUTION.md`, `docs/ARCHITECT.md`, `docs/GOVERNANCE.md`,
  `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`,
  `docs/reviews/phase-4-planning-packet.md`,
  `docs/reviews/phase-4-planning-packet-amendment.md`,
  `docs/reviews/self-hosting-evidence-board-review.md`,
  `docs/proposals/self-hosting.md`, the accepted RFCs and ADRs, and the shipped
  reference implementation (`packages/genome-compiler`, `packages/genome-cli`,
  `packages/genome-runtime`, `packages/genome-adapter-reference`).
- **State ownership (Governance Rule 8).** Phase, milestone, objective, and
  blockers live **only** in `PROJECT_STATE.md`. This proposal cites repository
  evidence but owns no state and restates none. Consistent with how the Phase 4
  planning packet and its Governed Authoring amendment were handled — a
  planning/strategy document that advances no governance lifecycle and changes
  no state `PROJECT_STATE.md` owns does **not** require a Rule 8 entry to record
  its preparation — `PROJECT_STATE.md` is left untouched. The phase remains
  positioned-but-unopened, no iteration/milestone/objective is active, and no
  blocker exists; this proposal changes none of that.

---

## Primary question

> **Does Genome's current roadmap put the product's defining capability —
> governed autonomous organizations — on the critical path, or does it
> over-prioritize visualization?**

Short answer, defended in §2: **as committed today, the critical path is
presentation, not autonomy.** Of the three remaining committed phases, two
(Studio, Office View) are view surfaces and one (self-improvement) is the
vision endgame that sits *downstream* of an autonomy substrate — real adapters,
triggers, persistence, observability — that has **no committed home at all**.
Governed Authoring is a real and valuable step, but it advances the *visibility*
of governance, not the *reach* of autonomy: it is a view over execution that
already ships. Whether that ordering is wrong is a product judgment for the
Product Owner; this proposal frames it and offers three coherent answers.

---

## 1. The Roadmap Today (Phases 4–6)

The committed roadmap (`ROADMAP.md`), read exactly as it stands, separated into
the five tiers the strategy's honesty vocabulary requires
(`docs/PRODUCT_STRATEGY.md` §3).

### Accepted phase structure

Phases 0–3 are **closed** (all 2026-07-13, by ratified transition reviews). The
committed forward structure is exactly three phases:

| Phase | Name | Goal (verbatim) | State |
|---|---|---|---|
| 4 | Studio Prototype | "create an Organization IDE" | Positioned; **not opened**. All deliverables Not Started. |
| 5 | Office View | "render the company as a living isometric organization" | Not Started. Prototype queued **Low** in `IMPLEMENTATION_QUEUE.md`. |
| 6 | Self-Improvement Loop | "allow Genome to improve Genome" | Not Started. Reserved by ADR-0006 (proposal-payload RFC). |

Opening any phase requires its own RFC, Board review, and Product Owner
ratification (Governance Rule 2). No Phase 4 opening RFC is commissioned.

### Planned deliverables (named on `ROADMAP.md`, RFC-gated, not built)

- **Phase 4 (Studio):** code editor for Genome YAML; schema validation; live
  preview; organization tree; runtime logs. The **planned opening experience**
  is now **Governed Authoring** (edit-and-see **plus** ephemeral, in-process
  governed execution and a live event stream), adopted 2026-07-18 as *product
  input only*; runtime *durable* logs remain deferred within Phase 4.
- **Phase 5 (Office View):** PixiJS renderer; office layout engine; agent
  sprites; agent states; event-driven animations.
- **Phase 6 (Self-Improvement):** observe; diagnose; propose; branch; validate;
  promote; update Genome.

### Candidate capabilities (evidence justifies an RFC; none commissioned)

Per `docs/PRODUCT_STRATEGY.md` §3, preserved as its 2026-07-14 snapshot — two
rows have since been overtaken by events and are corrected here:

- Initiator- vs executor-scoped gating (Gap 1) — **superseded**: addressed by
  RFC-0007 (executor-scoped participation binding, ADR-0009). No longer an open
  candidate.
- Descriptive self-hosting, Level 1 — **superseded**: shipped and closed as
  RFC-0008 (2026-07-18).

No live "candidate" capability remains from that list; the tier is currently
empty pending new evidence.

### Deferred capabilities (named at a ratified gate; awaiting a consumer)

- **Event persistence / durable logs** — gated on the first consumer requiring
  a durable log (Studio durable runtime logs, or the Phase 6 observe step).
- **Human members as declarable principals (Gap 2)** — deferred at the first
  view-phase RFC that renders principals.
- **Artifact primitive (Gap 3)** — deferred at the Phase 6 proposal-payload RFC
  or an adopted self-hosting Level 2 disposition.
- **Workflow control flow — branching/iteration (Gap 4)** — requires two or
  more independent consumers with executable need.
- **Self-hosting Level 2 (durable exported-log records)** — deferred under the
  persistence gate. **Level 3 (operative governance)** — deferred to Phase 6.

### Aspirational vision (named in vision/README; no phase, gate, or evidence)

- Provider adapters beyond the reference (the ADR-0008 seam ships; adapters do
  not).
- Trigger auto-initiation (event/schedule/webhook binding grammars).
- Simulation (a `docs/VISION.md` verb; the reference adapter *simulates* work
  below the seam, which is not organizational simulation — see §6).
- Memory graph, integrations surface, observability suite, SDK, Marketplace
  (README "Product Layers" framing only).

**The shape this reveals.** The committed critical path is **Studio → Office
View → Self-Improvement**. Two of three committed phases are view surfaces. Every
capability that constitutes *autonomous* operation — real execution, triggers,
persistence, observability, simulation, concurrency — sits in the deferred or
aspirational tiers with **no committed phase**, while Self-Improvement (Phase 6)
depends on most of them and is therefore committed-but-blocked.

---

## 2. Strategic thesis

Genome's defensible differentiators (`docs/PRODUCT_STRATEGY.md` §1;
`docs/VISION.md`; `docs/CONSTITUTION.md`) are six, evaluated here against the
committed roadmap. For each: is it **demonstrated**, and does the committed
sequence **advance** it?

| Differentiator | Demonstrated today? | Does the committed roadmap advance it next? |
|---|---|---|
| The **organization** as the unit of description | ✅ Yes — validate/inspect/graph over a whole-org document; self-hosting example. | Weakly. Studio re-presents the same compiled model in a UI; it deepens *access*, not *scope*. |
| **Governance** as a language/runtime primitive | ✅ Yes — policies, `requiresApprovalFrom`, participation binding (RFC-0007). | Yes, in *visibility*: Governed Authoring makes the gate *visible*. Not in *reach* (no new governed capability). |
| **Deny-safe execution** | ✅ Yes — a run parks when a required approval is absent (E4/E7). | Re-surfaced, not extended. Studio renders the existing deny-safe run. |
| **Attributed & replayable evidence** | ✅ Yes — attributed `approval.granted`; `state()==replay(log)`; byte-determinism under `--clock`. | Re-surfaced ephemerally. **Durable** attribution (the audit trail) stays behind the persistence gate — off the committed path. |
| **Reconciliation** of desired vs observed state | ◑ Partial — the document is desired state, `replay(log)` is observed state, `diff` compares documents; but no shipped path reconciles a *running* org against its declared intent over time. | Not advanced. Reconciliation-over-time needs persistence + observability, neither committed. |
| Eventual **autonomous & self-improving** operation | ✗ Not demonstrated — explicit initiation only, reference adapter only, nothing persists, sequential workflows only. | **Committed as Phase 6, but blocked**: it depends on real effects, triggers, persistence, observability, and artifact primitives — none of which the committed roadmap sequences before it. |

**Reading.** Four differentiators are already demonstrated; the committed next
moves mostly **re-present** them through a view rather than **extend** them. The
two differentiators that are *not* yet real — reconciliation-over-time and
autonomous/self-improving operation — are precisely the ones the committed
roadmap does **not** put on the critical path. Self-Improvement is nominally
committed (Phase 6) but is a promise resting on an un-poured foundation.

**Is that "over-prioritizing visualization"?** Two honest readings coexist:

- **Yes (the autonomy reading).** The product's defining bet is *governed
  autonomous organizations*. Shipping Studio (Phase 4) then Office View (Phase 5)
  is two consecutive visualization phases before a single unit of real autonomy
  exists. A user who adopts on that promise finds a beautiful window onto a
  prototype: the office is "living" only in the sense that a scripted reference
  run animates it. The differentiator that no competitor can copy — *governance
  that actually executes autonomous work, safely* — is perpetually one gate away.
- **No (the adoption reading).** `docs/PRODUCT_STRATEGY.md` §5 names the
  near-term wedge as the **organization author** and the
  **governance-constrained adopter**, both won by *seeing and trusting* governed
  structure, not by real provider execution. "Trust first" (Option A)
  deliberately sequenced trust before surface; Governed Authoring makes the
  trust thesis *felt*. On this reading, visualization-of-governance **is** the
  product's near-term critical path, and autonomy is correctly pulled later by
  real demand rather than pushed early on faith.

Both are coherent; they differ on *who the first adopter is and what converts
them*. That is a Product Owner judgment, not an architectural fact — which is
why §7 offers three options rather than one correction. What the Board asserts
is narrower and factual: **the current roadmap sequences the autonomy substrate
nowhere, and Self-Improvement is committed above an uncommitted foundation.**
Any option the Product Owner adopts should resolve that specific gap.

---

## 3. Capability dependency map

Thirteen capabilities, each with: **user value**; **architectural dependency**
(what must exist beneath it); **required consumer** (the gate — who must exist
to justify building it); **RFC required?**; and **tier** (demonstrated /
commissioned / candidate / planned / deferred / aspirational). Tiers use the
strategy's vocabulary (`docs/PRODUCT_STRATEGY.md` §3); "commissioned" means a
draft is authorized but unratified (none currently).

| Capability | User value | Architectural dependency | Required consumer (gate) | RFC? | Tier |
|---|---|---|---|---|---|
| **Governed authoring** (Studio edit-and-see + governed run view) | High — the author sees and trusts governed structure | Compiler targets (validate/graph/inspect) + ephemeral runtime + event stream; the A3 Studio boundary | The organization author (wedge, §5 user 2) | Yes — Phase 4 opening RFC | **Planned** (adopted as planned opening experience; product input; not commissioned) |
| **Ephemeral governed execution** (in-process run + `subscribe` stream) | High — governance made visible in motion | Shipped `EventLog` + `subscribe` + reference adapter (all ship) | Governed Authoring / Studio | Capability ships; its Studio surfacing needs the Phase 4 RFC | **Demonstrated** as a runtime capability (E4–E9); its view surfacing is Planned |
| **First real provider adapter** | High — real work; graduate from prototype | ADR-0008 adapter seam (ships); a real integration below the seam | An author wanting real execution (strategy A6: "after Studio so demand pulls it") | Yes — RFC against the seam | **Aspirational** (seam ships; adapters do not) |
| **Trigger auto-initiation** | High for autonomy — the org acts without a human starting each run | Runtime initiation model (today explicit-only, RFC-0004 non-goal); a trigger grammar + runtime support | Autonomous operation; plausibly a real adapter first | Yes | **Aspirational** (out of scope today) |
| **Durable event persistence** | Moderate-high — audit trail; cross-session history | The event log (ships); a persistence layer + reader | First consumer needing a durable log (Studio durable logs, or Phase 6 observe) | Yes — strategy A5 | **Deferred** (gated on first consumer) |
| **Observability** (metrics/monitoring over runs) | Moderate-high — operate a running org | Persistence (durable observability needs it); metric declarations exist in schema, but nothing computes them from runs | An operator watching sustained execution; plausibly after adapters+triggers | Yes | **Aspirational** (README framing; no gate) |
| **Simulation** (what-if / rehearsal of org behavior) | High potential — test governance before real effects | Deterministic replay + reference adapter (a foundation only); a scenario/behavior model, metrics computation, time/concurrency (see §6) | An author wanting to rehearse before wiring real providers/triggers | Yes — its own RFC + milestone (§6) | **Aspirational** (a vision verb; not the reference adapter's stubbing) |
| **Workflow branching & concurrency** (Gap 4) | Moderate-high — real orgs are non-linear | Runtime is strictly sequential today; control-flow semantics in language + runtime | ≥2 independent consumers with executable need | Yes | **Deferred / aspirational** (Gap 4 classification) |
| **Human members as declarable principals** (Gap 2) | High — hybrid org charts; humans first-class | Schema/language extension; humans are approval principals, not declarable members | First view-phase RFC that renders principals | Yes | **Deferred** (named gate) |
| **Artifact primitives** (Gap 3) | Moderate — workflows produce/consume artifacts; needed for proposal payloads | Language/schema + runtime | Phase 6 proposal-payload RFC, or a self-hosting Level 2 disposition | Yes | **Deferred** (named gate) |
| **Office View** (isometric living organization) | Moderate — demo/adoption surface | Organization Graph (ships) + event-driven animation; a *living* office needs sustained, event-rich execution (triggers + plausibly persistence) | A demo/adoption audience; meaningfully, a *running* org to animate | Yes — Phase 5 RFC | **Planned** (Phase 5; prototype queued Low) |
| **Marketplace** | Ecosystem — reusable agents/departments/workflows/templates | A stable spec + packaging/distribution; many upstream pieces | An ecosystem of authors (arrives after the spec is proven) | Yes | **Aspirational** ("What Genome Is Not," near-term) |
| **Self-improvement** (observe→diagnose→propose→validate→promote) | The vision endgame — the org improves the org | Persistence + observability (observe) → diff (ships) + artifact primitive + proposal payload (propose) → governed execution (validate/promote) | A running org producing observable evidence to improve from | Yes — Phase 6 proposal-payload RFC (reserved by ADR-0006) | **Planned** (Phase 6; deferred deliverables) |

**Two structural facts fall out of the map:**

1. **A single autonomy spine runs through the deferred/aspirational tiers.**
   real adapter → real effects; triggers → unattended initiation; persistence →
   durable evidence; observability → operate over time; simulation → rehearse
   safely; and self-improvement sits at the end of that spine. These are not
   independent wishes; they are a *dependency chain* with an order.
2. **Self-improvement (committed, Phase 6) is downstream of five uncommitted
   capabilities.** As placed, Phase 6 cannot open on its own terms: its
   "observe" step needs persistence + observability; its "propose" step needs
   the artifact primitive; its "validate/promote" steps need governed execution
   against real (or convincingly simulated) effects. The roadmap commits the
   summit while leaving the approach un-routed.

---

## 4. Office View disposition

The Board does **not** assume Phase 5's standalone placement is correct. Four
dispositions, compared on the same axes.

| Disposition | What it means | For | Against |
|---|---|---|---|
| **(a) Keep as standalone Phase 5** (status quo) | Office View remains its own committed phase after Studio | Preserves a named, motivating demo surface; honors the README "Product Layers" identity | A *living* office needs sustained, event-rich execution to animate; before triggers/persistence exist, it renders scripted reference runs — a puppet show. It is a **second** visualization phase committed ahead of any real autonomy. |
| **(b) Fold into Studio as an alternate projection** | Office View becomes a Studio "view mode" (graph view ↔ isometric view) over the same compiled graph + runtime events | Principle 5 says every view is a projection of one model; avoids a separate phase and a second view boundary; reuses the A3 Studio boundary | Dilutes the distinct "living office" product identity; pulls a heavy renderer (PixiJS) into Studio's scope and milestone. |
| **(c) Defer until after autonomy** | Office View is sequenced *after* real adapters + triggers + persistence exist | The isometric office becomes genuinely *alive* — real, ongoing, attributable execution to render; the demo lands as substance, not theater | Loses an early, high-appeal marketing surface; a longer wait to any flashy visual. |
| **(d) Remove from the committed roadmap; preserve as VISION** | Office View leaves the committed phases; stays in `docs/VISION.md`/README as a labeled aspiration | Most honest: Office View is a *presentation* aspiration, not a capability any differentiator requires; frees the roadmap to commit to autonomy | Removes a named, motivating artifact from the committed plan (mitigated: it remains VISION-labeled and can re-enter via an RFC when its consumer — a live org — exists). |

**Board reading (not a decision).** Office View's value is real but **derivative
and downstream**: it is most compelling exactly when there is autonomous
execution to show, which is the capability the roadmap has *not* committed.
Keeping it as a standalone Phase 5 (a) is the weakest justified position — it
commits a second visualization phase ahead of the substance it would visualize.
(b), (c), and (d) each resolve that in a different way; the three options in §7
carry them: Option A retains (a), Option B adopts (c)/(b), Option C adopts (b)
as a UX-track projection.

---

## 5. Autonomy track

**Does Genome need an explicit autonomy track** — a committed home for provider
adapters, triggers, real external effects, persistence and observability,
simulation, and controlled self-improvement?

**The Board's assessment: yes.** The §3 map shows these six are not scattered
independent features; they are one dependency spine that terminates in the
vision's endgame. Today they have **no committed home** — they live in the
deferred and aspirational tiers — while presentation has two committed phases.
That is the precise mechanism by which the roadmap "over-prioritizes
visualization": not by over-investing in Studio (Governed Authoring is
well-justified), but by leaving autonomy *unsequenced entirely*. An explicit
track makes the spine visible, gives Self-Improvement a routed approach, and
forces each real-effect capability through its own gate rather than smuggling it
in as a Studio or Office View sub-deliverable.

**How it should be structured — three shapes, with the trade-off:**

- **Reordered linear phase sequence** (autonomy phases inserted after Phase 4).
  *For:* fits existing per-phase governance unchanged — each phase closes via a
  transition review; simplest to adopt. *Against:* imposes a total order on
  capabilities that are only partially ordered (persistence and simulation are
  not strictly sequential), and it forces a single-file march that may stall the
  UX wedge while autonomy is built.
- **Parallel roadmap track** (a UX track and an autonomy track advancing
  concurrently, with explicit cross-track dependency gates). *For:* mirrors the
  strategy's existing architecture/capability two-roadmap split
  (`docs/PRODUCT_STRATEGY.md` §6), now as committed *delivery* tracks; lets each
  track be judged on its own criteria and advance on real demand. *Against:*
  `docs/GOVERNANCE.md` defines phase-transition review **per phase, not per
  track** — a parallel track needs a governance amendment defining how a track
  advances and how cross-track gates are reviewed. That is itself an ADR-level
  decision.
- **Capabilities embedded inside existing phases** (autonomy pieces absorbed as
  Phase 5/6 sub-deliverables). *For:* least disruptive; no new phase or track.
  *Against:* hides the dependency spine and reproduces today's problem —
  autonomy as scattered gated items with no visible order — and would quietly
  expand Phase 5/6 scope past what a single transition review can honestly close.

**Board reading.** The embedded shape is the weakest (it re-creates the current
opacity). The linear reorder is the smallest honest change and fits governance
as-is (Option B). The parallel track is the most expressive and best matches the
strategy's own mental model, at the cost of a governance amendment (Option C).
The Board does not decide here; §7 carries both live shapes.

---

## 6. Simulation

Assessed as a **first-class product capability**, explicitly **not** assuming it
is "almost free" because deterministic replay already exists.

**What current deterministic execution and replay actually provide.**

- `genome run` executes **one explicitly-initiated** workflow through the
  **reference adapter**, which *simulates* agent work with no provider and no
  network (RFC-0006), with **scripted** per-step outcomes (`--fail-step`).
- Output is **byte-deterministic under `--clock`** (E9); `replay(log)`
  reconstructs reported state exactly (`state()==replay(log)`).
- So today we have: deterministic, reproducible, side-effect-free execution of a
  *single* workflow with a *scripted* result and *no model of what an agent
  does*.

**What is still missing for meaningful *organizational* simulation** — each a
real language/runtime addition, none of it a byproduct of replay:

1. **A scenario/input model.** Simulation needs varied inputs, environmental
   conditions, and outcome distributions. Today outcomes are hand-scripted
   (succeed / `--fail-step`), not modeled.
2. **A behavioral model of agents.** To simulate *autonomous* work you must
   model what an agent *does*; the reference adapter is a stub that returns, not
   a behavior that decides.
3. **Time and scheduling.** Organizational simulation runs *over time* and needs
   triggers/schedules to drive ongoing, multi-workflow activity — today
   initiation is explicit and one workflow at a time.
4. **Concurrency and interaction.** Real orgs run overlapping workflows that
   contend and interact; the runtime is strictly sequential (Gap 4).
5. **Metrics computed from runs.** Simulation's payoff is comparing outcomes
   against objectives/metrics; metrics exist as *declarations* only — nothing
   computes them from execution.

**Before or after real adapters and triggers?** Simulation depends on the
*modeling* substrate (a behavior model, time/scheduling, concurrency, metrics)
but should precede *real external effects*. Its highest product value is as the
**rehearsal space** that lets an author exercise governance, triggers, and
workflows **without real-world consequences** — i.e., simulate first, then wire
real providers. So simulation sits **between** the trigger/concurrency modeling
work and the first *real-effect* adapter: it needs enough of the autonomy model
to be meaningful, and it earns its keep by de-risking the real adapters that
follow. Placing it *before* any autonomy modeling makes it hollow; placing it
*after* real effects forfeits its rehearsal value.

**Own RFC and milestone?** **Yes.** Simulation is not "replay with a UI." It
requires a scenario model, an agent-behavior model, metric computation, and
time/concurrency semantics — each a first-class addition with its own boundary
and evidence. It must not be smuggled in on the strength of existing
determinism. It warrants a dedicated RFC and milestone within whichever
autonomy structure the Product Owner adopts.

---

## 7. Revised roadmap options

Exactly three, mutually exclusive. Each is a coherent re-sequencing of the same
RFC-gated work — none changes scope, and none is self-executing. All three keep
**Phase 4 with Governed Authoring** as the opening experience (adopted
2026-07-18) and keep every capability RFC-gated.

### Option A — Presentation first

- **Sequence.** Phase 4 (Studio: Governed Authoring opening, then durable
  runtime logs as a later Phase 4 milestone) → Phase 5 (Office View, standalone)
  → Phase 6 (Self-Improvement). Autonomy capabilities remain deferred/aspirational,
  pulled in as consumers appear. Office View disposition **(a)**.
- **What changes from today.** Essentially nothing structural: this ratifies the
  status-quo sequence and confirms Governed Authoring as the Phase 4 opening.
- **What remains unchanged.** The entire phase structure; every gate; the
  strategy's "Trust first" adoption.
- **Main product benefit.** Fastest to a visible, demoable authoring +
  governance surface; strongest near-term adoption wedge; lowest governance
  churn; directly serves strategy §5 users 2–3.
- **Main architectural risk.** The defining capability — governed *autonomous*
  operation with real effects — stays off the committed critical path; Phase 6
  remains committed above an uncommitted foundation; two visualization phases
  ship before any real autonomy exists.
- **Expected evidence at each major gate.** Phase 4 opening RFC: empty
  compiler/runtime/schema/CLI **production** diff, Principle 5 held (the
  RFC-0006/0007/0008 precedent). Governed Authoring milestone: E4–E9 rendered
  live; deny-safe park → grant → complete with attributed approval. Phase 5
  RFC: Office View as a projection over graph + events, no business logic in the
  view. Phase 6 RFC: proposal-payload contract (ADR-0006) — **and an honest
  finding that its upstream dependencies are unbuilt**.
- **Governance action required to adopt.** Product Owner records the disposition
  (sequence unchanged); commissions the Phase 4 opening RFC per adopted Option A
  ordering. **No `ROADMAP.md` edit is required** (the committed sequence already
  matches).

### Option B — Autonomy first

- **Sequence.** Phase 4 (Studio: Governed Authoring) → **new Phase 5 — Autonomy
  Substrate**: first real provider adapter → trigger auto-initiation → durable
  event persistence → observability, with **simulation** sequenced as the
  rehearsal layer *before* the first real-effect adapter is exercised against
  real consequences → Office View **deferred behind autonomy** (disposition
  **(c)**, or folded into Studio per **(b)**) → **Phase 6 — Self-Improvement**,
  now actually unblocked. A **reordered linear phase sequence** (§5).
- **What changes from today.** Office View is demoted from a standalone Phase 5
  to *after* the autonomy substrate; a committed Autonomy Substrate phase becomes
  the critical path; adapters/triggers/persistence/observability/simulation move
  from deferred/aspirational to **planned and sequenced** (still each
  RFC-gated).
- **What remains unchanged.** Phase 4 and Governed Authoring; deny-safe
  governance semantics; Principle 5; every RFC gate; Self-Improvement remains
  last.
- **Main product benefit.** Puts the defining differentiator — governed
  *autonomous* organizations doing real, attributable work — on the committed
  critical path, and makes Self-Improvement reachable rather than aspirational.
  The strongest possible answer to "is the roadmap serious about autonomy?"
- **Main architectural risk.** Front-loads the hardest, least-demoable work; a
  **real** adapter introduces **real external effects** and provider coupling —
  the churn Genome's durable-artifact thesis warns against — and doing it before
  a proven simulation layer means real consequences precede a rehearsal space
  unless simulation is genuinely sequenced first; higher governance load
  (several new RFCs); slowest to a flashy visual.
- **Expected evidence at each major gate.** Adapter RFC: a **second**
  implementation proves the ADR-0008 seam with an empty runtime-core diff; a real
  provider call **behind** the seam; deny-safe gating and attribution preserved.
  Trigger RFC: an initiation grammar that moves explicit → triggered **without**
  weakening deny-safe parking or attribution; determinism story for scheduled
  runs. Persistence RFC (A5): a durable log whose `replay` still equals reported
  state; the first real durable-log consumer named. Observability: metrics
  **computed** from replayable logs, reconciled against declared objectives.
  Simulation RFC: rehearsal outcomes reproducible and clearly *marked
  non-real*, sequenced before real-effect exercise. Phase 6 RFC: proposal
  payloads as reviewable Genome diffs, validated through governed execution.
- **Governance action required to adopt.** Product Owner records the
  disposition; **directs preparation of a separate `ROADMAP.md` revision** that
  re-sequences the phases (a distinct ratified act — this proposal applies
  none); commissions the Phase 4 opening RFC, then the autonomy-substrate RFC
  sequence in order.

### Option C — Dual track

- **Sequence.** Two committed tracks advancing in parallel with explicit
  dependency gates.
  - **UX track:** Studio (Governed Authoring) → Studio durable runtime logs
    (gated on the autonomy track's persistence RFC) → Office View **as a Studio
    projection** (disposition **(b)**, gated on the autonomy track's triggers +
    persistence so the office is genuinely live).
  - **Autonomy track:** first real adapter → triggers → persistence →
    observability → simulation (rehearsal layer).
  - **Convergence gate:** **Self-Improvement opens only when both tracks reach
    the required maturity** — governed execution (UX) **and** persistence +
    observability + artifact primitive (autonomy) all demonstrated.
- **What changes from today.** Introduces a **parallel two-track roadmap** (§5);
  Office View becomes a UX-track projection rather than a standalone phase;
  autonomy gets a committed home; a named convergence gate precedes Phase 6.
- **What remains unchanged.** Phase 4/Governed Authoring; all RFC gates;
  deny-safe governance; Principle 5; Self-Improvement as the terminal
  convergence.
- **Main product benefit.** Both the adoption wedge (UX) and the defining
  capability (autonomy) advance concurrently on their own criteria; cross-track
  dependency gates make "which capability pulls which" explicit; the Product
  Owner is not forced to choose visualization *or* autonomy.
- **Main architectural risk.** Highest governance complexity:
  `docs/GOVERNANCE.md` defines phase-transition review per phase, not per track,
  so this requires a **governance amendment (ADR)** defining track advancement
  and cross-track gate review; risk of coordination overhead, half-finished
  tracks, and a convergence gate that becomes a bottleneck.
- **Expected evidence at each major gate.** Per-track RFC evidence as in Options
  A and B, **plus** explicit cross-track gate evidence (e.g., "Studio durable
  logs milestone opens only on the merged persistence RFC's evidence"; "Office
  View projection opens only on merged triggers + persistence"), **plus** a
  convergence-gate evidence bundle (governed execution + persistence +
  observability + artifact primitive all demonstrated) before any Phase 6
  Self-Improvement RFC.
- **Governance action required to adopt.** Product Owner records the
  disposition; **directs two separate ratified acts** — (1) a `ROADMAP.md`
  restructure into tracks and (2) a `docs/GOVERNANCE.md` amendment (an ADR)
  defining track advancement and cross-track gates — then commissions the Phase
  4 opening RFC and the first autonomy-track RFC in parallel. This proposal
  applies none of these.

---

## 8. Recommendation

**The Board recommends Option B — Autonomy first.**

The primary question's honest answer (§2) is that the committed roadmap
sequences the autonomy substrate nowhere and commits Self-Improvement above an
uncommitted foundation. Option B is the **smallest structural change that
corrects exactly that**: it preserves the adopted Governed Authoring wedge (so
"Trust first" is honored and the first new surface still makes governance
*felt*), then commits the autonomy spine — with simulation correctly placed as
the rehearsal layer before real effects — instead of a second visualization
phase, and it does so within the existing per-phase governance model (no
governance amendment, unlike Option C). It puts the product's defining
capability on the critical path and makes Self-Improvement reachable rather than
promised. Office View is not lost; it is deferred to the point where it has a
live organization to render (disposition (c)/(b)).

**The strongest argument against the Board's own recommendation.** Option B
bets that early adopters want real autonomous execution more than a polished,
trustworthy authoring-and-governance surface — but the **adopted strategy says
the opposite**. `docs/PRODUCT_STRATEGY.md` §5 names the near-term wedge as the
organization author and the governance-constrained adopter, both of whom are won
*first* by seeing and trusting governed structure, not by a real provider
adapter; §1 stakes the product on the *specification* as the durable artifact,
explicitly *not* on provider integrations, which "churn." Option B front-loads
the least-demoable, highest-risk work and introduces **real external effects and
provider coupling** — the very churn the thesis warns against — into the
critical path, ahead of the adoption the strategy says funds everything else. If
the wedge thesis is right, Option A reaches paying attention faster, and Option
B spends the project's scarce cycles proving autonomy to an audience that has
not yet adopted the spec. In one line: **Option B optimizes for the vision's
endgame at the possible cost of the strategy's stated near-term wedge — and if
the wedge is right, Option B is premature.** The Product Owner, who owns
sequencing and product priorities (`docs/ARCHITECT.md`; `docs/GOVERNANCE.md`),
is the correct authority to weigh that bet; the Board's recommendation is
advisory.

---

## 9. What Genome Can Do

A concise capability narrative for later adaptation into the README or website.
**Every line is labeled.** Standing rule: a **NOW** claim requires CLI-boundary
evidence in the repository; **NEXT** requires an adopted plan (not merely a wish);
**LATER** is named at a ratified gate but uncommitted; **VISION** is directional
only. **No aspirational claim may be presented as current or committed.**

**NOW — demonstrated today, re-runnable at a terminal:**

- Describe an entire organization declaratively — departments, agents,
  workflows, policies, objectives, metrics — in one document. **[NOW]**
- Validate it mechanically; invalid organizations are rejected. **[NOW]**
- Compile it into a typed Organization Graph. **[NOW]**
- Structurally diff two versions, with `diff(1)` exit codes. **[NOW]**
- Execute one workflow end-to-end through a reference adapter. **[NOW]**
- Governance that executes: a run **parks deny-safe** when a required approval is
  absent, and completes once granted. **[NOW]**
- Approvals are **attributed and ordered**; the event log **replays** to the
  reported state, byte-identical under a fixed clock. **[NOW]**
- Genome describes and governs **Genome itself** (the self-hosting example).
  **[NOW]**

**NEXT — adopted as planned, RFC-gated, not yet built:**

- Author a living organization in **Studio** and watch it govern itself:
  edit → the Organization Graph redraws → run the workflow → it parks at the
  gate → grant approval → it completes, streamed live and attributed
  (**Governed Authoring**, the planned Phase 4 opening experience). **[NEXT]**

**LATER — named at a gate, uncommitted (sequencing is the subject of this
proposal):**

- Real provider execution — the first adapter beyond the reference. **[LATER]**
- Triggered and scheduled initiation. **[LATER]**
- Durable, cross-session audit history and observability. **[LATER]**
- Organizational simulation / what-if rehearsal. **[LATER]**
- Non-linear workflows — branching and concurrency. **[LATER]**
- Human members as first-class declarable principals. **[LATER]**
- Office View — the isometric living organization. **[LATER]**

**VISION — directional; no phase or gate; never current, never committed:**

- A **self-improving** organization: observe → diagnose → propose → validate →
  promote, producing reviewable Genome diffs. **[VISION]**
- A **marketplace** of reusable agents, departments, workflows, and templates.
  **[VISION]**
- **Hybrid** human + AI organizations described in a single document. **[VISION]**

---

## 10. Product Owner disposition

Ready-to-use ratification text for each option. Selecting one records **product
intent only**; it opens no phase, commissions no RFC, adds no queue item, and
**by itself modifies no document**. Where an option's adoption *directs* a
future `ROADMAP.md` revision (and, for Option C, a governance amendment), those
are **separate ratified acts**; this disposition performs none of them.

### Adopt Option A — Presentation first

> As Product Owner, I adopt **Option A — Presentation first**. The committed
> roadmap sequence stands: Phase 4 (Studio, with Governed Authoring as the
> opening experience), then Phase 5 (Office View, standalone), then Phase 6
> (Self-Improvement); autonomy capabilities remain gated and pulled in as their
> consumers appear. This records product intent only; it opens no phase,
> commissions no RFC, adds no queue item, and modifies no roadmap, SPEC, or
> state document. The Phase 4 opening RFC, commissioned separately per adopted
> strategy Option A, owns the Studio boundary (A3).

### Adopt Option B — Autonomy first

> As Product Owner, I adopt **Option B — Autonomy first**. After Phase 4 (Studio,
> Governed Authoring), the committed critical path becomes an **Autonomy
> Substrate** — first real provider adapter, trigger auto-initiation, durable
> persistence, and observability, with **simulation** sequenced as a rehearsal
> layer before real-effect execution — with **Office View deferred behind
> autonomy** (or folded into Studio), and **Self-Improvement last**, now
> unblocked. This records product intent only; it opens no phase, commissions no
> RFC, adds no queue item, and modifies no document. I **direct that a separate
> `ROADMAP.md` revision** re-sequencing the phases be prepared and brought for
> ratification as its own act; every capability remains RFC-gated.

### Adopt Option C — Dual track

> As Product Owner, I adopt **Option C — Dual track**. Genome's roadmap is
> organized into a **UX track** (Studio Governed Authoring → Studio durable
> runtime logs → Office View as a Studio projection) and an **Autonomy track**
> (real adapter → triggers → persistence → observability → simulation), advancing
> in parallel with explicit cross-track dependency gates, and **Self-Improvement
> opens only at a convergence gate** once both tracks reach the required
> maturity. This records product intent only; it opens no phase, commissions no
> RFC, adds no queue item, and modifies no document. I **direct two separate
> ratified acts**: a `ROADMAP.md` restructure into tracks, and a
> `docs/GOVERNANCE.md` amendment (ADR) defining track advancement and cross-track
> gate review; every capability remains RFC-gated.

### Or decline / defer

> As Product Owner, I take no roadmap-sequencing decision at this time; the
> committed roadmap stands unchanged and this proposal remains available input.

---

## Explicitly not done by this proposal

- **No decision, no application.** No option is adopted; no ratification is
  recorded; every disposition above awaits the Product Owner.
- **No Phase 4 opening RFC** drafted or commissioned; **Phase 4 is not opened.**
- **No implementation** of any kind.
- **No modification** to accepted RFCs, ADRs, `SPEC/`, source, tests,
  `ROADMAP.md`, or `docs/PRODUCT_STRATEGY.md`. `IMPLEMENTATION_QUEUE.md` is
  untouched; no queue item is added.
- **No `PROJECT_STATE.md` change.** This proposal advances no governance
  lifecycle and changes no state `PROJECT_STATE.md` owns; per the Phase 4
  planning-packet and Governed Authoring-amendment precedent, Rule 8 does not
  require recording a planning/strategy document's preparation.
- **`pnpm check-state`** accompanies this change and remains green.

---

## Product Owner Disposition (2026-07-18)

The proposal body above — including §7's three options and §8's recommendation
together with its strongest counter-argument — is **preserved verbatim as
prepared**. On 2026-07-18 the Product Owner **adopted Option B — Autonomy
First** as the **adopted strategic sequencing direction** for the Genome
roadmap. This is a **strategic sequencing decision only**: it does **not** open
Phase 4, does **not** commission the Phase 4 opening RFC, does **not** authorize
implementation, and does **not** by itself authorize provider-adapter, trigger,
persistence, simulation, or self-improvement work.

**Recorded disposition (verbatim):**

> As Product Owner, I adopt **Option B — Autonomy First** from this proposal.
> This is a strategic sequencing decision. It does not open Phase 4, does not
> commission the Phase 4 opening RFC, does not authorize implementation, and
> does not directly authorize provider adapters, triggers, persistence,
> simulation, or self-improvement work.

### The adopted direction

1. **Phase 4 remains the next phase and opens with Governed Authoring** (as
   already adopted, `docs/reviews/phase-4-planning-packet-amendment.md`): author
   a Genome document; validate it; see the live Organization Graph; inspect the
   organization tree; execute an existing workflow ephemerally; observe
   deny-safe parking; grant approval; observe attributed completion.

2. **After the Governed Authoring milestone, the autonomy spine is prioritized
   ahead of a standalone Office View phase**, in dependency order and each still
   behind its own gate:
   - first real provider adapter;
   - trigger-driven initiation;
   - durable evidence and observability, when justified by their first consumer;
   - simulation, when its prerequisites and product boundary are defined;
   - controlled self-improvement, only after those foundations exist.

3. **Office View is not cancelled or de-scoped.** Its current standalone Phase 5
   position is **no longer presumed** to be the next phase after Studio. Its
   final disposition — standalone phase, Studio projection, or later capability
   — must be **proposed separately and governed** before `ROADMAP.md` is
   changed.

4. **All existing architecture and governance gates are preserved:**
   - provider adapters require their own accepted contract and evidence;
   - trigger auto-initiation requires an RFC;
   - exported-log readers and durable event persistence remain gated;
   - simulation must not be treated as free or implied by deterministic replay;
   - workflow control flow, concurrency, and human-member modeling retain their
     recorded evidence gates;
   - self-improvement remains dependent on durable observation, proposal,
     validation, and promotion contracts.

### What this disposition does and does not do

- **Adopts** Option B as the **adopted strategic sequencing direction** —
  strategic intent only. The proposal body, its recommendation, and its
  strongest counter-argument (§8) are unchanged by this adoption; nothing here
  overrides `ROADMAP.md`, `docs/PRODUCT_STRATEGY.md`, `PROJECT_STATE.md`, or any
  ratified decision.
- **Changes strategic sequencing only.** It does **not** by itself rewrite
  `ROADMAP.md` or `docs/PRODUCT_STRATEGY.md`. Re-sequencing the committed phases
  in `ROADMAP.md` remains a **separate ratified act** (Option B's stated
  governance action), to be prepared and brought for ratification on its own;
  this disposition performs none of it.
- **Opens no phase.** Phase 4 remains positioned-but-unopened; opening it
  requires its own RFC, Board review, and Product Owner ratification (Governance
  Rule 2).
- **Commissions and drafts no RFC.** The Phase 4 opening RFC is not commissioned
  by this disposition; per adopted strategy Option A it follows the closed
  RFC-0008. No adapter, trigger, persistence, simulation, or Office View RFC is
  prepared.
- **Adds no queue item and modifies no state document.** `PROJECT_STATE.md`,
  `ROADMAP.md`, `docs/PRODUCT_STRATEGY.md`, and `IMPLEMENTATION_QUEUE.md` are
  untouched; no current state is restated here (Governance Rule 8). This
  disposition advances no governance lifecycle and changes no state
  `PROJECT_STATE.md` owns, so — consistent with the Phase 4 planning-packet and
  Governed Authoring-amendment precedent — Rule 8 requires no `PROJECT_STATE.md`
  entry to record it.
- **Implements nothing** and changes **no** language, schema, compiler, runtime,
  CLI, event taxonomy, ADR, RFC, SPEC, source, or test.

Every capability named in the adopted direction remains RFC-gated and evidence-
gated exactly as recorded above. `pnpm check-state` accompanies this change and
remains green.
