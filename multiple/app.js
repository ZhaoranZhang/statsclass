"use strict";
const $ = (id) => document.getElementById(id);

// ---------------- tabs & segmented buttons ----------------
document.querySelectorAll("#nav button").forEach((b) => b.onclick = () => {
  document.querySelectorAll("#nav button").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll("section").forEach((s) => s.classList.toggle("on", s.id === b.dataset.s));
});
function seg(id, cb) {
  const el = $(id);
  el.querySelectorAll("button").forEach((b) => b.onclick = () => {
    el.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); cb(b.dataset.v);
  });
  return () => el.querySelector("button.on").dataset.v;
}

// ================= 1 =================
const s1mode = seg("s1mode", () => draw1());
const s1cov = seg("s1cov", () => draw1());
["s1a", "s1c", "s1seed"].forEach((id) => $(id).addEventListener("input", () => draw1()));
function draw1() {
  const mode = s1mode();
  $("s1ctrlClass").style.display = mode === "class" ? "" : "none";
  $("s1ctrlSim").style.display = mode === "sim" ? "" : "none";
  let d, covKeys;
  if (mode === "class") { d = CLASS; covKeys = { none: [], psqi: ["psqi"], both: ["psqi", "exercise"] }[s1cov()]; }
  else {
    const a = +$("s1a").value, c = +$("s1c").value, sd = +$("s1seed").value;
    $("s1aV").value = a.toFixed(2); $("s1cV").value = c.toFixed(2); $("s1seedV").value = sd;
    d = simulate(a, c, sd); covKeys = ["psqi"];
  }
  const x = d.screen_time, y = d.depression;
  const r0 = Stats.corrTest(x, y);
  $("s1plotA").innerHTML = scatter(x, y, { color: C.cobalt, title: "原始数据", xlab: "手机使用（小时/天）", ylab: "抑郁", annot: "r = " + f3(r0.r) });
  let html = `<div>零阶相关：<span class="num">r(${r0.df}) = ${f3(r0.r)}，${fp(r0.p)}</span></div>`;
  if (covKeys.length) {
    const cov = covKeys.map((k) => d[k]);
    const m1 = Stats.ols(cov, x), m2 = Stats.ols(cov, y);
    const pc = Stats.partialCorr(x, y, cov);
    const lab = covKeys.map((k) => NAMES[k]).join("和");
    $("s1plotB").innerHTML = scatter(m1.resid, m2.resid, { color: C.crimson, title: "去掉" + lab + "的影响之后", xlab: "手机使用（残差）", ylab: "抑郁（残差）", annot: "偏相关 r = " + f3(pc.r) });
    html += `<div>偏相关（控制${lab}）：<span class="num hl">r(${pc.df}) = ${f3(pc.r)}，${fp(pc.p)}</span></div>`;
    const regKeys = ["screen_time"].concat(covKeys);
    const reg = Stats.ols(regKeys.map((k) => d[k]), y);
    html += `<div>多元回归（手机使用 + ${lab}）中手机使用的系数：<span class="num">b = ${n3(reg.coef[1])}，${fp(reg.p[1])}</span></div>`;
    if (TEACHER) html += `<div class="note">偏相关与回归系数的 p 值相同：两者是同一个检验。</div>`;
    if (TEACHER && mode === "class") html += `<div class="note">与课件一致：控制睡眠 r = .012，p = .897（第 10 页）；控制睡眠和锻炼 r = .051，p = .583（第 15 页）。</div>`;
  } else {
    $("s1plotB").innerHTML = `<div class="box note" style="margin-top:40px">选择一个控制变量，右边会显示去掉它的影响之后的散点图。</div>`;
  }
  $("s1stats").innerHTML = html;
}

