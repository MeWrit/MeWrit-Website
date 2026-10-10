/* The house's kit: the shapes and surfaces its rooms are built from (study.js, and the library hall
   to come), in the illustrated look's palette (site/docs/redesign-plan.md, section 11.4). Softened
   boxes (every edge catches a little light, so nothing reads as a raw polygon), turned profiles, tubes,
   instanced bindings; and the surfaces drawn on canvases: plaster, oak, the floor's boards, paper,
   the spines of books. Everything casts and takes shadow. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PAL = {
  wall: '#EDE6D8', trim: '#F7F2E8', paper: '#FBF8F2', ivory: '#F3EEE3', cream: '#EFE6D4',
  oak: '#C59E74', oakDark: '#9E7A55', floor: '#8E6F52', navy: '#1D2C53', ink: '#13244F', steel: '#C3C8D0', graphite: '#3A4252',
  white: '#F7F4EE', orange: '#C8622A', gold: '#D2A24C', mustard: '#D9B866', sage: '#8BA290', leaf: '#5E7D66', leafLight: '#97B59A',
  blue: '#B9C7DE', rose: '#D9B4A6', coffee: '#5B3D2A', glass: '#DCE6F0',
};

export const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---------- materials ----------
const mats = new Map();
export function mat(color, o = {}) {
  const key = JSON.stringify([color, o.r, o.m, o.map && o.map.uuid, o.emissive, o.ek, o.side, o.opacity, o.flat]);
  if (!o.fresh && mats.has(key)) return mats.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? .84, metalness: o.m ?? 0, map: o.map || null,
    emissive: o.emissive || '#000000', emissiveIntensity: o.ek ?? 1,
    side: o.side ?? THREE.FrontSide, flatShading: !!o.flat,
    transparent: o.opacity !== undefined, opacity: o.opacity ?? 1, depthWrite: o.opacity === undefined || o.opacity > .9,
  });
  if (!o.fresh) mats.set(key, m);
  return m;
}

// ---------- shapes ----------
export function shadows(obj, cast = true, take = true) { obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = take; } }); return obj; }
export function at(obj, x, y, z, r = {}) { obj.position.set(x, y, z); if (r.y) obj.rotation.y = r.y; if (r.x) obj.rotation.x = r.x; if (r.z) obj.rotation.z = r.z; return obj; }
// a box with softened edges (w, h, d; the edge's radius; seg, the rounding's steps: two read as round
// at any distance the camera comes to)
export function rbox(w, h, d, radius, material, seg = 2) {
  const r = Math.max(.001, Math.min(radius, w / 2 - .001, h / 2 - .001, d / 2 - .001));
  return shadows(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), material));
}
export const box = (w, h, d, material) => shadows(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
// a turned shape: a profile of [radius, height] points, turned about the vertical
export function lathe(profile, material, segs = 48) {
  return shadows(new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs), material));
}
export function cyl(rTop, rBottom, h, material, segs = 32) { return shadows(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segs), material)); }
// a tube along points (smoothed), of a radius
export function tube(points, radius, material, segs = 64, radial = 12) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return shadows(new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, radial, false), material));
}
export const group = (...kids) => { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; };
// a flat panel facing +z (for paper, screens, labels)
export function panel(w, h, material) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); m.receiveShadow = true; return m; }

// ---------- surfaces, drawn on canvases ----------
export function canvasTex(w, h, draw, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// plaster: the wall's colour with the faintest unevenness (broad soft clouds, so no pattern shows,
// and a fine tooth)
export const plasterTex = (base, seed = 3) => canvasTex(512, 512, (c, w, h) => {
  const r = rng(seed); c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    const x = r() * w, y = r() * h, s = 40 + r() * 120, a = .01 + r() * .012, g = c.createRadialGradient(x, y, 0, x, y, s);
    const tint = r() < .5 ? '255,255,255' : '120,100,70';
    g.addColorStop(0, `rgba(${tint},${a})`); g.addColorStop(1, `rgba(${tint},0)`);
    c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2);
  }
}, { repeat: [3, 2] });
// oak: long grain in bands, a little figure, the colour varying along it
export const oakTex = (base, dark, seed = 5, repeat = [1, 1]) => canvasTex(1024, 512, (c, w, h) => {
  const r = rng(seed); c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const y0 = r() * h, amp = 2 + r() * 7, f = .002 + r() * .006, ph = r() * 6, a = .05 + r() * .12;
    c.strokeStyle = r() < .7 ? `rgba(${hexRgb(dark)},${a})` : `rgba(255,240,215,${a * .8})`; c.lineWidth = .6 + r() * 1.8;
    c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * .25; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }
  for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${hexRgb(dark)},${.03 + r() * .05})`; c.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }
}, { repeat });
// boards: planks with their joints, each plank's tone a little different
export const boardsTex = (base, dark, seed = 7) => canvasTex(1024, 1024, (c, w, h) => {
  const r = rng(seed), rows = 8;
  for (let i = 0; i < rows; i++) {
    const y = i * h / rows, t = .9 + r() * .2;
    c.fillStyle = shade(base, t); c.fillRect(0, y, w, h / rows);
    for (let k = 0; k < 26; k++) { const yy = y + r() * h / rows; c.strokeStyle = `rgba(${hexRgb(dark)},${.06 + r() * .1})`; c.lineWidth = .8 + r(); c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(w * .3, yy + (r() - .5) * 6, w * .7, yy + (r() - .5) * 6, w, yy + (r() - .5) * 4); c.stroke(); }
    c.fillStyle = `rgba(${hexRgb(dark)},.55)`; c.fillRect(0, y, w, 2);
    const cut = r() * w; c.fillRect(cut, y, 2, h / rows);
  }
}, { repeat: [3, 3] });
// paper with a faint tooth
export const paperTex = (draw, w = 1024, h = 1448, base = PAL.paper) => canvasTex(w, h, (c, W, H) => {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  const r = rng(11); for (let i = 0; i < W * H / 260; i++) { c.fillStyle = `rgba(120,100,70,${.015 + r() * .025})`; c.fillRect(r() * W, r() * H, 1, 1); }
  if (draw) draw(c, W, H);
});
// lines of type as a page shows them from a little way off: words as rounded bars
export function typeLines(c, x, y, len, h, n, gap, color, r = rng(23), short = 5) {
  for (let i = 0; i < n; i++) {
    let px = x; const end = x + len * (i % short === short - 1 ? .55 : 1);
    while (px < end - 4) { const ww = Math.min(h * (2 + r() * 6), end - px); c.fillStyle = color; roundRect(c, px, y + i * gap - h / 2, ww, h, h / 2); c.fill(); px += ww + h * 1.1; }
  }
}
export function roundRect(c, x, y, w, h, rad) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, rad); else c.rect(x, y, w, h); }

// colour helpers
export function hexRgb(hex) { const v = parseInt(hex.slice(1), 16); return `${v >> 16 & 255},${v >> 8 & 255},${v & 255}`; }
export function shade(hex, k) { const v = parseInt(hex.slice(1), 16), f = x => Math.max(0, Math.min(255, Math.round(x * k))); return `rgb(${f(v >> 16 & 255)},${f(v >> 8 & 255)},${f(v & 255)})`; }

// ---------- contact: the soft shade where a thing meets its surface ----------
// a dark round fading to nothing, laid a hair above the surface under an object (w by d, at x, z, on
// the surface at y), so everything sits down even where the occlusion is not drawn (the low tier)
let blob = null;
const blobMats = new Map();
export function contact(w, d, x, z, { y = 0, k = .34, ry = 0, color = '#2E2216' } = {}) {
  // (an alpha map is read from the green channel: white at the heart to black at the rim, opaque)
  if (!blob) blob = canvasTex(128, 128, (c, W, H) => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, '#fff'); g.addColorStop(.45, '#8c8c8c'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H); }, { srgb: false, aniso: 1 });
  const key = `${color}|${k}`;
  if (!blobMats.has(key)) blobMats.set(key, new THREE.MeshBasicMaterial({ color, alphaMap: blob, transparent: true, opacity: k, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blobMats.get(key));
  m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y + .003, z);
  m.userData.noG = true; m.renderOrder = 1;
  return m;
}

// ---------- baking: the static meshes merged by material, so a room is a few dozen draws ----------
// Meshes under an object marked userData.keep (things the film moves), instanced and multi-material
// meshes stay as they are. Call before the first frame (the parts were never sent to the GPU).
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m4 = new THREE.Matrix4();
  const bins = new Map(), gone = [];
  const kept = o => { for (let p = o; p && p !== root; p = p.parent) if (p.userData.keep) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || kept(o)) return;
    const g = o.geometry.clone();
    // (a material coloured by its vertices keeps its colours: the ground outside is painted so)
    const vc = !!o.material.vertexColors, keep = vc ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv'];
    for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (vc && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    g.morphAttributes = {}; g.clearGroups();
    g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    const key = `${o.material.uuid}|${+o.castShadow}${+o.receiveShadow}|${o.renderOrder}|${+!!o.userData.noG}|${g.index ? 'i' : 'n'}`;
    if (!bins.has(key)) bins.set(key, { o, geos: [] });
    bins.get(key).geos.push(g);
    gone.push(o);
  });
  gone.forEach(o => o.parent.remove(o));
  let n = 0;
  for (const { o, geos } of bins.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (geos.length > 1) geos.forEach(g => g.dispose());
    const m = new THREE.Mesh(merged, o.material);
    m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; m.renderOrder = o.renderOrder; m.userData.noG = o.userData.noG;
    root.add(m); n++;
  }
  return { meshes: gone.length, draws: n };
}

// ---------- books ----------
// a binding's spine: its colour, two bands, a label; drawn once per look and shared
const spineCache = new Map();
export function spineTex(col, band, label = true) {
  const key = col + band + label;
  if (spineCache.has(key)) return spineCache.get(key);
  const t = canvasTex(64, 256, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,.14)'); g.addColorStop(.25, 'rgba(255,255,255,.08)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = band; c.fillRect(0, h * .08, w, h * .035); c.fillRect(0, h * .87, w, h * .035);
    if (label) { c.fillStyle = 'rgba(250,246,236,.92)'; roundRect(c, w * .18, h * .3, w * .64, h * .16, 3); c.fill(); c.fillStyle = 'rgba(30,40,70,.5)'; c.fillRect(w * .28, h * .35, w * .44, 3); c.fillRect(w * .28, h * .4, w * .3, 3); }
  }, { aniso: 4 });
  spineCache.set(key, t);
  return t;
}
// many bindings on shelves, as one instanced draw: rows of { x0, x1, y, z, depth, hMin, hMax } (a
// shelf's run along x at height y, its front at z), the colours to pick from
export function shelfBooks(rows, colours, seed = 9, o = {}) {
  const r = rng(seed), items = [];
  rows.forEach(row => {
    for (let x = row.x0; x < row.x1;) {
      if (r() < .05) { x += .15 + r() * .4; continue; }
      const w = row.wMin + r() * (row.wMax - row.wMin), hgt = row.hMin + r() * (row.hMax - row.hMin), lean = r() < .04 ? (r() - .5) * .25 : 0;
      if (x + w > row.x1) break;
      items.push({ x: x + w / 2, y: row.y + hgt / 2, z: row.z - row.depth / 2, w, h: hgt, d: row.depth * (.85 + r() * .15), lean, col: colours[Math.floor(r() * colours.length)] });
      x += w + .01;
    }
  });
  // (far shelves take a plain box: twelve triangles a book instead of three hundred, and at their
  // distance the softened edge was never seen)
  const geo = o.plain ? new THREE.BoxGeometry(1, 1, 1) : new RoundedBoxGeometry(1, 1, 1, 1, .06);
  const mesh = new THREE.InstancedMesh(geo, mat('#ffffff', { r: .78 }), items.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
  items.forEach((b, i) => {
    e.set(0, 0, b.lean); q.setFromEuler(e); s.set(b.w, b.h, b.d); p.set(b.x, b.y, b.z);
    mesh.setMatrixAt(i, m4.compose(p, q, s)); mesh.setColorAt(i, cc.set(b.col));
  });
  mesh.castShadow = o.cast ?? true; mesh.receiveShadow = true;
  return mesh;
}
