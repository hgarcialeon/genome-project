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
| High | Genome Compiler package design | RFC-0002 | Architecture | Ready for Review |
| High | Organization Graph model | RFC-0002 | Architecture | Blocked |
| Medium | CLI inspect command | Compiler AST | Engineering | Blocked |
| Medium | CLI graph command | Organization Graph | Engineering | Blocked |
| Low | Office View prototype | Organization Graph | Office Team | Not Started |

## Current Engineering Rule

Do not implement `packages/genome-compiler` until RFC-0002 is approved.
