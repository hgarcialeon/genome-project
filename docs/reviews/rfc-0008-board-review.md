# RFC-0008 — Self-Hosting Example — Architecture Board Review

## Status

**Draft review — prepared for Product Owner ratification. No option applied.**
The Board re-executed every material claim in `RFC/0008-self-hosting-example.md`
against the repository, answered the twelve questions put to it, reviewed the
Language Complexity Budget, and disposed the five open questions. It recommends
a disposition below but **applies nothing**: no RFC edit, no implementation, no
example file, no queue item, no Phase 4 action. Ratification is the Product
Owner's act.

Review held 2026-07-15.

## Decision Under Review

- **Decision:** accept RFC-0008 as drafted (Option A), accept with amendments
  (Option B), or return for revision (Option C).
- **Sources of truth (read in full):** `RFC/0008-self-hosting-example.md`;
  `docs/proposals/self-hosting.md`;
  `docs/reviews/self-hosting-evidence-board-review.md`;
  `docs/reviews/maintenance-self-hosting-disposition-packet.md`;
  `docs/adr/0010-erratum-mechanism.md`; `PROJECT_STATE.md`; `ROADMAP.md`;
  `SPEC/language.md`, `SPEC/schema/genome.schema.json`,
  `SPEC/examples/company.yaml`; the compiler, runtime, and CLI sources and
  suites at the lines cited below.
- **HEAD under review:** branch `claude/genome-bootstrap-verify-kmh7fv`,
  RFC-0008 committed. Clean tree.
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer). Per house discipline, every claim was
  re-executed against the repository, not trusted from the draft. The
  candidate document was **extracted from the RFC's own appendix** (not a
  side sketch) and driven through the shipped CLI; exit-code cases were
  captured by invoking the CLI entry directly (`pnpm run` masks non-zero
  child exits to 1).

## Verified Evidence (re-executed at HEAD against the RFC appendix document)

| Claim (RFC) | Re-execution | Result |
|---|---|---|
| Repository health, uncached | `pnpm test -- --force` | ✅ 104/104, 0 cached — schema 4 · adapter 7 · runtime 18 · compiler 40 · CLI 35 |
| State consistency | `pnpm check-state` | ✅ exit 0 |
| Typecheck | `pnpm typecheck` | ✅ 5/5 |
| E1 — validates | `genome validate <appendix>` | ✅ exit 0 |
| E2 — compiles | `genome graph <appendix>` | ✅ exit 0 |
| E3 — graph shape | parse graph JSON | ✅ 19 nodes (Company 1 · Department 2 · Agent 3 · Workflow 3 · Policy 2 · Integration 1 · Objective 1 · Metric 2 · MemoryStore 4), 31 edges |
| E3 — no diagnostic | graph stderr | ✅ empty — no unbound/inert-policy warning |
| E3 — requires edges | parse graph JSON | ✅ exactly four: `rfc-lifecycle→ratification`, `phase-transition-review→ratification`, `agent:engineering.engineering-agent→queue-discipline`, **derived** `implement-queue-item→queue-discipline` |
| E4 — deny-safe (rfc-lifecycle, no grant) | direct CLI | ✅ exit 3; one `approval.requested` via `policy:ratification` → `human:product-owner`; 0 steps; pending-approval |
| E5 — granted run | direct CLI, `--grant human:product-owner --clock 2026-07-15T00:00:00Z` | ✅ exit 0; completed; 5 steps |
| E6 — attributed record | inspect E5 log | ✅ `#2 approval.granted human:product-owner principal=human:product-owner`, before the step events |
| E7 — executor gate (implement-queue-item, no grant) | direct CLI | ✅ exit 3; **exactly one** `approval.requested` via `policy:queue-discipline` → `human:product-owner`; 0 steps |
| E8 — executor gate satisfied | direct CLI, `--grant … --clock …` | ✅ exit 0; completed; 5 steps |
| E9 — determinism | two clocked E5 runs | ✅ byte-identical stdout |
| Participation binding is the mechanism (claim 7) | `packages/genome-compiler/src/graph/index.ts:212-222` | ✅ agent-scoped `appliesTo` entry derives one edge per owned workflow; `addRequiresEdge` dedups (`:187-192`) → single edge, single approval |
| No mutable state encoded (Rule 8) | token scan of the appendix data | ✅ none — the only "phase" token is the workflow *name* `phase-transition-review` (durable structure), not a current-phase value |
| Example status precedent | `packages/genome-cli/src/cli.test.ts:21` | ✅ `company.yaml` is itself a tested fixture (`VALID_EXAMPLE`) — SPEC examples are official, test-protected surface |

