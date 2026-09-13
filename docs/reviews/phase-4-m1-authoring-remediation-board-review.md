# Architecture Board Review — Milestone-1 Authoring Remediation

**Status: RATIFIED by the Product Owner, 2026-09-13.**

Held 2026-09-13. Subject:
`docs/proposals/phase-4-m1-authoring-remediation.md`.

Occasioned by the Product Owner's rejection of Phase 4 Milestone 1 product
acceptance (`docs/reviews/phase-4-m1-product-acceptance.md` §12).

Board (per `docs/GOVERNANCE.md`): Product Owner, Chief Architect, Lead Engineer.

**The Board recommends; it does not decide.** §§1–7 are the Board's review as
held. The Product Owner's decision is recorded in **§8: RATIFIED 2026-09-13** —
Option C with amendments A1–A8. That ratification resolves the remediation
**architecture** and **commissions an RFC**. It authorizes **no implementation**,
adds **no queue item**, marks nothing Done, and closes no phase.

---

## 1. What the Board was asked

> How should Genome support semantic organizational authoring without making
> Studio a second implementation of the Genome language?

## 2. Findings of fact

Confirmed against the repository at `55e1206`, not against the proposal's
narrative.

| # | Finding | Basis |
|---|---|---|
| F1 | The accepted architecture has no surface for *intent → document change*. The compiler (RFC-0002, ADR-0003) runs source → meaning only; `@genome/schema` validates; the runtime consumes a runtime model. Nothing owns the inverse. | `packages/genome-compiler/src/index.ts` exports `compile` and the four read-only targets; `@genome/schema` exports `parseGenomeDocument`, `createValidator`, `formatErrors` — no writer anywhere. |
| F2 | Studio correctly owns no language semantics today. Its entire compiler contact is `compileDocument`, which delegates to `compile`/`graphTarget`/`inspectTarget`/`runtimeModelTarget` and adds nothing. | `apps/genome-studio/src/genome/compilation.ts` |
| F3 | The failure is therefore **architectural, not a defect**. Checkpoints 1–7 implemented the accepted scope correctly; the accepted scope was incomplete against its own product outcome (RFC-0009 §2, §10.1). | F1 + F2 + the acceptance record |
| F4 | RFC-0009 §10.1 criterion 2 measures the *consequence* of an edit, never its *origin*, so no executable evidence could have caught this. The human walkthrough was the only instrument that could. | `acceptance.test.tsx` performs the edit programmatically and passes |
| F5 | Source-preserving mutation is achievable with an **already-accepted** dependency: `yaml` v2 is a dependency of `@genome/schema` and its document API preserves comments, key order and formatting. | `packages/genome-schema/package.json` |
| F6 | Source preservation is governance-relevant, not cosmetic: the canonical example carries a top-of-file non-normative-for-governance marking (RFC-0008 §1) that a naive rewrite would destroy. | `SPEC/examples/genome-project.yaml` |
| F7 | The schema alone cannot guarantee a valid organizational change: Genome's cross-references (workflow `owner` → declared agent; policy `appliesTo` → workflow or agent) are compiler-enforced semantics, not schema constraints. | `packages/genome-compiler/src/semantics` |
| F8 | A toolchain-owned capability has a named future consumer independent of Studio: Phase 6 self-improvement requires an agent to propose organizational change. | `ROADMAP.md` Phase 6; ADR-0006 |

## 3. Assessment of the alternatives

### Option A — Source-navigation assistance only

The Board agrees with the proposal's verdict and states the reasoning
independently. The recorded blocker is that the user cannot perform the change
*without understanding and manually editing the Genome source structure*.
Option A leaves that sentence true in full. It relocates the difficulty without
removing it, and it answers the architectural question with "Genome has no
answer; the user supplies it."

The Board notes Option A's real value and declines to discard it: its
schema-derived explanation is the right *accompaniment* to an authoring
operation and directly serves the secondary observation.

**Not sufficient as the remediation. Retained as a component.**

### Option B — Studio-owned document mutation

