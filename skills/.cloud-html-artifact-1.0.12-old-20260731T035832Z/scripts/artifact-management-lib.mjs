import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ARTIFACT_INDEX_VERSION, readArtifactIndex } from "./artifact-index-lib.mjs";

export const ARTIFACT_MANAGEMENT_REGISTRY_VERSION = "cloud-artifacts.registry.v1";
export const ARTIFACT_MANAGEMENT_LIST_VERSION = "cloud-artifacts.management-list.v1";

const ARTIFACT_ID_PATTERN = /^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$/;
const LOCK_WAIT_MS = 10_000;
const LOCK_STALE_MS = 5 * 60_000;
const PRIVATE_FILE_MODE = 0o600;
const PUBLIC_FILE_MODE = 0o644;

export class ArtifactManagementError extends Error {
  constructor(code, message, status = 500, cause = undefined) {
    super(message, cause ? { cause } : undefined);
    this.name = "ArtifactManagementError";
    this.code = code;
    this.status = status;
  }
}

export function resolveArtifactManagementPaths(options) {
  const staticRoot = requiredPath(options.staticRoot, "staticRoot");
  const indexPath = path.resolve(options.indexPath || path.join(staticRoot, "artifacts-index.json"));
  const registryPath = path.resolve(
    options.registryPath || path.join(path.dirname(staticRoot), "artifact-management", "registry.json")
  );
  const trashRoot = path.resolve(
    options.trashRoot || path.join(path.dirname(staticRoot), "artifact-trash")
  );
  assertInside(indexPath, staticRoot, "artifact index");
  if (registryPath === staticRoot || isInside(registryPath, staticRoot)) {
    throw managementError("artifact_path_invalid", "private registry must be outside the public static root", 500);
  }
  if (trashRoot === staticRoot || isInside(trashRoot, staticRoot)) {
    throw managementError("artifact_path_invalid", "trash root must be outside the public static root", 500);
  }
  return { staticRoot, indexPath, registryPath, trashRoot };
}

export function resolveAgentArtifactManagementPaths(options) {
  let agentUid;
  try {
    agentUid = normalizeAgentUID(options.agentUid, "agentUid");
  } catch (error) {
    throw managementError("artifact_path_invalid", messageOf(error), 400, error);
  }
  const staticBaseRoot = requiredPath(options.staticBaseRoot, "staticBaseRoot");
  const managementBaseRoot = requiredPath(options.managementBaseRoot, "managementBaseRoot");
  const trashBaseRoot = requiredPath(options.trashBaseRoot, "trashBaseRoot");
  assertSeparateBaseRoots(staticBaseRoot, managementBaseRoot, trashBaseRoot);
  const namespaceParts = ["by-agent", agentUid];
  const staticRoot = path.resolve(staticBaseRoot, ...namespaceParts);
  const managementRoot = path.resolve(managementBaseRoot, ...namespaceParts);
  const trashRoot = path.resolve(trashBaseRoot, ...namespaceParts);
  return {
    agentUid,
    artifactNamespace: namespaceParts.join("/"),
    ...resolveArtifactManagementPaths({
      staticRoot,
      indexPath: path.join(staticRoot, "artifacts-index.json"),
      registryPath: path.join(managementRoot, "registry.json"),
      trashRoot
    })
  };
}

export function ensureArtifactRegistry(options) {
  const paths = resolveArtifactManagementPaths(options);
  return withArtifactManagementLock(paths.registryPath, () => {
    if (fs.existsSync(paths.registryPath)) {
      return readArtifactRegistry(paths.registryPath);
    }
    const publicIndex = readArtifactIndex(paths.indexPath);
    const registry = migratePublicIndex(publicIndex);
    writeStateTransactional(paths, registry, options);
    return structuredClone(registry);
  }, options);
}

export function listManagedArtifacts(options) {
  const paths = resolveArtifactManagementPaths(options);
  ensureArtifactRegistry({ ...options, ...paths });
  const registry = readArtifactRegistry(paths.registryPath);
  const status = normalizeStatus(options.status || "active");
  const artifacts = registry.artifacts
    .filter(item => item.status === status)
    .sort(compareArtifacts)
    .map(toManagedArtifact);
  return {
    contract_version: ARTIFACT_MANAGEMENT_LIST_VERSION,
    status,
    count: artifacts.length,
    artifacts
  };
}

export function registerPublishedArtifact(options) {
  const paths = resolveArtifactManagementPaths(options);
  return withArtifactManagementLock(paths.registryPath, () => {
    return registerPublishedArtifactUnlocked({ ...options, ...paths });
  }, options);
}

