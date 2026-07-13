/**
 * Genome Runtime (RFC-0003 boundary, RFC-0004 implementation).
 *
 * Consumes compiled runtime models (`@genome/compiler`, runtimeModelTarget);
 * produces an append-only, attributable, replayable event log. Durable
 * organizational change never happens here — it flows through new Genome
 * revisions (Constitution Principle 6).
 */

export * from "./events/index.js";
export * from "./log/index.js";
export * from "./replay/index.js";
export * from "./runtime/index.js";
