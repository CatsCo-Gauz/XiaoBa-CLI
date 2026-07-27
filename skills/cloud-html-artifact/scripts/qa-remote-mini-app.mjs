#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { isPublicHttpUrl } from "./mini-app-publish-profile.mjs";
import { validateMiniAppSpec } from "./mini-app-contract.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.url || args._[0]);
const expectedAppId = String(args["expected-app-id"] || "").trim();
const outPath = path.resolve(args.out || path.join("work", "cloud-mini-app-remote-qa.json"));
const screenshotPath = args["no-screenshot"] ? "" : path.resolve(args.screenshot || path.join(path.dirname(outPath), "remote-mini-app.png"));
const mobileScreenshotPath = screenshotPath ? path.resolve(args["mobile-screenshot"] || addSuffix(screenshotPath, ".mobile")) : "";
const skipBrowser = Boolean(args["skip-browser"]);
const qaSession = "qa-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);

const report = {
  ok: false,
  contract_version: "cloud-mini-app.remote-qa.v1",
  base_url: baseUrl,
  app_id: "",
  checks: [],
  browser: {
    required: !skipBrowser,
    engine: "chromium",
    resolved_from: "",
    channel: ""
  },
  screenshot: {
    requested: Boolean(screenshotPath) && !skipBrowser,
    path: screenshotPath,
    written: false,
    mobile_path: mobileScreenshotPath,
    mobile_written: false
  },
  warnings: ["public_demo_has_no_authentication"],
  errors: [],
  started_at: new Date().toISOString(),
  finished_at: ""
};

let browser = null;
let originalState = null;
let spec = null;
let qaStateTouched = false;

await main();

async function main() {
  try {
    if (!baseUrl) throw new Error("--url <mini-app-url> is required");
    if (!args["allow-private-url"] && !isPublicHttpUrl(baseUrl)) throw new Error("remote mini app URL must be public HTTP(S)");
    if (!baseUrl.endsWith("/")) throw new Error("mini app URL must end with /");

    const health = await fetchJson(urlFor("health"));
    record("remote_health_ok", health.ok === true && health.contract_version === "cloud-mini-app.remote-health.v1", JSON.stringify(health));
    record("remote_qa_state_isolated", health.qa_isolated === true, JSON.stringify({ qa_isolated: health.qa_isolated }));

    spec = await fetchJson(urlFor("api/spec"));
    const validation = validateMiniAppSpec(spec);
    record("remote_spec_valid", validation.ok, validation.errors.join("; "));
    if (!validation.ok) throw new Error("remote mini app spec is invalid");
    report.app_id = spec.app_id;
    record("remote_app_id_matches", !expectedAppId || spec.app_id === expectedAppId, spec.app_id + " / " + expectedAppId);

    originalState = await fetchJson(urlFor("api/state"));
    qaStateTouched = true;
    record("remote_state_read_ok", spec.entities.every(entity => Array.isArray(originalState[entity.id])), spec.entities.map(entity => entity.id).join(","));

    const probeToken = "remote-qa-" + Date.now().toString(36);
    const probeState = structuredClone(originalState);
    probeState._remote_qa_probe = { token: probeToken, written_at: new Date().toISOString() };
    const written = await putState(probeState);
    record("remote_state_write_ok", written.ok === true && written.state._remote_qa_probe.token === probeToken, probeToken);
    const readBack = await fetchJson(urlFor("api/state"));
    record("remote_state_persisted_after_write", readBack._remote_qa_probe && readBack._remote_qa_probe.token === probeToken, probeToken);

    const assets = await Promise.all([fetchText(baseUrl), fetchText(urlFor("app.js")), fetchText(urlFor("styles.css"))]);
    record("remote_entry_served", assets[0].includes("mini-app-root"), "index bytes=" + assets[0].length);
    record("remote_client_served", assets[1].includes("persistState"), "app.js bytes=" + assets[1].length);
    record("remote_styles_served", assets[2].includes(".workspace"), "styles.css bytes=" + assets[2].length);

    if (skipBrowser) {
      report.warnings.push("remote_browser_qa_skipped_by_request");
      record("remote_browser_qa_skipped", true, "--skip-browser");
    } else {
      await runBrowserQa();
    }
  } catch (error) {
    report.errors.push(messageOf(error));
  } finally {
    if (browser) await browser.close().catch(() => {});
    await cleanupQaState().catch(error => {
      report.errors.push("failed to clean isolated remote QA state: " + messageOf(error));
      record("remote_qa_state_cleaned", false, messageOf(error));
    });
    report.warnings = unique(report.warnings);
    report.errors = unique(report.errors);
    report.ok = report.errors.length === 0 && report.checks.length > 0 && report.checks.every(check => check.pass);
    report.finished_at = new Date().toISOString();
    writeJson(outPath, report);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  }
}