export function assertArtifactPublishAllowedUnlocked(options) {
  const paths = resolveArtifactManagementPaths(options);
  const artifactId = requiredArtifactId(options.artifactId);
  const registry = readOrMigrateRegistry(paths);
  const existing = registry.artifacts.find(item => item.id === artifactId);
  if (existing?.status === "deleted") {
    throw managementError(
      "artifact_operation_conflict",
      "artifact is in the recycle bin and must be restored before publishing",
      409
    );
  }
  return existing ? toManagedArtifact(existing) : null;
}

export function registerPublishedArtifactUnlocked(options) {
  const paths = resolveArtifactManagementPaths(options);
  const input = normalizePublishedArtifact(options.artifact);
  const expectedAgentUID = cleanText(options.agentUid);
  if (expectedAgentUID) {
    let normalizedExpectedAgentUID;
    try {
      normalizedExpectedAgentUID = normalizeAgentUID(expectedAgentUID, "agentUid");
    } catch (error) {
      throw managementError("artifact_path_invalid", messageOf(error), 400, error);
    }
    if (input.agent_uid !== normalizedExpectedAgentUID) {
      throw managementError(
        "artifact_path_invalid",
        "artifact agent_uid must match its storage namespace",
        400
      );
    }
  }
  const registry = readOrMigrateRegistry(paths);
  const artifactRoot = exactArtifactRoot(paths.staticRoot, input.id);
  assertPublishDirectory(artifactRoot);
  const existing = registry.artifacts.find(item => item.id === input.id);
  if (existing?.status === "deleted") {
    throw managementError(
      "artifact_operation_conflict",
      "artifact is in the recycle bin and must be restored before publishing",
      409
    );
  }
  const now = input.updated_at;
  const record = existing || {
    id: input.id,
    title: input.title,
    kind: input.kind,
    url: input.url,
    publish_version: null,
    status: "active",
    created_at: now,
    updated_at: now,
    agent_uid: "",
    agent_name: "",
    owner_uid: "",
    source_topic_id: "",
    source_title: "",
    storage_relative_path: input.id,
    trash_relative_path: "",
    deleted_at: "",
    deleted_by_uid: ""
  };
  record.title = input.title;
  record.kind = input.kind;
  record.url = input.url;
  record.publish_version = input.publish_version ?? record.publish_version;
  record.status = "active";
  record.updated_at = now;
  record.storage_relative_path = input.id;
  for (const key of ["agent_uid", "agent_name", "owner_uid", "source_topic_id", "source_title"]) {
    if (input[key]) record[key] = input[key];
  }
  if (!existing) registry.artifacts.push(record);
  registry.updated_at = now;
  writeStateTransactional(paths, registry, options);
  return toManagedArtifact(record);
}

export function deleteManagedArtifact(options) {
  const paths = resolveArtifactManagementPaths(options);
  const artifactId = requiredArtifactId(options.artifactId);
  const actorUid = requiredIdentity(options.actorUid, "actorUid");
  return withArtifactManagementLock(paths.registryPath, () => {
    const registry = readOrMigrateRegistry(paths);
    const record = registry.artifacts.find(item => item.id === artifactId);
    if (!record) throw managementError("artifact_not_found", "artifact not found", 404);
    if (record.status === "deleted") {
      throw managementError("artifact_already_deleted", "artifact is already deleted", 409);
    }

    const sourcePath = exactArtifactRoot(paths.staticRoot, artifactId);
    assertActiveArtifactDirectory(sourcePath);
    const deletionId = deletionToken();
    const trashRelativePath = path.join(artifactId, deletionId);
    const trashPath = path.resolve(paths.trashRoot, trashRelativePath);
    assertInside(trashPath, paths.trashRoot, "trash destination");
    fs.mkdirSync(path.dirname(trashPath), { recursive: true });
    if (fs.existsSync(trashPath)) {
      throw managementError("artifact_operation_conflict", "trash destination already exists", 409);
    }

    let moved = false;
    try {
      fs.renameSync(sourcePath, trashPath);
      moved = true;
      runFailpoint(options, "after_delete_move");
      const now = new Date().toISOString();
      record.status = "deleted";
      record.updated_at = now;
      record.trash_relative_path = portableRelative(trashRelativePath);
      record.deleted_at = now;
      record.deleted_by_uid = actorUid;
      registry.updated_at = now;
      appendAuditEvent(registry, "delete", artifactId, actorUid, now);
      writeStateTransactional(paths, registry, options);
      return toManagedArtifact(record);
    } catch (error) {
      if (moved && fs.existsSync(trashPath) && !fs.existsSync(sourcePath)) {
        try {
          fs.renameSync(trashPath, sourcePath);
        } catch (rollbackError) {
          throw managementError(
            "artifact_storage_error",
            "artifact deletion failed and storage rollback also failed",
            500,
            rollbackError
          );
        }
      }
      throw normalizeManagementError(error);
    }
  }, options);
}

