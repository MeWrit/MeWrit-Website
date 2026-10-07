/* Hero ribbons: slow silk ribbons drawn on a canvas. Each ribbon is a bundle of thin lines
   whose spread twists along its length. They flow through the copy, never behind the
   hero's drawing: on wide screens across the left column, fading out before the panel's
   left edge; in one column through the copy at the top, fading out before the panel's top.
   Right under the copy's text they are veiled, so the words keep their contrast.
   All of the fading happens inside the canvas, and nothing is drawn past the panel's edge:
   a CSS mask on a canvas that redraws every frame can drop out for a frame on some graphics
   hardware, which flashed the ribbons across the panel. Drawing runs at 60 to 72 frames a
   second (thin lines stepped at 30 a second shimmer) and pauses when the hero is off screen
   or the tab is hidden.
   On the home page they also flow behind the loading intro: a second canvas in the intro's
   backdrop draws the same ribbons, on the same clock and at the same place on the screen,
   across the whole width, with the logo veiled instead of the copy. The hero's own ribbons
   start underneath while the intro is still playing, so when the backdrop dissolves the
   ribbons carry straight on into the page while the copy and the panel appear around them. */
import { $, clamp, REDUCE, STATIC, INTRO, whenPrepared } from './shared.js';

const root = document.documentElement;
const canvas = $('ribbons');
if (canvas && root.dataset.hero !== 'drawing') {
  const LAYOUTS = {
    // two columns (900px and up): one bundle rises behind the headline, one runs through the
    // band above the copy, one through the band below it
    wide: { sweep: .55, ribbons: [
      { rgb: [43, 74, 146], a: .15, n: 26, y0: .62, y1: .30, amp: .05, spread: .07, sp: .16, ph: 0.0 },
      { rgb: [28, 52, 114], a: .11, n: 22, y0: .88, y1: .74, amp: .03, spread: .045, sp: .12, ph: 2.1 },
      { rgb: [224, 122, 31], a: .17, n: 20, y0: .30, y1: .17, amp: .035, spread: .04, sp: .19, ph: 4.2 },
    ] },
    // one column: a band through the copy at the top of the hero
    narrow: { sweep: 1, ribbons: [
      { rgb: [43, 74, 146], a: .15, n: 26, y0: .50, y1: .30, amp: .035, spread: .05, sp: .16, ph: 0.0 },
      { rgb: [28, 52, 114], a: .11, n: 22, y0: .56, y1: .42, amp: .03, spread: .04, sp: .12, ph: 2.1 },
      { rgb: [224, 122, 31], a: .17, n: 20, y0: .40, y1: .16, amp: .03, spread: .035, sp: .19, ph: 4.2 },
    ] },
  };
  // a soft-edged veil over the copy. How much each text can take depends on its contrast
  // headroom: the large, near-black headline keeps over 9:1 with the ribbons at 45% behind it,
  // so they visibly flow behind it; the small and lighter texts keep a tenth of the ribbons,
  // and the eyebrow (orange text, 4.8:1 at best) none.
  const VEIL = [
    { sel: '.hero h1', a: .55, lines: true },
    // the headline's orange word is far lighter than the rest of it: it keeps a twentieth
    { sel: '.hero h1 em', a: .9, lines: true },
    { sel: '.hero .eyebrow', a: 1, lines: true },
    { sel: '.hero .lead, .hero-founder b, .hero-founder span, .hero-stats', a: .9, lines: true },
    { sel: '#heroCtas .btn, .hero-founder img', a: .9, lines: false },
  ];
  const WIDE = matchMedia('(min-width: 900px)');
  const smooth = x => x * x * (3 - 2 * x);
  // the ribbons are laid out on the hero (its size and layout), wherever they are drawn
  let W = 0, H = 0, layout = LAYOUTS.narrow;
  function geometry() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    layout = WIDE.matches ? LAYOUTS.wide : LAYOUTS.narrow;
    return r;
  }
  // a canvas the ribbons are drawn on: its context, scale, offset from the hero (CSS px) and matte
  const view = el => ({ canvas: el, ctx: el.getContext('2d'), dpr: 1, ox: 0, oy: 0, grads: [], matte: null, clip: null });
  function size(v, r) {
    v.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    // never 0 by 0 (a minimised window can report no size): the matte must stay drawable
    v.canvas.width = Math.max(1, Math.round(r.width * v.dpr)); v.canvas.height = Math.max(1, Math.round(r.height * v.dpr));
    v.grads = layout.ribbons.map(rb => {   // each ribbon fades in from the left edge
      const g = v.ctx.createLinearGradient(0, 0, W, 0), c = rb.rgb.join(',');
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.12, `rgba(${c},1)`); g.addColorStop(1, `rgba(${c},1)`);
      return g;
    });
  }
  // the shadow-only trick: only the blurred shadow of a box lands on the canvas (the box itself
  // is drawn far off to the left). Padded by the blur's reach, so it is at full strength over
  // the whole box.
  function veilBox(m, dpr, x, y, w, h, pad, blur) {
    const OFF = 1e5;
    m.shadowBlur = blur * dpr; m.shadowOffsetX = OFF;
    if (w >= 1 && h >= 1) m.fillRect((x - pad) * dpr - OFF, (y - pad) * dpr, (w + 2 * pad) * dpr, (h + 2 * pad) * dpr);
  }

  /* ---- the hero's canvas */
  const hero = view(canvas);
  let area = { x: 0, y: 0 };   // the ribbons stay left of area.x and above area.y (CSS px)
  // vertical offset an element is currently shifted by (the hero's entrance transitions)
  const shiftY = el => {
    let ty = 0;
    for (let e = el; e && !e.classList.contains('hero'); e = e.parentElement) {
      const m = getComputedStyle(e).transform;
      if (m && m !== 'none') ty += new DOMMatrixReadOnly(m).m42;
    }
    return ty;
  };
  // where the ribbons must have faded out: the panel's left edge (two columns) or top (one)
  function fitArea() {
    area = { x: W, y: H };
    const vis = $('heroVisual');
    if (!vis || !vis.offsetWidth) return;
    const hr = canvas.getBoundingClientRect(), vr = vis.getBoundingClientRect();
    if (layout === LAYOUTS.wide) area.x = Math.max(0, vr.left - hr.left);
    else area.y = Math.max(0, vr.top - shiftY(vis) - hr.top);
    hero.clip = area;
  }
  // the matte: where the ribbons may show and how strongly. Soft edges in from the hero's
  // top, out before the panel and the hero's foot, and the veil cut out over the copy.
  // Applied to every frame in one step.
  function buildMatte() {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    const m = c.getContext('2d'), dpr = hero.dpr;
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = layout === LAYOUTS.wide;
    // full strength until 18% of the width before the panel, gone 4% before it: the ribbons
    // never reach the panel, so they never seem to touch or pass over it
    if (wide) {
      const xe = Math.max(1, area.x), g = m.createLinearGradient(0, 0, xe, 0);
      g.addColorStop(0, '#000'); g.addColorStop(clamp(1 - .18 * W / xe), '#000');
      g.addColorStop(clamp(1 - .04 * W / xe), 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(0, 0, area.x, H);
    } else { m.fillStyle = '#000'; m.fillRect(0, 0, W, area.y); }
    // fade in below the header, and out at the foot (wide) or before the panel (one column),
    // gone 3% of the height above the panel
    const s1 = .12, e2 = clamp(wide ? .93 : area.y / H - .03), s2 = clamp(Math.min(wide ? .86 : e2 - .12, e2));
    const gv = m.createLinearGradient(0, 0, 0, H);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(Math.min(s1, s2), '#000');
    gv.addColorStop(Math.max(s1, s2), '#000'); gv.addColorStop(Math.max(s1, e2), 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
    m.globalCompositeOperation = 'destination-in';
    m.fillStyle = gv; m.fillRect(0, 0, W, H);
    // the veil over the copy, padded by the blur's reach so it is at full strength over every letter
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'destination-out';
    const cr = canvas.getBoundingClientRect();
    for (const { sel, a, lines } of VEIL) {
      m.fillStyle = m.shadowColor = `rgba(0,0,0,${a})`;
      document.querySelectorAll(sel).forEach(el => {
        const dy = shiftY(el);
        if (lines) {   // text: one box per line, hugging the words
          const rg = document.createRange(); rg.selectNodeContents(el);
          for (const r of rg.getClientRects()) veilBox(m, dpr, r.left - cr.left, r.top - dy - cr.top, r.width, r.height, 10, 10);
        } else { const r = el.getBoundingClientRect(); veilBox(m, dpr, r.left - cr.left, r.top - dy - cr.top, r.width, r.height, 10, 10); }
      });
    }
    hero.matte = c;
  }
  function resizeHero() {
    const r = geometry();
    size(hero, r);
    fitArea();
    buildMatte();
  }

  /* ---- the intro's canvas (home page, while the loading intro plays) */
  const introEl = INTRO && !root.classList.contains('logo-landed') ? $('introRibbons') : null;
  const intro = introEl && introEl.offsetWidth ? view(introEl) : null;
  // the same soft edges at the top and the foot as the hero's, nothing at the sides, and the logo
  // veiled. Under the logo itself the veil is full, so the page-coloured curtain that uncovers its
  // letters never shows against the ribbons.
  function buildIntroMatte(r) {
    const c = document.createElement('canvas'); c.width = intro.canvas.width; c.height = intro.canvas.height;
    const m = c.getContext('2d'), dpr = intro.dpr, wide = layout === LAYOUTS.wide;
    m.setTransform(dpr, 0, 0, dpr, intro.ox * dpr, intro.oy * dpr);   // hero coordinates
    const gv = m.createLinearGradient(0, 0, 0, H);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(.12, '#000');
    gv.addColorStop(wide ? .86 : .78, '#000'); gv.addColorStop(wide ? .93 : .92, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = gv; m.fillRect(-intro.ox, -intro.oy, r.width, r.height);
    const logo = $('introLogo');
    if (logo && logo.offsetWidth) {   // its place in the overlay, which is where this canvas sits
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.globalCompositeOperation = 'destination-out';
      m.fillStyle = m.shadowColor = '#000';
      veilBox(m, dpr, logo.offsetLeft, logo.offsetTop, logo.offsetWidth, logo.offsetHeight, 30, 26);
    }
    intro.matte = c;
  }
  function resizeIntro() {
    const hr = geometry(), r = intro.canvas.getBoundingClientRect();
    size(intro, r);
    intro.ox = hr.left - r.left; intro.oy = hr.top - r.top;
    buildIntroMatte(r);
  }

  /* ---- drawing: both canvases from one clock */
  let mid = new Float64Array(0), spread = new Float64Array(0);
  function strokes(ctx, grads, t, x1) {
    const step = W < 700 ? 8 : 10, count = Math.floor((x1 + 20) / step) + 1;
    if (mid.length < count) { mid = new Float64Array(count); spread = new Float64Array(count); }
    layout.ribbons.forEach((rb, ri) => {
      const tt = t * rb.sp;
      // every line of a bundle shares its centre and its spread: worked out once per bundle
      for (let k = 0; k < count; k++) {
        const xn = (k * step - 20) / W;
        const base = (rb.y0 + (rb.y1 - rb.y0) * smooth(clamp(xn / layout.sweep))) * H;
        const wave = rb.amp * H * (Math.sin(xn * 2.4 * Math.PI + tt + rb.ph) * .7 + Math.sin(xn * 4.6 * Math.PI - tt * .6 + rb.ph * 1.7) * .3);
        mid[k] = base + wave;
        spread[k] = 2 * rb.spread * H * Math.sin(xn * 1.7 * Math.PI + tt * .8 + rb.ph * .5);
      }
      ctx.strokeStyle = grads[ri];
      ctx.lineWidth = 1;
      for (let i = 0; i < rb.n; i++) {
        const u = i / (rb.n - 1) - .5;
        ctx.globalAlpha = rb.a * (.35 + .65 * (1 - Math.abs(u) * 2));
        ctx.beginPath();
        ctx.moveTo(-20, mid[0] + u * spread[0]);
        for (let k = 1; k < count; k++) ctx.lineTo(k * step - 20, mid[k] + u * spread[k]);
        ctx.stroke();
      }
    });
  }
  function paint(v, t) {
    const { ctx } = v;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, v.canvas.width, v.canvas.height);
    ctx.setTransform(v.dpr, 0, 0, v.dpr, v.ox * v.dpr, v.oy * v.dpr);
    ctx.save();
    // nothing is ever drawn past the hero's panel
    if (v.clip) { ctx.beginPath(); ctx.rect(0, 0, v.clip.x, v.clip.y); ctx.clip(); }
    strokes(ctx, v.grads, t, (v.clip ? Math.min(W, v.clip.x) : W) + 20);
    ctx.restore();
    // the fades and the veil, in one step
    if (v.matte) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(v.matte, 0, 0);
      ctx.restore();
    }
  }
  let clock = 0, last = null, raf = 0, onScreen = true, allowed = false, drawn = 0, introLive = false;
  const heroLive = () => allowed && onScreen;
  function drawAll(t) {
    if (introLive) paint(intro, t);
    if (heroLive()) paint(hero, t);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);   // first, so nothing below can ever stop the loop
    if (last !== null) clock += Math.min(now - last, 100);
    last = now;
    // every frame on a 60 Hz screen, every other one on 120 to 144 Hz screens
    if (now - drawn >= 12) { drawAll(clock / 1000); drawn = now; }
  }
  function update() {
    const run = !REDUCE && !STATIC && !document.hidden && (introLive || heroLive());
    if (run && !raf) { last = null; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  new ResizeObserver(() => { if (allowed) { resizeHero(); paint(hero, clock / 1000); } }).observe(canvas);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update(); }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  // text can rewrap and the panel resize when the fonts arrive: refit then
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (allowed) { fitArea(); buildMatte(); paint(hero, clock / 1000); } });
  whenPrepared(() => { allowed = true; resizeHero(); paint(hero, clock / 1000); update(); });

  if (intro) {
    introLive = true;
    resizeIntro(); paint(intro, 0);
    requestAnimationFrame(() => intro.canvas.classList.add('on'));   // fades in with the backdrop
    new ResizeObserver(() => { if (introLive) { resizeIntro(); paint(intro, clock / 1000); } }).observe(intro.canvas);
    // the intro is over (or was cut short): only the hero's ribbons from here on
    document.addEventListener('mewrit:introdone', () => {
      introLive = false; intro.canvas.width = intro.canvas.height = 0; intro.matte = null; update();
    }, { once: true });
    update();
  }

  // review and test hooks
  window.mewritRibbons = {
    seek(ms) { clock = ms; drawAll(ms / 1000); },
    isRunning: () => !!raf, area: () => ({ ...area }), clock: () => clock, introLive: () => introLive,
    refit() { if (allowed) { resizeHero(); paint(hero, clock / 1000); } },
  };
}
