/* The shapes the particles take in the experience (src/pages/experience.astro), all generated here:
   no models, no images. A formation gives every particle a place, a colour and a key:
   - the key orders how the shape reveals itself as you scroll (0 is lit from the start; any other
     particle lights when the reveal passes its key, and waits as a faint blueprint until then);
   - -1 marks drifting dust, which sits at the same place in every formation, so the dust never
     moves while the shapes change around it.
   Colours are given in sRGB and stored linear (what the renderer works in), with the brightness
   folded in. Budgets are shares of N, so phones (fewer particles) get the same shapes, sparser.
   Each formation also names a few anchor points, where the experience pins its labels. */

export const F = { DUST: 0, MOLECULE: 1, CROWD: 2, STREAMS: 3, PAPERS: 4, LANDSCAPE: 5, CURVES: 6, DOSSIER: 7, MANUSCRIPT: 8, GLOBE: 9 };

// a small seeded random generator: the same shapes on every load
export function random(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const lin = v => (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
const hex = h => [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
export const PAL = {
  ice: hex('#C9D8FF'), steel: hex('#8FA8E8'), blue: hex('#4C74D9'), deep: hex('#2B4A92'), night: hex('#1A2C66'),
  orange: hex('#E07A1F'), ember: hex('#FF9A3C'), gold: hex('#F0C35C'), white: hex('#FFFFFF'),
};
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const TAU = Math.PI * 2, RAD = Math.PI / 180;
// n points spread evenly over a unit sphere
const fib = (n, i) => { const y = 1 - ((i + .5) / n) * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963229728653; return [Math.cos(t) * r, y, Math.sin(t) * r]; };
// a point along a rectangle's outline (q from 0 to 1, clockwise from the top left), in -.5 to .5
const outline = q => { const t = (q % 1) * 4, s = Math.floor(t), u = t - s; return s === 0 ? [u - .5, .5] : s === 1 ? [.5, .5 - u] : s === 2 ? [.5 - u, -.5] : [-.5, u - .5]; };

// one formation being filled: put() places the next particle; the rest become dust at the end
function former(N, dust) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), key = new Float32Array(N);
  let i = 0;
  return {
    get count() { return i; },
    put(x, y, z, c, b = 1, k = 0) {
      if (i >= N) return false;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
      key[i] = k; i++;
      return true;
    },
    done(anchors = {}) {
      for (let j = i; j < N; j++) {
        for (let c = 0; c < 3; c++) { pos[j * 3 + c] = dust.pos[j * 3 + c]; col[j * 3 + c] = dust.col[j * 3 + c]; }
        key[j] = -1;
      }
      return { pos, col, key, anchors, used: i };
    },
  };
}

// the dust: faint motes in a deep volume around everything
function makeDust(N, R) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (R() - .5) * 46; pos[i * 3 + 1] = (R() - .42) * 26; pos[i * 3 + 2] = 6 - R() * 56;
    const c = mix3(PAL.night, PAL.steel, R() * .4), b = .08 + R() * .16;
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
  }
  return { pos, col };
}

/* the molecule's skeleton, flat: two fused aromatic rings and a side chain. The loading screen
   draws it (src/pages/experience.astro) and the particles build it in 3D, from the same numbers */
