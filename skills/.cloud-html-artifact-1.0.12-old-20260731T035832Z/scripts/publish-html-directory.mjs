#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  assertArtifactPublishAllowedUnlocked,
  registerPublishedArtifactUnlocked,
  resolveArtifactManagementPaths,
  withArtifactManagementLock
} from "./artifact-management-lib.mjs";
import { ensureDirectHost } from "./direct-host-runtime.mjs";
import {
  hasExplicitPublishProfile,
  mergePublishProfile,
  resolveEnvironmentAgentApiKey,
  summarizePublishProfile
} from "./publish-profile.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = parseArgs(process.argv.slice(2));
let args = rawArgs;
const useDirectRuntime = !hasExplicitPublishProfile(rawArgs);
let profileResolutionError = null;
if (!useDirectRuntime) {
  try {
    args = mergePublishProfile(rawArgs);
  } catch (error) {
    profileResolutionError = error;
  }
}
const sourceDir = path.resolve(args._[0] || "");
let argumentError = null;
let artifactId = "";
try {
  artifactId = safeSegment(args.id || args["artifact-id"] || path.basename(sourceDir));
} catch (error) {
  argumentError = error;
}
const resultArtifactId = artifactId || "invalid-artifact";
let outPath = path.join(process.cwd(), "work", "cloud-html-artifact-runs", resultArtifactId, "publish-result.json");
try {
  const requestedOut = cleanText(args.out || rawArgs.out);
  if (requestedOut) outPath = path.resolve(requestedOut);
} catch (error) {
  argumentError ||= error;
}

await main();

