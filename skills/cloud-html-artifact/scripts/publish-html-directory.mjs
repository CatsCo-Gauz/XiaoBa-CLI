#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { upsertArtifactIndex } from "./artifact-index-lib.mjs";
import { mergePublishProfile, summarizePublishProfile } from "./publish-profile.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const args = mergePublishProfile(parseArgs(process.argv.slice(2)));
const sourceDir = path.resolve(args._[0] || "");
const artifactId = safeSegment(args.id || args["artifact-id"] || path.basename(sourceDir));
const outPath = path.resolve(args.out || path.join(process.cwd(), "work", "cloud-html-artifact-runs", artifactId, "publish-result.json"));

main();

function main() {
  const result = {
    ok: false,
    contract_version: "cloud-html-directory.publish-result.v1",
    published: false,
    id: artifactId,
    title: "",
    kind: "html",
    version: 0,
    version_url: "",
    latest_url: "",
    index_url: "",
    profile: summarizePublishProfile(args),
    qa: { local: null, version: null, latest: null },
    errors: [],
    warnings: [],
    started_at: new Date().toISOString(),
    finished_at: ""
  };
  let failedVersionPath = "";
  let latestPromotion = null;
  try {
    assertSourceDirectory(sourceDir);
    const title = cleanText(args.title) || extractTitle(path.join(sourceDir, "index.html")) || artifactId;
    result.title = title;
    if (args.provider !== "static-dir") {
      throw new Error("publish-html-directory currently requires a static-dir profile");
    }
    const staticRoot = requiredPath(args["static-root"], "profile.staticRoot");
    const publicBaseUrl = requiredHttpUrl(args["public-base-url"], "profile.publicBaseUrl").replace(/\/+$/, "");
    const artifactRoot = path.join(staticRoot, artifactId);
    assertInside(artifactRoot, staticRoot);
    const version = nextVersion(artifactRoot, args.version);
    const versionName = `v${version}`;
    const versionPath = path.join(artifactRoot, versionName);
    const latestPath = path.join(artifactRoot, "latest");
    const versionUrl = `${publicBaseUrl}/${encodeURIComponent(artifactId)}/${versionName}/`;
    const latestUrl = `${publicBaseUrl}/${encodeURIComponent(artifactId)}/latest/`;
    const indexPath = path.resolve(args["artifact-index"] || path.join(staticRoot, "artifacts-index.json"));
    assertInside(indexPath, staticRoot);
    result.version = version;
    result.version_url = versionUrl;
    result.latest_url = latestUrl;
    result.index_url = `${publicBaseUrl}/artifacts-index.json`;

    result.qa.local = runQa({ input: sourceDir, label: "local", outDir: path.dirname(outPath) });
    if (!result.qa.local.ok) throw new Error("local HTML QA failed");

    fs.mkdirSync(artifactRoot, { recursive: true });
    const stagePath = path.join(artifactRoot, `.${versionName}-stage-${process.pid}-${Date.now()}`);
    copySource(sourceDir, stagePath);
    if (fs.existsSync(versionPath)) throw new Error(`version path already exists: ${versionPath}`);
    fs.renameSync(stagePath, versionPath);
    failedVersionPath = versionPath;

    result.qa.version = runQa({ input: versionUrl, label: "version", outDir: path.dirname(outPath) });
    if (!result.qa.version.ok) throw new Error("version URL QA failed");

    latestPromotion = promoteLatest({ versionPath, latestPath, latestUrl, result, outDir: path.dirname(outPath) });
    const updatedAt = new Date().toISOString();
    upsertArtifactIndex({
      indexPath,
      artifact: { id: artifactId, title, kind: "html", url: latestUrl, updated_at: updatedAt }
    });
    latestPromotion.commit();

    result.ok = true;
    result.published = true;
    latestPromotion = null;
    failedVersionPath = "";
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

function promoteLatest({ versionPath, latestPath, latestUrl, result, outDir }) {
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
    result.qa.latest = runQa({ input: latestUrl, label: "latest", outDir });
    if (!result.qa.latest.ok) throw new Error("latest URL QA failed");
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

function requiredHttpUrl(value, label) {
  const text = cleanText(value);
  if (!/^https?:\/\/\S+$/i.test(text)) throw new Error(`${label} must be an HTTP(S) URL`);
  return text;
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
