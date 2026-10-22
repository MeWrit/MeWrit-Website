/* The inner pages' night bands (src/components/NightBand.astro): the film's night at the head of a page,
   where one of its shapes draws itself as the page opens (the user, 2026-10-22: the inner pages lacked the
   film's particles and felt less of a piece with it). Each band names a scene of the film (scenes.js) and
   takes its shape and its look from it: the dust gathers into the shape, which writes or lights itself in,
   then does the scene's small action at rest (a page's line rewritten, the pen's front passing), with the
   dust drifting, as in the film. Where a band shows the film's page, its signature and seal are written
   again when a visitor saves Dr Hetal's contact (the event "nb:sign", from card.js), as the film's page is
   re-signed for each testimonial. One shape only is built (createWorld's `only`), after the page's words have shown; the band
   draws only while it is on screen, at half the rate on a phone once settled; with reduced motion, once
   and still; without WebGL, its night stays a plain gradient (band.css).
   Where the shape stands: on a computer beside the words (from their right edge to the screen's); on a
   phone above them, between the way back and the words (or, with too little room there, or data-phone
   "behind", behind the words, fitted to the whole band). data-shot "a" or "b" takes the camera's direction
   from one of the scene's two shots instead of the middle of them (the papers from above, say). */
import { clamp, REDUCE, STATIC } from './shared.js';
import { SCENES } from './xp/scenes.js';
import { F } from './xp/formations.js';
import { fitShot, sceneDir, norm, sub } from './xp/fit.js';

const UP = [0, 1, 0], ORIGIN = [0, 0, 0];
// scene "dust": no shape, only the film's dust drifting in the night (the strip across the top of her
// profile: the user did not like the film's page there, and chose the dust field, 2026-10-22)
// (brought up and a little larger, as the film's own tail shows it: scenes.js TAIL)
const DUST = { id: 'dust', form: F.DUST, a: [[0, 0, 30], [0, 0, 0], 40, 0, 0], b: [[0, 0, 30], [0, 0, 0], 40, 0, 0], bg: ['#0B1A42', '#030817'], glow: ['#1C3472', .5], dust: 6, size: 1.5, gain: .6, bloom: .35 };
// the page's signature and seal written again (the voices scene's strokes; scratchpad page_keys.mjs)
const SIGN = { mode: 'rewrite', range: [.924, .986], len: .062, every: 0, take: 2.8 };
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

document.querySelectorAll('.nb[data-scene]').forEach(band => {
  const s = band.dataset.scene === 'dust' ? DUST : SCENES.find(x => x.id === band.dataset.scene);
  if (!s || !hasGL) { band.classList.add('nb-nogl'); return; }
  // (after the words have painted: the 3D never holds the page back)
  const go = () => start(band, s).catch(err => { console.warn('[band]', err); band.classList.add('nb-nogl'); });
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 600 }); else setTimeout(go, 120);
});