async function runBrowserQa() {
  const playwright = await loadPlaywright();
  browser = await launchBrowser(playwright);
  const page = await browser.newPage({ viewport: { width: 1365, height: 850 } });
  const consoleIssues = [];
  const pageErrors = [];
  const failedResponses = [];
  page.on("console", message => {
    if (["warning", "error"].includes(message.type())) consoleIssues.push({ type: message.type(), text: message.text() });
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  });
  await page.goto(pageUrl(), { waitUntil: "networkidle", timeout: 20000 });
  await page.locator("#mini-app-root[data-ready=\"true\"]").waitFor({ timeout: 12000 });

  const firstEntity = spec.entities[0];
  const firstRow = originalState[firstEntity.id][0];
  const expectedTitle = firstRow ? rowTitle(firstRow, firstEntity) : "";
  const rendered = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1") && document.querySelector("h1").textContent.trim(),
    rows: document.querySelectorAll(".record-row").length,
    emptyVisible: Boolean(document.querySelector("#empty-state:not([hidden])")),
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  record("remote_browser_page_nonblank", rendered.h1 === spec.title && (rendered.rows > 0 || rendered.emptyVisible), JSON.stringify(rendered));
  if (expectedTitle) record("remote_browser_first_record_visible", await recordTitleLocator(page, expectedTitle).count() > 0, expectedTitle);
  else record("remote_browser_empty_state_visible", rendered.emptyVisible, JSON.stringify(rendered));
  record("remote_browser_desktop_no_overflow", rendered.bodyWidth <= rendered.viewportWidth + 1, rendered.bodyWidth + "/" + rendered.viewportWidth);

  if (expectedTitle) {
    await recordTitleLocator(page, expectedTitle).first().click();
    record("remote_browser_detail_opens", await page.locator("#detail-content:not([hidden])").count() === 1, expectedTitle);
  }

  if (firstRow && Array.isArray(firstRow.tasks) && firstRow.tasks.length) {
    const checkbox = page.locator("#task-list input[type=\"checkbox\"]").first();
    const before = await checkbox.isChecked();
    await Promise.all([
      waitForStatePut(page),
      checkbox.click()
    ]);
    await reloadReady(page);
    await recordTitleLocator(page, expectedTitle).first().click();
    const after = await page.locator("#task-list input[type=\"checkbox\"]").first().isChecked();
    record("remote_browser_task_persists_after_reload", before !== after, before + " -> " + after);
  }

  if (["create", "edit", "delete"].every(feature => spec.features.includes(feature))) {
    const titleField = firstEntity.fields.find(field => field.key === firstEntity.display?.title_field) || firstEntity.fields.find(field => ["name", "title", "label"].includes(field.key)) || firstEntity.fields[0];
    const createdTitle = "Remote QA Record";
    const updatedTitle = "Remote QA Record Updated";
    await page.locator("#add-button").click();
    for (const field of firstEntity.fields) {
      const locator = page.locator("#record-form [name=\"" + field.key + "\"]");
      if (!await locator.count()) continue;
      const value = field.key === titleField.key ? createdTitle : qaFieldValue(field);
      if (!value && !field.required && field.type !== "boolean") continue;
      await fillQaField(locator, field, value);
    }
    await Promise.all([waitForStatePut(page), page.locator("#record-form button[type=\"submit\"]").click()]);
    record("remote_browser_create", await recordTitleLocator(page, createdTitle).count() > 0, createdTitle);
    const extendedFields = firstEntity.fields.filter(field => ["select", "textarea", "boolean", "url", "tel"].includes(field.type));
    if (extendedFields.length) {
      const createdState = await fetchJson(urlFor("api/state"));
      const createdRow = createdState[firstEntity.id]?.find(row => rowTitle(row, firstEntity) === createdTitle);
      record(
        "remote_browser_extended_field_types_persist",
        Boolean(createdRow) && extendedFields.every(field => qaValueMatches(createdRow[field.key], qaFieldValue(field), field.type)),
        JSON.stringify(Object.fromEntries(extendedFields.map(field => [field.key, createdRow?.[field.key]])))
      );
    }
    await reloadReady(page);
    record("remote_browser_create_persists", await recordTitleLocator(page, createdTitle).count() > 0, createdTitle);

    await recordTitleLocator(page, createdTitle).first().click();
    await page.locator("#edit-button").click();
    await page.locator("#record-form [name=\"" + titleField.key + "\"]").fill(updatedTitle);
    await Promise.all([waitForStatePut(page), page.locator("#record-form button[type=\"submit\"]").click()]);
    record("remote_browser_edit", await recordTitleLocator(page, updatedTitle).count() > 0, updatedTitle);
    await reloadReady(page);
    record("remote_browser_edit_persists", await recordTitleLocator(page, updatedTitle).count() > 0, updatedTitle);

    await recordTitleLocator(page, updatedTitle).first().click();
    page.once("dialog", dialog => dialog.accept());
    await Promise.all([waitForStatePut(page), page.locator("#delete-button").click()]);
    await recordTitleLocator(page, updatedTitle).waitFor({ state: "detached", timeout: 5000 });
    record("remote_browser_delete", await recordTitleLocator(page, updatedTitle).count() === 0, updatedTitle);
    await reloadReady(page);
    record("remote_browser_delete_persists", await recordTitleLocator(page, updatedTitle).count() === 0, updatedTitle);
  }

  if (screenshotPath) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.screenshot.written = fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 0;
    record("remote_browser_screenshot_written", report.screenshot.written, screenshotPath);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobile = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth }));
  record("remote_browser_mobile_no_overflow", mobile.bodyWidth <= mobile.viewportWidth + 1, JSON.stringify(mobile));
  if (mobileScreenshotPath) {
    fs.mkdirSync(path.dirname(mobileScreenshotPath), { recursive: true });
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    report.screenshot.mobile_written = fs.existsSync(mobileScreenshotPath) && fs.statSync(mobileScreenshotPath).size > 0;
    record("remote_browser_mobile_screenshot_written", report.screenshot.mobile_written, mobileScreenshotPath);
  }
  record("remote_browser_console_clean", consoleIssues.length === 0 && pageErrors.length === 0 && failedResponses.length === 0, JSON.stringify({ consoleIssues, pageErrors, failedResponses }));
}

