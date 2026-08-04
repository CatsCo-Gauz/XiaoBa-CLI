import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';

const DEFAULT_MAX_BYTES = 1_048_576;
const MAX_EVENT_TYPES = 32;
const RESPONSE_STATUSES = new Set(['completed', 'failed', 'incomplete', 'cancelled', 'in_progress', 'queued']);
const INCOMPLETE_REASONS = new Set(['max_output_tokens', 'content_filter']);
const STOP_REASONS = new Set(['completed', 'failed', 'incomplete', 'cancelled', 'stop', 'length', 'max_tokens', 'max_output_tokens', 'tool_calls']);
const OUTPUT_ITEM_TYPES = new Set(['message', 'function_call', 'reasoning', 'computer_call', 'file_search_call', 'web_search_call', 'image_generation_call', 'code_interpreter_call', 'local_shell_call', 'mcp_call', 'custom_tool_call']);
const CONTENT_BLOCK_TYPES = new Set(['output_text', 'refusal']);
const SSE_EVENT_TYPES = new Set([
  'response.created', 'response.in_progress', 'response.completed', 'response.failed', 'response.incomplete',
  'response.output_item.added', 'response.output_item.done', 'response.content_part.added', 'response.content_part.done',
  'response.output_text.delta', 'response.output_text.done', 'response.refusal.delta', 'response.refusal.done',
  'response.function_call_arguments.delta', 'response.function_call_arguments.done', 'response.reasoning_summary_text.delta',
  'response.reasoning_summary_text.done', 'error',
]);
const ERROR_NAMES = new Set(['Error', 'AxiosError', 'AbortError', 'CanceledError', 'TimeoutError', 'TypeError']);
const ERROR_CODES = new Set([
  'ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'EPIPE',
  'ETIMEDOUT', 'ERR_ABORTED', 'ERR_CANCELED', 'ERR_NETWORK', 'ERR_STREAM_PREMATURE_CLOSE',
  'server_error', 'rate_limit_exceeded', 'invalid_request_error', 'authentication_error', 'insufficient_quota',
]);

export interface ResponsesShape {
  status?: string;
  hasError: boolean;
  errorCode?: string;
  outputItemCount: number;
  outputItemTypes: string[];
  messageContentBlockCount: number;
  messageContentBlockTypes: string[];
  outputTextBlockCount: number;
  outputTextChars: number;
  refusalBlockCount: number;
  refusalChars: number;
  functionCallCount: number;
  incompleteReason?: string;
}

export interface EmptyResponseAttemptSample {
  schemaVersion: 1;
  recordedAt: string;
  apiMode: 'responses';
  transport: 'http' | 'sse';
  outcome: 'response' | 'provider_failure' | 'terminal' | 'terminal_failure' | 'http_error' | 'transport_error' | 'stream_without_terminal' | 'stream_aborted' | 'stream_closed';
  http?: { status?: number; requestIdPresent?: boolean; requestIdHash?: string; contentType?: string };
  response?: ResponsesShape;
  stream?: { eventCount: number; eventTypes: string[]; malformedEventCount: number; visibleDeltaChars: number; outputItemCount: number };
  parsed?: { visibleChars: number; toolCallCount: number; stopReason?: string };
  error?: { name: string; code?: string; status?: number };
}

type SampleBuilder = () => EmptyResponseAttemptSample;
let writeQueue: Promise<void> = Promise.resolve();

export function emptyResponseDiagnosticsEnabled(): boolean {
  return Boolean(configuredTarget());
}

/** The builder is evaluated only when explicitly enabled; all output is rebuilt from a runtime whitelist. */
export function recordEmptyResponseAttempt(buildSample: SampleBuilder): void {
  const target = configuredTarget();
  if (!target) return;
  try {
    const sample = sanitizeSample(buildSample());
    const line = `${JSON.stringify(sample)}\n`;
    writeQueue = writeQueue.then(async () => {
      try {
        const currentBytes = await fs.stat(target.path).then(stat => stat.size).catch(() => 0);
        if (currentBytes + Buffer.byteLength(line, 'utf8') > target.maxBytes) return;
        await fs.mkdir(dirname(target.path), { recursive: true });
        await fs.appendFile(target.path, line, { encoding: 'utf8', mode: 0o600 });
      } catch {
        // Diagnostics must never replace the provider result or error.
      }
    });
  } catch {
    // Diagnostics must never replace the provider result or error.
  }
}

export async function flushEmptyResponseDiagnosticsForTest(): Promise<void> {
  await writeQueue;
}

