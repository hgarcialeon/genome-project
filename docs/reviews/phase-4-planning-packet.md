# Phase 4 Planning Packet — Best Opening Milestone for Studio

- **Instrument:** product-planning packet. This document **decides nothing,
  opens nothing, and applies nothing.** It is a product-planning exercise, not
  an architecture exercise: it assembles the candidate opening milestones for
  Phase 4 (Studio Prototype), scores them on product criteria, and recommends
  one — as input to the eventual Phase 4 opening RFC, which alone can open the
  phase. Adopting a recommendation follows the normal governance lifecycle
  (`docs/GOVERNANCE.md`); until the Product Owner acts, nothing here has force.
- **Prepared by:** Architecture Board (packet assembly), for Product Owner
  disposition.
- **Date prepared:** 2026-07-15.
- **Source of truth:** the repository. Base HEAD `1eaf926`, clean tree,
  `pnpm check-state` green.
- **Inputs:** `ROADMAP.md` (Phase 4 deliverables), `docs/PRODUCT_STRATEGY.md`
  (adopted Option A "Trust first"; §5 target users; §6 the two roadmaps; §7
  options), `docs/VISION.md`, `docs/CONSTITUTION.md` (Principle 5),
  `docs/ARCHITECT.md`, `docs/proposals/self-hosting.md` (Part D, Studio
  affinity), `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`, and the shipped
  reference implementation (`packages/genome-compiler` targets;
  `packages/genome-cli` command surface; `packages/genome-runtime` event log).
- **State ownership:** phase, milestone, objective, and blockers live **only**
  in `PROJECT_STATE.md` (Governance Rule 8). This packet cites repository
  evidence but owns no state and restates none. It records no current status.

---

## What this packet is for, and what it is not

The Phase 4 goal on `ROADMAP.md` is "create an Organization IDE," carrying five
**Not Started** deliverables: a code editor for Genome YAML (the roadmap names
Monaco specifically; this packet treats the editor implementation as an open
choice for the opening RFC and refers to it generically as a *code editor*
throughout), schema validation, live preview, organization tree, and runtime
logs. Those are the *phase's* deliverables; they are not a *milestone plan*. The
product question this packet exists to answer is narrower and comes first:

> **If Phase 4 opens, what is the smallest coherent first milestone that
> delivers real user value, proves the view boundary, and pulls no
> architecture through a gate before its consumer exists?**

This is deliberately a **product** question — sequencing user-visible value —
not an **architecture** question. The architecture question ("what is the
Studio boundary?") is item **A3** on the adopted strategy's architecture
roadmap (`docs/PRODUCT_STRATEGY.md` §6.1) and is owned by the Phase 4 opening
RFC. This packet does **not** answer it, pre-empt it, or constrain it beyond
recording the one principle every candidate below already respects (Principle
5, next section).

**This packet does not open Phase 4.** Opening Phase 4 requires its own RFC,
Board review, and Product Owner ratification (Governance Rule 2;
`PROJECT_STATE.md`). Per adopted Option A, that opening RFC *follows* the
in-flight RFC-0008 self-hosting example (`docs/PRODUCT_STRATEGY.md` §7, Option
A sequence; the RFC-0008 implementation item is the current queue work). This
packet is planning that can be prepared ahead of the opening RFC without
authorizing anything; commissioning the RFC — and the timing of it — remains
the Product Owner's act.

---

## The one constraint every candidate already respects

Whatever Studio's first milestone is, it must honor **Constitution Principle 5
— Views do not own business logic.** A view is a *projection* of the Genome; it
must consume compiler targets and the CLI/runtime surface, never re-implement
validation, graph derivation, or execution semantics inside the UI. The
Architect Charter says the same ("building UI before defining the model,"
"coupling a view directly to business logic" are things to reject), and the
strategy names A3 as the move that "must prove Principle 5 (views own no
business logic) and consume only compiler targets; sets the pattern for every
later view."