async function main() {
  const result = {
    ok: false,
    contract_version: "cloud-html-directory.publish-result.v1",
    published: false,
    id: artifactId,
    artifact_id: artifactId,
    title: "",
    kind: "static_web",
    storage_kind: "html",
    runtime: "static-web",
    access_mode: "public",
    server_process: false,
    persistent_server_state: false,
    version: 0,
    version_url: "",
    latest_url: "",
    index_url: "",
    profile: summarizePublishProfile(args),
    qa: { local: null, version: null, latest: null },
    management: { registered: false },
    errors: [],
    warnings: [],
    started_at: new Date().toISOString(),
    finished_at: ""
  };
  let failedVersionPath = "";
  let latestPromotion = null;
  try {
    if (argumentError) throw argumentError;
    if (profileResolutionError) throw profileResolutionError;
    assertSourceDirectory(sourceDir);
    const title = cleanText(args.title) || extractTitle(path.join(sourceDir, "index.html")) || artifactId;
    result.title = title;
    result.qa.local = runQa({ input: sourceDir, label: "local", outDir: path.dirname(outPath) });
    if (!result.qa.local.ok) {
      throw new Error(
        `local HTML QA failed${result.qa.local.error ? `: ${result.qa.local.error}` : ""}`
      );
    }

    if (useDirectRuntime) {
      const directHost = await ensureDirectHost();
      args = mergePublishProfile(rawArgs, { directHost });
      result.profile = summarizePublishProfile(args);
    }

    if (args.provider === "catsco-central") {
      const central = await publishToCatsCoCentral({ sourceDir, artifactId, title });
      result.version = Number(central.version || 0);
      result.version_url = cleanText(central.version_url);
      result.latest_url = cleanText(central.latest_url);
      result.index_url = cleanText(central.index_url);
      result.qa.version = sanitizeRemoteQa(central.qa?.version);
      result.qa.latest = sanitizeRemoteQa(central.qa?.latest);
      result.management.registered = central.management?.registered === true;
      result.warnings.push(...(Array.isArray(central.warnings) ? central.warnings : []));
      if (!central.ok || !central.published) {
        throw new Error(
          (Array.isArray(central.errors) && central.errors.length
            ? central.errors.join("; ")
            : "central Artifact publish failed")
        );
      }
      result.ok = true;
      result.published = true;
    } else {
      if (!["static-dir", "direct-ip"].includes(args.provider)) {
        throw new Error(
          "publish-html-directory requires direct-ip, static-dir, or an explicit catsco-central compatibility profile"
        );
      }
      const staticRoot = requiredPath(args["static-root"], "profile.staticRoot");
      const publicBaseUrl = requiredPublicHttpUrl(args["public-base-url"], "profile.publicBaseUrl").replace(/\/+$/, "");
      const localQaBaseUrl = args.provider === "direct-ip"
        ? requiredHttpUrl(args["local-qa-base-url"], "profile.localQaBaseUrl").replace(/\/+$/, "")
        : publicBaseUrl;
      const qaBaseUrl = args.provider === "direct-ip" && process.env.NODE_ENV !== "test"
        ? publicBaseUrl
        : localQaBaseUrl;
      const artifactRoot = path.join(staticRoot, artifactId);
      assertInside(artifactRoot, staticRoot);
      const indexPath = path.resolve(args["artifact-index"] || path.join(staticRoot, "artifacts-index.json"));
      assertInside(indexPath, staticRoot);
      result.index_url = publicBaseUrl + "/artifacts-index.json";
      const managementPaths = resolveArtifactManagementPaths({
        staticRoot,
        indexPath,
        registryPath: args["artifact-management-registry"],
        trashRoot: args["artifact-trash-root"]
      });

      withArtifactManagementLock(managementPaths.registryPath, () => {
        assertArtifactPublishAllowedUnlocked({ ...managementPaths, artifactId });
        try {
          const version = nextVersion(artifactRoot, args.version);
          const versionName = "v" + version;
          const versionPath = path.join(artifactRoot, versionName);
          const latestPath = path.join(artifactRoot, "latest");
          const versionUrl = publicBaseUrl + "/" + encodeURIComponent(artifactId) + "/" + versionName + "/";
          const latestUrl = publicBaseUrl + "/" + encodeURIComponent(artifactId) + "/latest/";
          const versionQaUrl = qaBaseUrl + "/" + encodeURIComponent(artifactId) + "/" + versionName + "/";
          const latestQaUrl = qaBaseUrl + "/" + encodeURIComponent(artifactId) + "/latest/";
          result.version = version;
          result.version_url = versionUrl;
          result.latest_url = latestUrl;

          fs.mkdirSync(artifactRoot, { recursive: true });
          fs.chmodSync(artifactRoot, 0o755);
          const stagePath = path.join(artifactRoot, "." + versionName + "-stage-" + process.pid + "-" + Date.now());
          copySource(sourceDir, stagePath);
          if (fs.existsSync(versionPath)) throw new Error("version path already exists: " + versionPath);
          fs.renameSync(stagePath, versionPath);
          failedVersionPath = versionPath;

          result.qa.version = runQa({
            input: versionQaUrl,
            label: "version",
            outDir: path.dirname(outPath)
          });
          if (!result.qa.version.ok) {
            throw new Error(
              `version URL QA failed${result.qa.version.error ? `: ${result.qa.version.error}` : ""}`
            );
          }

          latestPromotion = promoteLatest({
            versionPath,
            latestPath,
            latestQaUrl,
            result,
            outDir: path.dirname(outPath)
          });
          registerPublishedArtifactUnlocked({
            ...managementPaths,
            agentUid: args["agent-uid"],
            artifact: {
              id: artifactId,
              title,
              kind: "html",
              url: latestUrl,
              updated_at: new Date().toISOString(),
              publish_version: version,
              agent_uid: args["agent-uid"],
              agent_name: args["agent-name"],
              owner_uid: args["owner-uid"],
              source_topic_id: args["source-topic-id"],
              source_title: args["source-title"]
            }
          });
          result.management.registered = true;
          latestPromotion.commit();

          result.ok = true;
          result.published = true;
          latestPromotion = null;
          failedVersionPath = "";
        } catch (error) {
          if (latestPromotion) {
            latestPromotion.rollback();
            latestPromotion = null;
          }
          if (failedVersionPath && fs.existsSync(failedVersionPath)) {
            fs.rmSync(failedVersionPath, { recursive: true, force: true });
            failedVersionPath = "";
          }
          if (fs.existsSync(artifactRoot) && fs.readdirSync(artifactRoot).length === 0) {
            fs.rmdirSync(artifactRoot);
          }
          throw error;
        }
      });
    }
  } catch (error) {
    result.errors.push(messageOf(error));
    if (latestPromotion) {
      try {
        latestPromotion.rollback();
      } catch (rollbackError) {
        result.warnings.push(`latest rollback failed: ${messageOf(rollbackError)}`);
      }
    }
    if (failedVersionPath && fs.existsSync(failedVersionPath)) {
      try {
        fs.rmSync(failedVersionPath, { recursive: true, force: true });
      } catch (cleanupError) {
        result.warnings.push(`failed version cleanup failed: ${messageOf(cleanupError)}`);
      }
    }
  }
  result.errors = unique(result.errors);
  result.warnings = unique(result.warnings);
  result.finished_at = new Date().toISOString();
  writeJson(outPath, result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

async function publishToCatsCoCentral({ sourceDir, artifactId, title }) {
  const endpoint = requiredPublicHttpUrl(
    args["publish-endpoint"],
    "central Artifact publish endpoint"
  );
  const apiKey = resolveEnvironmentAgentApiKey(process.env);
  const payload = {
    contract_version: "cloud-html-directory.publish-request.v1",
    id: artifactId,
    title,
    files: collectCentralPublishFiles(sourceDir),
    expect_text: cleanText(args["expect-text"]),
    expect_selector: cleanText(args["expect-selector"]),
    agent_name: cleanText(args["agent-name"]),
    owner_uid: cleanText(args["owner-uid"]),
    source_topic_id: cleanText(args["source-topic-id"]),
    source_title: cleanText(args["source-title"])
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `ApiKey ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Number(args["publish-timeout-ms"] || 240_000))
  });
  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    throw new Error(`central Artifact host returned invalid JSON (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const detail = cleanText(body?.error?.message)
      || cleanText(body?.error)
      || `HTTP ${response.status}`;
    throw new Error(`central Artifact publish failed: ${detail}`);
  }
  if (body?.contract_version !== "cloud-html-directory.publish-result.v1") {
    throw new Error("central Artifact host returned an unsupported publish contract");
  }
  return body;
}

function collectCentralPublishFiles(root) {
  const maxFiles = positiveInteger(
    process.env.CATSCO_ARTIFACT_MAX_FILES || "2048",
    "CATSCO_ARTIFACT_MAX_FILES"
  );
  const maxBytes = positiveInteger(
    process.env.CATSCO_ARTIFACT_MAX_BYTES || String(64 * 1024 * 1024),
    "CATSCO_ARTIFACT_MAX_BYTES"
  );
  const files = [];
  let totalBytes = 0;

  visit(root, "");
  return files;

  function visit(current, relativeDir) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      const relative = path.posix.join(relativeDir, entry.name);
      if (path.resolve(absolute) === path.resolve(outPath)) continue;
      if (entry.isDirectory()) {
        visit(absolute, relative);
        continue;
      }
      if (!entry.isFile()) throw new Error(`unsupported publish input: ${absolute}`);
      const content = fs.readFileSync(absolute);
      totalBytes += content.length;
      if (files.length + 1 > maxFiles) {
        throw new Error(`central Artifact upload exceeds the transport file limit (${maxFiles})`);
      }
      if (totalBytes > maxBytes) {
        throw new Error(`central Artifact upload exceeds the transport byte limit (${maxBytes})`);
      }
      files.push({
        path: relative,
        content_base64: content.toString("base64")
      });
    }
  }
}

function sanitizeRemoteQa(value) {
  if (!value || typeof value !== "object") return null;
  return {
    ok: value.ok === true,
    report: "",
    url: cleanText(value.url),
    checks: Number(value.checks || 0),
    failed_checks: Array.isArray(value.failed_checks)
      ? value.failed_checks.map(cleanText).filter(Boolean)
      : [],
    error: cleanText(value.error)
  };
}

function promoteLatest({ versionPath, latestPath, latestQaUrl, result, outDir }) {
  const parent = path.dirname(latestPath);
  const token = `${process.pid}-${Date.now()}`;
  const candidate = path.join(parent, `.latest-next-${token}`);
  const backup = path.join(parent, `.latest-prev-${token}`);
  copySource(versionPath, candidate);
  let hadPrevious = false;
  try {
    if (fs.existsSync(latestPath)) {
      fs.renameSync(latestPath, backup);
      hadPrevious = true;
    }
    fs.renameSync(candidate, latestPath);
    result.qa.latest = runQa({ input: latestQaUrl, label: "latest", outDir });
    if (!result.qa.latest.ok) {
      throw new Error(
        `latest URL QA failed${result.qa.latest.error ? `: ${result.qa.latest.error}` : ""}`
      );
    }
    return {
      commit() {
        if (!hadPrevious) return;
        try {
          fs.rmSync(backup, { recursive: true, force: true });
        } catch (error) {
          result.warnings.push(`previous latest cleanup failed: ${messageOf(error)}`);
        }
      },
      rollback() {
        fs.rmSync(latestPath, { recursive: true, force: true });
        if (hadPrevious && fs.existsSync(backup)) fs.renameSync(backup, latestPath);
      }
    };
  } catch (error) {
    fs.rmSync(candidate, { recursive: true, force: true });
    fs.rmSync(latestPath, { recursive: true, force: true });
    if (hadPrevious && fs.existsSync(backup)) fs.renameSync(backup, latestPath);
    throw error;
  }
}

function runQa({ input, label, outDir }) {
  const qaPath = path.join(outDir, `${artifactId}-${label}-html-qa.json`);
  const commandArgs = [
    path.join(scriptDir, "qa-html-page.mjs"),
    input,
    "--out", qaPath,
    "--timeout-ms", String(args["qa-timeout-ms"] || 15_000)
  ];
  if (args["node-modules"]) commandArgs.push("--node-modules", String(args["node-modules"]));
  if (args["browser-channel"]) commandArgs.push("--browser-channel", String(args["browser-channel"]));
  if (args["expect-selector"]) commandArgs.push("--expect-selector", String(args["expect-selector"]));
  if (args["expect-text"]) commandArgs.push("--expect-text", String(args["expect-text"]));
  if (label === "local" && args.screenshot) commandArgs.push("--screenshot", path.resolve(args.screenshot));
  const completed = spawnSync(process.execPath, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: Number(args["publish-timeout-ms"] || 180_000)
  });
  const report = fs.existsSync(qaPath) ? readJson(qaPath) : null;
  return {
    ok: completed.status === 0 && report?.ok === true,
    report: qaPath,
    url: report?.url || "",
    checks: Array.isArray(report?.checks) ? report.checks.length : 0,
    failed_checks: Array.isArray(report?.checks) ? report.checks.filter(check => !check.pass && check.level !== "warning").map(check => check.name) : [],
    error: completed.error?.message || cleanText(completed.stderr) || (report?.errors || []).join("; ")
  };
}

