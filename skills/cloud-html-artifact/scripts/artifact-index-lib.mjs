import fs from "node:fs";
import path from "node:path";

export const ARTIFACT_INDEX_VERSION = "cloud-artifacts.index.v1";

export function upsertArtifactIndex(options) {
  const indexPath = requiredPath(options.indexPath, "indexPath");
  const artifact = normalizeArtifact(options.artifact);
  const current = readArtifactIndex(indexPath);
  const artifacts = current.artifacts.filter(item => item.id !== artifact.id);
  artifacts.push(artifact);
  artifacts.sort((left, right) => {
    const byTime = String(right.updated_at).localeCompare(String(left.updated_at));
    return byTime || left.id.localeCompare(right.id);
  });
  const index = {
    contract_version: ARTIFACT_INDEX_VERSION,
    updated_at: artifact.updated_at,
    artifacts
  };
  writeJsonAtomic(indexPath, index);
  return index;
}

export function readArtifactIndex(indexPath) {
  const resolved = requiredPath(indexPath, "indexPath");
  if (!fs.existsSync(resolved)) {
    return {
      contract_version: ARTIFACT_INDEX_VERSION,
      updated_at: "",
      artifacts: []
    };
  }
  const value = JSON.parse(fs.readFileSync(resolved, "utf8"));
  if (value?.contract_version !== ARTIFACT_INDEX_VERSION) {
    throw new Error(`unsupported artifact index contract: ${value?.contract_version || "missing"}`);
  }
  if (!Array.isArray(value.artifacts)) throw new Error("artifact index artifacts must be an array");
  const ids = new Set();
  const artifacts = value.artifacts.map(item => {
    const artifact = normalizeArtifact(item);
    if (ids.has(artifact.id)) throw new Error(`duplicate artifact id in index: ${artifact.id}`);
    ids.add(artifact.id);
    return artifact;
  });
  return {
    contract_version: ARTIFACT_INDEX_VERSION,
    updated_at: cleanText(value.updated_at),
    artifacts
  };
}

function normalizeArtifact(value) {
  const id = cleanText(value?.id);
  const title = cleanText(value?.title);
  const kind = cleanText(value?.kind);
  const url = cleanText(value?.url);
  const updatedAt = cleanText(value?.updated_at || new Date().toISOString());
  if (!/^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$/.test(id)) {
    throw new Error("artifact index id must be a safe lowercase path segment");
  }
  if (!title) throw new Error("artifact index title is required");
  if (!["html", "mini_app"].includes(kind)) throw new Error("artifact index kind must be html or mini_app");
  if (!/^https?:\/\/\S+$/i.test(url)) throw new Error("artifact index url must be HTTP(S)");
  if (!Number.isFinite(Date.parse(updatedAt))) throw new Error("artifact index updated_at must be an ISO date-time");
  return { id, title, kind, url, updated_at: updatedAt };
}

function requiredPath(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} is required`);
  return path.resolve(text);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  try {
    fs.renameSync(tempPath, filePath);
  } catch {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
  }
}
