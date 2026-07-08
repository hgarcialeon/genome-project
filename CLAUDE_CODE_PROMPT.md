# Claude Code Prompt

You are implementing the first commit of the Genome project.

Genome is the declarative language for autonomous organizations.

## Goal

Create a working monorepo with:

- README
- ROADMAP
- RFC documents
- SPEC documents
- JSON schema
- example company.yaml
- schema package
- CLI package

## Tech Requirements

Use:

- TypeScript
- pnpm
- Turborepo
- Node.js 20+
- Vitest
- AJV
- yaml
- commander

## First Working Feature

Implement:

```bash
pnpm install
pnpm validate SPEC/examples/company.yaml
```

or:

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
