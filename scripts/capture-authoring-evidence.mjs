#!/usr/bin/env node
/**
 * capture-authoring-evidence — visual evidence for the Milestone-1 *remediation*
 * acceptance (RFC-0010 §14).
 *
 * Drives the authoring journey the Product Owner's rejection named — discover
 * Add agent from the organization, add an agent to Engineering, see the source
 * change, compile, see it in the projections — in a real headless Chromium
 * against the built Studio.
 *
 * Same stance as `capture-acceptance-evidence.mjs`: no browser-automation
 * framework, CDP over Node's built-in WebSocket. Screenshots are evidence, not
 * normative state; `apps/genome-studio/src/authoring.test.tsx` is what proves
 * the behavior.
 *
 * Usage: node scripts/capture-authoring-evidence.mjs
 */

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "apps/genome-studio/dist");
const OUT = join(ROOT, "docs/reviews/evidence/phase-4-m1-remediation");

/** One canonical viewport for the whole set, so states are comparable. */
const VIEWPORT = { width: 1440, height: 900 };

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

function findChromium() {
  for (const variable of ["GENOME_CHROMIUM", "CHROME_BIN"]) {
    const configured = process.env[variable];
    if (configured !== undefined && configured !== "" && existsSync(configured)) return configured;
  }
  for (const command of ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser"]) {
    const found = spawnSync("which", [command], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim() !== "") return found.stdout.trim();
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root !== undefined && existsSync(root)) {
    for (const entry of readdirSync(root)) {
      if (!entry.startsWith("chromium") || entry.includes("headless_shell")) continue;
      for (const relative of ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
        const candidate = join(root, entry, relative);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  throw new Error("no Chromium found. Set GENOME_CHROMIUM to a browser executable.");
}

function serve(directory) {
  const server = createServer((request, response) => {
    const path = request.url === "/" ? "/index.html" : (request.url ?? "/index.html").split("?")[0];
    const file = join(directory, path);
    if (!file.startsWith(directory) || !existsSync(file)) {
      response.writeHead(404).end("not found");
      return;
    }
    response.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPageTarget(port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((t) => t.type === "page" && typeof t.webSocketDebuggerUrl === "string");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Not up yet.
    }
    await delay(250);
  }
  throw new Error("no attachable Chromium page target appeared");
}

async function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("CDP socket failed")), { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (waiter === undefined) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  return { send, close: () => socket.close() };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(`page evaluation failed: ${JSON.stringify(result.exceptionDetails.exception?.description)}`);
  }
  return result.result.value;
}

async function shoot(cdp, name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, "base64"));
  console.log(`  captured ${name}.png`);
}

const BY = (id) => `document.querySelector('[data-testid="${id}"]')`;
const OPENER = `document.querySelector('[data-testid="add-agent-open"][data-department="engineering"]')`;

