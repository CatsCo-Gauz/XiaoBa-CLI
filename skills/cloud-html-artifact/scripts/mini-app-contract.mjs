import path from "node:path";

export const MINI_APP_CONTRACT_VERSION = "cloud-mini-app.spec.v1";
export const MINI_APP_TYPE = "stateful-mini-app";
export const MINI_APP_STORAGE_KIND = "json-file";

export const SUPPORTED_MINI_APP_FEATURES = new Set([
  "list",
  "create",
  "edit",
  "delete",
  "filter",
  "task-checklist",
  "persist",
  "reset"
]);

export const SUPPORTED_MINI_APP_FIELD_TYPES = new Set([
  "text",
  "email",
  "number",
  "date",
  "status",
  "select",
  "textarea",
  "boolean",
  "url",
  "tel"
]);

export const SUPPORTED_MINI_APP_OPTION_TONES = new Set(["neutral", "active", "success", "warning", "danger"]);

export function validateMiniAppSpec(spec) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(spec)) {
    return { ok: false, errors: ["spec root must be an object"], warnings, resolved: null };
  }

  if (spec.contract_version !== MINI_APP_CONTRACT_VERSION) {
    errors.push("contract_version must be " + MINI_APP_CONTRACT_VERSION);
  }
  if (!safeSlug(spec.app_id)) errors.push("app_id must use lowercase letters, digits, and hyphens");
  if (!cleanText(spec.title)) errors.push("title is required");
  if (!cleanText(spec.description)) warnings.push("description_is_recommended");
  if (spec.app_type !== MINI_APP_TYPE) errors.push("app_type must be " + MINI_APP_TYPE);
  if (spec.locale !== undefined && !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(cleanText(spec.locale))) {
    errors.push("locale must use a language tag such as en or zh-CN");
  }
  if (spec.ui !== undefined) validateUi(spec.ui, errors);
  if (!cleanText(spec.ui?.eyebrow)) warnings.push("ui.eyebrow_is_recommended");

  const storage = isPlainObject(spec.storage) ? spec.storage : {};
  if (storage.kind !== MINI_APP_STORAGE_KIND) errors.push("storage.kind must be " + MINI_APP_STORAGE_KIND);
  const statePath = validateDataPath(storage.state_file, "storage.state_file", errors);
  const seedPath = validateDataPath(storage.seed_file, "storage.seed_file", errors);
  if (statePath && seedPath && statePath === seedPath) {
    errors.push("storage.state_file and storage.seed_file must be different files");
  }

  const features = Array.isArray(spec.features) ? spec.features : [];
  const featureSet = new Set();
  if (!Array.isArray(spec.features)) errors.push("features must be an array");
  for (const feature of features) {
    const value = cleanText(feature);
    if (!value) {
      errors.push("features must not contain empty values");
      continue;
    }
    if (featureSet.has(value)) errors.push("duplicate feature: " + value);
    featureSet.add(value);
    if (!SUPPORTED_MINI_APP_FEATURES.has(value)) errors.push("unsupported feature: " + value);
  }
  for (const required of ["list", "persist"]) {
    if (!featureSet.has(required)) errors.push("stateful mini app requires feature: " + required);
  }

  const entities = Array.isArray(spec.entities) ? spec.entities : [];
  if (!entities.length) errors.push("entities must contain at least one entity");
  const entityIds = new Set();
  for (const [entityIndex, entity] of entities.entries()) {
    const prefix = "entities[" + entityIndex + "]";
    if (!isPlainObject(entity)) {
      errors.push(prefix + " must be an object");
      continue;
    }
    if (!safeSlug(entity.id)) errors.push(prefix + ".id must use lowercase letters, digits, and hyphens");
    if (entityIds.has(entity.id)) errors.push("duplicate entity id: " + entity.id);
    entityIds.add(entity.id);
    if (!cleanText(entity.label)) errors.push(prefix + ".label is required");
    if (entity.singular_label !== undefined && !cleanText(entity.singular_label)) {
      errors.push(prefix + ".singular_label must be non-empty when present");
    }
    const primaryKey = cleanText(entity.primary_key || "id");
    if (!safeFieldKey(primaryKey)) errors.push(prefix + ".primary_key is invalid");

    const fields = Array.isArray(entity.fields) ? entity.fields : [];
    if (!fields.length) errors.push(prefix + ".fields must contain at least one field");
    if (fields.length >= 4 && !isPlainObject(entity.display)) warnings.push(prefix + ".display_is_recommended_for_domain_led_ui");
    const fieldKeys = new Set();
    for (const [fieldIndex, field] of fields.entries()) {
      const fieldPrefix = prefix + ".fields[" + fieldIndex + "]";
      if (!isPlainObject(field)) {
        errors.push(fieldPrefix + " must be an object");
        continue;
      }
      if (!safeFieldKey(field.key)) errors.push(fieldPrefix + ".key is invalid");
      if (fieldKeys.has(field.key)) errors.push("duplicate field key in " + entity.id + ": " + field.key);
      fieldKeys.add(field.key);
      validateFieldDefinition(field, fieldPrefix, errors, warnings, false);
    }
    const taskFields = Array.isArray(entity.task_fields) ? entity.task_fields : [];
    if (entity.task_fields !== undefined && !Array.isArray(entity.task_fields)) {
      errors.push(prefix + ".task_fields must be an array when present");
    }
    if (taskFields.length > 6) errors.push(prefix + ".task_fields must contain at most 6 fields");
    if (taskFields.length && !featureSet.has("task-checklist")) {
      errors.push(prefix + ".task_fields requires feature: task-checklist");
    }
    const taskFieldKeys = new Set();
    for (const [fieldIndex, field] of taskFields.entries()) {
      const fieldPrefix = prefix + ".task_fields[" + fieldIndex + "]";
      if (!isPlainObject(field)) {
        errors.push(fieldPrefix + " must be an object");
        continue;
      }
      if (!safeFieldKey(field.key)) errors.push(fieldPrefix + ".key is invalid");
      if (["id", "title", "status"].includes(field.key)) errors.push(fieldPrefix + ".key is reserved");
      if (taskFieldKeys.has(field.key)) errors.push("duplicate task field key in " + entity.id + ": " + field.key);
      taskFieldKeys.add(field.key);
      validateFieldDefinition(field, fieldPrefix, errors, warnings, true);
      if (field.default_from !== undefined && !fieldKeys.has(cleanText(field.default_from))) {
        errors.push(fieldPrefix + ".default_from must reference an entity field");
      }
    }
    if (entity.display !== undefined) validateEntityDisplay(entity.display, fields, prefix, errors);
    if (fieldKeys.has(primaryKey)) warnings.push(prefix + ".primary_key is also listed as an editable field");
  }

  const seed = isPlainObject(spec.seed) ? spec.seed : null;
  if (!seed) {
    errors.push("seed must be an object");
  } else {
    for (const entity of entities.filter(isPlainObject)) {
      const rows = seed[entity.id];
      if (!Array.isArray(rows)) {
        errors.push("seed." + entity.id + " must be an array");
        continue;
      }
      const primaryKey = cleanText(entity.primary_key || "id");
      const rowIds = new Set();
      for (const [rowIndex, row] of rows.entries()) {
        const rowPrefix = "seed." + entity.id + "[" + rowIndex + "]";
        if (!isPlainObject(row)) {
          errors.push(rowPrefix + " must be an object");
          continue;
        }
        const rowId = cleanText(row[primaryKey]);
        if (!rowId) errors.push(rowPrefix + "." + primaryKey + " is required");
        if (rowIds.has(rowId)) errors.push("duplicate seed id in " + entity.id + ": " + rowId);
        rowIds.add(rowId);
        if (row.tasks !== undefined) validateTasks(row.tasks, rowPrefix + ".tasks", errors, Array.isArray(entity.task_fields) ? entity.task_fields : [], row);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    resolved: errors.length ? null : {
      app_id: spec.app_id,
      title: spec.title,
      entity_ids: entities.map(entity => entity.id),
      state_file: statePath,
      seed_file: seedPath,
      features: Array.from(featureSet)
    }
  };
}

function validateUi(ui, errors) {
  if (!isPlainObject(ui)) {
    errors.push("ui must be an object when present");
    return;
  }
  if (ui.eyebrow !== undefined && !cleanText(ui.eyebrow)) errors.push("ui.eyebrow must be non-empty when present");
  if (ui.density !== undefined && !["comfortable", "compact"].includes(cleanText(ui.density))) {
    errors.push("ui.density must be comfortable or compact");
  }
}

function validateEntityDisplay(display, fields, prefix, errors) {
  if (!isPlainObject(display)) {
    errors.push(prefix + ".display must be an object when present");
    return;
  }
  const keys = new Set(fields.filter(isPlainObject).map(field => field.key));
  if (display.title_field !== undefined && !keys.has(cleanText(display.title_field))) {
    errors.push(prefix + ".display.title_field must reference an entity field");
  }
  for (const [name, limit] of [["subtitle_fields", 2], ["metadata_fields", 4], ["filter_fields", 4]]) {
    if (display[name] === undefined) continue;
    if (!Array.isArray(display[name]) || display[name].length > limit) {
      errors.push(prefix + ".display." + name + " must be an array with at most " + limit + " items");
      continue;
    }
    const seen = new Set();
    for (const value of display[name]) {
      const key = cleanText(value);
      if (!keys.has(key)) errors.push(prefix + ".display." + name + " references an unknown field: " + key);
      if (seen.has(key)) errors.push(prefix + ".display." + name + " contains a duplicate field: " + key);
      seen.add(key);
    }
  }
}

function validateFieldOptions(field, prefix, errors) {
  if (field.options === undefined) {
    if (field.type === "select") errors.push(prefix + ".options is required for select fields");
    return;
  }
  if (!Array.isArray(field.options) || !field.options.length) {
    errors.push(prefix + ".options must be a non-empty array when present");
    return;
  }
  if (!["select", "status"].includes(field.type)) errors.push(prefix + ".options is only supported for select or status fields");
  const values = new Set();
  for (const [index, option] of field.options.entries()) {
    const optionPrefix = prefix + ".options[" + index + "]";
    if (!isPlainObject(option)) {
      errors.push(optionPrefix + " must be an object");
      continue;
    }
    const value = cleanText(option.value);
    if (!value) errors.push(optionPrefix + ".value is required");
    if (values.has(value)) errors.push(prefix + ".options contains a duplicate value: " + value);
    values.add(value);
    if (!cleanText(option.label)) errors.push(optionPrefix + ".label is required");
    if (option.tone !== undefined && !SUPPORTED_MINI_APP_OPTION_TONES.has(cleanText(option.tone))) {
      errors.push(optionPrefix + ".tone is unsupported: " + cleanText(option.tone));
    }
  }
}

function validateFieldDefinition(field, prefix, errors, warnings, taskField) {
  if (!cleanText(field.label)) errors.push(prefix + ".label is required");
  if (!SUPPORTED_MINI_APP_FIELD_TYPES.has(field.type)) {
    errors.push(prefix + ".type is unsupported: " + cleanText(field.type));
  }
  if (field.required !== undefined && typeof field.required !== "boolean") {
    errors.push(prefix + ".required must be boolean when present");
  }
  if (field.placeholder !== undefined && !cleanText(field.placeholder)) {
    errors.push(prefix + ".placeholder must be non-empty when present");
  }
  if (!taskField && (field.default !== undefined || field.default_from !== undefined)) {
    errors.push(prefix + ".default and .default_from are only supported for task_fields");
  }
  if (taskField) {
    if (field.default !== undefined && field.default_from !== undefined) {
      errors.push(prefix + ".default and .default_from cannot both be present");
    }
    if (field.default_from !== undefined && !safeFieldKey(field.default_from)) {
      errors.push(prefix + ".default_from is invalid");
    }
    if (field.default !== undefined) validateFieldValue(field.default, field, prefix + ".default", errors);
  }
  validateFieldOptions(field, prefix, errors);
  if (field.type === "status" && field.options === undefined) warnings.push(prefix + ".options_are_recommended_for_status_labels");
}

export function safeRelativeDataPath(value) {
  const normalized = cleanText(value).replace(/\\/g, "/");
  if (!normalized || path.posix.isAbsolute(normalized)) return "";
  const clean = path.posix.normalize(normalized);
  if (clean === ".." || clean.startsWith("../") || !clean.startsWith("data/")) return "";
  if (!clean.toLowerCase().endsWith(".json")) return "";
  return clean;
}

function validateDataPath(value, label, errors) {
  const normalized = safeRelativeDataPath(value);
  if (!normalized) errors.push(label + " must be a relative JSON path under data/");
  return normalized;
}

function validateTasks(tasks, prefix, errors, taskFields, parentRow) {
  if (!Array.isArray(tasks)) {
    errors.push(prefix + " must be an array");
    return;
  }
  const ids = new Set();
  for (const [index, task] of tasks.entries()) {
    const taskPrefix = prefix + "[" + index + "]";
    if (!isPlainObject(task)) {
      errors.push(taskPrefix + " must be an object");
      continue;
    }
    if (!cleanText(task.id)) errors.push(taskPrefix + ".id is required");
    if (ids.has(task.id)) errors.push("duplicate task id in " + prefix + ": " + task.id);
    ids.add(task.id);
    if (!cleanText(task.title)) errors.push(taskPrefix + ".title is required");
    if (!cleanText(task.status)) errors.push(taskPrefix + ".status is required");
    for (const field of taskFields.filter(isPlainObject)) {
      const explicit = task[field.key];
      const fallback = field.default !== undefined ? field.default : parentRow[field.default_from];
      if (explicit !== undefined) validateFieldValue(explicit, field, taskPrefix + "." + field.key, errors);
      if (field.required && !hasFieldValue(explicit !== undefined ? explicit : fallback, field.type)) {
        errors.push(taskPrefix + "." + field.key + " is required or needs a usable default/default_from value");
      }
    }
  }
}

function validateFieldValue(value, field, prefix, errors) {
  if (field.type === "boolean") {
    if (typeof value !== "boolean") errors.push(prefix + " must be boolean");
    return;
  }
  if (field.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(prefix + " must be a finite number");
    return;
  }
  if (typeof value !== "string") {
    errors.push(prefix + " must be a string for field type " + field.type);
    return;
  }
  if (["select", "status"].includes(field.type) && Array.isArray(field.options)) {
    const values = new Set(field.options.filter(isPlainObject).map(option => option.value));
    if (value && !values.has(value)) errors.push(prefix + " must match a configured option");
  }
}

function hasFieldValue(value, type) {
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "string" && value.trim().length > 0;
}

function safeSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanText(value));
}

function safeFieldKey(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(cleanText(value));
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
