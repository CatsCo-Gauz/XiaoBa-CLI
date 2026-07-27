#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
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

    const playwright = await loadPlaywright(report);
    browser = await launchBrowser(playwright, report);
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
