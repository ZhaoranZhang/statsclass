// Deterministic diagnostic datasets, so controls reproduce the same plots.
function rng(a) { return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function normal(R) { let u = 0, v = 0; while (!u)
    u = R(); while (!v)
    v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function simData(kind, seed) {
    const R = rng(seed), x = [], y = [], n = +$('diagN').value;
    for (let i = 0; i < n; i++) {
        const xi = 12 * R(), z = normal(R);
        let noise = z * 2.0;
        if (kind === 'curve')
            noise = 0.48 * (xi - 6) ** 2 - 5.8 + z * 1.1;
        if (kind === 'funnel')
            noise = z * (0.3 + xi * .95);
        if (kind === 'skew')
            noise = 4.0 * (Math.exp(.72 * z) - Math.exp(.72 * .72 / 2));
        if (kind === 'tail') {
            noise = z * 1.4;
            if (R() < .10)
                noise += (R() < .5 ? -1 : 1) * (16 + 8 * R());
        }
        x.push(xi);
        y.push(19 - xi + noise);
    }
    return { x, y };
}
// Acklam inverse normal CDF

