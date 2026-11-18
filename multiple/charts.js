// SVG charts. Depends on Stats for regression lines.
const C = { cobalt: "#0047AB", crimson: "#C8102E", tangerine: "#FF6B1A", violet: "#6A00F4", aqua: "#00A99D", grey: "#737373" };
const f2 = (v) => (Math.abs(v) < 1 ? v.toFixed(2).replace(/^(-?)0\./, "$1.") : v.toFixed(2)).replace("-", "−");
const f3 = (v) => (Math.abs(v) < 1 ? v.toFixed(3).replace(/^(-?)0\./, "$1.") : v.toFixed(3)).replace("-", "−");
const n3 = (v) => v.toFixed(3).replace("-", "−");
const fp = (p) => (p < 0.001 ? "p < .001" : "p = " + p.toFixed(3).replace(/^0/, ""));

// ---------------- SVG helpers ----------------
function svgEl(w, h) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
}
function niceTicks(lo, hi, n = 5) {
  const span = hi - lo || 1, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n + 0.5);
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}
function axes(W, H, m, xr, yr, xlab, ylab) {
  const X = (v) => m.l + (v - xr[0]) / (xr[1] - xr[0]) * (W - m.l - m.r);
  const Y = (v) => H - m.b - (v - yr[0]) / (yr[1] - yr[0]) * (H - m.t - m.b);
  let s = `<line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="#222"/>` +
          `<line x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${H - m.b}" stroke="#222"/>`;
  for (const t of niceTicks(xr[0], xr[1])) s += `<line x1="${X(t)}" y1="${H - m.b}" x2="${X(t)}" y2="${H - m.b + 6}" stroke="#222"/><text x="${X(t)}" y="${H - m.b + 26}" font-size="18" text-anchor="middle" fill="#444">${+t.toFixed(2)}</text>`;
  for (const t of niceTicks(yr[0], yr[1])) s += `<line x1="${m.l - 6}" y1="${Y(t)}" x2="${m.l}" y2="${Y(t)}" stroke="#222"/><text x="${m.l - 10}" y="${Y(t) + 6}" font-size="18" text-anchor="end" fill="#444">${+t.toFixed(2)}</text>`;
  s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 8}" font-size="20" text-anchor="middle">${xlab}</text>`;
  s += `<text transform="translate(20 ${(m.t + H - m.b) / 2}) rotate(-90)" font-size="20" text-anchor="middle">${ylab}</text>`;
  return { s, X, Y };
}
function range(a, pad = 0.06) {
  let lo = Math.min(...a), hi = Math.max(...a); const d = (hi - lo) || 1;
  return [lo - d * pad, hi + d * pad];
}
function scatter(x, y, o) {
  const W = 620, H = 440, m = { l: 74, r: 20, t: 46, b: 66 };
  const xr = o.xr || range(x), yr = o.yr || range(y);
  const a = axes(W, H, m, xr, yr, o.xlab, o.ylab);
  let s = svgEl(W, H) + a.s;
  s += `<text x="${W / 2}" y="28" font-size="21" text-anchor="middle">${o.title || ""}</text>`;
  for (let i = 0; i < x.length; i++) s += `<circle cx="${a.X(x[i]).toFixed(1)}" cy="${a.Y(y[i]).toFixed(1)}" r="${o.r || 5}" fill="${o.color}" fill-opacity="0.6"/>`;
  if (o.line !== false) {
    const m1 = Stats.ols([x], y);
    const x0 = Math.min(...x), x1 = Math.max(...x);
    s += `<line x1="${a.X(x0)}" y1="${a.Y(m1.coef[0] + m1.coef[1] * x0)}" x2="${a.X(x1)}" y2="${a.Y(m1.coef[0] + m1.coef[1] * x1)}" stroke="#111" stroke-width="3"/>`;
  }
  if (o.annot) s += `<text x="${m.l + 12}" y="${m.t + 26}" font-size="24" fill="#111">${o.annot}</text>`;
  return s + "</svg>";
}

