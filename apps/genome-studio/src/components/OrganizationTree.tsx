/**
 * The organization outline — `inspectTarget`, rendered.
 *
 * The hierarchy shown here is the compiler's: departments, their agents, their
 * teams, those teams' agents, and the workflows it reported with their owner,
 * trigger, and step count. Studio does not rebuild this from the graph, from
 * the runtime model, or from the source; it expands, indents, and labels what
 * `inspectTarget` returned.
 */

import type { ComponentChildren, RefObject } from "preact";
import { useState } from "preact/hooks";

import type { InspectReport } from "@genome/compiler";

import { AddAgentForm, type AddAgentOutcome } from "./AddAgentForm.js";

import type { AddAgentIntent } from "@genome/authoring";

/**
 * The id of a department's Add agent control.
 *
 * Focus returns here on cancel. It is looked up by id rather than held as a
 * node, because the button is unmounted while the form is open and the element
 * that comes back is a different one.
 */
export const addAgentOpenerId = (department: string): string => `add-agent-open-${department}`;

export type AuthoringHandlers = {
  /** Which department currently has its Add agent form open, if any. */
  openDepartment?: string;
  onOpen: (department: string) => void;
  onCancel: () => void;
  onSubmit: (intent: AddAgentIntent) => AddAgentOutcome;
};

function Disclosure({
  id,
  summary,
  detail,
  children,
}: {
  id: string;
  summary: string;
  detail?: string;
  children: ComponentChildren;
}) {
  const [open, setOpen] = useState(true);
  const regionId = `${id}-children`;

  return (
    <li class="tree__item">
      <button
        type="button"
        class="tree__disclosure"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span class="tree__twisty" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        <span class="tree__name" data-testid="tree-item">
          {summary}
        </span>
        {detail !== undefined ? <span class="tree__detail">{detail}</span> : null}
      </button>
      <div id={regionId} hidden={!open}>
        {children}
      </div>
    </li>
  );
}

function Leaf({ name, detail }: { name: string; detail?: string }) {
  return (
    <li class="tree__item tree__item--leaf">
      <span class="tree__name" data-testid="tree-item">
        {name}
      </span>
      {detail !== undefined ? <span class="tree__detail">{detail}</span> : null}
    </li>
  );
}

export function OrganizationTree({
  report,
  headingId,
  authoring,
  confirmationRef,
  lastAdded,
}: {
  report: InspectReport;
  headingId: string;
  /** Absent when the projection is not the current source: nothing is authorable. */
  authoring?: AuthoringHandlers;
  confirmationRef?: RefObject<HTMLParagraphElement>;
  lastAdded?: { department: string; id: string };
}) {
  return (
    <section class="tree" aria-labelledby={headingId}>
      <h2 id={headingId} class="panel__heading">
        Organization
      </h2>

      <p class="tree__company" data-testid="tree-company">
        {report.company.name}
      </p>

      {/* The organization is a thing you change, not only a thing you read. */}
      <p class="tree__lede">Describe and change your organization. Every change is written to the Genome source below.</p>

      <ul class="tree__root">
        {report.departments.map((department) => (
          <Disclosure
            key={`department:${department.id}`}
            id={`department-${department.id}`}
            summary={department.id}
            detail="department"
          >
            <ul class="tree__children">
              {department.agents.map((agent) => (
                <Leaf key={`agent:${department.id}.${agent}`} name={agent} detail="agent" />
              ))}
              {authoring !== undefined ? (
                <li class="tree__item tree__item--authoring">
                  {authoring.openDepartment === department.id ? (
                    <AddAgentForm
                      department={department.id}
                      onSubmit={authoring.onSubmit}
                      onCancel={authoring.onCancel}
                    />
                  ) : (
                    <button
                      type="button"
                      id={addAgentOpenerId(department.id)}
                      class="button button--add"
                      data-testid="add-agent-open"
                      data-department={department.id}
                      onClick={() => authoring.onOpen(department.id)}
                    >
                      + Add agent<span class="visually-hidden"> to {department.id}</span>
                    </button>
                  )}
                  {lastAdded?.department === department.id ? (
                    <p
                      ref={confirmationRef}
                      class="tree__confirmation"
                      data-testid="add-agent-confirmation"
                      tabIndex={-1}
                    >
                      Added <strong>{lastAdded.id}</strong> to {department.id}. The Genome source below has changed;
                      the organization recompiles from it.
                    </p>
                  ) : null}
                </li>
              ) : null}
              {department.teams.map((team) => (
                <Disclosure
                  key={`team:${department.id}.${team.id}`}
                  id={`team-${department.id}-${team.id}`}
                  summary={team.id}
                  detail="team"
                >
                  <ul class="tree__children">
                    {team.agents.map((agent) => (
                      <Leaf key={`agent:${department.id}.${team.id}.${agent}`} name={agent} detail="agent" />
                    ))}
                  </ul>
                </Disclosure>
              ))}
            </ul>
          </Disclosure>
        ))}
      </ul>

      <h3 class="panel__subheading">Workflows</h3>
      <ul class="tree__root" data-testid="tree-workflows">
        {report.workflows.map((workflow) => (
          <Leaf
            key={`workflow:${workflow.id}`}
            name={workflow.id}
            detail={`${workflow.steps} steps${workflow.owner !== undefined ? ` · owner ${workflow.owner}` : ""}${
              workflow.trigger !== undefined ? ` · ${workflow.trigger}` : ""
            }`}
          />
        ))}
      </ul>
    </section>
  );
}
