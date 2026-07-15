# Implementation Queue

Work enters this queue only after:

- RFC approved
- ADR recorded if required
- Specification updated if required
- Acceptance criteria defined

Claude Code or any engineering agent should consume this queue instead of acting from chat history.

| Priority | Item | Depends On | Owner | Status |
|----------|------|------------|-------|--------|
| High | Complete Genome CLI validation | Genome Schema v0.1 | Engineering | Done |
| High | Genome Compiler package design | RFC-0002 | Architecture | Done |
| High | Compiler Stages 1–4 (parse/schema reuse, AST, semantic) | RFC-0002 | Engineering | Done |
| High | Organization Graph model | RFC-0002 | Architecture | Done |
| Medium | CLI inspect command | Compiler AST | Engineering | Done |
| Medium | CLI graph command | Organization Graph | Engineering | Done |
| High | RFC-0003 Runtime Boundary review | RFC-0003 draft | Architecture Board | Done |
| High | Policy `appliesTo`: semantic validation + `requires` edges | RFC-0003 / ADR-0004 | Engineering | Done |
| Medium | `owns` edges for objective/metric owners | RFC-0003 / ADR-0004 | Engineering | Done |
| High | RFC-0004 Runtime Implementation review | RFC-0004 draft | Architecture Board | Done |
| High | Genome revision derivation + runtime-model target in `genome-compiler` | RFC-0004 / ADR-0005 | Engineering | Done |
| High | `packages/genome-runtime` core | RFC-0004 / ADR-0005 | Engineering | Done |
| High | RFC-0005 Genome Diff review | RFC-0005 draft | Architecture Board | Done |
| Medium | `diff` target in `genome-compiler` + CLI `genome diff` | RFC-0005 / ADR-0006 | Engineering | Done |
| High | CLI-boundary test suite (exit codes, JSON contracts) | 2026-07-13 audit | Engineering | Done |
| High | `check-state` consistency script + CI step | 2026-07-13 audit | Engineering | Done |
| High | Governance/state reconciliation (phase reviews, single source of truth) | 2026-07-13 audit | Engineering | Done |
| High | Phase 0–3 transition reviews (incl. schema-codegen de-scope ratification) | Governance: Phase Transition Review | Architecture Board | Done |
| High | RFC-0006 — Reference Adapter & `genome run`: draft and Board review | Phase 0–3 review (`docs/reviews/phase-0-3-board-review.md`) | Architecture Board | Done |
| High | RFC-0006 implementation: `@genome/adapter-reference` package + CLI `genome run` + eight CLI-boundary tests | RFC-0006 / ADR-0008 | Engineering | Done |
| High | Phase 3 close review (erratum disposition + phase closure) | RFC-0006 evidence | Architecture Board | Done |
| High | Self-hosting evidence classification (Board review + ratification) | `docs/proposals/self-hosting.md` | Architecture Board | Done |
| High | RFC-0007 implementation: participation-binding derivation in `genome-compiler` + inert-policy diagnostic + `SPEC/language.md` Policy Scope wording + the nine amended evidence cases | RFC-0007 / ADR-0009 | Engineering | Done |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

`packages/genome-compiler` implements RFC-0002 Stages 1–5 (2026-07-13): it
reuses `@genome/schema` for Stages 1–2, enforces the full v0.1 semantic set,
and exposes the `inspect`/`graph`/`docs`/`runtime-model` targets as plain
functions, deriving the Genome revision at Stage 5. The CLI `inspect` and
`graph` commands consume those targets (2026-07-13).
`packages/genome-runtime` (2026-07-13) consumes only the runtime-model
target and produces only the append-only event log; its observed state is
`replay(log)` by construction, and nothing above the adapter seam names a
provider. No interpretation of raw Genome YAML happens outside the compiler
boundary.

RFC-0004 — Runtime Implementation was accepted 2026-07-13
(`docs/adr/0005-runtime-execution-contract.md`), resolving everything the
Phase 3 gate required: the `RuntimeModel` shape, revision derivation,
trigger executability (explicit initiation only in v0.1), ordering and
execution semantics, approval-gate mechanics (deny-safe, `runId`-matched,
`human:*` intrinsic floor), the emergency stop as attributable control
events, and the structural replay contract. It authorizes two items with
concrete acceptance criteria:

1. **Compiler** — derive the Genome revision (SHA-256 of canonical JSON of
   the schema-valid document) at Stage 5, carry it as `genomeRevision` on
   the Organization Graph, and add `runtimeModelTarget` producing the
   normative `RuntimeModel` (resolved deny-safe `autonomy`/`trigger`
   defaults, `governedBy` from `requires` edges, principals and provider
   identifiers as declared data).
