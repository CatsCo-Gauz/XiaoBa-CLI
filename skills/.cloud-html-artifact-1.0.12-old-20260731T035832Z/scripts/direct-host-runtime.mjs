#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const DIRECT_HOST_CONTRACT_VERSION = "cloud-html-artifact.direct-host.v1";
export const DIRECT_HOST_SERVICE_NAME = "cloud-html-artifact-direct-host";
export const DIRECT_HOST_PORT = 19990;
export const DIRECT_HOST_DATA_DIR_ENV = "CATSCO_ARTIFACT_DATA_DIR";

const scriptPath = fileURLToPath(import.meta.url);
const HEALTH_PATH = "/__artifact_health";
const STATIC_PREFIX = "/artifacts";
const START_TIMEOUT_MS = 10_000;
const PUBLIC_IP_ENDPOINTS = [
  "http://169.254.169.254/latest/meta-data/public-ipv4",
  "http://100.100.100.200/latest/meta-data/eipv4",
  "https://api.ipify.org",
  "https://checkip.amazonaws.com",
  "https://icanhazip.com",
  "https://4.ipw.cn"
];

export async function inspectDirectHost(options = {}) {
  const env = options.env || process.env;
  const testMode = env.NODE_ENV === "test";
  if (process.platform !== "linux" && !testMode && options.allowUnsupportedPlatform !== true) {
    throw new Error(
      `direct Artifact hosting requires the shell to run on a Linux server; current platform is ${process.platform}`
    );
  }

  const publicIp = await discoverPublicIPv4({ ...options, env });
  const port = resolvePort(options, env);
  const roots = resolveRoots(options, env);
  const publicOrigin = `http://${publicIp}:${port}`;
  const localOrigin = `http://127.0.0.1:${port}`;

  return {
    ok: true,
    contract_version: DIRECT_HOST_CONTRACT_VERSION,
    provider: "direct-ip",
    agent_uid: resolveRuntimeAgentUid(env),
    platform: process.platform,
    hostname: cleanText(options.hostname || process.env.HOSTNAME || ""),
    public_ip: publicIp,
    port,
    bind_host: "0.0.0.0",
    static_root: roots.staticRoot,
    artifact_management_root: roots.managementRoot,
    artifact_trash_root: roots.trashRoot,
    public_base_url: `${publicOrigin}${STATIC_PREFIX}`,
    local_qa_base_url: `${localOrigin}${STATIC_PREFIX}`,
    health_url: `${localOrigin}${HEALTH_PATH}`,
    service: {
      running: false,
      reused: false,
      pid: null
    }
  };
}

export async function ensureDirectHost(options = {}) {
  const runtime = options.runtime || await inspectDirectHost(options);
  ensureRuntimeDirectories(runtime);

  const expectedRootId = rootIdentifier(runtime.static_root);
  const health = await readDirectHostHealth(runtime, options);
  if (health.kind === "compatible") {
    return withServiceState(runtime, {
      running: true,
      reused: true,
      pid: health.body.pid
    });
  }
  if (health.kind === "stale") {
    await stopOwnedDirectHost(health.body, runtime, options);
  }
  if (health.kind === "occupied") {
    throw new Error(
      `port ${runtime.port} is occupied by a service that is not the expected Artifact static host`
    );
  }

  const started = await startDirectHost(runtime, options);
  if (started.root_id !== expectedRootId) {
    throw new Error("the started Artifact static host reported an unexpected storage root");
  }
  return withServiceState(runtime, {
    running: true,
    reused: false,
    pid: started.pid
  });
}

export async function startDirectHost(runtimeOrOptions = {}, maybeOptions = {}) {
  const hasRuntime = runtimeOrOptions?.contract_version === DIRECT_HOST_CONTRACT_VERSION;
  const runtime = hasRuntime
    ? runtimeOrOptions
    : await inspectDirectHost(runtimeOrOptions);
  const options = hasRuntime ? maybeOptions : runtimeOrOptions;
  ensureRuntimeDirectories(runtime);

  const child = spawn(process.execPath, [
    scriptPath,
    "serve",
    "--root", runtime.static_root,
    "--port", String(runtime.port)
  ], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: options.env || process.env
  });
  child.unref();

  const deadline = Date.now() + positiveInteger(
    options.startTimeoutMs,
    START_TIMEOUT_MS
  );
  let lastProbe = null;
  while (Date.now() < deadline) {
    await delay(100);
    lastProbe = await readDirectHostHealth(runtime, options);
    if (lastProbe.kind === "compatible") return lastProbe.body;
    if (lastProbe.kind === "occupied") {
      throw new Error(
        `port ${runtime.port} became occupied by an incompatible service while starting the Artifact host`
      );
    }
  }
  throw new Error(
    `Artifact static host did not become healthy on port ${runtime.port}`
      + (lastProbe?.error ? `: ${lastProbe.error}` : "")
  );
}

