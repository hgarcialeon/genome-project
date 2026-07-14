# Genome Product Strategy (Proposal)

- **Status:** Proposal, prepared 2026-07-14 at the Product Owner's
  direction following the approved bootstrap report. **This document
  decides nothing.** It is not an RFC, it modifies no accepted
  architecture, and it commissions no work. Adopting any option below
  follows the normal governance lifecycle (`docs/GOVERNANCE.md`).
- **State ownership:** phase, milestone, objective, and blockers live
  only in `PROJECT_STATE.md` (Governance Rule 8). This document cites
  repository evidence but owns no state.
- **Inputs:** `docs/VISION.md`, `docs/CONSTITUTION.md`, `ROADMAP.md`,
  `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`, the ratified reviews in
  `docs/reviews/`, and `docs/proposals/self-hosting.md`.

---

## 1. Product Thesis

**The durable artifact of the autonomous-organization era is the
organization's specification — not the prompt, the workflow canvas, the
UI, or the model provider.**

Every layer of the current agent stack is churning: models improve
monthly, orchestration frameworks are rewritten yearly, and provider
APIs break on their own schedules. What an organization *is* — its
structure, roles, workflows, policies, and governance — changes far more
slowly than any of those layers. Genome's bet is that a declarative,
compilable, versioned description of the organization is the stable
layer everything else can be regenerated from, the way infrastructure
survived tool churn once it became `terraform` files and APIs survived
framework churn once they became OpenAPI documents.

Three properties make the thesis defensible rather than merely
plausible, and all three are already demonstrated (§2):

1. **Compilability.** A Genome is not documentation; it compiles through
   a typed pipeline into graphs, runtime models, and diffs. Invalid
   organizations are rejected mechanically.
2. **Governed execution.** Human approval is deny-safe and first-class
   in the execution semantics (Constitution Principle 9), not a UI
   afterthought. A run that requires an ungranted approval parks; it
   does not proceed.
3. **Reproducibility.** Execution produces an append-only event log
   whose replay equals reported state by construction, byte-identical
   under a fixed clock. Organizations can be audited the way builds are.

The corresponding product posture: **Genome competes as a specification
and reference implementation, not as an agent builder.** Agent builders
compete on demos; specifications compete on trust. Trust is earned by
evidence discipline — which this repository already practices
mechanically (`pnpm check-state`, uncached test evidence, phase
transition reviews) — and that discipline is itself a differentiator no
demo-first competitor can cheaply copy.

## 2. Demonstrated Capabilities

"Demonstrated" here has the repository's meaning: executable evidence at
the CLI boundary, re-runnable by anyone at a terminal, verified uncached
in ratified reviews. Everything in this table exists today.

| Capability | What a user can do | Evidence |
|---|---|---|
| Validation | `genome validate <file>` — schema-valid or a mechanical rejection | CLI-boundary tests, `packages/genome-cli/src/cli.test.ts` |
| Inspection | `genome inspect <file>` (`--json`) — organization summary from the compiled AST | Same suite; JSON contract tested |
| Organization Graph | `genome graph <file>` — typed graph of departments, teams, agents, workflows, policies, with `requires`/`owns` edges | Same suite; compiler suite (36 tests) |
| Structural diff | `genome diff <before> <after>` — graph-level diff with `diff(1)` exit codes; revision equality = identity | ADR-0006; exit codes 0/1/2 tested |
| Governed execution | `genome run <file> --workflow <id> [--grant human:...]` — one workflow end-to-end through the reference adapter; deny-safe approval gates; exit 3 when parked | ADR-0008; Board Condition 5 reproduced at bootstrap 2026-07-14 (exit 0, 6 steps) |
| Deterministic replay | `--export-log` NDJSON whose `replay(log)` equals reported final state; byte-identical output under `--clock` | Replay-equality and byte-determinism tests, CLI suite |
| Failure semantics | `--fail-step` — attributable `agent.task.failed` → `workflow.failed`, exit 1 | CLI suite |
| Self-description (partial) | Genome can describe its own governance and execute its ratification workflow, within found limits | `docs/proposals/self-hosting.md`; claims re-executed in `docs/reviews/self-hosting-evidence-board-review.md` |
| Mechanical state honesty | `pnpm check-state` in CI: roadmap statuses, path references, single source of state | `scripts/check-state.mjs` |

