export function analyzeMiniAppSpecChange(currentSpec, nextSpec) {
  const changes = {
    entities_added: [],
    entities_removed: [],
    fields_added: [],
    fields_removed: [],
    field_types_changed: [],
    task_fields_added: [],
    task_fields_removed: [],
    task_field_types_changed: [],
    primary_keys_changed: [],
    features_added: [],
    features_removed: []
  };
  const blockers = [];

  if (!currentSpec) {
    changes.entities_added = (nextSpec?.entities || []).map(entity => entity.id);
    return finalizeAnalysis(changes, blockers);
  }
  if (currentSpec.app_id !== nextSpec.app_id) blockers.push("app_id_change_not_supported");
  if (currentSpec.storage?.state_file !== nextSpec.storage?.state_file) blockers.push("state_file_change_not_supported");
  if (currentSpec.storage?.seed_file !== nextSpec.storage?.seed_file) blockers.push("seed_file_change_not_supported");

  const currentEntities = new Map((currentSpec.entities || []).map(entity => [entity.id, entity]));
  const nextEntities = new Map((nextSpec.entities || []).map(entity => [entity.id, entity]));
  changes.entities_added = difference(nextEntities.keys(), currentEntities.keys());
  changes.entities_removed = difference(currentEntities.keys(), nextEntities.keys());

  for (const [entityId, currentEntity] of currentEntities) {
    const nextEntity = nextEntities.get(entityId);
    if (!nextEntity) continue;
    const currentPrimary = currentEntity.primary_key || "id";
    const nextPrimary = nextEntity.primary_key || "id";
    if (currentPrimary !== nextPrimary) {
      changes.primary_keys_changed.push({ entity_id: entityId, from: currentPrimary, to: nextPrimary });
      blockers.push("primary_key_change_not_supported:" + entityId);
    }
    const currentFields = new Map((currentEntity.fields || []).map(field => [field.key, field]));
    const nextFields = new Map((nextEntity.fields || []).map(field => [field.key, field]));
    for (const key of difference(nextFields.keys(), currentFields.keys())) {
      changes.fields_added.push({ entity_id: entityId, field: key });
    }
    for (const key of difference(currentFields.keys(), nextFields.keys())) {
      changes.fields_removed.push({ entity_id: entityId, field: key });
    }
    for (const [key, currentField] of currentFields) {
      const nextField = nextFields.get(key);
      if (nextField && currentField.type !== nextField.type) {
        changes.field_types_changed.push({ entity_id: entityId, field: key, from: currentField.type, to: nextField.type });
        blockers.push("field_type_change_not_supported:" + entityId + "." + key);
      }
    }
    const currentTaskFields = new Map((currentEntity.task_fields || []).map(field => [field.key, field]));
    const nextTaskFields = new Map((nextEntity.task_fields || []).map(field => [field.key, field]));
    for (const key of difference(nextTaskFields.keys(), currentTaskFields.keys())) {
      changes.task_fields_added.push({ entity_id: entityId, field: key });
    }
    for (const key of difference(currentTaskFields.keys(), nextTaskFields.keys())) {
      changes.task_fields_removed.push({ entity_id: entityId, field: key });
    }
    for (const [key, currentField] of currentTaskFields) {
      const nextField = nextTaskFields.get(key);
      if (nextField && currentField.type !== nextField.type) {
        changes.task_field_types_changed.push({ entity_id: entityId, field: key, from: currentField.type, to: nextField.type });
        blockers.push("task_field_type_change_not_supported:" + entityId + "." + key);
      }
    }
  }

  const currentFeatures = new Set(currentSpec.features || []);
  const nextFeatures = new Set(nextSpec.features || []);
  changes.features_added = difference(nextFeatures, currentFeatures);
  changes.features_removed = difference(currentFeatures, nextFeatures);
  return finalizeAnalysis(changes, blockers);
}