export function createDirectHostServer(options = {}) {
  const root = path.resolve(requiredText(options.root, "static root"));
  const port = positiveInteger(options.port, DIRECT_HOST_PORT);
  const rootId = rootIdentifier(root);
  const server = http.createServer((request, response) => {
    void handleRequest({ request, response, root, rootId, port });
  });
  return server;
}

export function resolveRuntimeAgentUid(env = process.env) {
  const candidates = [
    ["CATSCO_BOT_UID", env.CATSCO_BOT_UID],
    ["CATSCOMPANY_BOT_UID", env.CATSCOMPANY_BOT_UID]
  ].filter(([, value]) => cleanText(value));
  if (!candidates.length) return "";

  const normalized = candidates.map(([name, value]) => normalizeAgentUid(value, name));
  if (new Set(normalized).size !== 1) {
    throw new Error(
      `runtime agent UID environment variables conflict: ${candidates.map(([name]) => name).join(", ")}`
    );
  }
  return normalized[0];
}

export async function discoverPublicIPv4(options = {}) {
  const env = options.env || process.env;
  const overrides = [
    ["CATSCO_ARTIFACT_PUBLIC_IP", env.CATSCO_ARTIFACT_PUBLIC_IP],
    ["CATSCOMPANY_ARTIFACT_PUBLIC_IP", env.CATSCOMPANY_ARTIFACT_PUBLIC_IP]
  ].filter(([, value]) => cleanText(value));
  if (overrides.length) {
    const values = overrides.map(([name, value]) => validatePublicIPv4(value, name));
    if (new Set(values).size !== 1) {
      throw new Error(
        `Artifact public IP environment variables conflict: ${overrides.map(([name]) => name).join(", ")}`
      );
    }
    return values[0];
  }

  const endpoints = Array.isArray(options.publicIpEndpoints)
    ? options.publicIpEndpoints
    : PUBLIC_IP_ENDPOINTS;
  const failures = [];
  for (const endpoint of endpoints) {
    try {
      const endpointTimeoutMs = /^http:\/\/(?:169\.254\.169\.254|100\.100\.100\.200)\//.test(endpoint)
        ? positiveInteger(options.metadataTimeoutMs, 1200)
        : positiveInteger(options.publicIpTimeoutMs, 5000);
      const response = await fetch(endpoint, {
        headers: { "User-Agent": DIRECT_HOST_SERVICE_NAME },
        signal: AbortSignal.timeout(endpointTimeoutMs)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return validatePublicIPv4(await response.text(), endpoint);
    } catch (error) {
      failures.push(`${endpoint}: ${messageOf(error)}`);
    }
  }
  if (process.platform === "linux") {
    for (const endpoint of endpoints.filter(value => /^https:\/\//i.test(value))) {
      const completed = spawnSync("curl", [
        "-4",
        "-f",
        "-s",
        "-S",
        "--max-time", "8",
        endpoint
      ], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 10_000
      });
      try {
        if (!completed.error && completed.status === 0) {
          return validatePublicIPv4(completed.stdout, `curl ${endpoint}`);
        }
      } catch (error) {
        failures.push(`curl ${endpoint}: ${messageOf(error)}`);
        continue;
      }
      const detail = completed.error?.message || cleanText(completed.stderr)
        || `exit ${completed.status}`;
      failures.push(`curl ${endpoint}: ${detail}`);
    }
  }
  throw new Error(
    "unable to discover the server public IPv4 address"
      + (failures.length ? ` (${failures.join(" | ")})` : "")
  );
}

async function handleRequest({ request, response, root, rootId, port }) {
  try {
    if (!["GET", "HEAD"].includes(request.method || "")) {
      send(response, 405, "Method Not Allowed", {
        Allow: "GET, HEAD",
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }

    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    if (requestUrl.pathname === HEALTH_PATH) {
      const body = Buffer.from(JSON.stringify({
        ok: true,
        contract_version: DIRECT_HOST_CONTRACT_VERSION,
        service: DIRECT_HOST_SERVICE_NAME,
        pid: process.pid,
        port,
        root_id: rootId
      }) + "\n");
      send(response, 200, body, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(body.length),
        "Cache-Control": "no-store"
      }, request.method);
      return;
    }

    if (requestUrl.pathname === STATIC_PREFIX) {
      response.writeHead(308, { Location: `${STATIC_PREFIX}/` }).end();
      return;
    }
    if (!requestUrl.pathname.startsWith(`${STATIC_PREFIX}/`)) {
      send(response, 404, "Not Found", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }

    let relative;
    try {
      relative = decodeURIComponent(requestUrl.pathname.slice(STATIC_PREFIX.length + 1));
    } catch {
      send(response, 400, "Bad Request", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }
    if (relative.includes("\0")) {
      send(response, 400, "Bad Request", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }

    let target = path.resolve(root, relative || ".");
    if (!isInsideOrEqual(target, root)) {
      send(response, 403, "Forbidden", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }
    if (!fs.existsSync(target)) {
      send(response, 404, "Not Found", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }

    let stat = fs.statSync(target);
    if (stat.isDirectory()) {
      if (!requestUrl.pathname.endsWith("/")) {
        response.writeHead(308, {
          Location: `${requestUrl.pathname}/${requestUrl.search}`
        }).end();
        return;
      }
      target = path.join(target, "index.html");
      if (!fs.existsSync(target)) {
        send(response, 404, "Not Found", {
          "Content-Type": "text/plain; charset=utf-8"
        }, request.method);
        return;
      }
      stat = fs.statSync(target);
    }
    if (!stat.isFile() || !realPathStaysInside(target, root)) {
      send(response, 404, "Not Found", {
        "Content-Type": "text/plain; charset=utf-8"
      }, request.method);
      return;
    }

    const range = parseByteRange(request.headers.range, stat.size);
    if (range?.invalid) {
      response.writeHead(416, {
        "Content-Range": `bytes */${stat.size}`,
        "Accept-Ranges": "bytes"
      }).end();
      return;
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? Math.max(0, stat.size - 1);
    const contentLength = stat.size === 0 ? 0 : end - start + 1;
    const headers = {
      "Content-Type": contentType(target),
      "Content-Length": String(contentLength),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store"
    };
    if (range) headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === "HEAD" || stat.size === 0) {
      response.end();
      return;
    }
    const stream = fs.createReadStream(target, { start, end });
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  } catch {
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("Internal Server Error");
  }
}

async function runServeCommand(args) {
  const root = path.resolve(requiredText(args.root, "--root"));
  const port = positiveInteger(args.port, DIRECT_HOST_PORT);
  fs.mkdirSync(root, { recursive: true });
  const server = createDirectHostServer({ root, port });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", resolve);
  });
  console.log(JSON.stringify({
    ok: true,
    contract_version: DIRECT_HOST_CONTRACT_VERSION,
    service: DIRECT_HOST_SERVICE_NAME,
    pid: process.pid,
    host: "0.0.0.0",
    port,
    root_id: rootIdentifier(root)
  }));

  const close = () => server.close(() => process.exit(0));
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
}

async function runInspectCommand() {
  const result = await inspectDirectHost();
  const health = await readDirectHostHealth(result, {});
  const output = health.kind === "compatible"
    ? withServiceState(result, {
        running: true,
        reused: true,
        pid: health.body.pid
      })
    : result;
  console.log(JSON.stringify(output, null, 2));
}

async function readDirectHostHealth(runtime, options) {
  const timeoutMs = positiveInteger(options.healthTimeoutMs, 800);
  try {
    const response = await fetch(runtime.health_url, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store"
    });
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      return { kind: "occupied", error: `health endpoint returned HTTP ${response.status}` };
    }
    const owned = response.ok
      && body?.ok === true
      && body?.contract_version === DIRECT_HOST_CONTRACT_VERSION
      && body?.service === DIRECT_HOST_SERVICE_NAME
      && Number(body?.port) === Number(runtime.port)
      && Number.isInteger(Number(body?.pid));
    if (!owned) return { kind: "occupied", body, error: "health contract mismatch" };
    return body?.root_id === rootIdentifier(runtime.static_root)
      ? { kind: "compatible", body }
      : { kind: "stale", body, error: "owned service uses an outdated storage root" };
  } catch (error) {
    const occupied = await tcpPortIsOpen(runtime.port, timeoutMs);
    return occupied
      ? { kind: "occupied", error: messageOf(error) }
      : { kind: "available", error: messageOf(error) };
  }
}

async function stopOwnedDirectHost(body, runtime, options) {
  const pid = Number(body?.pid);
  if (!Number.isInteger(pid) || pid < 1 || pid === process.pid) {
    throw new Error(`stale Artifact static host on port ${runtime.port} reported an invalid PID`);
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    throw new Error(`unable to stop stale Artifact static host process ${pid}: ${messageOf(error)}`);
  }
  const deadline = Date.now() + positiveInteger(options.stopTimeoutMs, 5_000);
  while (Date.now() < deadline) {
    if (!await tcpPortIsOpen(runtime.port, 250)) return;
    await delay(100);
  }
  throw new Error(`stale Artifact static host process ${pid} did not release port ${runtime.port}`);
}

function tcpPortIsOpen(port, timeoutMs) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = value => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function ensureRuntimeDirectories(runtime) {
  for (const root of [
    runtime.static_root,
    runtime.artifact_management_root,
    runtime.artifact_trash_root
  ]) {
    ensureWritableDirectory(root);
  }
}

function resolveRoots(options, env) {
  const testMode = env.NODE_ENV === "test";
  const dataRoot = path.resolve(
    cleanText(options.dataRoot)
      || cleanText(env[DIRECT_HOST_DATA_DIR_ENV])
      || path.join(
        cleanText(options.homeDir) || cleanText(env.HOME) || os.homedir(),
        ".local",
        "share",
        "catsco",
        "cloud-html-artifact"
      )
  );
  const testValue = (optionName, envName, relativeName) => {
    const value = testMode ? cleanText(env[envName]) : "";
    return path.resolve(cleanText(options[optionName]) || value || path.join(dataRoot, relativeName));
  };
  return {
    staticRoot: testValue(
      "staticRoot",
      "CLOUD_HTML_ARTIFACT_TEST_STATIC_ROOT",
      "artifacts"
    ),
    managementRoot: testValue(
      "managementRoot",
      "CLOUD_HTML_ARTIFACT_TEST_MANAGEMENT_ROOT",
      "artifact-management"
    ),
    trashRoot: testValue(
      "trashRoot",
      "CLOUD_HTML_ARTIFACT_TEST_TRASH_ROOT",
      "artifact-trash"
    )
  };
}

function ensureWritableDirectory(root) {
  try {
    fs.mkdirSync(root, { recursive: true });
    if (!fs.statSync(root).isDirectory()) {
      throw new Error("path exists but is not a directory");
    }
    const probe = path.join(
      root,
      `.cloud-html-artifact-write-probe-${process.pid}-${crypto.randomBytes(6).toString("hex")}`
    );
    try {
      fs.writeFileSync(probe, "ok\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
    } finally {
      fs.rmSync(probe, { force: true });
    }
  } catch (error) {
    throw new Error(
      `Artifact runtime path is not writable by the current user: ${root}: ${messageOf(error)}`
    );
  }
}

function resolvePort(options, env) {
  const testPort = env.NODE_ENV === "test"
    ? cleanText(env.CLOUD_HTML_ARTIFACT_TEST_PORT)
    : "";
  return positiveInteger(options.port || testPort, DIRECT_HOST_PORT);
}

function validatePublicIPv4(value, label) {
  const ip = cleanText(value);
  if (net.isIP(ip) !== 4) {
    throw new Error(`${label} did not provide an IPv4 address`);
  }
  const [a, b, c] = ip.split(".").map(Number);
  const publicAddress = !(
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
  );
  if (!publicAddress) throw new Error(`${label} did not provide a public IPv4 address`);
  return ip;
}

function normalizeAgentUid(value, label) {
  const match = cleanText(value).match(/^(?:usr)?([1-9]\d*)$/i);
  if (!match) throw new Error(`${label} must be a positive CatsCo UID such as usr440 or 440`);
  const number = BigInt(match[1]);
  if (number > 9_223_372_036_854_775_807n) {
    throw new Error(`${label} exceeds the supported CatsCo UID range`);
  }
  return number.toString();
}

function parseByteRange(value, size) {
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || size < 1) return { invalid: true };
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength < 1) return { invalid: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || start >= size || end < start) {
      return { invalid: true };
    }
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

function contentType(filePath) {
  return ({
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".avif": "image/avif",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".wasm": "application/wasm",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg"
  })[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function realPathStaysInside(target, root) {
  try {
    return isInsideOrEqual(fs.realpathSync(target), fs.realpathSync(root));
  } catch {
    return false;
  }
}

function isInsideOrEqual(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function rootIdentifier(root) {
  return crypto.createHash("sha256").update(path.resolve(root)).digest("hex");
}

function withServiceState(runtime, service) {
  return {
    ...runtime,
    service: {
      ...runtime.service,
      ...service
    }
  };
}

function send(response, status, value, headers, method) {
  const body = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  response.writeHead(status, {
    "Content-Length": String(body.length),
    ...headers
  });
  if (method === "HEAD") response.end();
  else response.end(body);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 65_535
    ? number
    : fallback;
}

function requiredText(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
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

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  const args = parseArgs(process.argv.slice(2));
  const command = cleanText(args._[0] || "inspect");
  try {
    if (command === "serve") await runServeCommand(args);
    else if (command === "inspect") await runInspectCommand();
    else if (command === "ensure") {
      console.log(JSON.stringify(await ensureDirectHost(), null, 2));
    } else {
      throw new Error(`unsupported direct host command: ${command}`);
    }
  } catch (error) {
    console.error(messageOf(error));
    process.exit(1);
  }
}
