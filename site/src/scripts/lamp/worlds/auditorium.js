/* The auditorium, for medical communications: a tiered lecture theatre by day, seen from the upper
   rows looking down to the front. Gently curved rows of seats step down to a shallow stage, each row
   behind its writing rail, the centre and side aisles stepping down beside them; on the stage a
   lectern with its microphone stands to the left of the great screen, which frames the page (the
   slide stands just before it); tall windows along the left wall let the daylight in, and it lies
   across the rows, the stage and the lectern; ribs run along the ceiling toward the front. Drawn to
   be shown by day, as ink on paper: form comes from contours, and open hatching shades only the faces
   turned from the windows (the window wall's piers, the lectern's far side, the stage's front, the
   lectern's shadow on the boards), the lit faces left nearly empty. Notebooks lie open on two of the
   rails and a clock hangs on the front wall. By night the same engraving, the windows holding the
   last of the evening, the low sun in shafts across the hall and the lights on the piers lit. */
import { random, rgb, lighting, strokes, solids, glows, shafts, points, assemble, norm, add, sub, scale, basis, corners, smooth } from './engrave.js';

export function auditorium(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(505);
  const grade = { top: '#0B1A3E', bottom: '#040A1A', fog: '#0D1C3C', fogDensity: .016, light: '#EADFC8', glow: ['#24345E', .42] };
  const stage = { anchor: [0, 0, 0], dir: [.3, .24, 1], fov: 44, size: [11, 13.4, 6] };

  // the hall: x across (the windows on the left), y up, z from the front wall back up the rows
  const XL = -17, XR = 17, FW = -1.6, SF = -9.4, BACKZ = 46;
  // the rows are arcs about a centre far behind the front wall, so they curve gently; the rake is
  // gentle enough that each row's seat backs show over the rail behind them
  const ZC = -30, R0 = 36.6, DEP = 3.4, RISE = .9, NR = 11, Y0 = SF - .6;
  const AIS = 1.2, XB = 14.4;   // half the centre aisle's width; the blocks' outer ends (the side aisles beyond)
  const RS = R0 - 1.4;          // the stage's curved edge
  const CF = 7.6, CS = .2;      // the ceiling: its height at the front wall and its rise toward the back
  const ceilY = z => CF + CS * (z - FW);
  const arcZ = (r, x) => ZC + Math.sqrt(r * r - x * x);
  const rowR = k => R0 + DEP * k, rowY = k => Y0 + RISE * k;
  // the floor's height at (x, z): the stage, the well before it, a row, or an aisle's half step
  const floorAt = (x, z) => {
    const r = Math.hypot(x, z - ZC);
    if (z < FW || r < RS) return SF;
    if (r < R0) return Y0;
    const f = (r - R0) / DEP, k = Math.min(NR - 1, Math.floor(f));
    return rowY(k) + ((Math.abs(x) < AIS || Math.abs(x) > XB) && f - k > .5 && k < NR - 1 ? RISE / 2 : 0);
  };

  // ---------- the daylight ----------
  // in through the left windows, falling steeply and a little toward the front; a point is lit if,
  // followed back toward the sun, its line leaves through a window's glass (soft at the edges: the
  // sky is broad)
  const SUN = norm([1, -.8, -.36]);
  const WH = 1.6, wins = [2.2, 8.6, 15, 21.4, 27.8, 34.2, 40.6].map(z => {
    const s = floorAt(XL + 1.3, z) + 3.4;
    return { z, s, h: Math.min(s + 12, ceilY(z) - 1.6) };
  });
  const mask = (x, y, z) => {
    if (x < XL - .01) return 0;
    const t = (x - XL) / SUN[0], yh = y - SUN[1] * t, zh = z - SUN[2] * t;
    let m = 0;
    for (const w of wins) {
      const dz = Math.abs(zh - w.z);
      if (dz > WH + .7) continue;
      m = Math.max(m, (1 - smooth(WH - .5, WH + .7, dz)) * smooth(w.s - .7, w.s + .5, yh) * (1 - smooth(w.h - .5, w.h + .7, yh)));
    }
    return m;
  };
  const INK = '#B9CAF5', AMB = .6;
  const light = lighting({ ink: rgb(INK), ambient: AMB, moon: { dir: SUN, col: '#FFF0D8', k: 1.3, mask } });
  const L = strokes(light, R), O = solids(), G = glows(), S = shafts(), M = points(), vols = [];
  const up = [0, 1, 0], down = [0, -1, 0], toward = [0, 0, 1], east = [1, 0, 0];
  // a stretch of a row's arc at radius r and height y, from x0 to x1
  const arc = (r, x0, x1, y, w, n = null) => L.curve(t => { const x = x0 + (x1 - x0) * t; return [x, y, arcZ(r, x)]; }, Math.max(2, Math.ceil(Math.abs(x1 - x0) / (hi ? 1.2 : 2.6))), w, n);
  const outward = (x, z) => norm([x, 0, z - ZC]);

  // ---------- the front wall and the screen ----------
  L.seg([XL, SF, FW], [XR, SF, FW], .42, toward);
  L.seg([XL, SF + .45, FW + .02], [XR, SF + .45, FW + .02], .2, toward);
  L.seg([XL, CF, FW], [XR, CF, FW], .34, toward);
  L.seg([XL, SF, FW], [XL, CF, FW], .42);
  // the screen: its surface left empty, for the page stands before it; its border, and the case it
  // rolls down from along its top
  const SX = 8.5, SY0 = -8.4, SY1 = 6.6, SZ = FW + .1;
  L.quad([-SX, SY0, SZ], [2 * SX, 0, 0], [0, SY1 - SY0, 0], .46, toward);
  L.quad([-SX - .4, SY0 - .4, SZ - .02], [2 * SX + .8, 0, 0], [0, SY1 - SY0 + .8, 0], .3, toward);
  O.box([0, (SY0 + SY1) / 2, FW + .04], [2 * SX + .8, SY1 - SY0 + .8, .08]);
  L.box([0, SY1 + 1.05, FW + .45], [2 * SX + 1.6, .7, .9], .34);
  O.box([0, SY1 + 1.05, FW + .45], [2 * SX + 1.55, .66, .86]);
  // the case's underside, in shade
  if (hi) L.hatch([-SX - .8, SY1 + .69, FW + .02], [2 * SX + 1.6, 0, 0], [0, 0, .86], { angle: Math.PI / 2, gap: .5, w: .16, n: down, trim: 0, jitter: .1 });

  // ---------- the stage: boards running out to its curved edge, its front in shade ----------
  // short boards, each one stroke (a stroke's light is taken at its ends, so the window light lying
  // across the stage in bands needs boards no longer than about half a band)
  for (let x = XL + .45; x < XR; x += hi ? .9 : 1.8) {
    const z1 = arcZ(RS, x);
    for (let z = FW, first = true; z < z1 - .2; first = false) {
      const ze = Math.min(z1, z + (first ? .6 + R() * 1.8 : hi ? 1.6 + R() * 1.4 : 3 + R() * 2));
      L.seg([x, SF + .01, z], [x, SF + .01, ze], .17, up);
      z = ze + .1;
    }
  }
  arc(RS, XL, XR, SF, .46, up);
  arc(RS + .02, XL, XR, Y0, .3, toward);
  for (let x = XL + .3; x < XR; x += hi ? .45 : .9) { const z = arcZ(RS, x) + .02; L.seg([x, Y0 + .08, z], [x, SF - .1, z], .18, outward(x, z)); }

  // ---------- the lectern, its microphone, the speaker's notes; its shadow on the boards ----------
  {
    const LX = -11.8, LZ = 1.7, YAW = .3, yb = SF + .3, yf = SF + 3.6, yk = SF + 3.1;
    const lc = corners([LX, 0, LZ], [2.6, 0, 1.8], YAW), P = (i, k, y) => { const p = lc(i, 0, k); return [p[0], y, p[2]]; };
    const fwd = [Math.sin(YAW), 0, Math.cos(YAW)], side = [Math.cos(YAW), 0, -Math.sin(YAW)];
    // the plinth, the body, its sloping top with the lip the papers rest on
    L.box([LX, SF + .15, LZ], [2.95, .3, 2.15], .34, 0, YAW);
    O.box([LX, SF + .15, LZ], [2.9, .28, 2.1], YAW);
    for (const [i, k] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) L.seg(P(i, k, yb), P(i, k, k > 0 ? yf : yk), .42);
    L.seg(P(-1, 1, yf), P(1, 1, yf), .46); L.seg(P(-1, -1, yk), P(1, -1, yk), .36);
    L.seg(P(-1, 1, yf), P(-1, -1, yk), .42); L.seg(P(1, 1, yf), P(1, -1, yk), .42);
    L.seg(P(-1.06, 1.06, yf + .12), P(1.06, 1.06, yf + .12), .3); L.seg(P(-1.06, -1.06, yk + .16), P(1.06, -1.06, yk + .16), .3);
    L.seg(P(-1.06, -1.06, yk + .16), P(-1.06, -1.06, yk - .02), .26); L.seg(P(1.06, -1.06, yk + .16), P(1.06, -1.06, yk - .02), .26);
    // the front's raised panel
    L.quad(P(-.72, 1.01, yb + .55), scale(side, 2.6 * .72), [0, yf - yb - 1.25, 0], .24, fwd);
    // the far side, turned from the windows, hatched; the near side and the front left open
    L.hatch(P(1.01, 1, yb), scale(fwd, -1.8), [0, yf - yb, 0], { angle: 1.05, gap: hi ? .3 : .45, w: .26, n: side, shape: [[0, 0], [1.8, 0], [1.8, yk - yb], [0, yf - yb]], jitter: .2, trim: .2 });
    O.box([LX, (yb + yk) / 2, LZ], [2.55, yk - yb, 1.75], YAW);
    // the speaker's notes on the slope, and the microphone on its goose neck, leaning back toward
    // where the speaker stands
    const slope = (i, k) => { const p = P(i, k, yk + (yf - yk) * (k + 1) / 2); p[1] += .05; return p; };
    L.poly([slope(-.55, -.7), slope(.45, -.75), slope(.5, .65), slope(-.5, .7)], .22, null, true);
    L.poly([slope(-.45, -.62), slope(.55, -.66), slope(.6, .74), slope(-.4, .78)], .18, null, true);
    const foot = add(slope(-.75, .55), [0, .06, 0]), back = scale(fwd, -1);
    L.ring(foot, .2, side, fwd, .3, 10);
    const neck = t => add(foot, add([0, Math.sin(t * Math.PI / 2) * 1.5, 0], scale(back, (1 - Math.cos(t * Math.PI / 2)) * 1.05)));
    L.curve(neck, 14, .36);
    // the head: a short grille, its rings in a few pieces only (it is small)
    const tip = neck(1), tipDir = norm(sub(neck(1), neck(.9))), [hu, hv] = basis(tipDir);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, rd = add(scale(hu, Math.cos(a)), scale(hv, Math.sin(a))); L.seg(add(tip, scale(rd, .12)), add(add(tip, scale(tipDir, .55)), scale(rd, .15)), .2); }
    for (const t of [0, .5, 1]) L.ring(add(tip, scale(tipDir, .55 * t)), .12 + .03 * t, hu, hv, .3, 10);
    // its shadow: the body's foot and its top carried down the sunlight onto the boards
    const toFloor = p => { const t = (SF - p[1]) / SUN[1]; return [p[0] + SUN[0] * t, p[2] + SUN[2] * t]; };
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => { const p = lc(i, 0, k); return [p[0], p[2]]; });
    for (const [i, k, y] of [[-1, 1, yf], [1, 1, yf], [1, -1, yk], [-1, -1, yk]]) pts.push(toFloor(P(i, k, y)));
    const hull = convexHull(pts), x0 = Math.min(...hull.map(p => p[0])), z0 = Math.min(...hull.map(p => p[1]));
    const W = Math.max(...hull.map(p => p[0])) - x0, D = Math.max(...hull.map(p => p[1])) - z0;
    // (painted at the shade's level: the sun's mask cannot know the lectern stands in its way)
    L.paint = rgb(INK, AMB);
    L.hatch([x0, SF + .02, z0], [W, 0, 0], [0, 0, D], { angle: .5, gap: hi ? .34 : .5, w: .26, shape: hull.map(([x, z]) => [x - x0, z - z0]), jitter: .2, trim: .15 });
    L.paint = null;
  }

  // ---------- the windows along the left wall, and the wall between them in shade ----------
  const WD = .9;   // the wall's thickness
  const wallAt = (z, y, d = 0) => [XL - d, y, z];
  wins.forEach((w, i) => {
    const za = w.z - WH, zb = w.z + WH;
    L.poly([wallAt(za, w.s), wallAt(zb, w.s), wallAt(zb, w.h), wallAt(za, w.h)], .42, east, true);
    L.poly([wallAt(za, w.s, WD), wallAt(zb, w.s, WD), wallAt(zb, w.h, WD), wallAt(za, w.h, WD)], .22, east, true);
    for (const [z, y] of [[za, w.s], [zb, w.s], [za, w.h], [zb, w.h]]) L.seg(wallAt(z, y), wallAt(z, y, WD), .24);
    // the frame: a mullion and a transom, set back in the opening, and the glazing bars
    const tr = w.s + (w.h - w.s) * .74;
    L.seg(wallAt(w.z, w.s, WD * .6), wallAt(w.z, w.h, WD * .6), .36, east);
    L.seg(wallAt(za, tr, WD * .6), wallAt(zb, tr, WD * .6), .32, east);
    if (hi) { L.seg(wallAt(w.z + .1, w.s, WD * .6), wallAt(w.z + .1, w.h, WD * .6), .2, east); L.seg(wallAt(za, tr + .1, WD * .6), wallAt(zb, tr + .1, WD * .6), .18, east); }
    for (const f of hi ? [.25, .5, .75] : [.5]) { const y = w.s + (tr - w.s) * f; L.seg(wallAt(za, y, WD * .6), wallAt(zb, y, WD * .6), .2, east); }
    L.seg(wallAt(za, (tr + w.h) / 2, WD * .6), wallAt(zb, (tr + w.h) / 2, WD * .6), .2, east);
    // the window board under it, and the blind rolled up in its box over the head
    L.seg(wallAt(za - .3, w.s - .12, -.3), wallAt(zb + .3, w.s - .12, -.3), .36, up);
    L.seg(wallAt(za - .3, w.s - .12, -.3), wallAt(za - .3, w.s - .12, 0), .26); L.seg(wallAt(zb + .3, w.s - .12, -.3), wallAt(zb + .3, w.s - .12, 0), .26);
    if (hi) { L.quad(wallAt(za - .2, w.h + .15, -.45), [0, 0, 2 * WH + .4], [0, .55, 0], .26, east); L.seg(wallAt(za - .2, w.h + .15, -.45), wallAt(za - .2, w.h + .15, 0), .2); }
    // the evening sky in the glass, by night
    G.flat(wallAt(w.z, (w.s + w.h) / 2, WD * .7), [0, 0, WH], [0, (w.h - w.s) / 2, 0], rgb('#8DA4DC', .07), { sharp: 1.1, clear: .6 });
    if (i < 4) {
      // a shaft of the low sun through it, by night, with dust turning in it
      const a = wallAt(w.z, (w.s + w.h) / 2, .2), t = (SF + 1 - a[1]) / SUN[1], b = [a[0] + SUN[0] * t, SF + 1, a[2] + SUN[2] * t];
      S.add(a, b, WH * .9, WH * 1.3, rgb('#E9D9B8', .05));
      vols.push({ a, b, ra: WH * .85, rb: WH * 1.2, col: rgb('#F2E2C0'), k: .32 });
    }
  });
  // the wall's face, in shade: open hatching on the piers, under the sills and over the heads, fading
  // toward the floor so the foot of the picture stays quiet
  const wallHatch = (z0, z1, y0, y1) => {
    if (z1 - z0 > .3 && y1 - y0 > .3) L.hatch(wallAt(z0, y0, -.01), [0, 0, z1 - z0], [0, y1 - y0, 0], { angle: 1.28, gap: hi ? .42 : .8, w: .2, n: east, jitter: .25, trim: .3, fade: (u, v) => .35 + .65 * smooth(-8, 0, y0 + v) });
  };
  const floorW = z => floorAt(XL + .2, z), lastZ = Math.min(BACKZ, wins[wins.length - 1].z + 6);
  wallHatch(FW, wins[0].z - WH, floorW(FW) + .1, ceilY(FW) - .2);
  wins.forEach((w, i) => {
    const za = w.z - WH, zb = w.z + WH, next = i + 1 < wins.length ? wins[i + 1].z - WH : lastZ;
    wallHatch(za, zb, floorW(zb) + .1, w.s - .3);
    wallHatch(za, zb, w.h + .3, ceilY(za) - .2);
    wallHatch(zb, next, floorW(next) + .1, ceilY(zb) - .2);
  });
  // lights on the piers, lit by night
  wins.slice(0, -1).forEach((w, i) => {
    if (i > 3) return;
    const z = w.z + 3.2, y = w.s + 5.5, c = wallAt(z, y, -.35);
    L.seg(wallAt(z, y - .6), wallAt(z, y - .1), .26, east); L.seg(wallAt(z, y - .35), c, .24);
    L.poly([add(c, [-.05, .45, -.4]), add(c, [-.05, .45, .4]), add(c, [.05, -.25, .55]), add(c, [.05, -.25, -.55])], .28, east, true);
    // by night: a small warm light in the shade and a narrow wash up and down the pier (kept dim:
    // the bloom turns anything bright into a disc)
    G.bill(add(c, [.1, .1, 0]), [.38, .3], [0, 0, 0], { lamp: .3, sharp: 5 });
    G.flat(wallAt(z, y + .4, -.03), [0, 0, .75], [0, 2.6, 0], [0, 0, 0], { lamp: .05, sharp: 2.2 });
  });
  // the handrail along the side aisle, climbing with it on its posts
  if (hi) {
    // (on the rake's even slope, not on the steps)
    const xr = XL + .35, rail = z => Y0 + RISE * (Math.hypot(XL + 1.3, z - ZC) - R0) / DEP + 3.4, pts = [];
    for (let z = arcZ(R0, XL + 1.3); z <= arcZ(rowR(NR), XL + 1.3); z += 1.5) pts.push([xr, rail(z), z]);
    L.poly(pts, .3, east);
    for (let i = 0; i < pts.length; i += 3) L.seg(pts[i], [xr, floorAt(xr, pts[i][2]) + .05, pts[i][2]], .22, east);
  }
  // the wall's head along the ceiling, and its foot stepping up with the side aisle
  L.seg(wallAt(FW, ceilY(FW)), wallAt(BACKZ, ceilY(BACKZ)), .32, east);
  if (hi) {
    let z = FW, y = SF;
    const steps = [RS, R0];
    for (let k = 0; k < NR; k++) steps.push(rowR(k) + DEP / 2, rowR(k + 1));
    const xs = XL + .02;
    for (const r of steps) {
      const z1 = Math.min(BACKZ, arcZ(r, xs)), y1 = floorAt(xs, z1 + .05);
      L.seg([xs, y, z], [xs, y, z1], .3, east); if (y1 !== y) L.seg([xs, y, z1], [xs, y1, z1], .26, east);
      z = z1; y = y1;
    }
  }

  // ---------- a clock on the front wall, beside the window wall ----------
  {
    const c = [-12.5, 4.5, FW + .06], u = [1, 0, 0], v = [0, 1, 0];
    L.ring(c, .78, u, v, .36, 28, toward); L.ring(c, .64, u, v, .18, 24, toward);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, d = [Math.cos(a), Math.sin(a), 0]; L.seg(add(c, scale(d, .5)), add(c, scale(d, i % 3 ? .58 : .62)), i % 3 ? .14 : .22, toward); }
    L.seg(c, add(c, [Math.cos(1.1) * .32, Math.sin(1.1) * .32, 0]), .3, toward);
    L.seg(c, add(c, [Math.cos(-.5) * .5, Math.sin(-.5) * .5, 0]), .24, toward);
  }

  // ---------- the ceiling: ribs running toward the front ----------
  for (let x = XL + 3; x < XR - 1; x += hi ? 3.4 : 6.8) {
    for (const dx of [-.3, .3]) L.seg([x + dx, ceilY(FW) - .7, FW], [x + dx, ceilY(BACKZ) - .7, BACKZ], .22, down);
    L.seg([x + .3, ceilY(FW), FW], [x + .3, ceilY(BACKZ), BACKZ], .14, down);
  }

  // ---------- the rows: the floor's steps, the writing rails, the seats ----------
  const blocks = [[-XB, -AIS], [AIS, XB]], PITCH = 1.85;
  // a seat seen from behind: its back leaning a little, rounded at the top; the armrest and the
  // standard between it and the next
  const seat = (c, rad, along) => {
    const at = (s, h) => { const o = .55 + (h - 1.4) * .12; return [c[0] + along[0] * s * .72 + rad[0] * o, c[1] + h, c[2] + along[2] * s * .72 + rad[2] * o]; };
    if (hi) {
      L.poly([at(-1, 1.45), at(-1, 2.85), at(-.8, 3.12), at(.8, 3.12), at(1, 2.85), at(1, 1.45)], .32, rad);
      L.seg(at(-1, 1.45), at(1, 1.45), .2, rad);
      L.seg(add(at(-.75, 3.12), scale(rad, -.3)), add(at(.75, 3.12), scale(rad, -.3)), .18, up);
      const a0 = add(add(c, scale(along, PITCH / 2)), scale(rad, .4)), a1 = add(a0, scale(rad, -1.2));
      L.seg(add(a0, [0, 2.1, 0]), add(a1, [0, 2.1, 0]), .22, up);
      L.seg(add(a1, [0, 2.1, 0]), add(a1, [0, .05, 0]), .2);
    } else {
      L.poly([at(-1, 1.7), at(-1, 3.05), at(1, 3.05), at(1, 1.7)], .32, rad);
    }
  };
  // a notebook open on a rail, and a pen across it
  const notebook = (x, k) => {
    const r = rowR(k) + .47, z = arcZ(r, x), rad = outward(x, z), along = [rad[2], 0, -rad[0]], c = [x, rowY(k) + 1.98, z];
    const P = (s, f) => add(c, add(scale(along, s), scale(rad, f)));
    L.poly([P(-.9, -.24), P(0, -.27), P(0, .27), P(-.9, .24)], .3, up, true);
    L.poly([P(0, -.27), P(.9, -.24), P(.9, .24), P(0, .27)], .3, up, true);
    for (let j = 1; j < 5; j++) { const f = -.27 + .54 * j / 5; L.seg(P(-.8, f), P(-.1, f), .12, up); L.seg(P(.1, f), P(j === 4 ? .5 : .8, f), .12, up); }
    L.seg(P(.3, -.36), P(1.15, .18), .3, up);
  };
  for (let k = 0; k < NR; k++) {
    const y = rowY(k), r = rowR(k);
    // the nosing of the row's floor, right across; the aisles' half steps
    arc(r, XL + .02, XR - .02, y, .3, up);
    for (const [xa, xb] of hi ? [[XL + .02, -XB], [-AIS, AIS], [XB, XR - .02]] : [[-AIS, AIS]]) arc(r + DEP / 2, xa, xb, y + RISE / 2, .24, up);
    blocks.forEach(([xa, xb]) => {
      // the writing rail at the row's front: its top's two edges, the thickness of its near edge, and
      // the slim panel under it down to the floor
      const rt = y + 1.95;
      arc(r + .2, xa, xb, rt, .26, up);
      arc(r + .75, xa, xb, rt, .38, up);
      if (hi) { arc(r + .75, xa, xb, rt - .14, .18); arc(r + .5, xa, xb, y + .02, .16, up); }
      for (const x of [xa, xb]) { const z0 = arcZ(r + .2, x), z1 = arcZ(r + .75, x); L.seg([x, rt, z0], [x, rt, z1], .26); L.seg([x, rt, z1], [x, y, arcZ(r + .5, x)], .24); }
      // solid enough to hide what stands behind them: the rail and its panel, and the seats' backs
      // (set just in front of the backs' strokes, which are seen from behind)
      for (let x = xa; x < xb - .01; x += 2.4) {
        const x1 = Math.min(xb, x + 2.4), xm = (x + x1) / 2, rd = outward(xm, arcZ(r, xm)), yaw = Math.atan2(rd[0], rd[2]);
        O.box([xm, rt - .06, arcZ(r + .47, xm)], [x1 - x + .05, .12, .55], yaw);
        O.box([xm, (y + rt) / 2, arcZ(r + .5, xm)], [x1 - x + .05, rt - y, .08], yaw);
        O.box([xm, y + 2.3, arcZ(r + 2.62, xm)], [x1 - x + .05, 1.7, .2], yaw);
      }
      // the seats along it
      const n = Math.floor((xb - xa - .4) / PITCH), x0 = (xa + xb) / 2 - (n - 1) * PITCH / 2;
      for (let i = 0; i < n; i++) {
        const sx = x0 + i * PITCH, sz = arcZ(r + 2.2, sx), rad = outward(sx, sz);
        seat([sx, y, sz], rad, [rad[2], 0, -rad[0]]);
      }
    });
  }
  notebook(-11.4, 1);   // seen at the foot of the picture's left side
  notebook(4.6, 2);     // seen below the page on a phone

  // ---------- the air, by night: dust turning in the shafts ----------
  vols.forEach(v => {
    const d = sub(v.b, v.a), [u, w] = basis(norm(d));
    for (let i = 0, n = Math.round(380 * q); i < n; i++) {
      const t = R(), rr = (v.ra + (v.rb - v.ra) * t) * Math.sqrt(R()), a = R() * Math.PI * 2;
      M.add(add(add(v.a, scale(d, t)), add(scale(u, Math.cos(a) * rr), scale(w, Math.sin(a) * rr))), { size: .06 + R() * .05, col: [.003, .003, .004], bright: .4 + R() * .6, drift: [.5 + R() * .7, .3 + R() * .5, .5 + R() * .7], rate: .02 + R() * .05, phase: R() });
    }
  });

  return assemble(THREE, { id: 'auditorium', grade, stage, parts: { solids: O, glows: G, lines: [L], shafts: S, points: M }, volumes: vols, lamp: '#F2D9A8', flicker: 0, gain: .23, t0 });
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
