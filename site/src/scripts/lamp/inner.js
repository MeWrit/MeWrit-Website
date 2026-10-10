/* The lamplight inner page (src/pages/lamplight/regulatory-writing.astro): night, then paper. It opens
   on the film's regulatory chapter (the archive world, renderer.js) where the film left it: the
   camera a little close, easing back once, while the page (drawn as on the design board, sheets.js)
   settles in and the dossier settles over it. Then nothing moves.
   Scrolling on raises the sheet of paper over the night, which dims and quietens behind it (a veil,
   the world's weight, the page's light); once the paper covers the whole screen the canvas stops
   drawing. Without WebGL or scripts the page is simply the opening's words and the paper.
   Test hook: window.mewritLampInner. */
import { clamp, REDUCE } from '../shared.js';
import { fitShot, turnDir, placement, apply } from './fit.js';
import { drawPage } from './sheets.js';
import { splitLines } from './text.js';

const open = document.querySelector('.lpi-open');
if (open) start();

function start() {
  const root = document.documentElement;
  const canvas = document.querySelector('.lp-canvas'), veil = document.querySelector('.lpi-veil'), sheet = document.querySelector('.lpi-sheet');
  const cap = open.querySelector('.lpi-cap'), head = open.querySelector('.lp-hl'), rh = open.querySelector('.lp-rh'), folio = open.querySelector('.lp-folio');
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const motion = REDUCE ? 0 : 1;
  const ease = t => t * t * (3 - 2 * t), mix = (a, b, k) => a + (b - a) * k;
  const WORLD = 'archive', YAW = 0;

  // the opening's words rise as the film's do; the cue scrolls to the paper
  root.classList.add('lpi-enter');
  const splitHead = () => { if (head) splitLines(head); };
  splitHead();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('lpi-in')));
  const cue = open.querySelector('.lp-act');
  if (cue) cue.addEventListener('click', e => { e.preventDefault(); sheet.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }); });

  // ---------- the camera: the archive's stage fitted into the opening's frame, beside the words ----------
  let world = null, W = 0, H = 0, CW = 0, CH = 0, shot = null, M = placement([0, 0, 0], [0, 0, 1]), sheetTop = 0, sheetBottom = 0, sheetW = 0, lastW = -1;
  const pxBox = el => { if (!el || !el.getClientRects().length) return null; const q = el.getBoundingClientRect(), o = open.getBoundingClientRect(); return [q.left - o.left, q.top - o.top, q.right - o.left, q.bottom - o.top]; };
  function frameShots() {
    if (!world || !W || !H) return;
    const st = world.worlds[WORLD].stage, aspect = W / H, phone = W < 760 || aspect < .8;
    const hd = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 80;
    const c = pxBox(cap), r = pxBox(rh), f = pxBox(folio);
    let x0 = phone ? .05 : .45, x1 = phone ? .95 : .96, y0 = Math.max(phone ? .08 : .1, (hd + 12) / H), y1 = phone ? .58 : .9;
    if (r) y0 = Math.max(y0, (r[3] + 18) / H);
    if (phone) { if (c) y1 = Math.min(y0 + .5, (c[1] - 24) / H); }
    else { if (c) x0 = Math.max(x0, (c[2] + 40) / W); if (f) y1 = Math.min(y1, (f[1] - 18) / H); }
    const t = { x: x0, y: y0, w: Math.max(.08, x1 - x0), h: Math.max(.08, y1 - y0) };
    const PW = 7.6, PH = 10.6, box = { c: st.anchor, size: [Math.max(st.size[0], PW + 1.6), Math.max(st.size[1], PH + 1.4), Math.max(st.size[2], 2.5)] };
    shot = fitShot(box, turnDir(st.dir, YAW), st.fov, t, aspect);
    M = placement(st.anchor, turnDir(st.dir, YAW), .45);
  }
  function sizeUp() {
    W = open.clientWidth; H = open.clientHeight; CW = canvas.clientWidth || W; CH = canvas.clientHeight || H;
    if (W !== lastW) { lastW = W; splitHead(); }
    const r = sheet.getBoundingClientRect();
    sheetTop = r.top + scrollY; sheetBottom = r.bottom + scrollY; sheetW = r.width;
    frameShots();
    if (world) world.resize(CW, CH);
  }
  new ResizeObserver(sizeUp).observe(open);
  sizeUp();
  if (document.fonts) document.fonts.ready.then(() => { lastW = -1; sizeUp(); });

  let t0 = 0, ready = false;
  import('./renderer.js').then(({ createRenderer }) => {
    world = createRenderer(canvas, { dpr: Math.min(devicePixelRatio || 1, big ? 2 : 1.75), bloomScale: big ? 1 : .5, quality: big ? 'high' : 'low' });
    world.addWorld(WORLD);
    world.resize(CW, CH);
    const scale = big ? (devicePixelRatio >= 1.5 ? 3.1 : 2.4) : 1.6;
    ['sheet', 'dossier'].forEach(f => world.addForm(f, drawPage(f, { scale })));
    frameShots();
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); world = null; document.body.classList.add('lp-nogl'); });
    requestAnimationFrame(() => { try { world.compile(); } catch (err) { console.warn('[lamp]', err); } t0 = performance.now(); ready = true; });
  }).catch(err => { console.warn('[lamp] no 3D:', err); document.body.classList.add('lp-nogl'); });

  // ---------- every frame ----------
  const WRITE = 1500, SETTLE = 1500;   // the page settles in, then the dossier settles over it
  const F = { glowAt: [.7, .5] }, pt = [0, 0, 0];
  let time = 0, last = 0, raf = 0, veiled = '', drawn = false;
  function frame(dt, now) {
    time += dt;
    // how far the paper has risen over the night: 0 while it waits below, 1 once its top reaches the
    // top of the screen; and whether it covers the whole screen (on phones, part way down)
    const vh = innerHeight, top = sheetTop - scrollY, risen = clamp((vh - top) / vh), covered = top <= 0 && sheetBottom - scrollY >= vh && sheetW >= innerWidth - 24;
    const v = (risen * .62).toFixed(3);
    if (v !== veiled) { veiled = v; veil.style.setProperty('--veil', v); }
    if (!world || !ready || !shot) return;
    if (covered && drawn) return;   // the paper hides the night: nothing to draw
    const e = motion ? now - t0 : 1e9, w1 = clamp(e / WRITE), w2 = clamp((e - WRITE) / SETTLE);
    const quiet = 1 - .45 * ease(risen);
    const pages = w2 > 0 ? [{ kind: 'sheet', m: M, loose: 0, alpha: 1, view: 0 }, { kind: 'dossier', m: M, loose: 1 - ease(w2), alpha: 1, view: 0 }] : [{ kind: 'sheet', m: M, loose: 1 - ease(w1), alpha: 1, view: 0 }];
    // the camera: the film's move in on the page undone once (it opens a little close, as the film
    // left it), then still
    const k = ease(clamp(e / 2600)), s = shot;
    const near = (1 - k) * .22 * motion;   // as close as the film's move left it (film.js, leaving)
    const pos = [0, 1, 2].map(j => mix(s[j], s[j + 3], near)), f = [s[3] - s[0], s[4] - s[1], s[5] - s[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1;
    const cam = { p: pos, yaw: Math.atan2(f[0], -f[2]) * 180 / Math.PI, pitch: Math.asin(f[1] / fl) * 180 / Math.PI, fov: s[6], sx: s[7], sy: s[8] };
    world.project(apply(M, [0, 0, 0]), pt, 0);
    const g = world.worlds[WORLD].grade;
    Object.assign(F, { time, dt, fh: H, views: [{ id: WORLD, w: quiet, cam }], study: null, mask: false, day: 0, pages, star: null, gA: g, gB: g, k: 0, glow: mix(1, .72, ease(risen)), bloom: .62, aberr: .008 });
    F.glowAt[0] = pt[0] / CW; F.glowAt[1] = 1 - pt[1] / CH;
    world.draw(F);
    drawn = true;
  }
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    try { frame(dt, now); } catch (err) { console.warn('[lamp]', err); }
  }
  const wake = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', wake);
  wake();

  window.mewritLampInner = {
    get ready() { return !!world && ready; }, get stub() { return world ? world.stub : null; },
    get settled() { return ready && (!motion || performance.now() - t0 > WRITE + SETTLE + 300); },
  };
}
