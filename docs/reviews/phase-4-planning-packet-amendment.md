# Phase 4 Planning Packet — Amendment: Governed Authoring

- **Instrument:** product-planning packet **amendment**. Like the packet it
  amends (`docs/reviews/phase-4-planning-packet.md`), this document **decides
  nothing, opens nothing, commissions nothing, and applies nothing.** It amends
  the *planning input* to the eventual Phase 4 opening RFC — no more. It proposes
  extending the currently adopted planned opening milestone (**Candidate C —
  Edit-and-see**, adopted by the Product Owner 2026-07-15) with **ephemeral,
  in-process governed execution and a visible live event stream**, and it puts
  that extension to the Product Owner for disposition. Until the Product Owner
  acts, nothing here has force.
- **Relationship to the original packet:** this amendment **does not modify**
  `docs/reviews/phase-4-planning-packet.md`. That packet, its recommendation,
  and its recorded 2026-07-15 Product Owner disposition stand exactly as
  written. This is an additive companion document.
- **Prepared by:** Architecture Board (packet assembly), for Product Owner
  disposition.
- **Date prepared:** 2026-07-18.
- **Proposed direction:** **Governed Authoring** — Edit-and-see, plus watching a
  declared organization *govern itself* as it runs, entirely in-process and
  entirely ephemeral.
- **Source of truth:** the repository. Base HEAD is merged `main` carrying the
  closed RFC-0008 (`docs/reviews/rfc-0008-implementation-close-review.md`,
  Option A, 2026-07-18); clean tree; `pnpm check-state` green.
- **Inputs:** `docs/reviews/phase-4-planning-packet.md` (the packet amended
  here), `ROADMAP.md` (Phase 4 deliverables), `docs/PRODUCT_STRATEGY.md`
  (adopted Option A "Trust first"; §6 the two roadmaps, C3/C4; §7 options),
  `docs/CONSTITUTION.md` (Principles 5, 6, 9), `docs/ARCHITECT.md`,
  `RFC/0008-self-hosting-example.md` and `SPEC/examples/genome-project.yaml`
  (the canonical demo document and its evidence), and the shipped reference
  implementation (`packages/genome-compiler` targets; `packages/genome-cli`
  command surface; `packages/genome-runtime` event log and approval gates).
- **State ownership:** phase, milestone, objective, and blockers live **only**
  in `PROJECT_STATE.md` (Governance Rule 8). This amendment cites repository
  evidence but owns no state and restates none. It records no current status.
  Because it changes no state `PROJECT_STATE.md` owns — Phase 4 remains
  positioned-but-unopened, no iteration/milestone/objective is active, and no
  blocker exists — and because a planning packet is not a governance review that
  advances the lifecycle, **Rule 8 does not require a `PROJECT_STATE.md` entry
  to record this amendment's preparation.** It is left untouched, consistent
  with how the original packet was handled.

---

## What this amendment is for, and what it is not

The original packet answered a narrow product question: *if Phase 4 opens, what
is the smallest coherent first milestone that delivers real user value, proves
the view boundary, and pulls no architecture through a gate before its consumer
exists?* Its answer was **Candidate C — Edit-and-see**: a code editor, inline
schema validation, a live Organization Graph, and the organization tree as a
secondary projection — all pure projections over already-shipping compiler
targets, with runtime logs deferred to a **second** Phase 4 milestone.

This amendment revisits exactly one product judgment in that answer: **whether
the opening milestone should stop at *seeing* the organization, or should also
let the author *watch it be governed*.** It proposes the latter — **Governed
Authoring** — and analyzes what that costs at the Studio-to-runtime boundary so
the Product Owner can dispose of the trade-off deliberately.

This amendment is still a **product** exercise, not an architecture one. It does
**not** decide the Studio boundary (that is item **A3** on the adopted strategy's
architecture roadmap, owned by the Phase 4 opening RFC;
`docs/PRODUCT_STRATEGY.md` §6.1). It analyzes the boundary only far enough to
show the trade-off is real and bounded, and it deliberately stops short of any
implementation decision.

**This amendment does not open Phase 4.** Opening Phase 4 requires its own RFC,
Board review, and Product Owner ratification (Governance Rule 2;
`PROJECT_STATE.md`). Per adopted Option A, that opening RFC still *follows* the
now-closed RFC-0008 self-hosting example. This amendment is planning that can be
prepared ahead of the opening RFC without authorizing anything; commissioning
that RFC — and its timing — remains the Product Owner's act.

