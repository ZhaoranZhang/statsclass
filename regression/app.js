'use strict';
// Page state and DOM event handlers. Statistical calculations live in statistics.js.
const $ = id => document.getElementById(id);
const BLUE = '#0047AB';
const RED = '#C8102E';
const ORANGE = '#FF6B1A';
const PURPLE = '#6A00F4';
const GREEN = '#00A99D';
let ds = 'exercise_mood';
let selected = 0;
let diagMode = 'real';
let seed = 3;
const label = { exercise_mood: ['每周锻炼时间（h）', '抑郁得分'] };
const vals = { exercise_mood: ['exercise', 'depression'] };
function realData(which = ds) { const [k1, k2] = vals[which]; return { x: DATA[which][k1].slice(), y: DATA[which][k2].slice() }; }
// ① Regression fit: calculate once and render the selected overlays.
function updateMain() {
  const data = realData();
  const model = lin(data.x, data.y);

  drawScatter('fitPlot', data, {
    fit: $('fitLine').checked,
    band: $('fitBand').checked,
    mean: $('fitMean').checked,
  });

  const p = pt(model.t, model.n - 2);
  const sign = model.b < 0 ? '−' : '+';
  $('fitStats').innerHTML = `
    n = <b>${model.n}</b><br>
    ŷ = <b>${f(model.a)} ${sign} ${f(Math.abs(model.b))}X</b><br>
    截距 a = <b>${f(model.a)}</b><br>
    斜率 b = <b>${f(model.b)}</b><br>
    SE(b) = <b>${f(model.se)}</b><br>
    t(${model.n - 2}) = <b>${f(model.t)}</b><br>
    F(1, ${model.n - 2}) = <b>${f(model.F)}</b><br>
    p = <b>${p < 0.001 ? '&lt; .001' : f(p)}</b><br>
    R² = <b>${f(model.r2)}</b>
  `;

  updatePred();
  updateResidual();
}

function updatePred() {
    const dat = realData(), d = lin(dat.x, dat.y), r = $('predictX'), lo = Math.min(...dat.x), hi = Math.max(...dat.x), pad = (hi - lo) * .13;
    const rangeLo = lo - pad, rangeHi = hi + pad;
    if (r.dataset.ds !== ds) {
        r.min = rangeLo;
        r.max = rangeHi;
        r.step = 'any';
        r.value = 6;
        r.dataset.ds = ds;
    }
    let xv = +r.value;
    // Gentle magnetic snap to observed X (0.09 h = 5.4 min).
    const xSorted = [...new Set(dat.x)].sort((a, b) => Math.abs(a - xv) - Math.abs(b - xv) || a - b);
    const candidate = xSorted[0], snapped = Math.abs(candidate - xv) <= .09;
    if (snapped) {
        xv = candidate;
        r.value = String(xv);
    }
    const yhat = d.a + d.b * xv;
    $('predLabel').textContent = '锻炼时间 X (h)';
    $('predictXV').textContent = f(xv, 2) + (snapped ? '  ●' : '');
    // Always show four nearby observations, even when no exact match.
    const distances = dat.x.map((x, i) => ({ i, dist: Math.abs(x - xv) })).sort((a, b) => a.dist - b.dist || a.i - b.i);
    let nearest = distances.slice(0, 4).map(o => o.i);
    if (snapped) {
        const exact = distances.filter(o => o.dist < 1e-8).map(o => o.i);
        nearest = [...exact, ...distances.filter(o => o.dist >= 1e-8).map(o => o.i)].slice(0, Math.max(4, exact.length));
    }
    const snapIndices = snapped ? dat.x.map((v, i) => Math.abs(v - xv) < 1e-8 ? i : -1).filter(i => i >= 0) : [];
    const observed = `<div class="predObserved"><div class="nearTitle">${snapped ? '已吸附至真实 X' : '附近的真实观测'}</div><div class="nearData">${nearest.map(i => `<div>被试 ${i + 1}：X = <b>${f(dat.x[i], 1)}</b>，Y = <b>${f(dat.y[i], 1)}</b>，e = <b>${f(dat.y[i] - (d.a + d.b * dat.x[i]), 2)}</b></div>`).join('')}</div></div>`;
    $('predictOut').innerHTML = `预测 Ŷ = <span style="color:${PURPLE}">${f(yhat, 2)}</span>${observed}`;
    $('predEq').textContent = `ŷ = ${f(d.a)} ${d.b < 0 ? '−' : '+'} ${f(Math.abs(d.b))}X`;
    drawScatter('predPlot', dat, { pred: xv, snapIndices, nearIndices: nearest });
}
function updateResidual() { const dat = realData(), d = lin(dat.x, dat.y); selected = Math.min(selected, d.n - 1); drawScatter('resPlot', dat, { resid: true, all: $('allResid').checked, clickable: true }); let yh = d.a + d.b * dat.x[selected]; $('resInfo').innerHTML = `被试 ${selected + 1}<br>X = <b>${f(dat.x[selected], 2)}</b><br>Y = <b>${f(dat.y[selected], 2)}</b><br>预测 Ŷ = <b>${f(yh, 2)}</b><br>残差 e = <b>${f(d.res[selected], 2)}</b>`; $('sseStats').innerHTML = `SSE = Σe² = <b>${f(d.sse, 2)}</b><br>MSE = <b>${f(d.mse, 2)}</b>`; }
// ④ Diagnostics: changing data invalidates the previously run SW test.
function updateDiag() {
  const kind = $('diagKind').value;
  const data = diagMode === 'real' ? realData() : simData(kind, seed);

  plotRF(data);
  plotQQ(data);

  $('swResult').innerHTML = '';
  $('swResult').classList.add('invisible');
}

