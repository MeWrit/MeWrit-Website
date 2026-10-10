/* The study, built in three dimensions for the house (site/docs/redesign-plan.md, section 11): the
   room of the design board's drawing, every object a solid that stands on its surface. The back wall
   holds, from the left, the doorway into the library hall (the hall seen through it), two framed
   certificates, the tall window (two lights and a transom, the town far below it); against it the
   oak desk: reference volumes and a snake plant at the back left, the display on its stand (where the
   editor is laid), the lamp at the back right with its light on the desk, coffee on a saucer, the
   keyboard pushed back to read, the manuscript in front of the display (the title page's object, the
   letterhead at its head), the tablet with the reviewer's notes, a ribboned notebook with a fountain
   pen. Units: about 10 cm; the desk top is y = 0, the back wall's face z = -7, x across the room.
   Returns { group, lamp: the lamp's light points, screen: the display's glass corners (for the
   editor), manuscript: the top sheet's corners (for the loader's page to land on), doorway }. */
import * as THREE from 'three';
import { PAL, mat, rbox, box, at, lathe, cyl, tube, group, panel, shadows, plasterTex, oakTex, boardsTex, paperTex, typeLines, roundRect, spineTex, shelfBooks, canvasTex, rng, contact, bake } from './kit.js';
import { buildOutside } from './outside.js';

export const STUDY = {
  WALL: -7, FLOOR: -7.5, CEIL: 15.5,
  DOOR: { x0: -11.5, x1: -3.6, top: 12.4 },
  WIN: { x0: 10.6, x1: 15.2, y0: 1.3, y1: 12.6 },
  DESK: { x0: -2.6, x1: 17.6, z0: 4.2, z1: -6.9 },   // a deep writing table, so the words lie over its top
  // the display's glass, raised high on its stand (so the words of the contents lie below it)
  SCREEN: [[3.55, 6.0, -5.285], [9.45, 6.0, -5.285], [9.45, 2.6, -5.285], [3.55, 2.6, -5.285]],
  // the writing slope (a wedge box, its leather face rising toward the wall) and the manuscript on it:
  // the slope's front foot at (x, 0, z), its face tilted by tilt (radians) over a length L, the front h0 high
  // (centred before the display and brought forward on the desk, close above the title's words)
  MS: { x: 6.5, z: 1.35, tilt: 34 * Math.PI / 180, L: 3.4, h0: .3 },
  // the lamp at the desk's right, its head reaching over the slope so its light falls on the page
  LAMP: { base: [14.2, 0, -3.4], j1: [14.6, 4.6, -4.2], j2: [13.2, 7.0, -1.8] },
  // the coffee, at the back of the desk by the window (whole in the contents' frame, its steam rising
  // against the wall)
  CUP: [11.6, 0, -5.6],
};