---

## What Governed Authoring keeps from Candidate C

Governed Authoring is a **superset** of Edit-and-see, not a replacement. Every
element of the adopted Candidate C milestone is preserved unchanged:

| Preserved from Candidate C | Shipped surface it projects | Evidence |
|---|---|---|
| Code editor for Genome YAML | (author surface; owns no logic) | — |
| Inline schema validation as the author types | `genome validate` / `@genome/schema` diagnostics | `packages/genome-cli/src/cli.test.ts` |
| Live **Organization Graph** (the defining visualization) | `graph` target (`genome graph`) | compiler suite; CLI suite |
| Organization tree as a secondary projection | `inspect` target (`genome inspect --json`) | compiler suite; CLI `--json` contract |

The Organization Graph remains the milestone's defining visualization; the tree
remains a convenience projection beside it. Nothing in this amendment weakens,
reorders, or re-scopes any of the four rows above.

---

## What Governed Authoring adds

Two additions, both consuming surfaces that **already ship** and are already
regression-protected by the RFC-0008 evidence suite:

1. **Ephemeral workflow execution.** From the authored document, the user runs
   one workflow end-to-end through the shipped reference adapter — the same
   execution `genome run <file> --workflow <id> [--grant human:...]` performs
   today (ADR-0008): explicit initiation, sequential steps, deny-safe approval
   gates, exit-3 parking, exit-0 completion. Studio invokes this behavior; it
   does not reimplement it.
2. **A visible live event stream.** As the workflow runs, the runtime's
   append-only `EventLog` is surfaced live. The runtime already exposes a
   `subscribe` hook on the log; Governed Authoring renders those events as they
   are appended — `approval.requested`, `approval.granted`, the per-step
   `agent.task.*` events, `workflow.completed` / `workflow.failed` — so the
   author sees governance and execution happen in order, in the organization's
   own terms.

Both additions are **read-through projections of runtime behavior**: the runtime
decides, the view renders. This is capability **C4** ("watch it run") on the
strategy's capability roadmap (`docs/PRODUCT_STRATEGY.md` §6.2), brought forward
to sit **alongside** C3 in the opening milestone — but strictly in its
**ephemeral, in-process** form (see "The ephemeral/durable line" below), which
is the form the strategy already notes does not require persistence.

---

## The canonical demo: `SPEC/examples/genome-project.yaml` + `rfc-lifecycle`

Governed Authoring uses the **shipped, closed** self-hosting example as its
canonical demo document, and the example's own governance workflow as the run:

- **Document:** `SPEC/examples/genome-project.yaml` — the single canonical
  self-describing example shipped and protected by RFC-0008 (closed complete
  2026-07-18). It is the natural Studio sample file: "an IDE whose sample file
  is the project that built it" (`RFC/0008-self-hosting-example.md` §7). C3
  therefore gains a canonical, non-toy document *for free*, and Governed
  Authoring gains a run whose gate is already meaningful.
- **Workflow:** `rfc-lifecycle` (owner `governance.chief-architect`; steps
  `draft → board-review → ratify → record-adr → queue-work`), gated by the
  `ratification` policy, which requires approval from `human:product-owner`.

Using this pairing means the demo's every claim is already an executed,
uncached evidence case in `packages/genome-cli/src/cli.test.ts`
(RFC-0008 E4–E6, E9) — Governed Authoring renders behavior the repository
already proves, rather than asserting anything new.

### The demonstrated loop: park → grant → complete, with attributed approval

The wedge experience is a single governed run of `rfc-lifecycle` on the
self-hosting document, watched live:

1. **Park.** The author runs `rfc-lifecycle` with no grant. The runtime parks
   **deny-safe**: it emits one `approval.requested` via the `ratification`
   policy, addressed to `human:product-owner`, and executes **zero** steps
   (RFC-0008 **E4**: exit 3, 0 steps). The event stream shows the run *stopped
   at the gate* — nothing ran, because the organization said it may not.
2. **Grant.** Acting as the Product Owner principal, the author supplies the
   grant (the same `--grant human:product-owner` input the CLI accepts today).
   The grant is a **runtime input**, not a UI verdict: Studio hands the
   principal's grant to the runtime, which owns the decision.
