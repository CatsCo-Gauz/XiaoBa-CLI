import { parseArgs, readJson } from './lib.mjs';

const args = parseArgs();
const file = args._[0];
if (!file) throw new Error('Usage: node validate-codegraph.mjs <agent-codegraph.json>');
const graph = readJson(file);
const errors = [];

if (graph.schemaVersion !== '1.0') errors.push('schemaVersion must be "1.0"');
for (const key of ['source', 'project', 'groups', 'components', 'edges', 'flows', 'layout', 'diagnostics']) {
  if (graph[key] === undefined) errors.push(`Missing top-level field ${key}`);
}

function uniqueIds(items, kind) {
  const ids = new Set();
  for (const item of items || []) {
    if (!item.id) errors.push(`${kind} is missing id`);
    if (ids.has(item.id)) errors.push(`Duplicate ${kind} id ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

const groupIds = uniqueIds(graph.groups, 'group');
const componentIds = uniqueIds(graph.components, 'component');
uniqueIds(graph.edges, 'edge');
uniqueIds(graph.flows, 'flow');

const steps = new Map();
function validateInternalScope(owner, internalSteps = [], internalEdges = []) {
  const ids = uniqueIds(internalSteps, `step in ${owner}`);
  for (const edge of internalEdges) {
    if (!ids.has(edge.source)) errors.push(`${owner} internal edge has unknown source ${edge.source}`);
    if (!ids.has(edge.target)) errors.push(`${owner} internal edge has unknown target ${edge.target}`);
  }
  for (const step of internalSteps) {
    validateInternalScope(
      `${owner}.${step.id}`,
      step.children || [],
      step.internalEdges || [],
    );
  }
  return ids;
}
for (const component of graph.components || []) {
  if (!groupIds.has(component.group)) errors.push(`Component ${component.id} has unknown group ${component.group}`);
  steps.set(
    component.id,
    validateInternalScope(component.id, component.internalSteps || [], component.internalEdges || []),
  );
}
for (const edge of graph.edges || []) {
  if (!componentIds.has(edge.source)) errors.push(`Edge ${edge.id} has unknown source ${edge.source}`);
  if (!componentIds.has(edge.target)) errors.push(`Edge ${edge.id} has unknown target ${edge.target}`);
  if (edge.sourceStep && !steps.get(edge.source)?.has(edge.sourceStep)) {
    errors.push(`Edge ${edge.id} has unknown sourceStep ${edge.sourceStep}`);
  }
  if (edge.targetStep && !steps.get(edge.target)?.has(edge.targetStep)) {
    errors.push(`Edge ${edge.id} has unknown targetStep ${edge.targetStep}`);
  }
  if (edge.evidenceRequired !== false && !edge.static) errors.push(`Edge ${edge.id} requires static evidence`);
}
for (const flow of graph.flows || []) {
  for (const step of flow.steps || []) {
    if (!componentIds.has(step.component)) errors.push(`Flow ${flow.id} has unknown component ${step.component}`);
    if (step.step && !steps.get(step.component)?.has(step.step)) {
      errors.push(`Flow ${flow.id} has unknown step ${step.component}.${step.step}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `Valid agent code graph: ${graph.components.length} components, ` +
  `${graph.edges.length} edges, ${graph.flows.length} flows.`,
);