for (const b of document.querySelectorAll('nav button'))
    b.onclick = () => { document.querySelectorAll('nav button').forEach(v => v.classList.toggle('on', v === b)); document.querySelectorAll('section').forEach(v => v.classList.toggle('on', v.id === b.dataset.tab)); };
$('fitLine').onchange = updateMain;
$('fitBand').onchange = updateMain;
$('fitMean').onchange = updateMain;
$('predictX').oninput = updatePred;
$('allResid').onchange = updateResidual;
$('diagMode').onclick = e => { let b = e.target.closest('button[data-mode]'); if (!b)
    return; diagMode = b.dataset.mode; $('diagMode').querySelectorAll('button').forEach(v => v.classList.toggle('on', v === b)); $('diagSimCtl').classList.toggle('invisible', diagMode !== 'sim'); $('nextSeed').classList.toggle('invisible', diagMode !== 'sim'); $('diagNCtl').classList.toggle('invisible', diagMode !== 'sim'); updateDiag(); };
$('diagN').onchange = updateDiag;
$('diagKind').onchange = updateDiag;
$('nextSeed').onclick = () => { seed++; updateDiag(); };
// Shapiro–Wilk W: Royston coefficients, valid here for n >= 80.
function runSW() {
    const dat = diagMode === 'real' ? realData() : simData($('diagKind').value, seed);
    const result = shapiroWilk(lin(dat.x, dat.y).res);
    const pText = result.p < .001 ? 'p < .001' : 'p = ' + result.p.toFixed(3);
    const interpretation = result.p < .05 ? 'p < .05：残差显著偏离正态分布。' : 'p ≥ .05：残差未显著偏离正态分布。';
    $('swResult').innerHTML = `<div class="sw-numbers">W = <b>${result.W.toFixed(4)}</b>　${pText}　(n = ${dat.x.length})</div><div class="sw-formula">W = (Σ aᵢ e₍ᵢ₎)² / Σ(eᵢ − ē)²</div><div class="sw-interpret">W 越接近 1，越符合正态分布。${interpretation}</div>`;
    $('swResult').classList.remove('invisible');
}
$('runSW').addEventListener('click', runSW);
updateMain();
updateDiag();

