import { afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { AgentRunStore } from '../src/core/agent-run-store';
import { main } from '../src/inspection/inspection-run-cli';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('inspection-run CLI', () => {
  test('drives an offline manual Run from trigger through terminal Goal Check', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inspection-cli-'));
    roots.push(root);
    const repo = path.join(root, 'repo');
    const storePath = path.join(root, 'agent-runs.json');
    const outputRoot = path.join(root, 'artifacts');
    fs.mkdirSync(repo);

    const originalWrite = process.stdout.write;
    (process.stdout as any).write = () => true;
    try {
      assert.equal(await main([
        'trigger', repo, '--snapshot', 'sha-practice', '--mode', 'baseline', '--goal', 'practice goal',
        '--actor', 'tester', '--no-wake', '--store', storePath, '--output-root', outputRoot,
      ]), 0);
      const store = new AgentRunStore(storePath);
      const run = store.list()[0];
      assert.ok(run);

      assert.equal(await main([
        'event', run.runId, 'Repository map created', '--type', 'map_ready',
        '--store', storePath, '--output-root', outputRoot,
      ]), 0);

      const reportPath = path.join(outputRoot, run.runId, 'inspection-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        schemaVersion: 1,
        inspectionId: 'practice-inspection',
        generatedAt: '2026-07-28T08:00:00.000Z',
        mode: 'baseline',
        goal: 'practice goal',
        source: { repo, snapshot: 'sha-practice', snapshotType: 'tree', mutable: false },
        scope: { included: ['.'], excluded: [], evidencePermissions: ['source'] },
        summary: { conclusion: 'No Finding passed the gate.', findingCount: 0 },
        evidence: [], observations: [], findings: [],
        coverage: { reviewed: ['repository boundary'], notReviewed: [], limitations: [] },
        unknowns: [],
        stop: { reason: 'Goal met', condition: 'Bounded baseline complete', residualRisk: 'Unreviewed behavior may remain.' },
      }));
      assert.equal(await main([
        'attach', run.runId, reportPath, '--kind', 'inspection_report', '--artifact-id', 'report-json',
        '--store', storePath, '--output-root', outputRoot,
      ]), 0);
      assert.equal(await main([
        'goal-check', run.runId, '--complete', 'true', '--summary', 'Validated report attached',
        '--store', storePath, '--output-root', outputRoot,
      ]), 0);

      const completed = new AgentRunStore(storePath).get(run.runId);
      assert.equal(completed?.status, 'completed');
      assert.equal(completed?.events.some(event => event.type === 'map_ready'), true);
      assert.equal(completed?.artifacts[0].artifactId, 'report-json');
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});