// ================= 2A =================
const PRED = ["exercise", "screen_time", "psqi"];
const PCOL = { exercise: C.cobalt, screen_time: C.tangerine, psqi: C.crimson };
$("s2checks").querySelectorAll("input").forEach((el) => el.onchange = () => draw2A());
function draw2A() {
  const sel = [...$("s2checks").querySelectorAll("input")].filter((e) => e.checked).map((e) => e.value);
  const y = CLASS.depression;
  if (!sel.length) { $("s2table").innerHTML = `<div class="box">请至少选择一个自变量。</div>`; $("s2bar").innerHTML = ""; return; }
  const m = Stats.ols(sel.map((k) => CLASS[k]), y);
  let t = `<table><tr><th></th><th>系数 b</th><th>标准误</th><th>t</th><th>p</th><th>独特贡献 sr²</th></tr>`;
  t += `<tr><td>截距</td><td class="num">${n3(m.coef[0])}</td><td class="num">${n3(m.se[0])}</td><td class="num">${n3(m.t[0])}</td><td class="num">${fp(m.p[0])}</td><td></td></tr>`;
  const parts = []; let sumSr2 = 0;
  sel.forEach((k, i) => {
    const others = sel.filter((o) => o !== k);
    const r2Without = others.length ? Stats.ols(others.map((o) => CLASS[o]), y).r2 : 0;
    const sr2 = m.r2 - r2Without; sumSr2 += sr2;
    parts.push({ v: sr2, c: PCOL[k], lab: NAMES[k] + "独特" });
    t += `<tr><td>${NAMES[k]}（${k}）</td><td class="num">${n3(m.coef[i + 1])}</td><td class="num">${n3(m.se[i + 1])}</td><td class="num">${n3(m.t[i + 1])}</td><td class="num">${fp(m.p[i + 1])}</td><td class="num">${n3(sr2)}</td></tr>`;
  });
  t += `</table><div class="stats" style="margin-top:8px"><div><span class="num">R² = ${f3(m.r2)}，调整 R² = ${f3(m.adj_r2)}，F(${sel.length}, ${m.df_resid}) = ${n3(m.F)}，${fp(m.pF)}</span></div>`;
  if (sel.length > 1) {
    parts.push({ v: m.r2 - sumSr2, c: C.grey, lab: m.r2 - sumSr2 >= 0 ? "共同部分" : "共同部分 < 0" });
    t += `<div>各独特贡献之和 = ${f3(sumSr2)}；共同部分 = R² − 独特贡献之和 = <span class="num">${n3(m.r2 - sumSr2)}</span></div>`;
  }
  if (TEACHER && sel.length === 3) t += `<div class="note">与课件一致：R² = .395，F(3, 116) = 25.253（第 13、14 页）；sr²：锻炼 .096、手机使用 .002、睡眠 .129（第 21 页）。</div>`;
  if (TEACHER) t += `<div class="note">独特贡献 sr² = 去掉这个变量后 R² 下降多少 = 分层回归最后加入它时的 ΔR²。</div>`;
  t += `</div>`;
  $("s2table").innerHTML = t;
  $("s2bar").innerHTML = sel.length > 1 ? stackedBar(parts, m.r2) : "";
}

