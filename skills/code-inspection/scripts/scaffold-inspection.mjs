import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    out[key] = value;
  }
  return out;
}

export function buildScaffold(options, now = new Date()) {
  const mode = String(options.mode || 'baseline');
  if (!['baseline', 'change', 'focus'].includes(mode)) {
    throw new Error('--mode must be baseline, change, or focus');
  }
  if (!options.repo) throw new Error('--repo is required');
  if (!options.snapshot) throw new Error('--snapshot is required');
  if (!options.goal) throw new Error('--goal is required');
  if (mode === 'change' && !options['base-snapshot']) {
    throw new Error('--base-snapshot is required for change mode');
  }
  if (mode === 'focus' && !options.topic) {
    throw new Error('--topic is required for focus mode');
  }

  return {
    schemaVersion: 1,
    inspectionId: options.id || `inspection-${randomUUID()}`,
    generatedAt: now.toISOString(),
    mode,
    goal: String(options.goal),
    source: {
      repo: path.resolve(String(options.repo)),
      snapshot: String(options.snapshot),
      snapshotType: String(options['snapshot-type'] || 'declared'),
      ...(mode === 'change' ? { baseSnapshot: String(options['base-snapshot']) } : {}),
      mutable: options.mutable === true,
      ...(options.mutable === true ? { mutabilityLimitation: String(options['mutability-limitation'] || 'Live working tree may change after inspection starts.') } : {}),
    },
    scope: {
      included: splitList(options.include, ['.']),
      excluded: splitList(options.exclude, []),
      evidencePermissions: splitList(options.permissions, ['source', 'tests', 'config', 'docs']),
      ...(mode === 'focus' ? { topic: String(options.topic) } : {}),
    },
    summary: {
      conclusion: 'Inspection has not started.',
      findingCount: 0,
    },
    evidence: [],
    observations: [],
    findings: [],
    coverage: {
      reviewed: [],
      notReviewed: [],
      limitations: [],
    },
    unknowns: [],
    stop: {
      reason: 'Not started.',
      condition: 'Run the inspection and replace this scaffold state.',
      residualRisk: 'Unknown until evidence work begins.',
    },
  };
}

function splitList(value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') return [...fallback];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

export function writeScaffold(options) {
  if (!options['output-dir']) throw new Error('--output-dir is required');
  const outputDir = path.resolve(String(options['output-dir']));
  const reportsDir = path.join(outputDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(outputDir, 'inspection-report.json');
  if (fs.existsSync(reportPath) && options.force !== true) {
    throw new Error(`Refusing to overwrite existing report: ${reportPath}. Pass --force to replace it.`);
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(buildScaffold(options), null, 2)}\n`, 'utf8');
  return reportPath;
}

function main() {
  try {
    const reportPath = writeScaffold(parseArgs(process.argv.slice(2)));
    console.log(`Created ${reportPath}`);
  } catch (error) {
    console.error(String(error?.message || error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
