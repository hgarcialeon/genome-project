/**
 * Studio shell (checkpoint 1).
 *
 * Proof of integration only: it opens the canonical document, compiles it
 * through the accepted compiler in the page, and reports what the compiler
 * said. The Governed Authoring workspace — graph, tree, execution, governance,
 * source — lands in the following checkpoints.
 */

import { CANONICAL_DOCUMENT, CANONICAL_DOCUMENT_NAME } from "./canonical.js";
import { compileDocument } from "./genome/compilation.js";

export function App() {
  const compilation = compileDocument(CANONICAL_DOCUMENT);

  return (
    <main>
      <h1>Genome Studio</h1>
      <p>{CANONICAL_DOCUMENT_NAME}</p>
      {compilation.ok ? (
        <dl>
          <dt>Genome revision</dt>
          <dd data-testid="revision">{compilation.revision}</dd>
          <dt>Organization Graph</dt>
          <dd data-testid="graph-size">
            {compilation.graphProjection.nodes.length} nodes, {compilation.graphProjection.edges.length} edges
          </dd>
          <dt>Workflows in the runtime model</dt>
          <dd data-testid="workflow-count">{Object.keys(compilation.runtimeModel.workflows).length}</dd>
        </dl>
      ) : (
        <p data-testid="compile-failure">Compilation failed at the {compilation.stage} stage.</p>
      )}
    </main>
  );
}