This is not a scoring dimension below — it is a **floor**. A candidate that
required Studio to parse or interpret Genome YAML itself would be rejected on
principle regardless of its product score. All four candidates below are
constructed to sit entirely on top of already-shipping, provider-free
artifacts:

| Studio needs | Already-shipped source it consumes | Evidence |
|---|---|---|
| Tell the author the document is valid / why not | `genome validate` (CLI) and `@genome/schema` diagnostics | CLI-boundary tests, `packages/genome-cli/src/cli.test.ts` |
| Render the **Organization Graph** — the visible proof the compiler understood the org (nodes, `requires`/`owns` edges) | `graph` target (`genome graph`) | compiler suite (36 tests); CLI suite |
| Show the organization as a tree/counts — a secondary projection derived from the graph | `inspectTarget` (`genome inspect`, `--json`) | compiler suite; CLI `--json` contract tested |
| Show what changed between two versions | `diff` target (`genome diff`) | ADR-0006; exit codes 0/1/2 tested |
| Show a workflow running | `genome run` + the runtime `EventLog` | ADR-0008; CLI run cases |

The first four rows exist **today** and need no new compiler, runtime, schema,
or CLI work to project into a UI. The fifth row (runtime logs) is the one that
carries a gate — see the sequencing analysis under Candidate D and §"The
runtime-logs gate."

---

## The candidate opening milestones

Four coherent first slices, smallest to largest. Each is described by *what the
author can do*, *what it consumes*, and *what architecture it pulls*.

### Candidate A — Read-only projection ("see your organization")

Studio opens as a **read-only visualizer**: load a Genome file and render the
**Organization Graph** (with the organization tree as a secondary projection of
it). No editing, no validation authoring loop, no execution.

- **Consumes:** `inspect`, `graph` targets. Zero write surface.
- **Pulls:** nothing. Empty compiler/runtime/schema/CLI diff by construction.
- **User value:** low-to-moderate. It is a picture of a file the author
  already has; it does not change how they *work*. The wedge user (§5 user 2,
  the organization author) gets a viewer, not an IDE.

### Candidate B — Validation-only editor ("catch my mistakes")

A code editor with **inline schema validation** as the author types. No graph,
no tree, no preview, no execution.

- **Consumes:** `@genome/schema` / `genome validate` diagnostics.
- **Pulls:** nothing new.
- **User value:** moderate but thin. A YAML editor with schema squiggles is
  only marginally more than the CLI the author already runs; it never renders
  the **Organization Graph** — the visible proof that the language *understood
  the organization*, and the single artifact that distinguishes Genome as a
  language for organizations from *just YAML*.

### Candidate C — Edit-and-see ("author a live organization") — **recommended**

A code editor with **inline schema validation**, a live **Organization Graph**,
and the **organization tree** as a secondary projection — updating as the author
types. The Organization Graph is the milestone's defining visualization; the
tree is a convenience projection rendered beside it. This is capability **C3** on
the strategy's capability roadmap ("author a Genome with validation, preview,
and org tree in an IDE surface"). It **excludes runtime logs** (Candidate D / a
later milestone).

- **Consumes:** `validate` (diagnostics), `graph` (the Organization Graph — the
  central visualization), `inspect` (the tree/counts projection) — all shipped.
  Read-through only; the UI owns no logic.
- **Pulls:** nothing. The Studio boundary the A3 RFC defines can be proven with
  an empty compiler/runtime/schema/CLI protected diff — the RFC-0006/0007/0008
  precedent applied to a view.
- **User value:** high, and it is the *whole* edit-and-see loop, not a fragment:
  the author writes structure and the language answers by rendering it as an
  Organization Graph — validated, connected, and legible as a company — in the
  same breath. It is the first surface that makes the durable-artifact thesis
  (§1 of the strategy) *felt* rather than asserted, and it is buildable today on
  top of surfaces that are already regression-protected.

### Candidate D — Full Phase 4 slice, including runtime logs

All five roadmap deliverables at once: editor, validation, preview, tree, **and
runtime logs**.

