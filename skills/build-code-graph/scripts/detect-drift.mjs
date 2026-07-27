import { edgeKey, parseArgs, readJson, required, writeJson } from './lib.mjs';

const args = parseArgs();
const baseline = readJson(required(args, 'baseline'));
const current = readJson(required(args, 'current'));
const output = required(args, 'output');
const relativeThreshold = Number(args['relative-threshold'] || 0.5);
const absoluteThreshold = Number(args['absolute-threshold'] || 3);

const baselineComponents = new Map(baseline.components.map(component => [component.id, component]));
const currentComponents = new Map(current.components.map(component => [component.id, component]));
const baselineEdges = new Map(baseline.edges.map(edge => [edgeKey(edge.source, edge.target), edge]));
const currentEdges = new Map(current.edges.map(edge => [edgeKey(edge.source, edge.target), edge]));

const addedComponents = [...currentComponents.keys()].filter(id => !baselineComponents.has(id)).sort();
const removedComponents = [...baselineComponents.keys()].filter(id => !currentComponents.has(id)).sort();
const addedEdges = [...currentEdges.keys()].filter(key => !baselineEdges.has(key)).sort();
const removedEdges = [...baselineEdges.keys()].filter(key => !currentEdges.has(key)).sort();

const changedComponents = [];
for (const [id, currentComponent] of currentComponents) {
  const old = baselineComponents.get(id);
  if (!old) continue;
  const filesDelta = currentComponent.stats.files - old.stats.files;
  const symbolsDelta = currentComponent.stats.symbols - old.stats.symbols;
  if (filesDelta !== 0 || symbolsDelta !== 0) {
    changedComponents.push({ id, filesDelta, symbolsDelta });
  }
}

const changedEdges = [];
for (const [key, currentEdge] of currentEdges) {
  const old = baselineEdges.get(key);
  if (!old) continue;
  const delta = currentEdge.totalWeight - old.totalWeight;
  const ratio = old.totalWeight === 0 ? 1 : Math.abs(delta) / old.totalWeight;
  if (Math.abs(delta) >= absoluteThreshold && ratio >= relativeThreshold) {
    changedEdges.push({
      edge: key,
      before: old.totalWeight,
      after: currentEdge.totalWeight,
      delta,
      ratio: Number(ratio.toFixed(3)),
    });
  }
}

const baselineUnclassified = new Set(baseline.diagnostics?.unclassifiedFiles || []);
const currentUnclassified = new Set(current.diagnostics?.unclassifiedFiles || []);
const addedUnclassifiedFiles = [...currentUnclassified].filter(file => !baselineUnclassified.has(file)).sort();
const resolvedUnclassifiedFiles = [...baselineUnclassified].filter(file => !currentUnclassified.has(file)).sort();
const ambiguityKey = item => `${item.file}:${[...(item.components || [])].sort().join(',')}`;
const baselineAmbiguities = new Set((baseline.diagnostics?.ambiguousFiles || []).map(ambiguityKey));
const addedAmbiguousFiles = (current.diagnostics?.ambiguousFiles || [])
  .filter(item => !baselineAmbiguities.has(ambiguityKey(item)));
const reviewNeeded =
  addedComponents.length > 0 ||
  removedComponents.length > 0 ||
  addedEdges.length > 0 ||
  removedEdges.length > 0 ||
  changedEdges.length > 0 ||
  addedUnclassifiedFiles.length > 0 ||
  addedAmbiguousFiles.length > 0;

const report = {
  schemaVersion: '1.0',
  reviewNeeded,
  addedComponents,
  removedComponents,
  changedComponents,
  addedEdges,
  removedEdges,
  changedEdges,
  addedUnclassifiedFiles,
  resolvedUnclassifiedFiles,
  addedAmbiguousFiles,
};

writeJson(output, report);
console.log(`Wrote drift report to ${output}; agent review ${reviewNeeded ? 'is required' : 'is not required'}.`);
