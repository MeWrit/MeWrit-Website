/* The logo draws itself, for any LogoDraw on a page (src/components/LogoDraw.astro): version B's
   drawing (header-logo.js), made to play wherever the logo is. The pen pops in at its place on the
   right, lifts and glides to the start of the line, touches down and writes the heartbeat line from
   left to right (the ink is the logo's own line pixels: pen-ink.js), docks back into the logo, and the
   three labels appear one after another; then the real logo image takes over again.
   play() from the start (the logo's layers already showing its base: a loader's first paint), or
   play({ replay: true }), when the real logo first hands over to the layers. The pen's size follows
   the logo's own box (its layout size, so a logo inside a scaled or tilted card draws in place). */
import D from '../data/intro.json';
import { clamp, easeOut, easeInOutCubic, easeInOutSine } from './shared.js';
import { penPath, createInk } from './pen-ink.js';

// the timeline in ms (as version B's), and a replay's handover before 0
export const LOGO_T = { pop: 420, liftStart: 560, travelEnd: 1320, drawStart: 1480, drawEnd: 3280, dockEnd: 3640, labelsStart: 3600, labelStep: 150, labelDur: 460, crossStart: 4320, end: 4540 };
const T = LOGO_T, PRE = 240;
const LW = D.logo[0], P = penPath(D), { pts, L, WT, atWeight } = P;
const [bx, by, bw] = D.penBox, nibOff = [D.nib[0] - bx, D.nib[1] - by];
const start = pts[0], dock = D.nib, endPt = pts[pts.length - 1], drift = [dock[0] - endPt[0], dock[1] - endPt[1]];
const LIFT = 1.08;
const mix = (a, b, u) => a + (b - a) * u;
const easeOutBack = p => 1 + 2.5 * Math.pow(p - 1, 3) + 1.5 * Math.pow(p - 1, 2);
const nibAt = t => atWeight(easeInOutSine(clamp((t - T.drawStart) / (T.drawEnd - T.drawStart))) * WT);

// where the nib is (logo pixels), how the pen is posed and how much it is lifted (write: the pen's lean
// and size while it travels and writes; version B's header leans it so it stays inside the screen)
function penState(t, write) {
  if (t < T.liftStart) {
    const u = clamp(t / T.pop);
    return { x: dock[0], y: dock[1], rot: 6 * (1 - easeOut(u)), scale: .5 + .5 * easeOutBack(u), op: clamp(t / 160), s: -1 };
  }
  if (t < T.drawStart) {
    const u = easeInOutCubic(clamp((t - T.liftStart) / (T.travelEnd - T.liftStart)));
    const cx = (dock[0] + start[0]) / 2, cy = Math.min(dock[1], start[1]) - 34;
    const x = (1 - u) * (1 - u) * dock[0] + 2 * (1 - u) * u * cx + u * u * start[0];
    const y = (1 - u) * (1 - u) * dock[1] + 2 * (1 - u) * u * cy + u * u * start[1];
    const lift = Math.sin(Math.PI * clamp((t - T.liftStart) / (T.drawStart - T.liftStart)));
    const pose = easeInOutSine(clamp((t - T.liftStart) / (T.travelEnd - T.liftStart)));
    return { x, y, rot: write.rot * pose - 5 * Math.sin(Math.PI * u), scale: mix(1, write.scale, pose) * (1 + (LIFT - 1) * lift), op: 1, s: -1 };
  }
  const p = nibAt(t), f = p.s / L, back = nibAt(t - 180);
  let sway = Math.max(-2.5, Math.min(2.5, ((p.y - back.y) / 180) * 2.2));
  const since = t - T.drawEnd;
  if (since > 0) sway = -2.2 * Math.exp(-since / 150) * Math.sin(since / 60);
  const home = easeInOutSine(clamp((t - (T.drawEnd - 380)) / (T.dockEnd - (T.drawEnd - 380))));
  const dk = f ** 4;
  return { x: p.x + drift[0] * dk, y: p.y + drift[1] * dk, rot: mix(write.rot, 0, home) + sway, scale: mix(write.scale, 1, home), op: 1, s: p.s };
}

