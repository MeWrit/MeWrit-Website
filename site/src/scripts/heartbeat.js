/* Hero panel, "Pulse to Prose" (calm): one heartbeat every 1.8 s. Each beat releases a
   particle that drifts into the document and writes its next element. Each document ends
   with a QC stamp, holds, then the next type starts (about 68 s for the full loop).
   A pure function of time, so it can be paused, sought and shown as a still. */
import { $, clamp, easeOut, easeInOutSine, REDUCE, STATIC, INTRO } from './shared.js';

const svg = $('heroSvg');
if (svg && document.documentElement.dataset.hero !== 'ribbons') {
  const NS = 'http://www.w3.org/2000/svg';
  const SERIF = '"Fraunces Variable", Fraunces, Georgia, serif', SANS = '"Inter Variable", Inter, sans-serif';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const P = 1800, W = 150, BASE = 92, CAPTURE = 300;
  const CARD = { x: 36, y: 140 };
  const FLY = 1100, DRAW = 1400, FADE = 900;
  const gs = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2);
  function ecgY(x) {
    let d = ((x - CAPTURE) % W + W) % W; if (d > W / 2) d -= W;
    return BASE - (7 * gs(d, -0.30 * W, 0.045 * W) - 5 * gs(d, -0.03 * W, 0.0075 * W) + 42 * gs(d, 0, 0.009 * W)
                   - 12 * gs(d, 0.027 * W, 0.009 * W) + 10 * gs(d, 0.26 * W, 0.055 * W));
  }
  let d = '';
  for (let x = -W - 4; x <= 404; x += 0.5) d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + ecgY(x).toFixed(2);
  ['ecgGlow', 'ecgLine'].forEach(id => $(id).setAttribute('d', d));
  const traceGrads = [$('traceGrad'), $('traceGlowGrad')];

  const C = { head: '#2E508E', body: '#CBD5E4', light: '#DFE5EE' };
  const docs = [
    { title: 'Study Protocol', tag: 'PHASE III', items: [
      { t: 'hline', n: '1', x: 22, y: 66, len: 130 }, { t: 'line', x: 22, y: 86, len: 262 }, { t: 'line', x: 22, y: 103, len: 224 },
      { t: 'hline', n: '2', x: 22, y: 128, len: 150 }, { t: 'line', x: 22, y: 148, len: 250 }, { t: 'line', x: 22, y: 165, len: 176 } ] },
    { title: 'Clinical Study Report', tag: 'ICH E3', items: [
      { t: 'line', x: 22, y: 66, len: 150, c: 'head' }, { t: 'line', x: 22, y: 86, len: 262 },
      { t: 'row', y: 100, h: 18, head: true }, { t: 'row', y: 120, h: 18 }, { t: 'row', y: 140, h: 18 },
      { t: 'line', x: 22, y: 176, len: 150 } ] },
    { title: 'Manuscript', tag: 'ICMJE', items: [
      { t: 'line', x: 22, y: 66, len: 210, c: 'head' }, { t: 'line', x: 22, y: 86, len: 262 }, { t: 'line', x: 22, y: 103, len: 238 },
      { t: 'bars', x: 26, base: 168, w: 16, gap: 12, hs: [26, 40, 32, 52, 44] }, { t: 'line', x: 22, y: 184, len: 120, c: 'light' } ] },
    { title: 'Training Module', tag: 'WORKSHOP', items: [
      { t: 'line', x: 22, y: 66, len: 180, c: 'head' }, { t: 'bullet', x: 26, y: 90, len: 220 }, { t: 'bullet', x: 26, y: 112, len: 190 },
      { t: 'bullet', x: 26, y: 134, len: 236 }, { t: 'bullet', x: 26, y: 156, len: 160 } ] },
  ];
  const docsG = $('docs');
  const lineEl = (g, x, y, color, w) => mk('line', { x1: x, y1: y, x2: x, y2: y, stroke: color, 'stroke-width': w || 5, 'stroke-linecap': 'round', opacity: 0 }, g);
  function drawLine(el, x, len, p) {
    if (p <= 0) { el.setAttribute('opacity', 0); return null; }
    const x2 = x + len * easeInOutSine(p);
    el.setAttribute('x2', x2.toFixed(2)); el.setAttribute('opacity', 1);
    return x2;
  }
  docs.forEach(doc => {
    const g = mk('g', { opacity: 0 }, docsG);
    doc.g = g;
    mk('text', { x: 22, y: 32, 'font-family': SERIF, 'font-size': 15, 'font-weight': 600, fill: '#14213D' }, g).textContent = doc.title;
    doc.chipRect = mk('rect', { x: 230, y: 17, width: 76, height: 20, rx: 10, fill: '#F5F7FB', stroke: '#E3E8F1' }, g);
    doc.chipText = mk('text', { x: 239, y: 30.6, 'font-family': SANS, 'font-size': 8.6, 'font-weight': 700, 'letter-spacing': .9, fill: '#45506A' }, g);
    doc.chipText.textContent = doc.tag;
    mk('line', { x1: 22, y1: 46, x2: 306, y2: 46, stroke: '#E3E8F1' }, g);
    doc.items.forEach(it => {
      if (it.t === 'line') {
        const el = lineEl(g, it.x, it.y, C[it.c || 'body']);
        it.target = [it.x, it.y];
        it.update = p => { const hx = drawLine(el, it.x, it.len, p); return hx != null && p < 1 ? [hx, it.y] : null; };
      } else if (it.t === 'hline') {
        const badge = mk('g', { opacity: 0 }, g);
        mk('circle', { cx: 0, cy: 0, r: 7.5, fill: '#FDF1E6' }, badge);
        mk('text', { x: 0, y: 3.1, 'text-anchor': 'middle', 'font-family': SANS, 'font-size': 8.6, 'font-weight': 700, fill: '#B2560B' }, badge).textContent = it.n;
        const el = lineEl(g, it.x + 20, it.y, C.head);
        it.target = [it.x + 7.5, it.y];
        it.update = p => {
          const b = easeOut(clamp(p / .3));
          badge.setAttribute('opacity', b.toFixed(3));
          badge.setAttribute('transform', `translate(${it.x + 7.5} ${it.y}) scale(${(.6 + .4 * b).toFixed(3)})`);
          const q = clamp((p - .22) / .78);
          const hx = drawLine(el, it.x + 20, it.len, q);
          return hx != null && q < 1 ? [hx, it.y] : null;
        };
      } else if (it.t === 'row') {
        const cw = 92, xs = [22, 118, 214];
        const cells = xs.map(cx => ({ cx,
          r: mk('rect', { x: cx, y: it.y, width: 0, height: it.h, rx: 4, fill: it.head ? '#E8EEF8' : '#F5F7FB', stroke: '#DCE3EE', opacity: 0 }, g),
          l: lineEl(g, cx + 8, it.y + it.h / 2, it.head ? '#9FB1CF' : '#CBD5E4', 3.4) }));
        it.target = [28, it.y + it.h / 2];
        it.update = p => {
          cells.forEach((c, i) => {
            const q = clamp((p - i * .2) / .5);
            c.r.setAttribute('opacity', q > 0 ? 1 : 0);
            c.r.setAttribute('width', (cw * easeInOutSine(q)).toFixed(2));
            drawLine(c.l, c.cx + 8, cw * .52, clamp((q - .5) / .5));
          });
          return null;
        };
      } else if (it.t === 'bars') {
        const axis = lineEl(g, it.x - 4, it.base, '#CBD5E4', 1.6);
        const bars = it.hs.map((h, i) => mk('rect', { x: it.x + i * (it.w + it.gap), y: it.base, width: it.w, height: 0, rx: 3, fill: i === 3 ? '#E07A1F' : '#2E508E', opacity: 0 }, g));
        it.target = [it.x, it.base];
        it.update = p => {
          drawLine(axis, it.x - 4, it.hs.length * (it.w + it.gap), clamp(p / .3));
          bars.forEach((b, i) => {
            const q = easeInOutSine(clamp((p - .15 - i * .1) / .5)), h = it.hs[i] * q;
            b.setAttribute('opacity', q > 0 ? 1 : 0); b.setAttribute('y', (it.base - h).toFixed(2)); b.setAttribute('height', h.toFixed(2));
          });
          return null;
        };
      } else if (it.t === 'bullet') {
        const dot = mk('circle', { cx: it.x, cy: it.y, r: 0, fill: '#E07A1F' }, g);
        const el = lineEl(g, it.x + 12, it.y, C.body);
        it.target = [it.x, it.y];
        it.update = p => {
          dot.setAttribute('r', (3.2 * easeOut(clamp(p / .25))).toFixed(2));
          const q = clamp((p - .18) / .82);
          const hx = drawLine(el, it.x + 12, it.len, q);
          return hx != null && q < 1 ? [hx, it.y] : null;
        };
      }
    });
    const st = mk('g', { opacity: 0 }, g);
    mk('rect', { x: 214, y: 186, width: 92, height: 24, rx: 12, fill: '#FDF1E6', stroke: '#E07A1F', 'stroke-opacity': .45 }, st);
    doc.check = mk('path', { d: 'M226 198.5l3.6 3.6 7-7.4', fill: 'none', stroke: '#B2560B', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 16, 'stroke-dashoffset': 16 }, st);
    mk('text', { x: 243, y: 202, 'font-family': SANS, 'font-size': 10, 'font-weight': 700, fill: '#B2560B' }, st).textContent = 'QC passed';
    doc.stamp = st;
    doc.L = doc.items.length + 4;   // enter, items, stamp, hold, exit
  });
  const fitChips = () => docs.forEach(doc => {
    const w = doc.chipText.getComputedTextLength(); if (!w) return;
    const cw = w + 18, cx = 306 - cw;
    doc.chipRect.setAttribute('x', cx.toFixed(1)); doc.chipRect.setAttribute('width', cw.toFixed(1)); doc.chipText.setAttribute('x', (cx + 9).toFixed(1));
  });
  const starts = []; let LOOP = 0;
  docs.forEach(doc => { starts.push(LOOP); LOOP += doc.L; });
  const ecgMove = $('ecgMove'), heart = $('heart'), ping = $('ping');
  const particle = $('particle'), pCore = $('pCore'), pGlow = $('pGlow'), pT1 = $('pT1'), pT2 = $('pT2'), caret = $('caret');
  const cubic = (a, b, c, e, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * e; };
  const flightPoint = (tg, u) => { const tx = CARD.x + tg[0], ty = CARD.y + tg[1]; return [cubic(CAPTURE, CAPTURE + 56, tx + 46, tx, u), cubic(BASE, BASE + 36, ty - 78, ty, u)]; };
  const setPos = (el, p) => { el.setAttribute('cx', p[0].toFixed(2)); el.setAttribute('cy', p[1].toFixed(2)); };

  function renderAt(t) {
    const beat = Math.floor(t / P), within = t - beat * P;
    const shift = (within / P * W).toFixed(2);
    ecgMove.setAttribute('transform', `translate(${shift} 0)`);
    traceGrads.forEach(g => g.setAttribute('gradientTransform', `translate(${-shift} 0)`));   // colour stays put on screen
    const hb = within < 420 ? Math.sin(Math.PI * within / 420) : 0;
    heart.setAttribute('transform', `translate(24 16) scale(${(1 + .12 * hb).toFixed(3)})`);
    const pp = clamp(within / 1400);
    ping.setAttribute('r', (4 + 8 * easeOut(pp)).toFixed(2));
    ping.setAttribute('stroke-opacity', (.3 * (1 - pp)).toFixed(3));

    const lb = ((beat % LOOP) + LOOP) % LOOP;
    let di = 0; while (di < docs.length - 1 && lb >= starts[di + 1]) di++;
    const doc = docs[di], k = lb - starts[di], tl = k * P + within, m = doc.items.length;
    docs.forEach((dd, i) => { if (i !== di) dd.g.setAttribute('opacity', 0); });
    let op = 1, dx = 0;
    if (k === 0) { const p = easeInOutSine(clamp(within / FADE)); op = p; dx = (1 - p) * 14; }
    if (k === doc.L - 1 && within > 600) { const p = easeInOutSine(clamp((within - 600) / FADE)); op = 1 - p; dx = -14 * p; }
    doc.g.setAttribute('opacity', op.toFixed(3));
    doc.g.setAttribute('transform', `translate(${dx.toFixed(2)} 0)`);
    let caretAt = null;
    doc.items.forEach((it, j) => { const head = it.update(clamp((tl - ((j + 1) * P + FLY)) / DRAW)); if (head) caretAt = head; });
    const sp = easeOut(clamp((tl - ((m + 1) * P + 500)) / 700));
    doc.stamp.setAttribute('opacity', sp.toFixed(3));
    doc.stamp.setAttribute('transform', `translate(260 198) scale(${(.92 + .08 * sp).toFixed(3)}) translate(-260 -198)`);
    doc.check.setAttribute('stroke-dashoffset', (16 * (1 - easeInOutSine(clamp((tl - ((m + 1) * P + 800)) / 500)))).toFixed(2));

    if (k >= 1 && k <= m && within < FLY) {
      const tg = doc.items[k - 1].target, u = within / FLY;
      particle.setAttribute('opacity', (clamp(u / .12) * clamp((1 - u) / .06 + .2)).toFixed(3));
      const c = flightPoint(tg, easeInOutSine(u));
      setPos(pCore, c); setPos(pGlow, c);
      setPos(pT1, flightPoint(tg, easeInOutSine(Math.max(0, u - .04))));
      setPos(pT2, flightPoint(tg, easeInOutSine(Math.max(0, u - .08))));
    } else particle.setAttribute('opacity', 0);
    if (caretAt) { caret.setAttribute('opacity', 1); caret.setAttribute('transform', `translate(${(CARD.x + dx + caretAt[0]).toFixed(2)} ${(CARD.y + caretAt[1]).toFixed(2)})`); }
    else caret.setAttribute('opacity', 0);
  }

  let clock = 0, last = null, raf = 0, onScreen = true, userPaused = false, allowed = false;
  const STILL = (starts[2] + docs[2].items.length + 1) * P + 1600;
  function frame(now) { if (last !== null) clock += Math.min(now - last, 100); last = now; renderAt(clock); raf = requestAnimationFrame(frame); }
  function update() {
    const run = allowed && onScreen && !userPaused && !document.hidden;
    if (run && !raf) { last = null; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  const btn = $('heroPause');
  function setPaused(p) { userPaused = p; btn.setAttribute('aria-pressed', String(p)); btn.setAttribute('aria-label', p ? 'Play animation' : 'Pause animation'); update(); }
  btn.addEventListener('click', () => setPaused(!userPaused));
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update(); }).observe($('heroVisual'));
  document.addEventListener('visibilitychange', update);
  renderAt(0);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { fitChips(); renderAt(clock); });
  // with an intro, the heartbeat starts only once the logo has landed: a panel that animates while
  // it is first revealed made the glide stall (measured); it is shown still until then
  const startWhenSettled = fn => {
    if (!INTRO || document.documentElement.classList.contains('logo-landed')) fn();
    else document.addEventListener('mewrit:introdone', fn, { once: true });
  };
  if (REDUCE || STATIC) { clock = STILL; renderAt(STILL); setPaused(true); } else startWhenSettled(() => { allowed = true; update(); });
  // review and test hook
  window.mewritHero = { seek(t) { clock = t; renderAt(t); }, pause() { setPaused(true); }, play() { setPaused(false); }, isRunning: () => !!raf, loopMs: LOOP * P, still: STILL, beatMs: P };
}
