/* The study, the film's morning (and late afternoon) scene: a doctor's study drawn in ink on paper
   from one perspective camera, so the desk has a real top and edge and everything stands on it with
   its own shadow (the display with the draft open, keyboard and trackpad, a tablet with stylus notes,
   a stethoscope, reading glasses, coffee, a lamp, reference volumes, a plant, certificates on the
   wall, a doorway to the archive). Drawn on a 2D canvas at 1280 by 800 units, then scaled; the film
   (renderer.js) shows it as the day's background and frames its display, where the page stands as
   the draft. The drawing is the design board's (src/pages/lamplight/board.astro), shared here. */
const TAU = Math.PI * 2;
const INK = '19,36,79', PEN = '180,80,15', SHADOW = '38,48,82';
const PAPER = '#F3EEE3', LIGHT = '#F8F5EE', SHEET = '#FBF8F2';
// the study's window, in the room's units (the back wall is at z = -7), and its skies: the morning's,
// dusk's (the night to come) and a sunset's (no sun: the colour of it)
const WIN = { x0: 12.6, x1: 17.2, y0: 1.25, y1: 14 };
const SKIES = {
  day: [[0, '#DCE5F1'], [.62, '#E9EEF4'], [1, '#F6F1E7']],
  dusk: [[0, '#0A1534'], [.55, '#1C2852'], [.86, '#3B3D63'], [1, '#56496A']],
  sunset: [[0, '#2C3160'], [.5, '#8A5878'], [.82, '#D9876E'], [1, '#F2B866']],
};
let LWF = 1;   // line weight factor: small frames draw a little heavier so thumbnails still read
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---------- the pen ----------
function kit(c, seed, o = {}) {
  const r = rng(seed);
  const K = {
    r, ink: o.ink || INK, wob: o.wobble ?? .14,
    stroke(w, a) { c.lineWidth = w * LWF; c.strokeStyle = `rgba(${K.ink},${Math.min(1, a)})`; c.lineCap = 'round'; c.lineJoin = 'round'; },
    line(x1, y1, x2, y2, w = 1, a = .85) {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, n = Math.max(2, Math.round(L / 22)), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
      c.beginPath();
      for (let i = 0; i <= n; i++) { const t = i / n, j = i && i < n ? (r() - .5) * K.wob : 0, x = x1 + (x2 - x1) * t + nx * j, y = y1 + (y2 - y1) * t + ny * j; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      K.stroke(w, a); c.stroke();
    },
    poly(pts, w = 1, a = .85, close = false) { if (pts.length < 2) return; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); K.stroke(w, a); c.stroke(); },
    smooth(pts, w = 1, a = .85, close = false) {
      if (pts.length < 3) return K.poly(pts, w, a, close);
      c.beginPath();
      if (close) {
        const m0 = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]; c.moveTo(m0[0], m0[1]);
        for (let i = 1; i <= pts.length; i++) { const p = pts[i % pts.length], q = pts[(i + 1) % pts.length]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      } else {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
        const l = pts[pts.length - 1]; c.lineTo(l[0], l[1]);
      }
      K.stroke(w, a); c.stroke();
    },
    path(pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); },
    clip(pts) { K.path(pts); c.clip(); },
    fill(pts, style) { K.path(pts); c.fillStyle = style; c.fill(); },
    hatch(pts, ang, gap, w = .45, a = .3) {
      c.save(); K.clip(pts);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4, dx = Math.cos(ang), dy = Math.sin(ang);
      c.beginPath();
      for (let s = -R; s <= R; s += gap * Math.max(1, LWF * .8)) { c.moveTo(cx - dy * s - dx * R, cy + dx * s - dy * R); c.lineTo(cx - dy * s + dx * R, cy + dx * s + dy * R); }
      K.stroke(w, a); c.stroke();
      c.restore();
    },
    // light: a soft pool lighter than the paper it falls on
    light(x, y, rx, ry, rgb, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.55, `rgba(${rgb},${a * .45})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore(); },
    glow(x, y, rad, rgb, a) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .3})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); c.restore(); },
    dot(x, y, rad, a, rgb) { c.fillStyle = `rgba(${rgb || K.ink},${Math.min(1, a)})`; c.beginPath(); c.arc(x, y, rad * Math.sqrt(LWF), 0, TAU); c.fill(); },
    // a line of type in stipple: words as clusters of ink dots
    text(x, y, len, dens = 1.4, a = .8, size = 2.6, rgb) {
      let px = x;
      while (px < x + len - 6) { const wl = Math.min(8 + r() * 30, x + len - px); for (let d = 0; d < wl * dens; d++) K.dot(px + r() * wl, y + (r() - .5) * size, .42 + r() * .5, a * (.55 + r() * .45), rgb); px += wl + 4 + r() * 4; }
    },
    // a line of type as an interface draws it: rounded bars, word by word
    bars(x, y, len, h, a, rgb) {
      let px = x; c.fillStyle = `rgba(${rgb || K.ink},${a})`;
      while (px < x + len - 2) { const wl = Math.min(h * (2.4 + r() * 6), x + len - px); rr(c, px, y - h / 2, wl, h, h / 2); c.fill(); px += wl + h * 1.2; }
    },
  };
  return K;
}
function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, rad) : c.rect(x, y, w, h); }
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function paper(c, W, H, seed) {
  const r = rng(seed);
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 160; i++) { c.fillStyle = `rgba(110,90,60,${.012 + r() * .02})`; c.fillRect(r() * W, r() * H, 1, 1); }
}

// ---------- the room's camera: one eye for everything, verticals kept upright ----------
const STUDY = { F: 880, ex: 5, ey: 9, ez: 10, cx: 640, cy: -36 };
// for a camera that moves: the drawing extended PADT above and PADR to the right of the 1280 by 800
// view (the same eye), so a layer holds what a moving camera can come to see
const PADT = 340, PADR = 280;
export const STUDY_X = { ...STUDY, cy: STUDY.cy + PADT }, EXT = [1280 + PADR, 800 + PADT];
function room(c, K, cam) {
  const E = [cam.ex, cam.ey, cam.ez];
  const P = ([x, y, z]) => { const d = cam.ez - z; return [cam.cx + cam.F * (x - cam.ex) / d, cam.cy - cam.F * (y - cam.ey) / d]; };
  const S = {
    P, E,
    line(a, b, w = 1, al = .85) { const A = P(a), B = P(b); K.line(A[0], A[1], B[0], B[1], w, al); },
    poly(pts, w = 1, al = .85, close = false) { K.poly(pts.map(P), w, al, close); },
    smooth(pts, w = 1, al = .85, close = false) { K.smooth(pts.map(P), w, al, close); },
    fill(pts, style) { K.fill(pts.map(P), style); },
    hatch(pts, ang, gap, w = .45, al = .3) { K.hatch(pts.map(P), ang, gap, w, al); },
    ring(cx, y, cz, rx, rz = rx, n = 56) { return Array.from({ length: n }, (_, i) => { const t = i / n * TAU; return [cx + Math.cos(t) * rx, y, cz + Math.sin(t) * rz]; }); },
    // a shadow on the desk: a footprint on y = 0, pushed away from the light (to the left, toward us), softened
    shadow(pts, a = .13, blur = 5, push = [-.18, .14]) { c.save(); c.filter = `blur(${blur * LWF}px)`; K.fill(pts.map(([x, z]) => P([x + push[0], 0, z + push[1]])), `rgba(${SHADOW},${a})`); c.restore(); },
    // an upright cylinder or cone frustum: its outline is the hull of its two rims; the left of it in shade
    cyl(cx, cz, r0, r1, y0, y1, o = {}) {
      const B = S.ring(cx, y0, cz, r0).map(P), T = S.ring(cx, y1, cz, r1).map(P), H = hull(B.concat(T));
      K.fill(H, o.fill || LIGHT);
      if (o.shade !== false) {
        const xs = H.map(p => p[0]), ys = H.map(p => p[1]), l = Math.min(...xs), rr2 = Math.max(...xs), t = Math.min(...ys), b = Math.max(...ys), k = o.shadeK ?? .34;
        c.save(); K.clip(H); K.hatch([[l - 2, t - 2], [l + (rr2 - l) * k, t - 2], [l + (rr2 - l) * k * .8, b + 2], [l - 2, b + 2]], o.hang ?? 1.2, o.hgap ?? 3.2, .42, o.hal ?? .32); c.restore();
      }
      K.poly(H, o.w ?? 1.15, .88, true);
      if (o.top !== false) { K.fill(T, o.topFill || SHEET); K.poly(T, o.tw ?? .9, .8, true); }
      return { T, B, H };
    },
    // an upright prism over a convex footprint [[x, z], ...]: the faces that look at the eye, then the top
    prism(base, y0, y1, o = {}) {
      const n = base.length, mx = base.reduce((s, p) => s + p[0], 0) / n, mz = base.reduce((s, p) => s + p[1], 0) / n, faces = [];
      for (let i = 0; i < n; i++) {
        const [ax, az] = base[i], [bx, bz] = base[(i + 1) % n], fx = (ax + bx) / 2, fz = (az + bz) / 2;
        let nx = bz - az, nz = -(bx - ax); if (nx * (fx - mx) + nz * (fz - mz) < 0) { nx = -nx; nz = -nz; }
        if ((E[0] - fx) * nx + (E[2] - fz) * nz > 0) faces.push({ pts: [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], lit: (nx + nz * .25) / Math.hypot(nx, nz) });
      }
      faces.forEach(f => {
        S.fill(f.pts, f.lit > .1 ? (o.side || LIGHT) : (o.dark || o.side || LIGHT));
        if (f.lit <= .1 && o.hatch !== false) S.hatch(f.pts, o.hang ?? 1.15, o.hgap ?? 3.2, .42, o.hal ?? .34);
        S.poly(f.pts, o.w ?? 1, .85, true);
      });
      const top = base.map(([x, z]) => [x, y1, z]);
      S.fill(top, o.top || SHEET); S.poly(top, o.w ?? 1, .85, true);
      return { top, faces };
    },
    // a point on a quad (a, b, c, d in order) at (u, v): u along a to b, v along a to d
    on(q, u, v) { const a = q[0], b = q[1], d = q[3], cc = q[2]; return [0, 1, 2].map(i => a[i] * (1 - u) * (1 - v) + b[i] * u * (1 - v) + cc[i] * u * v + d[i] * (1 - u) * v); },
  };
  return S;
}

// ---------- morning: the study ----------
function study(c, W, H, seed, o = {}) {
  // o.layer: one layer of the room alone (drawStudyLayer); o.cam: the eye's projection (the extended one
  // for layers)
  const want = n => !o.layer || o.layer === n, cam = o.cam || STUDY;
  if (want('wall')) paper(c, W, H, seed);
  const K = kit(c, seed + 1), S = room(c, K, cam), P = S.P;
  if (o.warm && !o.layer) { const g = c.createLinearGradient(W, 0, 0, H); g.addColorStop(0, `rgba(240,196,120,${.16 * o.warm})`); g.addColorStop(.6, `rgba(240,196,120,${.07 * o.warm})`); g.addColorStop(1, 'rgba(240,196,120,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const WALL = -7, TOPC = '#EDE4D2', EDGE = '#E2D6BF';

  // the doorway to the left, and the archive through it: its far wall of shelving, its left wall
  // running away from us, the floor, light from a high window; cooler and fainter than the study
  const jamb = P([-2, 0, WALL])[0], reach = o.layer ? jamb + 70 : jamb;
  // (in layers, the wall has its doorway open and what is through it is drawn wider than the opening)
  if (o.layer === 'wall') c.clearRect(-10, -10, jamb + 10, H + 20);
  if (want('beyond')) {
  c.save(); K.clip([[-10, -10], [reach, -10], [reach, H + 10], [-10, H + 10]]);
  {
    const A = kit(c, seed + 2, { ink: '70,88,132', wobble: .1 }), R = room(c, A, cam);
    const FZ = -30, FL = -7.5, LX = -19, TY = 13.5;
    c.fillStyle = '#E4E9F0'; c.fillRect(0, 0, reach, H);
    R.fill([[LX, FL, WALL], [LX, FL, FZ], [LX, TY, FZ], [LX, TY, WALL]], '#DCE2EB');
    R.fill([[LX, FL, WALL], [-2, FL, WALL], [-2, FL, FZ], [LX, FL, FZ]], '#E9EDF3');
    {
      const sh = [P([LX, 12, -12]), P([LX, 12, -15.5]), P([-5, FL, -20]), P([-8.5, FL, -12.5])];
      const g = c.createLinearGradient(sh[0][0], sh[0][1], sh[2][0], sh[2][1]); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,.2)');
      A.fill(sh, g);
    }
    const shelfY = []; for (let y = FL + .5; y < TY; y += 2.3) shelfY.push(y);
    const bays = [-19, -16.4, -13.8, -11.2, -8.6];
    bays.forEach(x => { R.line([x, FL, FZ], [x, TY, FZ], 1, .62); R.line([x + .22, FL, FZ], [x + .22, TY, FZ], .5, .4); });
    shelfY.forEach((y, si) => {
      R.line([LX, y, FZ], [-6, y, FZ], .85, .58); R.line([LX, y - .2, FZ], [-6, y - .2, FZ], .45, .36);
      if (si === shelfY.length - 1) return;
      for (let x = LX + .3; x < -6.4;) {
        const k = A.r(); if (k < .08) { x += .5; continue; }
        const wd = .3 + A.r() * .22, hh = 1.3 + A.r() * .6, lean = k > .95 ? .3 : 0;
        if (bays.some(b => x < b + .32 && x + wd > b - .04)) { x += .28; continue; }
        R.poly([[x, y, FZ], [x + lean, y + hh, FZ], [x + wd + lean, y + hh, FZ], [x + wd, y, FZ]], .55, .46);
        if (A.r() < .16) R.fill([[x + .06, y + hh * .56, FZ], [x + wd - .06, y + hh * .56, FZ], [x + wd - .06, y + hh * .74, FZ], [x + .06, y + hh * .74, FZ]], A.r() < .5 ? 'rgba(224,122,31,.38)' : 'rgba(224,168,46,.42)');
        x += wd + .02;
      }
    });
    [-9, -12.5, -16, -19.5, -23, -26.5, -29.8].forEach(z => R.line([LX, FL, z], [LX, TY, z], .85, .52));
    shelfY.forEach((y, si) => {
      R.line([LX, y, WALL], [LX, y, FZ], .75, .48);
      if (si === shelfY.length - 1) return;
      for (let z = WALL - 2.3; z > FZ + .3; z -= .34 + A.r() * .2) { if (A.r() < .1) continue; R.line([LX, y, z], [LX, y + 1.3 + A.r() * .55, z], .45, .34); }
    });
    for (let x = LX + 1.2; x < -2; x += 1.2) R.line([x, FL, WALL], [x, FL, FZ], .45, .2);
    for (let z = WALL - 2.5; z > FZ; z -= 2.6) R.line([LX, FL, z], [-2, FL, z], .4, .12);
    const rail = x => R.line([x, FL, FZ + 1.7], [x + 1.3, TY - 1.2, FZ + .15], 1.05, .62);
    rail(-14.6); rail(-13.5);
    for (let t = .07; t < 1; t += .075) R.line([-14.6 + 1.3 * t, FL + (TY - 1.2 - FL) * t, FZ + 1.7 - 1.55 * t], [-13.5 + 1.3 * t, FL + (TY - 1.2 - FL) * t, FZ + 1.7 - 1.55 * t], .6, .46);
  }
  c.restore();
  }
  if (want('wall')) {
  // the opening's edge: a little shade on the jamb side, the way light falls off at a doorway
  { const g = c.createLinearGradient(jamb - 40, 0, jamb, 0); g.addColorStop(0, 'rgba(70,88,132,0)'); g.addColorStop(1, 'rgba(70,88,132,.08)'); c.fillStyle = g; c.fillRect(jamb - 40, 0, 40, H); }
  if (o.doorGlow) K.light(jamb * .5, H * .42, jamb * .9, H * .6, '255,255,255', .35 * o.doorGlow);
  // the architrave around the opening
  {
    const z = WALL + .02, cas = [[-2, -8, z], [-1.25, -8, z], [-1.25, 14, z], [-2, 14, z]];
    S.fill(cas, SHEET); S.poly(cas, 1.3, .88, true);
    S.line([-1.92, -8, z], [-1.92, 14, z], .5, .5); S.line([-1.84, -8, z], [-1.84, 14, z], .45, .42); S.line([-1.62, -8, z], [-1.62, 14, z], .6, .45); S.line([-1.36, -8, z], [-1.36, 14, z], .45, .3);
    c.save(); c.filter = `blur(${3 * LWF}px)`; K.fill([P([-1.25, -8, z]), P([-1.05, -8, z]), P([-1.05, 14, z]), P([-1.25, 14, z])], `rgba(${SHADOW},.08)`); c.restore();
  }
  // the skirting along the wall, left of the desk
  S.line([-1.25, -6.6, WALL], [2, -6.6, WALL], .8, .5);

  // two certificates in slim dark frames
  const cert = (x0, x1, y0, y1, seal) => {
    const z = WALL + .01, q = [[x0, y1, z], [x1, y1, z], [x1, y0, z], [x0, y0, z]];
    c.save(); c.filter = `blur(${4 * LWF}px)`; K.fill(q.map(([x, y]) => P([x - .08, y - .12, z])), `rgba(${SHADOW},.16)`); c.restore();
    S.fill(q, `rgba(${INK},.92)`);
    const f = .1, m = .32, inner = [[x0 + f, y1 - f, z], [x1 - f, y1 - f, z], [x1 - f, y0 + f, z], [x0 + f, y0 + f, z]], mat = [[x0 + m, y1 - m, z], [x1 - m, y1 - m, z], [x1 - m, y0 + m, z], [x0 + m, y0 + m, z]];
    S.fill(inner, '#FDFBF7'); S.fill(mat, SHEET); S.poly(mat, .5, .4, true);
    const a = P([x0 + m + .25, y1 - m - .4, z]), b = P([x1 - m - .25, 0, z]);
    K.bars(a[0] + (b[0] - a[0]) * .18, a[1], (b[0] - a[0]) * .64, 2.2, .75);
    for (let i = 0; i < 4; i++) { const p = P([0, y1 - m - .9 - i * .32, z]); K.bars(a[0] + 2, p[1], (b[0] - a[0]) - 4 - (i === 3 ? 18 : 0), 1.1, .3); }
    const s = P([x1 - m - .42, y0 + m + .45, z]); K.fill(Array.from({ length: 16 }, (_, i) => [s[0] + Math.cos(i / 16 * TAU) * 6.5, s[1] + Math.sin(i / 16 * TAU) * 6.5]), seal); K.poly(Array.from({ length: 16 }, (_, i) => [s[0] + Math.cos(i / 16 * TAU) * 6.5, s[1] + Math.sin(i / 16 * TAU) * 6.5]), .7, .6, true);
  };
  cert(-.4, 1.9, 2.4, 5.5, 'rgba(224,122,31,.55)'); cert(2.4, 4.3, 2.9, 5.2, 'rgba(224,168,46,.6)');
  }

  // a tall window in the back wall, behind the lamp: the sky (the morning's, or dusk's or a sunset's,
  // o.sky), roofs and trees far off, the casing, a mullion and a transom, the sill. The variants
  // differ only inside the window and draw with their own pen, so everything else in the room comes
  // out the same in each (the film mixes them inside the window: drawWindowPatch)
  {
    const z = WALL + .01, { x0, x1, y0, y1 } = WIN, cas = .32, sky = o.sky || 'day';
    const q = [[x0, y1, z], [x1, y1, z], [x1, y0, z], [x0, y0, z]], pq = q.map(P);
    // the view out: as a layer it is drawn wider than the glass (it stands far off, and a moving camera
    // sees more of it); at dusk and sunset the layer keeps the town alone, its sky left open for the
    // night beyond
    if (want('outside')) {
      const lay = o.layer === 'outside', ox0 = lay ? x0 - 4 : x0, ox1 = lay ? x1 + 4 : x1, oy0 = lay ? y0 - 4 : y0, oy1 = lay ? y1 + 3 : y1;
      const oq = [[ox0, oy1, z], [ox1, oy1, z], [ox1, oy0, z], [ox0, oy0, z]].map(P);
      if (!(lay && sky !== 'day')) {
        const g = c.createLinearGradient(0, pq[0][1], 0, pq[3][1]);
        SKIES[sky].forEach(([at, col]) => g.addColorStop(at, col));
        K.fill(oq, g);
      }
      const A = kit(c, seed + 5, { ink: '86,104,146', wobble: .1 }), hz = 2.7, day = sky === 'day';
      const roof = []; for (let x = ox0; x <= ox1 + .01; x += .25) roof.push([x, hz + (Math.sin(x * 2.3) > .4 ? .55 + Math.sin(x * 5.1) * .15 : .12) + Math.max(0, Math.sin(x * .9 + 1) * .3), z]);
      const trees = Array.from({ length: lay ? 8 : 4 }, (_, k) => ({ tx: (lay ? ox0 + .9 : x0 + .7) + k * 1.15, rx: 9 + k % 2 * 3 }));
      if (day) {
        if (lay) A.fill(roof.map(P).concat([P([ox1, oy0, z]), P([ox0, oy0, z])]), '#F3F0E8');
        A.poly(roof.map(P), .6, .45);
        trees.forEach(({ tx, rx }) => { const ty = hz + .5, cr = P([tx, ty + .35, z]); c.beginPath(); c.ellipse(cr[0], cr[1], rx, 7, 0, 0, TAU); A.stroke(.55, .35); c.stroke(); A.line(...P([tx, hz, z]), ...P([tx, ty, z]), .5, .35); });
        A.line(...P([ox0, hz, z]), ...P([ox1, hz, z]), .45, .3);
      } else {
        // dusk and sunset: the roofs and trees as one dark shape against the sky, a few windows lit
        const dark = sky === 'dusk' ? '#0B1230' : '#2B2036';
        A.fill(roof.map(P).concat([P([ox1, oy0, z]), P([ox0, oy0, z])]), dark);
        trees.forEach(({ tx, rx }) => { const cr = P([tx, hz + .85, z]); c.beginPath(); c.ellipse(cr[0], cr[1], rx, 7, 0, 0, TAU); c.fillStyle = dark; c.fill(); });
        [[.18, .32], [.46, .2], [.71, .38], [.86, .24], [.06, .28], [.97, .3]].forEach(([u, v]) => { const p = P([ox0 + (ox1 - ox0) * u, hz + v, z]); c.fillStyle = sky === 'dusk' ? 'rgba(240,196,120,.85)' : 'rgba(240,196,120,.55)'; c.fillRect(p[0], p[1], 2.2, 2.6); });
        if (sky === 'dusk' && !lay) [[.2, 7.4], [.62, 6.8], [.4, 5.9], [.8, 7.9], [.12, 5.2], [.7, 4.9]].forEach(([u, y], i) => { const p = P([x0 + (x1 - x0) * u, y, z]); A.dot(p[0], p[1], i % 3 ? .55 : .85, .9, '236,240,252'); });
      }
    }
    if (o.layer === 'wall') { c.save(); c.globalCompositeOperation = 'destination-out'; K.fill(pq, '#000'); c.restore(); }
    if (want('wall')) {
    S.poly(q, 1.3, .85, true);
    S.poly([[x0 + cas, y1, z], [x0 + cas, y0 + cas, z], [x1 - cas, y0 + cas, z], [x1 - cas, y1, z]], .6, .5);
    S.line([(x0 + x1) / 2, y0 + cas, z], [(x0 + x1) / 2, y1, z], 1.1, .8); S.line([(x0 + x1) / 2 + .08, y0 + cas, z], [(x0 + x1) / 2 + .08, y1, z], .5, .45);
    S.line([x0 + cas, 9.4, z], [x1 - cas, 9.4, z], 1.1, .8); S.line([x0 + cas, 9.3, z], [x1 - cas, 9.3, z], .5, .45);
    const sill = [[x0 - .35, y0, z + .02], [x1 + .35, y0, z + .02], [x1 + .35, y0 - .32, z + .02], [x0 - .35, y0 - .32, z + .02]];
    S.fill(sill, SHEET); S.poly(sill, 1, .8, true);
    }
  }

  // the desk: its top, its front edge, the grain, a line where it meets the wall
  if (want('desk')) {
  const X0 = 1, X1 = 30, D0 = 0, D1 = WALL;
  const top = [[X0, 0, D0], [X1, 0, D0], [X1, 0, D1], [X0, 0, D1]];
  S.fill(top, TOPC);
  for (let i = 0; i < 24; i++) { const z = -6.8 + i * .27 + K.r() * .12, x0 = X0 + K.r() * 4, x1 = x0 + 6 + K.r() * 16; S.line([x0, 0, z], [x1, 0, z + (K.r() - .5) * .06], .45, .05 + K.r() * .05); }
  c.save(); const wg = c.createLinearGradient(0, P([0, 0, D1])[1], 0, P([0, 0, D1 + .9])[1]); wg.addColorStop(0, `rgba(${SHADOW},.1)`); wg.addColorStop(1, `rgba(${SHADOW},0)`); S.fill([[X0, 0, D1], [X1, 0, D1], [X1, 0, D1 + .9], [X0, 0, D1 + .9]], wg); c.restore();
  const front = [[X0, 0, D0], [X1, 0, D0], [X1, -.5, D0], [X0, -.5, D0]];
  S.fill(front, EDGE); S.hatch(front, .02, 3.6, .4, .16); S.poly(front, 1.2, .88, true);
  S.line([X0, -.06, D0 + .002], [X1, -.06, D0 + .002], .6, .35);
  S.line([X0, 0, D0], [X0, 0, D1], 1.2, .88);
  S.line([X0, 0, D1], [X1, 0, D1], .9, .6);

  // the lamp's pool of light on the desk
  const pool = P([10.6, 0, -2.7]); K.light(pool[0], pool[1], 250, 96, '255,250,238', .85);
  }

  // reference volumes, standing at the back
  const vols = [[1.7, .42, 2.45, '#F1ECE1', 0], [2.12, .52, 2.75, '#DCE1EA', 1], [2.64, .36, 2.3, '#F4EFE5', 0], [3.0, .48, 2.6, '#F1ECE1', 2], [3.48, .4, 2.2, '#E9EDF3', 0]];
  if (want('desk')) S.shadow([[1.7, -6.95], [3.9, -6.95], [3.9, -5.35], [1.7, -5.35]], .12, 5, [-.3, .25]);
  if (want('vols')) vols.forEach(([x, w, h, col, band]) => {
    const z0 = -6.95, z1 = -5.4 + (K.r() - .5) * .08;
    const b = S.prism([[x, z0], [x + w, z0], [x + w, z1], [x, z1]], 0, h, { side: col, dark: col, hgap: 3, w: .95 });
    const sp = [[x, 0, z1], [x + w, 0, z1], [x + w, h, z1], [x, h, z1]];
    S.line([x + .03, h - .22, z1], [x + w - .03, h - .22, z1], .6, .6); S.line([x + .03, h - .3, z1], [x + w - .03, h - .3, z1], .4, .45);
    S.line([x + .03, .22, z1], [x + w - .03, .22, z1], .6, .6);
    if (band) S.fill([S.on(sp, .14, .58), S.on(sp, .86, .58), S.on(sp, .86, .72), S.on(sp, .14, .72)], band === 1 ? 'rgba(224,122,31,.55)' : 'rgba(224,168,46,.6)');
    const lb = [S.on(sp, .2, .38), S.on(sp, .8, .38), S.on(sp, .8, .5), S.on(sp, .2, .5)]; S.poly(lb, .5, .5, true);
    for (let k = 1; k < 4; k++) S.line([x + w * k / 4, h + .001, z0 + .1], [x + w * k / 4, h + .001, z1 - .06], .35, .3);
  });

  // a snake plant in a pot, between the volumes and the display
  if (want('desk')) S.shadow(S.ring(4.95, 0, -6.35, .4).map(([x, , z]) => [x, z]), .13, 4, [-.25, .2]);
  if (want('plant')) {
  S.cyl(4.95, -6.35, .3, .37, 0, .64, { hgap: 3 });
  {
    const base = P([4.95, .64, -6.35]);
    [[-9, 104, -12, 9], [-3, 150, -4, 10], [4, 136, 7, 9.5], [10, 96, 15, 8.5], [-1, 82, 4, 8]].forEach(([dx, h, lean, wd], i) => {
      const bx = base[0] + dx * .6, by = base[1] - 1, tx = bx + lean, ty = by - h * .8;
      const at = t => [bx + (tx - bx) * t, by + (ty - by) * t], m = at(.42), q1 = at(.78);
      c.beginPath(); c.moveTo(bx - wd * .45, by);
      c.quadraticCurveTo(m[0] - wd * 1.05, m[1], q1[0] - wd * .35, q1[1]); c.quadraticCurveTo(tx - 1, ty + 6, tx, ty);
      c.quadraticCurveTo(tx + 1, ty + 6, q1[0] + wd * .35, q1[1]); c.quadraticCurveTo(m[0] + wd * 1.05, m[1], bx + wd * .45, by); c.closePath();
      c.fillStyle = i % 2 ? '#EEF0E7' : '#E5E9DE'; c.fill(); K.stroke(1, .86); c.stroke();
      const mid = [at(.05), at(.5), at(.95)]; K.smooth(mid, .45, .32);
      for (let t = .14; t < .8; t += .11) { const p = at(t), w2 = wd * (1 - Math.abs(t - .42) * 1.1) * .8; K.smooth([[p[0] - w2, p[1] + 1.8], [p[0], p[1] - .6], [p[0] + w2, p[1] + 1.4]], .45, .3); }
    });
  }
  }

  // the display, on its stand, the draft open on it
  if (want('desk')) S.shadow([[7.75, -6.55], [9.45, -6.55], [9.45, -5.2], [7.75, -5.2]], .16, 4);
  if (want('display')) {
  S.prism([[7.75, -6.55], [9.45, -6.55], [9.45, -5.2], [7.75, -5.2]], 0, .07, { hatch: false });
  S.prism([[8.35, -6.25], [8.85, -6.25], [8.85, -5.95], [8.35, -5.95]], .07, 2.2, { hgap: 2.6 });
  const mon = { x0: 5.55, x1: 11.65, y0: 1.3, y1: 4.9, z: -5.3 };
  S.prism([[mon.x0, mon.z - .22], [mon.x1, mon.z - .22], [mon.x1, mon.z], [mon.x0, mon.z]], mon.y0, mon.y1, { side: `rgba(${INK},.94)`, top: '#2A3760', w: 1.1, hatch: false });
  const sA = P([mon.x0 + .1, mon.y1 - .1, mon.z]), sB = P([mon.x1 - .1, mon.y0 + .1, mon.z]);
  screenUI(c, K, sA[0], sA[1], sB[0] - sA[0], sB[1] - sA[1], o.blankDoc || false);
  c.save(); const sg = c.createLinearGradient(sA[0], sA[1], sB[0], sB[1]); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.45, 'rgba(255,255,255,.0)'); sg.addColorStop(.5, 'rgba(255,255,255,.18)'); sg.addColorStop(.62, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(sA[0], sA[1], sB[0] - sA[0], sB[1] - sA[1]); c.restore();
  }

  // the lamp at the back right: a weighted base, two arms, a shade lit from inside
  {
    const bx = 15.0, bz = -5.6, j1 = [15.4, 3.7, -6.05], j2 = [12.95, 4.55, -4.95], aim = [10.6, 0, -2.7];
    if (want('desk')) S.shadow(S.ring(bx, 0, bz, .72).map(([x, , z]) => [x, z]), .16, 4);
    if (want('lamp')) {
    S.cyl(bx, bz, .66, .6, 0, .22, { hgap: 2.8 });
    const a0 = P([bx, .22, bz]), a1 = P(j1), a2 = P(j2);
    const rod = (p, q, off) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = -dy / l * off, ny = dx / l * off; K.line(p[0] + nx, p[1] + ny, q[0] + nx, q[1] + ny, 1.3, .9); K.line(p[0] - nx, p[1] - ny, q[0] - nx, q[1] - ny, 1.3, .9); };
    rod(a0, a1, 2.6); rod(a1, a2, 2.6);
    for (let i = 2; i < 9; i++) { const t = i / 11, x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t; K.line(x - 5, y - 2, x + 5, y + 2, .6, .5); }
    [a0, a1, a2].forEach(p => { K.fill(Array.from({ length: 14 }, (_, i) => [p[0] + Math.cos(i / 14 * TAU) * 4.6, p[1] + Math.sin(i / 14 * TAU) * 4.6]), SHEET); K.poly(Array.from({ length: 14 }, (_, i) => [p[0] + Math.cos(i / 14 * TAU) * 4.6, p[1] + Math.sin(i / 14 * TAU) * 4.6]), 1, .85, true); K.dot(p[0], p[1], 1.2, .8); });
    const d = [aim[0] - j2[0], aim[1] - j2[1], aim[2] - j2[2]], dl = Math.hypot(...d), dn = d.map(v => v / dl);
    const e1 = (() => { const t = [dn[2], 0, -dn[0]], l = Math.hypot(...t); return t.map(v => v / l); })(), e2 = [dn[1] * e1[2] - dn[2] * e1[1], dn[2] * e1[0] - dn[0] * e1[2], dn[0] * e1[1] - dn[1] * e1[0]];
    const ringAt = (k, rad) => { const ctr = j2.map((v, i) => v + dn[i] * k); return Array.from({ length: 48 }, (_, i) => { const t = i / 48 * TAU; return P([0, 1, 2].map(j => ctr[j] + (Math.cos(t) * e1[j] + Math.sin(t) * e2[j]) * rad)); }); };
    const neck = ringAt(.05, .16), mouth = ringAt(1.0, .62), shell = hull(neck.concat(mouth));
    K.fill(shell, LIGHT);
    c.save(); K.clip(shell); const xs = shell.map(p => p[0]), ys = shell.map(p => p[1]); K.hatch([[Math.min(...xs) - 2, Math.min(...ys) - 2], [Math.max(...xs) + 2, Math.min(...ys) - 2], [Math.max(...xs) + 2, Math.max(...ys) + 2], [Math.min(...xs) - 2, Math.max(...ys) + 2]], .5, 3.3, .42, .3); c.restore();
    K.poly(shell, 1.2, .9, true);
    K.fill(mouth, '#FCEFD2'); K.poly(mouth, 1.1, .88, true);
    const mc = P(j2.map((v, i) => v + dn[i] * 1.0)); K.light(mc[0], mc[1], 26, 16, '255,248,226', .9);
    }
  }

  // coffee, on its saucer
  {
    const cx = 12.9, cz = -4.7;
    if (want('desk')) S.shadow(S.ring(cx, 0, cz, .86).map(([x, , z]) => [x, z]), .15, 4);
    if (want('coffee')) {
    S.cyl(cx, cz, .78, .84, 0, .07, { shade: false, topFill: SHEET });
    S.poly(S.ring(cx, .075, cz, .5), .5, .45, true);
    const hd = [[cx + .38, .82, cz], [cx + .7, .76, cz + .02], [cx + .74, .44, cz + .02], [cx + .36, .3, cz]].map(P);
    K.smooth(hd, 4.2, .88); const k0 = K.ink; K.ink = '248,245,238'; K.smooth(hd, 1.8, 1); K.ink = k0;
    S.cyl(cx, cz, .32, .43, .08, .98, { hgap: 3 });
    const cf = S.ring(cx, .9, cz, .37).map(P); K.fill(cf, 'rgba(150,104,66,.55)'); K.poly(cf, .5, .45, true);
    const st = P([cx, 1.1, cz]); K.smooth([[st[0] - 5, st[1]], [st[0] - 10, st[1] - 14], [st[0] - 3, st[1] - 28], [st[0] - 9, st[1] - 42]], .7, .22); K.smooth([[st[0] + 5, st[1] - 3], [st[0] + 1, st[1] - 17], [st[0] + 8, st[1] - 31], [st[0] + 3, st[1] - 46]], .7, .18);
    }
  }

  // keyboard and trackpad
  if (want('desk')) {
    const x0 = 7.0, x1 = 9.9, z0 = -3.6, z1 = -2.45, hgt = .16;
    S.shadow([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], .16, 4, [-.12, .1]);
    const kb = S.prism([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 0, hgt, { side: '#E6E2DA', dark: '#E6E2DA', top: '#ECE8E0', hgap: 2.6, w: 1 });
    const q = kb.top, rows = 5, cols = 14;
    for (let rI = 0; rI < rows; rI++) for (let cI = 0; cI < cols; cI++) {
      if (rI === 4 && cI > 4 && cI < 10) { if (cI !== 5) continue; }
      const span = rI === 4 && cI === 5 ? 5 : 1, u0 = .04 + cI * .92 / cols, u1 = u0 + .92 / cols * span - .012, v0 = .08 + rI * .86 / rows, v1 = v0 + .86 / rows - .03;
      const key = [S.on(q, u0, v0), S.on(q, u1, v0), S.on(q, u1, v1), S.on(q, u0, v1)].map(p => [p[0], hgt + .004, p[2]]);
      S.fill(key, '#FBFAF6'); S.poly(key, .4, .4, true);
    }
    const tx0 = 10.35, tx1 = 11.6, tz0 = -3.65, tz1 = -2.55;
    S.shadow([[tx0, tz0], [tx1, tz0], [tx1, tz1], [tx0, tz1]], .14, 3, [-.08, .08]);
    S.prism([[tx0, tz0], [tx1, tz0], [tx1, tz1], [tx0, tz1]], 0, .05, { side: '#E6E2DA', top: '#F1EEE7', hatch: false, w: .95 });
  }

  // reading glasses, standing folded, lenses toward us
  if (want('desk')) {
    const gx = 9.25, gz = -1.7, tilt = .32, ct = Math.cos(tilt), st2 = Math.sin(tilt);
    const G = (u, v) => [gx + u, .02 + v * ct, gz - v * st2];
    S.shadow(S.ring(gx - .15, 0, gz - .12, .78, .3).map(([x, , z]) => [x, z]), .14, 4, [-.2, .12]);
    const lens = uc => Array.from({ length: 40 }, (_, i) => { const t = i / 40 * TAU, cs = Math.cos(t), sn = Math.sin(t); return G(uc + .25 * Math.sign(cs) * Math.pow(Math.abs(cs), .62), .2 + .17 * Math.sign(sn) * Math.pow(Math.abs(sn), .62)); });
    const tl = [G(-.57, .31), [gx - .5, .27, gz - .5], [gx + .45, .24, gz - .62], [gx + .55, .14, gz - .5]], tr = [G(.57, .31), [gx + .5, .29, gz - .38], [gx - .42, .27, gz - .52], [gx - .52, .16, gz - .42]];
    S.smooth(tl, 1.5, .55); S.smooth(tr, 1.5, .5);
    [lens(-.31), lens(.31)].forEach(L => { S.fill(L, 'rgba(218,228,242,.5)'); });
    [lens(-.31), lens(.31)].forEach((L, i) => { const p = L.map(P); K.smooth(p, 2, .92, true); const h1 = P(G(-.31 + i * .62 - .12, .3)), h2 = P(G(-.31 + i * .62 - .02, .12)); K.ink = '255,255,255'; K.line(h1[0], h1[1], h2[0], h2[1], 1.4, .8); K.ink = INK; });
    S.smooth([G(-.07, .3), G(0, .35), G(.07, .3)], 1.8, .9);
    S.line(G(-.56, .31), G(-.6, .31), 2, .9); S.line(G(.56, .31), G(.6, .31), 2, .9);
  }

  // the stethoscope, coiled on the desk
  if (want('desk')) {
    const sx = 6.25, sz = -1.05, Y = .06, W2 = (lx, lz, y = Y) => [sx + lx, y, sz + lz];
    const tube = [W2(.72, .4), W2(.3, .64), W2(-.4, .62), W2(-.95, .22), W2(-1.02, -.34), W2(-.6, -.78), W2(.12, -.88), W2(.74, -.64), W2(.95, -.24)];
    const tp = tube.map(P);
    c.save(); c.filter = `blur(${3 * LWF}px)`; K.ink = SHADOW; K.smooth(tp.map(([x, y]) => [x - 4, y + 4]), 7, .2); c.restore(); K.ink = INK;
    const drawTube = (pts, w, inner = '247,244,237') => { K.smooth(pts, w, .9); const k0 = K.ink; K.ink = inner; K.smooth(pts, w * .5, 1); K.ink = k0; };
    drawTube(tp, 6.4);
    const bin = (pts) => { const pp = pts.map(P); K.smooth(pp, 3, .92); const k0 = K.ink; K.ink = '226,231,240'; K.smooth(pp, 1.1, 1); K.ink = k0; const e = pp[pp.length - 1]; K.fill(Array.from({ length: 14 }, (_, i) => [e[0] + Math.cos(i / 14 * TAU) * 4.2, e[1] + Math.sin(i / 14 * TAU) * 3.2]), `rgba(${INK},.95)`); };
    c.save(); c.filter = `blur(${2 * LWF}px)`; K.ink = SHADOW; K.smooth([W2(.95, -.24), W2(1.35, -.08), W2(1.62, .2), W2(1.66, .4)].map(P).map(([x, y]) => [x - 3, y + 3]), 4, .2); K.smooth([W2(.95, -.24), W2(1.38, -.4), W2(1.78, -.38), W2(1.98, -.22)].map(P).map(([x, y]) => [x - 3, y + 3]), 4, .2); c.restore(); K.ink = INK;
    bin([W2(.95, -.24, .08), W2(1.35, -.08, .07), W2(1.62, .2, .07), W2(1.66, .4, .08)]);
    bin([W2(.95, -.24, .08), W2(1.38, -.4, .07), W2(1.78, -.38, .07), W2(1.98, -.22, .08)]);
    const yj = P(W2(.95, -.24, .1)); K.fill(Array.from({ length: 12 }, (_, i) => [yj[0] + Math.cos(i / 12 * TAU) * 3.6, yj[1] + Math.sin(i / 12 * TAU) * 3]), `rgba(${INK},.9)`);
    // the chest piece: the diaphragm, its rim, the stem into the tube
    const cp = W2(1.02, .5, 0);
    S.shadow(S.ring(cp[0], 0, cp[2], .3).map(([x, , z]) => [x, z]), .18, 3, [-.12, .1]);
    S.cyl(cp[0], cp[2], .27, .27, 0, .11, { fill: '#E3E8F0', topFill: '#EEF2F7', hgap: 2.4 });
    S.poly(S.ring(cp[0], .112, cp[2], .2), .6, .55, true); S.poly(S.ring(cp[0], .112, cp[2], .1), .5, .45, true);
    const s0 = P(W2(.88, .44, .08)), s1 = P(W2(.72, .4, .07)); K.line(s0[0], s0[1], s1[0], s1[1], 4, .92); K.ink = '226,231,240'; K.line(s0[0], s0[1], s1[0], s1[1], 1.4, 1); K.ink = INK;
  }

  // the tablet with the reviewer's stylus notes, the stylus beside it
  if (want('desk')) {
    const cx = 11.3, cz = -1.3, yaw = -.2, hw = 1.1, hd = .78, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const at = (lx, lz) => [cx + lx * cs - lz * sn, cz + lx * sn + lz * cs];
    const base = [at(-hw, -hd), at(hw, -hd), at(hw, hd), at(-hw, hd)];
    {
      const [ax, az] = at(-.98, -hd - .07), [bx, bz] = at(.98, -hd - .07), p0 = P([ax, .05, az]), p1 = P([bx, .05, bz]);
      c.save(); c.filter = `blur(${2 * LWF}px)`; K.ink = SHADOW; K.line(p0[0] - 3, p0[1] + 3, p1[0] - 3, p1[1] + 3, 4.6, .2); c.restore(); K.ink = INK;
      K.line(p0[0], p0[1], p1[0], p1[1], 4.6, .92); K.ink = '247,244,237'; K.line(p0[0] + 4, p0[1], p1[0] - 1, p1[1], 2.2, 1); K.ink = INK;
      const dx = p0[0] - p1[0], dy = p0[1] - p1[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      K.fill([[p0[0] - uy * 2.3, p0[1] + ux * 2.3], [p0[0] + uy * 2.3, p0[1] - ux * 2.3], [p0[0] + ux * 8, p0[1] + uy * 8]], `rgba(${INK},.9)`);
    }
    S.shadow(base, .17, 5, [-.16, .12]);
    S.prism(base, 0, .07, { side: '#DDD8CE', dark: '#D6D1C6', top: `rgba(${INK},.95)`, hgap: 2.4, w: 1 });
    const scr = [at(-hw + .1, -hd + .1), at(hw - .1, -hd + .1), at(hw - .1, hd - .1), at(-hw + .1, hd - .1)].map(([x, z]) => P([x, .072, z]));
    K.fill(scr, '#FDFBF6');
    c.save(); K.clip(scr);
    const a = scr[0], b = scr[1], d = scr[3];
    c.transform((b[0] - a[0]) / 240, (b[1] - a[1]) / 240, (d[0] - a[0]) / 168, (d[1] - a[1]) / 168, a[0], a[1]);
    c.fillStyle = '#F3EEE3'; c.fillRect(0, 0, 240, 18);
    [[12, PEN], [24, '224,168,46'], [36, INK]].forEach(([x, col]) => { c.fillStyle = `rgba(${col},.85)`; c.beginPath(); c.arc(x, 9, 3.6, 0, TAU); c.fill(); });
    c.fillStyle = `rgba(${INK},.8)`; rr(c, 16, 32, 120, 7, 3.5); c.fill();
    for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(${INK},.3)`; rr(c, 16, 50 + i * 11, i % 4 === 3 ? 96 : 150, 3.4, 1.7); c.fill(); }
    c.fillStyle = 'rgba(224,168,46,.45)'; c.fillRect(14, 70, 112, 8);
    c.strokeStyle = `rgba(${PEN},.92)`; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.ellipse(64, 95, 52, 9, -.03, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(118, 95); c.quadraticCurveTo(150, 92, 170, 76); c.stroke();
    c.fillStyle = `rgba(${PEN},.95)`; c.font = '600 22px Caveat, cursive'; c.fillText('refs checked ✓', 150, 148);
    c.font = '600 18px Caveat, cursive'; c.fillText('ICH E3 ✓', 176, 70);
    c.restore();
    K.poly(scr, .5, .4, true);
  }
}

