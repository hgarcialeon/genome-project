# Self-Hosting Evidence — Architecture Board Review

## Status

**Ratified — Option A, Product Owner, 2026-07-14.** The classification
table below is the recorded disposition of the self-hosting evidence,
adopted exactly as recorded. The ratification classifies the observed
gaps only: it does not commission implementation, does not authorize
new RFC work, and does not reprioritize the roadmap. The sequencing of
any future RFC (including for Gap 1) remains a Product Owner decision.
The review below is preserved as written at review time.

## Decision Under Review

- **Decision:** disposition of the self-hosting investigation's evidence
  (`docs/proposals/self-hosting.md`, delivered 2026-07-14) — specifically,
  classification of each of the five discovered language gaps into
  exactly one of the four categories directed by the Product Owner:
  **RFC candidate**, **deferred**, **rejected**, or **requires
  additional consumer evidence**.
- **Explicitly not under review:** the proposal's Level 1 / 2 / 3
  adoption recommendations. Those dispositions are severable and remain
  with the Product Owner; nothing below decides them. No solution is
  designed here; no language, schema, compiler, runtime, or CLI change
  is proposed or made.
- **Inputs read in full:** the proposal (including its appendix sketch);
  `SPEC/language.md`; `SPEC/schema/genome.schema.json`;
  `docs/CONSTITUTION.md`; `docs/GOVERNANCE.md`; `docs/ARCHITECT.md`;
  ADR-0004/0005/0006/0008; the runtime and compiler sources and suites
  at the lines cited below.
- **HEAD under review:** `7d978d1`, clean working tree, branch
  `claude/bootstrap-genome-report-9p956r`.
- **Process:** `docs/GOVERNANCE.md` — Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer). Per house discipline, every evidence
  claim was re-executed against the repository rather than trusted from
  the proposal's word.

## Classification Vocabulary

The four categories, pinned before use so the classifications are
mechanical to read back:

- **RFC candidate** — the evidence at hand already justifies language
  evolution; an RFC may be commissioned on this evidence alone.
  *A classification, not a commissioning:* sequencing stays with the
  Product Owner.
- **Deferred** — the gap is accepted as real on the evidence at hand,
  and its first consumer is already identifiable on the roadmap or in a
  pending decision; the gap waits on that named gate, not on more
  evidence.
- **Rejected** — the evidence at hand does not demonstrate a deficiency;
  no language evolution is justified by it. Rejection binds *this
  evidence*, not the future: a future consumer presenting new evidence
  may resubmit.
- **Requires additional consumer evidence** — the gap may be real, but a
  single self-hosting observation is insufficient to accept it; at least
  one further independent consumer must present concrete need before
  classification can advance.

## Verified Evidence

All commands re-run at HEAD `7d978d1` during this review, invoked
directly (true exit codes captured). The proposal's appendix sketch was
reconstructed in a scratchpad; the Gap 1 claim was re-verified by
rebuilding the *original mis-modeled* variant, since the proposal's
appendix preserves only the corrected form.

| Claim | Re-execution | Result |
|---|---|---|
| Self-description validates and compiles | `genome validate` / `genome graph` on the appendix sketch | ✅ both exit 0 |
| Gap 1: agent-scoped policy + `supervised` owner does **not** gate an operator-initiated run | Sketch variant with `queue-discipline.appliesTo: [engineering.engineering-agent]`; `genome run … --workflow implement-queue-item`, no grant | ✅ **exit 0, run completed, zero approval events** — reproduced exactly |
| Gap 1 workaround: workflow-scoped policy gates deny-safe | Corrected sketch, same ungated invocation | ✅ exit 3, `approval.requested`, pending `human:product-owner`, zero steps |
| Ratification path produces an attributed record | `… --workflow rfc-lifecycle --grant human:product-owner --clock 2026-07-14T00:00:00Z` | ✅ exit 0, `approval.granted` with `human:product-owner` as source and payload, 14 events, completed |
| Gap 1 semantics are specified, not accidental | `packages/genome-runtime/src/runtime/index.ts:140-159` (initiator resolution; agent gates apply to agent-initiated runs); `SPEC/language.md` ("initiation *by* that agent") | ✅ behavior matches spec text |
| Gap 2 workaround basis: `manual` agents refuse initiation | Runtime suite: `refuses initiation by a manual agent (default autonomy)` (`runtime.test.ts:166`) | ✅ covered, passing |
| Gap 5 basis: approvals are conjunctive (all principals must drain) | `runtime/index.ts:156` (flatMap over all governing policies), `:219` (`pendingApprovals.length > 1` stays pending) | ✅ confirmed at source |
| Repository health | `pnpm check-state`; `pnpm test -- --force` | ✅ exit 0; ✅ 93/93, 0 cached (7/4/36/17/29) |

