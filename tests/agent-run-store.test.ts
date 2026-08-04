import { afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  AgentRunStore,
  projectAgentRun,
  type CreateAgentRunInput,
} from '../src/core/agent-run-store';

const roots: string[] = [];
const NOW = '2026-07-28T08:00:00.000Z';

function makeStoreRoot(): { root: string; filePath: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-agent-run-'));
  roots.push(root);
  return { root, filePath: path.join(root, 'agent-runs.json') };
}

function makeRun(overrides: Partial<CreateAgentRunInput> = {}): CreateAgentRunInput {
  return {
    runId: 'run-1',
    runType: 'background',
    triggerRef: {
      source: 'scheduler',
      id: 'trigger-1',
      idempotencyKey: 'idem-1',
      actor: 'private-actor',
      summary: 'daily check',
    },
    sessionKey: 'private-session',
    initialGoal: 'Finish the durable task',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    events: [],
    artifacts: [],
    subjects: [],
    ...overrides,
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('AgentRunStore', () => {
  test('persists atomically with private permissions and reloads records', () => {
    const { root, filePath } = makeStoreRoot();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    store.create(makeRun());

    assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
    assert.equal(fs.readdirSync(root).some(name => name.endsWith('.tmp')), false);
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(filePath, 'utf8')));
    assert.deepEqual(new AgentRunStore(filePath).get('run-1'), store.get('run-1'));
  });

  test('fails closed, writes a marker, and quarantines corrupt JSON', () => {
    const { root, filePath } = makeStoreRoot();
    fs.writeFileSync(filePath, '{not-json', { mode: 0o600 });

    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    assert.equal(fs.existsSync(`${filePath}.corrupt`), true);
    assert.equal(fs.readdirSync(root).some(name => name.startsWith('agent-runs.json.corrupt-')), true);
    assert.throws(() => store.list(), /corrupt and quarantined/);
    assert.throws(() => store.create(makeRun()), /corrupt and quarantined/);

    fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: 1, runs: [] }), { mode: 0o600 });
    assert.throws(() => new AgentRunStore(filePath).get('run-1'), /corrupt and quarantined/);
  });

  test('indexes trigger idempotency keys and returns the original create result', () => {
    const { filePath } = makeStoreRoot();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    const first = store.create(makeRun());
    const duplicate = store.create(makeRun({ runId: 'run-2', initialGoal: 'different request' }));

    assert.equal(duplicate.runId, first.runId);
    assert.equal(store.list().length, 1);
    assert.equal(store.findByIdempotencyKey('idem-1')?.runId, 'run-1');
    assert.equal(store.findByIdempotencyKey('scheduler', 'idem-1')?.runId, 'run-1');
    assert.equal(new AgentRunStore(filePath).findByIdempotencyKey('idem-1')?.runId, 'run-1');
  });

  test('migrates only the expected Trigger idempotency key and rejects conflicts', () => {
    const { filePath } = makeStoreRoot();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    store.create(makeRun());
    assert.throws(
      () => store.migrateTriggerIdempotencyKey('run-1', 'scheduler', 'wrong-old', 'idem-2'),
      /identity changed during migration/,
    );
    const migrated = store.migrateTriggerIdempotencyKey('run-1', 'scheduler', 'idem-1', 'idem-2');
    assert.equal(migrated.triggerRef.idempotencyKey, 'idem-2');
    assert.equal(store.findByIdempotencyKey('scheduler', 'idem-1'), undefined);
    assert.equal(store.findByIdempotencyKey('scheduler', 'idem-2')?.runId, 'run-1');
    assert.equal(store.migrateTriggerIdempotencyKey('run-1', 'scheduler', 'idem-1', 'idem-2').runId, 'run-1');

    store.create(makeRun({
      runId: 'run-2',
      triggerRef: { source: 'scheduler', id: 'trigger-2', idempotencyKey: 'idem-3' },
      sessionKey: 'session-2',
    }));
    assert.throws(
      () => store.migrateTriggerIdempotencyKey('run-1', 'scheduler', 'idem-2', 'idem-3'),
      /duplicate trigger idempotency key/,
    );
    assert.equal(store.get('run-1')?.triggerRef.idempotencyKey, 'idem-2');
  });

  test('keeps identity immutable and deep-clones all values crossing the boundary', () => {
    const { filePath } = makeStoreRoot();
    const input = makeRun();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    const created = store.create(input);
    created.triggerRef.source = 'mutated';
    input.triggerRef.source = 'also-mutated';
    assert.equal(store.get('run-1')?.triggerRef.source, 'scheduler');

    assert.throws(() => store.update('run-1', { sessionKey: 'other-session' }), /immutable/);
    assert.throws(() => store.update('run-1', record => {
      record.runType = 'other-type';
    }), /immutable/);

    const updated = store.update('run-1', {
      status: 'blocked',
      blocker: 'secret raw blocker',
      lastGoalCheck: {
        checkedAt: NOW,
        complete: false,
        capabilitiesExhausted: true,
        summary: 'Cannot continue',
        blocker: 'secret raw blocker',
        stopCondition: 'Resume when dependency is available',
      },
    });
    updated.lastGoalCheck!.blocker = 'mutated outside';
    assert.equal(store.get('run-1')?.lastGoalCheck?.blocker, 'secret raw blocker');
  });

  test('rejects incomplete goal checks without continuation and stop condition', () => {
    const { filePath } = makeStoreRoot();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    store.create(makeRun());

    assert.throws(() => store.update('run-1', {
      lastGoalCheck: {
        checkedAt: NOW,
        complete: false,
        capabilitiesExhausted: false,
        summary: 'Not done',
      },
    }), /nextAction or blocker/);
    assert.throws(() => store.update('run-1', {
      lastGoalCheck: {
        checkedAt: NOW,
        complete: false,
        capabilitiesExhausted: false,
        summary: 'Not done',
        nextAction: 'Keep working',
      },
    }), /stopCondition/);
  });

  test('projects only safe public summaries', () => {
    const projection = projectAgentRun({
      ...makeRun(),
      blocker: 'raw blocker must not escape',
      lastGoalCheck: {
        checkedAt: NOW,
        complete: false,
        capabilitiesExhausted: true,
        summary: 'goal check internal summary',
        blocker: 'goal blocker must not escape',
        stopCondition: 'private stop detail',
      },
      events: [
        { eventId: 'evt-1', type: 'progress', summary: 'safe event summary', createdAt: NOW },
        { eventId: 'evt-2', type: 'supervisor_input', summary: '{"text":"private operator input"}', createdAt: NOW },
        { eventId: 'evt-3', type: 'supervisor_final', summary: '{"text":"private agent final"}', createdAt: NOW },
      ],
      artifacts: [{ artifactId: 'a-1', kind: 'report', label: 'Report', ref: 'file:///private', createdAt: NOW }],
      subjects: [{ kind: 'issue', id: '42', ref: 'https://private', label: 'Issue 42' }],
    });

    assert.equal(projection.runId, 'run-1');
    assert.equal(projection.lastGoalCheck?.complete, false);
    assert.equal(projection.lastGoalCheck?.capabilitiesExhausted, true);
    assert.deepEqual(projection.artifacts[0], {
      artifactId: 'a-1', kind: 'report', label: 'Report', createdAt: NOW,
    });
    assert.deepEqual(projection.subjects[0], { kind: 'issue', id: '42', label: 'Issue 42' });
    const serialized = JSON.stringify(projection);
    for (const secret of [
      'private-session',
      'private-actor',
      'file:///private',
      'https://private',
      'raw blocker must not escape',
      'goal blocker must not escape',
      'private operator input',
      'private agent final',
    ]) assert.equal(serialized.includes(secret), false);
  });
  test('reloads under lock so a stale instance update cannot erase another Run', () => {
    const { filePath } = makeStoreRoot();
    const firstStore = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    const first = firstStore.create(makeRun());
    const staleStore = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    firstStore.create(makeRun({
      runId: 'run-2', sessionKey: 'session-2', initialGoal: 'second immutable goal',
      triggerRef: { source: 'query', id: 'trigger-2', idempotencyKey: 'query-2' },
    }));
    staleStore.update(first.runId, run => { run.status = 'active'; });
    const reopened = new AgentRunStore({ filePath });
    assert.equal(reopened.list().length, 2);
    assert.equal(reopened.get('run-2')?.initialGoal, 'second immutable goal');
  });

  test('round-trips immutable Goal resolution metadata while old records remain readable', () => {
    const { filePath } = makeStoreRoot();
    const store = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    const created = store.create(makeRun({
      goalResolution: {
        source: 'ai_generated', profileId: 'code_inspection.v1', runType: 'code_inspection',
        completionCriteria: ['validated report'], generatedAt: NOW, generator: 'goal-model',
      },
    }));
    const reopened = new AgentRunStore({ filePath, clock: () => new Date(NOW) });
    assert.deepEqual(reopened.get(created.runId)?.goalResolution, created.goalResolution);

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    delete parsed.runs[0].goalResolution;
    fs.writeFileSync(filePath, JSON.stringify(parsed));
    assert.equal(new AgentRunStore({ filePath }).get(created.runId)?.goalResolution, undefined);
  });

});
