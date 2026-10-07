/* The small labels above the section headings (.eyebrow) decode into place the first time they come
   into view: each letter cycles through look-alikes and settles, left to right. The ones in the
   hero wait for the page's load animation. Screen readers get the label as it is, at once; with
   reduced motion or ?static the labels simply show. */
import { REDUCE, STATIC, scramble } from './shared.js';

const root = document.documentElement;
const labels = [...document.querySelectorAll('.eyebrow')];
if (labels.length && !REDUCE && !STATIC) {
  const DUR = 640;
  const items = labels.map(el => {
    const text = el.textContent.trim();
    const sr = document.createElement('span'), shown = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = text;
    shown.setAttribute('aria-hidden', 'true'); shown.textContent = text;
    el.textContent = ''; el.append(sr, shown);
    return { el, text, shown, done: false };
  });
  const run = it => {
    if (it.done) return;
    it.done = true;
    const t0 = performance.now();
    const step = now => {
      const e = now - t0;
      it.shown.textContent = e < DUR ? scramble(it.text, e, DUR) : it.text;
      if (e < DUR) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const it = items.find(x => x.el === e.target);
    if (it) run(it);
  }), { rootMargin: '0px 0px -12% 0px' });
  // the hero's label waits until the loading intro or the logo's drawing is over
  const intro = root.classList.contains('intro-on') && !root.classList.contains('logo-landed');
  const logo = root.classList.contains('logo-anim') && !root.classList.contains('logo-done');
  const heroReady = new Promise(done => {
    if (intro) document.addEventListener('mewrit:introdone', done, { once: true });
    else if (logo) ['mewrit:logodone', 'mewrit:introdone'].forEach(ev => document.addEventListener(ev, done, { once: true }));
    else done();
  });
  items.forEach(it => {
    if (it.el.closest('.hero')) heroReady.then(() => io.observe(it.el));
    else io.observe(it.el);
  });
}