No evidence claim in the proposal failed re-execution.

## Gap-by-Gap Review

### Gap 1 — Initiator-scoped vs. executor-scoped gating

**Evidence.** The strongest in the set, on three axes. *Executable:* the
mis-modeled document runs ungated to completion — reproduced by this
review from the variant, not taken from the proposal. *Silent:* the
failure mode emits no diagnostic anywhere — the document validates
cleanly, compiles cleanly, and the run log shows a completed workflow;
nothing tells the author their declared gate never bound. *Author-blind:*
the mis-modeling was committed by the same session that had just read
the spec, the runtime source, and every governance document — the
best-informed author this language will ever have.

**Chief Architect position — RFC candidate.** The severity axis is
constitutional, not expressive. Principle 9 makes human governance
first-class, and the entire v0.1 posture is deny-safe: absence of
declaration never grants autonomy. This gap is the one place the posture
inverts — a *present* declaration ("approvals apply to this agent")
silently fails to bind the runs a reasonable author intends it to cover.
The document *reads* as governed and is not. A language whose central
promise is "describe your organization's governance and it will hold" 
cannot leave its flagship gate semantics in a state where the intended
reading and the specified reading diverge without any diagnostic. That
is why consumer-counting does not control here: the harm is not "a
feature someone might want is missing" but "a declaration someone can
already write does less than it appears to" — a specification-integrity
defect class, evidenced today, not gated on adoption. Classification on
the evidence: **RFC candidate**.

**Lead Engineer position — RFC candidate.** Empirically: the workaround
(restating the policy per workflow) works and is verified deny-safe, but
it is a *maintenance invariant enforced by nobody* — every future
workflow owned by a governed agent silently ships ungated unless a human
remembers a cross-reference no tool checks. That is precisely the shape
of defect this project eliminates everywhere else with mechanical checks.
Two boundary notes for the record: (a) this is not an implementation
defect — behavior matches `SPEC/language.md` exactly, and no test
changes; the evolution target is the language's declared semantics
and/or its diagnostic surface, which is RFC territory by Governance
Rule 2; (b) RFC candidate must not be read as commissioned — sequencing
against the Phase 4 opening RFC belongs to the Product Owner.
Classification: **RFC candidate**.

**Joint classification: RFC candidate.**

### Gap 2 — Humans are principals, not declarable members

**Evidence.** Real but soft: the workaround (roles as `autonomy: manual`
agents) validated, compiled, and executed correctly; the runtime's
`manual-agent` refusal even gives it defensible semantics. The proposal
itself rated the fidelity "workable." Nothing in the self-hosting
exercise *failed* because humans are principals only — the discomfort is
representational, not operational.

**Chief Architect position — deferred.** The gap is real — an
organization chart in which the highest authority cannot be declared is
structurally incomplete, and the product's stated audience is hybrid
human/AI organizations. But its first *operational* consumer is already
on the roadmap: the moment a view renders the organization (Phase 4
Studio's organization tree, Phase 5 Office View's sprites), the
manual-agent workaround stops being cosmetic and becomes a
misrepresentation a paying user can see. That is a named, scheduled
gate; the gap should wait at it, not spawn work now.

**Lead Engineer position — deferred, same gate.** The empirical record
shows zero executable failures from the workaround; on evidence alone
this would be "requires additional consumer evidence." What moves it to
deferred is that the additional consumer is not hypothetical — view
phases exist on the roadmap with this need structurally implied. Naming
the gate now is cheaper than rediscovering the gap inside a view RFC.

**Joint classification: deferred** — gated on the first consumer that
renders or externally exposes principals: the Phase 4 Studio RFC, the
Phase 5 Office View RFC, or the first external hybrid-organization
document, whichever arrives first. The RFC that hits the gate must
address or explicitly re-defer this gap.

