import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

import { AgentRunStore } from '../core/agent-run-store';
import type { AgentRunEvent, AgentRunRecord } from '../core/agent-run-types';
import type { AgentSession, HandleMessageResult } from '../core/agent-session';
import { withExclusiveFileLockAsync } from '../core/file-lock';
import { RuntimeFactory } from '../runtime/runtime-factory';
import { resolveDefaultRuntimeProfile } from '../runtime/runtime-profile';
import type { AIService } from '../utils/ai-service';
import {
  AIServiceGoalChecker,
  type AgentRunGoalChecker,
  toPersistedGoalCheck,
} from './goal-check';

const EVENT_CONFIG = 'supervisor_config';
const EVENT_INPUT = 'supervisor_input';
const EVENT_CONTEXT = 'supervisor_context';
const EVENT_FINAL = 'supervisor_final';
const TERMINAL = new Set(['completed', 'cancelled']);
const DEFAULT_MAX_ITERATIONS = 8;
const DEFAULT_BUDGET = 8;

export interface AgentRunSupervisorConfig {
  maxIterations: number;
  budget: number;
  workingDirectory: string;
}

export interface StartAgentRunInput {
  goal: string;
  runType?: string;
  triggerSource?: string;
  triggerId?: string;
  idempotencyKey?: string;
  maxIterations?: number;
  budget?: number;
  workingDirectory?: string;
  runId?: string;
  autoRun?: boolean;
}

export interface SupervisorRuntime {
  session: Pick<AgentSession, 'handleMessage' | 'restoreFromStore'>;
  aiService: Pick<AIService, 'chat'>;
}

export interface RestoreRuntime {
  session: Pick<AgentSession, 'restoreFromStore'>;
}

export interface AgentRunSupervisorOptions {
  storePath: string;
  workingDirectory?: string;
  ownerLockRoot?: string;
  now?: () => Date;
  idFactory?: () => string;
  createRuntime?: (workingDirectory: string, sessionKey: string) => Promise<SupervisorRuntime>;
  createRestoreRuntime?: (workingDirectory: string, sessionKey: string) => Promise<RestoreRuntime>;
  createGoalChecker?: (runtime: SupervisorRuntime) => AgentRunGoalChecker;
}

export class AgentRunSupervisor {
  readonly store: AgentRunStore;
  private readonly workingDirectory: string;
  private readonly ownerLockRoot: string;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly activeLoops = new Map<string, Promise<AgentRunRecord>>();
  private readonly createRuntime: NonNullable<AgentRunSupervisorOptions['createRuntime']>;
  private readonly createRestoreRuntime: NonNullable<AgentRunSupervisorOptions['createRestoreRuntime']>;
  private readonly createGoalChecker: NonNullable<AgentRunSupervisorOptions['createGoalChecker']>;

  constructor(options: AgentRunSupervisorOptions) {
    this.store = new AgentRunStore(options.storePath);
    this.workingDirectory = path.resolve(options.workingDirectory || process.cwd());
    this.ownerLockRoot = path.resolve(options.ownerLockRoot || `${options.storePath}.owners`);
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.createRuntime = options.createRuntime ?? createDefaultRuntime;
    this.createRestoreRuntime = options.createRestoreRuntime ?? createDefaultRestoreRuntime;
    this.createGoalChecker = options.createGoalChecker ?? (runtime => new AIServiceGoalChecker(runtime.aiService));
  }

  async start(input: StartAgentRunInput): Promise<AgentRunRecord> {
    const goal = requireText(input.goal, 'goal');
    const runId = input.runId?.trim() || this.idFactory();
    const sessionKey = stableAgentRunSessionKey(runId);
    const config = validateConfig({
      maxIterations: input.maxIterations ?? DEFAULT_MAX_ITERATIONS,
      budget: input.budget ?? DEFAULT_BUDGET,
      workingDirectory: path.resolve(input.workingDirectory || this.workingDirectory),
    });
    const now = this.timestamp();
    const run = this.store.create({
      runId,
      runType: input.runType?.trim() || 'general',
      triggerRef: {
        source: input.triggerSource?.trim() || 'cli',
        id: input.triggerId?.trim() || runId,
        ...(input.idempotencyKey?.trim() ? { idempotencyKey: input.idempotencyKey.trim() } : {}),
        summary: goal,
      },
      sessionKey,
      initialGoal: goal,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
      events: [
        this.event('run_created', 'Agent Run created'),
        this.dataEvent(EVENT_CONFIG, config),
      ],
      artifacts: [],
      subjects: [],
    });
    return input.autoRun === false ? run : this.wake(run.runId);
  }

