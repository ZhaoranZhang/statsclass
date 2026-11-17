// Seeded simulation with an exact sample correlation.
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(R) { let u = 0, v = 0; while (!u)
    u = R(); while (!v)
    v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function normalized(a) { let m = mean(a), v = a.map(x => x - m), norm = Math.hypot(...v); return v.map(x => x / norm); }
function sampleExact(r, n, seed) { const R = rng(seed); let x = normalized(Array.from({ length: n }, () => randn(R))), e = Array.from({ length: n }, () => randn(R)); let projection = e.reduce((s, v, i) => s + v * x[i], 0), z = normalized(e.map((v, i) => v - projection * x[i])); let y = x.map((v, i) => r * v + Math.sqrt(1 - r * r) * z[i]); return { x: x.map(v => v * Math.sqrt(n)), y: y.map(v => v * Math.sqrt(n)) }; }

