/* The archive (site/docs/redesign-plan.md, 11.5 and 11.12): east of the library hall, through the door
   in the hall's east wall; lower than the hall. 03, Regulatory writing, at night. The compass: -z is
   south, +x west. The camera comes in through the door turning left (east) and stands looking down the
   room: every walk round the house turns left once, so the camera never turns back.
   - Down the left (north): rolling stacks, end on, their steel ends with hand wheels toward the aisle,
     their shelves full of box files and binders.
   - Down the right (south): small high windows (the night outside), plan chests under them.
   - Ahead (east): shelving of archive boxes, and the door on to the reading room (closed until it is
     built).
   - In the middle: the long archive table under two pendant lamps, and at its near end the dossier
     that 03 assembles as the reader scrolls (dossier.set): the pages stack with the module tabs between
     them, the cover closes, its label shows (the logo, laid on it by the film as HTML).
   Units as the house's (about 10 cm). Everything static is merged with the house (kit.js, bake); the
   dossier's parts are kept (userData.keep). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, oakTex, boardsTex, paperTex, typeLines, canvasTex, rng, contact, hipRoof } from './kit.js';
import { GARDEN } from './outside.js';
import { HALL } from './hall.js';
import { bookGeometry, bookMaterial, pickSpine } from './books.js';

export const ARCHIVE = {
  X0: -104, X1: HALL.X0 - HALL.T, Z0: -30, Z1: -66, FLOOR: -7.5, TOP: 20, T: .6,
  // the small high windows in the south wall: their centres along x, width, sill, head
  WINS: [-75, -85, -95], WIN: { w: 5, y0: 8.5, y1: 15.5 },
  // the door on to the reading room, in the east wall
  DOOR: { z: -49.5, w: 8, top: 12.5 },
  // the table: its near and far ends (x), its middle across (z), its width, its top
  TABLE: { x0: -72, x1: -96, z: -52, w: 7.2, top: .1 },
  // the dossier: the middle of its back cover on the table
  DOSSIER: { x: -77.6, z: -52 },
};

// the dossier: 03's object. Its sections in the order they are laid (each a tab and its pages), the
// binder's measure (L along the table, W across it, H the spine)
const SECTIONS = [{ tab: 'CSR', col: '#B4500F', ink: '#FFFFFF', at: .95 }, { tab: 'M2.5', col: '#D2A24C', ink: '#13244F', at: 0 }, { tab: 'M2.7', col: '#22325A', ink: '#FFFFFF', at: -.95 }];
const PAGES = 5, BL = 3.4, BW = 3.0, BH = .78, BT = .1;

export function buildArchive({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, TOP, T, TABLE } = ARCHIVE, W = X1 - X0, D = Z0 - Z1, R = rng(131);
  const wallMat = mat('#E7DFCF', { map: plasterTex('#E7DFCF', 13), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });
  const oak = mat('#9C774F', { map: oakTex('#9C774F', '#5A402A', 41), r: .62 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 27), r: .64 });
  const steel = mat('#D9D4C8', { r: .55, m: .15 });
  const steelDark = mat('#8D9099', { r: .4, m: .5 });
  const brass = mat(PAL.gold, { r: .32, m: .85 });
  const xm = (X0 + X1) / 2, zm = (Z0 + Z1) / 2;

  // ---------- the floor, the ceiling, the walls ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#806247', { map: boardsTex('#806247', '#4E3926', 17), r: .76 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(xm, FLOOR, zm); G.add(floor);
    G.add(shadows(at(box(W + 2 * T, 1, D + 2 * T, mat('#EFE8DC', { r: 1 })), xm, TOP + .5, zm)));
    for (const z of [Z0 + 9, zm, Z1 - 9]) G.add(at(rbox(W, 1.2, 1.1, .1, darkOak), xm, TOP - .6, z));
    G.add(at(rbox(W, .7, .7, .12, trim), xm, TOP - .35, Z0 - .35), at(rbox(W, .7, .7, .12, trim), xm, TOP - .35, Z1 + .35));
    // south: its windows cut through, drawn in its own plane (u along x, v up) and set at z = Z1
    const s = new THREE.Shape([new THREE.Vector2(X0 - T, FLOOR), new THREE.Vector2(X1, FLOOR), new THREE.Vector2(X1, TOP), new THREE.Vector2(X0 - T, TOP)]);
    const { w, y0, y1 } = ARCHIVE.WIN;
    ARCHIVE.WINS.forEach(c => s.holes.push(new THREE.Path([new THREE.Vector2(c - w / 2, y0), new THREE.Vector2(c - w / 2, y1), new THREE.Vector2(c + w / 2, y1), new THREE.Vector2(c + w / 2, y0)])));
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
    { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - X0) / W, (uv.getY(i) - FLOOR) / (TOP - FLOOR)); }
    g.translate(0, 0, Z1 - T);
    G.add(shadows(new THREE.Mesh(g, wallMat)));
    // north, whole
    G.add(shadows(at(box(W + T, TOP - FLOOR, T, wallMat), xm - T / 2, (FLOOR + TOP) / 2, Z0 + T / 2)));
    // east: the door on to the reading room cut through (three pieces round it)
    const DR = ARCHIVE.DOOR, ex = X0 - T / 2, zN = DR.z + DR.w / 2, zS = DR.z - DR.w / 2;
    G.add(shadows(at(box(T, TOP - FLOOR, Z0 + T - zN, wallMat), ex, (FLOOR + TOP) / 2, (Z0 + T + zN) / 2)));
    G.add(shadows(at(box(T, TOP - FLOOR, zS - (Z1 - T), wallMat), ex, (FLOOR + TOP) / 2, (zS + Z1 - T) / 2)));
    G.add(shadows(at(box(T, TOP - DR.top, DR.w, wallMat), ex, (DR.top + TOP) / 2, DR.z)));
    // the skirting round the room
    G.add(at(rbox(W, .6, .12, .03, trim), xm, FLOOR + .3, Z1 + .06), at(rbox(W, .6, .12, .03, trim), xm, FLOOR + .3, Z0 - .06));
    // outside: the plinth down to the garden, the roof
    G.add(shadows(at(box(W + T + .6, FLOOR - .3 - GARDEN, D + 2 * T + .6, mat('#CEC4B1', { r: .92 })), xm - T / 2, (FLOOR - .3 + GARDEN) / 2, zm)));
    G.add(hipRoof(X0 - T - 1.2, X1 + 1, Z1 - T - 1.2, Z0 + T + 1.2, TOP + 1, 12, mat('#6B7385', { r: .8 })));
  }

  // ---------- the south windows: casing, a glazing bar, the sill, the glass ----------
  {
    const { w, y0, y1 } = ARCHIVE.WIN, fz = Z1 - T * .5;
    ARCHIVE.WINS.forEach(c => {
      G.add(at(rbox(w + .9, .45, .3, .05, trim), c, y1 + .22, Z1 + .1), at(rbox(.45, y1 - y0 + .9, .3, .05, trim), c - w / 2 - .22, (y0 + y1) / 2, Z1 + .1), at(rbox(.45, y1 - y0 + .9, .3, .05, trim), c + w / 2 + .22, (y0 + y1) / 2, Z1 + .1));
      G.add(at(rbox(w + 1.2, .3, 1, .06, trim), c, y0 - .15, Z1 + .4));
      G.add(at(rbox(.14, y1 - y0, .14, .02, trim), c, (y0 + y1) / 2, fz), at(rbox(w, .14, .14, .02, trim), c, (y0 + y1) / 2, fz));
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), new THREE.MeshPhysicalMaterial({ color: '#C9D6EA', roughness: .05, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide }));
      glass.position.set(c, (y0 + y1) / 2, fz - .08); glass.userData.noG = true; G.add(glass);
    });
  }

  // ---------- the door from the hall (open, folded back against this side of the wall) and its architrave;
  // the door on to the reading room (closed for now) ----------
  {
    const DH = HALL.DOOR, zN = DH.z + DH.w / 2, wA = .6, panelMat = mat('#E1D8C6', { r: .72 });
    G.add(at(rbox(.16, DH.top - FLOOR + wA, wA, .04, trim), X1 - .08, (FLOOR + DH.top + wA) / 2, DH.z - DH.w / 2 - wA / 2), at(rbox(.16, DH.top - FLOOR + wA, wA, .04, trim), X1 - .08, (FLOOR + DH.top + wA) / 2, zN + wA / 2));
    G.add(at(rbox(.16, wA, DH.w + 2 * wA, .04, trim), X1 - .08, DH.top + wA / 2, DH.z));
    // the leaf: hinged at the north jamb, swung through into the archive and laid back along the wall
    const leaf = group(at(rbox(.3, DH.top - FLOOR, DH.w - .2, .05, mat('#E8E0D0', { r: .7 })), 0, 0, 0));
    for (const [fy, fh] of [[.68, .5], [.22, .3]]) for (const dz of [-DH.w / 4, DH.w / 4]) leaf.add(at(rbox(.06, (DH.top - FLOOR) * fh * .85, DH.w * .36, .03, panelMat), -.17, (DH.top - FLOOR) * (fy - .5), dz));
    leaf.add(at(cyl(.13, .13, .45, brass, 14), -.4, 9.5 - (DH.top + FLOOR) / 2, -DH.w / 2 + 1, { z: Math.PI / 2 }));
    leaf.position.set(X1 - .5, (FLOOR + DH.top) / 2, zN + .25 + (DH.w - .2) / 2);
    G.add(leaf);
    // east: the architrave and the closed door
    const DR = ARCHIVE.DOOR, ex = X0 + .08;
    G.add(at(rbox(.16, DR.top - FLOOR + wA, wA, .04, trim), ex, (FLOOR + DR.top + wA) / 2, DR.z - DR.w / 2 - wA / 2), at(rbox(.16, DR.top - FLOOR + wA, wA, .04, trim), ex, (FLOOR + DR.top + wA) / 2, DR.z + DR.w / 2 + wA / 2));
    G.add(at(rbox(.16, wA, DR.w + 2 * wA, .04, trim), ex, DR.top + wA / 2, DR.z));
    G.add(at(rbox(.3, DR.top - FLOOR, DR.w, .05, mat('#E8E0D0', { r: .7 })), X0 - .15, (FLOOR + DR.top) / 2, DR.z));
    for (const [fy, fh] of [[.68, .5], [.22, .3]]) for (const dz of [-DR.w / 4, DR.w / 4]) G.add(at(rbox(.06, (DR.top - FLOOR) * fh * .85, DR.w * .36, .03, panelMat), X0 + .02, FLOOR + (DR.top - FLOOR) * fy, DR.z + dz));
    for (const dz of [-.5, .5]) G.add(at(cyl(.13, .13, .45, brass, 14), X0 + .2, FLOOR + 9.5, DR.z + DR.w / 2 - 1.2 + dz * 0, { z: Math.PI / 2 }));
  }

  // ---------- the shelves' contents: one instanced draw (books.js), rows like the hall's ----------
  const rows = [];   // { along, a0, a1, y, face, dir, hMax, fam }
  // a run of shelving against a wall or on a stack's side: its back, shelves, uprights, top
  function shelving({ along, a0, a1, face, dir, height, shelves, depth = 1.6, fam, mt = steel }) {
    const len = a1 - a0, mid = (a0 + a1) / 2, put = (m, a, y, f) => along === 'x' ? at(m, a, y, f) : at(m, f, y, a);
    const bx = (la, h, d, m, a, y, f) => G.add(put(rbox(along === 'x' ? la : d, h, along === 'x' ? d : la, .03, m), a, y, f));
    const pitch = (height - 1.4) / shelves;
    for (let i = 0; i <= shelves; i++) {
      const y = FLOOR + .9 + i * pitch;
      bx(len, .12, depth, mt, mid, y, face + dir * depth / 2);
      if (i < shelves) rows.push({ along, a0: a0 + .3, a1: a1 - .3, y: y + .06, face: face + dir * .15, dir, hMax: pitch - .35, fam });
    }
    const n = Math.max(1, Math.round(len / 6));
    for (let k = 0; k <= n; k++) bx(.18, height, depth, mt, a0 + len * k / n, FLOOR + height / 2, face + dir * depth / 2);
  }

  // the rolling stacks down the left: each a carriage on rails, shelves both sides, its end a steel
  // panel toward the aisle with a hand wheel
  const STACK_Z = [Z0 + .4, -44.5], STACKS = [-71.5, -77.2, -82.9, -88.6, -94.3, -100];
  for (const sx of STACKS) {
    const h = 17, depth = 1.15;
    G.add(at(rbox(.25, h - .6, STACK_Z[1] - STACK_Z[0] - .2, .03, steel), sx, FLOOR + h / 2, (STACK_Z[0] + STACK_Z[1]) / 2));   // the spine between the two sides
    shelving({ along: 'z', a0: STACK_Z[1], a1: STACK_Z[0], face: sx + .12, dir: 1, height: h, shelves: 6, depth, fam: R() < .5 ? 'box' : 'binder' });
    shelving({ along: 'z', a0: STACK_Z[1], a1: STACK_Z[0], face: sx - .12, dir: -1, height: h, shelves: 6, depth, fam: R() < .5 ? 'box' : 'binder' });
    // the end panel, the wheel, the label holder
    const ez = STACK_Z[1] - .2;
    G.add(at(rbox(2 * depth + .5, h + .3, .4, .1, mat('#E4DED2', { r: .5, m: .1 })), sx, FLOOR + (h + .3) / 2, ez));
    G.add(at(rbox(1.3, .9, .08, .04, mat('#F6F1E6', { r: .8 })), sx, FLOOR + h - 2.6, ez - .22), at(rbox(.9, .1, .06, .02, mat(PAL.navy, { r: .6 })), sx, FLOOR + h - 2.5, ez - .27));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.9, .09, 8, 32), steelDark); wheel.position.set(sx, FLOOR + 9.5, ez - .55); wheel.castShadow = true; G.add(wheel);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; G.add(at(rbox(.1, .9, .1, .03, steelDark), sx + Math.sin(a) * .45, FLOOR + 9.5 + Math.cos(a) * .45, ez - .55, { z: -a })); }
    G.add(at(cyl(.22, .22, .5, steelDark, 16), sx, FLOOR + 9.5, ez - .35, { x: Math.PI / 2 }));
    G.add(at(cyl(.08, .08, .5, steelDark, 8), sx + .9 * Math.sin(.5), FLOOR + 9.5 + .9 * Math.cos(.5), ez - .8, { x: Math.PI / 2 }));   // the wheel's handle
    G.add(at(rbox(2 * depth + .5, .5, STACK_Z[1] - STACK_Z[0], .05, steelDark), sx, FLOOR + .25, (STACK_Z[0] + STACK_Z[1]) / 2));   // the carriage
    G.add(contact(2 * depth + 1.4, 2.4, sx, ez - .4, { y: FLOOR, k: .22 }));
  }
  // the rails across the floor under them
  for (const rz of [-34, -40]) G.add(at(rbox(STACKS[0] - STACKS[STACKS.length - 1] + 4, .14, .3, .04, steelDark), (STACKS[0] + STACKS[STACKS.length - 1]) / 2, FLOOR + .07, rz));

  // ahead: shelving of archive boxes either side of the door on to the reading room
  {
    const DR = ARCHIVE.DOOR;
    shelving({ along: 'z', a0: Z1 + .6, a1: DR.z - DR.w / 2 - 1.2, face: X0, dir: 1, height: 18, shelves: 7, depth: 1.8, fam: 'box', mt: darkOak });
    shelving({ along: 'z', a0: DR.z + DR.w / 2 + 1.2, a1: -45.5, face: X0, dir: 1, height: 18, shelves: 7, depth: 1.8, fam: 'binder', mt: darkOak });
    G.add(at(rbox(.6, 1, Z1 + .6 - (DR.z - DR.w / 2 - 1.2), .1, darkOak), X0 + 1, FLOOR + 18.5, (Z1 + .6 + DR.z - DR.w / 2 - 1.2) / 2));
  }

  // ---------- the plan chests under the south windows: wide flat drawers, brass pulls; rolled plans on top ----------
  {
    const x0 = -82, x1 = -101.5, d = 3.6, h = 7.4, z = Z1 + d / 2 + .1, n = 3, uw = (x0 - x1) / n;
    for (let u = 0; u < n; u++) {
      const cx = x0 - uw * (u + .5);
      G.add(at(rbox(uw - .15, h, d, .06, oak), cx, FLOOR + h / 2, z));
      for (let k = 0; k < 5; k++) {
        const y = FLOOR + .5 + (k + .5) * (h - .9) / 5;
        G.add(at(rbox(uw - .7, (h - .9) / 5 - .16, .1, .03, oak), cx, y, z + d / 2 + .02));
        G.add(at(rbox(1.1, .14, .16, .05, brass), cx, y + .2, z + d / 2 + .1), at(rbox(.7, .3, .04, .02, mat('#F4EFE4', { r: .8 })), cx, y - .18, z + d / 2 + .08));
      }
    }
    G.add(at(rbox(x0 - x1 + .4, .3, d + .3, .06, darkOak), (x0 + x1) / 2, FLOOR + h + .15, z));
    const top = FLOOR + h + .3, paper = mat('#F2ECDD', { r: .9 });
    [[-97, .5, .4], [-98.2, .42, -.1], [-97.6, .36, .25]].forEach(([x, r, dz], i) => G.add(at(cyl(r, r, 4.4 - i * .5, paper, 20), x, top + r + (i === 2 ? .7 : 0), z + dz, { x: Math.PI / 2, y: .1 * i })));
    // a stack of archive boxes, a lamp's brass base and its shade, by the far window
    for (let i = 0; i < 3; i++) G.add(at(rbox(3.2, 1.2, 2.3, .05, mat(['#C9BBA0', '#BCAE92', '#D3C6AC'][i], { r: .85 })), -90 + i * .1, top + .6 + i * 1.22, z, { y: (i - 1) * .06 }));
    G.add(contact(4, 3, -90, z, { y: top, k: .25 }));
  }

  // ---------- the stacks' and the shelving's contents ----------
  {
    const items = [];
    for (const row of rows) {
      const ry = row.along === 'x' ? (row.dir > 0 ? 0 : Math.PI) : (row.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      let a = row.a0;
      while (a < row.a1) {
        if (R() < .04) { a += .4 + R() * .9; continue; }
        // box files (the archive's: a buff or grey box, its label) mostly; binders between
        const boxy = row.fam === 'box' ? R() < .78 : R() < .22;
        const fam = boxy ? 'report' : 'binder';
        const bw = boxy ? .9 + R() * .35 : .45 + R() * .2, bh = Math.min(row.hMax, boxy ? 1.75 + R() * .2 : 1.95 + R() * .1), bd = 1.0 + R() * .1;
        if (a + bw > row.a1) break;
        const s = pickSpine(fam, R);
        items.push({ row, a: a + bw / 2, y: row.y + bh / 2, f: row.face + row.dir * bd / 2, w: bw, h: bh, d: bd, ry, ...s, col: boxy && R() < .7 ? ['#C9BBA0', '#BCAE92', '#D3C6AC', '#A9A390'][Math.floor(R() * 4)] : s.col, shade: .82 + R() * .22 });
        a += bw + .03;
      }
    }
    const geo = bookGeometry(items.length), mesh = new THREE.InstancedMesh(geo, bookMaterial(), items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
    items.forEach((b, i) => {
      e.set(0, b.ry, 0); sc.set(b.w, b.h, b.d);
      if (b.row.along === 'x') p.set(b.a, b.y, b.f); else p.set(b.f, b.y, b.a);
      q.setFromEuler(e); mesh.setMatrixAt(i, m4.compose(p, q, sc)); mesh.setColorAt(i, cc.set(b.col).multiplyScalar(b.shade));
      geo.attributes.aTile.setX(i, b.tile); geo.attributes.aShade.setX(i, b.shade);
    });
    mesh.castShadow = false; mesh.receiveShadow = true;
    G.add(mesh);
  }

  // ---------- the archive table, its chairs; on it: archive boxes, a card index, a closed binder ----------
  const TT = TABLE.top, tx = (TABLE.x0 + TABLE.x1) / 2, tl = TABLE.x0 - TABLE.x1;
  {
    G.add(at(rbox(tl, .5, TABLE.w, .1, oak), tx, TT - .25, TABLE.z));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.7, TT - .5 - FLOOR, .7, .08, darkOak), tx + sx * (tl / 2 - 1), (FLOOR + TT - .5) / 2, TABLE.z + sz * (TABLE.w / 2 - .9)));
    G.add(at(rbox(tl - 2.4, 1, .3, .05, darkOak), tx, TT - 1, TABLE.z + TABLE.w / 2 - .9), at(rbox(tl - 2.4, 1, .3, .05, darkOak), tx, TT - 1, TABLE.z - TABLE.w / 2 + .9));
    G.add(contact(tl + 2, TABLE.w + 2, tx, TABLE.z, { y: FLOOR, k: .3 }));
    const chair = (cx, cz, ry) => {
      const c = group(at(rbox(2.3, .32, 2.2, .06, darkOak), 0, 4.6, 0), at(rbox(2.3, 4.2, .26, .06, darkOak), 0, 6.8, -.98));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(at(rbox(.26, 4.6, .26, .05, darkOak), sx * .95, 2.3, sz * .9));
      c.add(at(rbox(1.9, .6, 1.9, .2, mat('#2F4A3A', { r: .9 })), 0, 4.95, .05));
      c.position.set(cx, FLOOR, cz); c.rotation.y = ry; G.add(c);
      G.add(contact(2.9, 2.9, cx, cz, { y: FLOOR, k: .22 }));
    };
    chair(-86, TABLE.z - TABLE.w / 2 - 1.2, 0); chair(-91.5, TABLE.z - TABLE.w / 2 - 1.2, .08);
    // archive boxes, one open with its lid beside it; a card index drawer; a closed binder; a stamp
    const buff = mat('#C9BBA0', { r: .85 }), buff2 = mat('#BCAE92', { r: .85 });
    G.add(at(rbox(2.4, 1.7, 3.2, .05, buff), -90.5, TT + .85, TABLE.z + 1.6, { y: .05 }), at(rbox(2.4, 1.7, 3.2, .05, buff2), -90.6, TT + 2.57, TABLE.z + 1.55, { y: -.04 }));
    G.add(at(rbox(2.4, 1.6, 3.2, .05, buff), -86.2, TT + .8, TABLE.z + 1.8, { y: -.1 }), at(rbox(2.6, .3, 3.4, .05, buff2), -83.4, TT + .15, TABLE.z + 2.2, { y: .3 }));
    for (let i = 0; i < 9; i++) G.add(at(rbox(.05, 1.25, 2.6, .01, mat(i % 3 ? '#F4EFE4' : '#E9DFC9', { r: .9 })), -86.2 + (i - 4) * .22, TT + 1.2, TABLE.z + 1.8, { y: -.1, z: (i - 4) * .03 }));
    G.add(at(rbox(1.6, 1.1, 3.6, .05, darkOak), -93.8, TT + .55, TABLE.z - 1.3), at(rbox(1.2, .3, .3, .05, brass), -93.8, TT + .7, TABLE.z - 1.3 + 1.82));
    G.add(at(rbox(3.4, .7, 3.0, .08, mat(PAL.navy, { r: .55 })), -82.5, TT + .35, TABLE.z - 1.6, { y: -.2 }));
    G.add(at(cyl(.38, .42, .5, darkOak, 20), -80.3, TT + .25, TABLE.z - 2.4), at(cyl(.12, .15, .9, darkOak, 12), -80.3, TT + .95, TABLE.z - 2.4), at(cyl(.24, .24, .2, darkOak, 16), -80.3, TT + 1.45, TABLE.z - 2.4));   // the stamp
    G.add(at(rbox(1.1, .12, .8, .04, mat('#3A4252', { r: .6 })), -79.2, TT + .06, TABLE.z - 2.6));   // its pad
    for (const [x, z, ww, dd, k] of [[-90.5, TABLE.z + 1.6, 3, 3.8, .24], [-86.2, TABLE.z + 1.8, 3, 3.8, .22], [-93.8, TABLE.z - 1.3, 2.2, 4.2, .22], [-82.5, TABLE.z - 1.6, 4, 3.6, .22]]) G.add(contact(ww, dd, x, z, { y: TT, k }));
  }

  // ---------- the pendants: green enamel shades on long rods ----------
  const pendants = [], lampAt = [];
  for (const px of [-79.5, -90.5]) {
    const by = TT + 9.4;
    G.add(at(cyl(.06, .06, TOP - by - 1.4, mat(PAL.graphite, { r: .4, m: .6 }), 8), px, (TOP + by + 1.4) / 2, TABLE.z));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.35, 1.9, 1.3, 32, 1, true), mat('#2F5B46', { r: .35, side: THREE.DoubleSide }));
    shade.position.set(px, by + .65, TABLE.z); shade.castShadow = true; G.add(shade);
    G.add(at(cyl(.35, .35, .3, brass, 16), px, by + 1.4, TABLE.z));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 12), mat('#FFF6E6', { emissive: '#FFE3B0', ek: 1.4, r: .4 }));
    bulb.position.set(px, by + .2, TABLE.z); G.add(bulb);
    pendants.push([px, by + .1, TABLE.z]); lampAt.push([px, by, TABLE.z]);
  }

  // ---------- the dossier ----------
  const dossier = buildDossier(TT);
  G.add(dossier.group);

  return { group: G, dossier, pendants, lamps: lampAt, centre: [ARCHIVE.DOSSIER.x, TT, ARCHIVE.DOSSIER.z] };
}

// ---------- the dossier: a binder on the table, open, that fills and closes as 03 performs ----------
// set(k): k from 0 (the binder open and empty) to 1 (closed, its label showing): the sections are laid
// one after another (each its tab sliding in from the right, then its pages one by one from above), then
// the cover closes. Returns true when anything moved.
function buildDossier(TT) {
  const { x: DX, z: DZ } = ARCHIVE.DOSSIER;
  const g = new THREE.Group(); g.userData.keep = true;
  const cloth = mat('#22325A', { r: .58 }), board = mat('#1D2C53', { r: .62 }), metal = mat('#BFC3CA', { r: .3, m: .8 });
  // the back cover on the table; the ring plate and rings at the spine's side (the spine to the north, +z)
  g.add(at(rbox(BL, BT, BW, .04, cloth), DX, TT + BT / 2, DZ));
  g.add(at(rbox(BL - .5, .05, .5, .02, metal), DX, TT + BT + .025, DZ + BW / 2 - .45));
  for (const dx of [-1.1, 0, 1.1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .035, 8, 24, Math.PI), metal);
    ring.rotation.y = Math.PI / 2; ring.position.set(DX + dx, TT + BT + .05, DZ + BW / 2 - .45); g.add(ring);
  }
  // the spine and the front cover: the spine hinged at the back cover's edge, the cover at the spine's;
  // open, all three lie flat (the cover beyond the spine, to the north); closing, the spine stands up and
  // the cover turns over onto the pages
  const spine = new THREE.Group(), cover = new THREE.Group();
  spine.position.set(DX, TT + BT / 2, DZ + BW / 2);
  spine.add(at(rbox(BL, BT, BH, .04, cloth), 0, 0, BH / 2));
  // (the spine's label, on its outer face)
  spine.add(at(rbox(.7, .02, BH - .3, .01, mat('#F4EFE4', { r: .8 })), BL / 2 - .9, -BT / 2 - .01, BH / 2));
  cover.position.set(0, 0, BH);
  cover.add(at(rbox(BL, BT, BW, .04, cloth), 0, 0, BW / 2));
  // the cover's label: an ivory plate on its outer face (the film lays the logo and the words on it)
  const LBL = { w: 2.3, h: 1.5, off: .45 };   // across, along, and toward the binder's head (far end)
  cover.add(at(rbox(LBL.h, .03, LBL.w, .01, mat('#F4EEE2', { r: .7 })), -LBL.off, -BT / 2 - .015, BW / 2));
  // (its inside lining, lighter)
  cover.add(at(rbox(BL - .2, .01, BW - .2, .005, board), 0, BT / 2 + .006, BW / 2));
  spine.add(cover);
  g.add(spine);

  // the pages: a typeset sheet (shared), and the tabbed dividers
  const pageTex = paperTex((c, W, H) => {
    c.fillStyle = '#22325A'; c.fillRect(W * .1, H * .08, W * .4, 16);
    typeLines(c, W * .1, H * .15, W * .8, 9, 34, 26, 'rgba(40,52,84,.62)', rng(7));
  }, 512, 724);
  const sheetMat = mat('#FFFFFF', { map: pageTex, r: .92 });
  // (a sheet: its top face shows the page, its words reading from the camera as the tab's do)
  const sheetGeo = new THREE.BoxGeometry(BW - .5, .022, BL - .3); sheetGeo.rotateY(Math.PI / 2);
  const items = [];   // in the order laid: { mesh, kind, y, t }
  let y = TT + BT;
  SECTIONS.forEach((s, i) => {
    const d = new THREE.Group();
    d.add(at(rbox(BL - .25, .035, BW - .45, .01, mat(i === 1 ? '#EFE3C4' : '#E8EDF4', { r: .85 })), 0, 0, 0));
    // the tab, sticking out to the south (to the right as the camera sees it), its name printed on it
    const tabTex = canvasTex(256, 320, (c, w, h) => { c.fillStyle = s.col; c.fillRect(0, 0, w, h); c.fillStyle = s.ink; c.font = `600 ${s.tab.length > 3 ? 84 : 100}px "Fraunces Variable", Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.tab, w / 2, h / 2 + 6); }, { aniso: 8 });
    // (a box .55 out from the edge and .7 along it; its top face shows the picture, turned so the words
    // read from the camera, which looks along -x: the picture's across along -z, its up along -x)
    const tg = new THREE.BoxGeometry(.55, .036, .7); tg.rotateY(Math.PI / 2);
    const tab = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: tabTex, roughness: .7 }));
    tab.position.set(s.at, 0, -(BW - .45) / 2 - .23);
    d.add(tab);
    d.userData.rest = new THREE.Vector3(DX, y + .02, DZ - .05);
    d.userData.kind = 'tab';
    g.add(d); items.push(d);
    y += .04;
    for (let p = 0; p < PAGES; p++) {
      const m = new THREE.Mesh(sheetGeo, sheetMat);
      m.receiveShadow = true;
      m.userData.rest = new THREE.Vector3(DX + (R2() - .5) * .04, y + .011, DZ - .05 + (R2() - .5) * .04);
      m.userData.turn = (R2() - .5) * .04;
      m.userData.kind = 'page';
      g.add(m); items.push(m);
      y += .024;
    }
  });
  function R2() { R2.s = (R2.s || 7) * 16807 % 2147483647; return R2.s / 2147483647; }

  // the timing (shares of k): each item's turn, then the cover
  const N = items.length, LAY0 = .03, LAY1 = .7, STEP = (LAY1 - LAY0) / N, DUR = STEP * 2.4, CLOSE = [.72, .88];
  const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  let shown = -1;
  function set(k) {
    const key = Math.round(k * 2000);
    if (key === shown) return false;
    shown = key;
    items.forEach((it, i) => {
      const u = sm((k - LAY0 - i * STEP) / DUR), r = it.userData.rest;
      it.visible = u > 0;
      if (!it.visible) return;
      if (it.userData.kind === 'tab') {
        // slides in from the right, low over the pages
        it.position.set(r.x, r.y + (1 - u) * .25, r.z - (1 - u) * 3.2);
        it.rotation.set(0, (1 - u) * .12, 0);
      } else {
        // laid from above and a little toward the reader, settling flat
        it.position.set(r.x + (1 - u) * 1.1, r.y + (1 - u) * 1.8, r.z);
        it.rotation.set(0, it.userData.turn + (1 - u) * .18, (1 - u) * -.22);
      }
    });
    // the cover: the spine rises and the cover turns over onto the pages
    const c = sm((k - CLOSE[0]) / (CLOSE[1] - CLOSE[0]));
    spine.rotation.x = -c * Math.PI / 2;
    cover.rotation.x = -c * Math.PI / 2;
    g.updateMatrixWorld(true);
    return true;
  }
  set(0);
  // the label's corners in the world when the binder is closed (top left, top right, bottom right,
  // bottom left as the camera reads it: its head away from the camera, to the east)
  const ly = TT + BT / 2 + BH + BT / 2 + .03, lx = DX - LBL.off;
  const label = [[lx - LBL.h / 2, ly, DZ + LBL.w / 2], [lx - LBL.h / 2, ly, DZ - LBL.w / 2], [lx + LBL.h / 2, ly, DZ - LBL.w / 2], [lx + LBL.h / 2, ly, DZ + LBL.w / 2]];
  return { group: g, set, label, closeAt: CLOSE[1] };
}
