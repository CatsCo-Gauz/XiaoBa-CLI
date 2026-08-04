import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  AgentRunRuntimeTool,
  type AgentRunRuntimeToolController,
} from '../src/core/agent-run-runtime-tool';
import type {
  AgentRunArtifactRef,
  AgentRunEvent,
  AgentRunGoalCheck,
  AgentRunSubjectRef,
} from '../src/core/agent-run-types';
import type { ToolExecutionContext } from '../src/types/tool';

const NOW = '2026-07-28T08:00:00.000Z';

type Call = {
  action: string;
  runId: string;
  sessionKey: string | undefined;
  value: AgentRunGoalCheck | AgentRunEvent | AgentRunArtifactRef | AgentRunSubjectRef;
};

class Controller implements AgentRunRuntimeToolController {
  readonly calls: Call[] = [];

  async recordGoalCheck(runId: string, sessionKey: string | undefined, value: AgentRunGoalCheck) {
    this.calls.push({ action: 'goal_check', runId, sessionKey, value });
    return { recorded: 'goal_check' };
  }

  async recordEvent(runId: string, sessionKey: string | undefined, value: AgentRunEvent) {
    this.calls.push({ action: 'record_event', runId, sessionKey, value });
    return { recorded: 'record_event' };
  }

  async attachArtifact(runId: string, sessionKey: string | undefined, value: AgentRunArtifactRef) {
    this.calls.push({ action: 'attach_artifact', runId, sessionKey, value });
    return { recorded: 'attach_artifact' };
  }

  async linkSubject(runId: string, sessionKey: string | undefined, value: AgentRunSubjectRef) {
    this.calls.push({ action: 'link_subject', runId, sessionKey, value });
    return { recorded: 'link_subject' };
  }
}

function context(sessionId = 'session-private'): ToolExecutionContext {
  return { sessionId } as ToolExecutionContext;
}

describe('AgentRunRuntimeTool', () => {
  test('exposes the agent_run name and exactly four actions', () => {
    const tool = new AgentRunRuntimeTool(new Controller());
    assert.equal(tool.definition.name, 'agent_run');
    assert.deepEqual(tool.definition.parameters.properties.action.enum, [
      'goal_check', 'record_event', 'attach_artifact', 'link_subject',
    ]);
    assert.deepEqual(tool.definition.parameters.required, ['action', 'run_id']);
  });

  test('maps goal_check arguments and forwards the controller session', async () => {
    const controller = new Controller();
    const tool = new AgentRunRuntimeTool(controller, () => new Date(NOW));
    const result = await tool.execute({
      action: 'goal_check',
      run_id: 'run-1',
      complete: false,
      capabilities_exhausted: true,
      summary: 'Waiting for dependency',
      blocker: 'dependency unavailable',
      stop_condition: 'Resume when dependency is available',
      next_wake_at: '2026-07-29T08:00:00Z',
    }, context());

    assert.equal(result.ok, true);
    assert.deepEqual(controller.calls[0], {
      action: 'goal_check',
      runId: 'run-1',
      sessionKey: 'session-private',
      value: {
        checkedAt: NOW,
        complete: false,
        capabilitiesExhausted: true,
        summary: 'Waiting for dependency',
        blocker: 'dependency unavailable',
        stopCondition: 'Resume when dependency is available',
        nextWakeAt: '2026-07-29T08:00:00.000Z',
      },
    });
  });

  test('maps event, artifact, and subject arguments with run_id and session', async () => {
    const controller = new Controller();
    const tool = new AgentRunRuntimeTool(controller, () => new Date(NOW));

    await tool.execute({
      action: 'record_event', run_id: 'run-2', event_id: 'evt-1', event_type: 'progress', summary: 'Step done',
    }, context('session-2'));
    await tool.execute({
      action: 'attach_artifact', run_id: 'run-2', artifact_id: 'a-1', kind: 'report',
      label: 'Report', ref: 'artifact://a-1', created_at: '2026-07-28T09:00:00Z',
    }, context('session-2'));
    await tool.execute({
      action: 'link_subject', run_id: 'run-2', kind: 'issue', id: '42',
      ref: 'issue://42', label: 'Issue 42',
    }, context('session-2'));

    assert.deepEqual(controller.calls, [
      {
        action: 'record_event', runId: 'run-2', sessionKey: 'session-2',
        value: { eventId: 'evt-1', type: 'progress', summary: 'Step done', createdAt: NOW },
      },
      {
        action: 'attach_artifact', runId: 'run-2', sessionKey: 'session-2',
        value: {
          artifactId: 'a-1', kind: 'report', label: 'Report', ref: 'artifact://a-1',
          createdAt: '2026-07-28T09:00:00.000Z',
        },
      },
      {
        action: 'link_subject', runId: 'run-2', sessionKey: 'session-2',
        value: { kind: 'issue', id: '42', ref: 'issue://42', label: 'Issue 42' },
      },
    ]);
  });

  test('strictly rejects malformed, incomplete, irrelevant, and unknown arguments', async () => {
    const controller = new Controller();
    const tool = new AgentRunRuntimeTool(controller, () => new Date(NOW));

    const cases: unknown[] = [
      null,
      { action: 'unknown', run_id: 'run-1' },
      { action: 'record_event', run_id: 'run-1', event_type: 'progress', summary: 'ok', blocker: 'irrelevant' },
      {
        action: 'goal_check', run_id: 'run-1', complete: false, capabilities_exhausted: false,
        summary: 'not done', stop_condition: 'until done',
      },
      {
        action: 'goal_check', run_id: 'run-1', complete: false, capabilities_exhausted: false,
        summary: 'not done', next_action: 'continue',
      },
      { action: 'attach_artifact', run_id: 'run-1', artifact_id: 'a', kind: 'report', label: 'Report' },
      { action: 'link_subject', run_id: 'run-1', kind: 'issue', id: '' },
    ];

    for (const args of cases) {
      const result = await tool.execute(args, context());
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.errorCode, 'AGENT_RUN_ERROR');
    }
    assert.equal(controller.calls.length, 0);
  });
});