### Gap 3 — No artifact primitive

**Evidence.** Sound but anticipatory: workflow steps are opaque strings,
`memory.stores` is labels, and the project's own work products
(RFCs, ADRs, packets, exported logs) are invisible to its
self-description. No execution failed; the limit is descriptive reach.

**Chief Architect position — deferred.** The first consumer is already
*reserved in an ADR*: the Phase 6 proposal payload
(`genome.proposal.created`, payload explicitly reserved by
RFC-0005/ADR-0006) is an artifact flowing through a workflow — it cannot
be specified without deciding what a produced artifact is. A second
pending consumer exists if the Product Owner adopts the proposal's
Level 2 (committed evidence logs as decision records). Designing an
artifact primitive now, ahead of both, would be exactly the
feature-bundle speculation Principle 8 prohibits.

**Lead Engineer position — deferred, same gates.** Nothing executable is
blocked today; every current workflow completes with string steps. The
gap surfaces only when something must *consume* a step's output — which
is verbatim the Phase 6 observe/propose loop. Agreed on both gates.

**Joint classification: deferred** — gated on the Phase 6
proposal-payload RFC (primary), or the Level 2 evidentiary disposition
if the Product Owner advances it (secondary, whichever first).

### Gap 4 — Workflows are straight lines

**Evidence.** One observed instance: the Board's Request-Changes →
revise → re-review loop cannot be expressed, so the self-description
names the happy path only. The self-hosting run still completed; nothing
operational failed.

**Chief Architect position — requires additional consumer evidence.**
Control flow is the largest language-surface decision on this list —
it touches the compiler, the runtime execution contract (ADR-0005's
sequential semantics), replay, and the diff target simultaneously. The
project's own precedent for exactly this class is explicit: trigger
grammars were deferred until the phase that consumes them, and exit 3
was denied generalization "until the second command that needs it."
Moreover, the single observed instance is suspect as a consumer: the
Board loop is a *human deliberation process*, and it is genuinely open
whether it should ever be runtime-executed rather than merely described
— an open question is not a consumer. One ambiguous instance cannot
carry the largest change on the table.

**Lead Engineer position — requires additional consumer evidence.**
Concurring on the empirical bar: the evidence threshold should be at
least two independent *executable* workflow shapes from real documents
whose owners need the runtime to drive the loop or branch — not merely
to document it. Self-hosting provides at most half of one.

**Joint classification: requires additional consumer evidence** — the
bar: two or more independent consumers with executable (not
documentary) need.

### Gap 5 — Approvals are conjunctive only

**Evidence.** The proposal's own finding is adequacy: present governance
is expressible conjunctively ("list all three principals"), and the
review confirmed at source that multi-principal draining works as
specified (`runtime/index.ts:156,219`). Quorums, role-differentiated
review content, and approval ordering were noted as out of reach — and
no observed need for any of them exists.

**Chief Architect position — rejected.** The submitted evidence
demonstrates sufficiency, not deficiency; classifying a
sufficiency-demonstration as grounds for evolution would invert the
evidence standard. The unreachable features are speculative until an
organization document needs them. Rejection binds this evidence only —
the category definition already provides the resubmission path.

**Lead Engineer position — rejected.** Same reading, one sharpening: the
"role-differentiated review" half of the gap is not even an approval
semantics question — the *content* of a review is the judgment half of
governance, which this project has already ruled cannot be automated
away (`docs/GOVERNANCE.md`, phase transition review). What remains
(quorum, ordering) has zero observed instances.

**Joint classification: rejected** (on the evidence at hand; resubmission
open to any future consumer with concrete quorum/ordering need).

## Classification Table

| Gap | Classification | Gate / bar (where applicable) |
|---|---|---|
| 1 — Initiator- vs. executor-scoped gating | **RFC candidate** | Commissioning and sequencing remain with the Product Owner |
| 2 — Humans are principals, not members | **Deferred** | First view-phase RFC rendering principals (Phase 4 Studio / Phase 5 Office View) or first external hybrid-org document |
| 3 — No artifact primitive | **Deferred** | Phase 6 proposal-payload RFC; or the Level 2 disposition if advanced first |
| 4 — No branching/iteration in workflows | **Requires additional consumer evidence** | ≥ 2 independent consumers with executable (not documentary) need |
| 5 — Conjunctive-only approvals | **Rejected** | Binds this evidence only; resubmission open with new consumer evidence |

