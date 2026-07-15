# RFC-0007: Executor-Scoped Policies

## Status

Accepted — implemented and **closed** 2026-07-15.

Closed complete as implemented at commit
`c97de3dd8d3a7e3c646586ba907c6af95897290a` under the Architecture Board's
implementation closure review (Option A, Product Owner ratification
2026-07-15): see `docs/reviews/rfc-0007-implementation-close-review.md`.
Every Definition-of-Done item was re-executed uncached at that commit and
every protected boundary verified as an empty diff. The implementation
queue item is Done and drained (`IMPLEMENTATION_QUEUE.md`).

Commissioned 2026-07-14 by the Product Owner under Option A of
`docs/PRODUCT_STRATEGY.md` (architecture item A1), on the Gap 1
classification ratified 2026-07-14 in
`docs/reviews/self-hosting-evidence-board-review.md`.

Accepted by the Architecture Board (Product Owner, Chief Architect,
Lead Engineer) on 2026-07-14 under **Option A — Accept with
Amendments**; the Product Owner's ratification is recorded in the
review. The five recorded amendments have been applied to this document
and the four open questions resolved as recorded. See
`docs/reviews/rfc-0007-board-review.md` for the decision record
(including the Language Complexity Budget) and
`docs/adr/0009-participation-scoped-policies.md` for the recorded
architectural decision.

Nothing is implemented at acceptance: the implementation item enters
`IMPLEMENTATION_QUEUE.md` with the amended evidence cases below as its
acceptance criteria. Every evidence command quoted below was
re-executed and verified during the Board review.

## Summary

In Genome v0.1, a policy whose `appliesTo` names an agent gates only
workflow initiation **by** that agent. It does not gate runs of the
workflows that agent **executes**. Because all v0.1 initiation is
explicit and `genome run` initiates as a human operator, the common
governance intent — "work performed by this agent requires sign-off" —
written the obvious way (`appliesTo: [<agent>]`) binds **zero runs** in
the dominant invocation path, with no diagnostic anywhere: the document
validates, compiles, and runs to completion ungated.

This RFC proposes that an agent-scoped policy gate every run in which
the named agent **participates**:

1. runs the agent initiates — the existing binding, retained; and
2. runs of workflows the agent executes — in v0.1, workflows whose
   `owner` resolves to that agent — the new binding that closes Gap 1.

The change is deny-safe in direction (it only adds gates, never removes
one), requires **no schema change**, and is a **compiler-boundary
derivation**: the compiler resolves executor bindings into the same
`requires` edges and `governedBy` sets the accepted runtime contract
already consumes, so the runtime's **production source changes by zero
lines** (the runtime suite gains additive cases only — amendment 1).
Agent autonomy semantics (`manual`/`supervised`/`autonomous`) are
explicitly **not** widened.

## Motivation

### The demonstrated defect class

The self-hosting investigation (`docs/proposals/self-hosting.md`)
modeled this project's own rule — "no engineering work without Product
Owner commissioning" — the way any reasonable author would:

```yaml
policies:
  queue-discipline:
    appliesTo:
      - engineering.engineering-agent   # the agent whose work is governed
    requiresApprovalFrom:
      - human:product-owner
```

with the agent declared `autonomy: supervised`. Driven through
`genome run … --workflow implement-queue-item` with no grant, the run
**completed with zero approval events, exit 0**. The Board re-verified
this by reconstructing the mis-modeled variant at HEAD `7d978d1`
(`docs/reviews/self-hosting-evidence-board-review.md`, Verified
Evidence): the failure reproduced exactly, and the corrected
workflow-scoped variant parked deny-safe at exit 3.

The behavior is **specified, not a bug**: `SPEC/language.md` says an
agent-applied policy "gates every workflow initiation by that agent,"
and the runtime implements exactly that (initiator resolution and
policy union at `packages/genome-runtime/src/runtime/index.ts:122-159`).
No implementation defect exists; the defect is in what the language lets
a declaration *mean* versus what it *reads as meaning*. That makes the
fix RFC territory (Governance Rule 2), which is why the erratum path is
unavailable and this RFC exists.