export function restoreManagedArtifact(options) {
  const paths = resolveArtifactManagementPaths(options);
  const artifactId = requiredArtifactId(options.artifactId);
  const actorUid = requiredIdentity(options.actorUid, "actorUid");
  return withArtifactManagementLock(paths.registryPath, () => {
    const registry = readOrMigrateRegistry(paths);
    const record = registry.artifacts.find(item => item.id === artifactId);
    if (!record) throw managementError("artifact_not_found", "artifact not found", 404);
    if (record.status !== "deleted") {
      throw managementError("artifact_not_deleted", "artifact is not deleted", 409);
    }
    const sourcePath = trashPathForRecord(paths.trashRoot, record);
    const destinationPath = exactArtifactRoot(paths.staticRoot, artifactId);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
      throw managementError("artifact_storage_error", "deleted artifact files are unavailable", 500);
    }
    if (fs.existsSync(destinationPath)) {
      throw managementError("artifact_operation_conflict", "artifact destination already exists", 409);
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    let moved = false;
    try {
      fs.renameSync(sourcePath, destinationPath);
      moved = true;
      assertPublishDirectory(destinationPath);
      runFailpoint(options, "after_restore_move");
      const now = new Date().toISOString();
      record.status = "active";
      record.updated_at = now;
      record.trash_relative_path = "";
      record.deleted_at = "";
      record.deleted_by_uid = "";
      registry.updated_at = now;
      appendAuditEvent(registry, "restore", artifactId, actorUid, now);
      writeStateTransactional(paths, registry, options);
      return toManagedArtifact(record);
    } catch (error) {
      if (moved && fs.existsSync(destinationPath) && !fs.existsSync(sourcePath)) {
        try {
          fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
          fs.renameSync(destinationPath, sourcePath);
        } catch (rollbackError) {
          throw managementError(
            "artifact_storage_error",
            "artifact restore failed and storage rollback also failed",
            500,
            rollbackError
          );
        }
      }
      throw normalizeManagementError(error);
    }
  }, options);
}

export function readArtifactRegistry(registryPath) {
  const resolved = requiredPath(registryPath, "registryPath");
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(resolved, "utf8"));
  } catch (error) {
    throw managementError("artifact_storage_error", "artifact registry is unreadable", 500, error);
  }
  const validation = validateArtifactRegistry(registry);
  if (!validation.ok) {
    throw managementError(
      "artifact_storage_error",
      "artifact registry is invalid: " + validation.errors.join("; "),
      500
    );
  }
  return registry;
}

