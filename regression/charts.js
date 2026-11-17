// SVG chart renderer. Only this file constructs SVG markup.
// Chart functions accept data/options and render into a named container.
function ticks(a, b) { let dif = b - a || 1, s = dif / 5, m = 10 ** Math.floor(Math.log10(s)), step = [1, 2, 2.5, 5, 10].map(v => v * m).find(v => dif / v <= 6) || m * 10; let out = []; for (let v = Math.ceil(a / step) * step; v <= b + step * .001; v += step)
    out.push(+v.toFixed(8)); return out; }
function svgBase(x, y, labels, opts = {}) { const W = 870, H = 510, m = { l: 83, r: 27, t: 28, b: 65 }; let xmin = Math.min(...x), xmax = Math.max(...x), ymin = Math.min(...y), ymax = Math.max(...y); let xp = (xmax - xmin || 1) * .13, yp = (ymax - ymin || 1) * .15; xmin -= xp; xmax += xp; ymin -= yp; ymax += yp; if (opts.zero) {
    ymin = Math.min(ymin, 0);
    ymax = Math.max(ymax, 0);
} ; const X = v => m.l + (v - xmin) / (xmax - xmin) * (W - m.l - m.r), Y = v => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b); let s = `<svg viewBox="0 0 ${W} ${H}">`; for (let q of ticks(xmin, xmax))
    s += `<text x="${X(q)}" y="${H - 30}" text-anchor="middle" font-size="17" fill="#555">${+q.toFixed(2)}</text><line x1="${X(q)}" y1="${H - m.b}" x2="${X(q)}" y2="${H - m.b + 6}" stroke="#555"/>`; for (let q of ticks(ymin, ymax))
    s += `<text x="${m.l - 9}" y="${Y(q) + 5}" text-anchor="end" font-size="17" fill="#555">${+q.toFixed(2)}</text><line x1="${m.l - 6}" y1="${Y(q)}" x2="${m.l}" y2="${Y(q)}" stroke="#555"/>`; s += `<path d="M${m.l},${m.t}V${H - m.b}H${W - m.r}" fill="none" stroke="#333" stroke-width="1.5"/><text x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle" font-size="20">${labels[0]}</text><text transform="translate(24 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle" font-size="20">${labels[1]}</text>`; return { s, X, Y, W, H, m, xmin, xmax, ymin, ymax }; }
