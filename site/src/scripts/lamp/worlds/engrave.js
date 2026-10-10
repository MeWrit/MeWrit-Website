/* The engraver's kit for the lamplight worlds (index.js lists them). Every place is drawn as a
   luminous engraving: fine strokes and hatched shading that glow faintly in the dark, lit by warm
   lamps and cool moonlight, with fog swallowing the distance. The light on every stroke is worked out
   once, as the plate is cut (lighting); the builders below collect the strokes, the solids that hide
   what stands behind them, the glows, the light shafts and the drifting motes; assemble() turns a
   finished plate into the World the film asks for (the contract is in index.js).
   Colours are linear light, as three.js's colour management expects: the film's tone mapping and
   bloom come after, so a stroke stays modest (about .25 to .7) and only the lamps and highlights
   reach the bloom. Nothing here imports three.js: the factories are handed the film's own copy. */

// ---------- numbers ----------

// a seeded random source, so every build cuts the same plate
export function random(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toLinear = c => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
// a colour in linear light from its sRGB hex, times a strength
export function rgb(hex, k = 1) {
  const n = parseInt(hex.slice(1), 16);
  return [toLinear((n >> 16 & 255) / 255) * k, toLinear((n >> 8 & 255) / 255) * k, toLinear((n & 255) / 255) * k];
}
// two colours mixed, in linear light
export const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// small vector helpers on plain arrays
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// the point o + u x + v y: a place on the plane through o spanned by u and v
export const on = (o, u, x, v, y) => [o[0] + u[0] * x + v[0] * y, o[1] + u[1] * x + v[1] * y, o[2] + u[2] * x + v[2] * y];
// two unit vectors square to each other and to the unit vector a
export function basis(a) {
  const u = norm(cross(Math.abs(a[1]) < .9 ? [0, 1, 0] : [1, 0, 0], a));
  return [u, cross(a, u)];
}
// a box's corners: centre c, size s, turned `yaw` radians about the upright; p(i, j, k) with each of
// i, j, k -1 or 1 (or anything between, for a point on a face)
export function corners(c, s, yaw = 0) {
  const co = Math.cos(yaw), si = Math.sin(yaw), h = [s[0] / 2, s[1] / 2, s[2] / 2];
  return (i, j, k) => { const x = i * h[0], z = k * h[2]; return [c[0] + x * co + z * si, c[1] + j * h[1], c[2] - x * si + z * co]; };
}

// ---------- light ----------

// The light that falls on a stroke at (x, y, z) on a face turned toward n (null for a stroke with no
// face of its own, such as an edge): the plate's ink at the place's ambient level, the moon's cool
// light where it reaches (moon.mask says where: a window's patch, a skylight's shaft), and the lamps'
// warm light, kept apart as the fourth number because the film makes the lamps flicker. A lamp is
// { p, k, range } with, optionally, dir and cone ([cos inner, cos outer]) for a shaded lamp, and
// tight for one whose light keeps to a small pool. Returns the same array every time; read it at once.
export function lighting({ ink, ambient = .6, moon = null, lamps = [] }) {
  const out = [0, 0, 0, 0], mc = moon ? rgb(moon.col, moon.k) : null;
  const reach = lamps.map(l => (l.range * (l.tight ? 5 : 40)) ** 2);
  return (x, y, z, n) => {
    let r = ink[0] * ambient, g = ink[1] * ambient, b = ink[2] * ambient, lamp = 0;
    if (moon) {
      const m = moon.mask ? moon.mask(x, y, z) : 1;
      if (m > 0) {
        const f = m * (n ? .3 + .7 * Math.max(0, -(n[0] * moon.dir[0] + n[1] * moon.dir[1] + n[2] * moon.dir[2])) : .75);
        r += mc[0] * f; g += mc[1] * f; b += mc[2] * f;
      }
    }
    for (let i = 0; i < lamps.length; i++) {
      const l = lamps[i], dx = x - l.p[0], dy = y - l.p[1], dz = z - l.p[2], d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > reach[i]) continue;
      const d = Math.sqrt(d2) || 1e-3, f = 1 + d2 / (l.range * l.range);
      let k = l.k / (l.tight ? f * f : f);
      if (l.cone) k *= smooth(l.cone[1], l.cone[0], (dx * l.dir[0] + dy * l.dir[1] + dz * l.dir[2]) / d);
      if (n) k *= .25 + .75 * Math.max(0, -(n[0] * dx + n[1] * dy + n[2] * dz) / d);
      lamp += k;
    }
    out[0] = r; out[1] = g; out[2] = b; out[3] = lamp;
    return out;
  };
}

// ---------- strokes ----------