function addSuffix(filePath, suffix) {
  const extension = path.extname(filePath);
  return filePath.slice(0, extension ? -extension.length : undefined) + suffix + extension;
}

function waitForStatePut(page) {
  return page.waitForResponse(response => {
    const pathname = new URL(response.url()).pathname;
    return pathname.endsWith("/api/state") && response.request().method() === "PUT" && response.ok();
  });
}

async function reloadReady(page) {
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#mini-app-root[data-ready=\"true\"]").waitFor({ timeout: 12000 });
}

async function cleanupQaState() {
  if (!qaStateTouched || !baseUrl) return;
  const response = await fetchWithTimeout(urlFor("api/state"), { method: "DELETE" });
  const text = await response.text();
  let value = null;
  try {
    value = JSON.parse(text);
  } catch {}
  if (!response.ok || value?.ok !== true || value?.qa_session_removed !== true) {
    throw new Error("QA state cleanup failed: " + response.status + " " + text.slice(0, 180));
  }
  record("remote_qa_state_cleaned", true, "isolated QA state removed");
}

function putState(value) {
  return fetchJson(urlFor("api/state"), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
}

function urlFor(relative) {
  const url = new URL(relative, baseUrl);
  url.searchParams.set("__qa", qaSession);
  return url.href;
}

function pageUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("__qa", qaSession);
  return url.href;
}

async function fetchJson(url, options) {
  const response = await fetchWithTimeout(url, options);
  const text = await response.text();
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("invalid JSON from " + url + ": " + text.slice(0, 180));
  }
  if (!response.ok) throw new Error("request failed " + response.status + " for " + url + ": " + text.slice(0, 240));
  return value;
}

async function fetchText(url) {
  const response = await fetchWithTimeout(url);
  const text = await response.text();
  if (!response.ok) throw new Error("request failed " + response.status + " for " + url);
  return text;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(args["timeout-ms"] || 15000));
  try {
    return await fetch(url, { ...options, signal: controller.signal, headers: { accept: "application/json", ...(options.headers || {}) } });
  } finally {
    clearTimeout(timer);
  }
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidatePaths = moduleSearchPaths();
  try {
    const resolved = require.resolve("playwright", { paths: candidatePaths });
    report.browser.resolved_from = resolved;
    const module = await import(pathToFileURL(resolved).href);
    return module.chromium ? module : module.default;
  } catch (error) {
    throw new Error("Playwright is required for remote mini app QA. Pass --node-modules. Tried: " + candidatePaths.join("; ") + ". " + messageOf(error));
  }
}