2. **Runtime core** — `packages/genome-runtime`: dependency-free `events/`
   module (RFC-0003 envelope + taxonomy, plus `runtime.halted`/`runtime.resumed`
   with `runId: null`), append-only `EventLog` with sequential ids and a
   subscribe hook, normative forward-tolerant `replay`, and the core
   (explicit initiation with autonomy/policy gates, approvals matched by
   `runId`, sequential task lifecycle through the provider-adapter seam,
   halt/resume, drain adoption, structured refusals). `state()` must equal
   `replay(log)` by construction; no provider code above the seam.

Provider adapters, trigger auto-initiation, retries, and event persistence
remain out of scope (RFC-0004 non-goals). No interpretation of raw Genome
YAML happens outside the compiler boundary.

RFC-0005 — Genome Diff was accepted 2026-07-13
(`docs/adr/0006-genome-diff-contract.md`) and its item landed the same day,
completing the Phase 2 roadmap's CLI command set: the `diff` compilation
target in `packages/genome-compiler` (graph-level comparison, node identity
by id, one shared canonicalization, `identical` = revision equality,
deterministic ordering) and the CLI `genome diff <before> <after> [--json]`
with `diff(1)` exit codes (0 identical / 1 different / 2 trouble). Rename
detection, patch application, merge, and the Phase 6 proposal payload
remain out of scope (RFC-0005 non-goals).

The 2026-07-13 governance audit added three drained items: CLI-boundary
tests in `packages/genome-cli` (exit-code and JSON contracts, previously
asserted without executable evidence), the `scripts/check-state.mjs`
consistency check wired into CI, and the reconciliation of
`PROJECT_STATE.md`, `ROADMAP.md`, `CLAUDE_CODE_PROMPT.md`, `README.md`, and
`docs/GOVERNANCE.md` (phase transition reviews; current state lives only in
`PROJECT_STATE.md`). The Phase 0–3 transition reviews were held 2026-07-13
(`docs/reviews/phase-0-3-board-review.md`, ratified by the Product Owner):
Phases 0–2 closed — with the note "Phases 0–2 closed; Phase 3 held open by
decision" — the schema-codegen de-scoping ratified as worded in
`ROADMAP.md`, and Phase 3 held active with the reference provider adapter
and `genome run` scoped in via RFC-0006 (boundary constraints pinned in
the review's Condition 4; the governance process itself is recorded as
`docs/adr/0007-phase-transition-governance.md`). Event persistence is
excluded from Phase 3, gated on its first consumer.

The self-hosting evidence classification was ratified 2026-07-14 under
Option A (`docs/reviews/self-hosting-evidence-board-review.md`): Gap 1
(initiator- vs executor-scoped gating) is an RFC candidate whose
commissioning and sequencing remain with the Product Owner; Gaps 2–3
(human members, artifact primitive) are deferred at named gates (first
view-phase RFC rendering principals; the Phase 6 proposal-payload RFC or
an adopted Level 2 disposition); Gap 4 (workflow control flow) requires
additional consumer evidence (two or more independent consumers with
executable need); Gap 5 (conjunctive-only approvals) is rejected on the
evidence at hand. **The classification adds no engineering item to this
queue**: no RFC is approved, so per this queue's entry rules nothing
enters it. A Gap 1 RFC, if and when the Product Owner commissions one,
follows the normal lifecycle (draft → Board review → ratification →
queue).

RFC-0006 — Reference Adapter and Genome Run was accepted 2026-07-13 under
Option B (`docs/reviews/rfc-0006-board-review.md`, ratified by the
Product Owner; `docs/adr/0008-reference-execution-contract.md`). It
authorizes one implementation item with the Lead Engineer's change
inventory as its scope: the `@genome/adapter-reference` package (dispatch
enqueues only; `settle()` returns on first refusal; qualified-over-bare
`failSteps`; unit-tested with a `test` script), the CLI `genome run`
command (explicit `--workflow`, deny-safe `--grant`, `--fail-step`,
`--json`, `--export-log` with pinned NDJSON framing, public `--clock`,
exit codes 0/1/2/3 with parser defaults overridden), and the eight
CLI-boundary test cases including the Condition 5 evidence
(`genome run SPEC/examples/company.yaml --workflow build-feature --grant
human:engineering-manager` → exit 0). Compiler and runtime public
contracts must not change (empty git diff required). Phase 3 closes only
through a follow-up transition review on that evidence.