### Why the evidence justifies language evolution now

The ratified classification recorded two independent grounds, and this
RFC's acceptance criteria must answer both:

- **Specification integrity (Chief Architect ground).** The v0.1
  posture is deny-safe everywhere: absence of declaration never grants
  autonomy. Gap 1 is the one place the posture inverts — a *present*
  declaration silently under-binds. A document that reads as governed
  and is not violates the product's central promise (Constitution
  Principle 9; the product thesis in `docs/PRODUCT_STRATEGY.md` §1).
- **The unenforced maintenance invariant (Lead Engineer ground).** The
  workaround — restating the policy per workflow
  (`appliesTo: [implement-queue-item, …]`) — is verified deny-safe but
  must be maintained by hand: every future workflow owned by a governed
  agent silently ships ungated unless a human remembers a
  cross-reference no tool checks. This project eliminates exactly this
  defect shape mechanically everywhere else.

The Board's Option B analysis added the strategic reason to act before
adoption grows: for this gap, "waiting for more evidence means waiting
for harm" — the next evidence would be a silently ungated production
organization discovered after the fact.

## Goals

1. Make the obvious declaration mean what it reads as meaning: an
   agent-scoped policy gates the work of that agent, not only the
   initiative of that agent.
2. Remove the hand-maintained workaround invariant: adding a workflow
   owned by a governed agent must add its gate automatically, at
   compile time.
3. Keep the change deny-safe and monotone: no run that is gated today
   becomes ungated.
4. Keep the accepted architecture intact: no schema change, no runtime
   public-contract change, no new event types, no new CLI surface;
   derivation lives behind the ADR-0002/ADR-0003 compiler boundary.
5. Leave autonomy semantics untouched, and say so normatively, so the
   distinction between *governing an agent's initiative* (autonomy) and
   *governing an agent's work* (policy) becomes explicit language.

## Non-goals

- **Scope-qualifier syntax** (`initiator:`/`executor:` prefixes, a
  `scope:` field, or workflow-set selectors). No consumer has asked to
  gate initiative-only; the grammar can be layered on later evidence
  without disturbing this RFC's semantics (see Alternatives).
- **Autonomy widening.** `manual`/`supervised`/`autonomous` continue to
  govern initiation by the agent only (see Proposed Semantics §4).
- **Quorum/ordered approvals** — Gap 5, rejected on the evidence at
  hand; conjunctive drain semantics are unchanged.
- **Workflow control flow** (Gap 4), **human members** (Gap 2),
  **artifact primitive** (Gap 3) — each waits at its ratified gate.
- **Trigger auto-initiation, event persistence, provider adapters,
  per-step gating** — all remain out of scope; gates continue to bind
  at initiation, once per run.
- **Phase 4** — this RFC does not open it and is sequenced before it by
  the adopted strategy.

## Semantics Before This RFC (v0.1 as shipped at review time)

Per `SPEC/language.md` (Policy Scope) and the shipped implementation:

- A policy applying to a **workflow** gates initiation of that
  workflow, for every initiator. (Unchanged by this RFC.)
