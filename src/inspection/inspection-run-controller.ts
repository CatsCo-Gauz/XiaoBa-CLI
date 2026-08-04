import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

import type { AgentServices, AgentSession } from '../core/agent-session';
import {
  AgentRunStore,
  projectAgentRun,
  validateAgentRunGoalCheck,
} from '../core/agent-run-store';
import { AgentRunRuntimeTool, type AgentRunRuntimeToolController } from '../core/agent-run-runtime-tool';
import { AgentRunGoalResolver, createAIServiceGoalDrafter } from '../core/agent-run-goal-resolver';
import { withExclusiveFileLockAsync } from '../core/file-lock';
import { CODE_INSPECTION_GOAL_PROFILE } from '../core/agent-run-goal-profiles';
import type {
  AgentRunArtifactRef,
  AgentRunEvent,
  AgentRunGoalCheck,
  AgentRunPublicProjection,
  AgentRunRecord,
  AgentRunSubjectRef,
} from '../core/agent-run-types';
import { MessageSessionManager } from '../core/message-session-manager';
import { createAdapterRuntime } from '../runtime/adapter-runtime';
import type { RuntimeSurface } from '../runtime/runtime-profile';
import { PathResolver } from '../utils/path-resolver';

export type InspectionMode = 'baseline' | 'change' | 'focus';

export interface InspectionSessionHost {
  getOrCreate(key: string): Pick<AgentSession, 'handleRuntimeObservation'>;
  destroy?(): Promise<void>;
}

export interface InspectionRunControllerOptions {
  storePath: string;
  outputRoot: string;
  workingDirectory: string;
  sessionHost: InspectionSessionHost;
  services?: AgentServices;
  goalResolver?: AgentRunGoalResolver;
  validationScriptPath?: string | null;
  now?: () => Date;
  idFactory?: () => string;
}

export interface CreateInspectionRunControllerOptions {
  workingDirectory?: string;
  storePath?: string;
  outputRoot?: string;
  surface?: RuntimeSurface;
  sessionTTL?: number;
}

export interface TriggerInspectionInput {
  repo: string;
  snapshot: string;
  mode: InspectionMode;
  goal?: string;
  scope?: string[];
  evidencePermissions?: string[];
  baseSnapshot?: string;
  topic?: string;
  actor: string;
  wake?: boolean;
}

type InspectionTriggerArtifact = TriggerInspectionInput & {
  runId?: string;
  idempotencyKey?: string;
  triggerIdentityVersion?: number;
};

const TERMINAL = new Set(['completed', 'cancelled']);
const FAILED_WAKE_RETRY_MS = 15 * 60 * 1000;

export class InspectionRunController implements AgentRunRuntimeToolController {
  readonly store: AgentRunStore;
  readonly outputRoot: string;
  private readonly activeWakes = new Map<string, Promise<AgentRunRecord>>();
  private readonly activeTriggerCreates = new Map<string, Promise<AgentRunRecord>>();
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly goalResolver: AgentRunGoalResolver;
  private readonly validationScriptPath?: string;

  constructor(private readonly options: InspectionRunControllerOptions) {
    this.store = new AgentRunStore(options.storePath);
    this.outputRoot = path.resolve(options.outputRoot);
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.goalResolver = options.goalResolver ?? new AgentRunGoalResolver({ now: this.now });
    const defaultValidator = path.join(options.workingDirectory, 'skills', 'code-inspection', 'scripts', 'validate-inspection.mjs');
    this.validationScriptPath = options.validationScriptPath === null
      ? undefined
      : path.resolve(options.validationScriptPath || defaultValidator);
  }

