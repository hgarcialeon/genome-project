/**
 * The append-only event log (RFC-0003 output contract, RFC-0004 ordering).
 *
 * `append` assigns `id` as a strictly increasing integer starting at 1; log
 * order, id order, and causal order coincide — the single total order every
 * other contract rests on. Events are frozen on append: corrections are new
 * events, never edits. The subscribe hook is the Phase 3 "event bus": views
 * and tests observe the log; subscribers can never mutate it.
 */

import type { RuntimeEvent } from "../events/index.js";

export type EventInput = Omit<RuntimeEvent, "id">;

export type EventListener = (event: RuntimeEvent) => void;

export type EventLog = {
  append(input: EventInput): RuntimeEvent;
  /** Snapshot of the log in id order. */
  events(): readonly RuntimeEvent[];
  /** Observe appends. Returns an unsubscribe function. */
  subscribe(listener: EventListener): () => void;
};

export function createEventLog(): EventLog {
  const events: RuntimeEvent[] = [];
  const listeners = new Set<EventListener>();

  return {
    append(input) {
      const event = Object.freeze({ ...input, payload: Object.freeze({ ...input.payload }), id: events.length + 1 });
      events.push(event);
      for (const listener of listeners) {
        listener(event);
      }
      return event;
    },
    events() {
      return [...events];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