// the draft as the display shows it: an editor in miniature (section 6 shows it full size)
function screenUI(c, K, x, y, w, h, blankDoc = false) {
  if (blankDoc === 'bare') { c.save(); rr(c, x, y, w, h, 2); c.fillStyle = '#FDFBF6'; c.fill(); c.restore(); return; }
  c.save(); rr(c, x, y, w, h, 2); c.fillStyle = '#FDFBF6'; c.fill(); c.clip();
  const bar = h * .08;
  c.fillStyle = '#F3EEE3'; c.fillRect(x, y, w, bar); c.fillStyle = `rgba(${INK},.12)`; c.fillRect(x, y + bar, w, 1);
  [[PEN, .8], ['224,168,46', .8], [INK, .25]].forEach(([col, a], i) => { c.fillStyle = `rgba(${col},${a})`; c.beginPath(); c.arc(x + bar * .55 + i * bar * .45, y + bar / 2, bar * .14, 0, TAU); c.fill(); });
  K.bars(x + w * .36, y + bar / 2, w * .26, bar * .22, .55);
  [[INK, 'HS'], [PEN, '✦']].forEach(([col], i) => { c.fillStyle = i ? '#FFF6EC' : `rgba(${INK},.9)`; c.beginPath(); c.arc(x + w - bar * (.7 + i * .7), y + bar / 2, bar * .3, 0, TAU); c.fill(); if (i) { c.strokeStyle = `rgba(${PEN},.6)`; c.lineWidth = .8; c.stroke(); } });
  const dx = x + w * .07, dw = w * .55, lh = h * .052; let ly = y + bar + h * .1;
  if (blankDoc) { drawMargin(); c.restore(); return; }
  c.fillStyle = `rgba(${INK},.85)`; rr(c, dx, ly - h * .02, dw * .48, h * .04, 1.5); c.fill(); ly += lh * 1.6;
  for (let i = 0; i < 4; i++) { if (i === 1) { c.fillStyle = 'rgba(224,168,46,.45)'; c.fillRect(dx - 2, ly - lh * .4, dw * .62, lh * .8); } K.bars(dx, ly, dw * (i === 3 ? .6 : .98), h * .014, .38); ly += lh; }
  c.fillStyle = `rgba(${PEN},.85)`; c.fillRect(dx + dw * .32, ly - lh * 3 - h * .007, dw * .16, h * .014);
  c.fillStyle = `rgba(${PEN},.9)`; c.fillRect(dx + dw * .52, ly - lh * 3 + h * .012, dw * .2, 1.2);
  // a forest plot
  const fy = ly + lh * .4, fh = h * .2, fx = dx + dw * .05, fw = dw * .6;
  c.strokeStyle = `rgba(${INK},.4)`; c.lineWidth = 1; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(fx + fw * .55, fy); c.lineTo(fx + fw * .55, fy + fh); c.stroke(); c.setLineDash([]);
  [[.25, .62, .43], [.36, .5, .44], [.18, .58, .38], [.42, .55, .5]].forEach(([a, b, m], i) => { const yy = fy + fh * (.12 + i * .2); c.strokeStyle = `rgba(${INK},.8)`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx + fw * a, yy); c.lineTo(fx + fw * b, yy); c.stroke(); c.fillStyle = `rgba(${INK},.9)`; c.fillRect(fx + fw * m - 2, yy - 2, 4, 4); });
  const dy2 = fy + fh * .93; c.fillStyle = 'rgba(224,122,31,.9)'; c.beginPath(); c.moveTo(fx + fw * .3, dy2); c.lineTo(fx + fw * .4, dy2 - 3); c.lineTo(fx + fw * .5, dy2); c.lineTo(fx + fw * .4, dy2 + 3); c.closePath(); c.fill();
  ly = fy + fh + lh * .9;
  c.fillStyle = `rgba(${PEN},.5)`; c.fillRect(dx, ly - lh * .45, 1.2, lh * .9); K.bars(dx + 5, ly, dw * .7, h * .014, .55, PEN);
  c.fillStyle = `rgba(${INK},.9)`; c.fillRect(dx + dw * .74, ly - lh * .4, 1.2, lh * .8);
  // the margin: comment cards
  drawMargin();
  c.restore();
  function drawMargin() {
  const sx = x + w * .68, sw = w * .27; let cy = y + bar + h * .08;
  [[INK, 0], [PEN, 1], [INK, 0]].forEach(([col, ai], i) => {
    const ch = h * .17; rr(c, sx, cy, sw, ch, 3); c.fillStyle = ai ? '#FFF8EF' : '#FFFFFF'; c.fill(); c.strokeStyle = ai ? 'rgba(180,80,15,.45)' : `rgba(${INK},.18)`; c.lineWidth = 1; c.stroke();
    c.fillStyle = `rgba(${col},${ai ? .85 : .8})`; c.beginPath(); c.arc(sx + ch * .26, cy + ch * .3, ch * .11, 0, TAU); c.fill();
    K.bars(sx + ch * .48, cy + ch * .3, sw * .38, h * .014, .6, col); K.bars(sx + ch * .2, cy + ch * .62, sw * .72, h * .012, .3);
    cy += ch + h * .045;
  });
  c.fillStyle = `rgba(${INK},.1)`; c.fillRect(x, y + h - bar * .8, w, 1);
  c.fillStyle = 'rgba(224,122,31,.85)'; c.beginPath(); c.arc(x + w * .05, y + h - bar * .4, 2.2, 0, TAU); c.fill();
  K.bars(x + w * .08, y + h - bar * .4, w * .22, h * .012, .4);
  }
}