  static async create(options: CreateInspectionRunControllerOptions = {}): Promise<InspectionRunController> {
    const workingDirectory = path.resolve(options.workingDirectory || process.cwd());
    const runtimeRoot = PathResolver.getRuntimeDataRoot(process.env, workingDirectory);
    const runtime = createAdapterRuntime({
      surface: options.surface ?? 'agent',
      sessionTTL: options.sessionTTL ?? 24 * 60 * 60 * 1000,
      workingDirectory,
      promptSnapshotMode: 'mutable-identity',
      skillLoadMode: 'fail-fast',
    });
    const sessionHost = new MessageSessionManager(
      runtime.services,
      'inspection',
      runtime.sessionManagerOptions,
    );
    const controller = new InspectionRunController({
      storePath: path.resolve(options.storePath || path.join(runtimeRoot, 'data', 'agent-runs.json')),
      outputRoot: path.resolve(options.outputRoot || path.join(runtimeRoot, 'data', 'agent-run-artifacts')),
      workingDirectory,
      sessionHost,
      services: runtime.services,
      goalResolver: new AgentRunGoalResolver({
        drafter: createAIServiceGoalDrafter(runtime.services.aiService),
      }),
    });
    runtime.services.toolManager.registerTool(new AgentRunRuntimeTool(controller));
    await runtime.loadSkills();
    return controller;
  }

  async trigger(input: TriggerInspectionInput): Promise<AgentRunRecord> {
    const normalized = normalizeTrigger(input);
    const idempotencyKey = inspectionIdempotencyKey(normalized);
    const run = await this.getOrCreateTriggeredRun(normalized, idempotencyKey);
    this.bindSession(run);
    if (input.wake !== false && !TERMINAL.has(run.status)) {
      return this.wake(run.runId);
    }
    return this.requireRun(run.runId);
  }

  private async getOrCreateTriggeredRun(
    normalized: ReturnType<typeof normalizeTrigger>,
    idempotencyKey: string,
  ): Promise<AgentRunRecord> {
    const inFlight = this.activeTriggerCreates.get(idempotencyKey);
    if (inFlight) return inFlight;
    const lockHash = createHash('sha256').update(`manual_inspection\0${idempotencyKey}`).digest('hex');
    const operation = withExclusiveFileLockAsync(
      `${this.options.storePath}.trigger-${lockHash}.lock`,
      async () => {
        this.store.refresh();
        return this.createTriggeredRun(normalized, idempotencyKey);
      },
    );
    this.activeTriggerCreates.set(idempotencyKey, operation);
    try {
      return await operation;
    } finally {
      if (this.activeTriggerCreates.get(idempotencyKey) === operation) {
        this.activeTriggerCreates.delete(idempotencyKey);
      }
    }
  }

  private async createTriggeredRun(
    normalized: ReturnType<typeof normalizeTrigger>,
    idempotencyKey: string,
  ): Promise<AgentRunRecord> {
    let run = this.store.findByIdempotencyKey('manual_inspection', idempotencyKey)
      ?? this.adoptLegacyTriggeredRun(normalized, idempotencyKey);
    if (!run) {
      const now = this.timestamp();
      const shortId = idempotencyKey.slice(0, 12);
      const runId = `inspection-${shortId}-${this.idFactory()}`;
      const goalResolution = await this.goalResolver.resolve({
        triggerSource: 'manual_inspection',
        triggerId: `${normalized.repo}@${normalized.snapshot}`,
        triggerSummary: `${normalized.mode} inspection for ${normalized.repo}`,
        triggerFacts: inspectionGoalFacts(normalized),
        profile: CODE_INSPECTION_GOAL_PROFILE,
        explicitGoal: normalized.goal,
      });
      // No await follows this check. The per-key flight prevents duplicate model work
      // in this controller; this second lookup also safely adopts a persisted Run.
      run = this.store.findByIdempotencyKey('manual_inspection', idempotencyKey);
      if (!run) {
        run = this.store.create({
          runId,
          runType: 'code_inspection',
          triggerRef: {
            source: 'manual_inspection',
            id: `${normalized.repo}@${normalized.snapshot}`,
            idempotencyKey,
            actor: normalized.actor,
            summary: `${normalized.mode} inspection for ${normalized.repo}`,
          },
          sessionKey: `inspection:${runId}`,
          initialGoal: goalResolution.goal,
          goalResolution: {
            source: goalResolution.source,
            profileId: goalResolution.profileId,
            runType: goalResolution.runType,
            completionCriteria: goalResolution.completionCriteria,
            generatedAt: goalResolution.generatedAt,
            ...(goalResolution.generator ? { generator: goalResolution.generator } : {}),
            ...(goalResolution.fallbackReason ? { fallbackReason: goalResolution.fallbackReason } : {}),
          },
          status: 'queued',
          createdAt: now,
          updatedAt: now,
          events: [
            this.event('run_created', `Inspection Run created for ${normalized.repo}@${normalized.snapshot}`),
            this.event('goal_resolved', `Initial Goal resolved by ${goalResolution.source} using ${goalResolution.profileId}`),
          ],
          artifacts: [],
          subjects: [{ kind: 'repository', id: normalized.repo, label: normalized.snapshot }],
        });
      }
    }
    // The Run is durable before its external trigger artifact. Every idempotent
    // Trigger therefore repairs a missing artifact while still inside this key's
    // lock, so a prior filesystem failure cannot strand a recoverable Run.
    this.ensureTriggerArtifact(run, normalized, idempotencyKey);
    return this.requireRun(run.runId);
  }