- **Consumes:** the C-set **plus** `genome run` / the runtime event stream.
- **Pulls:** the **runtime-logs gate** (see below). Surfacing *exported* logs
  makes Studio event persistence's first consumer (its own RFC); even the
  ephemeral in-process variant couples Studio to the runtime, widening the
  boundary the A3 RFC must define on day one.
- **User value:** highest ceiling, but it front-loads the one deliverable that
  carries architectural risk into the *opening* milestone, where the job is to
  establish the view pattern cleanly.

---

## The runtime-logs gate (why "runtime logs" is not opening-milestone material)

"Runtime logs" is the single Phase 4 deliverable that is not a free projection
of already-shipping compiler targets, and it interacts with a **pinned gate**:

- **Exported-log variant (durable).** A Studio panel that reads a committed or
  exported NDJSON log is, by the pinned rule, **event persistence's first
  consumer and requires its own RFC** (RFC-0008 §"What this RFC authorizes and
  prohibits"; `docs/proposals/self-hosting.md` Part D, Level 2, interaction 1;
  `docs/PRODUCT_STRATEGY.md` §6.1 A5). Putting it in the opening milestone drags
  the persistence RFC (A5) into Phase 4's front door.
- **Ephemeral variant (in-process).** Studio could invoke the runtime
  in-process and subscribe to the `EventLog` subscribe hook, streaming events
  live and persisting nothing — this does **not** literally trip the
  persistence gate. But it still couples the first view to the *runtime*, not
  just to *compiler targets*, which is exactly the coupling the A3 boundary RFC
  should get to decide deliberately rather than inherit from an opening-milestone
  commitment. It is capability **C4** ("watch it run"), and the strategy already
  sequences C4 *after* C3 and notes it "plausibly" needs A5.

Either way, runtime logs belong in a **later** Phase 4 milestone, sequenced
once the Studio boundary is proven and the persistence question is disposed on
a real consumer — not before. Naming it here as *deferred within Phase 4*
(not de-scoped) keeps it a live deliverable with a home.

---

## Product decision criteria and scoring

Product criteria only (architecture coherence is the A3 RFC's job; it appears
here solely as the "pulls a gate?" risk row). Scored ●●● high / ●● moderate /
● low, with the reasoning in the cells.

| Criterion | A — Read-only | B — Validation-only | **C — Edit-and-see** | D — Full slice |
|---|---|---|---|---|
| **Wedge-user value** (§5 user 2, organization author) | ● a viewer, not a workflow change | ●● squiggles, barely past the CLI | **●●● the full author loop** | ●●● highest, but not needed on day one |
| **Time to first visible surface** | ●●● trivial | ●●● trivial | **●● small, all on shipped targets** | ● largest; blocked behind the gate |
| **Proves the view boundary cleanly** (Principle 5, sets the pattern) | ●● proves read projection only | ●● proves diagnostics only | **●●● proves projection over the full compiler-target set** | ● boundary muddied by runtime coupling on day one |
| **Pulls no architecture through a gate** | ●●● pulls nothing | ●●● pulls nothing | **●●● pulls nothing** | ● pulls A5 (persistence) / runtime coupling |
| **Thesis alignment** (Option A "Trust first"; make the spec *felt*) | ●● shows structure | ● thin | **●●● governed structure, authored and seen** | ●●● but risk-first, not trust-first |
| **Demo strength for outsiders** (§2 strategic pitch) | ●● a static picture | ● weak | **●●● live edit → live Organization Graph** | ●●● highest ceiling |

**Reading of the matrix.** A and B are cheap but under-deliver — they leave the
**Organization Graph**, the visible proof that the language understood the
organization, either static and read-only (A) or absent entirely (B), and give
the wedge user less than a working IDE. D delivers the most
but is the wrong *opening* move: it front-loads the one deliverable that pulls
an architecture gate into the milestone whose entire purpose is to establish the
view pattern on solid, already-protected ground. **C is the coherent minimum
that is also the coherent maximum-without-a-gate**: it is the full edit-and-see
loop, buildable today on surfaces that are already regression-protected, and it
proves Principle 5 across the whole shipped compiler-target set — the pattern
every later view inherits.

