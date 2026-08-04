import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, required } from './lib.mjs';

const args = parseArgs();
const repo = path.resolve(required(args, 'repo'));
const output = path.resolve(required(args, 'output'));
const level = String(args.level || '2');

if (!fs.existsSync(repo)) throw new Error(`Repository does not exist: ${repo}`);
fs.mkdirSync(output, { recursive: true });

const candidates = [
  typeof args.cants === 'string' ? args.cants : null,
  process.env.VIRTUAL_ENV
    ? path.join(process.env.VIRTUAL_ENV, process.platform === 'win32' ? 'Scripts/cants.exe' : 'bin/cants')
    : null,
  path.join(repo, '.codegraph-venv', process.platform === 'win32' ? 'Scripts/cants.exe' : 'bin/cants'),
  process.platform === 'win32' ? 'cants.exe' : 'cants',
].filter(Boolean);

const analyzerArgs = [
  '-i', repo,
  '-o', output,
  '-a', level,
  '--tsc-only',
  args['include-tests'] ? '--include-tests' : '--skip-tests',
];
if (args.eager) analyzerArgs.push('--eager');
if (args['no-build']) analyzerArgs.push('--no-build');

let lastError;
for (const command of candidates) {
  const result = spawnSync(command, analyzerArgs, {
    cwd: repo,
    encoding: 'utf8',
    stdio: 'inherit',
    shell: false,
  });
  if (!result.error && result.status === 0) {
    const artifact = path.join(output, 'analysis.json');
    if (!fs.existsSync(artifact)) throw new Error(`Analyzer succeeded but did not create ${artifact}`);
    console.log(`Wrote ${artifact}`);
    process.exit(0);
  }
  lastError = result.error || new Error(`${command} exited with ${result.status}`);
  if (result.error?.code !== 'ENOENT') break;
}

throw new Error(
  `Unable to run cants: ${lastError?.message || 'unknown error'}\n` +
  'Install codeanalyzer-typescript in a virtual environment or pass --cants <path>.',
);
