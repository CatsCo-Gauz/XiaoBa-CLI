import fs from "node:fs";
import path from "node:path";

export const MINI_APP_PUBLISH_PROFILE_VERSION = "cloud-mini-app.publish-profile.v1";
export const MINI_APP_DYNAMIC_PROVIDER = "dynamic-dir";
export const MINI_APP_HOST_RUNTIME = "node-json-host-v1";

const KEY_ALIASES = {
  contract_version: "contract-version",
  contractVersion: "contract-version",
  name: "profile-name",
  provider: "provider",
  runtime: "runtime",
  appsRoot: "apps-root",
  apps_root: "apps-root",
  stateRoot: "state-root",
  state_root: "state-root",
  artifactRegistry: "artifact-registry",
  artifact_registry: "artifact-registry",
  artifactIndex: "artifact-index",
  artifact_index: "artifact-index",
  publicBaseUrl: "public-base-url",
  public_base_url: "public-base-url",
  hostHealthUrl: "host-health-url",
  host_health_url: "host-health-url",
  versioned: "versioned",
  preserveStateOnUpdate: "preserve-state-on-update",
  preserve_state_on_update: "preserve-state-on-update",
  remoteQa: "remote-qa",
  remote_qa: "remote-qa",
  requireRemoteQa: "require-remote-qa",
  require_remote_qa: "require-remote-qa",
  requiredEnv: "required-env",
  required_env: "required-env"
};

const PATH_KEYS = new Set(["apps-root", "state-root", "artifact-registry", "artifact-index"]);

export function mergeMiniAppPublishProfile(args, options = {}) {
  const profileValue = args.profile || args["publish-profile"];
  if (!profileValue) return { ...args };
  const profilePath = resolveProfilePath(String(profileValue), options);
  const profile = readProfile(profilePath);
  const normalized = normalizeProfile(profile, path.dirname(profilePath));
  const merged = {
    ...normalized,
    ...args,
    profile: profilePath,
    "profile-name": args["profile-name"] || normalized["profile-name"] || path.basename(profilePath, path.extname(profilePath))
  };
  delete merged["publish-profile"];
  return merged;
}

export function validateMiniAppPublishProfile(args, options = {}) {
  const checks = [];
  const errors = [];
  const warnings = [];
  const record = (name, pass, detail = "", level = "error", blocker = "") => {
    checks.push({ name, pass: Boolean(pass), detail, level, blocker });
    if (pass) return;
    const message = detail ? name + ": " + detail : name;
    if (level === "warning") warnings.push(message);
    else errors.push(blocker ? blocker + ": " + message : message);
  };

  const contractVersion = cleanText(args["contract-version"] || args.contract_version);
  const name = cleanText(args["profile-name"] || args.name);
  const provider = cleanText(args.provider);
  const runtime = cleanText(args.runtime);
  const appsRoot = cleanText(args["apps-root"]);
  const stateRoot = cleanText(args["state-root"]);
  const artifactRegistry = cleanText(args["artifact-registry"]);
  const artifactIndex = cleanText(args["artifact-index"]);
  const publicBaseUrl = cleanUrl(args["public-base-url"]);
  const hostHealthUrl = cleanUrl(args["host-health-url"]);
  const requiredEnv = normalizeRequiredEnv(args["required-env"]);
  const missingEnv = requiredEnv.filter(envName => !cleanText((options.env || process.env)[envName]));

  record("contract_version_supported", contractVersion === MINI_APP_PUBLISH_PROFILE_VERSION, contractVersion || "missing", "error", "unsupported_profile_contract");
  record("profile_name_valid", /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name), name || "missing", "error", "invalid_profile_name");
  record("provider_supported", provider === MINI_APP_DYNAMIC_PROVIDER, provider || "missing", "error", "unsupported_dynamic_provider");
  record("runtime_supported", runtime === MINI_APP_HOST_RUNTIME, runtime || "missing", "error", "unsupported_dynamic_runtime");
  record("apps_root_configured", Boolean(appsRoot), "appsRoot is required", "error", "dynamic_apps_root_required");
  record("state_root_configured", Boolean(stateRoot), "stateRoot is required", "error", "dynamic_state_root_required");
  record("deployment_and_state_roots_differ", Boolean(appsRoot && stateRoot && path.resolve(appsRoot) !== path.resolve(stateRoot)), appsRoot + " / " + stateRoot, "error", "dynamic_roots_must_differ");
  record("artifact_registry_path_valid", !artifactRegistry || path.resolve(artifactRegistry) !== path.resolve(appsRoot), artifactRegistry || "not configured", "error", "artifact_registry_path_invalid");
  record("artifact_index_path_valid", !artifactIndex || path.extname(artifactIndex).toLowerCase() === ".json", artifactIndex || "not configured", "error", "artifact_index_path_invalid");
  validatePublicUrl(publicBaseUrl, "public_base_url", record, options);
  validatePublicUrl(hostHealthUrl, "host_health_url", record, options);
  record("versioning_required", flagEnabled(args.versioned), "versioned must be true", "error", "dynamic_versioning_required");
  record("preserve_state_on_update_required", flagEnabled(args["preserve-state-on-update"]), "preserveStateOnUpdate must be true", "error", "state_preservation_required");
  record("remote_qa_enabled", flagEnabled(args["remote-qa"]), "remoteQa must be true", "error", "remote_qa_required");
  record("remote_qa_required", flagEnabled(args["require-remote-qa"]), "requireRemoteQa must be true", "error", "remote_qa_required");

  const invalidEnv = requiredEnv.filter(nameValue => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(nameValue));
  record("required_env_names_valid", invalidEnv.length === 0, invalidEnv.join(", "), "error", "invalid_required_env");
  record("required_env_present", missingEnv.length === 0, missingEnv.join(", "), "error", "missing_required_env");

  if (publicBaseUrl && hostHealthUrl) {
    const publicOrigin = originOf(publicBaseUrl);
    const healthOrigin = originOf(hostHealthUrl);
    record("health_url_same_origin", publicOrigin === healthOrigin, publicOrigin + " / " + healthOrigin, "warning");
  }

  return {
    ok: errors.length === 0,
    checks,
    errors: unique(errors),
    warnings: unique(warnings),
    effective: {
      contract_version: contractVersion,
      name,
      provider,
      runtime,
      apps_root: appsRoot,
      state_root: stateRoot,
      artifact_registry: artifactRegistry,
      artifact_index: artifactIndex,
      public_base_url: publicBaseUrl,
      host_health_url: hostHealthUrl,
      versioned: flagEnabled(args.versioned),
      preserve_state_on_update: flagEnabled(args["preserve-state-on-update"]),
      remote_qa: flagEnabled(args["remote-qa"]),
      require_remote_qa: flagEnabled(args["require-remote-qa"]),
      required_env: requiredEnv,
      missing_required_env: missingEnv
    }
  };
}

