import axios from 'axios';
import { createHash } from 'crypto';
import { StringDecoder } from 'string_decoder';
import { Message, ChatConfig, ChatResponse, ContentBlock } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, AIRequestOptions, StreamCallbacks } from './provider';
import { ContextDebugLogger } from '../utils/context-debug-logger';
import {
  classifyResponsesSseEventType,
  emptyResponseDiagnosticsEnabled,
  errorShape,
  recordEmptyResponseAttempt,
  responseHeaderShape,
  summarizeResponsesShape,
} from '../utils/empty-response-diagnostics';
import { normalizeOpenAIChatCompletionsUrl, normalizeOpenAIResponsesUrl } from './openai-url';
import { resolveMaxTokens } from './output-limits';
import {
  applyOpenAIReasoningOptions,
  supportsOpenAIReasoningReplay,
  supportsReasoningSwitch,
} from '../utils/reasoning-effort';
import { openAIApiModeOrDefault } from '../utils/openai-api-mode';

/**
 * OpenAI Provider
 * 兼容所有 OpenAI API 格式的服务（OpenAI、本地 LLM 等）
 * 支持 SSE streaming
 */
export class OpenAIProvider implements AIProvider {
  private apiUrl: string;
  private chatCompletionsUrl: string;
  private responsesUrl: string;
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private reasoningEffort: ChatConfig['reasoningEffort'];
  private openaiApiMode: ChatConfig['openaiApiMode'];
  constructor(config: ChatConfig) {
    this.apiUrl = config.apiUrl!;
    this.chatCompletionsUrl = normalizeOpenAIChatCompletionsUrl(this.apiUrl);
    this.responsesUrl = normalizeOpenAIResponsesUrl(this.apiUrl);
    this.apiKey = config.apiKey!;
    this.model = config.model || 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = resolveMaxTokens(config);
    this.reasoningEffort = config.reasoningEffort;
    this.openaiApiMode = openAIApiModeOrDefault(config.openaiApiMode);
  }

  /**
   * 构建请求体
   */
  private buildRequestBody(messages: Message[], tools?: ToolDefinition[], stream = false): any {
    const sanitizedMessages = messages.map(message => this.sanitizeMessage(message));

    const body: any = {
      model: this.model,
      messages: sanitizedMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream,
    };

    if (stream) {
      body.stream_options = { include_usage: true };
    }

    applyOpenAIReasoningOptions(body, {
      apiUrl: this.apiUrl,
      model: this.model,
      reasoningEffort: this.reasoningEffort,
    });

    if (tools && tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
    }

    return body;
  }

  private sanitizeMessage(message: Message): any {
    const sanitized: any = {
      role: message.role,
      content: this.sanitizeContent(message.content),
    };

    if (message.name) {
      sanitized.name = message.name;
    }
    if (message.role === 'assistant' && message.tool_calls) {
      sanitized.tool_calls = message.tool_calls.map(toolCall => ({
        id: toolCall.id,
        type: toolCall.type,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      }));
      const reasoningContent = this.extractOpenAIReasoningContent(message);
      if (reasoningContent) {
        sanitized.reasoning_content = reasoningContent;
      }
    }
    if (message.role === 'tool' && message.tool_call_id) {
      sanitized.tool_call_id = message.tool_call_id;
    }

    return sanitized;
  }

  private extractOpenAIReasoningContent(message: Message): string | undefined {
    if (!this.shouldReplayOpenAIReasoningContent()) return undefined;
    if (!Array.isArray(message.providerContent) || !message.tool_calls?.length) return undefined;
    const block = message.providerContent.find(item =>
      item
      && typeof item === 'object'
      && item.type === 'openai_reasoning'
      && typeof (item as any).reasoning_content === 'string'
    );
    const reasoning = typeof (block as any)?.reasoning_content === 'string'
      ? (block as any).reasoning_content.trim()
      : '';
    return reasoning || undefined;
  }

  private shouldReplayOpenAIReasoningContent(): boolean {
    return supportsOpenAIReasoningReplay({
      apiUrl: this.apiUrl,
      model: this.model,
    });
  }

