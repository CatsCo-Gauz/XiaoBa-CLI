import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { extractLearningEpisodes } from '../src/utils/learning-episode';
import type { DistillationTurn, DistillationUnit } from '../src/utils/distillation-unit';

const NOW = '2026-07-27T00:00:00.000Z';
const SOURCE = '/tmp/runtime-observation-session.jsonl';

function deliveryTurn(
  turn: number,
  userText: string,
  runtimeObservationSource?: string,
): DistillationTurn {
  return {
    entry_type: 'turn',
    turn,
    timestamp: NOW,
    session_id: 'runtime-observation-regression',
    session_type: 'chat',
    user: {
      text: userText,
      ...(runtimeObservationSource
        ? { runtime_observation_source: runtimeObservationSource }
        : {}),
    },
    assistant: {
      text: '报告已经发送。',
      tool_calls: [{
        id: `call-${turn}`,
        name: 'send_file',
        arguments: { file_name: 'report.pdf', file_path: '/tmp/report.pdf' },
        result: 'File sent to current chat.',
      }],
    },
    tokens: { prompt: 1, completion: 1 },
  };
}

function unit(newTurns: DistillationTurn[], continuityTurns: DistillationTurn[] = []): DistillationUnit {
  return {
    filePath: SOURCE,
    newTurns,
    continuityTurns,
    byteRange: { start: 0, end: 1 },
    generatedAt: NOW,
  };
}

test('runtime observation turns never mint Learning Episodes', () => {
  const result = extractLearningEpisodes(unit([
    deliveryTurn(2, '[后台子任务批量回流] 审查完成。', 'subagent_result_batch'),
  ]), 60_000);

  assert.equal(result.episodes.length, 0);
  assert.equal(result.contradictions.length, 0);
});

test('runtime observation continuity never contaminates a real user intent', () => {
  const result = extractLearningEpisodes(
    unit(
      [deliveryTurn(2, '请生成真实报告。')],
      [deliveryTurn(1, '[后台子任务批量回流] 内部结果。', 'subagent_result_batch')],
    ),
    60_000,
  );

  assert.equal(result.episodes.length, 1);
  const intents = result.episodes[0].semanticObservations
    .filter(item => item.kind === 'user-intent')
    .map(item => item.value);
  assert.deepEqual(intents, ['请生成真实报告。']);
  assert.equal(
    result.episodes[0].semanticObservations.some(item => item.kind === 'workflow-tool'),
    false,
  );
});

test('runtime observations cannot accept a preceding user delivery', () => {
  const result = extractLearningEpisodes(unit([
    deliveryTurn(1, '请生成真实报告。'),
    deliveryTurn(2, '很好，已经完成。', 'subagent_result_batch'),
  ]), 60_000);

  assert.equal(result.episodes.length, 1);
  assert.equal(
    result.episodes[0].completionEvidence.some(item => item.kind === 'user-acceptance'),
    false,
  );
});
