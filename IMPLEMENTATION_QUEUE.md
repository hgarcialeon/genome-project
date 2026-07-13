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
| High | Genome Compiler package design | RFC-0002 | Architecture | Approved |
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
| High | Phase 0–3 transition reviews (incl. schema-codegen de-scope ratification) | Governance: Phase Transition Review | Architecture Board | Not Started |
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
`PROJECT_STATE.md`). The open Board item is the Phase 0–3 transition
reviews, including ratification of the Phase 2 schema-codegen de-scoping
recorded in `ROADMAP.md`.
