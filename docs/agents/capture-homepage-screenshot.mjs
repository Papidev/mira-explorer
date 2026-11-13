// Captures the homepage map screenshot. See homepage-map-screenshot.md.
// Usage: node docs/agents/capture-homepage-screenshot.mjs [visitorUrl] [outBasename]
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base = "http://localhost:3000", out = join(tmpdir(), "mira-map-retina")] =
  process.argv.slice(2);
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Framing approved in v0.23: Castel Sant'Angelo upper left, the historic center to the south.
const VIEW = { center: [12.4822, 41.8993], zoom: 14.15 };
const NEUTRAL_POINTER = { x: 1000, y: 60 }; // header text, clear of markers and controls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "mira-capture-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "about:blank",
]);

try {
  let port;
  for (let i = 0; !port && i < 50; i++, await sleep(200)) {
    try {
      port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0];
    } catch {}
  }
  if (!port) throw new Error(`Chrome did not start: ${CHROME}`);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    pending.get(msg.id)?.(msg);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, (msg) =>
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result),
      );
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description);
    return result.value;
  };
  const waitFor = async (label, expression, timeout = 60_000) => {
    for (const end = Date.now() + timeout; Date.now() < end; await sleep(250))
      if (await evaluate(expression)) return;
    throw new Error(`Timed out waiting for ${label}`);
  };

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1728,
    height: 798,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });
  await send("Page.navigate", { url: new URL("/rome?poi=castel-sant-angelo", base).href });
  await waitFor("markers", `document.querySelectorAll(".maplibregl-marker").length > 100`);

  // The map adapter is not global; reach it through the React fiber of the map container.
  await evaluate(`(() => {
    const el = document.querySelector(".maplibregl-map");
    let fiber = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))];
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook && typeof hook === "object" && "next" in hook; hook = hook.next)
        for (const value of [hook.memoizedState, hook.memoizedState?.current])
          if (typeof value?.updateView === "function") {
            value.updateView(${JSON.stringify(VIEW)});
            return;
          }
    throw new Error("Map adapter not found");
  })()`);
  await waitFor("zoom 14.15", `document.querySelector(".map-zoom-value")?.value === "14.15"`);
  await sleep(1500); // easeTo settles, tiles render

  await evaluate(`document.querySelector("nextjs-portal")?.remove()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...NEUTRAL_POINTER });
  await evaluate(`document.querySelector('[aria-label="Open details for Ara Pacis"]').focus()`);
  await waitFor(
    "the Ara Pacis preview",
    `document.querySelector(".poi-preview-popup")?.innerText.startsWith("Ara Pacis")`,
  );
  // Lazy images below the fold never load, so wait only for the visible ones.
  await waitFor(
    "visible images and fonts",
    `[...document.images]
       .filter((i) => { const r = i.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; })
       .every((i) => i.complete && i.naturalWidth) && document.fonts.status === "loaded"`,
  );
  await sleep(1500); // map tiles have no DOM signal

  const state = await evaluate(`({
    zoom: document.querySelector(".map-zoom-value").value,
    uncheckedCategories: [...document.querySelectorAll("input[type=checkbox]")].filter((c) => !c.checked).length,
    drawer: [...document.querySelectorAll("h2")].some((h) => h.textContent === "Castel Sant'Angelo"),
  })`);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}.png`, Buffer.from(data, "base64"));
  ws.close();

  const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");
  const webp = await sharp(`${out}.png`)
    .webp({ quality: 80, effort: 6, smartSubsample: true })
    .toFile(`${out}.webp`);
  console.log({ ...state, png: `${out}.png`, webp: `${out}.webp`, ...webp });
} finally {
  chrome.kill();
  await new Promise((r) => (chrome.exitCode === null ? chrome.once("exit", r) : r()));
  rmSync(profile, { recursive: true, force: true });
}
