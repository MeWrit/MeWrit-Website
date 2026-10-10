/* The house's bound volumes (site/docs/redesign-plan.md, 11.12): every spine painted once on a single
   picture (an atlas of designs, 16 by 4), so thousands of books stay one draw each per bookcase and
   still each have a real spine: binders with their label window and finger hole, clinical study
   reports in deep ivory binders with a band and a volume label, journals with their name and logo,
   workbooks with a title band, leather hardbacks with raised gilt bands and a title panel, modern books.
   A book is a box: its spine (the face toward the room) shows its design, its top the pages' edges, its
   other sides its cover's colour. Each instance picks its design (aTile) and a little light or shade
   (aShade). */
import * as THREE from 'three';
import { rng } from './kit.js';

const COLS = 16, ROWS = 4, TW = 64, TH = 256;

// the families, their colours, and how many designs each has in the atlas (tile 0 is plain white: the
// covers sample it, so their colour is the instance's own)
const FAMILIES = {
  binder: { n: 8, cols: ['#1D2C53', '#22325A', '#2B3A5C', '#33456E', '#1A2747', '#22325A', '#E9E2D3', '#2B3A5C'] },
  report: { n: 8, cols: ['#E9E2D3', '#F1ECE1', '#E2DACB', '#EDE6D6', '#E9E2D3', '#F1ECE1', '#22325A', '#E2DACB'] },
  journal: { n: 14, cols: ['#8C3B2E', '#5E7D66', '#3D4E73', '#A88B5E', '#7A8FA8', '#6B4E3A', '#C9D3E3', '#9E5A2C', '#4F6B4C', '#B98B3E', '#7C3B24', '#2F5B6E', '#D8CFB8', '#5A4A6E'] },
  workbook: { n: 10, cols: ['#B4500F', '#D2A24C', '#C8622A', '#E9E2D3', '#D9B866', '#8BA290', '#E07A1F', '#C9D3E3', '#B4500F', '#D2A24C'] },
  hardback: { n: 16, cols: ['#5A2A22', '#22325A', '#2F4A3A', '#7A5636', '#3A2A20', '#6B1E1E', '#1E2A3A', '#8C6A3E', '#4A3A5A', '#2A3A2A', '#5E432B', '#7C3B24', '#13244F', '#3E5A4A', '#6E4A2E', '#2A2A3A'] },
  modern: { n: 7, cols: ['#E9E2D3', '#C9D3E3', '#D9B866', '#8BA290', '#B98B3E', '#F1ECE1', '#7A8FA8'] },
};
// the atlas's tiles: { family, col }, by index
const TILES = [{ family: 'plain', col: '#FFFFFF' }];
for (const [family, f] of Object.entries(FAMILIES)) for (let i = 0; i < f.n; i++) TILES.push({ family, col: f.cols[i % f.cols.length] });
const BY_FAMILY = {};
TILES.forEach((t, i) => { (BY_FAMILY[t.family] = BY_FAMILY[t.family] || []).push(i); });

