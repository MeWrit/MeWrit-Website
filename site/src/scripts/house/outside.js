/* What the house's windows look out on (site/docs/redesign-plan.md, sections 11.4 and 11.12): one
   landscape all round the house, the same from every window and every angle. The compass: -z is south,
   +x west, -x east, +z north.
   - The house stands on a terrace garden: lawn, a clipped hedge along the terrace's edge, the big tree
     west of the study's window, a few shrubs. Beyond the edge the land drops to the valley.
   - South, across the valley: the hillside of fields and villages the study's window looks at, rising
     to its ridge.
   - West: the sunset hills, high and rounded, a notch between the two highest where the sun goes down.
   - East: the valley opens out to low hills a long way off, where the dawn comes.
   - North: a wooded slope rising close behind the house.
   The far things are small models a long way off (forced perspective: a house there is about a tenth
   of its size), all of them far enough from every room that the trick never shows; the haze (the
   stage's fog, in the hour's horizon colour) softens them. The sky, with its sun and clouds, is the
   stage's (it travels with the camera). Everything here is static and merged with the house (kit.js,
   bake). */
import * as THREE from 'three';
import { mat, rbox, at, rng } from './kit.js';

export const GARDEN = -20;   // the garden's level (the house's floors are at -7.5: it stands on a plinth)
// the terrace: a rounded rectangle round the house, flat at the garden's level
export const TERRACE = { x0: -182, x1: 108, z0: -122, z1: 66, r: 28 };
// the house's footprint with a margin (nothing of the garden grows inside it)
const HOUSE = { x0: -158, x1: 40, z0: -104, z1: 46 };

const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const hill = (x, z, cx, cz, rx, rz, h) => { const u = (x - cx) / rx, v = (z - cz) / rz, d = u * u + v * v; return d > 12 ? 0 : h * Math.exp(-d); };
// how far a point is outside the terrace's edge (0 on the terrace)
export function beyond(x, z) {
  const T = TERRACE;
  const qx = Math.max(T.x0 + T.r - x, x - (T.x1 - T.r), 0), qz = Math.max(T.z0 + T.r - z, z - (T.z1 - T.r), 0);
  return Math.max(0, Math.hypot(qx, qz) - T.r);
}
// the ground's height anywhere
export function groundY(x, z) {
  const o = beyond(x, z);
  if (o <= 0) return GARDEN;
  // behind the house (north) the land rises at once; on the other sides it first drops to the valley
  const north = sm((z - 40) / 50);
  const drop = -34 * sm(o / 30) * (1 - north);
  // south: the hillside across the valley, rising to its ridge (fields and villages)
  const s = Math.max(0, -z - 140);
  let rise = sm(s / 70) * (s * .27 + Math.sin(x * .021 + 1.3) * 7 + Math.sin(x * .053 + z * .02) * 3);
  // west: the sunset hills, a notch between the two highest
  rise += hill(x, z, 238, -36, 72, 92, 112) + hill(x, z, 262, -214, 78, 72, 100) + hill(x, z, 336, 96, 92, 92, 88)
    + hill(x, z, 214, -330, 74, 62, 64) + hill(x, z, 372, -116, 64, 118, 70) + hill(x, z, 168, 150, 70, 60, 40);
  // east: low hills a long way off (the dawn's)
  rise += hill(x, z, -440, -70, 96, 170, 46) + hill(x, z, -410, 180, 96, 96, 52) + hill(x, z, -370, -320, 86, 80, 40);
  // north: the wooded slope close behind the house
  rise += north * o * .5 + north * Math.sin(x * .035) * 5 * sm(o / 60);
  // a gentle unevenness everywhere off the terrace
  rise += (Math.sin(x * .04 + z * .03) * 2 + Math.sin(x * .011 - z * .017) * 4) * sm(o / 50);
  return GARDEN + drop + rise * sm(o / 24);
}

// a lumpy round: a sphere pushed about by a few waves, smooth (so the ink draws its outline only)
function lump(r, seed, segs = 14) {
  const g = new THREE.SphereGeometry(r, segs, Math.round(segs * .7)), p = g.attributes.position, R = rng(seed);
  const a = [R() * 6, R() * 6, R() * 6], f = 1.6 + R() * 1.4;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .14 * Math.sin(x / r * f + a[0]) * Math.cos(z / r * f + a[1]) + .08 * Math.sin(y / r * f * 1.7 + a[2]);
    p.setXYZ(i, x * k, y * k * .88, z * k);
  }
  g.computeVertexNormals();
  return g;
}
const inHouse = (x, z, m = 0) => x > HOUSE.x0 - m && x < HOUSE.x1 + m && z > HOUSE.z0 - m && z < HOUSE.z1 + m;

