/**
 * Contrast evidence for the M1 accessibility floor (WCAG 2.2 AA, 1.4.3/1.4.11).
 *
 * jsdom paints nothing, so axe cannot judge contrast. This computes the ratios
 * from the real token values in `styles.css` — the same numbers the browser
 * will paint — and fails if a pair used for essential text or state falls below
 * the floor. It is a presentation test: it imports no product logic and ships
 * no accessibility dependency into the app.
 *
 * Formal conformance is still a human judgement in the walkthrough; this only
 * removes the possibility of a token pair being wrong.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Vitest runs this through Vite, where `import.meta.url` is not a file URL;
// the suite's working directory is the app package.
const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

const token = (name: string): string => {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (match === null) throw new Error(`token --${name} not found in styles.css`);
  return match[1];
};

const channel = (value: number): number => {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

const SURFACE = token("surface");
const PANEL = token("panel");

/** Backgrounds that are painted directly in `styles.css` rather than as tokens. */
const STALE_BACKGROUND = "#fdf7ea";
const ERROR_BACKGROUND = "#fdf4f4";
const ACTION_BACKGROUND = "#f4f7fd";
const EVIDENCE_BACKGROUND = "#f5faf6";
const DISABLED_BACKGROUND = "#e7eaef";
const BUTTON_TEXT = "#ffffff";

/**
 * 4.5:1 for body text, 3:1 for large text and for UI component boundaries.
 *
 * `--border` is deliberately absent from the component list: it draws container
 * hairlines (panels, cards, list items), which carry no state and identify no
 * control. Every edge that does bound a control — the editor, the workflow
 * selector, buttons, selectable rows — uses `--control-border`, which is held
 * to the 3:1 floor below.
 */
const TEXT = 4.5;
const COMPONENT = 3;

describe("token contrast", () => {
  const textPairs: Array<[string, string, string]> = [
    ["body text on the page", token("ink"), SURFACE],
    ["body text on a panel", token("ink"), PANEL],
    ["secondary text on a panel", token("ink-muted"), PANEL],
    ["secondary text on the page", token("ink-muted"), SURFACE],
    ["compiled status", token("ok"), PANEL],
    ["invalid status", token("error"), PANEL],
    ["edited/stale status", token("stale"), PANEL],
    ["stale banner text on its own background", token("stale"), STALE_BACKGROUND],
    ["waiting card text", token("error"), ERROR_BACKGROUND],
    ["action card text", token("accent"), ACTION_BACKGROUND],
    ["evidence card text", token("ok"), EVIDENCE_BACKGROUND],
    ["warning diagnostics", token("warning"), PANEL],
    ["primary button label", BUTTON_TEXT, token("accent")],
    ["quiet button label", token("accent"), PANEL],
    ["disabled control label", "#55606f", DISABLED_BACKGROUND],
    ["relationship type in the graph index", token("accent"), PANEL],
  ];

  for (const [label, foreground, background] of textPairs) {
    it(`${label} meets AA for text`, () => {
      expect(Number(contrast(foreground, background).toFixed(2))).toBeGreaterThanOrEqual(TEXT);
    });
  }

  const componentPairs: Array<[string, string, string]> = [
    ["focus indicator against the page", token("focus"), SURFACE],
    ["focus indicator against a panel", token("focus"), PANEL],
    ["control border against a panel", token("control-border"), PANEL],
    ["control border against the page", token("control-border"), SURFACE],
    ["primary button against a panel", token("accent"), PANEL],
    ["waiting card border", token("error"), PANEL],
  ];

  for (const [label, foreground, background] of componentPairs) {
    it(`${label} meets AA for non-text contrast`, () => {
      expect(Number(contrast(foreground, background).toFixed(2))).toBeGreaterThanOrEqual(COMPONENT);
    });
  }
});