// speed: how much faster than version B's timeline it plays (a loader plays it quicker, so the page
// is not held for the drawing)
export function createLogoPlayer(el, { write = { rot: 46, scale: .76 }, speed = 1 } = {}) {
  const real = el.querySelector('.ld-real'), layers = el.querySelector('.ld-layers');
  const pen = el.querySelector('.ld-pen'), glow = el.querySelector('.ld-glow'), labels = [...el.querySelectorAll('.ld-label')], canvas = el.querySelector('.ld-ink');
  pen.style.width = (bw / LW * 100) + '%';
  let ink = null, inkReady = null, k = 1, raf = 0, clock = 0, last = null, playing = false, done = null;
  function makeInk() {
    if (!ink) { ink = createInk(D, P, canvas, null, { fit: true }); inkReady = ink.ready.catch(e => { console.error('logo ink', e); }); }
    return inkReady;
  }
  const decoded = () => Promise.all([...el.querySelectorAll('img')].map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  function measure() {
    k = el.offsetWidth / LW;
    pen.style.transformOrigin = `${(nibOff[0] * k).toFixed(2)}px ${(nibOff[1] * k).toFixed(2)}px`;
    if (ink) ink.fit();
  }
  function renderAt(t) {
    const st = penState(t, write);
    ink.revealTo(st.s < 0 ? -1 : st.s + 1.5);   // ink only once the pen has touched down
    pen.style.opacity = st.op.toFixed(3);
    pen.style.transform = `translate3d(${((st.x - nibOff[0]) * k).toFixed(2)}px,${((st.y - nibOff[1]) * k).toFixed(2)}px,0) rotate(${st.rot.toFixed(2)}deg) scale(${st.scale.toFixed(4)})`;
    glow.style.opacity = (.75 * clamp((t - T.drawStart) / 200) * clamp((T.drawEnd + 240 - t) / 240)).toFixed(3);
    glow.style.transform = `translate3d(${(st.x * k).toFixed(2)}px,${(st.y * k).toFixed(2)}px,0)`;
    labels.forEach((l, i) => {
      const u = easeOut(clamp((t - (T.labelsStart + i * T.labelStep)) / T.labelDur));
      l.style.opacity = u.toFixed(3);
      l.style.transform = u < 1 ? `translate3d(${(-6 * (1 - u)).toFixed(2)}px,0,0)` : 'none';
    });
    // the finished drawing hands over to the real logo (and before 0, a replay's real logo to the drawing)
    const x = clamp((t - T.crossStart) / (T.end - T.crossStart));
    real.style.opacity = t < 0 ? (1 - easeInOutSine(clamp((t + PRE) / PRE))).toFixed(3) : x > 0 ? '1' : '0';
    layers.style.opacity = (1 - x).toFixed(3);
  }
  function finish() {
    playing = false;
    el.classList.remove('drawing', 'ld-first');
    real.style.opacity = ''; layers.style.opacity = '';
    if (done) { const d = done; done = null; d(); }
  }
  function frame(now) {
    // a stalled frame slows the drawing down, it never makes it jump
    if (last !== null) { const gap = now - last; clock += (gap > 50 ? 16.7 : gap) * speed; }
    last = now;
    renderAt(clock);
    if (clock >= T.end) finish(); else raf = requestAnimationFrame(frame);
  }
  function play({ replay = false } = {}) {
    if (playing) return Promise.resolve();
    playing = true;
    return Promise.all([makeInk(), decoded()]).then(() => new Promise(res => {
      done = res;
      el.classList.add('drawing');
      clock = replay ? -PRE : 0; last = null;
      measure(); renderAt(clock);
      raf = requestAnimationFrame(frame);
    }));
  }
  // shown finished at once (reduced motion, or a loader that is skipped)
  function settle() { cancelAnimationFrame(raf); if (playing && ink) { clock = T.end; renderAt(clock); } finish(); }
  return { play, settle, ready: makeInk, measure, get playing() { return playing; }, duration: T.end / speed };
}
