/* The workshop room, for training (the Academy): a training room by day, seen from high at the
   back. Rows of two-seat desks with their chairs face the front wall, where a whiteboard carries a
   few ruled lines and a small flow diagram, a clock hangs above it and a flip chart stands on its
   easel beside it; a projector waits on its trolley in the aisle; tall windows along the left wall,
   their blinds rolled up, let the morning in, laying the desks' shadows across the boards; a plant
   stands by the windows. The page stands before the wall's plain right part, where a projection
   would fall, and copies itself onto every desk as handouts: the desk tops are clear, flat and lit,
   and their places are given in `handouts` (beyond the contract, for the film: each
   { at: [x, y, z], yaw }, a spot on a desk top in front of a chair, the sheet lying flat, its top
   toward the board). Drawn to be shown by day, as ink on paper: form from contours, open hatching
   only on the faces turned from the windows and in the desks' shadows, the lit faces left nearly
   empty. By night the same engraving, the windows holding the evening and the projector's beam
   reaching the wall. */
import { random, rgb, lighting, strokes, solids, glows, shafts, points, assemble, norm, add, sub, scale, basis, smooth } from './engrave.js';

export function workshop(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(606);
  const grade = { top: '#0C1A3E', bottom: '#040A1B', fog: '#0D1B3B', fogDensity: .015, light: '#F0DDB8', glow: ['#25355F', .4] };
  const stage = { anchor: [0, 0, 0], dir: [.3, .5, 1], fov: 44, size: [11, 13.4, 6] };

  // the room: x across (the windows on the left), y up, z from the front wall back toward the eye;
  // the walls run up out of the picture, so no ceiling is drawn
  const XL = -24, XR = 16, FW = -4, FL = -10.5, BACKZ = 30, TOPY = 14;
  const DT = FL + 4.1, DD = 3.6;   // the desks' tops and their depth

  // ---------- the daylight ----------
  // a low morning sun through the left windows, reaching across the room; a point is lit if,
  // followed back toward the sun, its line leaves through a window's glass
  const SUN = norm([1, -.55, -.25]);
  const WH = 2.6, WS = FL + 5.5, WT = FL + 19.5, wins = [-.2, 7.8, 15.8, 23.8];
  const mask = (x, y, z) => {
    if (x < XL - .01) return 0;
    const t = (x - XL) / SUN[0], yh = y - SUN[1] * t, zh = z - SUN[2] * t;
    if (yh < WS - .8 || yh > WT + .8) return 0;
    let m = 0;
    for (const wz of wins) {
      const dz = Math.abs(zh - wz);
      if (dz < WH + .7) m = Math.max(m, 1 - smooth(WH - .5, WH + .7, dz));
    }
    return m * smooth(WS - .8, WS + .5, yh) * (1 - smooth(WT - .5, WT + .8, yh));
  };
  const INK = '#B9CAF5', AMB = .6;
  const light = lighting({ ink: rgb(INK), ambient: AMB, moon: { dir: SUN, col: '#FFF0D8', k: 1.3, mask } });
  const L = strokes(light, R), O = solids(), G = glows(), S = shafts(), M = points(), vols = [];
  const up = [0, 1, 0], toward = [0, 0, 1], east = [1, 0, 0];
  const shade = rgb(INK, AMB);   // the shade's own level, for the hatching of shadows the mask cannot know
  // a shadow on the floor: the convex outline of points (x, z), hatched at the shade's level
  const floorShadow = (pts, gap) => {
    const hull = convexHull(pts), x0 = Math.min(...hull.map(p => p[0])), z0 = Math.min(...hull.map(p => p[1]));
    const W = Math.max(...hull.map(p => p[0])) - x0, D = Math.max(...hull.map(p => p[1])) - z0;
    L.paint = shade;
    L.hatch([x0, FL + .02, z0], [W, 0, 0], [0, 0, D], { angle: .62, gap, w: .2, shape: hull.map(([x, z]) => [x - x0, z - z0]), jitter: .2, trim: .15 });
    L.paint = null;
  };
  const toFloor = p => { const t = (FL - p[1]) / SUN[1]; return [p[0] + SUN[0] * t, p[2] + SUN[2] * t]; };
  // a small cylinder or cone (a marker, a lens, a pot): strokes along it and rings of only k pieces
  // (the kit's tube rings every circle in forty, too many for something this small)
  const cyl = (b, axis, h, r0, r1, n, k, w, rings = [0, 1]) => {
    const [u, v] = basis(axis);
    for (let i = 0; i < n; i++) {
      const a = (i + .5) / n * Math.PI * 2, rad = add(scale(u, Math.cos(a)), scale(v, Math.sin(a)));
      L.seg(add(b, scale(rad, r0)), add(add(b, scale(axis, h)), scale(rad, r1)), w * .8, norm(add(scale(rad, h), scale(axis, r0 - r1))));
    }
    for (const t of rings) L.ring(add(b, scale(axis, h * t)), r0 + (r1 - r0) * t, u, v, w, k);
  };

  // ---------- the walls ----------
  L.seg([XL, FL, FW], [XR, FL, FW], .4, toward);
  L.seg([XL, FL + .5, FW + .02], [XR, FL + .5, FW + .02], .2, toward);
  L.seg([XL, FL, FW], [XL, TOPY, FW], .42);
  L.seg([XL + .02, FL, FW], [XL + .02, FL, BACKZ], .36, east);
  L.seg([XL + .02, FL + .5, FW], [XL + .02, FL + .5, BACKZ], .2, east);
  // the windows along the left wall: the opening, its reveal through the wall, a mullion, a transom
  // and glazing bars, the board under it
  const WD = .9, wallAt = (z, y, d = 0) => [XL - d, y, z];
  wins.forEach((wz, i) => {
    const za = wz - WH, zb = wz + WH;
    L.poly([wallAt(za, WS), wallAt(zb, WS), wallAt(zb, WT), wallAt(za, WT)], .42, east, true);
    if (hi) {
      L.poly([wallAt(za, WS, WD), wallAt(zb, WS, WD), wallAt(zb, WT, WD), wallAt(za, WT, WD)], .22, east, true);
      for (const [z, y] of [[za, WS], [zb, WS], [za, WT], [zb, WT]]) L.seg(wallAt(z, y), wallAt(z, y, WD), .24);
    }
    const tr = WS + (WT - WS) * .72;
    L.seg(wallAt(wz, WS, WD * .6), wallAt(wz, WT, WD * .6), .36, east);
    L.seg(wallAt(za, tr, WD * .6), wallAt(zb, tr, WD * .6), .32, east);
    for (const f of hi ? [.34, .67] : [.5]) { const y = WS + (tr - WS) * f; L.seg(wallAt(za, y, WD * .6), wallAt(zb, y, WD * .6), .2, east); }
    L.seg(wallAt(za, (tr + WT) / 2, WD * .6), wallAt(zb, (tr + WT) / 2, WD * .6), .2, east);
    L.seg(wallAt(za - .3, WS - .12, -.3), wallAt(zb + .3, WS - .12, -.3), .36, up);
    L.seg(wallAt(za - .3, WS - .12, -.3), wallAt(za - .3, WS - .12, 0), .26); L.seg(wallAt(zb + .3, WS - .12, -.3), wallAt(zb + .3, WS - .12, 0), .26);
    // the blind rolled up in its box over the head
    if (hi) { L.quad(wallAt(za - .2, WT + .15, -.45), [0, 0, 2 * WH + .4], [0, .55, 0], .26, east); L.seg(wallAt(za - .2, WT + .15, -.45), wallAt(za - .2, WT + .15, 0), .2); }
    // the evening in the glass, by night, and a shaft of the low sun through it
    G.flat(wallAt(wz, (WS + WT) / 2, WD * .7), [0, 0, WH], [0, (WT - WS) / 2, 0], rgb('#8DA4DC', .07), { sharp: 1.1, clear: .6 });
    if (i < 3) {
      const a = wallAt(wz, WS + (WT - WS) * .45, .2), t = (FL + .8 - a[1]) / SUN[1], b = [a[0] + SUN[0] * t, FL + .8, a[2] + SUN[2] * t];
      S.add(a, b, WH * .9, WH * 1.2, rgb('#E9D9B8', .05));
      vols.push({ a, b, ra: WH * .85, rb: WH * 1.1, col: rgb('#F2E2C0'), k: .32 });
    }
  });
  // the wall's face, in shade: open hatching on the piers, under the sills and over the heads, fading
  // toward the floor so the foot of the picture stays quiet
  const wallHatch = (z0, z1, y0, y1) => {
    if (z1 - z0 > .3 && y1 - y0 > .3) L.hatch(wallAt(z0, y0, -.01), [0, 0, z1 - z0], [0, y1 - y0, 0], { angle: 1.28, gap: hi ? .55 : 1.5, w: .2, n: east, jitter: .25, trim: .3, fade: (u, v) => .35 + .65 * smooth(FL + 2, FL + 9, y0 + v) });
  };
  wallHatch(FW, wins[0] - WH, FL + .6, TOPY);
  wins.forEach((wz, i) => {
    const za = wz - WH, zb = wz + WH, next = i + 1 < wins.length ? wins[i + 1] - WH : BACKZ;
    wallHatch(za, zb, FL + .6, WS - .3);
    wallHatch(za, zb, WT + .3, TOPY);
    wallHatch(zb, next, FL + .6, TOPY);
  });

  // ---------- the floor: boards running to the front wall ----------
  // short boards, each one stroke, so the sunlight lying across them is caught board by board (on a
  // phone the floor between the desks is left plain)
  if (hi) for (let x = XL + .5; x < XR; x += 1.1) {
    for (let z = FW, first = true; z < BACKZ; first = false) {
      const ze = Math.min(BACKZ, z + (first ? .5 + R() * 2.5 : 2.2 + R() * 1.6));
      L.seg([x, FL + .01, z], [x, FL + .01, ze], .14, up);
      z = ze + .12;
    }
  }

  // ---------- the whiteboard: a few ruled lines and a small flow diagram ----------
  const BX0 = -20.5, BX1 = -9.5, BY0 = FL + 5.2, BY1 = FL + 11.8, BZ = FW + .12;
  {
    L.quad([BX0, BY0, BZ], [BX1 - BX0, 0, 0], [0, BY1 - BY0, 0], .44, toward);
    L.quad([BX0 + .25, BY0 + .25, BZ + .02], [BX1 - BX0 - .5, 0, 0], [0, BY1 - BY0 - .5, 0], .2, toward);
    O.box([(BX0 + BX1) / 2, (BY0 + BY1) / 2, FW + .06], [BX1 - BX0, BY1 - BY0, .12]);
    // the tray along its foot, two markers and the eraser on it
    const ty = BY0 - .15, tz = BZ + .3;
    L.quad([BX0 + .5, ty, BZ], [BX1 - BX0 - 1, 0, 0], [0, 0, .6], .3, up);
    L.seg([BX0 + .5, ty - .18, tz + .3], [BX1 - .5, ty - .18, tz + .3], .2, toward);
    for (const x of [BX0 + 2.2, BX0 + 3]) cyl([x, ty + .12, tz], [1, 0, 0], .6, .09, .09, 3, 6, .2);
    L.box([BX1 - 2.4, ty + .14, tz], [1, .28, .45], .24);
    // the writing: a heading underlined, then ruled lines of text, left
    const B = (x, y) => [BX0 + x, BY0 + y, BZ + .03];
    L.curve(t => B(.9 + t * 3.4, 5.55 + Math.sin(t * 40) * .07 + Math.sin(t * 13) * .04), hi ? 36 : 18, .24, toward);
    L.seg(B(.8, 5.1), B(4.6, 5.12), .22, toward);
    [[3.9, 4.3], [4.6, 3.6], [3.4, 2.9], [4.2, 2.2], [2.6, 1.5]].forEach(([len, y]) => L.seg(B(.9, y), B(.9 + len, y + (R() - .5) * .04), .16, toward));
    // the diagram, right: one box leading to a second, which divides in two
    const box = (cx, cy, w, h) => L.quad(B(cx - w / 2, cy - h / 2), [w, 0, 0], [0, h, 0], .22, toward);
    const arrow = (a, b) => { L.seg(B(...a), B(...b), .2, toward); const d = norm([b[0] - a[0], b[1] - a[1], 0]), s = [-d[1], d[0]]; for (const k of [1, -1]) L.seg(B(...b), B(b[0] - d[0] * .22 + s[0] * .13 * k, b[1] - d[1] * .22 + s[1] * .13 * k), .2, toward); };
    box(8, 5.3, 2.4, .8); arrow([8, 4.9], [8, 4.15]);
    box(8, 3.75, 2.4, .8); arrow([8, 3.35], [6.9, 2.45]); arrow([8, 3.35], [9.1, 2.45]);
    box(6.6, 2.05, 1.8, .8); box(9.4, 2.05, 1.8, .8);
    // a clock on the wall above it
    const cc = [(BX0 + BX1) / 2, BY1 + 2.6, FW + .06], cu = [1, 0, 0], cv = [0, 1, 0];
    L.ring(cc, .8, cu, cv, .36, hi ? 26 : 14, toward); if (hi) L.ring(cc, .66, cu, cv, .16, 22, toward);
    for (let i = 0; i < 12; i += hi ? 1 : 3) { const a = i * Math.PI / 6, d = [Math.cos(a), Math.sin(a), 0]; L.seg(add(cc, scale(d, .52)), add(cc, scale(d, i % 3 ? .6 : .64)), i % 3 ? .14 : .22, toward); }
    L.seg(cc, add(cc, [Math.cos(2.3) * .34, Math.sin(2.3) * .34, 0]), .3, toward);
    L.seg(cc, add(cc, [Math.cos(.35) * .52, Math.sin(.35) * .52, 0]), .24, toward);
  }

  // ---------- the flip chart on its easel, in the corner by the windows ----------
  {
    const YAW = .55, c = [-21.4, FL, -1.4], u = [Math.cos(YAW), 0, -Math.sin(YAW)], f = [Math.sin(YAW), 0, Math.cos(YAW)];
    const PW = 3.6, P0 = FL + 4.4, P1 = FL + 9.9, lean = .5;
    // a point on the pad: s across it (-1 to 1), y up; the pad leans back a little
    const pad = (s, y) => add(add(c, scale(u, s * PW / 2)), add([0, y - FL, 0], scale(f, -lean * (y - P0) / (P1 - P0))));
    L.poly([pad(-1, P0), pad(1, P0), pad(1, P1), pad(-1, P1)], .42, f, true);
    // the board behind it and the clamp across its head; the sheets thrown over the back
    L.seg(pad(-1.08, P1 + .25), pad(1.08, P1 + .25), .4); L.seg(pad(-1.08, P1 + .25), pad(-1.08, P1 - .1), .3); L.seg(pad(1.08, P1 + .25), pad(1.08, P1 - .1), .3);
    L.curve(t => add(pad(-.95 + t * 1.9, P1 + .25), scale(f, -.35 - Math.sin(t * Math.PI) * .12)), 10, .22);
    L.seg(add(pad(-.95, P1 + .25), scale(f, -.35)), add(pad(-.95, P1 - 1.6), scale(f, -.6)), .2);
    L.seg(add(pad(.95, P1 + .25), scale(f, -.35)), add(pad(.95, P1 - 1.6), scale(f, -.6)), .2);
    // the legs: two in front from the pad's foot to the floor, splayed, and one behind
    for (const s of [-.8, .8]) L.seg(pad(s, P0), add(add(c, scale(u, s * PW / 2 * 1.15)), scale(f, .35)), .34);
    L.seg(pad(0, P1 - .3), add(c, scale(f, -2.4)), .3);
    L.seg(pad(-.95, P0 - .05), pad(.95, P0 - .05), .3);   // the ledge under the pad
    // the writing on the sheet: a title and four points
    L.curve(t => pad(-.75 + t * 1.2, P1 - .8 + Math.sin(t * 26) * .06), hi ? 24 : 12, .24, f);
    for (let i = 0; i < 4; i++) {
      const y = P1 - 1.7 - i * .9;
      L.seg(pad(-.75, y), pad(-.66, y), .26, f);
      L.seg(pad(-.55, y), pad(-.55 + (i % 2 ? .95 : 1.25), y), .16, f);
    }
    // (set behind the pad's whole lean, so its strokes stay in front)
    O.box(add(pad(0, (P0 + P1) / 2), scale(f, -.45)), [PW, P1 - P0, .2], YAW);
  }

  // ---------- the desks, their chairs, their shadows; the places for the handouts ----------
  const handouts = [];
  const desk = (x0, x1, z0) => {
    const z1 = z0 + DD, y = DT;
    L.quad([x0, y, z0], [x1 - x0, 0, 0], [0, 0, DD], .42, up);
    L.seg([x0, y - .22, z1], [x1, y - .22, z1], .26, toward);
    L.seg([x0, y, z1], [x0, y - .22, z1], .26); L.seg([x1, y, z1], [x1, y - .22, z1], .26);
    L.seg([x1, y - .22, z0], [x1, y - .22, z1], .2, east);
    for (const [x, z] of hi ? [[x0 + .35, z0 + .35], [x1 - .35, z0 + .35], [x0 + .35, z1 - .35], [x1 - .35, z1 - .35]] : [[x0 + .35, z1 - .35], [x1 - .35, z1 - .35]]) {
      L.seg([x - .1, y - .22, z], [x - .1, FL, z], .3); if (hi) L.seg([x + .1, y - .22, z], [x + .1, FL, z], .18);
    }
    if (hi) L.seg([x0 + .35, FL + 1.2, z1 - .35], [x1 - .35, FL + 1.2, z1 - .35], .16, toward);   // the stretcher between the back legs
    O.box([(x0 + x1) / 2, y - .11, (z0 + z1) / 2], [x1 - x0, .22, DD]);
    // its shadow on the boards
    const tops = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => toFloor([x, y, z]));
    floorShadow([[x0, z0], [x1, z0], [x1, z1], [x0, z1], ...tops], hi ? .6 : 1);
    // two chairs drawn up to it, and a place on the desk in front of each
    for (const cx of [x0 + 2.15, x1 - 2.15]) { chair(cx, z1 + 1); handouts.push({ at: [cx, y + .02, z0 + DD / 2], yaw: 0 }); }
  };
  // a school chair facing the board (-z), drawn out a little from its desk: the shell seat, the back
  // above it (seen from behind) on its two uprights, the tubular legs
  const chair = (cx, zf) => {
    const sy = FL + 2.5, zb = zf + 2.2, hw = 1.1, top = FL + 4.85, b0 = sy + .75;
    if (hi) L.poly([[cx - hw, sy, zf + .25], [cx - hw + .25, sy, zf], [cx + hw - .25, sy, zf], [cx + hw, sy, zf + .25], [cx + hw, sy, zb], [cx - hw, sy, zb]], .3, up, true);
    else L.quad([cx - hw, sy, zf], [2 * hw, 0, 0], [0, 0, zb - zf], .3, up);
    const back = (s, h) => [cx + s * hw * .95, h, zb + .12 + (h - sy) * .14];
    L.poly([back(-1, b0), back(-1, top - .35), back(-.8, top), back(.8, top), back(1, top - .35), back(1, b0)], .36, toward, !hi);
    if (hi) {
      L.seg(back(-1, b0), back(1, b0), .22, toward);
      L.seg(add(back(-.78, top), [0, 0, -.2]), add(back(.78, top), [0, 0, -.2]), .16, up);
      for (const s of [-.7, .7]) L.seg(back(s, b0), [cx + s * hw * .95, sy, zb - .05], .24);
    }
    for (const [s, z, dz] of hi ? [[-1, zf + .3, -.15], [1, zf + .3, -.15], [-1, zb - .2, .2], [1, zb - .2, .2]] : [[-1, zb - .2, .2], [1, zb - .2, .2]]) L.seg([cx + s * (hw - .12), sy - .05, z], [cx + s * (hw - .04), FL, z + dz], .26);
    O.box([cx, (b0 + top) / 2, zb + .1], [2 * hw * .93, top - b0, .12]);   // just in front of the back's strokes, which lean away
    O.box([cx, sy - .08, (zf + zb) / 2], [2 * hw, .16, zb - zf]);
  };
  const ROWS = [3, 10.5, 18], BLOCKS = [[-22.4, -14], [-13.8, -5.4], [-1.2, 7.2], [7.4, 15.8]];
  ROWS.forEach(z0 => BLOCKS.forEach(([x0, x1]) => desk(x0, x1, z0)));

  // ---------- the projector on its trolley in the aisle ----------
  {
    const c = [-3.3, FL, 8.6], hw = 1.25, hd = 1, legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const at = (i, k, y) => [c[0] + i * hw, y, c[2] + k * hd];
    for (const y of [FL + 1.2, FL + 4.6]) { L.poly(legs.map(([i, k]) => at(i, k, y)), .34, up, true); L.seg(at(-1, 1, y - .14), at(1, 1, y - .14), .2, toward); }
    for (const [i, k] of legs) { L.seg(at(i * .94, k * .9, FL + 4.6), at(i * .94, k * .9, FL + .4), .3); if (hi) L.ring(at(i * .94, k * .9, FL + .22), .2, toward, up, .22, 8); }
    O.box([c[0], FL + 2.9, c[2]], [2 * hw, 3.4, 2 * hd]);
    // the projector: a box, its lens toward the wall where the page stands, and its lead
    const pb = [c[0], FL + 5.15, c[2] - .1];
    L.box(pb, [1.9, .9, 1.5], .38);
    O.box(pb, [1.85, .86, 1.46]);
    cyl([pb[0] + .45, pb[1] + .05, pb[2] - .75], norm([.12, .05, -1]), .75, .34, .36, hi ? 10 : 6, hi ? 14 : 9, .3, hi ? [0, .5, 1] : [0, 1]);
    if (hi) for (let i = 0; i < 5; i++) L.seg([pb[0] - .75 + i * .22, pb[1] + .46, pb[2] - .3], [pb[0] - .75 + i * .22, pb[1] + .46, pb[2] + .5], .14, up);   // the vents on its top
    L.curve(t => [c[0] - .6 + Math.sin(t * 3) * .2, FL + 5.1 - t * 4.9, c[2] + .75 + t * .6], 10, .2);
    G.bill([pb[0] + .5, pb[1] + .08, pb[2] - 1.1], [.5, .5], rgb('#E8E0FF', .5), { sharp: 4 });
    // its beam reaching the wall, by night
    S.add([pb[0] + .5, pb[1] + .08, pb[2] - 1.1], [0, 0, FW + .2], .25, 4.5, rgb('#C9D4F5', .035));
  }

  // ---------- a plant in a pot by the windows: tall upright blades ----------
  {
    const c = [-21.3, FL, 5.6];
    cyl(c, up, 2.4, 1, 1.25, hi ? 14 : 6, hi ? 22 : 12, .34);
    L.ring([c[0], FL + 2.4, c[2]], 1.36, [1, 0, 0], [0, 0, 1], .3, hi ? 22 : 12);
    O.column(c, 2.4, .95, 1.2);
    // each blade two curves from its foot in the soil to its point, widest a third of the way up
    const blades = hi ? 8 : 4, bk = hi ? 9 : 5;
    for (let i = 0; i < blades; i++) {
      const a = i / blades * Math.PI * 2 + R() * .5, r0 = .2 + R() * .55, h = 3.6 + R() * 3, lean = .3 + R() * .9, wd = .32 + R() * .14;
      const d = [Math.cos(a), 0, Math.sin(a)], side = [-d[2], 0, d[0]], foot = add(c, [d[0] * r0, 2.3, d[2] * r0]);
      const blade = k => t => add(foot, [d[0] * lean * t * t + side[0] * k * wd * Math.sin(Math.PI * Math.pow(t, .7)), h * t, d[2] * lean * t * t + side[2] * k * wd * Math.sin(Math.PI * Math.pow(t, .7))]);
      L.curve(blade(1), bk, .26); L.curve(blade(-1), bk, .26);
    }
  }

  // ---------- the air, by night: dust turning in the sun's shafts ----------
  vols.forEach(v => {
    const d = sub(v.b, v.a), [u, w] = basis(norm(d));
    for (let i = 0, n = Math.round(380 * q); i < n; i++) {
      const t = R(), rr = (v.ra + (v.rb - v.ra) * t) * Math.sqrt(R()), a = R() * Math.PI * 2;
      M.add(add(add(v.a, scale(d, t)), add(scale(u, Math.cos(a) * rr), scale(w, Math.sin(a) * rr))), { size: .06 + R() * .05, col: [.003, .003, .004], bright: .4 + R() * .6, drift: [.5 + R() * .7, .3 + R() * .5, .5 + R() * .7], rate: .02 + R() * .05, phase: R() });
    }
  });

  const world = assemble(THREE, { id: 'workshop', grade, stage, parts: { solids: O, glows: G, lines: [L], shafts: S, points: M }, volumes: vols, lamp: '#F2D9A8', flicker: 0, gain: .23, t0 });
  world.handouts = handouts;
  return world;
}

// the convex hull of points in a plane, counter-clockwise (the monotone chain)
function convexHull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const v of p) { while (lower.length > 1 && cr(lower[lower.length - 2], lower[lower.length - 1], v) <= 0) lower.pop(); lower.push(v); }
  for (let i = p.length - 1; i >= 0; i--) { const v = p[i]; while (upper.length > 1 && cr(upper[upper.length - 2], upper[upper.length - 1], v) <= 0) upper.pop(); upper.push(v); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