  private sanitizeContent(content: Message['content']): any {
    if (!Array.isArray(content)) return content ?? '';
    return content.map(block =>
      block.type === 'text'
        ? { type: 'text', text: block.text }
        : { type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } }
    );
  }

  private visibleMessageContent(message: any): string | null {
    const content = typeof message?.content === 'string'
      ? message.content
      : Array.isArray(message?.content)
        ? message.content
            .map((item: any) => typeof item?.text === 'string' ? item.text : '')
            .join('')
        : '';
    const visible = stripOpenAIThinkingText(content).trim();
    return visible || null;
  }

  /**
   * 构建请求头
   */
  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * 普通调用
   */
  async chat(messages: Message[], tools?: ToolDefinition[], options?: AIRequestOptions): Promise<ChatResponse> {
    if (this.openaiApiMode === 'responses') {
      return this.chatResponses(messages, tools, options);
    }
    const body = this.buildRequestBody(messages, tools, false);
    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.chatCompletionsUrl,
      body,
    });
    const response = await axios.post(this.chatCompletionsUrl, body, {
      headers: this.headers,
      signal: options?.signal,
    });
    const choice = response.data.choices[0];
    const message = choice.message;
    const usage = response.data.usage;

    ContextDebugLogger.dumpSdkBoundary('after', undefined, {
      response: response.data,
    });

    return {
      content: this.visibleMessageContent(message),
      toolCalls: message.tool_calls,
      stopReason: choice.finish_reason || undefined,
      usage: usage ? {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
        cachedReadTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
        cachedWriteTokens: usage.prompt_tokens_details?.cache_write_tokens
          ?? usage.prompt_tokens_details?.cached_creation_tokens
          ?? usage.prompt_tokens_details?.cache_creation_tokens
          ?? 0,
      } : undefined,
      ...this.buildOpenAIProviderContent(message),
    };
  }

  /**
   * 流式调用（SSE）
   */
  async chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    callbacks?: StreamCallbacks,
    options?: AIRequestOptions,
  ): Promise<ChatResponse> {
    if (this.openaiApiMode === 'responses') {
      return this.chatStreamResponses(messages, tools, callbacks, options);
    }
    const body = this.buildRequestBody(messages, tools, true);

    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.chatCompletionsUrl,
      body,
    });

    const response = await axios.post(this.chatCompletionsUrl, body, {
      headers: this.headers,
      responseType: 'stream',
      signal: options?.signal,
    });

    return new Promise<ChatResponse>((resolve, reject) => {
      let fullContent = '';
      let fullReasoningContent = '';
      let contentStripper = new OpenAIThinkingStripper();
      const toolCallsMap = new Map<number, { id: string; type: 'function'; function: { name: string; arguments: string } }>();
      let buffer = '';
      // SSE byte chunks may split a UTF-8 character. Keep decoder state so a
      // partial Chinese character is completed by the next chunk instead of
      // becoming the Unicode replacement character.
      const decoder = new StringDecoder('utf8');
      let streamUsage: ChatResponse['usage'] = undefined;
      let finishReason: string | undefined;

      const stream = response.data;
      const onAbort = () => {
        stream.destroy(createAbortError());
      };
      if (options?.signal?.aborted) {
        onAbort();
      } else {
        options?.signal?.addEventListener('abort', onAbort, { once: true });
      }

      stream.on('data', (chunk: Buffer) => {
        buffer += decoder.write(chunk);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0];
            if (choice?.finish_reason) {
              finishReason = choice.finish_reason;
            }

            // 提取 usage（stream_options.include_usage 时在最后一个 chunk 返回）
            if (parsed.usage) {
              streamUsage = {
                promptTokens: parsed.usage.prompt_tokens ?? 0,
                completionTokens: parsed.usage.completion_tokens ?? 0,
                totalTokens: parsed.usage.total_tokens ?? 0,
                cachedReadTokens: parsed.usage.prompt_tokens_details?.cached_tokens ?? 0,
                cachedWriteTokens: parsed.usage.prompt_tokens_details?.cache_write_tokens
                  ?? parsed.usage.prompt_tokens_details?.cached_creation_tokens
                  ?? parsed.usage.prompt_tokens_details?.cache_creation_tokens
                  ?? 0,
              };
            }

            const delta = choice?.delta;
            if (!delta) continue;

            // OpenAI-compatible providers may stream hidden reasoning fields
            // (reasoning_content/thinking/etc.). CatsCo treats them as private
            // provider-side work: never render them and never send them back as
            // conversation content.
            const reasoningDelta = extractOpenAIReasoningDelta(delta);
            if (reasoningDelta) fullReasoningContent += reasoningDelta;

            // 文本内容
            if (delta.content) {
              const visibleContent = contentStripper.push(delta.content);
              if (visibleContent) {
                fullContent += visibleContent;
                callbacks?.onText?.(visibleContent);
              }
            }

            // 工具调用（增量拼接）
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, {
                    id: tc.id || '',
                    type: 'function',
                    function: { name: '', arguments: '' }
                  });
                }
                const existing = toolCallsMap.get(idx)!;
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.function.name += tc.function.name;
                if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      });

      stream.on('end', () => {
        options?.signal?.removeEventListener('abort', onAbort);
        buffer += decoder.end();
        const tail = contentStripper.flush();
        if (tail) {
          fullContent += tail;
          callbacks?.onText?.(tail);
        }
        const toolCalls = toolCallsMap.size > 0
          ? Array.from(toolCallsMap.values())
          : undefined;

        const result: ChatResponse = {
          content: fullContent || null,
          toolCalls,
          usage: streamUsage,
          stopReason: finishReason,
          ...(toolCalls && fullReasoningContent.trim()
            ? { providerContent: buildOpenAIProviderContentFromToolCalls(toolCalls, fullReasoningContent.trim()) }
            : {}),
        };

        ContextDebugLogger.dumpSdkBoundary('after', undefined, {
          response: result,
        });

        callbacks?.onComplete?.(result);
        resolve(result);
      });

      stream.on('error', (err: Error) => {
        options?.signal?.removeEventListener('abort', onAbort);
        callbacks?.onError?.(err);
        reject(err);
      });
    });
  }

  private buildResponsesRequestBody(messages: Message[], tools?: ToolDefinition[], stream = false): any {
    const instructions = messages
      .filter(message => message.role === 'system')
      .map(message => this.contentAsText(message.content))
      .filter(Boolean)
      .join('\n\n');
    const responseTools = tools?.map(tool => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })) ?? [];
    const body: any = {
      model: this.model,
      input: this.buildResponsesInput(messages),
      max_output_tokens: this.maxTokens,
      stream,
      store: false,
      prompt_cache_key: this.buildPromptCacheKey(instructions, responseTools),
    };

    if (instructions) body.instructions = instructions;
    if (Number.isFinite(this.temperature)) body.temperature = this.temperature;
    if (responseTools.length > 0) body.tools = responseTools;
    body.include = ['reasoning.encrypted_content'];
    this.applyResponsesReasoningOptions(body);
    return body;
  }

  private isOfficialOpenAIResponsesEndpoint(): boolean {
    try {
      return new URL(this.responsesUrl).hostname.toLowerCase() === 'api.openai.com';
    } catch {
      return false;
    }
  }

  private buildResponsesInput(messages: Message[]): any[] {
    const input: any[] = [];

    for (const message of messages) {
      if (message.role === 'system') continue;

      if (message.role === 'tool') {
        if (!message.tool_call_id) continue;
        input.push({
          type: 'function_call_output',
          call_id: message.tool_call_id,
          output: this.responsesFunctionOutput(message.content),
        });
        continue;
      }

      if (message.role === 'assistant' && message.tool_calls?.length) {
        const replayItems = (message.providerContent || [])
          .filter(item => this.isResponsesReplayItem(item))
          .map(item => JSON.parse(JSON.stringify(item)));
        if (replayItems.length > 0) {
          input.push(...replayItems);
          continue;
        }

        const text = this.contentAsText(message.content);
        if (text) input.push({ role: 'assistant', content: text });
        for (const toolCall of message.tool_calls) {
          input.push({
            type: 'function_call',
            call_id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments || '{}',
          });
        }
        continue;
      }

      input.push({
        role: message.role,
        content: this.responsesMessageContent(message.content),
      });
    }

    return input;
  }

  private responsesMessageContent(content: Message['content']): any {
    if (!Array.isArray(content)) return content ?? '';
    return content.map(block => block.type === 'text'
      ? { type: 'input_text', text: block.text }
      : { type: 'input_image', image_url: `data:${block.source.media_type};base64,${block.source.data}` });
  }

  private responsesFunctionOutput(content: Message['content']): any {
    if (!Array.isArray(content)) return content ?? '';
    return content.map(block => block.type === 'text'
      ? { type: 'input_text', text: block.text }
      : { type: 'input_image', image_url: `data:${block.source.media_type};base64,${block.source.data}` });
  }

  private contentAsText(content: Message['content']): string {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    return content
      .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  private isResponsesReplayItem(item: any): boolean {
    return Boolean(item && typeof item === 'object' && [
      'message',
      'function_call',
      'reasoning',
    ].includes(String(item.type || '')));
  }

  private buildPromptCacheKey(instructions: string, tools: any[]): string {
    const digest = createHash('sha256')
      .update(JSON.stringify({ model: this.model, instructions, tools }))
      .digest('hex')
      .slice(0, 48);
    return `catsco-${digest}`;
  }

  private applyResponsesReasoningOptions(body: any): void {
    const effort = this.reasoningEffort;
    if (!effort || effort === 'default') return;
    if (!this.isOfficialOpenAIResponsesEndpoint() && !supportsReasoningSwitch({
      apiUrl: this.apiUrl,
      model: this.model,
    })) return;
    body.reasoning = {
      effort: effort === 'max' ? 'xhigh' : effort === 'disabled' ? 'none' : effort,
    };
  }

  private responsesFailureError(response: any): Error | undefined {
    if (response?.status !== 'failed' && !response?.error) return undefined;
    const details = response?.error && typeof response.error === 'object'
      ? response.error
      : { message: response?.error };
    const code = String(details?.code || details?.type || '').trim();
    const statusByCode: Record<string, number> = {
      server_error: 500,
      rate_limit_exceeded: 429,
      overloaded_error: 529,
    };
    const explicitStatus = Number(details?.status ?? details?.status_code ?? response?.status_code);
    const status = Number.isFinite(explicitStatus) && explicitStatus > 0
      ? explicitStatus
      : statusByCode[code];
    return Object.assign(
      new Error(String(details?.message || 'Responses API request failed')),
      {
        ...(code ? { code } : {}),
        ...(status ? { status } : {}),
        error: details,
      },
    );
  }

  private parseResponsesUsage(usage: any): ChatResponse['usage'] {
    if (!usage || typeof usage !== 'object') return undefined;
    const details = usage.input_tokens_details || {};
    const promptTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? 0);
    const completionTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? 0);
    const cachedReadTokens = Number(details.cached_tokens ?? 0);
    const cachedWriteTokens = Number(
      details.cache_write_tokens
      ?? details.cached_creation_tokens
      ?? details.cache_creation_tokens
      ?? 0,
    );
    return {
      promptTokens,
      completionTokens,
      totalTokens: Number(usage.total_tokens ?? promptTokens + completionTokens),
      cachedReadTokens,
      cachedWriteTokens,
    };
  }

  private parseResponsesResponse(response: any): ChatResponse {
    const output = Array.isArray(response?.output) ? response.output : [];
    const textParts: string[] = [];
    const toolCalls: NonNullable<ChatResponse['toolCalls']> = [];

    for (const item of output) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        for (const block of item.content) {
          if (block?.type === 'output_text' && typeof block.text === 'string') {
            textParts.push(block.text);
          }
          if (block?.type === 'refusal' && typeof block.refusal === 'string') {
            textParts.push(block.refusal);
          }
        }
      }
      if (item?.type === 'function_call' && typeof item.name === 'string') {
        toolCalls.push({
          id: String(item.call_id || item.id || ''),
          type: 'function',
          function: {
            name: item.name,
            arguments: typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments ?? {}),
          },
        });
      }
    }

    const incompleteReason = String(response?.incomplete_details?.reason || '');
    const stopReason = response?.status === 'incomplete'
      ? incompleteReason === 'max_output_tokens' ? 'length' : incompleteReason || 'incomplete'
      : toolCalls.length > 0 ? 'tool_calls' : response?.status || undefined;
    const providerContent = toolCalls.length > 0
      ? output.filter((item: any) => this.isResponsesReplayItem(item)).map((item: any) => JSON.parse(JSON.stringify(item)))
      : undefined;

    return {
      content: this.visibleMessageContent({ content: textParts.join('') }),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: this.parseResponsesUsage(response?.usage),
      stopReason,
      ...(providerContent?.length ? { providerContent } : {}),
    };
  }

  private async chatResponses(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: AIRequestOptions,
  ): Promise<ChatResponse> {
    const body = this.buildResponsesRequestBody(messages, tools, false);
    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.responsesUrl,
      body,
    });
    let response;
    try {
      response = await axios.post(this.responsesUrl, body, {
        headers: this.headers,
        signal: options?.signal,
      });
    } catch (error) {
      recordEmptyResponseAttempt(() => {
        const errorResponse = (error as any)?.response;
        return {
          schemaVersion: 1,
          recordedAt: new Date().toISOString(),
          apiMode: 'responses',
          transport: 'http',
          outcome: errorResponse ? 'http_error' : 'transport_error',
          ...(errorResponse ? {
            http: {
              status: errorResponse.status,
              ...responseHeaderShape(errorResponse.headers),
            },
          } : {}),
          error: errorShape(error),
        };
      });
      throw error;
    }
    ContextDebugLogger.dumpSdkBoundary('after', undefined, { response: response.data });
    const failure = this.responsesFailureError(response.data);
    const parsed = failure ? undefined : this.parseResponsesResponse(response.data);
    recordEmptyResponseAttempt(() => ({
      schemaVersion: 1,
      recordedAt: new Date().toISOString(),
      apiMode: 'responses',
      transport: 'http',
      outcome: failure ? 'provider_failure' : 'response',
      http: {
        status: response.status,
        ...responseHeaderShape(response.headers),
      },
      response: summarizeResponsesShape(response.data),
      ...(parsed ? {
        parsed: {
          visibleChars: typeof parsed.content === 'string' ? parsed.content.length : 0,
          toolCallCount: parsed.toolCalls?.length || 0,
          ...(parsed.stopReason ? { stopReason: parsed.stopReason } : {}),
        },
      } : {}),
      ...(failure ? { error: errorShape(failure) } : {}),
    }));
    if (failure) throw failure;
    return parsed!;
  }

  private async chatStreamResponses(
    messages: Message[],
    tools?: ToolDefinition[],
    callbacks?: StreamCallbacks,
    options?: AIRequestOptions,
  ): Promise<ChatResponse> {
    const body = this.buildResponsesRequestBody(messages, tools, true);
    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.responsesUrl,
      body,
    });
    let response;
    try {
      response = await axios.post(this.responsesUrl, body, {
        headers: this.headers,
        responseType: 'stream',
        signal: options?.signal,
      });
    } catch (error) {
      recordEmptyResponseAttempt(() => {
        const errorResponse = (error as any)?.response;
        return {
          schemaVersion: 1,
          recordedAt: new Date().toISOString(),
          apiMode: 'responses',
          transport: 'sse',
          outcome: errorResponse ? 'http_error' : 'transport_error',
          ...(errorResponse ? {
            http: {
              status: errorResponse.status,
              ...responseHeaderShape(errorResponse.headers),
            },
          } : {}),
          error: errorShape(error),
        };
      });
      throw error;
    }

    return new Promise<ChatResponse>((resolve, reject) => {
      const stream = response.data;
      const contentStripper = new OpenAIThinkingStripper();
      const outputItems: any[] = [];
      let streamedVisibleText = '';
      let buffer = '';
      // Preserve incomplete UTF-8 sequences between network chunks.
      const decoder = new StringDecoder('utf8');
      let finalResponse: any;
      let settled = false;
      const diagnosticsEnabled = emptyResponseDiagnosticsEnabled();
      let diagnosticRecorded = false;
      let eventCount = 0;
      let malformedEventCount = 0;
      let visibleDeltaChars = 0;
      const eventTypes = new Set<string>();

      const emitVisibleText = (text: string) => {
        if (!text) return;
        streamedVisibleText += text;
        callbacks?.onText?.(text);
      };

      type StreamOutcome = 'terminal' | 'terminal_failure' | 'transport_error' | 'stream_without_terminal' | 'stream_aborted' | 'stream_closed';
      const recordStreamSample = (
        outcome: StreamOutcome,
        parsed?: ChatResponse,
        error?: Error,
      ) => {
        if (!diagnosticsEnabled || diagnosticRecorded) return;
        diagnosticRecorded = true;
        recordEmptyResponseAttempt(() => ({
          schemaVersion: 1,
          recordedAt: new Date().toISOString(),
          apiMode: 'responses',
          transport: 'sse',
          outcome,
          http: {
            status: response.status,
            ...responseHeaderShape(response.headers),
          },
          ...(finalResponse ? { response: summarizeResponsesShape(finalResponse) } : {}),
          stream: {
            eventCount,
            eventTypes: [...eventTypes].sort(),
            malformedEventCount,
            visibleDeltaChars,
            outputItemCount: outputItems.filter(Boolean).length,
          },
          ...(parsed ? {
            parsed: {
              visibleChars: typeof parsed.content === 'string' ? parsed.content.length : 0,
              toolCallCount: parsed.toolCalls?.length || 0,
              ...(parsed.stopReason ? { stopReason: parsed.stopReason } : {}),
            },
          } : {}),
          ...(error ? { error: errorShape(error) } : {}),
        }));
      };
      const finishError = (
        error: Error,
        outcome: StreamOutcome = 'transport_error',
      ) => {
        if (settled) return;
        recordStreamSample(outcome, undefined, error);
        settled = true;
        callbacks?.onError?.(error);
        reject(error);
      };
      const onAbort = () => stream.destroy(createAbortError());
      if (options?.signal?.aborted) onAbort();
      else options?.signal?.addEventListener('abort', onAbort, { once: true });

      const handleEvent = (event: any) => {
        if (diagnosticsEnabled) {
          eventCount += 1;
          eventTypes.add(classifyResponsesSseEventType(event?.type));
        }
        if (
          (event?.type === 'response.output_text.delta' || event?.type === 'response.refusal.delta')
          && typeof event.delta === 'string'
        ) {
          if (diagnosticsEnabled) visibleDeltaChars += event.delta.length;
          const visible = contentStripper.push(event.delta);
          emitVisibleText(visible);
          return;
        }
        if (event?.type === 'response.output_item.done' && event.item) {
          outputItems[Number(event.output_index ?? outputItems.length)] = event.item;
          return;
        }
        if (event?.type === 'response.completed' || event?.type === 'response.incomplete') {
          finalResponse = event.response;
          return;
        }
        if (event?.type === 'response.failed' || event?.type === 'error') {
          finalResponse = event?.response || {
            status: 'failed',
            error: event?.error || { message: event?.message },
          };
          const failure = this.responsesFailureError(finalResponse);
          finishError(failure || new Error('Responses API request failed'), 'terminal_failure');
        }
      };

      stream.on('data', (chunk: Buffer) => {
        buffer += decoder.write(chunk);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            handleEvent(JSON.parse(data));
          } catch {
            if (diagnosticsEnabled) malformedEventCount += 1;
            // Ignore malformed individual SSE events and continue the stream.
          }
        }
      });

      stream.on('end', () => {
        options?.signal?.removeEventListener('abort', onAbort);
        buffer += decoder.end();
        if (settled) return;
        const tail = contentStripper.flush();
        emitVisibleText(tail);
        if (!finalResponse) {
          finishError(
            new Error('Responses API stream ended without a terminal response'),
            'stream_without_terminal',
          );
          return;
        }
        const failure = this.responsesFailureError(finalResponse);
        if (failure) {
          finishError(failure, 'terminal_failure');
          return;
        }
        if (!Array.isArray(finalResponse.output) || finalResponse.output.length === 0) {
          finalResponse.output = outputItems.filter(Boolean);
        }
        const result = this.parseResponsesResponse(finalResponse);
        if (!result.content && streamedVisibleText) {
          result.content = this.visibleMessageContent({ content: streamedVisibleText });
        }
        ContextDebugLogger.dumpSdkBoundary('after', undefined, { response: finalResponse });
        recordStreamSample('terminal', result);
        settled = true;
        callbacks?.onComplete?.(result);
        resolve(result);
      });

      stream.on('error', (error: Error) => {
        options?.signal?.removeEventListener('abort', onAbort);
        finishError(error, options?.signal?.aborted ? 'stream_aborted' : 'transport_error');
      });

      stream.on('aborted', () => {
        options?.signal?.removeEventListener('abort', onAbort);
        finishError(new Error('Responses API stream aborted'), 'stream_aborted');
      });

      stream.on('close', () => {
        if (settled) return;
        options?.signal?.removeEventListener('abort', onAbort);
        finishError(new Error('Responses API stream closed before completion'), 'stream_closed');
      });
    });
  }

  private buildOpenAIProviderContent(message: any): Pick<ChatResponse, 'providerContent'> {
    const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
    const reasoningContent = typeof message?.reasoning_content === 'string'
      ? message.reasoning_content.trim()
      : '';
    if (!toolCalls.length || !reasoningContent) return {};
    return {
      providerContent: buildOpenAIProviderContentFromToolCalls(toolCalls, reasoningContent),
    };
  }
}