export function summarizeMiniAppPublishProfile(args) {
  return {
    path: args.profile || "",
    contract_version: cleanText(args["contract-version"]),
    name: cleanText(args["profile-name"]),
    provider: cleanText(args.provider),
    runtime: cleanText(args.runtime),
    apps_root: cleanText(args["apps-root"]),
    state_root: cleanText(args["state-root"]),
    artifact_registry: cleanText(args["artifact-registry"]),
    artifact_index: cleanText(args["artifact-index"]),
    public_base_url: cleanUrl(args["public-base-url"]),
    host_health_url: cleanUrl(args["host-health-url"]),
    versioned: flagEnabled(args.versioned),
    preserve_state_on_update: flagEnabled(args["preserve-state-on-update"]),
    remote_qa: flagEnabled(args["remote-qa"]),
    require_remote_qa: flagEnabled(args["require-remote-qa"]),
    required_env: normalizeRequiredEnv(args["required-env"])
  };
}

export function normalizeRequiredEnv(value) {
  if (value === undefined || value === null || value === false) return [];
  const values = Array.isArray(value) ? value : String(value).split(/[\s,]+/);
  return unique(values.map(item => cleanText(item)).filter(Boolean));
}

export function flagEnabled(value) {
  if (value === undefined || value === false || value === null) return false;
  if (value === true) return true;
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

export function isPublicHttpUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (!host || host === "localhost" || host === "::1" || host.endsWith(".local")) return false;
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
    const match172 = host.match(/^172\.(\d+)\./);
    if (match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31) return false;
    if (/^(?:[^.]+\.)?example\.(?:test|com|org|net)$/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function validatePublicUrl(value, label, record, options) {
  record(label + "_configured", Boolean(value), label + " is required", "error", label + "_required");
  if (!value) return;
  record(label + "_http", /^https?:\/\//i.test(value), value, "error", label + "_invalid");
  record(label + "_public", options.allowPrivateUrls || isPublicHttpUrl(value), value, "error", label + "_must_be_public");
  record(label + "_https", /^https:\/\//i.test(value), value, "warning");
}

function normalizeProfile(profile, profileDir) {
  const normalized = {};
  for (const [key, value] of Object.entries(profile)) {
    const target = KEY_ALIASES[key] || key;
    if (value === undefined || value === null || value === "") continue;
    if (target === "required-env") {
      normalized[target] = normalizeRequiredEnv(value);
      continue;
    }
    normalized[target] = PATH_KEYS.has(target) && typeof value === "string"
      ? resolvePathValue(value, profileDir)
      : value;
  }
  return normalized;
}

function resolveProfilePath(value, options) {
  const raw = cleanText(value);
  const candidates = [];
  const hasPathSyntax = raw.includes("/") || raw.includes("\\") || Boolean(path.extname(raw));
  if (path.isAbsolute(raw) || hasPathSyntax) {
    candidates.push(path.resolve(options.cwd || process.cwd(), raw));
  } else {
    const dirs = [
      process.env.MINI_APP_PROFILE_DIR,
      options.profileDir,
      path.join(process.cwd(), "work", "cloud-mini-app-profiles"),
      path.join(process.cwd(), "skills", "cloud-html-artifact", "examples"),
      process.cwd()
    ].filter(Boolean);
    for (const dir of dirs) {
      candidates.push(path.resolve(dir, raw));
      candidates.push(path.resolve(dir, raw + ".json"));
    }
  }
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || candidates[0];
}

function readProfile(profilePath) {
  if (!profilePath || !fs.existsSync(profilePath)) throw new Error("mini app publish profile not found: " + profilePath);
  const value = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("mini app publish profile root must be an object");
  return value;
}

function resolvePathValue(value, profileDir) {
  const text = cleanText(value);
  if (!text || path.isAbsolute(text)) return text;
  return path.resolve(profileDir, text);
}

function cleanUrl(value) {
  return cleanText(value).replace(/\/+$/, "");
}

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values) {
  return Array.from(new Set(values));
}