export function moleculeSkeleton() {
  const B = 1;
  const at = (p, deg, l = B) => [p[0] + l * Math.cos(deg * RAD), p[1] + l * Math.sin(deg * RAD)];
  const ring = cx => [90, 30, -30, -90, -150, 150].map(d => at([cx, 0], d));
  const A = ring(-B * Math.sqrt(3) / 2), Bb = ring(B * Math.sqrt(3) / 2);
  const C1 = at(Bb[1], 30), O1 = at(C1, 90), N1 = at(C1, -30), C2 = at(N1, 30), C3 = at(C2, -30), O3 = at(C3, -90), O2 = at(A[4], -150), C4 = at(C3, 30);
  const list = [...A.map(p => [p, 'C']), ...[Bb[0], Bb[1], Bb[2], Bb[3]].map(p => [p, 'C']), [C1, 'C'], [O1, 'O'], [N1, 'N'], [C2, 'C'], [C3, 'C'], [O2, 'O'], [O3, 'O'], [C4, 'C']];
  // centred on the origin
  const xs = list.map(([p]) => p[0]), ys = list.map(([p]) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return {
    atoms: list.map(([p, kind]) => ({ x: p[0] - cx, y: p[1] - cy, kind })),
    // [from, to, order]; the second list is the aromatic rings' inner bonds [from, to, ring]
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [6, 7], [7, 8], [8, 9], [9, 2], [7, 10], [10, 11, 2], [10, 12], [12, 13], [13, 14], [4, 15], [14, 16, 2], [14, 17]],
    inner: [[0, 1, 0], [2, 3, 0], [4, 5, 0], [6, 7, 1], [8, 9, 1]],
    rings: [[0, 1, 2, 3, 4, 5], [1, 6, 7, 8, 9, 2]],
  };
}

/* drug development: the molecule in ball and stick, inside a faint electron cloud */
function molecule(N, R, dust) {
  const f = former(N, dust), sk = moleculeSkeleton(), { bonds, inner } = sk;
  const KIND = { C: [.4, PAL.ice, 1], N: [.48, PAL.gold, 1.15], O: [.48, PAL.orange, 1.15] };
  const atoms = sk.atoms.map(({ x, y, kind }, k) => ({ x, y, z: Math.sin(k * 1.7) * .4, r: KIND[kind][0], c: KIND[kind][1], b: KIND[kind][2] }));
  const ringC = sk.rings.map(ids => ids.reduce((s, i) => [s[0] + atoms[i].x / 6, s[1] + atoms[i].y / 6, s[2] + atoms[i].z / 6], [0, 0, 0]));
  // atoms: a dense shell and a bright core
  const area = atoms.reduce((s, a) => s + a.r * a.r, 0), nAtoms = N * .24;
  atoms.forEach(a => {
    const n = Math.round(nAtoms * a.r * a.r / area);
    for (let k = 0; k < n; k++) {
      const [dx, dy, dz] = fib(n, k), core = k % 5 === 0, s = core ? .3 + R() * .5 : 1 + (R() - .5) * .07;
      f.put(a.x + dx * a.r * s, a.y + dy * a.r * s, a.z + dz * a.r * s, a.c, a.b * (core ? .9 : .42 + R() * .22));
    }
  });
  // bonds: thin cylinders of light; double bonds as two
  const nb = N * .19 / bonds.length;
  bonds.forEach(([i, j, order = 1]) => {
    const a = atoms[i], b = atoms[j], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz);
    const nx = -dy / L, ny = dx / L;
    for (let k = 0; k < nb; k++) {
      const u = (a.r + R() * (L - a.r - b.r)) / L, off = order === 2 ? (k % 2 ? 1 : -1) * .12 : 0;
      const t = R() * TAU, rr = .05 * Math.sqrt(R());
      f.put(a.x + dx * u + nx * off + Math.cos(t) * rr, a.y + dy * u + ny * off + Math.sin(t) * rr, a.z + dz * u + Math.sin(t * 1.3) * rr, PAL.steel, .75);
    }
  });
  inner.forEach(([i, j, r]) => {
    const a = atoms[i], b = atoms[j], c = ringC[r];
    for (let k = 0; k < nb * .6; k++) {
      const u = .2 + R() * .6, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, z = a.z + (b.z - a.z) * u;
      f.put(x + (c[0] - x) * .24, y + (c[1] - y) * .24, z + (c[2] - z) * .24, PAL.blue, .6);
    }
  });
  // the electron cloud: a soft haze around the atoms
  for (let k = 0, n = N * .15; k < n; k++) {
    const a = atoms[Math.floor(R() * atoms.length)], g = () => (R() + R() + R() - 1.5) * 1.2;
    f.put(a.x + g(), a.y + g(), a.z + g() * .8, mix3(PAL.deep, PAL.blue, R()), .14 + R() * .16);
  }
  const p3 = i => [atoms[i].x, atoms[i].y, atoms[i].z];
  return f.done({ core: ringC[0], amide: p3(12), carbonyl: p3(11), hydroxyl: p3(15) });
}

