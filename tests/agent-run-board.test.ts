import { afterEach, beforeEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Server } from 'node:http';
import { AgentRunStore } from '../src/core/agent-run-store';
import { agentRunBoardHtml } from '../src/agent-run-board/page';
import { startAgentRunBoard } from '../src/agent-run-board/server';

const servers: Server[] = [];
const roots: string[] = [];

async function listen(storeFile: string, apiKey?: string): Promise<string> {
  const server = await startAgentRunBoard({ host: '127.0.0.1', port: 0, storeFile, apiKey });
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('server did not bind');
  return `http://127.0.0.1:${address.port}`;
}

function fixture(): { root: string; storeFile: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-run-board-'));
  roots.push(root);
  const storeFile = path.join(root, 'agent-runs.json');
  const store = new AgentRunStore(storeFile);
  store.create({
    runId: 'blocked-run', runType: 'code_inspection', status: 'blocked',
    triggerRef: { source: 'manual', id: 'repo@sha', actor: 'private-actor', summary: 'New commit' },
    sessionKey: 'private:session', initialGoal: 'Inspect the repository', blocker: '/private/blocker',
    createdAt: '2026-07-30T08:00:00.000Z', updatedAt: '2026-07-30T08:03:00.000Z',
    lastGoalCheck: { checkedAt: '2026-07-30T08:02:00.000Z', complete: false, capabilitiesExhausted: false, summary: 'Private summary', nextAction: 'Private next action', blocker: 'Private blocker', stopCondition: 'Wait' },
    events: [{ eventId: 'e1', type: 'blocked', summary: 'Waiting for public input', createdAt: '2026-07-30T08:02:00.000Z' }],
    artifacts: [{ artifactId: 'a1', kind: 'report', label: 'Inspection report', ref: '/private/report.md', createdAt: '2026-07-30T08:01:00.000Z' }], subjects: [],
  });
  store.create({
    runId: 'complete-run', runType: 'finding_review', status: 'completed',
    triggerRef: { source: 'review', id: 'F-1' }, sessionKey: 'private:review', initialGoal: 'Review finding',
    createdAt: '2026-07-30T07:00:00.000Z', updatedAt: '2026-07-30T08:04:00.000Z',
    events: [{ type: 'final_result', summary: 'Finding accepted', createdAt: '2026-07-30T08:04:00.000Z' }], artifacts: [], subjects: [],
  });
  return { root, storeFile };
}

describe('Agent Run Board', () => {
  beforeEach(() => { servers.length = 0; roots.length = 0; });
  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
    roots.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true }));
  });

  test('requires configured API key for page, health and projection API', async () => {
    const { storeFile } = fixture(); const base = await listen(storeFile, 'secret-key');
    assert.equal((await fetch(`${base}/`)).status, 401);
    assert.equal((await fetch(`${base}/health`)).status, 401);
    assert.equal((await fetch(`${base}/api/runs`, { headers: { 'x-api-key': 'wrong' } })).status, 401);
    const ok = await fetch(`${base}/api/runs`, { headers: { authorization: 'Bearer secret-key' } });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json() as unknown[]).length, 2);
  });

  test('requires an API key before binding to a non-loopback host', async () => {
    const { storeFile } = fixture();
    await assert.rejects(
      startAgentRunBoard({ host: '0.0.0.0', port: 0, storeFile }),
      /API key is required/,
    );
  });

  test('serves only safe public projections and never mutates the store', async () => {
    const { storeFile } = fixture(); const before = fs.readFileSync(storeFile); const mtime = fs.statSync(storeFile).mtimeMs;
    const base = await listen(storeFile);
    const list = await fetch(`${base}/api/runs`); const text = await list.text();
    assert.equal(list.status, 200); assert.deepEqual(JSON.parse(text).map((run: any) => run.runId), ['complete-run', 'blocked-run']);
    assert.doesNotMatch(text, /private:session|private:review|private-actor|private\/report|private\/blocker|Private next action|Private summary/);
    const detail = await fetch(`${base}/api/runs/blocked-run`); assert.equal(detail.status, 200);
    assert.equal((await fetch(`${base}/api/runs/missing`)).status, 404);
    assert.equal((await fetch(`${base}/api/runs`, { method: 'POST' })).status, 404);
    assert.deepEqual(fs.readFileSync(storeFile), before); assert.equal(fs.statSync(storeFile).mtimeMs, mtime);
  });

  test('fails closed on malformed data without quarantining or rewriting it', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-run-board-broken-')); roots.push(root);
    const storeFile = path.join(root, 'agent-runs.json'); fs.writeFileSync(storeFile, '{broken'); const before = fs.readFileSync(storeFile);
    const base = await listen(storeFile); assert.equal((await fetch(`${base}/api/runs`)).status, 503);
    assert.deepEqual(fs.readFileSync(storeFile), before);
    assert.deepEqual(fs.readdirSync(root), ['agent-runs.json']);
  });

  test('ships a self-contained responsive UI with no scheduling controls or external assets', () => {
    assert.match(agentRunBoardHtml, /Agent Run Board/); assert.match(agentRunBoardHtml, /@media\(max-width:760px\)/);
    assert.match(agentRunBoardHtml, /Session','Protected by public projection/); assert.match(agentRunBoardHtml, /Timeline/);
    assert.doesNotMatch(agentRunBoardHtml, /https?:\/\//); assert.doesNotMatch(agentRunBoardHtml, /create run|start run|cancel run|dispatch/i);
  });
});
