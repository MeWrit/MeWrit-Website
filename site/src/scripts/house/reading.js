/* The reading room (site/docs/redesign-plan.md, 11.12 and 11.16): east of the strong room, through its
   east door. 04, Scientific publications, at night. Public again after the strong room: what is
   published is read here. The compass: -z is south, +x west. The camera comes in through the strong
   room's door looking east down the room; 04's work is done at the south table (publication.js), and
   the chapter rests at the reading stand before the east window; 05 goes on through the north door.
   - A coffered barrel vault running east on ribs and pilasters, a cornice at its spring; five bays.
   - The east end: a tall round-headed window, an oculus in the lunette above it.
   - The south wall: two round-headed windows (the moonlight comes in through them), bound journals
     in the bays between them.
   - The north and west walls: bound journals; in the north wall's last bay, the door on to the
     lecture room (05), shut.
   - Two long reading tables, their green lamps and chairs; two lanterns hung from the vault; the
     reading stand.
   Units as the house's (about 10 cm). Everything static is merged with the house (kit.js, bake). */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, cyl, group, shadows, plasterTex, oakTex, boardsTex, rng, contact, canvasTex, roundRect } from './kit.js';
import { GARDEN } from './outside.js';
import { ARCHIVE } from './archive.js';
import { bookGeometry, bookMaterial, pickSpine } from './books.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const READING = {
  X0: -156, X1: ARCHIVE.X0 - ARCHIVE.T, Z0: -28, Z1: -76, FLOOR: -7.5, T: .6, TOP: 38,
  // the vault: where it springs from the side walls and its crown; the bays its ribs divide it into
  SPRING: 24, CROWN: 36, BAYS: 5,
  // the east window (its middle across, width, sill, the spring of its round head) and the oculus over it
  EWIN: { z: -52, w: 10, y0: -1.5, y1: 14 }, OCULUS: { y: 29.4, r: 3.1 },
  // the south windows: in the second and fourth bays; width, sill, spring of the head
  SWIN: { w: 7, y0: -1.5, y1: 12.5 },
  // the reading tables: their middles across (z), their ends (x), width, the height of their tops
  TABLES: [-40, -64], TX: [-114.5, -145.5], TW: 10, TTOP: .1,
  // the door on to the lecture room, in the north wall's last bay: width, top
  NDOOR: { w: 7.2, top: 12.5 },
};
// the bays' edges along the room (x), from the west wall; each bay's middle
const BAY = (READING.X1 - READING.X0) / READING.BAYS;
export const BAY_EDGES = Array.from({ length: READING.BAYS + 1 }, (_, i) => READING.X1 - BAY * i);
export const BAY_MID = Array.from({ length: READING.BAYS }, (_, i) => READING.X1 - BAY * (i + .5));
READING.SWINS = [BAY_MID[1], BAY_MID[3]];
READING.NDOOR.x = BAY_MID[4];
// the reading stand, on the room's axis in the last bay; the writer's place at the south table, in the
// second bay, before the first south window (publication.js): the manuscript's middle, the writer's chair
READING.STAND = { x: BAY_MID[4], z: -52 };
READING.DESK = { x: BAY_MID[1], z: -62.2 };
READING.CHAIR = { x: BAY_MID[1], z: -56.2 };
// the periodicals cart, pulled up beside the writer (at the left hand, as the writer sits facing south)
READING.CART = { x: BAY_MID[1] - 4.6, z: -55.2 };