  async wake(runId: string): Promise<AgentRunRecord> {
    const existing = this.activeWakes.get(runId);
    if (existing) return existing;
    const operation = this.wakeSingleFlight(runId);
    this.activeWakes.set(runId, operation);
    try {
      return await operation;
    } finally {
      if (this.activeWakes.get(runId) === operation) this.activeWakes.delete(runId);
    }
  }

  private async wakeSingleFlight(runId: string): Promise<AgentRunRecord> {
    const lockHash = createHash('sha256').update(`inspection_wake\0${runId}`).digest('hex');
    return withExclusiveFileLockAsync(
      `${this.options.storePath}.wake-${lockHash}.lock`,
      async ({ contended }) => {
        this.store.refresh();
        const current = this.requireRun(runId);
        // A caller that waited behind another wake is the duplicate loser. Do
        // not infer this from mutable Run fields: the winning wake records its
        // event before its Session turn finishes, and unrelated updates may
        // occur while a caller is queued.
        if (contended) return current;
        return this.performWake(runId);
      },
    );
  }

  private async performWake(runId: string): Promise<AgentRunRecord> {
    try {
      let run = this.requireRun(runId);
      if (TERMINAL.has(run.status)) return run;
      const priorGoalCheck = run.lastGoalCheck?.checkedAt;
      run = this.store.update(runId, mutable => {
        mutable.status = 'active';
        mutable.blocker = undefined;
        mutable.lastWakeAt = this.timestamp();
        mutable.events.push(this.event('run_woken', 'Inspection Run activated by manual trigger'));
      });
      const input = this.readTrigger(runId);
      const session = this.bindSession(run);
      await session.handleRuntimeObservation(this.buildWakeMessage(run, input), {
        source: 'inspection_trigger',
        suppressFinalResponse: true,
      });
      const after = this.requireRun(runId);
      if (after.lastGoalCheck?.checkedAt === priorGoalCheck && !TERMINAL.has(after.status)) {
        return this.store.update(runId, mutable => {
          mutable.status = 'blocked';
          mutable.blocker = 'goal_check_missing';
          mutable.nextWakeAt = new Date(this.now().getTime() + FAILED_WAKE_RETRY_MS).toISOString();
          mutable.events.push(this.event('run_blocked', 'Inspection turn ended without a persisted Goal Check'));
        });
      }
      return after;
    } catch (error: any) {
      return this.store.update(runId, mutable => {
        mutable.status = 'blocked';
        mutable.blocker = `wake_failed: ${String(error?.message || error).slice(0, 400)}`;
        mutable.nextWakeAt = new Date(this.now().getTime() + FAILED_WAKE_RETRY_MS).toISOString();
        mutable.events.push(this.event('run_blocked', 'Inspection wake failed'));
      });
    }
  }

  async recordGoalCheck(
    runId: string,
    sessionKey: string | undefined,
    value: AgentRunGoalCheck,
  ): Promise<AgentRunRecord> {
    this.assertSession(runId, sessionKey);
    const check = validateAgentRunGoalCheck(value);
    const current = this.requireRun(runId);
    if (TERMINAL.has(current.status)) throw new Error('Cannot update a terminal Agent Run');
    if (check.complete && !current.artifacts.some(item => item.kind === 'inspection_report')) {
      throw new Error('A completed inspection Run requires an inspection_report artifact');
    }
    return this.store.update(runId, mutable => {
      mutable.lastGoalCheck = check;
      mutable.nextWakeAt = check.nextWakeAt;
      mutable.blocker = check.blocker;
      mutable.status = check.complete ? 'completed' : check.blocker ? 'blocked' : 'waiting_for_input';
      mutable.events.push(this.event('goal_checked', check.summary));
    });
  }

