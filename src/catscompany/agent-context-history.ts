import type { ParsedCatsMessage } from './types';
import type { CatsAgentContextMessage } from './client';

type UnknownRecord = Record<string, unknown>;

export function isNativeFeishuGroupTrigger(
  msg: Pick<ParsedCatsMessage, 'chatType' | 'metadata' | 'seq'>,
): boolean {
  if (msg.chatType !== 'group' || msg.seq <= 0) return false;
  const metadata = asRecord(msg.metadata);
  return stringField(metadata, 'source_channel').toLowerCase() === 'feishu'
    && numberField(metadata, 'channel_native_group_binding_id') > 0
    && booleanField(metadata, 'channel_native_group_triggered');
}

/**
 * Returns durable Feishu group messages since the previous model trigger.
 * The server removes tool/runtime noise; every eligible participant message,
 * including other Agents and messages mentioning someone else, remains context.
 * This client-side pass only keeps replay bounded and idempotent.
 */
export function selectNativeFeishuGroupContext(
  history: CatsAgentContextMessage[],
  afterSeq = 0,
): string[] {
  const ordered = [...history].sort((a, b) => agentContextMessageSeq(a) - agentContextMessageSeq(b));
  const clearBoundarySeq = ordered.reduce((latest, message) => (
    isNativeFeishuClearBoundary(message) ? Math.max(latest, agentContextMessageSeq(message)) : latest
  ), 0);
  const effectiveAfterSeq = Math.max(afterSeq, clearBoundarySeq);
  return ordered
    .filter(message => agentContextMessageSeq(message) > effectiveAfterSeq)
    .filter(message => isEligibleParticipantMessage(message))
    .map(formatParticipantMessage)
    .filter((message): message is string => Boolean(message));
}

function isEligibleParticipantMessage(message: CatsAgentContextMessage): boolean {
  return message.context_eligible === true
    && message.context_role === 'user'
    // The trigger that already opened this Agent turn is stored separately;
    // replaying it would duplicate the current root input. Other @ messages
    // and other Agents' replies remain ordinary group context.
    && message.context_reason !== 'group_message_targets_agent';
}

export function isNativeFeishuClearBoundary(message: CatsAgentContextMessage): boolean {
  return message.context_eligible === true
    && message.context_role === 'user'
    && message.context_reason === 'group_message_targets_agent'
    && /^\/clear(?:\s|$)/i.test(extractMessageText(message));
}

function formatParticipantMessage(message: CatsAgentContextMessage): string {
  const text = extractMessageText(message);
  if (!text) return '';
  const metadata = asRecord(message.metadata);
  const identity = asRecord(metadata.catsco_identity);
  const actor = asRecord(identity.actor);
  const speaker = stringField(actor, 'display_name')
    || stringField(actor, 'username')
    || stringField(actor, 'user_id')
    || String(message.from_uid || '').trim()
    || 'User';
  return `[发言人: ${speaker}]\n${text}`;
}

function extractMessageText(message: CatsAgentContextMessage): string {
  if (Array.isArray(message.content_blocks)) {
    const blockText = message.content_blocks
      .map(block => asRecord(block))
      .filter(block => stringField(block, 'type') === 'text')
      .map(block => stringField(block, 'text'))
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (blockText) return blockText;
  }
  if (typeof message.content === 'string') {
    const text = message.content.trim();
    if (!text) return '';
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === 'string' ? parsed.trim() : text;
    } catch {
      return text;
    }
  }
  return '';
}

export function agentContextMessageSeq(message: CatsAgentContextMessage): number {
  return Number(message.seq_id || message.id || 0);
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function stringField(record: UnknownRecord, key: string): string {
  return typeof record[key] === 'string' ? String(record[key]).trim() : '';
}

function numberField(record: UnknownRecord, key: string): number {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : 0;
}

function booleanField(record: UnknownRecord, key: string): boolean {
  return record[key] === true || record[key] === 1 || record[key] === '1' || record[key] === 'true';
}