---

## Recommendation

**Recommended opening milestone: Candidate C — Edit-and-see.**

The Phase 4 opening RFC, when commissioned, should scope its **first
milestone** as: a Studio surface providing a **code editor for Genome YAML,
inline schema validation, a live Organization Graph, and the organization tree
as a secondary projection** — with the Organization Graph as the milestone's
defining visualization — built strictly as a projection over the shipped
`validate`/`graph`/`inspect` surfaces (Principle 5; empty
compiler/runtime/schema/CLI protected diff, RFC-0008 precedent). **Runtime logs
are deferred to a second Phase 4 milestone**, not
de-scoped — sequenced after the Studio boundary is proven and after the
persistence question (A5) is disposed on Studio's real, then-existing consumer,
whether via the ephemeral subscribe-hook variant (no persistence) or the
durable exported-log variant (its own RFC).

Why this is the best opening milestone, in one line each:

1. **It is the whole wedge, not a fragment.** Edit-and-see is the first surface
   the near-term target user (§5 user 2) actually adopts; A and B give them
   less than the CLI already does in spirit.
2. **It proves the view pattern on the strongest possible footing.** Every
   surface it consumes is already regression-protected; the A3 boundary RFC can
   demonstrate Principle 5 with empty protected diffs, exactly as RFC-0006/0007/
   0008 demonstrated their boundaries.
3. **It pulls no architecture through a gate.** The one Phase 4 deliverable
   that carries a gate (runtime logs → persistence) is cleanly deferred to a
   second milestone, so the opening milestone stays a pure projection.
4. **It matches the adopted strategy without re-litigating it.** C is capability
   **C3**, which the strategy already places before **C4** (runtime logs) and
   whose only upstream dependency (C1, trust in the flagship semantics) is
   already satisfied by the closed RFC-0007. "Trust first" (Option A) is served:
   the first new surface makes governed structure *felt* without opening a new
   risk.

This recommendation binds nothing. It is product input to the Phase 4 opening
RFC, which owns the Studio boundary decision (A3) and may refine the milestone
line within its own review.

---

## The First Five Minutes

The opening milestone succeeds or fails on a single experience: a first-time
user, arriving with no knowledge of Genome's internals, writes a description of
an organization and watches the system understand it. The measure is not what
the surface renders but what the user *concludes about what Genome is*. This
section describes that experience only; it prescribes no implementation and
names no component.

**What the user accomplishes in the first five minutes.** Starting from the
canonical example (the self-hosting document once RFC-0008 lands, or
`SPEC/examples/company.yaml`), the user edits it — renames a department, adds an
agent, attaches a policy — and watches the organization redraw as they type.
Within five minutes they have made an organization their own and seen it hold
together as a *structure*, not merely as text. They reach that point without
opening a manual, a schema reference, or an architecture document.

**What they understand without reading any architecture.** Three things, each by
observation rather than explanation:

1. **Genome reads structure, not prose.** Departments contain teams contain
   agents; workflows have owners; policies require approvals — and the
   Organization Graph shows those relationships as connections, not as
   indentation. The user learns the model by seeing their own document expressed
   as one.
2. **The description is checked, and the check speaks the domain.** When they
   write something the language does not permit, they are told at the point of
   the mistake, in the organization's terms ("this workflow names an owner that
   does not exist"), not a parser's. Validation reads as the system caring about
   the *correctness of the organization*, not as a linter decorating text.
3. **The graph is derived, not drawn.** Nothing in the picture was placed by
   hand; it is what the system *found* in the description. The graph moving in
   lockstep with their edits demonstrates this without a word of explanation.

**The wow moment.** It is the instant the user changes the *words* and the
*Organization Graph answers* — a new agent appears as a node, a new policy draws
a `requires` edge to the workflow it governs — with no build step, no run, and
nothing they had to wire by hand. The realization it produces is specific: *the
graph is the system telling me it understood the organization I described.* That
is the moment Genome stops looking like a YAML editor and starts reading as a
language with a compiler behind it — the durable-artifact thesis, felt in one
keystroke rather than argued.

