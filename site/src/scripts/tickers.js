/* The numbers count up: in the hero on desktop, and in their own block after it on phones and
   tablets. They start once the page's load animation is over (the loading intro on version A,
   the logo drawing itself on version B, the entrance anywhere else) and once they are in view,
   rising quickly then settling on the number, one after another. Until then their digits are
   hidden, so nothing sits at 0. Screen readers get the final number at once (the ticking digits
   are hidden from them). With reduced motion or ?static, or without this script, the numbers
   are simply there. */
import { REDUCE, STATIC } from './shared.js';

const root = document.documentElement;
const els = [...document.querySelectorAll('.hero-stats b, .stats b')];
if (els.length && !REDUCE && !STATIC) {
  const DUR = 1800, STAGGER = 140;
  const fmt = (n, grouped) => grouped ? n.toLocaleString('en-US') : String(n);
  const items = els.map(el => {
    const text = el.textContent.trim(), m = text.match(/^(\D*)(\d[\d,]*)(.*)$/);
    if (!m) return null;
    const sr = document.createElement('span'), tick = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = text;
    tick.className = 'tick wait'; tick.setAttribute('aria-hidden', 'true');
    el.textContent = ''; el.append(sr, tick);
    const it = { el, tick, pre: m[1], post: m[3], target: parseInt(m[2].replace(/,/g, ''), 10), grouped: m[2].includes(',') };
    show(it, 0);
    return it;
  }).filter(Boolean);
  function show(it, v) { it.tick.textContent = it.pre + fmt(v, it.grouped) + it.post; }

  function run(list) {
    list.forEach(it => it.tick.classList.remove('wait'));
    const t0 = performance.now();
    const step = now => {
      let more = false;
      list.forEach((it, i) => {
        const p = Math.min(1, Math.max(0, (now - t0 - i * STAGGER) / DUR));
        show(it, Math.round(it.target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) more = true;
      });
      if (more) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // the page's load animation is over (or there is none)
  const loaded = new Promise(done => {
    const intro = root.classList.contains('intro-on') && !root.classList.contains('logo-landed');
    const logo = root.classList.contains('logo-anim') && !root.classList.contains('logo-done');
    if (intro) document.addEventListener('mewrit:introdone', done, { once: true });
    else if (logo) ['mewrit:logodone', 'mewrit:introdone'].forEach(ev => document.addEventListener(ev, done, { once: true }));
    else setTimeout(done, 700);   // just after the entrance
  });
  // each group counts when it is in view
  loaded.then(() => {
    [...new Set(items.map(it => it.el.closest('.hero-stats, .stats')))].forEach(group => {
      const mine = items.filter(it => group.contains(it.el));
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(mine); } }, { threshold: .35 });
      io.observe(group);
    });
  });
}
