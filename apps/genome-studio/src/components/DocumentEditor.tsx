/**
 * The Genome source, editable.
 *
 * A labelled textarea: keyboard behaviour is the platform's, focus is visible,
 * and the diagnostics that describe this source are associated with it through
 * `aria-describedby`/`aria-errormessage` rather than by proximity alone.
 */

import type { Ref } from "preact";

export function DocumentEditor({
  source,
  invalid,
  describedBy,
  errorMessageId,
  textareaRef,
  onInput,
  onCompile,
}: {
  source: string;
  invalid: boolean;
  describedBy: string;
  errorMessageId?: string;
  textareaRef: Ref<HTMLTextAreaElement>;
  onInput: (source: string) => void;
  onCompile: () => void;
}) {
  return (
    <div class="editor">
      <div class="editor__header">
        <label class="editor__label" for="genome-source">
          Genome source
        </label>
        <button type="button" class="button" onClick={onCompile} data-testid="compile-now">
          Compile now
          <span class="button__hint"> (Ctrl + Enter)</span>
        </button>
      </div>

      <textarea
        id="genome-source"
        class="editor__textarea"
        data-testid="source"
        spellcheck={false}
        autocomplete="off"
        wrap="off"
        value={source}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-errormessage={invalid ? errorMessageId : undefined}
        ref={textareaRef}
        onInput={(event) => onInput((event.currentTarget as HTMLTextAreaElement).value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onCompile();
          }
        }}
      />
    </div>
  );
}