// The plate's strokes, as pairs of points, each point carrying the light that falls on it (and the
// lamps' share of it) and the stroke's weight there (a contour is heavier than hatching). They are
// drawn as smooth-edged quads a little over a CSS pixel wide (wider and brighter with the weight),
// one instance per stroke, so they stay fine and unbroken on any screen without the film needing
// multisampling. R is the plate's random source, for the engraver's small irregularities.
export function strokes(light, R = random(7)) {
  const P = [], C = [], K = [], B = [];
  const put = (x, y, z, w, n) => {
    P.push(x, y, z); B.push(w);
    if (S.paint) { C.push(S.paint[0], S.paint[1], S.paint[2]); K.push(0); return; }
    const l = light(x, y, z, n), t = S.tint;
    if (t) C.push(l[0] * t[0], l[1] * t[1], l[2] * t[2]); else C.push(l[0], l[1], l[2]);
    K.push(l[3]);
  };
  const S = {
    R,
    // paint: a fixed colour for the strokes that follow (gold, an orange rule), unlit; tint: a
    // colour the light is multiplied by (a green glass shade); null for neither
    paint: null, tint: null,
    // a straight stroke from a to b, cut into pieces at most `step` long (0: one piece) so the light
    // can change along it; w1 (optional) is its weight at b, for strokes that swell or taper
    seg(a, b, w = .5, n = null, step = 0, w1 = w) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const k = step > 0 ? Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / step)) : 1;
      for (let i = 0; i < k; i++) {
        const t0 = i / k, t1 = (i + 1) / k;
        put(a[0] + dx * t0, a[1] + dy * t0, a[2] + dz * t0, w + (w1 - w) * t0, n);
        put(a[0] + dx * t1, a[1] + dy * t1, a[2] + dz * t1, w + (w1 - w) * t1, n);
      }
    },
    // a stroke that swells in its middle and fades at both ends, as a burin's cut does
    cut(a, b, w = .4, n = null, step = 0, ends = .25) {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      S.seg(a, m, w * ends, n, step, w); S.seg(m, b, w, n, step, w * ends);
    },
    // a polyline through pts (closed joins the last to the first)
    poly(pts, w = .5, n = null, closed = false, step = 0) {
      for (let i = 0, e = pts.length - (closed ? 0 : 1); i < e; i++) S.seg(pts[i], pts[(i + 1) % pts.length], w, n, step);
    },
    // a curve: f(t) gives a point for t in [0, 1], drawn in k pieces; wf(t) (optional) its weight
    curve(f, k, w = .5, n = null, wf = null) {
      let a = f(0), wa = wf ? wf(0) * w : w;
      for (let i = 1; i <= k; i++) { const t = i / k, b = f(t), wb = wf ? wf(t) * w : w; S.seg(a, b, wa, n, 0, wb); a = b; wa = wb; }
    },
    // the outline of the parallelogram with corner o and sides u, v
    quad(o, u, v, w = .5, n = null, step = 0) {
      const a = o, b = add(o, u), c = add(b, v), d = add(o, v);
      S.seg(a, b, w, n, step); S.seg(b, c, w, n, step); S.seg(c, d, w, n, step); S.seg(d, a, w, n, step);
    },
    // a box's twelve edges: centre c, size s, turned `yaw` radians about the upright
    box(c, s, w = .5, step = 0, yaw = 0) {
      const p = corners(c, s, yaw);
      for (const j of [-1, 1]) for (const k of [-1, 1]) S.seg(p(-1, j, k), p(1, j, k), w, null, step);
      for (const i of [-1, 1]) for (const k of [-1, 1]) S.seg(p(i, -1, k), p(i, 1, k), w, null, step);
      for (const i of [-1, 1]) for (const j of [-1, 1]) S.seg(p(i, j, -1), p(i, j, 1), w, null, step);
    },
    // Hatching: parallel strokes across a face, `angle` (radians) from u, `gap` apart (world units),
    // each a little uneven in spacing, weight and length, as an engraver's are. The face is the
    // rectangle with corner o and sides u, v (square to each other), or `shape`, a convex polygon
    // in the face's own units (x along u, y along v, counter-clockwise). fade(x, y) (optional) scales
    // a stroke's weight from where it lies on the face, for shading that gathers toward an edge.
    hatch(o, u, v, { angle = 0, gap = .3, w = .3, n = null, jitter = .3, trim = .3, step = 0, shape = null, fade = null, taper = false } = {}) {
      const W = len(u), H = len(v), uh = scale(u, 1 / W), vh = scale(v, 1 / H);
      const poly = shape || [[0, 0], [W, 0], [W, H], [0, H]];
      const dx = Math.cos(angle), dy = Math.sin(angle), mx = -dy, my = dx;
      let c0 = Infinity, c1 = -Infinity;
      for (const p of poly) { const c = p[0] * mx + p[1] * my; c0 = Math.min(c0, c); c1 = Math.max(c1, c); }
      for (let c = c0 + gap * (.5 + (R() - .5) * jitter); c < c1; c += gap * (1 + (R() - .5) * jitter)) {
        let s0 = -Infinity, s1 = Infinity;
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i], q = poly[(i + 1) % poly.length], nx = p[1] - q[1], ny = q[0] - p[0];
          const num = (c * mx - p[0]) * nx + (c * my - p[1]) * ny, den = dx * nx + dy * ny;
          if (Math.abs(den) < 1e-9) { if (num < 0) { s0 = 1; s1 = 0; } continue; }
          const s = -num / den;
          if (den > 0) s0 = Math.max(s0, s); else s1 = Math.min(s1, s);
        }
        s0 += R() * trim * gap; s1 -= R() * trim * gap;
        if (s1 - s0 < gap * .5) continue;
        const ax = c * mx + s0 * dx, ay = c * my + s0 * dy, bx = c * mx + s1 * dx, by = c * my + s1 * dy;
        const k = w * (1 - R() * .3) * (fade ? fade((ax + bx) / 2, (ay + by) / 2) : 1);
        if (k <= .005) continue;
        const a = [o[0] + uh[0] * ax + vh[0] * ay, o[1] + uh[1] * ax + vh[1] * ay, o[2] + uh[2] * ax + vh[2] * ay];
        const b = [o[0] + uh[0] * bx + vh[0] * by, o[1] + uh[1] * bx + vh[1] * by, o[2] + uh[2] * bx + vh[2] * by];
        if (taper) S.cut(a, b, k, n, step); else S.seg(a, b, k, n, step);
      }
    },
    // a ring: centre c, radius r, in the plane spanned by the unit vectors u and v
    ring(c, r, u = [1, 0, 0], v = [0, 0, 1], w = .5, k = 32, n = null) {
      S.curve(t => on(c, u, Math.cos(t * Math.PI * 2) * r, v, Math.sin(t * Math.PI * 2) * r), k, w, n);
    },
    // A cylinder or cone along `axis` (unit) from b, h long, radii r0 at b and r1 at the far end,
    // engraved as strokes along its length, so the light on each stroke models it (turned from the
    // light, they fall faint), with rings (`rings`: how many in all, foot to top).
    tube(b, axis, h, r0, r1 = r0, { count = 24, w = .35, rings = 2, ringW = .5, step = 0, from = 0, to = 1 } = {}) {
      const [u, v] = basis(axis);
      for (let i = 0; i < count; i++) {
        const a = (from + (to - from) * (i + R() * .3) / count) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
        const rad = [u[0] * cx + v[0] * cz, u[1] * cx + v[1] * cz, u[2] * cx + v[2] * cz];
        const n = norm(add(scale(rad, h), scale(axis, r0 - r1)));
        S.seg(add(b, scale(rad, r0)), add(add(b, scale(axis, h)), scale(rad, r1)), w * (1 - R() * .2), n, step);
      }
      for (let i = 0; i < rings; i++) { const t = rings > 1 ? i / (rings - 1) : 0; S.ring(add(b, scale(axis, h * t)), lerp(r0, r1, t), u, v, ringW, 40); }
    },
    // an upright tube: foot centre b, height h
    column(b, h, r0, r1 = r0, opts = {}) { S.tube(b, [0, 1, 0], h, r0, r1, opts); },
    // a curved horizon: the crest y = f(x) from x0 to x1 at depth z, in steps; returns its points
    // (for a solid hill beneath it)
    horizon(f, z, x0, x1, step = 4, w = .5, n = [0, 1, 0]) {
      const pts = [];
      for (let x = x0; x <= x1 + 1e-6; x += step) pts.push([x, f(x), z]);
      for (let i = 0; i < pts.length - 1; i++) S.seg([pts[i][0], pts[i][1] + .05, z + .2], [pts[i + 1][0], pts[i + 1][1] + .05, z + .2], w, n);
      return pts;
    },
    // the strokes' ends (two per stroke): what the budget counts
    get count() { return P.length / 3; },
    // one instance per stroke: both ends, their light, the lamps' share and the weight
    geometry(THREE) {
      const n = P.length / 6, data = new Float32Array(n * 16);
      for (let i = 0; i < n; i++) {
        const o = i * 16, p = i * 6, k = i * 2;
        for (let j = 0; j < 6; j++) { data[o + j] = P[p + j]; data[o + 6 + j] = C[p + j]; }
        data[o + 12] = K[k]; data[o + 13] = K[k + 1]; data[o + 14] = B[k]; data[o + 15] = B[k + 1];
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      const ib = new THREE.InstancedInterleavedBuffer(data, 16, 1);
      g.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
      g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
      g.setAttribute('aColA', new THREE.InterleavedBufferAttribute(ib, 3, 6));
      g.setAttribute('aColB', new THREE.InterleavedBufferAttribute(ib, 3, 9));
      g.setAttribute('aLamp', new THREE.InterleavedBufferAttribute(ib, 2, 12));
      g.setAttribute('aW', new THREE.InterleavedBufferAttribute(ib, 2, 14));
      g.instanceCount = n;
      return g;
    },
  };
  return S;
}

