/* The seminar room (site/docs/redesign-plan.md, 11.19 and 11.20): west of the lecture room, through its
   west door; between it and the study. 06, Training, in the morning. The compass: +x west, -x east, +z
   north. The camera comes in through the door in the east wall and sits down at a participant's place,
   facing west to the whiteboard.
   - Plaster walls over a painted dado and a chair rail; a flat ceiling with four long pendant lights.
   - Three tall windows in the north wall for an even daylight.
   - The whiteboard on the west wall, its marker tray; over it the room's name; the trainer's table.
   - Workshop tables in three rows facing the whiteboard, chairs behind them.
   - On the south wall a noticeboard (the workshop's day) and a shelf of the Academy's workbooks.
   06's work, the things that move, is in training.js. Units as the house's (about 10 cm). Everything
   static is merged with the house (kit.js, bake). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, boardsTex, oakTex, contact, canvasTex } from './kit.js';
import { GARDEN } from './outside.js';
import { LECTURE } from './lecture.js';

export const SEMINAR = {
  // (7.2 m by 3.8 m, 3.75 m to the ceiling)
  X0: LECTURE.X1 + LECTURE.T, X1: -27.2, Z1: -6.3, Z0: 32, FLOOR: -7.5, T: .6, TOP: 30,
  // the north windows: their middles along x, width, sill, top
  NWINS: [-84, -63, -42], NWIN: { w: 7, y0: 1.5, y1: 21 },
  // the whiteboard on the west wall: its middle along z, width, bottom, height (2.4 m by 1.2 m)
  BOARD: { z: 12.8, w: 24, y0: 2.5, h: 12 },
  // the tables' rows (their middles along x, the first nearest the board), the tables' middles along z,
  // a table's length along z (1.6 m) and depth along x (60 cm), its top
  ROWS: [-46, -61, -76], TZ: [3.5, 22], TL: 16, TD: 6, TOPY: 0,
};
SEMINAR.XM = (SEMINAR.X0 + SEMINAR.X1) / 2;
SEMINAR.ZM = (SEMINAR.Z0 + SEMINAR.Z1) / 2;
// the participant's place the camera takes: the middle row, the north table, its south seat
SEMINAR.SEAT = { x: SEMINAR.ROWS[1], z: 18 };

export function buildSeminar({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, T, TOP, XM: xm, ZM: zm } = SEMINAR, W = X1 - X0, D = Z0 - Z1;
  const wallMat = mat('#EEE7DA', { map: plasterTex('#EEE7DA', 41), r: .95 });
  const dado = mat('#7E8C7A', { r: .8 });
  const trim = mat(PAL.trim, { r: .7 });
  const oak = mat('#B08A62', { map: oakTex('#B08A62', '#6E5034', 53), r: .6 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 47), r: .64 });
  const steel = mat('#3B3F47', { r: .35, m: .6 });

  // ---------- floor, walls (openings cut), plinth, roof ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#9A7A58', { map: boardsTex('#9A7A58', '#5E4630', 31), r: .74 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(xm, FLOOR, zm); G.add(floor);
    const wall = (len, holes, place) => {
      const s = new THREE.Shape([new THREE.Vector2(0, FLOOR), new THREE.Vector2(len, FLOOR), new THREE.Vector2(len, TOP), new THREE.Vector2(0, TOP)]);
      for (const h of holes) { const p = new THREE.Path(); p.moveTo(h.u - h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y0); s.holes.push(p); }
      const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
      { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / len, (uv.getY(i) - FLOOR) / (TOP - FLOOR)); }
      place(g);
      G.add(shadows(new THREE.Mesh(g, wallMat)));
    };
    const NW = SEMINAR.NWIN, WD = LECTURE.WDOOR;
    // north (its inner face at Z0; u runs west from X0 - T: x = X0 - T + u)
    wall(W + 2 * T, SEMINAR.NWINS.map(x => ({ u: x - X0 + T, w: NW.w, y0: NW.y0, y1: NW.y1 })), g => { g.translate(X0 - T, 0, Z0); });
    // south (its inner face at Z1, the wall running south of it; u runs east from X1 + T)
    wall(W + 2 * T, [], g => { g.rotateY(Math.PI); g.translate(X1 + T, 0, Z1); });
    // west (inner face at X1, the wall west of it; u runs south from Z0)
    wall(D, [], g => { g.rotateY(Math.PI / 2); g.translate(X1, 0, Z0); });
    // east: the lecture room's west wall is its own; this room's face of it, the door's opening cut
    wall(D, [{ u: WD.z - Z1, w: WD.w, y0: FLOOR, y1: WD.top }], g => { g.rotateY(-Math.PI / 2); g.translate(X0 + .02, 0, Z1); });
    G.add(shadows(at(box(W + 2 * T + .6, FLOOR - .3 - GARDEN, D + 2 * T + .6, mat('#CEC4B1', { r: .92 })), xm, (FLOOR - .3 + GARDEN) / 2, zm)));
    G.add(shadows(at(box(W + 2 * T + .6, .5, D + 2 * T + .6, mat('#6B7385', { r: .8 })), xm, TOP + .25, zm)));
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#F4EFE6', { map: plasterTex('#F4EFE6', 43), r: .95, side: THREE.BackSide }));
    ceil.rotation.x = -Math.PI / 2; ceil.position.set(xm, TOP - .06, zm); ceil.receiveShadow = true; G.add(ceil);
    // the cornice round the ceiling
    for (const [w, d, x, z] of [[W, .7, xm, Z0 - .35], [W, .7, xm, Z1 + .35], [.7, D, X0 + .35, zm], [.7, D, X1 - .35, zm]]) G.add(at(rbox(w, .7, d, .15, trim), x, TOP - .35, z));
  }

  // ---------- the dado: painted panelling to 90 cm, a chair rail; skirting ----------
  {
    const DH = 9;
    const runs = [[X0, Z0, X1, Z0, SEMINAR.NWINS.map(x => [x - SEMINAR.NWIN.w / 2 - .5, x + SEMINAR.NWIN.w / 2 + .5])], [X0, Z1, X1, Z1, []], [X1, Z1, X1, Z0, [[SEMINAR.BOARD.z - SEMINAR.BOARD.w / 2 - .5, SEMINAR.BOARD.z + SEMINAR.BOARD.w / 2 + .5]]], [X0, Z1, X0, Z0, [[LECTURE.WDOOR.z - LECTURE.WDOOR.w / 2 - .9, LECTURE.WDOOR.z + LECTURE.WDOOR.w / 2 + .9]]]];
    for (const [x0, z0, x1, z1, gaps] of runs) {
      const alongX = z0 === z1, inward = alongX ? (z0 === Z0 ? -1 : 1) : (x0 === X1 ? -1 : 1);
      let a = alongX ? x0 : z0; const end = alongX ? x1 : z1;
      for (const [g0, g1] of [...gaps, [end, end]]) {
        if (g0 - a > .3) {
          const len = g0 - a, mid = (a + g0) / 2;
          const put = (h, d, m, y, off) => G.add(at(rbox(alongX ? len : d, h, alongX ? d : len, .03, m), alongX ? mid : x0 + inward * off, y, alongX ? z0 + inward * off : mid));
          put(DH, .1, dado, FLOOR + DH / 2, .05);
          put(.35, .3, trim, FLOOR + DH + .1, .15);
          put(.8, .16, trim, FLOOR + .4, .08);
        }
        a = g1;
      }
    }
  }

  // ---------- the north windows: tall sashes, glazing bars, a deep sill ----------
  {
    const fr = mat('#F1ECE2', { r: .6 }), glassMat = new THREE.MeshPhysicalMaterial({ color: '#C9D6E8', roughness: .05, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    const { w, y0, y1 } = SEMINAR.NWIN;
    for (const x of SEMINAR.NWINS) {
      const parts = [];
      for (const s of [-1, 1]) parts.push(at(rbox(.5, y1 - y0 + .5, .4, .05, trim), s * (w / 2 + .25), (y0 + y1) / 2, -.15));
      parts.push(at(rbox(w + 1, .5, .4, .05, trim), 0, y1 + .25, -.15));
      parts.push(at(rbox(w + 1.6, .35, 1.4, .06, trim), 0, y0 - .17, -.6));
      parts.push(at(rbox(w, .22, .14, .02, fr), 0, (y0 + y1) / 2, .3));
      for (const t of [.25, .75]) parts.push(at(rbox(w, .1, .1, .02, fr), 0, y0 + (y1 - y0) * t, .3));
      for (const t of [-1, 0, 1]) parts.push(at(rbox(.1, y1 - y0, .1, .02, fr), t * w / 3, (y0 + y1) / 2, .3));
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), glassMat); glass.position.set(0, (y0 + y1) / 2, .38); glass.userData.noG = true; parts.push(glass);
      const g = group(...parts); g.position.set(x, 0, Z0 + .02);
      parts.forEach(p => { if (p.isMesh && p !== glass) { p.castShadow = true; p.receiveShadow = true; } });
      G.add(g);
    }
  }

  // ---------- the whiteboard on the west wall (its face is training.js's: it is written on), its frame and
  // tray; the room's name over it; the trainer's table ----------
  {
    const B = SEMINAR.BOARD, cy = FLOOR + B.y0 + B.h / 2, alu = mat('#C9CCD2', { r: .3, m: .75 });
    for (const s of [-1, 1]) G.add(at(rbox(.35, B.h + .5, .35, .06, alu), X1 - .2, cy, B.z + s * (B.w / 2 + .1)), at(rbox(.35, .35, B.w + .5, .06, alu), X1 - .2, cy + s * (B.h / 2 + .1), B.z));
    G.add(at(rbox(.9, .2, B.w * .7, .05, alu), X1 - .5, FLOOR + B.y0 - .25, B.z));
    G.add(at(rbox(.25, .5, B.w * .7, .05, alu), X1 - .85, FLOOR + B.y0 - .05, B.z));
    const t = 'MEWRIT ACADEMY  ·  WORKSHOP', TW = 2000, TH = 160;
    const tex = canvasTex(TW, TH, (c, Wc, Hc) => {
      c.fillStyle = '#2B3550'; c.fillRect(0, 0, Wc, Hc);
      c.strokeStyle = 'rgba(201,164,92,.7)'; c.lineWidth = 5; c.strokeRect(12, 12, Wc - 24, Hc - 24);
      c.fillStyle = '#E9D29A'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '20px';
      let fs = 84; c.font = `600 ${fs}px Georgia, serif`;
      while (c.measureText(t).width > Wc - 160) { fs -= 2; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(t, Wc / 2 + 10, Hc / 2 + 4);
    });
    const IW = 18, ins = new THREE.Mesh(new THREE.PlaneGeometry(IW, IW * TH / TW), mat('#FFFFFF', { map: tex, r: .5 }));
    ins.rotation.y = -Math.PI / 2; ins.position.set(X1 - .05, FLOOR + B.y0 + B.h + 4.2, B.z); G.add(ins);
    // the trainer's table, beside the board on its south side
    const tx = X1 - 6, tz = B.z - B.w / 2 - 4;
    G.add(at(rbox(5, .35, 9, .08, oak), tx, -.175, tz));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.4, 7.2, .4, .06, steel), tx + sx * 2, FLOOR + 3.6, tz + sz * 4));
    G.add(contact(6, 10, tx, tz, { y: FLOOR, k: .22 }));
  }

  // ---------- the workshop tables and their chairs, facing the board (west) ----------
  {
    for (const rx of SEMINAR.ROWS) for (const tz of SEMINAR.TZ) {
      const { TL, TD } = SEMINAR;
      G.add(at(rbox(TD, .35, TL, .06, oak), rx, -.175, tz));
      for (const sz of [-1, 1]) G.add(at(rbox(TD - .6, .4, .4, .06, steel), rx, -1.2, tz + sz * (TL / 2 - .8)));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.35, 7.1, .35, .05, steel), rx + sx * (TD / 2 - .5), FLOOR + 3.55, tz + sz * (TL / 2 - .8)));
      G.add(contact(TD + 1.5, TL + 1.5, rx, tz, { y: FLOOR, k: .22 }));
      // two chairs behind each table, east of it
      for (const cz of [tz - 4, tz + 4]) {
        const c = new THREE.Group(), seat = mat('#3E5A7A', { r: .8 });
        c.add(at(rbox(4.4, .6, 4.2, .2, seat), 0, 4.6, 0), at(rbox(.6, 4.2, 4.2, .2, seat), 2.0, 7.4, 0, { z: .1 }));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(at(cyl(.15, .15, 4.3, steel, 8), sx * 1.8, 2.15, sz * 1.8));
        c.position.set(rx + TD / 2 + 2.6, FLOOR, cz); G.add(c);
      }
    }
  }

  // ---------- the south wall: the noticeboard with the workshop's day, a shelf of workbooks ----------
  {
    const nb = canvasTex(1200, 800, (c, Wc, Hc) => {
      c.fillStyle = '#B98F5E'; c.fillRect(0, 0, Wc, Hc);
      for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${i % 2 ? '90,60,30' : '230,200,150'},.12)`; c.fillRect((i * 97) % Wc, (i * 53) % Hc, 3, 2); }
      const card = (x, y, w, h, rot, draw) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#FFFDF6'; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#C0392B'; c.beginPath(); c.arc(0, -h / 2 + 14, 8, 0, Math.PI * 2); c.fill(); draw(-w / 2, -h / 2, w, h); c.restore(); };
      card(330, 380, 520, 600, -.02, (x, y, w) => {
        c.fillStyle = '#B4500F'; c.font = '600 26px Georgia, serif'; c.fillText('TODAY’S WORKSHOP', x + 30, y + 70);
        c.fillStyle = '#13244F'; c.font = '600 38px Georgia, serif'; c.fillText('Writing it plainly', x + 30, y + 120);
        c.font = '400 26px Georgia, serif'; c.fillStyle = '#2B3550';
        [['09:30', 'Style: one idea a sentence'], ['11:00', 'Your own drafts, revised'], ['13:30', 'CSRs and CTD modules'], ['15:30', 'Publication ethics'], ['16:30', 'Certificates']].forEach(([t, s], i) => { c.fillStyle = '#B4500F'; c.fillText(t, x + 30, y + 190 + i * 70); c.fillStyle = '#2B3550'; c.fillText(s, x + 130, y + 190 + i * 70); });
      });
      card(880, 260, 420, 300, .03, (x, y, w) => {
        c.fillStyle = '#13244F'; c.font = '600 32px Georgia, serif'; c.fillText('MeWriT Academy', x + 30, y + 80);
        c.font = '400 24px Georgia, serif'; c.fillStyle = '#2B3550'; c.fillText('Half-day · Full-day', x + 30, y + 140); c.fillText('2 to 3 day advanced', x + 30, y + 180); c.fillText('Basic and advanced modules', x + 30, y + 220);
      });
      card(880, 600, 420, 260, -.04, (x, y) => {
        c.fillStyle = '#1F6B47'; c.font = '600 56px Georgia, serif'; c.fillText('3,000+', x + 30, y + 110);
        c.font = '400 24px Georgia, serif'; c.fillStyle = '#2B3550'; c.fillText('professionals trained', x + 30, y + 160);
      });
    });
    const NB = { w: 15, h: 10 }, nbx = xm + 4;
    G.add(at(rbox(NB.w + .6, NB.h + .6, .3, .08, darkOak), nbx, 12, Z1 + .15));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(NB.w, NB.h), mat('#FFFFFF', { map: nb, r: .85 })); p.position.set(nbx, 12, Z1 + .32); G.add(p);
    // the shelf of workbooks, east of the noticeboard
    const sx = xm - 16;
    G.add(at(rbox(14, .3, 2.6, .06, oak), sx, 6, Z1 + 1.3));
    for (const sy of [-1, 1]) G.add(at(rbox(.3, 1.4, 2.4, .05, darkOak), sx + sy * 6.6, 5.2, Z1 + 1.2));
    const cols = ['#1E5A63', '#24345E', '#7A2E2A', '#B4500F', '#2F5B46'];
    for (let i = 0; i < 22; i++) G.add(at(rbox(.5, 2.8 + (i % 3) * .2, 2.1, .04, mat(cols[i % 5], { r: .8 })), sx - 6 + i * .58, 6.15 + (2.8 + (i % 3) * .2) / 2, Z1 + 1.3));
  }

  // ---------- the lights: four long pendant lights over the tables ----------
  const lamps = [];
  {
    const shade = mat('#F2EFE8', { r: .5, emissive: '#FFF6E2', ek: .05 });
    for (const x of [-46, -61, -76, -36]) {
      const z = 12.8;
      G.add(at(cyl(.04, .04, 5, steel, 6), x, TOP - 2.5, z - 8), at(cyl(.04, .04, 5, steel, 6), x, TOP - 2.5, z + 8));
      G.add(at(rbox(1.6, .5, 20, .2, shade), x, TOP - 5.2, z));
      lamps.push([x, TOP - 5.6, z]);
    }
  }

  return { group: G, lamps };
}