function stackedBar(parts, R2, opts = {}) {
  const W = 820, H = opts.h || 190, m = { l: 20, r: 30, t: 30, b: 60 };
  const pos = parts.filter((p) => p.v > 0).reduce((s, p) => s + p.v, 0);
  const neg = parts.filter((p) => p.v < 0).reduce((s, p) => s + p.v, 0);
  const xmax = Math.max(0.6, pos + 0.05, R2 + 0.08), xmin = Math.min(0, neg - 0.02);
  const X = (v) => m.l + (v - xmin) / (xmax - xmin) * (W - m.l - m.r);
  let s = svgEl(W, H + 40);
  let left = 0;
  for (const p of parts) if (p.v > 0) {
    s += `<rect x="${X(left)}" y="${m.t}" width="${X(left + p.v) - X(left)}" height="56" fill="${p.c}"/>`;
    left += p.v;
  }
  for (const p of parts) if (p.v < 0) s += `<rect x="${X(pos + p.v)}" y="${m.t + 64}" width="${X(pos) - X(pos + p.v)}" height="22" fill="${p.c}"/>`;
  s += `<line x1="${X(R2)}" y1="${m.t - 12}" x2="${X(R2)}" y2="${m.t + 96}" stroke="#111" stroke-width="2.5" stroke-dasharray="7 5"/>`;
  s += `<text x="${X(R2) + 8}" y="${m.t - 2}" font-size="21">R² = ${f3(R2)}</text>`;
  s += `<line x1="${X(xmin)}" y1="${m.t + 100}" x2="${X(xmax)}" y2="${m.t + 100}" stroke="#222"/>`;
  for (const t of niceTicks(xmin, xmax, 6)) s += `<text x="${X(t)}" y="${m.t + 124}" font-size="18" text-anchor="middle" fill="#444">${+t.toFixed(2)}</text>`;
  let lx = m.l, ly = H + 22;
  for (const p of parts) {
    s += `<rect x="${lx}" y="${ly - 15}" width="18" height="18" fill="${p.c}"/><text x="${lx + 24}" y="${ly}" font-size="19">${p.lab}</text>`;
    lx += 60 + p.lab.length * 20;
  }
  return s + "</svg>";
}

function betaBars(r, b) {
  const W = 420, H = 380, m = { l: 66, r: 16, t: 20, b: 80 };
  const Y = (v) => m.t + (1.1 - v) / 2.2 * (H - m.t - m.b);
  let s = svgEl(W, H);
  for (const t of [-1, -0.5, 0, 0.5, 1]) s += `<text x="${m.l - 8}" y="${Y(t) + 6}" font-size="18" text-anchor="end" fill="#444">${t}</text><line x1="${m.l}" y1="${Y(t)}" x2="${W - m.r}" y2="${Y(t)}" stroke="${t === 0 ? "#222" : "#eee"}"/>`;
  const gw = (W - m.l - m.r) / 2;
  ["X1", "X2"].forEach((lab, i) => {
    const x0 = m.l + i * gw + gw * 0.15, bw = gw * 0.32;
    const bar = (v, x, col) => `<rect x="${x}" y="${Math.min(Y(v), Y(0))}" width="${bw}" height="${Math.abs(Y(v) - Y(0))}" fill="${col}"/>`;
    s += bar(r[i], x0, C.grey) + bar(b[i], x0 + bw + 6, i ? C.crimson : C.cobalt);
    s += `<text x="${x0 + bw}" y="${H - m.b + 28}" font-size="20" text-anchor="middle">${lab}</text>`;
  });
  s += `<rect x="${m.l}" y="${H - 34}" width="16" height="16" fill="${C.grey}"/><text x="${m.l + 22}" y="${H - 20}" font-size="17">零阶 r</text>`;
  s += `<rect x="${m.l + 110}" y="${H - 34}" width="16" height="16" fill="${C.cobalt}"/><rect x="${m.l + 128}" y="${H - 34}" width="16" height="16" fill="${C.crimson}"/><text x="${m.l + 150}" y="${H - 20}" font-size="17">回归中的 β</text>`;
  return s + "</svg>";
}

function hist(vals, lo, hi, bins, col, xlab, title, ref) {
  const W = 620, H = 420, m = { l: 70, r: 20, t: 46, b: 66 };
  const w = (hi - lo) / bins, cnt = new Array(bins).fill(0);
  vals.forEach((v) => { const i = Math.floor((v - lo) / w); if (i >= 0 && i < bins) cnt[i]++; });
  const a = axes(W, H, m, [lo, hi], [0, Math.max(...cnt) * 1.1], xlab, "次数");
  let s = svgEl(W, H) + a.s + `<text x="${W / 2}" y="28" font-size="21" text-anchor="middle">${title}</text>`;
  cnt.forEach((c, i) => s += `<rect x="${a.X(lo + i * w) + 1}" y="${a.Y(c)}" width="${a.X(lo + w) - a.X(lo) - 2}" height="${a.Y(0) - a.Y(c)}" fill="${col}"/>`);
  s += `<line x1="${a.X(ref)}" y1="${m.t}" x2="${a.X(ref)}" y2="${H - m.b}" stroke="${C.crimson}" stroke-width="3.5"/>`;
  return s + "</svg>";
}
