/* Logo intro. The ink is the logo's own line pixels: each pixel appears when the pen's nib passes
   nearest to it, so the heartbeat comes out exactly as in the logo while the pen follows a
   clean centreline (out to every tip of the heartbeat and back, no jitter).
   Waits until the page has settled (images decoded, fonts ready, smooth frames), then
   plays on its own clock, which never jumps: a stalled frame slows the intro, it never skips.
   0.00 to 0.34 s  the pen settles into place at the start of the line
   0.56 to 2.46 s  the nib rides the line; a soft warm glow at the nib; the letters appear
                   just behind it through a soft curtain; the pen sways very gently
   2.46 to 2.86 s  the pen settles into its place; the words on the right are revealed
   2.88 s          the page is prepared behind the backdrop, while nothing moves on screen
   3.06 to 3.42 s  a pulse of light runs along the line (on its real shape); the logo breathes
   3.42 to 4.14 s  the logo glides on a soft arc into the header while the backdrop dissolves,
                   crossfading into the real logo image just before it lands
   A tap, key or scroll speeds it up (3x) instead of cutting it. Plays on every load of the
   home page (the boot script in the <head> decides). The pen's path and the logo's line
   pixels are in src/data/intro.json, traced from the logo. */
import D from '../data/intro.json';
import { $, clamp, easeOut, easeInOutCubic, easeInOutSine, INTRO } from './shared.js';
import { penPath, createInk } from './pen-ink.js';

