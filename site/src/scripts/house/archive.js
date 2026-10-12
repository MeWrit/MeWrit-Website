/* The strong room (site/docs/redesign-plan.md, 11.12 and 11.14): the archive, east of the library hall,
   through the strong-room door in the hall's east wall. 03, Regulatory writing, at night. Dossiers are
   confidential until they are approved, so they are made here, behind a locked door, among the records
   they are built from; the hall before it is public (what is on the record), the reading room beyond it
   public again (what is published). The compass: -z is south, +x west. The camera comes in through the
   door turning left (east) and looks down the room: every walk round the house turns left once.
   - Two storeys: locked cabinets behind brass lattice on both levels, along the north, east and south
     walls; above them a gallery round three sides on slim iron columns, its brass rail, a spiral stair
     up to it in the north-east corner.
   - Over the long table, a glazed lantern in the ceiling: the night sky in it, the lamps hung from it.
   - The table and its chairs; at its near end the writer's desk, where the work 03 does is done
     (dossier.js); on the south wall a bay of clinical study reports that opens for it (room.set).
   - The door: a square strong-room door of painted steel, its brass hinges, wheel and plate ("Regulatory
     · Confidential"), set in the hall's wall; it opens inward as the reader walks up and shuts behind
     the camera (door.set). The door on to the reading room is its quieter twin; it opens the same way,
     into the strong room, as the reader goes on to 04 (door2.set).
   Units as the house's (about 10 cm). Everything static is merged with the house (kit.js, bake); the
   door and the dossier are kept (userData.keep). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, oakTex, boardsTex, rng, contact, canvasTex } from './kit.js';
import { GARDEN } from './outside.js';
import { HALL } from './hall.js';
import { bookGeometry, bookMaterial, pickSpine } from './books.js';
import { buildDossier } from './dossier.js';
import { sheet, font, wrap } from './paper.js';

export const ARCHIVE = {
  X0: -110, X1: HALL.X0 - HALL.T, Z0: -28, Z1: -76, FLOOR: -7.5, TOP: 38, T: .6,
  // the gallery: its deck's top, how far it comes out from the walls, its rail's height
  GALLERY: { y: 15.5, d: 7, rail: 9 },
  // the lantern's opening in the ceiling (x0 to x1 along the room, z0 to z1 across), its glazed sides' height
  LANTERN: { x0: -83, x1: -103, z0: -46.5, z1: -57.5, h: 3.4 },
  // the spiral stair to the gallery: its middle, its radius
  STAIR: { x: -99.4, z: -39.2, r: 2.5 },
  // the door on to the reading room, in the east wall under the gallery
  DOOR: { z: -52, w: 8, top: 12.5 },
  // the table: its near and far ends (x), its middle across (z), its width, its top
  TABLE: { x0: -84, x1: -102, z: -52, w: 11, top: .1 },
  // the writer's display (dossier.js): its glass, across the table's middle; the bay of clinical study
  // reports that opens (03, step 3: the south wall's ground floor, counted from the east)
  DOSSIER: { x: -89, z: -52 }, SCREEN: { x: -89, z: -52 }, CSR_BAY: 4,
};

// the brass lattice of the cabinets' doors (drawn once, repeated: a diamond mesh on nothing)
let latticeTex = null;
const lattice = () => latticeTex || (latticeTex = canvasTex(128, 128, (c, W, H) => {
  c.clearRect(0, 0, W, H);
  c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'square';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, H); c.moveTo(W, 0); c.lineTo(0, H); c.stroke();
}, { repeat: [1, 1], aniso: 4 }));
// the brass plate on the strong-room door: engraved, its letters filled black
const plateTex = () => canvasTex(1024, 300, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#E2C27A'); g.addColorStop(.5, '#C9A24E'); g.addColorStop(1, '#B98F3E');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(60,40,10,.55)'; c.lineWidth = 6; c.strokeRect(18, 18, W - 36, H - 36);
  c.fillStyle = '#231A0C'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '600 92px "Fraunces Variable", Georgia, serif';
  if ('letterSpacing' in c) c.letterSpacing = '14px';
  c.fillText('REGULATORY', W / 2, H * .36);
  c.font = '500 64px "Fraunces Variable", Georgia, serif';
  if ('letterSpacing' in c) c.letterSpacing = '18px';
  c.fillText('CONFIDENTIAL', W / 2, H * .7);
  // (a fine polish, and the screws)
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,250,230,${.03 + Math.random() * .04})`; c.fillRect(0, Math.random() * H, W, 1); }
  c.fillStyle = '#6E5420'; for (const [x, y] of [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]]) { c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); }
}, { aniso: 8 });

export function buildArchive({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, TOP, T, TABLE, GALLERY: GY, LANTERN: LN } = ARCHIVE, W = X1 - X0, D = Z0 - Z1, R = rng(131);
  const wallMat = mat('#E7DFCF', { map: plasterTex('#E7DFCF', 13), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });
  const oak = mat('#9C774F', { map: oakTex('#9C774F', '#5A402A', 41), r: .62 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 27), r: .64 });
  const iron = mat('#3A3F48', { r: .5, m: .45 });
  const brass = mat(PAL.gold, { r: .32, m: .85 });
  const xm = (X0 + X1) / 2, zm = (Z0 + Z1) / 2, deck = GY.y, under = deck - .5;

  // ---------- the floor, the walls, the ceiling round the lantern ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#806247', { map: boardsTex('#806247', '#4E3926', 17), r: .76 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(xm, FLOOR, zm); G.add(floor);
    // north and south, whole; east, open where the door on to the reading room is (three pieces)
    G.add(shadows(at(box(W + T, TOP - FLOOR, T, wallMat), xm - T / 2, (FLOOR + TOP) / 2, Z0 + T / 2)));
    G.add(shadows(at(box(W + T, TOP - FLOOR, T, wallMat), xm - T / 2, (FLOOR + TOP) / 2, Z1 - T / 2)));
    const DR = ARCHIVE.DOOR, ex = X0 - T / 2, zN = DR.z + DR.w / 2, zS = DR.z - DR.w / 2;
    G.add(shadows(at(box(T, TOP - FLOOR, Z0 + T - zN, wallMat), ex, (FLOOR + TOP) / 2, (Z0 + T + zN) / 2)));
    G.add(shadows(at(box(T, TOP - FLOOR, zS - (Z1 - T), wallMat), ex, (FLOOR + TOP) / 2, (zS + Z1 - T) / 2)));
    G.add(shadows(at(box(T, TOP - DR.top, DR.w, wallMat), ex, (DR.top + TOP) / 2, DR.z)));
    // west: the hall's east wall serves, to the hall's height; above it, to this ceiling, a band of wall
    G.add(shadows(at(box(T, TOP + 1 - HALL.TOP, D + 2 * T, wallMat), X1 + T / 2, (HALL.TOP + TOP + 1) / 2, zm)));
    // the ceiling: four pieces round the lantern's opening, a cornice round the room
    const ceil = mat('#EFE8DC', { r: 1 }), cy = TOP + .5;
    for (const [x0, x1, z0, z1] of [[X0 - T, X1, Z0 + T, LN.z0], [X0 - T, X1, LN.z1, Z1 - T], [X0 - T, LN.x1, LN.z0, LN.z1], [LN.x0, X1, LN.z0, LN.z1]]) G.add(shadows(at(box(x1 - x0, 1, z0 - z1, ceil), (x0 + x1) / 2, cy, (z0 + z1) / 2)));
    for (const [w, d, x, z] of [[W, .9, xm, Z0 - .45], [W, .9, xm, Z1 + .45], [.9, D, X0 + .45, zm], [.9, D, X1 - .45, zm]]) G.add(at(rbox(w, .9, d, .15, trim), x, TOP - .45, z));
    // the skirting round the floor
    for (const [w, d, x, z] of [[W, .12, xm, Z0 - .06], [W, .12, xm, Z1 + .06], [.12, D, X0 + .06, zm]]) G.add(at(rbox(w, .6, d, .03, trim), x, FLOOR + .3, z));
    // outside: the plinth down to the garden; a flat roof round the lantern, its parapet
    G.add(shadows(at(box(W + T + .6, FLOOR - .3 - GARDEN, D + 2 * T + .6, mat('#CEC4B1', { r: .92 })), xm - T / 2, (FLOOR - .3 + GARDEN) / 2, zm)));
    const roof = mat('#6B7385', { r: .8 }), ry = TOP + 1.25;
    for (const [x0, x1, z0, z1] of [[X0 - T - .6, X1 + T, Z0 + T + .6, LN.z0 + .6], [X0 - T - .6, X1 + T, LN.z1 - .6, Z1 - T - .6], [X0 - T - .6, LN.x1 - .6, LN.z0 + .6, LN.z1 - .6], [LN.x0 + .6, X1 + T, LN.z0 + .6, LN.z1 - .6]]) G.add(shadows(at(box(x1 - x0, .5, z0 - z1, roof), (x0 + x1) / 2, ry, (z0 + z1) / 2)));
    const par = mat('#CEC4B1', { r: .92 });
    for (const [w, d, x, z] of [[W + 2 * T + 1.2, 1, xm, Z0 + T + .3], [W + 2 * T + 1.2, 1, xm, Z1 - T - .3], [1, D + 2 * T, X0 - T - .3, zm]]) G.add(shadows(at(box(w, 2.2, d, par), x, ry + 1.1, z)));
  }

  // ---------- the lantern: its curb, its glazed sides and hipped glass roof on slender bronze bars ----------
  {
    const bronze = mat('#5A4A36', { r: .45, m: .5 }), glassMat = new THREE.MeshPhysicalMaterial({ color: '#BFD0E6', roughness: .05, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide });
    const { x0, x1, z0, z1, h } = LN, lx = (x0 + x1) / 2, lz = (z0 + z1) / 2, lw = x0 - x1, ld = z0 - z1, c0 = TOP + 1, c1 = c0 + h, rise = 3.2;
    // the curb (a deep moulded frame round the opening)
    for (const [w, d, x, z] of [[lw + 1.2, .6, lx, z0 + .3], [lw + 1.2, .6, lx, z1 - .3], [.6, ld, x0 + .3, lz], [.6, ld, x1 - .3, lz]]) G.add(at(rbox(w, 1.6, d, .1, darkOak), x, TOP + .3, z));
    // the glazed sides: a sill, a head, mullions
    const side = (len, along, at0, fixed) => {
      for (const y of [c0 + .15, c1 - .15]) G.add(along === 'x' ? at(rbox(len, .3, .3, .05, bronze), at0, y, fixed) : at(rbox(.3, .3, len, .05, bronze), fixed, y, at0));
      const n = Math.round(len / 2.2);
      for (let i = 0; i <= n; i++) { const a = at0 - len / 2 + len * i / n; G.add(along === 'x' ? at(rbox(.16, h, .16, .03, bronze), a, (c0 + c1) / 2, fixed) : at(rbox(.16, h, .16, .03, bronze), fixed, (c0 + c1) / 2, a)); }
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, h), glassMat); pane.userData.noG = true;
      if (along === 'x') pane.position.set(at0, (c0 + c1) / 2, fixed); else { pane.rotation.y = Math.PI / 2; pane.position.set(fixed, (c0 + c1) / 2, at0); }
      G.add(pane);
    };
    side(lw, 'x', lx, z0); side(lw, 'x', lx, z1); side(ld, 'z', lz, x0); side(ld, 'z', lz, x1);
    // the hipped roof: four sloped panes to a ridge along the room, the ridge, the hips, a few rafters
    const r0 = lw / 2 - ld / 2, ridge = [[lx + r0, c1 + rise, lz], [lx - r0, c1 + rise, lz]];
    const corners = [[x0, c1, z0], [x1, c1, z0], [x1, c1, z1], [x0, c1, z1]];
    const tri = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, glassMat); m.userData.noG = true; G.add(m); };
    tri([corners[0], corners[1], ridge[1], corners[0], ridge[1], ridge[0]]);   // north slope
    tri([corners[3], ridge[0], ridge[1], corners[3], ridge[1], corners[2]]);   // south slope
    tri([corners[0], ridge[0], corners[3]]); tri([corners[1], corners[2], ridge[1]]);   // the hipped ends
    const bar = (a, b, r = .09) => { const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 8), bronze); m.position.set(...a).add(v.clone().multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.castShadow = true; G.add(m); };
    bar(ridge[0], ridge[1], .12);
    bar(corners[0], ridge[0]); bar(corners[3], ridge[0]); bar(corners[1], ridge[1]); bar(corners[2], ridge[1]);
    const nr = Math.round((lw - ld) / 2.2);
    for (let i = 1; i < nr; i++) { const x = ridge[0][0] - (ridge[0][0] - ridge[1][0]) * i / nr; bar([x, c1, z0], [x, c1 + rise, lz]); bar([x, c1, z1], [x, c1 + rise, lz]); }
  }

  // ---------- the cabinets: shelving behind locked doors, two storeys of them. Below on the ground floor,
  // panelled oak cupboard doors; above them, and all along the gallery's storey, doors of antique brass
  // lattice (the records seen through it, kept). One bay of clinical study reports opens (below) ----------
  const rows = [];   // { along, a0, a1, y, face, dir, hMax, fam }
  const latMat = new THREE.MeshStandardMaterial({ color: '#9C7A3C', alphaMap: lattice(), alphaTest: .5, metalness: .45, roughness: .55, side: THREE.DoubleSide });
  const panel = mat('#8A6746', { map: oakTex('#8A6746', '#4A3220', 61), r: .6 });
  // a brass plate on a run's cornice naming the part of the dossier its records belong to (the CTD's
  // modules, ICH M4)
  const plate = (label, w) => {
    const tex = canvasTex(1200, 110, (c, W, H) => {
      const g0 = c.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#E2C784'); g0.addColorStop(.5, '#C9A45C'); g0.addColorStop(1, '#A9843E');
      c.fillStyle = g0; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,55,20,.6)'; c.lineWidth = 4; c.strokeRect(9, 9, W - 18, H - 18);
      c.fillStyle = '#33240E'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '6px';
      let fs = 50; c.font = `600 ${fs}px Georgia, serif`;
      while (c.measureText(label).width > W - 70) { fs -= 1; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(label, W / 2 + 3, H / 2 + 2);
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 110 / 1200), mat('#FFFFFF', { map: tex, r: .35, m: .6 }));
  };
  function cabinets({ along, a0, a1, face, dir, y0, height, shelves, depth = 2.2, fam, lower = 0, gap = -1, label = '' }) {
    const len = a1 - a0, mid = (a0 + a1) / 2, put = (m, a, y, f) => along === 'x' ? at(m, a, y, f) : at(m, f, y, a);
    const bx = (la, h, d, m, a, y, f) => G.add(put(rbox(along === 'x' ? la : d, h, along === 'x' ? d : la, .03, m), a, y, f));
    const top = y0 + height - .8, base = y0 + 1.1, ly = base + lower;   // (the cornice's foot; the plinth's top; where the lattice begins)
    const n = Math.max(1, Math.round(len / 3.4)), bw = len / n, fz = face + dir * (depth + .02);
    // (in the bay that opens, the lowest shelf a reader can work at is kept clear for its reference shelf)
    const g0 = a0 + bw * gap, g1 = g0 + bw;
    let ref = null;
    bx(len, height, .2, darkOak, mid, y0 + height / 2, face + dir * .1);   // the back
    const pitch = (height - 2.4) / shelves;
    for (let i = 0; i <= shelves; i++) {
      const y = y0 + 1.2 + i * pitch;
      bx(len, .14, depth - .3, darkOak, mid, y, face + dir * (depth - .3) / 2);
      // (only the shelves the lattice shows are filled: behind the oak doors nothing is seen)
      if (i >= shelves || y + pitch <= ly + .4) continue;
      const row = { along, y: y + .07, face: face + dir * .25, dir, hMax: pitch - .4, fam };
      if (gap >= 0 && ref === null && y > ly + 1) { ref = y + .07; rows.push({ ...row, a0: a0 + .35, a1: g0 - .1 }, { ...row, a0: g1 + .1, a1: a1 - .35 }); }
      else rows.push({ ...row, a0: a0 + .35, a1: a1 - .35 });
    }
    bx(len + .4, 1.1, depth + .1, darkOak, mid, y0 + .55, face + dir * (depth + .1) / 2);   // the plinth
    bx(len + .6, .8, depth + .4, darkOak, mid, top + .4, face + dir * (depth + .4) / 2);   // the cornice
    // (on the ground floor at eye height, on the cupboards' tops just under the rail below the lattice (clear
    // of the opening bay's doors as they swing), in the middle
    // of a bay; up on the gallery, on the cornice)
    if (label) {
      const pw = Math.min(len * .5, lower ? bw * (gap >= 0 ? .86 : 2.1) : 8), pl = plate(label, pw);
      const py = lower ? ly + .05 : top + .4, f = lower ? fz + dir * .16 : face + dir * (depth + .4 + .012);
      const pa = lower ? (gap >= 0 ? a0 + bw * (gap + .5) : mid) : mid;   // (under the bay that opens, if the run has one)
      if (along === 'x') { pl.position.set(pa, py, f); if (dir < 0) pl.rotation.y = Math.PI; }
      else { pl.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; pl.position.set(f, py, pa); }
      G.add(pl);
    }
    // the bays: an upright between each; each bay's two doors meet at a brass stile with a small lock
    for (let k = 0; k <= n; k++) bx(.3, top - base, depth, darkOak, a0 + bw * k, (base + top) / 2, face + dir * depth / 2);
    for (let k = 0; k < n; k++) {
      const a = a0 + bw * (k + .5);
      if (lower) {
        // the cupboard doors below: a rail across, each door with its raised panel and a brass knob
        for (const s of [-1, 1]) {
          const da = a + s * bw / 4;
          bx(bw / 2 - .2, lower - .2, .12, panel, da, base + lower / 2, fz + dir * .03);
          bx(bw / 2 - .7, lower - .9, .08, panel, da, base + lower / 2, fz + dir * .1);
          G.add(put(cyl(.09, .09, .16, brass, 10), a + s * .28, base + lower * .62, fz + dir * .14));
        }
        bx(bw - .3, .25, .1, darkOak, a, ly + .05, fz + dir * .04);
      }
      if (k === gap) continue;   // (the bay that opens has doors of its own, below)
      bx(.12, top - ly - .2, .08, brass, a, (ly + top) / 2, fz + dir * .02);
      bx(.22, .5, .1, brass, a, ly + (top - ly) * .42, fz + dir * .06);   // the lock
    }
    // the lattice across the run above any cupboards (a plane, its mesh repeated to the bays; in two,
    // round the bay that opens)
    const lh = top - ly - .2, cy = ly + .1 + lh / 2;
    const spans = gap < 0 ? [[a0, a1]] : [[a0, g0], [g1, a1]];
    for (const [s0, s1] of spans) {
      const sl = s1 - s0 - .2;
      if (sl <= .3) continue;
      const lat = new THREE.Mesh(new THREE.PlaneGeometry(sl, lh), latMat.clone());
      lat.material.alphaMap = lattice().clone(); lat.material.alphaMap.needsUpdate = true; lat.material.alphaMap.repeat.set(sl / 1.3, lh / 1.3);
      lat.userData.noG = true;
      const sm = (s0 + s1) / 2;
      if (along === 'x') { lat.position.set(sm, cy, fz); if (dir < 0) lat.rotation.y = Math.PI; }
      else { lat.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; lat.position.set(fz, cy, sm); }
      G.add(lat);
    }
    return { n, bw, a0, fz, ly, top, ref, face, dir, depth };
  }
  const DR = ARCHIVE.DOOR, ground = { y0: FLOOR, height: under - FLOOR - .6, shelves: 8, lower: 8 }, upper = { y0: deck, height: TOP - 2.4 - deck, shelves: 7 };
  // the ground floor: north and south walls (the south's: clinical study reports, one bay of which
  // opens), the east wall either side of the reading room's door; the gallery's storey: the same three
  // walls, whole
  // (each run named by its part of the dossier: the clinical study reports, the opening bay among them, on
  // the south wall, facing the writer's left)
  cabinets({ along: 'x', a0: X0 + 2.5, a1: X1 - .4, face: Z0, dir: -1, fam: 'box', label: 'MODULE 4 · NONCLINICAL STUDY REPORTS', ...ground });
  const csr = cabinets({ along: 'x', a0: X0 + 2.5, a1: X1 - .4, face: Z1, dir: 1, fam: 'binder', gap: ARCHIVE.CSR_BAY, label: 'MODULE 5 · CLINICAL STUDY REPORTS', ...ground });
  cabinets({ along: 'z', a0: Z1 + .3, a1: DR.z - DR.w / 2 - 1.2, face: X0, dir: 1, fam: 'box', label: 'MODULE 2 · SUMMARIES', ...ground });
  cabinets({ along: 'z', a0: DR.z + DR.w / 2 + 1.2, a1: Z0 - .3, face: X0, dir: 1, fam: 'binder', label: 'MODULE 2 · OVERVIEWS', ...ground });
  cabinets({ along: 'x', a0: X0 + 2.5, a1: X1 - .4, face: Z0, dir: -1, fam: 'binder', label: 'MODULE 1 · FDA · EMA · ASEAN · CDSCO', ...upper });
  cabinets({ along: 'x', a0: X0 + 2.5, a1: X1 - .4, face: Z1, dir: 1, fam: 'box', label: 'MODULE 3 · QUALITY', ...upper });
  cabinets({ along: 'z', a0: Z1 + .3, a1: Z0 - .3, face: X0, dir: 1, fam: 'box', label: 'AGENCY CORRESPONDENCE', ...upper });

  // ---------- the bay of clinical study reports that opens (03, step 3): its two lattice doors swing out
  // and its reference shelf slides out, bringing the bound report on a book rest, open at Table 14.2.1
  // (the film lays the page's words on it). Put back and shut once the claim has been checked ----------
  const room = {};
  {
    const r = csr, a = r.a0 + r.bw * (ARCHIVE.CSR_BAY + .5), bw = r.bw, z = r.fz, ly = r.ly, lh = r.top - ly - .2;
    const leafW = bw / 2 - .12, doors = [];
    for (const s of [-1, 1]) {
      // (each leaf hinged at its side of the bay: s -1 the east one, +1 the west)
      const leaf = new THREE.Group(); leaf.userData.keep = true;
      const lm = latMat.clone(); lm.alphaMap = lattice().clone(); lm.alphaMap.needsUpdate = true; lm.alphaMap.repeat.set(leafW / 1.3, lh / 1.3);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(leafW, lh), lm); p.userData.noG = true; p.position.set(-s * leafW / 2, lh / 2, 0); leaf.add(p);
      for (const [w, h, x, y] of [[leafW, .14, -s * leafW / 2, lh], [leafW, .14, -s * leafW / 2, 0], [.12, lh, 0, lh / 2], [.12, lh, -s * leafW, lh / 2]]) leaf.add(at(rbox(w, h, .08, .02, brass), x, y, .02));
      if (s > 0) leaf.add(at(rbox(.22, .5, .1, .02, brass), -leafW + .05, lh * .42, .06));   // the lock, on the leaf that shuts last
      leaf.position.set(a + s * (bw / 2 - .06), ly + .1, z + .02);
      leaf.traverse(o => { if (o.isMesh) o.castShadow = true; });
      G.add(leaf); doors.push({ leaf, s });
    }
    // the reference shelf: a board on its runners, a brass pull; on it a walnut book rest, its low edge
    // toward the room, and on that the bound report, open: its boards, the page block, the gutter, the
    // two pages (the left the section's text, the right the table the claim rests on)
    const shelf = new THREE.Group(); shelf.userData.keep = true;
    const SD = 1.85, SW = bw - .36, PW = 1.36, PH = 1.62, TILT = .38, RD = PH + .22, RW = PW * 2 + .22;
    shelf.add(at(rbox(SW, .1, SD, .03, darkOak), 0, .05, 0));
    for (const s of [-1, 1]) shelf.add(at(rbox(.08, .12, SD - .1, .02, iron), s * (SW / 2 - .1), -.05, 0));   // the runners
    shelf.add(at(rbox(.6, .14, .07, .03, brass), 0, .05, SD / 2 + .04));   // the pull
    // (the rest: a walnut wedge, its slope rising to the cabinet, a lip along its low edge)
    const walnut = mat('#5A3A26', { r: .5 }), RL = RD * Math.cos(TILT), rise = RD * Math.sin(TILT);
    const wg = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-RL / 2, 0), new THREE.Vector2(RL / 2, 0), new THREE.Vector2(RL / 2, rise)]), { depth: RW, bevelEnabled: false });
    wg.translate(0, 0, -RW / 2); wg.rotateY(Math.PI / 2);
    const rest = new THREE.Group();
    rest.add(shadows(new THREE.Mesh(wg, walnut)));
    rest.add(at(rbox(RW, .17, .06, .02, walnut), 0, .085, RL / 2 - .03));
    const book = new THREE.Group();
    book.add(at(rbox(PW * 2 + .14, .06, PH + .12, .02, mat('#22325A', { r: .6 })), 0, .03, 0));
    book.add(at(rbox(PW * 2 - .04, .1, PH, .02, mat('#F3EEE3', { r: .9 })), 0, .11, 0));
    book.add(at(rbox(.05, .012, PH - .02, .004, mat('#B9AE98', { r: .9 })), 0, .162, 0));   // the gutter
    // the two pages, their words printed on them (paper.js): the section's text on the left, the table the
    // claim rests on on the right; a reference slip on it, "2.7.3" pencilled on it, the claim it supports
    const PGW = hi ? 1024 : 640, PGH = Math.round(PGW * (PH - .08) / (PW - .1)), SERIF = '"Fraunces Variable", Georgia, serif', SANS = '"Inter Variable", Inter, system-ui, sans-serif';
    const foot = (c, w, n) => {
      c.fillStyle = 'rgba(19,36,79,.14)'; c.fillRect(84, 1146, w - 168, 2);
      font(c, `500 27px ${SERIF}`, 5); c.fillStyle = 'rgba(19,36,79,.5)'; c.fillText('CLINICAL STUDY REPORT · ILLUSTRATIVE', 84, 1194);
      c.textAlign = 'right'; c.fillText(n, w - 84, 1194); c.textAlign = 'left';
    };
    const left = sheet(PGW, PGH, (c, W) => {
      const w = 1024; c.scale(W / w, W / w); c.fillStyle = '#FBF8F2'; c.fillRect(0, 0, w, 1260);
      font(c, `600 31px ${SERIF}`, 6); c.fillStyle = 'rgba(19,36,79,.55)'; c.fillText('14.2 EFFICACY EVALUATION', 84, 112);
      font(c, `600 50px ${SERIF}`); c.fillStyle = '#13244F'; c.fillText('14.2.1 Primary efficacy endpoint', 84, 208);
      font(c, `400 38px ${SERIF}`); c.fillStyle = '#2B3550';
      let y = 290;
      for (const para of ['The primary endpoint was the time to the first occurrence of the primary event, analysed in all 480 randomised participants with a Cox proportional hazards model stratified by region.', 'Treatment reduced the risk of the primary event compared with placebo (Table 14.2.1).', 'Sensitivity analyses in the per-protocol population gave consistent results (Table 14.2.2).']) {
        for (const l of wrap(c, para, w - 168)) { c.fillText(l, 84, y); y += 56; }
        y += 30;
      }
      foot(c, w, '211');
    });
    const right = sheet(PGW, PGH, (c, W) => {
      const w = 1024; c.scale(W / w, W / w); c.fillStyle = '#FBF8F2'; c.fillRect(0, 0, w, 1260);
      font(c, `600 31px ${SERIF}`, 6); c.fillStyle = 'rgba(19,36,79,.55)'; c.fillText('14.2 EFFICACY DATA', 84, 112);
      font(c, `600 92px ${SERIF}`); c.fillStyle = '#13244F'; c.fillText('Table 14.2.1', 84, 222);
      font(c, `italic 400 50px ${SERIF}`); c.fillStyle = 'rgba(19,36,79,.72)'; c.fillText('Primary efficacy analysis', 84, 296);
      c.fillStyle = 'rgba(19,36,79,.42)'; c.fillRect(84, 352, w - 168, 3);
      [['Randomised, n', '480'], ['Hazard ratio', '0.72'], ['95% CI', '0.58 to 0.89']].forEach(([a, b], i, all) => {
        const y = 352 + i * 118;
        font(c, `500 50px ${SANS}`); c.fillStyle = '#26324F'; c.fillText(a, 96, y + 76);
        font(c, `600 50px ${SANS}`); c.textAlign = 'right'; c.fillText(b, w - 96, y + 76); c.textAlign = 'left';
        c.fillStyle = i < all.length - 1 ? 'rgba(19,36,79,.2)' : 'rgba(19,36,79,.42)'; c.fillRect(84, y + 117, w - 168, i < all.length - 1 ? 2 : 3);
      });
      // (the table's notes, as a report's tables carry them)
      font(c, `400 30px ${SERIF}`); c.fillStyle = 'rgba(19,36,79,.62)';
      let ny = 770;
      for (const l of wrap(c, 'Intention-to-treat population. Hazard ratio from a Cox proportional hazards model stratified by region. CI, confidence interval.', w - 168)) { c.fillText(l, 84, ny); ny += 44; }
      foot(c, w, '212');
    });
    const pageL = new THREE.Mesh(new THREE.PlaneGeometry(PW - .1, PH - .08), new THREE.MeshStandardMaterial({ map: left.tex, roughness: .9 }));
    pageL.rotation.x = -Math.PI / 2; pageL.position.set(-PW / 2, .162, 0); book.add(pageL);
    const pageR = new THREE.Mesh(new THREE.PlaneGeometry(PW - .1, PH - .08), new THREE.MeshStandardMaterial({ map: right.tex, roughness: .9 }));
    pageR.rotation.x = -Math.PI / 2; pageR.position.set(PW / 2, .162, 0); book.add(pageR);
    // (the slip in the page's empty top corner, its head just over the page's edge)
    const slipP = sheet(160, 230, (c, W, H) => { c.fillStyle = '#F1E3A8'; c.fillRect(0, 0, W, H); font(c, '600 62px Caveat, cursive'); c.fillStyle = '#3A3F48'; c.textAlign = 'center'; c.fillText('2.7.3', W / 2, H - 48); });
    const slip = new THREE.Mesh(new THREE.PlaneGeometry(.27, .39), new THREE.MeshStandardMaterial({ map: slipP.tex, roughness: .9 }));
    slip.rotation.set(-Math.PI / 2, 0, -.05); slip.position.set(PW / 2 + .42, .166, -(PH - .08) / 2 + .14); book.add(slip);
    // (the book on the slope's middle, tilted with it toward the room)
    book.rotation.x = TILT; book.position.set(0, rise / 2 + .03 * Math.tan(TILT) + .004, -.03); rest.add(book);
    rest.position.set(0, .1, -.05);
    shelf.add(rest);
    // (in: behind its doors, on the shelf kept clear for it; out: well before the cabinet's face)
    const shelfIn = new THREE.Vector3(a, r.ref, r.face + r.dir * (.22 + SD / 2)), shelfOut = shelfIn.clone().add(new THREE.Vector3(0, 0, r.dir * 1.8));
    shelf.position.copy(shelfIn);
    shelf.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    G.add(shelf);
    // (the open report's middle, a little toward its table, once the shelf is out: where the camera reads)
    const focus = () => { const q = shelf.position.clone(); shelf.position.copy(shelfOut); shelf.updateMatrixWorld(true); const c = book.localToWorld(new THREE.Vector3(-.12, .162, 0)); shelf.position.copy(q); shelf.updateMatrixWorld(true); return { c: c.toArray() }; };
    room.special = { doors, shelf, shelfIn, shelfOut, focus };
  }

  // ---------- the room taking part in 03's work: set(k), k its share of the work (dossier.js's marks) ----------
  {
    const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const seg = (k, a, b) => sm((k - a) / (b - a));
    let shown = -1;
    room.set = (k, M) => {
      const key = Math.round(k * 4000);
      if (key === shown) return false;
      shown = key;
      // 3: the bay of clinical study reports opens and its shelf brings the report out; once the claim is
      // checked and the camera is back at the desk, the report goes back and the doors shut
      const S = room.special;
      const open = seg(k, M.open, M.open + .025) * (1 - seg(k, M.put + .015, M.put + .035));
      const out = seg(k, M.shelf, M.shelf + .025) * (1 - seg(k, M.put, M.put + .02));
      // (the doors open right back, against the bays either side, clear of the run's plate)
      S.doors.forEach(({ leaf, s }) => { leaf.rotation.y = s * open * 2.75; });
      S.shelf.position.lerpVectors(S.shelfIn, S.shelfOut, out);
      return true;
    };
  }

  // ---------- the gallery: its deck round three walls, its fascia, the brass rail, the columns ----------
  {
    const d = GY.d, nz = Z0 - d, sz = Z1 + d, ez = X0 + d;   // the deck's inner edges: north, south, east
    for (const [x0, x1, z0, z1] of [[X0, X1, Z0, nz], [X0, X1, sz, Z1], [X0, ez, nz, sz]]) {
      G.add(shadows(at(box(x1 - x0, .5, z0 - z1, darkOak), (x0 + x1) / 2, deck - .25, (z0 + z1) / 2)));
    }
    // the fascia along the inner edge, a moulding on it
    const edge = [[[ez, nz], [X1, nz]], [[ez, sz], [X1, sz]], [[ez, nz], [ez, sz]]];
    for (const [[ax, az], [bx, bz]] of edge) {
      const len = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, alongX = az === bz;
      G.add(at(rbox(alongX ? len + .4 : .5, 1.1, alongX ? .5 : len + .4, .08, darkOak), cx, deck - .7, cz));
      G.add(at(rbox(alongX ? len + .5 : .25, .2, alongX ? .25 : len + .5, .06, trim), cx, deck - .1, cz));
    }
    // the room's name in gilt on the gallery's front over the reading room's door, facing down the table to
    // the writer: what this room is for
    {
      const t = 'REGULATORY WRITING  ·  CONFIDENTIAL', TW = 2400, TH = 130;
      const tex = canvasTex(TW, TH, (c, W, H) => {
        c.fillStyle = '#2A2119'; c.fillRect(0, 0, W, H);
        const gr = c.createLinearGradient(0, H * .2, 0, H * .8); gr.addColorStop(0, '#F1DA9C'); gr.addColorStop(.5, '#C9A45C'); gr.addColorStop(1, '#9C7A38');
        c.fillStyle = gr; c.textAlign = 'center'; c.textBaseline = 'middle';
        if ('letterSpacing' in c) c.letterSpacing = '18px';
        let fs = 88; c.font = `600 ${fs}px Georgia, serif`;
        while (c.measureText(t).width > W - 120) { fs -= 2; c.font = `600 ${fs}px Georgia, serif`; }
        c.fillText(t, W / 2 + 9, H / 2 + 4);
      });
      const L = 17, ins = new THREE.Mesh(new THREE.PlaneGeometry(L, L * TH / TW), mat('#FFFFFF', { map: tex, r: .45, m: .2 }));
      ins.rotation.y = Math.PI / 2; ins.position.set(ez + .27, deck - .72, (nz + sz) / 2); G.add(ins);
    }
    // the rail: a brass handrail, a lower rail, iron balusters; open where the stair arrives
    const S = ARCHIVE.STAIR, top = deck + GY.rail;
    const rail = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, alongX = az === bz;
      G.add(at(rbox(alongX ? len : .26, .26, alongX ? .26 : len, .1, brass), cx, top, cz));
      G.add(at(rbox(alongX ? len : .16, .16, alongX ? .16 : len, .05, iron), cx, deck + .45, cz));
      const n = Math.round(len / 1.05);
      for (let i = 0; i <= n; i++) { const t = i / n; G.add(at(cyl(.055, .055, GY.rail - .4, iron, 6), ax + (bx - ax) * t, deck + .25 + (GY.rail - .4) / 2, az + (bz - az) * t)); }
    };
    rail(ez, nz, S.x - S.r - .4, nz); rail(S.x + S.r + .4, nz, X1 - .2, nz);
    rail(ez, sz, X1 - .2, sz); rail(ez, nz, ez, sz);
    // the columns under the deck's edge, iron, with a capital and a base
    const cols = [[ez, nz], [ez, sz], [ez, -44], [ez, -60]];
    for (const x of [-71, -80, -89]) cols.push([x, nz], [x, sz]);
    for (const [x, z] of cols) {
      G.add(at(cyl(.32, .36, under - FLOOR - 1.4, iron, 16), x, FLOOR + .7 + (under - FLOOR - 1.4) / 2, z));
      G.add(at(rbox(1, .7, 1, .1, iron), x, under - .35, z), at(rbox(1, .7, 1, .1, iron), x, FLOOR + .35, z));
      G.add(contact(1.6, 1.6, x, z, { y: FLOOR, k: .22 }));
    }
  }

  // ---------- the spiral stair to the gallery: an iron newel, treads turning about it, a rail ----------
  {
    const { x: sx, z: sz, r } = ARCHIVE.STAIR, steps = 20, rise = (deck - FLOOR) / steps, turn = Math.PI * 2 * .92;
    // (it ends at the north deck's edge, so its last tread looks north)
    const a0 = Math.PI / 2 - turn;
    G.add(at(cyl(.28, .28, deck + GY.rail - FLOOR, iron, 12), sx, (FLOOR + deck + GY.rail) / 2, sz));
    const railPts = [];
    for (let i = 0; i < steps; i++) {
      const a = a0 + turn * (i + .5) / steps, y = FLOOR + rise * (i + 1);
      const t = group(at(rbox(r - .25, .22, 1.05, .04, darkOak), (r + .25) / 2, 0, 0));
      t.add(at(cyl(.05, .05, GY.rail - .5, iron, 6), r - .2, (GY.rail - .5) / 2, 0));
      t.position.set(sx, y - .11, sz); t.rotation.y = -a;
      G.add(t);
      railPts.push(new THREE.Vector3(sx + Math.cos(a) * (r - .2), y + GY.rail - .5, sz + Math.sin(a) * (r - .2)));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 80, .11, 8, false), brass); tube.castShadow = true; G.add(tube);
    G.add(contact(r * 2 + 1, r * 2 + 1, sx, sz, { y: FLOOR, k: .22 }));
  }

  // ---------- the door on to the reading room: a strong-room door too, in a steel frame, as quiet as the
  // first; it opens into the strong room as the reader goes on to 04 (door2.set) ----------
  const door2 = buildEastDoor(G, { brass });
  // ---------- the cabinets' contents: archive boxes and binders, one instanced draw (books.js) ----------
  {
    const items = [];
    for (const row of rows) {
      const ry = row.along === 'x' ? (row.dir > 0 ? 0 : Math.PI) : (row.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      let a = row.a0;
      while (a < row.a1) {
        if (R() < .05) { a += .4 + R() * .9; continue; }
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

  // ---------- the long table and its chairs; on it, records being consulted ----------
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
    // (the writer's chair, pulled up to the table's near end before the display: dossier.js)
    chair(TABLE.x0 + 1.5, TABLE.z, -Math.PI / 2);
    for (const [x, ry] of [[-91.5, 0], [-97, .06]]) chair(x, TABLE.z - TABLE.w / 2 - 1.2, ry);
    for (const [x, ry] of [[-93, Math.PI], [-98.5, Math.PI - .05]]) chair(x, TABLE.z + TABLE.w / 2 + 1.2, ry);
    // archive boxes, one open with its lid beside it; a card index drawer
    const buff = mat('#C9BBA0', { r: .85 }), buff2 = mat('#BCAE92', { r: .85 });
    G.add(at(rbox(2.4, 1.7, 3.2, .05, buff), -97, TT + .85, TABLE.z + 1.6, { y: .05 }), at(rbox(2.4, 1.7, 3.2, .05, buff2), -97.1, TT + 2.57, TABLE.z + 1.55, { y: -.04 }));
    G.add(at(rbox(2.4, 1.6, 3.2, .05, buff), -93, TT + .8, TABLE.z + 1.8, { y: -.1 }), at(rbox(2.6, .3, 3.4, .05, buff2), -90.3, TT + .15, TABLE.z + 3.05));
    for (let i = 0; i < 9; i++) G.add(at(rbox(.05, 1.25, 2.6, .01, mat(i % 3 ? '#F4EFE4' : '#E9DFC9', { r: .9 })), -93 + (i - 4) * .22, TT + 1.2, TABLE.z + 1.8, { y: -.1, z: (i - 4) * .03 }));
    G.add(at(rbox(1.6, 1.1, 3.6, .05, darkOak), -100.4, TT + .55, TABLE.z - 1.3), at(rbox(1.2, .3, .3, .05, brass), -100.4, TT + .7, TABLE.z - 1.3 + 1.82));
    for (const [x, z, ww, dd, k] of [[-97, TABLE.z + 1.6, 3, 3.8, .24], [-93, TABLE.z + 1.8, 3, 3.8, .22], [-100.4, TABLE.z - 1.3, 2.2, 4.2, .22]]) G.add(contact(ww, dd, x, z, { y: TT, k }));
  }

  // ---------- the pendants: green enamel shades on long rods, each hung from a beam across the lantern ----------
  const pendants = [], lampAt = [];
  for (const px of [-91, -96, -101]) {
    const by = TT + 11.2, from = TOP + .6;
    G.add(at(rbox(.5, .7, ARCHIVE.LANTERN.z0 - ARCHIVE.LANTERN.z1 + 1.2, .08, darkOak), px, TOP + .95, (ARCHIVE.LANTERN.z0 + ARCHIVE.LANTERN.z1) / 2));
    G.add(at(cyl(.06, .06, from - by - 1.4, mat(PAL.graphite, { r: .4, m: .6 }), 8), px, (from + by + 1.4) / 2, TABLE.z));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.35, 1.9, 1.3, 32, 1, true), mat('#2F5B46', { r: .35, side: THREE.DoubleSide }));
    shade.position.set(px, by + .65, TABLE.z); shade.castShadow = true; G.add(shade);
    G.add(at(cyl(.35, .35, .3, brass, 16), px, by + 1.4, TABLE.z));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 12), mat('#FFF6E6', { emissive: '#FFE3B0', ek: 1.4, r: .4 }));
    bulb.position.set(px, by + .2, TABLE.z); G.add(bulb);
    pendants.push([px, by + .1, TABLE.z]); lampAt.push([px, by, TABLE.z]);
  }

  // ---------- the strong-room door, in the hall's wall ----------
  const door = buildDoor(G, { iron, brass });

  // ---------- the dossier ----------
  const dossier = buildDossier({ SX: ARCHIVE.SCREEN.x, Z: ARCHIVE.SCREEN.z, TT });
  G.add(dossier.group);

  return { group: G, dossier, door, door2, room, pendants, lamps: lampAt, centre: [ARCHIVE.DOSSIER.x, TT, ARCHIVE.DOSSIER.z] };
}

// ---------- the door on to the reading room: the hall door's twin, quieter. Painted steel in a steel frame,
// hinged at the doorway's north jamb on the strong room's side and opening inward, into the strong room, as
// the hall door does. Toward the strong room a raised border, its wheel and keyhole, the two brass hinges;
// toward the reading room the same border, wheel and keyhole, and the brass plate. set(u), u from 0 (shut)
// to 1 (open): the wheel turns a quarter, then the door swings in, to square with the wall ----------
function buildEastDoor(G, { brass }) {
  const DR = ARCHIVE.DOOR, X0 = ARCHIVE.X0, FLOOR = ARCHIVE.FLOOR, h = DR.top - FLOOR, zN = DR.z + DR.w / 2;
  const steel = mat('#2C323C', { r: .42, m: .35 }), steelEdge = mat('#4A515C', { r: .35, m: .55 });
  // the frame lining the opening on the strong room's side
  for (const dz of [-1, 1]) G.add(at(rbox(1.0, h + .5, .55, .06, steel), X0 + .15, FLOOR + (h + .5) / 2, DR.z + dz * (DR.w / 2 + .05)));
  G.add(at(rbox(1.0, .55, DR.w + 1.2, .06, steel), X0 + .15, DR.top + .22, DR.z));
  // the leaf: its hinge at the north jamb; shut, it fills the opening, its thickness in the wall (local -x,
  // toward the reading room); its faces: local +x toward the strong room, -x toward the reading room
  const leaf = new THREE.Group(); leaf.userData.keep = true;
  const lw = DR.w - .3, lh = h - .25, lt = .55, mid = -(lw / 2 + .15);
  leaf.add(at(rbox(lt, lh, lw, .05, steel), -lt / 2, lh / 2, mid));
  const wy = lh * .47, wz = -(lw - 1.9);
  const wheel = () => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(new THREE.TorusGeometry(.95, .09, 10, 40), brass));
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 + .3; w.add(at(rbox(.1, .95, .1, .04, brass), Math.sin(a) * .47, Math.cos(a) * .47, 0, { z: -a })); }
    w.add(at(cyl(.24, .24, .3, brass, 16), 0, 0, 0, { x: Math.PI / 2 }));
    w.rotation.y = Math.PI / 2;
    return w;
  };
  const wheels = [];
  for (const s of [1, -1]) {
    // (s 1: the face toward the strong room, at local x 0; -1: toward the reading room, at -lt)
    const F = s > 0 ? .02 : -lt - .02;
    for (const [w, hh, y, z] of [[lw - 1, .35, lh - .7, mid], [lw - 1, .35, .7, mid], [.35, lh - 1.4, lh / 2, -.65], [.35, lh - 1.4, lh / 2, -(lw - .35)]]) leaf.add(at(rbox(.12, hh, w, .04, steelEdge), F, y, z));
    const w = wheel(); w.position.set(F + s * .31, wy, wz); leaf.add(w); wheels.push(w);
    leaf.add(at(rbox(.06, .55, .32, .03, brass), F + s * .01, wy - 1.9, wz));   // the keyhole's plate
  }
  // the plate, on the reading room's face (as the hall door carries it on the hall's)
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .76), new THREE.MeshStandardMaterial({ map: plateTex(), roughness: .35, metalness: .7 }));
  plate.rotation.y = -Math.PI / 2; plate.position.set(-lt - .06, lh * .66, mid); leaf.add(plate);
  // the hinges, on the strong room's side at the hinged edge
  for (const y of [lh * .2, lh * .8]) leaf.add(at(cyl(.22, .22, 1.8, brass, 14), .12, y, -.12));
  leaf.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  leaf.position.set(X0 + .02, FLOOR + .05, zN - .05);
  G.add(leaf);
  const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  let shown = -1;
  return {
    set(u) {
      const key = Math.round(u * 1000);
      if (key === shown) return false;
      shown = key;
      const turn = sm(u / .3) * Math.PI / 2;
      wheels.forEach(w => { w.rotation.z = turn; });
      leaf.rotation.y = -sm((u - .2) / .8) * 1.62;
      leaf.updateMatrixWorld(true);
      return true;
    },
  };
}

// ---------- the strong-room door: painted steel in a steel frame, hinged at the doorway's north jamb on
// the room's side, opening inward; a raised border, a spoked brass wheel and its keyhole and the brass
// plate on its face toward the hall, two brass barrel hinges on the room's side. set(u), u from 0 (shut)
// to 1 (open): the wheel turns a quarter, then the door swings in, past square, toward the wall ----------
function buildDoor(G, { iron, brass }) {
  const DH = HALL.DOOR, FLOOR = ARCHIVE.FLOOR, hx = HALL.X0, zN = DH.z + DH.w / 2, h = DH.top - FLOOR;
  const steel = mat('#2C323C', { r: .42, m: .35 }), steelEdge = mat('#4A515C', { r: .35, m: .55 });
  // the frame lining the opening, its face proud of the hall's wall
  for (const dz of [-1, 1]) G.add(at(rbox(1.1, h + .5, .55, .06, steel), hx - .2, FLOOR + (h + .5) / 2, DH.z + dz * (DH.w / 2 + .05)));
  G.add(at(rbox(1.1, .55, DH.w + 1.2, .06, steel), hx - .2, DH.top + .22, DH.z));
  // the leaf: its hinge at the room's face of the south jamb; shut, it fills the opening (its thickness
  // toward the hall, local +x)
  const leaf = new THREE.Group(); leaf.userData.keep = true;
  const lw = DH.w - .3, lh = h - .25, lt = .55, F = lt + .02;
  leaf.add(at(rbox(lt, lh, lw, .05, steel), lt / 2, lh / 2, -(lw / 2 + .15)));
  // its face toward the hall: a raised border, the wheel, the keyhole, the plate
  for (const [w, hh, y, z] of [[lw - 1, .35, lh - .7, -(lw / 2 + .15)], [lw - 1, .35, .7, -(lw / 2 + .15)], [.35, lh - 1.4, lh / 2, -.65], [.35, lh - 1.4, lh / 2, -(lw - .35)]]) leaf.add(at(rbox(.12, hh, w, .04, steelEdge), F, y, z));
  const wy = lh * .47, wz = -(lw - 1.9);
  const wheel = new THREE.Group();
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(.95, .09, 10, 40), brass));
  for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; wheel.add(at(rbox(.1, .95, .1, .04, brass), Math.sin(a) * .47, Math.cos(a) * .47, 0, { z: -a })); }
  wheel.add(at(cyl(.24, .24, .3, brass, 16), 0, 0, 0, { x: Math.PI / 2 }));
  wheel.rotation.y = Math.PI / 2; wheel.position.set(F + .33, wy, wz);
  leaf.add(wheel);
  leaf.add(at(rbox(.06, .55, .32, .03, brass), F + .03, wy - 1.9, wz));   // the keyhole's plate
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .76), new THREE.MeshStandardMaterial({ map: plateTex(), roughness: .35, metalness: .7 }));
  plate.rotation.y = Math.PI / 2; plate.position.set(F + .06, lh * .66, -(lw / 2 + .15)); leaf.add(plate);
  // the room's side: plain steel, the bolts' bar across it, the hinges on the hinged edge
  leaf.add(at(rbox(.1, .3, lw - 1.2, .04, steelEdge), -.05, wy, -(lw / 2 + .15)));
  for (const y of [lh * .2, lh * .8]) leaf.add(at(cyl(.22, .22, 1.8, brass, 14), -.12, y, -.12));
  leaf.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  leaf.position.set(ARCHIVE.X1 - .02, FLOOR + .05, zN - .05);
  G.add(leaf);
  const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  let shown = -1;
  return {
    set(u) {
      const key = Math.round(u * 1000);
      if (key === shown) return false;
      shown = key;
      wheel.rotation.z = sm(u / .3) * Math.PI / 2;
      leaf.rotation.y = sm((u - .2) / .8) * 1.75;
      leaf.updateMatrixWorld(true);
      return true;
    },
  };
}
