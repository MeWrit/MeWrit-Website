/* Version B: the logo draws itself in the header, on every load of the page that has it.
   The wordmark and tagline are there from the start. The pen pops in at its place on the
   right, lifts and glides to the start of the line without drawing, touches down, and draws
   the heartbeat line from left to right (the ink is the logo's own line pixels: pen-ink.js).
   It docks back into its place, then MEDICAL WRITING, TRAINING and HEALTHCARE CONSULTING
   appear one after another.
   At header size the pen is nearly as tall as the logo: upright, it would poke out of the top
   of the screen at the heartbeat's peak. So while it travels and writes it leans to a natural
   writing angle and is a little smaller, and it returns exactly to its pose in the logo.
   On every page the drawing also comes back now and then (replay()): LOGO_INTERVAL after the
   finished logo was last on show, the real logo hands over in place to the drawing's layers (its
   line, labels and pen fade away), the pen draws them again, and the real logo takes over once
   more. Not while the tab is hidden, the header is off the screen or under an open menu, with
   reduced motion, or with ?static (?nointro skips only the page's own intro). Review switch:
   ?logoloop=<seconds> sets the interval. */
import D from '../data/intro.json';
import { $, clamp, easeOut, easeInOutCubic, easeInOutSine, STATIC } from './shared.js';
import { penPath, createInk } from './pen-ink.js';

const LOGO_INTERVAL = 30000;   // ms from the finished logo being on show to its next replay