(function () {
  const root = document.documentElement;
  const markPrepared = () => {
    if (root.classList.contains('intro-prepared')) return;
    root.classList.add('no-transition');
    root.classList.remove('pre-enter');
    root.classList.add('intro-prepared');
    void root.offsetHeight;
    requestAnimationFrame(() => root.classList.remove('no-transition'));
    document.dispatchEvent(new Event('mewrit:prepare'));
  };
  if (!INTRO) return;
  // this script arrived after the failsafe had already shown the page (a slow connection):
  // no intro now, it would only lock scrolling on a page the visitor is already reading
  if (root.classList.contains('logo-landed')) return;
  if (!D || !D.points || !D.lineLayer) {
    root.classList.add('logo-landed'); $('intro').style.display = 'none';
    markPrepared(); document.dispatchEvent(new Event('mewrit:introdone'));
    return;
  }

  const LW = D.logo[0];
  const overlay = $('intro'), backdrop = $('introBackdrop'), box = $('introLogo'), curtain = $('introCurtain');
  const pen = $('introPen'), glow = $('introGlow'), full = $('introFull'), base = $('introBase');
  const P = penPath(D), { pts, L, WT, atWeight } = P;
  const ink = createInk(D, P, $('introInk'), $('introPulse')), { revealTo, pulseAt } = ink;
  const SOFT = 90;
  const [bx, by, bw] = D.penBox, nibOff = [D.nib[0] - bx, D.nib[1] - by];
  const endPt = pts[pts.length - 1], drift = [bx - (endPt[0] - nibOff[0]), by - (endPt[1] - nibOff[1])];
  pen.style.width = (bw / LW * 100) + '%';

  const T = { penIn: 340, drawStart: 560, drawEnd: 2460, sweepEnd: 2860, prepare: 2880, pulseStart: 3060, pulseEnd: 3420,
              glideStart: 3420, fadeStart: 3560, crossStart: 3840, fadeEnd: 4060, glideEnd: 4140 };
  const nibAt = t => atWeight(easeInOutSine(clamp((t - T.drawStart) / (T.drawEnd - T.drawStart))) * WT);

  let k = 1, boxW = 0, boxH = 0, flip = null;
  function untransformedRect() {
    const prev = box.style.transform; box.style.transform = 'none';
    const r = box.getBoundingClientRect(); box.style.transform = prev;
    return r;
  }
  function measure() {
    const r = untransformedRect();
    boxW = r.width; boxH = r.height; k = r.width / LW; flip = null;
    pen.style.transformOrigin = `${(nibOff[0] * k).toFixed(2)}px ${(nibOff[1] * k).toFixed(2)}px`;
  }
  function computeFlip() {
    const srcR = untransformedRect(), dst = $('headerLogo').getBoundingClientRect();
    flip = { tx: dst.left - srcR.left, ty: dst.top - srcR.top, s: dst.width / srcR.width };
  }

  function renderAt(t) {
    const p = nibAt(t), s = p.s, f = s / L;
    revealTo(t < T.drawStart ? -1 : s + 1.5);   // the ink appears right under the nib, once it touches down
    // the pen settles in, rides the nib, sways very gently, and settles when it docks
    const pin = easeOut(clamp(t / T.penIn));
    const back = nibAt(t - 180);
    let ang = Math.max(-2.5, Math.min(2.5, ((p.y - back.y) / 180) * 2.2));
    const since = t - T.drawEnd;
    if (since > 0) ang = -2.6 * Math.exp(-since / 150) * Math.sin(since / 60);
    const dk = f ** 4;   // the pen's small offset from the traced line is taken up only near the end
    const px = (p.x - nibOff[0] + drift[0] * dk) * k, py = (p.y - nibOff[1] + drift[1] * dk) * k - (1 - pin) * 14;
    pen.style.opacity = pin.toFixed(3);
    pen.style.transform = `translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0) rotate(${ang.toFixed(2)}deg)`;
    glow.style.opacity = (.85 * clamp((t - T.drawStart) / 220) * clamp((T.drawEnd + 280 - t) / 280)).toFixed(3);
    glow.style.transform = `translate3d(${(p.x * k).toFixed(2)}px,${(p.y * k).toFixed(2)}px,0)`;
    // the letters appear just behind the pen, then the words on the right
    let edge = t <= T.drawStart ? pts[0][0] : p.mx;
    if (t > T.drawEnd) edge = Math.max(edge, 592 + (LW + SOFT + 60 - 592) * easeOut(clamp((t - T.drawEnd) / (T.sweepEnd - T.drawEnd))));
    curtain.style.transform = `translate3d(${((edge - SOFT) * k).toFixed(2)}px,0,0)`;
    // the pulse, and a breath
    const hq = clamp((t - T.pulseStart) / (T.pulseEnd - T.pulseStart));
    pulseAt(hq);
    const breath = 1 + .012 * Math.sin(Math.PI * hq);
    // the glide into the header, on a soft arc (rises first, then settles across)
    const g = easeInOutCubic(clamp((t - T.glideStart) / (T.glideEnd - T.glideStart)));
    if (g > 0) {
      if (!flip) computeFlip();
      const cx = flip.tx * .1, cy = flip.ty * .92;
      const x = 2 * (1 - g) * g * cx + g * g * flip.tx, y = 2 * (1 - g) * g * cy + g * g * flip.ty;
      box.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${(1 + (flip.s - 1) * g).toFixed(4)})`;
    } else {
      box.style.transform = breath > 1.0001
        ? `translate3d(${(boxW * (1 - breath) / 2).toFixed(2)}px,${(boxH * (1 - breath) / 2).toFixed(2)}px,0) scale(${breath.toFixed(4)})`
        : 'none';
    }
    full.style.opacity = clamp((t - T.crossStart) / (T.glideEnd - 60 - T.crossStart)).toFixed(3);
    backdrop.style.opacity = (.995 * (1 - easeInOutSine(clamp((t - T.fadeStart) / (T.fadeEnd - T.fadeStart))))).toFixed(3);
  }

  let clock = 0, last = null, speed = 1, raf = 0, done = false;
  const marks = {};
  function finish() {
    done = true;
    if (window.mewritFailsafe) window.mewritFailsafe(0);   // finished normally: nothing left to rescue
    root.classList.add('logo-landed');
    overlay.style.display = 'none';
    root.style.overflow = '';
    document.dispatchEvent(new Event('mewrit:introdone'));
  }
  function effects(t, now) {
    for (const key of ['drawStart', 'drawEnd', 'prepare', 'glideStart', 'glideEnd']) if (marks[key] === undefined && t >= T[key]) marks[key] = now;
    if (t >= T.prepare) markPrepared();
    if (t >= T.glideEnd && !done) finish();
  }
  function frame(now) {
    if (last !== null) { const gap = now - last; clock += (gap > 50 ? 16.7 : gap) * speed; }
    last = now;
    renderAt(clock); effects(clock, now);
    if (!done) raf = requestAnimationFrame(frame);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => addEventListener(ev, () => { speed = 3; }, { passive: true }));
  addEventListener('resize', () => { if (!done) { measure(); renderAt(clock); } });
  root.style.overflow = 'hidden';   // the header is fixed, not sticky, so locking scroll cannot displace it
  scrollTo(0, 0);

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const decoded = Promise.all([base, pen, full].map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(1400)]) : Promise.resolve();
  const inkReady = ink.ready.catch(e => { console.error('intro ink', e); });
  const smoothFrames = () => new Promise(res => {
    let prev = null, good = 0; const t0 = performance.now();
    const tick = now => {
      if (prev !== null) good = now - prev < 22 ? good + 1 : 0;
      prev = now;
      if (good >= 3 || now - t0 > 700) res(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  Promise.all([inkReady, Promise.race([Promise.all([decoded, fontsReady]), wait(1800)])]).then(smoothFrames).then(() => {
    // too late: the failsafe showed the page while we were getting ready
    if (root.classList.contains('logo-landed')) { overlay.style.display = 'none'; root.style.overflow = ''; return; }
    // playing now, and it finishes on its own: move the failsafe to just past the end, and
    // drop the stylesheet's timed fallback so it cannot fade the overlay mid-glide
    if (window.mewritFailsafe) window.mewritFailsafe(T.glideEnd + 3000);
    overlay.style.animation = 'none';
    measure(); renderAt(0); box.style.opacity = 1; marks.start = performance.now();
    raf = requestAnimationFrame(frame);
  });

  // review and test hook
  window.mewritIntro = {
    seek(t) {
      cancelAnimationFrame(raf); done = false; overlay.style.display = ''; box.style.opacity = 1;
      clock = t; last = null;   // a resize re-renders at the clock, so the clock must hold the seek
      measure(); renderAt(t); if (t >= T.prepare) markPrepared(); if (t >= T.glideEnd) finish();
    },
    ready: () => inkReady, duration: T.glideEnd, T, marks, nib: t => nibAt(t), pathLength: L,
    inkStats: ink.stats,
  };
})();
