import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs, required } from './lib.mjs';

const args = parseArgs();
const analysis = path.resolve(required(args, 'analysis'));
const profile = path.resolve(required(args, 'profile'));
const outputDir = path.resolve(required(args, 'output-dir'));
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const evidence = path.join(outputDir, 'code-evidence.json');
const graph = path.join(outputDir, 'agent-codegraph.json');

fs.mkdirSync(outputDir, { recursive: true });

function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...scriptArgs], {
    encoding: 'utf8',
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run('build-evidence.mjs', ['--analysis', analysis, '--profile', profile, '--output', evidence]);
run('merge-codegraph.mjs', ['--evidence', evidence, '--profile', profile, '--output', graph]);
run('validate-codegraph.mjs', [graph]);

if (typeof args.baseline === 'string') {
  run('detect-drift.mjs', [
    '--baseline', path.resolve(args.baseline),
    '--current', evidence,
    '--output', path.join(outputDir, 'drift-report.json'),
  ]);
}

console.log(`Code graph refresh completed in ${outputDir}`);
