#!/usr/bin/env node
/**
 * check-state — repository consistency check (Governance: phase-transition
 * review, mechanical half).
 *
 * Verifies that the project's self-describing documents match the repository
 * they describe. This is deliberately a small, repository-specific script,
 * not a reusable subsystem (introducing one would require an RFC).
 *
 * Checks:
 *   1. Every ROADMAP.md deliverable row carries a status from the fixed
 *      vocabulary (Not Started | In Progress | Done | Deferred | De-scoped).
 *   2. PROJECT_STATE.md's Current Phase names a phase that exists in
 *      ROADMAP.md.
 *   3. Repository paths referenced in the governance documents exist,
 *      including the top level of README.md's repository-structure tree.
 *   4. Every workspace package under packages/ has a `test` script, so
 *      "implemented" claims always have an executable check.
 *   5. Source files contain no raw control bytes (tab/LF/CR excepted).
 *   6. No current-state headings (Current Goal / Current Phase / ...) exist
 *      outside PROJECT_STATE.md — current state has exactly one home.
 *
 * Exit code: 0 when consistent, 1 with a failure list otherwise.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const fail = (check, message) => failures.push(`[${check}] ${message}`);
const read = (path) => readFileSync(join(ROOT, path), "utf8");

/** Markdown minus fenced code blocks (samples/templates are not claims). */
const stripFences = (markdown) => markdown.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, "");

// ---------------------------------------------------------------------------
// 1. Roadmap deliverable statuses
// ---------------------------------------------------------------------------

const STATUS_VOCABULARY = ["Not Started", "In Progress", "Done", "Deferred", "De-scoped"];
const roadmap = read("ROADMAP.md");
const phaseHeadings = [...roadmap.matchAll(/^## (Phase \d+ — .+)$/gm)].map((match) => match[1].trim());

if (phaseHeadings.length === 0) {
  fail("roadmap-status", "ROADMAP.md contains no `## Phase N — ...` headings");
}

for (const [, heading, body] of roadmap.matchAll(/^## (Phase \d+ — .+)\n([\s\S]*?)(?=^## |\n*$(?![\s\S]))/gm)) {
  const rows = [...body.matchAll(/^\|(.+)\|\s*$/gm)]
    .map((match) => match[1].split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0] !== "Deliverable" && !/^:?-+:?$/.test(cells[0]));
  if (rows.length === 0) {
    fail("roadmap-status", `${heading}: no deliverable table rows found`);
    continue;
  }
  for (const cells of rows) {
    const [deliverable, status] = cells;
    if (!STATUS_VOCABULARY.includes(status)) {
      fail(
        "roadmap-status",
        `${heading}: "${deliverable}" has status "${status ?? ""}" (expected one of: ${STATUS_VOCABULARY.join(", ")})`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Current Phase corresponds to a roadmap phase
// ---------------------------------------------------------------------------

const projectState = read("PROJECT_STATE.md");
const phaseSection = projectState.match(/^## Current Phase\n+([^\n]+)/m);
if (!phaseSection) {
  fail("current-phase", "PROJECT_STATE.md has no `## Current Phase` section");
} else {
  const declared = phaseSection[1].trim();
  if (!phaseHeadings.some((heading) => declared.startsWith(heading))) {
    fail(
      "current-phase",
      `PROJECT_STATE.md declares "${declared}" but ROADMAP.md defines: ${phaseHeadings.join("; ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Referenced repository paths exist
// ---------------------------------------------------------------------------

const REFERENCE_DOCS = [
  "README.md",
  "PROJECT_STATE.md",
  "ROADMAP.md",
  "IMPLEMENTATION_QUEUE.md",
  "CLAUDE_CODE_PROMPT.md",
  "docs/GOVERNANCE.md",
  "docs/BOOTSTRAP.md",
];
const PATH_PREFIXES = ["docs/", "SPEC/", "RFC/", "packages/", "scripts/", ".github/"];

for (const doc of REFERENCE_DOCS) {
  if (!existsSync(join(ROOT, doc))) {
    fail("paths-exist", `expected governance document missing: ${doc}`);
    continue;
  }
  const text = stripFences(read(doc));
  for (const [, reference] of text.matchAll(/`([A-Za-z0-9_./-]+)`/g)) {
    const isPrefixed = PATH_PREFIXES.some((prefix) => reference.startsWith(prefix));
    const isRootDoc = /^[A-Z][A-Za-z_]*\.(md|json|yaml)$/.test(reference);
    if ((isPrefixed || isRootDoc) && !existsSync(join(ROOT, reference))) {
      fail("paths-exist", `${doc} references \`${reference}\`, which does not exist`);
    }
  }
}

// README repository-structure tree: verify top-level entries.
const treeBlock = read("README.md").match(/```text\n(genome-project\/[\s\S]*?)```/);
if (treeBlock) {
  for (const [, entry] of treeBlock[1].matchAll(/^[├└]── ([A-Za-z0-9_.-]+)\/?$/gm)) {
    if (!existsSync(join(ROOT, entry))) {
      fail("paths-exist", `README.md repository tree lists "${entry}", which does not exist`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Every package has a test script
// ---------------------------------------------------------------------------

for (const name of readdirSync(join(ROOT, "packages"))) {
  const manifestPath = join(ROOT, "packages", name, "package.json");
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.scripts?.test) {
    fail("package-tests", `packages/${name} has no "test" script — implemented claims need executable evidence`);
  }
}

// ---------------------------------------------------------------------------
// 5. No raw control bytes in source files
// ---------------------------------------------------------------------------

const SOURCE_EXTENSIONS = [".ts", ".mjs", ".json", ".yaml", ".md"];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      yield path;
    }
  }
}

for (const dir of ["packages", "scripts", "SPEC", "docs", "RFC"]) {
  if (!existsSync(join(ROOT, dir))) continue;
  for (const path of walk(join(ROOT, dir))) {
    const bytes = readFileSync(path);
    const offender = bytes.findIndex((byte) => byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d);
    if (offender !== -1) {
      fail(
        "control-bytes",
        `${relative(ROOT, path)} contains raw control byte 0x${bytes[offender].toString(16)} at offset ${offender}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Current-state headings live only in PROJECT_STATE.md
// ---------------------------------------------------------------------------

const CURRENT_STATE_HEADING = /^#{1,6}\s+(Current (Goal|Phase|Sprint|Iteration|Milestone|Objective|Blockers?)|First Working Feature)\b/i;

const markdownFiles = [
  ...readdirSync(ROOT).filter((entry) => entry.endsWith(".md")),
  ...[...walk(join(ROOT, "docs"))].map((path) => relative(ROOT, path)).filter((path) => path.endsWith(".md")),
];

for (const doc of markdownFiles) {
  if (doc === "PROJECT_STATE.md") continue;
  for (const line of stripFences(read(doc)).split("\n")) {
    if (CURRENT_STATE_HEADING.test(line)) {
      fail("single-source", `${doc} contains current-state heading "${line.trim()}" — that state belongs in PROJECT_STATE.md`);
    }
  }
}

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`check-state: ${failures.length} ${failures.length === 1 ? "inconsistency" : "inconsistencies"} found\n`);
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`);
  }
  process.exit(1);
}

console.log("check-state: project state documents are consistent with the repository.");