3. **Complete.** With the matching grant, the run completes: the five
   `rfc-lifecycle` steps execute and the workflow finishes (RFC-0008 **E5**:
   exit 0). The event stream fills in step by step to `workflow.completed`.
4. **Attributed approval.** The grant appears in the stream as an **attributed**
   `approval.granted` event — `source = human:product-owner`,
   `payload.principal = human:product-owner` — recorded **before the first
   step** (RFC-0008 **E6**: the approval precedes the first step event). The
   author sees not just *that* the run proceeded, but *who authorized it* and
   *that the authorization came first*.

Under a fixed clock the whole run is byte-deterministic (RFC-0008 **E9**),
so the demo is reproducible frame-for-frame. The loop makes Constitution
Principle 9 (human governance is first-class in execution, not a UI
afterthought) **visible**: the gate is real, the denial is safe, and the
grant is attributable.

---

## The ephemeral/durable line (why Governed Authoring trips no gate)

Governed Authoring depends on drawing one line precisely and never crossing it.

**Ephemeral events (what Governed Authoring uses).** The runtime's `EventLog` is
an **in-process, append-only** structure with a `subscribe` hook. Governed
Authoring invokes the runtime in-process, subscribes to that hook, renders each
event as it is appended, and **persists nothing**. When the session ends, the
log is gone. `state() == replay(log)` holds *within the session*; there is no
artifact left behind, nothing written to disk, nothing committed, nothing read
back later. This is the exact variant the original packet and the strategy
describe as **not** tripping the persistence gate
(`docs/reviews/phase-4-planning-packet.md`, "The runtime-logs gate," ephemeral
variant; `docs/PRODUCT_STRATEGY.md` §6.2 C4, "plausibly" needs A5 — the
ephemeral form does not).

**Durable logs (what Governed Authoring excludes).** A panel that reads a
committed or exported NDJSON log — the `--export-log` artifact, or any file on
disk — is a *different* thing. By the pinned rule it is **event persistence's
first consumer and requires its own RFC** (RFC-0008 "What this RFC authorizes
and prohibits"; `docs/proposals/self-hosting.md` Part D, Level 2, interaction 1;
`docs/PRODUCT_STRATEGY.md` §6.1 A5). Governed Authoring does not read exported
logs, does not write them, and does not surface any cross-session history.

The distinction the author experiences: **the live stream is a window, not a
ledger.** They watch the run happen; they do not get a saved audit trail from
the surface. Saved, replayable, cross-session history is durable persistence
(A5) — a later, separately-RFC'd capability, deliberately out of scope here.

### No exported-log reader or persistence is authorized

To state it without ambiguity, as the disposition requires:

> **No exported-log reader and no event persistence are authorized by adopting
> Governed Authoring.** The milestone consumes only the in-process, ephemeral
> event stream via the shipped `subscribe` hook. Reading, writing, importing, or
> displaying a durable/exported NDJSON log — or any persisted cross-session
> history — remains gated behind the event-persistence RFC (A5) and is
> explicitly excluded. Adopting Governed Authoring neither opens that gate nor
> pre-commits its outcome.

---

## The Studio-to-runtime boundary (analysis, not decision)

This is the one place Governed Authoring costs more than Edit-and-see, and the
Product Owner should dispose of it with eyes open. **This section analyzes the
boundary; it does not decide the implementation.** How Studio invokes the
runtime — in-process library call, subprocess, a defined API seam, the exact
surface and lifecycle — is an **A3 decision owned by the Phase 4 opening RFC**,
and this amendment neither makes it nor constrains it beyond the one principle
below.

**What changes at the boundary.** Under Candidate C, the opening milestone
consumes only **compiler targets** (`validate`, `graph`, `inspect`) — pure,
provider-free, side-effect-free projections. Governed Authoring adds a second
kind of consumer: the **runtime's execution and event stream**. That is a
larger day-one surface for the A3 RFC to define. It is the coupling the original
packet flagged when it deferred runtime logs — "it still couples the first view
to the *runtime*, not just to *compiler targets*, which is exactly the coupling
the A3 boundary RFC should get to decide deliberately rather than inherit"
(`docs/reviews/phase-4-planning-packet.md`).

**Why the coupling is bounded, not open-ended.** Three properties keep it
contained, and the A3 RFC can lean on all three:

1. **The consumed behavior already ships and is protected.** Execution
   (`genome run` semantics via the reference adapter), the deny-safe approval
   gate, the `EventLog`, and its `subscribe` hook all exist today and are
   covered by uncached evidence (RFC-0008 E4–E9; ADR-0008; RFC-0004/ADR-0005).
   Governed Authoring pulls no *new* runtime capability into being.