/* clinical trials, enrolment: an icon array, the way trial populations are often drawn: a wall of
   person pictograms, curved around the viewer. About three in eight are enrolled: they wait among
   the rest and light up, in orange, one by one as you scroll */
function crowd(N, R, dust) {
  const f = former(N, dust), per = 44, people = Math.floor(N * .74 / per);
  const cols = Math.round(Math.sqrt(people * 1.6)), rows = Math.ceil(people / cols), gx = .48, gy = .64, rad = 14, zc = -2;
  // one pictogram, flat: a head (a ring with a dot in it) over rounded shoulders
  const icon = [];
  for (let q = 0; q < 10; q++) { const t = q / 10 * TAU; icon.push([Math.cos(t) * .085, .3 + Math.sin(t) * .085]); }
  for (let q = 0; q < 4; q++) { const t = q / 4 * TAU + .4; icon.push([Math.cos(t) * .03, .3 + Math.sin(t) * .03]); }
  const sideL = .2, arcR = .15, len = 2 * sideL + Math.PI * arcR;
  for (let q = 0; q < per - 14; q++) {
    const s = (q + .5) / (per - 14) * len;
    if (s < sideL) icon.push([-arcR, -.2 + s]);
    else if (s < sideL + Math.PI * arcR) { const t = Math.PI - (s - sideL) / arcR; icon.push([Math.cos(t) * arcR, sideL - .2 + Math.sin(t) * arcR]); }
    else icon.push([arcR, -.2 + sideL - (s - sideL - Math.PI * arcR)]);
  }
  let first = null;
  for (let p = 0; p < people; p++) {
    const c = p % cols, r = Math.floor(p / cols);
    const x = (c - (cols - 1) / 2) * gx, y = ((rows - 1) / 2 - r) * gy, a = x / rad;
    const px = Math.sin(a) * rad, pz = zc + rad * (1 - Math.cos(a)), ux = Math.cos(a), uz = Math.sin(a);   // on the curve, facing its axis
    const enrolled = R() < .37, k = enrolled ? .02 + R() * .96 : 0;
    const col = enrolled ? PAL.ember : mix3(PAL.ice, PAL.steel, R() * .5), b = enrolled ? 1.15 : .42 + R() * .2;
    if (enrolled && !first && Math.abs(c - cols / 2) < 3 && Math.abs(r - rows / 2) < 3) first = [px, y + .3, pz];
    icon.forEach(([u, v]) => f.put(px + u * ux, y + v, pz + u * uz, col, b, k));
  }
  const top = (rows - 1) / 2 * gy;
  return f.done({ participant: first || [0, .3, zc], corner: [Math.sin(-(cols - 1) / 2 * gx / rad) * rad, top + .5, zc + rad * (1 - Math.cos((cols - 1) / 2 * gx / rad))] });
}

/* clinical trials, randomisation: two rivers, treatment and control, flowing away from one source.
   The shader moves them along their course (aStream); these are their places at the start */
export function streamParams(N, R) {
  const s = new Float32Array(N * 4), share = .76;
  for (let i = 0; i < N; i++) {
    const inRiver = i < N * share;
    s[i * 4] = R(); s[i * 4 + 1] = inRiver ? (i % 2 ? 1 : -1) : 0; s[i * 4 + 2] = R() * TAU; s[i * 4 + 3] = Math.pow(R(), 1.7) * .95;
  }
  return s;
}
// the same course as the shader's streamAt (keep the two in step)
export function streamAt(u, side, ang, rad) {
  const z = 6 - 42 * u, x = side * (.25 + 6.2 * u * u) + Math.sin(u * 7 + side) * .8 * u;
  const y = -.8 + Math.sin(u * 4 + side * 1.3) * 1.1 * u + u * 2.4, r = rad * (.45 + 1.25 * u);
  return [x + Math.cos(ang) * r, y + Math.sin(ang) * r * .55, z];
}
function streams(N, R, dust, sp) {
  const f = former(N, dust), n = Math.floor(N * .76);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = streamAt(sp[i * 4], sp[i * 4 + 1], sp[i * 4 + 2], sp[i * 4 + 3]);
    const core = 1 - sp[i * 4 + 3] / .95;
    f.put(x, y, z, sp[i * 4 + 1] > 0 ? mix3(PAL.orange, PAL.gold, core * .5) : mix3(PAL.blue, PAL.ice, core * .6), .4 + core * .9);
  }
  return f.done({ source: streamAt(.02, 0, 0, 0), treatment: streamAt(.34, 1, 0, 0), control: streamAt(.34, -1, 0, 0) });
}

