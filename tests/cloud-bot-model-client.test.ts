import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  acknowledgeCloudBotModelSelection,
  pullCloudBotModelSelection,
} from '../src/bot-definition/cloud-client';

const auth = {
  apiKey: 'bot-api-key',
  httpBaseUrl: 'https://cats.example.test',
} as any;

describe('cloud bot model client local handoff', () => {
  test('returns an explicit local revision after cloud management is disabled', async () => {
    const selection = await pullCloudBotModelSelection({
      botId: '43',
      auth,
      fetchImpl: (async () => Response.json({
        uid: 43,
        configured: false,
        desired: { kind: 'local', model_id: 'local', revision: 7 },
      })) as typeof fetch,
    });

    assert.deepStrictEqual(selection, { kind: 'local', modelId: 'local', revision: 7 });
  });

  test('keeps an untouched revision zero configuration as local-only state', async () => {
    const selection = await pullCloudBotModelSelection({
      botId: '43',
      auth,
      fetchImpl: (async () => Response.json({
        uid: 43,
        configured: false,
        desired: { kind: 'local', model_id: 'local', revision: 0 },
      })) as typeof fetch,
    });

    assert.equal(selection, undefined);
  });

  test('acknowledges a local handoff with its revision', async () => {
    let requestBody: any;
    await acknowledgeCloudBotModelSelection({
      botId: '43',
      auth,
      fetchImpl: (async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        return Response.json({ status: 'applied' });
      }) as typeof fetch,
    }, { kind: 'local', modelId: 'local', revision: 8 });

    assert.deepStrictEqual(requestBody, {
      revision: 8,
      kind: 'local',
      model_id: 'local',
      reasoning_effort: '',
    });
  });
});
