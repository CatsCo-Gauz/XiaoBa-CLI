import {
  analyzerCallGraph,
  createComponentMatcher,
  edgeKey,
  inferApplicationName,
  parseAnalyzerSymbol,
  parseArgs,
  projectFileFilter,
  readJson,
  required,
  sortStrings,
  validateProfileShape,
  writeJson,
} from './lib.mjs';

const args = parseArgs();
const analysis = readJson(required(args, 'analysis'));
const profile = readJson(required(args, 'profile'));
const output = required(args, 'output');
validateProfileShape(profile);

const sourceExtensions = profile.project.sourceExtensions || ['.ts', '.tsx'];
const graph = analyzerCallGraph(analysis);
const matchComponents = createComponentMatcher(profile);
const includeFile = projectFileFilter(profile);
const maxEvidence = Number(profile.project.maxEvidencePerEdge || args['max-evidence'] || 8);

const filesSeen = new Set();
const unclassifiedFiles = new Set();
const ambiguousFiles = new Map();
const hierarchy = new Map(profile.components.map(component => [component.id, new Map()]));
const groupedEdges = new Map();
let acceptedCallEdges = 0;

function classify(parsed) {
  if (!parsed || !includeFile(parsed.file)) return [];
  filesSeen.add(parsed.file);
  const matches = matchComponents(parsed.file);
  if (matches.length === 0) unclassifiedFiles.add(parsed.file);
  if (matches.length > 1) ambiguousFiles.set(parsed.file, matches.map(component => component.id));
  return matches;
}

function recordSymbol(componentId, parsed) {
  const componentFiles = hierarchy.get(componentId);
  let symbols = componentFiles.get(parsed.file);
  if (!symbols) {
    symbols = new Map();
    componentFiles.set(parsed.file, symbols);
  }
  symbols.set(parsed.symbol, (symbols.get(parsed.symbol) || 0) + 1);
}

for (const edge of graph) {
  const source = parseAnalyzerSymbol(edge.src, sourceExtensions);
  const target = parseAnalyzerSymbol(edge.dst, sourceExtensions);
  const sourceMatches = classify(source);
  const targetMatches = classify(target);

  if (sourceMatches.length === 1) recordSymbol(sourceMatches[0].id, source);
  if (targetMatches.length === 1) recordSymbol(targetMatches[0].id, target);
  if (sourceMatches.length !== 1 || targetMatches.length !== 1) continue;
  acceptedCallEdges += 1;

  const sourceId = sourceMatches[0].id;
  const targetId = targetMatches[0].id;
  if (sourceId === targetId) continue;

  const key = edgeKey(sourceId, targetId);
  let aggregate = groupedEdges.get(key);
  if (!aggregate) {
    aggregate = {
      source: sourceId,
      target: targetId,
      callSites: 0,
      totalWeight: 0,
      provenance: new Set(),
      evidence: [],
    };
    groupedEdges.set(key, aggregate);
  }
  aggregate.callSites += 1;
  aggregate.totalWeight += Number(edge.weight || 1);
  for (const provider of edge.prov || []) aggregate.provenance.add(provider);
  if (aggregate.evidence.length < maxEvidence) {
    aggregate.evidence.push({
      from: { file: source.file, symbol: source.symbol },
      to: { file: target.file, symbol: target.symbol },
    });
  }
}

const components = profile.components.map(component => {
  const files = [...hierarchy.get(component.id).entries()]
    .map(([file, symbols]) => ({
      path: file,
      symbols: [...symbols.entries()]
        .map(([id, references]) => ({ id, references }))
        .sort((a, b) => b.references - a.references || a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => b.symbols.length - a.symbols.length || a.path.localeCompare(b.path));
  return {
    id: component.id,
    label: component.label,
    stats: {
      files: files.length,
      symbols: files.reduce((total, file) => total + file.symbols.length, 0),
      references: files.reduce(
        (total, file) => total + file.symbols.reduce((sum, symbol) => sum + symbol.references, 0),
        0,
      ),
    },
    files,
  };
});

const edges = [...groupedEdges.values()]
  .map(edge => ({
    ...edge,
    provenance: sortStrings(edge.provenance),
  }))
  .sort((a, b) => b.totalWeight - a.totalWeight || edgeKey(a.source, a.target).localeCompare(edgeKey(b.source, b.target)));

const firstParsed = graph
  .flatMap(edge => [edge.src, edge.dst])
  .map(symbol => parseAnalyzerSymbol(symbol, sourceExtensions))
  .find(Boolean);

const evidence = {
  schemaVersion: '1.0',
  source: {
    repository: profile.project.name || inferApplicationName(analysis, [firstParsed]),
    language: analysis.language || profile.project.language,
    analyzer: analysis.analyzer || 'codeanalyzer',
    analyzerSchema: analysis.schema_version,
    analysisLevel: analysis.max_level,
    rawCallEdges: graph.length,
    acceptedCallEdges,
  },
  components,
  edges,
  diagnostics: {
    analyzedFiles: filesSeen.size,
    unclassifiedFiles: sortStrings(unclassifiedFiles),
    ambiguousFiles: [...ambiguousFiles.entries()]
      .map(([file, componentsForFile]) => ({ file, components: componentsForFile }))
      .sort((a, b) => a.file.localeCompare(b.file)),
  },
};

writeJson(output, evidence);
console.log(
  `Wrote ${components.length} components and ${edges.length} grouped edges from ${graph.length} raw edges to ${output}`,
);
if (unclassifiedFiles.size || ambiguousFiles.size) {
  console.log(`Review required: ${unclassifiedFiles.size} unclassified, ${ambiguousFiles.size} ambiguous files.`);
}
