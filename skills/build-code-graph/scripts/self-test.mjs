import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-code-graph-'));
const profileFile = path.join(tempDir, 'project-architecture.json');
const evidenceFile = path.join(tempDir, 'code-evidence.json');
const graphFile = path.join(tempDir, 'agent-codegraph.json');
const viewerDir = path.join(tempDir, 'viewer');

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...args], {
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stdout}\n${result.stderr}`);
  }
}

const profile = {
  schemaVersion: '1.0',
  project: {
    name: 'self-test',
    language: 'typescript',
    locale: 'zh-CN',
    description: 'Recursive graph fixture',
    sourceRoots: ['src'],
    excludePatterns: [],
  },
  groups: [{ id: 'runtime', label: '运行时', summary: 'Test group' }],
  components: [
    {
      id: 'runner',
      label: 'Runner',
      summary: 'Owns the loop',
      group: 'runtime',
      filePatterns: ['^src/runner\\.ts$'],
      excludePatterns: [],
      internalSteps: [
        {
          id: 'prepare',
          label: '准备',
          summary: 'Prepare input',
          file: 'src/runner.ts',
        },
        {
          id: 'execute',
          label: '执行',
          summary: 'Execute work',
          file: 'src/runner.ts',
          children: [
            {
              id: 'call',
              label: '调用',
              summary: 'Call dependency',
              file: 'src/runner.ts',
            },
            {
              id: 'normalize',
              label: '规范化',
              summary: 'Normalize result',
              file: 'src/runner.ts',
            },
          ],
          internalEdges: [
            {
              id: 'call-normalize',
              source: 'call',
              target: 'normalize',
              kind: 'data',
              label: 'result',
              payload: 'RawResult',
            },
          ],
        },
      ],
      internalEdges: [
        {
          id: 'prepare-execute',
          source: 'prepare',
          target: 'execute',
          kind: 'control',
          label: 'dispatch',
          payload: 'Request',
        },
      ],
    },
    {
      id: 'service',
      label: 'Service',
      summary: 'External boundary',
      group: 'runtime',
      filePatterns: ['^src/service\\.ts$'],
      excludePatterns: [],
      internalSteps: [],
      internalEdges: [],
    },
  ],
  edgeSemantics: [
    {
      id: 'runner-service',
      source: 'runner',
      target: 'service',
      sourceStep: 'execute',
      label: '请求服务',
      kind: 'data',
      payload: 'Request -> Response',
      evidenceRequired: true,
      references: ['src/runner.ts'],
    },
  ],
  flows: [
    {
      id: 'request',
      label: '请求',
      summary: 'One request',
      kind: 'request',
      steps: [
        { component: 'runner', step: 'prepare' },
        { component: 'runner', step: 'execute' },
        { component: 'service' },
      ],
    },
  ],
  layout: {
    direction: 'LR',
    groupOrder: ['runtime'],
    componentOrder: ['runner', 'service'],
    edgeOverrides: {},
  },
};

const evidence = {
  schemaVersion: '1.0',
  source: {
    analyzer: 'self-test',
    revision: 'fixture',
  },
  components: profile.components.map(component => ({
    id: component.id,
    stats: { files: 1, symbols: 1 },
    files: [{ path: `src/${component.id}.ts`, symbols: [{ id: component.id, references: 1 }] }],
  })),
  edges: [
    {
      source: 'runner',
      target: 'service',
      callSites: 1,
      totalWeight: 1,
      provenance: ['fixture'],
      evidence: [{ source: 'src/runner.ts#Runner.run', target: 'src/service.ts#Service.call' }],
    },
  ],
  diagnostics: {
    filesSeen: 2,
    acceptedCallEdges: 1,
    unclassifiedFiles: [],
    ambiguousFiles: [],
  },
};

try {
  writeJson(profileFile, profile);
  writeJson(evidenceFile, evidence);
  run('merge-codegraph.mjs', ['--evidence', evidenceFile, '--profile', profileFile, '--output', graphFile]);
  run('validate-codegraph.mjs', [graphFile]);
  run('install-viewer.mjs', ['--graph', graphFile, '--output', viewerDir]);

  const graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
  const execute = graph.components[0].internalSteps.find(step => step.id === 'execute');
  assert.equal(execute.children.length, 2);
  assert.equal(execute.internalEdges[0].target, 'normalize');
  assert.ok(fs.existsSync(path.join(viewerDir, 'public', 'agent-codegraph.json')));
  assert.ok(fs.existsSync(path.join(viewerDir, 'src', 'App.tsx')));
  console.log('build-code-graph self-test passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