// a rolling line, as for a range of hills: base plus waves, each [frequency, amplitude, phase]
export const rolling = (base, waves) => x => waves.reduce((s, [f, a, p]) => s + Math.sin(x * f + p) * a, base);

// A star field on a dome of radius r about the origin: count stars over the part of the sky that
// seen(azimuth, elevation) allows (degrees; azimuth 0 along -z, growing toward +x), thinning toward
// the horizon, a share of them gathered into the band of a great circle about the pole `band` (the
// Milky Way). Most are faint and a few bright; sizes are in pixels, as for stars.
export function starField(M, R, { count, r, seen, band = null, share = .4, width = 7, tints, faint = .5, sizeK = 1 }) {
  const D = Math.PI / 180;
  const azel = v => [Math.atan2(v[0], -v[2]) / D, Math.asin(Math.max(-1, Math.min(1, v[1] / len(v)))) / D];
  const [ba, bb] = band ? basis(band) : [null, null];
  const gauss = () => (R() + R() + R() - 1.5) * 1.15;
  for (let i = 0, tries = 0; i < count && tries < count * 8; tries++) {
    let v;
    const inBand = band && R() < share;
    if (inBand) {
      const a = R() * Math.PI * 2, off = gauss() * width * D;
      v = add(scale(add(scale(ba, Math.cos(a)), scale(bb, Math.sin(a))), Math.cos(off)), scale(band, Math.sin(off)));
    } else {
      const y = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - y * y);
      v = [Math.cos(a) * s, y, Math.sin(a) * s];
    }
    const [az, el] = azel(v);
    if (!seen(az, el) || R() > .3 + .7 * Math.sin(Math.max(0, el + 4) * D * 1.6)) continue;
    const m = Math.pow(R(), inBand ? 4 : 3), t = R();
    M.add(scale(norm(v), r), { size: (1.5 + m * 2.2 + (m > .9 ? 1.1 : 0)) * sizeK, col: tints[t < .76 ? 0 : t < .89 ? 1 : 2], bright: (inBand ? faint - .1 : faint) + m * 2.2, rate: .4 + R() * 1.6, phase: R() });
    i++;
  }
}

