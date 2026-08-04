#!/usr/bin/env node
import * as path from 'path';
import { createReviewAdapter } from './review-adapter';
import { ReviewRunStore } from './review-run-store';
import { ReviewApprovalInbox } from './review-approval-inbox';

interface ParsedArgs {
  command: string;
  positional: string[];
  options: Record<string, string | boolean>;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);
  if (!parsed.command || parsed.command === 'help' || parsed.options.help) {
    printHelp();
    return 0;
  }

  const workspace = path.resolve(stringOption(parsed, 'workspace') || 'review/evidence-envelopes');
  if (parsed.command === 'reply' || parsed.command === 'approve' || parsed.command === 'reject') {
    const storePath = path.resolve(stringOption(parsed, 'store') || path.join(workspace, 'review-runs.json'));
    const store = new ReviewRunStore(storePath);
    const reference = requirePositional(parsed, 0, 'runId, findingId, or review Session');
    const run = store.get(reference)
      || store.findByFindingId(reference)
      || store.list().find(item => item.sessionKey === reference);
    if (!run) throw new Error(`Unknown Review Run, Finding, or Session: ${reference}`);
    let message: string;
    if (parsed.command === 'reply') {
      message = requirePositional(parsed, 1, 'message');
    } else {
      const taskId = requirePositional(parsed, 1, 'taskId');
      const note = stringOption(parsed, 'note');
      if (parsed.command === 'reject' && !note) throw new Error('--note is required when rejecting a Task');
      message = parsed.command === 'approve'
        ? `批准 ${taskId}${note ? `：${note}` : ''}`
        : `拒绝 ${taskId}：${note}`;
    }
    const result = await new ReviewApprovalInbox({ workspace }).submit({
      sessionKey: run.sessionKey,
      message,
      actor: stringOption(parsed, 'actor') || 'human-approver',
    }, numberOption(parsed, 'timeout') || 30_000);
    if (!result.ok) throw new Error(`Approval command failed: ${result.errorCode}`);
    printJson(result.projection);
    return 0;
  }

  const adapter = await createReviewAdapter({
    workspace,
    storePath: stringOption(parsed, 'store'),
    skillDirectory: stringOption(parsed, 'skill-directory'),
    workingDirectory: stringOption(parsed, 'working-directory') || process.cwd(),
    sessionTTL: numberOption(parsed, 'session-ttl'),
  });

  try {
    if (parsed.command === 'trigger') {
      const findingId = requirePositional(parsed, 0, 'findingId');
      const envelopePath = path.resolve(stringOption(parsed, 'envelope')
        || path.join(workspace, 'findings', findingId));
      const run = await adapter.triggerFinding({
        findingId,
        envelopePath,
        goal: stringOption(parsed, 'goal'),
        actor: stringOption(parsed, 'actor') || 'human',
      });
      printJson(adapter.getProjection(run.runId));
      return 0;
    }

    if (parsed.command === 'heartbeat') {
      const result = await adapter.heartbeat(stringOption(parsed, 'actor') || 'review-heartbeat');
      printJson(result);
      return 0;
    }

    if (parsed.command === 'serve') {
      const interval = numberOption(parsed, 'interval') || 60_000;
      adapter.startHeartbeat(interval, stringOption(parsed, 'actor') || 'review-heartbeat');
      process.stdout.write(`${JSON.stringify({ status: 'running', intervalMs: interval })}\n`);
      await waitForTermination();
      return 0;
    }

    if (parsed.command === 'show') {
      const reference = requirePositional(parsed, 0, 'runId or findingId');
      const run = adapter.store.get(reference) || adapter.store.findByFindingId(reference);
      if (!run) throw new Error(`Unknown Review Run or Finding: ${reference}`);
      printJson(adapter.getProjection(run.runId));
      return 0;
    }

    if (parsed.command === 'recover') {
      const recovered = await adapter.recoverAll(stringOption(parsed, 'actor') || 'review-recovery');
      printJson(recovered.map(run => adapter.getProjection(run.runId)));
      return 0;
    }

    throw new Error(`Unknown command: ${parsed.command}`);
  } finally {
    await adapter.destroy();
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = '', ...rest] = argv;
  const positional: string[] = [];
  const options: Record<string, string | boolean> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const name = value.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith('--')) {
      options[name] = true;
    } else {
      options[name] = next;
      index += 1;
    }
  }
  return { command, positional, options };
}

function stringOption(parsed: ParsedArgs, name: string): string | undefined {
  const value = parsed.options[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberOption(parsed: ParsedArgs, name: string): number | undefined {
  const value = stringOption(parsed, name);
  if (!value) return undefined;
  const parsedNumber = Number(value);
  if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) throw new Error(`--${name} must be a positive number`);
  return parsedNumber;
}

function requirePositional(parsed: ParsedArgs, index: number, name: string): string {
  const value = parsed.positional[index]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function waitForTermination(): Promise<void> {
  return new Promise(resolve => {
    const finish = () => resolve();
    process.once('SIGINT', finish);
    process.once('SIGTERM', finish);
  });
}

function printHelp(): void {
  process.stdout.write([
    'Review Adapter commands:',
    '  trigger FINDING_ID [--workspace PATH] [--envelope PATH] [--goal TEXT] [--actor NAME]',
    '  heartbeat [--workspace PATH] [--actor NAME]',
    '  serve [--workspace PATH] [--interval MS]',
    '  reply RUN_ID_OR_FINDING_ID "批准 [TASK_ID] [备注]" [--actor NAME] [--timeout MS]',
    '  reply RUN_ID_OR_FINDING_ID "拒绝 [TASK_ID] 原因" [--actor NAME] [--timeout MS]',
    '  approve RUN_ID_OR_FINDING_ID TASK_ID [--actor NAME] [--note TEXT] [--timeout MS]',
    '  reject RUN_ID_OR_FINDING_ID TASK_ID --note TEXT [--actor NAME] [--timeout MS]',
    '  show RUN_ID_OR_FINDING_ID [--workspace PATH]',
    '  recover [--workspace PATH]',
  ].join('\n') + '\n');
}

if (require.main === module) {
  main().then(code => {
    process.exitCode = code;
  }).catch(error => {
    process.stderr.write(`${String(error?.message || error)}\n`);
    process.exitCode = 1;
  });
}
