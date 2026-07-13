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
| Medium | Runtime model target in `genome-compiler` | Phase 3 RFC (`RuntimeModel` shape) | Engineering | Blocked |
| Medium | `packages/genome-runtime` core | Phase 3 RFC | Engineering | Blocked |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

`packages/genome-compiler` implements RFC-0002 Stages 1–5 (2026-07-13): it
reuses `@genome/schema` for Stages 1–2, enforces the full v0.1 semantic set,
and exposes the `inspect`/`graph`/`docs` targets as plain functions. The CLI
`inspect` and `graph` commands consume those targets (2026-07-13) — no
interpretation of raw Genome YAML happens outside the compiler boundary.

RFC-0003 — Runtime Boundary was accepted 2026-07-13 (`docs/adr/0004-runtime-boundary.md`).
It queues two **compiler preconditions** with concrete acceptance criteria:

1. **Policy `appliesTo`** — semantically validate that entries resolve to
   existing workflows or agents (reference grammar in `SPEC/language.md`),
   emit an *unbound policy* warning when absent, and compile entries to
   `requires` edges (governed workflow/agent `requires` policy).
2. **Objective/metric ownership** — the compiler already validates
   `objective.owner`/`metric.owner` (semantic rule 5) but drops them;
   `buildGraph` must emit `owns` edges so the graph carries what the
   compiler verified.

Runtime work (`genome-runtime` core, the runtime-model target) is **blocked
on the Phase 3 implementation RFC**, which must pin the `RuntimeModel` shape,
trigger executability, scheduling/ordering semantics, and the operator
emergency-stop story. Runtime implementation remains out of scope for
Phase 0. No interpretation of raw Genome YAML happens outside the compiler
boundary.