Boundary honesty, per the same evidence standard: the runtime executes
**sequential** workflows only, initiation is **explicit** (no triggers),
the only adapter is the **reference** adapter (no provider integration),
and **nothing persists** across process exit except an explicitly
exported log. These are ratified scope decisions, not gaps discovered in
review.

## 3. Planned Capabilities

"Planned" means: named on `ROADMAP.md` or at a ratified gate, **and not
yet authorized** — each item below requires its own RFC, Board review,
and ratification before any work exists. The repository's roadmap
vocabulary today distinguishes demonstrated from planned; this proposal
additionally separates two further tiers the bootstrap report found
undifferentiated, so that no reader can mistake aspiration for plan:

- **Planned** — a roadmap phase or a ratified gate names it.
- **Candidate** — evidence has been classified as justifying an RFC,
  but the Product Owner has not commissioned one.
- **Aspirational** — named in vision or README framing with no phase,
  gate, or evidence attached.

| Tier | Capability | Where it stands |
|---|---|---|
| Planned | Studio prototype (Monaco editing, schema validation, live preview, organization tree, runtime logs) | Phase 4 on `ROADMAP.md`; opening RFC not commissioned |
| Planned | Office View (isometric rendering of the live organization) | Phase 5; prototype queued Low in `IMPLEMENTATION_QUEUE.md` |
| Planned | Self-improvement loop (observe → diagnose → propose → validate → promote) | Phase 6; proposal payload reserved by ADR-0006 |
| Planned (gated) | Event persistence | Gated on the first consumer requiring a durable log |
| Planned (gated) | Human members as declarable principals (Gap 2) | Deferred at the first view-phase RFC rendering principals |
| Planned (gated) | Artifact primitive (Gap 3) | Deferred at the Phase 6 proposal-payload RFC or a Level 2 disposition |
| Candidate | Initiator- vs executor-scoped gating semantics/diagnostics (Gap 1) | Classified RFC candidate 2026-07-14; commissioning with the Product Owner |
| Candidate | Descriptive self-hosting, Level 1 | Recommended in `docs/proposals/self-hosting.md`; disposition pending |
| Aspirational | Provider adapters beyond the reference (the seam ships; adapters do not) | Explicitly out of scope today |
| Aspirational | Trigger auto-initiation (event/schedule/webhook grammars) | Explicitly out of scope today |
| Aspirational | Workflow control flow (branching/iteration, Gap 4) | Requires ≥ 2 independent consumers with executable need |
| Aspirational | Memory graph, integrations surface, observability suite, SDK, Marketplace | Vision/README framing only; no phase or gate |

A companion recommendation (no edit made here): the README's
"compile that declaration into" list mixes all four tiers without
marking; whichever strategic option is adopted, that list should be
tier-labeled so the public framing carries the same honesty the roadmap
does. That edit would follow this proposal's disposition, not precede it.

## 4. Roadmap versus Long-Term Vision

These are different instruments and the strategy keeps them separated:

- **The roadmap** (`ROADMAP.md`) is an evidence-gated commitment
  device. Items enter through RFCs, carry one of five mechanical
  statuses, and phases close only through Board review. The roadmap may
  *shrink* (de-scoping is a ratified move) and is falsifiable at every
  row.
- **The vision** (`docs/VISION.md`) is directional and not time-bound:
  *describe a company once; compile it into an autonomous organization*.
  It is allowed to exceed any current plan, and no vision statement
  creates work.

The bridge between them is exactly one mechanism: a vision claim becomes
roadmap reality only by passing through evidence (a consumer, a gate, an
RFC). The self-hosting review is the template — vision-level claims were
converted into five classified gaps with named gates rather than into a
feature list. Strategy, in this document's sense, is choosing **which
vision claims to push through that bridge next, and in what order** —
which is what §7's options put to the Product Owner.

## 5. Target Users

In adoption order, with the near-term wedge first:

1. **User zero — this project itself.** Genome describes and governs
   Genome (partially demonstrated). Every language gap found this way
   was found before an external user hit it. Self-hosting keeps the
   feedback loop internal, free, and honest.
2. **The organization author** (near-term wedge): a technical founder,
   staff/platform engineer, or ops architect at an AI-native company who
   is already coordinating multiple agents and has nowhere durable to
   write down *how the organization works*. Comfortable with YAML, git,
   and CLIs; values reviewability over dashboards. Genome's demonstrated
   surface (validate/inspect/graph/diff/run) already serves this user
   end-to-end at prototype scale.