// ================= 2B =================
const CORR = (a, b) => Stats.corr(CLASS[a], CLASS[b]);
const PRESETS = {
  "本课：锻炼（X1）+ 睡眠问题（X2）": [CORR("exercise", "depression"), CORR("psqi", "depression"), CORR("exercise", "psqi")],
  "两个自变量无关": [0.4, 0.4, 0],
  "高度重叠（冗余）": [0.5, 0.5, 0.8],
  "抑制效应": [0, 0.5, 0.6],
  "自定义": null,
};
const sel2 = $("s2preset");
Object.keys(PRESETS).forEach((k) => sel2.add(new Option(k, k)));
function setPreset(k) {
  const v = PRESETS[k]; if (!v) return;
  $("r1y").value = v[0].toFixed(2); $("r2y").value = v[1].toFixed(2); $("r12").value = v[2].toFixed(2);
  draw2B(v);
}
sel2.onchange = () => setPreset(sel2.value);
["r1y", "r2y", "r12"].forEach((id) => $(id).addEventListener("input", () => { sel2.value = "自定义"; draw2B(); }));
function draw2B(exact) {
  const v = exact || [+$("r1y").value, +$("r2y").value, +$("r12").value];
  $("r1yV").value = v[0].toFixed(2); $("r2yV").value = v[1].toFixed(2); $("r12V").value = v[2].toFixed(2);
  const d = Stats.decompose(...v);
  if (!d) { $("s2Bbar").innerHTML = ""; $("s2Bbeta").innerHTML = ""; $("s2Bstats").innerHTML = "这三个相关系数不可能同时出现（相关矩阵不成立），请调整滑块。"; return; }
  const parts = [{ v: d.sr1 ** 2, c: C.cobalt, lab: "X1 独特" }, { v: d.sr2 ** 2, c: C.crimson, lab: "X2 独特" },
    { v: d.shared, c: d.shared >= 0 ? C.grey : C.tangerine, lab: d.shared >= 0 ? "共同部分" : "共同部分 < 0（抑制）" }];
  $("s2Bbar").innerHTML = stackedBar(parts, d.R2);
  $("s2Bbeta").innerHTML = betaBars([v[0], v[1]], [d.b1, d.b2]);
  let h = `<div><span class="num">R² = ${f3(d.R2)}；X1 独特 sr² = ${n3(d.sr1 ** 2)}；X2 独特 sr² = ${n3(d.sr2 ** 2)}；共同部分 = ${n3(d.shared)}</span></div>
    <div><span class="num">β1 = ${n3(d.b1)}（零阶 r = ${f2(v[0])}）；β2 = ${n3(d.b2)}（零阶 r = ${f2(v[1])}）</span></div>`;
  if (sel2.value.startsWith("本课")) h += TEACHER
    ? `<div class="note">这里只有锻炼和睡眠两个自变量，R² = .393，与课件分层回归第一步一致（第 18 页）。课件汇总页（第 21 页）是三个自变量一起，所以睡眠的 sr² 那里是 .129，这里是 .185。</div>`
    : `<div class="note">这里只有锻炼和睡眠两个自变量，所以数字和上面 A 部分（三个自变量）不同。</div>`;
  if (TEACHER && d.shared < -0.005) h += `<div class="hl">共同部分为负：抑制效应——两个变量放在一起，比分开时解释得更多。</div>`;
  $("s2Bstats").innerHTML = h;
}

// ================= 3 =================
(function () {
  const vif = PRED.map((k) => { const o = PRED.filter((x) => x !== k); return 1 / (1 - Stats.ols(o.map((x) => CLASS[x]), CLASS[k]).r2); });
  $("s3class").innerHTML = `<div>课堂数据的 VIF：<span class="num">锻炼 ${vif[0].toFixed(2)}，手机使用 ${vif[1].toFixed(2)}，睡眠问题 ${vif[2].toFixed(2)}</span></div>
    <div class="note">${TEACHER ? "与课件一致（第 20 页）：都小于 1.5，没有共线性问题。" : ""}下面用模拟看看，如果自变量高度相关会发生什么。</div>`;
})();
$("s3r").addEventListener("input", draw3);
function draw3() {
  const r = +$("s3r").value; $("s3rV").value = r.toFixed(2);
  const sim = collSim(r);
  $("s3hist").innerHTML = hist(sim.map((s) => s.b1), -1.2, 2.0, 40, C.cobalt, "400 次估计出的 b1", "真实 b1 = 0.4（红线）", 0.4);
  $("s3scat").innerHTML = scatter(sim.map((s) => s.b1), sim.map((s) => s.b2), { color: C.violet, r: 3.5, line: false, xr: [-1.2, 2], yr: [-1.2, 2], xlab: "b1", ylab: "b2", title: "b1 和 b2 此消彼长" });
  const se = Stats.mean(sim.map((s) => s.se)), pw = sim.filter((s) => s.p < 0.05).length / sim.length;
  $("s3stats").innerHTML = `<div><span class="num">VIF = ${(1 / (1 - r * r)).toFixed(2)}</span></div><div><span class="num">b1 的平均标准误 = ${se.toFixed(3)}</span></div><div>400 次中 b1 显著（p < .05）的比例：<span class="num hl">${Math.round(pw * 100)}%</span></div>`;
}