export function validateArtifactRegistry(registry) {
  const errors = [];
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return { ok: false, errors: ["registry root must be an object"] };
  }
  if (registry.contract_version !== ARTIFACT_MANAGEMENT_REGISTRY_VERSION) {
    errors.push("unsupported registry contract_version");
  }
  if (!validDateTime(registry.created_at)) errors.push("registry.created_at is invalid");
  if (!validDateTime(registry.updated_at)) errors.push("registry.updated_at is invalid");
  if (!Array.isArray(registry.artifacts)) errors.push("registry.artifacts must be an array");
  if (!Array.isArray(registry.events)) errors.push("registry.events must be an array");
  const ids = new Set();
  for (const record of registry.artifacts || []) {
    const id = String(record?.id || "");
    if (!ARTIFACT_ID_PATTERN.test(id)) errors.push("invalid artifact id");
    if (ids.has(id)) errors.push("duplicate artifact id: " + id);
    ids.add(id);
    if (!cleanText(record?.title)) errors.push("artifact title is required: " + id);
    if (!["html", "mini_app"].includes(record?.kind)) errors.push("invalid artifact kind: " + id);
    if (!httpUrl(record?.url)) errors.push("invalid artifact url: " + id);
    if (!["active", "deleted"].includes(record?.status)) errors.push("invalid artifact status: " + id);
    if (!validDateTime(record?.created_at)) errors.push("invalid artifact created_at: " + id);
    if (!validDateTime(record?.updated_at)) errors.push("invalid artifact updated_at: " + id);
    if (record?.storage_relative_path !== id) errors.push("artifact storage path must equal its exact id: " + id);
    if (record?.publish_version !== null
      && (!Number.isInteger(record?.publish_version) || record.publish_version < 1)) {
      errors.push("invalid artifact publish_version: " + id);
    }
    if (record?.status === "deleted") {
      if (!cleanText(record?.trash_relative_path)) errors.push("deleted artifact trash path is required: " + id);
      if (!validDateTime(record?.deleted_at)) errors.push("deleted artifact deleted_at is invalid: " + id);
      if (!cleanText(record?.deleted_by_uid)) errors.push("deleted artifact actor is required: " + id);
    }
  }
  for (const event of registry.events || []) {
    if (!cleanText(event?.event_id)) errors.push("audit event id is required");
    if (!["delete", "restore"].includes(event?.type)) errors.push("invalid audit event type");
    if (!ARTIFACT_ID_PATTERN.test(String(event?.artifact_id || ""))) errors.push("invalid audit artifact id");
    if (!cleanText(event?.actor_uid)) errors.push("audit actor_uid is required");
    if (!validDateTime(event?.at)) errors.push("invalid audit event time");
  }
  return { ok: errors.length === 0, errors: unique(errors) };
}

export function withArtifactManagementLock(registryPath, action, options = {}) {
  const resolved = requiredPath(registryPath, "registryPath");
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const lockPath = resolved + ".lock";
  const waitMs = positiveInteger(options.lockWaitMs, LOCK_WAIT_MS);
  const staleMs = positiveInteger(options.lockStaleMs, LOCK_STALE_MS);
  const deadline = Date.now() + waitMs;
  while (true) {
    try {
      fs.mkdirSync(lockPath);
      fs.writeFileSync(
        path.join(lockPath, "owner.json"),
        JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() }) + "\n",
        "utf8"
      );
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw normalizeManagementError(error);
      let stale = false;
      try {
        stale = Date.now() - fs.statSync(lockPath).mtimeMs > staleMs;
      } catch (statError) {
        if (statError?.code !== "ENOENT") throw normalizeManagementError(statError);
      }
      if (stale) {
        fs.rmSync(lockPath, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) {
        throw managementError("artifact_operation_conflict", "artifact management lock timeout", 409);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    return action();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

function readOrMigrateRegistry(paths) {
  if (fs.existsSync(paths.registryPath)) return readArtifactRegistry(paths.registryPath);
  return migratePublicIndex(readArtifactIndex(paths.indexPath));
}

function migratePublicIndex(index) {
  const now = new Date().toISOString();
  const registryTime = validDateTime(index.updated_at) ? index.updated_at : now;
  return {
    contract_version: ARTIFACT_MANAGEMENT_REGISTRY_VERSION,
    created_at: registryTime,
    updated_at: registryTime,
    artifacts: index.artifacts.map(item => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      url: item.url,
      publish_version: null,
      status: "active",
      created_at: item.updated_at,
      updated_at: item.updated_at,
      agent_uid: "",
      agent_name: "",
      owner_uid: "",
      source_topic_id: "",
      source_title: "",
      storage_relative_path: item.id,
      trash_relative_path: "",
      deleted_at: "",
      deleted_by_uid: ""
    })),
    events: []
  };
}

function writeStateTransactional(paths, registry, options) {
  const validation = validateArtifactRegistry(registry);
  if (!validation.ok) {
    throw managementError(
      "artifact_storage_error",
      "artifact registry validation failed: " + validation.errors.join("; "),
      500
    );
  }
  const publicIndex = publicIndexFromRegistry(registry);
  const registrySnapshot = readSnapshot(paths.registryPath);
  const indexSnapshot = readSnapshot(paths.indexPath);
  try {
    writeJsonAtomic(paths.registryPath, registry, PRIVATE_FILE_MODE);
    runFailpoint(options, "after_registry_write");
    writeJsonAtomic(paths.indexPath, publicIndex, PUBLIC_FILE_MODE);
    runFailpoint(options, "after_index_write");
  } catch (error) {
    const rollbackErrors = [];
    try {
      restoreSnapshot(paths.registryPath, registrySnapshot);
    } catch (rollbackError) {
      rollbackErrors.push("registry rollback failed: " + messageOf(rollbackError));
    }
    try {
      restoreSnapshot(paths.indexPath, indexSnapshot);
    } catch (rollbackError) {
      rollbackErrors.push("index rollback failed: " + messageOf(rollbackError));
    }
    if (rollbackErrors.length) {
      throw managementError(
        "artifact_storage_error",
        "artifact metadata write failed; " + rollbackErrors.join("; "),
        500,
        error
      );
    }
    throw normalizeManagementError(error);
  }
}

function publicIndexFromRegistry(registry) {
  const artifacts = registry.artifacts
    .filter(item => item.status === "active")
    .sort(compareArtifacts)
    .map(item => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      url: item.url,
      updated_at: item.updated_at
    }));
  return {
    contract_version: ARTIFACT_INDEX_VERSION,
    updated_at: registry.updated_at,
    artifacts
  };
}