// a design for each family, drawn in its tile (x, y: the tile's top left on the canvas; the book's top
// is the tile's top)
const shade = (hex, k) => { const v = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(v >> 16 & 255)},${f(v >> 8 & 255)},${f(v & 255)})`; };
function lines(c, x, y, w, n, gap, h, col, r) { c.fillStyle = col; for (let i = 0; i < n; i++) { const lw = w * (.55 + r() * .45); c.fillRect(x + (w - lw) / 2, y + i * gap, lw, h); } }
const DRAW = {
  binder(c, x, y, col, r) {
    const ivory = col === '#E9E2D3', ink = ivory ? '#22325A' : '#F4F1EA';
    c.fillStyle = shade(col, ivory ? .9 : .75); c.fillRect(x, y + 4, TW, 2); c.fillRect(x, y + TH - 6, TW, 2);   // the binder's turned edges
    c.fillStyle = ivory ? '#FFFFFF' : '#F2EFE7'; c.fillRect(x + 9, y + 50 + r() * 14, TW - 18, 62);   // the label window
    const ly = y + 56 + r() * 14;
    c.strokeStyle = shade(col, .6); c.lineWidth = 2; c.strokeRect(x + 9, ly - 6, TW - 18, 62);
    lines(c, x + 14, ly + 6, TW - 28, 4, 11, 3, ivory ? '#3A4252' : '#2E3A5A', r);
    c.fillStyle = ink; c.fillRect(x + 18, y + 204, TW - 36, 14);   // the catalogue label
    c.fillStyle = ivory ? '#9AA3B5' : '#8A93A8'; c.fillRect(x + 22, y + 209, TW - 44, 3);
    // the finger hole, a dark ring
    c.beginPath(); c.arc(x + TW / 2, y + 168, 8, 0, Math.PI * 2); c.fillStyle = '#0D1430'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = ivory ? '#C9C2B2' : '#4E5E88'; c.stroke();
  },
  report(c, x, y, col, r) {
    const navy = col === '#22325A', band = navy ? '#E9E2D3' : (r() < .55 ? '#22325A' : '#B4500F');
    c.fillStyle = band; c.fillRect(x, y, TW, 34);
    c.fillStyle = navy ? '#22325A' : '#F7F3EA'; c.fillRect(x + 16, y + 14, TW - 32, 5);
    c.fillStyle = navy ? '#F4F1EA' : '#FFFFFF'; c.fillRect(x + 8, y + 56, TW - 16, 58);
    c.strokeStyle = navy ? '#C9C2B2' : '#CFC6B3'; c.lineWidth = 1.5; c.strokeRect(x + 8, y + 56, TW - 16, 58);
    lines(c, x + 12, y + 66, TW - 24, 4, 11, 3, '#22325A', r);
    c.fillStyle = band; c.fillRect(x + 18, y + 132, TW - 36, 16);   // the volume's number
    c.fillStyle = navy ? '#22325A' : '#FFFFFF'; c.fillRect(x + 26, y + 138, TW - 52, 4);
    c.fillStyle = band; c.fillRect(x, y + 226, TW, 7);
    c.fillStyle = shade(col, .82); c.fillRect(x, y + TH - 4, TW, 4);
  },
  journal(c, x, y, col, r) {
    const light = parseInt(col.slice(1, 3), 16) > 180, ink = light ? '#2B3A5C' : '#F2ECDF';
    c.fillStyle = shade(col, light ? .82 : 1.25); c.fillRect(x, y, TW, 58);   // the masthead block
    lines(c, x + 10, y + 16, TW - 20, 2, 13, 4, ink, r);
    c.fillStyle = ink; c.fillRect(x, y + 62, TW, 2); c.fillRect(x, y + 194, TW, 2);
    // the issue's title, printed down the spine
    for (let yy = y + 76; yy < y + 182;) { const len = 8 + r() * 26; c.fillRect(x + TW / 2 - 1.5, yy, 3, Math.min(len, y + 182 - yy)); yy += len + 4 + r() * 4; }
    c.fillStyle = ink; c.fillRect(x + 20, y + 208, TW - 40, 22);   // the publisher's mark
    c.fillStyle = col; c.fillRect(x + 25, y + 213, TW - 50, 12);
  },
  workbook(c, x, y, col, r) {
    const light = col === '#E9E2D3' || col === '#C9D3E3';
    c.fillStyle = light ? '#22325A' : '#FBF8F2'; c.fillRect(x, y + 92, TW, 62);   // the title band
    lines(c, x + 10, y + 106, TW - 20, 3, 12, 4, light ? '#F2ECDF' : '#22325A', r);
    c.beginPath(); c.arc(x + TW / 2, y + 196, 6, 0, Math.PI * 2); c.fillStyle = light ? '#B4500F' : '#FBF8F2'; c.fill();
    c.fillStyle = shade(col, .7); c.fillRect(x, y + TH - 20, TW, 20);
    c.fillStyle = shade(col, 1.15); c.fillRect(x, y + 10, TW, 6);
  },
  hardback(c, x, y, col, r) {
    // the leather's grain
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,240,220'},${.04 + r() * .06})`; c.fillRect(x + r() * TW, y + r() * TH, 1 + r() * 2, 1 + r() * 3); }
    const gilt = '#D9B45E', dark = shade(col, .55);
    // raised bands: a ridge with a gilt rule either side
    for (const by of [26, 50, 206, 230]) { c.fillStyle = dark; c.fillRect(x, y + by - 3, TW, 2); c.fillStyle = shade(col, 1.3); c.fillRect(x, y + by - 1, TW, 4); c.fillStyle = gilt; c.fillRect(x, y + by + 3, TW, 2); }
    // the title panel, darker (or a red label), ruled in gilt, its lettering
    const label = r() < .4 ? '#6B1E1E' : r() < .5 ? '#1A1A22' : shade(col, .6);
    c.fillStyle = label; c.fillRect(x + 6, y + 70, TW - 12, 56);
    c.strokeStyle = gilt; c.lineWidth = 1.5; c.strokeRect(x + 8, y + 72, TW - 16, 52);
    lines(c, x + 12, y + 84, TW - 24, 3, 11, 3, gilt, r);
    c.fillStyle = gilt; c.fillRect(x + TW / 2 - 6, y + 158, 12, 3); c.fillRect(x + TW / 2 - 1.5, y + 152, 3, 15);   // a tooled flower
  },
  modern(c, x, y, col, r) {
    const dark = '#22325A';
    c.fillStyle = '#FBF8F2'; c.fillRect(x + 6, y + 36, TW - 12, 70);
    lines(c, x + 12, y + 46, TW - 24, 4, 12, 4, dark, r);
    const band = ['#B4500F', '#22325A', '#5E7D66', '#8C3B2E'][Math.floor(r() * 4)];
    c.fillStyle = band; c.fillRect(x, y + 196, TW, 60);
    c.beginPath(); c.arc(x + TW / 2, y + 226, 7, 0, Math.PI * 2); c.fillStyle = '#FBF8F2'; c.fill();
  },
};