function drawScatter(target, dat, opts = {}) {
    const { x, y } = dat, d = lin(x, y);
    let z = svgBase(x, y, opts.labels || label[ds]), { s, X, Y, xmin, xmax, H, m } = z;
    if (opts.band) {
        let up = [], lo = [];
        const crit = d.n > 30 ? 1.99 : 2.306;
        for (let j = 0; j <= 100; j++) {
            let xv = xmin + (xmax - xmin) * j / 100, yh = d.a + d.b * xv, err = crit * Math.sqrt(d.mse * (1 / d.n + (xv - d.mx) ** 2 / d.xx));
            up.push(X(xv) + ',' + Y(yh + err));
            lo.push(X(xv) + ',' + Y(yh - err));
        }
        s += `<polygon points="${up.concat(lo.reverse()).join(' ')}" fill="${RED}" fill-opacity=".12"/>`;
    }
    if (opts.mean)
        s += `<line x1="${X(xmin)}" y1="${Y(d.my)}" x2="${X(xmax)}" y2="${Y(d.my)}" stroke="${GREEN}" stroke-width="2" stroke-dasharray="8 7"/>`;
    if (opts.resid || opts.all)
        for (let i = 0; i < x.length; i++) {
            if (opts.all || i === selected)
                s += `<line x1="${X(x[i])}" y1="${Y(y[i])}" x2="${X(x[i])}" y2="${Y(d.a + d.b * x[i])}" stroke="${ORANGE}" stroke-width="${i === selected ? 4 : 1.5}" opacity="${i === selected ? 1 : .40}"/>`;
        }
    if (opts.fit !== false)
        s += `<line x1="${X(xmin)}" y1="${Y(d.a + d.b * xmin)}" x2="${X(xmax)}" y2="${Y(d.a + d.b * xmax)}" stroke="${RED}" stroke-width="3"/>`;
    if (opts.pred !== undefined) {
        let xv = opts.pred, yv = d.a + d.b * xv;
        s += `<line x1="${X(xv)}" y1="${H - m.b}" x2="${X(xv)}" y2="${Y(yv)}" stroke="${PURPLE}" stroke-dasharray="7 5" stroke-width="2"/><circle cx="${X(xv)}" cy="${Y(yv)}" r="8" fill="${PURPLE}"/>`;
    }
    for (let i = 0; i < x.length; i++) {
        let match = opts.pred !== undefined && opts.snapIndices && opts.snapIndices.includes(i);
        let nearby = opts.pred !== undefined && opts.nearIndices && opts.nearIndices.includes(i);
        if (match) {
            s += `<line x1="${X(x[i])}" x2="${X(x[i])}" y1="${Y(y[i])}" y2="${Y(d.a + d.b * x[i])}" stroke="${ORANGE}" stroke-width="2.6" opacity=".85"/>`;
        }
        s += `<circle ${opts.clickable ? 'data-point="' + i + '"' : ''} ${opts.pred !== undefined ? 'data-pred-point="' + i + '"' : ''} cx="${X(x[i])}" cy="${Y(y[i])}" r="${match ? 8.2 : opts.clickable && i === selected ? 9 : 6.7}" fill="${match ? ORANGE : opts.clickable && i === selected ? ORANGE : BLUE}" fill-opacity=".84" stroke="${match ? '#b05200' : nearby ? ORANGE : BLUE}" stroke-width="${nearby ? 2 : 1}" style="${opts.clickable || opts.pred !== undefined ? 'cursor:pointer' : ''}"><title>第 ${i + 1} 位：X=${x[i]}, Y=${y[i]}</title></circle>`;
    }
    s += '</svg>';
    $(target).innerHTML = s;
    if (opts.clickable)
        $(target).querySelectorAll('[data-point]').forEach(n => n.addEventListener('click', () => { selected = +n.dataset.point; updateResidual(); }));
    if (opts.pred !== undefined)
        $(target).querySelectorAll('[data-pred-point]').forEach(n => n.addEventListener('click', () => { const i = +n.dataset.predPoint; $('predictX').value = dat.x[i]; updatePred(); }));
    return d;
}
function plotRF(dat) { let d = lin(dat.x, dat.y), fitted = dat.x.map(v => d.a + d.b * v), z = svgBase(fitted, d.res, ['预测值 Ŷ', '残差 e'], { zero: true }), { s, X, Y, xmin, xmax } = z; s += `<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 5"/>`; for (let i = 0; i < dat.x.length; i++)
    s += `<circle cx="${X(fitted[i])}" cy="${Y(d.res[i])}" r="${dat.x.length > 200 ? 3.2 : 4.7}" fill="${BLUE}" opacity=".68"/>`; s += '</svg>'; $('diagRF').innerHTML = s; }
function plotQQ(dat) {
    let d = lin(dat.x, dat.y), arr = d.res.slice().sort((a, b) => a - b), n = arr.length, t = arr.map((_, i) => normInv((i + .5) / n)), q1 = a => { let pos = (a.length - 1) * .25, i = Math.floor(pos); return a[i] + (pos - i) * (a[i + 1] - a[i]); }, q3 = a => { let pos = (a.length - 1) * .75, i = Math.floor(pos); return a[i] + (pos - i) * (a[i + 1] - a[i]); };
    let slope = (q3(arr) - q1(arr)) / (q3(t) - q1(t)), inter = q1(arr) - slope * q1(t);
    let z = svgBase(t, arr, ['理论正态分位数', '残差分位数']), { s, X, Y, xmin, xmax, ymin, ymax } = z;
    // Reference line is only drawn inside the chart area (clip to both axes).
    let xLeft = xmin, xRight = xmax;
    if (Math.abs(slope) > 1e-12) {
        let ya = (ymin - inter) / slope, yb = (ymax - inter) / slope;
        xLeft = Math.max(xmin, Math.min(ya, yb));
        xRight = Math.min(xmax, Math.max(ya, yb));
    }
    if (xLeft <= xRight)
        s += `<line x1="${X(xLeft)}" y1="${Y(inter + slope * xLeft)}" x2="${X(xRight)}" y2="${Y(inter + slope * xRight)}" stroke="${RED}" stroke-width="2"/>`;
    for (let i = 0; i < n; i++)
        s += `<circle cx="${X(t[i])}" cy="${Y(arr[i])}" r="${n > 200 ? 3.2 : 4.5}" fill="${BLUE}" opacity=".68"/>`;
    s += '</svg>';
    $('diagQQ').innerHTML = s;
}