- A policy applying to an **agent** gates every workflow initiation
  **by** that agent — and nothing else. Operator-initiated runs of
  workflows the agent owns and executes (every step is assigned to the
  workflow's `owner`, `packages/genome-runtime/src/runtime/index.ts:111-120`)
  are not gated by it.
- The runtime computes a run's governing policies as the union of the
  workflow's `governedBy` and the *initiating* agent's `governedBy`,
  deduplicated by policy id (`runtime/index.ts:122-128`).
- The compiler derives `governedBy` from `requires` edges in the
  Organization Graph
  (`packages/genome-compiler/src/targets/runtime-model.ts:79-80`), which
  graph construction creates from `appliesTo` entries.

## Accepted Semantics (normative)

### 1. Participation binding

A policy whose `appliesTo` names an agent gates **every run in which
that agent participates**. An agent participates in a run when either:

- **(a) it initiates the run** — the existing binding, retained
  verbatim; or
- **(b) it executes the run's workflow** — new. In v0.1, the executor
  of a workflow is its `owner`: the agent to which every step of a run
  is assigned. An agent-scoped policy therefore gates initiation of
  every workflow whose `owner` resolves to that agent, **regardless of
  who initiates**.

Approval mechanics are unchanged in every respect: approvals are
requested at initiation, once per run; they are conjunctive and
deny-safe; matching, drain adoption, denial (`approval.denied` →
`policy.enforced` → `workflow.failed`), and the `human:*` intrinsic
floor reservation all behave exactly as accepted in RFC-0004/ADR-0005.
`policy.enforced` continues to be emitted **only on the denial path**;
the granted-path evidence event remains the attributed
`approval.granted` (per the ratified RFC-0006 case-4 erratum — this RFC
deliberately repeats that lesson rather than that slip).

### 2. Derivation at the compiler boundary

The binding is resolved at **compile time**, not run time. For each
`appliesTo` entry that resolves to an agent, graph construction
produces:

- the existing `requires` edge from the **agent** node to the policy
  node (retained — it carries binding (a) through the runtime's
  initiator union); and
- one `requires` edge from **each workflow node whose `owner` resolves
  to that agent** to the policy node (new — it carries binding (b)
  through the workflow's `governedBy`, which the shipped runtime
  already honors).

Consequences, all intended:

- The `RuntimeModel` shape is unchanged; only the contents of
  `governedBy` (and the derived `RuntimePolicy.appliesTo` echo) gain
  entries.
- The shipped runtime gates binding (b) with **zero production-source
  change**, because `governingPolicies` already unions the workflow's
  `governedBy`. The `git diff` under `packages/genome-runtime` is empty
  except for additive test cases in `runtime.test.ts` (Definition of
  Done item 6, as amended).
- Policy deduplication by id means a document using the current
  workaround (the same policy applied to both the agent and its
  workflows explicitly) gains **no duplicate approval requests** — the
  transition is a no-op for corrected documents.
- No interpretation of Genome YAML happens outside the compiler
  boundary (ADR-0002/ADR-0003 preserved).

### 3. Specification text

Upon implementation, the agent bullet of `SPEC/language.md` Policy
Scope is replaced by:

> - A policy applying to an **agent** gates every run that agent
>   participates in: every workflow initiation *by* that agent, and
>   every initiation *of* a workflow that agent executes (in v0.1, a
>   workflow whose `owner` resolves to that agent) — whoever initiates
>   it. Autonomy levels are unaffected: they continue to govern only
>   the agent's own initiative (see Agent Autonomy Levels).

### 4. Autonomy is explicitly not widened

`manual`, `supervised`, and `autonomous` continue to bind on
**initiation by the agent** only. Rationale: autonomy answers "may this
agent act on its own initiative?", and an operator-initiated run *is*
the explicit human instruction that `manual` and `supervised` exist to
require. Widening autonomy to executor scope would additionally break a
demonstrated, load-bearing pattern: the self-hosting document maps human
roles to `autonomy: manual` agents that own governance workflows, and
those workflows execute correctly under human initiation today —
executor-scoped autonomy would make every such run refuse. The
distinction this RFC draws is: **autonomy governs the agent's
initiative; policies govern the agent's work.** The Board confirmed
this boundary (review, OQ2); the sentence is normative, and future
autonomy RFCs inherit it.

### 5. Diagnostics

With the semantic fix, the silent under-binding disappears, so no
"inert gate" warning is needed for the demonstrated case. One small
addition ships for the only remaining provably-inert shape: the
existing *unbound policy* warning is extended to a policy whose
`appliesTo` entries resolve **only** to `manual` agents that own no
workflows (such a policy can never bind any run — a manual agent
neither initiates nor, owning nothing, executes). The diagnostic is
**pinned to warning severity forever** (review, OQ4): a
declared-ahead-of-wiring organization is legitimate authoring, and this
project does not hard-fail intent. Derived bindings are observable
without new surface: the new `requires` edges appear in `genome graph`
output, which the evidence cases below pin.

## Schema Impact

None. The `appliesTo` grammar (workflow ids and dotted agent
references) is unchanged; `SPEC/schema/genome.schema.json` is untouched.
Semantic validation of `appliesTo` references is already in place and
unchanged.

## Compatibility and Versioning

The change is **monotone in the deny-safe direction**: every run gated
today remains gated with identical mechanics; some runs ungated today
become gated. Affected documents are exactly those declaring an
agent-scoped policy where that agent owns one or more workflows —
i.e. documents whose authors wrote the declaration this RFC makes mean
what it reads as meaning. For them, operator-initiated runs move from
"completed, ungated" to "parked at exit 3 pending the declared
principals" — the intended reading.

- `SPEC/examples/company.yaml` is unaffected: its only policy is
  workflow-scoped (`appliesTo: [build-feature]`). The Board Condition 5
  evidence command and the 16-event sequence are unchanged.
- The correction is **within `genomeVersion: 0.1`** (resolved — review,
  OQ1), as a specification-integrity defect fix: the pre-adoption stage
  means no external documents rely on the under-binding (verified by
  the review's inventory), the direction is deny-safe, and the
  alternative — freezing the defective reading into v0.1 forever —
  would make the first version's flagship gate semantics permanently
  untrustworthy. A v0.2 bump was considered and declined: it would
  imply the initiator-only reading remains a supported dialect.

## Testing and Executable Evidence

House standard: CLI-boundary cases at the subprocess boundary (spawn,
exit codes, parsed output), uncached evidence for review. Required
cases upon acceptance:

1. **The Gap 1 reproduction, now gated.** A fixture reconstructing the
   mis-modeled self-hosting variant (agent-scoped policy naming a
   `supervised` agent that owns the workflow): `genome run … --workflow
   <owned-workflow>` with no grant → **exit 3**, `approval.requested`
   naming the policy's principals, zero steps executed.
2. **Granted path.** Same fixture with the matching `--grant` →
   exit 0, attributed `approval.granted`, workflow completed. (No
   `policy.enforced` on this path.)
3. **Initiator binding retained.** An agent-initiated run of a workflow
   the agent does *not* own, governed by an agent-scoped policy → still
   gated. A new, **additive** case in the runtime suite
   (`runtime.test.ts`) — agent initiation is unreachable from the CLI
   (`genome run` initiates as `human:operator`, verified in review) —
   doubling as closure of the previously untested initiating-agent half
   of the policy union (amendments 1–2).
4. **No double-gating.** A fixture applying one policy to both the
   agent and an owned workflow explicitly (the current workaround) →
   exactly one `approval.requested` per policy, one grant drains it.
5. **Dedup at the transition.** The corrected self-hosting-style
   fixture (workflow-scoped restatement) behaves identically before
   and after the change.
6. **Graph observability.** `genome graph` on fixture 1 shows the
   derived workflow→policy `requires` edges **in a deterministic,
   pinned order** — not merely their presence (amendment 3; same
   discipline as ADR-0006's shared canonicalization).
7. **Inert-policy diagnostic.** A policy applying only to a manual,
   workflow-less agent → the extended unbound-policy warning.
8. **Condition 5 regression.** `genome run SPEC/examples/company.yaml
   --workflow build-feature --grant human:engineering-manager` →
   exit 0, unchanged event sequence.
9. **Determinism unchanged.** Byte-identical stdout/export under
   `--clock` for a gated fixture (existing determinism contract holds
   over the new bindings).

The Board review's inventory verified that **no existing fixture or
assertion anywhere in the repository depends on the old binding**
(review, Finding 2): no shipped fixture declares an agent-scoped policy
naming an agent that owns workflows. Implementation is therefore
additive at every site outside the derivation rule itself. Behavior
change is exactly why this is an RFC and not an erratum.

## Definition of Done

1. `SPEC/language.md` Policy Scope updated to the accepted wording
   (§3 above), including the autonomy non-widening sentence.
2. Compiler derivation implemented behind the compiler boundary:
   `requires` edges from owned workflows to agent-scoped policies;
   compiler suite extended accordingly.
3. The extended unbound-policy diagnostic implemented and tested.
4. The nine evidence cases above passing uncached at the CLI/runtime
   boundaries.
5. No schema change: `SPEC/schema/genome.schema.json` diff empty.
6. No runtime behavior change (amendment 1): `git diff` under
   `packages/genome-runtime` empty against the merge-base **except for
   additive test cases in `runtime.test.ts`**; the existing 17 tests
   byte-unchanged and passing; production runtime source unchanged.
   (If implementation discovers a runtime *source* change is required,
   work stops and returns to the Board — the expectation is
   load-bearing, not decorative.)
7. ADR recorded: `docs/adr/0009-participation-scoped-policies.md`,
   scoped to the participation-binding decision and the
   autonomy/policy boundary.
8. Standing requirement (Governance): project state and governance
   documents reconciled — `PROJECT_STATE.md`, `ROADMAP.md` statuses if
   touched, `IMPLEMENTATION_QUEUE.md` entry drained, `pnpm check-state`
   passing.

## Open Questions (resolved)

All four were answered by the Board on 2026-07-14 and ratified under
Option A (`docs/reviews/rfc-0007-board-review.md`, Open Questions —
Board Answers); the resolutions are folded into the sections above:

1. **Versioning disposition — resolved: correct within v0.1.** No
   external document relies on the initiator-only reading; the change
   is monotone deny-safe; a v0.2 bump would freeze the defective
   reading as a supported dialect (Compatibility and Versioning).
2. **The autonomy/policy boundary — resolved: confirmed, normative.**
   Autonomy governs the agent's initiative; policies govern the agent's
   work (§4).
3. **Retention of binding (a) — resolved: the union is confirmed.**
   Executor-only binding would release the existing gate on a governed
   agent's initiations of non-owned workflows — a deny-safe regression,
   rejected without dissent (§1).
4. **Diagnostic scope — resolved: ships, pinned to warning severity
   forever** (§5).

## Alternatives Considered

- **Diagnostics only (no semantic change):** a compiler warning when an
  agent-scoped policy names an agent that owns workflows. Rejected as
  the primary remedy: it answers the specification-integrity ground
  only partially (the document still does not mean what it reads as
  meaning; the author is merely told so) and the maintenance-invariant
  ground not at all (the per-workflow restatement remains
  hand-maintained forever).
- **Explicit scope qualifiers** (`executor:<agent>` /
  `initiator:<agent>` entries, or a per-policy `scope:` field):
  strictly more expressive, but it forces every author to learn a
  distinction whose safe answer is "participation" anyway, and the
  unqualified form still needs a meaning — which is this RFC's actual
  question. Deferred as future grammar, adoptable without breaking
  participation semantics, if a consumer ever presents initiator-only
  need.
- **Deprecate agent-scoped `appliesTo`** (workflow-only policies,
  authors enumerate): makes the unenforced invariant permanent and
  official. Rejected.
- **Runtime-side resolution** (the runtime looks up the owner's
  policies at `startWorkflow`): behaviorally equivalent, but it moves
  language semantics below the compiler boundary, contradicting
  ADR-0002/ADR-0003 and the standing rule that no interpretation of the
  Genome happens outside the compiler. Rejected on boundary grounds.
- **Widen autonomy instead of policies** (supervised/manual become
  executor-scoped): breaks the demonstrated human-initiated governance
  pattern (§4) and conflates initiative with work. Rejected.
