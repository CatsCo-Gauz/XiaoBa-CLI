import * as path from 'node:path';
import type { Command } from 'commander';
import { AgentRunSupervisor } from '../agent-run/supervisor';
import { defaultAgentRunStoreFile } from '../agent-run-board/source';

interface CommonOptions { store?: string; workingDirectory?: string }

export function registerAgentRunCommand(program: Command): void {
  const run = program.command('run').description('Control durable Agent Runs');

  run.command('start')
    .requiredOption('--goal <text>', 'Immutable Run goal')
    .option('--type <type>', 'Run type', 'general')
    .option('--trigger-source <source>', 'Trigger source', 'cli')
    .option('--trigger-id <id>', 'Trigger identity')
    .option('--idempotency-key <key>', 'Stable Trigger idempotency key')
    .option('--max-iterations <count>', 'Maximum Worker iterations', parsePositiveInteger, 8)
    .option('--budget <count>', 'Maximum turn budget', parsePositiveInteger, 8)
    .option('--working-directory <path>', 'Worker working directory')
    .option('--store <path>', 'Agent Run store file')
    .option('--no-run', 'Create the Run without producing an Agent turn')
    .action(async options => print(await supervisor(options).start({
      goal: options.goal,
      runType: options.type,
      triggerSource: options.triggerSource,
      triggerId: options.triggerId,
      idempotencyKey: options.idempotencyKey,
      maxIterations: options.maxIterations,
      budget: options.budget,
      workingDirectory: options.workingDirectory,
      autoRun: options.run,
    })));

  run.command('resume <runId>')
    .description('Restore the bound Session without producing an Agent turn')
    .option('--working-directory <path>').option('--store <path>')
    .action(async (runId, options) => print(await supervisor(options).resume(runId)));

  run.command('send <runId> <message>')
    .description('Send user input to the bound Session and run the Goal Check loop')
    .option('--working-directory <path>').option('--store <path>')
    .action(async (runId, message, options) => print(await supervisor(options).send(runId, message)));

  run.command('wake <runId>')
    .description('Wake an existing Run and continue its Goal Check loop')
    .option('--working-directory <path>').option('--store <path>')
    .action(async (runId, options) => print(await supervisor(options).wake(runId)));

  run.command('context <runId> <text>')
    .description('Add context without producing an Agent turn')
    .option('--working-directory <path>').option('--store <path>')
    .action((runId, text, options) => print(supervisor(options).addContext(runId, text)));

  run.command('show <runId>').option('--working-directory <path>').option('--store <path>')
    .action((runId, options) => print(supervisor(options).show(runId)));

  run.command('list').option('--working-directory <path>').option('--store <path>')
    .action(options => print(supervisor(options).list()));

  run.command('cancel <runId>').option('--working-directory <path>').option('--store <path>')
    .action((runId, options) => print(supervisor(options).cancel(runId)));
}

function supervisor(options: CommonOptions): AgentRunSupervisor {
  return new AgentRunSupervisor({
    storePath: path.resolve(options.store || defaultAgentRunStoreFile()),
    workingDirectory: options.workingDirectory ? path.resolve(options.workingDirectory) : process.cwd(),
  });
}

function parsePositiveInteger(raw: string): number {
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('value must be a positive integer');
  return value;
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