3. **The governance-constrained adopter:** teams in regulated or
   audit-heavy contexts (fintech ops, compliance, healthcare back
   office) for whom deny-safe approvals, attributable grants, and
   replayable logs are the *purchase criteria*, not features. Genome's
   Principle 9 posture is rare in the agent market and demonstrated
   today.
4. **The ecosystem builder** (medium-term): tool authors who build
   views, provider adapters, and analyzers against the compiler targets
   and the adapter seam. They adopt specifications, not products; they
   are won by contract stability (ADR-0003/0004/0008) and lost by churn.
5. **The hybrid organization at large** (long-term): organizations
   declaring human and AI members in one document — the audience the
   vision names. Deliberately not a near-term target: Gap 2 (humans as
   declarable members) is deferred at the view-phase gate, and reaching
   this user before that gate would misrepresent the language.

Who Genome does **not** target: consumers wanting a no-code agent
builder, teams wanting a hosted chat product, and buyers seeking a
provider-locked orchestration suite. The Constitution's "What Genome Is
Not" list is a market-positioning asset and this strategy treats it as
binding.

## 6. Two Roadmaps

The proposal separates the **architecture roadmap** (sequence of
boundary-setting decisions, owned by the Architect) from the
**capability roadmap** (sequence of user-visible abilities, owned by the
Product Owner). They advance together but are reviewed on different
criteria: architecture moves are judged by coherence and reversibility,
capability moves by user value. Neither table below authorizes anything;
every row is RFC-gated.

### 6.1 Architecture Roadmap (proposed sequencing)

| Order | Architectural move | Gate / instrument | Why this order |
|---|---|---|---|
| A1 | Close the Gap 1 semantics/diagnostics question | Gap 1 RFC (candidate, commissionable now) | The one demonstrated silent-failure class in the language; every later consumer (Studio, external authors) inherits it if unaddressed |
| A2 | Specification-maintenance mechanism (erratum registry) | Short ADR per the pending §4 proposal (`docs/reviews/phase-3-close-packet.md`) | Cheap; unblocks honest text corrections (e.g. stale RFC-0000/0001 status headers) before document count grows |
| A3 | Studio boundary definition | Phase 4 opening RFC | First view must prove Principle 5 (views own no business logic) and consume only compiler targets; sets the pattern for every later view |
| A4 | Human-member primitive (Gap 2) | Addressed or explicitly re-deferred *inside* the first view RFC that renders principals | The ratified gate; deciding it separately from the view that exposes it would be speculative |
| A5 | Event persistence | RFC when its first consumer appears (plausibly Studio runtime logs) | Ratified gate; persistence before a consumer is stored speculation |
| A6 | First real provider adapter | RFC against the ADR-0008 seam | Proves the seam with a second implementation; deliberately after Studio so demand pulls it |
| A7 | Artifact primitive (Gap 3), then Phase 6 proposal payload | Phase 6 proposal-payload RFC (reserved by ADR-0006) | The self-improvement loop cannot be specified without deciding what an artifact is |

Sequencing constraints the table respects: A1 and A2 are independent of
each other and of A3, so they can run in either order or alongside Phase
4 planning; A4 cannot precede A3; A7 closes the loop the vision names
and should come last. Nothing here reopens any accepted decision.

### 6.2 Capability Roadmap (proposed sequencing)

| Order | User-visible capability | Target user (§5) | Builds on |
|---|---|---|---|
| C1 | Trustworthy authoring: a Genome that *reads* as governed *is* governed (or the author is told why not) | Organization author; governance-constrained adopter | A1 |
| C2 | Genome describes Genome, committed as a maintained example | User zero; ecosystem builder (it is the canonical non-toy document) | Level 1 disposition |
| C3 | Edit-and-see: author a Genome with validation, preview, and org tree in an IDE surface | Organization author | A3 (Phase 4) |
| C4 | Watch it run: runtime logs surfaced in Studio | Organization author; governance-constrained adopter | A3, plausibly A5 |
| C5 | Declare your humans: hybrid org charts with human members first-class | Hybrid organization; governance-constrained adopter | A4 |
| C6 | Run it for real: first provider adapter executes actual agent work | Organization author graduating from prototype | A6 |
| C7 | Show the organization: Office View rendering of live state | Demo/adoption surface for all users | Phase 5, A4 |
| C8 | The organization improves itself: observe → propose loop producing reviewable Genome diffs | The vision's full audience | A7, C6 |

