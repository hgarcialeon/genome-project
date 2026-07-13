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
| High | RFC-0003 Runtime Boundary review | RFC-0003 draft | Architecture Board | In Review |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

`packages/genome-compiler` implements RFC-0002 Stages 1–5 (2026-07-13): it
reuses `@genome/schema` for Stages 1–2, enforces the full v0.1 semantic set,
and exposes the `inspect`/`graph`/`docs` targets as plain functions. The CLI
`inspect` and `graph` commands consume those targets (2026-07-13) — no
interpretation of raw Genome YAML happens outside the compiler boundary.

The engineering queue is drained except Office View, which stays out of
scope for Phase 0. RFC-0003 — Runtime Boundary was drafted 2026-07-13
(`RFC/0003-runtime.md`) and is awaiting Architecture Board review; it adds
no engineering work until accepted, at which point its items (runtime model
target, `packages/genome-runtime`) enter this queue with acceptance criteria.
