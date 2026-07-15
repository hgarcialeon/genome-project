# RFC-0008: Self-Hosting Example (Descriptive Self-Hosting, Level 1)

## Status

**Accepted — 2026-07-15.**

Accepted under **Option B** (accept with amendments) by the Architecture
Board's review (`docs/reviews/rfc-0008-board-review.md`), ratified by the
Product Owner 2026-07-15. The Board re-executed every material claim uncached
and confirmed it; the **five open-question dispositions** recorded in that
review are folded into this RFC (see "Resolved open questions (Board
dispositions)" below). The amendments change no example content, no evidence
case (E1–E9), and no protected boundary; the language-complexity budget stays
zero. The single implementation item is queued in `IMPLEMENTATION_QUEUE.md`
(Not Started); no example file, evidence, or production/test code is created by
this acceptance.

Commissioned 2026-07-15 by the Product Owner under Decision 2a (Option 2a-i)
of `docs/reviews/maintenance-self-hosting-disposition-packet.md`, itself the
recommended disposition of the Level 1 recommendation in
`docs/proposals/self-hosting.md` (Part D) and the RFC-candidate framing of
`docs/reviews/self-hosting-evidence-board-review.md`. Commissioning authorized
drafting and Board review only; it implements nothing and adds no
`IMPLEMENTATION_QUEUE.md` item until this RFC is ratified.

This RFC is **descriptive and evidentiary only**. It ships one worked example
document and the executable evidence that protects it. It authorizes no
language, schema, compiler, runtime, or CLI change.

## Summary

Ship a single, canonical, self-describing Genome document — a Genome that
describes the *Genome project's own* durable organizational structure — as an
official example alongside `SPEC/examples/company.yaml`, protected by
CLI-boundary evidence exactly as every other shipped surface is. The document
is a **projection** of the governance documents, explicitly **non-normative
for governance**: the governance documents (`docs/CONSTITUTION.md`,
`docs/GOVERNANCE.md`, `docs/ARCHITECT.md`) remain solely authoritative, and
`PROJECT_STATE.md` remains the sole source of current project state.

The self-hosting investigation (`docs/proposals/self-hosting.md`) already
demonstrated, at the CLI boundary, that the shipped v0.1 stack executes this
project's own deny-safe ratification discipline. This RFC turns that
throwaway sketch into a maintained example so the demonstration is permanent
and regression-protected. It changes no behavior; the only production diff is
one new example file, and the only test diff is additive CLI-boundary cases.

## Motivation — the exact purpose of the official self-hosting example

The example exists for three purposes, and no others:

1. **Permanent dogfooding pressure on the language.** The single most
   consequential language finding to date — Gap 1, initiator- vs.
   executor-scoped policy gating (`docs/proposals/self-hosting.md`, Part B;
   classified an RFC candidate in
   `docs/reviews/self-hosting-evidence-board-review.md`) — was found *by
   driving a self-description through `genome run`*, not by reading the spec.
   A committed self-hosting example keeps that pressure standing: the next
   expressiveness gap surfaces the same way.

2. **A worked "the Genome describes an organization that governs by approval"
   artifact for outsiders** — the strategic pitch (`docs/VISION.md`)
   demonstrated on the project itself, executable rather than asserted.

3. **A regression witness for accepted semantics.** RFC-0007's participation
   binding (`docs/adr/0009-participation-scoped-policies.md`) was accepted in
   part *because* self-hosting exposed Gap 1. This example now models the
   engineering agent's commissioning gate with a single agent-scoped policy
   and proves, at the CLI boundary, that the derived workflow gate holds —
   making the example the standing witness that RFC-0007 keeps working. (See
   "Interaction with RFC-0007" below; this retires the proposal's
   hand-maintained per-workflow workaround.)

The example is a **test case, not a design driver**. External organizations
remain the language's audience; the gap list is *input* to future RFCs, never
a commitment (`docs/proposals/self-hosting.md`, Risks §1, §3).

## What this RFC authorizes and prohibits

**Authorizes:** one new maintained example document and additive
CLI-boundary tests protecting it. Nothing else.

**Prohibits (explicitly, per the commissioning direction):**

- durable exported-log decision records (that is Level 2 —
  deferred under the persistence gate; this RFC commits **no** `--export-log`
  output as a record);
