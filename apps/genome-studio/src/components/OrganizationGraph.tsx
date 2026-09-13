/**
 * The Organization Graph — the organization as the compiler described it.
 *
 * `graphTarget`'s output is the complete semantic input. Every node and every
 * edge it contains is rendered, carrying the compiler's own id, type, label,
 * and relationship type in the DOM, so the rendered graph can be compared to
 * the compiler's output mechanically rather than by looking at it.
 *
 * Coordinates, curves, grouping, and selection are Studio's; meaning is not.
 */

import { edgePath, layoutGraph } from "../graph/layout.js";

/** Presentation only: the full label is always available as text and to AT. */
const MAX_LABEL = 17;
const shorten = (label: string): string =>
  label.length <= MAX_LABEL ? label : `${label.slice(0, MAX_LABEL - 1)}…`;

import type { GraphOutput } from "@genome/compiler";

/** Presentation grouping only — the language assigns no such families. */
const NODE_FAMILY: Record<string, string> = {
  Company: "structure",
  Department: "structure",
  Team: "structure",
  Agent: "actor",
  Workflow: "work",
  Policy: "governance",
  Integration: "external",
  Objective: "intent",
  Metric: "intent",
  MemoryStore: "external",
};

export function OrganizationGraph({
  graph,
  stale,
  selectedNodeId,
  onSelect,
  describedBy,
}: {
  graph: GraphOutput;
  stale: boolean;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
  describedBy?: string;
}) {
  const layout = layoutGraph(graph);

  return (
    <div class={`graph${stale ? " graph--stale" : ""}`} data-testid="graph-canvas">
      <svg
        class="graph__svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        height={layout.height}
        role="img"
        aria-label={`Organization Graph: ${graph.nodes.length} nodes and ${graph.edges.length} relationships. The same content is listed below as text.`}
        aria-describedby={describedBy}
      >
        <g class="graph__edges">
          {layout.edges.map(({ edge, from, to }) =>
            from === undefined || to === undefined ? null : (
              <path
                key={`${edge.from}->${edge.to}:${edge.type}`}
                class={`graph__edge graph__edge--${edge.type}`}
                d={edgePath(from, to)}
                data-edge-from={edge.from}
                data-edge-to={edge.to}
                data-edge-type={edge.type}
                fill="none"
              />
            ),
          )}
        </g>

        <g class="graph__nodes">
          {layout.nodes.map(({ node, x, y, width, height }) => {
            const selected = node.id === selectedNodeId;
            return (
              <g
                key={node.id}
                class={`graph__node graph__node--${NODE_FAMILY[node.type] ?? "other"}${
                  selected ? " graph__node--selected" : ""
                }`}
                data-node-id={node.id}
                data-node-type={node.type}
                transform={`translate(${x} ${y})`}
                onClick={() => onSelect(node.id)}
              >
                <title>
                  {node.type}: {node.label}
                </title>
                <rect class="graph__node-box" width={width} height={height} rx={8} />
                {selected ? <rect class="graph__node-ring" width={width} height={height} rx={8} /> : null}
                <text class="graph__node-type" x={10} y={18}>
                  {node.type}
                </text>
                <text class="graph__node-label" x={10} y={35}>
                  {shorten(node.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