2. **It stays on the ephemeral side of the persistence line.** No durable log,
   no persistence, no A5 (see above). The one Phase 4 deliverable that carries
   an architecture gate stays behind that gate.
3. **The seam is the shipped one.** The runtime already executes behind a
   provider-adapter seam and produces only events; Governed Authoring consumes
   that seam's *output*, it does not reach around it.

**What the A3 RFC still owns (and this amendment leaves open).** The process and
invocation model (in-process vs subprocess vs API); the precise runtime surface
Studio is allowed to call; how a grant is collected and handed to the runtime as
an input; error and lifecycle handling; and whether the boundary is proven with
an empty compiler/runtime/schema/CLI **production** diff (as RFC-0006/0007/0008
proved theirs) or requires a defined, reviewed addition. Governed Authoring's
premise is that it *can* be built as projection over shipped surfaces with an
empty production diff — but confirming that is the RFC's job, not this packet's.

---

## Principle 5 preserved: Studio owns no business logic

Governed Authoring must honor **Constitution Principle 5 — Views do not own
business logic** — exactly as Candidate C does, now extended across execution as
well as projection. The floor:

- **Validation, graph derivation, and inspection** remain compiler concerns.
  Studio renders `validate` / `graph` / `inspect` output; it never parses or
  interprets Genome YAML itself.
- **Execution semantics** remain **runtime** concerns. Sequential stepping,
  autonomy/policy gate evaluation, deny-safe parking, `runId` matching, and the
  `human:*` intrinsic floor are the runtime's (RFC-0004/ADR-0005). Studio does
  not re-implement, shortcut, or second-guess any of them.
- **The approval decision** is the runtime's. Studio surfaces the parked
  `approval.requested` and lets the human principal supply a grant, but the
  grant is an **input to the runtime's gate**, not a decision the UI makes.
  Deny-safe means deny-safe: if the surface renders nothing, the run still
  parks — because the gate lives in the runtime, not the view (Principle 9).
- **The event stream** is rendered, not authored. Studio displays events the
  runtime appended; it never fabricates, reorders, or suppresses them.
  `state() == replay(log)` is the runtime's guarantee; the view is a faithful
  window onto it.

The single sentence: **Studio presents accepted compiler and runtime behavior
and owns no business logic.** A design in which the UI decided an approval,
evaluated a policy, ordered steps, or derived state independently of the runtime
would breach Principle 5 and must be rejected regardless of product appeal —
just as Candidate C would reject a UI that validated YAML itself. Governed
Authoring extends the *scope* of what the view projects (execution, not only
structure); it does not extend what the view *owns* (still nothing).

---

## The expanded first five minutes

The opening milestone still succeeds or fails on a single experience, now
carried one step further than Candidate C's. Candidate C's five minutes ended at
*the graph answered my edit*. Governed Authoring's ends at *the organization
governed itself in front of me*. This section describes the experience only; it
prescribes no implementation and names no component.

**What the user accomplishes.** Starting from the canonical self-hosting
document (`SPEC/examples/genome-project.yaml`), the user first does everything
Candidate C offers — edits structure, watches the Organization Graph redraw,
sees inline validation speak the domain. Then they **run** the organization's
own `rfc-lifecycle` workflow and watch it live:

1. They start the run with no approval. The stream shows it **park at the
   ratification gate** — an `approval.requested` addressed to the Product Owner,
   and *no steps taken*. The organization declined to proceed on its own.
2. They **grant** the approval as the Product Owner. The stream records an
   **attributed** `approval.granted` — with the granting principal named — and
   only then do the workflow's steps run, one after another, to completion.

Within five minutes they have not only made an organization their own and seen
it hold together as a structure; they have watched it **refuse to act without
authorization and then proceed once authorized, with the authorization recorded
and attributed.** They reach that point without opening a manual, a schema
reference, or an architecture document.

**What they understand without reading any architecture** — the three
Candidate-C realizations (Genome reads structure not prose; the description is
checked and the check speaks the domain; the graph is derived not drawn), plus
three more that only execution can teach:

1. **The governance is real, not decorative.** The gate they declared in the
   document actually stopped the run. Policy is not documentation; it executes.