/* medical research: a spiral of papers, the literature, rising as you scroll; the few that make the
   review glow orange */
export const PAPER_SHEETS = 200;
function papers(N, R, dust) {
  const f = former(N, dust), sheets = PAPER_SHEETS, per = Math.floor(N * .8 / sheets), top = 12.5, base = -5;
  let pick = null;
  for (let s = 0; s < sheets; s++) {
    const a = s * .31, y = base + s * ((top - base) / sheets), rad = 5.2 + Math.sin(s * .21) * .35;
    const cx = Math.cos(a) * rad, cz = Math.sin(a) * rad - 3, tx = -Math.sin(a), tz = Math.cos(a);   // each sheet faces outward
    const W = 1.1, H = 1.45, inc = s % 12 === 7, col = inc ? PAL.ember : PAL.ice, b = inc ? 1.3 : .5 + R() * .25, k = .02 + .96 * s / sheets;
    if (inc && s > sheets * .62 && !pick) pick = [cx, y, cz];
    const at = (u, v, bb) => f.put(cx + tx * u * W, y + v * H, cz + tz * u * W, col, b * bb, k);
    const edge = Math.round(per * .45), lines = per - edge;
    for (let q = 0; q < edge; q++) { const [u, v] = outline(q / edge); at(u, v, 1); }
    for (let q = 0; q < lines; q++) {   // lines of text: a heading, then body lines
      const l = q % 6, len = l === 0 ? .55 : l === 5 ? .45 : .8;
      at(-.4 + R() * len, .32 - l * .13, l === 0 ? 1.1 : .55);
    }
  }
  return f.done({ included: pick || [5, 2, -3], top: [0, top, -3], base: [0, base, -3] });
}

/* data & statistics: a landscape of data, peaks in orange, contour lines brighter. A scan passes
   over it from near to far as you scroll */
function landscape(N, R, dust) {
  const f = former(N, dust), n = Math.floor(N * .82), gx = Math.round(Math.sqrt(n * 1.4)), gz = Math.floor(n / gx);
  const bumps = [[-5, -5, 2.2, 3.1], [3.5, -9, 2.8, 3.8], [6.5, -2.5, 1.6, 2.2], [-2, -14, 3.4, 4.6], [0, .5, 1.3, 1.3], [-8.5, -11, 2.2, 2.2], [9, -13, 2.4, 2.6]];
  const h = (x, z) => bumps.reduce((s, [bx, bz, sg, amp]) => s + amp * Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (2 * sg * sg)), 0) + Math.sin(x * .5) * .15 + Math.cos(z * .4) * .15;
  const y0 = -2.6;
  for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) {
    const x = -14 + 28 * i / (gx - 1) + (R() - .5) * .05, z = 4 - 26 * j / (gz - 1) + (R() - .5) * .05, y = h(x, z);
    const k = Math.min(1, y / 4.4), contour = Math.abs(((y * 2.2) % 1) - .5) > .44;
    const col = k > .55 ? mix3(PAL.orange, PAL.gold, (k - .55) * 2) : mix3(PAL.deep, PAL.ice, k / .55);
    f.put(x, y0 + y, z, col, (contour ? 1.3 : .36) * (.6 + k * .6), .02 + .96 * (j / gz));
  }
  return f.done({ peak: [-2, y0 + h(-2, -14), -14], second: [3.5, y0 + h(3.5, -9), -9], near: [6.5, y0 + h(6.5, -2.5), -2.5] });
}

