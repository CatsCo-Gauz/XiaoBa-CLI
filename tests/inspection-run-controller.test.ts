import { afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

import { InspectionRunController, type InspectionSessionHost } from '../src/inspection/inspection-run-controller';
import { AgentRunGoalResolver, type AgentRunGoalDrafter } from '../src/core/agent-run-goal-resolver';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

class FakeSessionHost implements InspectionSessionHost {
  readonly messages: Array<{ key: string; text: string }> = [];
  onObservation?: (key: string, text: string) => Promise<void> | void;

  getOrCreate(key: string): any {
    return {
      handleRuntimeObservation: async (text: string) => {
        this.messages.push({ key, text });
        await this.onObservation?.(key, text);
      },
    };
  }
}

function fixture(goalDrafter?: AgentRunGoalDrafter) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inspection-run-'));
  roots.push(root);
  const sessions = new FakeSessionHost();
  let sequence = 0;
  const controller = new InspectionRunController({
    storePath: path.join(root, 'data', 'agent-runs.json'),
    outputRoot: path.join(root, 'artifacts'),
    workingDirectory: root,
    sessionHost: sessions,
    validationScriptPath: null,
    now: () => new Date('2026-07-28T08:00:00.000Z'),
    idFactory: () => `id-${++sequence}`,
    goalResolver: new AgentRunGoalResolver({
      ...(goalDrafter ? { drafter: goalDrafter } : {}),
      now: () => new Date('2026-07-28T08:00:00.000Z'),
    }),
  });
  return { root, sessions, controller };
}

