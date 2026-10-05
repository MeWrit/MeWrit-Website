/* Hero ribbons: slow silk ribbons drawn on a canvas. Each ribbon is a bundle of thin lines
   whose spread twists along its length. They flow through the copy, never behind the
   heartbeat panel: on wide screens across the left column, fading out before the panel's
   left edge; in one column through the copy at the top, fading out before the panel's top.
   Right under the copy's text they are veiled, so the words keep their contrast.
   All of the fading happens inside the canvas, and nothing is drawn past the panel's edge:
   a CSS mask on a canvas that redraws every frame can drop out for a frame on some graphics
   hardware, which flashed the ribbons across the panel. Drawing runs at 60 to 72 frames a
   second (thin lines stepped at 30 a second shimmer) and pauses when the hero is off screen
   or the tab is hidden. */
import { $, clamp, REDUCE, STATIC, whenPrepared } from './shared.js';

const canvas = $('ribbons');
if (canvas && document.documentElement.dataset.hero !== 'ecg') {
  const ctx = canvas.getContext('2d');
  const LAYOUTS = {
    // two columns (900px and up): one bundle rises behind the headline, one runs through the
    // band above the copy, one through the band below it
    wide: { sweep: .55, ribbons: [
      { rgb: [46, 80, 142], a: .15, n: 26, y0: .62, y1: .30, amp: .05, spread: .07, sp: .16, ph: 0.0 },
      { rgb: [30, 58, 110], a: .11, n: 22, y0: .88, y1: .74, amp: .03, spread: .045, sp: .12, ph: 2.1 },
      { rgb: [224, 122, 31], a: .17, n: 20, y0: .30, y1: .17, amp: .035, spread: .04, sp: .19, ph: 4.2 },
    ] },
    // one column: a band through the copy at the top of the hero
    narrow: { sweep: 1, ribbons: [
      { rgb: [46, 80, 142], a: .15, n: 26, y0: .50, y1: .30, amp: .035, spread: .05, sp: .16, ph: 0.0 },
      { rgb: [30, 58, 110], a: .11, n: 22, y0: .56, y1: .42, amp: .03, spread: .04, sp: .12, ph: 2.1 },
      { rgb: [224, 122, 31], a: .17, n: 20, y0: .40, y1: .16, amp: .03, spread: .035, sp: .19, ph: 4.2 },
    ] },
  };
  // a soft-edged veil over the copy. How much each text can take depends on its contrast
  // headroom: the large, near-black headline keeps over 9:1 with the ribbons at 45% behind it,
  // so they visibly flow behind it; the small and lighter texts keep a tenth of the ribbons,
  // and the eyebrow (orange on white, 4.8:1 at best) none.
  const VEIL = [
    { sel: '.hero h1', a: .55, lines: true },
    { sel: '.hero .eyebrow', a: 1, lines: true },
    { sel: '.hero .lead, .hero-founder b, .hero-founder span, .hero-stats', a: .9, lines: true },
    { sel: '#heroCtas .btn, .hero-founder img', a: .9, lines: false },
  ];
  const WIDE = matchMedia('(min-width: 900px)');
  let W = 0, H = 0, dpr = 1, grads = [], layout = LAYOUTS.narrow, matte = null;
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
  }
  // the matte: where the ribbons may show and how strongly. Soft edges in from the hero's
  // top, out before the panel and the hero's foot, and the veil cut out over the copy.
  // Applied to every frame in one step.
  function buildMatte() {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    const m = c.getContext('2d');
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
    // the veil: only the blurred shadow of each box lands on the canvas (the box itself is drawn
    // far off to the left), each box padded by the blur's reach so the veil is at full strength
    // over every letter
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'destination-out';
    const cr = canvas.getBoundingClientRect(), PAD = 10, OFF = 1e5;
    m.shadowBlur = 10 * dpr; m.shadowOffsetX = OFF;
    const box = (x, y, w, h) => { if (w >= 1 && h >= 1) m.fillRect((x - cr.left - PAD) * dpr - OFF, (y - cr.top - PAD) * dpr, (w + 2 * PAD) * dpr, (h + 2 * PAD) * dpr); };
    for (const { sel, a, lines } of VEIL) {
      m.fillStyle = m.shadowColor = `rgba(0,0,0,${a})`;
      document.querySelectorAll(sel).forEach(el => {
        const dy = shiftY(el);
        if (lines) {   // text: one box per line, hugging the words
          const rg = document.createRange(); rg.selectNodeContents(el);
          for (const r of rg.getClientRects()) box(r.left, r.top - dy, r.width, r.height);
        } else { const r = el.getBoundingClientRect(); box(r.left, r.top - dy, r.width, r.height); }
      });
    }
    matte = c;
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = WIDE.matches ? LAYOUTS.wide : LAYOUTS.narrow;
    grads = layout.ribbons.map(rb => {   // each ribbon fades in from the left edge
      const g = ctx.createLinearGradient(0, 0, W, 0);
      const c = rb.rgb.join(',');
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.12, `rgba(${c},1)`); g.addColorStop(1, `rgba(${c},1)`);
      return g;
    });
    fitArea();
    buildMatte();
  }
  const smooth = x => x * x * (3 - 2 * x);
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // nothing is ever drawn past the panel's edge
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, area.x, area.y); ctx.clip();
    const step = W < 700 ? 8 : 10, xMax = Math.min(W, area.x) + 20;
    layout.ribbons.forEach((rb, ri) => {
      ctx.strokeStyle = grads[ri];
      ctx.lineWidth = 1;
      const tt = t * rb.sp;
      for (let i = 0; i < rb.n; i++) {
        const u = i / (rb.n - 1) - .5;
        ctx.globalAlpha = rb.a * (.35 + .65 * (1 - Math.abs(u) * 2));
        ctx.beginPath();
        for (let x = -20; x <= xMax; x += step) {
          const xn = x / W;
          const base = (rb.y0 + (rb.y1 - rb.y0) * smooth(clamp(xn / layout.sweep))) * H;
          const wave = rb.amp * H * (Math.sin(xn * 2.4 * Math.PI + tt + rb.ph) * .7 + Math.sin(xn * 4.6 * Math.PI - tt * .6 + rb.ph * 1.7) * .3);
          const twist = rb.spread * H * Math.sin(xn * 1.7 * Math.PI + tt * .8 + rb.ph * .5);
          const y = base + wave + u * twist * 2;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    ctx.restore();
    // the fades and the veil, in one step
    if (matte) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(matte, 0, 0);
      ctx.restore();
    }
  }
  let clock = 0, last = null, raf = 0, onScreen = true, allowed = false, drawn = 0;
  function frame(now) {
    if (last !== null) clock += Math.min(now - last, 100);
    last = now;
    // every frame on a 60 Hz screen, every other one on 120 to 144 Hz screens
    if (now - drawn >= 12) { draw(clock / 1000); drawn = now; }
    raf = requestAnimationFrame(frame);
  }
  function update() {
    const run = allowed && !REDUCE && !STATIC && onScreen && !document.hidden;
    if (run && !raf) { last = null; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  new ResizeObserver(() => { if (allowed) { resize(); draw(clock / 1000); } }).observe(canvas);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update(); }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  // text can rewrap and the panel resize when the fonts arrive: refit then
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (allowed) { fitArea(); buildMatte(); draw(clock / 1000); } });
  whenPrepared(() => { allowed = true; resize(); draw(clock / 1000); update(); });
  // review and test hook
  window.mewritRibbons = { seek(ms) { clock = ms; draw(ms / 1000); }, isRunning: () => !!raf, area: () => ({ ...area }) };
}
