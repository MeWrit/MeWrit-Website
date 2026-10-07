/* The experience (src/pages/experience.astro): a tall track whose stage stays pinned while the scroll
   carries one cloud of particles through the scenes (scenes.js): the opening, the five practices as
   shapes to pick from, each practice standing on its own, the close, and past it a tail where the
   shapes dissolve into dust that keeps drifting behind the rest of the page (the canvas is the
   page's backdrop). This file runs the loading screen (the dust gathers into the opening's blank
   page and its outline draws itself with the counter; as the screen lifts, the page writes itself),
   maps the scroll to the scenes, flies the camera along a smooth path through every scene's shots,
   swaps the words, pins the labels and the practices' buttons to the shapes and keeps the figures in
   the corner. The 3D is world.js, loaded on its own so the words never wait for it; without WebGL
   the words still follow the scroll, over a plain background.
   Review switches: ?static skips the loading screen. Test hook: window.mewritXp. */
import { clamp, easeOut, scramble, REDUCE, STATIC } from '../shared.js';
import { SCENES, TAIL } from './scenes.js';
import { F, OUTLINE } from './formations.js';

const sec = document.getElementById('xp');
if (sec) start();

function start() {
  const root = document.documentElement;
  document.body.classList.add('xp-page');   // the canvas behind everything needs the body to be a stacking context (xp.css)
  const track = sec.querySelector('.xp-track'), stage = sec.querySelector('.xp-stage'), canvas = sec.querySelector('.xp-canvas');
  const articles = SCENES.map(s => sec.querySelector(`.xp-scene[data-scene="${s.id}"]`));
  const rail = [...sec.querySelectorAll('.xp-rail button')];
  const readout = sec.querySelector('.xp-readout'), note = sec.querySelector('.xp-note'), hint = sec.querySelector('.xp-hint'), callLayer = sec.querySelector('.xp-callouts');
  const S = SCENES.length, W = .2;   // W: half the width of a change of shape, in scenes
  const OPEN = 0, PICK = SCENES.findIndex(s => s.form === F.CHOICE);
  // the practices along the foot: the one on screen fills as its scenes go by, then empties toward
  // the right as you move on, so no practice reads as a step done before the next
  const fills = rail.map(b => b.querySelector('b')), passed = fills.map(() => false), filled = fills.map(() => '');
  const spans = rail.map((_, j) => { const first = SCENES.findIndex(s => s.chapter === j), last = SCENES.findLastIndex(s => s.chapter === j); return [first, last + 1]; });
  const ease = t => t * t * (3 - 2 * t), mix = (a, b, k) => a + (b - a) * k;
  const nf = new Intl.NumberFormat('en-US'), fmt = n => nf.format(n);   // one formatter, made once: the figures count up every frame
  const big = !matchMedia('(pointer: coarse)').matches && Math.max(innerWidth, screen.width) >= 900;
  const N = big ? 64000 : 24000;
  const motion = REDUCE ? 0 : 1;

  // ---------- the scroll: P runs from 0 to S through the scenes, and on to S + 1 through the tail ----------
  const TAIL_LEN = 1.1;   // the tail, in stage heights (its 110svh in xp.css)
  const span = () => { const r = track.getBoundingClientRect(), hs = stage.offsetHeight, tl = hs * TAIL_LEN; return [r, r.height - hs - tl, tl]; };
  const rawP = () => { const [r, len, tl] = span(), y = -r.top; return len <= 0 ? 0 : y <= len ? y / len * S : S + (y - len) / tl; };
  const targetP = () => Math.max(0, Math.min(S + 1, rawP()));
  const scrollFor = P => { const [r, len, tl] = span(); return scrollY + r.top + (P <= S ? len * clamp(P / S) : len + (P - S) * tl); };
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
  // except the opening's page: its outline draws itself with the loading counter (keys up to
  // OUTLINE), and as the loading screen lifts it writes itself, on time rather than scroll; the
  // reveal runs on past 1 so the pen's glow leaves the last strokes
  const WRITE = 3800;
  const writeOf = now => !loaderOut ? shown / 100 * OUTLINE : !outAt || !motion ? 1.12 : OUTLINE + (1.12 - OUTLINE) * clamp((now - outAt - 250) / WRITE);
  const revAt = (i, P, now) => i === OPEN ? writeOf(now) : revealOf(i, P);

  // ---------- the camera: a smooth path through every scene's two shots ----------
  let keys = [], small = false;
  const panel = sec.querySelector('.xp-panel');
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  // the practices' shapes are laid out once, in two rows on phones (scenes.js's phone shots frame those)
  const compact = stage.clientWidth < 760 || stage.clientWidth / Math.max(1, stage.clientHeight) < .8;
  // computer screens: the scenes are framed for a 1440 x 900 stage, where the picture has ROOM (right
  // of the words, below the figures panel, above the foot); any other screen scales the picture (by
  // the field of view) and moves it into the room it has, measured from its own words and panel, next
  // to the words. Phones put the picture above the words, standing further back the narrower they are
  const ROOM = [690, 300, 1390, 810];
  function buildKeys(w, h) {
    const aspect = w / h, phone = w < 760 || aspect < .8;
    let adapt;
    if (phone) {
      const fit = Math.pow(Math.max(1, 1.6 / aspect), .62);
      adapt = ([p, t, fov]) => [t[0] + (p[0] - t[0]) * fit, t[1] + (p[1] - t[1]) * fit, t[2] + (p[2] - t[2]) * fit, t[0], t[1], t[2], fov + 4, 0, .16];
      small = true;
    } else {
      const left = stage.getBoundingClientRect().left, k = h / 900;
      // where the words end: each scene's column, or further where a title's long word runs past it
      const words = Math.max(...articles.map(a => { if (!a) return 0; const t = a.querySelector('.xp-title'); return Math.max(a.getBoundingClientRect().right, t && t.scrollWidth > t.clientWidth + 1 ? t.getBoundingClientRect().left + t.scrollWidth + 30 : 0) - left; }));
      const room = [Math.max(words - 16, w * .3), (panel ? panel.offsetTop : 120) + 180, w - 50, h - 90];
      const s = Math.max(.35, Math.min(1, (room[2] - room[0]) / ((ROOM[2] - ROOM[0]) * k), (room[3] - room[1]) / ((ROOM[3] - ROOM[1]) * k)));
      const cx = room[0] + (ROOM[2] - ROOM[0]) * k * s / 2, cy = (room[1] + room[3]) / 2;
      adapt = ([p, t, fov, sx, sy]) => {
        const ox = (ROOM[0] + ROOM[2]) / 2 - (.5 + sx) * 1440, oy = (ROOM[1] + ROOM[3]) / 2 - (.5 - sy) * 900;   // the room's centre from the point looked at, as framed
        return [...p, ...t, 2 * Math.atan(Math.tan(fov * Math.PI / 360) / s) * 180 / Math.PI, (cx - ox * k * s) / w - .5, .5 - (cy - oy * k * s) / h];
      };
      small = k * s < .75;   // drawn much smaller than framed: the labels kept off phones stay off here too
    }
    // phones take a scene's own shots for them where it has them (pa, pb): a desktop shot that stands
    // well back, to leave the words room, would put a phone, which stands further back still, past the
    // depth where the particles fade out (the practices' phone shots frame their two rows, so they
    // hold only where the shapes were laid out that way)
    const own = s => phone && s.pa && (s.form !== F.CHOICE || compact);
    keys = [];
    SCENES.forEach((s, i) => { keys.push({ P: i + (i ? W : 0), v: adapt(own(s) ? s.pa : s.a) }, { P: i + 1 - (i < S - 1 ? W : 0), v: adapt(own(s) ? s.pb : s.b) }); });
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
  const chapterOf = i => SCENES[i].chapter >= 0 ? SCENES[i].chapter : -1;   // the opening, the practices and the close belong to no practice
  function activate(i) {
    if (i === active) return;
    const prev = active; active = i;
    articles.forEach((el, j) => { if (!el) return; el.classList.toggle('on', j === i); el.classList.toggle('was', j === prev); });
    decodeAt = performance.now();
    const ch = chapterOf(i);
    rail.forEach((b, j) => b.setAttribute('aria-current', j === ch ? 'true' : 'false'));
    if (readout) {
      // the figures fade in afresh (an animation, not a class toggled off and on, which would force a
      // layout in the middle of the frame)
      if (readout.animate) readout.animate({ opacity: [0, 1] }, { duration: 600, delay: 200, easing: 'ease', fill: 'backwards' });
      readout.replaceChildren();
      rows = (SCENES[i].readout || []).map(([label, val, alt]) => {
        const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = label; row.append(dt, dd); readout.append(row);
        return { dd, val, alt, last: null };
      });
    }
    // the note under the figures, only where a scene's picture or figures are illustrative
    if (note) { note.textContent = SCENES[i].note || ''; note.hidden = !SCENES[i].note; }
  }
  function updateWords(now, rev) {
    const kick = kicks[active], e = now - decodeAt;
    if (kick && e < 900) kick.textContent = motion ? scramble(kick.dataset.text, e, 650) : kick.dataset.text;
    else if (kick && kick.textContent !== kick.dataset.text) kick.textContent = kick.dataset.text;
    rows.forEach(r => {
      let t = r.val === 'N' ? fmt(N) : typeof r.val === 'object' ? fmt(Math.round(r.val.to * easeOut(Math.min(1, rev)))) : r.val;
      if (r.alt && rev >= .98) t = r.alt;
      if (t !== r.last) { r.dd.textContent = t; r.last = t; }
    });
  }
  kicks.forEach(k => { if (k) k.dataset.text = k.textContent; });
  rail.forEach((b, j) => b.addEventListener('click', () => goTo(SCENES.findIndex(s => s.chapter === j))));
  if (hint) hint.addEventListener('click', () => goTo(1));
  // a link or button in a scene that is not showing brings its scene into view when it gets focus,
  // and so does anything on the stage once the tail has faded it
  articles.forEach((el, i) => el && el.addEventListener('focusin', e => {
    if (e.target.classList.contains('xp-pick')) return;   // the practices' buttons bring their scene in themselves
    if (i !== active || tailNow > .02) goTo(i);
  }));
  const hud = sec.querySelector('.xp-hud');
  if (hud) hud.addEventListener('focusin', () => { if (tailNow > .02) goTo(S - 1); });

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

  // the practices' buttons, one above each of their shapes: a click goes to the practice, the
  // pointer or the focus on one brightens its shape and dims the others
  const pickLayer = sec.querySelector('.xp-picks');
  const picks = [...sec.querySelectorAll('.xp-pick')].map(el => ({ el, g: +el.dataset.practice, on: false, want: false, below: false, w: 0, h: 0, stem: '' }));
  let hovered = -1, focused = -1;
  picks.forEach(p => {
    p.el.addEventListener('click', () => goTo(SCENES.findIndex(s => s.chapter === p.g)));
    p.el.addEventListener('pointerenter', () => { hovered = p.g; });
    p.el.addEventListener('pointerleave', () => { if (hovered === p.g) hovered = -1; });
    p.el.addEventListener('focus', () => {
      focused = p.g;
      // reached from the keyboard: bring the scene in with its shapes lit, so every button shows
      if (active !== PICK || revealOf(PICK, Math.min(S, Pr)) < .95) window.scrollTo({ top: scrollFor(PICK + .74), behavior: REDUCE ? 'auto' : 'smooth' });
    });
    p.el.addEventListener('blur', () => { if (focused === p.g) focused = -1; });
  });

  // ---------- the 3D world, loaded on its own ----------
  let world = null, W2 = 0, H2 = 0, CW = 0, CH = 0;   // the stage (the frame the shots are framed for), and the canvas (as tall as the screen gets)
  const loader = document.getElementById('xpLoader');
  let progress = 6, shown = 0, loaderOut = !loader || STATIC, outAt = 0;
  const t0 = performance.now(), MIN = REDUCE ? 600 : 2600;
  const setProgress = v => { progress = Math.max(progress, v); };
  function sizeUp() {
    W2 = stage.clientWidth; H2 = stage.clientHeight; CW = canvas.clientWidth || W2; CH = canvas.clientHeight || H2;
    buildKeys(W2, H2);
    // the labels' and buttons' sizes, measured together now rather than one by one as each first
    // shows, which would force a layout in the middle of a frame
    callouts.forEach(c => { c.w = c.el.lastChild.offsetWidth + (c.dx || 16) + 14; });
    picks.forEach(p => { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; });
    if (world) world.resize(CW, CH);
  }
  const ro = new ResizeObserver(sizeUp);
  ro.observe(stage); ro.observe(canvas);
  sizeUp();
  if (document.fonts) document.fonts.ready.then(sizeUp);   // the words' width, in their own fonts
  // every formation a scene takes goes up to the GPU before it is needed, one a frame, while the
  // loading screen is up (the page is drawn from the first frame): the last quarter of the counter
  const warmQ = [...new Set([F.DUST, ...SCENES.map(s => s.form)])].filter(f => f !== SCENES[OPEN].form), WARM_N = warmQ.length;
  let warmReady = false;
  const warmOne = () => { const f = warmQ.shift(); try { world.warm(f); } finally { setProgress(100 - 25 * warmQ.length / WARM_N); } };
  import('./world.js').then(({ createWorld }) => {
    setProgress(55);
    world = createWorld(canvas, { N, dpr: Math.min(devicePixelRatio || 1, big ? 2 : 1.75), bloomScale: big ? 1 : .5, trails: big && !!motion, compact });
    world.resize(CW, CH);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); world = null; sec.classList.add('xp-nogl'); });
    setProgress(70);
    requestAnimationFrame(() => {   // compile the shaders and draw once while the loading screen still covers the page
      try { frame(0, performance.now()); world && world.compile(); } catch (err) { console.warn('[xp]', err); }
      if (loader) loader.classList.add('lit');   // the particles are drawn: the loading screen's own night can go
      warmReady = true;
      setProgress(75);
    });
  }).catch(err => { console.warn('[xp] no 3D:', err); world = null; sec.classList.add('xp-nogl'); setProgress(100); });

  // ---------- the loading screen ----------
  const STEPS = ['Loading', 'Regulatory writing', 'Scientific publications', 'Medical communications', 'Training', 'AI/ML advisory', 'Ready'];
  function exitLoader() {
    if (loaderOut) return;
    loaderOut = true; outAt = performance.now(); rockFrom = time;
    loader.classList.add('out');
    root.classList.remove('xp-lock');
    // the rest of the page's frame (the site's header and the like) was under the particles while
    // loading: it comes in with the words (the stage fades in by its own transition, xp.css)
    [...document.body.children].forEach(el => {
      if (el.contains(sec) || el.matches('script, dialog, .skip') || !el.animate) return;
      el.animate({ opacity: [0, 1] }, { duration: REDUCE ? 200 : 800, delay: 150, easing: 'ease', fill: 'backwards' });
    });
    setTimeout(() => { loader.hidden = true; }, 1400);
  }
  if (loader && !STATIC) {
    root.classList.add('xp-lock');
    try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
    window.scrollTo(0, 0);
    const num = loader.querySelector('.xp-load-num'), label = loader.querySelector('.xp-load-label'), bar = loader.querySelector('.xp-load-bar i');
    const tick = now => {
      if (loaderOut) return;
      const due = clamp((now - t0) / MIN) * 100;   // never faster than MIN, so the page's outline has time to draw with it
      shown = Math.min(progress, due, shown + Math.max(.6, (Math.min(progress, due) - shown) * .12));
      num.textContent = String(Math.floor(shown)).padStart(3, '0');
      label.textContent = STEPS[Math.min(STEPS.length - 1, Math.floor(shown / 100 * STEPS.length))];
      bar.style.transform = `scaleX(${(shown / 100).toFixed(3)})`;
      if (shown >= 100) { label.textContent = 'Ready'; setTimeout(exitLoader, REDUCE ? 0 : 350); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(exitLoader, 11000);   // whatever happens, the page never stays covered
  } else if (loader) { loader.hidden = true; }

  // ---------- the pointer, anywhere on the page (the canvas is behind all of it) ----------
  const ptr = { x: 0, y: 0, on: 0, s: 0, px: 0, py: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && motion) {
    addEventListener('pointermove', e => { ptr.x = e.clientX / (CW || innerWidth) * 2 - 1; ptr.y = -(e.clientY / (CH || innerHeight) * 2 - 1); ptr.on = 1; }, { passive: true });
    document.addEventListener('pointerout', e => { if (!e.relatedTarget) ptr.on = 0; });   // gone from the window
  }

  // ---------- every frame ----------
  let Pr = 0, time = 0, last = 0, raf = 0, rockFrom = loaderOut ? 0 : 1e9, firstAt = 0, tailNow = 0, faded = '';
  const spinAcc = new Float64Array(Object.keys(F).length), pt = [0, 0, 0];   // how far each formation has turned
  const st8 = {};
  // what the tail fades away (the canvas stays: its dust is the backdrop from here on)
  const fading = ['.xp-hud', '.xp-callouts', '.xp-scenes', '.xp-shade', '.xp-frame'].map(q => sec.querySelector(q)).filter(Boolean);
  function frame(dt, now) {
    const Pt = targetP();
    Pr = motion ? Pr + (Pt - Pr) * (1 - Math.exp(-dt * 5.5)) : Pt;
    const speed = Math.min(1, Math.abs(Pt - Pr) * 2.2) * motion;   // how fast the reader is scrolling, roughly
    if (Math.abs(Pt - Pr) < 1e-4) Pr = Pt;
    time += dt;
    const P = Math.min(S, Pr), tail = clamp(Pr - S);
    tailNow = tail;
    const { k, a, b, m } = at(P);
    if (loaderOut) activate(k);   // the words wait for the loading screen to lift
    const rev = revAt(k, P, now);
    updateWords(now, rev);
    if (hint) hint.classList.toggle('gone', Pr > .15);
    fills.forEach((f, j) => {
      if (!f) return;
      const [s0, s1] = spans[j], out = P >= s1;
      if (out !== passed[j]) { passed[j] = out; f.style.transformOrigin = out ? 'right center' : ''; }
      const t = `scaleX(${(out ? 1 - clamp((P - s1) / (2 * W)) : clamp((P - s0) / (s1 - s0))).toFixed(4)})`;
      if (t !== filled[j]) { filled[j] = t; f.style.transform = t; }   // written only when it changes: a rewrite restyles
    });
    // past the last scene the stage's layers fade away; gone, they take no pointer (xp.css)
    const fo = tail > 0 ? (1 - tail).toFixed(3) : '';
    if (fo !== faded) { faded = fo; fading.forEach(el => { el.style.opacity = fo; }); stage.classList.toggle('xp-gone', tail > .6); }
    if (!world || !W2) return;

    // the shapes: which two, how far between them, how far revealed, how they turn
    const A = SCENES[a], B = SCENES[b], same = A.form === B.form;
    [A.form, B.form].forEach((f, j) => { if (j && same) return; const sa = A.form === f ? A.spin || 0 : null, sb = B.form === f ? B.spin || 0 : null; spinAcc[f] += dt * motion * (sa === null ? sb : sb === null ? sa : mix(sa, sb, m)); });
    const spinOf = i => { const s = SCENES[i], base = s.rock ? s.rock[0] * Math.sin(Math.max(0, time - rockFrom) * s.rock[1] * motion) : spinAcc[s.form]; return base + (s.spinFrom || 0) + (s.spinBy || 0) * clamp(P - i); };
    let from = A.form, to = B.form, morph = same ? 0 : m, rf = revAt(a, P, now), rt = revAt(b, P, now), sf = spinOf(same ? k : a), stt = spinOf(same ? k : b), flow = 1.6;
    if (same) { from = to = A.form; rf = rt = rev; }
    // the opening: the dust gathers into the page while the loading screen is up
    if (!firstAt) firstAt = now;
    const gather = loaderOut && !outAt ? 1 : clamp((now - firstAt - 200) / 1200);
    if (gather < 1 && a === OPEN && b === OPEN) { from = F.DUST; to = SCENES[OPEN].form; morph = motion ? ease(gather) : gather > .3 ? 1 : 0; rf = 1; rt = writeOf(now); flow = 2.6; }
    // past the close, the tail: the globe dissolves into the dust, which stays
    if (tail > 0) { from = SCENES[S - 1].form; to = F.DUST; morph = tail; rf = rev; rt = 1; stt = 0; }
    world.setPair(from, to, F.STREAMS);

    // the camera, with a slow sway and a little parallax from the pointer
    const v = camAt(P), kk = ease(m), te = ease(tail);
    // while loading the page stands in the middle of the screen, the camera aimed at its centre (the
    // words are not there yet), and it moves aside for them as they come
    const hand = !loaderOut ? 0 : !outAt || !motion ? 1 : ease(clamp((now - outAt) / 1600));
    if (hand < 1) { const q = 1 - hand; for (let j = 0; j < 3; j++) { v[j] -= v[j + 3] * q; v[j + 3] -= v[j + 3] * q; } v[7] *= hand; v[8] *= hand; }
    // in the tail it eases back, and up a little, and the picture comes to the middle
    if (te > 0) {
      const dx = v[0] - v[3], dy = v[1] - v[4], dz = v[2] - v[5], d = Math.hypot(dx, dy, dz) || 1;
      v[0] += dx / d * 7 * te; v[1] += dy / d * 7 * te + 2.5 * te; v[2] += dz / d * 7 * te; v[7] *= 1 - te; v[8] *= 1 - te;
    }
    ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * (1 - Math.exp(-dt * 3));
    ptr.px += (ptr.x * ptr.s - ptr.px) * (1 - Math.exp(-dt * 2.5)); ptr.py += (ptr.y * ptr.s - ptr.py) * (1 - Math.exp(-dt * 2.5));
    const pos = [v[0] + (Math.sin(time * .21) * .25 + ptr.px * .7) * motion, v[1] + (Math.sin(time * .17) * .15 + ptr.py * .4) * motion, v[2]];
    const surge = same || gather < 1 ? 0 : Math.sin(Math.PI * m) * motion;   // mid-change: the view widens a touch
    world.camera(pos, [v[3], v[4], v[5]], v[6] + surge * 5, v[7], v[8], H2);
    world.pointer(ptr.x, ptr.y, ptr.s * .9);

    // the look: blended between the two scenes, and into the plain night of the tail
    const bgB = te > 0 ? TAIL.bg : B.bg, glowB = te > 0 ? TAIL.glow : B.glow, lk = te > 0 ? te : kk;
    const pickOn = from === F.CHOICE && to === F.CHOICE && m === 0 && tail === 0;
    Object.assign(st8, {
      time, motion, flow, morph, trails: Math.max(motion * (gather < 1 ? .8 * (1 - gather) : .82 * surge), speed * .72), aberr: .012 + surge * .045 + speed * .03, revealFrom: rf, revealTo: rt, spinFrom: sf, spinTo: stt,
      size: (big ? .056 : .07) * mix(A.size || 1, B.size || 1, kk) * mix(1, TAIL.size, te), gain: (big ? .52 : .78) * mix(A.gain || 1, B.gain || 1, kk) * mix(1, TAIL.gain, te),
      k: lk, bgA: A.bg, bgB, glowA: A.glow, glowB, glow: mix(A.glow[1], glowB[1], lk), glowAt: [.5 + v[7], 1 - H2 * (.5 - v[8]) / (CH || H2)], grid: mix(A.grid || 0, B.grid || 0, kk) * (1 - te),
      floor: mix(A.floor ? A.floor[1] : 0, B.floor ? B.floor[1] : 0, kk), floorY: mix((A.floor || B.floor || [-2.2])[0], (B.floor || A.floor || [-2.2])[0], kk),
      orbit: mix(A.orbit || 0, B.orbit || 0, kk) * (1 - te), bloom: mix(mix(A.bloom || .7, B.bloom || .7, kk), TAIL.bloom, te),
      pick: hovered >= 0 ? hovered : focused, pickOn: pickOn ? 1 : 0, dust: mix(1, TAIL.dust, te),
    });
    world.set(st8);
    world.render();

    // the labels: the scene's own, once its shape is settled and revealed far enough
    const settled = m === 0 && tail === 0 && gather >= 1;
    callouts.forEach(c => {
      let on = settled && c.i === k && rev >= c.min && !(small && c.phone === false);
      if (on || c.on) {
        const s = SCENES[c.i], anchor = world.anchors(s.form)[c.at];
        if (anchor) {
          const p = spinY(anchor, spinOf(c.i));
          if (c.facing && !world.facing(p)) on = false;
          world.project(p, pt);
          if (pt[2] > 1 || pt[0] < 24 || pt[0] > W2 - 24 || pt[1] < 96 || pt[1] > H2 - 70) on = false;   // off the stage, or under the capsule or the practices
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

    // the practices' buttons, above their shapes once each has lit (or when one has the focus); placed
    // from their layer, wherever the scene's words have it, and kept on the stage near its edges.
    // Where the shapes stand closer than the buttons are wide, every other button hangs below its shape
    let any = false;
    picks.forEach(p => { p.want = pickOn && k === PICK && (rev >= .2 + .18 * p.g || focused === p.g); any = any || p.want || p.on; });
    if (any && pickLayer) {
      const o = pickLayer.getBoundingClientRect(), anchors = world.anchors(F.CHOICE), spin = spinOf(PICK);
      const tops = picks.map(p => { world.project(spinY(anchors['pick' + p.g], spin), pt); return [pt[0], pt[1], pt[2]]; });
      picks.forEach(p => { if (!p.w) { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; } });
      let pitch = 1e9;
      for (let g = 1; g < tops.length; g++) if (Math.abs(tops[g][1] - tops[g - 1][1]) < 40) pitch = Math.min(pitch, Math.abs(tops[g][0] - tops[g - 1][0]));
      const stagger = pitch < Math.max(...picks.map(p => p.w)) + 12;
      picks.forEach((p, g) => {
        let on = p.want;
        const below = stagger && g % 2 === 1;
        if (below) world.project(spinY(anchors['pickBase' + p.g], spin), pt); else [pt[0], pt[1], pt[2]] = tops[g];
        if (pt[2] > 1 || pt[0] < 0 || pt[0] > W2 || pt[1] < 60 || pt[1] > H2) on = false;
        const x = Math.max(8, Math.min(W2 - 8 - p.w, pt[0] - p.w / 2)), y = below ? pt[1] + 10 : pt[1] - p.h - 10;
        p.el.style.transform = `translate3d(${(x - o.left).toFixed(1)}px,${(y - o.top).toFixed(1)}px,0)`;
        const stem = `${(pt[0] - x - .5).toFixed(1)}px`;
        if (stem !== p.stem) { p.stem = stem; p.el.style.setProperty('--stem', stem); }
        if (below !== p.below) { p.below = below; p.el.classList.toggle('below', below); }
        if (on !== p.on) { p.on = on; p.el.classList.toggle('on', on); }
      });
    }
  }
  // the canvas is behind the whole page, so it draws as long as the page is in view; past the
  // experience only the dust drifts, and phones draw it every other frame there
  let skip = false;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    raf = requestAnimationFrame(loop);
    if (tailNow >= 1 && !big && (skip = !skip)) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    try { frame(dt, now); } catch (err) { console.warn('[xp]', err); }
    if (world && warmReady && warmQ.length) warmOne();
  }
  const wake = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', wake);
  wake();

  // review and test hook
  window.mewritXp = {
    get P() { return Pr; }, get scene() { return SCENES[active] && SCENES[active].id; }, get ready() { return !!world && loaderOut; },
    get tail() { return tailNow; }, get warmed() { return WARM_N - warmQ.length; }, get pick() { return hovered >= 0 ? hovered : focused; }, get outAt() { return outAt; },
    settle() { Pr = targetP(); }, scrollFor, scenes: SCENES.map(s => s.id), N,
  };
}
