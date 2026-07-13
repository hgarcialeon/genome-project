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
| High | Genome revision derivation + runtime-model target in `genome-compiler` | RFC-0004 / ADR-0005 | Engineering | Approved |
| High | `packages/genome-runtime` core | RFC-0004 / ADR-0005 | Engineering | Approved |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

`packages/genome-compiler` implements RFC-0002 Stages 1–5 (2026-07-13): it
reuses `@genome/schema` for Stages 1–2, enforces the full v0.1 semantic set,
and exposes the `inspect`/`graph`/`docs` targets as plain functions. The CLI
`inspect` and `graph` commands consume those targets (2026-07-13) — no
interpretation of raw Genome YAML happens outside the compiler boundary.

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
