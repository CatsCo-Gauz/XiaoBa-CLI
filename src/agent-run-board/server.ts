import * as crypto from 'node:crypto';
import type { Server } from 'node:http';
import express, { type Request } from 'express';
import { agentRunBoardHtml } from './page';
import { createFileProjectionSource, type AgentRunProjectionSource } from './source';

export interface AgentRunBoardOptions { host?: string; port?: number; apiKey?: string; storeFile?: string; source?: AgentRunProjectionSource }

function suppliedKey(req: Request): string {
  const direct = req.header('x-api-key');
  if (direct) return direct;
  const auth = req.header('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  if (auth.startsWith('Basic ')) {
    try { return Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':').slice(1).join(':'); } catch { return ''; }
  }
  return '';
}
function equalSecret(actual: string, expected: string): boolean {
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function createAgentRunBoardApp(options: AgentRunBoardOptions = {}): express.Express {
  const source = options.source || createFileProjectionSource(options.storeFile);
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'");
    if (!options.apiKey || equalSecret(suppliedKey(req), options.apiKey)) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="Agent Run Board"');
    return res.status(401).json({ error: 'Unauthorized' });
  });
  app.get('/health', (_req, res) => res.json({ ok: true, mode: 'read-only' }));
  app.get('/api/runs', (_req, res) => { try { res.json(source.list()); } catch { res.status(503).json({ error: 'Projection unavailable' }); } });
  app.get('/api/runs/:runId', (req, res) => { try { const run = source.get(req.params.runId); run ? res.json(run) : res.status(404).json({ error: 'Run not found' }); } catch { res.status(503).json({ error: 'Projection unavailable' }); } });
  app.get('/', (_req, res) => res.type('html').send(agentRunBoardHtml));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}
export async function startAgentRunBoard(options: AgentRunBoardOptions = {}): Promise<Server> {
  const host = options.host || '127.0.0.1';
  if (!isLoopbackHost(host) && !options.apiKey) {
    throw new Error('An API key is required when Agent Run Board binds to a non-loopback host');
  }
  const port = options.port ?? 3810;
  const app = createAgentRunBoardApp(options);
  return new Promise((resolve, reject) => { const server = app.listen(port, host, () => resolve(server)); server.once('error', reject); });
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
}
