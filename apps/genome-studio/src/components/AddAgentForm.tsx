/**
 * Add agent — the authoring interaction (RFC-0010 §9).
 *
 * This component collects *intent* and renders what the toolchain said. It does
 * not know where an agent lives in a Genome document, builds no YAML, parses
 * nothing, and validates no Genome semantics: it names a department and an id,
 * hands them to `@genome/authoring`, and shows the result.
 *
 * Rendered inline beneath its department rather than as a modal, so there is no
 * focus trap to get wrong: the department it will change stays visible above
 * the fields the whole time.
 */

import { useEffect, useRef, useState } from "preact/hooks";

import { AUTONOMY_LEVELS, type AddAgentIntent, type AuthoringResult } from "@genome/authoring";

export type AddAgentOutcome = AuthoringResult;

/**
 * The failure, in the organization's terms.
 *
 * Compiler diagnostics are passed through exactly as the compiler worded them;
 * only the operation's own failures are phrased here, and they describe the
 * operation rather than the language.
 */
function failureMessages(result: Exclude<AuthoringResult, { ok: true }>): string[] {
  switch (result.failure) {
    case "invalid-intent":
      return result.problems.map((problem) => {
        switch (problem.kind) {
          case "missing-department":
            return "No department was named for the new agent.";
          case "missing-id":
            return "Enter an id for the new agent.";
          case "invalid-autonomy":
            return `${problem.value} is not an autonomy level. Choose one of: ${problem.allowed.join(", ")}.`;
          case "invalid-role":
            return "The role must be text.";
          case "invalid-skills":
            return "Skills must be a list of words.";
        }
      });
    case "conflict":
      switch (result.problem.kind) {
        case "unknown-department":
          return [`There is no department ${result.problem.department} in this organization.`];
        case "duplicate-agent":
          return [`${result.problem.department} already has an agent called ${result.problem.id}.`];
        case "departments-not-a-mapping":
          return ["This document has no departments to add an agent to."];
        case "agents-not-a-mapping":
          return [`The agents of ${result.problem.department} are not written as a list of agents.`];
      }
    // The compiler's own words, unchanged.
    case "invalid-source":
    case "invalid-result":
      return result.diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`);
  }
}

export function AddAgentForm({
  department,
  onSubmit,
  onCancel,
}: {
  /** The department the new agent will belong to — fixed by where this opened. */
  department: string;
  onSubmit: (intent: AddAgentIntent) => AddAgentOutcome;
  onCancel: () => void;
}) {
  const [id, setId] = useState("");
  const [role, setRole] = useState("");
  const [autonomy, setAutonomy] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);
  const idRef = useRef<HTMLInputElement>(null);

  const errorsId = `add-agent-errors-${department}`;
  const hasErrors = errors.length > 0;

  // Focus enters the interaction predictably when it opens.
  useEffect(() => {
    idRef.current?.focus();
  }, []);

  const submit = (event: Event) => {
    event.preventDefault();

    // Omitted stays omitted: a blank field is *absent*, not an empty value, so
    // an unstated autonomy keeps the language's deny-safe default rather than
    // being written into the document (RFC-0010 §2.2).
    const intent: AddAgentIntent = {
      department,
      id: id.trim(),
      ...(role.trim() === "" ? {} : { role: role.trim() }),
      ...(autonomy === "" ? {} : { autonomy: autonomy as AddAgentIntent["autonomy"] }),
    };

    const result = onSubmit(intent);
    if (result.ok) return; // the parent closes the form and moves focus
    setErrors(failureMessages(result));
  };

  return (
    <form class="add-agent" onSubmit={submit} data-testid="add-agent-form" aria-label={`Add an agent to ${department}`}>
      <p class="add-agent__context">
        New agent in <strong>{department}</strong>
      </p>

      <div class="add-agent__field">
        <label class="add-agent__label" for={`add-agent-id-${department}`}>
          Agent id <span class="add-agent__required">(required)</span>
        </label>
        <input
          ref={idRef}
          id={`add-agent-id-${department}`}
          class="add-agent__input"
          data-testid="add-agent-id"
          value={id}
          required
          aria-required="true"
          aria-invalid={hasErrors ? "true" : undefined}
          aria-describedby={hasErrors ? errorsId : undefined}
          onInput={(event) => setId((event.target as HTMLInputElement).value)}
        />
      </div>

      <div class="add-agent__field">
        <label class="add-agent__label" for={`add-agent-role-${department}`}>
          Role <span class="add-agent__optional">(optional)</span>
        </label>
        <input
          id={`add-agent-role-${department}`}
          class="add-agent__input"
          data-testid="add-agent-role"
          value={role}
          onInput={(event) => setRole((event.target as HTMLInputElement).value)}
        />
      </div>

      <div class="add-agent__field">
        <label class="add-agent__label" for={`add-agent-autonomy-${department}`}>
          Autonomy <span class="add-agent__optional">(optional)</span>
        </label>
        <select
          id={`add-agent-autonomy-${department}`}
          class="add-agent__input"
          data-testid="add-agent-autonomy"
          value={autonomy}
          onChange={(event) => setAutonomy((event.target as HTMLSelectElement).value)}
        >
          <option value="">Not stated — the organization's default applies</option>
          {AUTONOMY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Announced on arrival, without pulling focus away from the field the
          person is correcting. */}
      <div id={errorsId} role="alert" class="add-agent__errors" data-testid="add-agent-errors" hidden={!hasErrors}>
        {errors.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>

      <div class="add-agent__actions">
        <button type="submit" class="button button--primary" data-testid="add-agent-submit">
          Add agent
        </button>
        <button type="button" class="button" data-testid="add-agent-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