const root = document.documentElement;
const box = $('logoAnim'), real = $('headerLogo');
if (box && real) (function () {
  const pen = $('laPen'), glow = $('laGlow');
  const labels = [...box.querySelectorAll('.la-label')];
  const LW = D.logo[0];
  const P = penPath(D), { pts, L, WT, atWeight } = P;
  const [bx, by, bw] = D.penBox, nibOff = [D.nib[0] - bx, D.nib[1] - by];
  const start = pts[0], dock = D.nib;   // where the line starts; where the nib sits in the logo
  const endPt = pts[pts.length - 1], drift = [dock[0] - endPt[0], dock[1] - endPt[1]];
  pen.style.width = (bw / LW * 100) + '%';

  // the ink is made when it is first needed: at once for version B's play on load, otherwise in
  // a quiet moment once the page's own intro is over (the first replay is a while away)
  let ink = null, inkReady = null;
  function makeInk() {
    if (!ink) {
      ink = createInk(D, P, $('laInk'), null, { fit: true });
      inkReady = ink.ready.catch(e => { console.error('logo ink', e); });
    }
    return inkReady;
  }

  // timeline in ms
  const T = { pop: 420, liftStart: 560, travelEnd: 1320, drawStart: 1480, drawEnd: 3280, dockEnd: 3640,
              labelsStart: 3600, labelStep: 150, labelDur: 460, crossStart: 4320, end: 4540 };
  const PRE = 240;   // a replay's handover, before 0: the real logo fades out over the layers
  // the writing pose: leaning right, a little smaller. With it the cap stays about 7 px (desktop)
  // and 5 px (phone) inside the screen when the nib is on the heartbeat's peak (pen_pose check)
  const WRITE = { rot: 46, scale: .76 };
  const LIFT = 1.08;                        // lifted off the paper it looks a touch bigger

  const mix = (a, b, u) => a + (b - a) * u;
  const easeOutBack = p => 1 + 2.5 * Math.pow(p - 1, 3) + 1.5 * Math.pow(p - 1, 2);
  const nibAt = t => atWeight(easeInOutSine(clamp((t - T.drawStart) / (T.drawEnd - T.drawStart))) * WT);

  // where the nib is (logo pixels), how the pen is posed, and how much it is lifted
  function penState(t) {
    if (t < T.liftStart) {   // pops in at its place in the logo
      const u = clamp(t / T.pop);
      return { x: dock[0], y: dock[1], rot: 6 * (1 - easeOut(u)), scale: .5 + .5 * easeOutBack(u), op: clamp(t / 160), s: -1 };
    }
    if (t < T.drawStart) {   // lifts, glides left on a low arc, touches down at the start
      const u = easeInOutCubic(clamp((t - T.liftStart) / (T.travelEnd - T.liftStart)));
      const cx = (dock[0] + start[0]) / 2, cy = Math.min(dock[1], start[1]) - 34;
      const x = (1 - u) * (1 - u) * dock[0] + 2 * (1 - u) * u * cx + u * u * start[0];
      const y = (1 - u) * (1 - u) * dock[1] + 2 * (1 - u) * u * cy + u * u * start[1];
      const lift = Math.sin(Math.PI * clamp((t - T.liftStart) / (T.drawStart - T.liftStart)));
      const pose = easeInOutSine(clamp((t - T.liftStart) / (T.travelEnd - T.liftStart)));
      return { x, y, rot: WRITE.rot * pose - 5 * Math.sin(Math.PI * u), scale: mix(1, WRITE.scale, pose) * (1 + (LIFT - 1) * lift), op: 1, s: -1 };
    }
    // writes the line, then docks back into the logo's own pose
    const p = nibAt(t), f = p.s / L, back = nibAt(t - 180);
    let sway = Math.max(-2.5, Math.min(2.5, ((p.y - back.y) / 180) * 2.2));
    const since = t - T.drawEnd;
    if (since > 0) sway = -2.2 * Math.exp(-since / 150) * Math.sin(since / 60);
    const home = easeInOutSine(clamp((t - (T.drawEnd - 380)) / (T.dockEnd - (T.drawEnd - 380))));
    const dk = f ** 4;   // the small offset between the traced line's end and the nib's place
    return { x: p.x + drift[0] * dk, y: p.y + drift[1] * dk, rot: mix(WRITE.rot, 0, home) + sway, scale: mix(WRITE.scale, 1, home), op: 1, s: p.s };
  }

  // what is playing: 'first' (version B's play on load), 'replay', or '' (nothing)
  let mode = '', k = 1;
  function measure() {
    if (mode === 'replay') {   // a replay takes the real logo's place and size, whatever the header is doing
      const lr = box.parentElement.getBoundingClientRect(), r = real.getBoundingClientRect(), s = box.style;
      s.left = (r.left - lr.left) + 'px'; s.top = (r.top - lr.top) + 'px';
      s.width = r.width + 'px'; s.height = r.height + 'px';
    }
    k = box.getBoundingClientRect().width / LW;
    pen.style.transformOrigin = `${(nibOff[0] * k).toFixed(2)}px ${(nibOff[1] * k).toFixed(2)}px`;
    ink.fit();   // the ink canvas follows the logo's size on screen
  }
  function renderAt(t) {
    const st = penState(t);
    ink.revealTo(st.s < 0 ? -1 : st.s + 1.5);   // ink only once the pen has touched down
    pen.style.opacity = st.op.toFixed(3);
    pen.style.transform = `translate3d(${((st.x - nibOff[0]) * k).toFixed(2)}px,${((st.y - nibOff[1]) * k).toFixed(2)}px,0) rotate(${st.rot.toFixed(2)}deg) scale(${st.scale.toFixed(4)})`;
    glow.style.opacity = (.75 * clamp((t - T.drawStart) / 200) * clamp((T.drawEnd + 240 - t) / 240)).toFixed(3);
    glow.style.transform = `translate3d(${(st.x * k).toFixed(2)}px,${(st.y * k).toFixed(2)}px,0)`;
    labels.forEach((el, i) => {
      const u = easeOut(clamp((t - (T.labelsStart + i * T.labelStep)) / T.labelDur));
      el.style.opacity = u.toFixed(3);
      el.style.transform = u < 1 ? `translate3d(${(-6 * (1 - u)).toFixed(2)}px,0,0)` : 'none';
    });
    // the finished drawing hands over to the real logo image underneath (and before 0, in a
    // replay, the real logo hands over to the drawing: the layers are already in place over it)
    const x = clamp((t - T.crossStart) / (T.end - T.crossStart));
    real.style.opacity = t < 0 ? (1 - easeInOutSine(clamp((t + PRE) / PRE))).toFixed(3) : x > 0 ? '1' : '';
    box.style.opacity = (1 - x).toFixed(3);
  }

  let clock = 0, last = null, raf = 0, replays = 0;
  const marks = {};
  // a replay follows the real logo when its size changes (the capsule tightening as you scroll)
  const follow = new ResizeObserver(() => { if (mode === 'replay') { measure(); renderAt(clock); } });
  function startReplayLayers() {
    mode = 'replay';
    root.classList.add('logo-replay');
    follow.observe(real);
  }
  function endReplayLayers() {
    follow.disconnect();
    root.classList.remove('logo-replay');
    const s = box.style; s.opacity = s.left = s.top = s.width = s.height = '';
  }
  function finish() {
    const was = mode;
    mode = '';
    root.classList.add('logo-done');
    real.style.opacity = '';
    if (was === 'replay') { endReplayLayers(); replays++; }
    else document.dispatchEvent(new Event('mewrit:logodone'));   // the numbers in the hero wait for this
    shown();
  }
  function frame(now) {
    // a stalled frame slows the animation down, it never makes it jump
    if (last !== null) { const gap = now - last; clock += gap > 50 ? 16.7 : gap; }
    last = now;
    renderAt(clock);
    if (mode === 'first') for (const key of ['drawStart', 'drawEnd', 'end']) if (marks[key] === undefined && clock >= T[key]) marks[key] = now;
    if (clock >= T.end) finish(); else raf = requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { if (mode) { measure(); renderAt(clock); } });

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const decodeAll = () => Promise.all([...box.querySelectorAll('img')].map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));

  // the schedule: LOGO_INTERVAL (or ?logoloop=<seconds>) after the finished logo is on show
  const loop = (location.search.match(/[?&]logoloop=(\d+(?:\.\d+)?)/) || [])[1];
  const interval = loop ? Math.max(1000, loop * 1000) : LOGO_INTERVAL;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const idle = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 4000 }) : f => setTimeout(f, 1500);
  let timer = 0, nextAt = 0, onShow = false;
  function schedule() {
    clearTimeout(timer); timer = 0; nextAt = 0;
    // a hidden tab waits for the visibility change below, so a returning visitor gets no burst
    if (STATIC || still.matches || document.hidden || !onShow || mode) return;
    nextAt = performance.now() + interval;
    timer = setTimeout(due, interval);
  }
  // the logo is off the screen (the phone capsule slips away as you read on) or covered (the
  // phone card, the menu or a sheet is open)
  function outOfSight() {
    if (document.querySelector('dialog[open]')) return true;
    const r = real.getBoundingClientRect();
    return !r.width || r.bottom <= 0 || r.top >= innerHeight;
  }
  function due() {
    timer = 0; nextAt = 0;
    if (document.hidden || still.matches || outOfSight() || !replay()) schedule();   // skipped: counted again from now
  }
  // the finished logo is on show: count to the next replay from now
  function shown() {
    onShow = true;
    if (!ink && !STATIC && !still.matches) idle(makeInk);
    schedule();
  }

  // the replay: the real logo hands over to the layers (base only: no line, labels or pen), then
  // the whole drawing plays from 0 and hands back. Returns false if it cannot start now.
  let preparing = false;
  function replay() {
    if (mode || preparing || !onShow) return false;
    preparing = true;
    Promise.all([makeInk(), decodeAll()]).then(() => {
      preparing = false;
      if (mode) return;
      if (document.hidden) { schedule(); return; }   // went hidden meanwhile: wait for the visit
      clearTimeout(timer); timer = 0; nextAt = 0;
      startReplayLayers();
      clock = -PRE; last = null;
      measure(); renderAt(clock);
      raf = requestAnimationFrame(frame);
    });
    return true;
  }

  // version B: the drawing on load
  if (root.classList.contains('logo-anim') && !root.classList.contains('logo-done')) {
    mode = 'first';
    const inkReady = makeInk(), decoded = decodeAll();
    const smoothFrames = () => new Promise(res => {
      let prev = null, good = 0; const t0 = performance.now();
      const tick = now => {
        if (prev !== null) good = now - prev < 22 ? good + 1 : 0;
        prev = now;
        if (good >= 3 || now - t0 > 700) res(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    Promise.all([inkReady, Promise.race([decoded, wait(1800)])]).then(smoothFrames).then(() => {
      if (root.classList.contains('logo-done')) { mode = ''; shown(); return; }   // the failsafe already showed the finished logo
      if (window.mewritFailsafe) window.mewritFailsafe(T.end + 3000);   // playing: keep the failsafe out of its way
      measure(); renderAt(0); marks.start = performance.now();
      raf = requestAnimationFrame(frame);
    });
  }

  document.addEventListener('visibilitychange', schedule);
  still.addEventListener('change', () => {
    if (still.matches && mode === 'replay') { cancelAnimationFrame(raf); clock = T.end; renderAt(clock); finish(); }
    schedule();
  });
  // the finished logo is first on show when the page's own intro is over: the loading intro on the
  // home page, the drawing on version B (its finish() says so), or at once on any other page
  if (root.classList.contains('intro-on') && !root.classList.contains('logo-landed')) document.addEventListener('mewrit:introdone', shown, { once: true });
  else if (mode !== 'first') shown();

  // review and test hook (nextAt is a performance.now() time, 0 when nothing is scheduled)
  window.mewritLogo = {
    seek(t) {
      cancelAnimationFrame(raf); clearTimeout(timer); timer = 0; nextAt = 0;
      makeInk();
      if (root.classList.contains('logo-anim')) {
        if (mode === 'replay') endReplayLayers();
        mode = 'first'; root.classList.remove('logo-done');
      } else startReplayLayers();
      clock = t; last = null;
      measure(); renderAt(t); if (t >= T.end) finish();
    },
    replay, ready: () => makeInk(), duration: T.end, T, marks, inkStats: () => ink ? ink.stats() : { pixels: 0, unmatched: 0 },
    interval, get nextAt() { return nextAt; }, get replays() { return replays; }, get playing() { return mode; },
  };
})();