async function launchBrowser(playwright) {
  const attempts = [];
  const requested = args["browser-channel"] ? String(args["browser-channel"]) : "";
  const candidates = requested
    ? [{ name: requested, options: { headless: true, channel: requested } }]
    : [
        { name: "playwright-chromium", options: { headless: true } },
        { name: "chrome", options: { headless: true, channel: "chrome" } },
        { name: "msedge", options: { headless: true, channel: "msedge" } }
      ];
  for (const candidate of candidates) {
    try {
      const launched = await playwright.chromium.launch(candidate.options);
      report.browser.channel = candidate.name;
      if (attempts.length) report.warnings.push("browser_launch_fallback_used:" + candidate.name);
      return launched;
    } catch (error) {
      attempts.push({ channel: candidate.name, error: messageOf(error) });
    }
  }
  throw new Error("unable to launch Chromium: " + JSON.stringify(attempts));
}

function moduleSearchPaths() {
  const roots = [];
  if (args["node-modules"]) roots.push(path.resolve(args["node-modules"]));
  if (process.env.ARTIFACT_NODE_MODULES) roots.push(...splitPathList(process.env.ARTIFACT_NODE_MODULES));
  if (process.env.NODE_PATH) roots.push(...splitPathList(process.env.NODE_PATH));
  roots.push(path.join(process.cwd(), "node_modules"));
  const home = os.homedir();
  if (home) {
    const runtimesRoot = path.join(home, ".cache", "codex-runtimes");
    roots.push(path.join(runtimesRoot, "codex-primary-runtime", "dependencies", "node", "node_modules"));
    if (fs.existsSync(runtimesRoot) && fs.statSync(runtimesRoot).isDirectory()) {
      for (const entry of fs.readdirSync(runtimesRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) roots.push(path.join(runtimesRoot, entry.name, "dependencies", "node", "node_modules"));
      }
    }
  }
  const executableDir = path.dirname(process.execPath);
  roots.push(path.resolve(executableDir, "..", "node_modules"));
  roots.push(path.resolve(executableDir, "..", "..", "node", "node_modules"));
  const values = [];
  for (const root of roots.filter(Boolean)) values.push(...expandNodeModulesRoot(root));
  return unique(values);
}

function expandNodeModulesRoot(root) {
  const values = [root];
  const pnpmDir = path.join(root, ".pnpm");
  if (!fs.existsSync(pnpmDir) || !fs.statSync(pnpmDir).isDirectory()) return values;
  for (const entry of fs.readdirSync(pnpmDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith("playwright@")) values.unshift(path.join(pnpmDir, entry.name, "node_modules"));
  }
  return values;
}

function splitPathList(value) {
  return String(value).split(path.delimiter).map(item => path.resolve(item.trim())).filter(Boolean);
}

function rowTitle(row, entity) {
  const configured = entity.display?.title_field;
  const preferred = configured && row[configured] ? configured : ["name", "title", "label"].find(key => row[key]);
  const first = entity.fields.find(field => row[field.key]);
  return String(row[preferred || (first && first.key) || entity.primary_key || "id"] || "");
}

function qaFieldValue(field) {
  if (field.type === "email") return "remote-qa@example.test";
  if (field.type === "number") return "1";
  if (field.type === "date") return "2026-08-01";
  if (field.type === "status" || field.type === "select") return field.options?.[0]?.value || "todo";
  if (field.type === "boolean") return true;
  if (field.type === "url") return "https://example.test/item";
  if (field.type === "tel") return "13800000000";
  if (field.type === "textarea") return "Remote QA multiline note";
  return field.required ? "QA value" : "";
}

async function fillQaField(locator, field, value) {
  if (field.type === "status" || field.type === "select") {
    await locator.selectOption(String(value || field.options?.[0]?.value || "todo"));
  } else if (field.type === "boolean") {
    if (value && !await locator.isChecked()) await locator.check();
    if (!value && await locator.isChecked()) await locator.uncheck();
  } else {
    await locator.fill(String(value || "QA value"));
  }
}

function qaValueMatches(actual, expected, type) {
  if (type === "boolean") return Boolean(actual) === Boolean(expected);
  return String(actual ?? "") === String(expected ?? "");
}

function recordTitleLocator(page, title) {
  return page.locator(".record-name").filter({ hasText: title });
}

function record(name, pass, detail) {
  report.checks.push({ name, pass: Boolean(pass), detail: String(detail || "") });
}

function normalizeBaseUrl(value) {
  const text = String(value || "").trim();
  return text ? text.replace(/\/+$/, "") + "/" : "";
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