// the vault's coffers: a sunk panel with a moulded edge and a small boss, drawn once and repeated
const cofferTex = () => canvasTex(256, 256, (c, W, H) => {
  const r = rng(29);
  c.fillStyle = '#ECE5D7'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${r() < .5 ? '120,100,70' : '255,255,250'},${.02 + r() * .03})`; c.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
  const m = 26, s = W - 2 * m;
  // the sunk panel: its sides in shade toward its edge, the panel's floor a little darker than the frame
  const g = c.createLinearGradient(0, m, 0, m + s); g.addColorStop(0, '#CFC5B2'); g.addColorStop(.18, '#DDD4C2'); g.addColorStop(.82, '#DDD4C2'); g.addColorStop(1, '#E6DECF');
  c.fillStyle = g; c.fillRect(m, m, s, s);
  c.strokeStyle = 'rgba(90,70,45,.28)'; c.lineWidth = 3; c.strokeRect(m + 1.5, m + 1.5, s - 3, s - 3);
  c.strokeStyle = 'rgba(255,252,244,.6)'; c.lineWidth = 2; c.strokeRect(m + 12, m + 12, s - 24, s - 24);
  c.strokeStyle = 'rgba(90,70,45,.16)'; c.lineWidth = 2; c.strokeRect(m + 16, m + 16, s - 32, s - 32);
  // the boss: a small gilt rosette
  c.fillStyle = 'rgba(201,164,92,.75)'; c.beginPath(); c.arc(W / 2, H / 2, 13, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(120,90,40,.5)'; c.beginPath(); c.arc(W / 2, H / 2, 5, 0, Math.PI * 2); c.fill();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = 'rgba(201,164,92,.55)'; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 18, H / 2 + Math.sin(a) * 18, 4, 0, Math.PI * 2); c.fill(); }
}, { aniso: 8 });

export function buildReading({ hi = true } = {}) {
  const G = new THREE.Group();
  const { X0, X1, Z0, Z1, FLOOR, T, TOP, SPRING, CROWN } = READING, W = X1 - X0, D = Z0 - Z1, R = rng(173);
  const xm = (X0 + X1) / 2, zm = (Z0 + Z1) / 2;
  const wallMat = mat('#E9E1D1', { map: plasterTex('#E9E1D1', 17), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });
  const oak = mat('#9C774F', { map: oakTex('#9C774F', '#5A402A', 43), r: .62 });
  const darkOak = mat('#7E5D3F', { map: oakTex('#7E5D3F', '#4A3220', 47), r: .64 });
  const brass = mat(PAL.gold, { r: .32, m: .85 });
  const green = mat('#2F5B46', { r: .9 });

  // ---------- the floor and its runner; the walls (their openings cut through), the plinth, the roof ----------
  {
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#86684C', { map: boardsTex('#86684C', '#52402C', 23), r: .76 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(xm, FLOOR, zm); G.add(floor);
    // the runner down the aisle: green with a gold border, from the door to the stand
    const runTex = canvasTex(256, 1024, (c, w, h) => {
      c.fillStyle = '#3E5E4C'; c.fillRect(0, 0, w, h);
      const r = rng(7); for (let i = 0; i < 2400; i++) { c.fillStyle = `rgba(${r() < .5 ? '20,30,25' : '200,210,190'},${.04 + r() * .05})`; c.fillRect(r() * w, r() * h, 2, 2); }
      c.strokeStyle = '#C9A45C'; c.lineWidth = 10; c.strokeRect(16, 16, w - 32, h - 32);
      c.strokeStyle = 'rgba(201,164,92,.55)'; c.lineWidth = 3; c.strokeRect(34, 34, w - 68, h - 68);
      c.fillStyle = 'rgba(201,164,92,.32)'; for (let y = 130; y < h - 100; y += 128) { c.beginPath(); c.moveTo(w / 2, y - 30); c.lineTo(w / 2 + 26, y); c.lineTo(w / 2, y + 30); c.lineTo(w / 2 - 26, y); c.closePath(); c.fill(); }
    }, { aniso: 8 });
    const run = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 31), mat('#FFFFFF', { map: runTex, r: 1 }));
    run.rotation.x = -Math.PI / 2; run.rotation.z = Math.PI / 2; run.position.set(-131.5, FLOOR + .03, -52); run.receiveShadow = true; G.add(run);

    // a wall in its own plane (u along it, v up), its openings cut through, extruded by T and turned into
    // place: holes, each a rectangle with a round head (w, sill, spring) or a circle (r, y)
    const wall = (len, holes, place) => {
      const s = new THREE.Shape([new THREE.Vector2(0, FLOOR), new THREE.Vector2(len, FLOOR), new THREE.Vector2(len, TOP), new THREE.Vector2(0, TOP)]);
      for (const h of holes) {
        const p = new THREE.Path();
        if (h.r) p.absarc(h.u, h.y, h.r, 0, Math.PI * 2, true);
        else if (h.head === false) { p.moveTo(h.u - h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y1); p.lineTo(h.u - h.w / 2, h.y0); }
        else { p.moveTo(h.u - h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y0); p.lineTo(h.u + h.w / 2, h.y1); p.absarc(h.u, h.y1, h.w / 2, 0, Math.PI, false); p.lineTo(h.u - h.w / 2, h.y0); }
        s.holes.push(p);
      }
      const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 20 });
      { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / len, (uv.getY(i) - FLOOR) / (TOP - FLOOR)); }
      place(g);
      G.add(shadows(new THREE.Mesh(g, wallMat)));
    };
    const SW = READING.SWIN, EW = READING.EWIN, ND = READING.NDOOR;
    // south (its face at Z1, looking north; u runs east from the west wall: x = X1 - u)
    wall(W, READING.SWINS.map(x => ({ u: X1 - x, w: SW.w, y0: SW.y0, y1: SW.y1 })), g => { g.rotateY(Math.PI); g.translate(X1, 0, Z1); });
    // north (its face at Z0, looking south; u runs west from the east wall: x = X0 + u)
    wall(W, [{ u: ND.x - X0, w: ND.w, y0: FLOOR, y1: ND.top, head: false }], g => { g.translate(X0, 0, Z0); });
    // east (its face at X0, looking west; u runs north from the south wall's outer face: z = Z1 - T + u)
    wall(D + 2 * T, [{ u: EW.z - Z1 + T, w: EW.w, y0: EW.y0, y1: EW.y1 }, { u: EW.z - Z1 + T, y: READING.OCULUS.y, r: READING.OCULUS.r }], g => { g.rotateY(-Math.PI / 2); g.translate(X0, 0, Z1 - T); });
    // the plinth down to the garden; the flat roof over the vault, its parapet
    G.add(shadows(at(box(W + T + .6, FLOOR - .3 - GARDEN, D + 2 * T + .6, mat('#CEC4B1', { r: .92 })), xm - T / 2 - .3, (FLOOR - .3 + GARDEN) / 2, zm)));
    G.add(shadows(at(box(W + T + .6, .5, D + 2 * T + .6, mat('#6B7385', { r: .8 })), xm - T / 2, TOP + .25, zm)));
    const par = mat('#CEC4B1', { r: .92 });
    for (const [w, d, x, z] of [[W + T + 1.2, 1, xm - T / 2, Z0 + T + .3], [W + T + 1.2, 1, xm - T / 2, Z1 - T - .3], [1, D + 2 * T, X0 - T - .3, zm]]) G.add(shadows(at(box(w, 2.2, d, par), x, TOP + 1.1, z)));
    // the skirting
    for (const [w, d, x, z] of [[W, .12, xm, Z0 - .06], [W, .12, xm, Z1 + .06], [.12, D, X0 + .06, zm], [.12, D, X1 - .06, zm]]) G.add(at(rbox(w, .6, d, .03, trim), x, FLOOR + .3, z));
  }

  // ---------- the vault: coffered, on ribs over pilasters, a cornice where it springs ----------
  {
    const rise = CROWN - SPRING, half = D / 2, Rv = (half * half + rise * rise) / (2 * rise), cy = CROWN - Rv, th0 = Math.asin((SPRING - cy) / Rv), arc = Math.PI - 2 * th0;
    const ct = cofferTex(); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(Math.round(Rv * arc / 4.6), READING.BAYS * 2);
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(Rv, Rv, W, 72, 1, true, th0, arc), mat('#FFFFFF', { map: ct, r: .95, side: THREE.BackSide }));
    vault.rotation.z = Math.PI / 2; vault.position.set(xm, cy, zm); vault.receiveShadow = true; G.add(vault);
    // (the vault seen from outside the house is under the roof; its back is never seen)
    // the ribs: a band of the vault's arc, a little proud of it, at each bay's edge
    const rib = (x, depth = .8, wdt = 1) => {
      const s = new THREE.Shape(), n = 40;
      for (let i = 0; i <= n; i++) { const a = th0 + arc * i / n; if (i) s.lineTo(-Math.cos(a) * Rv, Math.sin(a) * Rv); else s.moveTo(-Math.cos(a) * Rv, Math.sin(a) * Rv); }
      for (let i = n; i >= 0; i--) { const a = th0 + arc * i / n; s.lineTo(-Math.cos(a) * (Rv - depth), Math.sin(a) * (Rv - depth)); }
      const g = new THREE.ExtrudeGeometry(s, { depth: wdt, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -wdt / 2); g.rotateY(Math.PI / 2);
      const m = new THREE.Mesh(g, trim); m.position.set(x, cy, zm); m.castShadow = m.receiveShadow = true; G.add(m);
    };
    BAY_EDGES.forEach((x, i) => rib(i === 0 ? x - .5 : i === READING.BAYS ? x + .5 : x, i === 0 || i === READING.BAYS ? .6 : .9, i === 0 || i === READING.BAYS ? 1 : 1.3));
    // the cornice along the side walls at the spring, and a moulding round the ends' arcs
    for (const z of [Z0, Z1]) { const s = z === Z0 ? -1 : 1; G.add(at(rbox(W, 1.1, 1.3, .2, trim), xm, SPRING - .45, z + s * .65), at(rbox(W, .35, 1.7, .1, trim), xm, SPRING + .05, z + s * .85)); }
    // the pilasters under the ribs, on the side walls: a shaft, a capital under the cornice, a base
    for (let i = 1; i < READING.BAYS; i++) {
      const x = BAY_EDGES[i];
      for (const z of [Z0, Z1]) {
        const s = z === Z0 ? -1 : 1;
        G.add(at(rbox(1.5, SPRING - 1 - FLOOR, .45, .06, trim), x, (FLOOR + SPRING - 1) / 2, z + s * .22));
        G.add(at(rbox(2.0, .8, .8, .1, trim), x, SPRING - 1.4, z + s * .4), at(rbox(1.9, .9, .7, .1, trim), x, FLOOR + .45, z + s * .35));
      }
    }
  }

  // ---------- the windows: the east window and its oculus, the two south windows ----------
  {
    const fr = mat('#F1ECE2', { r: .6 }), glassMat = new THREE.MeshPhysicalMaterial({ color: '#C9D6E8', roughness: .05, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    // a round-headed window in a wall: its casing and arch on the room's face, the sill, glazing bars,
    // the fan in its head, the glass. Built in the wall's plane (a: along the wall, y up) and placed by put
    const arched = ({ w, y0, y1 }, put) => {
      const parts = [], cas = .55, bar = (bw, bh, ba, by) => parts.push(at(rbox(bw, bh, .12, .02, fr), ba, by, .3));
      const arch = (r, th, z) => { const pts = []; for (let i = 0; i <= 28; i++) { const a = Math.PI * i / 28; pts.push(new THREE.Vector3(Math.cos(a) * r, y1 + Math.sin(a) * r, z)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, th, 6, false), trim); };
      parts.push(at(rbox(cas, y1 - y0, .3, .05, trim), -w / 2 - cas / 2, (y0 + y1) / 2, -.1), at(rbox(cas, y1 - y0, .3, .05, trim), w / 2 + cas / 2, (y0 + y1) / 2, -.1));
      parts.push(arch(w / 2 + cas / 2, cas / 2, -.1));
      parts.push(at(rbox(w + 1.6, .34, 1.2, .06, trim), 0, y0 - .17, -.45));   // the sill
      bar(.2, y1 - y0, 0, (y0 + y1) / 2);
      for (const ty of [y0 + (y1 - y0) * .34, y0 + (y1 - y0) * .67, y1]) bar(w, .16, 0, ty);
      for (const ba of [-w / 4, w / 4]) bar(.08, y1 - y0, ba, (y0 + y1) / 2);
      for (let i = 1; i < 4; i++) { const a = Math.PI * i / 4, len = w / 2; parts.push(at(rbox(.1, len, .1, .02, fr), Math.cos(a) * len / 2, y1 + Math.sin(a) * len / 2, .3, { z: a - Math.PI / 2 })); }
      parts.push(arch(w / 2 - .05, .09, .3));
      const gs = new THREE.Shape(); gs.moveTo(-w / 2, y0); gs.lineTo(w / 2, y0); gs.lineTo(w / 2, y1); gs.absarc(0, y1, w / 2, 0, Math.PI, false); gs.lineTo(-w / 2, y0);
      const glass = new THREE.Mesh(new THREE.ShapeGeometry(gs, 14), glassMat); glass.position.z = .38; glass.userData.noG = true; parts.push(glass);
      const g = group(...parts); put(g); parts.forEach(p => { if (p.isMesh && p !== glass) { p.castShadow = true; p.receiveShadow = true; } }); G.add(g);
    };
    // (the window's plane faces the room: its +z local is out of the room, its -z toward it)
    READING.SWINS.forEach(x => arched(READING.SWIN, g => { g.rotation.y = Math.PI; g.position.set(x, 0, Z1 - .02); }));
    arched(READING.EWIN, g => { g.rotation.y = -Math.PI / 2; g.position.set(X0 - .02, 0, READING.EWIN.z); });
    // the oculus: a moulded ring, its glazing bars, the glass
    {
      const { y, r } = READING.OCULUS, ring = new THREE.Mesh(new THREE.TorusGeometry(r + .3, .32, 10, 48), trim);
      ring.rotation.y = Math.PI / 2; ring.position.set(X0 + .1, y, READING.EWIN.z); ring.castShadow = true; G.add(ring);
      for (let k = 0; k < 4; k++) G.add(at(rbox(.1, 2 * r, .1, .02, fr), X0 - .3, y, READING.EWIN.z, { x: k * Math.PI / 4 }));
      const inner = new THREE.Mesh(new THREE.TorusGeometry(r * .42, .07, 8, 32), fr); inner.rotation.y = Math.PI / 2; inner.position.set(X0 - .3, y, READING.EWIN.z); G.add(inner);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 32), glassMat); glass.rotation.y = Math.PI / 2; glass.position.set(X0 - .4, y, READING.EWIN.z); glass.userData.noG = true; G.add(glass);
    }
  }

  // ---------- the room's name, over the east window: gilt letters on a dark panel with a moulded frame, as
  // institutions carve their names; the first thing seen coming in, and over the stand where 04 ends ----------
  {
    const insTex = canvasTex(2400, 260, (c, W, H) => {
      c.fillStyle = '#2B2219'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(201,164,92,.75)'; c.lineWidth = 6; c.strokeRect(14, 14, W - 28, H - 28);
      c.strokeStyle = 'rgba(201,164,92,.35)'; c.lineWidth = 2; c.strokeRect(30, 30, W - 60, H - 60);
      const g = c.createLinearGradient(0, H * .25, 0, H * .75); g.addColorStop(0, '#F1DA9C'); g.addColorStop(.5, '#C9A45C'); g.addColorStop(1, '#9C7A38');
      c.fillStyle = g; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '28px';
      let fs = 132; c.font = `600 ${fs}px Georgia, serif`; const t = 'SCIENTIFIC PUBLICATIONS';
      while (c.measureText(t).width > W - 200) { fs -= 2; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(t, W / 2 + 14, H / 2 + 6);
    });
    const IW = 16, IH = IW * 260 / 2400, IY = 24.6;
    const ins = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), mat('#FFFFFF', { map: insTex, r: .45, m: .2 }));
    ins.rotation.y = Math.PI / 2; ins.position.set(X0 + .16, IY, READING.EWIN.z); G.add(ins);
    // (its moulded frame, standing a little proud of the wall)
    for (const dy of [-1, 1]) G.add(at(rbox(.3, .22, IW + .5, .05, darkOak), X0 + .15, IY + dy * (IH / 2 + .11), READING.EWIN.z));
    for (const dz of [-1, 1]) G.add(at(rbox(.3, IH + .66, .25, .05, darkOak), X0 + .15, IY, READING.EWIN.z + dz * (IW / 2 + .12)));
  }

  // ---------- bookcases of bound journals: runs against the walls, their books one instanced draw ----------
  const rows = [];
  function bookcase({ along, a0, a1, face, dir, height = 19.5, shelves = 7, depth = 1.8, display = [] }) {
    const len = a1 - a0, mid = (a0 + a1) / 2, put = (m, a, y, f) => along === 'x' ? at(m, a, y, f) : at(m, f, y, a);
    const bx = (la, h, d, m, a, y, f) => G.add(put(rbox(along === 'x' ? la : d, h, along === 'x' ? d : la, .03, m), a, y, f));
    bx(len, height, .25, darkOak, mid, FLOOR + height / 2, face + dir * .125);   // the back
    const pitch = (height - 2.4) / shelves;
    for (let i = 0; i <= shelves; i++) {
      const y = FLOOR + 1.1 + i * pitch;
      bx(len, .16, depth, oak, mid, y, face + dir * depth / 2);
      if (i < shelves) rows.push({ along, a0: a0 + .4, a1: a1 - .4, y: y + .08, face: face + dir * .3, dir, hMax: pitch - .35, display: display.includes(i) });
    }
    const n = Math.max(1, Math.round(len / 6));
    for (let k = 0; k <= n; k++) bx(.32, height, depth + .1, oak, a0 + len * k / n, FLOOR + height / 2, face + dir * (depth + .1) / 2);
    bx(len + .6, .7, depth + .4, darkOak, mid, FLOOR + height + .35, face + dir * (depth + .4) / 2);   // the cornice
    bx(len, 1.1, depth + .05, darkOak, mid, FLOOR + .55, face + dir * depth / 2);   // the plinth
  }
  {
    const E = BAY_EDGES, p = .85;   // (each bay's run stops short of the pilasters)
    // the north wall: the first four bays (the fifth holds the door)
    for (let i = 0; i < 4; i++) bookcase({ along: 'x', a0: E[i + 1] + p, a1: E[i] - (i === 0 ? .2 : p), face: Z0, dir: -1 });
    // the south wall: the first, third and fifth bays (the second and fourth hold the windows)
    for (const i of [0, 2, 4]) bookcase({ along: 'x', a0: E[i + 1] + (i === 4 ? .2 : p), a1: E[i] - (i === 0 ? .2 : p), face: Z1, dir: 1 });
    // the west wall, either side of the strong room's door
    const DR = ARCHIVE.DOOR;
    bookcase({ along: 'z', a0: DR.z + DR.w / 2 + 2.6, a1: Z0 - .2, face: X1, dir: -1 });
    bookcase({ along: 'z', a0: Z1 + .2, a1: DR.z - DR.w / 2 - 2.6, face: X1, dir: -1 });
    // the east wall, either side of the window
    // (their four middle shelves hold MeWriT's published papers face out: below)
    const EW = READING.EWIN;
    bookcase({ along: 'z', a0: EW.z + EW.w / 2 + 2.4, a1: Z0 - .2, face: X0, dir: 1, display: [1, 2, 3, 4] });
    bookcase({ along: 'z', a0: Z1 + .2, a1: EW.z - EW.w / 2 - 2.4, face: X0, dir: 1, display: [1, 2, 3, 4] });
  }
  // the bound journals: runs of a journal's volumes in the same binding, year after year, with a few
  // hardbacks and modern books among them
  {
    const items = [], DEEP = ['#8C3B2E', '#3D4E73', '#6B4E3A', '#7C3B24', '#2F5B6E', '#5A4A6E', '#5E7D66', '#4F6B4C'];
    for (const row of rows) {
      if (row.display) continue;
      const ry = row.along === 'x' ? (row.dir > 0 ? 0 : Math.PI) : (row.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      let a = row.a0, run = null, left = 0;
      while (a < row.a1) {
        if (R() < .025) { a += .3 + R() * .6; continue; }
        // (all bound journals, in the deep bindings that runs of a journal take: no stray hardbacks or paperbacks)
        if (left <= 0) { let s = pickSpine('journal', R); for (let t = 0; t < 12 && !DEEP.includes(s.col); t++) s = pickSpine('journal', R); run = { fam: 'journal', s, h: 1.55 + R() * .6 }; left = 7 + Math.floor(R() * 10); }
        const bw = run.fam === 'journal' ? .32 + R() * .1 : .26 + R() * .3, bh = Math.min(row.hMax, run.h + (R() - .5) * .06), bd = 1.15 + R() * .2;
        if (a + bw > row.a1) break;
        items.push({ row, a: a + bw / 2, y: row.y + bh / 2, f: row.face + row.dir * bd / 2, w: bw, h: bh, d: bd, ry, lean: R() < .02 ? (R() - .5) * .2 : 0, ...run.s, shade: .86 + R() * .2 });
        a += bw + .012; left--;
      }
    }
    const geo = bookGeometry(items.length), mesh = new THREE.InstancedMesh(geo, bookMaterial(), items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
    items.forEach((b, i) => {
      e.set(0, b.ry, b.lean); sc.set(b.w, b.h, b.d);
      if (b.row.along === 'x') p.set(b.a, b.y, b.f); else p.set(b.f, b.y, b.a);
      q.setFromEuler(e); mesh.setMatrixAt(i, m4.compose(p, q, sc)); mesh.setColorAt(i, cc.set(b.col).multiplyScalar(b.shade));
      geo.attributes.aTile.setX(i, b.tile); geo.attributes.aShade.setX(i, b.shade);
    });
    mesh.castShadow = false; mesh.receiveShadow = true;
    G.add(mesh);
  }
  // MeWriT's published papers: the 25 publications that acknowledge its writing support (the deck), each
  // in its journal, standing face out on the display shelves either side of the east window, leaning back a
  // little; every cover marked "Writing support: MeWriT". One texture holds all 25 covers (5 by 5)
  {
    const NAMES = [['ANNALS OF', 'CLINICAL EVIDENCE', '#1E5A63'], ['JOURNAL OF', 'APPLIED TRIAL SCIENCE', '#24345E'], ['EVIDENCE IN', 'PRACTICE QUARTERLY', '#7A2E2A']];
    const TOPICS = ['Once-daily treatment and major events', 'A registry of ten thousand patients', 'Pooled safety of four trials', 'Outcomes after a decade', 'Adherence in primary care', 'A randomised trial in the very old', 'Costs and benefits, by region', 'Biomarkers that predict response', 'A systematic review of dosing', 'Early treatment in new diagnoses', 'Quality of life over five years', 'A meta-analysis of twelve trials', 'Real-world use after approval'];
    const CW = 256, CH = 352;
    const atlas = canvasTex(CW * 5, CH * 5, (c) => {
      for (let i = 0; i < 25; i++) {
        const x = (i % 5) * CW, y = Math.floor(i / 5) * CH, [top, name, col] = NAMES[i % 3];
        c.fillStyle = '#F7F2E7'; c.fillRect(x, y, CW, CH);
        c.fillStyle = col; c.fillRect(x, y, CW, 70);
        c.fillStyle = 'rgba(201,164,92,.95)'; c.fillRect(x, y + 70, CW, 3);
        c.fillStyle = 'rgba(244,238,226,.85)'; c.font = '600 13px Georgia, serif'; c.fillText(top, x + 14, y + 26);
        c.fillStyle = '#F4EEE2'; let fs = 22; c.font = `600 ${fs}px Georgia, serif`; while (c.measureText(name).width > CW - 28 && fs > 10) { fs--; c.font = `600 ${fs}px Georgia, serif`; } c.fillText(name, x + 14, y + 54);
        c.fillStyle = '#13244F'; c.font = 'italic 500 19px Georgia, serif';
        const words = TOPICS[i % TOPICS.length].split(' '); let line = '', ly = y + 108;
        for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > CW - 28) { c.fillText(line, x + 14, ly); ly += 24; line = w; } else line = t; }
        c.fillText(line, x + 14, ly);
        // a small figure of the paper's kind
        c.strokeStyle = 'rgba(19,36,79,.4)'; c.lineWidth = 1.5; const fy = y + 200; c.beginPath(); c.moveTo(x + 18, fy); c.lineTo(x + 18, fy + 70); c.lineTo(x + CW - 18, fy + 70); c.stroke();
        c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 20, fy + 8); for (let k = 1; k <= 8; k++) c.lineTo(x + 20 + k * (CW - 40) / 8, fy + 8 + 55 * (1 - Math.exp(-k / (3 + i % 4)))); c.stroke();
        // the acknowledgement, on every one
        c.fillStyle = 'rgba(19,36,79,.08)'; c.fillRect(x + 10, y + CH - 52, CW - 20, 38);
        c.fillStyle = '#B4500F'; c.font = '600 14px Georgia, serif'; c.fillText('Writing support: MeWriT', x + 18, y + CH - 28);
      }
    });
    const JW2 = 1.3, JH2 = 1.78, lean = .14, geos = [];
    let n = 0;
    for (const [ri, row] of rows.filter(r => r.display).entries()) {
      const len = row.a1 - row.a0, k = ri === 0 ? 4 : 3, gap = len / k;   // (25 over the eight shelves: four, then three each)
      for (let j = 0; j < k && n < 25; j++, n++) {
        const ge = new THREE.PlaneGeometry(JW2, JH2);
        const u0 = (n % 5) / 5, v0 = 1 - (Math.floor(n / 5) + 1) / 5, uv = ge.attributes.uv;
        for (let q = 0; q < uv.count; q++) uv.setXY(q, u0 + uv.getX(q) / 5, v0 + uv.getY(q) / 5);
        ge.translate(0, JH2 / 2, 0); ge.rotateX(-lean);
        // (facing into the room: +x for the east wall)
        ge.rotateY(row.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        ge.translate(row.face + row.dir * .55, row.y, row.a0 + gap * (j + .5));
        geos.push(ge);
      }
    }
    if (geos.length) {
      const covers = new THREE.Mesh(mergeGeometries(geos, false), mat('#FFFFFF', { map: atlas, r: .85 }));
      covers.receiveShadow = true; G.add(covers);
    }
    // the brass plate across the top of each case, at the cornice: what the shelves hold
    const plateTex = canvasTex(1400, 120, (c, W, H) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E2C784'); g.addColorStop(.5, '#C9A45C'); g.addColorStop(1, '#A9843E');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,55,20,.6)'; c.lineWidth = 4; c.strokeRect(10, 10, W - 20, H - 20);
      c.fillStyle = '#3A2810'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 54; c.font = `600 ${fs}px Georgia, serif`; const t = '25 PUBLICATIONS  ·  WRITING SUPPORT BY MEWRIT';
      while (c.measureText(t).width > W - 80) { fs--; c.font = `600 ${fs}px Georgia, serif`; }
      c.fillText(t, W / 2, H / 2 + 2);
    });
    const EW = READING.EWIN;
    for (const [a0, a1] of [[EW.z + EW.w / 2 + 2.4, Z0 - .2], [Z1 + .2, EW.z - EW.w / 2 - 2.4]]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(10, a1 - a0 - 2), .86), mat('#FFFFFF', { map: plateTex, r: .35, m: .6 }));
      pl.rotation.y = Math.PI / 2; pl.position.set(X0 + 2.32, FLOOR + 19.5 + .35, (a0 + a1) / 2); G.add(pl);
    }
  }

  // ---------- the doors: the strong room's, its frame and reveal on this side; the north door ----------
  let doorN = null;
  const doorGroup = new THREE.Group(); doorGroup.userData.keep = true;
  {
    const DR = ARCHIVE.DOOR, steel = mat('#2C323C', { r: .42, m: .35 }), h = DR.top - FLOOR;
    for (const dz of [-1, 1]) G.add(at(rbox(.6, h + .6, .7, .06, steel), X1 - .3, FLOOR + (h + .6) / 2, DR.z + dz * (DR.w / 2 + .3)));
    G.add(at(rbox(.6, .7, DR.w + 2, .06, steel), X1 - .3, DR.top + .3, DR.z));
    G.add(at(rbox(.9, .12, DR.w, .03, darkOak), X1 - .1, FLOOR + .06, DR.z));   // the threshold
    // the north door, on to the lecture room (05): a panelled oak door in a moulded architrave, hinged at its
    // east jamb, opening into the lecture room (doorN.set(u): 0 shut, 1 open)
    const ND = READING.NDOOR, x = ND.x, w = ND.w, dh = ND.top - FLOOR, zf = Z0 - .05;
    G.add(at(rbox(.7, dh + .7, .2, .05, trim), x - w / 2 - .35, FLOOR + (dh + .7) / 2, zf), at(rbox(.7, dh + .7, .2, .05, trim), x + w / 2 + .35, FLOOR + (dh + .7) / 2, zf));
    G.add(at(rbox(w + 1.4, .7, .2, .05, trim), x, ND.top + .35, zf));
    const leaf = new THREE.Group(); leaf.userData.keep = true;
    const lw = w - .1, lc = lw / 2 + .05;   // (the leaf's middle, from the hinge)
    leaf.add(at(rbox(lw, dh - .1, .45, .05, oak), lc, dh / 2, 0));
    for (const s of [-1, 1]) {
      for (const [py, ph] of [[dh * .72, dh * .38], [dh * .27, dh * .4]]) leaf.add(at(rbox(w - 1.6, ph, .12, .05, darkOak), lc, py, s * .26));
      leaf.add(at(cyl(.16, .16, .3, brass, 12), lw - .6, 10, s * .36, { x: Math.PI / 2 }));
    }
    leaf.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    leaf.position.set(x - w / 2 + .05, FLOOR, Z0 + .3);
    // (the leaf in its own group, drawn whichever room is drawn: the doorway is never an empty hole)
    doorGroup.add(leaf);
    doorN = { group: doorGroup, set(u) { const a = -Math.max(0, Math.min(1, u)) * 1.62; if (leaf.rotation.y === a) return false; leaf.rotation.y = a; return true; } };
  }

  // ---------- the reading tables, their chairs and green lamps ----------
  const TT = READING.TTOP, lamps = [];
  const table = (cz) => {
    const [xa, xb] = READING.TX, tl = xa - xb, tx = (xa + xb) / 2, tw = READING.TW;
    G.add(at(rbox(tl, .5, tw, .1, oak), tx, TT - .25, cz));
    G.add(at(rbox(tl - .6, .9, tw - .6, .06, darkOak), tx, TT - .95, cz));   // the apron
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.add(at(rbox(.75, TT - .5 - FLOOR, .75, .1, darkOak), tx + sx * (tl / 2 - 1.1), (FLOOR + TT - .5) / 2, cz + sz * (tw / 2 - 1)));
    G.add(contact(tl + 2, tw + 2, tx, cz, { y: FLOOR, k: .3 }));
  };
  const chair = (cx, cz, ry) => {
    const c = group(at(rbox(2.4, .32, 2.3, .06, darkOak), 0, 4.6, 0), at(rbox(2.4, 4.2, .26, .06, darkOak), 0, 6.8, -1.02));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(at(rbox(.26, 4.6, .26, .05, darkOak), sx * 1, 2.3, sz * .95));
    c.add(at(rbox(2, .6, 2, .2, green), 0, 4.95, .05));
    c.add(at(rbox(1.9, 2.2, .18, .08, green), 0, 7.2, -.9));   // the back's leather panel
    c.position.set(cx, FLOOR, cz); c.rotation.y = ry; G.add(c);
    G.add(contact(3, 3, cx, cz, { y: FLOOR, k: .22 }));
  };
  // a banker's lamp: a brass foot and stem, a green glass shade (a half tube along the reader's view,
  // open below, ends capped in brass); its light falls on the table before it
  // (an oval brass foot, a stem and a yoke under the shade; the shade a half tube of green glass, white
  // inside where the bulb lights it, its ends closed by half-round brass caps, brass rims along its open
  // edges; a pull chain at its side)
  const glass = mat('#1E6A48', { r: .18, m: .05 }), lining = mat('#F4EFE2', { r: .6, emissive: '#FFE9B8', ek: .35, side: THREE.BackSide });
  const bankerLamp = (x, z, ry = 0) => {
    const g = group();
    const foot = cyl(.5, .58, .12, brass, 32); foot.scale.set(1.35, 1, .85); foot.position.y = .06; g.add(foot);
    const step = cyl(.3, .36, .08, brass, 28); step.scale.set(1.3, 1, .85); step.position.y = .16; g.add(step);
    g.add(at(cyl(.05, .06, 1.3, brass, 14), 0, .85, 0), at(cyl(.09, .09, .08, brass, 14), 0, 1.5, 0));
    // the yoke: a bar across under the shade, rising at its ends to the shade's rims
    g.add(at(rbox(.84, .05, .06, .02, brass), 0, 1.54, 0));
    for (const s of [-1, 1]) g.add(at(rbox(.05, .16, .06, .02, brass), s * .41, 1.62, 0));
    const SY = 1.7, R = .42, L = 2.0;
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 32, 1, true, Math.PI / 2, Math.PI), glass);
    shade.rotation.x = Math.PI / 2; shade.position.y = SY; g.add(shade);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - .015, R - .015, L - .02, 32, 1, true, Math.PI / 2, Math.PI), lining);
    inner.rotation.x = Math.PI / 2; inner.position.y = SY; g.add(inner);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(R + .02, 24, 0, Math.PI), mat(PAL.gold, { r: .3, m: .85, side: THREE.DoubleSide }));
      cap.position.set(0, SY, s * L / 2); g.add(cap);
      g.add(at(rbox(.05, .04, L, .015, brass), s * R, SY, 0));
    }
    g.add(at(cyl(.008, .008, .5, brass, 6), R * .6, SY - .27, L / 2 - .2), at(cyl(.035, .035, .07, brass, 10), R * .6, SY - .54, L / 2 - .2));
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.position.set(x, TT, z); g.rotation.y = ry; G.add(g);
    lamps.push([x, TT + 1.6, z]);
  };
  READING.TABLES.forEach(cz => {
    table(cz);
    // (at the south table the writer's own lamp, below, stands in for the first)
    for (const x of cz === READING.TABLES[1] ? [BAY_MID[3] - .4] : [BAY_MID[2] + 1.6, BAY_MID[3] - .4]) bankerLamp(x, cz, Math.PI / 2);
    // the chairs on both sides (the writer's, pulled out a little, at the south table: publication.js
    // stands its things before it)
    for (const x of [BAY_MID[1], BAY_MID[2], BAY_MID[3]]) for (const s of [-1, 1]) {
      const writer = cz === READING.TABLES[1] && s > 0 && x === BAY_MID[1];
      chair(x, writer ? READING.CHAIR.z : cz + s * (READING.TW / 2 + 2), s > 0 ? Math.PI : 0);
    }
  });
  // the writer's own lamp at the south table, beyond the work at its left, turned toward it
  bankerLamp(READING.DESK.x - 9.4, READING.DESK.z - 2.4, Math.PI / 2 - .45);
  // (on the north table: a pile of journals, one open)
  {
    const cz = READING.TABLES[0];
    G.add(at(rbox(2.1, .22, 2.9, .04, mat('#5E7D66', { r: .8 })), BAY_MID[2] - 2.5, TT + .11, cz + 1.8, { y: .12 }), at(rbox(2.1, .2, 2.9, .04, mat('#8C3B2E', { r: .8 })), BAY_MID[2] - 2.6, TT + .32, cz + 1.75, { y: -.06 }));
    // the open one: its page block, and the spread printed on its pages (a masthead's band on each, the
    // article's head and two columns of text, a figure, the fold's faint shadow)
    const open = group();
    open.add(at(rbox(4.1, .08, 2.9, .03, mat('#F3EEE2', { r: .9 })), 0, .04, 0));
    const SPREAD = 'Participants were assigned in a 1:1 ratio to the treatment or a matching placebo and followed for a median of 2.6 years. The primary outcome was the first major event, assessed by a committee unaware of the assignments. The analysis followed the intention-to-treat principle. ';
    const spreadTex = canvasTex(1400, 990, (c, W, H) => {
      c.fillStyle = '#FBF8F1'; c.fillRect(0, 0, W, H);
      const page = (x0) => {
        c.fillStyle = '#7A2E2A'; c.fillRect(x0 + 50, 50, W / 2 - 100, 34);
        c.fillStyle = '#F4EEE2'; c.font = '600 20px Georgia, serif'; c.fillText('EVIDENCE IN PRACTICE QUARTERLY', x0 + 66, 74);
        c.fillStyle = '#13244F'; c.font = '600 34px Georgia, serif'; c.fillText(x0 ? 'Outcomes in the very old' : 'Registries that last', x0 + 50, 140);
        c.font = '400 17px Georgia, serif'; c.fillStyle = 'rgba(43,53,80,.72)';
        const words = SPREAD.split(' ').filter(Boolean);
        for (let col = 0; col < 2; col++) {
          const cx = x0 + 50 + col * (W / 4 - 40), cw = W / 4 - 70;
          let wi = (col * 13 + (x0 ? 29 : 0)) % words.length;
          for (let ln = 0; ln < 30; ln++) {
            if (!x0 && col === 1 && ln > 6 && ln < 17) continue;   // (the figure's place)
            let line = '';
            for (;;) { const t = line ? line + ' ' + words[wi % words.length] : words[wi % words.length]; if (line && c.measureText(t).width > cw) break; line = t; wi++; }
            c.fillText(line, cx, 190 + ln * 25);
          }
        }
        if (!x0) {
          const fx = 50 + W / 4 - 40, fy = 345, fw = W / 4 - 70, fh = 230;
          c.strokeStyle = 'rgba(19,36,79,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + fh); c.lineTo(fx + fw, fy + fh); c.stroke();
          [.8, .5, .66, .38].forEach((v, i) => { c.fillStyle = i % 2 ? '#B4500F' : '#7A2E2A'; c.fillRect(fx + 20 + i * (fw - 40) / 4, fy + fh - (fh - 20) * v, (fw - 40) / 4 - 14, (fh - 20) * v); });
        }
        c.font = '500 16px Georgia, serif'; c.fillStyle = 'rgba(19,36,79,.5)'; c.fillText(String(x0 ? 213 : 212), x0 ? W - 90 : 50, H - 36);
      };
      page(0); page(W / 2);
      const g = c.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
      g.addColorStop(0, 'rgba(40,44,56,0)'); g.addColorStop(.5, 'rgba(40,44,56,.12)'); g.addColorStop(1, 'rgba(40,44,56,0)');
      c.fillStyle = g; c.fillRect(W / 2 - 60, 0, 120, H);
    });
    const spread = new THREE.Mesh(new THREE.PlaneGeometry(4.06, 2.86).rotateX(-Math.PI / 2), mat('#FFFFFF', { map: spreadTex, r: .9 }));
    spread.position.y = .085; open.add(spread);
    open.position.set(BAY_MID[3] + 3.3, TT, cz - 1.6); open.rotation.y = .08 + Math.PI;   // (clear of the lamp's foot)
    G.add(open);
    G.add(contact(3, 3.6, BAY_MID[2] - 2.5, cz + 1.8, { y: TT, k: .2 }));
  }

  // ---------- the lanterns hung from the vault over the aisle ----------
  const lanterns = [];
  for (const x of [BAY_MID[1] - 2, BAY_MID[3] + 2]) {
    const y = 15.5, rod = CROWN - .9 - (y + 2.2);
    G.add(at(cyl(.05, .05, rod, mat(PAL.graphite, { r: .4, m: .6 }), 8), x, y + 2.2 + rod / 2, -52));
    const L = group();
    L.add(at(cyl(.75, .55, .4, brass, 6), 0, 2, 0), at(cyl(.2, .2, .5, brass, 10), 0, 2.4, 0), at(cyl(.55, .7, .3, brass, 6), 0, -.15, 0));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; L.add(at(rbox(.08, 2, .08, .02, brass), Math.cos(a) * .65, .95, Math.sin(a) * .65)); }
    const glassL = new THREE.Mesh(new THREE.CylinderGeometry(.66, .62, 1.9, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: '#FFF0D6', roughness: .2, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide }));
    glassL.position.y = .95; glassL.userData.noG = true; L.add(glassL);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 10), mat('#FFF6E6', { emissive: '#FFE3B0', ek: 1.4, r: .4 }));
    bulb.position.y = .9; L.add(bulb);
    L.position.set(x, y, -52); G.add(L);
    lanterns.push([x, y + .9, -52]);
  }

  // ---------- the reading stand before the east window: a turned pedestal, a sloped desk with a ledge ----------
  {
    const { x, z } = READING.STAND, H = FLOOR + 11.4, tilt = .42;
    const prof = [[0, 0], [1.9, 0], [1.95, .18], [1.6, .32], [.7, .5], [.55, .9], [.42, 2.4], [.5, 3.7], [.36, 5.7], [.3, 7.9], [.46, 8.9], [.6, 9.4], [0, 9.4]];
    const ped = shadows(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28), darkOak));
    ped.position.set(x, FLOOR, z); G.add(ped);
    G.add(contact(4.6, 4.6, x, z, { y: FLOOR, k: .26 }));
    // the desk: a board sloping down toward the reader (west), its ledge along the low edge
    const desk = group(at(rbox(3.2, .2, 4.4, .06, oak), 0, 0, 0), at(rbox(.22, .45, 4.4, .05, darkOak), 1.55, .2, 0));
    desk.add(at(rbox(1.6, 2.0, 2.6, .08, darkOak), -.3, -1.0, 0));   // the block under it, on the pedestal
    desk.rotation.z = -tilt; desk.position.set(x, H, z); G.add(shadows(desk));
  }

  return { group: G, lamps, lanterns, centre: [READING.STAND.x, READING.STAND.z], doorN };
}
