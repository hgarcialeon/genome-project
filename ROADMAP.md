# Genome Roadmap

## Phase 0 — Foundation

Goal: establish the project as a specification-first platform.

Deliverables:

- Repository structure
- README
- RFC-0000
- RFC-0001
- Genome Language v0.1
- JSON Schema v0.1
- Example `company.yaml`
- CLI placeholder

Success criteria:

```bash
genome validate SPEC/examples/company.yaml
```

## Phase 1 — Genome Language

Goal: define the first usable version of the declarative language.

Deliverables:

- Company model
- Department model
- Team model
- Agent model
- Workflow model
- Policy model
- Integration model
- Memory model
- Validation rules

## Phase 2 — CLI & Schema

Goal: make the specification executable.

Deliverables:

- `genome validate`
- `genome inspect`
- `genome diff`
- `genome graph`
- TypeScript types generated from schema
- Test suite for valid and invalid examples

## Phase 3 — Runtime Prototype

Goal: execute a simple organization from a Genome file.

Deliverables:

- Runtime graph
- Agent lifecycle
- Event bus
- Workflow execution
- Human approval stub
- Activity log

## Phase 4 — Studio Prototype

Goal: create an Organization IDE.

Deliverables:

- Monaco editor for Genome YAML
- Schema validation
- Live preview
- Organization tree
- Runtime logs

## Phase 5 — Office View

Goal: render the company as a living isometric organization.

Deliverables:

- PixiJS renderer
- Office layout engine
- Agent sprites
- Agent states
- Event-driven animations

## Phase 6 — Self-Improvement Loop

Goal: allow Genome to improve Genome.

Deliverables:

- Observe
- Diagnose
- Propose
- Branch
- Validate
- Promote
- Update Genome
