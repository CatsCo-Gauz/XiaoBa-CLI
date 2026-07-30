import { afterEach, beforeEach, describe, test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('Logger', () => {
  const runtimeRootKeys = [
    'XIAOBA_USER_DATA_DIR',
    'CATSCO_USER_DATA_DIR',
    'XIAOBA_ELECTRON_USER_DATA_DIR',
    'XIAOBA_RUNTIME_ROOT',
  ] as const;
  let testRoot: string;
  let originalCwd: string;
  let originalRuntimeRoots: Record<string, string | undefined>;
  let Logger: any;

  beforeEach(() => {
    originalCwd = process.cwd();
    originalRuntimeRoots = Object.fromEntries(
      runtimeRootKeys.map(key => [key, process.env[key]]),
    );
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoba-logger-'));
    process.env.XIAOBA_USER_DATA_DIR = testRoot;
    delete process.env.CATSCO_USER_DATA_DIR;
    delete process.env.XIAOBA_ELECTRON_USER_DATA_DIR;
    delete process.env.XIAOBA_RUNTIME_ROOT;
    process.chdir(testRoot);
  });

  afterEach(async () => {
    Logger?.closeLogFile();
    await waitForFlush();
    process.chdir(originalCwd);
    for (const key of runtimeRootKeys) {
      const value = originalRuntimeRoots[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (testRoot && fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  test('runtime log lines include session_id from async context', async () => {
    delete require.cache[require.resolve('../src/utils/logger')];
    delete require.cache[require.resolve('../src/utils/session-turn-logger')];
    Logger = require('../src/utils/logger').Logger;
    const { SessionTurnLogger } = require('../src/utils/session-turn-logger');

    Logger.openLogFile('test', undefined, true);
    const sessionLogger = new SessionTurnLogger('feishu', 'user:ou_demo');

    Logger.info('outside context');
    await Logger.withSessionContext('user:ou_demo', sessionLogger, async () => {
      Logger.info('inside context');
      await Promise.resolve();
      Logger.info('still inside context');
    });

    const globalLogPath = Logger.getLogFilePath();
    const sessionLogPath = sessionLogger.getLogFilePath();
    assert.ok(globalLogPath);
    assert.ok(sessionLogPath);

    Logger.closeLogFile();
    await waitForFlush();

    const globalContent = fs.readFileSync(globalLogPath, 'utf-8');
    assert.match(globalContent, /\[INFO\] outside context/);
    assert.doesNotMatch(globalContent, /inside context/);
    assert.doesNotMatch(globalContent, /still inside context/);

    const sessionEntries = fs.readFileSync(sessionLogPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
    assert.deepStrictEqual(
      sessionEntries.map(entry => ({
        entry_type: entry.entry_type,
        level: entry.level,
        message: entry.message,
        session_id: entry.session_id,
      })),
      [
        {
          entry_type: 'runtime',
          level: 'INFO',
          message: 'inside context',
          session_id: 'user:ou_demo',
        },
        {
          entry_type: 'runtime',
          level: 'INFO',
          message: 'still inside context',
          session_id: 'user:ou_demo',
        },
      ],
    );
  });

  test('persists the optional canonical episode_id while remaining compatible with legacy entries', () => {
    delete require.cache[require.resolve('../src/utils/session-turn-logger')];
    const { SessionTurnLogger } = require('../src/utils/session-turn-logger');
    const sessionLogger = new SessionTurnLogger('chat', 'canonical-episode');

    sessionLogger.logTurn(
      'deliver the artifact',
      'delivered',
      [],
      { prompt: 1, completion: 1 },
      { episodeId: 'episode:1:canonical' },
    );

    const entry = JSON.parse(fs.readFileSync(sessionLogger.getLogFilePath(), 'utf8').trim());
    assert.equal(entry.episode_id, 'episode:1:canonical');
    assert.equal('episode_id' in entry, true);
    const signalPath = path.join(testRoot, 'data', 'session-log-append.signal');
    assert.equal(fs.existsSync(signalPath), true);
    assert.match(fs.readFileSync(signalPath, 'utf8'), /^\d+\n$/);
  });

  test('does not signal when the JSONL append fails', () => {
    delete require.cache[require.resolve('../src/utils/session-turn-logger')];
    const { SessionTurnLogger } = require('../src/utils/session-turn-logger');
    const sessionLogger = new SessionTurnLogger('chat', 'failed-append');
    const logDirectory = path.dirname(sessionLogger.getLogFilePath());
    fs.rmSync(logDirectory, { recursive: true, force: true });
    fs.writeFileSync(logDirectory, 'blocks directory recreation');

    const originalConsoleError = console.error;
    console.error = () => undefined;
    try {
      sessionLogger.logTurn('input', 'output', [], { prompt: 1, completion: 1 });
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(
      fs.existsSync(path.join(testRoot, 'data', 'session-log-append.signal')),
      false,
    );
  });

  test('keeps the JSONL append successful when the signal path is unavailable', () => {
    delete require.cache[require.resolve('../src/utils/session-turn-logger')];
    const { SessionTurnLogger } = require('../src/utils/session-turn-logger');
    const sessionLogger = new SessionTurnLogger('chat', 'signal-unavailable');
    fs.writeFileSync(path.join(testRoot, 'data'), 'blocks signal directory');

    const originalConsoleError = console.error;
    console.error = () => undefined;
    try {
      sessionLogger.logTurn('input', 'output', [], { prompt: 1, completion: 1 });
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(fs.existsSync(sessionLogger.getLogFilePath()), true);
    assert.match(fs.readFileSync(sessionLogger.getLogFilePath(), 'utf8'), /"entry_type":"turn"/);
  });

});

function waitForFlush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 20));
}
