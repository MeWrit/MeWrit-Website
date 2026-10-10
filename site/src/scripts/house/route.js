/* A camera's way from one view to another through fixed points (site/docs/redesign-plan.md, 11.6 and
   11.12): one continuous path that never swings past a point. Each coordinate is a monotone cubic
   through the points (Fritsch and Carlson), so between two points it only moves one way, and the path
   bends smoothly where its direction changes. The camera goes at an even pace along the path's length,
   eased at both ends, and the lens (field of view, shift) and the turn go evenly from the first view's
   to the last's. The first and last points are the views' own eyes, so the path follows the views when
   the window's shape changes them. */
const AXES = 3, SAMPLES = 240;

function monotone(t, v) {
  const n = t.length, d = [], m = new Array(n).fill(0);
  for (let k = 0; k < n - 1; k++) d.push((v[k + 1] - v[k]) / (t[k + 1] - t[k]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
    const a = m[k] / d[k], b = m[k + 1] / d[k], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); m[k] = tau * a * d[k]; m[k + 1] = tau * b * d[k]; }
  }
  return x => {
    let k = 0;
    while (k < n - 2 && x > t[k + 1]) k++;
    const h = t[k + 1] - t[k], u = Math.min(1, Math.max(0, (x - t[k]) / h)), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v[k] + (u3 - 2 * u2 + u) * h * m[k] + (-2 * u3 + 3 * u2) * v[k + 1] + (u3 - u2) * h * m[k + 1];
  };
}

// points: the eyes the way passes through, between the two views' own; a point may carry a fourth
// number, the way the camera faces there (yaw, degrees): the turn then follows the path through those
// headings (monotone too, so a turn never swings back), instead of going evenly from view to view
export function route(points, ease = t => .5 - .5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) {
  let key = '', curve = null;
  const turns = points.every(p => p.length > 3);
  function build(a, b, ya, yb) {
    const P = [a, ...points, b], t = [0];
    for (let i = 1; i < P.length; i++) t.push(t[i - 1] + Math.max(1e-3, Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2])));
    const f = Array.from({ length: AXES }, (_, j) => monotone(t, P.map(p => p[j])));
    const yaw = turns ? monotone(t, [ya, ...points.map(p => p[3]), yb]) : null;
    const at = x => f.map(g => g(x));
    // the length along the curve, sampled, so the camera can go at an even pace along it
    const T = t[t.length - 1], ts = [], ls = [0];
    let prev = at(0);
    for (let i = 0; i <= SAMPLES; i++) {
      const x = T * i / SAMPLES, q = at(x);
      ts.push(x);
      if (i) ls.push(ls[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]));
      prev = q;
    }
    curve = { at, ts, ls, L: ls[SAMPLES], yaw };
  }
  return {
    // the pose a share m (0 to 1) of the way from view a to view b
    pose(a, b, m) {
      const k = `${a.p.join()}|${b.p.join()}|${a.yaw || 0}|${b.yaw || 0}`;
      if (k !== key) { key = k; build(a.p, b.p, a.yaw || 0, b.yaw || 0); }
      const e = ease(m), s = e * curve.L, { ts, ls } = curve;
      let lo = 0, hi = SAMPLES;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ls[mid] < s) lo = mid; else hi = mid; }
      const x = ts[lo] + (ts[hi] - ts[lo]) * ((s - ls[lo]) / Math.max(1e-9, ls[hi] - ls[lo]));
      const mix = (u, v) => u + (v - u) * e;
      return { p: curve.at(x), yaw: curve.yaw ? curve.yaw(x) : mix(a.yaw || 0, b.yaw || 0), pitch: mix(a.pitch || 0, b.pitch || 0), fov: mix(a.fov, b.fov), sx: mix(a.sx || 0, b.sx || 0), sy: mix(a.sy || 0, b.sy || 0) };
    },
    // where the eye is a share m of the way (for tests: the path's own points)
    length() { return curve ? curve.L : 0; },
  };
}
