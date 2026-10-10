/* What the house's windows look out on (site/docs/redesign-plan.md, section 11.4: one sky for the
   whole house, seen through every window): a garden below the study's window with a hedge and a tree
   close by, a lane, and across the valley a hillside of fields and houses rising to a ridge, a farther
   ridge behind it. The far things are a model in forced perspective (a house about a tenth of its
   size, a few hundred units off), so they sit inside the sky's dome and still move as far things do
   when the camera moves; the haze of the distance (stage.js's fog, the sky's horizon colour) softens
   them. Everything here is static and merged with the house (kit.js, bake). */
import * as THREE from 'three';
import { mat, rbox, at, rng } from './kit.js';

const GARDEN = -20;   // the garden's level (the study's floor is at -7.5: the house stands on a plinth)
// the ground: the garden, the lane, then the hillside rising from z = -100 to its ridge
export function groundY(x, z) {
  const d = Math.max(0, -z - 100);
  const hill = d * .12 - Math.max(0, d - 170) * .2 + Math.sin(x * .021 + 1.3) * 5 * Math.min(1, d / 60) + Math.sin(x * .053 + z * .02) * 2 * Math.min(1, d / 40);
  const lane = -z > 84 && -z < 96 ? -.4 : 0;
  return GARDEN + hill + lane;
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

export function buildOutside({ hi = true } = {}) {
  const O = new THREE.Group(), R = rng(61);

  // ---------- the ground: one sheet, its colour by place (lawn, lane, fields in strips) ----------
  {
    const g = new THREE.PlaneGeometry(640, 330, hi ? 72 : 48, hi ? 38 : 26);
    g.rotateX(-Math.PI / 2); g.translate(20, 0, -158);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const fields = ['#A9B98C', '#BFC497', '#98AB82', '#B8AE84', '#A3B58E', '#C9C49B'];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, groundY(x, z));
      if (-z < 84) c.set('#9CB287');
      else if (-z < 96) c.set('#CDBF9F');
      else { const k = Math.floor((x + 400) / 46 + Math.sin(z * .03) * .8) + Math.floor(-z / 38) * 3; c.set(fields[((k % fields.length) + fields.length) % fields.length]); }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    ground.receiveShadow = true;
    O.add(ground);
  }

  // ---------- the farther ridge, blue in the haze ----------
  {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const x = -260 + i * 14; pts.push(new THREE.Vector2(x, 7 + Math.sin(x * .017 + .6) * 9 + Math.sin(x * .049) * 4)); }
    const s = new THREE.Shape([new THREE.Vector2(-260, -40), ...pts, new THREE.Vector2(300, -40)]);
    const ridge = new THREE.Mesh(new THREE.ShapeGeometry(s, 4), mat('#9FAFC4', { r: 1 }));
    ridge.position.z = -292;
    O.add(ridge);
  }

  // ---------- the hedge along the garden's end, shrubs, the tree close by ----------
  {
    const hedge = mat('#6F8F67', { r: .95 }), dark = mat('#5C7C58', { r: .95 });
    for (let x = -60; x < 90; x += 15) O.add(at(rbox(15.4, 4 + R() * 1.2, 4, 1.6, R() < .5 ? hedge : dark), x, GARDEN + 2.2, -78));
    for (let i = 0; i < 6; i++) { const sx = -40 + R() * 110, sz = -36 - R() * 34, s = new THREE.Mesh(lump(1.2 + R() * 1.2, 100 + i, 12), R() < .5 ? hedge : dark); s.position.set(sx, GARDEN + 1, sz); s.castShadow = s.receiveShadow = true; O.add(s); }
    // the tree, off to the right of the window: its crown only reaches into the glass's edge
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

  // ---------- the hillside's houses and trees, in clusters along the slope ----------
  {
    const walls = ['#EFE6D6', '#E8D9BF', '#F3EEE4', '#E2CFAE', '#EADFCB'].map(c => mat(c, { r: .9 }));
    const roofs = ['#B5654A', '#C47A55', '#A85C43', '#8E8C90', '#B88A5E'].map(c => mat(c, { r: .85 }));
    const trees = ['#7C9A6D', '#6D8C61', '#88A577', '#5F7F57'].map(c => mat(c, { r: .95 }));
    const tall = mat('#4F6B4C', { r: .95 });
    const roofGeo = new THREE.CylinderGeometry(0, .72, .5, 4, 1);   // a hipped roof: a pyramid, scaled per house
    const villages = [[-70, -165, 50], [40, -150, 46], [120, -205, 40], [-20, -230, 44], [-130, -220, 40], [70, -262, 50], [180, -170, 36]];
    const n = hi ? 90 : 55;
    for (let i = 0; i < n; i++) {
      const v = villages[i % villages.length], x = v[0] + (R() - .5) * v[2] * 2, z = v[1] + (R() - .5) * v[2] * .9;
      if (-z < 125) continue;
      const w = 3.2 + R() * 3, d = 3 + R() * 2.4, h = 2.8 + R() * 2.4, y = groundY(x, z) - .5, ry = (R() - .5) * .5;
      O.add(at(rbox(w, h, d, .25, walls[i % walls.length], 1), x, y + h / 2, z, { y: ry }));
      const roof = new THREE.Mesh(roofGeo, roofs[(i * 7) % roofs.length]);
      roof.scale.set(w * 1.02, 1.6 + R() * 1.1, d * 1.4); roof.position.set(x, y + h + roof.scale.y * .25, z); roof.rotation.y = ry + Math.PI / 4;
      roof.castShadow = roof.receiveShadow = true; O.add(roof);
    }
    for (let i = 0; i < (hi ? 130 : 80); i++) {
      const v = villages[i % villages.length], x = v[0] + (R() - .5) * v[2] * 3, z = v[1] + (R() - .5) * v[2] * 1.4;
      if (-z < 118) continue;
      if (R() < .22) { const hgt = 6 + R() * 3.5, t = new THREE.Mesh(new THREE.ConeGeometry(1, hgt, 8), tall); t.position.set(x, groundY(x, z) + hgt / 2 - .3, z); t.castShadow = true; O.add(t); }
      else { const r = 1.3 + R() * 1.7, t = new THREE.Mesh(lump(r, 300 + i, 8), trees[i % trees.length]); t.position.set(x, groundY(x, z) + r * .7, z); t.castShadow = true; t.receiveShadow = true; O.add(t); }
    }
    // a line of trees along the lane
    for (let x = -90; x < 130; x += 8 + R() * 6) { const r = 1.8 + R() * 1, t = new THREE.Mesh(lump(r, 900 + Math.round(x), 10), trees[Math.floor(R() * trees.length)]); t.position.set(x, GARDEN + 2.4 + r * .6, -100 - R() * 4); t.castShadow = true; O.add(t); }
  }

  // ---------- a few clouds, high and far: soft puffs drawn once, unlit, left out of the ink ----------
  {
    const cloud = seed => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256;
      const x = c.getContext('2d'), r = rng(seed);
      for (let i = 0; i < 26; i++) {
        const px = 70 + r() * 372, py = 150 - Math.sin((px - 70) / 372 * Math.PI) * (40 + r() * 50) + r() * 30, s = 34 + r() * 46;
        const g = x.createRadialGradient(px, py, 0, px, py, s);
        g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.6, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(px - s, py - s, s * 2, s * 2);
      }
      const shadeG = x.createLinearGradient(0, 120, 0, 230); shadeG.addColorStop(0, 'rgba(150,160,190,0)'); shadeG.addColorStop(1, 'rgba(150,160,190,.35)');
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = shadeG; x.fillRect(0, 0, 512, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    [[-60, 52, -286, 70, 3], [70, 70, -288, 90, 8], [170, 44, -284, 60, 13], [10, 96, -290, 80, 21], [-150, 80, -286, 66, 34]].forEach(([x, y, z, w, s]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: cloud(s), transparent: true, depthWrite: false, fog: false, opacity: .92 }));
      m.position.set(x, y, z); m.userData.noG = true; m.renderOrder = -1;
      O.add(m);
    });
  }
  return O;
}
