/**
 * Layout is presentation, and presentation may not lose meaning.
 *
 * These tests hold the layout to the one rule that matters: whatever
 * `graphTarget` emitted comes out the other side, unchanged and complete.
 */

import { describe, expect, it } from "vitest";

import { CANONICAL_DOCUMENT } from "../canonical.js";
import { compileDocument } from "../genome/compilation.js";
import { layoutGraph } from "./layout.js";

const compiled = compileDocument(CANONICAL_DOCUMENT);
if (!compiled.ok) throw new Error("the canonical document must compile");
const graph = compiled.graphProjection;

const nodeKey = (node: { id: string; type: string }) => `${node.type}:${node.id}`;
const edgeKey = (edge: { from: string; to: string; type: string }) => `${edge.from}-[${edge.type}]->${edge.to}`;

describe("graph layout", () => {
  it("places every node the compiler emitted, and no others", () => {
    const layout = layoutGraph(graph);

    expect(layout.nodes.map((placed) => nodeKey(placed.node)).sort()).toEqual(graph.nodes.map(nodeKey).sort());
    expect(layout.nodes.length).toBe(graph.nodes.length);
  });

  it("carries every edge the compiler emitted, in the compiler's order", () => {
    const layout = layoutGraph(graph);

    expect(layout.edges.map((placed) => edgeKey(placed.edge))).toEqual(graph.edges.map(edgeKey));
  });

  it("changes no node identity, type, or label", () => {
    const layout = layoutGraph(graph);

    for (const placed of layout.nodes) {
      const original = graph.nodes.find((node) => node.id === placed.node.id);
      expect(placed.node).toBe(original);
    }
  });

  it("is a pure function of the compiler's output", () => {
    expect(JSON.stringify(layoutGraph(graph))).toBe(JSON.stringify(layoutGraph(graph)));
  });

  it("gives every node a position inside the canvas", () => {
    const layout = layoutGraph(graph);

    for (const placed of layout.nodes) {
      expect(placed.x).toBeGreaterThanOrEqual(0);
      expect(placed.y).toBeGreaterThanOrEqual(0);
      expect(placed.x + placed.width).toBeLessThanOrEqual(layout.width);
      expect(placed.y + placed.height).toBeLessThanOrEqual(layout.height);
    }
  });

  it("groups by node type without merging distinct nodes", () => {
    const layout = layoutGraph(graph);

    for (const column of layout.columns) {
      for (const placed of column.nodes) {
        expect(placed.node.type).toBe(column.type);
      }
    }
    const placedIds = layout.nodes.map((placed) => placed.node.id);
    expect(new Set(placedIds).size).toBe(placedIds.length);
  });

  it("keeps an edge whose endpoint has no node rather than dropping it", () => {
    const withDanglingEdge = {
      nodes: graph.nodes,
      edges: [...graph.edges, { from: graph.nodes[0].id, to: "agent:does-not-exist", type: "owns" as const }],
    };

    const layout = layoutGraph(withDanglingEdge);

    expect(layout.edges.length).toBe(withDanglingEdge.edges.length);
    expect(layout.edges.at(-1)?.from).toBeUndefined();
    expect(layout.edges.at(-1)?.edge.to).toBe("agent:does-not-exist");
  });
});
