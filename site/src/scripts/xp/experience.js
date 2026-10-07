/* The experience (src/pages/experience.astro): a tall track whose stage stays pinned while the scroll
   carries one cloud of particles through the scenes (scenes.js), from a molecule to a published
   paper. This file runs the loading screen, maps the scroll to the scenes, flies the camera along
   a smooth path through every scene's shots, swaps the words, pins the labels to the shapes and
   keeps the figures in the corner. The 3D is world.js, loaded on its own so the words never wait
   for it; without WebGL the words still follow the scroll, over a plain background.
   Review switches: ?static skips the loading screen. Test hook: window.mewritXp. */
import { clamp, easeOut, scramble, REDUCE, STATIC } from '../shared.js';
import { SCENES } from './scenes.js';
import { F } from './formations.js';

const sec = document.getElementById('xp');
if (sec) start();

function start() {
  const root = document.documentElement;
  const track = sec.querySelector('.xp-track'), stage = sec.querySelector('.xp-stage'), canvas = sec.querySelector('.xp-canvas');
  const articles = SCENES.map(s => sec.querySelector(`.xp-scene[data-scene="${s.id}"]`));
  const rail = [...sec.querySelectorAll('.xp-rail button')];
  const readout = sec.querySelector('.xp-readout'), hint = sec.querySelector('.xp-hint'), callLayer = sec.querySelector('.xp-callouts');
  const S = SCENES.length, W = .2;   // W: half the width of a change of shape, in scenes
  // the chapters along the foot: each fills as its scenes go by
  const fills = rail.map(b => b.querySelector('b'));
  const spans = rail.map((_, j) => { const first = SCENES.findIndex(s => s.chapter === j), last = SCENES.findLastIndex(s => s.chapter === j); return [first, last + 1]; });
  const ease = t => t * t * (3 - 2 * t), mix = (a, b, k) => a + (b - a) * k;
  const fmt = n => n.toLocaleString('en-US');
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const N = big ? 64000 : 24000;
  const motion = REDUCE ? 0 : 1;

  // ---------- the scroll: P runs from 0 to S through the scenes ----------
  const targetP = () => {
    const r = track.getBoundingClientRect(), len = r.height - stage.offsetHeight;
    return len > 0 ? clamp(-r.top / len) * S : 0;
  };
  const scrollFor = P => {
    const r = track.getBoundingClientRect(), len = r.height - stage.offsetHeight;
    return scrollY + r.top + len * clamp(P / S);
  };
  const goTo = i => window.scrollTo({ top: scrollFor(i + (i ? W : 0) + .04), behavior: REDUCE ? 'auto' : 'smooth' });
  // the scene the words show (k), and the two scenes the shape is between (a to b, m of the way)
  const at = P => {
    const k = Math.min(S - 1, Math.max(0, Math.floor(P))), l = P - k;
    let a = k, b = k, m = 0;
    if (l > 1 - W && k < S - 1) { b = k + 1; m = (l - 1 + W) / (2 * W); }
    else if (l < W && k > 0) { a = k - 1; m = (l + W) / (2 * W); }
    return { k, a, b, m };
  };
  // how far a scene's shape has revealed itself: over the first scene of its run of scenes with
  // the same shape, and complete from then on
  const runStart = SCENES.map((s, i) => { let r = i; while (r > 0 && SCENES[r - 1].form === s.form) r--; return r; });
  const revealOf = (i, P) => { const r = runStart[i], s0 = r + (r ? W : 0), s1 = r + 1 - W; return clamp((P - s0) / ((s1 - s0) * .85)); };

  // ---------- the camera: a smooth path through every scene's two shots ----------
  let keys = [], isPhone = false;
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  function buildKeys(w, h) {
    const aspect = w / h, phone = w < 760 || aspect < .8;
    isPhone = phone;
    const fit = Math.pow(Math.max(1, 1.6 / aspect), .62);   // narrower screens stand further back
    const adapt = ([p, t, fov, sx, sy]) => [t[0] + (p[0] - t[0]) * fit, t[1] + (p[1] - t[1]) * fit, t[2] + (p[2] - t[2]) * fit, t[0], t[1], t[2],
      fov + (phone ? 4 : 0), phone ? 0 : aspect < 1.25 ? sx * .6 : sx, phone ? .16 : sy];
    keys = [];
    SCENES.forEach((s, i) => { keys.push({ P: i + (i ? W : 0), v: adapt(s.a) }, { P: i + 1 - (i < S - 1 ? W : 0), v: adapt(s.b) }); });
  }
  function camAt(P) {
    let i = 0;
    while (i < keys.length - 2 && P > keys[i + 1].P) i++;
    const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
    const t = clamp((P - k1.P) / (k2.P - k1.P || 1));
    return k1.v.map((_, j) => cr(k0.v[j], k1.v[j], k2.v[j], k3.v[j], t));
  }

  // ---------- the words, the rail, the figures ----------
  let active = -1, decodeAt = 0, rows = [];
  const kicks = articles.map(a => a && a.querySelector('.xp-kick'));
  const chapterOf = i => SCENES[i].chapter >= 0 ? SCENES[i].chapter : i ? 6 : -1;
  function activate(i) {
    if (i === active) return;
    const prev = active; active = i;
    articles.forEach((el, j) => { if (!el) return; el.classList.toggle('on', j === i); el.classList.toggle('was', j === prev); });
    decodeAt = performance.now();
    const ch = chapterOf(i);
    rail.forEach((b, j) => b.setAttribute('aria-current', j === ch ? 'step' : 'false'));
    if (readout) {
      readout.classList.remove('on'); void readout.offsetWidth; readout.classList.add('on');
      readout.replaceChildren();
      rows = (SCENES[i].readout || []).map(([label, val, alt]) => {
        const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = label; row.append(dt, dd); readout.append(row);
        return { dd, val, alt, last: null };
      });
    }
  }
  function updateWords(now, rev) {
    const kick = kicks[active], e = now - decodeAt;
    if (kick && e < 900) kick.textContent = motion ? scramble(kick.dataset.text, e, 650) : kick.dataset.text;
    else if (kick && kick.textContent !== kick.dataset.text) kick.textContent = kick.dataset.text;
    rows.forEach(r => {
      let t = r.val === 'N' ? fmt(N) : typeof r.val === 'object' ? fmt(Math.round(r.val.to * easeOut(rev))) : r.val;
      if (r.alt && rev >= .98) t = r.alt;
      if (t !== r.last) { r.dd.textContent = t; r.last = t; }
    });
  }
  kicks.forEach(k => { if (k) k.dataset.text = k.textContent; });
  rail.forEach((b, j) => b.addEventListener('click', () => goTo(SCENES.findIndex(s => s.chapter === j))));
  if (hint) hint.addEventListener('click', () => goTo(1));
  // a link or button in a scene that is not showing brings its scene into view when it gets focus
  articles.forEach((el, i) => el && el.addEventListener('focusin', () => { if (i !== active) goTo(i); }));

  // the labels pinned to the shapes
  const callouts = [];
  SCENES.forEach((s, i) => (s.callouts || []).forEach(c => {
    const el = document.createElement('div');
    el.className = 'xp-co'; el.dataset.side = c.side || 'r';
    const dx = c.dx || 16, dy = c.dy || 12;   // where the label sits from its point, and the leader line between
    el.style.cssText = `--dx:${dx}px;--dy:${dy}px;--len:${Math.hypot(dx, dy).toFixed(1)}px;--ang:${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1)}deg`;
    el.innerHTML = '<i></i><span></span>'; el.lastChild.textContent = c.label;
    callLayer.append(el); callouts.push({ ...c, el, i, on: false });
  }));
  const spinY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]]; };

  // ---------- the 3D world, loaded on its own ----------
  let world = null, W2 = 0, H2 = 0;
  const loader = document.getElementById('xpLoader');
  let progress = 6, shown = 0, loaderOut = !loader || STATIC;
  const t0 = performance.now(), MIN = REDUCE ? 600 : 2600;
  const setProgress = v => { progress = Math.max(progress, v); };
  function sizeUp() {
    W2 = stage.clientWidth; H2 = stage.clientHeight;
    buildKeys(W2, H2);
    if (world) world.resize(W2, H2);
  }
  new ResizeObserver(sizeUp).observe(stage);
  sizeUp();
  import('./world.js').then(({ createWorld }) => {
    setProgress(55);
    world = createWorld(canvas, { N, dpr: Math.min(devicePixelRatio || 1, big ? 2 : 1.75), bloomScale: big ? 1 : .5, trails: big && !!motion });
    world.resize(W2, H2);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); world = null; sec.classList.add('xp-nogl'); });
    setProgress(80);
    requestAnimationFrame(() => {   // compile the shaders and draw once while the loading screen still covers it
      try { frame(0, performance.now()); world && world.compile(); } catch (err) { console.warn('[xp]', err); }
      setProgress(100);
    });
  }).catch(err => { console.warn('[xp] no 3D:', err); world = null; sec.classList.add('xp-nogl'); setProgress(100); });

  // ---------- the loading screen ----------
  const STEPS = ['Synthesising', 'Enrolling', 'Randomising', 'Reviewing', 'Analysing', 'Reporting', 'Publishing'];
  let assembleAt = 0;
  function exitLoader() {
    if (loaderOut) return;
    loaderOut = true;
    // the drawing flies to where the 3D molecule forms, at the size it will have there
    const art = loader.querySelector('.xp-load-art');
    if (world && art && W2) {
      const v = camAt(Pr), d = Math.hypot(v[0] - v[3], v[1] - v[4], v[2] + 7 - v[5]);   // 7: the camera starts that far back
      const r = art.getBoundingClientRect(), svg = r.width / 460, up = 20 * svg;   // the molecule sits 20 units above the drawing's centre
      art.style.transformOrigin = `50% ${(r.height / 2 - up).toFixed(1)}px`;
      art.style.setProperty('--ex', `${(v[7] * W2).toFixed(1)}px`);
      art.style.setProperty('--ey', `${(-v[8] * H2 + up).toFixed(1)}px`);
      art.style.setProperty('--es', (H2 / (2 * d * Math.tan(v[6] * Math.PI / 360)) / (34 * svg)).toFixed(3));
    }
    loader.classList.add('out');
    root.classList.remove('xp-lock');
    assembleAt = performance.now(); rockFrom = time;
    setTimeout(() => { loader.hidden = true; }, 1400);
  }
  if (loader && !STATIC) {
    root.classList.add('xp-lock');
    try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
    window.scrollTo(0, 0);
    const num = loader.querySelector('.xp-load-num'), label = loader.querySelector('.xp-load-label'), bar = loader.querySelector('.xp-load-bar i');
    const tick = now => {
      if (loaderOut) return;
      const time = clamp((now - t0) / MIN) * 100;   // the counter never outruns the drawing
      shown = Math.min(progress, time, shown + Math.max(.6, (Math.min(progress, time) - shown) * .12));
      num.textContent = String(Math.floor(shown)).padStart(3, '0');
      label.textContent = STEPS[Math.min(STEPS.length - 1, Math.floor(shown / 100 * STEPS.length))];
      bar.style.transform = `scaleX(${(shown / 100).toFixed(3)})`;
      if (shown >= 100) { label.textContent = 'Ready'; setTimeout(exitLoader, REDUCE ? 0 : 350); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(exitLoader, 11000);   // whatever happens, the page never stays covered
  } else if (loader) { loader.hidden = true; }

  // ---------- the pointer ----------
  const ptr = { x: 0, y: 0, on: 0, s: 0, px: 0, py: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && motion) {
    stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height * 2 - 1); ptr.on = 1; });
    stage.addEventListener('pointerleave', () => { ptr.on = 0; });
  }

  // ---------- every frame ----------
  let Pr = 0, time = 0, last = 0, raf = 0, near = true, rockFrom = 0;
  const spinAcc = new Float64Array(10), pt = [0, 0, 0];
  const st8 = {};
  function frame(dt, now) {
    const Pt = targetP();
    Pr = motion ? Pr + (Pt - Pr) * (1 - Math.exp(-dt * 5.5)) : Pt;
    const speed = Math.min(1, Math.abs(Pt - Pr) * 2.2) * motion;   // how fast the reader is scrolling, roughly
    if (Math.abs(Pt - Pr) < 1e-4) Pr = Pt;
    time += dt;
    const { k, a, b, m } = at(Pr);
    activate(k);
    const rev = revealOf(k, Pr);
    updateWords(now, rev);
    if (hint) hint.classList.toggle('gone', Pr > .15);
    fills.forEach((f, j) => { if (f) f.style.transform = `scaleX(${clamp((Pr - spans[j][0]) / (spans[j][1] - spans[j][0])).toFixed(4)})`; });
    if (!world || !W2) return;

    // the shapes: which two, how far between them, how far revealed, how they turn
    const A = SCENES[a], B = SCENES[b], same = A.form === B.form;
    [A.form, B.form].forEach((f, j) => { if (j && same) return; const sa = A.form === f ? A.spin || 0 : null, sb = B.form === f ? B.spin || 0 : null; spinAcc[f] += dt * motion * (sa === null ? sb : sb === null ? sa : mix(sa, sb, m)); });
    const spinOf = i => { const s = SCENES[i], base = s.rock ? s.rock[0] * Math.sin(Math.max(0, time - rockFrom) * s.rock[1] * motion) : spinAcc[s.form]; return base + (s.spinFrom || 0) + (s.spinBy || 0) * clamp(Pr - i); };
    let from = A.form, to = B.form, morph = same ? 0 : m, rf = revealOf(a, Pr), rt = revealOf(b, Pr), sf = spinOf(same ? k : a), stt = spinOf(same ? k : b), flow = 1.6;
    if (same) { from = to = A.form; rf = rt = rev; }
    // the opening: the dust gathers into the molecule as the loading screen lifts
    const asm = !loaderOut ? 0 : assembleAt ? clamp((now - assembleAt) / 2400) : 1;
    if (asm < 1 && from === F.MOLECULE && to === F.MOLECULE) { from = F.DUST; morph = motion ? 1 - (1 - asm) * (1 - asm) : asm > .3 ? 1 : 0; rf = 1; rt = 1; flow = 2.6; }
    world.setPair(from, to, F.STREAMS);

    // the camera, with a slow sway and a little parallax from the pointer
    const v = camAt(Pr), kk = ease(m);
    ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * (1 - Math.exp(-dt * 3));
    ptr.px += (ptr.x * ptr.s - ptr.px) * (1 - Math.exp(-dt * 2.5)); ptr.py += (ptr.y * ptr.s - ptr.py) * (1 - Math.exp(-dt * 2.5));
    const pull = (1 - easeOut(asm)) * 7;
    const pos = [v[0] + (Math.sin(time * .21) * .25 + ptr.px * .7) * motion, v[1] + (Math.sin(time * .17) * .15 + ptr.py * .4) * motion, v[2] + pull];
    const surge = same || asm < 1 ? 0 : Math.sin(Math.PI * m) * motion;   // mid-change: the view widens a touch
    world.camera(pos, [v[3], v[4], v[5]], v[6] + surge * 5, v[7], v[8]);
    world.pointer(ptr.x, ptr.y, ptr.s * .9);

    // the look: blended between the two scenes
    Object.assign(st8, {
      time, motion, flow, morph, trails: Math.max(motion * (asm < 1 ? .8 * (1 - asm) : .82 * surge), speed * .72), aberr: .012 + surge * .045 + speed * .03, revealFrom: rf, revealTo: rt, spinFrom: sf, spinTo: stt,
      size: (big ? .056 : .07) * mix(A.size || 1, B.size || 1, kk), gain: (big ? .52 : .78) * mix(A.gain || 1, B.gain || 1, kk), k: kk, bgA: A.bg, bgB: B.bg, glowA: A.glow, glowB: B.glow, glow: mix(A.glow[1], B.glow[1], kk),
      glowAt: [.5 + v[7], .5 + v[8]], grid: mix(A.grid || 0, B.grid || 0, kk),
      floor: mix(A.floor ? A.floor[1] : 0, B.floor ? B.floor[1] : 0, kk), floorY: mix((A.floor || B.floor || [-2.2])[0], (B.floor || A.floor || [-2.2])[0], kk),
      rings: mix(A.rings || 0, B.rings || 0, kk) * (asm < 1 ? asm : 1), orbit: mix(A.orbit || 0, B.orbit || 0, kk), bloom: mix(A.bloom || .7, B.bloom || .7, kk),
    });
    world.set(st8);
    world.render();

    // the labels: the scene's own, once its shape is settled and revealed far enough
    const settled = m === 0 && asm >= 1;
    callouts.forEach(c => {
      let on = settled && c.i === k && rev >= c.min && !(isPhone && c.phone === false);
      if (on || c.on) {
        const s = SCENES[c.i], anchor = world.anchors(s.form)[c.at];
        if (anchor) {
          const p = spinY(anchor, spinOf(c.i));
          if (c.facing && !world.facing(p)) on = false;
          world.project(p, pt);
          if (pt[2] > 1 || pt[0] < 24 || pt[0] > W2 - 24 || pt[1] < 96 || pt[1] > H2 - 70) on = false;   // off the stage, or under the capsule or the chapters
          c.el.style.transform = `translate3d(${pt[0].toFixed(1)}px,${pt[1].toFixed(1)}px,0)`;
          // the label goes to whichever side of its point has room
          if (on) {
            if (!c.w) c.w = c.el.lastChild.offsetWidth + (c.dx || 16) + 14;
            const side = pt[0] + c.w > W2 - 10 ? 'l' : pt[0] - c.w < 10 ? 'r' : c.side || 'r';
            if (c.el.dataset.side !== side) c.el.dataset.side = side;
          }
        } else on = false;
      }
      if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
    });
  }
  function loop(now) {
    raf = 0;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    try { frame(dt, now); } catch (err) { console.warn('[xp]', err); }
    if (near && !document.hidden) raf = requestAnimationFrame(loop);
  }
  const wake = () => { if (!raf && near && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { near = e.isIntersecting; wake(); }, { rootMargin: '200px 0px' }).observe(track);
  document.addEventListener('visibilitychange', wake);
  wake();

  // review and test hook
  window.mewritXp = {
    get P() { return Pr; }, get scene() { return SCENES[active] && SCENES[active].id; }, get ready() { return !!world && loaderOut; },
    settle() { Pr = targetP(); }, scrollFor, scenes: SCENES.map(s => s.id), N,
  };
}