function normalizePublishedArtifact(value) {
  const id = requiredArtifactId(value?.id);
  const title = cleanText(value?.title);
  const kind = cleanText(value?.kind);
  const url = cleanText(value?.url);
  const updatedAt = cleanText(value?.updated_at || new Date().toISOString());
  if (!title) throw managementError("artifact_path_invalid", "artifact title is required", 400);
  if (!["html", "mini_app"].includes(kind)) {
    throw managementError("artifact_path_invalid", "artifact kind must be html or mini_app", 400);
  }
  if (!httpUrl(url)) throw managementError("artifact_path_invalid", "artifact url must be HTTP(S)", 400);
  if (!validDateTime(updatedAt)) {
    throw managementError("artifact_path_invalid", "artifact updated_at must be an ISO date-time", 400);
  }
  const publishVersion = value?.publish_version === undefined || value?.publish_version === null || value?.publish_version === ""
    ? null
    : Number(value.publish_version);
  if (publishVersion !== null && (!Number.isInteger(publishVersion) || publishVersion < 1)) {
    throw managementError("artifact_path_invalid", "artifact publish_version must be a positive integer", 400);
  }
  return {
    id,
    title: title.slice(0, 160),
    kind,
    url,
    updated_at: updatedAt,
    publish_version: publishVersion,
    agent_uid: optionalIdentity(value?.agent_uid, "agent_uid"),
    agent_name: optionalIdentity(value?.agent_name, "agent_name"),
    owner_uid: optionalIdentity(value?.owner_uid, "owner_uid"),
    source_topic_id: optionalIdentity(value?.source_topic_id, "source_topic_id"),
    source_title: optionalIdentity(value?.source_title, "source_title")
  };
}

function toManagedArtifact(record) {
  return {
    id: record.id,
    title: record.title,
    kind: record.kind,
    url: record.url,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    publish_version: record.publish_version,
    agent_uid: record.agent_uid || "",
    agent_name: record.agent_name || "",
    source_title: record.source_title || "",
    deleted_at: record.deleted_at || "",
    can_delete: record.status === "active",
    can_restore: record.status === "deleted"
  };
}

function assertSeparateBaseRoots(staticRoot, managementRoot, trashRoot) {
  if (pathsOverlap(staticRoot, managementRoot)) {
    throw managementError(
      "artifact_path_invalid",
      "managementBaseRoot must be outside staticBaseRoot",
      500
    );
  }
  if (pathsOverlap(staticRoot, trashRoot)) {
    throw managementError(
      "artifact_path_invalid",
      "trashBaseRoot must be outside staticBaseRoot",
      500
    );
  }
  if (pathsOverlap(managementRoot, trashRoot)) {
    throw managementError(
      "artifact_path_invalid",
      "managementBaseRoot and trashBaseRoot must not overlap",
      500
    );
  }
}

function pathsOverlap(left, right) {
  const leftRoot = path.resolve(left);
  const rightRoot = path.resolve(right);
  return leftRoot === rightRoot || isInside(leftRoot, rightRoot) || isInside(rightRoot, leftRoot);
}

function appendAuditEvent(registry, type, artifactId, actorUid, at) {
  registry.events.push({
    event_id: crypto.randomUUID(),
    type,
    artifact_id: artifactId,
    actor_uid: actorUid,
    at,
    result: "success"
  });
}

function exactArtifactRoot(staticRoot, artifactId) {
  const exactId = requiredArtifactId(artifactId);
  const target = path.resolve(staticRoot, exactId);
  assertInside(target, staticRoot, "artifact directory");
  return target;
}

