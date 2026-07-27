import { analyzerCallGraph, inferApplicationName, parseAnalyzerSymbol, parseArgs, readJson, required, stableId, titleize, writeJson } from './lib.mjs';

const args = parseArgs();
const analysis = readJson(required(args, 'analysis'));
const output = required(args, 'output');
const sourceExtensions = String(args.extensions || '.ts,.tsx')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const preferredRoots = String(args['source-roots'] || 'src,app,lib,packages')
  .split(',')
  .map(value => value.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const parsed = analyzerCallGraph(analysis)
  .flatMap(edge => [edge.src, edge.dst])
  .map(symbol => parseAnalyzerSymbol(symbol, sourceExtensions))
  .filter(Boolean);
const files = [...new Set(parsed.map(item => item.file))].sort();
const sourceRoots = preferredRoots.filter(root => files.some(file => file === root || file.startsWith(`${root}/`)));
if (sourceRoots.length === 0) {
  const firstSegments = new Map();
  for (const file of files) {
    const segment = file.split('/')[0];
    firstSegments.set(segment, (firstSegments.get(segment) || 0) + 1);
  }
  sourceRoots.push(
    [...firstSegments.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'src',
  );
}

const candidates = new Map();
for (const root of sourceRoots) {
  const rootFiles = files.filter(file => file.startsWith(`${root}/`));
  for (const file of rootFiles) {
    const rest = file.slice(root.length + 1);
    const first = rest.split('/')[0];
    const hasDirectory = rest.includes('/');
    const key = hasDirectory ? `${root}/${first}` : `${root}/root`;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push(file);
  }
}

const usedIds = new Set();
const components = [...candidates.entries()].map(([key]) => {
  const [root, segment] = key.split('/');
  let id = stableId(segment === 'root' ? `${root}-root` : segment);
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${id}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  const escapedRoot = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = segment === 'root'
    ? `^${escapedRoot}/[^/]+\\.(?:${sourceExtensions.map(ext => ext.replace(/^\./, '')).join('|')})$`
    : `^${escapedRoot}/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`;
  return {
    id,
    label: titleize(segment === 'root' ? `${root} root` : segment),
    summary: 'Review and replace this draft directory-based summary.',
    group: 'application',
    filePatterns: [pattern],
    excludePatterns: [],
    internalSteps: [],
    internalEdges: [],
  };
});

const profile = {
  schemaVersion: '1.0',
  project: {
    name: inferApplicationName(analysis, parsed),
    language: analysis.language || 'typescript',
    locale: String(args.locale || 'zh-CN'),
    description: 'Review this agent-generated architecture profile.',
    sourceRoots,
    excludePatterns: [
      '(^|/)(node_modules|dist|build|coverage|\\.git)(/|$)',
      '\\.(test|spec)\\.[^.]+$',
    ],
    sourceExtensions,
  },
  groups: [
    {
      id: 'application',
      label: 'Application',
      summary: 'Replace with stable runtime ownership zones when useful.',
    },
  ],
  components,
  edgeSemantics: [],
  flows: [],
  layout: {
    direction: 'LR',
    groupOrder: ['application'],
    componentOrder: components.map(component => component.id),
    edgeOverrides: {},
  },
};

writeJson(output, profile);
console.log(`Wrote draft profile with ${components.length} path-based components to ${output}`);
console.log('Review component ownership and semantics before treating this profile as authoritative.');
