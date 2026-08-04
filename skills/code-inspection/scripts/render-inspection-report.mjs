import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidInspectionReport } from './inspection-contract.mjs';
import { loadAndValidate } from './validate-inspection.mjs';

const MODE_LABELS = { baseline: '首次基线', change: '变更审视', focus: '专项深挖' };

export function renderInspectionReport(report) {
  assertValidInspectionReport(report);
  const evidenceById = new Map(report.evidence.map(item => [item.id, item]));
  const findingTone = report.findings.length > 0 ? 'warn' : 'ok';
  const sourceLine = report.mode === 'change'
    ? `${escapeHtml(report.source.baseSnapshot)} → ${escapeHtml(report.source.snapshot)}`
    : escapeHtml(report.source.snapshot);

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(report.inspectionId)} · 代码巡检报告</title>
<style>
:root{--ink:#172a31;--muted:#667b81;--line:#cfe0dc;--bg:#edf3f2;--panel:#fff;--teal:#096a72;--mint:#38a78a;--amber:#c28128;--rose:#bd5962;--soft:#edf8f5}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.58 system-ui,-apple-system,"Noto Sans CJK SC","Microsoft YaHei",sans-serif}.page{max-width:1180px;margin:28px auto;padding:0 22px 40px}.hero{background:linear-gradient(135deg,#083d49,#0b7379);color:white;padding:28px;border-radius:18px;box-shadow:0 14px 35px #183b4030}.eyebrow{opacity:.78;font-size:12px;letter-spacing:.14em;text-transform:uppercase}.hero h1{font-size:30px;margin:7px 0}.hero p{margin:5px 0;opacity:.9}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.chip{border:1px solid #ffffff55;border-radius:999px;padding:5px 10px;font-size:12px}.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;margin-top:14px}.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 5px 18px #24474c0b}.span4{grid-column:span 4}.span6{grid-column:span 6}.span8{grid-column:span 8}.span12{grid-column:span 12}h2{font-size:17px;margin:0 0 10px;color:var(--teal)}h3{font-size:14px;margin:14px 0 5px}.metric{font-size:29px;font-weight:760;line-height:1}.metric.ok{color:var(--mint)}.metric.warn{color:var(--amber)}.muted{color:var(--muted);font-size:13px}.list{margin:5px 0 0;padding-left:20px}.list li{margin:5px 0}.empty{color:var(--muted);background:#f6f9f8;border-radius:9px;padding:9px}.evidence,.finding,.unknown,.observation{border-top:1px solid #e4ecea;padding:11px 0}.evidence:first-child,.finding:first-child,.unknown:first-child,.observation:first-child{border-top:0}.badge{display:inline-block;padding:2px 7px;border-radius:999px;background:#e7f4f1;color:#08705f;font-size:11px;font-weight:700}.badge.warn{background:#fff2dc;color:#9a641b}.badge.rose{background:#fdecef;color:#a84652}.refs{font-size:12px;color:var(--muted);margin-top:4px}.coverage{display:grid;grid-template-columns:1fr 1fr;gap:12px}.coverage>div{background:#f6f9f8;border-radius:10px;padding:10px}.stop{border-left:5px solid var(--amber)}footer{margin-top:17px;color:var(--muted);font-size:12px;text-align:center}@media(max-width:760px){.span4,.span6,.span8,.span12{grid-column:span 12}.coverage{grid-template-columns:1fr}.hero h1{font-size:24px}}@media print{@page{size:A4;margin:13mm}body{background:white;font-size:11px}.page{max-width:none;margin:0;padding:0}.hero{box-shadow:none;border-radius:10px;padding:18px}.hero h1{font-size:22px}.card{box-shadow:none;break-inside:avoid;padding:12px}.grid{gap:8px}.metric{font-size:22px}footer{display:none}}
</style></head><body><main class="page">
<section class="hero"><div class="eyebrow">Evidence-backed code inspection</div><h1>${escapeHtml(report.summary.conclusion)}</h1><p>${escapeHtml(report.goal)}</p><div class="chips"><span class="chip">${MODE_LABELS[report.mode]}</span><span class="chip">${escapeHtml(report.source.repo)}</span><span class="chip">${sourceLine}</span><span class="chip">${escapeHtml(report.inspectionId)}</span></div></section>
<section class="grid">
<article class="card span4"><h2>Finding</h2><div class="metric ${findingTone}">${report.findings.length}</div><p class="muted">仅统计已注册并绑定 Envelope 的具体 Finding</p></article>
<article class="card span4"><h2>证据</h2><div class="metric ok">${report.evidence.length}</div><p class="muted">均带来源、取得方法与局限</p></article>
<article class="card span4"><h2>未知</h2><div class="metric warn">${report.unknowns.length}</div><p class="muted">未被“未发现”掩盖的剩余问题</p></article>
<article class="card span8"><h2>范围与权限</h2><h3>包含</h3>${renderList(report.scope.included)}<h3>排除</h3>${renderList(report.scope.excluded)}<h3>允许的证据</h3><div>${report.scope.evidencePermissions.map(item => `<span class="badge">${escapeHtml(item)}</span>`).join(' ')}</div>${report.scope.topic ? `<h3>专项主题</h3><p>${escapeHtml(report.scope.topic)}</p>` : ''}</article>
<article class="card span4 stop"><h2>停止原因</h2><p>${escapeHtml(report.stop.reason)}</p><h3>满足条件</h3><p>${escapeHtml(report.stop.condition)}</p><h3>残余风险</h3><p class="muted">${escapeHtml(report.stop.residualRisk)}</p></article>
<article class="card span12"><h2>覆盖情况</h2><div class="coverage"><div><span class="badge">已审视</span>${renderList(report.coverage.reviewed)}</div><div><span class="badge warn">未审视</span>${renderList(report.coverage.notReviewed)}</div></div><h3>限制</h3>${renderList(report.coverage.limitations)}</article>
<article class="card span6"><h2>上下文观察</h2>${renderObservations(report.observations)}</article>
<article class="card span6"><h2>材料未知</h2>${renderUnknowns(report.unknowns)}</article>
<article class="card span12"><h2>证据索引</h2>${renderEvidence(report.evidence)}</article>
<article class="card span12"><h2>已注册 Finding</h2>${renderFindings(report.findings, evidenceById)}</article>
</section><footer>生成于 ${escapeHtml(report.generatedAt)}。本报告只对记录的版本、范围和证据负责。</footer></main></body></html>`;
}

function renderList(items) {
  if (!items.length) return '<div class="empty">无</div>';
  return `<ul class="list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}
function renderObservations(items) {
  if (!items.length) return '<div class="empty">没有保留的上下文观察。</div>';
  return items.map(item => `<div class="observation"><span class="badge ${item.disposition === 'unknown' ? 'warn' : ''}">${escapeHtml(item.disposition)}</span><p>${escapeHtml(item.statement)}</p><div class="refs">证据：${item.evidenceRefs.map(escapeHtml).join('、') || '无直接证据'}</div></div>`).join('');
}
function renderUnknowns(items) {
  if (!items.length) return '<div class="empty">没有记录的材料未知。</div>';
  return items.map(item => `<div class="unknown"><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.whyItMatters)}</p><div class="refs">下一证据：${escapeHtml(item.nextEvidence)}</div></div>`).join('');
}
function renderEvidence(items) {
  if (!items.length) return '<div class="empty">尚未登记证据。</div>';
  return items.map(item => `<div class="evidence"><span class="badge">${escapeHtml(item.type)}</span> <strong>${escapeHtml(item.id)} · ${escapeHtml(item.title)}</strong><p>${escapeHtml(item.source)}</p><div class="refs">取得：${escapeHtml(item.method)}。局限：${escapeHtml(item.limitations)}</div></div>`).join('');
}
function renderFindings(items, evidenceById) {
  if (!items.length) return '<div class="empty">本次覆盖内没有具体问题通过 Finding 门槛。这不表示代码没有问题。</div>';
  return items.map(item => `<div class="finding"><span class="badge rose">${escapeHtml(item.findingId)}</span> <strong>${escapeHtml(item.title)}</strong><h3>观察</h3><p>${escapeHtml(item.observation)}</p><h3>期望依据</h3><p>${escapeHtml(item.expectedBasis)}</p><h3>影响边界</h3><p>${escapeHtml(item.impact)}；${escapeHtml(item.scope)}</p><div class="refs">证据：${item.evidenceRefs.map(id => escapeHtml(evidenceById.get(id)?.title || id)).join('、')}。Envelope：${escapeHtml(item.envelopePath)}</div></div>`).join('');
}
export function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function parseArgs(argv) {
  const args = { input: argv[0] };
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--output') args.output = argv[++i];
  }
  return args;
}
function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.input || !args.output) throw new Error('Usage: node scripts/render-inspection-report.mjs <inspection-report.json> --output <report.html>');
    const validation = loadAndValidate(args.input);
    if (validation.errors.length > 0) {
      throw new Error(`Refusing to render invalid inspection report:\n- ${validation.errors.join('\n- ')}`);
    }
    const output = path.resolve(args.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, renderInspectionReport(validation.report), 'utf8');
    console.log(`Rendered ${output}`);
  } catch (error) {
    console.error(String(error?.message || error));
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
