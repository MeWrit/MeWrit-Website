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
   A tap, key or scroll speeds it up (3x) instead of cutting it. Plays once per session
   (the boot script in the <head> decides). The pen's path and the logo's line pixels are in
   src/data/intro.json, traced from the logo. */
import D from '../data/intro.json';
import { $, clamp, easeOut, easeInOutCubic, easeInOutSine, INTRO } from './shared.js';

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

  const LW = D.logo[0], LH = D.logo[1];
  const overlay = $('intro'), backdrop = $('introBackdrop'), box = $('introLogo'), curtain = $('introCurtain');
  const pen = $('introPen'), glow = $('introGlow'), full = $('introFull'), base = $('introBase');
  const ictx = $('introInk').getContext('2d'), pctx = $('introPulse').getContext('2d');
  const pts = D.points;

  // arc length; drawing weight (spike strokes a little quicker); running maximum x
  const cum = [0], cw = [0], maxX = [pts[0][0]];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], ds = Math.hypot(dx, dy);
    cum.push(cum[i - 1] + ds);
    cw.push(cw[i - 1] + ds * (1 - .25 * (ds ? Math.abs(dy) / ds : 0)));
    maxX.push(Math.max(maxX[i - 1], pts[i][0]));
  }
  const L = cum[cum.length - 1], WT = cw[cw.length - 1], SOFT = 90, PULSE = 110;
  const [bx, by, bw] = D.penBox, nibOff = [D.nib[0] - bx, D.nib[1] - by];
  const endPt = pts[pts.length - 1], drift = [bx - (endPt[0] - nibOff[0]), by - (endPt[1] - nibOff[1])];
  pen.style.width = (bw / LW * 100) + '%';

  function atWeight(w) {
    const n = pts.length - 1;
    if (w <= 0) return { x: pts[0][0], y: pts[0][1], s: 0, mx: maxX[0] };
    if (w >= WT) return { x: pts[n][0], y: pts[n][1], s: L, mx: maxX[n] };
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cw[mid] <= w) lo = mid; else hi = mid; }
    const f = (w - cw[lo]) / ((cw[hi] - cw[lo]) || 1);
    const x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f;
    return { x, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f, s: cum[lo] + (cum[hi] - cum[lo]) * f, mx: Math.max(maxX[lo], x) };
  }
  const T = { penIn: 340, drawStart: 560, drawEnd: 2460, sweepEnd: 2860, prepare: 2880, pulseStart: 3060, pulseEnd: 3420,
              glideStart: 3420, fadeStart: 3560, crossStart: 3840, fadeEnd: 4060, glideEnd: 4140 };
  const nibAt = t => atWeight(easeInOutSine(clamp((t - T.drawStart) / (T.drawEnd - T.drawStart))) * WT);

  // ---- the ink: every line pixel gets the arc length at which the pen passes nearest to it
  let order = null, sAt = null, src = null, inkImg = null, pulseImg = null, unmatched = 0;
  const TIE = 1.5;
  const lowerBound = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; };
  async function prepareInk() {
    const img = new Image(); img.src = D.lineLayer;   // a data URL: a canvas may read it on any host
    await (img.decode ? img.decode() : new Promise(r => { img.onload = r; }));
    const off = document.createElement('canvas'); off.width = LW; off.height = LH;
    const octx = off.getContext('2d', { willReadFrequently: true }); octx.drawImage(img, 0, 0);
    src = octx.getImageData(0, 0, LW, LH).data;
    const CELL = 8, gw = Math.ceil(LW / CELL) + 2, grid = new Map();
    pts.forEach((p, i) => { const key = Math.floor(p[0] / CELL) + Math.floor(p[1] / CELL) * gw; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i); });
    const idx = [], sv = [];
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const i = (y * LW + x) * 4;
      if (!src[i + 3]) continue;
      const cx = Math.floor((x + .5) / CELL), cy = Math.floor((y + .5) / CELL);
      // the pen passes some pixels twice (out to each tip and back, and where two strokes
      // merge): any pass within TIE px of the nearest counts, and the earliest wins, so the
      // ink appears on the first pass and a stroke never fills in speckled
      let best = 1e9, bestS = L;
      for (let pass = 0; pass < 2; pass++) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const list = grid.get((cx + ox) + (cy + oy) * gw);
        if (!list) continue;
        for (const k of list) {
          const d = Math.hypot(pts[k][0] - (x + .5), pts[k][1] - (y + .5));
          if (pass === 0) { if (d < best) best = d; }
          else if (d <= best + TIE && cum[k] < bestS) bestS = cum[k];
        }
      }
      if (best > 1e8) unmatched++;
      idx.push(i); sv.push(bestS);
    }
    const ord = idx.map((_, j) => j).sort((a, b) => sv[a] - sv[b]);
    order = new Int32Array(ord.map(j => idx[j]));
    sAt = new Float32Array(ord.map(j => sv[j]));
    inkImg = ictx.createImageData(LW, LH);
    pulseImg = pctx.createImageData(LW, LH);
  }
  let revealed = 0, revealedS = -1;
  function revealTo(s) {
    if (!order) return;
    const d = inkImg.data;
    if (s < revealedS) { d.fill(0); revealed = 0; ictx.clearRect(0, 0, LW, LH); }
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    while (revealed < order.length && sAt[revealed] <= s) {
      const i = order[revealed++];
      d[i] = src[i]; d[i + 1] = src[i + 1]; d[i + 2] = src[i + 2]; d[i + 3] = src[i + 3];
      const p = i >> 2, x = p % LW, y = (p / LW) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 >= 0) ictx.putImageData(inkImg, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    revealedS = s;
  }
  // a pulse of light over the real line pixels (brightest at its head)
  let lit = [0, 0];
  function pulseAt(hq) {
    if (!order) return;
    const d = pulseImg.data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const touch = i => { const p = i >> 2, x = p % LW, y = (p / LW) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    for (let j = lit[0]; j < lit[1]; j++) { const i = order[j]; d[i + 3] = 0; touch(i); }
    lit = [0, 0];
    if (hq > 0 && hq < 1) {
      const head = hq * (L + PULSE), env = Math.sin(Math.PI * hq);
      const a = lowerBound(sAt, head - PULSE), b = lowerBound(sAt, head);
      for (let j = a; j < b; j++) {
        const i = order[j], k = 1 - (head - sAt[j]) / PULSE;
        d[i] = 255; d[i + 1] = 228; d[i + 2] = 200; d[i + 3] = Math.round(src[i + 3] * env * k * .85);
        touch(i);
      }
      lit = [a, b];
    }
    if (x1 >= 0) pctx.putImageData(pulseImg, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }

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
    try { sessionStorage.setItem('mewrit-intro', '1'); } catch (e) {}
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
  const inkReady = prepareInk().catch(e => { console.error('intro ink', e); });
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
    inkStats: () => ({ pixels: order ? order.length : 0, unmatched }),
  };
})();
