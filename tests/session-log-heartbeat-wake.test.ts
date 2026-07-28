import { afterEach, beforeEach, describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRequire } from 'node:module';

import { DistillationHeartbeatScheduler } from '../src/utils/distillation-heartbeat-scheduler';
import { getDistillationHeartbeatConfig } from '../src/utils/distillation-heartbeat-config';
import { PathResolver } from '../src/utils/path-resolver';
import { RuntimeFactory } from '../src/runtime/runtime-factory';
import { resolveDefaultRuntimeProfile } from '../src/runtime/runtime-profile';
import { acquireHeartbeatSchedulerOwnerLock } from '../src/utils/heartbeat-scheduler-owner-lock';
import { RuntimeLearning } from '../src/utils/runtime-learning';

const require = createRequire(import.meta.url);
const isolatedEnvKeys = [
  'XIAOBA_USER_DATA_DIR',
  'CATSCO_USER_DATA_DIR',
  'XIAOBA_ELECTRON_USER_DATA_DIR',
  'XIAOBA_RUNTIME_ROOT',
  'XIAOBA_ROLE',
  'DISTILLATION_HEARTBEAT_ENABLED',
  'DISTILLATION_HEARTBEAT_INTERVAL_MINUTES',
  'DISTILLATION_HEARTBEAT_INTERVAL_HOURS',
  'DOTENV_CONFIG_PATH',
] as const;