let atlas = null;
function buildAtlas() {
  const cv = document.createElement('canvas'); cv.width = COLS * TW; cv.height = ROWS * TH;
  const c = cv.getContext('2d'), r = rng(131);
  TILES.forEach((t, i) => {
    const col = i % COLS, row = Math.floor(i / COLS), x = col * TW, y = (ROWS - 1 - row) * TH;   // (row 0 at the texture's foot: the canvas is flipped as it is sent)
    c.save(); c.beginPath(); c.rect(x, y, TW, TH); c.clip();
    c.fillStyle = t.col; c.fillRect(x, y, TW, TH);
    if (t.family !== 'plain') {
      DRAW[t.family](c, x, y, t.col, r);
      // the spine's roundness: darker toward both edges
      const g = c.createLinearGradient(x, 0, x + TW, 0);
      g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(.14, 'rgba(0,0,0,.08)'); g.addColorStop(.42, 'rgba(255,255,255,.07)'); g.addColorStop(.8, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,.36)');
      c.fillStyle = g; c.fillRect(x, y, TW, TH);
    }
    c.restore();
  });
  atlas = new THREE.CanvasTexture(cv);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 8;
  return atlas;
}

// a design of a family for one book, and its cover's colour
export function pickSpine(family, r) {
  const list = BY_FAMILY[family] || BY_FAMILY.hardback, i = list[Math.floor(r() * list.length)];
  return { tile: i, col: TILES[i].col };
}

// a book's box: which face is which (aFace: 1 the spine, toward +z; 2 the top; 0 the rest)
export function bookGeometry(count) {
  const g = new THREE.BoxGeometry(1, 1, 1), n = g.attributes.position.count, face = new Float32Array(n), nrm = g.attributes.normal;
  for (let i = 0; i < n; i++) face[i] = nrm.getZ(i) > .5 ? 1 : nrm.getY(i) > .5 ? 2 : 0;
  g.setAttribute('aFace', new THREE.BufferAttribute(face, 1));
  g.setAttribute('aTile', new THREE.InstancedBufferAttribute(new Float32Array(count), 1));
  g.setAttribute('aShade', new THREE.InstancedBufferAttribute(new Float32Array(count).fill(1), 1));
  return g;
}

// the books' material: the standard one, its spine from the atlas, its top the pages, its sides the
// instance's colour
let material = null;
export function bookMaterial() {
  if (material) return material;
  material = new THREE.MeshStandardMaterial({ color: '#ffffff', map: atlas || buildAtlas(), roughness: .78 });
  material.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aFace;\nattribute float aTile;\nattribute float aShade;\nvarying float vFace;\nvarying float vShade;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
  vFace = aFace; vShade = aShade;
  #ifdef USE_MAP
  vMapUv = aFace > .5 && aFace < 1.5 ? (vec2(mod(aTile, ${COLS}.), floor(aTile / ${COLS}.)) + uv) / vec2(${COLS}., ${ROWS}.) : vec2(.5 / ${COLS}., .5 / ${ROWS}.);
  #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFace;\nvarying float vShade;')
      .replace('#include <color_fragment>', `#if defined( USE_COLOR )
  if ( vFace < .5 || vFace > 1.5 ) diffuseColor.rgb *= vColor.rgb;
  #endif
  if ( vFace > .5 && vFace < 1.5 ) diffuseColor.rgb *= vShade;
  if ( vFace > 1.5 ) diffuseColor.rgb = vec3( .86, .81, .71 ) * vShade;`);
  };
  material.customProgramCacheKey = () => 'house-books-1';
  return material;
}