2. **Refusal is safe by default.** Nothing ran until it was allowed to. The
   system's default answer to "may I proceed?" was *no*, visibly.
3. **Authorization is attributable and ordered.** When the run proceeded, the
   stream showed *who* authorized it and that the authorization came *first*.

**The expanded wow moment.** Candidate C's wow was *the graph answered when I
changed the words*. Governed Authoring's is the instant the user **removes the
grant, re-runs, and watches the organization stop itself at the gate** — then
grants it and watches it go. The realization it produces is specific: *the rules
I wrote are the rules the system runs by.* That is the moment Genome stops
reading as "a YAML editor with a schema" and starts reading as a language whose
governance is executable — the trust thesis (`docs/PRODUCT_STRATEGY.md` §1),
felt in a single park-and-grant rather than argued.

**What would constitute a failed expanded experience** — the Candidate-C failure
modes still apply (they concluded they used a YAML editor with a schema, or a
workflow tool, or could not connect what they wrote to what they saw), plus:

- The user cannot tell that the **gate was real** — the run appeared to pause for
  UI reasons rather than because the organization's policy stopped it. Governance
  read as theater.
- The user believes **Studio decided the approval** — the surface looked like it
  granted the run, so the runtime's deny-safe guarantee was obscured rather than
  revealed.
- The user sees events but cannot read them as **their organization governing
  itself** — the stream looked like a debug console, not like the company acting.

The single sentence the expanded milestone must earn, unprompted, from a new
user: **"Genome ran my organization by the rules I gave it — and stopped when it
wasn't allowed."**

---

## Product success criteria — governance as code

These are **product outcomes** — statements about what a user comes to
understand, trust, or want. They are not engineering deliverables and name no
task, component, or internal. They **extend** the Candidate-C success criteria
(`docs/reviews/phase-4-planning-packet.md`, "Success Criteria"), which remain in
force; only the additions specific to governed execution are listed here.

After using the Governed Authoring milestone, a user should:

- **Believe the governance is executable, not descriptive** — understand that a
  policy they declared actually gated a real run, and that changing the policy
  would change what the run is allowed to do.
- **Trust deny-safe by default** — see that a run with a missing approval parked
  and took no steps, and conclude that the system fails *closed*, not open.
- **Read the approval as attributable** — identify *who* authorized a run and
  see that the authorization was recorded before the work, and trust that record
  as a faithful account of what happened in-session.
- **Distinguish watching from auditing** — understand that the live stream is an
  ephemeral window on the running organization, not a saved ledger, and know
  that durable, cross-session history is a separate capability they do not yet
  have here.
- **Believe Studio showed them the runtime, not a simulation** — leave convinced
  that what they watched was the real execution and its real events, not a UI
  reenactment — the same conviction Candidate C earns for the graph, now earned
  for the run.
- **Want to govern their own organization this way** — finish intending to
  describe their real company's policies and workflows, because they have seen
  governance-as-code behave the way they would need it to.

A milestone that executes a workflow but leaves the user unsure whether the gate
was real, who authorized the run, or whether they were watching the runtime or a
mock has shipped a feature without shipping the governance-as-code outcome.

---

## Explicitly out of scope for this milestone

Governed Authoring is a **bounded** extension. The following are **excluded**
from the milestone this amendment proposes, each for a stated reason. None is
de-scoped from the project; each keeps its existing home.

- **Provider integrations / real agent execution.** The reference adapter only;
  no provider-specific execution. The adapter seam ships; adapters do not
  (`docs/PRODUCT_STRATEGY.md` §3; A6 is a later architecture move). Runs are
  demonstrations through the reference adapter, not real work.
- **Trigger auto-initiation.** Explicit initiation only. No event, schedule, or
  webhook binding grammars (RFC-0004 non-goal; out of scope on
  `PROJECT_STATE.md`). The user starts every run.
- **Durable history / event persistence / exported-log reading.** Ephemeral,
  in-process stream only. No `--export-log` reader, no persisted or committed
  log, no cross-session audit trail. Gated behind the event-persistence RFC
  (A5), as stated above.
- **Operative repository governance.** The `rfc-lifecycle` run is a **projection
  of** governance, not an act **of** it. It governs nothing in the actual
  repository, commits nothing, and changes no project state; the governance
  documents remain solely authoritative and `PROJECT_STATE.md` remains the sole
  source of state. This preserves the RFC-0008 classification: the self-hosting
  document is toolchain-normative and **non-normative for governance**
  (`RFC/0008-self-hosting-example.md`; Constitution Principle 2).