  async resume(runId: string): Promise<AgentRunRecord> {
    const run = this.requireRun(runId);
    const config = readConfig(run);
    const runtime = await this.createRestoreRuntime(config.workingDirectory, run.sessionKey);
    runtime.session.restoreFromStore();
    this.store.refresh();
    return this.requireRun(runId);
  }

  wake(runId: string): Promise<AgentRunRecord> {
    return this.runOwnedLoop(runId, 'manual wake');
  }

  async send(runId: string, message: string): Promise<AgentRunRecord> {
    const text = requireText(message, 'message');
    this.assertRunnable(this.requireRun(runId));
    this.store.update(runId, mutable => {
      mutable.status = 'queued';
      mutable.blocker = undefined;
      mutable.nextWakeAt = undefined;
      mutable.events.push(this.dataEvent(EVENT_INPUT, { text }));
    });
    return this.runOwnedLoop(runId);
  }

  addContext(runId: string, context: string): AgentRunRecord {
    const text = requireText(context, 'context');
    this.assertNotCancelled(this.requireRun(runId));
    return this.store.update(runId, mutable => {
      mutable.events.push(this.dataEvent(EVENT_CONTEXT, { text }));
    });
  }

  show(runId: string): AgentRunRecord {
    return this.requireRun(runId);
  }

