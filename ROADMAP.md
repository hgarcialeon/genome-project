# Genome Roadmap

## Phase 0 — Foundation

Goal: establish Genome as a specification-first project.

Deliverables:

- Repository structure
- README
- VISION
- Constitution
- Architecture Charter
- Governance Model
- Bootstrap Protocol
- Project State
- Implementation Queue
- RFC-0000
- RFC-0001
- RFC-0002 draft
- Genome Language v0.1
- JSON Schema v0.1
- Example `company.yaml`
- CLI placeholder

Success criteria:

```bash
genome validate SPEC/examples/company.yaml
```

## Phase 1 — Genome Compiler

Goal: make the Genome specification executable through a compiler boundary.

Deliverables:

- compiler pipeline
- AST model
- semantic validation
- Organization Graph
- compilation targets
- compiler tests

## Phase 2 — CLI & Schema

Goal: make the specification usable from local development.

Deliverables:

- `genome validate`
- `genome inspect`
- `genome diff`
- `genome graph`
- TypeScript types generated from schema
- valid and invalid fixtures

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