**Rejected on principle, not on cost.**

Option B places knowledge of where an agent belongs into the view. That is
domain logic, and Constitution Principle 5 / Governance Rule 5 prohibit it;
RFC-0009 §3 restates the prohibition for this exact surface. The Board records
three aggravating factors beyond the principle:

1. **Two implementations, one test suite.** The compiler's semantics tests would
   not fail when Studio's assumptions drifted (F7 makes drift likely, since the
   cross-reference rules Studio would have to reimplement are precisely the ones
   the schema cannot express).
2. **Source preservation would land in the view** — including responsibility for
   F6's governance marking.
3. **Precedent.** The prohibition is load-bearing for every future surface
   (Office View, Marketplace, SDK). An exception granted once to the cheapest
   option is not recoverable.

The Board explicitly affirms the proposal's refusal to recommend this because it
is easy to implement.

### Option C — Toolchain-owned semantic authoring operations

**Recommended.** It is the only option that answers the question asked.

The Board endorses the proposal's reasoning and adds the following.

**On package ownership, the Board agrees the capability does not belong in the
compiler**, and considers this the most consequential structural judgement in
the review. The compiler's boundary has been defended twice (ADR-0002,
ADR-0003) and crossed exactly once, under a narrow one-time authorization
(ADR-0011). Authoring runs the opposite direction and carries concerns the
compiler deliberately lacks — formatting preservation, partial documents,
placement. Hosting it in the compiler would entangle the language's most stable
surface with its least settled one and make every future operation a change to
the most protected package in the repository. A distinct package is correct.

**The Board declines to name the package in this review.** `@genome/authoring`
is a reasonable provisional name; naming is the RFC's job.

**On what the capability must own** (F7 is decisive): validation of an operation
cannot be schema-only. The operation must be rejected before any source is
written if it would break a cross-reference the compiler enforces. The Board
regards reuse of the compiler's existing diagnostics — rather than a second
diagnostic vocabulary — as a requirement of any accepted design, not a
preference.

**On determinism and source preservation:** both must be pinned by committed
fixtures in the style already established (RFC-0008 E9; the ADR-0011 golden
revisions). F6 makes preservation a correctness property.

**On vocabulary growth:** the Board agrees the operation vocabulary is a
governed surface. One operation now. Growth by decision, never by convenience.

**The Board records the cost honestly.** This is the most expensive option and
it spends language complexity budget (§5). The Board's judgement is that F8 is
decisive: the capability is required by Phase 6 regardless of Studio, so the
question is when it is built and who owns it — not whether.

### Option D — Structured projection editor

The Board accepts the proposal's analysis and sharpens it: **Option D is not an
alternative to Option C.** Rendering structured editing from the accepted schema
is legitimate and embeds no semantics, but D is silent on how a change reaches
the source — which is the entire question. Whatever materializes it is Option B
or Option C underneath. F7 additionally shows a schema-derived form cannot alone
guarantee a valid change.

**Not a decision alternative. A presentation choice atop C, and out of scope for
the minimum remediation.**

### Option E — alternatives the Board considered

The Board evaluated the proposal's compiler-hosted target (§4, Option E) and
**rejects** it, for the ownership reasons under Option C.

The Board considered and rejects two further options not in the proposal:

- **E2 — Re-scope Milestone 1 to drop "Authoring".** Accept the slice as
  "Governed Organization Viewer" and defer authoring. Rejected: it would make
  the milestone's own name inaccurate, and RFC-0009 §2's product outcome is
  authoring. This is renaming a failure, not remediating it.
- **E3 — Template/scaffold library.** Ship pre-written document fragments the
  user pastes. Rejected: it is Option A with worse ergonomics, and it puts
  language structure into a data file no compiler test validates.

## 4. Board recommendation

> **Option C — toolchain-owned semantic authoring operations**, with Option A's
> schema-derived explanation folded in as the presentation, scoped to the single
> `add-agent` operation for remediation.

### Amendments the Board attaches

The Board recommends Option C **with** these amendments, all of which bind the
RFC if the Product Owner ratifies.

