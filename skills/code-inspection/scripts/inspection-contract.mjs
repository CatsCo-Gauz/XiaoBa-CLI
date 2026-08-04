export const SCHEMA_VERSION = 1;
export const MODES = new Set(['baseline', 'change', 'focus']);

export function validateInspectionReport(report) {
  const errors = [];
  const requireObject = (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path} must be an object`);
      return false;
    }
    return true;
  };
  const requireString = (value, path) => {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${path} must be a non-empty string`);
      return false;
    }
    return true;
  };
  const requireArray = (value, path) => {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return false;
    }
    return true;
  };
  const requireStringArray = (value, path) => {
    if (!requireArray(value, path)) return false;
    value.forEach((item, index) => requireString(item, `${path}[${index}]`));
    return true;
  };

  if (!requireObject(report, 'report')) return errors;
  if (report.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`schemaVersion must equal ${SCHEMA_VERSION}`);
  }
  requireString(report.inspectionId, 'inspectionId');
  requireString(report.generatedAt, 'generatedAt');
  if (typeof report.generatedAt === 'string' && Number.isNaN(Date.parse(report.generatedAt))) {
    errors.push('generatedAt must be an ISO-compatible timestamp');
  }
  if (!MODES.has(report.mode)) {
    errors.push('mode must be baseline, change, or focus');
  }
  requireString(report.goal, 'goal');

  if (requireObject(report.source, 'source')) {
    requireString(report.source.repo, 'source.repo');
    requireString(report.source.snapshot, 'source.snapshot');
    requireString(report.source.snapshotType, 'source.snapshotType');
    if (report.mode === 'change') {
      requireString(report.source.baseSnapshot, 'source.baseSnapshot');
    }
    if (report.source.mutable === true) {
      requireString(report.source.mutabilityLimitation, 'source.mutabilityLimitation');
    }
  }

  if (requireObject(report.scope, 'scope')) {
    requireStringArray(report.scope.included, 'scope.included');
    requireStringArray(report.scope.excluded, 'scope.excluded');
    requireStringArray(report.scope.evidencePermissions, 'scope.evidencePermissions');
    if (report.mode === 'focus') requireString(report.scope.topic, 'scope.topic');
  }

  if (requireObject(report.summary, 'summary')) {
    requireString(report.summary.conclusion, 'summary.conclusion');
    if (!Number.isInteger(report.summary.findingCount) || report.summary.findingCount < 0) {
      errors.push('summary.findingCount must be a non-negative integer');
    }
  }

  const evidenceIds = new Set();
  if (requireArray(report.evidence, 'evidence')) {
    report.evidence.forEach((item, index) => {
      const path = `evidence[${index}]`;
      if (!requireObject(item, path)) return;
      requireString(item.id, `${path}.id`);
      requireString(item.type, `${path}.type`);
      requireString(item.title, `${path}.title`);
      requireString(item.source, `${path}.source`);
      requireString(item.method, `${path}.method`);
      requireString(item.limitations, `${path}.limitations`);
      if (typeof item.id === 'string') {
        if (evidenceIds.has(item.id)) errors.push(`${path}.id must be unique`);
        evidenceIds.add(item.id);
      }
    });
  }

  if (requireArray(report.observations, 'observations')) {
    report.observations.forEach((item, index) => {
      const path = `observations[${index}]`;
      if (!requireObject(item, path)) return;
      requireString(item.id, `${path}.id`);
      requireString(item.statement, `${path}.statement`);
      if (!['context', 'unknown'].includes(item.disposition)) {
        errors.push(`${path}.disposition must be context or unknown`);
      }
      validateEvidenceRefs(item.evidenceRefs, `${path}.evidenceRefs`, evidenceIds, errors, false);
    });
  }

  const findingIds = new Set();
  if (requireArray(report.findings, 'findings')) {
    report.findings.forEach((item, index) => {
      const path = `findings[${index}]`;
      if (!requireObject(item, path)) return;
      requireString(item.findingId, `${path}.findingId`);
      requireString(item.title, `${path}.title`);
      requireString(item.observation, `${path}.observation`);
      requireString(item.expectedBasis, `${path}.expectedBasis`);
      requireString(item.impact, `${path}.impact`);
      requireString(item.scope, `${path}.scope`);
      requireString(item.envelopePath, `${path}.envelopePath`);
      requireString(item.registrationEvidenceRef, `${path}.registrationEvidenceRef`);
      requireStringArray(item.counterEvidence, `${path}.counterEvidence`);
      requireStringArray(item.unknowns, `${path}.unknowns`);
      validateEvidenceRefs(item.evidenceRefs, `${path}.evidenceRefs`, evidenceIds, errors, true);
      if (typeof item.registrationEvidenceRef === 'string' && !evidenceIds.has(item.registrationEvidenceRef)) {
        errors.push(`${path}.registrationEvidenceRef references unknown evidence ID ${item.registrationEvidenceRef}`);
      }
      if (typeof item.registrationEvidenceRef === 'string' && Array.isArray(item.evidenceRefs)
          && !item.evidenceRefs.includes(item.registrationEvidenceRef)) {
        errors.push(`${path}.registrationEvidenceRef must also appear in evidenceRefs`);
      }
      if (typeof item.findingId === 'string') {
        if (findingIds.has(item.findingId)) errors.push(`${path}.findingId must be unique`);
        findingIds.add(item.findingId);
      }
    });
  }

  if (requireObject(report.coverage, 'coverage')) {
    requireStringArray(report.coverage.reviewed, 'coverage.reviewed');
    requireStringArray(report.coverage.notReviewed, 'coverage.notReviewed');
    requireStringArray(report.coverage.limitations, 'coverage.limitations');
  }

  if (requireArray(report.unknowns, 'unknowns')) {
    report.unknowns.forEach((item, index) => {
      const path = `unknowns[${index}]`;
      if (!requireObject(item, path)) return;
      requireString(item.question, `${path}.question`);
      requireString(item.whyItMatters, `${path}.whyItMatters`);
      requireString(item.nextEvidence, `${path}.nextEvidence`);
    });
  }

  if (requireObject(report.stop, 'stop')) {
    requireString(report.stop.reason, 'stop.reason');
    requireString(report.stop.condition, 'stop.condition');
    requireString(report.stop.residualRisk, 'stop.residualRisk');
  }

  if (Array.isArray(report.findings) && Number.isInteger(report?.summary?.findingCount)
      && report.summary.findingCount !== report.findings.length) {
    errors.push('summary.findingCount must equal findings.length');
  }

  return errors;
}

function validateEvidenceRefs(refs, path, evidenceIds, errors, requireNonEmpty) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (requireNonEmpty && refs.length === 0) {
    errors.push(`${path} must contain at least one evidence ID`);
  }
  refs.forEach((ref, index) => {
    if (typeof ref !== 'string' || ref.trim() === '') {
      errors.push(`${path}[${index}] must be a non-empty string`);
    } else if (!evidenceIds.has(ref)) {
      errors.push(`${path}[${index}] references unknown evidence ID ${ref}`);
    }
  });
}

export function assertValidInspectionReport(report) {
  const errors = validateInspectionReport(report);
  if (errors.length > 0) {
    throw new Error(`Invalid inspection report:\n- ${errors.join('\n- ')}`);
  }
  return report;
}
