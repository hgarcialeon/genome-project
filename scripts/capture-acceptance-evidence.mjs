#!/usr/bin/env node
/**
 * capture-acceptance-evidence — durable visual evidence for the Milestone-1
 * product acceptance record (RFC-0009 §14.8, Milestone-1 acceptance floor).
 *
 * Builds nothing and asserts nothing. It serves the already-built Studio
 * (`apps/genome-studio/dist`), drives the RFC-0009 §7 canonical sequence in a
 * real headless Chromium, and writes one PNG per named acceptance state.
 *
 * Screenshots are *evidence*, not normative state: the executable conformance
 * in `apps/genome-studio/src/acceptance.test.tsx` is what proves the behavior.
 * These images let the Product Owner see the product without a toolchain.
 *
 * No browser-automation framework is added — the same stance as the browser
 * conformance harness (`packages/genome-browser-conformance/src/chromium.ts`).
 * This drives Chromium directly over CDP using Node's built-in WebSocket.
 *
 * Usage: node scripts/capture-acceptance-evidence.mjs
 */

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "apps/genome-studio/dist");
const OUT = join(ROOT, "docs/reviews/evidence/phase-4-m1");

/** One canonical viewport for the whole set, so states are comparable. */
const VIEWPORT = { width: 1440, height: 900 };

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------------------
// Chromium discovery — same candidates as the conformance harness
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// A minimal static server for the built Studio
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// A very small CDP client
// ---------------------------------------------------------------------------

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls the DevTools target list until the Studio page is attachable. */
async function waitForPageTarget(port) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((t) => t.type === "page" && typeof t.webSocketDebuggerUrl === "string");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // The endpoint is not up yet.
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

/** Evaluates an expression in the page, failing loudly on an exception. */
async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(`page evaluation failed: ${JSON.stringify(result.exceptionDetails.exception?.description)}`);
  }
  return result.result.value;
}

async function shoot(cdp, name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const file = join(OUT, `${name}.png`);
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log(`  captured ${name}.png`);
}

// ---------------------------------------------------------------------------
// Page helpers, expressed against the shipped test ids
// ---------------------------------------------------------------------------

const BY = (id) => `document.querySelector('[data-testid="${id}"]')`;
const CLICK = (id) => `${BY(id)}.click(), true`;
const COUNT = (id) => `document.querySelectorAll('[data-testid="${id}"]').length`;

/** Sets the editor's value the way a user's typing reaches Preact. */
const SET_SOURCE = (source) => `
  (() => {
    const el = ${BY("source")};
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(source)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`;

const ADDED_AGENT = "technical-writer";
const structuralEdit = (source) =>
  source.replace(
    "\nworkflows:",
    `\n      ${ADDED_AGENT}:\n        role: Technical Writer\n        autonomy: supervised\n\nworkflows:`,
  );

// ---------------------------------------------------------------------------

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

  // Chromium prints the DevTools endpoint on stderr once it is listening.
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

  // Connect to the page target itself, so no session plumbing is needed.
  const devtoolsPort = new URL(webSocketUrl).port;
  const pageTarget = await waitForPageTarget(devtoolsPort);
  const cdp = await connect(pageTarget);
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

    const canonical = await evaluate(cdp, `${BY("source")}.value`);
    if (typeof canonical !== "string" || canonical.length === 0) {
      throw new Error("the canonical document did not load into the editor");
    }

    // 1 — the compiled organization, as opened.
    await shoot(cdp, "01-compiled-organization");

    // 2 — a structural edit, before compiling: projections marked stale.
    await evaluate(cdp, SET_SOURCE(structuralEdit(canonical)));
    await delay(300);
    if ((await evaluate(cdp, COUNT("projection-stale"))) === 0) {
      throw new Error("expected the projections to be marked stale after an edit");
    }
    await shoot(cdp, "02-edited-stale-projection");

    // Back to the canonical document for the governed run (§7).
    await evaluate(cdp, SET_SOURCE(canonical));
    await evaluate(cdp, CLICK("compile-now"));
    await delay(400);

    // 3 — deny-safe park, showing the policy and the required principal.
    await evaluate(cdp, CLICK("run-workflow"));
    await delay(600);
    const principal = await evaluate(cdp, `${BY("required-principal")}.textContent`);
    if (!String(principal).includes("human:product-owner")) {
      throw new Error(`expected a park for human:product-owner, saw: ${principal}`);
    }
    await shoot(cdp, "03-deny-safe-park");

    // 4 — the explicit grant completes the run, attributed.
    await evaluate(cdp, CLICK("grant-button"));
    await delay(800);
    const grantedBy = await evaluate(cdp, `${BY("granted-by")}.textContent`);
    if (!String(grantedBy).includes("human:product-owner")) {
      throw new Error(`expected the grant attributed to human:product-owner, saw: ${grantedBy}`);
    }
    await shoot(cdp, "04-attributed-completion");

    // 5 — the same record with every envelope expanded, so continuity is
    // legible down to the runtime's own event payloads.
    // The stream is a scrolling region in the product (`.events__list` caps at
    // 22rem). For this one image only, the cap is lifted so the whole ordered
    // record fits in a single frame — disclosed as such in the acceptance
    // record. Nothing about the events themselves is altered.
    const expanded = await evaluate(
      cdp,
      `(() => {
         const list = ${BY("event-list")};
         if (list) { list.style.maxHeight = 'none'; list.style.overflow = 'visible'; }
         const toggles = Array.from(document.querySelectorAll('[data-testid="event-details-toggle"]'));
         for (const toggle of toggles) {
           if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
         }
         return toggles.length;
       })()`,
    );
    await delay(500);
    const shown = await evaluate(
      cdp,
      `document.querySelectorAll('[data-testid="event-raw"]:not([hidden])').length`,
    );
    if (shown !== expanded || shown === 0) {
      throw new Error(`expected all ${expanded} event envelopes expanded, ${shown} are visible`);
    }
    await shoot(cdp, "05-event-record-expanded");

    const eventTypes = await evaluate(
      cdp,
      `Array.from(document.querySelectorAll('[data-testid="event-type"]')).map((e) => e.textContent)`,
    );
    console.log(`\n  event sequence rendered: ${eventTypes.join(" → ")}`);
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
