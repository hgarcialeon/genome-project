/**
 * Where the Organization Graph's nodes sit on screen.
 *
 * Layout is presentation, not a Genome contract (RFC-0009 §3): this module
 * assigns coordinates and nothing else. It never adds, drops, merges,
 * reinterprets, or renames a node or an edge — `graphTarget`'s output passes
 * through it whole, and `layoutGraph` is a pure function of that output, so the
 * same graph always lays out the same way.
 *
 * The rule is deliberately simple, and simple is the point: one column per
 * node type in a fixed order, nodes in the order the compiler emitted them.
 * A general layout engine is not justified by a canonical graph of nineteen
 * nodes, and would be one more place for semantics to leak into the view.
 */

import type { GraphOutput } from "@genome/compiler";

type GraphNode = GraphOutput["nodes"][number];
type GraphEdge = GraphOutput["edges"][number];

export const NODE_WIDTH = 144;
export const NODE_HEIGHT = 48;
export const COLUMN_GAP = 40;
export const ROW_GAP = 12;
export const PADDING = 16;

/** Presentation order only; it carries no precedence in the language. */
const COLUMN_ORDER = [
  "Company",
  "Department",
  "Team",
  "Agent",
  "Workflow",
  "Policy",
  "Integration",
  "Objective",
  "Metric",
  "MemoryStore",
] as const;

export type PlacedNode = {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
  row: number;
};

export type Point = { x: number; y: number };

export type PlacedEdge = {
  edge: GraphEdge;
  /** Absent only if the compiler emitted an edge endpoint with no node. */
  from?: Point;
  to?: Point;
};

export type GraphColumn = { type: string; x: number; nodes: PlacedNode[] };

export type GraphLayout = {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  columns: GraphColumn[];
  width: number;
  height: number;
};

/** Column index for a type: known types first, then any unknown type, in order. */
function columnPlan(nodes: readonly GraphNode[]): string[] {
  const present = new Set(nodes.map((node) => node.type as string));
  const known = COLUMN_ORDER.filter((type) => present.has(type));
  const unknown = [...new Set(nodes.map((node) => node.type as string))].filter(
    (type) => !(COLUMN_ORDER as readonly string[]).includes(type),
  );
  return [...known, ...unknown];
}

export function layoutGraph(graph: GraphOutput): GraphLayout {
  const plan = columnPlan(graph.nodes);

  const columns: GraphColumn[] = plan.map((type, column) => ({
    type,
    x: PADDING + column * (NODE_WIDTH + COLUMN_GAP),
    nodes: [],
  }));

  const placed = new Map<string, PlacedNode>();
  const tallest = Math.max(
    1,
    ...plan.map((type) => graph.nodes.filter((node) => (node.type as string) === type).length),
  );
  const canvasHeight = PADDING * 2 + tallest * NODE_HEIGHT + (tallest - 1) * ROW_GAP;

  for (const [column, group] of columns.entries()) {
    const members = graph.nodes.filter((node) => (node.type as string) === group.type);
    const blockHeight = members.length * NODE_HEIGHT + (members.length - 1) * ROW_GAP;
    const top = (canvasHeight - blockHeight) / 2;

    for (const [row, node] of members.entries()) {
      const placedNode: PlacedNode = {
        node,
        x: group.x,
        y: top + row * (NODE_HEIGHT + ROW_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        column,
        row,
      };
      group.nodes.push(placedNode);
      placed.set(node.id, placedNode);
    }
  }

  // Every edge is carried, in the compiler's order. An edge whose endpoint the
  // compiler did not emit as a node keeps its place in the list without
  // coordinates rather than disappearing from the representation.
  const edges: PlacedEdge[] = graph.edges.map((edge) => {
    const from = placed.get(edge.from);
    const to = placed.get(edge.to);
    if (from === undefined || to === undefined) return { edge };
    const leftToRight = from.x <= to.x;
    return {
      edge,
      from: { x: leftToRight ? from.x + from.width : from.x, y: from.y + from.height / 2 },
      to: { x: leftToRight ? to.x : to.x + to.width, y: to.y + to.height / 2 },
    };
  });

  return {
    nodes: [...placed.values()],
    edges,
    columns,
    width: PADDING * 2 + plan.length * NODE_WIDTH + Math.max(0, plan.length - 1) * COLUMN_GAP,
    height: canvasHeight,
  };
}

/** A cubic curve between two anchors; presentation only. */
export function edgePath(from: Point, to: Point): string {
  const midpoint = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midpoint} ${from.y}, ${midpoint} ${to.y}, ${to.x} ${to.y}`;
}
