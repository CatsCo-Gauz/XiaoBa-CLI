import type { Tool, ToolDefinition, ToolExecutionContext, ToolExecutionResult } from '../types/tool';
import type {
  AgentRunArtifactRef,
  AgentRunEvent,
  AgentRunGoalCheck,
  AgentRunSubjectRef,
} from './agent-run-types';

export interface AgentRunRuntimeToolController {
  recordGoalCheck(
    runId: string,
    sessionKey: string | undefined,
    check: AgentRunGoalCheck,
  ): Promise<unknown>;
  recordEvent(
    runId: string,
    sessionKey: string | undefined,
    event: AgentRunEvent,
  ): Promise<unknown>;
  attachArtifact(
    runId: string,
    sessionKey: string | undefined,
    artifact: AgentRunArtifactRef,
  ): Promise<unknown>;
  linkSubject(
    runId: string,
    sessionKey: string | undefined,
    subject: AgentRunSubjectRef,
  ): Promise<unknown>;
}

const ACTIONS = ['goal_check', 'record_event', 'attach_artifact', 'link_subject'] as const;
type AgentRunAction = typeof ACTIONS[number];

const COMMON_FIELDS = ['action', 'run_id'] as const;
const ACTION_FIELDS: Record<AgentRunAction, readonly string[]> = {
  goal_check: [
    ...COMMON_FIELDS,
    'complete',
    'capabilities_exhausted',
    'summary',
    'next_action',
    'blocker',
    'stop_condition',
    'next_wake_at',
  ],
  record_event: [...COMMON_FIELDS, 'event_id', 'event_type', 'summary', 'created_at'],
  attach_artifact: [...COMMON_FIELDS, 'artifact_id', 'kind', 'label', 'ref', 'created_at'],
  link_subject: [...COMMON_FIELDS, 'kind', 'id', 'ref', 'label'],
};

export class AgentRunRuntimeTool implements Tool {
  readonly definition: ToolDefinition = {
    name: 'agent_run',
    description: '记录 Agent Run 的目标检查、必要审计事件、产物引用与关联主体。工具不接受思维链。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: [...ACTIONS], description: '要执行的 Agent Run 动作。' },
        run_id: { type: 'string', description: '当前 Agent Run ID。' },
        complete: { type: 'boolean' },
        capabilities_exhausted: { type: 'boolean' },
        summary: { type: 'string', description: '简洁的审计摘要，不得包含思维链。' },
        next_action: { type: 'string' },
        blocker: { type: 'string' },
        stop_condition: { type: 'string' },
        next_wake_at: { type: 'string', description: 'ISO-8601 时间。' },
        event_id: { type: 'string' },
        event_type: { type: 'string' },
        created_at: { type: 'string', description: '可选 ISO-8601 时间。' },
        artifact_id: { type: 'string' },
        kind: { type: 'string' },
        label: { type: 'string' },
        ref: { type: 'string' },
        id: { type: 'string' },
      },
      required: ['action', 'run_id'],
    },
  };

  constructor(
    private readonly controller: AgentRunRuntimeToolController,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(args: unknown, context: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const object = requireObject(args);
      const action = parseAction(object.action);
      rejectUnknownFields(object, ACTION_FIELDS[action]);
      const runId = requireString(object.run_id, 'run_id');
      let result: unknown;

      if (action === 'goal_check') {
        const complete = requireBoolean(object.complete, 'complete');
        const check: AgentRunGoalCheck = {
          checkedAt: this.clock().toISOString(),
          complete,
          capabilitiesExhausted: requireBoolean(
            object.capabilities_exhausted,
            'capabilities_exhausted',
          ),
          summary: requireString(object.summary, 'summary'),
          ...(optionalString(object.next_action) ? { nextAction: optionalString(object.next_action) } : {}),
          ...(optionalString(object.blocker) ? { blocker: optionalString(object.blocker) } : {}),
          ...(optionalString(object.stop_condition)
            ? { stopCondition: optionalString(object.stop_condition) }
            : {}),
          ...(object.next_wake_at !== undefined
            ? { nextWakeAt: requireTimestamp(object.next_wake_at, 'next_wake_at') }
            : {}),
        };
        if (!complete && !check.nextAction && !check.blocker) {
          throw new Error('incomplete goal_check requires next_action or blocker');
        }
        if (!complete && !check.stopCondition) {
          throw new Error('incomplete goal_check requires stop_condition');
        }
        result = await this.controller.recordGoalCheck(runId, context.sessionId, check);
      } else if (action === 'record_event') {
        const event: AgentRunEvent = {
          ...(optionalString(object.event_id) ? { eventId: optionalString(object.event_id) } : {}),
          type: requireString(object.event_type, 'event_type'),
          summary: requireString(object.summary, 'summary'),
          createdAt: object.created_at === undefined
            ? this.clock().toISOString()
            : requireTimestamp(object.created_at, 'created_at'),
        };
        result = await this.controller.recordEvent(runId, context.sessionId, event);
      } else if (action === 'attach_artifact') {
        const artifact: AgentRunArtifactRef = {
          artifactId: requireString(object.artifact_id, 'artifact_id'),
          kind: requireString(object.kind, 'kind'),
          label: requireString(object.label, 'label'),
          ref: requireString(object.ref, 'ref'),
          createdAt: object.created_at === undefined
            ? this.clock().toISOString()
            : requireTimestamp(object.created_at, 'created_at'),
        };
        result = await this.controller.attachArtifact(runId, context.sessionId, artifact);
      } else {
        const subject: AgentRunSubjectRef = {
          kind: requireString(object.kind, 'kind'),
          id: requireString(object.id, 'id'),
          ...(optionalString(object.ref) ? { ref: optionalString(object.ref) } : {}),
          ...(optionalString(object.label) ? { label: optionalString(object.label) } : {}),
        };
        result = await this.controller.linkSubject(runId, context.sessionId, subject);
      }

      return { ok: true, content: JSON.stringify(result ?? null) };
    } catch (error) {
      return {
        ok: false,
        errorCode: 'AGENT_RUN_ERROR',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const AgentRunTool = AgentRunRuntimeTool;

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('agent_run arguments must be an object');
  }
  return value as Record<string, unknown>;
}

function parseAction(value: unknown): AgentRunAction {
  if (typeof value === 'string' && (ACTIONS as readonly string[]).includes(value)) {
    return value as AgentRunAction;
  }
  throw new Error(`action must be one of: ${ACTIONS.join(', ')}`);
}

function rejectUnknownFields(object: Record<string, unknown>, allowed: readonly string[]): void {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(object).filter(key => !allowedSet.has(key));
  if (unknown.length > 0) throw new Error(`unexpected argument: ${unknown[0]}`);
}

function requireString(value: unknown, field: string): string {
  const normalized = optionalString(value);
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean`);
  return value;
}

function requireTimestamp(value: unknown, field: string): string {
  const text = requireString(value, field);
  const milliseconds = Date.parse(text);
  if (!Number.isFinite(milliseconds)) throw new Error(`${field} must be an ISO-8601 timestamp`);
  return new Date(milliseconds).toISOString();
}
