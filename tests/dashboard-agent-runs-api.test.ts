import { afterEach, beforeEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import express from 'express';
import type { Server } from 'node:http';

import { AgentRunStore } from '../src/core/agent-run-store';
import { createApiRouter } from '../src/dashboard/routes/api';
import { ReviewRunStore } from '../src/review/review-run-store';

describe('Dashboard Agent Runs API', () => {
  let root: string;
  let server: Server;
  let baseUrl: string;
  let originalStore: string | undefined;
  let originalReview: string | undefined;

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-runs-api-'));
    originalStore = process.env.XIAOBA_AGENT_RUN_STORE_FILE;
    originalReview = process.env.XIAOBA_REVIEW_WORKSPACE;
    process.env.XIAOBA_AGENT_RUN_STORE_FILE = path.join(root, 'agent-runs.json');
    process.env.XIAOBA_REVIEW_WORKSPACE = path.join(root, 'review');
    const app = express();
    app.use('/api', createApiRouter({ getAll: () => [] } as any));
    server = await new Promise<Server>(resolve => {
      const next = app.listen(0, '127.0.0.1', () => resolve(next));
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('server did not bind');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (originalStore === undefined) delete process.env.XIAOBA_AGENT_RUN_STORE_FILE;
    else process.env.XIAOBA_AGENT_RUN_STORE_FILE = originalStore;
    if (originalReview === undefined) delete process.env.XIAOBA_REVIEW_WORKSPACE;
    else process.env.XIAOBA_REVIEW_WORKSPACE = originalReview;
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('merges generic and Review Runs in safe updated order', async () => {
    const generic = new AgentRunStore(process.env.XIAOBA_AGENT_RUN_STORE_FILE!);
    generic.create({
      runId: 'inspection-1', runType: 'code_inspection',
      triggerRef: { source: 'manual', id: 'repo@sha', actor: 'secret-human' },
      sessionKey: 'inspection:private', initialGoal: 'Inspect repository', status: 'active',
      createdAt: '2026-07-28T08:00:00.000Z', updatedAt: '2026-07-28T08:02:00.000Z',
      blocker: '/private/error', events: [], artifacts: [{ artifactId: 'a1', kind: 'report', label: 'Report', ref: '/private/report', createdAt: '2026-07-28T08:00:00.000Z' }], subjects: [],
    });
    const review = new ReviewRunStore(path.join(process.env.XIAOBA_REVIEW_WORKSPACE!, 'review-runs.json'));
    review.create({
      runId: 'review-1', findingId: 'F-1', sessionKey: 'review:F-1', goal: 'Review F-1', envelopePath: '/private/envelope',
      status: 'complete_close', reviewState: 'COMPLETE_CLOSE', createdAt: '2026-07-28T08:00:00.000Z', updatedAt: '2026-07-28T08:03:00.000Z', tasks: {}, events: [],
    });
    const response = await fetch(`${baseUrl}/api/agent-runs`);
    const text = await response.text();
    const data = JSON.parse(text) as any[];
    assert.equal(response.status, 200);
    assert.deepEqual(data.map(item => item.runId), ['review-1', 'inspection-1']);
    assert.equal(data[0].runType, 'finding_review');
    assert.doesNotMatch(text, /inspection:private|secret-human|private\/report|private\/envelope|private\/error/);
  });

  test('returns safe detail and 404 for unknown Runs', async () => {
    const store = new AgentRunStore(process.env.XIAOBA_AGENT_RUN_STORE_FILE!);
    store.create({ runId: 'run-detail', runType: 'code_inspection', triggerRef: { source: 'manual', id: 'r' }, sessionKey: 'private', initialGoal: 'goal', status: 'queued', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), events: [], artifacts: [], subjects: [] });
    const detail = await fetch(`${baseUrl}/api/agent-runs/run-detail`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json() as any).runId, 'run-detail');
    assert.equal((await fetch(`${baseUrl}/api/agent-runs/missing`)).status, 404);
  });

  test('fails closed when the generic store is corrupt', async () => {
    fs.writeFileSync(process.env.XIAOBA_AGENT_RUN_STORE_FILE!, '{broken');
    assert.equal((await fetch(`${baseUrl}/api/agent-runs`)).status, 503);
  });

  test('ships a read-only Agent Runs page with loader and refresh control', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '..', 'dashboard', 'index.html'), 'utf8');
    assert.match(html, /data-page="runs"/);
    assert.match(html, /id="page-runs"/);
    assert.match(html, /loadAgentRuns/);
    assert.match(html, /refresh-agent-runs/);
    assert.doesNotMatch(html, /start-agent-run|create-agent-run/);
  });
});
