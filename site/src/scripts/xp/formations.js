/* The shapes the particles take in the experience (src/pages/experience.astro), all generated here:
   no models, no images. A formation gives every particle a place, a colour and a key:
   - the key orders how the shape reveals itself as you scroll (0 is lit from the start; any other
     particle lights when the reveal passes its key, and waits as a faint blueprint until then, or
     stays dark until then in a formation with ghost 0, like the page that writes itself);
   - -1 marks drifting dust, which sits at the same place in every formation, so the dust never
     moves while the shapes change around it.
   Colours are given in sRGB and stored linear (what the renderer works in), with the brightness
   folded in. Budgets are shares of N, so phones (fewer particles) get the same shapes, sparser.
   Each formation also names a few anchor points, where the experience pins its labels. */

export const F = { DUST: 0, MOLECULE: 1, CROWD: 2, STREAMS: 3, PAPERS: 4, LANDSCAPE: 5, CURVES: 6, DOSSIER: 7, MANUSCRIPT: 8, GLOBE: 9, NETWORK: 10, PAGE: 11, CHOICE: 12 };

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

// one formation being filled: put() places the next particle; the rest become dust at the end.
// With groups, each particle also records the group it was put in (set .group first; -1 for none)
function former(N, dust, groups = false) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), key = new Float32Array(N), grp = groups ? new Float32Array(N).fill(-1) : null;
  let i = 0;
  return {
    group: -1,
    get count() { return i; },
    put(x, y, z, c, b = 1, k = 0) {
      if (i >= N) return false;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
      key[i] = k;
      if (grp) grp[i] = this.group;
      i++;
      return true;
    },
    done(anchors = {}) {
      for (let j = i; j < N; j++) {
        for (let c = 0; c < 3; c++) { pos[j * 3 + c] = dust.pos[j * 3 + c]; col[j * 3 + c] = dust.col[j * 3 + c]; }
        key[j] = -1;
      }
      return grp ? { pos, col, key, anchors, used: i, group: grp } : { pos, col, key, anchors, used: i };
    },
  };
}

// a person pictogram, flat: a head (a ring with a dot in it) over rounded shoulders. personIcon gives
// `per` points spaced along it (the crowd's wall); personAt one point at random along it (the
// practices scene's training group, drawn denser)
const SIDE = .2, ARC = .15, SHOULDERS = 2 * SIDE + Math.PI * ARC;
const shoulder = s => {
  if (s < SIDE) return [-ARC, -.2 + s];
  if (s < SIDE + Math.PI * ARC) { const t = Math.PI - (s - SIDE) / ARC; return [Math.cos(t) * ARC, SIDE - .2 + Math.sin(t) * ARC]; }
  return [ARC, -.2 + SIDE - (s - SIDE - Math.PI * ARC)];
};
function personIcon(per) {
  const icon = [];
  for (let q = 0; q < 10; q++) { const t = q / 10 * TAU; icon.push([Math.cos(t) * .085, .3 + Math.sin(t) * .085]); }
  for (let q = 0; q < 4; q++) { const t = q / 4 * TAU + .4; icon.push([Math.cos(t) * .03, .3 + Math.sin(t) * .03]); }
  for (let q = 0; q < per - 14; q++) icon.push(shoulder((q + .5) / (per - 14) * SHOULDERS));
  return icon;
}
const personAt = R => {
  const r = R(), t = R() * TAU;
  return r < .3 ? [Math.cos(t) * .085, .3 + Math.sin(t) * .085] : r < .36 ? [Math.cos(t) * .03, .3 + Math.sin(t) * .03] : shoulder(R() * SHOULDERS);
};

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

/* the molecule's skeleton, flat: two fused aromatic rings and a side chain, which the particles
   build in 3D. No scene takes the molecule now (the page opens the experience); it is still built,
   in its place, so the shapes after it keep their random draws */
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

/* a molecule in ball and stick, inside a faint electron cloud (the opening before the page) */
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

/* people: an icon array, the way trial populations are often drawn: a wall of person pictograms,
   curved around the viewer. About three in eight are picked out (in the training scene, the people
   trained): they wait among the rest and light up, in orange, one by one as you scroll */
