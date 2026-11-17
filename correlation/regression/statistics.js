// Pure statistics: no DOM access and no plotting.
// The formulas here are shared by fitting, prediction, and diagnostics.
const avg = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const f = (value, digits = 3) => Number.isFinite(value)
    ? value.toFixed(digits).replace('-', '−')
    : '—';
function lin(x, y) {
    const n = x.length;
    const mx = avg(x);
    const my = avg(y);
    let xx = 0, xy = 0, yy = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - mx;
        const dy = y[i] - my;
        xx += dx * dx;
        xy += dx * dy;
        yy += dy * dy;
    }
    const b = xy / xx;
    const a = my - b * mx;
    const r = xy / Math.sqrt(xx * yy);
    const res = y.map((observed, i) => observed - (a + b * x[i]));
    const sse = res.reduce((sum, error) => sum + error * error, 0);
    const mse = sse / (n - 2);
    const se = Math.sqrt(mse / xx);
    const t = b / se;
    return { x, y, n, a, b, r, r2: r * r, mx, my, xx, yy,
        res, sse, mse, se, t, F: t * t };
}
// Student-t probability via the regularized incomplete beta function.
function lg(z) { const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.6150291621406, 12.507343278686905, -.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < .5)
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lg(1 - z); z--; let x = p[0]; for (let i = 1; i < 9; i++)
    x += p[i] / (z + i); const t = z + 7.5; return .5 * Math.log(2 * Math.PI) + (z + .5) * Math.log(t) - t + Math.log(x); }
function betacf(a, b, x) { let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d); let h = d; for (let m = 1; m <= 400; m++) {
    let m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-300)
        d = 1e-300;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-300)
        c = 1e-300;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-300)
        d = 1e-300;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-300)
        c = 1e-300;
    d = 1 / d;
    let del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-13)
        break;
} return h; }
function ibeta(x, a, b) { if (x <= 0)
    return 0; if (x >= 1)
    return 1; let bt = Math.exp(lg(a + b) - lg(a) - lg(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const pt = (t, df) => Number.isFinite(t) ? ibeta(df / (df + t * t), df / 2, .5) : 0;
// Inverse standard-normal CDF (Acklam approximation).
function normInv(p) { const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924], b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857], c = [-.00778489400243029, -.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878], d = [.00778469570904146, .32246712907004, 2.44513413714299, 3.75440866190742]; let q, r; if (p < .02425) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
} if (p > 1 - .02425)
    return -normInv(1 - p); q = p - .5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
// Shapiro–Wilk statistic and Royston approximate p-value for n >= 80.
function normalCDF(x) { const t = 1 / (1 + .3275911 * Math.abs(x) / Math.sqrt(2)); const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x / 2); return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2; }
function shapiroWilk(values) {
    const y = values.slice().sort((a, b) => a - b), n = y.length, h = Math.floor(n / 2), poly = (c, x) => c.reduceRight((p, v) => p * x + v, 0);
    const m = Array.from({ length: h }, (_, i) => -normInv((i + .625) / (n + .25)));
    const norm = Math.sqrt(2 * m.reduce((sum, v) => sum + v * v, 0));
    let a = m.map(v => v / norm), rsn = 1 / Math.sqrt(n);
    const a1 = a[0] + poly([0, .221157, -.147981, -2.07119, 4.434685, -2.706056], rsn);
    const a2 = a[1] + poly([0, .042981, -.293762, -1.752461, 5.682633, -3.582633], rsn);
    const fac = Math.sqrt((1 - 2 * a[0] * a[0] - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1 - 2 * a2 * a2));
    a = a.map((v, i) => i === 0 ? a1 : i === 1 ? a2 : v / fac);
    const mean = avg(y), den = y.reduce((sum, v) => sum + (v - mean) ** 2, 0);
    if (den === 0)
        return { W: 1, p: 1 };
    let numerator = 0;
    for (let i = 0; i < h; i++)
        numerator += a[i] * (y[n - i - 1] - y[i]);
    const W = Math.max(0, Math.min(1, numerator * numerator / den));
    if (W >= 1)
        return { W: 1, p: 1 };
    const ln = Math.log(n), mu = poly([-1.5861, -.31082, -.083751, .0038915], ln), sigma = Math.exp(poly([-.4803, -.082676, .0030302], ln));
    const z = (Math.log(1 - W) - mu) / sigma;
    return { W, p: Math.max(0, Math.min(1, 1 - normalCDF(z))) };
}

