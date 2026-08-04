#!/usr/bin/env node
import * as path from 'node:path';

import { AgentRunStore, projectAgentRun } from '../core/agent-run-store';
import { PathResolver } from '../utils/path-resolver';
import { InspectionRunController, type InspectionMode } from './inspection-run-controller';

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

  const workingDirectory = path.resolve(stringOption(parsed, 'working-directory') || process.cwd());
  const runtimeRoot = PathResolver.getRuntimeDataRoot(process.env, workingDirectory);
  const storePath = path.resolve(stringOption(parsed, 'store') || path.join(runtimeRoot, 'data', 'agent-runs.json'));
  const outputRoot = path.resolve(stringOption(parsed, 'output-root') || path.join(runtimeRoot, 'data', 'agent-run-artifacts'));

  if (parsed.command === 'list' || parsed.command === 'show') {
    const store = new AgentRunStore(storePath);
    if (parsed.command === 'list') {
      printJson(store.list().map(projectAgentRun).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      return 0;
    }
    const runId = requirePositional(parsed, 0, 'runId');
    const run = store.get(runId);
    if (!run) throw new Error(`Unknown Agent Run: ${runId}`);
    printJson(projectAgentRun(run));
    return 0;
  }

  const needsRuntime = parsed.command === 'trigger' && parsed.options['no-wake'] !== true
    || parsed.command === 'wake';
  const controller = needsRuntime
    ? await InspectionRunController.create({ workingDirectory, storePath, outputRoot })
    : new InspectionRunController({
      workingDirectory,
      storePath,
      outputRoot,
      sessionHost: {
        getOrCreate() {
          return {
            async handleRuntimeObservation() {
              throw new Error('This CLI action does not activate an Agent Session');
            },
          } as any;
        },
      },
    });

  try {
    if (parsed.command === 'trigger') {
      const repo = path.resolve(requirePositional(parsed, 0, 'repo'));
      const run = await controller.trigger({
        repo,
        snapshot: requireOption(parsed, 'snapshot'),
        mode: inspectionMode(requireOption(parsed, 'mode')),
        goal: stringOption(parsed, 'goal'),
        scope: csvOption(parsed, 'scope'),
        evidencePermissions: csvOption(parsed, 'permissions'),
        baseSnapshot: stringOption(parsed, 'base-snapshot'),
        topic: stringOption(parsed, 'topic'),
        actor: stringOption(parsed, 'actor') || 'human',
        wake: parsed.options['no-wake'] !== true,
      });
      printJson(controller.getProjection(run.runId));
      return 0;
    }

    if (parsed.command === 'wake') {
      const run = await controller.wake(requirePositional(parsed, 0, 'runId'));
      printJson(controller.getProjection(run.runId));
      return 0;
    }

    const runId = requirePositional(parsed, 0, 'runId');
    const run = controller.get(runId);
    if (parsed.command === 'event') {
      const summary = requirePositional(parsed, 1, 'summary');
      const updated = await controller.recordEvent(runId, run.sessionKey, {
        type: stringOption(parsed, 'type') || 'milestone',
        summary,
        createdAt: new Date().toISOString(),
      });
      printJson(controller.getProjection(updated.runId));
      return 0;
    }

    if (parsed.command === 'attach') {
      const artifactPath = path.resolve(requirePositional(parsed, 1, 'artifactPath'));
      const updated = await controller.attachArtifact(runId, run.sessionKey, {
        artifactId: stringOption(parsed, 'artifact-id') || path.basename(artifactPath).replace(/[^A-Za-z0-9._-]+/g, '_'),
        kind: stringOption(parsed, 'kind') || 'artifact',
        label: stringOption(parsed, 'label') || path.basename(artifactPath),
        ref: artifactPath,
        createdAt: new Date().toISOString(),
      });
      printJson(controller.getProjection(updated.runId));
      return 0;
    }

    if (parsed.command === 'goal-check') {
      const updated = await controller.recordGoalCheck(runId, run.sessionKey, {
        checkedAt: new Date().toISOString(),
        complete: booleanOption(parsed, 'complete'),
        capabilitiesExhausted: booleanOption(parsed, 'capabilities-exhausted', false),
        summary: requireOption(parsed, 'summary'),
        nextAction: stringOption(parsed, 'next-action'),
        blocker: stringOption(parsed, 'blocker'),
        stopCondition: stringOption(parsed, 'stop-condition'),
        nextWakeAt: stringOption(parsed, 'next-wake-at'),
      });
      printJson(controller.getProjection(updated.runId));
      return 0;
    }

    throw new Error(`Unknown command: ${parsed.command}`);
  } finally {
    await controller.destroy();
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
    if (!next || next.startsWith('--')) options[name] = true;
    else {
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

function requireOption(parsed: ParsedArgs, name: string): string {
  const value = stringOption(parsed, name);
  if (!value) throw new Error(`--${name} is required`);
  return value;
}

function requirePositional(parsed: ParsedArgs, index: number, name: string): string {
  const value = parsed.positional[index]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function csvOption(parsed: ParsedArgs, name: string): string[] | undefined {
  const value = stringOption(parsed, name);
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : undefined;
}

function booleanOption(parsed: ParsedArgs, name: string, fallback?: boolean): boolean {
  const value = parsed.options[name];
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`--${name} is required`);
  }
  if (value === true) return true;
  if (/^(1|true|yes)$/i.test(String(value))) return true;
  if (/^(0|false|no)$/i.test(String(value))) return false;
  throw new Error(`--${name} must be true or false`);
}

function inspectionMode(value: string): InspectionMode {
  if (value === 'baseline' || value === 'change' || value === 'focus') return value;
  throw new Error('--mode must be baseline, change, or focus');
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp(): void {
  process.stdout.write([
    'Inspection Agent Run commands:',
    '  trigger REPO --snapshot ID --mode baseline|change|focus [--goal TEXT] [--scope CSV] [--permissions CSV] [--base-snapshot ID] [--topic TEXT] [--no-wake]',
    '  wake RUN_ID',
    '  list',
    '  show RUN_ID',
    '  event RUN_ID "SUMMARY" [--type TYPE]',
    '  attach RUN_ID ARTIFACT_PATH [--kind inspection_report|html_report|evidence] [--artifact-id ID] [--label TEXT]',
    '  goal-check RUN_ID --complete true|false --summary TEXT [--next-action TEXT] [--blocker TEXT] [--stop-condition TEXT] [--capabilities-exhausted true|false]',
    '  common options: --store PATH --output-root PATH --working-directory PATH --actor NAME',
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
