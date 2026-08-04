import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectAgentRun } from '../core/agent-run-store';
import type { AgentRunPublicProjection, AgentRunRecord } from '../core/agent-run-types';
import { PathResolver } from '../utils/path-resolver';

export interface AgentRunProjectionSource {
  list(): AgentRunPublicProjection[];
  get(runId: string): AgentRunPublicProjection | undefined;
}

export function defaultAgentRunStoreFile(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(env.XIAOBA_AGENT_RUN_STORE_FILE
    || path.join(PathResolver.getRuntimeDataRoot(env), 'data', 'agent-runs.json'));
}

export function createFileProjectionSource(filePath = defaultAgentRunStoreFile()): AgentRunProjectionSource {
  const resolved = path.resolve(filePath);
  const read = (): AgentRunPublicProjection[] => {
    if (!fs.existsSync(resolved)) return [];
    const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8')) as { schemaVersion?: unknown; runs?: unknown };
    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.runs)) throw new Error('Agent Run store has an unsupported shape');
    return parsed.runs
      .map(record => projectAgentRun(record as AgentRunRecord))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.runId.localeCompare(b.runId));
  };
  return {
    list: read,
    get: runId => read().find(run => run.runId === runId),
  };
}
