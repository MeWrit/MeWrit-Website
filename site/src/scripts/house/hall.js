/* The library hall (site/docs/redesign-plan.md, sections 11.4 and 11.12): south of the study, through
   the study's doorway; double height. The compass: -z is south, +x west.
   - West wall: four tall arched windows looking toward the sunset hills; between them, tall narrow
     bookcases.
   - South wall: the record. Four bays of bound work (02: one bay for each figure), each under an ivory
     board where its figure is lettered, a navy frieze across them lettered "Twenty-two years, on the
     record", a cornice, and above it a cartouche with the logo. The film sets the volumes on the shelves
     as the reader arrives (record.setFill) and lays the words on the boards (HTML in perspective, on the
     quads returned here).
   - East wall: stacks the length of the hall, and a door to the archive (closed until the archive is
     built).
   - North wall: stacks to the doorway's left; the doorway's architrave on this side.
   - The floor: boards, a long rug down the middle; two long library tables flanking it, each with two
     green lamps and its chairs; an armchair and a globe. The ceiling beamed; globe pendants.
   - Outside: the walls whole, a plinth down to the garden, a hipped roof.
   Everything static is merged later with the house (kit.js, bake); the record's volumes are one
   instanced draw the film moves. Units as the study's (about 10 cm). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, oakTex, boardsTex, canvasTex, rng, contact, hipRoof } from './kit.js';
import { GARDEN } from './outside.js';
import { REC, SHELF0 as R_SHELF0, BOARD as R_BOARD, FRIEZE as R_FRIEZE, CORNICE as R_CORNICE, CREST as R_CREST, FACE, BAND, LAYOUT } from './record-layout.js';

export const HALL = {
  X0: -64, X1: -1, Z0: -7.5, Z1: -96, FLOOR: -7.5, TOP: 36.5, T: .6,
  // the west windows: centres along z, their width, the sill and the spring of the arch (its top w/2
  // above that)
  WINS: [-24, -44, -64, -84], WIN: { w: 8, y0: -1.5, y1: 21.5 },
  // the door to the archive, in the east wall
  DOOR: { z: -52, w: 9, top: 13 },
  // the record (record-layout.js: its left end, a bay's width, the bays, the wall's face, the shelves)
  REC,
};
export const RECORD_TOP = R_CREST[1];

// the bound volumes of each bay (02): their colours, and how thick and tall they run
const BAYS = [
  { cols: ['#22325A', '#1D2C53', '#2B3A5C', '#3D4E73', '#22325A', '#E9E2D3'], w: [.42, .62], h: [1.75, 2.1] },   // trial documents: navy binders
  { cols: ['#E9E2D3', '#F1ECE1', '#E2DACB', '#1D2C53', '#E9E2D3', '#B4500F'], w: [.85, 1.25], h: [1.9, 2.12] },   // clinical study reports: deep ivory binders
  { cols: ['#8C3B2E', '#5E7D66', '#3D4E73', '#A88B5E', '#7A8FA8', '#6B4E3A', '#C9D3E3', '#9E5A2C'], w: [.18, .34], h: [1.5, 2.0] },   // publications: journals
  { cols: ['#B4500F', '#D2A24C', '#C8622A', '#E9E2D3', '#D9B866', '#8BA290'], w: [.2, .32], h: [1.45, 1.75] },   // professionals trained: workbooks
];
const STACKS = ['#22325A', '#2B3A5C', '#3D4E73', '#8C3B2E', '#9E5A2C', '#B4500F', '#D2A24C', '#5E7D66', '#E9E2D3', '#C9D3E3', '#6B4E3A', '#7A8FA8', '#1D2C53', '#A88B5E', '#4F6B4C', '#7C3B24'];

export function buildHall({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, TOP, T } = HALL, W = X1 - X0, D = Z0 - Z1, R = rng(83);
  const wallMat = mat('#EAE2D3', { map: plasterTex('#EAE2D3', 9), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });
  const caseMat = mat('#A07A52', { map: oakTex('#A07A52', '#5E432B', 31), r: .66 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 27), r: .64 });
  const brass = mat(PAL.gold, { r: .32, m: .85 });

  // ---------- the floor, the rug, the ceiling and its beams ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#8A6A4F', { map: boardsTex('#8A6A4F', '#56402D', 13), r: .74 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set((X0 + X1) / 2, FLOOR, (Z0 + Z1) / 2); G.add(floor);
    const rugTex = canvasTex(256, 1024, (c, w, h) => {
      c.fillStyle = '#E4D8C2'; c.fillRect(0, 0, w, h);
      const r = rng(5); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${r() < .5 ? '120,90,60' : '255,250,240'},${.04 + r() * .05})`; c.fillRect(r() * w, r() * h, 2, 2); }
      c.strokeStyle = '#7C3B24'; c.lineWidth = 16; c.strokeRect(14, 14, w - 28, h - 28);
      c.strokeStyle = '#22325A'; c.lineWidth = 6; c.strokeRect(40, 40, w - 80, h - 80);
      c.fillStyle = 'rgba(124,59,36,.42)'; for (let y = 140; y < h - 120; y += 150) { c.beginPath(); c.moveTo(w / 2, y - 42); c.lineTo(w / 2 + 38, y); c.lineTo(w / 2, y + 42); c.lineTo(w / 2 - 38, y); c.closePath(); c.fill(); }
    }, { aniso: 8 });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(13, 62), mat('#FFFFFF', { map: rugTex, r: 1 }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(-32.5, FLOOR + .03, -50); rug.receiveShadow = true; G.add(rug);
    // the ceiling: a slab (it keeps the sun out but for the windows), beams across, a cornice round
    G.add(shadows(at(box(W + 2 * T, 1, D + 2 * T, mat('#EFE8DC', { r: 1 })), (X0 + X1) / 2, TOP + .5, (Z0 + Z1) / 2)));
    for (let z = Z0 - 12; z > Z1 + 6; z -= 13) G.add(at(rbox(W, 1.5, 1.3, .1, darkOak), (X0 + X1) / 2, TOP - .75, z));
    G.add(at(rbox(W, .9, .9, .15, trim), (X0 + X1) / 2, TOP - .45, Z1 + .45), at(rbox(W, .9, .9, .15, trim), (X0 + X1) / 2, TOP - .45, Z0 - .45));
    G.add(at(rbox(.9, .9, D, .15, trim), X0 + .45, TOP - .45, (Z0 + Z1) / 2), at(rbox(.9, .9, D, .15, trim), X1 - .45, TOP - .45, (Z0 + Z1) / 2));
  }

  // ---------- the walls ----------
  // west: drawn in its own plane (u = -z, v up) with its arched windows cut through, then turned to
  // stand at x = X1, its thickness outward (+x)
  {
    const { w, y0, y1 } = HALL.WIN;
    const s = new THREE.Shape([new THREE.Vector2(-Z0, FLOOR), new THREE.Vector2(-Z1 + T, FLOOR), new THREE.Vector2(-Z1 + T, TOP), new THREE.Vector2(-Z0, TOP)]);
    HALL.WINS.forEach(c => {
      const u = -c, p = new THREE.Path();
      p.moveTo(u - w / 2, y0); p.lineTo(u + w / 2, y0); p.lineTo(u + w / 2, y1); p.absarc(u, y1, w / 2, 0, Math.PI, false); p.lineTo(u - w / 2, y0);
      s.holes.push(p);
    });
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 16 });
    { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + Z0) / (D + T), (uv.getY(i) - FLOOR) / (TOP - FLOOR)); }
    // (a quarter turn about y takes the shape's u to -z and its depth to +x)
    g.rotateY(Math.PI / 2); g.translate(X1, 0, 0);
    G.add(shadows(new THREE.Mesh(g, wallMat)));
  }
  // east, south, north (beside the study, and above it); the study's own back wall closes the rest
  G.add(shadows(at(box(T, TOP - FLOOR, D + 2 * T, wallMat), X0 - T / 2, (FLOOR + TOP) / 2, (Z0 + Z1) / 2)));
  G.add(shadows(at(box(W + 2 * T, TOP - FLOOR, T, wallMat), (X0 + X1) / 2, (FLOOR + TOP) / 2, Z1 - T / 2)));
  G.add(shadows(at(box(-26.5 - (X0 - T), 15.5 - FLOOR, .5, wallMat), (X0 - T - 26.5) / 2, (FLOOR + 15.5) / 2, Z0 + .25)));
  G.add(shadows(at(box(W + 2 * T, TOP - 15.5, .5, wallMat), (X0 + X1) / 2, (15.5 + TOP) / 2, Z0 + .25)));
  // outside: the plinth down to the garden (its top a little below the floor), the roof
  G.add(shadows(at(box(W + 2 * T + .6, FLOOR - .3 - GARDEN, D + T + .6, mat('#CEC4B1', { r: .92 })), (X0 + X1) / 2, (FLOOR - .3 + GARDEN) / 2, (Z0 + Z1 - T) / 2 - .3)));
  G.add(hipRoof(X0 - T - 1.2, X1 + T + 1.2, Z1 - T - 1.2, Z0 + .5, TOP + 1, 18, mat('#6B7385', { r: .8 })));
  // the skirting along the west wall
  G.add(at(rbox(.14, .7, D, .03, trim), X1 - .07, FLOOR + .35, (Z0 + Z1) / 2));

  // ---------- the west windows: casings, the arch, sashes and glazing bars, sills, the glass ----------
  {
    const { w, y0, y1 } = HALL.WIN, cas = .5, fx = X1 + T * .55, bar = (bw, bh, by, bz) => at(rbox(.14, bh, bw, .02, trim), fx, by, bz);
    // a ring of the arch: a tube along a half circle in the wall's plane, about the window's centre c
    const archCurve = (c, r, th) => {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(new THREE.Vector3(0, y1 + Math.sin(a) * r, c + Math.cos(a) * r)); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, th, 6, false);
    };
    HALL.WINS.forEach(c => {
      // the casing round the opening, on the room's face
      G.add(at(rbox(.3, y1 - y0, cas, .05, trim), X1 - .1, (y0 + y1) / 2, c - w / 2 - cas / 2), at(rbox(.3, y1 - y0, cas, .05, trim), X1 - .1, (y0 + y1) / 2, c + w / 2 + cas / 2));
      const arch = new THREE.Mesh(archCurve(c, w / 2 + cas / 2, cas / 2), trim); arch.position.x = X1 - .1; arch.castShadow = arch.receiveShadow = true; G.add(arch);
      G.add(at(rbox(1.2, .34, w + 1.6, .06, trim), X1 - .5, y0 - .17, c));   // the sill
      // the sash: a mullion, a transom and the spring line, slender bars; the arch's fan: a ring, spokes
      G.add(bar(.22, y1 - y0, (y0 + y1) / 2, c));
      for (const ty of [y0 + (y1 - y0) * .36, y1]) G.add(bar(w, .2, ty, c));
      for (const bz of [c - w / 4, c + w / 4]) G.add(bar(.08, y1 - y0, (y0 + y1) / 2, bz));
      for (let i = 1; i < 4; i++) { const a = Math.PI * i / 4, len = w / 2; G.add(at(rbox(.12, len, .1, .02, trim), fx, y1 + Math.sin(a) * len / 2, c + Math.cos(a) * len / 2, { x: Math.PI / 2 - a })); }
      const ring = new THREE.Mesh(archCurve(c, w / 2 - .06, .1), trim); ring.position.x = fx; ring.castShadow = true; G.add(ring);
      // the glass (left out of the normals, so the view keeps its drawing)
      const gs = new THREE.Shape(); gs.moveTo(-w / 2, y0); gs.lineTo(w / 2, y0); gs.lineTo(w / 2, y1); gs.absarc(0, y1, w / 2, 0, Math.PI, false); gs.lineTo(-w / 2, y0);
      const glass = new THREE.Mesh(new THREE.ShapeGeometry(gs, 12), new THREE.MeshPhysicalMaterial({ color: '#E8F0F6', roughness: .05, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide }));
      glass.rotation.y = Math.PI / 2; glass.position.set(fx + .1, 0, c); glass.userData.noG = true; G.add(glass);
    });
  }

  // ---------- bookcases: a run against a wall, its books kept as rows for one instanced draw ----------
  const rows = [];   // { along: 'x' | 'z', a0, a1, y, face (where the books stand from), dir (toward the room), hMax }
  function bookcase({ along, a0, a1, face, dir, height = 30, shelves = 10, depth = 1.9, cornice = true }) {
    const len = a1 - a0, mid = (a0 + a1) / 2, put = (m, a, y, f) => along === 'x' ? at(m, a, y, f) : at(m, f, y, a);
    const bx = (la, h, d, m, a, y, f) => G.add(put(rbox(along === 'x' ? la : d, h, along === 'x' ? d : la, .03, m), a, y, f));
    bx(len, height, .25, caseMat, mid, FLOOR + height / 2, face + dir * .125);   // the back
    const pitch = (height - 2.2) / shelves;
    for (let i = 0; i <= shelves; i++) {
      const y = FLOOR + 1 + i * pitch;
      bx(len, .16, depth, caseMat, mid, y, face + dir * depth / 2);
      if (i < shelves) rows.push({ along, a0: a0 + .45, a1: a1 - .45, y: y + .08, face: face + dir * .3, dir, hMax: pitch - .4 });
    }
    const n = Math.max(1, Math.round(len / 10));
    for (let k = 0; k <= n; k++) bx(.36, height, depth + .1, caseMat, a0 + len * k / n, FLOOR + height / 2, face + dir * (depth + .1) / 2);   // the uprights
    if (cornice) bx(len + .8, .7, depth + .5, darkOak, mid, FLOOR + height + .35, face + dir * (depth + .5) / 2);
    bx(len, 1, depth + .05, darkOak, mid, FLOOR + .5, face + dir * depth / 2);   // the plinth
  }
  // east wall: either side of the archive's door
  const DR = HALL.DOOR;
  bookcase({ along: 'z', a0: Z1 + 1, a1: DR.z - DR.w / 2 - 1.4, face: X0, dir: 1 });
  bookcase({ along: 'z', a0: DR.z + DR.w / 2 + 1.4, a1: Z0 - 2.8, face: X0, dir: 1 });
  // north wall, to the doorway's left
  bookcase({ along: 'x', a0: X0 + 2.8, a1: -13.4, face: Z0, dir: -1, height: 24, shelves: 8 });
  // west wall, between the windows (narrow, full height)
  {
    const { w } = HALL.WIN, edges = [Z0 - .4, ...HALL.WINS.flatMap(c => [c + w / 2 + 1.1, c - w / 2 - 1.1]), Z1 + 2.6];
    for (let i = 0; i + 1 < edges.length; i += 2) { const a1 = edges[i], a0 = edges[i + 1]; if (a1 - a0 > 4) bookcase({ along: 'z', a0, a1, face: X1, dir: -1, height: 28, shelves: 9, depth: 1.6 }); }
  }
  // the door to the archive (closed for now: the archive is the next room to be built), its architrave
  {
    const z = DR.z, w = .6, panelMat = mat('#E1D8C6', { r: .72 });
    G.add(at(rbox(.16, DR.top - FLOOR + w, w, .04, trim), X0 + .08, (FLOOR + DR.top + w) / 2, z - DR.w / 2 - w / 2), at(rbox(.16, DR.top - FLOOR + w, w, .04, trim), X0 + .08, (FLOOR + DR.top + w) / 2, z + DR.w / 2 + w / 2));
    G.add(at(rbox(.16, w, DR.w + 2 * w, .04, trim), X0 + .08, DR.top + w / 2, z));
    G.add(at(rbox(.3, DR.top - FLOOR, DR.w, .05, mat('#E8E0D0', { r: .7 })), X0 + .15, (FLOOR + DR.top) / 2, z));
    for (const [fy, fh] of [[.68, .5], [.22, .3]]) for (const dz of [-DR.w / 4, DR.w / 4]) G.add(at(rbox(.06, (DR.top - FLOOR) * fh * .85, DR.w * .36, .03, panelMat), X0 + .32, FLOOR + (DR.top - FLOOR) * fy, z + dz));
    for (const dz of [-.5, .5]) G.add(at(cyl(.13, .13, .45, brass, 14), X0 + .45, FLOOR + 9.5, z + dz, { z: Math.PI / 2 }));
  }
  // the doorway from the study: its architrave on this side
  {
    const z = Z0 - .08, w = .7, d0 = -11.5, d1 = -3.6, top = 12.4;
    G.add(at(rbox(w, top - FLOOR + w, .16, .04, trim), d0 - w / 2, (FLOOR + top + w) / 2, z), at(rbox(w, top - FLOOR + w, .16, .04, trim), d1 + w / 2, (FLOOR + top + w) / 2, z));
    G.add(at(rbox(d1 - d0 + 2 * w, w, .16, .04, trim), (d0 + d1) / 2, top + w / 2, z));
  }

  // ---------- the stacks' books: plain boxes in one instanced draw ----------
  {
    const items = [];
    for (const row of rows) {
      for (let a = row.a0; a < row.a1;) {
        if (R() < .04) { a += .25 + R() * .6; continue; }
        const bw = .24 + R() * .3, bh = Math.min(row.hMax, 1.45 + R() * 1.05), bd = 1.15 + R() * .3;
        if (a + bw > row.a1) break;
        const lean = R() < .025 ? (R() - .5) * .22 : 0;
        items.push({ row, a: a + bw / 2, y: row.y + bh / 2, f: row.face + row.dir * bd / 2, w: bw, h: bh, d: bd, lean, col: STACKS[Math.floor(R() * STACKS.length)], k: .82 + R() * .3 });
        a += bw + .015;
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', { r: .8 }), items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
    items.forEach((b, i) => {
      if (b.row.along === 'x') { e.set(0, 0, b.lean); sc.set(b.w, b.h, b.d); p.set(b.a, b.y, b.f); }
      else { e.set(b.lean, 0, 0); sc.set(b.d, b.h, b.w); p.set(b.f, b.y, b.a); }
      q.setFromEuler(e); mesh.setMatrixAt(i, m4.compose(p, q, sc)); mesh.setColorAt(i, cc.set(b.col).multiplyScalar(b.k));
    });
    mesh.castShadow = false; mesh.receiveShadow = true;
    G.add(mesh);
  }

  // ---------- the record ----------
  // (its lettered band, the boards, the frieze and the cartouche, lies flush in one plane, FACE, so the
  // words and the loader's card line up with it: record-layout.js)
  const rx0 = REC.x0, rx1 = REC.x0 + REC.bays * REC.bay, rcx = (rx0 + rx1) / 2, back = REC.z, front = REC.z + REC.depth;
  const face = FACE - .02;   // (the band's painted face, the words a hair in front of it)
  {
    const height = R_CORNICE[0] - FLOOR;
    G.add(at(rbox(rx1 - rx0, height, .3, .03, caseMat), rcx, FLOOR + height / 2, back + .15));   // the back
    for (let b = 0; b < REC.bays; b++) {
      const a0 = rx0 + b * REC.bay, mid = a0 + REC.bay / 2, bd = LAYOUT.boards[b];
      for (let i = 1; i <= REC.shelves; i++) G.add(at(rbox(REC.bay - .4, .16, REC.depth - .1, .03, caseMat), mid, R_SHELF0 + i * REC.pitch - .08, back + REC.depth / 2));
      // the bay's board, ivory, standing a little proud of the uprights (its figure is laid on it)
      G.add(at(rbox(bd.w + .5, R_BOARD[1] - R_BOARD[0] + .3, .4, .06, mat('#F2ECDF', { r: .7 })), mid, (R_BOARD[0] + R_BOARD[1]) / 2, face - .2));
      // its lamp: a brass picture light under the board, its long shade out over the books (below the
      // board, so the board's words are never drawn over it)
      G.add(at(rbox(4.2, .34, .5, .15, brass), mid, R_BOARD[0] - .45, face + .8));
      for (const dx of [-1.3, 1.3]) G.add(at(rbox(.14, .14, .9, .05, brass), mid + dx, R_BOARD[0] - .3, face + .4));
    }
    // the uprights, the plinth, the frieze (navy, lettered by the film), the cornice, the cartouche
    for (let b = 0; b <= REC.bays; b++) G.add(at(rbox(.8, R_BOARD[0] - FLOOR, REC.depth + .25, .06, darkOak), rx0 + b * REC.bay, (FLOOR + R_BOARD[0]) / 2, back + (REC.depth + .25) / 2));
    G.add(at(rbox(rx1 - rx0 + .8, REC.plinth, REC.depth + .3, .05, darkOak), rcx, FLOOR + REC.plinth / 2, back + (REC.depth + .3) / 2));
    // (behind the boards, a panel of the case's oak fills the band, so nothing shows between them)
    G.add(at(rbox(rx1 - rx0 + .8, R_FRIEZE[0] - R_BOARD[0] + .2, .5, .04, darkOak), rcx, (R_BOARD[0] + R_FRIEZE[0]) / 2, face - .65));
    G.add(at(rbox(BAND.x1 - BAND.x0, R_FRIEZE[1] - R_FRIEZE[0], .5, .05, mat('#22325A', { r: .5 })), rcx, (R_FRIEZE[0] + R_FRIEZE[1]) / 2, face - .25));
    G.add(at(rbox(rx1 - rx0 + 2.2, R_CORNICE[1] - R_CORNICE[0], face - back + 1, .12, darkOak), rcx, (R_CORNICE[0] + R_CORNICE[1]) / 2, back + (face - back + 1) / 2));
    const cr = LAYOUT.crest, cy = (R_CREST[0] + R_CREST[1]) / 2;
    G.add(at(rbox(cr.w + .7, cr.h + .7, .3, .2, brass), rcx, cy, face - .3), at(rbox(cr.w, cr.h, .4, .12, mat('#F4EEE2', { r: .7 })), rcx, cy, face - .2));
    G.add(at(rbox(cr.w - 2, R_CREST[0] - R_CORNICE[1] + .2, .9, .05, darkOak), rcx, (R_CORNICE[1] + R_CREST[0]) / 2, face - .6));   // its foot on the cornice
    G.add(contact(rx1 - rx0 + 3, 4, rcx, front + 1, { y: FLOOR, k: .3 }));
  }
  // the record's volumes: every one has its turn (bay by bay from the left; in a bay, shelf by shelf from
  // the top, along each shelf from the left, as lines are written). setFill(k) shelves them as far as k
  // goes (each bay a quarter of it), each volume rising onto its shelf as its turn comes; it returns
  // each bay's share shelved
  const record = (() => {
    const items = [], RR = rng(97);
    for (let b = 0; b < REC.bays; b++) {
      const spec = BAYS[b], a0 = rx0 + b * REC.bay + .55, a1 = rx0 + (b + 1) * REC.bay - .55;
      for (let s = REC.shelves - 1; s >= 0; s--) {
        const y = R_SHELF0 + s * REC.pitch;
        for (let a = a0; a < a1;) {
          const bw = spec.w[0] + RR() * (spec.w[1] - spec.w[0]), bh = Math.min(REC.pitch - .45, spec.h[0] + RR() * (spec.h[1] - spec.h[0])), bd = 1.35 + RR() * .3;
          if (a + bw > a1) break;
          items.push({ bay: b, x: a + bw / 2, y, z: back + .32 + bd / 2, w: bw, h: bh, d: bd, col: spec.cols[Math.floor(RR() * spec.cols.length)], k: .86 + RR() * .24 });
          a += bw + .02;
        }
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', { r: .76, fresh: true }), items.length);
    const cc = new THREE.Color();
    items.forEach((b, i) => mesh.setColorAt(i, cc.set(b.col).multiplyScalar(b.k)));
    mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false;
    mesh.userData.keep = true;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const perBay = Array.from({ length: REC.bays }, (_, b) => items.filter(it => it.bay === b).length);
    const starts = perBay.map((n, i) => perBay.slice(0, i).reduce((a, v) => a + v, 0));
    const RISE = 6;   // how many volumes are on their way up at once
    let shown = -1;
    function setFill(k) {
      const key = Math.round(k * 4000);
      if (key === shown) return null;
      shown = key;
      const shares = perBay.map((n, b) => Math.max(0, Math.min(1, k * REC.bays - b)));
      items.forEach((it, i) => {
        const b = it.bay, turn = shares[b] * (perBay[b] + RISE) - (i - starts[b]);
        const u = Math.max(0, Math.min(1, turn / RISE)), e = u * u * (3 - 2 * u);
        if (e <= 0) { sc.set(1e-4, 1e-4, 1e-4); p.set(it.x, it.y, it.z); }
        else { sc.set(it.w, it.h * e, it.d); p.set(it.x, it.y + it.h * e / 2, it.z); }
        mesh.setMatrixAt(i, m4.compose(p, q, sc));
      });
      mesh.instanceMatrix.needsUpdate = true;
      return shares;
    }
    setFill(0);
    return { mesh, setFill, count: items.length };
  })();
  G.add(record.mesh);
  // where the record's words are laid (each four corners: top left, top right, bottom right, bottom
  // left), in the world: the band's parts, in its one plane
  const quadOf = r => { const x0 = BAND.x0 + r.x, y1 = BAND.top - r.y; return [[x0, y1, FACE], [x0 + r.w, y1, FACE], [x0 + r.w, y1 - r.h, FACE], [x0, y1 - r.h, FACE]]; };
  const boards = LAYOUT.boards.map(quadOf), frieze = quadOf(LAYOUT.frieze), crest = quadOf(LAYOUT.crest);
  // the bays' lamps (their glows, for the film)
  const bayLamps = Array.from({ length: REC.bays }, (_, b) => [rx0 + (b + .5) * REC.bay, R_BOARD[0] - .7, face + .85]);

  // ---------- the tables, their lamps and chairs; an armchair, a globe ----------
  const tableTop = FLOOR + 7.6, lamps = [];
  const table = (cx, cz, w, d) => {
    G.add(at(rbox(w, .5, d, .1, darkOak), cx, tableTop - .25, cz));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.6, 7.1, .6, .08, darkOak), cx + sx * (w / 2 - .8), FLOOR + 3.55, cz + sz * (d / 2 - .8)));
    G.add(at(rbox(.3, .9, d - 1.8, .05, darkOak), cx - w / 2 + .8, tableTop - 1, cz), at(rbox(.3, .9, d - 1.8, .05, darkOak), cx + w / 2 - .8, tableTop - 1, cz));
    G.add(contact(w + 1.6, d + 1.6, cx, cz, { y: FLOOR, k: .28 }));
  };
  const chair = (cx, cz, ry) => {
    const c = group(at(rbox(2.3, .32, 2.2, .06, darkOak), 0, 4.6, 0), at(rbox(2.3, 4.6, .26, .06, darkOak), 0, 7, -.98));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(at(rbox(.26, 4.6, .26, .05, darkOak), sx * .95, 2.3, sz * .9));
    c.add(at(rbox(1.9, .7, 1.9, .2, mat('#7C3B24', { r: .9 })), 0, 4.95, .05));   // the seat's leather
    c.position.set(cx, FLOOR, cz); c.rotation.y = ry; G.add(c);
    G.add(contact(2.9, 2.9, cx, cz, { y: FLOOR, k: .22 }));
  };
  const bankerLamp = (x, z) => {
    const g = group();
    g.add(at(cyl(.55, .65, .16, brass, 24), 0, .08, 0), at(cyl(.07, .07, 1.5, brass, 12), 0, .9, 0));
    // the shade: half a green glass tube along the table, open toward the desk below
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.2, 24, 1, true, Math.PI / 2, Math.PI), mat('#2F6B4F', { r: .3, side: THREE.DoubleSide }));
    shade.rotation.x = Math.PI / 2; shade.position.set(0, 1.75, 0); shade.castShadow = true; g.add(shade);
    g.add(at(cyl(.42, .42, .06, brass, 24), 0, 1.75, -1.1, { x: Math.PI / 2 }), at(cyl(.42, .42, .06, brass, 24), 0, 1.75, 1.1, { x: Math.PI / 2 }));
    g.position.set(x, tableTop, z); G.add(g);
    lamps.push([x, tableTop + 1.45, z]);
  };
  for (const [cx, side] of [[-45, 1], [-20, -1]]) {
    table(cx, -47, 6.5, 38);
    bankerLamp(cx, -36); bankerLamp(cx, -58);
    for (const cz of [-36, -47, -58]) { chair(cx - 4.6, cz, Math.PI / 2); chair(cx + 4.6, cz, -Math.PI / 2); }
    // (on the tables: two closed volumes, an open one)
    G.add(at(rbox(1.6, .4, 2.2, .06, mat(STACKS[cx > -30 ? 3 : 0], { r: .8 })), cx - 1.4 * side, tableTop + .2, -42, { y: .2 }));
    G.add(at(rbox(1.5, .3, 2.0, .05, mat(STACKS[cx > -30 ? 9 : 6], { r: .8 })), cx - 1.3 * side, tableTop + .55, -42.2, { y: .05 }));
    G.add(at(rbox(3, .12, 2.1, .03, mat('#F3EEE2', { r: .9 })), cx + .4 * side, tableTop + .06, -52, { y: -.1 }));
  }
  // an armchair by the first window, its side table; a globe on its stand near the record
  {
    const leather = mat('#7C3B24', { r: .7 }), ac = group(at(rbox(4, 2, 4, .5, leather), 0, 2.4, 0), at(rbox(4, 4.4, 1, .45, leather), 0, 4.6, -1.6), at(rbox(.9, 2.6, 4, .4, leather), -2, 3.4, 0), at(rbox(.9, 2.6, 4, .4, leather), 2, 3.4, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ac.add(at(rbox(.3, 1.4, .3, .08, darkOak), sx * 1.6, .7, sz * 1.6));
    ac.position.set(-8, FLOOR, -30); ac.rotation.y = -2.1; G.add(ac);
    G.add(contact(5, 5, -8, -30, { y: FLOOR, k: .26 }));
    const st = group(at(cyl(1.1, 1.1, .2, darkOak, 24), 0, 5, 0), at(cyl(.18, .18, 4.8, darkOak, 10), 0, 2.5, 0), at(cyl(.9, 1, .2, darkOak, 20), 0, .1, 0));
    st.position.set(-7.5, FLOOR, -36); G.add(st); G.add(contact(2.6, 2.6, -7.5, -36, { y: FLOOR, k: .22 }));
    const globeTex = canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = '#E6D7B4'; c.fillRect(0, 0, w, h);
      const r = rng(19); c.fillStyle = '#B9A274';
      for (let i = 0; i < 9; i++) { c.beginPath(); const x = r() * w, y = 40 + r() * (h - 80), s = 30 + r() * 60; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, rr = s * (.6 + r() * .5); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .7); } c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(90,70,40,.3)'; c.lineWidth = 1; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    }, { aniso: 4 });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 20), mat('#FFFFFF', { map: globeTex, r: .45 }));
    globe.position.set(-8.5, FLOOR + 8.6, -80); globe.rotation.z = .4; globe.castShadow = globe.receiveShadow = true; G.add(globe);
    const ringG = new THREE.Mesh(new THREE.TorusGeometry(2.2, .08, 8, 48), brass); ringG.position.copy(globe.position); ringG.rotation.set(0, Math.PI / 2, .4); ringG.castShadow = true; G.add(ringG);
    G.add(at(cyl(.12, .2, 4.4, darkOak, 10), -8.5, FLOOR + 4.4, -80), at(cyl(1.4, 1.6, .3, darkOak, 24), -8.5, FLOOR + .15, -80));
    G.add(contact(3.6, 3.6, -8.5, -80, { y: FLOOR, k: .24 }));
  }

  // ---------- the pendants: globes on long rods from the beams ----------
  // (two, over the near half of the hall: from the record's view they are above the frame, never
  // hanging across the record's lettering)
  const pendants = [];
  for (const z of [-24, -48]) {
    G.add(at(cyl(.07, .07, 9, mat(PAL.graphite, { r: .4, m: .6 }), 8), -32.5, TOP - 4.5, z));
    G.add(at(cyl(.5, .7, .5, brass, 16), -32.5, TOP - 9, z));
    const glob = new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 18), mat('#FFF6E6', { emissive: '#FFE3B0', ek: 1.25, r: .4 }));
    glob.position.set(-32.5, TOP - 10.6, z); G.add(glob);
    pendants.push([-32.5, TOP - 10.6, z]);
  }

  return {
    group: G, record, boards, frieze, crest, bayLamps, lamps, pendants,
    // the record's middle on its face, its top, its ends (x), its face (z)
    centre: [rcx, (FLOOR + RECORD_TOP) / 2, front], top: RECORD_TOP, ends: [rx0 - 1.2, rx1 + 1.2], front,
  };
}
