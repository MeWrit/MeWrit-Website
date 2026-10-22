/* The film's dust on the inner pages' cream (the user, 2026-10-22: the particles "throughout", tastefully):
   a faint speckle of motes in navy ink, a few in the logo's orange, drifting slowly up behind the page, as
   the film's own dust does by day ("a light speckle only": bright dust would read as dirt on paper). A
   canvas fixed behind the page's content (band.css), drawn in 2D: a few dozen to a couple of hundred dots,
   by the size of the screen. It stops while the tab is hidden; with reduced motion it is drawn once, still. */
import { REDUCE, STATIC } from './shared.js';

const cv = document.createElement('canvas');
cv.className = 'dust';
cv.setAttribute('aria-hidden', 'true');
document.body.prepend(cv);
const ctx = cv.getContext('2d');
const still = REDUCE || STATIC;
let W = 0, H = 0, motes = [], raf = 0, last = 0, t = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
function mote(y) {
  const warm = Math.random() < .08;
  return { x: rnd(0, W), y: y ?? rnd(0, H), r: rnd(.6, 1.7), a: warm ? rnd(.1, .22) : rnd(.07, .2), vy: rnd(5, 15), vx: rnd(-1.5, 1.5), ph: rnd(0, 6.28), w: rnd(.3, .9), warm };
}
function size() {
  const px = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * px); cv.height = Math.round(H * px);
  ctx.setTransform(px, 0, 0, px, 0, 0);
  const n = Math.round(Math.min(220, Math.max(30, W * H / 7000)));
  while (motes.length < n) motes.push(mote());
  motes.length = n;
  motes.forEach(m => { if (m.x > W) m.x = rnd(0, W); if (m.y > H) m.y = rnd(0, H); });
  if (still) draw();
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  for (const m of motes) {
    const a = m.a * (still ? 1 : .72 + .28 * Math.sin(t * m.w + m.ph));
    ctx.fillStyle = m.warm ? `rgba(224,122,31,${a.toFixed(3)})` : `rgba(28,52,114,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
  }
}
function frame(now) {
  raf = 0;
  if (document.hidden) return;
  const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
  last = now; t += dt;
  for (const m of motes) {
    m.y -= m.vy * dt; m.x += m.vx * dt;
    if (m.y < -4) Object.assign(m, mote(H + 4));
    if (m.x < -4) m.x = W + 4; else if (m.x > W + 4) m.x = -4;
  }
  draw();
  raf = requestAnimationFrame(frame);
}
const wake = () => { if (!still && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
addEventListener('resize', size);
document.addEventListener('visibilitychange', wake);
size();
wake();