function crowd(N, R, dust) {
  const f = former(N, dust), per = 44, people = Math.floor(N * .74 / per);
  const cols = Math.round(Math.sqrt(people * 1.6)), rows = Math.ceil(people / cols), gx = .48, gy = .64, rad = 14, zc = -2;
  const icon = personIcon(per);
  let first = null;
  const early = [];   // the orange icons that light early: where more labels can point
  for (let p = 0; p < people; p++) {
    const c = p % cols, r = Math.floor(p / cols);
    const x = (c - (cols - 1) / 2) * gx, y = ((rows - 1) / 2 - r) * gy, a = x / rad;
    const px = Math.sin(a) * rad, pz = zc + rad * (1 - Math.cos(a)), ux = Math.cos(a), uz = Math.sin(a);   // on the curve, facing its axis
    const enrolled = R() < .37, k = enrolled ? .02 + R() * .96 : 0;
    const col = enrolled ? PAL.ember : mix3(PAL.ice, PAL.steel, R() * .5), b = enrolled ? 1.15 : .42 + R() * .2;
    if (enrolled && k < .3 && !first && Math.abs(c - cols / 2) < 3 && Math.abs(r - rows / 2) < 3) first = [px, y + .3, pz];   // lit before its label shows
    if (enrolled && k < .4) early.push([px, y + .3, pz]);
    icon.forEach(([u, v]) => f.put(px + u * ux, y + v, pz + u * uz, col, b, k));
  }
  const top = (rows - 1) / 2 * gy;
  // the early icon nearest a place on the wall (across, up), its row first, so labels keep their rows
  const near = (x, y) => early.reduce((m, q) => (q[0] - x) ** 2 + 25 * (q[1] - y) ** 2 < (m[0] - x) ** 2 + 25 * (m[1] - y) ** 2 ? q : m, early[0] || [x, y, zc]);
  return f.done({
    participant: first || [0, .3, zc], corner: [Math.sin(-(cols - 1) / 2 * gx / rad) * rad, top + .5, zc + rad * (1 - Math.cos((cols - 1) / 2 * gx / rad))],
    left: near(-3.5, -3), right: near(3.5, 4), far: near(1, 6.5),
  });
}

/* regulatory writing, a randomised trial: two rivers, treatment and control, flowing away from one
   source. The shader moves them along their course (aStream); these are their places at the start */
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
  // split: between the two arms a little way along, in view from closer in than the source
  return f.done({ source: streamAt(.02, 0, 0, 0), split: streamAt(.15, 0, 0, 0), treatment: streamAt(.34, 1, 0, 0), control: streamAt(.34, -1, 0, 0) });
}

/* scientific publications, the literature: a spiral of papers, lighting from the foot up as you
   scroll; the few that make the review glow orange */
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

/* medical communications, real-world evidence: a landscape of data, peaks in orange, contour lines
   brighter. A scan passes over it from near to far as you scroll */
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

/* medical communications, the narrative: Kaplan-Meier curves carved in light, treatment above
   control, the gap between them the effect. They draw from left to right as you scroll */
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

/* regulatory writing, submissions: the documents a trial produces, as a fan of pages, each with its
   own table, figure, chart or flow chart. They appear one after another as you scroll */
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

/* scientific publications, the manuscript: a journal article, two columns with its figure and
   table, under the stamp that says it was accepted. It writes itself from the top as you scroll */
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

/* the close: a globe of points, its graticule and atmosphere, and arcs of light from Ahmedabad to
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

/* AI/ML advisory: a network in five layers, a signal lit through it from input to output, and a
   ring of expert review around the output. It lights from left to right as you scroll, and the
   ring closes last */