/** Types into a controlled input the way a keystroke reaches Preact. */
const TYPE = (testId, value) => `
  (() => {
    const el = ${BY(testId)};
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error(`no built Studio at ${DIST}. Run \`pnpm build\` first.`);
  }
  mkdirSync(OUT, { recursive: true });

  const browserPath = findChromium();
  const { server, port } = await serve(DIST);
  const pageUrl = `http://127.0.0.1:${port}/`;

  const browser = spawn(
    browserPath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "--remote-debugging-port=0",
      pageUrl,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  const webSocketUrl = await new Promise((resolve, reject) => {
    let buffered = "";
    const timer = setTimeout(() => reject(new Error("Chromium did not report a DevTools endpoint")), 30_000);
    browser.stderr.on("data", (chunk) => {
      buffered += chunk.toString();
      const match = buffered.match(/ws:\/\/[^\s]+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });

  const cdp = await connect(await waitForPageTarget(new URL(webSocketUrl).port));
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log(`driving ${pageUrl} in ${browserPath}`);
    await cdp.send("Page.reload");
    await delay(1500);

    const sourceBefore = await evaluate(cdp, `${BY("source")}.value`);
    if (typeof sourceBefore !== "string" || sourceBefore.length === 0) {
      throw new Error("the canonical document did not load");
    }

    // 1 — the organization, with authoring visibly available.
    if ((await evaluate(cdp, `${OPENER} !== null`)) !== true) {
      throw new Error("no Add agent control on engineering");
    }
    await shoot(cdp, "01-organization-is-editable");

    // 2 — the Add agent form, opened from Engineering.
    await evaluate(cdp, `${OPENER}.click(), true`);
    await delay(400);
    await shoot(cdp, "02-add-agent-form");

    // 3 — a refused duplicate, in the organization's terms.
    await evaluate(cdp, TYPE("add-agent-id", "engineering-agent"));
    await evaluate(cdp, `${BY("add-agent-submit")}.click(), true`);
    await delay(400);
    const conflictText = await evaluate(cdp, `${BY("add-agent-errors")}.textContent`);
    if (!String(conflictText).includes("already has an agent")) {
      throw new Error(`expected a duplicate conflict, saw: ${conflictText}`);
    }
    await shoot(cdp, "03-conflict-refused");

    // 4 — a valid intent, filled in.
    await evaluate(cdp, TYPE("add-agent-id", "technical-writer"));
    await evaluate(cdp, TYPE("add-agent-role", "Technical Writer"));
    await evaluate(cdp, TYPE("add-agent-autonomy", "supervised"));
    await delay(200);
    await shoot(cdp, "04-intent-entered");

    // 5 — the source changed and the projections are stale.
    //
    // This state is transient by design: the authored source enters the
    // ordinary edit lifecycle, so the accepted 400 ms debounce clears it like
    // any other edit (RFC-0010 §9.1). Captured immediately, and asserted, so
    // the image is what its name says rather than whatever won the race.
    await evaluate(cdp, `${BY("add-agent-submit")}.click(), true`);
    await delay(60);
    const sourceAfter = await evaluate(cdp, `${BY("source")}.value`);
    if (!String(sourceAfter).includes("technical-writer")) {
      throw new Error("the editor source did not receive the authored document");
    }
    const staleCount = await evaluate(cdp, `document.querySelectorAll('[data-testid="projection-stale"]').length`);
    if (staleCount === 0) {
      throw new Error("expected the projections to be marked stale immediately after the authoring edit");
    }
    await shoot(cdp, "05-source-changed-and-stale");

    // 6 — compiled. Nothing authoring-specific runs: the same debounce that
    // follows typing brings the projections up to date on its own.
    await delay(1200);
    const stillStale = await evaluate(cdp, `document.querySelectorAll('[data-testid="projection-stale"]').length`);
    if (stillStale !== 0) {
      throw new Error("the ordinary auto-compile did not pick up the authoring edit");
    }
    const drawn = await evaluate(
      cdp,
      `Array.from(document.querySelectorAll('[data-testid="graph-index-node"]')).map((e) => e.getAttribute('data-node-id'))`,
    );
    if (!drawn.includes("agent:engineering.technical-writer")) {
      throw new Error(`the new agent is not in the graph: ${drawn.join(", ")}`);
    }
    await shoot(cdp, "06-compiled-projections");

    const added = String(sourceAfter)
      .split("\n")
      .filter((line) => !String(sourceBefore).split("\n").includes(line));
    console.log(`\n  lines added to the source: ${JSON.stringify(added)}`);
    console.log(`  governance disclaimer intact: ${String(sourceAfter).includes("NON-NORMATIVE FOR GOVERNANCE")}`);
  } finally {
    cdp.close();
    browser.kill();
    server.close();
  }

  console.log(`\nevidence written to ${OUT}`);
}

main().catch((error) => {
  console.error(`capture failed: ${error.message}`);
  process.exit(1);
});
