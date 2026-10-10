/* The archive, for regulatory writing: an aisle of tall shelving units runs away to the left of the
   page into cool light, the stacks on both sides lined with binders (narrow spines, each with its
   label box) and archive boxes, hatching on the shadowed faces and on the end panels of each run,
   more rows of stacks receding beyond; a cool shaft from a high window falls diagonally across the
   aisle with dust turning in it and lays a patch of light on the parquet; a rolling ladder leans on
   the right-hand stack. Cool steel blue, quiet. */
import { random, rgb, lighting, strokes, solids, glows, shafts, points, assemble, norm, add, scale, basis, smooth } from './engrave.js';

export function archive(THREE, { quality = 'high' } = {}) {
  const t0 = performance.now();
  const hi = quality !== 'low', q = hi ? 1 : .35, R = random(202);
  const grade = { top: '#0C1B40', bottom: '#040A1A', fog: '#0E1D3E', fogDensity: .017, light: '#C9D8FF', glow: ['#1E3466', .45] };
  const stage = { anchor: [0, 0, 0], dir: [.1, .12, 1], fov: 44, size: [11, 13.4, 6] };

  // the aisle runs away from the eye at an angle, off to the left of the page: everything is laid
  // out in its own frame, u across it (toward the right-hand stack), v up, w down it
  const ANG = 26 * Math.PI / 180, Wd = [-Math.sin(ANG), 0, -Math.cos(ANG)], Ud = [Math.cos(ANG), 0, -Math.sin(ANG)];
  const at = (u, v, w) => [u * Ud[0] + w * Wd[0], v, u * Ud[2] + w * Wd[2]];
  const FLOOR = -11, TOPS = 16, HW = 10, DEEP = 4.4, BAY = 6.4, START = -2, END = 116, CROSS = 5, PITCH = 2.9, KICK = .55;
  const ST = hi ? 1 : 2.5;   // how finely long strokes are cut for the light to change along them

  // the shaft: a skylight high over the stacks throws its light down across the head of the aisle
  const SA = at(-26, 34, 30), SB = at(-3, FLOOR, 22), SR0 = 2.6, SR1 = 4.4;
  const sd = [SB[0] - SA[0], SB[1] - SA[1], SB[2] - SA[2]], sl2 = sd[0] * sd[0] + sd[1] * sd[1] + sd[2] * sd[2];
  const inShaft = (x, y, z) => {
    const t = ((x - SA[0]) * sd[0] + (y - SA[1]) * sd[1] + (z - SA[2]) * sd[2]) / sl2;
    if (t < 0 || t > 1.06) return 0;
    const r = SR0 + (SR1 - SR0) * Math.min(1, t), px = SA[0] + sd[0] * t - x, py = SA[1] + sd[1] * t - y, pz = SA[2] + sd[2] * t - z;
    return 1 - smooth(.5 * r, r, Math.hypot(px, py, pz));
  };
  const light = lighting({
    ink: rgb('#A9BDF2'), ambient: .26,
    moon: { dir: norm(sd), col: '#DCE6FF', k: 1.6, mask: inShaft },
    lamps: [{ p: at(0, 6, END + 6), k: 1.1, range: 34 }],   // the cool light at the aisle's end, which the far stacks catch
  });
  const L = strokes(light, R), O = solids(), G = glows(), S = shafts(), M = points();
  const up = [0, 1, 0], ahead = at(0, 0, -1), dU = at(1, 0, 0);

  // the runs of bays from a row's first end, a cross aisle after every fourth; the shelves' heights
  const runsFrom = start => {
    const runs = [];
    for (let w = start; w + BAY < END;) {
      const bays = [];
      for (let k = 0; k < 4 && w + BAY < END; k++) { bays.push([w, w + BAY]); w += BAY; }
      runs.push(bays);
      w += CROSS;
    }
    return runs;
  };
  const shelvesY = [];
  for (let y = FLOOR + KICK; y < TOPS - 1; y += PITCH) shelvesY.push(y);

  // one face of a stack (u = fu, turned toward n): shelves, uprights, and what stands on the shelves;
  // rich says how much of it is drawn (1 everything, 0 the frame alone)
  const face = (runs, fu, n, rich) => {
    const first = runs[0][0][0];
    runs.forEach(bays => bays.forEach(([wa, wb]) => {
      const detail = rich * Math.max(0, 1 - Math.max(0, wa - (hi ? 30 : 8)) / (hi ? 60 : 24)) * (hi ? 1 : .8);
      for (const wu of [wa, wb]) { L.seg(at(fu, FLOOR, wu + .18), at(fu, TOPS, wu + .18), .4, n, 3 * ST); L.seg(at(fu, FLOOR, wu - .18), at(fu, TOPS, wu - .18), .26, n, 3 * ST); }
      shelvesY.forEach((y, si) => {
        L.seg(at(fu, y, wa + .2), at(fu, y, wb - .2), .44, n, 2 * ST);
        L.seg(at(fu, y - .16, wa + .2), at(fu, y - .16, wb - .2), .24, n, 2 * ST);
        if (si === shelvesY.length - 1 || R() > detail * 1.15) return;
        const top = (shelvesY[si + 1] ?? TOPS) - .16;
        let w = wa + .25;
        while (w < wb - .55) {
          const kind = R();
          if (kind < .07) { w += .3 + R() * .8; continue; }   // a gap
          if (kind < .19) {
            // an archive box: wide, with a hand hole and a label
            const wd = 1.5 + R() * .4, h = (top - y) * (.62 + R() * .1);
            if (w + wd > wb - .3) break;
            L.quad(at(fu, y, w), at(0, 0, wd), [0, h, 0], .34, n);
            L.quad(at(fu, y + h * .52, w + wd * .2), at(0, 0, wd * .6), [0, h * .22, 0], .22, n);
            L.ring(at(fu, y + h * .25, w + wd / 2), .2, dU, up, .28, 8, n);
            w += wd + .04;
            continue;
          }
          // a binder: a narrow spine, its label box and finger hole
          const wd = .42 + R() * .3, h = (top - y) * (.74 + R() * .2);
          if (w + wd > wb - .25) break;
          const lean = kind > .96 ? .35 : 0;
          L.seg(at(fu, y, w + wd), at(fu, y + h, w + wd - lean), .3, n);
          L.seg(at(fu, y + h, w - lean), at(fu, y + h, w + wd - lean), .3, n);
          if (detail > (hi ? .35 : .6)) {
            L.quad(at(fu, y + h * .52, w + wd * .16 - lean * .5), at(0, 0, wd * .68), [0, h * .25, 0], .2, n);
            if (hi && R() < .6) L.seg(at(fu, y + h * .16, w + wd * .5), at(fu, y + h * .16 + .22, w + wd * .5), .18, n);
          }
          w += wd;
        }
      });
    }));
    // the cornice along the top and the plinth along the foot
    L.seg(at(fu, TOPS, first), at(fu, TOPS, END), .48, n, 3); L.seg(at(fu, TOPS - .35, first), at(fu, TOPS - .35, END), .28, n, 3);
    L.seg(at(fu, FLOOR, first), at(fu, FLOOR, END), .38, n, 3); L.seg(at(fu, FLOOR + KICK, first), at(fu, FLOOR + KICK, END), .28, n, 3);
  };
  // a row of stacks between u0 and u1: solid, the near end panel of each run framed, its face left
  // in shadow with only a few faint strokes, and a label holder
  const row = (runs, u0, u1) => {
    runs.forEach(bays => {
      const w0 = bays[0][0], w1 = bays[bays.length - 1][1], uc = (u0 + u1) / 2;
      O.box(at(uc, (FLOOR + TOPS) / 2, (w0 + w1) / 2), [u1 - u0, TOPS - FLOOR, w1 - w0], ANG);
      L.quad(at(u0, FLOOR, w0), at(u1 - u0, 0, 0), [0, TOPS - FLOOR, 0], .36, ahead, 2);
      L.quad(at(u0 + .45, FLOOR + .6, w0 - .01), at(u1 - u0 - .9, 0, 0), [0, TOPS - FLOOR - 1.2, 0], .16, ahead, 2);
      L.hatch(at(u0, FLOOR, w0 - .02), at(u1 - u0, 0, 0), [0, TOPS - FLOOR, 0], { angle: 1.1, gap: hi ? .5 : .9, w: .05, n: ahead, step: 4, trim: .5 });
      L.quad(at(uc - .9, 6, w0 - .03), at(1.8, 0, 0), [0, 1.1, 0], .3, ahead);
    });
  };
  // the eye stands almost in the plane of the left-hand stack's face, so that face is seen edge on;
  // the next row over shows its face across the neighbouring aisle, and one more beyond it
  const NEXT = -HW - DEEP - 2 * HW, near = runsFrom(START), back = runsFrom(START + 10), left = runsFrom(34);
  row(near, HW, HW + DEEP); face(near, HW, at(-1, 0, 0), 1);
  row(left, -HW - DEEP, -HW);   // its face is edge on to the eye: drawn, its strokes would pile into one bright line
  row(back, NEXT - DEEP, NEXT); face(back, NEXT, at(1, 0, 0), .45);
  row(back, NEXT - DEEP - 2 * HW - DEEP, NEXT - DEEP - 2 * HW); face(back, NEXT - DEEP - 2 * HW, at(1, 0, 0), .2);

  // the floor: parquet planks running down the aisles, plank ends staggered, fainter out in front
  for (const [u0, u1, k] of [[-HW, HW, 1], [-HW - DEEP - 2 * HW, -HW - DEEP, .6]]) {
    for (let u = u0, i = 0; u <= u1 + .01; u += .9, i++) {
      L.seg(at(u, FLOOR, -16), at(u, FLOOR, START), .12 * k, up, 3);
      L.seg(at(u, FLOOR, START), at(u, FLOOR, END), .22 * k, up, 1.8 * ST);
      for (let w = START + (i % 3) * 1.9 + R() * 1.2; w < END; w += 4.6 + R() * 1.6) L.seg(at(u, FLOOR, w), at(Math.min(u1, u + .9), FLOOR, w), .18 * k, up);
    }
  }
  // beams across the ceiling, high in the dark, receding with the aisle
  for (let w = START; w < END; w += BAY * 2) { L.seg(at(-HW - DEEP, TOPS + 6, w), at(HW + DEEP, TOPS + 6, w), .3, [0, -1, 0], 3); L.seg(at(-HW - DEEP, TOPS + 5.3, w), at(HW + DEEP, TOPS + 5.3, w), .18, [0, -1, 0], 3); }

  // the rolling ladder on the right-hand stack, hooked on a rail along the top
  {
    const wl = .6, span = 2.3, foot = HW - 2.6, head = HW - .3, yh = TOPS - .6, n = at(-1, 0, 0);
    L.seg(at(HW - .25, yh + .3, START), at(HW - .25, yh + .3, END), .36, n, 3);
    for (const w of [wl, wl + span]) {
      L.seg(at(foot, FLOOR + .5, w), at(head, yh, w), .5, n, 2);
      L.seg(at(foot - .22, FLOOR + .5, w), at(head - .22, yh, w), .3, n, 2);
      L.ring(at(foot - .1, FLOOR + .32, w), .3, dU, up, .34, 12);
      L.seg(at(head, yh, w), at(head + .1, yh + .55, w), .4);
    }
    for (let y = FLOOR + 1.6; y < yh - .4; y += 1.15) {
      const t = (y - FLOOR - .5) / (yh - FLOOR - .5), u = foot + (head - foot) * t;
      L.seg(at(u - .11, y, wl), at(u - .11, y, wl + span), .4, n);
    }
  }

  // the shaft, its patch on the floor, the window it comes through, and the dust turning in it
  S.add(SA, SB, SR0 * .9, SR1, rgb('#9DB4F0', .13));
  S.add(add(SA, [0, -1, 0]), add(SB, at(.4, 0, .5)), SR0 * .5, SR1 * .55, rgb('#C9D8FF', .08));
  G.flat(add(SB, [0, .03, 0]), scale(dU, SR1 * 1.3), scale(norm(at(0, 0, 1)), SR1 * 1.6), rgb('#B8CBFA', .1), { sharp: 1.7, clear: .8 });
  const vol = { a: SA, b: SB, ra: SR0, rb: SR1, col: rgb('#C9D8FF'), k: .45 };
  const [su, sv] = basis(norm(sd));
  for (let i = 0, n = Math.round(2000 * q); i < n; i++) {
    const t = R(), r = (SR0 + (SR1 - SR0) * t) * Math.sqrt(R()), a = R() * Math.PI * 2;
    M.add(add(add(SA, scale(sd, t)), add(scale(su, Math.cos(a) * r), scale(sv, Math.sin(a) * r))), { size: .06 + R() * .06, col: [.003, .004, .008], bright: .5 + R() * .7, drift: [.5 + R() * .8, .3 + R() * .6, .5 + R() * .8], rate: .02 + R() * .05, phase: R() });
  }
  for (let i = 0, n = Math.round(1200 * q); i < n; i++) {
    M.add(at(-HW + R() * HW * 2, FLOOR + R() * 26, START + R() * 70), { size: .05 + R() * .05, col: [.005, .007, .013], bright: .5 + R() * .6, drift: [.6, .4, .6], rate: .02 + R() * .03, phase: R() });
  }

  // the aisle's air: banks of cool haze deeper and deeper down it, and the light at its end, which
  // the stacks' solid shapes frame
  for (const w of [24, 48, 72, 96]) G.flat(at(0, 3, w), scale(dU, HW), [0, 15, 0], rgb('#24396F', .05 + w * .0006), { sharp: 1.1, clear: .2 });
  // the end wall's tall window, its glass bright, and its light spreading softly through the haze
  {
    const we = END + 2, ww = 7, sill = -6, spring = 10.5, n = at(0, 0, -1);
    const win = (x, y) => at(x, sill + y, we);
    const out = [[ww / 2, 0], [ww / 2, spring - sill], ...Array.from({ length: 15 }, (_, i) => { const a = Math.PI * (i + 1) / 16; return [Math.cos(a) * ww / 2, spring - sill + Math.sin(a) * ww / 2]; }), [-ww / 2, spring - sill], [-ww / 2, 0]];
    L.paint = rgb('#C9D8FF', 2.2);
    L.poly(out.map(([x, y]) => win(x, y)), .5, n, true);
    L.hatch(win(-ww / 2, 0), at(ww, 0, 0), [0, spring - sill + ww / 2, 0], { angle: 1.2, gap: .35, w: .4, shape: out.map(([x, y]) => [x + ww / 2, y]), jitter: .2, trim: .2 });
    L.paint = null;
    for (const x of [-ww / 6, ww / 6]) L.seg(win(x, 0), win(x, spring - sill + 3), .3);
    G.flat(at(0, 4, we + 1), scale(dU, 15), [0, 24, 0], rgb('#7F98DA', .11), { sharp: .9, clear: .3, fog: false });
    G.flat(at(0, 3, we + .5), scale(dU, 7), [0, 12, 0], rgb('#B8CBFA', .12), { sharp: 1.6, clear: .3, fog: false });
  }

  return assemble(THREE, { id: 'archive', grade, stage, parts: { solids: O, glows: G, lines: [L], shafts: S, points: M }, volumes: [vol], lamp: '#C9D8FF', flicker: 0, t0 });
}
