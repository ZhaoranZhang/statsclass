// Pure correlation, ranking, p-values and confidence intervals.
function mean(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
function corr(x, y) { let mx = mean(x), my = mean(y), xy = 0, xx = 0, yy = 0; for (let i = 0; i < x.length; i++) {
    let a = x[i] - mx, b = y[i] - my;
    xy += a * b;
    xx += a * a;
    yy += b * b;
} return xy / Math.sqrt(xx * yy); }
function ranks(a) { let sorted = a.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v), r = new Array(a.length); for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length && sorted[i].v === sorted[j].v)
        j++;
    let val = (i + 1 + j) / 2;
    for (let k = i; k < j; k++)
        r[sorted[k].i] = val;
    i = j;
} return r; }
function lg(z) { const p = [.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.6150291621406, 12.507343278686905, -.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < .5)
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lg(1 - z); z--; let x = p[0]; for (let i = 1; i < 9; i++)
    x += p[i] / (z + i); let t = z + 7.5; return .5 * Math.log(2 * Math.PI) + (z + .5) * Math.log(t) - t + Math.log(x); }
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
function ci95(r, n) { if (n <= 3)
    return [NaN, NaN]; const z = Math.atanh(Math.max(-0.999999999999, Math.min(0.999999999999, r))), delta = 1.95996398454 / Math.sqrt(n - 3); return [Math.tanh(z - delta), Math.tanh(z + delta)]; }
const ciText = (r, n) => { const c = ci95(r, n); return `[${fmt(c[0])}, ${fmt(c[1])}]`; };
function pval(r, n) { let t = r * Math.sqrt((n - 2) / (1 - r * r)); return ibeta((n - 2) / (n - 2 + t * t), (n - 2) / 2, .5); }

