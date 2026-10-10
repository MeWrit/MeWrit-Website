/* The reading room, for scientific publications: a long hall that runs away to the left of the page.
   Its walls are lined with bookshelves up to a gallery and its rail, carried on columns with hatched
   shading; above the gallery on the left a row of tall round-arched windows, mullioned and
   transomed, lets in the moonlight, which falls in shafts across the hall and lays the windows' panes
   on the floor. Two long reading tables carry rows of green-shaded lamps, each with its warm pool;
   ribs of a vault pass overhead. Navy, moonlight and warm lamp pools. */
import { random, rgb, lighting, strokes, solids, glows, shafts, points, assemble, archOutline, norm, basis, scale, add } from './engrave.js';

export function reading(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(303);
  const grade = { top: '#0A1840', bottom: '#030817', fog: '#0B1734', fogDensity: .015, light: '#DCE6FF', glow: ['#1C3472', .45] };
  const stage = { anchor: [0, 0, 0], dir: [.08, .05, 1], fov: 50, size: [11, 13.4, 6] };

  // the hall in its own frame: u across it (from the windows toward the right), v up, w down it
  const ANG = 26 * Math.PI / 180, Wd = [-Math.sin(ANG), 0, -Math.cos(ANG)], Ud = [Math.cos(ANG), 0, -Math.sin(ANG)];
  const at = (u, v, w) => [u * Ud[0] + w * Wd[0], v, u * Ud[2] + w * Wd[2]];
  const toRoom = (x, z) => [x * Ud[0] + z * Ud[2], x * Wd[0] + z * Wd[2]];   // world x, z to u, w
  const FLOOR = -12, WU = -27, WALL = 2.2, WW = 5.6, WR = WW / 2, SILL = 6.5, SPRING = 16.5;
  const WIN = Array.from({ length: hi ? 9 : 7 }, (_, i) => 4 + i * 9);   // the windows' centres down the hall
  const TRANS = [9.7, 13.1], GAL = 3, GDEEP = 2.6, COLR = .7;
  const TT = -8.2, TABLES = [-10, 10], TW = [-4, 54], LAMPW = [0, 7.5, 15, 22.5, 30, 37.5, 45, 52.5];
  const BACK = 72, RIGHTU = 27, CORNICE = 22.5;
  // the moon's light, in the hall's frame: in through the windows, steeply down, a little down the hall
  const MU = 1, MV = -2.1, MW = .35, ML = Math.hypot(MU, MV, MW);
  const moonDir = norm(at(MU / ML, MV / ML, MW / ML));

  // the moon reaches a point if, followed back toward it, its line leaves through a window's glass
  // (not the mullions or the transoms)
  const pane = (v, w) => {
    for (const wc of WIN) {
      const dw = w - wc;
      if (Math.abs(dw) > WR) continue;
      if (v < SILL || v > SPRING + WR) return 0;
      if (v > SPRING && dw * dw + (v - SPRING) * (v - SPRING) > WR * WR) return 0;
      if (Math.abs(Math.abs(dw) - WW / 6) < .14) return 0;
      if (TRANS.some(t => Math.abs(v - t) < .12)) return 0;
      return 1;
    }
    return 0;
  };
  const moonMask = (x, y, z) => {
    const [u, w] = toRoom(x, z);
    if (u < WU - .01) return 0;
    const s = (u - WU) / MU;
    return pane(y - MV * s, w - MW * s);
  };
  const lamps = [];
  TABLES.forEach(tu => LAMPW.forEach(w => lamps.push({ p: at(tu, TT + 1.95, w), k: 1.4, range: 3.4, tight: true })));
  const light = lighting({ ink: rgb('#B4C6F4'), ambient: .22, moon: { dir: moonDir, col: '#DCE6FF', k: 1, mask: moonMask }, lamps });
  const L = strokes(light, R), O = solids(), G = glows(), S = shafts(), M = points();
  const up = [0, 1, 0], inward = at(1, 0, 0), ahead = at(0, 0, -1), dW = at(0, 0, 1);

  // ---------- the window wall ----------
  const outline = archOutline(WW, SPRING - SILL, { k: 24 });
  const wallPt = (wc, x, y, depth = 0) => at(WU - depth, SILL + y, wc + x);
  WIN.forEach((wc, wi) => {
    const far = wi > 5;
    // the opening, its reveal through the wall, the glass hatched in moonlight
    L.poly(outline.map(([x, y]) => wallPt(wc, x, y)), .5, inward);
    L.poly(outline.map(([x, y]) => wallPt(wc, x, y, WALL)), .26, inward);
    for (const [x, y] of [[WR, 0], [-WR, 0], [WR, SPRING - SILL], [-WR, SPRING - SILL]]) L.seg(wallPt(wc, x, y), wallPt(wc, x, y, WALL), .26);
    L.paint = rgb('#C9D8FF', far ? .38 : .5);
    L.hatch(wallPt(wc, -WR, 0, WALL - .05), scale(dW, WW), [0, SPRING - SILL + WR, 0], { angle: .95, gap: far ? .5 : .28, w: .3, shape: outline.map(([x, y]) => [x + WR, y]), jitter: .2, trim: .2 });
    L.paint = null;
    // mullions and transoms, and a ring of tracery in the arch's head
    for (const x of [-WW / 6, WW / 6]) { const top = SPRING - SILL + Math.sqrt(WR * WR - x * x) - .2; L.seg(wallPt(wc, x - .1, 0, .7), wallPt(wc, x - .1, top, .7), .42); L.seg(wallPt(wc, x + .1, 0, .7), wallPt(wc, x + .1, top, .7), .26); }
    for (const y of TRANS) L.seg(wallPt(wc, -WR, y - SILL, .7), wallPt(wc, WR, y - SILL, .7), .4);
    L.seg(wallPt(wc, -WR, SPRING - SILL, .7), wallPt(wc, WR, SPRING - SILL, .7), .32);
    L.ring(wallPt(wc, 0, SPRING - SILL + WR * .45, .7), WR * .34, dW, up, .36, 18);
    // the sill, and the light standing in the window's embrasure
    L.seg(wallPt(wc, -WR - .4, -.25), wallPt(wc, WR + .4, -.25), .42, up);
    G.flat(wallPt(wc, 0, 7.5, .3), scale(dW, 3.3), [0, 10, 0], rgb('#C9D8FF', .06), { sharp: 1.6 });
  });
  // the wall between the windows above the gallery, in shadow: faint strokes; the cornice
  WIN.slice(0, -1).forEach(wc => L.hatch(at(WU, GAL + 3.5, wc + WR + .3), scale(dW, 9 - WW - .6), [0, CORNICE - GAL - 3.5, 0], { angle: Math.PI / 2, gap: hi ? .55 : 1, w: .07, n: inward, step: 5, trim: 1 }));
  L.seg(at(WU, CORNICE, WIN[0] - 8), at(WU, CORNICE, BACK), .42, inward, 3); L.seg(at(WU, CORNICE + .6, WIN[0] - 8), at(WU, CORNICE + .6, BACK), .26, inward, 3);

  // ---------- the bookshelves to the gallery, the gallery and its rail, the columns under it ----------
  const books = (u, v0, v1, w0, w1, n, k = 1) => {
    let w = w0 + .1;
    while (w < w1 - .3) {
      if (R() < .05) { w += .4 + R() * .6; continue; }
      const wd = .22 + R() * .24, h = (v1 - v0) * (.6 + R() * .32);
      if (R() < k) L.seg(at(u, v0, w), at(u, v0 + h, w), .2, n);
      w += wd;
    }
  };
  for (let v = FLOOR + .6; v < GAL - 1; v += 2.6) {
    L.seg(at(WU, v, WIN[0] - 8), at(WU, v, BACK), .3, inward, 3);
    books(WU + .02, v, v + 2.4, WIN[0] - 8, BACK, inward, hi ? 1 : .5);
  }
  for (let w = WIN[0] - 8; w < BACK; w += 4.5) L.seg(at(WU + .02, FLOOR, w), at(WU + .02, GAL, w), .32, inward, 3);
  // the gallery: its floor's edge, the balustrade's rail and balusters, a post at each column
  const GU = WU + GDEEP;
  for (const [v, wt] of [[GAL, .46], [GAL - .55, .3]]) L.seg(at(GU, v, WIN[0] - 8), at(GU, v, BACK), wt, at(1, 0, 0), 3);
  for (const [v, wt] of [[GAL + 3.1, .44], [GAL + 2.8, .26]]) L.seg(at(GU, v, WIN[0] - 8), at(GU, v, BACK), wt, at(1, 0, 0), 3);
  for (let w = WIN[0] - 8; w < BACK; w += hi ? .75 : 1.5) L.seg(at(GU, GAL, w), at(GU, GAL + 2.8, w), .16);
  O.box(at(WU + GDEEP / 2, GAL - .3, (WIN[0] - 8 + BACK) / 2), [GDEEP, .55, BACK - WIN[0] + 8], ANG);
  const cols = WIN.slice(0, -1).map(w => w + 4.5);
  cols.forEach(w => {
    const b = [...at(GU - .4, FLOOR, w)];
    L.column(b, GAL - .55 - FLOOR, COLR, COLR * .92, { count: hi ? 20 : 12, w: .32, rings: 2, ringW: .34, step: 4 });
    O.column(b, GAL - .55 - FLOOR, COLR - .03, COLR * .92 - .03);
    L.seg(at(GU - .4, GAL - .55, w - 1.1), at(GU - .4, GAL + 3.1, w - 1.1), .3); L.seg(at(GU - .4, GAL - .55, w + 1.1), at(GU - .4, GAL + 3.1, w + 1.1), .3);
  });

  // ---------- the vault: ribs across the hall, high in the dark ----------
  cols.forEach(w => L.curve(t => { const a = t * Math.PI; return at(WU + (RIGHTU - WU) * (1 - Math.cos(a)) / 2, CORNICE + .6 + Math.sin(a) * 8, w); }, 28, .3, [0, -1, 0]));
  L.seg(at(0, CORNICE + 8.6, WIN[0]), at(0, CORNICE + 8.6, BACK), .26, [0, -1, 0], 4);

  // ---------- the floor: large flags, and the windows' panes laid on them by the moon ----------
  for (let w = -10; w < BACK; w += 3.2) L.seg(at(WU, FLOOR, w), at(RIGHTU, FLOOR, w), .13, up, 4);
  for (let u = WU; u <= RIGHTU; u += 3.2) L.seg(at(u, FLOOR, -10), at(u, FLOOR, BACK), .13, up, 4);
  // each pane's light is the pane carried along the moon onto the floor: a parallelogram, hatched
  const toFloor = (v, w) => { const s = (FLOOR - v) / MV; return [WU + MU * s, w + MW * s]; };
  L.paint = rgb('#DCE6FF', .85);
  WIN.forEach((wc, wi) => {
    if (wi > (hi ? 6 : 4)) return;
    const lights = [[-WR, -WW / 6 - .14], [-WW / 6 + .14, WW / 6 - .14], [WW / 6 + .14, WR]];
    const rows = [[SILL, TRANS[0] - .12], [TRANS[0] + .12, TRANS[1] - .12], [TRANS[1] + .12, SPRING]];
    for (const [xa, xb] of lights) for (const [ya, yb] of rows) {
      const c0 = toFloor(ya, wc + xa), c1 = toFloor(ya, wc + xb), c3 = toFloor(yb, wc + xa), c2 = [c1[0] + c3[0] - c0[0], c1[1] + c3[1] - c0[1]];
      const us = [c0[0], c1[0], c2[0], c3[0]], ws = [c0[1], c1[1], c2[1], c3[1]];
      const u0 = Math.min(...us), w0 = Math.min(...ws), Wu = Math.max(...us) - u0, Hw = Math.max(...ws) - w0;
      const shape = [c0, c1, c2, c3].map(([u, w]) => [u - u0, w - w0]);
      let area = 0; for (let i = 0; i < 4; i++) { const a = shape[i], b = shape[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) shape.reverse();
      L.hatch(at(u0, FLOOR + .02, w0), at(Wu, 0, 0), at(0, 0, Hw), { angle: Math.atan2(c3[1] - c0[1], c3[0] - c0[0]), gap: .3, w: wi < 3 ? .3 : .22, shape, jitter: .15, trim: .1 });
    }
  });
  L.paint = null;

  // ---------- the tables and their lamps ----------
  TABLES.forEach(tu => {
    const wc = (TW[0] + TW[1]) / 2, len = TW[1] - TW[0];
    L.box(at(tu, TT - .2, wc), [6, .4, len], .44, 3, ANG);
    O.box(at(tu, TT - .2, wc), [5.95, .38, len - .05], ANG);
    for (const w of [TW[0] + .5, wc, TW[1] - .5]) for (const u of [tu - 2.5, tu + 2.5]) { L.seg(at(u - .2, TT - .4, w), at(u - .2, FLOOR, w), .3, null, 2); L.seg(at(u + .2, TT - .4, w), at(u + .2, FLOOR, w), .2, null, 2); }
    // the top: a few long strokes along the grain, lit where the lamps pool
    for (let u = tu - 2.6; u < tu + 2.8; u += hi ? .5 : 1) L.seg(at(u, TT + .01, TW[0] + .2), at(u, TT + .01, TW[1] - .2), .14, up, 1.2);
    LAMPW.forEach(w => {
      // a banker's lamp: foot, stem, and the green glass shade over the bulb
      L.ring(at(tu, TT + .05, w), .55, Ud, Wd, .36, 16);
      L.seg(at(tu, TT, w), at(tu, TT + 1.75, w), .36);
      L.tint = rgb('#7FCFB2');
      for (const e of [-.95, .95]) L.curve(t => add(at(tu, TT + 1.85, w + e), add(scale(Ud, Math.cos(t * Math.PI) * .62), [0, Math.sin(t * Math.PI) * .62, 0])), 10, .42);
      for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI, o = add(scale(Ud, Math.cos(a) * .62), [0, Math.sin(a) * .62, 0]); L.seg(add(at(tu, TT + 1.85, w + .95), o), add(at(tu, TT + 1.85, w - .95), o), i % 3 === 0 ? .4 : .24); }
      L.tint = null;
      O.box(at(tu, TT + 2.15, w), [1.1, .6, 1.8], ANG);
      G.bill(at(tu, TT + 1.72, w), [.7, .45], [0, 0, 0], { lamp: 1.8, sharp: 4 });
      G.flat(at(tu, TT + .03, w), scale(Ud, 2.7), scale(dW, 2.4), [0, 0, 0], { lamp: .22, sharp: 2 });
      G.bill(at(tu, TT + 1.4, w), [3.2, 2.6], [0, 0, 0], { lamp: .05, sharp: 1.8 });
    });
  });

  // ---------- the far wall: shelves to a gallery, its rail, more shelves above; the right wall ----------
  const shelfRow = (v0, v1, u0, u1, wAt, n) => {
    L.seg(at(u0, v0, wAt), at(u1, v0, wAt), .32, n, 4);
    let u = u0 + .1;
    while (u < u1 - .3) {
      const wd = .2 + R() * .22, h = (v1 - v0) * (.62 + R() * .3);
      if (R() < .06) { u += .4 + R() * .6; continue; }
      L.seg(at(u, v0, wAt - .02), at(u, v0 + h, wAt - .02), .2);
      u += wd;
    }
  };
  for (let v = FLOOR + .6; v < GAL - 1; v += 2.5) shelfRow(v, v + 2.3, WU + 1, RIGHTU - 1, BACK, ahead);
  for (const [v, wt] of [[GAL, .44], [GAL - .6, .28], [GAL + 3.4, .4]]) L.seg(at(WU, v, BACK - 1.5), at(RIGHTU, v, BACK - 1.5), wt, ahead, 4);
  for (let u = WU + .5; u < RIGHTU; u += hi ? .7 : 1.4) L.seg(at(u, GAL, BACK - 1.5), at(u, GAL + 3.4, BACK - 1.5), .18);
  for (let v = GAL + 1; v < 24; v += 2.5) shelfRow(v, v + 2.3, WU + 1, RIGHTU - 1, BACK, ahead);
  for (let u = WU + 1; u <= RIGHTU; u += 6.5) L.seg(at(u, FLOOR, BACK - .05), at(u, 24, BACK - .05), .32, ahead, 4);
  // the right wall: tall bookcases, faint, seen from across the hall
  for (let w = -6; w < BACK; w += 8) {
    L.seg(at(RIGHTU, FLOOR, w), at(RIGHTU, 22, w), .3, at(-1, 0, 0), 4);
    for (let v = FLOOR + 2.5; v < 22; v += 2.6) L.seg(at(RIGHTU, v, w), at(RIGHTU, v, w + 8), .2, at(-1, 0, 0), 4);
  }

  // ---------- the moonlight in the air: shafts through the windows, dust turning in them ----------
  const vols = [];
  WIN.slice(0, hi ? 7 : 5).forEach((wc, i) => {
    const s = (FLOOR - (SILL + 7)) / MV, a = at(WU - .5, SILL + 7, wc), b = at(WU + MU * s, FLOOR, wc + MW * s);
    S.add(a, b, WR * .95, WR * 1.2, rgb('#A9BEF5', i < 4 ? .09 : .06));
    G.flat(add(b, [0, .03, 0]), scale(Ud, 5.5), scale(dW, 3.4), rgb('#C9D8FF', .05), { sharp: 1.4, clear: .7 });
    vols.push({ a, b, ra: WR * .9, rb: WR * 1.1, col: rgb('#DCE6FF'), k: .36 });
  });
  vols.forEach(v => {
    const d = [v.b[0] - v.a[0], v.b[1] - v.a[1], v.b[2] - v.a[2]], [u, w] = basis(norm(d));
    for (let i = 0, n = Math.round(450 * q); i < n; i++) {
      const t = R(), r = (v.ra + (v.rb - v.ra) * t) * Math.sqrt(R()), a = R() * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
      M.add([v.a[0] + d[0] * t + u[0] * c + w[0] * s, v.a[1] + d[1] * t + u[1] * c + w[1] * s, v.a[2] + d[2] * t + u[2] * c + w[2] * s], { size: .07 + R() * .06, col: [.003, .004, .008], bright: .4 + R() * .6, drift: [.5 + R() * .8, .3 + R() * .5, .5 + R() * .8], rate: .02 + R() * .05, phase: R() });
    }
  });
  // haze: the high air of the hall, and a bank of it toward the far end
  G.flat(at(-4, 8, 34), scale(Ud, 26), [0, 20, 0], rgb('#1D3268', .045), { sharp: 1.2, clear: .25 });
  G.flat(at(0, 4, BACK - 6), scale(Ud, 30), [0, 18, 0], rgb('#1D3268', .06), { sharp: 1, clear: .2 });

  return assemble(THREE, { id: 'reading', grade, stage, parts: { solids: O, glows: G, lines: [L], shafts: S, points: M }, volumes: vols.slice(0, 8), lamp: '#F2B866', flicker: .015, t0 });
}