## Agreements Between Reviewers

1. All five evidence claims reproduced exactly at HEAD; the proposal's
   empirical record is accurate, including the one claim (Gap 1) that
   required reconstructing a variant the proposal no longer ships.
2. Gap 1 is categorically different from the other four: it is the only
   gap where a *written* declaration under-binds silently, rather than a
   wish that cannot be written. That asymmetry, not consumer count,
   drives its classification.
3. Gaps 2 and 3 differ from Gap 4 in exactly one respect: their next
   consumers are named and already scheduled or reserved; Gap 4's is
   neither, and its single observed instance is ambiguous.
4. Classification decides *whether evidence justifies evolution*, never
   *what the evolution is* — no solution shape discussed in this review
   (diagnostics, selectors, member declarations, control flow, quorums)
   is proposed, endorsed, or excluded by it.
5. Nothing here alters the standing scope exclusions in
   `PROJECT_STATE.md`, opens Phase 4, or disposes of the proposal's
   Levels 1–3.

## Disagreements Between Reviewers

None on classifications. One emphasis difference on Gap 1: the Chief
Architect grounds RFC-candidacy in specification integrity (a document
that reads as governed and is not), the Lead Engineer in the unenforced
maintenance invariant the workaround creates. Both bases are recorded
because a future RFC's acceptance criteria will need to answer both.
One recorded reservation on Gap 2: the Lead Engineer notes that on pure
evidence it would sit one category lower, and joins "deferred" only
because the gate is already on the roadmap — if the view phases were
ever de-scoped, Gap 2 should be re-classified rather than inherited.

## Decision Options

### Option A — Ratify the classification table as recorded

- **Consequences:** the table becomes the recorded disposition of the
  self-hosting evidence. Gap 1 becomes commissionable at the Product
  Owner's discretion; Gaps 2–3 wait at named gates that their gating
  RFCs must address or explicitly re-defer; Gap 4 waits on the two-
  consumer bar; Gap 5 is closed on this evidence.
- **Authorizes:** the classification record only. **Prohibits:** any
  language/SPEC/implementation change; any RFC drafting absent separate
  Product Owner commissioning.
- **Board assessment: recommended.**

### Option B — Ratify with Gap 1 reduced to "requires additional consumer evidence"

- **Consequences:** as A, except no language evolution is
  commissionable until a second consumer (the first external document
  author hitting the same mis-modeling) presents evidence.
- **Risks:** the second consumer's evidence, by the nature of this gap,
  is a silently ungated production organization discovered after the
  fact. The Board notes this is the only gap where waiting for more
  evidence means waiting for harm, and does not recommend it.
- **Board assessment: acceptable but not recommended.**

### Option C — Return for re-review

- For the case where the Product Owner disputes the vocabulary
  definitions or a classification's basis. No state changes.

## Joint Board Recommendation

**Option A.** The classifications discriminate on the evidence: one gap
is justified today by a demonstrated silent-failure class (1); two wait
at consumers the project has already named (2, 3); one awaits evidence
only real usage can supply (4); one presented evidence of sufficiency,
not need (5).

## Exact Ratification Statements

For **Option A** (recommended):

> As Product Owner, I ratify the self-hosting evidence disposition under
> Option A: the classification table in
> `docs/reviews/self-hosting-evidence-board-review.md` is the recorded
> disposition of the five gaps in `docs/proposals/self-hosting.md`.
> Gap 1 is an RFC candidate; its commissioning and sequencing remain
> with me. Gaps 2 and 3 are deferred at their named gates. Gap 4
> requires additional consumer evidence. Gap 5 is rejected on the
> evidence at hand. No solution design, language change, or
> implementation is authorized by this ratification.

For **Option B**:

> As Product Owner, I ratify the self-hosting evidence disposition under
> Option B: as Option A, except Gap 1 is classified as requiring
> additional consumer evidence; no gap is an RFC candidate.

For **Option C**:

> As Product Owner, I return the self-hosting evidence review for
> re-review with the following direction: (state direction). No
> classification is recorded.
