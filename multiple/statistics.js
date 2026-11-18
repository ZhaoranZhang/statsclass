// Pure statistics: no DOM access and no plotting.
// Checked against Python pingouin; see VALID in data.js.
const Stats = (function () {
  "use strict";

  // ---------- 特殊函数 ----------
  function logGamma(x) {
    // Lanczos 近似 (g = 7, n = 9)
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
      1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  function betacf(a, b, x) {
    // 不完全 Beta 函数的连分式（修正 Lentz 法）
    const MAXIT = 1000, EPS = 1e-15, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function ibeta(x, a, b) {
    // 正则化不完全 Beta 函数 I_x(a, b)
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    if (x < (a + 1) / (a + b + 2)) return Math.exp(lbt) * betacf(a, b, x) / a;
    return 1 - Math.exp(lbt) * betacf(b, a, 1 - x) / b;
  }

  // t 分布双侧 p 值
  function pT(t, df) {
    if (!isFinite(t)) return 0;
    return ibeta(df / (df + t * t), df / 2, 0.5);
  }

  // F 分布右尾 p 值
  function pF(F, d1, d2) {
    if (F <= 0) return 1;
    return ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2);
  }

  // ---------- 描述统计与相关 ----------
  const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length;

  function corr(x, y) {
    const mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxy / Math.sqrt(sxx * syy);
  }

  function corrTest(x, y, k = 0) {
    // k = 控制变量个数（偏相关时 k > 0）
    const r = corr(x, y);
    const df = x.length - 2 - k;
    const t = r * Math.sqrt(df / (1 - r * r));
    return { n: x.length, r: r, df: df, p: pT(t, df) };
  }

  // ---------- 最小二乘回归 ----------
  function solve(A, b) {
    // 高斯消元（部分主元），A: p×p
    const n = b.length;
    const M = A.map((row, i) => row.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((row, i) => row[n] / row[i]);
  }

  function inverse(A) {
    const n = A.length;
    const cols = [];
    for (let j = 0; j < n; j++) {
      const e = new Array(n).fill(0); e[j] = 1;
      cols.push(solve(A, e));
    }
    return A.map((_, i) => cols.map((col) => col[i]));
  }

  function ols(Xcols, y) {
    // Xcols: 自变量列的数组（不含截距）；返回系数、标准误、t、p、R²
    const n = y.length, p = Xcols.length + 1;
    const X = [];
    for (let i = 0; i < n; i++) X.push([1].concat(Xcols.map((c) => c[i])));
    const XtX = [], Xty = [];
    for (let a = 0; a < p; a++) {
      XtX.push([]);
      let s = 0;
      for (let i = 0; i < n; i++) s += X[i][a] * y[i];
      Xty.push(s);
      for (let b = 0; b < p; b++) {
        let t = 0;
        for (let i = 0; i < n; i++) t += X[i][a] * X[i][b];
        XtX[a].push(t);
      }
    }
    const beta = solve(XtX, Xty);
    const inv = inverse(XtX);
    const resid = y.map((v, i) => v - X[i].reduce((s, xv, j) => s + xv * beta[j], 0));
    const sse = resid.reduce((s, v) => s + v * v, 0);
    const my = mean(y);
    const sst = y.reduce((s, v) => s + (v - my) * (v - my), 0);
    const dfr = n - p;
    const sigma2 = sse / dfr;
    const se = inv.map((row, j) => Math.sqrt(sigma2 * row[j]));
    const t = beta.map((b, j) => b / se[j]);
    const pv = t.map((tv) => pT(tv, dfr));
    const r2 = 1 - sse / sst;
    const k = p - 1;
    const F = (r2 / k) / ((1 - r2) / dfr);
    return { coef: beta, se: se, t: t, p: pv, r2: r2, adj_r2: 1 - (1 - r2) * (n - 1) / dfr,
      df_resid: dfr, F: F, pF: pF(F, k, dfr), resid: resid };
  }

  function residualize(y, covCols) {
    return ols(covCols, y).resid;
  }

  function partialCorr(x, y, covCols) {
    const rx = residualize(x, covCols), ry = residualize(y, covCols);
    return corrTest(rx, ry, covCols.length);
  }

  function semiPartialCorr(x, y, covCols) {
    // 只从 x 中去掉控制变量（pingouin 的 x_covar）；只返回系数
    const rx = residualize(x, covCols);
    return corr(rx, y);
  }

  // ---------- 由三个相关系数求两自变量回归的分解 ----------
  function decompose(r1y, r2y, r12) {
    const det = 1 - r1y * r1y - r2y * r2y - r12 * r12 + 2 * r1y * r2y * r12;
    if (det <= 0 || Math.abs(r12) >= 1) return null;
    const d = 1 - r12 * r12;
    const R2 = (r1y * r1y + r2y * r2y - 2 * r1y * r2y * r12) / d;
    const b1 = (r1y - r2y * r12) / d, b2 = (r2y - r1y * r12) / d;
    const sr1 = (r1y - r2y * r12) / Math.sqrt(d), sr2 = (r2y - r1y * r12) / Math.sqrt(d);
    return { R2, b1, b2, sr1, sr2, shared: R2 - sr1 * sr1 - sr2 * sr2 };
  }

  // ---------- 可设定种子的随机数 ----------
  function rng(seed) {
    let s = seed >>> 0;
    const uni = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    const normal = () => {
      if (spare !== null) { const v = spare; spare = null; return v; }
      let u, v, q;
      do { u = 2 * uni() - 1; v = 2 * uni() - 1; q = u * u + v * v; } while (q === 0 || q >= 1);
      const f = Math.sqrt(-2 * Math.log(q) / q);
      spare = v * f;
      return u * f;
    };
    return { uni, normal };
  }

  return { pT, pF, mean, corr, corrTest, ols, partialCorr, semiPartialCorr, decompose, rng, ibeta, logGamma };
})();
