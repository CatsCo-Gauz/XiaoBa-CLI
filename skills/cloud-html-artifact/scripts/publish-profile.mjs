import fs from "node:fs";
import path from "node:path";

const KEY_ALIASES = {
  provider: "provider",
  staticRoot: "static-root",
  static_root: "static-root",
  publicBaseUrl: "public-base-url",
  public_base_url: "public-base-url",
  publishCommand: "publish-command",
  publish_command: "publish-command",
  requireUploadResult: "require-upload-result",
  require_upload_result: "require-upload-result",
  uploadResultRequired: "require-upload-result",
  upload_result_required: "require-upload-result",
  requiredEnv: "required-env",
  required_env: "required-env",
  requiredEnvironment: "required-env",
  required_environment: "required-env",
  versioned: "versioned",
  remoteUrlQa: "remote-url-qa",
  remote_url_qa: "remote-url-qa",
  requireRemoteUrlQa: "require-remote-url-qa",
  require_remote_url_qa: "require-remote-url-qa",
  skipLatestRemoteUrlQa: "skip-latest-remote-url-qa",
  skip_latest_remote_url_qa: "skip-latest-remote-url-qa",
  remoteUrl: "remote-url",
  remote_url: "remote-url",
  remoteUrlTimeoutMs: "remote-url-timeout-ms",
  remote_url_timeout_ms: "remote-url-timeout-ms",
  requirePublished: "require-published",
  require_published: "require-published",
  skipGates: "skip-gates",
  skip_gates: "skip-gates",
  skipBrowserQa: "skip-browser-qa",
  skip_browser_qa: "skip-browser-qa",
  captureBrowserScreenshot: "capture-browser-screenshot",
  capture_browser_screenshot: "capture-browser-screenshot",
  browserScreenshot: "browser-screenshot",
  browser_screenshot: "browser-screenshot",
  nodeModules: "node-modules",
  node_modules: "node-modules",
  registry: "registry"
};

const PATH_KEYS = new Set(["static-root", "browser-screenshot", "node-modules", "registry"]);

export function mergePublishProfile(args, options = {}) {
  const profileValue = args.profile || args["publish-profile"];
  if (!profileValue) return { ...args };

  const profilePath = resolveProfilePath(String(profileValue), options);
  const profile = readProfile(profilePath);
  const normalized = normalizeProfile(profile, path.dirname(profilePath));
  const merged = {
    ...normalized,
    ...args,
    profile: profilePath,
    profileName: profile.name || path.basename(profilePath, path.extname(profilePath))
  };
  delete merged["publish-profile"];
  return merged;
}

export function summarizePublishProfile(args) {
  if (!args.profile) return null;
  return {
    path: args.profile,
    name: args.profileName || "",
    provider: args.provider || "",
    public_base_url: args["public-base-url"] || "",
    static_root: args["static-root"] || "",
    publish_command_configured: Boolean(args["publish-command"]),
    require_upload_result: args["require-upload-result"] ?? null,
    required_env: normalizeRequiredEnv(args["required-env"]),
    versioned: args.versioned ?? null,
    remote_url_qa: args["remote-url-qa"] ?? null,
    require_remote_url_qa: args["require-remote-url-qa"] ?? null,
    require_published: args["require-published"] ?? null,
    registry: args.registry || ""
  };
}

export function normalizeRequiredEnv(value) {
  if (value === undefined || value === null || value === false) return [];
  const values = Array.isArray(value)
    ? value
    : String(value).split(/[\s,]+/);
  return Array.from(new Set(values.map(item => String(item || "").trim()).filter(Boolean)));
}

export function missingRequiredEnv(value, env = process.env) {
  return normalizeRequiredEnv(value).filter(name => !String(env[name] || "").trim());
}

function readProfile(profilePath) {
  if (!fs.existsSync(profilePath)) throw new Error(`publish profile not found: ${profilePath}`);
  try {
    const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw new Error("profile root must be a JSON object");
    }
    return profile;
  } catch (error) {
    throw new Error(`publish profile unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeProfile(profile, profileDir) {
  const source = {
    ...(profile.publish || {}),
    ...(profile.providerConfig || {}),
    ...profile
  };
  delete source.publish;
  delete source.providerConfig;

  const normalized = {};
  for (const [key, value] of Object.entries(source)) {
    const targetKey = KEY_ALIASES[key] || key;
    if (value === undefined || value === null || value === "") continue;
    if (targetKey === "required-env") {
      const requiredEnv = normalizeRequiredEnv(value);
      if (requiredEnv.length) normalized[targetKey] = requiredEnv;
      continue;
    }
    normalized[targetKey] = PATH_KEYS.has(targetKey) && typeof value === "string"
      ? resolveProfilePathValue(value, profileDir)
      : value;
  }
  return normalized;
}

function resolveProfilePath(value, options = {}) {
  const candidates = [];
  const raw = value.trim();
  const hasPathSyntax = raw.includes("/") || raw.includes("\\") || path.extname(raw);
  if (path.isAbsolute(raw) || hasPathSyntax) {
    candidates.push(path.resolve(options.cwd || process.cwd(), raw));
  } else {
    const profileDirs = [
      process.env.ARTIFACT_PROFILE_DIR,
      options.profileDir,
      path.join(process.cwd(), "work", "cloud-html-artifact-profiles"),
      path.join(process.cwd(), "skills", "cloud-html-artifact", "examples"),
      process.cwd()
    ].filter(Boolean);
    for (const dir of profileDirs) {
      candidates.push(path.resolve(dir, raw));
      candidates.push(path.resolve(dir, `${raw}.json`));
    }
  }
  const found = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return found ? found : candidates[0];
}

function resolveProfilePathValue(value, profileDir) {
  const text = value.trim();
  if (!text || /^https?:\/\//i.test(text) || path.isAbsolute(text)) return text;
  return path.resolve(profileDir, text);
}
