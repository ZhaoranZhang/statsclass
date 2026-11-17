'use strict';
// UI state, rendering and event handlers.
const $ = id => document.getElementById(id);
const arr = DATA.exercise_mood;
const fmt = v => Number.isFinite(v) ? v.toFixed(3).replace(/^(-?)0\./, '$1.').replace('-', '−') : '—';
const pformat = p => p < .001 ? '&lt; .001' : fmt(p);
const selections = { pearson: { x: 'exercise', y: 'depression', method: 'Pearson', name: 'r', desc: '两个连续变量，观察线性关系。' }, spearman: { x: 'sleep_quality', y: 'depression', method: 'Spearman', name: 'rₛ', desc: '睡眠质量为 1–5 级顺序变量：先排名，再计算等级相关。' }, point: { x: 'club', y: 'depression', method: '点二列', name: 'rpb', desc: '社团参与为 0 / 1 变量，另一变量是连续的抑郁得分。计算上等价于 Pearson 相关。' } };
let active = 'pearson';
// Classroom example: one correlation method at a time.
function drawSingle() {
  const choice = selections[active];
  const x = arr[choice.x];
  const y = arr[choice.y];
  const xForCorrelation = active === 'spearman' ? ranks(x) : x;
  const yForCorrelation = active === 'spearman' ? ranks(y) : y;
  const r = corr(xForCorrelation, yForCorrelation);
  const p = pval(r, x.length);

  graph('mainPlot', x, y, {
    xlab: labels[choice.x],
    ylab: labels[choice.y],
    fit: $('classFitLine').checked,
  });

  $('mainStats').innerHTML = `
    <h3>${choice.method} 相关结果</h3>
    <div class="result">n = ${x.length}</div>
    <div class="result">${choice.name} = <strong>${fmt(r)}</strong></div>
    <div class="result">95% CI = <strong>${ciText(r, x.length)}</strong></div>
    <div class="result">p ${p < 0.001 ? '&lt; .001' : '= ' + fmt(p)}</div>
  `;
}

const pairs = [['exercise', 'depression'], ['screen_time', 'depression'], ['exercise', 'screen_time']];
function drawPair() { let rows = pairs.map(([x, y]) => { let r = corr(arr[x], arr[y]), p = pval(r, 80); return { x, y, r, p, padj: Math.min(1, p * 3) }; }); $('pairTable').innerHTML = `<table class="pair-table"><thead><tr><th>变量对</th><th>r</th><th>95% CI</th><th>原始 p</th><th>校正后 p</th><th>结果</th></tr></thead><tbody>${rows.map(o => `<tr><td>${labels[o.x]} × ${labels[o.y]}</td><td>${fmt(o.r)}</td><td class="ci-col">${ciText(o.r, 80)}</td><td>${pformat(o.p)}</td><td>${pformat(o.padj)}</td><td class="${o.padj < .05 ? 'sig' : 'ns'}">${o.padj < .05 ? '显著' : '不显著'}</td></tr>`).join('')}</tbody></table>`; rows.forEach((o, i) => graph('pair' + (i + 1), arr[o.x], arr[o.y], { xlab: labels[o.x], ylab: labels[o.y], mini: true, fit: $('classFitLine').checked })); }
$('classFitLine').addEventListener('change', () => active === 'pair' ? drawPair() : drawSingle());
for (let b of document.querySelectorAll('#methods button'))
    b.onclick = () => { for (let o of document.querySelectorAll('#methods button'))
        o.classList.toggle('on', o === b); active = b.dataset.mode; $('single').classList.toggle('hidden', active === 'pair'); $('pair').classList.toggle('hidden', active !== 'pair'); if (active === 'pair')
        drawPair();
    else
        drawSingle(); };
function drawSim() { let rWanted = +$('wantR').value, n = +$('simN').value, seed = +$('seed').value; let d = sampleExact(rWanted, n, seed), r = corr(d.x, d.y), p = pval(r, n); $('wantRV').textContent = fmt(r); $('simNV').textContent = n; $('seedV').textContent = seed; graph('simPlot', d.x, d.y, { xlab: '模拟 X', ylab: '模拟 Y', fit: $('fitLine').checked }); $('simStats').innerHTML = `<h3>当前模拟结果</h3><div class="result">样本量 n = <strong>${n}</strong></div><div class="result">Pearson r = <strong>${fmt(r)}</strong></div><div class="result">95% CI = <strong>${ciText(r, n)}</strong></div><div class="result">p ${p < .001 ? '&lt; .001' : '= ' + fmt(p)}</div>`; }
for (let id of ['wantR', 'simN', 'seed', 'fitLine'])
    $(id).addEventListener('input', drawSim);
$('reroll').onclick = () => { $('seed').value = 1 + (+$('seed').value % 99); drawSim(); };
for (let b of document.querySelectorAll('nav button'))
    b.onclick = () => { for (let o of document.querySelectorAll('nav button'))
        o.classList.toggle('on', o === b); for (let s of document.querySelectorAll('main section'))
        s.classList.toggle('on', s.id === b.dataset.page); };
drawSingle();
drawSim();