The two roadmaps make one dependency explicit that a single list hides:
**capability C1 — trust in the flagship governance semantics — is
upstream of every other capability**, because Studio (C3) would otherwise
give more users a faster way to write silently-ungated documents, and
adapters (C6) would execute them against real providers.

## 7. Three Strategic Options for the Product Owner

Each option is a coherent sequencing of the same RFC-gated work, not a
different scope. None is self-executing: choosing one commissions
drafting and reviews through the normal lifecycle, nothing more.

### Option A — Trust first ("the specification keeps its promises")

**Sequence:** A1 (Gap 1 RFC) → A2 (erratum ADR) + Level 1 self-hosting
disposition → then the Phase 4 opening RFC.

- **Thesis served:** doubles down on the trust differentiator — ship no
  new surface until the one known place where a declared gate can
  silently fail to bind is closed and the language's canonical example
  is Genome itself.
- **Cost:** Studio start delayed by roughly the Gap 1 RFC cycle; no new
  demo surface in the interim; momentum risk if the Gap 1 RFC uncovers a
  larger semantic question than expected.
- **Best if:** the Product Owner believes early adopters are the
  governance-constrained kind (§5, user 3), for whom one silent-failure
  anecdote costs more than a quarter of UI progress.

### Option B — Product first ("make the wedge user feel it")

**Sequence:** Phase 4 opening RFC now (A3); Gap 1 sequenced within
Phase 4 — either as a condition inside the Studio RFC (Studio must
surface gate-binding diagnostics) or as the first item after it; A2
alongside as a cheap parallel act.

- **Thesis served:** the organization author (§5, user 2) gets
  edit-and-see (C3) soonest; Studio becomes the forcing function that
  pulls persistence (A5) and human members (A4) through their gates on
  real demand rather than anticipation.
- **Cost:** the Gap 1 window stays open while the authoring surface
  grows — more documents written against semantics known to under-bind;
  the Board's recorded warning that for this gap "waiting for more
  evidence means waiting for harm" is accepted as a managed risk.
- **Best if:** the Product Owner believes adoption momentum and a
  visible product surface matter more right now than closing a defect
  class no external user has yet hit — and is willing to write the
  Gap 1 condition into the Studio RFC so the risk has a named owner.

### Option C — Ecosystem first ("win the standard, let others build the products")

**Sequence:** A1 + A2 + Level 1 (as in Option A), then **A6 (first real
provider adapter) and external-author enablement** (spec/site polish,
tier-labeled README, canonical examples) **before any view phase**;
Phases 4–5 deferred until ecosystem signal exists.

- **Thesis served:** takes the strategic analogy literally — Terraform
  won as a specification with providers, not as a UI. A second, real
  adapter proves the seam; external documents supply the consumer
  evidence Gaps 2 and 4 are waiting for, letting real demand rather than
  internal guesses drive the language.
- **Cost:** slowest to any visual surface, hardest to demo, and it
  spends the project's discipline advantage on an audience (ecosystem
  builders) that typically arrives *after* a product proves the spec
  matters. Highest risk of winning an argument no one is having yet.
- **Best if:** the Product Owner reads the market as standard-hungry now
  — multiple teams building agent orgs with no shared description layer
  — and believes a reference UI can be late without being fatal.

**Comparative note (for decision, not as a recommendation):** the
options differ almost entirely in *when* Gap 1 closes and *what pulls
the next architecture through its gate* — user trust (A), Studio demand
(B), or external demand (C). A2 (the erratum ADR) is near-free under all
three and could be disposed of in the same sitting regardless of choice.

## 8. What Adopting This Document Means

If the Product Owner adopts a strategic option, the recorded next acts
are: an entry in `PROJECT_STATE.md`'s objective/deliverable sections
naming the chosen option, and the commissioning of the first RFC that
option sequences. This document then serves as strategy context for
future RFCs and reviews; it never overrides `ROADMAP.md`,
`PROJECT_STATE.md`, or any ratified decision, and its roadmaps (§6) are
re-sequenced at will by the Product Owner without amendment ceremony.