function extractOpenAIReasoningDelta(delta: any): string {
  if (typeof delta?.reasoning_content === 'string') return delta.reasoning_content;
  if (typeof delta?.reasoning === 'string') return '';
  if (typeof delta?.thinking === 'string') return '';
  return '';
}

function buildOpenAIProviderContentFromToolCalls(
  toolCalls: NonNullable<ChatResponse['toolCalls']>,
  reasoningContent: string,
): NonNullable<ChatResponse['providerContent']> {
  return [
    { type: 'openai_reasoning', reasoning_content: reasoningContent },
    ...toolCalls.map(toolCall => ({
      type: 'tool_use',
      id: toolCall.id,
      name: toolCall.function.name,
      input: parseOpenAIToolArguments(toolCall.function.arguments),
    })),
  ];
}

function parseOpenAIToolArguments(argumentsJson: string): unknown {
  try {
    return JSON.parse(argumentsJson || '{}');
  } catch {
    return argumentsJson || '';
  }
}

function stripOpenAIThinkingText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/^\s*<think\b[^>]*>[\s\S]*$/i, '');
}

function longestThinkTagPrefixSuffix(value: string, tag: string): number {
  const lower = value.toLowerCase();
  const max = Math.min(lower.length, tag.length - 1);
  for (let length = max; length > 0; length--) {
    if (lower.slice(-length) === tag.slice(0, length)) return length;
  }
  return 0;
}