/* analysis: Kaplan-Meier curves carved in light, treatment above control, the gap between them the
   effect. They draw from left to right as you scroll */
const TRT = [[-6.6, 3.1], [-4.9, 2.6], [-3.1, 2.1], [-1.2, 1.7], [.9, 1.3], [3, 1], [5.3, .8]];
const CTL = [[-7, 2.8], [-5.6, 1.9], [-4.1, 1.1], [-2.4, .3], [-.6, -.4], [1.4, -1.1], [3.6, -1.6], [5.9, -1.9]];
function curves(N, R, dust) {
  const f = former(N, dust), top = 3.6, x0 = -8, x1 = 8, depth = 2.6, bottom = -2.7;
  const kx = x => .03 + .9 * (x - x0) / (x1 - x0);
  const yAt = (drops, x) => { let y = top; drops.forEach(([dx, dy]) => { if (x >= dx) y = dy; }); return y; };
  const ribbon = (drops, col, n) => {
    const segs = []; let px = x0, py = top;
    drops.forEach(([dx, dy]) => { segs.push([px, py, dx, py]); segs.push([dx, py, dx, dy]); px = dx; py = dy; });
    segs.push([px, py, x1, py]);
    const L = segs.reduce((s, [a, b, c, d]) => s + Math.hypot(c - a, d - b), 0);
    segs.forEach(([a, b, c, d]) => {
      const m = Math.round(n * Math.hypot(c - a, d - b) / L);
      for (let k = 0; k < m; k++) {
        const u = R(), x = a + (c - a) * u, z = (R() - .5) * depth, edge = Math.abs(z) > depth * .45;
        f.put(x, b + (d - b) * u, z, col, edge ? 1.4 : .65 + R() * .3, kx(x));
      }
    });
  };
  ribbon(TRT, PAL.orange, N * .22);
  ribbon(CTL, PAL.blue, N * .22);
  // the confidence bands: a faint haze around each curve, wider as time goes on
  [[TRT, PAL.orange], [CTL, PAL.blue]].forEach(([d, c]) => {
    for (let k = 0; k < N * .06; k++) { const x = x0 + R() * (x1 - x0), y = yAt(d, x) + (R() - .5) * .9 * (.3 + (x - x0) / (x1 - x0)); f.put(x, y, (R() - .5) * depth * .6, c, .16, kx(x)); }
  });
  // the gap between them, the treatment effect
  for (let k = 0; k < N * .12; k++) {
    const x = x0 + R() * (x1 - x0), yt = yAt(TRT, x), yc = yAt(CTL, x);
    if (yt > yc) f.put(x, yc + R() * (yt - yc), (R() - .5) * .4, mix3(PAL.orange, PAL.gold, R()), .16 + R() * .16, kx(x));
  }
  // censoring marks: small upright ticks on both curves
  [[TRT, PAL.gold], [CTL, PAL.ice]].forEach(([d, c], s) => {
    for (let m = 0; m < 9; m++) { const x = x0 + .9 + m * 1.7 + s * .6, y = yAt(d, x); for (let k = 0, n = N * .002; k < n; k++) f.put(x, y - .1 + (k / n) * .32, 0, c, 1.3, kx(x)); }
  });
  // the axes and their ticks
  for (let k = 0; k < N * .05; k++) {
    const u = R();
    if (k % 2) f.put(x0 + u * (x1 - x0), bottom, 0, PAL.steel, .55); else f.put(x0 - .3, bottom + u * (top + .4 - bottom), 0, PAL.steel, .55);
  }
  for (let t = 0; t <= 4; t++) for (let k = 0, n = N * .0008; k < n; k++) f.put(x0 + t * 4, bottom - (k / n) * .35, 0, PAL.ice, .9);
  const xm = 2.2;
  return f.done({ treatment: [x1 - .4, yAt(TRT, x1 - .4), 0], control: [x1 - .4, yAt(CTL, x1 - .4), 0], effect: [xm, (yAt(TRT, xm) + yAt(CTL, xm)) / 2, 0], origin: [x0, bottom, 0], axis: [x1, bottom, 0] });
}