describe('InspectionRunController', () => {
  test('idempotently creates a manual inspection Run and freezes its trigger', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = {
      repo,
      snapshot: 'tree-sha-1',
      mode: 'baseline' as const,
      goal: 'understand the repository and register concrete findings',
      actor: 'human',
      wake: false,
    };
    const first = await controller.trigger(input);
    const second = await controller.trigger(input);
    assert.equal(second.runId, first.runId);
    assert.equal(first.status, 'queued');
    assert.equal(first.sessionKey, `inspection:${first.runId}`);
    assert.equal(controller.listProjections()[0].initialGoal, input.goal);
    assert.equal((controller.listProjections()[0] as any).sessionKey, undefined);
    const triggerPath = path.join(root, 'artifacts', first.runId, 'trigger.json');
    assert.equal(fs.existsSync(triggerPath), true);
    const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    assert.equal(trigger.snapshot, 'tree-sha-1');
  });

  test('repairs a missing trigger artifact after persistence failure and supports restart recovery', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const outputRoot = path.join(root, 'artifacts');
    fs.writeFileSync(outputRoot, 'not a directory');
    const input = { repo, snapshot: 'tree-artifact-repair', mode: 'baseline' as const, actor: 'human', wake: false };

    await assert.rejects(controller.trigger(input), /ENOTDIR|EEXIST|not a directory/i);
    assert.equal(controller.store.list().length, 1);
    const stranded = controller.store.list()[0];
    assert.equal(fs.existsSync(path.join(outputRoot, stranded.runId, 'trigger.json')), false);

    fs.rmSync(outputRoot, { force: true });
    const recovered = await controller.trigger(input);
    assert.equal(recovered.runId, stranded.runId);
    const triggerPath = path.join(outputRoot, recovered.runId, 'trigger.json');
    const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    assert.equal(trigger.runId, recovered.runId);
    assert.equal(trigger.idempotencyKey, recovered.triggerRef.idempotencyKey);

    const restartedSessions = new FakeSessionHost();
    const restarted = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot,
      workingDirectory: root, sessionHost: restartedSessions, validationScriptPath: null,
    });
    const afterWake = await restarted.wake(recovered.runId);
    assert.equal(afterWake.blocker, 'goal_check_missing');
    assert.equal(restartedSessions.messages.length, 1);
  });

  test('fails closed when a persisted trigger artifact is tampered', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = { repo, snapshot: 'trusted-snapshot', mode: 'baseline' as const, actor: 'human', wake: false };
    const run = await controller.trigger(input);
    const triggerPath = path.join(root, 'artifacts', run.runId, 'trigger.json');
    const original = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));

    fs.writeFileSync(triggerPath, JSON.stringify({ ...original, snapshot: 'tampered-snapshot' }));
    await assert.rejects(controller.trigger(input), /artifact conflicts with persisted Run/);
    const snapshotSessions = new FakeSessionHost();
    const snapshotRestart = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot: path.join(root, 'artifacts'),
      workingDirectory: root, sessionHost: snapshotSessions, validationScriptPath: null,
    });
    const snapshotWake = await snapshotRestart.wake(run.runId);
    assert.match(snapshotWake.blocker || '', /wake_failed: Inspection trigger artifact conflicts/);
    assert.equal(snapshotSessions.messages.length, 0);

    fs.writeFileSync(triggerPath, JSON.stringify({ ...original, actor: 'tampered-actor' }));
    await assert.rejects(controller.trigger(input), /artifact conflicts with persisted Run/);
    const actorSessions = new FakeSessionHost();
    const actorRestart = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot: path.join(root, 'artifacts'),
      workingDirectory: root, sessionHost: actorSessions, validationScriptPath: null,
    });
    const actorWake = await actorRestart.wake(run.runId);
    assert.match(actorWake.blocker || '', /wake_failed: Inspection trigger artifact conflicts/);
    assert.equal(actorSessions.messages.length, 0);
  });

  test('ignores forged wake arguments and always reloads the persisted Trigger', async () => {
    const { root, sessions, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const run = await controller.trigger({
      repo, snapshot: 'trusted-wake-snapshot', mode: 'baseline', actor: 'human', wake: false,
    });
    const forged = {
      repo, snapshot: 'FORGED-WAKE-SNAPSHOT', mode: 'baseline', goal: undefined,
      scope: [], evidencePermissions: [], baseSnapshot: undefined, topic: undefined, actor: 'human',
    };
    const after = await (controller.wake as any)(run.runId, forged);
    assert.equal(after.blocker, 'goal_check_missing');
    assert.equal(sessions.messages.length, 1);
    assert.match(sessions.messages[0].text, /trusted-wake-snapshot/);
    assert.doesNotMatch(sessions.messages[0].text, /FORGED-WAKE-SNAPSHOT/);
  });

  test('uses AI Goal Resolver once, persists its source, and freezes the Goal across duplicate Triggers', async () => {
    let drafts = 0;
    const { root, controller } = fixture({
      generatorName: 'inspection-goal-model',
      async draftGoal() {
        drafts += 1;
        return 'Inspect the frozen snapshot, produce a validated report, and register only qualified Findings.';
      },
    });
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = { repo, snapshot: 'tree-goal', mode: 'baseline' as const, actor: 'human', wake: false };
    const first = await controller.trigger(input);
    const duplicate = await controller.trigger(input);
    assert.equal(first.initialGoal, 'Inspect the frozen snapshot, produce a validated report, and register only qualified Findings.');
    assert.equal(first.goalResolution?.source, 'ai_generated');
    assert.equal(first.goalResolution?.profileId, 'code_inspection.v1');
    assert.equal(first.goalResolution?.generator, 'inspection-goal-model');
    assert.equal(first.events.some(event => event.type === 'goal_resolved'), true);
    assert.equal(duplicate.initialGoal, first.initialGoal);
    assert.equal(drafts, 1);
  });

  test('canonicalizes symlinked repository aliases before Trigger identity and locking', async () => {
    let drafts = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const drafter: AgentRunGoalDrafter = {
      async draftGoal() { drafts += 1; await gate; return 'Canonical repository Goal'; },
    };
    const { root, controller } = fixture(drafter);
    const secondController = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot: path.join(root, 'artifacts'),
      workingDirectory: root, sessionHost: new FakeSessionHost(), validationScriptPath: null,
      goalResolver: new AgentRunGoalResolver({ drafter }),
    });
    const repo = path.join(root, 'repo');
    const alias = path.join(root, 'repo-alias');
    fs.mkdirSync(repo);
    fs.symlinkSync(repo, alias, 'dir');
    const base = { snapshot: 'tree-symlink', mode: 'baseline' as const, actor: 'human', wake: false };
    const directPromise = controller.trigger({ ...base, repo });
    const aliasPromise = secondController.trigger({ ...base, repo: alias });
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(drafts, 1);
    release();
    const [direct, viaAlias] = await Promise.all([directPromise, aliasPromise]);
    assert.equal(drafts, 1);
    assert.equal(viaAlias.runId, direct.runId);
    secondController.store.refresh();
    assert.equal(secondController.store.list().length, 1);
    const trigger = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', direct.runId, 'trigger.json'), 'utf8'));
    assert.equal(trigger.repo, fs.realpathSync.native(repo));
  });

  test('adopts and migrates a valid pre-v2 symlink Trigger without duplicating its Run', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    const alias = path.join(root, 'repo-legacy-alias');
    fs.mkdirSync(repo);
    fs.symlinkSync(repo, alias, 'dir');
    const input = { repo, snapshot: 'tree-legacy-alias', mode: 'baseline' as const, actor: 'human', wake: false };
    const run = await controller.trigger(input);
    const triggerPath = path.join(root, 'artifacts', run.runId, 'trigger.json');
    const artifact = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    const legacyIdentity = {
      repo: path.resolve(alias), snapshot: artifact.snapshot, mode: artifact.mode,
      goal: artifact.goal || '', scope: artifact.scope, evidencePermissions: artifact.evidencePermissions,
      baseSnapshot: artifact.baseSnapshot || '', topic: artifact.topic || '',
    };
    const legacyKey = createHash('sha256').update(JSON.stringify(legacyIdentity)).digest('hex');
    delete artifact.triggerIdentityVersion;
    artifact.repo = path.resolve(alias);
    artifact.idempotencyKey = legacyKey;
    fs.writeFileSync(triggerPath, JSON.stringify(artifact, null, 2));
    const storePath = path.join(root, 'data', 'agent-runs.json');
    const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    state.runs[0].triggerRef.idempotencyKey = legacyKey;
    state.runs[0].triggerRef.id = `${path.resolve(alias)}@tree-legacy-alias`;
    fs.writeFileSync(storePath, JSON.stringify(state, null, 2));

    const sessions = new FakeSessionHost();
    const restarted = new InspectionRunController({
      storePath, outputRoot: path.join(root, 'artifacts'), workingDirectory: root,
      sessionHost: sessions, validationScriptPath: null,
    });
    const afterWake = await restarted.wake(run.runId);
    assert.equal(afterWake.blocker, 'goal_check_missing');
    assert.equal(sessions.messages.length, 1);
    restarted.store.refresh();
    const migrated = restarted.store.get(run.runId)!;
    assert.notEqual(migrated.triggerRef.idempotencyKey, legacyKey);
    const migratedArtifact = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    assert.equal(migratedArtifact.triggerIdentityVersion, 2);
    assert.equal(migratedArtifact.repo, fs.realpathSync.native(repo));
    assert.equal(migratedArtifact.idempotencyKey, migrated.triggerRef.idempotencyKey);

    const repeated = await restarted.trigger(input);
    assert.equal(repeated.runId, run.runId);
    assert.equal(restarted.store.list().length, 1);
  });

  test('canonical Trigger directly adopts a valid pre-v2 alias Run before any wake', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    const alias = path.join(root, 'repo-direct-adopt-alias');
    fs.mkdirSync(repo);
    fs.symlinkSync(repo, alias, 'dir');
    const input = { repo, snapshot: 'tree-direct-adopt', mode: 'baseline' as const, actor: 'human', wake: false };
    const run = await controller.trigger(input);
    const triggerPath = path.join(root, 'artifacts', run.runId, 'trigger.json');
    const artifact = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    const legacyIdentity = {
      repo: path.resolve(alias), snapshot: artifact.snapshot, mode: artifact.mode,
      goal: artifact.goal || '', scope: artifact.scope, evidencePermissions: artifact.evidencePermissions,
      baseSnapshot: artifact.baseSnapshot || '', topic: artifact.topic || '',
    };
    const legacyKey = createHash('sha256').update(JSON.stringify(legacyIdentity)).digest('hex');
    delete artifact.triggerIdentityVersion;
    artifact.repo = path.resolve(alias);
    artifact.idempotencyKey = legacyKey;
    fs.writeFileSync(triggerPath, JSON.stringify(artifact, null, 2));
    const storePath = path.join(root, 'data', 'agent-runs.json');
    const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    state.runs[0].triggerRef.idempotencyKey = legacyKey;
    state.runs[0].triggerRef.id = `${path.resolve(alias)}@tree-direct-adopt`;
    fs.writeFileSync(storePath, JSON.stringify(state, null, 2));

    const restarted = new InspectionRunController({
      storePath, outputRoot: path.join(root, 'artifacts'), workingDirectory: root,
      sessionHost: new FakeSessionHost(), validationScriptPath: null,
    });
    const adopted = await restarted.trigger(input);
    assert.equal(adopted.runId, run.runId);
    assert.equal(restarted.store.list().length, 1);
    const upgraded = JSON.parse(fs.readFileSync(triggerPath, 'utf8'));
    assert.equal(upgraded.triggerIdentityVersion, 2);
    assert.equal(upgraded.repo, fs.realpathSync.native(repo));
    assert.equal(upgraded.idempotencyKey, adopted.triggerRef.idempotencyKey);
  });

  test('single-flights concurrent duplicate Triggers and writes the winning Run identity', async () => {
    let drafts = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const { root, controller } = fixture({
      async draftGoal() { drafts += 1; await gate; return 'Concurrent inspection Goal'; },
    });
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = { repo, snapshot: 'tree-concurrent', mode: 'baseline' as const, actor: 'human', wake: false };
    const firstPromise = controller.trigger(input);
    const secondPromise = controller.trigger(input);
    await Promise.resolve();
    release();
    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    assert.equal(drafts, 1);
    assert.equal(second.runId, first.runId);
    assert.equal(controller.store.list().length, 1);
    const trigger = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', first.runId, 'trigger.json'), 'utf8'));
    assert.equal(trigger.runId, first.runId);
  });

  test('single-flights duplicate Triggers across controller instances sharing a Store', async () => {
    let drafts = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const drafter: AgentRunGoalDrafter = { async draftGoal() { drafts += 1; await gate; return 'Cross-instance inspection Goal'; } };
    const { root, controller: firstController } = fixture(drafter);
    const secondController = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot: path.join(root, 'artifacts'),
      workingDirectory: root, sessionHost: new FakeSessionHost(), validationScriptPath: null,
      idFactory: () => 'second-id', goalResolver: new AgentRunGoalResolver({ drafter }),
    });
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = { repo, snapshot: 'tree-cross-instance', mode: 'baseline' as const, actor: 'human', wake: false };
    const firstPromise = firstController.trigger(input);
    const secondPromise = secondController.trigger(input);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(drafts, 1);
    release();
    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    assert.equal(drafts, 1);
    assert.equal(second.runId, first.runId);
    secondController.store.refresh();
    assert.equal(secondController.store.list().length, 1);
    const trigger = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', first.runId, 'trigger.json'), 'utf8'));
    assert.equal(trigger.runId, first.runId);
  });

  test('single-flights a late-joining wake across controller instances', async () => {
    const { root, sessions, controller: firstController } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const input = { repo, snapshot: 'tree-wake-cross', mode: 'baseline' as const, actor: 'human', wake: false };
    const run = await firstController.trigger(input);
    let release!: () => void;
    let entered!: () => void;
    const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    sessions.onObservation = async () => {
      await firstController.recordGoalCheck(run.runId, run.sessionKey, {
        checkedAt: '2026-07-28T08:00:00.000Z', complete: false, capabilitiesExhausted: false,
        summary: 'First wake persisted its final state', nextAction: 'wait', stopCondition: 'new evidence',
      });
      entered();
      await gate;
    };
    const firstWake = firstController.wake(run.runId);
    await enteredPromise;

    // Construct after the winning wake has already persisted run_woken and its
    // Goal Check. A state-version heuristic sees no later change and double-sends.
    const secondSessions = new FakeSessionHost();
    const secondController = new InspectionRunController({
      storePath: path.join(root, 'data', 'agent-runs.json'), outputRoot: path.join(root, 'artifacts'),
      workingDirectory: root, sessionHost: secondSessions, validationScriptPath: null,
      idFactory: () => 'wake-second', goalResolver: new AgentRunGoalResolver(),
    });
    const secondWake = secondController.wake(run.runId);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(secondSessions.messages.length, 0);
    release();
    const [firstResult, secondResult] = await Promise.all([firstWake, secondWake]);
    assert.equal(sessions.messages.length + secondSessions.messages.length, 1);
    assert.equal(firstResult.events.filter(event => event.type === 'run_woken').length, 1);
    assert.equal(secondResult.events.filter(event => event.type === 'run_woken').length, 1);
  });

  test('executes a wake after taking over a lock directory that becomes stale while waiting', async () => {
    const { root, sessions, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const run = await controller.trigger({
      repo, snapshot: 'tree-wake-stale-lock', mode: 'baseline', actor: 'human', wake: false,
    });
    const previous = process.env.XIAOBA_FILE_LOCK_STALE_MS;
    process.env.XIAOBA_FILE_LOCK_STALE_MS = '2000';
    const lockHash = createHash('sha256').update(`inspection_wake\0${run.runId}`).digest('hex');
    const lockPath = `${path.join(root, 'data', 'agent-runs.json')}.wake-${lockHash}.lock`;
    fs.mkdirSync(lockPath);
    const almostStale = new Date(Date.now() - 1700);
    fs.utimesSync(lockPath, almostStale, almostStale);
    try {
      const after = await controller.wake(run.runId);
      assert.equal(sessions.messages.length, 1);
      assert.equal(after.events.filter(event => event.type === 'run_woken').length, 1);
      assert.equal(after.blocker, 'goal_check_missing');
    } finally {
      if (previous === undefined) delete process.env.XIAOBA_FILE_LOCK_STALE_MS;
      else process.env.XIAOBA_FILE_LOCK_STALE_MS = previous;
    }
  });

  test('fails closed when a woken inspection turn omits Goal Check', async () => {
    const { root, sessions, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const run = await controller.trigger({ repo, snapshot: 'tree-sha-2', mode: 'baseline', actor: 'human' });
    assert.equal(run.status, 'blocked');
    assert.equal(run.blocker, 'goal_check_missing');
    assert.equal(sessions.messages.length, 1);
    assert.match(sessions.messages[0].text, /Load and follow the code-inspection Skill/);
    assert.match(sessions.messages[0].text, /Goal completion contract:/);
    assert.match(sessions.messages[0].text, /call agent_run goal_check/);
  });

  test('attaches a validated report, links Findings, and completes only in its bound Session', async () => {
    const { root, sessions, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const run = await controller.trigger({ repo, snapshot: 'tree-sha-3', mode: 'baseline', actor: 'human', wake: false });
    const reportPath = path.join(root, 'artifacts', run.runId, 'inspection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: { conclusion: 'Bounded inspection completed.' },
      coverage: { reviewed: ['src'] },
      stop: { reason: 'Goal met.' },
      findings: [{ findingId: 'F-PRACTICE-1', title: 'Unbounded retry', envelopePath: path.join(root, 'findings', 'F-PRACTICE-1') }],
    }));

    await assert.rejects(
      () => controller.attachArtifact(run.runId, 'wrong-session', {
        artifactId: 'inspection-json', kind: 'inspection_report', label: 'Inspection report', ref: reportPath,
        createdAt: '2026-07-28T08:00:00.000Z',
      }),
      /not bound to Session/,
    );

    await controller.attachArtifact(run.runId, run.sessionKey, {
      artifactId: 'inspection-json', kind: 'inspection_report', label: 'Inspection report', ref: reportPath,
      createdAt: '2026-07-28T08:00:00.000Z',
    });
    const linked = controller.get(run.runId);
    assert.equal(linked.subjects.some(item => item.kind === 'finding' && item.id === 'F-PRACTICE-1'), true);

    const complete = await controller.recordGoalCheck(run.runId, run.sessionKey, {
      checkedAt: '2026-07-28T08:00:00.000Z',
      complete: true,
      capabilitiesExhausted: false,
      summary: 'Report validated and Finding linked',
    });
    assert.equal(complete.status, 'completed');
    assert.equal(controller.getProjection(run.runId).lastGoalCheck?.complete, true);
    assert.equal(sessions.messages.length, 0);
  });

  test('rejects a terminal Goal Check before the inspection report exists', async () => {
    const { root, controller } = fixture();
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    const run = await controller.trigger({ repo, snapshot: 'tree-sha-4', mode: 'baseline', actor: 'human', wake: false });
    await assert.rejects(() => controller.recordGoalCheck(run.runId, run.sessionKey, {
      checkedAt: '2026-07-28T08:00:00.000Z',
      complete: true,
      capabilitiesExhausted: false,
      summary: 'done',
    }), /requires an inspection_report artifact/);
  });
});
