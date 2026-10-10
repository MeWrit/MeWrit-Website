/* The dawn, for correspondence (the last chapter and the footer): a horizon at first light. Three
   long, gently rolling ridges step back into a warm haze, the farthest with towns of tiny warm lights
   strung along its foot and up its slopes, villages scattered over the plain before it; engraved
   bands of cloud lie above, hatched in long curved strokes, their undersides warmed by a sun still
   below the hills, whose glow rises behind them on the right; the last stars fade overhead. Navy
   above, a muted warm dawn low down; the left of the view and the land in front stay dark for the
   words. */
import { random, rgb, lighting, strokes, solids, glows, points, assemble, rolling } from './engrave.js';

export function dawn(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(505);
  const grade = { top: '#0B1A42', bottom: '#3A2A3A', fog: '#2A2340', fogDensity: .011, light: '#F2B866', glow: ['#5A3E3A', .3] };
  const stage = { anchor: [0, 0, 0], dir: [.12, .17, 1], fov: 40, size: [11, 13.4, 6] };

  const LAND = -17, SUN = [14, -27, -150];
  // the ridges, far to near: their distance, their crest's height above the land, its roll
  const RIDGES = [
    { z: -140, h: 6.5, roll: [[.021, 3.2, .4], [.057, 1.6, 2.1], [.17, .45, 5]] },
    { z: -112, h: 3.2, roll: [[.026, 2.2, 1.7], [.071, 1, .3], [.19, .35, 2]] },
    { z: -84, h: 1.2, roll: [[.032, 1.3, 3.1], [.09, .6, 1.2], [.23, .25, .6]] },
  ];
  RIDGES.forEach(r => { r.f = rolling(LAND + r.h, r.roll); });
  const crest = (r, x) => r.f(x);
  const light = lighting({ ink: rgb('#AFC1EE'), ambient: .3, lamps: [{ p: SUN, k: 4, range: 60 }] });
  const L = strokes(light, R), C = strokes(light, random(506)), O = solids(), G = glows(), M = points();
  const X0 = -230, X1 = 230;

  // ---------- the land: the ridges as dark silhouettes melting into the haze, and the plain ----------
  RIDGES.forEach((r, i) => {
    // the crest, a fine line lit from behind, warmest toward the sun; the hill beneath it, solid
    const top = L.horizon(r.f, r.z, X0, X1, 4, .55 - i * .12);
    O.strip(top, top.map(([x]) => [x, LAND - 30, r.z]));
  });
  O.face([X0, LAND, 60], [X1, LAND, 60], [X1, LAND, RIDGES[0].z], [X0, LAND, RIDGES[0].z]);
  // the plain's furrows and field edges, far off where the light grazes them; the foreground stays dark
  for (let z = -80; z < -30; z += 2.6 + (z + 80) * .08) {
    const ph = R() * 9, w = .16 + R() * .08;
    let prev = null;
    for (let x = X0; x <= X1 + .1; x += 6) {
      const p = [x, LAND + .02, z + Math.sin(x * .02 + ph) * 1.6];
      if (prev && R() > .15) L.seg(prev, p, w * (1 - (z + 80) / 60), [0, 1, 0]);
      prev = p;
    }
  }

  // ---------- the sky's light ----------
  // the sun's glow rising behind the far hills, a warm band along them, a softer one higher up
  G.flat(SUN, [100, 0, 0], [0, 44, 0], rgb('#E0A82E', .5), { sharp: 2.2, clear: .6, fog: false });
  G.flat([SUN[0], SUN[1] + 8, SUN[2] + 1], [40, 0, 0], [0, 20, 0], rgb('#F2B866', .45), { sharp: 3, clear: .75, fog: false });
  G.flat([0, LAND + 7, -150], [260, 0, 0], [0, 13, 0], rgb('#6B4A3A', .3), { sharp: 1.3, clear: .2, fog: false });
  G.flat([0, LAND + 24, -152], [260, 0, 0], [0, 30, 0], rgb('#3A2A3A', .15), { sharp: 1.2, clear: .15, fog: false });

  // ---------- the clouds: engraved as an old plate draws them ----------
  // Each is a long lens, flat beneath and heaped along its top, filled with level strokes that run
  // edge to edge; the strokes gather toward the underside, which the sun warms, and thin out toward
  // the top, which keeps the night's cool; a fine line traces the heaped top.
  const cloud = (cx, cy, cz, len, th, seed) => {
    const r = random(seed), K = 72;
    const lumps = Array.from({ length: 4 + Math.floor(r() * 3) }, () => [r() * 1.6 - .8, .25 + r() * .55, .12 + r() * .22]);
    const top = x => th * (.45 * Math.sqrt(Math.max(0, 1 - x * x)) + lumps.reduce((s, [p, a, w]) => s + a * Math.exp(-(((x - p) / w) ** 2)), 0)) * Math.min(1, (1 - Math.abs(x)) * 6);
    const base = x => -th * .3 * Math.sqrt(Math.max(0, 1 - x * x));
    const X = x => cx + x * len / 2;
    for (let y = -th * .3 + .12, k = 0; y < th * 1.5; y += (hi ? .3 : .6) * (1 + Math.max(0, y) / th * .8), k++) {
      // the runs of x where this height lies inside the cloud
      let run = null;
      const n = y < 0 ? [0, -1, 0] : [0, 1, 0], w = (y < th * .2 ? .85 : .45) * (.75 + r() * .4);
      for (let i = 0; i <= K; i++) {
        const x = -1 + 2 * i / K, inside = y <= top(x) && y >= base(x);
        if (inside && run === null) run = x;
        if ((!inside || i === K) && run !== null) {
          const x1 = inside ? x : x - 2 / K;
          if (x1 - run > .03) C.cut([X(run + r() * .02), cy + y, cz - k * .05], [X(x1 - r() * .02), cy + y, cz - k * .05], w, n, 8, .3);
          run = null;
        }
      }
    }
    let prev = null;
    for (let i = 0; i <= K; i++) { const x = -1 + 2 * i / K, p = [X(x), cy + Math.max(base(x), top(x)) + .05, cz + .1]; if (prev && top(x) > .05) C.seg(prev, p, .32, [0, 1, 0]); prev = p; }
  };
  // low over the hills, nearer than they are, so the haze leaves them their light
  [
    [-72, 1.5, -74, 64, 2], [-18, 3, -80, 78, 2.3], [38, 2, -86, 60, 1.9], [-100, 7, -82, 70, 2.6],
    [-44, 9, -88, 92, 2.8], [16, 8.5, -94, 74, 2.4], [62, 11, -90, 58, 2.2], [-78, 14, -84, 84, 3],
    [-20, 16, -92, 100, 3.2], [40, 18, -98, 72, 2.6], [-60, 22, -96, 90, 3.2], [5, 25, -100, 96, 3.4],
  ].forEach(([cx, cy, cz, len, th], i) => cloud(cx, cy, cz, len, th, 600 + i));

  // ---------- the lights: towns along the far hills' foot, villages on the plain; the last stars ----------
  const warm = [rgb('#F2B866'), rgb('#E0A82E'), rgb('#F6CF8A'), rgb('#DCE6FF')];
  const towns = [[-160, 22], [-118, 34], [-76, 48], [-34, 40], [6, 60], [38, 30], [80, 26]];
  towns.forEach(([tx, n0]) => {
    for (let i = 0, n = Math.round(n0 * 9 * q); i < n; i++) {
      const dx = (R() + R() + R() - 1.5) * 16, x = tx + dx, top = crest(RIDGES[0], x) - LAND;
      const y = LAND + Math.pow(R(), 2.4) * top * .75 + .2, t = R();
      M.add([x, y, RIDGES[0].z + .6], { size: 1.5 + R() * 1.5, col: warm[t < .45 ? 0 : t < .8 ? 1 : t < .95 ? 2 : 3], bright: .8 + Math.pow(R(), 2) * 2.2, rate: .6 + R() * 2, phase: R() });
    }
  });
  // villages on the second ridge's face and on the plain before it
  for (let i = 0, n = Math.round(500 * q); i < n; i++) {
    const x = (R() - .5) * 360, top = crest(RIDGES[1], x) - LAND;
    M.add([x, LAND + Math.pow(R(), 2) * top * .7 + .2, RIDGES[1].z + .6], { size: 1.3 + R() * 1.1, col: warm[R() < .6 ? 0 : 1], bright: .5 + R() * 1.1, rate: .5 + R() * 2, phase: R() });
  }
  for (let i = 0, n = Math.round(260 * q); i < n; i++) {
    const a = (R() - .5) * 2.4, el = .45 + R() * .9, r = 150;
    M.add([Math.sin(a) * Math.cos(el) * r, Math.sin(el) * r - 30, -Math.cos(a) * Math.cos(el) * r], { size: 1 + R(), col: rgb('#DCE6FF'), bright: .12 + Math.pow(R(), 3) * .7, rate: .4 + R(), phase: R() });
  }

  let clouds = null;
  return assemble(THREE, {
    id: 'dawn', grade, stage, twinkle: .3, stars: true, lamp: '#E9A54A', flicker: 0,
    parts: { dark: { solids: O, near: '#03060F', far: '#2B2236', haze: 75 }, glows: G, lines: [L, { strokes: C, object: o => { clouds = o; } }], points: M },
    // the clouds drift, slowly enough that no one could say when
    tick: time => { if (clouds) clouds.position.x = Math.sin(time * .012) * 6; },
    t0,
  });
}