- **Office View.** Isometric organization rendering is Phase 5 (prototype queued
  Low in `IMPLEMENTATION_QUEUE.md`); not part of this milestone.
- **Marketplace.** Out of scope entirely (`docs/VISION.md` "What Genome Is Not";
  `PROJECT_STATE.md`).
- **Self-improvement loop.** Observe → diagnose → propose → validate → promote is
  Phase 6, reserved by ADR-0006; not part of this milestone.

Naming these keeps the milestone honest about its ceiling: it makes governed
execution *visible and ephemeral*, and stops precisely there.

---

## Sequencing note (product, not authorization)

For reference only; this amendment sequences no work and adds no queue item.

1. **RFC-0008 has landed and closed** (2026-07-18, Option A). Under adopted
   Option A the Phase 4 opening RFC follows it; that ordering is unchanged by
   this amendment.
2. **Product Owner disposes of this amendment** (the act this document exists
   for): adopt Governed Authoring, retain Edit-and-see, or return for revision.
3. **Product Owner commissions the Phase 4 opening RFC** (its own separate act;
   Rule 2), with the disposed milestone as product input.
4. **The opening RFC defines the Studio boundary (A3)** and scopes the opening
   milestone accordingly — either Edit-and-see with runtime logs as Milestone 2
   (if B), or Governed Authoring as the opening milestone (if A) — and may refine
   the milestone line within its own review.

Nothing in steps 2–4 exists until the Product Owner and Board act. This
amendment is step-2 *input*; it performs none of steps 3–4.

---

## Options for the Product Owner

Exactly three. Each is a disposition of *this amendment*, not an authorization of
work. Choosing one records product intent only; it opens no phase, commissions no
RFC, adds no queue item, and modifies no roadmap, SPEC, or source. Ready-to-use
ratification text is given for each.

### Option A — Adopt Governed Authoring

- **Consequence.** The **planned** opening milestone for Phase 4 becomes
  **Edit-and-see plus ephemeral, in-process governed execution and a live event
  stream** — the full park → grant → complete loop with attributed approval,
  demonstrated on `SPEC/examples/genome-project.yaml` / `rfc-lifecycle`. This is
  recorded as **product input only**, superseding Candidate C *as the planned
  milestone*; it opens no phase and authorizes nothing. Runtime *durable* logs
  (persistence, A5) remain deferred and excluded.
- **Boundary implication.** The Phase 4 opening RFC's A3 boundary must define
  Studio's consumption of the **runtime execution and ephemeral event stream** on
  day one, in addition to compiler targets. The coupling stays on the ephemeral
  side of the persistence line (no A5), and the consumed behavior already ships
  and is protected (RFC-0008 E4–E9) — but the day-one boundary is larger than
  Candidate C's pure compiler-target projection. Whether it can still be proven
  with an empty production diff is the A3 RFC's to confirm.
- **Main risk.** It front-loads runtime coupling into the *opening* milestone —
  the very deferral the original packet made — so the A3 RFC must define a richer
  boundary immediately, with some scope/momentum risk if that boundary proves
  more involved than "projection over shipped surfaces." Mitigated by: the
  ephemeral variant trips no persistence gate; every consumed surface is already
  regression-protected; and Principle 5 keeps the view owning no logic.
- **Exact Product Owner ratification statement:**

  > As Product Owner, I adopt **Governed Authoring** as the planned opening
  > milestone for Phase 4, when the phase is opened by its own RFC: a Studio
  > surface providing Candidate C's code editor, inline schema validation, live
  > Organization Graph, and organization tree, **plus ephemeral, in-process
  > workflow execution and a visible live event stream** — demonstrating
  > park → grant → complete with an attributed approval on
  > `SPEC/examples/genome-project.yaml` via the `rfc-lifecycle` workflow — built
  > as a projection over the shipped validate/graph/inspect surfaces and the
  > shipped runtime execution and event stream, owning no business logic
  > (Principle 5). **No exported-log reader and no event persistence are
  > authorized**; durable runtime history remains gated behind the
  > event-persistence RFC. This records product intent only; it opens no phase,
  > commissions no RFC, adds no queue item, and modifies no roadmap, SPEC, or
  > state document. The Phase 4 opening RFC, commissioned separately per adopted
  > Option A, owns the Studio boundary decision (A3) and may refine this
  > milestone within its review. This supersedes the 2026-07-15 Candidate C
  > disposition as the *planned* opening milestone; the original planning packet
  > and its recorded disposition are preserved unchanged.

