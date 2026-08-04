import { afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { AgentRunStore } from '../src/core/agent-run-store';
import type { HandleMessageResult } from '../src/core/agent-session';
import type { AgentRunGoalChecker, StructuredGoalCheck } from '../src/agent-run/goal-check';
import {
  AgentRunSupervisor,
  stableAgentRunSessionKey,
  type SupervisorRuntime,
} from '../src/agent-run/supervisor';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(options: {
  finals?: Array<string | Error | Promise<string>>;
  checks?: Array<StructuredGoalCheck | Error>;
  filePath?: string;
  onTurnStarted?: () => void;
} = {}) {
  const root = options.filePath ? path.dirname(options.filePath) : fs.mkdtempSync(path.join(os.tmpdir(), 'agent-run-supervisor-'));
  if (!options.filePath) roots.push(root);
  const filePath = options.filePath || path.join(root, 'agent-runs.json');
  const prompts: string[] = [];
  const sessionKeys: string[] = [];
  let turn = 0;
  let check = 0;
  const finals = options.finals || ['done'];
  const checks = options.checks || [{ decision: 'complete', summary: 'goal met' }];
  const runtime: SupervisorRuntime = {
    session: {
      handleMessage: async (prompt: string): Promise<HandleMessageResult> => {
        prompts.push(prompt);
        options.onTurnStarted?.();
        const value = finals[Math.min(turn++, finals.length - 1)];
        if (value instanceof Error) throw value;
        return { text: await value, visibleToUser: true, taskOutcome: 'completed' };
      },
      restoreFromStore: () => true,
    } as SupervisorRuntime['session'],
    aiService: {} as SupervisorRuntime['aiService'],
  };
  const checker: AgentRunGoalChecker = {
    check: async () => {
      const value = checks[Math.min(check++, checks.length - 1)];
      if (value instanceof Error) throw value;
      return value;
    },
  };
  const store = new AgentRunStore(filePath);
  const supervisor = new AgentRunSupervisor({
    storePath: filePath,
    workingDirectory: root,
    createRuntime: async (_workingDirectory, sessionKey) => {
      sessionKeys.push(sessionKey);
      return runtime;
    },
    createRestoreRuntime: async (_workingDirectory, sessionKey) => {
      sessionKeys.push(sessionKey);
      return runtime;
    },
    createGoalChecker: () => checker,
  });
  return { root, filePath, store, supervisor, prompts, sessionKeys };
}

function start(supervisor: AgentRunSupervisor, overrides: Record<string, unknown> = {}) {
  return supervisor.start({ goal: 'ship the feature', runId: 'run-1', ...overrides });
}

describe('AgentRunSupervisor', () => {
  test('uses a stable session key and persists every final before Goal Check', async () => {
    const fx = fixture();
    const run = await start(fx.supervisor);
    assert.equal(run.status, 'completed');
    assert.equal(run.sessionKey, stableAgentRunSessionKey('run-1'));
    assert.deepEqual(fx.sessionKeys, ['agent-run:run-1']);
    assert.equal(run.events.filter(event => event.type === 'supervisor_final').length, 1);
    assert.equal(run.events.some(event => event.type === 'goal_checked'), true);
    assert.equal(new AgentRunStore(fx.filePath).get(run.runId)?.status, 'completed');
  });

  test('continues under one owner until an independent Goal Check completes', async () => {
    const fx = fixture({
      finals: ['first final', 'second final'],
      checks: [
        { decision: 'continue', summary: 'more work', nextAction: 'verify output', stopCondition: 'verified' },
        { decision: 'complete', summary: 'verified' },
      ],
    });
    const run = await start(fx.supervisor);
    assert.equal(run.status, 'completed');
    assert.equal(fx.prompts.length, 2);
    assert.match(fx.prompts[1], /verify output/);
    assert.equal(run.events.filter(event => event.type === 'supervisor_final').length, 2);
  });

  test('persists blocked decisions and can resume after new input', async () => {
    const fx = fixture({
      finals: ['need data', 'used supplied data'],
      checks: [
        { decision: 'blocked', summary: 'input missing', blocker: 'need token', stopCondition: 'token supplied' },
        { decision: 'complete', summary: 'done with token' },
      ],
    });
    const blocked = await start(fx.supervisor);
    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.blocker, 'need token');
    const completed = await fx.supervisor.send(blocked.runId, 'token=abc');
    assert.equal(completed.status, 'completed');
    assert.equal(fx.prompts[1], 'token=abc');
  });

  test('consumes input added after the latest final even after multiple earlier iterations', async () => {
    const fx = fixture({
      finals: ['one', 'two', 'three'],
      checks: [
        { decision: 'continue', summary: 'again', nextAction: 'second pass', stopCondition: 'pass done' },
        { decision: 'blocked', summary: 'need input', blocker: 'missing input', stopCondition: 'input arrives' },
        { decision: 'complete', summary: 'finished' },
      ],
    });
    const blocked = await start(fx.supervisor);
    assert.equal(blocked.events.filter(event => event.type === 'supervisor_final').length, 2);
    await fx.supervisor.send(blocked.runId, 'late input');
    assert.equal(fx.prompts[2], 'late input');
  });

  test('enforces maximum iterations and turn budget', async () => {
    const continueCheck: StructuredGoalCheck = {
      decision: 'continue', summary: 'continue', nextAction: 'again', stopCondition: 'done',
    };
    const maxFx = fixture({ checks: [continueCheck] });
    const maxed = await start(maxFx.supervisor, { maxIterations: 2, budget: 5 });
    assert.equal(maxed.status, 'blocked');
    assert.equal(maxed.blocker, 'maximum_iterations_reached');
    assert.equal(maxed.events.filter(event => event.type === 'supervisor_final').length, 2);

    const budgetFx = fixture({ checks: [continueCheck] });
    const budgeted = await start(budgetFx.supervisor, { runId: 'run-budget', maxIterations: 5, budget: 2 });
    assert.equal(budgeted.status, 'blocked');
    assert.equal(budgeted.blocker, 'budget_exhausted');
  });

  test('blocks on agent and Goal Check failures', async () => {
    const turnFx = fixture({ finals: [new Error('model down')] });
    const turnRun = await start(turnFx.supervisor);
    assert.match(turnRun.blocker || '', /^agent_turn_failed: model down/);

    const goalFx = fixture({ checks: [new Error('bad structured result')] });
    const goalRun = await start(goalFx.supervisor, { runId: 'run-goal' });
    assert.match(goalRun.blocker || '', /^goal_check_failed: bad structured result/);
    assert.equal(goalRun.events.filter(event => event.type === 'supervisor_final').length, 1);
  });

  test('deduplicates concurrent owner calls in one process', async () => {
    let release!: (value: string) => void;
    const pending = new Promise<string>(resolve => { release = resolve; });
    const fx = fixture({ finals: [pending] });
    const first = start(fx.supervisor);
    await new Promise(resolve => setImmediate(resolve));
    const second = fx.supervisor.wake('run-1');
    release('done');
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.status, 'completed');
    assert.equal(b.status, 'completed');
    assert.equal(fx.prompts.length, 1);
  });

  test('queues input arriving during an active turn for the next iteration', async () => {
    let release!: (value: string) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const pending = new Promise<string>(resolve => { release = resolve; });
    const fx = fixture({
      finals: [pending, 'second final'],
      onTurnStarted: entered,
      checks: [
        { decision: 'complete', summary: 'first turn complete' },
        { decision: 'complete', summary: 'queued input complete' },
      ],
    });
    const first = start(fx.supervisor);
    await started;
    const sent = fx.supervisor.send('run-1', 'URGENT-SECOND-INPUT');
    release('first final');
    const [firstResult, sendResult] = await Promise.all([first, sent]);
    assert.equal(firstResult.status, 'completed');
    assert.equal(sendResult.status, 'completed');
    assert.deepEqual(fx.prompts, [
      'Agent Run goal: ship the feature\n\nWork toward the goal. Return a concise final response with concrete evidence and remaining limitations.',
      'URGENT-SECOND-INPUT',
    ]);
    assert.equal(sendResult.events.filter(event => event.type === 'supervisor_final').length, 2);
  });

  test('keeps cancellation terminal when an active turn fails late', async () => {
    let reject!: (error: Error) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const pending = new Promise<string>((_resolve, rejectPromise) => { reject = rejectPromise; });
    const fx = fixture({ finals: [pending], onTurnStarted: entered });
    const active = start(fx.supervisor);
    await started;
    assert.equal(fx.supervisor.cancel('run-1').status, 'cancelled');
    reject(new Error('late failure'));
    const result = await active;
    assert.equal(result.status, 'cancelled');
    assert.equal(fx.supervisor.show('run-1').status, 'cancelled');
    assert.equal(result.events.some(event => event.type === 'run_blocked'), false);
  });

  test('resume restores the stable Session without producing a turn', async () => {
    const fx = fixture();
    const queued = await start(fx.supervisor, { autoRun: false });
    const resumed = await fx.supervisor.resume(queued.runId);
    assert.equal(resumed.status, 'queued');
    assert.equal(fx.prompts.length, 0);
    assert.deepEqual(fx.sessionKeys, ['agent-run:run-1']);
  });

  test('continues from the persisted Goal Check next action after process restart', async () => {
    const fx = fixture({
      finals: ['first final'],
      checks: [{ decision: 'blocked', summary: 'temporary stop', blocker: 'restart boundary', stopCondition: 'owner restarts' }],
    });
    const blocked = await start(fx.supervisor);
    fx.store.update(blocked.runId, run => {
      run.status = 'queued';
      run.blocker = undefined;
      run.lastGoalCheck = {
        checkedAt: new Date().toISOString(), complete: false, capabilitiesExhausted: false,
        summary: 'continue after restart', nextAction: 'verify persisted output', stopCondition: 'verification complete',
      };
    });
    const restored = fixture({
      filePath: fx.filePath,
      finals: ['restart final'],
      checks: [{ decision: 'complete', summary: 'done after restart' }],
    });
    await restored.supervisor.wake(blocked.runId);
    assert.match(restored.prompts[0], /verify persisted output/);
  });

  test('persists context and supports show, list, wake, cancel and restoration', async () => {
    const fx = fixture({
      checks: [{ decision: 'blocked', summary: 'pause', blocker: 'paused', stopCondition: 'wake' }],
    });
    const blocked = await start(fx.supervisor);
    const withContext = fx.supervisor.addContext(blocked.runId, 'release channel: beta');
    assert.equal(withContext.events.some(event => event.type === 'supervisor_context'), true);
    assert.equal(fx.supervisor.show(blocked.runId).runId, blocked.runId);
    assert.equal(fx.supervisor.list().length, 1);

    const restored = fixture({
      filePath: fx.filePath,
      checks: [{ decision: 'complete', summary: 'awake and done' }],
      finals: ['resumed final'],
    });
    const awakened = await restored.supervisor.wake(blocked.runId);
    assert.equal(awakened.status, 'completed');
    assert.deepEqual(restored.sessionKeys, ['agent-run:run-1']);

    const cancelFx = fixture({ checks: [{ decision: 'blocked', summary: 'pause', blocker: 'paused', stopCondition: 'cancel' }] });
    const cancellable = await start(cancelFx.supervisor);
    const cancelled = cancelFx.supervisor.cancel(cancellable.runId);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelFx.supervisor.cancel(cancellable.runId).status, 'cancelled');
  });
});
