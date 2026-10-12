/* Paper in the house (site/docs/redesign-plan.md, 11.15): words printed or written on a sheet are part of
   the sheet, a canvas texture lit with the room, never words laid over it, so they go wherever the sheet
   goes and nothing appears from thin air. A sheet is drawn by its own function from a state (how much
   has been written on it so far), drawn again only when that state changes, and once more when the
   house's fonts have all come. Handwriting is revealed as the pen moves along it (written), and the pen's
   nib follows the reveal (inkAt). */
import * as THREE from 'three';

// (laid out in w by h px, drawn at scale times that, so its print stays sharp on the screen)
export function sheet(w, h, draw, { aniso = 8, scale = 1 } = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
  const c = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
  let key = null, state = null;
  const paint = (s = state, force = false) => {
    const k = JSON.stringify(s);
    if (!force && k === key) return false;
    key = k; state = s;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(scale, 0, 0, scale, 0, 0);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    draw(c, w, h, s); tex.needsUpdate = true;
    return true;
  };
  paint(null, true);
  if (document.fonts) document.fonts.ready.then(() => paint(state, true));
  return { tex, paint, w, h, ctx: c };
}

// a font set on the canvas, its letters spaced (where the canvas can)
export function font(c, f, spacing = 0) { c.font = f; if ('letterSpacing' in c) c.letterSpacing = spacing + 'px'; }

// a run of words wrapped to a width, as the canvas measures them
export function wrap(c, text, maxW) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (line && c.measureText(t).width > maxW) { lines.push(line); line = word; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

// a handwritten line: its parts ({ t, col, strike }) drawn from x on the baseline y, shown as far as the
// pen has reached (reveal, px along it); returns its whole width
export function written(c, parts, x, y, reveal = Infinity) {
  let w = 0;
  for (const p of parts) w += c.measureText(p.t).width;
  if (reveal <= 0) return w;
  c.save();
  if (reveal < w) { c.beginPath(); c.rect(x - 4, y - 200, reveal + 4, 260); c.clip(); }
  let at = x;
  for (const p of parts) {
    const pw = c.measureText(p.t).width;
    c.fillStyle = p.col; c.fillText(p.t, at, y);
    if (p.strike) { c.strokeStyle = p.col; c.lineWidth = Math.max(2, parseFloat(c.font.match(/(\d+)px/)[1]) * .06); c.beginPath(); c.moveTo(at - 2, y - parseFloat(c.font.match(/(\d+)px/)[1]) * .3); c.lineTo(at + pw + 2, y - parseFloat(c.font.match(/(\d+)px/)[1]) * .34); c.stroke(); }
    at += pw;
  }
  c.restore();
  return w;
}

// where the pen is along lines written one after another ({ x, y, w }: start, baseline, width), at p (0 to
// 1) of the writing: how far each line is revealed, the nib's point on the sheet (px) and how far it is
// lifted (moving from the end of one line to the start of the next)
export function inkAt(lines, p, gap = 90) {
  const total = lines.reduce((a, l) => a + l.w, 0) + gap * (lines.length - 1);
  let d = Math.max(0, Math.min(1, p)) * total;
  const reveal = lines.map(() => 0);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (d <= l.w) { reveal[i] = d; return { reveal, u: l.x + d, v: l.y - 14, lift: 0 }; }
    reveal[i] = l.w; d -= l.w;
    if (i + 1 < lines.length) {
      if (d <= gap) { const t = d / gap, n = lines[i + 1]; return { reveal, u: l.x + l.w + (n.x - l.x - l.w) * t, v: l.y - 14 + (n.y - l.y) * t, lift: Math.sin(Math.PI * t) }; }
      d -= gap;
    }
  }
  const l = lines[lines.length - 1];
  return { reveal, u: l.x + l.w, v: l.y - 14, lift: 0 };
}

// a point on a sheet's canvas (u, v px) as a point in the sheet's own plane (+x to the reader's right, +y
// up the sheet), the plane w by h units
export const onSheet = (u, v, cw, ch, w, h, lift = .004) => new THREE.Vector3((u / cw - .5) * w, (.5 - v / ch) * h, lift);
