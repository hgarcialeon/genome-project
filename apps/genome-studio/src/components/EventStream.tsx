/**
 * The runtime's events, in the order the runtime emitted them.
 *
 * This is evidence, not a narrative: the list is append-only, the runtime's own
 * event type is the headline, and the envelope's accepted fields are shown by
 * their own names. Studio adds no type of its own, renames nothing, hides
 * nothing from the record, and re-sorts nothing — the ordering here is the
 * runtime's `id` ordering, which is the log order (RFC-0003).
 */

import { useState } from "preact/hooks";

import type { RuntimeEvent } from "@genome/runtime";

/** Payload keys rendered as first-class rows; anything else still appears in details. */
const FIELD_LABELS: Record<string, string> = {
  workflowId: "workflow",
  initiatedBy: "initiated by",
  principals: "principals",
  principal: "principal",
  step: "step",
  index: "step index",
  detail: "detail",
  reason: "reason",
  policyId: "policy",
};

const formatValue = (value: unknown): string =>
  Array.isArray(value) ? value.join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);

function EventRow({ event }: { event: RuntimeEvent }) {
  const [open, setOpen] = useState(false);
  const detailsId = `event-${event.id}-details`;

  return (
    <li class="event" data-testid="event" data-event-id={event.id} data-event-type={event.type}>
      <p class="event__head">
        <span class="event__id" aria-hidden="true">
          #{event.id}
        </span>
        <span class="visually-hidden">Event {event.id}: </span>
        <span class="event__type" data-testid="event-type">
          {event.type}
        </span>
        <span class="event__source">
          <span class="visually-hidden">attributed to </span>
          <span data-testid="event-source">{event.source}</span>
        </span>
      </p>

      <dl class="event__fields">
        {Object.entries(event.payload).map(([key, value]) => (
          <div key={key} class="event__field">
            <dt>{FIELD_LABELS[key] ?? key}</dt>
            <dd data-testid={`event-field-${key}`}>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>

      <p class="event__more">
        <button
          type="button"
          class="button button--quiet"
          aria-expanded={open}
          aria-controls={detailsId}
          data-testid="event-details-toggle"
          onClick={() => setOpen((previous) => !previous)}
        >
          {open ? "Hide" : "Show"} full event
          <span class="visually-hidden"> {event.id}</span>
        </button>
      </p>

      <pre id={detailsId} class="event__raw" hidden={!open} data-testid="event-raw">
        {JSON.stringify(event, null, 2)}
      </pre>
    </li>
  );
}

export function EventStream({
  events,
  headingId,
  announcement,
}: {
  events: readonly RuntimeEvent[];
  headingId: string;
  announcement: string;
}) {
  return (
    <section class="events" aria-labelledby={headingId}>
      <h2 id={headingId} class="panel__heading">
        Session events
      </h2>

      {/* Transitions are announced; the stream itself is not a live region, so
          assistive technology is not read every field of every event. */}
      <p class="events__announce" role="status" data-testid="session-announcement">
        {announcement}
      </p>

      {events.length === 0 ? (
        <p class="events__empty" data-testid="events-empty">
          No events. Nothing has executed in this session.
        </p>
      ) : (
        <ol class="events__list" data-testid="event-list">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ol>
      )}

      <p class="events__ephemeral">
        This stream is a window, not a ledger: it lives in this page only and is discarded with the session.
      </p>
    </section>
  );
}