// the outline of an arched opening in its own plane (x across, y up): the jambs from the sill (y 0)
// to the springing line, then a round arch, or a pointed one (pointed 0 to 1: how far the two arcs'
// centres move apart), k points along the arch; counter-clockwise from the right foot
export function archOutline(width, spring, { pointed = 0, k = 24 } = {}) {
  const r = width / 2, pts = [[r, 0], [r, spring]];
  if (pointed <= 0) {
    for (let i = 1; i < k; i++) { const a = Math.PI * i / k; pts.push([Math.cos(a) * r, spring + Math.sin(a) * r]); }
  } else {
    const R = r * (1 + pointed), top = Math.sqrt(R * R - (R - r) * (R - r));
    const half = Math.ceil(k / 2);
    for (let i = 1; i <= half; i++) { const y = top * i / half, x = (r - R) + Math.sqrt(Math.max(0, R * R - y * y)); pts.push([x, spring + y]); }
    for (let i = half - 1; i >= 1; i--) { const y = top * i / half, x = (r - R) + Math.sqrt(Math.max(0, R * R - y * y)); pts.push([-x, spring + y]); }
  }
  pts.push([-r, spring], [-r, 0]);
  return pts;
}

// ---------- solids ----------

// What hides what stands behind it: plain solids that only write depth (the strokes on their faces
// stay in front: the solids are drawn a hair behind their own surfaces), and dark solids that also
// paint (a land at dawn, a window's frame against the sky).
export function solids() {
  const P = [], I = [];
  const S = {
    // a flat four-cornered face (any winding: solids are drawn from both sides)
    face(a, b, c, d) { const i = P.length / 3; P.push(...a, ...b, ...c, ...d); I.push(i, i + 1, i + 2, i, i + 2, i + 3); },
    // a box: centre c, size s, turned `yaw` radians about the upright
    box(c, s, yaw = 0) {
      const p = corners(c, s, yaw);
      S.face(p(-1, -1, 1), p(1, -1, 1), p(1, 1, 1), p(-1, 1, 1)); S.face(p(1, -1, -1), p(-1, -1, -1), p(-1, 1, -1), p(1, 1, -1));
      S.face(p(-1, -1, -1), p(-1, -1, 1), p(-1, 1, 1), p(-1, 1, -1)); S.face(p(1, -1, 1), p(1, -1, -1), p(1, 1, -1), p(1, 1, 1));
      S.face(p(-1, 1, 1), p(1, 1, 1), p(1, 1, -1), p(-1, 1, -1)); S.face(p(-1, -1, -1), p(1, -1, -1), p(1, -1, 1), p(-1, -1, 1));
    },
    // a cylinder or cone along `axis` (unit) from b, h long, radii r0 and r1, k sides (k even);
    // `open` leaves the far end open (a lamp's shade)
    tube(b, axis, h, r0, r1 = r0, k = 18, open = false) {
      const [u, v] = basis(axis), e = add(b, scale(axis, h));
      const at = (c, r, a) => add(c, add(scale(u, Math.cos(a) * r), scale(v, Math.sin(a) * r)));
      for (let i = 0; i < k; i++) {
        const a0 = i / k * Math.PI * 2, a1 = (i + 1) / k * Math.PI * 2;
        S.face(at(b, r0, a0), at(b, r0, a1), at(e, r1, a1), at(e, r1, a0));
      }
      const cap = (c, r) => { for (let i = 0; i < k; i += 2) S.face(c, at(c, r, i / k * Math.PI * 2), at(c, r, (i + 1) / k * Math.PI * 2), at(c, r, (i + 2) / k * Math.PI * 2)); };
      cap(b, r0); if (!open) cap(e, r1);
    },
    // an upright cylinder or cone: foot centre b, height h
    column(b, h, r0, r1 = r0, k = 18) { S.tube(b, [0, 1, 0], h, r0, r1, k); },
    // a strip of quads between two polylines of equal length (a hill's face, a window's frame)
    strip(top, bottom) { for (let i = 0; i < top.length - 1; i++) S.face(bottom[i], bottom[i + 1], top[i + 1], top[i]); },
    get count() { return I.length / 3; },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setIndex(I);
      return g;
    },
  };
  return S;
}

// ---------- glows ----------

// Soft glows, one draw for all of a plate's: a lamp's head, a pool of light on a desk, a sun below
// the horizon, a bank of fog. bill() faces the eye (half-size in world units), flat() lies in the
// plane of its half-axes u and v. col is linear light with its strength; lamp is the share that
// follows the lamps' flicker (in the lamps' colour); sharp narrows the core; clear is how much the
// page's clear zone holds it down (a bank of fog barely: a dark box in the haze would show); fog
// false for a light that shines through the fog (the glow at the end of an aisle, a sun).
export function glows() {
  const P = [], Q = [], U = [], V = [], C = [], M = [], I = [];
  const put = (c, u, v, col, mode, sharp, lamp, clear) => {
    const i = P.length / 3;
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(...c); Q.push(x, y); U.push(...u); V.push(...v); C.push(...col); M.push(mode, sharp, lamp, clear); }
    I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  return {
    bill(c, size, col, { lamp = 0, sharp = 3, clear = 1, fog = true } = {}) { put(c, [size[0], size[1], 0], [0, 0, 0], col, fog ? 1 : 3, sharp, lamp, clear); },
    flat(c, u, v, col, { lamp = 0, sharp = 3, clear = 1, fog = true } = {}) { put(c, u, v, col, fog ? 0 : 2, sharp, lamp, clear); },
    get count() { return P.length / 12; },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aCorner', new THREE.Float32BufferAttribute(Q, 2));
      g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 3));
      g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aMode', new THREE.Float32BufferAttribute(M, 4));
      g.setIndex(I);
      return g;
    },
  };
}