// the display's screen, its document area (where the film's page stands) and the doorway, in the
// drawing's units (1280 by 800, y down)
export function studyGeo() {
  const d = z => STUDY.ez - z, P = ([x, y, z]) => [STUDY.cx + STUDY.F * (x - STUDY.ex) / d(z), STUDY.cy - STUDY.F * (y - STUDY.ey) / d(z)];
  const a = P([5.65, 4.8, -5.3]), b = P([11.55, 1.4, -5.3]), w = b[0] - a[0], h = b[1] - a[1], bar = h * .08;
  const wa = P([WIN.x0, WIN.y1, -6.99]), wb = P([WIN.x1, WIN.y0, -6.99]);
  return {
    screen: [a[0], a[1], b[0], b[1]],
    doc: [a[0] + w * .05, a[1] + bar + h * .06, a[0] + w * .64, b[1] - bar * 1.1],
    door: P([-6, 1.5, -7]),
    // the window's glass, as much of it as the drawing holds
    window: [wa[0], Math.max(0, wa[1]), Math.min(1280, wb[0]), wb[1]],
    size: [1280, 800],
  };
}

// the study, drawn into a canvas of any size (its own pixels), scaled from the 1280 by 800 drawing:
// warm 0 to 1 for the late afternoon; blankDoc: 'bare' for a plain lit display (the film lays its
// editor over it), true for the editor without its document, false for all of it; sky: the window's
const weightFor = width => Math.max(1, Math.sqrt(1280 / (width / 1.25)) * .9);
export function drawStudy(canvas, { warm = 0, blankDoc = 'bare', sky = 'day', seed = 11 } = {}) {
  const c = canvas.getContext('2d');
  c.setTransform(canvas.width / 1280, 0, 0, canvas.height / 800, 0, 0);
  LWF = weightFor(canvas.width);
  study(c, 1280, 800, seed, { warm, blankDoc, sky });
  c.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- the room in layers, for a camera that moves through it (film.js, renderer.js) ----------
// Each layer is drawn from the one eye over the extended drawing (STUDY_X, EXT): rect, the part of it
// the layer needs ([x, y, w, h], y down); where it stands: a plane facing the eye at depth z, or the
// desk (its top and its front edge). The film's renderer lays each drawing back onto its place by
// projecting from the eye, so from the eye the room is exactly the drawing, and from anywhere else it
// stands in depth. Planes go back to front in this order.
const toX = ([x, y, z]) => { const d = STUDY_X.ez - z; return [STUDY_X.cx + STUDY_X.F * (x - STUDY_X.ex) / d, STUDY_X.cy - STUDY_X.F * (y - STUDY_X.ey) / d]; };
function bbox(x0, x1, y0, y1, z0, z1, m = 8) {
  const q = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) q.push(toX([x, y, z]));
  const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
  const a = [Math.max(0, Math.min(...xs) - m), Math.max(0, Math.min(...ys) - m)];
  return [a[0], a[1], Math.min(EXT[0], Math.max(...xs) + m) - a[0], Math.min(EXT[1], Math.max(...ys) + m) - a[1]];
}
export function studyLayers() {
  const jamb = toX([-2, 0, -7])[0], deskBack = toX([0, 0, -7])[1];
  return [
    { name: 'beyond', z: -20, rect: [0, 0, jamb + 70, EXT[1]] },
    { name: 'wall', z: -7, rect: [0, 0, EXT[0], EXT[1]] },
    { name: 'desk', desk: true, rect: [0, deskBack - 12, EXT[0], EXT[1] - deskBack + 12] },
    { name: 'plant', z: -6.35, rect: bbox(3.85, 6.05, 0, 3.2, -6.8, -5.9) },
    { name: 'vols', z: -5.45, rect: bbox(1.6, 4.0, 0, 2.85, -7, -5.3) },
    { name: 'display', z: -5.3, rect: bbox(5.45, 11.75, 0, 5.0, -6.6, -5.15) },
    { name: 'lamp', z: -5.05, rect: bbox(11.75, 15.8, 0, 4.95, -6.2, -3.9) },
    { name: 'coffee', z: -4.7, rect: bbox(11.85, 13.85, 0, 2.05, -5.6, -3.8) },
  ];
}
// the view out of the window, for a camera that goes out through it: not a layer of the drawing but a
// wide backdrop well behind the wall (OUTSIDE: its plane, in the room's units), drawn on its own
// (drawOutside): the sky, and a town of roofs and trees along its foot, the same skyline in every
// variant; at dusk the town dark with its windows lit; 'duskTown' and 'sunsetTown' keep the town alone,
// the sky left open for the night beyond
export const OUTSIDE = { z: -48, x0: -22, x1: 52, y0: -34, y1: 40 };
const OUT_SKIES = {
  day: [[0, '#D3DEEE'], [.62, '#E6ECF3'], [1, '#F5F0E6']],
  dusk: [[0, '#08122E'], [.45, '#18244C'], [.8, '#34395F'], [1, '#4E4565']],
  sunset: [[0, '#0A1534'], [.6, '#1C2148'], [.85, '#3A2C4E'], [.95, '#8A5450'], [1, '#C98A58']],
};
export function drawOutside(variant, w = 2048, h = 2048) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d'), O = OUTSIDE, s = w / (O.x1 - O.x0);
  const X = x => (x - O.x0) * s, Y = y => (O.y1 - y) * s * h / w;
  const sky = variant.startsWith('dusk') ? 'dusk' : variant.startsWith('sunset') ? 'sunset' : 'day', alone = variant.endsWith('Town'), day = sky === 'day';
  const BASE = -14;
  if (!alone) {
    const g = c.createLinearGradient(0, 0, 0, Y(BASE + 5));
    OUT_SKIES[sky].forEach(([at, col]) => g.addColorStop(at, col));
    c.fillStyle = g; c.fillRect(0, 0, w, Y(BASE) + 1);   // down behind the lowest roofs and the gaps between them
    if (sky === 'dusk') { const r = rng(91); for (let i = 0; i < 70; i++) { const x = O.x0 + r() * (O.x1 - O.x0), y = BASE + 8 + r() * 44; c.fillStyle = `rgba(236,240,252,${.25 + r() * .55})`; c.beginPath(); c.arc(X(x), Y(y), (.6 + r() * 1.2) * s / 28, 0, TAU); c.fill(); } }
  }
  // the skyline: houses with gabled or flat roofs and chimneys, trees between, seeded so it is the same
  // in every variant
  const r = rng(77), top = [], trees = [], lit = [];
  for (let x = O.x0; x < O.x1;) {
    const bw = 1.6 + r() * 3.2, bh = 2 + r() * 4, gable = r() < .55, gap = r() < .25 ? .4 + r() * 1.4 : 0;
    top.push([x, BASE + bh]);
    if (gable) top.push([x + bw / 2, BASE + bh + .8 + r() * 1.2]);
    else if (r() < .5) { const cx = x + bw * (.2 + r() * .5); top.push([cx, BASE + bh], [cx, BASE + bh + .9], [cx + .4, BASE + bh + .9], [cx + .4, BASE + bh]); }
    top.push([x + bw, BASE + bh]);
    for (let k = 0; k < 3; k++) if (r() < .45) lit.push([x + .3 + r() * (bw - .8), BASE + .6 + r() * (bh - 1.4)]);
    if (gap) { if (r() < .7) trees.push([x + bw + gap / 2, BASE + 1.6 + r() * 2.4, .9 + r() * 1.1]); top.push([x + bw, BASE], [x + bw + gap, BASE]); }
    x += bw + gap;
  }
  const outline = [[O.x0, O.y0], ...top, [O.x1, BASE], [O.x1, O.y0]];
  const townFill = day ? '#F3F0E8' : sky === 'dusk' ? '#0B1230' : '#2B2036';
  c.fillStyle = townFill;
  c.beginPath(); outline.forEach(([x, y], i) => i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))); c.closePath(); c.fill();
  trees.forEach(([x, y, rad]) => { c.beginPath(); c.ellipse(X(x), Y(y), rad * s, rad * .8 * s, 0, 0, TAU); c.fill(); c.fillRect(X(x) - .08 * s, Y(y), .16 * s, Y(BASE) - Y(y)); });
  if (day) {
    // by day in ink, as the drawing has the town through its window
    c.strokeStyle = 'rgba(86,104,146,.45)'; c.lineWidth = Math.max(1, s * .05); c.lineJoin = 'round';
    c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))); c.stroke();
    trees.forEach(([x, y, rad]) => { c.beginPath(); c.ellipse(X(x), Y(y), rad * s, rad * .8 * s, 0, 0, TAU); c.stroke(); });
  } else lit.forEach(([x, y]) => { c.fillStyle = sky === 'dusk' ? 'rgba(240,196,120,.9)' : 'rgba(240,196,120,.6)'; c.fillRect(X(x), Y(y), .32 * s, .42 * s); });
  return canvas;
}

