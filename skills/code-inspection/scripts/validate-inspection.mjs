import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInspectionReport } from './inspection-contract.mjs';

export function validateEnvelopeBindings(report, reportPath) {
  const errors = [];
  const reportDir = path.dirname(path.resolve(reportPath));
  for (let index = 0; index < (report.findings || []).length; index += 1) {
    const finding = report.findings[index];
    if (typeof finding?.envelopePath !== 'string' || finding.envelopePath.trim() === '') continue;
    const envelopePath = path.isAbsolute(finding.envelopePath)
      ? path.resolve(finding.envelopePath)
      : path.resolve(reportDir, finding.envelopePath);
    if (!fs.existsSync(envelopePath) || !fs.statSync(envelopePath).isDirectory()) {
      errors.push(`findings[${index}].envelopePath does not exist as a directory: ${envelopePath}`);
      continue;
    }
    const findingPath = path.join(envelopePath, 'finding.json');
    if (!fs.existsSync(findingPath)) {
      errors.push(`findings[${index}].envelopePath is missing finding.json: ${findingPath}`);
      continue;
    }
    try {
      const envelopeFinding = JSON.parse(fs.readFileSync(findingPath, 'utf8'));
      if (envelopeFinding.findingId !== finding.findingId) {
        errors.push(`findings[${index}].findingId does not match Envelope finding.json`);
      }
      if (!['INCOMPLETE', 'COMPLETE_ISSUE', 'COMPLETE_CLOSE'].includes(envelopeFinding.reviewState)) {
        errors.push(`findings[${index}] Envelope has an invalid reviewState`);
      }
    } catch (error) {
      errors.push(`findings[${index}] Envelope finding.json is invalid: ${String(error?.message || error)}`);
    }
  }
  return errors;
}

export function loadAndValidate(reportPath, options = {}) {
  const resolved = path.resolve(reportPath);
  const report = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const errors = validateInspectionReport(report);
  if (options.checkEnvelopes !== false) {
    errors.push(...validateEnvelopeBindings(report, resolved));
  }
  return { resolved, report, errors };
}

function main() {
  const args = process.argv.slice(2);
  const reportPath = args.find(item => !item.startsWith('--'));
  if (!reportPath) {
    console.error('Usage: node scripts/validate-inspection.mjs <inspection-report.json> [--skip-envelope-check]');
    process.exitCode = 2;
    return;
  }
  try {
    const result = loadAndValidate(reportPath, { checkEnvelopes: !args.includes('--skip-envelope-check') });
    if (result.errors.length > 0) {
      console.error(`INVALID ${result.resolved}`);
      result.errors.forEach(error => console.error(`- ${error}`));
      process.exitCode = 1;
      return;
    }
    console.log(`VALID ${result.resolved}`);
  } catch (error) {
    console.error(`INVALID ${path.resolve(reportPath)}`);
    console.error(`- ${String(error?.message || error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