export function buildOutside({ hi = true } = {}) {
  const O = new THREE.Group(), R = rng(61);

  // ---------- the ground: one sheet all round, its colour by place ----------
  // (lawn on the terrace; the banks darker; fields in strips on the far hillside and the lower slopes of
  // the hills; woods on the north slope and the hills' shoulders; the valley's meadows)
  {
    const X0 = -470, X1 = 430, Z0 = -440, Z1 = 330, sx = hi ? 150 : 100, sz = hi ? 128 : 86;
    const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, sx, sz);
    g.rotateX(-Math.PI / 2); g.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const fields = ['#A9B98C', '#BFC497', '#98AB82', '#B8AE84', '#A3B58E', '#C9C49B', '#B3BD8E'];
    const wood = new THREE.Color('#62815A'), woodDark = new THREE.Color('#557550'), lawn = new THREE.Color('#9CB287'), bank = new THREE.Color('#86A070'), meadow = new THREE.Color('#A7B98A');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = groundY(x, z), o = beyond(x, z);
      p.setY(i, y);
      if (o <= 0) c.copy(lawn);
      else if (o < 30 && z < 40) c.copy(bank).lerp(meadow, sm(o / 30));
      else {
        // fields: patches by place, in strips that follow the slope
        const k = Math.floor((x + 600) / 44 + Math.sin(z * .031) * .9) + Math.floor((-z + 600) / 36) * 3;
        c.set(fields[((k % fields.length) + fields.length) % fields.length]);
        // woods: the north slope, and the hills' upper shoulders in patches
        const w = z > 60 ? sm((z - 70) / 30) : sm((y + 4) / 20) * sm(Math.sin(x * .05 + z * .043) * 1.4 + .3);
        if (w > 0) c.lerp(((Math.floor(x / 23) + Math.floor(z / 19)) & 1) ? wood : woodDark, Math.min(1, w));
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    ground.receiveShadow = true;
    O.add(ground);
  }

  // ---------- the hedge along the terrace's edge (south, west and east), shrubs, the big tree ----------
  {
    const hedge = mat('#6F8F67', { r: .95 }), dark = mat('#5C7C58', { r: .95 }), T = TERRACE, inset = 7;
    const run = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 15)), ang = Math.atan2(-(z1 - z0), x1 - x0);
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, h = 4 + R() * 1.2;
        O.add(at(rbox(len / n + .4, h, 4, 1.6, R() < .5 ? hedge : dark), x, GARDEN + h / 2 - .2, z, { y: ang }));
      }
    };
    run(T.x0 + T.r, T.z0 + inset, T.x1 - T.r, T.z0 + inset);   // south
    run(T.x1 - inset, T.z0 + T.r, T.x1 - inset, T.z1 - T.r);   // west
    run(T.x0 + inset, T.z0 + T.r, T.x0 + inset, 30);   // east (to the north slope)
    // shrubs on the lawn, clear of the house
    for (let i = 0, k = 0; i < 40 && k < (hi ? 14 : 9); i++) {
      const sx = T.x0 + 20 + R() * (T.x1 - T.x0 - 40), sz = T.z0 + 20 + R() * (T.z1 - T.z0 - 40);
      if (inHouse(sx, sz, 6) || (sx > -2 && sx < 30 && sz > -70)) continue;   // (not before the study's window, near the glass)
      const s = new THREE.Mesh(lump(1.2 + R() * 1.3, 100 + i, 12), R() < .5 ? hedge : dark); s.position.set(sx, GARDEN + 1, sz); s.castShadow = s.receiveShadow = true; O.add(s); k++;
    }
    // the big tree, west of the study's window: its crown only reaches into the glass's edge
    const bark = mat('#6E5844', { r: .9 }), crown = [mat('#7E9E6E', { r: .9 }), mat('#6A8B5E', { r: .9 }), mat('#93AF7E', { r: .9 })], TX = 16;
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(30 + TX, GARDEN - 1, -46), new THREE.Vector3(29 + TX, GARDEN + 12, -45), new THREE.Vector3(26.5 + TX, GARDEN + 26, -44)]), 16, 1.5, 10), bark);
    trunk.castShadow = trunk.receiveShadow = true; O.add(trunk);
    for (const [ex, ey, ez] of [[18 + TX, GARDEN + 36, -43], [33 + TX, GARDEN + 40, -47]]) {
      const limb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(27.5 + TX, GARDEN + 22, -44), new THREE.Vector3((27.5 + TX + ex) / 2, (GARDEN + 22 + ey) / 2 + 2, (ez - 44) / 2), new THREE.Vector3(ex, ey, ez)]), 10, .7, 8), bark);
      limb.castShadow = true; O.add(limb);
    }
    const C = [[24, 44, -44, 10], [14, 40, -42, 8], [32, 46, -48, 9], [20, 52, -46, 8], [10, 48, -44, 6.5], [29, 36, -42, 7], [36, 38, -46, 6], [17, 33, -41, 6]];
    C.forEach(([x, y, z, r], i) => { const m = new THREE.Mesh(lump(r, 7 + i, 16), crown[i % 3]); m.position.set(x + TX, GARDEN + y - 6, z); m.castShadow = m.receiveShadow = true; O.add(m); });
  }

  // ---------- trees: the wood on the north slope (close, full size), clumps on the hills, single trees in
  // the fields; the hillsides' villages ----------
  {
    const trees = ['#7C9A6D', '#6D8C61', '#88A577', '#5F7F57'].map(c => mat(c, { r: .95 }));
    const tall = mat('#4F6B4C', { r: .95 });
    // the north slope: big trees close behind the house, smaller as the slope climbs away
    for (let i = 0; i < (hi ? 70 : 40); i++) {
      const x = -230 + R() * 360, z = 74 + R() * 180, d = z - 74, r = 9 - d * .028 + R() * 3;
      if (beyond(x, z) < 6) continue;
      const t = new THREE.Mesh(lump(r, 500 + i, 10), trees[i % trees.length]); t.position.set(x, groundY(x, z) + r * .75, z); t.castShadow = true; t.receiveShadow = true; O.add(t);
    }
    // the far side: clumps and lines of small trees (forced perspective), and the villages
    const walls = ['#EFE6D6', '#E8D9BF', '#F3EEE4', '#E2CFAE', '#EADFCB'].map(c => mat(c, { r: .9 }));
    const roofs = ['#B5654A', '#C47A55', '#A85C43', '#8E8C90', '#B88A5E'].map(c => mat(c, { r: .85 }));
    const roofGeo = new THREE.CylinderGeometry(0, .72, .5, 4, 1);   // a hipped roof: a pyramid, scaled per house
    // villages: on the hillside across the valley (south), on the lower slopes of the west hills, and
    // in the east valley; each a centre and a spread
    const villages = [[-70, -250, 46], [50, -235, 44], [140, -300, 36], [-20, -330, 40], [-150, -300, 40], [80, -360, 44], [-260, -210, 40], [-300, 40, 36], [170, -170, 30], [190, 40, 26]];
    const far = (x, z) => beyond(x, z) > 60 && !(x > 150 && groundY(x, z) > 20);   // (not on the steep hilltops)
    const n = hi ? 110 : 66;
    for (let i = 0, made = 0; i < n * 3 && made < n; i++) {
      const v = villages[i % villages.length], x = v[0] + (R() - .5) * v[2] * 2, z = v[1] + (R() - .5) * v[2] * 1.1;
      if (!far(x, z)) continue;
      const w = 3.2 + R() * 3, d = 3 + R() * 2.4, h = 2.8 + R() * 2.4, y = groundY(x, z) - .5, ry = R() * Math.PI;
      O.add(at(rbox(w, h, d, .25, walls[i % walls.length], 1), x, y + h / 2, z, { y: ry }));
      const roof = new THREE.Mesh(roofGeo, roofs[(i * 7) % roofs.length]);
      roof.scale.set(w * 1.02, 1.6 + R() * 1.1, d * 1.4); roof.position.set(x, y + h + roof.scale.y * .25, z); roof.rotation.y = ry + Math.PI / 4;
      roof.castShadow = roof.receiveShadow = true; O.add(roof);
      made++;
    }
    for (let i = 0, made = 0; i < 900 && made < (hi ? 190 : 110); i++) {
      const x = -460 + R() * 880, z = -430 + R() * 500;
      if (!far(x, z)) continue;
      // (more of them in the woods' patches and near the villages)
      const y = groundY(x, z), woody = sm((y + 4) / 20) * sm(Math.sin(x * .05 + z * .043) * 1.4 + .3);
      if (R() > .35 + woody * .65) continue;
      if (R() < .2) { const hgt = 6 + R() * 3.5, t = new THREE.Mesh(new THREE.ConeGeometry(1, hgt, 8), tall); t.position.set(x, y + hgt / 2 - .3, z); t.castShadow = true; O.add(t); }
      else { const r = 1.4 + R() * 1.9, t = new THREE.Mesh(lump(r, 300 + i, 8), trees[i % trees.length]); t.position.set(x, y + r * .7, z); t.castShadow = true; t.receiveShadow = true; O.add(t); }
      made++;
    }
  }
  return O;
}
