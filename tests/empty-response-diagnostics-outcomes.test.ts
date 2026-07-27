import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { PassThrough } from 'node:stream';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpenAIProvider } from '../src/providers/openai-provider';
import { flushEmptyResponseDiagnosticsForTest } from '../src/utils/empty-response-diagnostics';

describe('shape-only attempt outcome coverage', () => {
  test('records HTTP error status and only a hashed request identifier', async () => {
    const originalPost = axios.post;
    const context = enableRecorder();
    (axios as any).post = async () => {
      const error: any = new Error('TOP_SECRET_HTTP_ERROR_MESSAGE');
      error.name = 'AxiosError';
      error.code = 'ERR_NETWORK';
      error.response = {
        status: 503,
        headers: { 'x-request-id': 'req_http_secret_value', authorization: 'Bearer TOP_SECRET' },
      };
      throw error;
    };
    try {
      await assert.rejects(createProvider().chat([{ role: 'user', content: 'TOP_SECRET_PROMPT' }]));
      await flushEmptyResponseDiagnosticsForTest();
      const [sample] = readSamples(context.samplePath);
      assert.equal(sample.outcome, 'http_error');
      assert.equal(sample.http.status, 503);
      assert.equal(sample.http.requestIdPresent, true);
      assert.match(sample.http.requestIdHash, /^[a-f0-9]{24}$/);
      assert.equal(sample.error.status, 503);
      assert.doesNotMatch(JSON.stringify(sample), /TOP_SECRET|req_http_secret_value|Bearer/);
    } finally {
      (axios as any).post = originalPost;
      context.cleanup();
    }
  });

  test('records a failed SSE terminal once as terminal_failure', async () => {
    const originalPost = axios.post;
    const context = enableRecorder();
    (axios as any).post = async () => ({
      status: 200,
      headers: { 'x-request-id': 'req_sse_failure' },
      data: PassThrough.from([
        'data: {"type":"response.failed","response":{"status":"failed","error":{"code":"server_error","message":"TOP_SECRET_SERVER_MESSAGE"}}}\n\n',
      ]),
    });
    try {
      await assert.rejects(createProvider().chatStream([{ role: 'user', content: 'TOP_SECRET_PROMPT' }]));
      await flushEmptyResponseDiagnosticsForTest();
      const samples = readSamples(context.samplePath);
      assert.equal(samples.length, 1);
      assert.equal(samples[0].outcome, 'terminal_failure');
      assert.equal(samples[0].response.status, 'failed');
      assert.equal(samples[0].error.code, 'server_error');
      assert.doesNotMatch(JSON.stringify(samples[0]), /TOP_SECRET|req_sse_failure/);
    } finally {
      (axios as any).post = originalPost;
      context.cleanup();
    }
  });

  test('records a prematurely closed SSE stream once as stream_closed', async () => {
    const originalPost = axios.post;
    const context = enableRecorder();
    (axios as any).post = async () => {
      const stream = new PassThrough();
      setImmediate(() => stream.destroy());
      return { status: 200, headers: { 'x-request-id': 'req_sse_closed' }, data: stream };
    };
    try {
      await assert.rejects(createProvider().chatStream([{ role: 'user', content: 'TOP_SECRET_PROMPT' }]));
      await flushEmptyResponseDiagnosticsForTest();
      const samples = readSamples(context.samplePath);
      assert.equal(samples.length, 1);
      assert.equal(samples[0].outcome, 'stream_closed');
      assert.doesNotMatch(JSON.stringify(samples[0]), /TOP_SECRET|req_sse_closed/);
    } finally {
      (axios as any).post = originalPost;
      context.cleanup();
    }
  });
});

function createProvider(): OpenAIProvider {
  return new OpenAIProvider({
    provider: 'openai',
    apiUrl: 'https://example.test/v1',
    apiKey: 'TOP_SECRET_API_KEY',
    model: 'gpt-test',
    openaiApiMode: 'responses',
  });
}

function enableRecorder(): { samplePath: string; cleanup: () => void } {
  const directory = mkdtempSync(join(tmpdir(), 'catsco-empty-response-outcome-'));
  const samplePath = join(directory, 'attempts.jsonl');
  const enabled = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED;
  const path = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH;
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED = '1';
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH = samplePath;
  return {
    samplePath,
    cleanup: () => {
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED', enabled);
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_PATH', path);
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

function readSamples(path: string): any[] {
  return readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line));
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