function network(N, R, dust) {
  const f = former(N, dust), xs = [-7.5, -3.75, 0, 3.75, 7.5], counts = [5, 8, 11, 8, 5], path = [2, 4, 5, 3, 2], L = xs.length - 1;
  const keyOf = l => .03 + .6 * l / L;
  const nodes = xs.map((x, l) => Array.from({ length: counts[l] }, (_, i) => [x, (i - (counts[l] - 1) / 2) * 1.15, Math.sin(i * 1.3 + l) * .35]));
  // a line of light from a node in layer l to one in the next, lighting from its first end
  const line = (a, b, l, n, colour, bright, rad) => {
    for (let q = 0; q < n; q++) {
      const u = R(), t = R() * TAU, rr = rad * Math.sqrt(R());
      f.put(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.cos(t) * rr, a[2] + (b[2] - a[2]) * u + Math.sin(t) * rr, colour(u), bright, keyOf(l) + (keyOf(l + 1) - keyOf(l)) * u);
    }
  };
  // the links: every node to its three nearest in the next layer, the sparks shared out by length
  const links = [];
  nodes.slice(0, L).forEach((layer, l) => layer.forEach(a => nodes[l + 1]
    .map(b => [Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), b]).sort((p, q) => p[0] - q[0]).slice(0, 3)
    .forEach(([len, b]) => links.push([a, b, l, len]))));
  const perLen = N * .42 / links.reduce((s, k) => s + k[3], 0);
  links.forEach(([a, b, l, len]) => line(a, b, l, Math.round(len * perLen), () => PAL.steel, .35, .025));
  // the nodes: a shell each, steel for the input, ice inside, orange for the output
  const per = Math.round(N * .16 / nodes.flat().length);
  nodes.forEach((layer, l) => layer.forEach(([x, y, z]) => {
    const c = l === 0 ? PAL.steel : l === L ? PAL.orange : PAL.ice;
    for (let q = 0; q < per; q++) { const [dx, dy, dz] = fib(per, q), s = .24 * (1 + (R() - .5) * .1); f.put(x + dx * s, y + dy * s, z + dz * s, c, .75 + R() * .25, keyOf(l)); }
  }));
  // the signal: one path through, orange turning gold, its nodes with an orange core
  for (let l = 0; l < L; l++) line(nodes[l][path[l]], nodes[l + 1][path[l + 1]], l, Math.round(N * .015), u => mix3(PAL.orange, PAL.gold, (l + u) / L), 1.2, .04);
  path.forEach((i, l) => {
    const [x, y, z] = nodes[l][i];
    for (let q = 0, n = Math.round(N * .0025); q < n; q++) { const [dx, dy, dz] = fib(n, q), s = .13 * Math.cbrt(R()); f.put(x + dx * s, y + dy * s, z + dz * s, PAL.ember, 1.3, keyOf(l)); }
  });
  // the review: a ring around the output, across the network (in the yz plane), with ticks outward;
  // it closes from the top, last of all
  const C = [xs[L], 0, 0], RR = 3.6, ringKey = th => .9 + .08 * th / TAU;
  for (let q = 0, n = N * .05; q < n; q++) {
    const th = R() * TAU, ph = R() * TAU, r = RR + Math.cos(ph) * .08;
    f.put(C[0] + Math.sin(ph) * .08, C[1] + Math.cos(th) * r, C[2] + Math.sin(th) * r, PAL.gold, 1.3, ringKey(th));
  }
  for (let t = 0; t < 24; t++) {
    const th = t / 24 * TAU;
    for (let q = 0, n = Math.max(12, Math.round(N * .0006)); q < n; q++) { const r = RR + .18 + q / n * .38; f.put(C[0], C[1] + Math.cos(th) * r, C[2] + Math.sin(th) * r, PAL.gold, 1.1, ringKey(th)); }
  }
  return f.done({ input: nodes[0][counts[0] - 1], model: nodes[2][(counts[2] - 1) / 2], output: nodes[L][path[L]], review: [C[0], C[1] + RR, C[2]] });
}

/* the opening: a page of a clinical document, A4-ish, leaning back a little. While the experience
   loads, the dust gathers into it blank and its outline draws itself with the counter: the frame
   with crop marks at its corners, the margin marks, the header band and the page number (keys up to
   OUTLINE). As the loading screen lifts it writes itself, top to bottom, stroke after stroke, as if
   with one pen (the rest of the keys, run on time rather than scroll): the title, a numbered
   section, the text, two columns lower down with a table and a figure, a signature and, last, the
   approval seal. Unwritten, it stays dark (ghost 0): a blank page, not a blueprint */