function trashPathForRecord(trashRoot, record) {
  const relative = cleanText(record.trash_relative_path);
  if (!relative || path.isAbsolute(relative)) {
    throw managementError("artifact_path_invalid", "deleted artifact trash path is invalid", 500);
  }
  const target = path.resolve(trashRoot, relative);
  assertInside(target, trashRoot, "artifact trash path");
  return target;
}

function assertActiveArtifactDirectory(target) {
  if (!fs.existsSync(target)) {
    throw managementError("artifact_storage_error", "artifact directory is unavailable", 500);
  }
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw managementError("artifact_path_invalid", "artifact directory is invalid", 500);
  }
}

function assertPublishDirectory(target) {
  assertActiveArtifactDirectory(target);
  const latestEntry = path.join(target, "latest", "index.html");
  if (!fs.existsSync(latestEntry) || !fs.statSync(latestEntry).isFile()) {
    throw managementError("artifact_storage_error", "artifact latest entry is unavailable", 500);
  }
}

function assertInside(target, root, label) {
  if (!isInside(target, root)) {
    throw managementError("artifact_path_invalid", label + " escapes its configured root", 500);
  }
}

function isInside(target, root) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  return resolvedTarget !== resolvedRoot && resolvedTarget.startsWith(resolvedRoot + path.sep);
}

function normalizeStatus(value) {
  const status = cleanText(value);
  if (!["active", "deleted"].includes(status)) {
    throw managementError("artifact_path_invalid", "status must be active or deleted", 400);
  }
  return status;
}

function requiredArtifactId(value) {
  const id = cleanText(value);
  if (!ARTIFACT_ID_PATTERN.test(id)) {
    throw managementError("artifact_path_invalid", "artifact id is invalid", 400);
  }
  return id;
}

function requiredIdentity(value, label) {
  const identity = optionalIdentity(value, label);
  if (!identity) throw managementError("artifact_path_invalid", label + " is required", 400);
  return identity;
}

function optionalIdentity(value, label) {
  const identity = cleanText(value);
  if (!identity) return "";
  if (identity.length > 256 || /[\x00-\x1f\x7f]/.test(identity)) {
    throw managementError("artifact_path_invalid", label + " is invalid", 400);
  }
  return identity;
}

function requiredPath(value, label) {
  const text = cleanText(value);
  if (!text) throw managementError("artifact_path_invalid", label + " is required", 500);
  return path.resolve(text);
}

function normalizeAgentUID(value, label) {
  const match = cleanText(value).match(/^(?:usr)?([1-9]\d*)$/i);
  if (!match) {
    throw new Error(`${label} must be a positive CatsCo UID such as usr440 or 440`);
  }
  const number = BigInt(match[1]);
  if (number > 9_223_372_036_854_775_807n) {
    throw new Error(`${label} exceeds the supported CatsCo UID range`);
  }
  return number.toString();
}

function deletionToken() {
  return new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(6).toString("hex");
}

function portableRelative(value) {
  return String(value).split(path.sep).join("/");
}

function compareArtifacts(left, right) {
  const byTime = String(right.updated_at).localeCompare(String(left.updated_at));
  return byTime || left.id.localeCompare(right.id);
}

function readSnapshot(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return {
    content: fs.readFileSync(filePath),
    mode: fs.statSync(filePath).mode & 0o777
  };
}

function restoreSnapshot(filePath, snapshot) {
  if (snapshot === null) {
    fs.rmSync(filePath, { force: true });
    return;
  }
  writeBufferAtomic(filePath, snapshot.content, snapshot.mode);
}

function writeJsonAtomic(filePath, value, mode) {
  writeBufferAtomic(filePath, Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8"), mode);
}

function writeBufferAtomic(filePath, value, mode) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = filePath + ".tmp-" + process.pid + "-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
  fs.writeFileSync(tempPath, value, mode === undefined ? undefined : { mode });
  try {
    fs.renameSync(tempPath, filePath);
  } catch {
    fs.rmSync(filePath, { force: true });
    fs.renameSync(tempPath, filePath);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

function runFailpoint(options, name) {
  if (typeof options.failpoint === "function") options.failpoint(name);
}

function normalizeManagementError(error) {
  if (error instanceof ArtifactManagementError) return error;
  return managementError("artifact_storage_error", "artifact storage operation failed", 500, error);
}

function managementError(code, message, status, cause) {
  return new ArtifactManagementError(code, message, status, cause);
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function validDateTime(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function httpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(String(value || "")).protocol);
  } catch {
    return false;
  }
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function unique(values) {
  return [...new Set(values)];
}