**No claim in the RFC failed re-execution.**

## The Board's Twelve Questions

**1. Is the purpose correctly limited to descriptive and evidentiary
self-hosting?** **Yes.** The RFC's Motivation and "authorizes/prohibits"
section confine it to (a) one example document and (b) the evidence that
protects it. It explicitly disclaims durable log records, any log reader,
runtime repository control, `PROJECT_STATE.md` replacement, Phase 4 work, and
new syntax/semantics. This is exactly Level 1 as scoped in
`docs/proposals/self-hosting.md` Part D and commissioned in the disposition
packet (Decision 2a-i). Descriptive + evidentiary only — confirmed.

**2. Is the structure/state boundary sufficient to preserve Rule 8?** **Yes.**
§1 states the boundary normatively (the document holds durable structure;
`PROJECT_STATE.md` remains the sole source of current state) and grounds it in
the correct architectural symmetry — `PROJECT_STATE.md` is this project's
`replay(log)`. The re-execution confirms the *artifact* honors it: the
document contains no phase, milestone, queue, blocker, priority, or status
field. The one apparent hit (`phase-transition-review`) is a workflow name —
durable structure. Sufficient.

**3. Is `SPEC/examples/genome-project.yaml` the correct canonical location?**
**Yes.** It sits beside the sole existing official example
(`SPEC/examples/company.yaml`), which is itself a tested fixture — so the new
file inherits a well-defined, regression-protected home and a matching naming
convention. This is the location the proposal named ("a second example
alongside `SPEC/examples/company.yaml`").

**4. Is one canonical source preferable to duplication elsewhere?** **Yes,
decisively.** Two copies would themselves be the second-source-of-truth /
divergence failure mode this whole exercise exists to avoid. A single SPEC
file, referenced (not forked) by any later consumer such as a Studio demo, is
correct. The RFC reaches the right conclusion.

**5. Does the minimum organization model accurately represent the Genome
project without encoding mutable state?** **Yes.** The §2 mapping is faithful
(see Q6) and the state scan confirms no mutable status is present. The model
represents durable roles, processes, approvals, and autonomy only.

**6. Are the proposed workflows and policies semantically faithful to current
governance?** **Yes**, with one nuance worth recording:
- Product Owner as the ratifying authority → `human:product-owner` in both
  policies: faithful (`docs/GOVERNANCE.md`, Approval).
- Board-as-process → the `rfc-lifecycle` and `phase-transition-review`
  workflows: faithful ("the Architecture Board is a process, not a fixed group
  of people").
- Chief Architect / Lead Engineer → `manual` agents: defensible per the
  Charter ("may be fulfilled by a human or an automated system"; `manual` =
  "acts only on explicit human instruction"), and correctly flagged as Gap 2
  (deferred, not reopened).
- Engineering Agent → `supervised`: faithful.
- Workflow steps mirror the real lifecycles: `rfc-lifecycle` (draft →
  board-review → ratify → record-adr → queue-work) matches the Decision
  Lifecycle happy path; `phase-transition-review` (prepare-packet →
  board-review → ratify → apply-closure) matches the Phase Transition Review;
  `implement-queue-item` (bootstrap → implement → test-uncached →
  reconcile-state → merge) matches the engineering discipline (BOOTSTRAP,
  uncached evidence, Rule-8 reconciliation).
- **Nuance (a strength):** modeling ratification approval as
  `human:product-owner` *only* — while the reviewing roles (Chief Architect,
  Lead Engineer) are the workflow's `board-review` step — correctly separates
  *review* (a workflow step) from *ratification* (the approval principal).
  That is a faithful decomposition of how this project actually decides, and
  it sidesteps Gap 5 (conjunctive-only approvals, rejected) rather than
  leaning on it.

**7. Does RFC-0007 participation binding eliminate the prior per-workflow
workaround as claimed?** **Yes — verified at source and at the boundary.** The
proposal's appendix used a workflow-scoped `queue-discipline` as a deliberate
Gap 1 workaround. RFC-0008 instead binds `queue-discipline` to the agent
(`appliesTo: [engineering.engineering-agent]`); the compiler
(`graph/index.ts:212-222`, RFC-0007/ADR-0009) derives the
`implement-queue-item → queue-discipline` edge because the agent owns that
workflow, and the dedup guard yields exactly one edge and one
`approval.requested` (E7). The enumeration workaround — and its unenforced
maintenance invariant — is genuinely retired. The example thereby doubles as a
standing regression witness for RFC-0007.

**8. Are E1–E9 sufficient and correctly placed at their validation
boundaries?** **Yes.** Coverage spans validation (E1), compilation and graph
structure incl. the derived edge and the *absence* of a spurious diagnostic
(E2–E3), deny-safe parking on both the initiation-gated (E4) and executor-gated
(E7) paths, successful completion on both (E5, E8), attributed record (E6), and
byte-determinism (E9). All are correctly placed at the **CLI subprocess
boundary** (RFC-0006/0007 precedent), and the RFC correctly notes exit codes
must be captured via the direct CLI entry, not `pnpm run`. The set is
sufficient; the Board requires no additional case.

**9. Are the protected boundaries appropriate?** **Yes — all seven.** Because
the example is pure data exercised through already-shipped compiler/runtime/CLI
paths (including RFC-0007's participation binding, which ships today), no
schema, compiler-semantic, runtime-production, CLI-surface, or event-taxonomy
change is needed; and the no-log-reader / no-persistence boundaries correctly
wall the example off from Level 2 (persistence gate) and Level 3 (Phase 6).
The only permitted production diff is the one example file; the only permitted
test diff is additive. Appropriate and verifiable.

**10. Does the example risk creating normative precedent beyond its stated
purpose?** **A bounded risk, adequately contained — and it needs one explicit
pin.** The example lives on normative surface (`SPEC/`) and is test-protected,
exactly like `company.yaml`. The precedent it sets is *toolchain* conformance
(it must keep compiling and running), **not** governance authority. A future
reader must not mistake it for a second governance source or a governance
conformance standard. The RFC's non-normative-for-governance marking and
review discipline contain this, but the Board pins the distinction explicitly
(see OQ 3): **normative for the language/toolchain (a tested example);
non-normative for the project's governance (it governs nothing — the
governance documents do).**

**11. Should the example be treated as an official conformance example, a
maintained product demo, both, or neither?** **An official, test-protected
example (functionally the "conformance example" option) — non-normative for
governance; explicitly *not* a commissioned product demo (yet), and not
neither.** It holds the same status `company.yaml` holds today. The Studio-demo
use is a *deferred possibility* (§7), not a current designation; treating it as
a commissioned demo now would over-authorize.

**12. Does the relationship to Studio remain non-authorizing and
non-designing?** **Yes.** §7 records only an affinity ("may later serve") and
states plainly that Phase 4 requires its own RFC, Board review, and
ratification. It opens, designs, scopes, and authorizes nothing.

## Language Complexity Budget — Review

Non-binding review evidence, per the RFC-0007 precedent.

| Dimension | Assessment |
|---|---|
| **Approved syntax cost** | **0.** No new grammar; the example uses only existing v0.1 fields. Verified: schema untouched is a precondition, and validation passes on existing schema. |
| **Semantic cost** | **0.** No new rule. The one non-trivial behavior it leans on — agent-scoped participation binding — is *already-accepted* RFC-0007 semantics, verified as shipped, not introduced here. |
| **Production-boundary cost** | **0.** One data file; no production code path changes. All seven protected boundaries hold by construction. |
| **Maintained-example cost** | **1.** A new artifact to keep faithful to the governance docs. Real but small: it is structure-only, so it changes only when durable structure (roles, workflows, policies) changes — rare — not when state changes. |
| **Ongoing test-maintenance cost** | **Low, non-zero.** E1–E9 must stay green and be revisited if governance structure or the toolchain's example contracts change. Comparable to `company.yaml`'s existing footprint; no new test harness. |
| **Hidden precedent risk** | **Low–moderate, contained.** The "SPEC example that is normative-for-toolchain but non-normative-for-governance" precedent is new and must be pinned (Q10, OQ3) so no future reader over-reads it. No verifier is minted (consistent with ADR-0010), so no new reader of the governance docs is created. |

Overall: the spend equals the RFC's stated default (0/0/0/1 + additive tests).
No overspend. The only item requiring an explicit decision is the precedent
pin, handled in the open questions.

## Disposition of the Five Open Questions

The Board decides each explicitly (the RFC delegated them here):

- **OQ1 — Policy modeling of commissioning discipline.** **Ship agent-scoped**
  (`appliesTo: [engineering.engineering-agent]`), as drafted. It uses the
  accepted RFC-0007 semantics, removes the unenforced per-workflow invariant,
  and makes the example a regression witness. The workflow-scoped *contrast*
  belongs in prose (this review / the proposal), **not** in the canonical
  example. *Confirms the draft.*
- **OQ2 — File name / extension.** **`SPEC/examples/genome-project.yaml`** —
  match the shipped `company.yaml`. Reconciling `SPEC/language.md`'s
  *recommended* `*.genome.yaml` extension project-wide is **out of scope** for
  this RFC (a candidate future editorial cleanup, plausibly an erratum). *Confirms
  the draft.*
- **OQ3 — Non-normative marking mechanism.** **The top-of-file YAML comment is
  the canonical, binding marking** (it travels with the file and states both
  the governance-authority and the structure-only constraints). **No separate
  index file and no mechanical verifier** are created — a verifier would be a
  new reader of the governance docs and a larger commitment than the risk
  warrants (ADR-0010 reasoning), and any verifier that ever read an exported
  log would trip the persistence gate. The acceptance record (this review)
  carries the normative-for-toolchain / non-normative-for-governance
  distinction (Q10). *Refines the RFC's recommendation by dropping the
  "pointer from an examples index" half, since no such index exists.*
- **OQ4 — Divergence control.** **Review discipline only; no mechanical
  verifier.** Governance-structure changes trigger a manual re-check of the
  example. This matches ADR-0010's minimalism and the proposal's Risk-2
  mitigation. *Confirms the draft.*
- **OQ5 — Roadmap placement.** **No new `ROADMAP.md` deliverable row.** The
  example is not a phase deliverable; it is shipped by an accepted RFC and
  tracked, on acceptance, via `IMPLEMENTATION_QUEUE.md` like any RFC item. This
  avoids inventing a capability track and keeps phase accounting clean.
  *Selects one of the RFC's offered answers.*

Three dispositions confirm the draft (OQ1, OQ2, OQ4); two refine/select
(OQ3, OQ5). **None changes the example, the evidence set (E1–E9), or any
protected boundary.**

## Reviewer Positions

- **Chief Architect — accept (with the OQ dispositions folded).** The RFC
  strengthens Principle 1 (dogfooding is direct pressure on the spec — Gap 1 →
  RFC-0007 is the proof) and honors Principle 2/5 strictly via the §1
  structure-only boundary. Boundary hygiene is exact: the example lives wholly
  as data behind the existing compiler/runtime/CLI contracts; nothing normative
  moves. The one thing the record must pin is the precedent (Q10/OQ3), and this
  review pins it. No architectural objection.
- **Lead Engineer — accept (with the OQ dispositions folded).** Every claim
  reproduced clean and uncached; E1–E9 are at the right boundary and are
  buildable additively onto `cli.test.ts` (the `company.yaml` fixture pattern
  already exists). The participation-binding claim holds at source and at the
  boundary, with the dedup verified (one edge, one approval). Maintenance cost
  is a single structure-only file plus nine additive assertions — proportionate.
  No implementation risk.

Disagreements: none material. One shared emphasis: OQ3's precedent pin is the
only non-mechanical decision here and must ride in the acceptance record so the
"non-normative for governance" status is durable.

## Decision Options

### Option A — Accept RFC-0008 as drafted

- **Consequences:** RFC-0008 is accepted verbatim, its five open questions
  standing as written for the implementation to resolve. Defensible, since the
  re-execution found the draft sound and three OQ dispositions merely confirm
  it; but it leaves OQ3 (the precedent pin) and OQ5 (roadmap placement)
  unresolved at acceptance.
- **Board assessment:** acceptable, but less complete than B — it defers the
  one decision (OQ3) that carries the only real risk.

### Option B — Accept RFC-0008 with amendments

- **Amendments = the five OQ dispositions above**, all confirmatory or
  refining, with **zero change** to the example, the E1–E9 evidence, or the
  protected boundaries. On ratification these fold into the RFC status and the
  eventual implementation exactly as RFC-0007's five amendments did.
- **Consequences:** RFC-0008 is accepted with the open questions decided and
  the toolchain-vs-governance precedent pinned in the record. The subsequent
  implementation item (added to `IMPLEMENTATION_QUEUE.md` only upon
  ratification) ships `SPEC/examples/genome-project.yaml` (agent-scoped policy,
  top-of-file non-normative marking), lands E1–E9 additively, holds the seven
  protected diffs, and reconciles state per Rule 8 — with no ROADMAP row.
- **Board assessment: recommended.**

### Option C — Return RFC-0008 for revision

- **Consequences:** the RFC returns to draft. The Board found no unmet
  criterion, no failed claim, no boundary breach, and no faithfulness defect
  that revision would cure — the open questions are dispositions, not defects.
- **Board assessment: not recommended.**

## Joint Board Recommendation

**Option B.** The draft is sound on re-executed evidence: E1–E9 pass uncached
at the correct boundary, the structure/state boundary holds, the organization
model is faithful, the participation-binding claim is verified at source, and
all seven protected boundaries are appropriate and empty by construction. The
only decisions the acceptance record needs are the five open questions — three
confirm the draft, two refine it, none touches the artifact or evidence — and
pinning the normative-for-toolchain / non-normative-for-governance precedent.
Option B records exactly those and nothing more.

## Exact Ratification Statement (for the recommended Option B)

> As Product Owner, I ratify Option B: RFC-0008 — Self-Hosting Example is
> accepted with the five open-question dispositions recorded in
> `docs/reviews/rfc-0008-board-review.md` (agent-scoped `queue-discipline`;
> canonical `SPEC/examples/genome-project.yaml`; top-of-file non-normative
> marking with no verifier; review-discipline-only divergence control; no
> ROADMAP row), and with the toolchain-normative / governance-non-normative
> precedent pinned as recorded. This authorizes one implementation item —
> the single example file plus additive CLI-boundary evidence E1–E9, holding
> the seven protected boundaries and reconciling state per Rule 8 — to be
> added to `IMPLEMENTATION_QUEUE.md` on this ratification. No language, schema,
> compiler, runtime, or CLI change is authorized; no exported-log record or
> reader; no persistence; Phase 4 is not opened.
>
> *(Alternatives: "I accept RFC-0008 as drafted" (Option A) / "I return
> RFC-0008 for revision with the following direction: …" (Option C).)*

## Explicitly Not Done by This Review

- No edit to `RFC/0008-self-hosting-example.md`.
- No example file created (`SPEC/` untouched).
- No implementation; no `IMPLEMENTATION_QUEUE.md` item added.
- No language, schema, compiler, runtime, or CLI change.
- No Phase 4 action.
- No option applied; no ratification recorded. Awaiting the Product Owner.
