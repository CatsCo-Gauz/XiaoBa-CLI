#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateMiniAppSpec } from "./mini-app-contract.mjs";
import { migrateMiniAppState } from "./mini-app-state.mjs";
import { upsertArtifactIndex } from "./artifact-index-lib.mjs";
import {
  flagEnabled,
  mergeMiniAppPublishProfile,
  summarizeMiniAppPublishProfile,
  validateMiniAppPublishProfile
} from "./mini-app-publish-profile.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = parseArgs(process.argv.slice(2));
const appDir = path.resolve(rawArgs["app-dir"] || rawArgs._[0] || "");
const outPath = path.resolve(rawArgs.out || path.join(appDir || process.cwd(), "publish-mini-app-result.json"));

main();

function main() {
  const result = {
    ok: false,
    contract_version: "cloud-mini-app.publish-result.v1",
    provider: "dynamic-dir",
    published: false,
    app_id: "",
    version: 0,
    version_url: "",
    latest_url: "",
    deploy_path: "",
    state_path: "",
    state_migration: null,
    profile: null,
    gates: {
      local_qa: null,
      provider_preflight: null,
      state_compatibility: null,
      remote_qa: null,
      latest_remote_qa: null
    },
    warnings: [],
    errors: [],
    started_at: new Date().toISOString(),
    finished_at: ""
  };

  let cleanup = null;
  let releasePublishLock = null;
  try {
    assertAppDir(appDir);
    if (!rawArgs.profile) throw new Error("--profile <dynamic-profile.json> is required");
    const args = mergeMiniAppPublishProfile(rawArgs);
    const profileValidation = validateMiniAppPublishProfile(args, { allowPrivateUrls: flagEnabled(rawArgs["allow-private-url"]) });
    if (!profileValidation.ok) throw new Error("invalid dynamic profile: " + profileValidation.errors.join("; "));
    result.profile = summarizeMiniAppPublishProfile(args);

    const spec = readJson(path.join(appDir, "app-spec.json"));
    const specValidation = validateMiniAppSpec(spec);
    if (!specValidation.ok) throw new Error("invalid mini app spec: " + specValidation.errors.join("; "));
    result.app_id = spec.app_id;

    const localQaPath = path.resolve(rawArgs["local-qa"] || path.join(appDir, "qa-mini-app-result.json"));
    result.gates.local_qa = validateLocalQa(localQaPath, spec);
    if (!result.gates.local_qa.ok) throw new Error("local mini app QA gate failed: " + result.gates.local_qa.errors.join("; "));

    result.gates.provider_preflight = runJsonScript("check-mini-app-provider.mjs", [
      "--profile", args.profile,
      "--probe-write",
      ...(rawArgs["allow-private-url"] ? ["--allow-private-url"] : []),
      ...(rawArgs["node-modules"] ? ["--node-modules", String(rawArgs["node-modules"])] : [])
    ]);
    if (!result.gates.provider_preflight.ok || !result.gates.provider_preflight.data?.can_publish_dynamic) {
      const blockers = result.gates.provider_preflight.data?.blockers || [];
      throw new Error("dynamic provider preflight failed: " + (blockers.join(", ") || result.gates.provider_preflight.error || "unknown"));
    }

    const appsRoot = path.resolve(profileValidation.effective.apps_root);
    const stateRoot = path.resolve(profileValidation.effective.state_root);
    const appRoot = safeResolve(appsRoot, spec.app_id);
    fs.mkdirSync(appRoot, { recursive: true });
    releasePublishLock = acquirePublishLock(safeResolve(appRoot, ".publish.lock"));
    const versionsRoot = safeResolve(appRoot, "versions");
    fs.mkdirSync(versionsRoot, { recursive: true });
    const version = resolveVersion(versionsRoot, rawArgs.version);
    const versionRef = "v" + version;
    const versionPath = safeResolve(versionsRoot, versionRef);
    if (fs.existsSync(versionPath)) throw new Error("mini app version already exists: " + versionRef);
    const stagePath = safeResolve(versionsRoot, ".stage-" + versionRef + "-" + process.pid + "-" + Date.now());
    const statePath = safeResolve(stateRoot, spec.app_id, "state.json");
    const stateExisted = fs.existsSync(statePath);
    const previousState = stateExisted ? fs.readFileSync(statePath, "utf8") : "";
    const latestPath = safeResolve(appRoot, "latest.json");
    const previousLatest = fs.existsSync(latestPath) ? fs.readFileSync(latestPath, "utf8") : "";
    cleanup = () => {
      if (fs.existsSync(stagePath)) fs.rmSync(stagePath, { recursive: true, force: true });
      if (fs.existsSync(versionPath)) fs.rmSync(versionPath, { recursive: true, force: true });
      if (stateExisted) fs.writeFileSync(statePath, previousState, "utf8");
      else if (fs.existsSync(path.dirname(statePath))) fs.rmSync(path.dirname(statePath), { recursive: true, force: true });
      restoreLatest(latestPath, previousLatest);
    };

    stageVersion({ appDir, stagePath, spec, specValidation, version });
    fs.renameSync(stagePath, versionPath);
    const currentSpec = previousLatest ? readPreviousPublishedSpec(appRoot, previousLatest) : null;
    const currentState = stateExisted ? JSON.parse(previousState) : null;
    const migration = migrateMiniAppState({
      currentSpec,
      nextSpec: spec,
      currentState,
      nextSeed: spec.seed,
      allowDestructive: flagEnabled(rawArgs["allow-destructive-state-migration"])
    });
    result.state_migration = publicStateMigration(migration);
    result.gates.state_compatibility = {
      ok: migration.ok,
      changed: migration.changed,
      errors: migration.errors,
      warnings: migration.warnings
    };
    result.warnings.push(...migration.warnings);
    if (!migration.ok) throw new Error("cloud state migration blocked: " + migration.errors.join("; "));
    writeJsonAtomic(statePath, migration.state);
    const publicBaseUrl = profileValidation.effective.public_base_url;
    const versionUrl = publicBaseUrl + "/" + encodeURIComponent(spec.app_id) + "/" + versionRef + "/";
    const latestUrl = publicBaseUrl + "/" + encodeURIComponent(spec.app_id) + "/latest/";
    result.version = version;
    result.version_url = versionUrl;
    result.latest_url = latestUrl;
    result.deploy_path = versionPath;
    result.state_path = statePath;

    if (!flagEnabled(rawArgs["skip-remote-qa"])) {
      result.gates.remote_qa = runRemoteQa(versionUrl, spec.app_id, "version", rawArgs);
      if (!result.gates.remote_qa.ok) throw new Error("version URL remote QA failed: " + (result.gates.remote_qa.error || "checks failed"));
    } else {
      result.gates.remote_qa = { ok: false, skipped: true, error: "remote QA skipped" };
      if (profileValidation.effective.require_remote_qa) throw new Error("profile requires remote QA; --skip-remote-qa is not allowed");
    }

    writeJsonAtomic(latestPath, {
      contract_version: "cloud-mini-app.latest-pointer.v1",
      app_id: spec.app_id,
      version,
      updated_at: new Date().toISOString()
    });

    result.gates.latest_remote_qa = runRemoteQa(latestUrl, spec.app_id, "latest", { ...rawArgs, "skip-browser": true, "no-screenshot": true });
    if (!result.gates.latest_remote_qa.ok) throw new Error("latest URL remote QA failed: " + (result.gates.latest_remote_qa.error || "checks failed"));

    if (profileValidation.effective.artifact_index) {
      upsertArtifactIndex({
        indexPath: profileValidation.effective.artifact_index,
        artifact: {
          id: spec.app_id,
          title: spec.title,
          kind: "mini_app",
          url: latestUrl,
          updated_at: new Date().toISOString()
        }
      });
    }

    result.published = true;
    result.ok = true;
    result.warnings.push("public_demo_has_no_authentication");
    cleanup = null;
  } catch (error) {
    result.errors.push(messageOf(error));
    if (cleanup) {
      try {
        cleanup();
      } catch (cleanupError) {
        result.errors.push("publish cleanup failed: " + messageOf(cleanupError));
      }
    }
  }

  if (releasePublishLock) {
    try {
      releasePublishLock();
    } catch (error) {
      result.errors.push("publish lock release failed: " + messageOf(error));
      result.ok = false;
      result.published = false;
    }
  }

  result.warnings = unique(result.warnings);
  result.errors = unique(result.errors);
  result.finished_at = new Date().toISOString();
  writeJson(outPath, result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

function stageVersion({ appDir: sourceDir, stagePath, spec, specValidation, version }) {
  fs.mkdirSync(stagePath, { recursive: true });
  fs.copyFileSync(path.join(sourceDir, "app-spec.json"), path.join(stagePath, "app-spec.json"));
  fs.cpSync(path.join(sourceDir, "public"), path.join(stagePath, "public"), { recursive: true, force: true });
  fs.copyFileSync(path.join(sourceDir, specValidation.resolved.seed_file), path.join(stagePath, "seed.json"));
  writeJson(path.join(stagePath, "deployment.json"), {
    contract_version: "cloud-mini-app.deployment.v1",
    app_id: spec.app_id,
    version,
    runtime: "node-json-host-v1",
    deployed_at: new Date().toISOString()
  });
}

function readPreviousPublishedSpec(appRoot, previousLatest) {
  let latest;
  try {
    latest = JSON.parse(previousLatest);
  } catch (error) {
    throw new Error("existing latest pointer is invalid: " + messageOf(error));
  }
  const version = Number(latest.version);
  if (!Number.isInteger(version) || version < 1) throw new Error("existing latest pointer version is invalid");
  const specPath = safeResolve(appRoot, "versions", "v" + version, "app-spec.json");
  if (!fs.existsSync(specPath)) throw new Error("existing latest app spec is missing: v" + version);
  const spec = readJson(specPath);
  const validation = validateMiniAppSpec(spec);
  if (!validation.ok) throw new Error("existing latest app spec is invalid: " + validation.errors.join("; "));
  return spec;
}

function publicStateMigration(migration) {
  return {
    ok: migration.ok,
    contract_version: migration.contract_version,
    changed: migration.changed,
    analysis: migration.analysis,
    summary: migration.summary,
    errors: migration.errors,
    warnings: migration.warnings
  };
}

function validateLocalQa(qaPath, spec) {
  const gate = { ok: false, path: qaPath, checks: 0, errors: [] };
  if (!fs.existsSync(qaPath)) {
    gate.errors.push("qa report not found");
    return gate;
  }
  const qa = readJson(qaPath);
  gate.checks = Array.isArray(qa.checks) ? qa.checks.length : 0;
  if (qa.ok !== true) gate.errors.push("qa report ok is not true");
  if (qa.app_id !== spec.app_id) gate.errors.push("qa app_id mismatch");
  if (qa.browser?.required !== true) gate.errors.push("full browser QA is required");
  const requiredChecks = [
    "state_persisted_after_restart",
    "browser_page_nonblank",
    "browser_screenshot_written",
    "browser_mobile_no_horizontal_overflow",
    "browser_mobile_screenshot_written",
    "browser_console_clean",
    "qa_state_restored"
  ];
  const firstEntity = spec.entities?.[0];
  const firstRows = firstEntity && Array.isArray(spec.seed?.[firstEntity.id]) ? spec.seed[firstEntity.id] : [];
  if (spec.features?.includes("task-checklist") && firstRows.some(row => Array.isArray(row?.tasks) && row.tasks.length)) {
    requiredChecks.push("browser_task_persists_after_reload");
  }
  if (["create", "edit", "delete"].every(feature => spec.features?.includes(feature))) {
    requiredChecks.push("browser_create_persists_after_reload", "browser_edit_persists_after_reload", "browser_delete_persists_after_reload");
  }
  const checkMap = new Map((qa.checks || []).map(check => [check.name, check.pass]));
  for (const name of requiredChecks) if (checkMap.get(name) !== true) gate.errors.push("required check missing or failed: " + name);
  const sourceFiles = [
    path.join(appDir, "app-spec.json"),
    path.join(appDir, "server.js"),
    path.join(appDir, "public", "index.html"),
    path.join(appDir, "public", "app.js"),
    path.join(appDir, "public", "styles.css"),
    path.join(appDir, spec.storage.seed_file)
  ];
  const qaMtime = fs.statSync(qaPath).mtimeMs;
  const newestSource = Math.max(...sourceFiles.map(filePath => fs.statSync(filePath).mtimeMs));
  if (qaMtime < newestSource) gate.errors.push("qa report is stale relative to generated app files");
  gate.ok = gate.errors.length === 0;
  return gate;
}

function runRemoteQa(url, appId, label, options) {
  const qaOut = path.join(path.dirname(outPath), "remote-qa-" + label + ".json");
  const qaArgs = [
    "--url", url,
    "--expected-app-id", appId,
    "--out", qaOut,
    ...(options["allow-private-url"] ? ["--allow-private-url"] : []),
    ...(options["skip-browser"] ? ["--skip-browser"] : []),
    ...(options["no-screenshot"] ? ["--no-screenshot"] : []),
    ...(options.screenshot ? ["--screenshot", String(options.screenshot)] : []),
    ...(options["node-modules"] ? ["--node-modules", String(options["node-modules"])] : []),
    ...(options["browser-channel"] ? ["--browser-channel", String(options["browser-channel"])] : [])
  ];
  const completed = spawnSync(process.execPath, [path.join(scriptDir, "qa-remote-mini-app.mjs"), ...qaArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: Number(options["qa-timeout-ms"] || 120000)
  });
  const data = parseJsonMaybe(completed.stdout);
  return {
    ok: completed.status === 0 && data?.ok === true,
    path: qaOut,
    data,
    error: completed.error?.message || String(completed.stderr || "").trim() || (data?.errors || []).join("; ")
  };
}

function runJsonScript(scriptName, scriptArgs) {
  const completed = spawnSync(process.execPath, [path.join(scriptDir, scriptName), ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000
  });
  const data = parseJsonMaybe(completed.stdout);
  return {
    ok: completed.status === 0 && data?.ok === true,
    data,
    error: completed.error?.message || String(completed.stderr || "").trim()
  };
}

function resolveVersion(versionsRoot, requested) {
  if (requested !== undefined) {
    const value = Number(requested);
    if (!Number.isInteger(value) || value < 1) throw new Error("--version must be a positive integer");
    return value;
  }
  const versions = fs.existsSync(versionsRoot)
    ? fs.readdirSync(versionsRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && /^v[1-9]\d*$/.test(entry.name))
        .map(entry => Number(entry.name.slice(1)))
    : [];
  return versions.length ? Math.max(...versions) + 1 : 1;
}

function restoreLatest(latestPath, previousText) {
  if (previousText) {
    fs.mkdirSync(path.dirname(latestPath), { recursive: true });
    fs.writeFileSync(latestPath, previousText, "utf8");
  } else {
    fs.rmSync(latestPath, { force: true });
  }
}

function acquirePublishLock(lockPath) {
  const token = process.pid + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  const payload = {
    contract_version: "cloud-mini-app.publish-lock.v1",
    token,
    pid: process.pid,
    hostname: os.hostname(),
    created_at: new Date().toISOString()
  };
  const attempt = () => fs.writeFileSync(lockPath, JSON.stringify(payload, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  try {
    attempt();
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
    const staleMs = Number(rawArgs["stale-lock-ms"] || 30 * 60 * 1000);
    if (!flagEnabled(rawArgs["break-stale-lock"]) || !Number.isFinite(staleMs) || ageMs < staleMs) {
      throw new Error("publish_in_progress: lock exists at " + lockPath + "; age_ms=" + Math.round(ageMs));
    }
    fs.rmSync(lockPath, { force: true });
    attempt();
  }
  return () => {
    if (!fs.existsSync(lockPath)) return;
    const current = readJson(lockPath);
    if (current.token !== token) throw new Error("publish lock token changed before release");
    fs.rmSync(lockPath, { force: true });
  };
}

function assertAppDir(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error("mini app directory not found: " + dir);
  for (const rel of ["app-spec.json", "public/index.html", "public/app.js", "public/styles.css"]) {
    if (!fs.existsSync(path.join(dir, rel))) throw new Error("required mini app file missing: " + rel);
  }
}

function safeResolve(root, ...parts) {
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("resolved path escapes apps root: " + target);
  return target;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = filePath + ".tmp-" + process.pid + "-" + Date.now();
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  try {
    fs.renameSync(tempPath, filePath);
  } catch {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
  }
}

function parseJsonMaybe(text) {
  try {
    return JSON.parse(String(text || "").trim());
  } catch {
    return null;
  }
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