function assertSourceDirectory(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(`source directory not found: ${dir}`);
  const entryPath = path.join(dir, "index.html");
  if (!fs.existsSync(entryPath) || !fs.statSync(entryPath).isFile()) throw new Error(`index.html not found: ${entryPath}`);
  const entry = fs.readFileSync(entryPath, "utf8");
  if (/\bfile:\/\//i.test(entry)) throw new Error("index.html contains a file:// URL");
  walk(dir, target => {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) throw new Error(`symbolic links are not publishable: ${target}`);
    assertNoSensitivePublishInput(target, dir, stat);
  });
}

function copySource(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
    filter: target => {
      const relative = path.relative(source, target);
      if (!relative) return true;
      const first = relative.split(path.sep)[0];
      if ([".git", "node_modules"].includes(first)) return false;
      return path.resolve(target) !== outPath;
    }
  });
  fs.chmodSync(destination, 0o755);
  walk(destination, target => {
    const stat = fs.lstatSync(target);
    fs.chmodSync(target, stat.isDirectory() ? 0o755 : 0o644);
  });
}

function nextVersion(artifactRoot, requested) {
  if (requested !== undefined) {
    const value = Number(requested);
    if (!Number.isInteger(value) || value < 1) throw new Error("--version must be a positive integer");
    return value;
  }
  if (!fs.existsSync(artifactRoot)) return 1;
  const versions = fs.readdirSync(artifactRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^v[1-9]\d*$/.test(entry.name))
    .map(entry => Number(entry.name.slice(1)));
  return versions.length ? Math.max(...versions) + 1 : 1;
}

