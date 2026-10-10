/* The night sky, for "on the record": the camera has gone out through the study's window and tilted
   up, and the sky is drawn like an engraved celestial chart. Thousands of stars across a dome (thick
   overhead, thin toward the horizon, a band of the Milky Way across them, slow twinkle), a faint
   engraved grid of meridians and parallels with the ecliptic dashed across it, constellations joined
   by fine gold lines, and a low horizon far below with its compass ticks and the glow of towns. The
   area about the page stays dark: the page becomes a star here. */
import { random, rgb, lighting, strokes, solids, glows, points, assemble, starField, norm, add, scale, cross } from './engrave.js';

const D = Math.PI / 180;
// the constellations: [right ascension, declination, magnitude] per star (degrees), and the lines between them
const FIGURES = {
  orion: { stars: [[88.79, 7.41, .5], [81.28, 6.35, 1.6], [83.0, -.3, 2.2], [84.05, -1.2, 1.7], [85.19, -1.94, 1.8], [86.94, -9.67, 2.1], [78.63, -8.2, .1], [83.78, 9.93, 3.4]],
    lines: [[7, 0], [7, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]], tint: { 0: '#FFC68E', 6: '#BFD2FF' } },
  plough: { stars: [[165.93, 61.75, 1.8], [165.46, 56.38, 2.4], [178.46, 53.69, 2.4], [183.86, 57.03, 3.3], [193.51, 55.96, 1.8], [200.98, 54.93, 2.2], [206.89, 49.31, 1.9]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
  cassiopeia: { stars: [[2.29, 59.15, 2.3], [10.13, 56.54, 2.2], [14.18, 60.72, 2.5], [21.45, 60.24, 2.7], [28.6, 63.67, 3.4]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  cygnus: { stars: [[310.36, 45.28, 1.3], [305.56, 40.26, 2.2], [311.55, 33.97, 2.5], [296.24, 45.13, 2.9], [292.68, 27.96, 3.1], [299.08, 35.08, 3.9]],
    lines: [[0, 1], [1, 5], [5, 4], [3, 1], [1, 2]] },
  lyra: { stars: [[279.23, 38.78, 0], [281.08, 39.67, 4.7], [281.19, 37.61, 4.4], [283.63, 36.9, 4.3], [284.74, 32.69, 3.3], [282.52, 33.36, 3.5]],
    lines: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [5, 2]], tint: { 0: '#D8E4FF' } },
  leo: { stars: [[152.09, 11.97, 1.4], [151.83, 16.76, 3.5], [154.99, 19.84, 2.1], [154.17, 23.42, 3.4], [148.19, 26.01, 3.9], [146.46, 23.77, 3], [177.26, 14.57, 2.1], [168.53, 20.52, 2.6], [168.56, 15.43, 3.3]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 7], [7, 6], [6, 8], [8, 0]] },
};

export function sky(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(404);
  const grade = { top: '#081538', bottom: '#030817', fog: '#071230', fogDensity: .002, light: '#DCE6FF', glow: ['#182A62', .5] };
  const stage = { anchor: [0, 0, 0], dir: [.12, -.3, 1], fov: 50, size: [11, 13.4, 6] };
  const RD = 140;
  // a point on the dome from its azimuth (0 straight ahead, along -z, growing toward +x) and elevation, in degrees
  const sky = (az, el, r = RD) => [Math.sin(az * D) * Math.cos(el * D) * r, Math.sin(el * D) * r, -Math.cos(az * D) * Math.cos(el * D) * r];
  const azel = v => { const l = Math.hypot(v[0], v[1], v[2]); return [Math.atan2(v[0], -v[2]) / D, Math.asin(v[1] / l) / D]; };
  // the part of the dome the views can see (a phone's narrower view keeps its fewer stars where it looks)
  const seen = hi ? (az, el) => el > -3 && az > -100 && az < 60 : (az, el) => el > -3 && az > -50 && az < 32;

  const L = strokes(lighting({ ink: rgb('#C9D8FF'), ambient: 1 }), R), G = glows(), M = points(), W = solids();

  // ---------- the grid: the celestial pole stands 23 degrees up, straight ahead ----------
  const P = norm(sky(0, 23, 1)), A = norm(cross([0, 1, 0], P)), B = cross(P, A);
  const cel = (h, dec, r = RD * .995) => {
    const c = Math.cos(dec * D);
    return scale(add(add(scale(B, c * Math.cos(h * D)), scale(A, c * Math.sin(h * D))), scale(P, Math.sin(dec * D))), r);
  };
  const trace = (f, n, w, dash = 0) => {
    let a = f(0);
    for (let i = 1; i <= n; i++) {
      const b = f(i / n), [az, el] = azel(b);
      if (seen(az, el) && (!dash || i % 2)) L.seg(a, b, w);
      a = b;
    }
  };
  L.paint = rgb('#8FA8E8', .8);
  for (let h = 0; h < 360; h += 15) trace(t => cel(h, -80 + 160 * t), 80, h % 90 ? .13 : .2);
  for (let dec = -60; dec <= 75; dec += 15) trace(t => cel(t * 360, dec), 180, dec ? .13 : .26);
  // the ecliptic, dashed in gold, tilted to the equator
  const E = norm(add(scale(P, Math.cos(23.4 * D)), scale(B, Math.sin(23.4 * D)))), EA = norm(cross(E, A)), EB = cross(E, EA);
  L.paint = rgb('#F0C35C', .55);
  trace(t => scale(add(scale(EA, Math.cos(t * Math.PI * 2)), scale(EB, Math.sin(t * Math.PI * 2))), RD * .995), 240, .26, 1);
  // the horizon far below, with a compass rose's ticks along it
  L.paint = rgb('#B9CBF7', .7);
  trace(t => sky(-115 + 190 * t, 0), 130, .45);
  for (let az = -115; az <= 75; az += 5) L.seg(sky(az, 0), sky(az, az % 15 ? .7 : 1.8), az % 45 ? .24 : .4);
  L.paint = null;

  // ---------- the stars ----------
  // the Milky Way's great circle, tipped across the view: up from the horizon on the left, over the page
  const MW = norm(cross(sky(-50, 10, 1), sky(0, 50, 1))), MA = norm(cross(MW, [0, 1, 0])), MB = cross(MW, MA);
  // most stars faint, a few bright (the bright ones bloom), thick overhead, gathered along the band
  starField(M, R, { count: Math.round(7800 * q), r: RD, seen, band: MW, share: .45, width: 7, tints: [rgb('#DCE6FF'), rgb('#F6DDB0'), rgb('#B8CCFF')], faint: .5, sizeK: hi ? 1 : 1.15 });
  // the Milky Way's glow: soft patches strung along its circle, a fainter, wider haze about them
  for (let a = 0; a < 360; a += 7) {
    const c = add(scale(MA, Math.cos(a * D)), scale(MB, Math.sin(a * D))), [az, el] = azel(c);
    if (!seen(az, el) || el < 2) continue;
    const t = norm(add(scale(MA, -Math.sin(a * D)), scale(MB, Math.cos(a * D))));
    G.flat(scale(c, RD * 1.002), scale(t, RD * .15), scale(MW, RD * .06), rgb('#5468B0', .12 + R() * .06), { sharp: 1.6, clear: .5 });
    if (a % 14 === 0) G.flat(scale(c, RD * 1.004), scale(t, RD * .26), scale(MW, RD * .13), rgb('#2C3D7A', .08), { sharp: 1.1, clear: .5 });
  }

  // ---------- the constellations: gold lines that stop short of their stars ----------
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const tangents = v => { const u = norm(cross([0, 1, 0], v)); return [u, norm(cross(v, u))]; };
  const place = (fig, az0, el0, rot, k) => {
    const st = fig.stars, ra0 = st.reduce((s, x) => s + x[0], 0) / st.length, de0 = st.reduce((s, x) => s + x[1], 0) / st.length;
    const c = sky(az0, el0, 1), e = norm(sub3(sky(az0 + 1, el0, 1), c)), n = norm(sub3(sky(az0, el0 + 1, 1), c));
    const co = Math.cos(rot * D), si = Math.sin(rot * D);
    const pts = st.map(([ra, de]) => {
      const x = -(ra - ra0) * Math.cos(de0 * D) * k, y = (de - de0) * k;
      return norm(add(c, add(scale(e, (x * co - y * si) * D), scale(n, (x * si + y * co) * D))));
    });
    st.forEach(([, , mag], i) => {
      const col = fig.tint && fig.tint[i] ? rgb(fig.tint[i]) : rgb('#E8EEFF');
      M.add(scale(pts[i], RD * .99), { size: Math.max(2, 5 - mag * .8), col, bright: Math.max(.7, 2.6 - mag * .5), rate: .3 + R() * .8, phase: R() });
      if (mag < 1.4) { L.paint = rgb('#F0C35C', .7); L.ring(scale(pts[i], RD * .99), RD * .012, ...tangents(pts[i]), .34, 18); L.paint = null; }
    });
    L.paint = rgb('#F0C35C', .95);
    fig.lines.forEach(([i, j]) => {
      const a = pts[i], b = pts[j], gap = 1.15 * D, ang = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      if (ang < gap * 2.4) return;
      const at = t => scale(norm(add(scale(a, 1 - t), scale(b, t))), RD * .99);
      L.curve(t => at(gap / ang + t * (1 - 2 * gap / ang)), 6, .46);
    });
    L.paint = null;
  };
  place(FIGURES.orion, -44, 21, -14, 1.2);
  place(FIGURES.plough, -27, 38, 168, 1.05);
  place(FIGURES.cassiopeia, 13, 41, 12, 1.25);
  place(FIGURES.cygnus, -57, 31, 28, 1);
  place(FIGURES.lyra, -66, 13, 0, 1.4);
  place(FIGURES.leo, 14, 9, -8, .9);

  // a faint glow over the horizon, as of a town far off
  for (const az of [-100, -60, -20, 20, 60]) G.flat(sky(az, 2.5), scale(norm(cross([0, 1, 0], sky(az, 0, 1))), RD * .5), [0, RD * .06, 0], rgb('#22346E', .08), { sharp: 1.2, clear: .3 });

  return assemble(THREE, {
    id: 'sky', grade, stage, stars: true, twinkle: .35, clear: [4.8, 6.4, .06, 2.4],
    parts: { dark: { solids: W, near: '#02050E', far: '#02050E', haze: 400 }, glows: G, lines: [L], points: M }, t0,
  });
}
