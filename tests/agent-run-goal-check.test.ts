import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  AIServiceGoalChecker,
  parseStructuredGoalCheck,
  toPersistedGoalCheck,
} from '../src/agent-run/goal-check';
import type { AgentRunRecord } from '../src/core/agent-run-types';
import type { ChatResponse, Message } from '../src/types';
import type { ToolDefinition } from '../src/types/tool';

const NOW = '2026-08-02T00:00:00.000Z';

function run(): AgentRunRecord {
  return {
    runId: 'run-1',
    runType: 'pr_review',
    triggerRef: { source: 'github_pr', id: 'repo#1' },
    sessionKey: 'agent-run:run-1',
    initialGoal: 'Review the pull request and report concrete findings.',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    events: [],
    artifacts: [],
    subjects: [],
  };
}

function response(argumentsValue: string, name = 'agent_run_goal_check'): ChatResponse {
  return {
    content: null,
    toolCalls: [{ id: 'call-1', type: 'function', function: { name, arguments: argumentsValue } }],
  };
}

describe('Agent Run Goal Check', () => {
  test('requests one structured tool and parses a continue decision', async () => {
    let seenMessages: Message[] = [];
    let seenTools: ToolDefinition[] = [];
    const checker = new AIServiceGoalChecker({
      chat: async (messages, tools) => {
        seenMessages = messages;
        seenTools = tools || [];
        return response(JSON.stringify({
          decision: 'continue',
          summary: 'More evidence is needed.',
          nextAction: 'Inspect the remaining changed files.',
          stopCondition: 'Stop after all changed files are covered.',
        }));
      },
    });

    const result = await checker.check({
      run: run(),
      finalText: 'Partial review result',
      iteration: 1,
      maxIterations: 4,
      remainingBudget: 3,
      context: ['14 changed files'],
    });

    assert.equal(seenTools.length, 1);
    assert.equal(seenTools[0].name, 'agent_run_goal_check');
    assert.match(String(seenMessages[0].content), /untrusted data/);
    assert.match(String(seenMessages[1].content), /Review the pull request/);
    assert.equal(result.decision, 'continue');
    assert.equal(result.nextAction, 'Inspect the remaining changed files.');
  });

  test('requires the named structured call', async () => {
    const missing = new AIServiceGoalChecker({ chat: async () => ({ content: 'plain text' }) });
    await assert.rejects(() => missing.check({
      run: run(), finalText: 'done', iteration: 1, maxIterations: 1, remainingBudget: 0, context: [],
    }), /goal_check_missing_structured_call/);

    const wrong = new AIServiceGoalChecker({ chat: async () => response('{}', 'other_tool') });
    await assert.rejects(() => wrong.check({
      run: run(), finalText: 'done', iteration: 1, maxIterations: 1, remainingBudget: 0, context: [],
    }), /goal_check_invalid_structured_calls/);

    const multiple = new AIServiceGoalChecker({
      chat: async () => ({
        content: null,
        toolCalls: [
          ...response('{"decision":"complete","summary":"done"}').toolCalls!,
          { id: 'call-2', type: 'function', function: { name: 'agent_run_goal_check', arguments: '{"decision":"complete","summary":"done"}' } },
        ],
      }),
    });
    await assert.rejects(() => multiple.check({
      run: run(), finalText: 'done', iteration: 1, maxIterations: 1, remainingBudget: 0, context: [],
    }), /goal_check_invalid_structured_calls/);

    const mixed = new AIServiceGoalChecker({
      chat: async () => ({
        content: null,
        toolCalls: [
          ...response('{"decision":"complete","summary":"done"}').toolCalls!,
          { id: 'call-2', type: 'function', function: { name: 'other_tool', arguments: '{}' } },
        ],
      }),
    });
    await assert.rejects(() => mixed.check({
      run: run(), finalText: 'done', iteration: 1, maxIterations: 1, remainingBudget: 0, context: [],
    }), /goal_check_invalid_structured_calls/);
  });

  test('rejects malformed and internally inconsistent decisions', () => {
    assert.throws(() => parseStructuredGoalCheck('{'), /goal_check_invalid_json/);
    assert.throws(() => parseStructuredGoalCheck('[]'), /goal_check_invalid_object/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"later","summary":"x"}'), /goal_check_invalid_decision/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"continue","summary":"x","stopCondition":"until done"}'), /requires_next_action/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"blocked","summary":"x","stopCondition":"until unblocked"}'), /requires_blocker/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"continue","summary":"x","nextAction":"retry"}'), /requires_stop_condition/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"continue","summary":"x","nextAction":"retry","blocker":"conflict","stopCondition":"until done"}'), /continue_has_blocker/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"blocked","summary":"x","blocker":"key","nextAction":"retry","stopCondition":"key arrives"}'), /blocked_has_next_action/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"blocked","summary":"x","blocker":"key","stopCondition":"key arrives","nextWakeAt":"tomorrow"}'), /invalid_next_wake_at/);
    assert.throws(() => parseStructuredGoalCheck('{"decision":"blocked","summary":"x","blocker":"key","stopCondition":"key arrives","nextWakeAt":"2026-08-02"}'), /invalid_next_wake_at/);
    assert.equal(parseStructuredGoalCheck('{"decision":"blocked","summary":"x","blocker":"key","stopCondition":"key arrives","nextWakeAt":"2026-08-02T00:00:00.000Z"}').nextWakeAt, '2026-08-02T00:00:00.000Z');
    assert.throws(() => parseStructuredGoalCheck('{"decision":"complete","summary":"x","nextAction":"extra"}'), /complete_has_continuation/);
  });

  test('maps complete and blocked decisions to the durable contract', () => {
    const complete = toPersistedGoalCheck(
      parseStructuredGoalCheck('{"decision":"complete","summary":"All acceptance criteria passed"}'),
      NOW,
    );
    assert.deepEqual(complete, {
      checkedAt: NOW,
      complete: true,
      capabilitiesExhausted: false,
      summary: 'All acceptance criteria passed',
    });

    const blocked = toPersistedGoalCheck(
      parseStructuredGoalCheck('{"decision":"blocked","summary":"Credential missing","blocker":"API key","stopCondition":"Key is supplied"}'),
      NOW,
    );
    assert.equal(blocked.complete, false);
    assert.equal(blocked.capabilitiesExhausted, true);
    assert.equal(blocked.blocker, 'API key');
  });
});