/* reporting: the documents a trial produces, as a fan of pages, each with its own table, figure,
   chart or flow chart. They appear one after another as you scroll */
export const DOSSIER_PAGES = 7;
function dossier(N, R, dust) {
  const f = former(N, dust), P = DOSSIER_PAGES, W = 3, H = 4.2, rad = 11, per = Math.floor(N * .8 / P);
  const anchors = {};
  for (let j = 0; j < P; j++) {
    const th = (j - (P - 1) / 2) * 13 * RAD, cx = Math.sin(th) * rad, cz = Math.cos(th) * rad - rad, cy = Math.sin(j * 1.9) * .25;
    const ux = Math.cos(th), uz = -Math.sin(th), k0 = .03 + .9 * j / P;
    // u, v on the page (-.5 to .5); k orders the page's own parts
    const at = (u, v, c, b, k) => f.put(cx + ux * u * W, cy + v * H, cz + uz * u * W + (R() - .5) * .02, c, b, k0 + .1 * k);
    const share = q => Math.round(per * q);
    for (let q = 0, n = share(.3); q < n; q++) { const [u, v] = outline(q / n); at(u, v, PAL.ice, 1, 0); }
    for (let q = 0, n = share(.1); q < n; q++) at(-.4 + R() * .5, .38, PAL.white, 1.2, .1);   // the heading
    for (let q = 0, n = share(.22); q < n; q++) { const l = Math.floor(R() * 5); at(-.4 + R() * (l === 4 ? .45 : .8), .27 - l * .07, PAL.steel, .55, .2 + l * .05); }
    // each page's own graphic, in its lower half
    const kind = j % 4;
    for (let q = 0, g = share(.38); q < g; q++) {
      let u, v, c = PAL.steel, b = .7;
      if (kind === 0) {   // a table: rows, and the lines between its columns
        if (R() < .25) { u = -.4 + Math.floor(R() * 4) * .27; v = -.05 - R() * .35; } else { u = -.4 + R() * .8; v = -.05 - Math.floor(R() * 6) * .07; }
      } else if (kind === 1) {   // a figure: two curves
        const x = R(), trt = q % 2; u = -.4 + x * .8; v = -.42 + .34 * Math.exp(-x * (trt ? 1.4 : 2.6)); c = trt ? PAL.orange : PAL.blue; b = 1.1;
      } else if (kind === 2) {   // a bar chart
        const bar = Math.floor(R() * 6), hgt = [.3, .22, .34, .16, .27, .12][bar]; u = -.36 + bar * .14 + R() * .08; v = -.42 + R() * hgt; c = bar % 2 ? PAL.orange : PAL.blue; b = .9;
      } else {   // a flow chart: four boxes
        const node = Math.floor(R() * 4), [nu, nv] = [[-.25, -.05], [.2, -.05], [-.25, -.3], [.2, -.3]][node], [ou, ov] = outline(R());
        u = nu + ou * .3; v = nv + ov * .14; c = node === 3 ? PAL.orange : PAL.ice;
      }
      at(u, v, c, b, .4 + .5 * R());
    }
    anchors['p' + j] = [cx - ux * W * .5, cy + H * .5, cz - uz * W * .5];
  }
  return f.done(anchors);
}

/* manuscript: a journal article, two columns with its figure and table, under the stamp that says
   it was accepted. It writes itself from the top as you scroll */
