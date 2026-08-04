import { startAgentRunBoard } from '../agent-run-board';

export interface AgentRunBoardCommandOptions { host?: string; port?: string; apiKey?: string; store?: string }
export async function agentRunBoardCommand(options: AgentRunBoardCommandOptions): Promise<void> {
  const port = options.port === undefined ? 3810 : Number(options.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('port must be an integer from 0 to 65535');
  const apiKey = options.apiKey ?? process.env.XIAOBA_AGENT_RUN_BOARD_API_KEY;
  const server = await startAgentRunBoard({ host: options.host, port, apiKey, storeFile: options.store });
  const address = server.address();
  const boundPort = address && typeof address !== 'string' ? address.port : port;
  process.stdout.write(`Agent Run Board listening on http://${options.host || '127.0.0.1'}:${boundPort} (read-only)\n`);
}