- any production log *reader* (any shipped code path that reads an exported
  log is event persistence's first consumer and requires its own RFC —
  `docs/proposals/self-hosting.md`, Part D, Level 2, interaction 1);
- runtime control of repository operations (that is Level 3 — deferred to
  Phase 6 with its own RFC);
- replacement, duplication, or partial restatement of `PROJECT_STATE.md`;
- any Phase 4 (Studio) implementation;
- new language syntax or semantics. The language proved **sufficient** (see
  Evidence); no gap forced a change. Had it not, this RFC would stop and
  record the gap rather than design a solution here.

## 1. The structure / state boundary (binding constraint)

This is the load-bearing constraint on the whole exercise
(`docs/proposals/self-hosting.md`, Part C; Governance Rule 8):

- **The Genome document describes durable organizational *structure*** —
  roles, workflows, policies, approvals, autonomy levels, integrations,
  memory, objectives, metrics.
- **`PROJECT_STATE.md` remains the source of current project *state*** —
  current phase, milestone, objective, active decision, blockers, queue
  state, deliverable statuses.
- **No current milestone, open decision, queue state, phase, roadmap status,
  or any mutable status is duplicated into the Genome document.** A
  self-Genome that restated state would create exactly the second source of
  truth `check-state` exists to prevent.

The symmetry is precise and is the reason the boundary is safe: Genome's own
architecture already draws this line for customers — the document declares
durable structure; current status lives in the event log; observed state is
`replay(log)` by construction. **`PROJECT_STATE.md` is this project's
`replay(log)`.** The example therefore contains no field whose value would
change as work progresses. This constraint is normative for the example and
must be preserved by review discipline on every future edit.

## 2. The minimum organizational model to represent

The example must represent at least the following, and nothing that restates
state:

| Project reality | Genome v0.1 representation |
|---|---|
| Product Owner (ratification authority) | `human:product-owner` principal in `policies.*.requiresApprovalFrom` |
| Architecture Board (a process, not a group) | the review workflows `rfc-lifecycle` and `phase-transition-review` (the Board *is* a process → it maps to workflows, not an agent) |
| Chief Architect | agent `governance.chief-architect`, `autonomy: manual` |
| Lead Engineer | agent `governance.lead-engineer`, `autonomy: manual` |
| Engineering Agent / team | department `engineering` with agent `engineering-agent`, `autonomy: supervised` |
| RFC lifecycle workflow | workflow `rfc-lifecycle` (draft → board-review → ratify → record-adr → queue-work) |
| Implementation lifecycle workflow | workflow `implement-queue-item` (bootstrap → implement → test-uncached → reconcile-state → merge) |
| Phase-close workflow | workflow `phase-transition-review` (prepare-packet → board-review → ratify → apply-closure) |
| Ratification approvals (deny-safe) | policy `ratification` → `requiresApprovalFrom: [human:product-owner]`, applied to the two Board workflows |
| Commissioning discipline (deny-safe) | policy `queue-discipline` → `requiresApprovalFrom: [human:product-owner]`, applied to the engineering agent |
| Autonomy levels | `manual` for the two human-fulfilled Board roles; `supervised` for the engineering agent |

The `manual` modeling of the two Board roles is semantically defensible — the
Charter states the roles "may be fulfilled by a human or an automated system,"
and `manual` means "acts only on explicit human instruction" — while
acknowledging Gap 2 (humans are principals, not declarable members), which is
**deferred** at its named view-phase gate and is *not* reopened here.

The exact candidate document is in the Appendix and is the artifact all
evidence below was produced against.

### Interaction with RFC-0007 (why this model is cleaner than the proposal's sketch)

The self-hosting proposal's appendix modeled commissioning discipline as a
**workflow-scoped** policy (`queue-discipline.appliesTo: [implement-queue-item]`)
— a deliberate Gap 1 *workaround*, because an agent-scoped policy did not then
gate the workflows the agent merely *executes*. RFC-0007
(`docs/adr/0009-participation-scoped-policies.md`) changed that: an
agent-scoped `appliesTo` entry now derives a workflow→policy `requires` edge
for every workflow the agent owns. This example therefore models
`queue-discipline` **agent-scoped** (`appliesTo: [engineering.engineering-agent]`)
and relies on the accepted participation binding to gate
`implement-queue-item` — no per-workflow enumeration, no unenforced
maintenance invariant. This uses **already-accepted** semantics (RFC-0007);
it introduces none. It is why the example doubles as a regression witness for
RFC-0007.