**What would constitute a failed first experience.** Any of the following means
the milestone missed, regardless of how complete its feature list is:

- The user concludes they used **a YAML editor with a schema** — validation
  worked, but nothing revealed that Genome comprehends an *organization*.
- The user concludes they used **a workflow tool** — the surface foregrounded
  steps and execution and buried the structure, so Genome read as one more
  orchestration canvas.
- The user cannot connect **what they wrote** to **what they see** — the graph
  is present but reads as decoration, so the "it understood me" inference never
  fires.
- The user has to understand Genome's architecture, boundaries, or compiler to
  feel the value — the milestone failed to make its point by *experience* and
  fell back on explanation.

The single sentence the milestone must earn, unprompted, from a new user:
*"Genome understood the organization I described."* Everything the opening
milestone renders is in service of that sentence — and the Organization Graph is
how the sentence is earned.

---

## Success Criteria

These are **product outcomes** — statements about what a user comes to
understand, trust, or want after using the opening milestone. They are not
engineering deliverables and name no task, component, or internal. They are the
bar the milestone is judged against; how a future RFC and its implementation
meet them is out of scope here.

A user should:

- **Understand Genome in under ten minutes** — grasp that it describes
  organizations declaratively, without reading the specification, the
  architecture, or any RFC.
- **Successfully model an organization** — carry the canonical example to
  something recognizably *their own* structure, and have it stay valid and
  coherent as they go.
- **Trust the inline validation** — read a rejection as the system protecting
  the correctness of their organization, believe what it says, and act on it
  without second-guessing whether the tool is the one that is wrong.
- **Understand the Organization Graph** — look at the rendered graph and read
  their organization back out of it: who sits where, which workflows are owned
  by whom, which policies gate which work. The graph should be legible as
  *their company*, not as an abstract diagram.
- **Believe Genome understood them** — leave with the specific conviction that
  the system comprehended the organization they described, not merely that it
  accepted their file.
- **Want to model their own organization** — finish the session intending to
  describe the company they actually work in, because the milestone made doing
  so feel both possible and worthwhile.

A milestone that produces a valid document but none of these convictions has
shipped features without shipping the product outcome. The outcomes above — not
a deliverable checklist — are what "the opening milestone succeeded" means.

---

## Sequencing note (product, not authorization)

For reference only; this packet sequences no work and adds no queue item.

1. **RFC-0008 lands first.** Per adopted Option A, the Phase 4 opening RFC
   follows the in-flight self-hosting example
   (`docs/PRODUCT_STRATEGY.md` §7, Option A). The self-hosting example also
   becomes Studio's natural demo document — "an IDE whose sample file is the
   project that built it" (`docs/proposals/self-hosting.md` Part D, Level 1;
   RFC-0008 §7) — so C3 gains a canonical non-toy file *for free* once RFC-0008
   ships.
2. **Product Owner commissions the Phase 4 opening RFC** (its own act; Rule 2),
   with this packet's recommended opening milestone as product input.
3. **The opening RFC defines the Studio boundary (A3)** and scopes **Milestone 1
   = Edit-and-see (Candidate C)**, with runtime logs named as **Milestone 2**,
   gated on the persistence disposition (A5).
4. **Milestone 2 (runtime logs)** is planned when its consumer exists, choosing
   deliberately between the ephemeral (no-persistence) and durable (own-RFC)
   variants.

Nothing in steps 2–4 exists until the Product Owner and Board act; step 1 is the
current queue work, referenced via `PROJECT_STATE.md`, not restated here.

---

## Exact Product Owner disposition statements

Ready-to-use text. The Product Owner may instead select any candidate above, or
direct that milestone scoping wait entirely for the opening RFC.

**Recommended — adopt Candidate C as the planned opening milestone (product
input only):**

