// SVG chart drawing.
const C = { blue: '#0047AB', red: '#C8102E', gray: '#666' };
const labels = { exercise: '每周锻炼时间（小时）', depression: '抑郁得分', sleep_quality: '睡眠质量（1–5级）', screen_time: '每天手机使用时间（小时）', club: '参加社团（0/1）' };
function nice(lo, hi) { let delta = hi - lo || 1, magnitude = 10 ** Math.floor(Math.log10(delta / 5)); let step = [1, 2, 2.5, 5, 10].map(x => x * magnitude).find(x => delta / x <= 6) || magnitude * 10; let out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step)
    out.push(+v.toFixed(8)); return out; }
function graph(id, x, y, options = {}) {
    let W = 840, H = 520, margin = { l: 92, r: 27, t: 28, b: 81 };
    let x0 = Math.min(...x), x1 = Math.max(...x), y0 = Math.min(...y), y1 = Math.max(...y), dx = (x1 - x0 || 1) * .13, dy = (y1 - y0 || 1) * .14;
    x0 -= dx;
    x1 += dx;
    y0 -= dy;
    y1 += dy;
    let X = v => margin.l + (v - x0) / (x1 - x0) * (W - margin.l - margin.r), Y = v => H - margin.b - (v - y0) / (y1 - y0) * (H - margin.t - margin.b), s = `<svg viewBox="0 0 ${W} ${H}" aria-label="散点图" role="img">`;
    for (let t of nice(x0, x1))
        s += `<line x1="${X(t)}" y1="${H - margin.b}" x2="${X(t)}" y2="${H - margin.b + 6}" stroke="#444"/><text x="${X(t)}" y="${H - margin.b + 27}" text-anchor="middle" font-size="18">${+t.toFixed(2)}</text>`;
    for (let t of nice(y0, y1))
        s += `<line x1="${margin.l - 6}" y1="${Y(t)}" x2="${margin.l}" y2="${Y(t)}" stroke="#444"/><text x="${margin.l - 11}" y="${Y(t) + 6}" text-anchor="end" font-size="18">${+t.toFixed(2)}</text>`;
    s += `<path d="M${margin.l} ${margin.t}V${H - margin.b}H${W - margin.r}" stroke="#222" stroke-width="1.7" fill="none"/><text x="${(margin.l + W - margin.r) / 2}" y="${H - 14}" font-size="21" text-anchor="middle">${options.xlab || 'X'}</text><text transform="translate(23 ${(margin.t + H - margin.b) / 2}) rotate(-90)" font-size="21" text-anchor="middle">${options.ylab || 'Y'}</text>`;
    if (options.fit) {
        let mx = mean(x), my = mean(y), cov = 0, xx = 0;
        for (let i = 0; i < x.length; i++) {
            cov += (x[i] - mx) * (y[i] - my);
            xx += (x[i] - mx) ** 2;
        }
        let b = cov / xx, a = my - b * mx;
        s += `<line x1="${X(x0)}" y1="${Y(a + b * x0)}" x2="${X(x1)}" y2="${Y(a + b * x1)}" stroke="${C.red}" stroke-width="3"/>`;
    }
    for (let i = 0; i < x.length; i++)
        s += `<circle cx="${X(x[i])}" cy="${Y(y[i])}" r="${options.mini ? 7 : 5.5}" fill="${C.blue}" opacity=".69"><title>被试 ${i + 1}：${x[i]}，${y[i]}</title></circle>`;
    $(id).innerHTML = s + '</svg>';
}

