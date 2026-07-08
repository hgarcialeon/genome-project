# Genome

**The declarative language for autonomous organizations.**

Genome is an open specification and reference implementation for describing, executing, visualizing, and continuously improving autonomous organizations.

> Git describes code. Kubernetes describes infrastructure. Terraform describes resources. Genome describes companies.

## Why Genome?

Modern companies are becoming increasingly automated, agentic, and software-defined.

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

- AI workforce
- workflows
- runtime execution
- office visualization
- memory graph
- policies
- integrations
- observability

## First Milestone

```bash
genome validate SPEC/examples/company.yaml
```

The first goal is to validate a Genome document against the v0.1 schema.

## Repository Structure

```text
genome/
├── README.md
├── ROADMAP.md
├── RFC/
│   ├── 0000-genome.md
│   └── 0001-language.md
├── SPEC/
│   ├── language.md
│   ├── schema.md
│   ├── schema/
│   │   └── genome.schema.json
│   └── examples/
│       └── company.yaml
├── packages/
│   ├── genome-schema
│   └── genome-cli
├── apps/
│   └── studio
└── docs/
    └── adr
```

## Product Layers

- **Genome Specification**: the standard
- **Genome Runtime**: executes organizations
- **Genome Studio**: edits and visualizes companies
- **Genome Office View**: isometric living office
- **Genome SDK**: tools for extensions and integrations
- **Genome Marketplace**: reusable agents, departments, workflows, and templates

## Guiding Principles

1. Everything is declarative.
2. Every organization is compilable.
3. Every change is versioned.
4. Every action is observable.
5. Execution is reproducible.
6. Human approval remains first-class.
7. The specification is the product.
