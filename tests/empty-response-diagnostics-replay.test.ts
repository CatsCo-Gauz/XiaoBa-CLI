import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { AddressInfo } from 'node:net';
import { OpenAIProvider } from '../src/providers/openai-provider';
import { flushEmptyResponseDiagnosticsForTest } from '../src/utils/empty-response-diagnostics';

const secretPrompt = 'REAL_TRANSPORT_SECRET_PROMPT';
let server: Server;
let baseUrl = '';
let directory = '';
let samplePath = '';
let originalEnabled: string | undefined;
let originalPath: string | undefined;

before(async () => {
  directory = mkdtempSync(join(tmpdir(), 'catsco-empty-response-replay-'));
  samplePath = join(directory, 'attempts.jsonl');
  originalEnabled = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED;
  originalPath = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH;
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED = '1';
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH = samplePath;

  server = createServer((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      const parsed = JSON.parse(body);
      if (parsed.stream) {
        response.writeHead(200, {
          'content-type': 'text/event-stream',
          'x-request-id': 'req_real_sse_empty',
        });
        const payload = 'data: {"type":"response.completed","response":{"status":"completed","output":[]}}\n\n';
        const split = Math.floor(payload.length / 2);
        response.write(payload.slice(0, split));
        setTimeout(() => response.end(payload.slice(split)), 5);
        return;
      }
      response.writeHead(200, {
        'content-type': 'application/json',
        'x-request-id': 'req_real_http_empty',
      });
      response.end(JSON.stringify({ status: 'completed', output: [] }));
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/v1`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED', originalEnabled);
  restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_PATH', originalPath);
  rmSync(directory, { recursive: true, force: true });
});

describe('shape-only EMPTY_MODEL_RESPONSE diagnostics over real local transport', () => {
  test('captures HTTP and split SSE empty completions without request or response body text', async () => {
    const provider = new OpenAIProvider({
      provider: 'openai',
      apiUrl: baseUrl,
      apiKey: 'REAL_TRANSPORT_SECRET_KEY',
      model: 'gpt-test',
      openaiApiMode: 'responses',
    });

    const httpResult = await provider.chat([{ role: 'user', content: secretPrompt }]);
    const sseResult = await provider.chatStream([{ role: 'user', content: secretPrompt }]);
    await flushEmptyResponseDiagnosticsForTest();
    assert.equal(httpResult.content, null);
    assert.equal(sseResult.content, null);

    const raw = readFileSync(samplePath, 'utf8');
    const samples = raw.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(samples.length, 2);
    assert.deepEqual(samples.map(sample => sample.transport), ['http', 'sse']);
    assert.deepEqual(samples.map(sample => sample.http.requestIdPresent), [true, true]);
    assert.equal(new Set(samples.map(sample => sample.http.requestIdHash)).size, 2);
    for (const sample of samples) assert.match(sample.http.requestIdHash, /^[a-f0-9]{24}$/);
    for (const sample of samples) {
      assert.equal(sample.response.status, 'completed');
      assert.equal(sample.response.outputItemCount, 0);
      assert.equal(sample.response.outputTextChars, 0);
      assert.equal(sample.parsed.visibleChars, 0);
      assert.equal(sample.parsed.toolCallCount, 0);
    }
    assert.doesNotMatch(raw, /REAL_TRANSPORT_SECRET|authorization|input|messages|prompt/i);

    const artifactPath = process.env.CATSCO_EMPTY_RESPONSE_REPLAY_ARTIFACT?.trim();
    if (artifactPath) {
      const resolved = resolve(artifactPath);
      mkdirSync(dirname(resolved), { recursive: true });
      copyFileSync(samplePath, resolved);
    }
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
