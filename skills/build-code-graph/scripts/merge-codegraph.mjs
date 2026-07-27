import { edgeKey, parseArgs, readJson, required, validateProfileShape, writeJson } from './lib.mjs';

const args = parseArgs();
const evidence = readJson(required(args, 'evidence'));
const profile = readJson(required(args, 'profile'));
const output = required(args, 'output');
validateProfileShape(profile);

if (evidence.schemaVersion !== '1.0') throw new Error('Unsupported evidence schemaVersion');

const evidenceComponents = new Map(evidence.components.map(component => [component.id, component]));
const evidenceEdges = new Map(evidence.edges.map(edge => [edgeKey(edge.source, edge.target), edge]));
const semantics = new Map();
for (const semantic of profile.edgeSemantics) {
  const key = edgeKey(semantic.source, semantic.target);
  if (semantics.has(key)) throw new Error(`Duplicate edge semantics for ${key}`);
  semantics.set(key, semantic);
}

const componentSteps = new Map(
  profile.components.map(component => [
    component.id,
    new Set((component.internalSteps || []).map(step => step.id)),
  ]),
);
function validateInternalScope(owner, steps = [], edges = []) {
  const ids = new Set(steps.map(step => step.id));
  for (const edge of edges) {
    if (!ids.has(edge.source)) throw new Error(`Unknown internal edge source ${owner}.${edge.source}`);
    if (!ids.has(edge.target)) throw new Error(`Unknown internal edge target ${owner}.${edge.target}`);
  }
  for (const step of steps) {
    validateInternalScope(
      `${owner}.${step.id}`,
      step.children || [],
      step.internalEdges || [],
    );
  }
}
for (const component of profile.components) {
  validateInternalScope(component.id, component.internalSteps || [], component.internalEdges || []);
}
for (const semantic of profile.edgeSemantics) {
  if (semantic.sourceStep && !componentSteps.get(semantic.source)?.has(semantic.sourceStep)) {
    throw new Error(`Unknown sourceStep ${semantic.source}.${semantic.sourceStep}`);
  }
  if (semantic.targetStep && !componentSteps.get(semantic.target)?.has(semantic.targetStep)) {
    throw new Error(`Unknown targetStep ${semantic.target}.${semantic.targetStep}`);
  }
}

const missingSemanticEvidence = [];
const edges = evidence.edges.map(staticEdge => {
  const semantic = semantics.get(edgeKey(staticEdge.source, staticEdge.target));
  return {
    id: semantic?.id || `${staticEdge.source}--${staticEdge.target}`,
    source: staticEdge.source,
    target: staticEdge.target,
    label: semantic?.label || `${staticEdge.source} to ${staticEdge.target}`,
    kind: semantic?.kind || 'dependency',
    payload: semantic?.payload || '',
    sourceStep: semantic?.sourceStep,
    targetStep: semantic?.targetStep,
    semantic: Boolean(semantic),
    evidenceRequired: semantic?.evidenceRequired !== false,
    references: semantic?.references || [],
    static: {
      callSites: staticEdge.callSites,
      totalWeight: staticEdge.totalWeight,
      provenance: staticEdge.provenance,
      evidence: staticEdge.evidence,
    },
  };
});

for (const semantic of profile.edgeSemantics) {
  const key = edgeKey(semantic.source, semantic.target);
  if (evidenceEdges.has(key)) continue;
  if (semantic.evidenceRequired !== false) {
    missingSemanticEvidence.push(key);
    continue;
  }
  edges.push({
    id: semantic.id || `${semantic.source}--${semantic.target}`,
    source: semantic.source,
    target: semantic.target,
    label: semantic.label,
    kind: semantic.kind,
    payload: semantic.payload || '',
    sourceStep: semantic.sourceStep,
    targetStep: semantic.targetStep,
    semantic: true,
    evidenceRequired: false,
    references: semantic.references || [],
    static: null,
  });
}

if (missingSemanticEvidence.length > 0) {
  throw new Error(
    `Semantic edges lack static evidence:\n- ${missingSemanticEvidence.join('\n- ')}\n` +
    'Correct the component model or set evidenceRequired=false with source references for a semantic-only edge.',
  );
}

const components = profile.components.map(component => {
  const staticComponent = evidenceComponents.get(component.id);
  if (!staticComponent) throw new Error(`Evidence is missing component ${component.id}`);
  return {
    id: component.id,
    label: component.label,
    summary: component.summary || '',
    group: component.group,
    internalSteps: component.internalSteps || [],
    internalEdges: component.internalEdges || [],
    stats: staticComponent.stats,
    files: staticComponent.files,
  };
});

const artifact = {
  schemaVersion: '1.0',
  source: evidence.source,
  project: {
    name: profile.project.name,
    language: profile.project.language,
    locale: profile.project.locale || 'zh-CN',
    description: profile.project.description || '',
    sourceRoots: profile.project.sourceRoots || [],
  },
  groups: profile.groups,
  components,
  edges: edges.sort((a, b) => edgeKey(a.source, a.target).localeCompare(edgeKey(b.source, b.target))),
  flows: profile.flows,
  layout: profile.layout,
  diagnostics: {
    ...evidence.diagnostics,
    missingSemanticEvidence,
    semanticCoverage: {
      describedEdges: profile.edgeSemantics.filter(semantic =>
        evidenceEdges.has(edgeKey(semantic.source, semantic.target)),
      ).length,
      staticEdges: evidence.edges.length,
    },
  },
};

writeJson(output, artifact);
console.log(`Wrote merged agent code graph to ${output}`);