function manuscript(N, R, dust) {
  const f = former(N, dust), W = 7.2, H = 10, tilt = -.18;
  const at = (u, v, w, c, b, k) => {   // page coordinates: u, v from the centre; w toward the viewer
    const x = u * Math.cos(tilt) - w * Math.sin(tilt), z = u * Math.sin(tilt) + w * Math.cos(tilt);
    return f.put(x, v, z, c, b, k);
  };
  const kv = v => .03 + .86 * (H / 2 - v) / H;
  const n = q => Math.round(N * q);
  const text = (u0, v, len, m, c, b) => { for (let q = 0; q < m; q++) at(u0 + R() * len, v + (R() - .5) * .05, 0, c, b, kv(v)); };
  const box = (u0, v0, u1, v1, m, c, b) => { for (let q = 0; q < m; q++) { const [ou, ov] = outline(q / m), v = (v0 + v1) / 2 + ov * (v0 - v1); at((u0 + u1) / 2 + ou * (u1 - u0), v, 0, c, b, kv(v)); } };
  // the pages under it
  for (let p = 1; p <= 5; p++) for (let q = 0, m = n(.012); q < m; q++) { const [ou, ov] = outline(q / m); at(ou * W + p * .16, ov * H - p * .12, -p * .45, PAL.steel, .3 - p * .035, 0); }
  box(-W / 2, H / 2, W / 2, -H / 2, n(.05), PAL.ice, 1);
  text(-3.2, 4.55, 2.2, n(.008), PAL.steel, .6);   // the journal's name
  text(-3.2, 4, 6.2, n(.03), PAL.white, 1.15);   // the title, two lines
  text(-3.2, 3.5, 4.4, n(.022), PAL.white, 1.15);
  text(-3.2, 3, 3.8, n(.01), PAL.steel, .6);   // the authors
  box(-3.25, 2.65, 3.25, .95, n(.02), PAL.steel, .5);   // the abstract, boxed
  for (let l = 0; l < 4; l++) text(-3.05, 2.3 - l * .38, 5.9 - (l === 3 ? 2.2 : 0), n(.012), PAL.steel, .55);
  // two columns: text on the left, the figure and the table on the right
  for (let l = 0; l < 11; l++) text(-3.2, .55 - l * .4, 2.9 - (l === 10 ? 1.3 : 0), n(.009), PAL.steel, .5);
  box(.3, .6, 3.25, -1.9, n(.012), PAL.steel, .55);
  const curve = (drops, c) => { for (let q = 0, m = n(.022); q < m; q++) { const x = R(); let y = .92; drops.forEach(([dx, dy]) => { if (x >= dx) y = dy; }); at(.45 + x * 2.65, -1.8 + y * 2.25, 0, c, 1.15, kv(-.6)); } };
  curve([[.1, .82], [.24, .72], [.4, .63], [.58, .55], [.75, .5], [.9, .46]], PAL.orange);
  curve([[.08, .76], [.2, .6], [.33, .45], [.48, .33], [.63, .25], [.8, .19], [.94, .16]], PAL.blue);
  for (let r = 0; r < 5; r++) text(.3, -2.3 - r * .42, 2.95, n(.006), PAL.steel, .45);   // the table's rows
  for (const u of [1.3, 2.3]) for (let q = 0, m = n(.003); q < m; q++) at(u, -2.25 - R() * 1.9, 0, PAL.steel, .45, kv(-3));
  // the stamp, in orange, last of all: two rings with ticks between them, and its word across
  const sc = [2.35, 3.55], sr = 1.05;
  for (let q = 0, m = n(.05); q < m; q++) {
    const kind = q % 3; let t = R() * TAU, rr;
    if (kind === 0) rr = sr; else if (kind === 1) rr = sr * .78;
    else { t = Math.round(t / TAU * 40) / 40 * TAU; rr = sr * (.83 + R() * .12); }
    at(sc[0] + Math.cos(t) * rr, sc[1] + Math.sin(t) * rr, .35, PAL.ember, 1.35, .97);
  }
  for (let q = 0, m = n(.012); q < m; q++) at(sc[0] - .55 + R() * 1.1, sc[1] + (R() - .5) * .12, .35, PAL.gold, 1.4, .985);
  const p = (u, v, w = 0) => [u * Math.cos(tilt) - w * Math.sin(tilt), v, u * Math.sin(tilt) + w * Math.cos(tilt)];
  return f.done({ title: p(-3.2, 4.1), abstract: p(-3.25, 1.8), figure: p(3.25, .6), stamp: p(sc[0] + sr, sc[1], .35) });
}

/* publication: a globe of points, its graticule and atmosphere, and arcs of light from Ahmedabad to
   the journals and congresses of the world. The arcs launch one after another as you scroll */