// ---------- light shafts ----------

// Shafts of light (a high window's, a skylight's): long soft ribbons from a (the window) to b (where
// the light lands), wa and wb wide at the two ends, that turn about their own length to face the eye.
export function shafts() {
  const P = [], B = [], Q = [], W = [], C = [], I = [];
  return {
    add(a, b, wa, wb, col) {
      const i = P.length / 3;
      for (const [x, y] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(...a); B.push(...b); Q.push(x, y); W.push(wa, wb); C.push(...col); }
      I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    },
    get count() { return P.length / 12; },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aCorner', new THREE.Float32BufferAttribute(Q, 2));
      g.setAttribute('aWidth', new THREE.Float32BufferAttribute(W, 2));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setIndex(I);
      return g;
    },
  };
}

// ---------- motes and stars ----------

// Points: dust that drifts in slow loops and lights up as it crosses a light (assemble's `volumes`),
// or stars and far lamps that hold still and twinkle. size is in world units for dust, in pixels for
// stars (assemble's `stars`); col is the point's own faint light (linear); bright scales it all.
export function points() {
  const P = [], C = [], D = [], A = [];
  return {
    add(p, { size = .05, col = [.02, .02, .03], bright = 1, drift = [0, 0, 0], rate = .05, phase = 0 } = {}) {
      P.push(...p); C.push(...col); D.push(...drift); A.push(size, phase, rate, bright);
    },
    get count() { return P.length / 3; },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aDrift', new THREE.Float32BufferAttribute(D, 3));
      g.setAttribute('aRand', new THREE.Float32BufferAttribute(A, 4));
      return g;
    },
  };
}

// ---------- shaders ----------

