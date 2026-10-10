/* Liquid glass for the floating capsule, its panels and its phone card (styles: the liquid glass
   section of src/styles/nav-variants.css). The frosted look is plain CSS and works in every
   browser. Chromium browsers can also run an SVG filter on what is behind an element
   (backdrop-filter: url()), and here that filter bends the backdrop near the glass's rim like
   the edge of a thick lens: a displacement map, drawn for the element's own size and corner
   radius, shifts each point near the rim outward, so the page just outside shows bent into the
   edge while the middle stays clear. It runs on computers only. Phones and tablets, Safari and
   Firefox keep the frosted glass without the bending, as does anyone who has asked for reduced
   transparency (and ?glass=flat, to compare). With a mouse, the desktop capsule also catches the
   light where the pointer is. */
import { $ } from './shared.js';

const root = document.documentElement;
const NS = 'http://www.w3.org/2000/svg';
const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
// computers only: on phones and tablets the filter costs smooth scrolling (measured), so they keep
// the frosted glass without the bending
const BEND = brands.some(b => b.brand === 'Chromium') && !/[?&]glass=flat\b/.test(location.search)
  && matchMedia('(hover: hover) and (pointer: fine)').matches
  && !matchMedia('(prefers-reduced-transparency: reduce)').matches;
const WIDE = matchMedia('(min-width: 900px)');

// the map: red and green carry the shift in x and y (128 is none). A point within `rim` px of the
// edge shifts outward along the edge's normal, most at the edge itself and easing to nothing
// inside it. Only the rim is worked out; everything else is "no shift".
function drawMap(w, h, radius, rim) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  new Uint32Array(d.buffer).fill(0xFF808080);   // r = g = b = 128, opaque
  const r = Math.min(radius, w / 2, h / 2), hx = w / 2 - r, hy = h / 2 - r;
  for (let y = 0; y < h; y++) {
    const py = y + .5 - h / 2, qy = Math.abs(py) - hy;
    const band = y < r + rim || y >= h - r - rim;   // near the top or bottom: the whole row
    for (let x = 0; x < w; x++) {
      if (!band && x === rim) x = Math.max(rim, w - rim);   // in between: the two sides only
      const px = x + .5 - w / 2, qx = Math.abs(px) - hx;
      let nx = 0, ny = 0, dist;   // how far inside the edge, and the edge's outward normal
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); dist = r - l; nx = Math.sign(px) * qx / l; ny = Math.sign(py) * qy / l; }
      else if (qx > qy) { dist = r - qx; nx = Math.sign(px); }
      else { dist = r - qy; ny = Math.sign(py); }
      if (dist >= rim) continue;
      const k = (1 - Math.max(0, dist) / rim) ** 2, i = (y * w + x) * 4;
      d[i] = 128 + 127 * nx * k; d[i + 1] = 128 + 127 * ny * k;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

let defs = null, count = 0;
const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
// give `el` a bending filter in the custom property `prop`. The filter follows the element's size
// at once (the map stretched) and the map is redrawn once the size has settled.
function bend(el, prop, shape, active, firstDelay = 0) {
  if (!BEND || !el) return;
  if (!defs) {
    const svg = set(document.createElementNS(NS, 'svg'), { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' });
    defs = document.createElementNS(NS, 'defs'); svg.append(defs); document.body.append(svg);
  }
  const id = 'glass-' + ++count, PAD = 24;   // the filter reaches a little past the edge, for the shift
  const filter = set(document.createElementNS(NS, 'filter'), { id, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  const map = set(document.createElementNS(NS, 'feImage'), { x: 0, y: 0, preserveAspectRatio: 'none', result: 'map' });
  const shift = set(document.createElementNS(NS, 'feDisplacementMap'), { in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G' });
  filter.append(map, shift); defs.append(filter);
  let w = 0, h = 0, drawn = '', timer = 0, url = '';
  function redraw() {
    if (!w || !h || !active()) return;
    const key = w + 'x' + h;
    if (key === drawn) return;
    drawn = key;
    const { radius, rim, depth } = shape(w, h);
    drawMap(w, h, radius, rim).toBlob(blob => {
      if (!blob || key !== drawn) return;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      map.setAttribute('href', url);
      shift.setAttribute('scale', depth * 2);
      el.style.setProperty(prop, `url(#${id})`);
    });
  }
  new ResizeObserver(([e]) => {
    const b = e.borderBoxSize && e.borderBoxSize[0];
    const W = Math.round(b ? b.inlineSize : el.offsetWidth), H = Math.round(b ? b.blockSize : el.offsetHeight);
    if (!W || !H) return;
    const first = !drawn;
    w = W; h = H;
    set(filter, { x: -PAD, y: -PAD, width: W + 2 * PAD, height: H + 2 * PAD });
    set(map, { width: W, height: H });
    clearTimeout(timer); timer = setTimeout(redraw, first ? firstDelay : 160);
  }).observe(el);
}

// a dark page has no capsule (its header is a plain row: src/styles/theme-dark.css), so nothing to bend
const capsuleOn = () => root.dataset.theme !== 'dark' && (WIDE.matches ? root.dataset.nav === 'capsule' : root.dataset.phone === 'capsule');
const capsule = document.querySelector('.site-header .wrap');
// the capsule: a pill (its ends are half circles), its rim and bend in proportion to its height
bend(capsule, '--lg-cap', (w, h) => ({ radius: h / 2, rim: Math.round(h * .3), depth: Math.round(h * .2) }), capsuleOn);
document.querySelectorAll('.nav-desktop .dd').forEach(dd =>
  bend(dd, '--lg-dd', () => ({ radius: 26, rim: 18, depth: 10 }), () => WIDE.matches && root.dataset.nav === 'capsule'));
// the phone card: drawn a moment after it opens, so it never holds up the opening
bend($('capMenu'), '--lg-card', () => ({ radius: 28, rim: 20, depth: 10 }), () => !WIDE.matches, 320);

// the desktop capsule catches the light where the pointer is
if (capsule && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let raf = 0, x = 0, y = 0;
  capsule.addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const r = capsule.getBoundingClientRect();
      capsule.style.setProperty('--mx', Math.round(x - r.left) + 'px');
      capsule.style.setProperty('--my', Math.round(y - r.top) + 'px');
    });
  });
  capsule.addEventListener('pointerenter', () => capsule.style.setProperty('--sheen', '1'));
  capsule.addEventListener('pointerleave', () => capsule.style.setProperty('--sheen', '0'));
}

// review and test hook: is the bending on?
window.mewritGlass = { bending: BEND };
