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
| High | Compiler Stages 1–4 (parse/schema reuse, AST, semantic) | RFC-0002 | Engineering | Ready |
| High | Organization Graph model | RFC-0002 | Architecture | Ready |
| Medium | CLI inspect command | Compiler AST | Engineering | Blocked |
| Medium | CLI graph command | Organization Graph | Engineering | Blocked |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

RFC-0002 is approved (2026-07-09). `packages/genome-compiler` may be
implemented per RFC-0002. Reuse `@genome/schema` for Stages 1–2; do not
reimplement parse or schema validation. Implement the v0.1 semantic set first
(`autonomy` enum + duplicate detection), then reference/principal checks.