function extractTitle(entryPath) {
  const html = fs.readFileSync(entryPath, "utf8");
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(match?.[1]).replace(/<[^>]+>/g, "").slice(0, 160);
}

function walk(root, visit) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    visit(target);
    if (entry.isDirectory()) walk(target, visit);
  }
}

function requiredPath(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required`);
  return path.resolve(text);
}

function requiredPublicHttpUrl(value, label) {
  const text = requiredHttpUrl(value, label);
  const parsed = new URL(text);
  const allowTestURL = process.env.NODE_ENV === "test"
    && process.env.CLOUD_HTML_ARTIFACT_ALLOW_NON_PUBLIC_TEST_URL === "1";
  if (!allowTestURL && !isPublicHostname(parsed.hostname)) {
    throw new Error(`${label} must use a public Internet hostname or address`);
  }
  return text;
}

function requiredHttpUrl(value, label) {
  const text = cleanText(value);
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${label} must be an HTTP(S) URL`);
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an HTTP(S) base URL without credentials, query, or fragment`);
  }
  return text;
}

function isPublicHostname(value) {
  const hostname = String(value || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".test")
    || hostname.endsWith(".invalid")
    || hostname === "example.com"
    || hostname.endsWith(".example.com")
    || hostname === "example.net"
    || hostname.endsWith(".example.net")
    || hostname === "example.org"
    || hostname.endsWith(".example.org")) {
    return false;
  }
  const family = net.isIP(hostname);
  if (family === 4) return isPublicIPv4(hostname);
  if (family === 6) return isPublicIPv6(hostname);
  return hostname.includes(".");
}

function isPublicIPv4(value) {
  const parts = value.split(".").map(Number);
  const [a, b] = parts;
  return !(
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0 && parts[2] === 2)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && parts[2] === 100)
    || (a === 203 && b === 0 && parts[2] === 113)
    || a >= 224
  );
}

function isPublicIPv6(value) {
  const normalized = value.toLowerCase();
  return normalized !== "::"
    && normalized !== "::1"
    && !normalized.startsWith("fc")
    && !normalized.startsWith("fd")
    && !/^fe[89ab]/.test(normalized)
    && !normalized.startsWith("2001:db8:");
}

function assertNoSensitivePublishInput(target, root, stat) {
  const relative = path.relative(root, target);
  const parts = relative.split(path.sep).filter(Boolean);
  const lowerParts = parts.map(part => part.toLowerCase());
  const name = lowerParts.at(-1) || "";
  if (stat.isDirectory() && [".git", ".hg", ".svn", ".ssh", "node_modules"].includes(name)) {
    throw new Error(`public artifact source contains forbidden directory: ${relative}`);
  }
  if (!stat.isFile()) return;
  const forbiddenName = name === ".env"
    || name.startsWith(".env.")
    || [".npmrc", ".pypirc", ".netrc", "credentials.json", "secrets.json", "id_rsa", "id_ed25519"].includes(name)
    || /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/.test(name);
  const forbiddenExtension = [".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"].includes(path.extname(name));
  if (forbiddenName || forbiddenExtension) {
    throw new Error(`public artifact source contains sensitive-looking file: ${relative}`);
  }
  if (stat.size <= 1024 * 1024) {
    const prefix = fs.readFileSync(target, "utf8").slice(0, 8192);
    if (/-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/.test(prefix)) {
      throw new Error(`public artifact source contains private key material: ${relative}`);
    }
  }
}

function assertInside(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`path escapes static root: ${resolvedTarget}`);
  }
}

function safeSegment(value) {
  const segment = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 64);
  if (!segment) throw new Error("artifact id is required");
  return segment;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function cleanText(value) {
  return String(value ?? "").trim();
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}