async function start(band, s) {
  const canvas = band.querySelector('.nb-canvas'), words = band.querySelector('.nb-words');
  const { createWorld } = await import('./xp/world.js');
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const motion = REDUCE || STATIC ? 0 : 1;
  const world = createWorld(canvas, { N: big ? 30000 : 14000, dpr: Math.min(devicePixelRatio || 1, big ? 2 : 1.75), bloomScale: big ? 1 : .5, only: [s.form] });
  const shot = band.dataset.shot, behindAlways = band.dataset.phone === 'behind';
  const dir = shot === 'a' ? norm(sub(s.a[0], s.a[1])) : shot === 'b' ? norm(sub(s.b[0], s.b[1])) : sceneDir(s);
  const fov = shot === 'a' ? s.a[2] : shot === 'b' ? s.b[2] : (s.a[2] + s.b[2]) / 2;
  let W = 0, H = 0, v = [0, 0, 30, 0, 0, 0, 40, 0, 0], behind = false;

  // the shape fitted to its room (in fractions of the band): beside the words on a computer; on a phone
  // between the way back and the words, or behind the words where that leaves too little room
  function fit() {
    W = band.clientWidth; H = band.clientHeight;
    if (!W || !H) return;
    world.resize(W, H);
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    const br = band.getBoundingClientRect(), rel = r => [(r.left - br.left) / W, (r.top - br.top) / H, (r.right - br.left) / W, (r.bottom - br.top) / H];
    // (a phone's layout wherever the page's CSS lets the words run across the band: no room beside them)
    const cs = getComputedStyle(words), wr = rel(words.getBoundingClientRect()), right = wr[2] - parseFloat(cs.paddingRight) / W;
    const phone = right > .7;
    const back = words.querySelector('.nb-back'), first = back ? back.nextElementSibling : words.firstElementChild;
    const foot = 1 - 32 / H;   // (a little above the band's edge)
    let t;
    if (phone) {
      // (from the way back's own foot: its wrapper holds the room kept for the shape, band.css)
      const y0 = back ? rel((back.lastElementChild || back).getBoundingClientRect())[3] + 14 / H : (head + 14) / H;
      const y1 = first ? rel(first.getBoundingClientRect())[1] - 16 / H : .5;
      behind = behindAlways || (y1 - y0) * H < 120;
      // (behind: from the element marked data-nb-from, or the band's top, to the horizon)
      const from = words.querySelector('[data-nb-from]');
      const yb = from ? rel(from.getBoundingClientRect())[1] : (head + 14) / H;
      t = behind ? { x: .07, y: yb, w: .86, h: Math.max(.2, foot - yb) } : { x: .08, y: y0, w: .84, h: y1 - y0 };
    } else {
      behind = false;
      const x0 = Math.min(.66, Math.max(.44, right + 56 / W));
      t = { x: x0, y: (head + 22) / H, w: .95 - x0, h: Math.max(.3, foot - (head + 22) / H) };
    }
    band.classList.toggle('nb-behind', behind);
    // (the dust alone fills the band from a fixed place; a shape is fitted to its room)
    v = s === DUST ? [0, 0, 30, 0, 0, 0, 40, 0, 0] : fitShot(s.box || world.box(s.form), dir, fov, t, W / H);
    world.camera([v[0], v[1], v[2]], [v[3], v[4], v[5]], v[6], v[7], v[8], H);
    wake();
  }

  const st8 = { pick: -1, pickOn: 0, k: 0, day: 0, trails: 0, revealFrom: 1, spinFrom: 0, axisFrom: UP, pivotFrom: ORIGIN };
  const il = [0, 0, -1, 0];
  let t0 = 0, last = 0, time = 0, spin = 0, idleFrom = 0, signFrom = -1, raf = 0, seen = true, skip = false;
  const ease = x => x * x * (3 - 2 * x);
  const page = s.form === F.PAGE, WRITE = page ? 4600 : 2400;
  // a stretch of the drawing order written again, ph seconds in (as experience.js does it): faded back,
  // then the pen's front along it; 'pass' sends only the front
  function action(def, n, ph) {
    const [r0, r1] = def.range;
    if (def.mode === 'rewrite') {
      const FADE = .6, segs = Math.max(1, Math.floor((r1 - r0) / def.len)), k0 = r0 + (n % segs) * def.len, k1 = k0 + def.len;
      il[0] = k0; il[1] = k1;
      if (ph < FADE) { il[2] = k0 - .01; il[3] = ph / FADE; }
      else if (ph < FADE + def.take) { il[2] = k0 + (ph - FADE) / def.take * def.len; il[3] = 1; }
      else { il[2] = k1 + .2; il[3] = 0; }
    } else { il[0] = r0; il[1] = r1; il[3] = 0; il[2] = ph < def.take ? r0 + ph / def.take * (r1 - r0) : -1; }
  }
  function frame(now) {
    raf = 0;
    if (!seen || document.hidden || !W) return;
    if (!t0) t0 = now;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    const e = now - t0;
    // the dust gathers into the shape, then the shape writes (the page) or lights itself in
    const gather = motion ? clamp((e - 100) / 1300) : 1;
    const rev = motion ? 1.12 * clamp((e - (page ? 450 : 700)) / WRITE) : 1.12;
    const settled = gather >= 1 && rev >= 1.12;
    if (motion && !big && settled && signFrom < 0 && (skip = !skip)) { raf = requestAnimationFrame(frame); return; }   // (a phone, settled: every other frame)
    time += dt; spin += dt * motion * (s.spin || 0);
    world.setPair(F.DUST, s.form, -1);
    // the small action at rest, once the shape is whole: the page signed again when asked, else the
    // scene's own every few seconds
    let idleOn = 0;
    if (motion && settled) {
      if (signFrom >= 0 && time - signFrom < .6 + SIGN.take + .3) { action(SIGN, 0, time - signFrom); idleOn = 1; idleFrom = time + 2; }
      else if (s.idle && s.idle.every) {
        signFrom = -1;
        if (!idleFrom) idleFrom = time + 1.2;
        const t = time - idleFrom;
        if (t > 0) { const n = Math.floor(t / s.idle.every); action(s.idle, n, t - n * s.idle.every); idleOn = 1; }
      } else signFrom = -1;
    }
    Object.assign(st8, {
      time, motion, flow: 2.6, morph: ease(gather), aberr: .012, revealTo: rev, spinTo: spin + (s.spinFrom || 0),
      axisTo: s.axis || UP, pivotTo: s.pivot || ORIGIN, size: (big ? .056 : .07) * (s.size || 1), gain: (big ? .52 : .78) * (s.gain || 1),
      bgA: s.bg, bgB: s.bg, glowA: s.glow, glowB: s.glow, glow: s.glow[1], glowAt: [.5 + v[7], .5 + v[8]], grid: s.grid || 0,
      floor: s.floor ? s.floor[1] : 0, floorY: s.floor ? s.floor[0] : -2.2, orbit: s.orbit || 0, bloom: s.bloom || .7, dust: s.dust || 1, raw: s.raw || 0,
      idle: il, idleOn,
    });
    world.set(st8);
    world.render();
    if (motion) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  if (page) document.addEventListener('nb:sign', () => { if (motion) { signFrom = time; wake(); } });
  // fitted again whenever the band or its words change size (the words reflow as the web fonts arrive)
  const ro = new ResizeObserver(() => fit());
  ro.observe(band); ro.observe(words);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fit());
  new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen) wake(); }).observe(band);
  document.addEventListener('visibilitychange', wake);
  fit();
  band.classList.add('nb-on');
}
