/* The desk, for the title page and the contents: a scholar's desk at night, seen from just above
   its top. The long front edge and the top recede to the left; a desk lamp stands beside the page,
   arm and conical shade engraved in outline and hatching, a warm glow under the shade and a warm
   pool on the desk beneath it, two closed books stacked in its light; an inkwell with its quill
   stands to the right; beyond the desk the ruled lines of a writing sheet run on into the dark, with
   a faint orange margin rule; dust turns in the lamplight. Deep navy, warm lamplight. */
import { random, rgb, lighting, strokes, solids, glows, points, assemble, norm, add, sub, scale, basis, corners, cross } from './engrave.js';

export function desk(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(101);
  const grade = { top: '#0A1636', bottom: '#030817', fog: '#0A1430', fogDensity: .02, light: '#F2B866', glow: ['#22305C', .4] };
  const stage = { anchor: [0, 0, 0], dir: [.2, .08, 1], fov: 36, size: [11, 13.4, 6] };
  const view = norm(stage.dir);

  const TOP = -6.3, FRONT = 8, BACK = -10, LEFT = -70, RIGHT = 20;
  // the lamp: its foot, elbow and head; the shade looks down at the desk between it and the page
  const foot = [-15.5, TOP, -8], elbow = [-17.4, 2.8, -9.6], pivot = [-13.2, 6.4, -6.6];
  const pool = [-10.4, TOP, -3.4], aim = norm(sub(pool, pivot));
  const apex = add(pivot, scale(aim, .15)), mouth = add(pivot, scale(aim, 3)), bulb = add(pivot, scale(aim, 2.2));
  const light = lighting({
    ink: rgb('#B9CBF7'), ambient: .2,
    moon: { dir: norm([.5, -.55, .65]), col: '#DCE6FF', k: .16 },
    lamps: [
      { p: bulb, k: 3.2, range: 9, dir: aim, cone: [Math.cos(.5), Math.cos(1.2)] },
      { p: bulb, k: 1.4, range: 1.7 },   // the light inside the shade, on its rim
      { p: add(bulb, scale(aim, 1.5)), k: .5, range: 12 },   // what the pool throws back about the desk
    ],
  });
  const L = strokes(light, R), O = solids(), G = glows(), M = points();
  const up = [0, 1, 0], toward = [0, 0, 1];

  // ---------- the desk ----------
  // the top's front edge, its moulding and the slab's underside: long fine lines receding left
  L.seg([LEFT, TOP, FRONT], [RIGHT, TOP, FRONT], .6, toward, 2.5);
  L.seg([LEFT, TOP - .28, FRONT + .06], [RIGHT, TOP - .28, FRONT + .06], .28, toward, 3);
  L.seg([LEFT, TOP - 1.05, FRONT], [RIGHT, TOP - 1.05, FRONT], .4, toward, 3);
  L.seg([LEFT, TOP, BACK], [RIGHT, TOP, BACK], .5, up, 2);
  L.seg([RIGHT, TOP, FRONT], [RIGHT, TOP, BACK], .45, up, 2);
  L.seg([RIGHT, TOP, FRONT], [RIGHT, TOP - 1.05, FRONT], .4, toward);
  // the slab's front face, in shadow: close horizontal hatching
  L.hatch([LEFT, TOP - 1, FRONT], [RIGHT - LEFT, 0, 0], [0, .95, 0], { gap: .24, w: .12, n: toward, step: 3, jitter: .2, trim: 0 });
  O.box([(LEFT + RIGHT) / 2, TOP - .55, (FRONT + BACK) / 2], [RIGHT - LEFT, 1.1, FRONT - BACK]);
  // the apron below, set back, with drawers either side of the knee hole
  const AP = FRONT - .5, A0 = TOP - 1.05, A1 = TOP - 3.9;
  for (const [x0, x1] of [[-30, -6.5], [6.5, 19]]) {
    L.quad([x0, A1, AP], [x1 - x0, 0, 0], [0, A0 - A1, 0], .32, toward, 2);
    L.quad([x0 + .4, A1 + .35, AP + .02], [x1 - x0 - .8, 0, 0], [0, A0 - A1 - .7, 0], .2, toward, 2);
    L.ring([(x0 + x1) / 2, (A0 + A1) / 2, AP + .1], .32, [1, 0, 0], [0, 1, 0], .4, 14, toward);
  }
  // wood grain on the top: long wavering strokes, seen where the lamp's pool lights them and hardly
  // at all beyond it
  const inPool = (x, z) => .12 + .88 * Math.exp(-((x - pool[0]) ** 2 + (z - pool[2]) ** 2 * 1.6) / 70);
  for (let z = BACK + .3; z < FRONT - .2; z += (hi ? .42 : .9) + R() * .3) {
    const ph = R() * 9, amp = .05 + R() * .1, fr = .05 + R() * .07, w = .26 + R() * .12;
    let prev = null;
    for (let x = LEFT; x <= RIGHT + .01; x += 1.4) {
      const p = [x, TOP, z + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 2.7 + ph * 1.3) * amp * .4];
      if (prev && R() > .1) L.seg(prev, p, w * inPool(prev[0], prev[2]), up, 0, w * inPool(x, p[2]));
      prev = p;
    }
  }

  // ---------- beyond the desk: a writing sheet's ruled lines running on into the dark ----------
  for (let z = BACK - 2.6, gap = 2.3; z > -120; z -= gap, gap *= 1.02) L.seg([-110, TOP, z], [90, TOP, z], .3, up, 10);
  L.paint = rgb('#E07A1F', 1.1);
  L.seg([-27, TOP, BACK - 1.4], [-27, TOP, -120], .5);
  L.seg([-27.5, TOP, BACK - 1.4], [-27.5, TOP, -120], .3);
  L.paint = null;

  // ---------- the lamp ----------
  L.column(foot, .5, 1.85, 1.75, { count: hi ? 30 : 16, w: .34, rings: 2, ringW: .5 });
  L.column([foot[0], TOP + .5, foot[2]], .6, .55, .48, { count: 10, w: .3, rings: 2, ringW: .35 });
  O.column(foot, .5, 1.75, 1.7);
  // the arms: paired rods, a spring coiled round the lower one, knuckles at the joints
  const rods = (a, b, gap = .17) => {
    const d = norm(sub(b, a)), side = norm(cross(d, view));
    L.seg(add(a, scale(side, gap)), add(b, scale(side, gap)), .44, null, 1.5);
    L.seg(add(a, scale(side, -gap)), add(b, scale(side, -gap)), .44, null, 1.5);
  };
  const shoulder = [foot[0], TOP + 1.1, foot[2]];
  rods(shoulder, elbow); rods(elbow, pivot, .14);
  {
    const d = norm(sub(elbow, shoulder)), [u, v] = basis(d), len = Math.hypot(...sub(elbow, shoulder));
    L.curve(t => { const a = t * Math.PI * 2 * 10; return add(add(shoulder, scale(d, len * (.14 + t * .5))), add(scale(u, Math.cos(a) * .34), scale(v, Math.sin(a) * .34))); }, 120, .26);
  }
  const [vu, vv] = basis(view);
  for (const k of [shoulder, elbow, pivot]) L.ring(k, .34, vu, vv, .45, 14);
  // the shade: a cone engraved along its length, warm at the rim from inside; a cap at its crown
  L.tube(apex, aim, 3, .55, 2.05, { count: hi ? 34 : 18, w: .36, rings: 4, ringW: .42 });
  L.tube(add(apex, scale(aim, -.5)), aim, .5, .32, .55, { count: 10, w: .3, rings: 1 });
  O.tube(apex, aim, 3, .52, 2.02, 18, true);
  // the bulb's light under the shade, the pool on the desk, and the warm air about them
  G.bill(bulb, [1.1, 1.1], [0, 0, 0], { lamp: 2.6, sharp: 5 });
  G.bill(add(mouth, scale(aim, .8)), [3.8, 3.8], [0, 0, 0], { lamp: .3, sharp: 2.6 });
  G.flat([pool[0], TOP + .03, pool[2]], [7.5, 0, 0], [0, 0, 5.5], [0, 0, 0], { lamp: .22, sharp: 1.7 });
  G.flat([pool[0], TOP + .04, pool[2]], [3.2, 0, 0], [0, 0, 2.4], [0, 0, 0], { lamp: .2, sharp: 2.3 });
  G.bill(add(bulb, scale(aim, 4.5)), [12, 12], [0, 0, 0], { lamp: .05, sharp: 1.4, clear: .6 });

  // ---------- the books in the lamplight, and the inkwell with its quill ----------
  const book = (c, s, yaw) => {
    const p = corners(c, s, yaw), f = [Math.sin(yaw), 0, Math.cos(yaw)];   // the spine faces the eye
    L.box(c, s, .46, 1.2, yaw);
    O.box(c, s, yaw);
    // the spine: raised bands, a title label between them
    for (const t of [-.62, -.22, .22, .62]) { L.seg(p(t - .03, -.86, 1), p(t - .03, .86, 1), .34, f); L.seg(p(t + .03, -.86, 1), p(t + .03, .86, 1), .2, f); }
    L.quad(p(-.18, -.5, 1), sub(p(.18, -.5, 1), p(-.18, -.5, 1)), sub(p(-.18, .5, 1), p(-.18, -.5, 1)), .28, f);
    // the fore edge: the leaves, set in from the boards
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    for (let j = -.72; j <= .72; j += hi ? .16 : .32) L.seg(p(.98, j, .9), p(.98, j, -.94), .15, r, 1.2);
    // the top board: a tooled frame
    const a = p(-.86, 1, -.86), b = p(.86, 1, -.86), d = p(-.86, 1, .86);
    L.quad(a, sub(b, a), sub(d, a), .22, up, 1.2);
  };
  book([-20.5, TOP + .6, -4.6], [6, 1.2, 7.8], .32);
  book([-20.8, TOP + 1.2 + .48, -4.9], [5.1, .96, 6.6], .2);
  const ink = [6.6, TOP, 1.6];
  L.column(ink, .9, 1.02, .96, { count: 18, w: .32, rings: 3, ringW: .42 });
  L.column([ink[0], TOP + .9, ink[2]], .4, .5, .46, { count: 10, w: .3, rings: 2, ringW: .38 });
  O.column(ink, .9, .98, .93);
  // the quill: a curving shaft with its vane of barbs, widest past the middle
  const qa = [ink[0] + .1, TOP + 1.25, ink[2]], qb = [ink[0] + 1.9, TOP + 8.2, ink[2] - 2.3], bow = [.7, 0, .3];
  const quill = t => add(add(qa, scale(sub(qb, qa), t)), scale(bow, Math.sin(t * Math.PI) * .7));
  L.curve(quill, 24, .5);
  for (let i = 0, n = hi ? 64 : 28; i < n; i++) {
    const t = .3 + .7 * i / n, p = quill(t), d = norm(sub(quill(Math.min(1, t + .02)), p)), side = norm(cross(d, view));
    const wv = Math.sin(Math.min(1, (t - .3) / .7) * Math.PI * .92) * (t > .55 ? 1 : .8) * 1.05;
    for (const sgn of [1, -1]) L.seg(p, add(add(p, scale(side, sgn * wv)), scale(d, -.42 * wv)), .2);
  }

  // ---------- the air ----------
  // a faint luminous haze far off over the ruled sheet, and dust turning in the lamp's cone
  G.flat([-20, TOP + 7, -95], [150, 0, 0], [0, 12, 0], rgb('#1E2F60', .07), { sharp: 1.2, clear: .25 });
  const vol = { a: mouth, b: [pool[0], TOP + .4, pool[2]], ra: 1.8, rb: 6.2, col: rgb('#F2B866'), k: .42 };
  const [cu, cv] = basis(norm(sub(vol.b, vol.a)));
  for (let i = 0, n = Math.round(1700 * q); i < n; i++) {
    const s = R(), r = (vol.ra + (vol.rb - vol.ra) * s) * Math.sqrt(R()) * 1.15, a = R() * Math.PI * 2;
    const p = add(add(vol.a, scale(sub(vol.b, vol.a), s)), add(scale(cu, Math.cos(a) * r), scale(cv, Math.sin(a) * r)));
    M.add(p, { size: .04 + R() * .05, col: [.003, .004, .007], bright: .4 + R() * .8, drift: [.3 + R() * .7, .2 + R() * .5, .3 + R() * .7], rate: .03 + R() * .06, phase: R() });
  }
  for (let i = 0, n = Math.round(700 * q); i < n; i++) {
    M.add([-34 + R() * 46, TOP + R() * 16, -18 + R() * 22], { size: .04 + R() * .04, col: [.005, .007, .012], bright: .5 + R() * .6, drift: [.6, .4, .6], rate: .02 + R() * .04, phase: R() });
  }

  return assemble(THREE, { id: 'desk', grade, stage, parts: { solids: O, glows: G, lines: [L], points: M }, volumes: [vol], lamp: '#F2B866', flicker: .04, t0 });
}
