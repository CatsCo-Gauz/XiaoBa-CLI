import fs from "node:fs";
import path from "node:path";
import { resolveRuntimeAgentUid } from "./direct-host-runtime.mjs";

const KEY_ALIASES = {
  provider: "provider",
  staticRoot: "static-root",
  static_root: "static-root",
  publicBaseUrl: "public-base-url",
  public_base_url: "public-base-url",
  localQaBaseUrl: "local-qa-base-url",
  local_qa_base_url: "local-qa-base-url",
  publishEndpoint: "publish-endpoint",
  publish_endpoint: "publish-endpoint",
  artifactIndex: "artifact-index",
  artifact_index: "artifact-index",
  artifactManagementRegistry: "artifact-management-registry",
  artifact_management_registry: "artifact-management-registry",
  artifactManagementRoot: "artifact-management-root",
  artifact_management_root: "artifact-management-root",
  artifactTrashRoot: "artifact-trash-root",
  artifact_trash_root: "artifact-trash-root",
  namespaceStrategy: "namespace-strategy",
  namespace_strategy: "namespace-strategy",
  agentUid: "agent-uid",
  agent_uid: "agent-uid",
  agentName: "agent-name",
  agent_name: "agent-name",
  ownerUid: "owner-uid",
  owner_uid: "owner-uid",
  sourceTopicId: "source-topic-id",
  source_topic_id: "source-topic-id",
  sourceTitle: "source-title",
  source_title: "source-title",
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

const PATH_KEYS = new Set([
  "static-root",
  "artifact-index",
  "artifact-management-registry",
  "artifact-management-root",
  "artifact-trash-root",
  "browser-screenshot",
  "node-modules",
  "registry"
]);

export function mergePublishProfile(args, options = {}) {
  const env = options.env || process.env;
  const profileValue = args.profile || args["publish-profile"];
  if (!profileValue && !hasInlinePublishProfile(args)) {
    if (options.directHost) {
      const directHost = normalizeDirectHost(options.directHost);
      return derivePublishRuntimeProfile({
        ...args,
        provider: "direct-ip",
        "static-root": directHost.static_root,
        "public-base-url": directHost.public_base_url,
        "local-qa-base-url": directHost.local_qa_base_url,
        "artifact-management-root": directHost.artifact_management_root,
        "artifact-management-registry": path.join(
          directHost.artifact_management_root,
          "registry.json"
        ),
        "artifact-trash-root": directHost.artifact_trash_root,
        profileName: "direct-ip-runtime"
      }, { ...options, env });
    }
  }
  if (!profileValue) return derivePublishRuntimeProfile({ ...args }, { ...options, env });

  const profilePath = resolveProfilePath(String(profileValue), { ...options, env });
  const profile = readProfile(profilePath);
  const normalized = normalizeProfile(profile, path.dirname(profilePath));
  if (normalized["agent-uid"] && args["agent-uid"]
    && normalizeAgentUid(normalized["agent-uid"], "profile.agentUid")
      !== normalizeAgentUid(args["agent-uid"], "--agent-uid")) {
    throw new Error("profile.agentUid conflicts with --agent-uid");
  }
  const merged = {
    ...normalized,
    ...args,
    profile: profilePath,
    profileName: profile.name || path.basename(profilePath, path.extname(profilePath))
  };
  delete merged["publish-profile"];
  return derivePublishRuntimeProfile(merged, { ...options, env });
}

export function derivePublishRuntimeProfile(args, options = {}) {
  const strategy = cleanText(args["namespace-strategy"]);
  if (!strategy) return { ...args };
  if (strategy !== "agent-uid") {
    throw new Error(`unsupported publish namespace strategy: ${strategy}`);
  }
  if (!["static-dir", "direct-ip"].includes(cleanText(args.provider))) {
    throw new Error(
      "namespaceStrategy=agent-uid currently requires provider=static-dir or direct-ip"
    );
  }

  const env = options.env || process.env;
  const environmentAgentUid = resolveEnvironmentAgentUid(env);
  if (!environmentAgentUid) {
    throw new Error(
      "namespaceStrategy=agent-uid requires CATSCO_BOT_UID or CATSCOMPANY_BOT_UID"
    );
  }
  const configuredAgentUid = cleanText(args["agent-uid"]);
  if (configuredAgentUid) {
    const normalizedConfigured = normalizeAgentUid(configuredAgentUid, "profile.agentUid/--agent-uid");
    if (normalizedConfigured !== environmentAgentUid) {
      throw new Error(
        `configured agent UID ${normalizedConfigured} conflicts with runtime agent UID ${environmentAgentUid}`
      );
    }
  }
  if (args["artifact-index"]) {
    throw new Error(
      "namespaceStrategy=agent-uid derives a private artifact index; remove profile.artifactIndex"
    );
  }
  if (args["artifact-management-registry"]) {
    throw new Error(
      "namespaceStrategy=agent-uid derives a private registry; use profile.artifactManagementRoot"
    );
  }

  const baseStaticRoot = requiredProfilePath(args["static-root"], "profile.staticRoot");
  const baseManagementRoot = requiredProfilePath(
    args["artifact-management-root"],
    "profile.artifactManagementRoot"
  );
  const baseTrashRoot = requiredProfilePath(args["artifact-trash-root"], "profile.artifactTrashRoot");
  const basePublicUrl = requiredProfileHttpUrl(args["public-base-url"], "profile.publicBaseUrl");
  const localQaBaseUrl = cleanText(args["local-qa-base-url"])
    ? requiredProfileHttpUrl(args["local-qa-base-url"], "profile.localQaBaseUrl")
    : "";
  if (cleanText(args.provider) === "direct-ip" && !localQaBaseUrl) {
    throw new Error("provider=direct-ip requires profile.localQaBaseUrl");
  }
  assertPrivateRoots(baseStaticRoot, baseManagementRoot, baseTrashRoot);
  const namespaceParts = ["by-agent", environmentAgentUid];
  const staticRoot = derivePathInside(baseStaticRoot, namespaceParts);
  const managementRoot = derivePathInside(baseManagementRoot, namespaceParts);
  const trashRoot = derivePathInside(baseTrashRoot, namespaceParts);

  return {
    ...args,
    "agent-uid": environmentAgentUid,
    "artifact-namespace": namespaceParts.join("/"),
    "static-root": staticRoot,
    "public-base-url": appendUrlPath(basePublicUrl, namespaceParts),
    "local-qa-base-url": localQaBaseUrl
      ? appendUrlPath(localQaBaseUrl, namespaceParts)
      : "",
    "artifact-index": path.join(staticRoot, "artifacts-index.json"),
    "artifact-management-registry": path.join(managementRoot, "registry.json"),
    "artifact-trash-root": trashRoot
  };
}

export function summarizePublishProfile(args) {
  if (!args.profile && !["catsco-central", "direct-ip"].includes(args.provider)) return null;
  return {
    path: args.profile || "",
    name: args.profileName || "",
    provider: args.provider || "",
    publish_endpoint: args["publish-endpoint"] || "",
    public_base_url: args["public-base-url"] || "",
    local_qa_base_url: args["local-qa-base-url"] || "",
    static_root: args["static-root"] || "",
    publish_command_configured: Boolean(args["publish-command"]),
    require_upload_result: args["require-upload-result"] ?? null,
    required_env: normalizeRequiredEnv(args["required-env"]),
    versioned: args.versioned ?? null,
    remote_url_qa: args["remote-url-qa"] ?? null,
    require_remote_url_qa: args["require-remote-url-qa"] ?? null,
    require_published: args["require-published"] ?? null,
    registry: args.registry || "",
    artifact_index: args["artifact-index"] || "",
    artifact_management_registry: args["artifact-management-registry"] || "",
    artifact_management_root: args["artifact-management-root"] || "",
    artifact_trash_root: args["artifact-trash-root"] || "",
    namespace_strategy: args["namespace-strategy"] || "",
    artifact_namespace: args["artifact-namespace"] || "",
    agent_uid: args["agent-uid"] || "",
    agent_name: args["agent-name"] || ""
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
  const candidates = profilePathCandidates(value, options);
  const found = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return found ? found : candidates[0];
}

function profilePathCandidates(value, options = {}) {
  const candidates = [];
  const raw = value.trim();
  const hasPathSyntax = raw.includes("/") || raw.includes("\\") || path.extname(raw);
  if (path.isAbsolute(raw) || hasPathSyntax) {
    candidates.push(path.resolve(options.cwd || process.cwd(), raw));
  } else {
    const env = options.env || process.env;
    const cwd = path.resolve(options.cwd || process.cwd());
    const profileDirs = [
      env.ARTIFACT_PROFILE_DIR,
      options.profileDir,
      path.join(cwd, "work", "cloud-html-artifact-profiles"),
      path.join(cwd, "skills", "cloud-html-artifact", "examples"),
      cwd
    ].filter(Boolean);
    for (const dir of profileDirs) {
      candidates.push(path.resolve(dir, raw));
      candidates.push(path.resolve(dir, `${raw}.json`));
    }
  }
  return Array.from(new Set(candidates));
}

function resolveProfilePathValue(value, profileDir) {
  const text = value.trim();
  if (!text || /^https?:\/\//i.test(text) || path.isAbsolute(text)) return text;
  return path.resolve(profileDir, text);
}

export function resolveEnvironmentAgentUid(env = process.env) {
  return resolveRuntimeAgentUid(env);
}

export function resolveEnvironmentAgentApiKey(env = process.env) {
  const candidates = [
    ["CATSCO_API_KEY", env.CATSCO_API_KEY],
    ["CATSCOMPANY_API_KEY", env.CATSCOMPANY_API_KEY]
  ].filter(([, value]) => cleanText(value));
  if (!candidates.length) {
    throw new Error(
      "central Artifact publishing requires CATSCO_API_KEY or CATSCOMPANY_API_KEY"
    );
  }
  const values = candidates.map(([, value]) => cleanText(value));
  if (new Set(values).size !== 1) {
    throw new Error(
      `runtime agent API key environment variables conflict: ${candidates.map(([name]) => name).join(", ")}`
    );
  }
  return values[0];
}

function hasInlinePublishProfile(args) {
  return [
    "provider",
    "publish-endpoint",
    "static-root",
    "public-base-url",
    "local-qa-base-url",
    "artifact-index",
    "artifact-management-registry",
    "artifact-management-root",
    "artifact-trash-root",
    "namespace-strategy"
  ].some(key => cleanText(args[key]));
}

export function hasExplicitPublishProfile(args) {
  return Boolean(args.profile || args["publish-profile"] || hasInlinePublishProfile(args));
}

export function normalizeAgentUid(value, label = "agent UID") {
  const match = cleanText(value).match(/^(?:usr)?([1-9]\d*)$/i);
  if (!match) throw new Error(`${label} must be a positive CatsCo UID such as usr440 or 440`);
  const number = BigInt(match[1]);
  if (number > 9_223_372_036_854_775_807n) {
    throw new Error(`${label} exceeds the supported CatsCo UID range`);
  }
  return number.toString();
}

function requiredProfilePath(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required for agent-uid namespacing`);
  return path.resolve(text);
}

function requiredProfileHttpUrl(value, label) {
  const text = cleanText(value);
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${label} must be an HTTP(S) URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password
    || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an HTTP(S) URL without credentials, query, or fragment`);
  }
  return parsed.toString().replace(/\/+$/, "");
}

function derivePathInside(base, segments) {
  const target = path.resolve(base, ...segments);
  const relative = path.relative(base, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`derived artifact namespace escapes its configured root: ${target}`);
  }
  return target;
}