  list(): AgentRunRecord[] {
    this.store.refresh();
    return this.store.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  cancel(runId: string): AgentRunRecord {
    const run = this.requireRun(runId);
    if (run.status === 'completed') throw new Error('Cannot cancel a completed Agent Run');
    if (run.status === 'cancelled') return run;
    return this.store.update(runId, mutable => {
      mutable.status = 'cancelled';
      mutable.blocker = undefined;
      mutable.nextWakeAt = undefined;
      mutable.events.push(this.event('run_cancelled', 'Agent Run cancelled'));
    });
  }

  private runOwnedLoop(runId: string, wakeReason?: string): Promise<AgentRunRecord> {
    const existing = this.activeLoops.get(runId);
    if (existing) return existing;
    const operation = withExclusiveFileLockAsync(path.join(this.ownerLockRoot, `${safeFileName(runId)}.lock`), async ({ contended }) => {
      this.store.refresh();
      if (contended) return this.requireRun(runId);
      if (wakeReason) {
        this.store.update(runId, mutable => {
          mutable.events.push(this.event('run_woken', wakeReason));
        });
      }
      return this.performLoop(runId);
    });
    this.activeLoops.set(runId, operation);
    return operation.finally(() => this.activeLoops.delete(runId));
  }

  private async performLoop(runId: string): Promise<AgentRunRecord> {
    let run = this.requireRun(runId);
    if (TERMINAL.has(run.status)) return run;
    const config = readConfig(run);
    const used = countEvents(run, EVENT_FINAL);
    if (used >= config.maxIterations || used >= config.budget) {
      return this.blockForLimit(runId, used >= config.maxIterations ? 'maximum_iterations_reached' : 'budget_exhausted');
    }

    const runtime = await this.createRuntime(config.workingDirectory, run.sessionKey);
    const checker = this.createGoalChecker(runtime);
    let nextPrompt = nextInput(run)
      || pendingContinuationPrompt(run)
      || initialPrompt(run);

    while (true) {
      this.store.refresh();
      run = this.requireRun(runId);
      if (TERMINAL.has(run.status)) return run;
      const iteration = countEvents(run, EVENT_FINAL) + 1;
      if (iteration > config.maxIterations) return this.blockForLimit(runId, 'maximum_iterations_reached');
      if (iteration > config.budget) return this.blockForLimit(runId, 'budget_exhausted');

      this.store.update(runId, mutable => {
        mutable.status = 'active';
        mutable.blocker = undefined;
        mutable.lastWakeAt = this.timestamp();
        mutable.events.push(this.event('iteration_started', `Iteration ${iteration} started`));
      });

      let result: HandleMessageResult;
      try {
        result = await runtime.session.handleMessage(nextPrompt);
      } catch (error) {
        this.store.refresh();
        if (this.requireRun(runId).status === 'cancelled') return this.requireRun(runId);
        return this.blockForFailure(runId, 'agent_turn_failed', error);
      }
      const finalText = result.text?.trim() || '(empty final response)';
      this.store.refresh();
      if (this.requireRun(runId).status === 'cancelled') return this.requireRun(runId);
      run = this.store.update(runId, mutable => {
        mutable.events.push(this.dataEvent(EVENT_FINAL, {
          iteration,
          text: finalText,
          taskOutcome: result.taskOutcome || 'completed',
        }));
      });

      const remainingBudget = Math.max(0, config.budget - iteration);
      let checked;
      try {
        checked = await checker.check({
          run,
          finalText,
          iteration,
          maxIterations: config.maxIterations,
          remainingBudget,
          context: readContext(run),
        });
      } catch (error) {
        this.store.refresh();
        if (this.requireRun(runId).status === 'cancelled') return this.requireRun(runId);
        return this.blockForFailure(runId, 'goal_check_failed', error);
      }
      const persisted = toPersistedGoalCheck(checked, this.timestamp());
      this.store.refresh();
      const current = this.requireRun(runId);
      if (current.status === 'cancelled') return current;
      const queuedInput = nextInput(current);
      run = this.store.update(runId, mutable => {
        mutable.lastGoalCheck = persisted;
        mutable.nextWakeAt = persisted.nextWakeAt;
        mutable.blocker = persisted.blocker;
        mutable.events.push(this.event('goal_checked', `${checked.decision}: ${checked.summary}`));
        mutable.status = queuedInput
          ? 'queued'
          : checked.decision === 'complete'
            ? 'completed'
            : checked.decision === 'blocked'
              ? 'blocked'
              : 'queued';
      });
      if (queuedInput) {
        if (iteration >= config.maxIterations) return this.blockForLimit(runId, 'maximum_iterations_reached');
        if (remainingBudget <= 0) return this.blockForLimit(runId, 'budget_exhausted');
        nextPrompt = queuedInput;
        continue;
      }
      if (checked.decision !== 'continue') return run;
      if (iteration >= config.maxIterations) return this.blockForLimit(runId, 'maximum_iterations_reached');
      if (remainingBudget <= 0) return this.blockForLimit(runId, 'budget_exhausted');
      nextPrompt = buildContinuationPrompt(run, checked.nextAction!);
    }
  }

  private blockForLimit(runId: string, blocker: string): AgentRunRecord {
    return this.store.update(runId, mutable => {
      mutable.status = 'blocked';
      mutable.blocker = blocker;
      mutable.nextWakeAt = undefined;
      mutable.events.push(this.event('run_blocked', blocker));
    });
  }

  private blockForFailure(runId: string, code: string, error: unknown): AgentRunRecord {
    const detail = error instanceof Error ? error.message : String(error);
    return this.store.update(runId, mutable => {
      mutable.status = 'blocked';
      mutable.blocker = `${code}: ${detail}`.slice(0, 500);
      mutable.events.push(this.event('run_blocked', code));
    });
  }

  private requireRun(runId: string): AgentRunRecord {
    const run = this.store.get(requireText(runId, 'runId'));
    if (!run) throw new Error(`Agent Run not found: ${runId}`);
    return run;
  }

  private assertRunnable(run: AgentRunRecord): void {
    if (TERMINAL.has(run.status)) throw new Error(`Agent Run is terminal: ${run.status}`);
  }

  private assertNotCancelled(run: AgentRunRecord): void {
    if (run.status === 'cancelled') throw new Error('Agent Run is cancelled');
  }

  private event(type: string, summary: string): AgentRunEvent {
    return { eventId: this.idFactory(), type, summary, createdAt: this.timestamp() };
  }

  private dataEvent(type: string, value: unknown): AgentRunEvent {
    return this.event(type, JSON.stringify(value));
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

export function stableAgentRunSessionKey(runId: string): string {
  return `agent-run:${requireText(runId, 'runId')}`;
}

async function createDefaultRestoreRuntime(workingDirectory: string, sessionKey: string): Promise<RestoreRuntime> {
  const profile = resolveDefaultRuntimeProfile({
    id: 'xiaoba-agent-run-restore',
    surface: 'agent',
    workingDirectory,
  });
  const runtime = await RuntimeFactory.createSession({
    profile,
    sessionKey,
    sessionType: 'agent-run',
    loadSkills: false,
  });
  return { session: runtime.session };
}

async function createDefaultRuntime(workingDirectory: string, sessionKey: string): Promise<SupervisorRuntime> {
  const profile = resolveDefaultRuntimeProfile({
    id: 'xiaoba-agent-run',
    surface: 'agent',
    workingDirectory,
  });
  const runtime = await RuntimeFactory.createSession({ profile, sessionKey, sessionType: 'agent-run' });
  return { session: runtime.session, aiService: runtime.services.aiService };
}

function readConfig(run: AgentRunRecord): AgentRunSupervisorConfig {
  const event = run.events.find(item => item.type === EVENT_CONFIG);
  if (!event) throw new Error('Agent Run supervisor config is missing');
  try {
    return validateConfig(JSON.parse(event.summary));
  } catch (error) {
    throw new Error(`Agent Run supervisor config is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateConfig(value: AgentRunSupervisorConfig): AgentRunSupervisorConfig {
  const maxIterations = positiveInteger(value.maxIterations, 'maxIterations');
  const budget = positiveInteger(value.budget, 'budget');
  return {
    maxIterations,
    budget,
    workingDirectory: path.resolve(requireText(value.workingDirectory, 'workingDirectory')),
  };
}

function readContext(run: AgentRunRecord): string[] {
  return run.events
    .filter(event => event.type === EVENT_CONTEXT)
    .map(event => parseTextEvent(event.summary))
    .filter((item): item is string => Boolean(item));
}

function nextInput(run: AgentRunRecord): string | undefined {
  const lastIterationIndex = findLastEventIndex(run, 'iteration_started');
  for (let index = run.events.length - 1; index > lastIterationIndex; index -= 1) {
    const event = run.events[index];
    if (event.type === EVENT_INPUT) return parseTextEvent(event.summary);
  }
  return undefined;
}

function findLastEventIndex(run: AgentRunRecord, type: string): number {
  for (let index = run.events.length - 1; index >= 0; index -= 1) {
    if (run.events[index].type === type) return index;
  }
  return -1;
}

function parseTextEvent(summary: string): string | undefined {
  try {
    const value = JSON.parse(summary) as { text?: unknown };
    return typeof value.text === 'string' && value.text.trim() ? value.text.trim() : undefined;
  } catch {
    return undefined;
  }
}

function countEvents(run: AgentRunRecord, type: string): number {
  return run.events.reduce((count, event) => count + (event.type === type ? 1 : 0), 0);
}

function pendingContinuationPrompt(run: AgentRunRecord): string | undefined {
  const check = run.lastGoalCheck;
  if (!check || check.complete || !check.nextAction || check.blocker) return undefined;
  return buildContinuationPrompt(run, check.nextAction);
}

function initialPrompt(run: AgentRunRecord): string {
  const context = readContext(run);
  return [
    `Agent Run goal: ${run.initialGoal}`,
    context.length ? `Run context:\n${context.join('\n')}` : '',
    'Work toward the goal. Return a concise final response with concrete evidence and remaining limitations.',
  ].filter(Boolean).join('\n\n');
}

function buildContinuationPrompt(run: AgentRunRecord, nextAction: string): string {
  return [
    `Continue the same Agent Run. Immutable goal: ${run.initialGoal}`,
    `Independent Goal Check next action: ${nextAction}`,
    'Do not repeat completed work. Return a new final response with evidence.',
  ].join('\n\n');
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function safeFileName(value: string): string {
  return Buffer.from(value).toString('base64url');
}