// the desk's top and front, the display's screen (where the film's editor stands), the window's glass
export const DESK = { x0: 1, x1: 30, z0: 0, z1: -7, front: -.5 };
export const SCREEN3 = [[5.65, 4.8, -5.3], [11.55, 4.8, -5.3], [11.55, 1.4, -5.3], [5.65, 1.4, -5.3]];
export { WIN };
// one layer drawn at scale (canvas pixels per unit of the drawing), sky for the view out: { canvas, rect }
export function drawStudyLayer(name, scale, { sky = 'day', seed = 11 } = {}) {
  const L = studyLayers().find(l => l.name === name), [rx, ry, rw, rh] = L.rect;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.ceil(rw * scale)); canvas.height = Math.max(2, Math.ceil(rh * scale));
  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, -rx * scale, -ry * scale);
  LWF = weightFor(1280 * scale);
  study(c, EXT[0], EXT[1], seed, { layer: name, cam: STUDY_X, blankDoc: 'bare', sky });
  c.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, rect: L.rect };
}

// the window alone under another sky, drawn at the scale of a study drawn `width` pixels wide, for the
// film to mix in over the window: { canvas, rect } (rect: the part of the drawing it covers, [x, y, w,
// h] in the drawing's units). The whole room is drawn into it, so whatever stands in front of the
// window (the lamp) is there too, exactly as in the study
export function drawWindowPatch(width, sky, { blankDoc = 'bare', seed = 11 } = {}) {
  const g = studyGeo().window, m = 24, s = width / 1280;
  const rect = [Math.max(0, g[0] - m), 0, Math.min(1280, g[2] + m) - Math.max(0, g[0] - m), Math.min(800, g[3] + m)];
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(rect[2] * s); canvas.height = Math.ceil(rect[3] * s);
  const c = canvas.getContext('2d');
  c.setTransform(s, 0, 0, s, -rect[0] * s, -rect[1] * s);
  LWF = weightFor(width);
  study(c, 1280, 800, seed, { blankDoc, sky });
  c.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, rect };
}

export { kit, rr };
