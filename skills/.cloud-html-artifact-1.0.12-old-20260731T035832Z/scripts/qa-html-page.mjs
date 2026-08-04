#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const args = parseArgs(process.argv.slice(2));
const input = String(args._[0] || "").trim();
const sourceDir = input && fs.existsSync(input) && fs.statSync(input).isDirectory()
  ? path.resolve(input)
  : "";
const requestedUrl = String(args.url || (!sourceDir ? input : "")).trim();
const outPath = path.resolve(args.out || path.join(sourceDir || process.cwd(), "html-page-qa.json"));
const screenshotPath = args.screenshot ? path.resolve(args.screenshot) : "";
const timeoutMs = Number(args["timeout-ms"] || 15_000);

main();

async function main() {
  const report = {
    ok: false,
    contract_version: "cloud-html-page.qa.v1",
    source_dir: sourceDir,
    url: "",
    checks: [],
    views: {},
    warnings: [],
    errors: [],
    browser: { dependency: "playwright", channel: "", resolved_from: "" },
    screenshot: { path: screenshotPath, written: false },
    started_at: new Date().toISOString(),
    finished_at: ""
  };
  let server;
  let browser;
  try {
    if (sourceDir) {
      assertFile(path.join(sourceDir, "index.html"), "index.html");
      server = await startStaticServer(sourceDir);
      report.url = `http://127.0.0.1:${server.address().port}/`;
    } else {
      if (!/^https?:\/\/\S+$/i.test(requestedUrl)) throw new Error("a source directory or HTTP(S) --url is required");
      report.url = requestedUrl;
    }

    if (!flagEnabled(args["force-cdp"])) {
      try {
        const playwright = await loadPlaywright(report);
        browser = await launchBrowser(playwright, report);
      } catch (error) {
        report.warnings.push(`playwright_unavailable_using_chrome_cdp:${messageOf(error)}`);
      }
    }
    if (!browser) browser = await launchChromeCdp(report);
    report.views.desktop = await inspectView(browser, report.url, { width: 1280, height: 800 }, report, true);
    report.views.mobile = await inspectView(browser, report.url, { width: 390, height: 844 }, report, false);
    report.ok = report.errors.length === 0 && report.checks.every(check => check.pass || check.level === "warning");
  } catch (error) {
    report.errors.push(messageOf(error));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise(resolve => server.close(resolve));
    report.errors = unique(report.errors);
    report.warnings = unique(report.warnings);
    report.finished_at = new Date().toISOString();
    writeJson(outPath, report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }
}

async function inspectView(browser, url, viewport, report, captureScreenshot) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", message => {
    if (message.type() !== "error") return;
    const locationUrl = String(message.location()?.url || "");
    if (isFaviconUrl(locationUrl)) return;
    consoleErrors.push(locationUrl ? `${message.text()} (${locationUrl})` : message.text());
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("requestfailed", request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText || "failed"}`));
  page.on("response", response => {
    if (response.status() >= 400 && !isFaviconUrl(response.url())) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(300);
    const observed = await page.evaluate(() => {
      const body = document.body;
      const text = String(body?.innerText || "").replace(/\s+/g, " ").trim();
      const visibleMedia = [...document.querySelectorAll("img,video,canvas,svg")].filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
      }).length;
      return {
        title: document.title,
        text_length: text.length,
        body_children: body?.children.length || 0,
        visible_media: visibleMedia,
        viewport_width: window.innerWidth,
        scroll_width: Math.max(document.documentElement.scrollWidth, body?.scrollWidth || 0)
      };
    });
    const label = viewport.width < 500 ? "mobile" : "desktop";
    record(report, `${label}_http_ok`, Boolean(response?.ok()), `${response?.status() || 0}`);
    record(report, `${label}_body_present`, observed.body_children > 0, `${observed.body_children} children`);
    record(report, `${label}_content_visible`, observed.text_length > 0 || observed.visible_media > 0, JSON.stringify({ text_length: observed.text_length, visible_media: observed.visible_media }));
    record(report, `${label}_no_horizontal_overflow`, observed.scroll_width <= observed.viewport_width + 2, `${observed.scroll_width} / ${observed.viewport_width}`);
    record(report, `${label}_no_page_errors`, pageErrors.length === 0, pageErrors.join("; "));
    record(report, `${label}_no_console_errors`, consoleErrors.length === 0, consoleErrors.join("; "));
    record(report, `${label}_resources_loaded`, failedRequests.length === 0, failedRequests.join("; "));
    if (args["expect-selector"]) {
      const count = await page.locator(String(args["expect-selector"])).count();
      record(report, `${label}_expected_selector_present`, count > 0, `${args["expect-selector"]}: ${count}`);
    }
    if (args["expect-text"]) {
      const bodyText = await page.locator("body").innerText();
      record(report, `${label}_expected_text_present`, bodyText.includes(String(args["expect-text"])), String(args["expect-text"]));
    }
    if (captureScreenshot && screenshotPath) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      report.screenshot.written = fs.existsSync(screenshotPath);
    }
    return { ...observed, console_errors: consoleErrors, page_errors: pageErrors, failed_requests: failedRequests };
  } finally {
    await page.close();
  }
}

function isFaviconUrl(value) {
  return /\/favicon\.ico(?:\?|$)/i.test(String(value || ""));
}

function record(report, name, pass, detail = "", level = "error") {
  report.checks.push({ name, pass, detail, level });
  if (!pass) {
    const message = detail ? `${name}: ${detail}` : name;
    if (level === "warning") report.warnings.push(message);
    else report.errors.push(message);
  }
}

async function loadPlaywright(report) {
  const require = createRequire(import.meta.url);
  const roots = [];
  if (args["node-modules"]) roots.push(path.resolve(args["node-modules"]));
  if (process.env.ARTIFACT_NODE_MODULES) roots.push(...splitPathList(process.env.ARTIFACT_NODE_MODULES));
  if (process.env.NODE_PATH) roots.push(...splitPathList(process.env.NODE_PATH));
  roots.push(path.join(process.cwd(), "node_modules"));
  roots.push(...defaultRuntimeNodeModuleRoots());
  const searchPaths = unique(roots.flatMap(expandNodeModulesRoot));
  try {
    const resolved = require.resolve("playwright", { paths: searchPaths });
    report.browser.resolved_from = resolved;
    const imported = await import(pathToFileURL(resolved).href);
    return imported.chromium ? imported : imported.default;
  } catch (error) {
    throw new Error(`Playwright is required for HTML QA. Pass --node-modules or set ARTIFACT_NODE_MODULES. ${messageOf(error)}`);
  }
}

async function launchBrowser(playwright, report) {
  const requested = args["browser-channel"] ? String(args["browser-channel"]) : "";
  const candidates = requested
    ? [{ name: requested, options: { headless: true, channel: requested } }]
    : [
        { name: "playwright-chromium", options: { headless: true } },
        { name: "chrome", options: { headless: true, channel: "chrome" } },
        { name: "msedge", options: { headless: true, channel: "msedge" } }
      ];
  const failures = [];
  for (const candidate of candidates) {
    try {
      const browser = await playwright.chromium.launch(candidate.options);
      report.browser.channel = candidate.name;
      if (failures.length) report.warnings.push(`browser_launch_fallback_used:${candidate.name}`);
      return browser;
    } catch (error) {
      failures.push(`${candidate.name}: ${messageOf(error)}`);
    }
  }
  throw new Error(`Unable to launch Chromium: ${failures.join(" | ")}`);
}

async function launchChromeCdp(report) {
  const executable = resolveChromeExecutable();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cloud-html-qa-chrome-"));
  const child = spawn(executable, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-pipe",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], {
    stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"],
    windowsHide: true
  });
  const connection = new CdpPipeConnection(child, timeoutMs);
  try {
    await connection.send("Browser.getVersion");
  } catch (error) {
    connection.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
    throw new Error(`Unable to start system Chrome through CDP: ${messageOf(error)}`);
  }
  report.browser.dependency = "system-chrome-cdp";
  report.browser.channel = path.basename(executable);
  report.browser.resolved_from = executable;
  return new CdpBrowserAdapter({ child, connection, userDataDir, timeoutMs });
}

class CdpBrowserAdapter {
  constructor({ child, connection, userDataDir, timeoutMs: browserTimeoutMs }) {
    this.child = child;
    this.connection = connection;
    this.userDataDir = userDataDir;
    this.timeoutMs = browserTimeoutMs;
    this.pages = new Set();
  }

  async newPage({ viewport }) {
    const created = await this.connection.send("Target.createTarget", { url: "about:blank" });
    const attached = await this.connection.send("Target.attachToTarget", {
      targetId: created.targetId,
      flatten: true
    });
    const page = new CdpPageAdapter({
      browser: this,
      connection: this.connection,
      targetId: created.targetId,
      sessionId: attached.sessionId,
      viewport,
      timeoutMs: this.timeoutMs
    });
    await page.initialize();
    this.pages.add(page);
    return page;
  }

  async close() {
    for (const page of [...this.pages]) await page.close().catch(() => {});
    this.connection.close();
    if (this.child.exitCode === null) this.child.kill();
    await waitForChildExit(this.child, 2000);
    fs.rmSync(this.userDataDir, { recursive: true, force: true });
  }
}

class CdpPageAdapter {
  constructor({ browser, connection, targetId, sessionId, viewport, timeoutMs: pageTimeoutMs }) {
    this.browser = browser;
    this.connection = connection;
    this.targetId = targetId;
    this.sessionId = sessionId;
    this.viewport = viewport;
    this.timeoutMs = pageTimeoutMs;
    this.listeners = new Map();
    this.waiters = new Set();
    this.requests = new Map();
    this.mainResponse = null;
    this.closed = false;
    this.unsubscribe = connection.subscribe(sessionId, message => this.handleEvent(message));
  }

  async initialize() {
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("Network.enable");
    await this.send("Emulation.setDeviceMetricsOverride", {
      width: this.viewport.width,
      height: this.viewport.height,
      deviceScaleFactor: 1,
      mobile: this.viewport.width < 500,
      screenWidth: this.viewport.width,
      screenHeight: this.viewport.height
    });
  }

  on(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(listener);
  }

  async goto(url, options = {}) {
    this.mainResponse = null;
    this.requests.clear();
    const loaded = this.waitForAny(
      ["Page.domContentEventFired", "Page.loadEventFired"],
      Number(options.timeout || this.timeoutMs)
    );
    const navigation = await this.send("Page.navigate", { url });
    if (navigation.errorText) throw new Error(navigation.errorText);
    await loaded;
    await delay(50);
    const status = Number(this.mainResponse?.status || 0);
    return {
      ok: () => status >= 200 && status < 400,
      status: () => status
    };
  }

  async waitForTimeout(milliseconds) {
    await delay(milliseconds);
  }

  async evaluate(callback) {
    const expression = typeof callback === "function"
      ? `(${callback.toString()})()`
      : String(callback);
    return this.evaluateExpression(expression);
  }

  locator(selector) {
    const encoded = JSON.stringify(String(selector));
    return {
      count: () => this.evaluateExpression(
        `document.querySelectorAll(${encoded}).length`
      ),
      innerText: () => this.evaluateExpression(
        `String(document.querySelector(${encoded})?.innerText || "")`
      )
    };
  }

  async screenshot(options = {}) {
    const format = String(options.path || "").toLowerCase().endsWith(".jpg")
      || String(options.path || "").toLowerCase().endsWith(".jpeg")
      ? "jpeg"
      : "png";
    const captured = await this.send("Page.captureScreenshot", {
      format,
      fromSurface: true,
      captureBeyondViewport: Boolean(options.fullPage)
    });
    fs.mkdirSync(path.dirname(options.path), { recursive: true });
    fs.writeFileSync(options.path, Buffer.from(captured.data, "base64"));
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.unsubscribe();
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error("Chrome page closed"));
    }
    this.waiters.clear();
    await this.connection.send("Target.closeTarget", {
      targetId: this.targetId
    }).catch(() => {});
    this.browser.pages.delete(this);
  }

  async evaluateExpression(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description
          || response.exceptionDetails.text
          || "Chrome evaluation failed"
      );
    }
    return response.result?.value;
  }

  send(method, params = {}) {
    return this.connection.send(method, params, this.sessionId);
  }

  waitForAny(methods, waitTimeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = {
        methods: new Set(methods),
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters.delete(waiter);
          reject(new Error(`Chrome page load timed out after ${waitTimeoutMs} ms`));
        }, waitTimeoutMs)
      };
      this.waiters.add(waiter);
    });
  }

  handleEvent(message) {
    for (const waiter of [...this.waiters]) {
      if (!waiter.methods.has(message.method)) continue;
      clearTimeout(waiter.timer);
      this.waiters.delete(waiter);
      waiter.resolve(message.params || {});
    }

    const params = message.params || {};
    if (message.method === "Network.requestWillBeSent") {
      this.requests.set(params.requestId, {
        method: params.request?.method || "GET",
        url: params.request?.url || ""
      });
      return;
    }
    if (message.method === "Network.responseReceived") {
      const response = params.response || {};
      if (params.type === "Document") this.mainResponse = response;
      this.emit("response", {
        status: () => Number(response.status || 0),
        url: () => String(response.url || "")
      });
      return;
    }
    if (message.method === "Network.loadingFailed") {
      const request = this.requests.get(params.requestId) || {};
      this.emit("requestfailed", {
        method: () => request.method || "GET",
        url: () => request.url || "",
        failure: () => ({ errorText: params.errorText || "failed" })
      });
      return;
    }
    if (message.method === "Runtime.consoleAPICalled") {
      const type = String(params.type || "");
      this.emit("console", {
        type: () => type,
        text: () => (params.args || []).map(remoteObjectText).join(" "),
        location: () => {
          const frame = params.stackTrace?.callFrames?.[0];
          return { url: frame?.url || "" };
        }
      });
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = params.exceptionDetails || {};
      this.emit("pageerror", new Error(
        details.exception?.description || details.text || "Uncaught page exception"
      ));
    }
  }

  emit(name, value) {
    for (const listener of this.listeners.get(name) || []) listener(value);
  }
}

class CdpPipeConnection {
  constructor(child, commandTimeoutMs) {
    this.child = child;
    this.commandTimeoutMs = commandTimeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.subscribers = new Map();
    this.buffer = Buffer.alloc(0);
    this.stderr = "";
    this.closed = false;

    const input = child.stdio[3];
    const output = child.stdio[4];
    if (!input || !output) throw new Error("Chrome remote debugging pipes are unavailable");
    this.input = input;
    output.on("data", chunk => this.onData(chunk));
    child.stderr?.on("data", chunk => {
      this.stderr = (this.stderr + chunk.toString("utf8")).slice(-8000);
    });
    child.once("error", error => this.failAll(error));
    child.once("exit", code => {
      if (!this.closed) {
        this.failAll(new Error(
          `system Chrome exited with code ${code}${this.stderr ? `: ${this.stderr.trim()}` : ""}`
        ));
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    if (this.closed) return Promise.reject(new Error("Chrome CDP connection is closed"));
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Chrome CDP command timed out: ${method}`));
      }, this.commandTimeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.input.write(Buffer.from(JSON.stringify(message) + "\0"), error => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  subscribe(sessionId, listener) {
    if (!this.subscribers.has(sessionId)) this.subscribers.set(sessionId, new Set());
    this.subscribers.get(sessionId).add(listener);
    return () => this.subscribers.get(sessionId)?.delete(listener);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.failAll(new Error("Chrome CDP connection closed"));
    this.input.destroy();
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (true) {
      const separator = this.buffer.indexOf(0);
      if (separator < 0) break;
      const raw = this.buffer.subarray(0, separator).toString("utf8");
      this.buffer = this.buffer.subarray(separator + 1);
      if (!raw) continue;
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        continue;
      }
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) continue;
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(
            `${pending.method}: ${message.error.message || "Chrome CDP error"}`
          ));
        } else {
          pending.resolve(message.result || {});
        }
        continue;
      }
      if (message.sessionId) {
        for (const listener of this.subscribers.get(message.sessionId) || []) {
          listener(message);
        }
      }
    }
  }

  failAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