> As Product Owner, I record that the planned opening milestone for Phase 4,
> when the phase is opened by its own RFC, is **edit-and-see**: a Studio surface
> with a code editor, inline schema validation, a live Organization Graph, and
> the organization tree as a secondary projection, built as a projection over
> the shipped validate/graph/inspect surfaces with an empty compiler/runtime/schema/CLI
> protected diff. Runtime logs are deferred to a second Phase 4 milestone,
> gated on the event-persistence disposition. This records product intent only;
> it opens no phase, commissions no RFC, adds no queue item, and modifies no
> roadmap or state document. The Phase 4 opening RFC, commissioned separately
> per adopted Option A after the RFC-0008 example lands, owns the Studio
> boundary decision and may refine this milestone within its review.

> *(Alternatives: "the opening milestone is read-only projection" (Candidate A)
> / "validation-only editor" (Candidate B) / "the full slice including runtime
> logs" (Candidate D) / "defer all milestone scoping to the Phase 4 opening
> RFC.")*

---

## Explicitly not done by this packet

- **No phase opened.** Phase 4 remains unopened; opening it requires its own
  RFC, Board review, and ratification (Rule 2).
- **No RFC drafted or commissioned;** no `IMPLEMENTATION_QUEUE.md` item added.
- **No architecture decided.** The Studio boundary (A3) is the opening RFC's to
  decide; this packet only records the Principle 5 floor every candidate already
  respects.
- **No repository state modified.** `PROJECT_STATE.md`, `ROADMAP.md`,
  `IMPLEMENTATION_QUEUE.md`, `README.md`, and all accepted RFCs/ADRs are
  untouched. No deliverable status changed; no state restated (Rule 8).
- **No language, schema, compiler, runtime, or CLI change of any kind.**
- **No option applied.** Every disposition above awaits the Product Owner.

---

## Product Owner Disposition (2026-07-15)

The packet body above is preserved verbatim as prepared. On 2026-07-15 the
Product Owner approved this packet and adopted **Candidate C — Edit-and-see** as
the planned opening milestone for Phase 4, recorded as **product input only**.

**Recorded disposition (verbatim):**

> As Product Owner, I record that the planned opening milestone for Phase 4,
> when the phase is opened by its own RFC, is edit-and-see: a Studio surface
> with a code editor, inline schema validation, a live Organization Graph, and
> the organization tree as a secondary projection, built as a projection over
> the shipped validate/graph/inspect surfaces with an empty
> compiler/runtime/schema/CLI protected diff. Runtime logs are deferred to a
> second Phase 4 milestone, gated on the event-persistence disposition. This
> records product intent only; it opens no phase, commissions no RFC, adds no
> queue item, and modifies no roadmap or state document. The Phase 4 opening
> RFC, commissioned separately per adopted Option A after the RFC-0008 example
> lands, owns the Studio boundary decision and may refine this milestone within
> its review.

**What this disposition does and does not do.** Consistent with the statement
above and the packet's standing constraints:

- **Adopts** Candidate C as the *planned* opening milestone — **product input
  only**. The recommendation and the packet body are unchanged by this adoption;
  nothing here overrides `ROADMAP.md`, `PROJECT_STATE.md`, or any ratified
  decision.
- **Opens no phase.** Phase 4 remains unopened; opening it requires its own RFC,
  Board review, and ratification (Governance Rule 2).
- **Commissions and drafts no RFC.** The Phase 4 opening RFC is not commissioned
  by this disposition; per adopted Option A it follows the RFC-0008 example.
- **Adds no queue item and modifies no state document.** `PROJECT_STATE.md`,
  `ROADMAP.md`, and `IMPLEMENTATION_QUEUE.md` are untouched; no current state is
  restated here (Governance Rule 8).
- **Implements no Studio** and changes **no** language, schema, compiler,
  runtime, CLI, event taxonomy, or test.
- **Defers runtime logs** to a second Phase 4 milestone, gated on the
  event-persistence disposition, exactly as the recommendation states.

The Phase 4 opening RFC, when commissioned separately, owns the Studio boundary
decision (A3) and may refine this milestone within its own review.
`pnpm check-state` accompanies this change and remains green.