## 3. File location and naming

- **Canonical location:** `SPEC/examples/genome-project.yaml`, beside the
  existing `SPEC/examples/company.yaml`.
- **Naming rationale:** it matches the sole existing example's convention
  (`SPEC/examples/<name>.yaml`). (`SPEC/language.md`'s *recommended*
  file extension is `company.genome.yaml`; the shipped example already
  departs from that with `company.yaml`, so matching the shipped example is
  the consistent choice. Whether to reconcile the extension convention
  project-wide is out of scope here and noted as an open question.)

### 4. One canonical source — a new SPEC example, not "both"

The example is **a single new SPEC example**, with exactly one canonical
source file. It is deliberately **not** duplicated into a second location
(e.g. a repo-root `examples/` copy):

- `SPEC/examples/` is the established home for official, Board-reviewed
  example surface; the self-hosting proposal scopes Level 1 as "a second
  example alongside `SPEC/examples/company.yaml`."
- Two copies would themselves be a second-source-of-truth / divergence risk —
  the precise failure mode this whole exercise is built to avoid. Any future
  consumer that needs the document elsewhere (e.g. a Studio demo — see §8)
  references or copies from the one canonical SPEC file at build time; it does
  not fork it.

## 5. Executable evidence

All evidence is produced at the **CLI subprocess boundary** (the project's
evidence standard, RFC-0006/RFC-0007 precedent), against the Appendix
document. Because `pnpm run` masks non-zero child exit codes to 1, exit-code
cases are asserted by invoking the CLI entry directly (as the RFC-0007
closure review did). The required cases:

| # | Case | Command (against the example) | Expected |
|---|---|---|---|
| E1 | Schema validation | `genome validate <example>` | exit 0 |
| E2 | Compilation to Organization Graph | `genome graph <example>` | exit 0; emits the graph JSON |
| E3 | Graph assertions | parse E2 output | nodes for the company, both departments, three agents, three workflows, two policies; `requires` edges include `workflow:rfc-lifecycle → policy:ratification`, `workflow:phase-transition-review → policy:ratification`, `agent:engineering.engineering-agent → policy:queue-discipline`, **and the RFC-0007-derived** `workflow:implement-queue-item → policy:queue-discipline`; no unbound/inert-policy diagnostic on stderr |
| E4 | Deny-safe run without the Product Owner grant | `genome run <example> --workflow rfc-lifecycle` | exit 3; one `approval.requested` → `human:product-owner`; zero steps executed; `pending-approval` |
| E5 | Successful run with the grant | `genome run <example> --workflow rfc-lifecycle --grant human:product-owner --clock <fixed>` | exit 0; workflow completes |
| E6 | Attributed `approval.granted` evidence | inspect E5 log | an `approval.granted` event attributed to `human:product-owner` (source and principal), preceding the step events |
| E7 | Executor gate (RFC-0007 regression witness), no grant | `genome run <example> --workflow implement-queue-item` | exit 3; one `approval.requested` via `policy:queue-discipline` → `human:product-owner`; zero steps |
| E8 | Executor gate satisfied | `genome run <example> --workflow implement-queue-item --grant human:product-owner --clock <fixed>` | exit 0; workflow completes |
| E9 | Deterministic output | E5 run twice under the same `--clock` | byte-identical stdout |

These cases were **all executed green at the current HEAD during drafting**
against the Appendix document (transcript in the Appendix). They are recorded
here as the acceptance target; the implementation item (post-acceptance) lands
them as tests in the CLI package's suite (`packages/genome-cli/src/cli.test.ts`
or a sibling `*.test.ts`), additive only.

## 6. Regression boundaries (protected diffs)

The implementation that follows acceptance must hold every one of these, each
a verifiable diff:

- **No schema change** — `SPEC/schema/genome.schema.json` diff empty.
- **No compiler semantic change** — no production `.ts` diff under
  `packages/genome-compiler/src` (the example exercises existing derivation,
  including RFC-0007's participation binding, which already ships).
- **No production runtime change** — no production `.ts` diff under
  `packages/genome-runtime/src` (test files may gain nothing; runtime is
  exercised only through the CLI here).
- **No CLI surface change** — no diff to `packages/genome-cli/src/index.ts`
  (commands, options, exit codes, output contracts unchanged).
- **No event-taxonomy change** — no diff to
  `packages/genome-runtime/src/events`; no new event types.
- **No exported-log reader** — no shipped code path reads an exported log; no
  `--export-log` output is committed as a record.
- **No persistence behavior** — nothing durable is written or read by any
  shipped path.

The only permitted production diff is the **one new example file**; the only
permitted test diff is **additive CLI-boundary cases**. A discovered need for
any change beyond these stops the work and returns to the Board.

## 7. Relationship to Studio (Phase 4)

The example may later serve as a natural **Studio demo document** — an
Organization IDE whose sample file is the project that built it
(`docs/proposals/self-hosting.md`, Part D, Level 1). That is a *possible
future use*, noted only to record the affinity.

**This RFC does not open, design, scope, or authorize Phase 4.** Opening
Phase 4 requires its own RFC, Board review, and Product Owner ratification
(Governance Rule 2; `PROJECT_STATE.md`). Level 1 is independent of Phase 4 and
neither gates it nor is gated by it
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`, Severability).

## 8. Language Complexity Budget (non-binding review evidence)

Presented as review evidence and guidance only, mirroring the RFC-0007
precedent; this RFC does not promote it to a standing requirement.

| Dimension | Expected default | This RFC |
|---|---|---|
| New syntax | 0 | **0** — the example uses only existing v0.1 fields |
| New semantics | 0 | **0** — relies on accepted v0.1 + RFC-0007 participation binding; adds none |
| Compiler production change | 0 | **0** |
| Runtime production change | 0 | **0** |
| Schema change | 0 | **0** |
| CLI surface change | 0 | **0** |
| New maintained example | 1 | **1** (`SPEC/examples/genome-project.yaml`) |
| New executable tests | allowed | additive CLI-boundary cases (E1–E9) |

Actual meets the expected default on every dimension. **The language was
sufficient to represent the required structure without any semantic change**
— so this RFC designs no language solution and records no blocking gap. (Gaps
2–5 remain classified and deferred/rejected exactly as in
`docs/reviews/self-hosting-evidence-board-review.md`; none is reopened.)

## Constitutional check

- **P1 (specification is the product):** dogfooding is direct pressure on the
  spec's quality; Gap 1 → RFC-0007 is the proof, and this example makes the
  pressure permanent.
- **P2 / P5 (source of truth; views own no logic):** honored **only** under
  the §1 structure-only restriction; the self-Genome never restates state.
- **P7 (decisions are versioned):** the example and this RFC are repository
  documents. (Level 2, which would *strengthen* P7 via committed records,
  stays deferred.)
- **P8 (small stable primitives):** the gap list does not become a v0.2
  bundle; each gap waits for its consumer.
- **P9 (human governance first-class):** the demonstrated deny-safe parking of
  an un-ratified Board workflow (E4, E7) is P9, executable.
- **P10 / Charter ("examples before abstractions"):** Level 1 is precisely an
  example before any abstraction.

## Definition of Done

Standing governance requirement (Governance, RFC Completion Criteria):
`PROJECT_STATE.md`, `ROADMAP.md` deliverable statuses, and
`IMPLEMENTATION_QUEUE.md` reflect the work at the moment it lands, and
`pnpm check-state` passes.

RFC-specific, all verified **uncached** (Governance: evidence from uncached
runs):

1. `SPEC/examples/genome-project.yaml` exists as the single canonical example
   and satisfies the §2 minimum model under the §1 structure-only constraint.
2. Evidence cases E1–E9 pass at the CLI boundary, added additively to the CLI
   suite.
3. Every §6 protected boundary is a verified empty diff; the only production
   diff is the new example file; the only test diff is additive.
4. Full suite green, uncached:

   ```bash
   pnpm test -- --force
   ```

5. State consistency:

   ```bash
   pnpm check-state
   ```

6. Typecheck:

   ```bash
   pnpm typecheck
   ```

7. Exit-code cases captured with true exit codes via the direct CLI entry
   (not `pnpm run`), e.g.:

   ```bash
   node_modules/.bin/tsx packages/genome-cli/src/index.ts \
     run SPEC/examples/genome-project.yaml --workflow rfc-lifecycle          # expect exit 3
   node_modules/.bin/tsx packages/genome-cli/src/index.ts \
     run SPEC/examples/genome-project.yaml --workflow rfc-lifecycle \
     --grant human:product-owner --clock 2026-07-15T00:00:00Z                # expect exit 0
   node_modules/.bin/tsx packages/genome-cli/src/index.ts \
     run SPEC/examples/genome-project.yaml --workflow implement-queue-item    # expect exit 3
   ```

Done means: the example ships, the evidence protects it, the boundaries held,
and the state documents reconcile — with no language, schema, compiler,
runtime, or CLI change.

## Resolved open questions (Board dispositions, ratified 2026-07-15)

The Architecture Board decided all five open questions in
`docs/reviews/rfc-0008-board-review.md`; the Product Owner ratified them under
Option B. They are folded here as binding for the implementation. Three confirm
the draft (OQ1, OQ2, OQ4); two refine or select (OQ3, OQ5). **None changes the
example content, the evidence set (E1–E9), or any protected boundary.**

1. **Policy modeling of commissioning discipline — agent-scoped (confirmed).**
   The example ships `queue-discipline` **agent-scoped**
   (`appliesTo: [engineering.engineering-agent]`), relying on the accepted
   RFC-0007 participation binding to gate the owned `implement-queue-item`
   workflow; this retires the proposal's per-workflow Gap 1 workaround and
   makes the example a regression witness for RFC-0007. The workflow-scoped
   contrast lives in prose (this RFC / the proposal), **not** in the canonical
   example.
2. **Example file name and extension — `genome-project.yaml` (confirmed).**
   The canonical file is `SPEC/examples/genome-project.yaml`, matching the
   shipped `company.yaml` convention. Reconciling `SPEC/language.md`'s
   *recommended* `*.genome.yaml` extension project-wide is **out of scope** for
   this RFC (a candidate future editorial cleanup, plausibly an erratum).
3. **Non-normative marking mechanism — top-of-file comment, no verifier
   (refined).** The **top-of-file YAML comment is the canonical, binding
   marking** (it travels with the file and states both the governance-authority
   and the structure-only constraints, as shown in the Appendix). **No separate
   index file and no mechanical verifier are created** — a verifier would be a
   new reader of the governance docs and a larger commitment than the risk
   warrants (ADR-0010 reasoning), and any verifier that ever read an exported
   log would trip the persistence gate. The acceptance record pins the
   distinction: the example is **normative for the language/toolchain** (a
   tested example that must keep compiling and running) and **non-normative for
   the project's governance** (it governs nothing — the governance documents
   do).
4. **Divergence-control discipline — review discipline only (confirmed).**
   Governance-structure changes trigger a manual re-check of the example; there
   is **no** mechanical verifier, matching ADR-0010's minimalism and the
   proposal's Risk-2 mitigation.
5. **Roadmap placement — no `ROADMAP.md` deliverable row (selected).** The
   example is not a phase deliverable; it is shipped by this accepted RFC and
   tracked, on acceptance, via `IMPLEMENTATION_QUEUE.md` like any RFC item. No
   capability track is invented and phase accounting is unchanged.

## Explicitly not authorized / not done by this RFC

- No language, schema, compiler, runtime, or CLI change of any kind.
- No exported-log record committed; no log reader; no persistence.
- No `IMPLEMENTATION_QUEUE.md` item added (added only upon acceptance).
- `PROJECT_STATE.md` is reconciled only to reflect that this draft now exists
  and is under Board review (Governance Rule 8); no state is duplicated into
  the example.
- Phase 4 is not opened, designed, or scoped.
- Gaps 2–5 are not reopened; their classifications stand.

## Appendix — the candidate document and its drafting evidence

Non-normative. This is the exact document all §5 evidence was produced
against. It validates and compiles under the shipped v0.1 toolchain, models
commissioning discipline agent-scoped per RFC-0007, and contains no field
whose value changes as work progresses (§1). File header marking (OQ 3) is
shown as the recommended top-of-file comment.

```yaml
# Genome self-hosting example — a projection of the Genome project's durable
# organizational structure. NON-NORMATIVE FOR GOVERNANCE: the governance
# documents (docs/CONSTITUTION.md, docs/GOVERNANCE.md, docs/ARCHITECT.md) are
# authoritative; PROJECT_STATE.md is the source of current project state. This
# file describes structure only and must never restate current state
# (phase, milestone, queue, blockers). See RFC-0008.
genomeVersion: 0.1

company:
  name: Genome Project
  mission: Describe a company once. Compile it into an autonomous organization.
  timezone: UTC

departments:
  governance:
    mission: Keep decisions documented, reviewed, and reproducible beyond any individual contributor or conversation.
    agents:
      chief-architect:
        role: Chief Architect
        autonomy: manual
        skills:
          - architecture-review
          - specification-writing
          - boundary-analysis
      lead-engineer:
        role: Lead Engineer
        autonomy: manual
        skills:
          - implementation-review
          - evidence-verification
          - delivery-feasibility

  engineering:
    mission: Implement approved work from the Implementation Queue.
    agents:
      engineering-agent:
        role: Engineering Agent
        autonomy: supervised
        skills:
          - typescript
          - compiler-construction
          - runtime-implementation
          - cli-boundary-testing

workflows:
  rfc-lifecycle:
    owner: governance.chief-architect
    trigger: manual
    steps:
      - draft
      - board-review
      - ratify
      - record-adr
      - queue-work

  implement-queue-item:
    owner: engineering.engineering-agent
    trigger: manual
    steps:
      - bootstrap
      - implement
      - test-uncached
      - reconcile-state
      - merge

  phase-transition-review:
    owner: governance.chief-architect
    trigger: manual
    steps:
      - prepare-packet
      - board-review
      - ratify
      - apply-closure

policies:
  ratification:
    appliesTo:
      - rfc-lifecycle
      - phase-transition-review
    requiresApprovalFrom:
      - human:product-owner

  queue-discipline:
    appliesTo:
      - engineering.engineering-agent
    requiresApprovalFrom:
      - human:product-owner

integrations:
  github:
    type: source-control
    provider: github

memory:
  retention: long-term
  stores:
    - rfcs
    - adrs
    - board-reviews
    - retrospectives

objectives:
  north-star:
    description: Genome becomes the declarative language for autonomous organizations.
    owner: governance.chief-architect

metrics:
  uncached-suite-green:
    type: quality
    owner: engineering.engineering-agent
  state-consistency:
    type: governance
    owner: governance.lead-engineer
```

### Drafting evidence (executed at the current HEAD during drafting)

Produced by invoking the CLI entry directly so true exit codes are captured.
Recorded as drafting evidence; the acceptance target is E1–E9 landed as tests.

```text
E1  genome validate <example>                                   → exit 0 (valid)
E2  genome graph <example>                                      → exit 0; 19 nodes, 31 edges, no diagnostics
E3  requires edges:
      workflow:rfc-lifecycle            -> policy:ratification
      workflow:phase-transition-review  -> policy:ratification
      agent:engineering.engineering-agent -> policy:queue-discipline
      workflow:implement-queue-item     -> policy:queue-discipline   (RFC-0007 derived)
E4  genome run <example> --workflow rfc-lifecycle               → exit 3; #1 approval.requested policy:ratification
                                                                    -> human:product-owner; pending-approval; 0 steps
E5  genome run <example> --workflow rfc-lifecycle --grant
      human:product-owner --clock 2026-07-15T00:00:00Z          → exit 0; completed; 5 steps
E6  (from E5 log)  #2 approval.granted human:product-owner principal=human:product-owner (before step events)
E7  genome run <example> --workflow implement-queue-item        → exit 3; #1 approval.requested policy:queue-discipline
                                                                    -> human:product-owner; pending-approval; 0 steps
E8  genome run <example> --workflow implement-queue-item --grant
      human:product-owner --clock 2026-07-15T00:00:00Z          → exit 0; completed; 5 steps
E9  E5 run twice under the same --clock                         → byte-identical stdout
```

The headline stands, now on accepted RFC-0007 semantics: the shipped v0.1
stack executes this project's own ratification discipline with correct
deny-safe semantics — an un-ratified Board workflow parks (E4), a ratified one
runs to completion with an attributed record (E5, E6), and the engineering
agent's commissioning gate binds its owned workflow through a single
agent-scoped policy (E7, E8) with no per-workflow workaround.