// ================= 5 =================
(function () {
  const y = CLASS.depression;
  const items = [];
  const add = (lab, page, val, ref, dec = 3) => items.push([lab, page, val.toFixed(dec), ref.toFixed(dec)]);
  add("手机使用与抑郁 零阶 r", "第 7 页", Stats.corr(CLASS.screen_time, y), 0.266);
  add("偏相关（控制睡眠）r", "第 10 页", Stats.partialCorr(CLASS.screen_time, y, [CLASS.psqi]).r, 0.012);
  add("偏相关（控制睡眠）p", "第 10 页", Stats.partialCorr(CLASS.screen_time, y, [CLASS.psqi]).p, 0.897);
  const m = Stats.ols(PRED.map((k) => CLASS[k]), y);
  add("多元回归 R²", "第 13 页", m.r2, 0.395);
  add("锻炼 b", "第 13 页", m.coef[1], -0.812);
  add("手机使用 b", "第 13 页", m.coef[2], 0.138);
  add("手机使用 p", "第 13 页", m.p[2], 0.583);
  add("睡眠问题 b", "第 13 页", m.coef[3], 0.905);
  add("F(3, 116)", "第 14 页", m.F, 25.253);
  add("偏相关（控制睡眠和锻炼）r", "第 15 页", Stats.partialCorr(CLASS.screen_time, y, [CLASS.exercise, CLASS.psqi]).r, 0.051);
  add("偏相关（控制睡眠和锻炼）p", "第 15 页", Stats.partialCorr(CLASS.screen_time, y, [CLASS.exercise, CLASS.psqi]).p, 0.583);
  add("半偏相关 sr（手机使用）", "第 16 页", Stats.semiPartialCorr(CLASS.screen_time, y, [CLASS.exercise, CLASS.psqi]), 0.040);
  const r2a = Stats.ols([CLASS.exercise, CLASS.psqi], y).r2;
  add("分层回归第一步 R²", "第 18 页", r2a, 0.393);
  add("ΔR²", "第 18 页", m.r2 - r2a, 0.0016, 4);
  ["exercise", "screen_time", "psqi"].forEach((k, i) => {
    const o = PRED.filter((x) => x !== k);
    add("VIF " + NAMES[k], "第 20 页", 1 / (1 - Stats.ols(o.map((x) => CLASS[x]), CLASS[k]).r2), [1.11, 1.30, 1.42][i], 2);
  });
  let t = `<table><tr><th>数字</th><th>课件</th><th>本页计算</th><th>课件上的值</th><th></th></tr>`;
  items.forEach((it) => {
    const ok = Math.abs(+it[2] - +it[3]) < 1e-9 || it[2] === it[3];
    t += `<tr><td>${it[0]}</td><td>${it[1]}</td><td class="num">${it[2]}</td><td class="num">${it[3]}</td><td class="${ok ? "ok" : "bad"}">${ok ? "一致" : "不一致"}</td></tr>`;
  });
  $("s5table").innerHTML = t + "</table><div class='note'>页码指课件《相关与回归2》。</div>";
  let v = `<table><tr><th>计算项目</th><th>比较次数</th><th>最大绝对误差</th></tr>`;
  VALID.rows.forEach((r) => v += `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`);
  $("s5valid").innerHTML = v + `</table><div class="note">${VALID.note}</div>`;
})();

// ---------------- init ----------------
draw1();
draw2A();
setPreset(Object.keys(PRESETS)[0]);
draw3();
