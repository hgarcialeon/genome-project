/**
 * The graph, as text.
 *
 * The picture is not the only representation of what the compiler said: every
 * node is here, reachable by keyboard, with its type, its identity, and the
 * relationships it takes part in — incoming and outgoing, each naming the
 * relationship type the compiler assigned. Selection is shared with the drawing
 * and is Studio state alone; nothing here changes Genome semantics.
 */

import type { GraphOutput } from "@genome/compiler";

type GraphEdge = GraphOutput["edges"][number];

const describe = (graph: GraphOutput, nodeId: string): string => {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  return node === undefined ? nodeId : `${node.label} (${node.type})`;
};

export function GraphIndex({
  graph,
  selectedNodeId,
  onSelect,
  headingId,
}: {
  graph: GraphOutput;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
  headingId: string;
}) {
  const outgoing = (nodeId: string): GraphEdge[] => graph.edges.filter((edge) => edge.from === nodeId);
  const incoming = (nodeId: string): GraphEdge[] => graph.edges.filter((edge) => edge.to === nodeId);

  return (
    <section class="graph-index" aria-labelledby={headingId}>
      <h3 id={headingId} class="panel__subheading">
        Graph contents
      </h3>
      <p class="graph-index__summary" data-testid="graph-summary">
        {graph.nodes.length} nodes, {graph.edges.length} relationships — every one of them listed below.
      </p>

      <ul class="graph-index__list" data-testid="graph-index">
        {graph.nodes.map((node) => {
          const from = outgoing(node.id);
          const to = incoming(node.id);
          const selected = node.id === selectedNodeId;
          return (
            <li key={node.id} class="graph-index__item">
              <button
                type="button"
                class={`graph-index__node${selected ? " graph-index__node--selected" : ""}`}
                aria-pressed={selected}
                data-testid="graph-index-node"
                data-node-id={node.id}
                data-node-type={node.type}
                onClick={() => onSelect(node.id)}
              >
                <span class="graph-index__type">{node.type}</span>
                <span class="graph-index__label">{node.label}</span>
                <span class="visually-hidden">
                  , {from.length} outgoing and {to.length} incoming relationships
                </span>
              </button>

              {selected ? (
                <div class="graph-index__relations" data-testid="graph-index-relations">
                  <p class="graph-index__id">
                    <span class="visually-hidden">Node id: </span>
                    <code>{node.id}</code>
                  </p>
                  <p class="graph-index__relations-heading">Outgoing</p>
                  {from.length === 0 ? (
                    <p class="graph-index__none">None.</p>
                  ) : (
                    <ul>
                      {from.map((edge) => (
                        <li key={`out:${edge.to}:${edge.type}`} data-testid="relation-out">
                          <span class="relation__type">{edge.type}</span> → {describe(graph, edge.to)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p class="graph-index__relations-heading">Incoming</p>
                  {to.length === 0 ? (
                    <p class="graph-index__none">None.</p>
                  ) : (
                    <ul>
                      {to.map((edge) => (
                        <li key={`in:${edge.from}:${edge.type}`} data-testid="relation-in">
                          {describe(graph, edge.from)} <span class="relation__type">{edge.type}</span> → this node
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
