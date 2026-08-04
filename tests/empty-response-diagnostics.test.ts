import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  flushEmptyResponseDiagnosticsForTest,
  recordEmptyResponseAttempt,
} from '../src/utils/empty-response-diagnostics';

describe('shape-only EMPTY_MODEL_RESPONSE recorder safety', () => {
  test('does not evaluate the sample builder while disabled', () => {
    const originalEnabled = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED;
    const originalPath = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH;
    delete process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED;
    delete process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH;
    let evaluated = false;
    try {
      recordEmptyResponseAttempt(() => {
        evaluated = true;
        throw new Error('MUST_NOT_RUN');
      });
      assert.equal(evaluated, false);
    } finally {
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED', originalEnabled);
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_PATH', originalPath);
    }
  });

  test('rebuilds a strict runtime whitelist and drops injected values', async () => {
    const { directory, samplePath, restore } = enableRecorder();
    try {
      recordEmptyResponseAttempt(() => ({
        schemaVersion: 1,
        recordedAt: new Date().toISOString(),
        apiMode: 'responses',
        transport: 'http',
        outcome: 'response',
        prompt: 'INJECTED_PROMPT_SECRET',
        authorization: 'Bearer INJECTED_KEY',
        http: {
          status: 200,
          requestIdPresent: true,
          requestIdHash: 'not-a-valid-hash-INJECTED_ID',
          contentType: 'text/plain; INJECTED_CONTENT_TYPE',
          message: 'INJECTED_HTTP_MESSAGE',
        },
        response: {
          status: 'INJECTED_RESPONSE_STATUS',
          hasError: false,
          errorCode: 'INJECTED_ERROR_CODE',
          outputItemCount: 1,
          outputItemTypes: ['INJECTED_OUTPUT_TYPE'],
          messageContentBlockCount: 1,
          messageContentBlockTypes: ['INJECTED_BLOCK_TYPE'],
          outputTextBlockCount: 0,
          outputTextChars: 0,
          refusalBlockCount: 0,
          refusalChars: 0,
          functionCallCount: 0,
          incompleteReason: 'INJECTED_REASON',
          text: 'INJECTED_MODEL_TEXT',
        },
        parsed: {
          visibleChars: 0,
          toolCallCount: 0,
          stopReason: 'INJECTED_STOP_REASON',
          arguments: 'INJECTED_TOOL_ARGUMENTS',
        },
        error: {
          name: 'INJECTED_ERROR_NAME',
          code: 'INJECTED_SECRET_CODE',
          status: 200,
          message: 'INJECTED_ERROR_MESSAGE',
        },
      } as any));
      await flushEmptyResponseDiagnosticsForTest();

      const raw = readFileSync(samplePath, 'utf8');
      const sample = JSON.parse(raw.trim());
      assert.doesNotMatch(raw, /INJECTED|Bearer/);
      assert.equal(sample.response.status, 'other');
      assert.deepEqual(sample.response.outputItemTypes, ['other']);
      assert.deepEqual(sample.response.messageContentBlockTypes, ['other']);
      assert.equal(sample.parsed.stopReason, 'other');
      assert.equal(sample.error.name, 'other');
      assert.equal(sample.http.contentType, 'other');
      assert.equal(sample.http.requestIdHash, undefined);
    } finally {
      restore();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test('does not write a line that would exceed the configured byte cap', async () => {
    const { directory, samplePath, restore } = enableRecorder('64');
    try {
      recordEmptyResponseAttempt(() => ({
        schemaVersion: 1,
        recordedAt: new Date().toISOString(),
        apiMode: 'responses',
        transport: 'http',
        outcome: 'response',
      }));
      await flushEmptyResponseDiagnosticsForTest();
      assert.equal(existsSync(samplePath), false);
    } finally {
      restore();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function enableRecorder(maxBytes?: string): {
  directory: string;
  samplePath: string;
  restore: () => void;
} {
  const directory = mkdtempSync(join(tmpdir(), 'catsco-empty-response-safety-'));
  const samplePath = join(directory, 'attempts.jsonl');
  const originals = {
    enabled: process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED,
    path: process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH,
    max: process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_MAX_BYTES,
  };
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED = '1';
  process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH = samplePath;
  if (maxBytes === undefined) delete process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_MAX_BYTES;
  else process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_MAX_BYTES = maxBytes;
  return {
    directory,
    samplePath,
    restore: () => {
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED', originals.enabled);
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_PATH', originals.path);
      restoreEnv('CATSCO_EMPTY_RESPONSE_SAMPLER_MAX_BYTES', originals.max);
    },
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