  async recordEvent(runId: string, sessionKey: string | undefined, event: AgentRunEvent): Promise<AgentRunRecord> {
    this.assertSession(runId, sessionKey);
    if (/chain[- ]?of[- ]?thought|思维链/i.test(event.summary)) {
      throw new Error('Agent Run events must not contain chain-of-thought');
    }
    return this.store.update(runId, mutable => {
      mutable.events.push({ ...event, eventId: event.eventId || this.idFactory() });
    });
  }

  async attachArtifact(
    runId: string,
    sessionKey: string | undefined,
    artifact: AgentRunArtifactRef,
  ): Promise<AgentRunRecord> {
    this.assertSession(runId, sessionKey);
    const normalized = { ...artifact, ref: normalizeArtifactRef(artifact.ref) };
    const report = normalized.kind === 'inspection_report'
      ? readInspectionReport(normalized.ref, this.runOutputDirectory(runId), this.validationScriptPath)
      : undefined;
    return this.store.update(runId, mutable => {
      const index = mutable.artifacts.findIndex(item => item.artifactId === normalized.artifactId);
      if (index >= 0) mutable.artifacts[index] = normalized;
      else mutable.artifacts.push(normalized);
      if (report) {
        for (const finding of report.findings) {
          if (!mutable.subjects.some(item => item.kind === 'finding' && item.id === finding.findingId)) {
            mutable.subjects.push({
              kind: 'finding',
              id: finding.findingId,
              label: finding.title,
              ref: finding.envelopePath,
            });
          }
        }
        mutable.events.push(this.event('inspection_report_attached', `Inspection report attached with ${report.findings.length} Finding(s)`));
      }
    });
  }

  async linkSubject(
    runId: string,
    sessionKey: string | undefined,
    subject: AgentRunSubjectRef,
  ): Promise<AgentRunRecord> {
    this.assertSession(runId, sessionKey);
    return this.store.update(runId, mutable => {
      const index = mutable.subjects.findIndex(item => item.kind === subject.kind && item.id === subject.id);
      if (index >= 0) mutable.subjects[index] = subject;
      else mutable.subjects.push(subject);
    });
  }

  get(runId: string): AgentRunRecord {
    return this.requireRun(runId);
  }

  listProjections(): AgentRunPublicProjection[] {
    return this.store.list().map(projectAgentRun);
  }

  getProjection(runId: string): AgentRunPublicProjection {
    return projectAgentRun(this.requireRun(runId));
  }

  async destroy(): Promise<void> {
    await this.options.sessionHost.destroy?.();
  }

  private bindSession(run: AgentRunRecord): Pick<AgentSession, 'handleRuntimeObservation'> {
    return this.options.sessionHost.getOrCreate(run.sessionKey);
  }

  private assertSession(runId: string, sessionKey: string | undefined): void {
    const run = this.requireRun(runId);
    if (!sessionKey || run.sessionKey !== sessionKey) {
      throw new Error(`Agent Run ${runId} is not bound to Session ${sessionKey || '<missing>'}`);
    }
  }

  private requireRun(runId: string): AgentRunRecord {
    const run = this.store.get(runId);
    if (!run) throw new Error(`Unknown Agent Run: ${runId}`);
    return run;
  }