export const OUTLINE = .12;
const DIGITS = { 0: '111101101101111', 1: '010110010010111' };   // a 3 x 5 dot font, for the page and section numbers
function page(N, R, dust) {
  const f = former(N, dust), PW = 7.6, PH = 10.6, L = -3.35, RT = 3.35;   // the sheet, and the text block's left and right edges
  const n = q => Math.max(1, Math.round(N * q));
  // the sheet leans back a little and turns a touch toward the words; u, v on it, w toward the viewer
  const pitch = .1, yaw = -.12, cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const p3 = (u, v, w = 0) => { const y = v * cp + w * sp, z = -v * sp + w * cp; return [cy * u + sy * z, y, -sy * u + cy * z]; };
  const at = (u, v, w, c, b, k) => f.put(...p3(u, v, w), c, b, k);
  // the outline's keys, a to b of its share: done a little before OUTLINE, so it is whole when the
  // counter reaches 100; the writing starts a little after, so none of it shows before then
  const ko = (a, b, s) => .9 * OUTLINE * (a + (b - a) * s), WRITE0 = OUTLINE + .03;
  // particles at random along a straight run, kOf(s) their key s of the way along
  const run = (u0, v0, u1, v1, m, c, b, w, kOf, jit = .02) => {
    for (let q = 0; q < m; q++) { const s = R(); at(u0 + (u1 - u0) * s + (R() - .5) * jit, v0 + (v1 - v0) * s + (R() - .5) * jit, w, c, b, kOf(s)); }
  };
  const digits = (u0, v0, str, cell, c, b, kOf) => [...str].forEach((ch, ci) => {
    for (let r = 0; r < 5; r++) for (let cl = 0; cl < 3; cl++) {
      if (DIGITS[ch][r * 3 + cl] !== '1') continue;
      for (let q = 0, m = Math.max(3, n(.00006)); q < m; q++) at(u0 + (ci * 4 + cl + R() * .8) * cell, v0 - (r + R() * .8) * cell, 0, c, b, kOf((ci * 3 + cl + .5) / (str.length * 3)));
    }
  });

  // the outline, drawn while loading. The frame, clockwise from the top left, with crop marks
  // outside each corner as it passes them
  for (let q = 0, m = n(.045); q < m; q++) { const s = q / m, [ou, ov] = outline(s); at(ou * PW + (R() - .5) * .02, ov * PH + (R() - .5) * .02, 0, PAL.ice, .95, ko(.03, .58, s)); }
  [[-1, 1, 0], [1, 1, .25], [1, -1, .5], [-1, -1, .75]].forEach(([su, sv, s]) => {
    const k = ko(.03, .58, s), cu = su * PW / 2, cv = sv * PH / 2;
    run(cu + su * .2, cv, cu + su * .62, cv, n(.0008), PAL.steel, .75, 0, () => k);
    run(cu, cv + sv * .2, cu, cv + sv * .62, n(.0008), PAL.steel, .75, 0, () => k);
  });
  // the sheet itself, barely there, filling in from the top as the frame draws
  for (let q = 0, m = n(.035); q < m; q++) { const u = (R() - .5) * PW * .98, v = (R() - .5) * PH * .98; at(u, v, -.03, mix3(PAL.night, PAL.steel, R() * .6), .05 + R() * .05, ko(.05, .6, (PH / 2 - v) / PH)); }
  // the margin marks: a tick in the left margin at every line of text, top to bottom
  const lineV = [3.85, 3.3, 2.05, 1.55, 1.15, .75, .35, ...Array.from({ length: 10 }, (_, j) => -.25 - j * .4)];
  lineV.forEach((v, j) => run(-PW / 2 + .14, v, -PW / 2 + .3, v, Math.max(6, n(.00025)), PAL.steel, .6, 0, () => ko(.6, .74, j / lineV.length), .01));
  // the header band: a rule, a document code as a mono-looking run of blocks (as in MW-CSR-0712-V2), the page number
  run(L, 4.42, RT, 4.42, n(.006), PAL.steel, .4, 0, s => ko(.76, .86, s));
  const cells = [];
  [2, 3, 4, 2].reduce((x, len) => { for (let c = 0; c < len; c++) cells.push(x + c * .2); return x + len * .2 + .14; }, L);
  cells.forEach((cu, j) => { for (let q = 0, m = n(.00016); q < m; q++) at(cu + R() * .14, 4.72 + (R() - .5) * .15, 0, PAL.steel, .75, ko(.86, .94, j / cells.length)); });
  digits(RT - 7 * .085, 4.72 + 2.5 * .085, '01', .085, PAL.ice, 1, s => ko(.94, 1, s));

  // the writing: strokes, each [top, left, length, draw(k)], k(s) its key s of the way along; written in
  // reading order (top to bottom, then left to right) at the pace of one pen
  const strokes = [], put = (v, u, len, draw) => strokes.push([v, u, len, draw]);
  // a line of text: words of random length, written left to right
  const text = (u0, v, len, c, b, h, dens, w = 0) => put(v, u0, len, k => {
    const words = [];
    for (let x = 0; x < len - .08;) { const wl = Math.min(len - x, .2 + R() * .75); words.push([x, wl]); x += wl + .12; }
    const ink = words.reduce((t, wd) => t + wd[1], 0);
    for (let q = 0, m = n(dens * len); q < m; q++) {
      let r = R() * ink, j = 0;
      while (j < words.length - 1 && r > words[j][1]) { r -= words[j][1]; j++; }
      const s = words[j][0] + Math.min(r, words[j][1]);
      at(u0 + s, v + (R() - .5) * h, w, c, b * (.85 + R() * .3), k(s / len));
    }
  });
  const rule = (u0, v0, u1, v1, c, b, dens) => put(Math.max(v0, v1), Math.min(u0, u1), Math.hypot(u1 - u0, v1 - v0), k => run(u0, v0, u1, v1, n(dens * Math.hypot(u1 - u0, v1 - v0)), c, b, 0, k, .015));
  // the title, two bold lines, and the line under it (protocol, version, date)
  text(L, 3.85, 5.9, PAL.white, 1.15, .2, .0034);
  text(L, 3.3, 4.3, PAL.white, 1.15, .2, .0034);
  text(L, 2.85, 3.4, PAL.steel, .55, .07, .0016);
  rule(L, 2.55, RT, 2.55, PAL.steel, .45, .0008);
  // section 1: its number in orange, its heading, then the text across the page
  put(2.2, L, .35, k => digits(L, 2.05 + 2 * .085, '1', .085, PAL.orange, 1.2, k));
  text(L + .5, 2.05, 2.6, PAL.ice, 1.05, .14, .0026);
  [1.55, 1.15, .75, .35].forEach((v, j) => text(L, v, j === 3 ? 4.1 : RT - L, PAL.steel, .6, .06, .0019));
  // the lower half in two columns: text on the left
  for (let j = 0; j < 10; j++) text(L, -.25 - j * .4, j === 9 ? 1.9 : 3.1, PAL.steel, .6, .06, .0019);
  // on the right, a table: rules above and below its header and at its foot, column rules, figures in the cells
  const T0 = .3, cols = [T0, 1.42, 2.38], top = -.15, mid = -.5, rowV = j => -.72 - j * .33, foot = -1.92;
  rule(T0, top, RT, top, PAL.ice, .75, .0011);
  rule(1.33, top, 1.33, foot, PAL.steel, .4, .0008);
  rule(2.29, top, 2.29, foot, PAL.steel, .4, .0008);
  cols.forEach((u, c) => text(u + .06, -.32, [.75, .6, .65][c], PAL.ice, .95, .09, .0028));
  rule(T0, mid, RT, mid, PAL.steel, .55, .0009);
  for (let j = 0; j < 4; j++) cols.forEach((u, c) => text(u + .06, rowV(j), c ? .45 + R() * .25 : .7 + R() * .2, PAL.steel, .6, .05, .0021));
  rule(T0, foot, RT, foot, PAL.ice, .75, .0011);
  // and below it a figure: two curves rising over time, with their markers, on a pair of axes
  const X0 = .55, X1 = 3.3, Y0 = -2.3, Y1 = -3.85;
  rule(X0, Y0, X0, Y1, PAL.steel, .65, .001);
  const curve = (amp, rate, c, b) => put(Y0 - .05, X0, X1 - X0, k => {
    const y = x => Y1 + (Y0 - Y1) * (.12 + amp * (1 - Math.exp(-rate * x)));
    for (let q = 0, m = n(.0075); q < m; q++) { const x = R(); at(X0 + .05 + x * (X1 - X0 - .1), y(x) + (R() - .5) * .035, 0, c, b, k(x)); }
    for (let t = 1; t <= 6; t++) { const x = t / 6; for (let q = 0, m = Math.max(4, n(.00008)); q < m; q++) { const a = R() * TAU, r = .06 * Math.sqrt(R()); at(X0 + .05 + x * (X1 - X0 - .1) + Math.cos(a) * r, y(x) + Math.sin(a) * r, .02, c, b * 1.2, k(x)); } }
  });
  curve(.78, 2.6, PAL.orange, 1.15);
  curve(.4, 1.8, PAL.blue, 1.05);
  put(Y1, X0, X1 - X0, k => {   // the time axis, with its ticks
    run(X0, Y1, X1, Y1, n(.0028), PAL.steel, .65, 0, k, .015);
    for (let t = 0; t <= 5; t++) run(X0 + t / 5 * (X1 - X0), Y1, X0 + t / 5 * (X1 - X0), Y1 - .12, Math.max(4, n(.00006)), PAL.steel, .65, 0, () => k(t / 5), .01);
  });
  // the foot: a signature over its line, on the left
  put(-4.35, L, 1.75, k => {
    for (let q = 0, m = n(.0045); q < m; q++) {
      const s = R(), u = L + .1 + s * 1.7, v = -4.5 + .14 * Math.sin(s * 17) * (1 - .45 * s) + .07 * Math.sin(s * 41 + 1);
      at(u + (R() - .5) * .02, v + (R() - .5) * .02, 0, PAL.ice, .95, k(s));
    }
  });
  rule(L, -4.75, -1.3, -4.75, PAL.steel, .45, .0008);
  text(L, -4.95, 1.3, PAL.steel, .45, .05, .0014);
  // and last of all the approval seal, in orange: a ring, ticks around it, an inner ring and a tick mark
  const SC = [2.45, -4.6], SW = .1;
  put(-99, 0, 3.2, k => {
    for (let q = 0, m = n(.012); q < m; q++) { const t = R(), a = Math.PI / 2 - t * TAU, r = .5 + (R() - .5) * .025; at(SC[0] + Math.cos(a) * r, SC[1] + Math.sin(a) * r, SW, PAL.ember, 1.3, k(t * .6)); }
    for (let tk = 0; tk < 24; tk++) { const t = tk / 24, a = Math.PI / 2 - t * TAU; for (let q = 0, m = Math.max(4, n(.00016)); q < m; q++) { const r = .55 + R() * .11; at(SC[0] + Math.cos(a) * r, SC[1] + Math.sin(a) * r, SW, PAL.orange, 1.1, k(t * .6)); } }
    for (let q = 0, m = n(.005); q < m; q++) { const a = R() * TAU, r = .37; at(SC[0] + Math.cos(a) * r, SC[1] + Math.sin(a) * r, SW, PAL.gold, .75, k(.6 + .15 * R())); }
    for (let q = 0, m = n(.003); q < m; q++) {
      const s = R(), [u, v] = s < .35 ? [-.17 + s / .35 * .12, -.02 - s / .35 * .14] : [-.05 + (s - .35) / .65 * .27, -.16 + (s - .35) / .65 * .34];
      at(SC[0] + u + (R() - .5) * .02, SC[1] + v + (R() - .5) * .02, SW, PAL.gold, 1.4, k(.78 + .22 * s));
    }
  });
  // the pen's pace: each stroke gets keys in proportion to its length, with a short lift between strokes
  strokes.sort((p, q) => q[0] - p[0] || p[1] - q[1]);
  const LIFT = .15, total = strokes.reduce((t, s) => t + s[2] + LIFT, 0), span = .985 - WRITE0;
  let acc = 0;
  strokes.forEach(([, , len, draw]) => {
    const k0 = WRITE0 + span * acc / total, k1 = WRITE0 + span * (acc + len) / total;
    draw(s => k0 + (k1 - k0) * s);
    acc += len + LIFT;
  });
  return { ...f.done({ title: p3(L, 3.85), section: p3(L, 2.05), table: p3(RT, top), figure: p3(X1, Y0), seal: p3(SC[0] + .55, SC[1], SW) }), ghost: 0 };
}