describe('session log heartbeat wake', () => {
  let root: string;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(isolatedEnvKeys.map(key => [key, process.env[key]]));
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-session-wake-'));
    process.env.XIAOBA_USER_DATA_DIR = root;
    process.env.DISTILLATION_HEARTBEAT_ENABLED = 'true';
    process.env.DISTILLATION_HEARTBEAT_INTERVAL_HOURS = '6';
    delete process.env.DISTILLATION_HEARTBEAT_INTERVAL_MINUTES;
    delete process.env.CATSCO_USER_DATA_DIR;
    delete process.env.XIAOBA_ELECTRON_USER_DATA_DIR;
    delete process.env.XIAOBA_RUNTIME_ROOT;
    delete process.env.XIAOBA_ROLE;
    delete process.env.DOTENV_CONFIG_PATH;
  });

  afterEach(() => {
    for (const key of isolatedEnvKeys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('uses the same .env-only data root for config, logs, and the append signal', async () => {
    const configuredRoot = path.join(root, 'configured-data');
    delete process.env.XIAOBA_USER_DATA_DIR;
    fs.writeFileSync(path.join(root, '.env'), `XIAOBA_USER_DATA_DIR=${configuredRoot}\n`);
    const originalCwd = process.cwd();
    process.chdir(root);
    const runtime = createRuntimeHarness();
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.wakes.length >= 1);
      delete require.cache[require.resolve('../src/utils/session-turn-logger')];
      const { SessionTurnLogger } = require('../src/utils/session-turn-logger');
      const logger = new SessionTurnLogger('chat', 'dotenv-root');
      logger.logTurn('input', 'output', [], { prompt: 1, completion: 1 });
      await waitFor(() => runtime.wakes.some(reasons => reasons.includes('session-log-append')));

      const config = getDistillationHeartbeatConfig(root, {});
      assert.equal(config.logsRoot, path.join(configuredRoot, 'logs'));
      assert.equal(PathResolver.getRuntimeDataRoot({}, root), configuredRoot);
      assert.equal(logger.getLogFilePath().startsWith(path.join(config.logsRoot, 'sessions')), true);
      assert.equal(
        fs.existsSync(path.join(configuredRoot, 'data', 'session-log-append.signal')),
        true,
      );
    } finally {
      await scheduler.stop();
      process.chdir(originalCwd);
    }
  });

  test('coalesces repeated requests into one append wake and persists the reason', async () => {
    const runtime = createRuntimeHarness();
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.wakes.length >= 1);
      runtime.wakes.length = 0;

      scheduler.requestWake('session-log-append');
      scheduler.requestWake('session-log-append');
      scheduler.requestWake('session-log-append');

      assert.deepEqual(runtime.lastPending, ['session-log-append']);
      await waitFor(() => runtime.wakes.length >= 1);
      assert.deepEqual(runtime.wakes, [['session-log-append']]);
    } finally {
      await scheduler.stop();
    }
  });

  test('does not repeat an append wake after an active wake consumes its pending reason', async () => {
    const runtime = createRuntimeHarness();
    let finishManual!: () => void;
    const manualGate = new Promise<void>(resolve => { finishManual = resolve; });
    runtime.value.wake = async (reason: string | string[]) => {
      const reasons = (Array.isArray(reason) ? reason : [reason]).slice().sort();
      runtime.wakes.push(reasons);
      runtime.events.push('wake');
      if (reasons.includes('manual')) await manualGate;
      return { ran: true };
    };
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.wakes.length >= 1);
      runtime.wakes.length = 0;

      const manualWake = scheduler.runHeartbeat('manual');
      await waitFor(() => runtime.wakes.some(reasons => reasons.includes('manual')));
      scheduler.requestWake('session-log-append');
      finishManual();
      await manualWake;
      await delay(1_250);

      assert.deepEqual(runtime.wakes, [
        ['manual'],
        ['session-log-append'],
      ]);
    } finally {
      finishManual();
      await scheduler.stop();
    }
  });

  test('replaces a six-hour timer when a real append creates earlier due work', async () => {
    const runtime = createRuntimeHarness();
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.scheduled.length >= 1);
      const oldTimer = (scheduler as any).timer;
      const oldDelay = runtime.scheduled.at(-1)!.at.getTime() - Date.now();
      assert.ok(oldDelay > 5 * 60 * 60 * 1_000);

      runtime.onWake = reasons => {
        if (reasons.includes('session-log-append')) {
          runtime.nextWakeTime = Date.now() + 30 * 60 * 1_000;
        }
      };
      runtime.wakes.length = 0;
      appendRealTurn('replan');
      await waitFor(() => runtime.wakes.some(reasons => reasons.includes('session-log-append')));
      await waitFor(() => runtime.scheduled.at(-1)?.reason === 'settlement-deadline');

      assert.notEqual((scheduler as any).timer, oldTimer);
      const newDelay = runtime.scheduled.at(-1)!.at.getTime() - Date.now();
      assert.ok(newDelay > 29 * 60 * 1_000 && newDelay <= 30 * 60 * 1_000);
    } finally {
      await scheduler.stop();
    }
  });

  test('stops observing the original signal path even if the environment root changes', async () => {
    const runtime = createRuntimeHarness();
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    const signalPath = path.join(root, 'data', 'session-log-append.signal');
    await scheduler.start();
    await waitFor(() => runtime.wakes.length >= 1);
    runtime.wakes.length = 0;

    process.env.XIAOBA_USER_DATA_DIR = path.join(root, 'changed-root');
    await scheduler.stop();
    fs.mkdirSync(path.dirname(signalPath), { recursive: true });
    fs.writeFileSync(signalPath, 'after-stop\n');
    await delay(1_500);
    assert.deepEqual(runtime.wakes, []);
  });

  test('recovers an in-progress append reason on startup and persists in-progress before clearing pending', async () => {
    const runtime = createRuntimeHarness({ inProgressReasons: ['session-log-append'] });
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.wakes.length >= 1);
      assert.deepEqual(runtime.wakes[0], ['session-log-append', 'startup']);
      const inProgressIndex = runtime.events.findIndex(event => event === 'in-progress');
      const clearPendingIndex = runtime.events.findIndex(
        (event, index) => index > inProgressIndex && event === 'pending:',
      );
      const wakeIndex = runtime.events.findIndex(event => event === 'wake');
      assert.ok(inProgressIndex >= 0 && inProgressIndex < clearPendingIndex);
      assert.ok(clearPendingIndex < wakeIndex);
    } finally {
      await scheduler.stop();
    }
  });


  test('keeps the owner lock on the already-resolved root despite conflicting compatibility env', () => {
    const resolvedRoot = path.join(root, 'resolved-root');
    const conflictingRoot = path.join(root, 'conflicting-root');
    const ownerLock = acquireHeartbeatSchedulerOwnerLock({
      runtimeRoot: resolvedRoot,
      env: { CATSCO_USER_DATA_DIR: conflictingRoot },
    });
    if (!ownerLock.acquired) assert.fail('expected owner lock acquisition');
    try {
      assert.equal(
        ownerLock.lockPath,
        path.join(resolvedRoot, '.xiaoba', 'heartbeat-scheduler-owner', 'owner.json'),
      );
      assert.equal(fs.existsSync(path.join(conflictingRoot, '.xiaoba')), false);
    } finally {
      ownerLock.release();
    }
  });

  test('a repeated release cannot detach a replacement owner generation', () => {
    const lockRoot = path.join(root, 'release-once-root');
    const first = acquireHeartbeatSchedulerOwnerLock({ runtimeRoot: lockRoot });
    if (!first.acquired) assert.fail('expected first owner lock acquisition');
    first.release();

    const replacement = acquireHeartbeatSchedulerOwnerLock({ runtimeRoot: lockRoot });
    if (!replacement.acquired) assert.fail('expected replacement owner lock acquisition');
    try {
      first.release();
      assert.equal(replacement.renew(), true);
      assert.equal(fs.existsSync(replacement.lockPath), true);
    } finally {
      replacement.release();
    }
  });

  test('factory-created sessions use a project .env data root even when cwd differs', async () => {
    const projectRoot = path.join(root, 'project');
    const configuredRoot = path.join(root, 'project-data');
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.env'), `XIAOBA_USER_DATA_DIR=${configuredRoot}
`);
    delete process.env.XIAOBA_USER_DATA_DIR;

    const profile = resolveDefaultRuntimeProfile({ surface: 'cli', workingDirectory: projectRoot });
    const runtime = await RuntimeFactory.createSession({
      profile,
      sessionKey: 'project-root-session',
      sessionType: 'cli',
      loadSkills: false,
    });
    const logger = (runtime.session as any).sessionTurnLogger;
    logger.logTurn('input', 'output', [], { prompt: 1, completion: 1 });

    assert.equal(runtime.services.runtimeDataRoot, configuredRoot);
    assert.equal(logger.getLogFilePath().startsWith(path.join(configuredRoot, 'logs', 'sessions')), true);
    assert.equal(fs.existsSync(path.join(configuredRoot, 'data', 'session-log-append.signal')), true);
  });

  test('waitForDrain observes work that enters while an earlier operation settles', async () => {
    let finishFirst!: () => void;
    let finishSecond!: () => void;
    const first = new Promise<any>(resolve => { finishFirst = resolve; });
    const second = new Promise<any>(resolve => { finishSecond = resolve; });
    const activeWakeResults = new Set<Promise<any>>([first]);
    const runtime = { activeBackfill: null, activeWakeResults };

    const waiting = RuntimeLearning.prototype.waitForDrain.call(runtime as any);
    activeWakeResults.add(second);
    finishFirst();
    activeWakeResults.delete(first);
    await delay(10);
    let finished = false;
    void waiting.then(() => { finished = true; });
    await delay(10);
    assert.equal(finished, false);

    finishSecond();
    activeWakeResults.delete(second);
    await waiting;
  });

  test('does not release the owner lease when a timed-out stop is followed by restart', async () => {
    const runtime = createRuntimeHarness();
    let finishManual!: () => void;
    const manualGate = new Promise<void>(resolve => { finishManual = resolve; });
    runtime.value.wake = async (reason: string | string[]) => {
      const reasons = (Array.isArray(reason) ? reason : [reason]).slice().sort();
      runtime.wakes.push(reasons);
      runtime.events.push('wake');
      if (reasons.includes('manual')) await manualGate;
      return { ran: true };
    };
    runtime.value.getConfig = () => ({ skillEvolutionReviewAttemptDeadlineMinutes: 0.0005 });

    let releaseCount = 0;
    const ownerLock = {
      acquired: true as const,
      generation: 'test-generation',
      lockPath: path.join(root, 'owner.json'),
      record: {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        generation: 'test-generation',
        token: 'test-token',
      },
      assertOwnership: () => undefined,
      touch: () => undefined,
      release: () => { releaseCount += 1; },
    };
    const scheduler = new DistillationHeartbeatScheduler(root, runtime.value as any, ownerLock as any);
    try {
      await scheduler.start();
      await waitFor(() => runtime.wakes.length >= 1);
      runtime.wakes.length = 0;

      const manualWake = scheduler.runHeartbeat('manual');
      await waitFor(() => runtime.wakes.some(reasons => reasons.includes('manual')));
      assert.equal(await scheduler.stop(), false);
      await scheduler.start();

      finishManual();
      await manualWake;
      await waitFor(() => runtime.wakes.some(reasons => reasons.includes('startup')));
      await delay(25);
      assert.equal(releaseCount, 0);
    } finally {
      finishManual();
      await scheduler.stop();
    }
  });

  test('keeps the owner lease until a timed-out runtime drain really settles', async () => {
    let finishDrain!: () => void;
    const trulyDrained = new Promise<void>(resolve => { finishDrain = resolve; });
    let releaseCount = 0;
    const runtime = {
      drain: async () => false,
      waitForDrain: () => trulyDrained,
      getConfig: () => ({ skillEvolutionReviewAttemptDeadlineMinutes: 0.0005 }),
    };
    const ownerLock = {
      acquired: true as const,
      lockPath: path.join(root, 'owner.json'),
      record: {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        generation: 'test-generation',
        token: 'test-token',
      },
      touch: () => undefined,
      release: () => { releaseCount += 1; },
    };
    const scheduler = new DistillationHeartbeatScheduler(root, runtime as any, ownerLock as any);

    assert.equal(await scheduler.stop(), false);
    assert.equal(releaseCount, 0);
    finishDrain();
    await waitFor(() => releaseCount === 1);
  });
});

function appendRealTurn(sessionId: string): void {
  delete require.cache[require.resolve('../src/utils/session-turn-logger')];
  const { SessionTurnLogger } = require('../src/utils/session-turn-logger');
  new SessionTurnLogger('chat', sessionId).logTurn(
    'input',
    'output',
    [],
    { prompt: 1, completion: 1 },
  );
}

function createRuntimeHarness(options: { inProgressReasons?: string[] } = {}) {
  const harness = {
    wakes: [] as string[][],
    events: [] as string[],
    scheduled: [] as Array<{ at: Date; reason: string }>,
    lastPending: [] as string[],
    nextWakeTime: null as number | null,
    onWake: undefined as ((reasons: string[]) => void) | undefined,
    value: {} as Record<string, unknown>,
  };
  harness.value = {
    getPendingHeartbeatReasons: () => harness.lastPending,
    loadHeartbeatRecord: () => options.inProgressReasons
      ? { inProgress: { startedAt: new Date().toISOString(), reasons: options.inProgressReasons } }
      : {},
    markHeartbeatPending: (reasons: string[]) => {
      harness.lastPending = [...reasons];
      harness.events.push(`pending:${reasons.join(',')}`);
    },
    markHeartbeatInProgress: () => harness.events.push('in-progress'),
    wake: async (reason: string | string[]) => {
      const reasons = (Array.isArray(reason) ? reason : [reason]).slice().sort();
      harness.wakes.push(reasons);
      harness.events.push('wake');
      harness.onWake?.(reasons);
      return { ran: true };
    },
    getPlanner: () => ({
      plan: () => ({
        now: new Date(),
        nextWakeTime: harness.nextWakeTime,
        nextWakeReason: harness.nextWakeTime === null ? 'scheduled' : 'settlement-deadline',
      }),
    }),
    markHeartbeatScheduled: (at: Date, reason: string) => harness.scheduled.push({ at, reason }),
    getConfig: () => ({ skillEvolutionReviewAttemptDeadlineMinutes: 0.05 }),
    drain: async () => undefined,
    markHeartbeatStatus: () => undefined,
  };
  return harness;
}

async function waitFor(predicate: () => boolean, timeoutMs = 4_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`condition not met within ${timeoutMs}ms`);
    await delay(25);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