  private event(type: string, summary: string): AgentRunEvent {
    return { eventId: this.idFactory(), type, summary, createdAt: this.timestamp() };
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private runOutputDirectory(runId: string): string {
    return path.join(this.outputRoot, safeSegment(runId));
  }

  private adoptLegacyTriggeredRun(
    canonicalTrigger: ReturnType<typeof normalizeTrigger>,
    canonicalKey: string,
  ): AgentRunRecord | undefined {
    const matches: Array<{ run: AgentRunRecord; artifact: InspectionTriggerArtifact }> = [];
    for (const candidate of this.store.list()) {
      if (candidate.runType !== 'code_inspection' || candidate.triggerRef.source !== 'manual_inspection') continue;
      const filePath = path.join(this.runOutputDirectory(candidate.runId), 'trigger.json');
      if (!fs.existsSync(filePath)) continue;
      try {
        const artifact = this.readTriggerArtifact(filePath);
        if (artifact.triggerIdentityVersion !== undefined) continue;
        const legacy = normalizeLegacyTrigger(artifact);
        const legacyKey = inspectionIdempotencyKey(legacy);
        if (artifact.runId !== candidate.runId || artifact.idempotencyKey !== legacyKey
            || candidate.triggerRef.idempotencyKey !== legacyKey
            || legacy.actor !== candidate.triggerRef.actor) continue;
        const canonicalLegacy = normalizeTrigger(artifact);
        if (inspectionIdempotencyKey(canonicalLegacy) === canonicalKey) matches.push({ run: candidate, artifact });
      } catch {
        // An unrelated invalid legacy artifact is not eligible for adoption.
      }
    }
    if (matches.length > 1) throw new Error('Multiple legacy Inspection Runs match the canonical Trigger');
    const match = matches[0];
    if (!match) return undefined;
    return this.store.migrateTriggerIdempotencyKey(
      match.run.runId,
      'manual_inspection',
      match.run.triggerRef.idempotencyKey!,
      canonicalKey,
    );
  }

  private ensureTriggerArtifact(
    run: AgentRunRecord,
    trigger: ReturnType<typeof normalizeTrigger>,
    idempotencyKey: string,
  ): void {
    const directory = this.runOutputDirectory(run.runId);
    const filePath = path.join(directory, 'trigger.json');
    const expected = {
      ...trigger,
      actor: run.triggerRef.actor || trigger.actor,
      runId: run.runId,
      idempotencyKey,
      triggerIdentityVersion: 2,
    };
    if (fs.existsSync(filePath)) {
      const existing = this.readTriggerArtifact(filePath);
      const normalized = normalizeTrigger(existing);
      this.assertTriggerArtifactIdentity(run, existing, normalized);
      if (existing.triggerIdentityVersion === 2) return;
      this.publishTriggerArtifact(filePath, expected);
      return;
    }
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.publishTriggerArtifact(filePath, expected);
  }

  private readTrigger(runId: string): ReturnType<typeof normalizeTrigger> {
    let run = this.requireRun(runId);
    const filePath = path.join(this.runOutputDirectory(runId), 'trigger.json');
    const parsed = this.readTriggerArtifact(filePath);
    const normalized = normalizeTrigger(parsed);
    if (parsed.triggerIdentityVersion === undefined) {
      const legacyKey = inspectionIdempotencyKey(normalizeLegacyTrigger(parsed));
      const canonicalKey = inspectionIdempotencyKey(normalized);
      if (parsed.runId !== run.runId || parsed.idempotencyKey !== legacyKey
          || ![legacyKey, canonicalKey].includes(run.triggerRef.idempotencyKey || '')
          || parsed.actor !== run.triggerRef.actor) {
        throw new Error(`Inspection trigger artifact conflicts with persisted Run ${run.runId}`);
      }
      run = this.store.migrateTriggerIdempotencyKey(
        run.runId,
        'manual_inspection',
        legacyKey,
        canonicalKey,
      );
      this.publishTriggerArtifact(filePath, {
        ...normalized,
        actor: run.triggerRef.actor || normalized.actor,
        runId: run.runId,
        idempotencyKey: canonicalKey,
        triggerIdentityVersion: 2,
      });
    }
    this.assertTriggerArtifactIdentity(run, this.readTriggerArtifact(filePath), normalized);
    return normalized;
  }

  private assertTriggerArtifactIdentity(
    run: AgentRunRecord,
    artifact: InspectionTriggerArtifact,
    normalized: ReturnType<typeof normalizeTrigger>,
  ): void {
    const expectedKey = run.triggerRef.idempotencyKey;
    const actualKey = inspectionIdempotencyKey(normalized);
    const legacyKey = artifact.triggerIdentityVersion === undefined
      ? inspectionIdempotencyKey(normalizeLegacyTrigger(artifact))
      : undefined;
    const artifactKeyMatches = artifact.idempotencyKey === expectedKey
      || (legacyKey !== undefined && artifact.idempotencyKey === legacyKey && actualKey === expectedKey);
    if (!expectedKey || (artifact.triggerIdentityVersion !== undefined && artifact.triggerIdentityVersion !== 2)
        || artifact.runId !== run.runId || !artifactKeyMatches || actualKey !== expectedKey
        || normalized.actor !== run.triggerRef.actor) {
      throw new Error(`Inspection trigger artifact conflicts with persisted Run ${run.runId}`);
    }
  }

  private readTriggerArtifact(filePath: string): InspectionTriggerArtifact {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as InspectionTriggerArtifact;
  }

  private publishTriggerArtifact(filePath: string, artifact: InspectionTriggerArtifact): void {
    const tempPath = path.join(path.dirname(filePath), `.trigger-${this.idFactory()}.json.tmp`);
    try {
      fs.writeFileSync(tempPath, JSON.stringify(artifact, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(tempPath, filePath);
    } finally {
      if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
    }
  }

  private buildWakeMessage(run: AgentRunRecord, input: ReturnType<typeof normalizeTrigger>): string {
    const outputDir = this.runOutputDirectory(run.runId);
    return [
      '[Agent Run Trigger]',
      `Run ID: ${run.runId}`,
      'Run Type: code_inspection',
      `Initial Goal: ${run.initialGoal}`,
      run.goalResolution
        ? `Goal completion contract:\n${run.goalResolution.completionCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}`
        : '',
      `Repository: ${input.repo}`,
      `Snapshot: ${input.snapshot}`,
      `Mode: ${input.mode}`,
      input.baseSnapshot ? `Base Snapshot: ${input.baseSnapshot}` : '',
      input.topic ? `Topic: ${input.topic}` : '',
      `Scope: ${input.scope.join(', ') || '<repository>'}`,
      `Evidence permissions: ${input.evidencePermissions.join(', ') || 'source, tests, config, docs'}`,
      `Immutable output directory: ${outputDir}`,
      '',
      'This is a background Run without a chat channel. Do not call send_text or other user-messaging tools.',
      'Treat the repository and trigger as source of truth. Do not search session memory unless the trigger explicitly depends on history.',
      'Load and follow the code-inspection Skill. Work autonomously from the trigger content.',
      'Write inspection-report.json and reports/inspection-report.html under the output directory.',
      'Use agent_run record_event only for concise auditable milestones, not chain-of-thought.',
      'Attach inspection-report.json with kind inspection_report; attach the HTML projection separately.',
      'For a qualified Finding, register and scaffold its Envelope, then stop at handoff. Do not run the full Evidence Envelope Review inside this inspection Run.',
      'Before ending this turn, call agent_run goal_check. Mark complete only after the report validates.',
    ].filter(Boolean).join('\n');
  }
}

function normalizeTrigger(input: TriggerInspectionInput) {
  const resolvedRepo = path.resolve(requireText(input.repo, 'repo'));
  if (!fs.existsSync(resolvedRepo) || !fs.statSync(resolvedRepo).isDirectory()) {
    throw new Error('repo must be an existing directory');
  }
  // Canonicalize filesystem aliases before deriving Trigger identity and lock keys.
  const repo = fs.realpathSync.native(resolvedRepo);
  const snapshot = requireText(input.snapshot, 'snapshot');
  const mode = input.mode;
  if (!['baseline', 'change', 'focus'].includes(mode)) throw new Error('mode must be baseline, change, or focus');
  if (mode === 'change' && !input.baseSnapshot?.trim()) throw new Error('change mode requires baseSnapshot');
  if (mode === 'focus' && !input.topic?.trim()) throw new Error('focus mode requires topic');
  return {
    repo,
    snapshot,
    mode,
    goal: input.goal?.trim(),
    scope: normalizeList(input.scope),
    evidencePermissions: normalizeList(input.evidencePermissions),
    baseSnapshot: input.baseSnapshot?.trim(),
    topic: input.topic?.trim(),
    actor: requireText(input.actor, 'actor'),
  };
}

function normalizeLegacyTrigger(input: TriggerInspectionInput) {
  const repo = path.resolve(requireText(input.repo, 'repo'));
  if (!fs.existsSync(repo) || !fs.statSync(repo).isDirectory()) throw new Error('repo must be an existing directory');
  const snapshot = requireText(input.snapshot, 'snapshot');
  const mode = input.mode;
  if (!['baseline', 'change', 'focus'].includes(mode)) throw new Error('mode must be baseline, change, or focus');
  if (mode === 'change' && !input.baseSnapshot?.trim()) throw new Error('change mode requires baseSnapshot');
  if (mode === 'focus' && !input.topic?.trim()) throw new Error('focus mode requires topic');
  return {
    repo,
    snapshot,
    mode,
    goal: input.goal?.trim(),
    scope: normalizeList(input.scope),
    evidencePermissions: normalizeList(input.evidencePermissions),
    baseSnapshot: input.baseSnapshot?.trim(),
    topic: input.topic?.trim(),
    actor: requireText(input.actor, 'actor'),
  };
}

function inspectionIdempotencyKey(input: ReturnType<typeof normalizeTrigger>): string {
  return createHash('sha256').update(JSON.stringify({
    repo: input.repo,
    snapshot: input.snapshot,
    mode: input.mode,
    goal: input.goal || '',
    scope: input.scope,
    evidencePermissions: input.evidencePermissions,
    baseSnapshot: input.baseSnapshot || '',
    topic: input.topic || '',
  })).digest('hex');
}

function inspectionGoalFacts(input: ReturnType<typeof normalizeTrigger>): Record<string, unknown> {
  return {
    repo: input.repo,
    snapshot: input.snapshot,
    mode: input.mode,
    scope: input.scope,
    evidencePermissions: input.evidencePermissions,
    ...(input.baseSnapshot ? { baseSnapshot: input.baseSnapshot } : {}),
    ...(input.topic ? { topic: input.topic } : {}),
  };
}

function readInspectionReport(
  ref: string,
  expectedRoot: string,
  validationScriptPath?: string,
): { findings: Array<{ findingId: string; title: string; envelopePath: string }> } {
  const filePath = ref.startsWith('file://') ? decodeURIComponent(new URL(ref).pathname) : path.resolve(ref);
  const root = path.resolve(expectedRoot);
  const relative = path.relative(root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('inspection_report artifact must stay inside the Run output directory');
  }
  if (validationScriptPath) {
    if (!fs.existsSync(validationScriptPath)) throw new Error('code-inspection validator is unavailable');
    const result = spawnSync(process.execPath, [validationScriptPath, filePath], {
      cwd: path.dirname(validationScriptPath),
      encoding: 'utf8',
      timeout: 30_000,
    });
    if (result.status !== 0) {
      const detail = `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(0, 1_200);
      throw new Error(`inspection_report contract validation failed${detail ? `: ${detail}` : ''}`);
    }
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as any;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.findings)) {
    throw new Error('inspection_report artifact must point to a valid inspection-report.json');
  }
  const conclusion = String(parsed?.summary?.conclusion || '').trim();
  const stopReason = String(parsed?.stop?.reason || '').trim();
  const reviewed = Array.isArray(parsed?.coverage?.reviewed) ? parsed.coverage.reviewed : [];
  if (!conclusion || /not started|尚未开始/i.test(conclusion)
      || !stopReason || /not started|尚未开始/i.test(stopReason)
      || reviewed.length === 0) {
    throw new Error('inspection_report is structurally valid but not semantically complete');
  }
  for (const finding of parsed.findings) {
    if (!finding || typeof finding.findingId !== 'string' || typeof finding.title !== 'string'
        || typeof finding.envelopePath !== 'string') {
      throw new Error('inspection_report contains an invalid Finding reference');
    }
  }
  return parsed;
}

function normalizeArtifactRef(value: string): string {
  const text = requireText(value, 'artifact.ref');
  if (text.startsWith('file://')) return text;
  return path.resolve(text);
}

function normalizeList(value: string[] | undefined): string[] {
  return [...new Set((value || []).map(item => String(item).trim()).filter(Boolean))].sort();
}

function requireText(value: string | undefined, field: string): string {
  const text = value?.trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '_');
}