class OpenAIThinkingStripper {
  private buffer = '';
  private inThinking = false;

  push(chunk: string): string {
    this.buffer += chunk;
    let output = '';

    while (this.buffer) {
      const lower = this.buffer.toLowerCase();

      if (this.inThinking) {
        const closeIndex = lower.indexOf('</think>');
        if (closeIndex < 0) {
          const keep = longestThinkTagPrefixSuffix(this.buffer, '</think>');
          this.buffer = keep > 0 ? this.buffer.slice(-keep) : '';
          break;
        }
        this.buffer = this.buffer.slice(closeIndex + '</think>'.length);
        this.inThinking = false;
        continue;
      }

      const openIndex = lower.indexOf('<think');
      if (openIndex < 0) {
        const keep = longestThinkTagPrefixSuffix(this.buffer, '<think');
        output += keep > 0 ? this.buffer.slice(0, -keep) : this.buffer;
        this.buffer = keep > 0 ? this.buffer.slice(-keep) : '';
        break;
      }

      output += this.buffer.slice(0, openIndex);
      const openEndIndex = this.buffer.indexOf('>', openIndex);
      if (openEndIndex < 0) {
        this.buffer = this.buffer.slice(openIndex);
        break;
      }
      this.buffer = this.buffer.slice(openEndIndex + 1);
      this.inThinking = true;
    }

    return output;
  }

  flush(): string {
    if (this.inThinking) {
      this.buffer = '';
      this.inThinking = false;
      return '';
    }
    const output = this.buffer;
    this.buffer = '';
    return output;
  }
}

function createAbortError(): Error {
  const err = new Error('请求已取消');
  err.name = 'AbortError';
  return err;
}