/* the practices scene: the five practices as shapes on a shallow arc around the viewer, facing it,
   each its own group (the experience pins a button above each, and brightens the one picked): 01
   regulatory writing, a stack of pages under a seal; 02 publications, a journal page; 03 medical
   communications, a slide; 04 training, a group of people; 05 AI/ML advisory, a small network.
   Strokes in ice, accents in orange. Each lights from left to right in turn. Phones (compact) set
   them in two rows, three over two, where one row would draw them too small to read */
function choice(N, R, dust, compact = false) {
  const f = former(N, dust, true), anchors = {}, n = q => Math.max(1, Math.round(N * q)), cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  for (let g = 0; g < 5; g++) {
    f.group = g;
    // where the shape stands, and which way it faces (u across it, v up, w toward the viewer)
    const row = compact && g > 2 ? 1 : 0, slot = compact ? (g < 3 ? g - 1 : g - 3.5) : g - 2, Ra = 26;
    const th = slot * (compact ? 10 : 9.2) * RAD, cx = Math.sin(th) * Ra, cv = compact ? (row ? -2.5 : 2.5) : 0;
    const cz = (1 - Math.cos(th)) * Ra + (compact ? 0 : [0, -.45, .2, -.45, 0][g]);
    const ux = Math.cos(th), uz = Math.sin(th), nx = -Math.sin(th), nz = Math.cos(th), lo = .05 + .18 * g, hi = .2 + .18 * g;
    const at = (u, v, w, c, b) => f.put(cx + ux * u + nx * w, cv + v, cz + uz * u + nz * w, c, b, lo + (hi - lo) * cl((u + 1.6) / 3.2));
    const seg = (u0, v0, u1, v1, m, c, b, w = 0, jit = .015) => { for (let q = 0; q < m; q++) { const s = R(); at(u0 + (u1 - u0) * s + (R() - .5) * jit, v0 + (v1 - v0) * s + (R() - .5) * jit, w, c, b); } };
    const box = (u0, v0, u1, v1, m, c, b, w = 0, hide = null) => {
      for (let q = 0; q < m; q++) { const [ou, ov] = outline(R()), u = (u0 + u1) / 2 + ou * (u1 - u0), v = (v0 + v1) / 2 + ov * (v1 - v0); if (!hide || !hide(u, v)) at(u + (R() - .5) * .015, v + (R() - .5) * .015, w, c, b); }
    };
    const ring = (u0, v0, r, m, c, b, w = 0) => { for (let q = 0; q < m; q++) { const t = R() * TAU, rr = r + (R() - .5) * .025; at(u0 + Math.cos(t) * rr, v0 + Math.sin(t) * rr, w, c, b); } };
    const lines = (u0, v0, len, count, step, m, c, b) => { for (let l = 0; l < count; l++) seg(u0, v0 - l * step, u0 + len * (l === count - 1 ? .55 : .8 + R() * .2), v0 - l * step, m, c, b, 0, .03); };
    if (g === 0) {
      // three pages, offset, the back two showing only where the ones in front leave them, the top one written and sealed
      const pw = 1.9, ph = 2.6, pages = [[.17, .13, -.5], [0, 0, -.25], [-.17, -.13, 0]];
      const covered = (j, u, v) => pages.slice(j + 1).some(([du, dv]) => Math.abs(u - du) < pw / 2 - .02 && Math.abs(v - dv) < ph / 2 - .02);
      pages.forEach(([du, dv, w], j) => box(du - pw / 2, dv - ph / 2, du + pw / 2, dv + ph / 2, n(j < 2 ? .008 : .016), j < 2 ? PAL.steel : PAL.ice, j < 2 ? .6 : 1, w, (u, v) => covered(j, u, v)));
      const [fu, fv] = pages[2];
      seg(fu - .72, fv + .95, fu + .3, fv + .95, n(.004), PAL.white, 1.1, 0, .05);
      lines(fu - .72, fv + .64, 1.44, 5, .24, n(.0022), PAL.steel, .6);
      const s0 = fu + .42, s1 = fv - .8;
      ring(s0, s1, .3, n(.006), PAL.ember, 1.3, .06);
      for (let t = 0; t < 20; t++) { const a = t / 20 * TAU; seg(s0 + Math.cos(a) * .35, s1 + Math.sin(a) * .35, s0 + Math.cos(a) * .44, s1 + Math.sin(a) * .44, Math.max(4, n(.00015)), PAL.orange, 1.1, .06, .01); }
      seg(s0 - .13, s1 + .01, s0 - .04, s1 - .09, n(.0007), PAL.gold, 1.35, .06, .01); seg(s0 - .04, s1 - .09, s0 + .15, s1 + .13, n(.0011), PAL.gold, 1.35, .06, .01);
    } else if (g === 1) {
      // a journal page: its title, two columns of text, a figure in the right one
      box(-1.05, -1.45, 1.05, 1.45, n(.02), PAL.ice, 1);
      seg(-.85, 1.16, .55, 1.16, n(.005), PAL.white, 1.15, 0, .06);
      seg(-.85, .95, .85, .95, n(.0016), PAL.steel, .45);
      lines(-.85, .72, .75, 9, .22, n(.0016), PAL.steel, .6);
      lines(.1, .72, .75, 2, .22, n(.0016), PAL.steel, .6);
      box(.1, -.68, .85, .12, n(.005), PAL.orange, 1);
      for (let q = 0, m = n(.004); q < m; q++) { const x = R(); at(.17 + x * .6, -.58 + .6 * (1 - Math.exp(-3.2 * x)) + (R() - .5) * .025, .02, PAL.gold, 1.2); }
      lines(.1, -.9, .75, 2, .22, n(.0016), PAL.steel, .6);
    } else if (g === 2) {
      // a slide, 16:9: its title, a bar chart, and the stand it is shown on
      box(-1.55, -.5, 1.55, 1.24, n(.02), PAL.ice, 1);
      seg(-1.32, 1.0, .2, 1.0, n(.005), PAL.white, 1.15, 0, .07);
      seg(-1.25, -.32, 1.3, -.32, n(.003), PAL.ice, .7);
      [.42, .66, .5, .86, .7].forEach((h, j) => { for (let q = 0, m = n(.004); q < m; q++) at(-1.05 + j * .5 + R() * .3, -.3 + R() * h, 0, j === 3 ? PAL.ember : PAL.orange, j === 3 ? 1.25 : .85); });
      seg(0, -.5, 0, -1.2, n(.0018), PAL.steel, .6);
      seg(0, -.88, -.62, -1.45, n(.0018), PAL.steel, .6); seg(0, -.88, .62, -1.45, n(.0018), PAL.steel, .6);
    } else if (g === 3) {
      // a group of people, four by three, the crowd's pictogram; one in orange
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const pu = (c - 1.5) * .74, pv = (1 - r) * 1.0 - .12, lit = r === 1 && c === 2;
        for (let q = 0, m = n(.0062); q < m; q++) { const [u, v] = personAt(R); at(pu + u * 1.5 + (R() - .5) * .02, pv + v * 1.5 + (R() - .5) * .02, 0, lit ? PAL.ember : PAL.ice, lit ? 1.3 : .8); }
      }
    } else {
      // a small network in three layers, a signal through it to an output in orange
      const xs = [-1.15, 0, 1.15], counts = [3, 4, 3], path = [1, 2, 1];
      const nodes = xs.map((x, l) => Array.from({ length: counts[l] }, (_, i) => [x, (i - (counts[l] - 1) / 2) * .78]));
      nodes.slice(0, 2).forEach((layer, l) => layer.forEach(a => nodes[l + 1].forEach(b => seg(a[0], a[1], b[0], b[1], n(.0009), PAL.steel, .42, 0, .02))));
      for (let l = 0; l < 2; l++) { const a = nodes[l][path[l]], b = nodes[l + 1][path[l + 1]]; seg(a[0], a[1], b[0], b[1], n(.004), PAL.ember, 1.25, .05, .03); }
      nodes.forEach((layer, l) => layer.forEach(([x, y], i) => { const on = path[l] === i; ring(x, y, .17, n(.0022), on && l === 2 ? PAL.ember : on ? PAL.gold : PAL.ice, on ? 1.3 : .9, .05); }));
    }
    anchors['pick' + g] = [cx, cv + 1.72, cz]; anchors['pickBase' + g] = [cx, cv - 1.72, cz];
  }
  return f.done(anchors);
}

// all of them, in the order of F (a new one goes last, so the shapes before it keep their random draws).
// compact: the phone layout of the practices' shapes (two rows)
export function buildFormations(N, seed = 1104, { compact = false } = {}) {
  const R = random(seed), dust = makeDust(N, random(seed + 7)), sp = streamParams(N, random(seed + 3));
  const list = [former(N, dust).done(), molecule(N, R, dust), crowd(N, R, dust), streams(N, R, dust, sp), papers(N, R, dust),
    landscape(N, R, dust), curves(N, R, dust), dossier(N, R, dust), manuscript(N, R, dust), globe(N, R, dust), network(N, R, dust),
    page(N, R, dust), choice(N, R, dust, compact)];
  return { list, stream: sp, pick: list[F.CHOICE].group };
}
