import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, required } from './lib.mjs';

const args = parseArgs();
const graph = path.resolve(required(args, 'graph'));
const output = path.resolve(required(args, 'output'));
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/viewer');

if (!fs.existsSync(graph)) throw new Error(`Graph does not exist: ${graph}`);
if (!fs.existsSync(source)) throw new Error(`Viewer template does not exist: ${source}`);
if (fs.existsSync(output) && fs.readdirSync(output).length > 0 && !args.force) {
  throw new Error(`Output directory is not empty: ${output}. Pass --force to replace the template files.`);
}

fs.mkdirSync(output, { recursive: true });
fs.cpSync(source, output, { recursive: true, force: true });
const publicDir = path.join(output, 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(graph, path.join(publicDir, 'agent-codegraph.json'));

console.log(`Installed generic viewer at ${output}`);
console.log('Run npm install, then npm run dev.');
