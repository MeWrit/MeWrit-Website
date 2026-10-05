/* Hero ribbons: slow silk ribbons drawn on a canvas. Each ribbon is a bundle of thin lines
   whose spread twists along its length. About 30 frames a second is plenty for motion this
   slow; drawing pauses when the hero is off screen or the tab is hidden. */
import { $, clamp, REDUCE, STATIC, whenPrepared } from './shared.js';

const canvas = $('ribbons');
if (canvas && document.documentElement.dataset.hero !== 'ecg') {
  const ctx = canvas.getContext('2d');
  const RIBBONS = [
    { rgb: [46, 80, 142], a: .15, n: 26, y0: .86, y1: .30, amp: .07, spread: .085, sp: .16, ph: 0.0 },
    { rgb: [30, 58, 110], a: .11, n: 22, y0: .97, y1: .52, amp: .05, spread: .065, sp: .12, ph: 2.1 },
    { rgb: [224, 122, 31], a: .17, n: 20, y0: .78, y1: .16, amp: .055, spread: .05, sp: .19, ph: 4.2 },
  ];
  let W = 0, H = 0, dpr = 1, grads = [];
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grads = RIBBONS.map(rb => {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      const c = rb.rgb.join(',');
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.18, `rgba(${c},1)`); g.addColorStop(.85, `rgba(${c},1)`); g.addColorStop(1, `rgba(${c},.2)`);
      return g;
    });
  }
  const smooth = x => x * x * (3 - 2 * x);
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const portrait = H > W;
    const step = W < 700 ? 8 : 10;
    RIBBONS.forEach((rb, ri) => {
      ctx.strokeStyle = grads[ri];
      ctx.lineWidth = 1;
      const tt = t * rb.sp;
      for (let i = 0; i < rb.n; i++) {
        const u = i / (rb.n - 1) - .5;
        ctx.globalAlpha = rb.a * (.35 + .65 * (1 - Math.abs(u) * 2));
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += step) {
          const xn = x / W;
          const y0 = portrait ? rb.y0 + (1 - rb.y0) * .2 : rb.y0, y1 = portrait ? Math.max(rb.y1, .5) : rb.y1;
          const base = (y0 + (y1 - y0) * smooth(clamp(xn))) * H;
          const wave = rb.amp * H * (Math.sin(xn * 2.4 * Math.PI + tt + rb.ph) * .7 + Math.sin(xn * 4.6 * Math.PI - tt * .6 + rb.ph * 1.7) * .3);
          const twist = rb.spread * H * Math.sin(xn * 1.7 * Math.PI + tt * .8 + rb.ph * .5);
          const y = base + wave + u * twist * 2;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
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
  whenPrepared(() => { allowed = true; resize(); draw(clock / 1000); update(); });
  // review and test hook
  window.mewritRibbons = { seek(ms) { clock = ms; draw(ms / 1000); }, isRunning: () => !!raf };
}