function assertPrivateRoots(staticRoot, managementRoot, trashRoot) {
  if (pathsOverlap(staticRoot, managementRoot)) {
    throw new Error("profile.artifactManagementRoot must be outside profile.staticRoot");
  }
  if (pathsOverlap(staticRoot, trashRoot)) {
    throw new Error("profile.artifactTrashRoot must be outside profile.staticRoot");
  }
  if (pathsOverlap(managementRoot, trashRoot)) {
    throw new Error("profile.artifactManagementRoot and profile.artifactTrashRoot must not overlap");
  }
}

function pathsOverlap(left, right) {
  const relative = path.relative(path.resolve(left), path.resolve(right));
  const reverse = path.relative(path.resolve(right), path.resolve(left));
  return relative === "" || isInsideRelative(relative) || isInsideRelative(reverse);
}

function isInsideRelative(value) {
  return value !== "" && !value.startsWith("..") && !path.isAbsolute(value);
}

function appendUrlPath(base, segments) {
  const parsed = new URL(base);
  const suffix = segments.map(segment => encodeURIComponent(segment)).join("/");
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") + "/" + suffix;
  return parsed.toString().replace(/\/+$/, "");
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeDirectHost(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("direct host runtime must be an object");
  }
  const required = [
    "static_root",
    "artifact_management_root",
    "artifact_trash_root",
    "public_base_url",
    "local_qa_base_url"
  ];
  for (const key of required) {
    if (!cleanText(value[key])) throw new Error(`direct host runtime is missing ${key}`);
  }
  return value;
}
