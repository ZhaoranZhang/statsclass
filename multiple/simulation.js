// Simulated samples. Depends on Stats.
function simulate(a, c, seed, n = 120) {
  const R = Stats.rng(seed * 7919 + 17);
  const screen = [], sleep = [], dep = [];
  for (let i = 0; i < n; i++) {
    const s0 = R.normal();
    const sl = a * s0 + Math.sqrt(Math.max(1 - a * a, 0.05)) * R.normal();
    const d0 = c * s0 + 0.6 * sl + 0.8 * R.normal();
    screen.push(5.3 + 1.8 * s0); sleep.push(5.2 + 2.5 * sl); dep.push(12 + 5 * d0);
  }
  return { screen_time: screen, psqi: sleep, depression: dep };
}

function collSim(r12, n = 60, reps = 400, b = 0.4) {
  const R = Stats.rng(2026);
  const out = [];
  const L = Math.sqrt(1 - r12 * r12);
  for (let k = 0; k < reps; k++) {
    const x1 = [], x2 = [], y = [];
    for (let i = 0; i < n; i++) { const a = R.normal(), c = r12 * a + L * R.normal(); x1.push(a); x2.push(c); y.push(b * a + b * c + R.normal()); }
    const m = Stats.ols([x1, x2], y);
    out.push({ b1: m.coef[1], b2: m.coef[2], se: m.se[1], p: m.p[1] });
  }
  return out;
}