export function summarizeResponsesShape(response: any): ResponsesShape {
  const output = Array.isArray(response?.output) ? response.output : [];
  const outputItemTypes = new Set<string>();
  const messageContentBlockTypes = new Set<string>();
  let messageContentBlockCount = 0;
  let outputTextBlockCount = 0;
  let outputTextChars = 0;
  let refusalBlockCount = 0;
  let refusalChars = 0;
  let functionCallCount = 0;

  for (const item of output) {
    outputItemTypes.add(classify(item?.type, OUTPUT_ITEM_TYPES));
    if (item?.type === 'function_call') functionCallCount += 1;
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const block of item.content) {
      messageContentBlockCount += 1;
      messageContentBlockTypes.add(classify(block?.type, CONTENT_BLOCK_TYPES));
      if (block?.type === 'output_text' && typeof block.text === 'string') {
        outputTextBlockCount += 1;
        outputTextChars += block.text.length;
      }
      if (block?.type === 'refusal' && typeof block.refusal === 'string') {
        refusalBlockCount += 1;
        refusalChars += block.refusal.length;
      }
    }
  }

  const error = response?.error && typeof response.error === 'object' ? response.error : undefined;
  return {
    status: classifyOptional(response?.status, RESPONSE_STATUSES),
    hasError: Boolean(response?.error),
    errorCode: classifyOptional(error?.code ?? error?.type, ERROR_CODES),
    outputItemCount: boundedCount(output.length),
    outputItemTypes: [...outputItemTypes].sort(),
    messageContentBlockCount: boundedCount(messageContentBlockCount),
    messageContentBlockTypes: [...messageContentBlockTypes].sort(),
    outputTextBlockCount: boundedCount(outputTextBlockCount),
    outputTextChars: boundedCount(outputTextChars),
    refusalBlockCount: boundedCount(refusalBlockCount),
    refusalChars: boundedCount(refusalChars),
    functionCallCount: boundedCount(functionCallCount),
    incompleteReason: classifyOptional(response?.incomplete_details?.reason, INCOMPLETE_REASONS),
  };
}

export function classifyResponsesSseEventType(value: unknown): string {
  return classify(value, SSE_EVENT_TYPES);
}

export function responseHeaderShape(headers: unknown): EmptyResponseAttemptSample['http'] {
  const source = headers && typeof (headers as any).get === 'function'
    ? (name: string) => (headers as any).get(name)
    : (name: string) => (headers as Record<string, unknown>)?.[name]
      ?? (headers as Record<string, unknown>)?.[name.toLowerCase()];
  const requestId = source('x-request-id') ?? source('request-id') ?? source('openai-request-id');
  const requestIdString = typeof requestId === 'string' && requestId.length <= 512 ? requestId : undefined;
  return {
    ...(requestIdString ? {
      requestIdPresent: true,
      requestIdHash: createHash('sha256').update(requestIdString).digest('hex').slice(0, 24),
    } : {}),
    contentType: classifyContentType(source('content-type')),
  };
}

export function errorShape(error: unknown): NonNullable<EmptyResponseAttemptSample['error']> {
  const value = error as { name?: unknown; code?: unknown; status?: unknown; response?: { status?: unknown } } | undefined;
  const status = boundedHttpStatus(value?.status ?? value?.response?.status);
  return {
    name: classify(value?.name, ERROR_NAMES),
    code: classifyOptional(value?.code, ERROR_CODES),
    ...(status ? { status } : {}),
  };
}

function sanitizeSample(raw: EmptyResponseAttemptSample): EmptyResponseAttemptSample {
  const transport = raw?.transport === 'sse' ? 'sse' : 'http';
  const outcomes = new Set<EmptyResponseAttemptSample['outcome']>([
    'response', 'provider_failure', 'terminal', 'terminal_failure', 'http_error', 'transport_error',
    'stream_without_terminal', 'stream_aborted', 'stream_closed',
  ]);
  const outcome = outcomes.has(raw?.outcome) ? raw.outcome : 'transport_error';
  const recordedAt = Number.isFinite(Date.parse(raw?.recordedAt)) ? new Date(raw.recordedAt).toISOString() : new Date().toISOString();
  return {
    schemaVersion: 1,
    recordedAt,
    apiMode: 'responses',
    transport,
    outcome,
    ...(raw?.http ? { http: sanitizeHttp(raw.http) } : {}),
    ...(raw?.response ? { response: sanitizeResponse(raw.response) } : {}),
    ...(raw?.stream ? { stream: sanitizeStream(raw.stream) } : {}),
    ...(raw?.parsed ? { parsed: sanitizeParsed(raw.parsed) } : {}),
    ...(raw?.error ? { error: sanitizeError(raw.error) } : {}),
  };
}

