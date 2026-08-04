import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildScaffold, writeScaffold } from './scaffold-inspection.mjs';
import { validateInspectionReport } from './inspection-contract.mjs';
import { renderInspectionReport } from './render-inspection-report.mjs';
import { loadAndValidate, validateEnvelopeBindings } from './validate-inspection.mjs';

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: String(error?.stack || error) });
  }
}

const fixedNow = new Date('2026-07-27T00:00:00.000Z');
const baseOptions = {
  repo: '/tmp/example-repo',
  snapshot: 'tree-sha256:abc123',
  mode: 'baseline',
  goal: '建立最小可信代码理解并识别具体问题',
};

check('baseline scaffold is contract-valid', () => {
  const report = buildScaffold(baseOptions, fixedNow);
  assert.deepEqual(validateInspectionReport(report), []);
  assert.equal(report.mode, 'baseline');
  assert.equal(report.summary.findingCount, 0);
});

check('change mode requires base snapshot', () => {
  assert.throws(() => buildScaffold({ ...baseOptions, mode: 'change' }, fixedNow), /base-snapshot/);
  const report = buildScaffold({ ...baseOptions, mode: 'change', 'base-snapshot': 'commit:before' }, fixedNow);
  assert.deepEqual(validateInspectionReport(report), []);
});

check('focus mode requires topic', () => {
  assert.throws(() => buildScaffold({ ...baseOptions, mode: 'focus' }, fixedNow), /topic/);
  const report = buildScaffold({ ...baseOptions, mode: 'focus', topic: 'security' }, fixedNow);
  assert.deepEqual(validateInspectionReport(report), []);
});

check('qualified Finding requires evidence and Envelope binding', () => {
  const report = buildScaffold(baseOptions, fixedNow);
  report.summary = { conclusion: '发现一个需要通用 Review 确认的问题。', findingCount: 1 };
  report.evidence = [{
    id: 'E-1', type: 'DIRECT', title: '写入路径源码', source: 'src/write.ts:10-20',
    method: 'source reading', limitations: '未执行生产写入',
  }];
  report.findings = [{
    findingId: 'F-1', title: '写入路径绕过约束', observation: '一个写入入口未调用声明的校验器。',
    expectedBasis: '仓库约定所有写入必须通过 validateWrite。', evidenceRefs: ['E-1'],
    impact: '可能写入不满足约束的数据', scope: '仅限 writeFast 入口',
    counterEvidence: [], unknowns: ['运行配置是否关闭该入口'], envelopePath: '/tmp/findings/F-1',
    registrationEvidenceRef: 'E-1',
  }];
  assert.deepEqual(validateInspectionReport(report), []);

  const broken = structuredClone(report);
  broken.findings[0].expectedBasis = '';
  broken.findings[0].evidenceRefs = ['E-missing'];
  const errors = validateInspectionReport(broken).join('\n');
  assert.match(errors, /expectedBasis/);
  assert.match(errors, /unknown evidence ID/);
});

check('context observations cannot masquerade as candidate Finding state', () => {
  const report = buildScaffold(baseOptions, fixedNow);
  report.observations = [{ id: 'O-1', statement: '模块间存在循环 import。', disposition: 'candidate', evidenceRefs: [] }];
  assert.match(validateInspectionReport(report).join('\n'), /context or unknown/);
});

check('mutable source requires an explicit limitation', () => {
  const report = buildScaffold(baseOptions, fixedNow);
  report.source.mutable = true;
  assert.match(validateInspectionReport(report).join('\n'), /mutabilityLimitation/);
});

check('renderer escapes evidence and user-controlled text', () => {
  const report = buildScaffold(baseOptions, fixedNow);
  report.summary.conclusion = '<script>alert(1)</script>';
  const rendered = renderInspectionReport(report);
  assert.doesNotMatch(rendered, /<script>alert\(1\)<\/script>/);
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(rendered, /这不表示代码没有问题/);
});

check('Envelope binding must exist and match the registered Finding ID', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspection-envelope-test-'));
  try {
    const envelope = path.join(root, 'envelope');
    fs.mkdirSync(envelope);
    fs.writeFileSync(path.join(envelope, 'finding.json'), JSON.stringify({
      findingId: 'F-1', reviewState: 'INCOMPLETE',
    }), 'utf8');
    const report = buildScaffold(baseOptions, fixedNow);
    report.summary = { conclusion: 'Finding 已注册。', findingCount: 1 };
    report.evidence = [{ id: 'E-REG', type: 'DIRECT', title: '注册记录', source: 'registry', method: 'isolated register', limitations: 'demo' }];
    report.findings = [{
      findingId: 'F-1', title: '测试 Finding', observation: '观察', expectedBasis: '约束', impact: '影响', scope: '范围',
      evidenceRefs: ['E-REG'], counterEvidence: [], unknowns: [], envelopePath: envelope, registrationEvidenceRef: 'E-REG',
    }];
    assert.deepEqual(validateInspectionReport(report), []);
    const reportPath = path.join(root, 'inspection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report), 'utf8');
    assert.deepEqual(validateEnvelopeBindings(report, reportPath), []);
    const wrong = structuredClone(report);
    wrong.findings[0].findingId = 'F-OTHER';
    assert.match(validateEnvelopeBindings(wrong, reportPath).join('\n'), /does not match/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

check('scaffold, validate, and render work end to end', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspection-self-test-'));
  try {
    const reportPath = writeScaffold({ ...baseOptions, 'output-dir': root });
    assert.equal(loadAndValidate(reportPath).errors.length, 0);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const html = renderInspectionReport(report);
    const output = path.join(root, 'reports', 'inspection-report.html');
    fs.writeFileSync(output, html, 'utf8');
    assert.ok(fs.statSync(output).size > 4000);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const failed = checks.filter(item => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}`);
  if (!item.ok) console.error(item.error);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length > 0) process.exitCode = 1;