The RFC-0006 item was drained 2026-07-13: `packages/genome-adapter-reference`
landed with the normative settle contract and its own unit suite, and the
CLI `genome run` landed with the pinned option set, output contracts, and
exit codes; all evidence cases pass uncached at the subprocess boundary
(`packages/genome-cli/src/cli.test.ts`), the replay-equality and
byte-determinism tests among them, with empty git diffs under
`packages/genome-compiler` and `packages/genome-runtime`. One RFC erratum
was found during implementation: the RFC's test case 4 named
`policy.enforced` attribution on the granted path, but the shipped runtime
emits `policy.enforced` only on the denial path (verified in its suite) —
since the RFC itself prohibits runtime changes, the granted-path evidence
is the attributed `approval.granted` event. The Phase 3 close review
(held 2026-07-13, Option B ratified —
`docs/reviews/phase-3-close-board-review.md`) approved that erratum as a
normative correction with zero behavioral change, applied it to the RFC,
and closed Phase 3 on the re-verified evidence.

RFC-0007 — Executor-Scoped Policies was accepted 2026-07-14 under
Option A with five amendments
(`docs/reviews/rfc-0007-board-review.md`, Product Owner ratification
recorded there; `docs/adr/0009-participation-scoped-policies.md`). It
authorizes one implementation item with the amended RFC's Definition of
Done as its scope: the participation-binding derivation in
`packages/genome-compiler` (agent-scoped `appliesTo` entries yield
workflow→policy `requires` edges for every workflow owned by the named
agent, in a deterministic pinned order; the existing agent→policy edge
is retained), the extended unbound-policy diagnostic (warning severity,
pinned forever), the `SPEC/language.md` Policy Scope wording from the
RFC's §3 (including the normative autonomy/policy boundary sentence),
and the nine amended evidence cases — including the reconstructed Gap 1
fixture now parking at exit 3, the Condition 5 regression case, and the
additive runtime-suite case covering the previously untested
initiating-agent binding path. Protected boundaries: no schema change
(`SPEC/schema/genome.schema.json` diff empty), no runtime production
source change (`git diff` under `packages/genome-runtime` empty except
additive cases in `runtime.test.ts`; the existing 17 tests
byte-unchanged), no CLI surface change (commands, options, exit codes,
output contracts), no new event types. A discovered need for a runtime
source change stops work and returns to the Board. Evidence must be
uncached (`pnpm test -- --force`).

The RFC-0007 item was drained 2026-07-15. The participation binding
landed entirely at the compiler boundary: `packages/genome-compiler`
graph construction now derives, for each agent-scoped `appliesTo` entry,
one workflow→policy `requires` edge per workflow owned by that agent —
in document (pinned) order, deduplicated by id — alongside the retained
agent→policy edge; the unbound-policy diagnostic was extended to the
inert manual, workflow-less shape (warning); and `SPEC/language.md`
Policy Scope carries the accepted §3 wording with the normative
autonomy/policy boundary sentence. The nine amended evidence cases pass
uncached: cases 1–2, 4–6, 8–9 at the CLI subprocess boundary
(`packages/genome-cli/src/cli.test.ts`), case 3 as the additive
runtime-suite case closing the previously untested initiating-agent half
of the policy union (`packages/genome-runtime/src/runtime.test.ts`), and
case 7 as the compiler diagnostic
(`packages/genome-compiler/src/compiler.test.ts`). The protected
boundaries held with empty diffs: `SPEC/schema/genome.schema.json`,
`packages/genome-runtime` production source (`runtime.test.ts` gained the
one additive case; the existing 17 tests are byte-unchanged), and the
CLI surface (`packages/genome-cli/src/index.ts`) all unchanged; no new
event types. Autonomy semantics were not widened and "executor" was not
generalized beyond workflow ownership. The Board's implementation closure
review (`docs/reviews/rfc-0007-implementation-close-review.md`) ratified
Option A on 2026-07-15, closing RFC-0007 complete on this evidence.

The 2026-07-15 Product Owner dispositions
(`docs/reviews/maintenance-self-hosting-disposition-packet.md`) **add no
engineering item to this queue**. The specification-maintenance (erratum)
mechanism was adopted as a governance-process decision
(`docs/adr/0010-erratum-mechanism.md`, `docs/ERRATA.md`) — a
documentation/process change, not queued work. The Level 1 self-hosting RFC
was commissioned but not approved; per this queue's entry rules nothing
enters until it is ratified. Level 2 (durable exported-log records) is
deferred under the persistence gate, and Level 3 (operative governance) is
deferred to Phase 6 — neither is queued work. No production language,
compiler, runtime, schema, CLI, or test change accompanies these
dispositions; the RFC-0000/RFC-0001 status corrections were zero-behavioral-change
errata (`ERR-0001`, `ERR-0002`).