function sanitizeHttp(raw: NonNullable<EmptyResponseAttemptSample['http']>): NonNullable<EmptyResponseAttemptSample['http']> {
  return {
    ...(boundedHttpStatus(raw.status) ? { status: boundedHttpStatus(raw.status) } : {}),
    ...(raw.requestIdPresent === true ? { requestIdPresent: true } : {}),
    ...(typeof raw.requestIdHash === 'string' && /^[a-f0-9]{24}$/.test(raw.requestIdHash) ? { requestIdHash: raw.requestIdHash } : {}),
    contentType: classifyContentType(raw.contentType),
  };
}

function sanitizeResponse(raw: ResponsesShape): ResponsesShape {
  return {
    status: classifyOptional(raw.status, RESPONSE_STATUSES),
    hasError: raw.hasError === true,
    errorCode: classifyOptional(raw.errorCode, ERROR_CODES),
    outputItemCount: boundedCount(raw.outputItemCount),
    outputItemTypes: sanitizeList(raw.outputItemTypes, OUTPUT_ITEM_TYPES),
    messageContentBlockCount: boundedCount(raw.messageContentBlockCount),
    messageContentBlockTypes: sanitizeList(raw.messageContentBlockTypes, CONTENT_BLOCK_TYPES),
    outputTextBlockCount: boundedCount(raw.outputTextBlockCount),
    outputTextChars: boundedCount(raw.outputTextChars),
    refusalBlockCount: boundedCount(raw.refusalBlockCount),
    refusalChars: boundedCount(raw.refusalChars),
    functionCallCount: boundedCount(raw.functionCallCount),
    incompleteReason: classifyOptional(raw.incompleteReason, INCOMPLETE_REASONS),
  };
}

function sanitizeStream(raw: NonNullable<EmptyResponseAttemptSample['stream']>): NonNullable<EmptyResponseAttemptSample['stream']> {
  return {
    eventCount: boundedCount(raw.eventCount),
    eventTypes: sanitizeList(raw.eventTypes, SSE_EVENT_TYPES).slice(0, MAX_EVENT_TYPES),
    malformedEventCount: boundedCount(raw.malformedEventCount),
    visibleDeltaChars: boundedCount(raw.visibleDeltaChars),
    outputItemCount: boundedCount(raw.outputItemCount),
  };
}

function sanitizeParsed(raw: NonNullable<EmptyResponseAttemptSample['parsed']>): NonNullable<EmptyResponseAttemptSample['parsed']> {
  return {
    visibleChars: boundedCount(raw.visibleChars),
    toolCallCount: boundedCount(raw.toolCallCount),
    stopReason: classifyOptional(raw.stopReason, STOP_REASONS),
  };
}

function sanitizeError(raw: NonNullable<EmptyResponseAttemptSample['error']>): NonNullable<EmptyResponseAttemptSample['error']> {
  return {
    name: classify(raw.name, ERROR_NAMES),
    code: classifyOptional(raw.code, ERROR_CODES),
    ...(boundedHttpStatus(raw.status) ? { status: boundedHttpStatus(raw.status) } : {}),
  };
}

function configuredTarget(): { path: string; maxBytes: number } | undefined {
  const requestedPath = process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_PATH?.trim();
  if (!requestedPath || process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_ENABLED !== '1') return undefined;
  const configuredMax = Number(process.env.CATSCO_EMPTY_RESPONSE_SAMPLER_MAX_BYTES);
  const maxBytes = Number.isFinite(configuredMax) && configuredMax > 0
    ? Math.min(Math.floor(configuredMax), DEFAULT_MAX_BYTES)
    : DEFAULT_MAX_BYTES;
  return { path: resolve(requestedPath), maxBytes };
}

function classify(value: unknown, allowed: Set<string>): string {
  return typeof value === 'string' && allowed.has(value) ? value : 'other';
}

function classifyOptional(value: unknown, allowed: Set<string>): string | undefined {
  return value === undefined || value === null || value === '' ? undefined : classify(value, allowed);
}

function classifyContentType(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const mime = value.split(';', 1)[0].trim().toLowerCase();
  if (mime === 'application/json' || mime === 'text/event-stream') return mime;
  return mime ? 'other' : undefined;
}

function sanitizeList(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.slice(0, MAX_EVENT_TYPES).map(item => classify(item, allowed)))].sort();
}

function boundedCount(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.min(Math.floor(number), Number.MAX_SAFE_INTEGER);
}

function boundedHttpStatus(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) && number >= 100 && number <= 599 ? number : undefined;
}