export function migrateMiniAppState({ currentSpec = null, nextSpec, currentState = null, nextSeed, allowDestructive = false }) {
  const analysis = analyzeMiniAppSpecChange(currentSpec, nextSpec);
  const errors = [...analysis.blockers];
  const warnings = [];
  if (analysis.requires_destructive_confirmation && !allowDestructive) {
    errors.push("destructive_state_migration_requires_confirmation");
  }
  if (!isPlainObject(nextSeed)) errors.push("next_seed_must_be_an_object");
  if (currentState !== null && !isPlainObject(currentState)) errors.push("current_state_must_be_an_object");
  if (errors.length) return migrationResult(false, null, analysis, errors, warnings, false, {});

  const state = structuredClone(currentState || nextSeed || {});
  const currentEntities = new Map((currentSpec?.entities || []).map(entity => [entity.id, entity]));
  const nextEntityIds = new Set((nextSpec.entities || []).map(entity => entity.id));
  const summary = {
    entities_initialized: [],
    entities_removed: [],
    rows_preserved: 0,
    fields_seeded: 0,
    fields_removed: 0,
    tasks_initialized: 0,
    task_fields_seeded: 0,
    task_fields_defaulted: 0,
    task_fields_removed: 0
  };

  if (allowDestructive) {
    for (const entityId of analysis.changes.entities_removed) {
      if (Object.hasOwn(state, entityId)) {
        delete state[entityId];
        summary.entities_removed.push(entityId);
      }
    }
  }

  for (const entity of nextSpec.entities || []) {
    const seedRows = Array.isArray(nextSeed?.[entity.id]) ? nextSeed[entity.id] : [];
    const previousRows = Array.isArray(state[entity.id]) ? state[entity.id] : null;
    if (!previousRows) {
      state[entity.id] = structuredClone(seedRows);
      summary.entities_initialized.push(entity.id);
    }

    const primaryKey = entity.primary_key || "id";
    const seedById = new Map(seedRows.map(row => [String(row?.[primaryKey] ?? ""), row]));
    const nextFields = new Set((entity.fields || []).map(field => field.key));
    const currentEntity = currentEntities.get(entity.id);
    const currentFields = new Set((currentEntity?.fields || []).map(field => field.key));
    const removedFields = difference(currentFields, nextFields);

    for (const row of state[entity.id]) {
      if (!isPlainObject(row)) continue;
      if (previousRows) summary.rows_preserved += 1;
      const seedRow = seedById.get(String(row[primaryKey] ?? ""));
      for (const field of entity.fields || []) {
        if (row[field.key] === undefined && seedRow?.[field.key] !== undefined) {
          row[field.key] = structuredClone(seedRow[field.key]);
          summary.fields_seeded += 1;
        }
      }
      if (allowDestructive) {
        for (const key of removedFields) {
          if (Object.hasOwn(row, key)) {
            delete row[key];
            summary.fields_removed += 1;
          }
        }
      }
      migrateTasksForRow({
        row,
        seedRow,
        entity,
        currentEntity,
        taskChecklist: nextSpec.features?.includes("task-checklist"),
        allowDestructive,
        summary,
        errors
      });
    }
  }

  for (const entityId of nextEntityIds) {
    if (!Array.isArray(state[entityId])) errors.push("migrated_entity_state_must_be_array:" + entityId);
  }
  const changed = JSON.stringify(currentState || {}) !== JSON.stringify(state);
  if (!changed) warnings.push("state_migration_no_changes_required");
  return migrationResult(errors.length === 0, state, analysis, errors, warnings, changed, summary);
}

function finalizeAnalysis(changes, blockers) {
  const destructive = changes.entities_removed.length > 0 ||
    changes.fields_removed.length > 0 ||
    changes.field_types_changed.length > 0 ||
    changes.task_fields_removed.length > 0 ||
    changes.task_field_types_changed.length > 0 ||
    changes.features_removed.includes("task-checklist");
  return {
    ok: blockers.length === 0,
    changes,
    changed: Object.values(changes).some(values => values.length > 0),
    requires_destructive_confirmation: destructive,
    blockers: unique(blockers)
  };
}

function migrateTasksForRow({ row, seedRow, entity, currentEntity, taskChecklist, allowDestructive, summary, errors }) {
  if (!taskChecklist) {
    if (allowDestructive && Object.hasOwn(row, "tasks")) delete row.tasks;
    return;
  }
  if (!Array.isArray(row.tasks) && Array.isArray(seedRow?.tasks)) {
    row.tasks = structuredClone(seedRow.tasks);
    summary.tasks_initialized += row.tasks.length;
  }
  if (!Array.isArray(row.tasks)) return;

  const seedTasks = Array.isArray(seedRow?.tasks) ? seedRow.tasks : [];
  const seedTaskById = new Map(seedTasks.map(task => [String(task?.id ?? ""), task]));
  const taskFields = entity.task_fields || [];
  const nextTaskFieldKeys = new Set(taskFields.map(field => field.key));
  const currentTaskFieldKeys = new Set((currentEntity?.task_fields || []).map(field => field.key));
  const removedTaskFields = difference(currentTaskFieldKeys, nextTaskFieldKeys);

  for (const task of row.tasks) {
    if (!isPlainObject(task)) continue;
    const seedTask = seedTaskById.get(String(task.id ?? ""));
    for (const field of taskFields) {
      if (task[field.key] === undefined) {
        if (seedTask?.[field.key] !== undefined) {
          task[field.key] = structuredClone(seedTask[field.key]);
          summary.task_fields_seeded += 1;
        } else {
          task[field.key] = taskFieldDefault(field, row);
          summary.task_fields_defaulted += 1;
        }
      }
      if (field.required && !hasFieldValue(task[field.key], field.type)) {
        errors.push("required_task_field_missing:" + entity.id + "." + String(row[entity.primary_key || "id"] ?? "") + "." + String(task.id ?? "") + "." + field.key);
      }
    }
    if (allowDestructive) {
      for (const key of removedTaskFields) {
        if (Object.hasOwn(task, key)) {
          delete task[key];
          summary.task_fields_removed += 1;
        }
      }
    }
  }
}

function taskFieldDefault(field, row) {
  if (field.default !== undefined) return structuredClone(field.default);
  if (field.default_from !== undefined && row[field.default_from] !== undefined) return structuredClone(row[field.default_from]);
  return field.type === "boolean" ? false : "";
}

function hasFieldValue(value, type) {
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "string" && value.trim().length > 0;
}

function migrationResult(ok, state, analysis, errors, warnings, changed, summary) {
  return {
    ok,
    contract_version: "cloud-mini-app.state-migration.v1",
    changed,
    state,
    analysis,
    summary,
    errors: unique(errors),
    warnings: unique(warnings)
  };
}

function difference(left, right) {
  const rightSet = right instanceof Set ? right : new Set(right);
  return Array.from(left).filter(value => !rightSet.has(value));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
