# Genome

**The declarative language for autonomous organizations.**

Genome is an open specification and reference implementation for describing, compiling, executing, visualizing, and continuously improving autonomous organizations.

> Git describes code. Kubernetes describes infrastructure. Terraform describes resources. Genome describes companies.

## Why Genome?

Modern companies are becoming software-defined and increasingly autonomous.

But there is no standard way to describe how an autonomous organization is structured, how it operates, what agents it contains, what workflows it runs, what policies govern it, and how it learns.

Genome provides that missing layer.

## Core Idea

A company can be described declaratively:

```yaml
genomeVersion: 0.1

company:
  name: Acme
  mission: Build the world's best billing platform.

departments:
  engineering:
    teams:
      billing:
        agents:
          architect:
            role: Software Architect
          backend:
            role: Backend Engineer
          qa:
            role: Quality Engineer

workflows:
  invoice-generation:
    owner: engineering.billing.backend
    steps:
      - plan
      - implement
      - review
      - validate
      - release
```

Then Genome can compile that declaration into:

- organization graph
- AI workforce
- workflows
- runtime execution
- office visualization
- memory graph
- policies
- integrations
- observability

## The CLI

The reference implementation ships a CLI covering the full v0.1 command set:

```bash
genome validate SPEC/examples/company.yaml   # schema validation
genome inspect  SPEC/examples/company.yaml   # organization summary (--json)
genome graph    SPEC/examples/company.yaml   # Organization Graph as JSON
genome diff     before.yaml after.yaml       # structural diff, diff(1) exit codes
genome run      SPEC/examples/company.yaml --workflow build-feature \
                --grant human:engineering-manager   # execute one workflow (reference adapter)
```

Current phase, milestone, and objective live in `PROJECT_STATE.md`.

## Repository Structure

```text
genome-project/
├── README.md
├── ROADMAP.md
├── PROJECT_STATE.md
├── IMPLEMENTATION_QUEUE.md
├── RFC/
├── SPEC/
├── docs/
├── packages/
└── scripts/
```

## Product Layers

- **Genome Specification**: the standard
- **Genome Compiler**: transforms documents into internal graph models
- **Genome Runtime**: executes organizations
- **Genome Studio**: edits and visualizes companies
- **Genome Office View**: isometric living office
- **Genome SDK**: extensions and integrations
- **Genome Marketplace**: reusable agents, departments, workflows, and templates

## Guiding Principles

1. Everything is declarative.
2. Every organization is compilable.
3. Every change is versioned.
4. Every action is observable.
5. Execution is reproducible.
6. Human approval remains first-class.
7. The specification is the product.

## License

Licensed under the [Apache License 2.0](LICENSE).