### Option B — Retain Edit-and-see

- **Consequence.** The planned opening milestone **remains Candidate C —
  Edit-and-see**, exactly as adopted 2026-07-15. This amendment is declined as a
  milestone change; governed execution and the live event stream stay a
  **deferred second Phase 4 milestone** (runtime logs), sequenced after the
  Studio boundary is proven, as the original packet recommended. The original
  packet and its disposition stand; nothing changes.
- **Boundary implication.** The opening milestone stays a **pure compiler-target
  projection** — the cleanest possible A3 boundary, with no runtime coupling on
  day one and an empty compiler/runtime/schema/CLI production diff available by
  construction. Runtime coupling is deferred to Milestone 2, where the ephemeral
  vs durable choice is made deliberately once its consumer exists.
- **Main risk.** The "governance is executable" conviction — the trust
  differentiator that Option A "Trust first" is built on — is **deferred**. The
  opening surface shows structure but not governed execution, so a first-time
  user (and an outside demo) sees the graph but not the gate; the strongest proof
  of the thesis waits for a later milestone.
- **Exact Product Owner ratification statement:**

  > As Product Owner, I retain **Candidate C — Edit-and-see** as the planned
  > opening milestone for Phase 4, unchanged from the 2026-07-15 disposition. I
  > decline the Governed Authoring extension as a change to the opening
  > milestone; ephemeral governed execution and a live event stream remain a
  > deferred second Phase 4 milestone, gated as the original planning packet
  > describes. This records product intent only; it opens no phase, commissions
  > no RFC, adds no queue item, and modifies no roadmap, SPEC, or state document.

### Option C — Return for revision

- **Consequence.** The amendment is **returned to the Architecture Board for
  revision** before any disposition. No planned-milestone change is recorded; the
  adopted Candidate C disposition stands in the interim. The Board revises this
  amendment per the Product Owner's noted concerns and resubmits it for a fresh
  disposition.
- **Boundary implication.** **None applied.** The Studio-to-runtime boundary
  question stays exactly where Candidate C leaves it — deferred to Milestone 2 /
  the A3 RFC — until a revised amendment is disposed of. Nothing about the
  boundary is decided or foreclosed.
- **Main risk.** The governed-authoring direction stays **undecided**, and the
  Phase 4 opening RFC's product input remains Candidate C for longer; a revision
  cycle costs time without yet resolving whether the opening milestone should
  include governed execution.
- **Exact Product Owner ratification statement:**

  > As Product Owner, I return this Governed Authoring amendment to the
  > Architecture Board for revision before disposition, with the concerns I have
  > noted. No change to the planned opening milestone is recorded; the 2026-07-15
  > Candidate C disposition stands until a revised amendment is submitted and
  > disposed of. This opens no phase, commissions no RFC, adds no queue item, and
  > modifies no roadmap, SPEC, or state document.

---

## Explicitly not done by this amendment

- **Original packet unmodified.** `docs/reviews/phase-4-planning-packet.md`, its
  recommendation, and its 2026-07-15 Product Owner disposition are untouched.
- **No phase opened.** Phase 4 remains positioned-but-unopened; opening it
  requires its own RFC, Board review, and ratification (Rule 2).
- **No RFC commissioned or drafted;** the Phase 4 opening RFC is neither
  commissioned nor written here. **No roadmap revision proposal** is prepared.
- **No queue item added;** `IMPLEMENTATION_QUEUE.md` is untouched.
- **No architecture decided.** The Studio boundary (A3) and its implementation
  are the opening RFC's to decide; this amendment only analyzes the trade-off and
  records the Principle 5 floor.
- **No repository state modified beyond adding this document.** `ROADMAP.md`,
  `PRODUCT_STRATEGY.md`, `IMPLEMENTATION_QUEUE.md`, the accepted RFCs, the ADRs,
  and `SPEC/` are unchanged. `PROJECT_STATE.md` is left untouched: this amendment
  changes no state it owns, and Rule 8 does not require recording a planning
  packet's preparation (State ownership, above).
- **No language, schema, compiler, runtime, CLI, event-taxonomy, or test
  change** of any kind.
- **No option applied.** Every disposition above awaits the Product Owner.
