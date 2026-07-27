#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MINI_APP_HOST_RUNTIME,
  flagEnabled,
  mergeMiniAppPublishProfile,
  summarizeMiniAppPublishProfile,
  validateMiniAppPublishProfile
} from "./mini-app-publish-profile.mjs";

const rawArgs = parseArgs(process.argv.slice(2));
if (!rawArgs.profile && rawArgs._[0]) rawArgs.profile = rawArgs._[0];
const outPath = rawArgs.out ? path.resolve(rawArgs.out) : "";

await main();

async function main() {
  const result = {
    ok: false,
    contract_version: "cloud-mini-app.provider-check.v1",
    provider: "",
    can_publish_dynamic: false,
    profile: null,
    capabilities: {
      runtime: false,
      writable_state: false,
      versioning: false,
      shared_state_across_versions: false,
      public_url: false,
      remote_health: false
    },
    host_health: null,
    checks: [],
    blockers: [],
    warnings: [],
    errors: [],
    started_at: new Date().toISOString(),
    finished_at: ""
  };

  const record = (name, pass, detail = "", level = "error", blocker = "") => {
    result.checks.push({ name, pass: Boolean(pass), detail, level, blocker });
    if (pass) return;
    const message = detail ? name + ": " + detail : name;
    if (level === "warning") result.warnings.push(message);
    else result.errors.push(message);
    if (blocker) result.blockers.push(blocker);
  };

  try {
    record("profile_argument_present", Boolean(rawArgs.profile), "--profile <file-or-name> is required", "error", "dynamic_profile_required");
    if (!rawArgs.profile) throw new Error("missing profile argument");
    const args = mergeMiniAppPublishProfile(rawArgs);
    const validation = validateMiniAppPublishProfile(args, { allowPrivateUrls: flagEnabled(rawArgs["allow-private-url"]) });
    result.provider = validation.effective.provider;
    result.profile = summarizeMiniAppPublishProfile(args);
    for (const check of validation.checks) result.checks.push({ ...check, source: "profile" });
    result.warnings.push(...validation.warnings);
    result.errors.push(...validation.errors);
    result.blockers.push(...blockerCodes(validation.errors));

    checkFilesystem(validation.effective.apps_root, validation.effective.state_root, record, result);
    await checkHostHealth(validation.effective, record, result);

    result.capabilities.public_url = validation.checks
      .filter(check => check.name.startsWith("public_base_url_"))
      .every(check => check.pass || check.level === "warning");
    result.can_publish_dynamic = validation.ok &&
      result.capabilities.runtime &&
      result.capabilities.writable_state &&
      result.capabilities.versioning &&
      result.capabilities.shared_state_across_versions &&
      result.capabilities.public_url &&
      result.capabilities.remote_health &&
      result.errors.length === 0;
  } catch (error) {
    result.errors.push(messageOf(error));
  }

  result.blockers = unique(result.blockers);
  result.warnings = unique(result.warnings);
  result.errors = unique(result.errors);
  result.ok = result.can_publish_dynamic;
  result.finished_at = new Date().toISOString();
  if (outPath) writeJson(outPath, result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

function checkFilesystem(appsRoot, stateRoot, record, result) {
  if (!appsRoot || !stateRoot) return;
  const posixPathOnWindows = os.platform() === "win32" && [appsRoot, stateRoot]
    .some(value => /^\/(?:opt|srv|var|home)\//.test(value.replace(/\\/g, "/")));
  record(
    "profile_filesystem_visible",
    !posixPathOnWindows,
    posixPathOnWindows ? "POSIX appsRoot/stateRoot is not visible from this Windows runner: " + appsRoot + " / " + stateRoot : appsRoot + " / " + stateRoot,
    "error",
    "profile_filesystem_not_visible"
  );
  if (posixPathOnWindows) return;

  const resolved = path.resolve(appsRoot);
  const exists = fs.existsSync(resolved);
  record("apps_root_exists", exists, resolved, "error", "dynamic_host_not_installed");
  if (!exists) return;
  const isDirectory = fs.statSync(resolved).isDirectory();
  record("apps_root_is_directory", isDirectory, resolved, "error", "dynamic_apps_root_invalid");
  if (!isDirectory) return;
  const writable = canWrite(resolved);
  record("apps_root_writable", writable, resolved, "error", "dynamic_apps_root_not_writable");
  if (writable && flagEnabled(rawArgs["probe-write"])) {
    record("apps_root_probe_write", probeWrite(resolved), resolved, "error", "dynamic_apps_root_probe_failed");
  }
  const resolvedStateRoot = path.resolve(stateRoot);
  const stateExists = fs.existsSync(resolvedStateRoot);
  record("state_root_exists", stateExists, resolvedStateRoot, "error", "dynamic_state_root_missing");
  const stateIsDirectory = stateExists && fs.statSync(resolvedStateRoot).isDirectory();
  record("state_root_is_directory", stateIsDirectory, resolvedStateRoot, "error", "dynamic_state_root_invalid");
  result.capabilities.writable_state = stateIsDirectory;
}

async function checkHostHealth(effective, record, result) {
  const healthUrl = effective.host_health_url;
  if (!healthUrl) return;
  if (flagEnabled(rawArgs["skip-host-health"])) {
    record("host_health_skipped", false, "--skip-host-health is diagnostic only", "warning", "");
    return;
  }
  try {
    const response = await fetchWithTimeout(healthUrl, Number(rawArgs["timeout-ms"] || 12000));
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {}
    result.host_health = {
      url: healthUrl,
      status: response.status,
      ok: response.ok,
      body
    };
    record("host_health_http_ok", response.ok, response.status + " " + response.statusText, "error", "dynamic_host_health_unreachable");
    if (!response.ok) return;
    record("host_health_json", Boolean(body), text.slice(0, 180), "error", "dynamic_host_health_invalid");
    if (!body) return;
    record("host_health_contract", body.contract_version === "cloud-mini-app.host-health.v1", body.contract_version || "missing", "error", "dynamic_host_health_contract_mismatch");
    record("host_health_ok", body.ok === true, JSON.stringify(body), "error", "dynamic_host_unhealthy");
    record("host_runtime_supported", body.runtime === MINI_APP_HOST_RUNTIME, body.runtime || "missing", "error", "dynamic_host_runtime_mismatch");
    const capabilities = body.capabilities && typeof body.capabilities === "object" ? body.capabilities : {};
    record("host_writable_state", capabilities.writable_state === true, JSON.stringify(capabilities), "error", "dynamic_host_state_unavailable");
    record("host_versioning", capabilities.versioning === true, JSON.stringify(capabilities), "error", "dynamic_host_versioning_unavailable");
    record("host_shared_state_across_versions", capabilities.shared_state_across_versions === true, JSON.stringify(capabilities), "error", "dynamic_host_state_lifecycle_mismatch");
    record("host_public_url", capabilities.public_url === true, JSON.stringify(capabilities), "error", "dynamic_host_public_url_unavailable");
    result.capabilities.runtime = body.runtime === MINI_APP_HOST_RUNTIME;
    result.capabilities.writable_state = result.capabilities.writable_state && capabilities.writable_state === true;
    result.capabilities.versioning = capabilities.versioning === true;
    result.capabilities.shared_state_across_versions = capabilities.shared_state_across_versions === true;
    result.capabilities.public_url = capabilities.public_url === true;
    result.capabilities.remote_health = response.ok && body.ok === true;
  } catch (error) {
    record("host_health_request", false, messageOf(error), "error", "dynamic_host_health_unreachable");
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
  } finally {
    clearTimeout(timer);
  }
}

function canWrite(target) {
  try {
    fs.accessSync(target, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function probeWrite(target) {
  const probePath = path.join(target, ".mini-app-provider-probe-" + process.pid + "-" + Date.now());
  try {
    fs.writeFileSync(probePath, "probe\n", "utf8");
    fs.rmSync(probePath, { force: true });
    return true;
  } catch {
    return false;
  }
}

function blockerCodes(errors) {
  return errors.map(error => String(error).split(":", 1)[0]).filter(value => /^[a-z0-9_]+$/.test(value));
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