| # | Amendment |
|---|---|
| **A1** | **The capability is a new package, not a compiler target.** No production diff under `packages/genome-compiler/src` for the remediation. ADR-0011's one-time authorization is not reopened and does not extend here. |
| **A2** | **Operation validation must reuse the compiler's semantics and diagnostics**, not reimplement or re-word them. An operation that would produce an invalid or semantically broken document fails *before* any source is written. |
| **A3** | **Source preservation is a correctness property, not a nicety.** Comments, key order and formatting survive; the RFC-0008 non-normative marking (F6) is a required fixture. Determinism — same document plus same operation yields byte-identical source — is pinned by committed fixtures. |
| **A4** | **The Genome source remains canonical and visible.** The authoring interaction must not conceal the document; the user must be able to see exactly what changed. The product's honesty about the source is part of what already passed acceptance and must not be traded away. |
| **A5** | **One operation.** `add-agent` only. The vocabulary grows by decision. |
| **A6** | **A new RFC is required** (§5, Governance Rule 2). The Board recommends a **new RFC** rather than an RFC-0009 amendment, because the capability has consumers RFC-0009 does not govern (F8). RFC-0009's Milestone 1 then depends on it. |
| **A7** | **The accepted Milestone-1 evidence is preserved, not re-litigated.** Checkpoints 1–7 stand. The remediation adds; it does not redesign the graph, tree, execution, governance attribution, ephemeral session model, or accessibility floor. |
| **A8** | **The accessibility floor applies to the new interaction** exactly as to existing ones (WCAG 2.2 AA target; keyboard-operable; the §10 acceptance floor in `IMPLEMENTATION_QUEUE.md`). |

## 5. Language Complexity Budget — Board assessment

The Board **independently confirms** the proposal's assessment and its result.

| Dimension | Default | Board finding |
|---|---|---|
| New syntax | 0 | **0** |
| New language semantics | 0 | **0** |
| Schema change | 0 | **0** |
| Compiler production change | 0 | **0** (bound by A1) |
| Runtime production change | 0 | **0** |
| Event-taxonomy change | 0 | **0** |
| Source identity / revision semantics | 0 | **0** |
| Governance semantics | 0 | **0** |
| New semantic operations | 0 | **1** (`add-agent`) |
| New document-transformation semantics | 0 | **1** |
| New public toolchain API | 0 | **1** |
| New maintained package | 0 | **1** |

**Result: NON-ZERO on four dimensions. An RFC is required.**

The Board draws attention to the *shape* of this result and considers it the
strongest evidence for Option C: the budget is spent entirely on **new
capability**, and **nothing already accepted moves**. The language, schema,
compiler behavior, revision semantics, runtime and governance semantics are all
unchanged. A remediation that spent less budget (A) does not clear the blocker;
one that appears to spend none (B) merely hides the same cost inside an
application.

The Board records that Option B's apparent zero is the reason budget assessment
exists, and endorses the proposal's refusal to route language expansion through
a Studio implementation task.

## 6. Stop conditions — Board confirmation

The Board confirms that Option C, as scoped and amended, requires **no** change
to Genome language semantics, schema semantics, compiler normative behavior,
source identity/revision semantics, runtime semantics, or governance semantics.
No stop condition is tripped by the recommendation itself.

Should RFC drafting find any of the above necessary, work **stops** and returns
to the Board and Product Owner. This is not an implementation detail to be
resolved in passing.

## 7. Governance state — unchanged by this review or its ratification

- Milestone 1 remains **In Progress**; it is **not** complete.
- The `IMPLEMENTATION_QUEUE.md` item remains **In Progress**; it is **not** Done.
- Phase 4 remains **open for Milestone 1 only**; it is **not** closed.
- No `ROADMAP.md` Milestone-1 deliverable moves to Done.
- **No queue item is added.** Per the queue's entry rules nothing enters until an
  RFC is accepted and ratified.
- This review authorizes **no** Milestone 2, Autonomy Substrate, Office View,
  persistence, or implementation of any kind.