function resolveChromeExecutable() {
  const requested = [
    args["browser-executable"],
    process.env.ARTIFACT_BROWSER_EXECUTABLE
  ].map(value => String(value || "").trim()).filter(Boolean);
  const candidates = [
    ...requested,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "msedge",
    "chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const candidate of unique(candidates)) {
    if (path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
      continue;
    }
    const probe = spawnSync(candidate, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
      windowsHide: true
    });
    if (!probe.error && probe.status === 0) return candidate;
  }
  throw new Error(
    "Playwright is unavailable and no system Chrome executable was found. "
      + "Set ARTIFACT_BROWSER_EXECUTABLE to google-chrome, chromium, or msedge."
  );
}

function remoteObjectText(value) {
  if (Object.prototype.hasOwnProperty.call(value || {}, "value")) {
    return typeof value.value === "string" ? value.value : JSON.stringify(value.value);
  }
  return String(value?.description || value?.type || "");
}

function waitForChildExit(child, waitMs) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    const timer = setTimeout(resolve, waitMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function startStaticServer(root) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    if (requestUrl.pathname === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }
    const relative = decodeURIComponent(requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.replace(/^\/+/, ""));
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
      response.writeHead(403, { "Content-Type": "text/plain" }).end("Forbidden");
      return;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(target) });
    fs.createReadStream(target).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function contentType(filePath) {
  return ({
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
  })[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function defaultRuntimeNodeModuleRoots() {
  const roots = [];
  const home = os.homedir();
  if (home) {
    const runtimes = path.join(home, ".cache", "codex-runtimes");
    roots.push(path.join(runtimes, "codex-primary-runtime", "dependencies", "node", "node_modules"));
    if (fs.existsSync(runtimes)) {
      for (const entry of fs.readdirSync(runtimes, { withFileTypes: true })) {
        if (entry.isDirectory()) roots.push(path.join(runtimes, entry.name, "dependencies", "node", "node_modules"));
      }
    }
  }
  const executableDir = path.dirname(process.execPath);
  roots.push(path.resolve(executableDir, "..", "node_modules"));
  roots.push(path.resolve(executableDir, "..", "..", "node", "node_modules"));
  return roots;
}

function expandNodeModulesRoot(root) {
  const paths = [root];
  const pnpm = path.join(root, ".pnpm");
  if (fs.existsSync(pnpm) && fs.statSync(pnpm).isDirectory()) {
    for (const entry of fs.readdirSync(pnpm, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith("playwright@")) paths.unshift(path.join(pnpm, entry.name, "node_modules"));
    }
  }
  return paths;
}

function splitPathList(value) {
  return String(value).split(path.delimiter).map(item => path.resolve(item.trim())).filter(Boolean);
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error(`${label} not found: ${filePath}`);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) parsed._.push(arg);
    else {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) parsed[key] = true;
      else {
        parsed[key] = next;
        index += 1;
      }
    }
  }
  return parsed;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function flagEnabled(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}
