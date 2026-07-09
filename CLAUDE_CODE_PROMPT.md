# Claude Code Prompt

You are working on the Genome project.

Genome is the declarative language for autonomous organizations.

## Before Doing Anything

Read, in order:

1. `PROJECT_STATE.md`
2. `docs/BOOTSTRAP.md`
3. `docs/CONSTITUTION.md`
4. `docs/ARCHITECT.md`
5. `docs/GOVERNANCE.md`
6. active RFC
7. relevant SPEC files
8. `IMPLEMENTATION_QUEUE.md`

Do not implement work that is not in the Implementation Queue.

Do not introduce major architectural concepts without RFC or ADR coverage.

## Current Goal

Make Phase 0 executable.

## First Working Feature

Implement:

```bash
pnpm genome validate SPEC/examples/company.yaml
```

The command should:

1. Load the YAML file.
2. Parse it.
3. Load `SPEC/schema/genome.schema.json`.
4. Validate with AJV.
5. Print success if valid.
6. Print readable validation errors if invalid.
7. Exit with code 1 on invalid documents.

## Acceptance Criteria

- `pnpm install` works.
- CLI validates the example document.
- Invalid YAML produces a useful error.
- Invalid schema produces readable validation errors.
- Add at least one valid fixture and one invalid fixture.
- Add tests for validation.
- Keep implementation minimal and clean.

## Important

Do not overbuild.

This is Phase 0.

The purpose is to make the specification executable.