// what changes every frame travels in one vec4 (a number stored in a three.js uniform's { value }
// would be boxed anew on every store; a Vector4's fields are written in place)
const COMMON = /* glsl */`
uniform vec4 uState;
#define uTime uState.x
#define uFogFrom uState.y
#define uOpacity uState.z
uniform float uFogDensity, uGain;
uniform vec3 uFog, uAnchor, uLamp;
uniform vec4 uClear;
uniform vec2 uNear;
// the light that survives the fog: nothing is lost up to the page's distance from the eye, then it
// falls away exponentially with the depth beyond, so a place reads the same at any camera distance
float fogAt(float d) { return exp(-uFogDensity * max(0., d - uFogFrom)); }
// far light also takes on the fog's hue
vec3 fogged(vec3 c, float k) {
  vec3 hue = uFog / max(max(uFog.r, uFog.g), max(uFog.b, 1e-4));
  return mix(hue * dot(c, vec3(.3, .59, .11)), c, k) * k;
}
// whatever the eye sees behind the page (or in front of it) is held down, so the page stays
// readable from any angle: the point's line of sight is carried to the page's plane and measured
// against a rounded rectangle about the anchor (uClear: half-width, half-height, floor, softness)
float clearAt(vec3 p) {
  vec3 c = cameraPosition - uAnchor, q = p - uAnchor;
  float den = c.z - q.z;
  if (c.z < .5 || den < .01) return 1.;
  vec2 h = abs(c.xy + (q.xy - c.xy) * (c.z / den)) - uClear.xy + 1.5;
  float sd = length(max(h, 0.)) + min(max(h.x, h.y), 0.) - 1.5;
  return mix(uClear.z, 1., smoothstep(-uClear.w, uClear.w, sd));
}
`;
const OUT = /* glsl */`
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

// a stroke: a quad from end a to end b, widened on the screen to a little over a CSS pixel (more
// with the weight) plus a pixel of soft edge, cut at the near plane if it runs behind the eye
const LINE_VS = /* glsl */`${COMMON}
attribute vec3 aA, aB, aColA, aColB;
attribute vec2 aLamp, aW;
uniform vec2 uRes;
uniform float uPx, uLineW;
varying vec3 vCol, vWorld;
varying float vEdge, vHalf;
void main() {
  vec4 wa = modelMatrix * vec4(aA, 1.), wb = modelMatrix * vec4(aB, 1.);
  vec4 va = viewMatrix * wa, vb = viewMatrix * wb;
  float near = -.5 * projectionMatrix[3][2] / projectionMatrix[2][2];
  if (va.z > near && vb.z > near) { gl_Position = vec4(2., 2., 2., 1.); return; }
  if (va.z > near) { float s = (near - va.z) / (vb.z - va.z); va = mix(va, vb, s); wa = mix(wa, wb, s); }
  else if (vb.z > near) { float s = (near - vb.z) / (va.z - vb.z); vb = mix(vb, va, s); wb = mix(wb, wa, s); }
  vec4 ca = projectionMatrix * va, cb = projectionMatrix * vb;
  vec2 sa = ca.xy / ca.w * uRes * .5, sb = cb.xy / cb.w * uRes * .5, d = sb - sa;
  float l = length(d);
  d = l > 1e-4 ? d / l : vec2(1., 0.);
  float t = position.y, w = mix(aW.x, aW.y, t);
  float hw = uLineW * uPx * mix(.36, .66, clamp(w / .6, 0., 1.));
  vec4 c = mix(ca, cb, t);
  vec2 off = vec2(-d.y, d.x) * position.x * (hw + 1.) + d * (t * 2. - 1.) * .6;
  c.xy += off / (uRes * .5) * c.w;
  gl_Position = c;
  vEdge = position.x * (hw + 1.); vHalf = hw;
  vWorld = mix(wa, wb, t).xyz;
  vCol = mix(aColA + uLamp * aLamp.x, aColB + uLamp * aLamp.y, t) * w;
}`;
const LINE_FS = /* glsl */`${COMMON}
varying vec3 vCol, vWorld;
varying float vEdge, vHalf;
void main() {
  // how much of this pixel the stroke covers: a soft edge, and a hairline thinner than a pixel
  // simply grows fainter
  float cover = clamp(vHalf + .5 - abs(vEdge), 0., 1.) * min(1., vHalf * 2.);
  if (cover <= 0.) discard;
  float d = distance(vWorld, cameraPosition);
  gl_FragColor = vec4(fogged(vCol, fogAt(d)) * smoothstep(uNear.x, uNear.y, d) * clearAt(vWorld) * cover * uGain, uOpacity);
  ${OUT}
}`;

const GLOW_VS = /* glsl */`${COMMON}
attribute vec2 aCorner;
attribute vec3 aU, aV, aCol;
attribute vec4 aMode;   // faces the eye (odd) or lies flat (even), plus 2 if it shines through the fog; sharpness, lamp share, how much the clear zone holds it down
varying vec2 vC;
varying vec3 vCol, vWorld;
varying float vSharp, vClear, vFog;
void main() {
  vec4 c = modelMatrix * vec4(position, 1.);
  vFog = aMode.x > 1.5 ? 0. : 1.;
  if (mod(aMode.x, 2.) > .5) {
    vec4 mv = viewMatrix * c;
    mv.xy += aCorner * aU.xy;
    vWorld = c.xyz;   // a glow that faces the eye is fogged and cleared as its centre is
    gl_Position = projectionMatrix * mv;
  } else {
    vec4 wp = c + modelMatrix * vec4(aCorner.x * aU + aCorner.y * aV, 0.);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
  vC = aCorner; vSharp = aMode.y; vClear = aMode.w;
  vCol = aCol + uLamp * aMode.z;
}`;
const GLOW_FS = /* glsl */`${COMMON}
varying vec2 vC;
varying vec3 vCol, vWorld;
varying float vSharp, vClear, vFog;
void main() {
  float r2 = dot(vC, vC);
  if (r2 >= 1.) discard;
  float d = distance(vWorld, cameraPosition);
  gl_FragColor = vec4(fogged(vCol * exp(-r2 * vSharp) * (1. - r2), mix(1., fogAt(d), vFog)) * mix(1., clearAt(vWorld), vClear) * smoothstep(uNear.x, uNear.y, d), uOpacity);
  ${OUT}
}`;

const SHAFT_VS = /* glsl */`${COMMON}
attribute vec3 aB, aCol;
attribute vec2 aCorner, aWidth;
varying vec2 vC;
varying vec3 vCol, vWorld;
void main() {
  vec3 a = (modelMatrix * vec4(position, 1.)).xyz, b = (modelMatrix * vec4(aB, 1.)).xyz;
  vec3 p = mix(a, b, aCorner.y);
  vec3 side = normalize(cross(b - a, cameraPosition - p));
  p += side * aCorner.x * mix(aWidth.x, aWidth.y, aCorner.y);
  vWorld = p; vC = aCorner; vCol = aCol;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const SHAFT_FS = /* glsl */`${COMMON}
varying vec2 vC;
varying vec3 vCol, vWorld;
void main() {
  float x = vC.x, y = vC.y, e = 1. - x * x;
  float k = e * e * smoothstep(0., .16, y) * (1. - smoothstep(.6, 1., y));
  // the beam is never even: slow streaks of thicker and thinner air run down it
  k *= .78 + .22 * sin(x * 7.1 + y * 17. + uTime * .06) * sin(x * 3.7 - y * 8.3 - uTime * .045);
  float d = distance(vWorld, cameraPosition);
  gl_FragColor = vec4(fogged(vCol * k, fogAt(d)) * clearAt(vWorld) * smoothstep(uNear.x, uNear.y, d), uOpacity);
  ${OUT}
}`;

const POINT_VS = /* glsl */`${COMMON}
attribute vec4 aRand;   // size, phase, rate, brightness
attribute vec3 aCol, aDrift;
uniform float uViewH, uPx, uStars, uTwinkle;
uniform int uVolN;
uniform vec4 uVolA[8], uVolB[8], uVolC[8];   // the lights dust can drift into: two ends with their radii, a colour with its strength
varying vec3 vCol;
varying float vA, vSize;
void main() {
  float t = uTime * aRand.z, ph = aRand.y * 6.2832;
  vec3 p = position + aDrift * vec3(sin(t + ph), sin(t * .71 + ph * 1.7), cos(t * .83 + ph * 2.3));
  vec4 wp = modelMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * viewMatrix * wp;
  vec3 lit = aCol;
  for (int i = 0; i < 8; i++) {
    if (i >= uVolN) break;
    vec3 a = uVolA[i].xyz, ab = uVolB[i].xyz - a;
    float s = clamp(dot(wp.xyz - a, ab) / dot(ab, ab), 0., 1.);
    float q = length(wp.xyz - a - ab * s) / mix(uVolA[i].w, uVolB[i].w, s);
    lit += uVolC[i].rgb * uVolC[i].a * (1. - smoothstep(.4, 1., q)) * smoothstep(0., .1, s) * (1. - smoothstep(.85, 1., s));
  }
  float tw = 1. - uTwinkle * (.5 + .5 * sin(uTime * (.5 + aRand.z * 2.) + ph * 7.));
  float px = uStars > .5 ? aRand.x * uPx : aRand.x * uViewH * projectionMatrix[1][1] * .5 / gl_Position.w;
  float s = max(px, 1.6);
  float d = distance(wp.xyz, cameraPosition);
  // a point smaller than a pixel keeps its light by growing fainter, not by growing
  vA = fogAt(d) * clearAt(wp.xyz) * smoothstep(uNear.x, uNear.y, d) * min(1., px * px / (s * s));
  vCol = lit * aRand.w * tw;
  vSize = min(s, 48.);
  gl_PointSize = vSize;
}`;
const POINT_FS = /* glsl */`${COMMON}
varying vec3 vCol;
varying float vA, vSize;
void main() {
  vec2 c = gl_PointCoord - .5;
  float r2 = dot(c, c) * 4.;
  if (r2 >= 1.) discard;
  // a point a pixel or two across stays a solid speck (a soft falloff would leave nothing at the
  // pixels' centres); a larger one gets a soft round glow
  float soft = smoothstep(1.6, 5., vSize);
  gl_FragColor = vec4(vCol * vA * mix(1. - r2 * .6, exp(-r2 * 4.) * (1. - r2), soft), uOpacity);
  ${OUT}
}`;

const DARK_VS = /* glsl */`${COMMON}
varying vec3 vWorld;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const DARK_FS = /* glsl */`${COMMON}
uniform vec3 uNearCol, uFarCol;
uniform float uHaze;
varying vec3 vWorld;
void main() {
  // near, the solid is as dark as the night; far, it melts into the haze along the horizon
  float d = distance(vWorld, cameraPosition), k = 1. - exp(-max(0., d - uFogFrom) / uHaze);
  gl_FragColor = vec4(mix(uNearCol, uFarCol, k), uOpacity);
  ${OUT}
}`;

// ---------- the world ----------

// Where each world draws among the film's things: after a background at renderOrder -10 and before
// the page at 0, each world in a block of its own, so that, with two worlds showing in a cross-fade,
// one world's solids never hide the other's strokes (each block starts by clearing the depth).
const ORDER = { desk: 0, archive: 1, reading: 2, sky: 3, dawn: 4, auditorium: 5, workshop: 6 };
const SUB = { solids: 0, dark: .1, glows: .2, lines: .3, extra: .4, shafts: .5, points: .6 };

// Turns a finished plate into the World the film uses (index.js has the contract). parts: the
// builders' output (solids, dark { solids, near, far, haze }, glows, lines (one or more strokes
// builders, or { strokes, object(o) } to keep a handle on one), shafts, points); volumes: the lights
// that dust can drift into ({ a, b, ra, rb, col }); stars: true for points sized in pixels that
// twinkle; lamp: the lamps' colour; flicker: how much the lamps breathe; lineWidth: a full-weight
// stroke's width in CSS pixels; gain: all the strokes' brightness; tick(time, dt, camera): the
// world's own animation, run in update().
export function assemble(THREE, { id, grade, stage, parts, volumes = [], stars = false, twinkle = 0, lamp = '#F2B866', flicker = .035, clear = [4.5, 6, .12, 1.8], near = [3, 9], lineWidth = 1.15, gain = 1, tick = null, t0 = performance.now() }) {
  const group = new THREE.Group();
  group.name = `world:${id}`;
  const lampCol = rgb(lamp);
  const state = new THREE.Vector4(0, 30, 0, 0);   // time, the fog's start, the weight
  const U = {
    uState: { value: state }, uGain: { value: gain },
    uFog: { value: new THREE.Color(grade.fog) }, uFogDensity: { value: grade.fogDensity },
    uAnchor: { value: new THREE.Vector3(...stage.anchor) }, uLamp: { value: new THREE.Color(lamp) },
    uClear: { value: new THREE.Vector4(...clear) }, uNear: { value: new THREE.Vector2(...near) },
  };
  const base = -9.5 + 1.8 * (ORDER[id] ?? 0);
  const made = [], geos = [], mats = [];
  let calls = 0, lineVerts = 0, pointCount = 0;
  const additive = (vs, fs, extra = {}) => {
    const m = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...U, ...extra }, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
    mats.push(m);
    return m;
  };
  const place = (obj, sub) => {
    obj.renderOrder = base + sub; obj.frustumCulled = false;
    group.add(obj); made.push(obj); calls++;
    return obj;
  };

  // solids: depth only, a hair behind their own faces so the strokes on them stay in front
  if (parts.solids && parts.solids.count) {
    const g = parts.solids.geometry(THREE); geos.push(g);
    const m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true, transparent: true, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 });
    mats.push(m);
    place(new THREE.Mesh(g, m), SUB.solids);
  }
  // dark solids: they paint the night over what is behind them (a land, a window's frame)
  if (parts.dark && parts.dark.solids.count) {
    const g = parts.dark.solids.geometry(THREE); geos.push(g);
    const m = new THREE.ShaderMaterial({
      vertexShader: DARK_VS, fragmentShader: DARK_FS, transparent: true, depthWrite: true, depthTest: true, side: THREE.DoubleSide, forceSinglePass: true,
      uniforms: { ...U, uNearCol: { value: new THREE.Color(parts.dark.near) }, uFarCol: { value: new THREE.Color(parts.dark.far) }, uHaze: { value: parts.dark.haze || 60 } },
    });
    mats.push(m);
    place(new THREE.Mesh(g, m), SUB.dark);
  }
  if (parts.glows && parts.glows.count) {
    const g = parts.glows.geometry(THREE); geos.push(g);
    place(new THREE.Mesh(g, additive(GLOW_VS, GLOW_FS)), SUB.glows);
  }
  // the strokes: one material for all of them; a stroke set given as { strokes, object } keeps a
  // handle on its own object (clouds that drift)
  let lineMat = null;
  const lines = [];
  const lineSets = (parts.lines || []).map(l => l.strokes ? l : { strokes: l });
  lineSets.forEach((l, i) => {
    if (!l.strokes.count) return;
    if (!lineMat) {
      lineMat = additive(LINE_VS, LINE_FS, { uRes: { value: new THREE.Vector2(1, 1) }, uPx: { value: 1 }, uLineW: { value: lineWidth } });
      lineMat.side = THREE.DoubleSide; lineMat.forceSinglePass = true;
    }
    const g = l.strokes.geometry(THREE); geos.push(g);
    lineVerts += l.strokes.count;
    const o = place(new THREE.Mesh(g, lineMat), i ? SUB.extra : SUB.lines);
    lines.push(o);
    if (l.object) l.object(o);
  });
  if (parts.shafts && parts.shafts.count) {
    const g = parts.shafts.geometry(THREE); geos.push(g);
    place(new THREE.Mesh(g, additive(SHAFT_VS, SHAFT_FS)), SUB.shafts);
  }
  let pointObj = null;
  const vp = new THREE.Vector4();
  if (parts.points && parts.points.count) {
    const g = parts.points.geometry(THREE); geos.push(g);
    pointCount = parts.points.count;
    const vols = [0, 1, 2].map(() => Array.from({ length: 8 }, () => new THREE.Vector4()));
    volumes.slice(0, 8).forEach((v, i) => {
      vols[0][i].set(v.a[0], v.a[1], v.a[2], v.ra); vols[1][i].set(v.b[0], v.b[1], v.b[2], v.rb);
      vols[2][i].set(v.col[0], v.col[1], v.col[2], v.k ?? 1);
    });
    const m = additive(POINT_VS, POINT_FS, {
      uViewH: { value: 900 }, uPx: { value: 1 }, uStars: { value: stars ? 1 : 0 }, uTwinkle: { value: twinkle },
      uVolN: { value: Math.min(8, volumes.length) }, uVolA: { value: vols[0] }, uVolB: { value: vols[1] }, uVolC: { value: vols[2] },
    });
    pointObj = place(new THREE.Points(g, m), SUB.points);
    // point sizes need the drawing's height in pixels and its pixel ratio, read as it is drawn
    pointObj.onBeforeRender = r => { r.getCurrentViewport(vp); m.uniforms.uViewH.value = vp.w; m.uniforms.uPx.value = r.getPixelRatio(); };
  }
  // the strokes need the drawing's size in pixels and its pixel ratio, read as they are drawn; and
  // the world's first thing drawn clears the depth, so only this world's solids hide its strokes
  const first = made.reduce((a, o) => (!a || o.renderOrder < a.renderOrder ? o : a), null);
  made.forEach(o => {
    const own = o.onBeforeRender, isFirst = o === first, isLine = lines.includes(o);
    if (!isFirst && !isLine) return;
    o.onBeforeRender = (r, ...rest) => {
      if (isFirst) r.clearDepth();
      if (isLine) { r.getCurrentViewport(vp); lineMat.uniforms.uRes.value.set(vp.z, vp.w); lineMat.uniforms.uPx.value = r.getPixelRatio(); }
      own.call(o, r, ...rest);
    };
  });

  const buildMs = performance.now() - t0;
  let weight = 0;
  group.visible = false;
  return {
    id, group, grade, stage,
    setWeight(w) {
      weight = Math.min(1, Math.max(0, +w || 0));
      state.z = weight;
      group.visible = weight > 0;
    },
    update(time, dt, camera) {
      if (!group.visible) return;
      state.x = time;
      // the lamps breathe a little, never in a regular rhythm (the colour's fields are written
      // directly: they are linear already, and a call could box its arguments)
      const f = 1 + flicker * (Math.sin(time * 7.3) * .45 + Math.sin(time * 12.9 + 1.3) * .3 + Math.sin(time * 2.1 + .4) * .25), lc = U.uLamp.value;
      lc.r = lampCol[0] * f; lc.g = lampCol[1] * f; lc.b = lampCol[2] * f;
      // the fog starts at the page's distance from the eye (Math.hypot would allocate on every call)
      if (camera) {
        const e = camera.matrixWorld.elements, a = stage.anchor, dx = e[12] - a[0], dy = e[13] - a[1], dz = e[14] - a[2];
        state.y = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      if (tick) tick(time, dt, camera);
    },
    dispose() {
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
      group.removeFromParent();
    },
    // for the test bench: what the world costs
    stats: { buildMs, lineVerts, points: pointCount, calls },
  };
}