export const CITIES = [
  ['London', 51.5, -.1], ['New York', 40.7, -74], ['Boston', 42.4, -71.1], ['Singapore', 1.35, 103.8], ['Tokyo', 35.7, 139.7],
  ['Sydney', -33.9, 151.2], ['Johannesburg', -26.2, 28], ['Dubai', 25.2, 55.3], ['Frankfurt', 50.1, 8.7], ['São Paulo', -23.5, -46.6],
  ['Toronto', 43.7, -79.4], ['Seoul', 37.6, 127], ['Basel', 47.6, 7.6], ['Paris', 48.9, 2.35], ['Mumbai', 19.1, 72.9], ['Delhi', 28.6, 77.2],
];
export const HOME = ['Ahmedabad', 23.02, 72.57];
export const GLOBE_R = 4.4;
export const latLon = (lat, lon, r = GLOBE_R) => { const a = lat * RAD, b = lon * RAD; return [r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b)]; };
function globe(N, R, dust) {
  const f = former(N, dust), Rg = GLOBE_R, n = q => Math.floor(N * q);
  for (let k = 0, m = n(.36); k < m; k++) { const [x, y, z] = fib(m, k); f.put(x * Rg, y * Rg, z * Rg, mix3(PAL.deep, PAL.steel, R() * .55), .38 + R() * .3); }
  for (let k = 0, m = n(.05); k < m; k++) { const [x, y, z] = fib(m, k), s = 1.06 + R() * .05; f.put(x * Rg * s, y * Rg * s, z * Rg * s, PAL.blue, .12 + R() * .1); }   // the atmosphere
  const per = Math.floor(n(.1) / 17);
  for (let lat = -60; lat <= 60; lat += 30) for (let q = 0; q < per; q++) f.put(...latLon(lat, q / per * 360), PAL.blue, .6);
  for (let lon = 0; lon < 360; lon += 30) for (let q = 0; q < per; q++) f.put(...latLon(q / per * 180 - 90, lon), PAL.blue, .6);
  const slerp = (a, b, t) => {   // along the great circle, raised above the surface in the middle
    const pa = latLon(a[1], a[2], 1), pb = latLon(b[1], b[2], 1), d = Math.acos(Math.min(1, pa[0] * pb[0] + pa[1] * pb[1] + pa[2] * pb[2]));
    const s = Math.sin(d) || 1, k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s, lift = Rg * (1 + .3 * d * Math.sin(Math.PI * t));
    return [(pa[0] * k1 + pb[0] * k2) * lift, (pa[1] * k1 + pb[1] * k2) * lift, (pa[2] * k1 + pb[2] * k2) * lift];
  };
  const arc = n(.24) / CITIES.length, anchors = { home: latLon(HOME[1], HOME[2], Rg * 1.01) };
  CITIES.forEach((c, j) => {
    const k0 = .04 + j * .028;
    for (let q = 0; q < arc; q++) { const t = q / arc; f.put(...slerp(HOME, c, t), mix3(PAL.orange, PAL.gold, t), 1.15, k0 + .4 * t); }
    const [x, y, z] = latLon(c[1], c[2], Rg * 1.01);
    for (let q = 0, m = n(.0025); q < m; q++) { const g = () => (R() - .5) * .14; f.put(x + g(), y + g(), z + g(), PAL.gold, 1.3, k0 + .4); }
    anchors[c[0]] = [x, y, z];
  });
  const [hx, hy, hz] = anchors.home;
  for (let q = 0, m = n(.006); q < m; q++) { const g = () => (R() - .5) * .26; f.put(hx + g(), hy + g(), hz + g(), PAL.ember, 1.7, 0); }
  return f.done(anchors);
}

// all of them, in the order of F
export function buildFormations(N, seed = 1104) {
  const R = random(seed), dust = makeDust(N, random(seed + 7)), sp = streamParams(N, random(seed + 3));
  const list = [former(N, dust).done(), molecule(N, R, dust), crowd(N, R, dust), streams(N, R, dust, sp), papers(N, R, dust),
    landscape(N, R, dust), curves(N, R, dust), dossier(N, R, dust), manuscript(N, R, dust), globe(N, R, dust)];
  return { list, stream: sp };
}
