/* The lecture room (site/docs/redesign-plan.md, 11.12 and 11.18): north of the reading room, through its
   north door. 05, Medical communications, at dawn. The compass: -z is south, +x west, -x east. The camera
   comes in through the door in the south wall's east end and the chapter rests at the back of the room,
   looking north to the stage: the lectern, the panel's table and the projection screen over them, the
   dawn coming in through three tall windows in the east wall.
   - Walls of warm plaster over an oak dado; a beamed ceiling; a cornice.
   - The stage across the north end, its steps at either side; over it the room's name in gilt.
   - Two blocks of seats facing the stage, a middle aisle, and aisles along both walls.
   - By the door, a side table and a rack of leaflets on the wall above it; in the west wall, the door on
     to the seminar room (06), shut.
   - Six opal globe lamps, the house lights (off at dawn; on when the talk begins).
   05's work, the things that move, is in comms.js. Units as the house's (about 10 cm). Everything static
   is merged with the house (kit.js, bake). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, oakTex, boardsTex, contact, canvasTex } from './kit.js';
import { GARDEN } from './outside.js';
import { READING } from './reading.js';

export const LECTURE = {
  // (at the house's scale, a unit about 10 cm: a room 5.6 m wide (wider than the reading room, west of it: aisles
  // of 76 cm either side of the seats, the west door clear), 7.1 m deep, 4.5 m to the ceiling)
  X0: -156, X1: -100, Z1: READING.Z0 + READING.T, Z0: 44, FLOOR: -7.5, T: .6, TOP: 38,
  // the stage: from z to the north wall, its height (50 cm)
  STAGE: { z: 30, h: 5 },
  // the east windows: their middles along z, width, sill, the spring of the round head
  EWINS: [-12, 8, 28], EWIN: { w: 7.2, y0: 2, y1: 22 },
  // the rows of seats (their middles along z, front first; 96 cm apart), the seats' pitch (56 cm), the
  // middle aisle's half width, seats to a row on either side
  ROWS: [21, 11.4, 1.8, -7.8, -17.4], PITCH: 5.6, AISLE: 3.6, PER: 3,
  // the door on to the seminar room, in the west wall
  WDOOR: { z: 18, w: 8, top: 13 },
};
LECTURE.XM = (LECTURE.X0 + LECTURE.X1) / 2;
LECTURE.ZM = (LECTURE.Z0 + LECTURE.Z1) / 2;
LECTURE.STAGE.top = LECTURE.FLOOR + LECTURE.STAGE.h;
// the seats: each { x, z } (facing north), the front row first
LECTURE.SEATS = LECTURE.ROWS.flatMap(z => [-1, 1].flatMap(b => Array.from({ length: LECTURE.PER }, (_, i) => ({ x: LECTURE.XM + b * (LECTURE.AISLE + LECTURE.PITCH / 2 + i * LECTURE.PITCH), z, row: LECTURE.ROWS.indexOf(z) }))));
// the side table by the door, against the south wall (its top's middle, size, height)
// (against the west wall, under the posters, read by someone facing west; w across from the wall, d along it)
LECTURE.SIDE = { x: LECTURE.X1 - 2.5, z: -10, w: 4.4, d: 9, top: LECTURE.FLOOR + 7.5 };

export function buildLecture({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, T, TOP, XM: xm, ZM: zm } = LECTURE, W = X1 - X0, D = Z0 - Z1;
  const wallMat = mat('#EADFCB', { map: plasterTex('#EADFCB', 23), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });
  const oak = mat('#9C774F', { map: oakTex('#9C774F', '#5A402A', 43), r: .62 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 47), r: .64 });
  const brass = mat(PAL.gold, { r: .32, m: .85 });

  // ---------- the floor, the walls (their openings cut through), the plinth, the roof ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#86684C', { map: boardsTex('#86684C', '#52402C', 29), r: .76 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(xm, FLOOR, zm); G.add(floor);
    const wall = (len, holes, place) => {
      const s = new THREE.Shape([new THREE.Vector2(0, FLOOR), new THREE.Vector2(len, FLOOR), new THREE.Vector2(len, TOP), new THREE.Vector2(0, TOP)]);
      for (const h of holes) {
        const p = new THREE.Path();
        if (h.head === false) { p.moveTo(h.u - h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y0); }
        else { p.moveTo(h.u - h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y1); p.absarc(h.u, h.y1, h.w / 2, 0, Math.PI, false); p.lineTo(h.u - h.w / 2, h.y0); }
        s.holes.push(p);
      }
      const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 20 });
      { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / len, (uv.getY(i) - FLOOR) / (TOP - FLOOR)); }
      place(g);
      G.add(shadows(new THREE.Mesh(g, wallMat)));
    };
    const EW = LECTURE.EWIN, WD = LECTURE.WDOOR;
    // north (its face at Z0, looking south; u runs west from the east wall: x = X0 + u)
    wall(W + 2 * T, [], g => { g.translate(X0 - T, 0, Z0); });   // (past both side walls: no seam at the corners)
    // east (its face at X0, looking west; u runs north from the south wall: z = Z1 - T + u)
    wall(D + 2 * T, LECTURE.EWINS.map(z => ({ u: z - Z1 + T, w: EW.w, y0: EW.y0, y1: EW.y1 })), g => { g.rotateY(-Math.PI / 2); g.translate(X0, 0, Z1 - T); });
    // west (its face at X1, looking east; u runs south from the north wall: z = Z0 + T - u; the extrusion
    // runs west, outward, so its inner face is at X1)
    wall(D + 2 * T, [{ u: Z0 + T - WD.z, w: WD.w, y0: FLOOR, y1: WD.top, head: false }], g => { g.rotateY(Math.PI / 2); g.translate(X1, 0, Z0 + T); });
    // south: its own face over the reading room's north wall (that wall is the reading room's, not drawn
    // while the reading room is out of sight), the door's opening cut through; u runs east from the west wall
    { const ND = READING.NDOOR; wall(W, [{ u: X1 - ND.x, w: ND.w, y0: FLOOR, y1: ND.top, head: false }], g => { g.rotateY(Math.PI); g.translate(X1, 0, Z1 + .03); }); }
    G.add(shadows(at(box(W + 2 * T + .6, FLOOR - .3 - GARDEN, D + T + .6, mat('#CEC4B1', { r: .92 })), xm, (FLOOR - .3 + GARDEN) / 2, zm + T / 2)));
    G.add(shadows(at(box(W + 2 * T + .6, .5, D + 2 * T, mat('#6B7385', { r: .8 })), xm, TOP + .25, zm)));
    const par = mat('#CEC4B1', { r: .92 });
    for (const [w, d, x, z] of [[W + 2 * T + 1.2, 1, xm, Z0 + T + .3], [1, D + 2 * T, X0 - T - .3, zm], [1, D + 2 * T, X1 + T + .3, zm]]) G.add(shadows(at(box(w, 2.2, d, par), x, TOP + 1.1, z)));
  }

  // ---------- the dado: oak panelling round the walls to sill height, a rail along its top ----------
  {
    const DH = 9, run = (x0, z0, x1, z1, skip = []) => {
      const len = Math.hypot(x1 - x0, z1 - z0), alongX = z0 === z1, n = Math.max(1, Math.round(len / 3.6));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, cx = x0 + (x1 - x0) * (t0 + t1) / 2, cz = z0 + (z1 - z0) * (t0 + t1) / 2, pl = len / n;
        if (skip.some(([a, b]) => (alongX ? cx : cz) > a && (alongX ? cx : cz) < b)) continue;
        const inward = alongX ? (z0 === Z0 ? -1 : 1) : (x0 === X0 ? 1 : -1);
        const put = (w, h, d, m, y, off) => G.add(at(rbox(alongX ? w : d, h, alongX ? d : w, .03, m), alongX ? cx : x0 + inward * off, y, alongX ? z0 + inward * off : cz));
        put(pl, DH, .14, oak, FLOOR + DH / 2, .07);
        put(pl - .7, DH - 1.4, .08, darkOak, FLOOR + DH / 2 + .1, .17);
      }
      const put2 = (w, h, d, y, off) => G.add(at(rbox(alongX ? w : d, h, alongX ? d : w, .03, trim), (x0 + x1) / 2 + (alongX ? 0 : (x0 === X0 ? 1 : -1) * off), y, (z0 + z1) / 2 + (alongX ? (z0 === Z0 ? -1 : 1) * off : 0)));
      if (!skip.length) put2(len, .3, .3, FLOOR + DH + .1, .15);
    };
    const EW = LECTURE.EWIN, WD = LECTURE.WDOOR;
    run(X0, Z0, X1, Z0);
    run(X0, Z1, X0, Z0, LECTURE.EWINS.map(z => [z - EW.w / 2 - .6, z + EW.w / 2 + .6]));
    run(X1, Z1, X1, Z0, [[WD.z - WD.w / 2 - .6, WD.z + WD.w / 2 + .6]]);
    run(X0, Z1 + .02, X1, Z1 + .02, [[READING.NDOOR.x - READING.NDOOR.w / 2 - .9, READING.NDOOR.x + READING.NDOOR.w / 2 + .9]]);
    // (the rail along the east and west walls, in lengths between their openings)
    for (const [x, inward, gaps] of [[X0, 1, LECTURE.EWINS.map(z => [z - EW.w / 2 - .6, z + EW.w / 2 + .6])], [X1, -1, [[WD.z - WD.w / 2 - .6, WD.z + WD.w / 2 + .6]]]]) {
      let a = Z1; for (const [g0, g1] of [...gaps, [Z0, Z0]]) { if (g0 > a + .2) G.add(at(rbox(.3, .3, g0 - a, .03, trim), x + inward * .15, FLOOR + DH + .1, (a + g0) / 2)); a = g1; }
    }
    // the cornice round the ceiling
    for (const [w, d, x, z] of [[W, .9, xm, Z0 - .45], [W, .9, xm, Z1 + .45], [.9, D, X0 + .45, zm], [.9, D, X1 - .45, zm]]) G.add(at(rbox(w, .9, d, .2, trim), x, TOP - .45, z));
  }

  // ---------- the ceiling: plaster between oak beams running east and west ----------
  {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#F1EADD', { map: plasterTex('#F1EADD', 31), r: .95, side: THREE.BackSide }));
    ceil.rotation.x = -Math.PI / 2; ceil.position.set(xm, TOP - .06, zm);   // (just under the roof's slab: never the same height, which flickers) ceil.receiveShadow = true; G.add(ceil);
    for (let i = 1; i < 6; i++) { const z = Z1 + D * i / 6; G.add(at(rbox(W, 1.6, 1.4, .1, darkOak), xm, TOP - .8, z)); }
  }

  // ---------- the windows: three tall round-headed windows in the east wall, for the dawn ----------
  {
    const fr = mat('#F1ECE2', { r: .6 }), glassMat = new THREE.MeshPhysicalMaterial({ color: '#C9D6E8', roughness: .05, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    const { w, y0, y1 } = LECTURE.EWIN;
    for (const z of LECTURE.EWINS) {
      const parts = [], cas = .55, bar = (bw, bh, ba, by) => parts.push(at(rbox(bw, bh, .12, .02, fr), ba, by, .3));
      const arch = (r, th, zz) => { const pts = []; for (let i = 0; i <= 28; i++) { const a = Math.PI * i / 28; pts.push(new THREE.Vector3(Math.cos(a) * r, y1 + Math.sin(a) * r, zz)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, th, 6, false), trim); };
      parts.push(at(rbox(cas, y1 - y0, .3, .05, trim), -w / 2 - cas / 2, (y0 + y1) / 2, -.1), at(rbox(cas, y1 - y0, .3, .05, trim), w / 2 + cas / 2, (y0 + y1) / 2, -.1));
      parts.push(arch(w / 2 + cas / 2, cas / 2, -.1));
      parts.push(at(rbox(w + 1.6, .34, 1.2, .06, trim), 0, y0 - .17, -.45));
      bar(.2, y1 - y0, 0, (y0 + y1) / 2);
      for (const ty of [y0 + (y1 - y0) * .25, y0 + (y1 - y0) * .5, y0 + (y1 - y0) * .75, y1]) bar(w, .14, 0, ty);
      for (let i = 1; i < 4; i++) { const a = Math.PI * i / 4, len = w / 2; parts.push(at(rbox(.1, len, .1, .02, fr), Math.cos(a) * len / 2, y1 + Math.sin(a) * len / 2, .3, { z: a - Math.PI / 2 })); }
      parts.push(arch(w / 2 - .05, .09, .3));
      const gs = new THREE.Shape(); gs.moveTo(-w / 2, y0); gs.lineTo(w / 2, y0); gs.lineTo(w / 2, y1); gs.absarc(0, y1, w / 2, 0, Math.PI, false); gs.lineTo(-w / 2, y0);
      const glass = new THREE.Mesh(new THREE.ShapeGeometry(gs, 14), glassMat); glass.position.z = .38; glass.userData.noG = true; parts.push(glass);
      const g = group(...parts); g.rotation.y = -Math.PI / 2; g.position.set(X0 - .02, 0, z);
      parts.forEach(p => { if (p.isMesh && p !== glass) { p.castShadow = true; p.receiveShadow = true; } });
      G.add(g);
    }
  }

  // ---------- the stage across the north end: its platform, its front, a step at either side ----------
  {
    const S = LECTURE.STAGE, sd = Z0 - S.z;
    G.add(shadows(at(box(W - 1.2, S.h, sd, mat('#7A5A3C', { map: boardsTex('#7A5A3C', '#4E3824', 37), r: .7 })), xm, FLOOR + S.h / 2, S.z + sd / 2)));
    G.add(at(rbox(W - 1, .22, .4, .06, trim), xm, S.top + .02, S.z - .1));
    // (its front panelled, as the dado)
    const n = 12;
    for (let i = 0; i < n; i++) G.add(at(rbox((W - 1.2) / n - .5, S.h - .5, .08, .03, darkOak), X0 + .6 + (W - 1.2) * (i + .5) / n, FLOOR + S.h / 2, S.z - .04));
    // (two steps up at either side, 25 cm each)
    for (const s of [-1, 1]) for (const [sh, sd] of [[S.h / 2, 6], [S.h, 3]]) G.add(at(rbox(4.5, sh, sd, .05, darkOak), xm + s * (W / 2 - 4.2), FLOOR + sh / 2, S.z - sd / 2));
    // the room's name over the stage, high on the north wall, gilt on a dark panel
    const t = 'MEDICAL COMMUNICATIONS', TW = 2400, TH = 240;
    const tex = canvasTex(TW, TH, (c, Wc, Hc) => {
      c.fillStyle = '#2B2219'; c.fillRect(0, 0, Wc, Hc);
      c.strokeStyle = 'rgba(201,164,92,.75)'; c.lineWidth = 6; c.strokeRect(14, 14, Wc - 28, Hc - 28);
      c.strokeStyle = 'rgba(201,164,92,.35)'; c.lineWidth = 2; c.strokeRect(30, 30, Wc - 60, Hc - 60);
      const gr = c.createLinearGradient(0, Hc * .25, 0, Hc * .75); gr.addColorStop(0, '#F1DA9C'); gr.addColorStop(.5, '#C9A45C'); gr.addColorStop(1, '#9C7A38');
      c.fillStyle = gr; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '26px';
      let fs = 124; c.font = `600 ${fs}px Georgia, serif`;
      while (c.measureText(t).width > Wc - 200) { fs -= 2; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(t, Wc / 2 + 13, Hc / 2 + 6);
    });
    const IW = 18, IH = IW * TH / TW, IY = 35;
    const ins = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), mat('#FFFFFF', { map: tex, r: .45, m: .2 }));
    ins.rotation.y = Math.PI; ins.position.set(xm, IY, Z0 - .16); G.add(ins);
    for (const dy of [-1, 1]) G.add(at(rbox(IW + .5, .22, .3, .05, darkOak), xm, IY + dy * (IH / 2 + .11), Z0 - .15));
    for (const dx of [-1, 1]) G.add(at(rbox(.25, IH + .66, .3, .05, darkOak), xm + dx * (IW / 2 + .12), IY, Z0 - .15));
  }

  // ---------- the seats: upholstered, on oak standards, a writing tablet on each right arm ----------
  {
    const fabric = mat('#2C4566', { r: .9 }), fabric2 = mat('#263C5A', { r: .9 });
    for (const s of LECTURE.SEATS) {
      const c = new THREE.Group();
      // (a real seat: 56 cm across, its seat 46 cm up, its back to 98 cm, its arms 66 cm)
      for (const sx of [-1, 1]) {
        c.add(at(rbox(.4, 6.3, 5.2, .1, darkOak), sx * 2.6, 3.15, -.2));
        c.add(at(rbox(.7, .35, 5.2, .12, oak), sx * 2.6, 6.45, -.2));
      }
      c.add(at(rbox(4.7, 1.0, 4.4, .35, fabric), 0, 4.2, .3));
      c.add(at(rbox(4.7, 5.4, .9, .35, fabric2), 0, 7.6, -2.1, { x: -.13 }));
      c.add(at(rbox(4.8, .3, 1.0, .08, darkOak), 0, 10.4, -2.45, { x: -.13 }));
      // (the tablet: on the front row laid out flat to write on, the booklets on it; elsewhere folded down
      // beside the arm)
      if (s.row === 0) c.add(at(rbox(3.6, .16, 2.8, .06, oak), 1.1, 6.95, 2.9));
      else c.add(at(rbox(.16, 2.8, 3.0, .06, oak), 3.0, 4.9, .6));
      c.position.set(s.x, FLOOR, s.z);
      G.add(c);
    }
    G.add(contact(W - 6, LECTURE.ROWS[0] - LECTURE.ROWS[LECTURE.ROWS.length - 1] + 3, xm, (LECTURE.ROWS[0] + LECTURE.ROWS[LECTURE.ROWS.length - 1]) / 2, { y: FLOOR, k: .14 }));
  }

  // ---------- by the door: the side table, the rack of leaflets on the wall over it ----------
  {
    const S = LECTURE.SIDE, h = S.top - FLOOR;
    G.add(at(rbox(S.w, .35, S.d, .08, oak), S.x, S.top - .175, S.z));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.55, h - .35, .55, .08, darkOak), S.x + sx * (S.w / 2 - .5), FLOOR + (h - .35) / 2, S.z + sz * (S.d / 2 - .5)));
    G.add(at(rbox(S.w - 1, .9, S.d - 1, .06, darkOak), S.x, S.top - .8, S.z));
    G.add(contact(S.w + 1, S.d + 1, S.x, S.z, { y: FLOOR, k: .22 }));
  }

  // ---------- the west wall: congress posters MeWriT wrote, framed (the deck: 30 original research
  // presentations at national and international meetings), a brass plate under them ----------
  {
    const TOPICS = [['Once-daily treatment and major events', 'A randomised, placebo-controlled trial'], ['Real-world outcomes after approval', 'A registry of ten thousand patients'], ['Pooled safety across four trials', 'An integrated analysis']];
    const posterTex = (t, s, i) => canvasTex(840, 1190, (c, W, H) => {
      c.fillStyle = '#FBF8F1'; c.fillRect(0, 0, W, H);
      const col = ['#1E5A63', '#24345E', '#7A2E2A'][i];
      c.fillStyle = col; c.fillRect(0, 0, W, 210);
      c.fillStyle = '#F4EEE2'; c.font = '600 46px Georgia, serif';
      const words = t.split(' '); let line = '', y = 84;
      for (const w of words) { const tt = line ? line + ' ' + w : w; if (c.measureText(tt).width > W - 80) { c.fillText(line, 40, y); y += 54; line = w; } else line = tt; }
      c.fillText(line, 40, y);
      c.font = 'italic 400 26px Georgia, serif'; c.fillStyle = 'rgba(244,238,226,.85)'; c.fillText(s, 40, 190);
      // three columns: background, methods, results with a chart, conclusions
      const colW = (W - 120) / 3;
      for (let k = 0; k < 3; k++) {
        const x = 40 + k * (colW + 20);
        c.fillStyle = col; c.font = '600 22px Georgia, serif'; c.fillText(['BACKGROUND', 'RESULTS', 'CONCLUSIONS'][k], x, 260);
        c.fillStyle = 'rgba(43,53,80,.55)';
        for (let r = 0; r < 26; r++) if (!(k === 1 && r > 2 && r < 14)) c.fillRect(x, 282 + r * 26, colW * (r % 7 === 6 ? .6 : .96), 7);
      }
      const fx = 40 + colW + 20, fy = 380;
      c.strokeStyle = 'rgba(19,36,79,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + 260); c.lineTo(fx + colW, fy + 260); c.stroke();
      c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(fx + 4, fy + 10); for (let q = 1; q <= 10; q++) c.lineTo(fx + 4 + q * (colW - 10) / 10, fy + 10 + 200 * (1 - Math.exp(-q / (3 + i)))); c.stroke();
      c.fillStyle = 'rgba(19,36,79,.08)'; c.fillRect(40, H - 140, W - 80, 90);
      c.fillStyle = '#B4500F'; c.font = '600 26px Georgia, serif'; c.fillText('Writing support: MeWriT', 64, H - 86);
      c.fillStyle = 'rgba(19,36,79,.55)'; c.font = '500 20px Georgia, serif'; c.fillText('Presented at an international congress · illustrative', 64, H - 58);
    });
    const PW = 8.4, PH = 11.9, PY = 9.6;
    [-16, -4, 8].forEach((z, i) => {
      const fr = group(at(rbox(.3, PH + .9, PW + .9, .08, darkOak), 0, 0, 0));
      const p = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat('#FFFFFF', { map: posterTex(...TOPICS[i], i), r: .8 }));
      p.rotation.y = -Math.PI / 2; p.position.x = -.17; fr.add(p);
      fr.position.set(X1 - .2, PY, z); G.add(fr);
    });
    const plateTex = canvasTex(1400, 120, (c, Wc, Hc) => {
      const gr = c.createLinearGradient(0, 0, 0, Hc); gr.addColorStop(0, '#E2C784'); gr.addColorStop(.5, '#C9A45C'); gr.addColorStop(1, '#A9843E');
      c.fillStyle = gr; c.fillRect(0, 0, Wc, Hc);
      c.strokeStyle = 'rgba(80,55,20,.6)'; c.lineWidth = 4; c.strokeRect(10, 10, Wc - 20, Hc - 20);
      c.fillStyle = '#3A2810'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 54; c.font = `600 ${fs}px Georgia, serif`; const t = '30 RESEARCH PRESENTATIONS  ·  WRITTEN WITH MEWRIT';
      while (c.measureText(t).width > Wc - 80) { fs--; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(t, Wc / 2, Hc / 2 + 2);
    });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.2), mat('#FFFFFF', { map: plateTex, r: .35, m: .6 }));
    pl.rotation.y = -Math.PI / 2; pl.position.set(X1 - .05, PY - PH / 2 - 1.6, -4); G.add(pl);
  }
  // ---------- a picture rail and a painted frieze round the room, under the cornice ----------
  {
    const frieze = mat('#C9B48E', { r: .9 });
    for (const [w, d, x, z] of [[W, .1, xm, Z0 - .05], [W, .1, xm, Z1 + .08], [.1, D, X0 + .05, zm], [.1, D, X1 - .05, zm]]) {
      G.add(at(rbox(w, 2.4, d, .02, frieze), x, TOP - 2.4, z));
      G.add(at(rbox(w > 1 ? w : .3, .3, d > 1 ? d : .3, .05, trim), x, TOP - 3.75, z));
    }
  }

  // ---------- the reading room's north door, from this side: its architrave ----------
  {
    const ND = READING.NDOOR, x = ND.x, w = ND.w, dh = ND.top - FLOOR, z = Z1 + .15;
    G.add(at(rbox(.7, dh + .7, .2, .05, trim), x - w / 2 - .35, FLOOR + (dh + .7) / 2, z), at(rbox(.7, dh + .7, .2, .05, trim), x + w / 2 + .35, FLOOR + (dh + .7) / 2, z));
    G.add(at(rbox(w + 1.4, .7, .2, .05, trim), x, ND.top + .35, z));
  }

  // ---------- the door on to the seminar room (06), in the west wall: hinged at its south jamb, opening
  // west into the seminar room (doorW.set(u): 0 shut, 1 open); its leaf in its own group, drawn whichever
  // room is drawn ----------
  const doorGroup = new THREE.Group(); doorGroup.userData.keep = true;
  let doorW = null;
  {
    const WD = LECTURE.WDOOR, dh = WD.top - FLOOR, x = X1;
    for (const dz of [-1, 1]) G.add(at(rbox(.2, dh + .7, .7, .05, trim), x - .05, FLOOR + (dh + .7) / 2, WD.z + dz * (WD.w / 2 + .35)));
    G.add(at(rbox(.2, .7, WD.w + 1.4, .05, trim), x - .05, WD.top + .35, WD.z));
    // (and on the seminar room's side)
    for (const dz of [-1, 1]) G.add(at(rbox(.2, dh + .7, .7, .05, trim), x + T + .05, FLOOR + (dh + .7) / 2, WD.z + dz * (WD.w / 2 + .35)));
    G.add(at(rbox(.2, .7, WD.w + 1.4, .05, trim), x + T + .05, WD.top + .35, WD.z));
    const leaf = new THREE.Group(), lw = WD.w - .1;
    leaf.add(at(rbox(.45, dh - .1, lw, .05, oak), 0, dh / 2, lw / 2 + .05));
    for (const s of [-1, 1]) {
      for (const [py, ph] of [[dh * .72, dh * .38], [dh * .27, dh * .4]]) leaf.add(at(rbox(.12, ph, WD.w - 1.6, .05, darkOak), s * .26, py, lw / 2 + .05));
      leaf.add(at(cyl(.16, .16, .3, brass, 12), s * .36, 10 - FLOOR, lw - .6, { z: Math.PI / 2 }));
    }
    leaf.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    leaf.position.set(x + .3, FLOOR, WD.z - WD.w / 2 + .05);
    doorGroup.add(leaf);
    doorW = { group: doorGroup, set(u) { const a = Math.max(0, Math.min(1, u)) * 1.55; if (leaf.rotation.y === a) return false; leaf.rotation.y = a; return true; } };
  }

  // ---------- the house lights: six opal globes hung from the beams (off at dawn) ----------
  const lamps = [];
  {
    const opal = mat('#F6F1E6', { r: .35, emissive: '#FFF3DC', ek: .05 });
    for (const x of [xm - 12, xm, xm + 12]) for (const z of [-10, 14]) {
      G.add(at(cyl(.07, .07, 8.2, brass, 8), x, TOP - 4.1, z), at(cyl(.5, .3, .6, brass, 16), x, TOP - 8.2, z));
      const g = new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 18), opal); g.position.set(x, TOP - 9.8, z); G.add(g);
      lamps.push([x, TOP - 9.8, z]);
    }
  }

  // ---------- the clock on the north wall, east of the screen: a station clock (60 cm across) in a brass rim,
  // its hour and minute hands at the dawn's hour; its second hand is the film's (it sweeps, drawn over the
  // kept frame) ----------
  const clock = { c: [X0 + 6.5, 26, Z0 - .54], r: 3 };
  {
    const [cx, cy, cz] = clock.c, R = clock.r;
    const face = canvasTex(512, 512, (c, Wc, Hc) => {
      const m = Wc / 2;
      c.fillStyle = '#FBF8F0'; c.beginPath(); c.arc(m, m, m, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, big = i % 5 === 0, r0 = m * (big ? .8 : .88), r1 = m * .94;
        c.strokeStyle = '#1B2238'; c.lineWidth = big ? 9 : 3;
        c.beginPath(); c.moveTo(m + Math.sin(a) * r0, m - Math.cos(a) * r0); c.lineTo(m + Math.sin(a) * r1, m - Math.cos(a) * r1); c.stroke();
      }
      c.fillStyle = '#1B2238'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 40px Georgia, serif';
      for (let h = 1; h <= 12; h++) { const a = h * Math.PI / 6; c.fillText(String(h), m + Math.sin(a) * m * .64, m - Math.cos(a) * m * .64 + 2); }
      c.font = '500 17px Georgia, serif'; c.fillStyle = 'rgba(27,34,56,.6)'; c.fillText('MeWriT', m, m + m * .32);
      // the hour and minute hands: 6:42, the dawn
      const hand = (a, len, w) => { c.save(); c.translate(m, m); c.rotate(a); c.fillStyle = '#1B2238'; c.beginPath(); c.moveTo(-w / 2, m * .1); c.lineTo(-w * .3, -len); c.lineTo(0, -len - w); c.lineTo(w * .3, -len); c.lineTo(w / 2, m * .1); c.closePath(); c.fill(); c.restore(); };
      hand((6 + 42 / 60) * Math.PI / 6, m * .48, 16);
      hand(42 * Math.PI / 30, m * .74, 10);
      c.beginPath(); c.arc(m, m, 12, 0, Math.PI * 2); c.fill();
    });
    const f = new THREE.Mesh(new THREE.CircleGeometry(R, 64), mat('#FFFFFF', { map: face, r: .5 }));
    f.rotation.y = Math.PI; f.position.set(cx, cy, cz); G.add(f);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + .12, .22, 14, 64), brass); rim.position.set(cx, cy, cz + .02); G.add(rim);
    G.add(at(cyl(R + .1, R + .1, .5, darkOak, 48), cx, cy, Z0 - .25, { x: Math.PI / 2 }));
  }

  return { group: G, lamps, clock, doorW };
}