// page: the title page's words for the 3D page's own drawing ({ title: [lines], sub, begin, doc:
// [lines], foot, lines: [widths of the typeset lines] }, read from the page's markup by film.js)
export function buildStudy({ logo = null, quality = 'high', page = {} } = {}) {
  const hi = quality !== 'low';
  const G = new THREE.Group();
  const { WALL, FLOOR, CEIL, DOOR, WIN, DESK } = STUDY;
  const wallMat = mat(PAL.wall, { map: plasterTex(PAL.wall), r: .95 });
  const trim = mat(PAL.trim, { r: .7 });

  // ---------- the room: the back wall with its doorway and window, the floor, the ceiling, the sides ----------
  {
    const X0 = -26, X1 = 34, T = .5;
    const s = new THREE.Shape([new THREE.Vector2(X0, FLOOR), new THREE.Vector2(X1, FLOOR), new THREE.Vector2(X1, CEIL), new THREE.Vector2(X0, CEIL)]);
    const hole = (x0, y0, x1, y1) => new THREE.Path([new THREE.Vector2(x0, y0), new THREE.Vector2(x0, y1), new THREE.Vector2(x1, y1), new THREE.Vector2(x1, y0)]);
    s.holes.push(hole(DOOR.x0, FLOOR, DOOR.x1, DOOR.top), hole(WIN.x0, WIN.y0, WIN.x1, WIN.y1));
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
    g.translate(0, 0, WALL - T);
    // (an extrusion's texture coordinates come out in the shape's own units, so the plaster would
    // repeat every third of a unit: brought to 0..1 across the wall, like the side walls, its soft
    // unevenness spreads in broad patches)
    { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - X0) / (X1 - X0), (uv.getY(i) - FLOOR) / (CEIL - FLOOR)); }
    const wall = shadows(new THREE.Mesh(g, wallMat));
    G.add(wall);
    // the skirting and a picture rail, in runs that stop at the doorway's architrave and the window's
    // casing (never across an opening)
    const runs = (y, h, d, rad, gaps) => {
      let x = X0;
      for (const [g0, g1] of [...gaps, [X1, X1]]) { if (g0 - x > .05) G.add(at(rbox(g0 - x, h, d, rad, trim), (x + g0) / 2, y, WALL + d / 2)); x = Math.max(x, g1); }
    };
    const doorGap = [DOOR.x0 - .7, DOOR.x1 + .7], winGap = [WIN.x0 - .34, WIN.x1 + .34];
    runs(FLOOR + .35, .7, .14, .03, [doorGap]);
    runs(11.9, .18, .1, .02, [doorGap, winGap]);
    // the cornice
    G.add(at(rbox(X1 - X0, .5, .5, .1, trim), (X0 + X1) / 2, CEIL - .25, WALL + .25));
    // floor, ceiling, the side walls
    const floor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(70, 40), mat(PAL.floor, { map: boardsTex(PAL.floor, '#5A4330'), r: .78 })), false, true);
    floor.rotation.x = -Math.PI / 2; floor.position.set(4, FLOOR, 12); G.add(floor);
    const ceil = shadows(new THREE.Mesh(new THREE.PlaneGeometry(70, 40), mat('#F4EFE6', { r: 1 })), false, true);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(4, CEIL, 12); G.add(ceil);
    const side = (x, ry) => { const m = shadows(new THREE.Mesh(new THREE.PlaneGeometry(40, CEIL - FLOOR), wallMat), false, true); m.rotation.y = ry; m.position.set(x, (CEIL + FLOOR) / 2, 12); return m; };
    G.add(side(-26, Math.PI / 2), side(34, -Math.PI / 2));
  }

  // ---------- the doorway: its architrave, the door folded back against the hall's wall ----------
  {
    const z = WALL + .06, w = .7;
    G.add(at(rbox(w, DOOR.top - FLOOR + w, .16, .04, trim), DOOR.x0 - w / 2, (FLOOR + DOOR.top + w) / 2, z));
    G.add(at(rbox(w, DOOR.top - FLOOR + w, .16, .04, trim), DOOR.x1 + w / 2, (FLOOR + DOOR.top + w) / 2, z));
    G.add(at(rbox(DOOR.x1 - DOOR.x0 + 2 * w, w, .16, .04, trim), (DOOR.x0 + DOOR.x1) / 2, DOOR.top + w / 2, z));
    // the reveal (the wall's thickness, lined) and the door, open, panelled
    G.add(at(box(.5, DOOR.top - FLOOR, .5, trim), DOOR.x0 + .25, (FLOOR + DOOR.top) / 2, WALL - .25));
    G.add(at(box(.5, DOOR.top - FLOOR, .5, trim), DOOR.x1 - .25, (FLOOR + DOOR.top) / 2, WALL - .25));
    const doorW = DOOR.x1 - DOOR.x0 - .2, door = group(rbox(doorW, DOOR.top - FLOOR - .2, .3, .05, mat('#E8E0D0', { r: .7 })));
    [[.32, .62], [.32, .22]].forEach(([fy, fh]) => door.add(at(rbox(doorW * .7, (DOOR.top - FLOOR) * fh * .9, .06, .04, mat('#E1D8C6', { r: .72 })), 0, (DOOR.top - FLOOR) * (fy - .5) + (fy > .5 ? 0 : 0), .17)));
    door.add(at(cyl(.12, .12, .5, mat(PAL.gold, { r: .35, m: .8 }), 16), doorW * .4, -.5, .3, { x: Math.PI / 2 }));
    door.position.set(DOOR.x0 + .1, (FLOOR + DOOR.top) / 2, WALL - .5); door.rotation.y = Math.PI * .52;
    door.children.forEach(c => { c.position.x += doorW / 2; });
    G.add(door);
  }

  // ---------- the library hall, seen through the doorway (built out in full later) ----------
  {
    const H = new THREE.Group(), Z0 = WALL - .5, Z1 = -64, XL = -34, XR = -1.2;
    const hallFloor = shadows(new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, Z0 - Z1), mat('#8A6A4F', { map: boardsTex('#8A6A4F', '#56402D', 13), r: .75 })), false, true);
    hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set((XL + XR) / 2, FLOOR, (Z0 + Z1) / 2); H.add(hallFloor);
    const hallWall = mat('#E6DECD', { map: plasterTex('#E6DECD', 9), r: .95 });
    const wallR = shadows(new THREE.Mesh(new THREE.PlaneGeometry(Z0 - Z1, 30), hallWall)); wallR.rotation.y = -Math.PI / 2; wallR.position.set(XR, FLOOR + 15, (Z0 + Z1) / 2); H.add(wallR);
    const wallL = shadows(new THREE.Mesh(new THREE.PlaneGeometry(Z0 - Z1, 30), hallWall)); wallL.rotation.y = Math.PI / 2; wallL.position.set(XL, FLOOR + 15, (Z0 + Z1) / 2); H.add(wallL);
    const hallCeil = shadows(new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, Z0 - Z1), mat('#EFE8DC', { r: 1 })), false, true); hallCeil.rotation.x = Math.PI / 2; hallCeil.position.set((XL + XR) / 2, FLOOR + 26, (Z0 + Z1) / 2); H.add(hallCeil);
    // the far wall with its tall window, bright
    const far = shadows(new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, 30), hallWall)); far.position.set((XL + XR) / 2, FLOOR + 15, Z1); H.add(far);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(7, 15), mat('#F8F4EA', { emissive: '#FFF6E2', ek: 1.6 })); glow.position.set((XL + XR) / 2, FLOOR + 11, Z1 + .05); H.add(glow);
    // stacks: bookcases along both walls, a run of them down the middle, every shelf full
    const caseMat = mat('#B78E66', { map: oakTex('#B78E66', '#7A5A3C', 21), r: .7 });
    const COLS = ['#2B3A5C', '#3D4E73', '#8C3B2E', '#B4500F', '#D2A24C', '#5E7D66', '#E9E2D3', '#C9D3E3', '#6B4E3A', '#1D2C53', '#A88B5E', '#7A8FA8'];
    const rows = [];
    const stack = (x, z0, z1, facing) => {
      const len = Math.abs(z1 - z0), cz = (z0 + z1) / 2, hgt = 21, depth = 1.6;
      const back = at(rbox(depth * .3, hgt, len, .05, caseMat), x - facing * depth * .45, FLOOR + hgt / 2, cz); H.add(back);
      for (let y = FLOOR + .6; y < FLOOR + hgt; y += 2.6) {
        H.add(at(rbox(depth, .14, len, .03, caseMat), x, y, cz));
        if (y + 2.4 < FLOOR + hgt) rows.push({ y: y + .07, x, z0: Math.min(z0, z1), z1: Math.max(z0, z1), facing });
      }
      for (const zz of [z0, z1]) H.add(at(rbox(depth, hgt, .2, .04, caseMat), x, FLOOR + hgt / 2, zz));
    };
    stack(XR - .9, Z0 - 1, Z1 + 4, -1);
    stack(XL + .9, Z0 - 1, Z1 + 4, 1);
    // the books, along the cases: the instancing helper lays a row along its x and its depth along -z;
    // turned a quarter (-90 degrees about y) its x runs along the hall's z and its depth along +x, so each
    // case's books start at the case's inner back (xBack) and come out toward the aisle
    const shelf = (facing, xBack) => {
      const these = rows.filter(r => r.facing === facing).map(r => ({ x0: r.z0 + .3, x1: r.z1 - .3, y: r.y, z: 0, depth: 1.3, wMin: .28, wMax: .5, hMin: 1.4, hMax: 2.2 }));
      const m = shelfBooks(these, COLS, facing > 0 ? 31 : 47, { cast: false, plain: true });
      m.rotation.y = -Math.PI / 2; m.position.x = xBack;
      return m;
    };
    H.add(shelf(-1, XR - 2.8 + 1.2));
    H.add(shelf(1, XL + .3));
    // reading lamps down the hall (their light pools)
    for (const z of [-16, -30, -44]) {
      const t = at(rbox(5, .3, 2.4, .06, mat('#A27C58', { r: .65 })), (XL + XR) / 2, FLOOR + 7.4, z); H.add(t);
      H.add(at(cyl(.12, .12, 1.6, mat('#2E3B2F', { r: .5 }), 12), (XL + XR) / 2 + 1.4, FLOOR + 8.4, z));
      const shade = at(cyl(.35, .9, .7, mat('#2F5B45', { r: .45, emissive: '#2F5B45', ek: .2 }), 24), (XL + XR) / 2 + 1.4, FLOOR + 9.3, z); H.add(shade);
      const bulb = at(new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 8), mat('#FFE9C0', { emissive: '#FFD58A', ek: 2.4 })), (XL + XR) / 2 + 1.4, FLOOR + 9.0, z); H.add(bulb);
    }
    G.add(H);
  }

  // ---------- the certificates, in slim navy frames ----------
  const certTex = seal => paperTex((c, w, h) => {
    c.strokeStyle = 'rgba(19,36,79,.25)'; c.lineWidth = 6; c.strokeRect(40, 40, w - 80, h - 80);
    c.fillStyle = 'rgba(19,36,79,.85)'; roundRect(c, w * .25, h * .16, w * .5, 22, 6); c.fill();
    typeLines(c, w * .18, h * .3, w * .64, 9, 6, 28, 'rgba(19,36,79,.32)', rng(5 + seal.length));
    c.fillStyle = seal; c.beginPath(); c.arc(w * .74, h * .8, 46, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(19,36,79,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .18, h * .82); c.lineTo(w * .48, h * .82); c.stroke();
  }, 512, 680);
  const cert = (x0, x1, y0, y1, seal) => {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    G.add(at(rbox(w, h, .18, .03, mat(PAL.navy, { r: .45 })), cx, cy, WALL + .09));
    G.add(at(rbox(w - .26, h - .26, .06, .01, mat(PAL.ivory, { r: .9 })), cx, cy, WALL + .19));
    const p = panel(w - .8, h - .8, mat('#FFFFFF', { map: certTex(seal), r: .9 })); p.position.set(cx, cy, WALL + .225); G.add(p);
  };
  cert(-2.3, .2, 2.5, 5.9, '#D98A4E');
  cert(.65, 2.75, 3.1, 5.6, '#D6AE58');

  // ---------- the window: casing, two lights and a transom, the sill; the town far below ----------
  {
    const z = WALL + .02, cas = .34, cx = (WIN.x0 + WIN.x1) / 2;
    G.add(at(rbox(cas, WIN.y1 - WIN.y0 + cas * 2, .3, .04, trim), WIN.x0 - cas / 2, (WIN.y0 + WIN.y1) / 2, z));
    G.add(at(rbox(cas, WIN.y1 - WIN.y0 + cas * 2, .3, .04, trim), WIN.x1 + cas / 2, (WIN.y0 + WIN.y1) / 2, z));
    G.add(at(rbox(WIN.x1 - WIN.x0 + cas * 2, cas, .3, .04, trim), cx, WIN.y1 + cas / 2, z));
    G.add(at(rbox(WIN.x1 - WIN.x0 + 1.2, .3, .9, .06, trim), cx, WIN.y0 - .15, WALL + .25));   // the sill
    // the sashes, set back in the reveal: a mullion, a transom, glazing bars
    const fz = WALL - .25, bar = (w, h, x, y) => at(rbox(w, h, .14, .02, trim), x, y, fz);
    G.add(bar(.22, WIN.y1 - WIN.y0, cx, (WIN.y0 + WIN.y1) / 2));
    G.add(bar(WIN.x1 - WIN.x0, .22, cx, 9.6));
    G.add(bar(WIN.x1 - WIN.x0, .14, cx, WIN.y0 + .07));
    for (const x of [WIN.x0 + (cx - WIN.x0) / 2, cx + (WIN.x1 - cx) / 2]) G.add(bar(.08, WIN.y1 - 9.6, x, (9.6 + WIN.y1) / 2));
    // the glass: a faint reflection (left out of the normals, so the view keeps its drawing)
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshPhysicalMaterial({ color: '#E8F0F6', roughness: .05, metalness: 0, transparent: true, opacity: .1, depthWrite: false }));
    glass.position.set(cx, (WIN.y0 + WIN.y1) / 2, fz - .02); glass.userData.noG = true; G.add(glass);
    G.add(buildOutside({ hi }));
  }

  // ---------- the desk ----------
  const oak = mat(PAL.oak, { map: oakTex(PAL.oak, '#7C5B3C', 5, [1.6, 1]), r: .62 });
  {
    const w = DESK.x1 - DESK.x0, d = DESK.z0 - DESK.z1, cx = (DESK.x0 + DESK.x1) / 2, cz = (DESK.z0 + DESK.z1) / 2;
    G.add(at(rbox(w, .4, d, .08, oak), cx, -.2, cz));
    const side = mat(PAL.oakDark, { map: oakTex(PAL.oakDark, '#5E432B', 8), r: .7 });
    for (const x of [DESK.x0 + .4, DESK.x1 - .4]) G.add(at(rbox(.6, -FLOOR - .4, d - .4, .05, side), x, (FLOOR - .4) / 2, cz));
    G.add(at(rbox(w - 1.4, 4.2, .3, .04, side), cx, -2.5, DESK.z1 + .5));
    // a drawer pedestal under the right of the desk
    const ped = group(rbox(4.4, -FLOOR - .5, d - .8, .06, side));
    for (let i = 0; i < 3; i++) { ped.add(at(rbox(4, 2.1, .08, .04, side), 0, 2.5 - i * 2.35, (d - .8) / 2 + .04)); ped.add(at(rbox(1.1, .14, .2, .06, mat(PAL.gold, { r: .3, m: .85 })), 0, 3 - i * 2.35, (d - .8) / 2 + .16)); }
    ped.position.set(DESK.x1 - 3.2, (FLOOR - .5) / 2, cz); G.add(ped);
  }

  // ---------- reference volumes at the back left, two lying flat; the snake plant ----------
  {
    const vols = [[-2.15, .42, 2.5, '#F1ECE1', '#C8622A'], [-1.68, .52, 2.8, '#C9D3E3', '#1D2C53'], [-1.12, .38, 2.35, '#F4EFE5', '#D2A24C'], [-.7, .5, 2.65, '#1D2C53', '#D2A24C'], [-.16, .42, 2.25, '#E9EDF3', '#C8622A']];
    // (each a softened body in its cloth, its printed spine laid on the face toward the room: two
    // materials, so the bodies merge with everything else of their colour)
    vols.forEach(([x, w, h, col, band], i) => {
      const b = new THREE.Group();
      b.add(rbox(w, h, 1.55, .03, mat(col, { r: .8 }), 2));
      const sp = panel(w - .03, h - .05, mat('#FFFFFF', { map: spineTex(col, band), r: .75 })); sp.position.z = .777; b.add(sp);
      b.position.set(x + w / 2, h / 2, -6.15 + (i % 2) * .06);
      // the last leans on its neighbour: turned about its foot's near corner, its top corner just
      // touching the next book's side, its other foot corner lifted off the desk (nothing passes into
      // anything)
      if (i === 4) { const th = .1, prev = vols[3][0] + vols[3][1]; b.rotation.z = th; b.position.set(prev + .01 + (w / 2) * Math.cos(th) + (h / 2) * Math.sin(th), (w / 2) * Math.sin(th) + (h / 2) * Math.cos(th), b.position.z); }
      G.add(b);
    });
    // two lying flat, a short stack in front of the row (clear of it, of the plant and of the wall):
    // each two boards and a spine with the block of pages between, set back from the edges, so the
    // pages show at the head, the foot and the fore-edge; a little turned
    const flat = (y, w, d, col, ry) => {
      const cover = mat(col, { r: .8 }), pages = mat('#F3EEE2', { r: .95 });
      const b = group(at(rbox(w, .035, d, .015, cover), 0, .1425, 0), at(rbox(w, .035, d, .015, cover), 0, -.1425, 0), at(rbox(.06, .32, d, .02, cover), -w / 2 + .03, 0, 0), at(box(w - .08, .25, d - .08, pages), .02, 0, 0));
      b.position.set(-.95, y, -3.95); b.rotation.y = ry; G.add(b);
    };
    flat(.16, 1.7, 2.2, '#2B3A5C', .15); flat(.48, 1.55, 2.05, '#B4500F', .06);
    // the plant: a glazed pot, a snake plant's leaves rising in a loose fan; each leaf a tapering blade
    // folded a little along its rib, banded dark and light green with a pale margin
    const PX = 2.4, PZ = -6.15;
    // (the pot is open: its rim turns in and down, and the soil lies a little below it)
    const pot = lathe([[0, 0], [.55, 0], [.62, .1], [.72, 1.1], [.78, 1.2], [.75, 1.25], [.69, 1.2], [.65, 1.02], [0, 1.0]], mat('#E8E1D4', { r: .4 }));
    pot.position.set(PX, 0, PZ); G.add(pot);
    const soil = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#3E2E20'; c.fillRect(0, 0, w, h); const r = rng(53); for (let i = 0; i < 700; i++) { const s = 1 + r() * 3; c.fillStyle = r() < .5 ? `rgba(110,85,60,${.4 + r() * .4})` : `rgba(20,14,8,${.3 + r() * .4})`; c.beginPath(); c.arc(r() * w, r() * h, s, 0, Math.PI * 2); c.fill(); } }, { aniso: 2 });
    G.add(at(cyl(.655, .655, .05, mat('#FFFFFF', { map: soil, r: 1 }), 28), PX, 1.07, PZ));
    const leafTex = canvasTex(64, 512, (c, w, h) => {
      c.fillStyle = '#3F6A4A'; c.fillRect(0, 0, w, h);
      const r = rng(41);
      for (let y = 0; y < h; y += 9 + r() * 10) { c.strokeStyle = `rgba(150,190,140,${.25 + r() * .25})`; c.lineWidth = 2 + r() * 3; c.beginPath(); c.moveTo(6, y); c.bezierCurveTo(w * .3, y - 6, w * .7, y + 6, w - 6, y - 2); c.stroke(); }
      c.fillStyle = 'rgba(214,206,140,.95)'; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);
    }, { aniso: 4 });
    const R = rng(17), leafMat = mat('#FFFFFF', { map: leafTex, r: .55, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + R() * .5, lean = .03 + R() * .07, h = 1.7 + R() * 1.2, wdt = .26 + R() * .08;
      const geo = new THREE.PlaneGeometry(wdt, h, 2, 14), pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const y = Math.max(0, pos.getY(k) + h / 2), t = Math.min(1, y / h), taper = 1 - Math.pow(t, 2.6) * .96, x = pos.getX(k);   // (the stored float can land a hair below zero)
        pos.setX(k, x * taper); pos.setY(k, y); pos.setZ(k, Math.sin(t * 2.2) * .05 + t * t * lean * h - (Math.abs(x) < 1e-4 ? .035 * taper : 0));
      }
      geo.computeVertexNormals();
      const leaf = new THREE.Mesh(geo, leafMat); leaf.castShadow = leaf.receiveShadow = true;
      leaf.position.set(PX + Math.cos(ang) * .22, 1.08, PZ + Math.sin(ang) * .22); leaf.rotation.y = ang + Math.PI / 2;
      G.add(leaf);
    }
  }

  // ---------- the display, on its arm; the glass where the editor lies ----------
  {
    const [a, b] = [STUDY.SCREEN[0], STUDY.SCREEN[2]], cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, w = b[0] - a[0] + .26, h = a[1] - b[1] + .26;
    G.add(at(rbox(w, h, .3, .07, mat(PAL.navy, { r: .35, m: .2 })), cx, cy, a[2] - .16));
    const glass = panel(b[0] - a[0], a[1] - b[1], new THREE.MeshStandardMaterial({ color: '#FDFBF6', emissive: '#FBF9F3', emissiveIntensity: .82, roughness: .25 }));
    glass.position.set(cx, cy, a[2]); G.add(glass);
    // the stand: a neck behind the screen, down to a weighted foot on the desk
    const steel = mat(PAL.steel, { r: .35, m: .7 });
    G.add(at(rbox(.58, cy - .05, .3, .08, steel), cx, (cy - .05) / 2 + .04, a[2] - .52));
    G.add(at(rbox(2.3, .09, 1.6, .045, steel), cx, .045, a[2] - .45));
  }

  // ---------- the keyboard, pushed back to read; the trackpad ----------
  // (the keys are drawn on its top, not modelled: from where the camera stands they read the same, and
  // seventy little blocks would draw seventy ink outlines)
  {
    const kb = new THREE.Group(), base = rbox(3.0, .14, 1.18, .05, mat('#D3CFC6', { r: .5, m: .3 }));
    kb.add(at(base, 0, .07, 0));
    const keysTex = canvasTex(1024, 400, (c, w, h) => {
      c.fillStyle = '#CFCAC0'; c.fillRect(0, 0, w, h);
      const rows = [[.62, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], [1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5]], [1, [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], [1, [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7]], [1, [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2]], [1, [1, 1, 1.2, 5.6, 1.2, 1, 1, 1]]];
      const pad = 22, gap = 9, totalH = rows.reduce((a, r) => a + r[0], 0), unitH = (h - pad * 2 - gap * (rows.length - 1)) / totalH;
      let y = pad;
      rows.forEach(([rh, keys]) => {
        const units = keys.reduce((a, k) => a + k, 0), unitW = (w - pad * 2 - gap * (keys.length - 1)) / units, kh = rh * unitH;
        let x = pad;
        keys.forEach(k => {
          const kw = k * unitW;
          c.fillStyle = 'rgba(80,72,60,.35)'; roundRect(c, x, y + 3, kw, kh, 7); c.fill();
          c.fillStyle = '#F7F4EE'; roundRect(c, x, y, kw, kh - 2, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.7)'; roundRect(c, x + 3, y + 2, kw - 6, kh * .35, 5); c.fill();
          x += kw + gap;
        });
        y += kh + gap;
      });
    });
    const top = panel(2.9, 1.1, mat('#FFFFFF', { map: keysTex, r: .5 })); top.rotation.x = -Math.PI / 2; top.position.y = .142; kb.add(top);
    kb.position.set(11.2, 0, -2.3); kb.rotation.y = -.42; G.add(kb);   // (turned aside for the slope)
    G.add(at(rbox(1.3, .06, 1.1, .05, mat('#E2DED6', { r: .45 })), 13.2, .03, -.6, { y: -.42 }));
  }

  // ---------- the writing slope: a wedge box in oak, a navy leather face tooled in gold, a lip ----------
  const ms = STUDY.MS, PW = 2.1, PH = 2.97, ct = Math.cos(ms.tilt), st = Math.sin(ms.tilt);
  {
    const D = ms.L * ct, Hb = ms.h0 + ms.L * st, Wd = 2.9;
    // the wedge, drawn in its side (u back from the front foot, v up) and pulled across the desk
    const side = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(D, 0), new THREE.Vector2(D, Hb), new THREE.Vector2(0, ms.h0)]);
    const g = new THREE.ExtrudeGeometry(side, { depth: Wd - .08, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, curveSegments: 1 });
    g.rotateY(Math.PI / 2); g.translate(-(Wd - .08) / 2, 0, 0);
    const wedge = shadows(new THREE.Mesh(g, mat('#6E4A33', { map: oakTex('#6E4A33', '#3E2817', 13, [.6, .6]), r: .5 })));   // walnut, darker than the desk's oak
    wedge.position.set(ms.x, .04, ms.z);
    G.add(wedge);
    // the leather face, a hair above the wood
    const leather = canvasTex(512, 600, (c, w, h) => {
      c.fillStyle = '#22385F'; c.fillRect(0, 0, w, h);
      const r = rng(19); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},${.02 + r() * .03})`; c.fillRect(r() * w, r() * h, 2, 2); }
      c.strokeStyle = 'rgba(214,174,88,.85)'; c.lineWidth = 4; c.strokeRect(22, 22, w - 44, h - 44); c.lineWidth = 1.5; c.strokeRect(34, 34, w - 68, h - 68);
    });
    const face = panel(Wd - .34, ms.L - .3, mat('#FFFFFF', { map: leather, r: .62 }));
    face.rotation.x = -Math.PI / 2 + ms.tilt;
    face.position.set(ms.x, .04 + ms.h0 + (ms.L / 2) * st + .045 * ct, ms.z - (ms.L / 2) * ct + .045 * st);
    G.add(face);
    // the lip that holds the pages, along the foot of the face
    const lip = rbox(Wd - .1, .2, .12, .04, mat('#5A3B27', { r: .5 }), 2);
    lip.rotation.x = ms.tilt; lip.position.set(ms.x, .04 + ms.h0 + .12 * st + .14 * ct, ms.z - .12 * ct + .14 * st);
    G.add(lip);
  }

  // ---------- the manuscript on the slope: the stack, its edges, the title page on top ----------
  // The title page drawn in the layout of the page's markup (house.css, .hs-page: hundredths of its
  // width, u here): the rule, the typeset lines with the highlighted one, the reviewer's mark and the
  // foot always; the words (letterhead, label, title, line, Begin reading) only in the copy shown when
  // the page is small on the screen (close up, the markup's own sharp words lie over it instead)
  const SERIF = '"Fraunces Variable", Fraunces, Georgia, serif';
  const drawPage = words => paperTex((c, w, h) => {
    const u = w / 100;
    c.textBaseline = 'top';
    c.fillStyle = '#B4500F'; c.fillRect(10 * u, 21.5 * u, 80 * u, .4 * u);
    (page.lines || []).forEach((lw, i) => {
      const y = 74 * u + i * 4.2 * u;
      if (i === 2) { c.fillStyle = 'rgba(224,168,46,.35)'; roundRect(c, 9.3 * u, y - .7 * u, 80 * u * lw + 1.4 * u, 2.5 * u, 1.2 * u); c.fill(); }
      c.fillStyle = 'rgba(19,36,79,.2)'; roundRect(c, 10 * u, y, 80 * u * lw, 1.1 * u, .55 * u); c.fill();
    });
    c.save(); c.translate(89 * u, 115.5 * u); c.rotate(-5 * Math.PI / 180); c.font = `600 ${5 * u}px Caveat, cursive`; c.fillStyle = '#B4500F'; c.textAlign = 'right'; c.fillText('final ✓', 0, 0); c.restore();
    c.fillStyle = 'rgba(19,36,79,.18)'; c.fillRect(10 * u, 131 * u, 80 * u, .2 * u);
    c.font = `500 ${1.45 * u}px ${SERIF}`; c.fillStyle = 'rgba(19,36,79,.5)'; c.textAlign = 'center'; if ('letterSpacing' in c) c.letterSpacing = `${.3 * u}px`; c.fillText((page.foot || '').toUpperCase(), 50 * u, 133 * u);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    if (!words) return;
    if (logo && logo.complete && logo.naturalWidth) c.drawImage(logo, 10 * u, 8 * u, 44 * u, 44 * u * logo.naturalHeight / logo.naturalWidth);
    c.textAlign = 'right'; c.font = `500 ${1.6 * u}px ${SERIF}`; c.fillStyle = 'rgba(19,36,79,.55)'; if ('letterSpacing' in c) c.letterSpacing = `${.27 * u}px`;
    (page.doc || []).forEach((t, i) => c.fillText(t.toUpperCase(), 90 * u, 9.2 * u + i * 3.02 * u));
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.textAlign = 'left'; c.fillStyle = '#13244F'; c.font = `600 ${9.4 * u}px ${SERIF}`;
    (page.title || []).forEach((t, i) => c.fillText(t, 10 * u, 29.4 * u + i * 9.78 * u));
    c.font = `italic 400 ${3.5 * u}px ${SERIF}`; c.fillStyle = 'rgba(19,36,79,.74)';
    let line = '', y = 52.9 * u;
    for (const word of (page.sub || '').split(' ')) { const t = line ? `${line} ${word}` : word; if (c.measureText(t).width > 74 * u && line) { c.fillText(line, 10 * u, y); y += 5.25 * u; line = word; } else line = t; }
    if (line) c.fillText(line, 10 * u, y);
    if (page.begin) {
      c.font = `italic 400 ${3.8 * u}px ${SERIF}`; c.fillStyle = '#13244F'; c.fillText(page.begin, 10 * u, 118 * u);
      const bw = c.measureText(page.begin).width; c.fillStyle = '#B4500F'; c.font = `400 ${3.8 * u}px ${SERIF}`; c.fillText('↓', 10 * u + bw + 1.6 * u, 118 * u);
      c.fillRect(10 * u, 118 * u + 4.6 * u, bw + 1.6 * u + c.measureText('↓').width, .35 * u);
    }
  });
  // (the words are the page's markup, laid over it at every size; drawPage(true) remains for a page
  // that must carry its own words, such as one seen with no markup over it)
  const pageBare = drawPage(false);
  // (in the group's frame the pages lie flat, y up from the leather, the page's head toward -z; the
  // group is tilted with the slope, so the head is up the slope)
  const msGroup = new THREE.Group();
  let topSheet = null;
  {
    const edges = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#F4F0E6'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { c.fillStyle = `rgba(150,130,100,${.08 + (y % 6 === 0 ? .1 : 0)})`; c.fillRect(0, y, w, 1); } });
    const stack = new THREE.Mesh(new THREE.BoxGeometry(PW, .1, PH), mat('#FFFFFF', { map: edges, r: .9 }));
    stack.castShadow = stack.receiveShadow = true; stack.position.y = .05; msGroup.add(stack);
    // two loose sheets under the top one, a little askew, their edges showing
    const white = mat(PAL.paper, { r: .9 }), R = rng(29);
    for (let i = 0; i < 2; i++) { const s = panel(PW, PH, white); s.rotation.set(-Math.PI / 2, 0, (R() - .5) * .07); s.position.set((R() - .5) * .1, .102 + i * .004, (R() - .5) * .06); s.castShadow = true; msGroup.add(s); }
    topSheet = panel(PW, PH, mat('#FFFFFF', { map: pageBare, r: .9, fresh: true }));
    topSheet.rotation.set(-Math.PI / 2, 0, 0); topSheet.position.y = .112; topSheet.castShadow = true;
    msGroup.add(topSheet);
    // on the slope: centred across it, the foot of the pages against the lip
    const along = .26 + PH / 2, lift = .045;
    msGroup.position.set(ms.x, .04 + ms.h0 + along * st + lift * ct, ms.z - along * ct + lift * st);
    msGroup.rotation.x = ms.tilt;
    msGroup.userData.keep = true;   // (the film moves its pages later: not merged)
    G.add(msGroup);
  }
  // the top sheet's corners (for the loader's page to land on), in the world: head left, head right,
  // foot right, foot left
  const msCorners = () => { msGroup.updateMatrixWorld(true); return [[-PW / 2, PH / 2, 0], [PW / 2, PH / 2, 0], [PW / 2, -PH / 2, 0], [-PW / 2, -PH / 2, 0]].map(p => new THREE.Vector3(...p).applyMatrix4(topSheet.matrixWorld).toArray()); };

  // ---------- the tablet with the reviewer's stylus notes; the stylus ----------
  {
    const t = new THREE.Group();
    t.add(at(rbox(2.25, .08, 1.62, .06, mat('#2A3044', { r: .4, m: .3 })), 0, .04, 0));
    const notes = canvasTex(720, 520, (c, w, h) => {
      c.fillStyle = '#FDFBF6'; c.fillRect(0, 0, w, h); c.fillStyle = '#F3EEE3'; c.fillRect(0, 0, w, 54);
      [[36, '#B4500F'], [72, '#E0A82E'], [108, '#13244F']].forEach(([x, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, 27, 10, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = 'rgba(19,36,79,.82)'; roundRect(c, 48, 96, 360, 20, 10); c.fill();
      typeLines(c, 48, 160, 470, 9, 9, 33, 'rgba(19,36,79,.3)', rng(3));
      c.fillStyle = 'rgba(224,168,46,.42)'; c.fillRect(42, 214, 330, 22);
      c.strokeStyle = 'rgba(180,80,15,.92)'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.ellipse(190, 290, 150, 24, -.03, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(345, 290); c.quadraticCurveTo(440, 282, 500, 236); c.stroke();
      c.fillStyle = 'rgba(180,80,15,.95)'; c.font = '600 58px Caveat, cursive'; c.fillText('refs checked ✓', 420, 440); c.font = '600 48px Caveat, cursive'; c.fillText('ICH E3 ✓', 512, 222);
    });
    const scr = panel(2.05, 1.42, mat('#FFFFFF', { map: notes, r: .35, emissive: '#FFFFFF', ek: .05 })); scr.rotation.x = -Math.PI / 2; scr.position.y = .085; t.add(scr);
    const stylus = tube([[-.95, .1, -.95], [.95, .1, -.95]], .045, mat('#E9E6DE', { r: .4 }), 8, 10); t.add(stylus);
    t.position.set(2.3, 0, -.4); t.rotation.y = .25; G.add(t);
  }

  // ---------- a ribboned notebook and a fountain pen ----------
  {
    const nb = new THREE.Group();
    nb.add(at(rbox(1.75, .22, 2.35, .05, mat('#22325A', { r: .65 })), 0, .11, 0));
    nb.add(at(box(1.64, .17, 2.27, mat('#F5F0E4', { r: .95 })), .03, .11, 0));
    nb.add(at(box(.1, .012, .9, mat('#C8622A', { r: .6 })), .35, .006, 1.55));   // the ribbon, out at the foot
    nb.add(at(rbox(.06, .225, 2.36, .02, mat('#C8622A', { r: .55 })), .78, .112, 0));   // an elastic band
    // the pen, lying across it: a lacquered barrel, the gold band and clip, the cap
    const pen = new THREE.Group(), lac = mat('#162244', { r: .2, m: .25 }), gold = mat(PAL.gold, { r: .25, m: .9 });
    const barrel = cyl(.075, .085, 1.5, lac, 24); barrel.rotation.z = Math.PI / 2; pen.add(barrel);
    const cap = cyl(.092, .088, .8, lac, 24); cap.rotation.z = Math.PI / 2; cap.position.x = 1.1; pen.add(cap);
    const band = cyl(.095, .095, .07, gold, 24); band.rotation.z = Math.PI / 2; band.position.x = .72; pen.add(band);
    const clip = at(rbox(.6, .03, .05, .01, gold), 1.15, .1, 0); pen.add(clip);
    const nib = cyl(.01, .075, .3, gold, 16); nib.rotation.z = Math.PI / 2; nib.position.x = -.9; pen.add(nib);
    pen.position.set(-.1, .32, -.2); pen.rotation.y = .6; nb.add(pen);
    nb.position.set(15.4, 0, 1.1); nb.rotation.y = -.25; G.add(nb);
  }

  // ---------- coffee, on its saucer ----------
  {
    const [cx, , cz] = STUDY.CUP, china = mat('#F7F4EE', { r: .28 });
    const saucer = lathe([[0, 0], [.75, 0], [.95, .06], [1.0, .1], [.92, .1], [.6, .05], [0, .05]], china); saucer.position.set(cx, 0, cz); G.add(saucer);
    const cup = lathe([[0, .06], [.38, .06], [.42, .12], [.52, .8], [.55, .95], [.5, .95], [.47, .82], [.38, .2], [0, .18]], china); cup.position.set(cx, .02, cz); G.add(cup);
    const coffee = at(cyl(.46, .46, .02, mat(PAL.coffee, { r: .2 }), 32), cx, .82, cz); G.add(coffee);
    const handle = shadows(new THREE.Mesh(new THREE.TorusGeometry(.2, .05, 10, 24, Math.PI * 1.25), china));
    handle.position.set(cx + .55, .5, cz); handle.rotation.z = -Math.PI * .62; G.add(handle);
  }

  // ---------- the lamp: weighted base, two arms with springs, the shade lit within ----------
  const lampAt = { at: [0, 0, 0], aim: [0, 0, 0] };
  {
    const enamel = mat('#22325A', { r: .32, m: .25 }), steel = mat(PAL.steel, { r: .3, m: .8 });
    // (aimed at the letterhead: the head of the title page, up the slope from its middle, where the
    // logo is; the shade turns to the same point, so the light falls where the lamp looks)
    msGroup.updateMatrixWorld(true);
    const head = new THREE.Vector3(0, .112, -1.1).applyMatrix4(msGroup.matrixWorld);
    const { base: b, j1, j2 } = STUDY.LAMP, aim = head.toArray();
    const base = lathe([[0, 0], [.85, 0], [.88, .12], [.8, .28], [.25, .34], [0, .36]], enamel); base.position.set(...b); G.add(base);
    const rod = (p, q) => { G.add(tube([p, q], .055, steel, 2, 10)); };
    rod([b[0] - .06, .3, b[2]], [j1[0] - .06, j1[1], j1[2]]); rod([b[0] + .06, .3, b[2]], [j1[0] + .06, j1[1], j1[2]]);
    rod([j1[0], j1[1], j1[2] - .06], [j2[0], j2[1], j2[2] - .06]); rod([j1[0], j1[1], j1[2] + .06], [j2[0], j2[1], j2[2] + .06]);
    for (const p of [[b[0], .32, b[2]], j1, j2]) G.add(at(new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 8), enamel), p[0], p[1], p[2]));
    // the springs along the lower arm
    const spr = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * 40; spr.push([b[0] + (j1[0] - b[0]) * t + Math.cos(a) * .07, .6 + (j1[1] - .6) * t * .7, b[2] + (j1[2] - b[2]) * t + Math.sin(a) * .07 + .14]); }
    G.add(tube(spr, .012, steel, 240, 6));
    // the shade: a cone from the second joint toward the aim, open toward the desk, warm inside
    const dir = new THREE.Vector3(aim[0] - j2[0], aim[1] - j2[1], aim[2] - j2[2]).normalize();
    const shade = new THREE.Group();
    const outer = lathe([[.16, 0], [.22, .08], [.72, 1.05], [.76, 1.1]], enamel, 48);
    const inner = lathe([[.74, 1.08], [.7, 1.03], [.2, .1], [.14, .02]], mat('#FFF1D6', { emissive: '#FFE2AE', ek: .9, r: .6, side: THREE.DoubleSide }), 48);
    inner.castShadow = false;
    shade.add(outer, inner);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 10), mat('#FFF6E6', { emissive: '#FFE5B5', ek: 3 })); bulb.position.y = .55; shade.add(bulb);
    shade.position.set(...j2);
    shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    G.add(shade);
    lampAt.at = [j2[0] + dir.x * .9, j2[1] + dir.y * .9, j2[2] + dir.z * .9]; lampAt.aim = aim;
    lampAt.bulb = [j2[0] + dir.x * .62, j2[1] + dir.y * .62, j2[2] + dir.z * .62];
  }

  // ---------- where things meet the desk and the floor: a soft shade under each ----------
  [
    [3.3, 2.1, -1.0, -6.12, 0], [2.3, 2.7, -.95, -3.95, .12], [2.0, 2.0, 2.4, -6.15, 0], [2.7, 2.0, 6.5, -5.74, 0],
    [2.5, 2.5, STUDY.CUP[0], STUDY.CUP[2], 0], [2.2, 2.2, STUDY.LAMP.base[0], STUDY.LAMP.base[2], 0], [3.6, 3.5, STUDY.MS.x, STUDY.MS.z - 1.45, 0],
    [2.8, 2.1, 2.3, -.4, .25], [2.3, 2.9, 15.4, 1.1, -.25], [3.4, 1.6, 11.2, -2.3, -.42], [1.6, 1.4, 13.2, -.6, -.42],
  ].forEach(([w, d, x, z, ry]) => G.add(contact(w, d, x, z, { ry })));
  {
    const cz = (DESK.z0 + DESK.z1) / 2, d = DESK.z0 - DESK.z1;
    G.add(contact(5.4, d + .6, DESK.x1 - 3.2, cz, { y: FLOOR, k: .4 }));
    for (const x of [DESK.x0 + .4, DESK.x1 - .4]) G.add(contact(1.4, d + .4, x, cz, { y: FLOOR, k: .4 }));
  }

  const baked = bake(G);
  // the title page's centre and its normal (the way it faces), in the world
  msGroup.updateMatrixWorld(true);
  const pageCentre = topSheet.getWorldPosition(new THREE.Vector3()), pageNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(msGroup.quaternion);
  return {
    group: G, lamp: lampAt, screen: STUDY.SCREEN, manuscript: msCorners, ms: msGroup, baked, pageCentre, pageNormal, pageSize: [PW, PH],
  };
}
