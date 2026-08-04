import fs from 'node:fs';
import path from 'node:path';

export function parseArgs(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      result._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function required(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument --${key}`);
  }
  return value;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

export function writeJson(file, value) {
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`);
}

export function normalizePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function stableId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'component';
}

export function titleize(value) {
  return value
    .replaceAll(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function compilePatterns(patterns = [], label = 'pattern') {
  return patterns.map(pattern => {
    try {
      return new RegExp(pattern);
    } catch (error) {
      throw new Error(`Invalid ${label} ${JSON.stringify(pattern)}: ${error.message}`);
    }
  });
}

export function matchesAny(value, patterns) {
  return patterns.some(pattern => pattern.test(value));
}

export function parseAnalyzerSymbol(uri, sourceExtensions = ['.ts', '.tsx']) {
  if (typeof uri !== 'string' || uri.includes('/@external/')) return null;

  let language;
  let application;
  let segments;
  if (uri.startsWith('can://')) {
    const parts = uri.slice('can://'.length).split('/');
    [language, application] = parts;
    segments = parts.slice(2);
  } else {
    segments = normalizePath(uri).split('/');
  }

  const fileEnd = segments.findIndex(segment =>
    sourceExtensions.some(extension => segment.toLowerCase().endsWith(extension.toLowerCase())),
  );
  if (fileEnd < 0) return null;

  return {
    language,
    application,
    file: normalizePath(segments.slice(0, fileEnd + 1).join('/')),
    symbol: segments.slice(fileEnd + 1).join('/') || '(module)',
  };
}

export function analyzerCallGraph(analysis) {
  const graph = analysis?.application?.call_graph;
  if (!Array.isArray(graph)) {
    throw new Error('Expected analysis.application.call_graph to be an array');
  }
  return graph;
}

export function validateProfileShape(profile) {
  const errors = [];
  if (profile?.schemaVersion !== '1.0') errors.push('schemaVersion must be "1.0"');
  if (!profile?.project?.name) errors.push('project.name is required');
  if (!Array.isArray(profile?.groups)) errors.push('groups must be an array');
  if (!Array.isArray(profile?.components) || profile.components.length === 0) {
    errors.push('components must be a non-empty array');
  }
  if (!Array.isArray(profile?.edgeSemantics)) errors.push('edgeSemantics must be an array');
  if (!Array.isArray(profile?.flows)) errors.push('flows must be an array');
  if (!profile?.layout || typeof profile.layout !== 'object') errors.push('layout is required');

  const idPattern = /^[a-z0-9][a-z0-9_-]*$/;
  const checkIds = (items, kind) => {
    const seen = new Set();
    for (const item of items || []) {
      if (!idPattern.test(item.id || '')) errors.push(`Invalid ${kind} id: ${item.id}`);
      if (seen.has(item.id)) errors.push(`Duplicate ${kind} id: ${item.id}`);
      seen.add(item.id);
    }
    return seen;
  };

  const groupIds = checkIds(profile?.groups, 'group');
  const componentIds = checkIds(profile?.components, 'component');
  const validateInternalScope = (owner, internalSteps = [], internalEdges = []) => {
    const stepIds = checkIds(internalSteps, `step in ${owner}`);
    for (const edge of internalEdges) {
      if (!stepIds.has(edge.source)) errors.push(`${owner} internal edge has unknown source ${edge.source}`);
      if (!stepIds.has(edge.target)) errors.push(`${owner} internal edge has unknown target ${edge.target}`);
    }
    for (const step of internalSteps) {
      validateInternalScope(
        `${owner}.${step.id}`,
        step.children || [],
        step.internalEdges || [],
      );
    }
  };

  for (const component of profile?.components || []) {
    if (!groupIds.has(component.group)) {
      errors.push(`Component ${component.id} references unknown group ${component.group}`);
    }
    if (!Array.isArray(component.filePatterns) || component.filePatterns.length === 0) {
      errors.push(`Component ${component.id} needs filePatterns`);
    }
    compilePatterns(component.filePatterns, `${component.id}.filePatterns`);
    compilePatterns(component.excludePatterns || [], `${component.id}.excludePatterns`);
    validateInternalScope(component.id, component.internalSteps || [], component.internalEdges || []);
  }

  for (const edge of profile?.edgeSemantics || []) {
    if (!componentIds.has(edge.source)) errors.push(`Edge references unknown source ${edge.source}`);
    if (!componentIds.has(edge.target)) errors.push(`Edge references unknown target ${edge.target}`);
  }
  for (const flow of profile?.flows || []) {
    for (const step of flow.steps || []) {
      if (!componentIds.has(step.component)) {
        errors.push(`Flow ${flow.id} references unknown component ${step.component}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid project architecture profile:\n- ${errors.join('\n- ')}`);
  }
}

export function createComponentMatcher(profile) {
  const compiled = profile.components.map(component => ({
    component,
    includes: compilePatterns(component.filePatterns, `${component.id}.filePatterns`),
    excludes: compilePatterns(component.excludePatterns || [], `${component.id}.excludePatterns`),
  }));

  return file => compiled
    .filter(entry =>
      matchesAny(file, entry.includes) &&
      !matchesAny(file, entry.excludes),
    )
    .map(entry => entry.component);
}

export function projectFileFilter(profile) {
  const roots = (profile.project.sourceRoots || []).map(root => normalizePath(root).replace(/\/+$/, ''));
  const exclusions = compilePatterns(profile.project.excludePatterns || [], 'project.excludePatterns');
  return file => {
    const normalized = normalizePath(file);
    const inRoot = roots.length === 0 || roots.some(root => normalized === root || normalized.startsWith(`${root}/`));
    return inRoot && !matchesAny(normalized, exclusions);
  };
}

export function inferApplicationName(analysis, parsedSymbols = []) {
  const parsed = parsedSymbols.find(Boolean);
  if (parsed?.application) return parsed.application;
  const id = analysis?.application?.id;
  if (typeof id === 'string') {
    const parts = id.split('/').filter(Boolean);
    return parts.at(-1) || 'repository';
  }
  return 'repository';
}

export function edgeKey(source, target) {
  return `${source}->${target}`;
}

export function sortStrings(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