## 8. The decision awaiting the Product Owner

**Ratify, amend, or reject the Board's recommendation:**

> **Option C — toolchain-owned semantic authoring operations**, with amendments
> A1–A8, scoped to `add-agent`, delivered via a **new RFC**.

Available dispositions:

- Ratify Option C as recommended (with A1–A8)
- Ratify Option C with modified amendments
- Ratify a different option (A, B, D, E2, E3)
- Reject and return to the Board with direction

**Product Owner disposition: RATIFIED — 2026-09-13**

The Product Owner ratifies **Option C — toolchain-owned semantic authoring
operations — exactly as recommended**, including **amendments A1–A8**.

| Field | Value |
|---|---|
| Disposition | **Ratified as recommended** |
| Option | **C** — toolchain-owned semantic authoring operations |
| Amendments | **A1–A8, all ratified** |
| Date | 2026-09-13 |
| Scope | remediation **architecture** only |

### Ratified architectural direction

```
user organizational intent
  → Studio interaction
  → toolchain-owned semantic authoring capability
  → canonical Genome source
  → existing compiler
  → projections / runtime
```

**Studio must not become an implementation of Genome document semantics.**

### What this ratification does

- Resolves the remediation **architecture**.
- **Commissions a new RFC** for the smallest semantic-authoring capability that
  clears the rejected Milestone-1 acceptance criterion, scoped to exactly one
  operation: **`add-agent`**.

### What this ratification does NOT do

- **It does not authorize implementation.** No `add-agent` implementation, no
  Studio production-code change, no language/schema/compiler/runtime change.
- It adds **no** `IMPLEMENTATION_QUEUE.md` item. Nothing enters the queue until
  the commissioned RFC is itself accepted and ratified.
- It marks nothing Done, completes no milestone, and closes no phase.
- It authorizes no Milestone 2, Autonomy Substrate, Office View, or persistence.

### Ratified constraints as applied

A1–A8 are ratified as written in §4, with the Product Owner's applications:

- **A1** — the capability lives outside Studio; a dedicated toolchain/package
  boundary is preferred over inverse transformation inside the compiler. **The
  RFC determines exact package/API ownership**; the ratification deliberately
  pre-decides neither the final package name nor the API shape. Compiler stays
  *source → meaning*; semantic authoring is *intent → source*; the two are not
  blurred.
- **A2** — no parallel validator. After producing a candidate document, the
  accepted schema/compiler diagnostics determine validity; the operation fails
  before returning a successful mutation when the result violates accepted
  semantics. Cross-reference validation (e.g. workflow-owner resolution) is not
  duplicated.
- **A3** — source preservation and determinism evidence is pinned by the RFC.
  `yaml` v2 may serve as implementation evidence, but the RFC specifies required
  **observable behavior** rather than mandating a library.
- **A4** — Genome source remains canonical; no hidden structured state beside
  the source; Studio maintains no authoritative shadow organization model.
- **A5** — `add-agent` only. No edit/delete agent, add-workflow, add-policy,
  arbitrary patches, generic CRUD, schema-driven form generation, drag-and-drop
  editing, or bulk mutation.
- **A6** — a new RFC, its Board review, and Product Owner ratification all
  precede implementation intake.
- **A7** — Checkpoints 1–7 are preserved and integrated with, not redesigned.
- **A8** — the WCAG 2.2 AA Milestone-1 acceptance floor applies to the
  authoring interaction.

### Canonical product scenario (ratified)

```
Organization → Engineering → Add agent → provide required agent information
  → canonical Genome source changes → source becomes edited/stale
  → compile → Organization Graph and tree reflect the new agent
```

The user must be able to complete this **without knowing where an agent belongs
in Genome YAML**. The resulting Genome source remains visible, editable and
canonical.

### Next governance action

**Draft the commissioned RFC** (`RFC/0010-semantic-authoring-operations.md`),
then **Architecture Board review**, then **Product Owner ratification**, and
only then implementation intake. No implementation is authorized before that
lifecycle completes.
