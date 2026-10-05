/* Hero ribbons: slow silk ribbons drawn on a canvas. Each ribbon is a bundle of thin lines
   whose spread twists along its length. They flow through the copy, not behind the heartbeat
   panel: on wide screens across the left column, fading out where the panel begins; in one
   column through the copy at the top, fading out above the panel. Right under the copy's
   text they are veiled to a tenth of their strength, so the words keep their contrast.
   About 30 frames a second is plenty for motion this slow; drawing pauses when the hero is
   off screen or the tab is hidden. */
import { $, clamp, REDUCE, STATIC, whenPrepared } from './shared.js';

const canvas = $('ribbons');
if (canvas && document.documentElement.dataset.hero !== 'ecg') {
  const ctx = canvas.getContext('2d');
  const LAYOUTS = {
    // two columns (900px and up): one bundle rises behind the headline, one runs through the
    // band above the copy, one through the band below it; all fade before the panel
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
  const WIDE = matchMedia('(min-width: 900px)');
  let W = 0, H = 0, dpr = 1, grads = [], layout = LAYOUTS.narrow, veil = null;

  // vertical offset an element is currently shifted by (the hero's entrance transitions)
  const shiftY = el => {
    let ty = 0;
    for (let e = el; e && !e.classList.contains('hero'); e = e.parentElement) {
      const m = getComputedStyle(e).transform;
      if (m && m !== 'none') ty += new DOMMatrixReadOnly(m).m42;
    }
    return ty;
  };
  // where the ribbons must have faded out: the panel's top (one column) or left edge (two)
  function fitMask() {
    const vis = $('heroVisual');
    if (!vis || !vis.offsetWidth) return;
    const hr = canvas.getBoundingClientRect(), vr = vis.getBoundingClientRect(), dy = shiftY(vis);
    canvas.style.setProperty('--rib-v', ((vr.top - dy - hr.top) / hr.height * 100).toFixed(1) + '%');
    canvas.style.setProperty('--rib-h', ((vr.left - hr.left) / hr.width * 100).toFixed(1) + '%');
  }
  // a soft-edged veil over the copy, cut out of the ribbons on every frame. How much each text
  // can take depends on its contrast headroom: the large, near-black headline keeps over 9:1
  // with the ribbons at 45% behind it, so they visibly flow behind it; the small and lighter
  // texts keep a tenth of the ribbons, and the eyebrow (orange on white, 4.8:1 at best) none.
  const VEIL = [
    { sel: '.hero h1', a: .55, lines: true },
    { sel: '.hero .eyebrow', a: 1, lines: true },
    { sel: '.hero .lead, .hero-founder b, .hero-founder span, .hero-stats', a: .9, lines: true },
    { sel: '#heroCtas .btn, .hero-founder img', a: .9, lines: false },
  ];
  function buildVeil() {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    // the blur's soft edge reaches into a box by about its own radius, so each box is padded by
    // that much: the veil is at full strength over every letter, and fades out beyond them
    const v = c.getContext('2d'), cr = canvas.getBoundingClientRect(), PAD = 10, OFF = 1e5;
    // only the blurred shadow lands on the canvas (the shape itself is drawn far off to the
    // left): a shape over its own shadow would double the veil's strength in the middle
    v.shadowBlur = 10 * dpr; v.shadowOffsetX = OFF;
    const box = (x, y, w, h) => { if (w >= 1 && h >= 1) v.fillRect((x - cr.left - PAD) * dpr - OFF, (y - cr.top - PAD) * dpr, (w + 2 * PAD) * dpr, (h + 2 * PAD) * dpr); };
    for (const { sel, a, lines } of VEIL) {
      v.fillStyle = v.shadowColor = `rgba(0,0,0,${a})`;
      document.querySelectorAll(sel).forEach(el => {
        const dy = shiftY(el);
        if (lines) {   // text: one box per line, hugging the words
          const rg = document.createRange(); rg.selectNodeContents(el);
          for (const r of rg.getClientRects()) box(r.left, r.top - dy, r.width, r.height);
        } else { const r = el.getBoundingClientRect(); box(r.left, r.top - dy, r.width, r.height); }
      });
    }
    veil = c;
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = WIDE.matches ? LAYOUTS.wide : LAYOUTS.narrow;
    grads = layout.ribbons.map(rb => {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      const c = rb.rgb.join(',');
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.12, `rgba(${c},1)`); g.addColorStop(1, `rgba(${c},1)`);
      return g;
    });
    fitMask();
    buildVeil();
  }
  const smooth = x => x * x * (3 - 2 * x);
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const step = W < 700 ? 8 : 10;
    layout.ribbons.forEach((rb, ri) => {
      ctx.strokeStyle = grads[ri];
      ctx.lineWidth = 1;
      const tt = t * rb.sp;
      for (let i = 0; i < rb.n; i++) {
        const u = i / (rb.n - 1) - .5;
        ctx.globalAlpha = rb.a * (.35 + .65 * (1 - Math.abs(u) * 2));
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += step) {
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
    ctx.globalAlpha = 1;
    if (veil) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(veil, 0, 0);
      ctx.restore();
    }
  }
  let clock = 0, last = null, raf = 0, onScreen = true, acc = 0, allowed = false;
  function frame(now) {
    if (last !== null) { const dt = Math.min(now - last, 100); clock += dt; acc += dt; }
    last = now;
    if (acc >= 33) { draw(clock / 1000); acc = 0; }
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
  // text can rewrap when the fonts arrive: refit the veil then
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (allowed) { fitMask(); buildVeil(); draw(clock / 1000); } });
  whenPrepared(() => { allowed = true; resize(); draw(clock / 1000); update(); });
  // review and test hook
  window.mewritRibbons = { seek(ms) { clock = ms; draw(ms / 1000); }, isRunning: () => !!raf };
}
