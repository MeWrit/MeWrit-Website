/* Nav lab: behaviour for the navigation variants (styles in src/styles/nav-variants.css).
   The page's variant is data-nav on <html> ("classic", "rail" or "capsule") and data-dock
   ("1" for the phone dock). The boot script sets them from ?nav= and ?dock; the switcher on
   the nav lab page changes them live. The capsule needs no script of its own (it tightens
   with the header's existing scrolled state). */
import D from '../data/intro.json';
import { $, clamp, easeInOutCubic, easeInOutSine, REDUCE } from './shared.js';
import { reading as currentReading, onReading } from './nav-spy.js';

const root = document.documentElement;
const variant = () => root.dataset.nav || 'classic';

// which part of the page is being read: the shared tracker
const reading = () => currentReading();

/* ---- heartbeat rail: the links sit on a trace; the logo's pen glides along it to the link you
   point at (or the section you are reading) and writes its underline, a small heartbeat
   running with the nib and settling flat behind it. The trace also fills as you read. */
let railRefresh = () => {};
(function rail() {
  const navEl = document.querySelector('.nav-desktop');
  const svg = navEl && navEl.querySelector('.rail'), pen = navEl && navEl.querySelector('.rail-pen');
  if (!svg || !pen) return;
  const [pBase, pRead, pOld, pInk] = ['rail-base', 'rail-read', 'rail-ink-old', 'rail-ink'].map(c => svg.querySelector('.' + c));
  const items = [...navEl.querySelectorAll(':scope > ul > li')].map(li => ({ li, el: li.firstElementChild, key: li.dataset.key || null, x0: 0, x1: 0 }));
  const SVG_H = 30, Y = 22;                 // the trace runs 22px down the 30px-tall drawing
  const PEN_H = 26, ps = PEN_H / D.penBox[3];  // the logo's pen, 26px tall
  const nib = [(D.nib[0] - D.penBox[0]) * ps, (D.nib[1] - D.penBox[1]) * ps];
  pen.style.width = (D.penBox[2] * ps).toFixed(2) + 'px';
  pen.style.transformOrigin = `${nib[0].toFixed(2)}px ${nib[1].toFixed(2)}px`;
  const on = () => variant() === 'rail' && matchMedia('(min-width: 900px)').matches;

  // a heartbeat on the trace: P, Q, R (the spike), S and T, over about -1..1
  const g = (u, m, s) => Math.exp(-.5 * ((u - m) / s) ** 2);
  const ecg = u => .16 * g(u, -.62, .1) - .14 * g(u, -.14, .05) + g(u, 0, .055) - .32 * g(u, .13, .05) + .26 * g(u, .6, .14);
  const BLIP_W = 24, BLIP_H = 11;
  const st = { px: 0, lift: 0, op: 0, rot: 30, bx: -999, amp: 0, ink: null, old: null, T: undefined };
  const yAt = x => Y - st.amp * BLIP_H * ecg((x - st.bx) / BLIP_W);
  function trace(x0, x1) {
    if (!(x1 > x0)) return '';
    const a = st.bx - BLIP_W * 1.3, b = st.bx + BLIP_W * 1.3;
    let d = `M${x0.toFixed(1)} ${yAt(x0).toFixed(2)}`;
    if (st.amp > .01 && b > x0 && a < x1) for (let x = Math.max(x0, a); x <= Math.min(x1, b); x += 1.5) d += `L${x.toFixed(1)} ${yAt(x).toFixed(2)}`;
    return d + `L${x1.toFixed(1)} ${yAt(x1).toFixed(2)}`;
  }

  let W = 0, top = 0;
  function measure() {
    const nr = navEl.getBoundingClientRect(), sr = svg.getBoundingClientRect();
    W = sr.width; top = sr.top - nr.top;
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${SVG_H}`);
    items.forEach(it => {   // the words only, not the dropdown chevron or the padding
      const rg = document.createRange(); rg.selectNodeContents(it.el);
      const r = rg.getBoundingClientRect();
      it.x0 = r.left - sr.left; it.x1 = r.right - sr.left;
    });
  }
  function drawRead() {
    const max = root.scrollHeight - innerHeight, p = max > 0 ? clamp(scrollY / max) : 0;
    pRead.setAttribute('d', p > 0 ? `M0 ${Y}L${(W * p).toFixed(1)} ${Y}` : '');
  }
  function render() {
    pBase.setAttribute('d', trace(0, W));
    const inkEnd = st.ink ? st.ink.x0 + (st.ink.x1 - st.ink.x0) * st.ink.p : 0;
    pInk.setAttribute('d', st.ink ? trace(st.ink.x0, inkEnd) : '');
    pOld.setAttribute('d', st.old ? `M${st.old.x0.toFixed(1)} ${Y}L${st.old.x1.toFixed(1)} ${Y}` : '');
    pOld.style.opacity = st.old ? st.old.op.toFixed(3) : '0';
    const y = top + yAt(st.px) - st.lift * 7;   // lifted pens ride 7px above the trace
    pen.style.opacity = st.op.toFixed(3);
    pen.style.transform = `translate3d(${(st.px - nib[0]).toFixed(2)}px,${(y - nib[1]).toFixed(2)}px,0) rotate(${st.rot.toFixed(1)}deg)`;
  }

  let plan = null, raf = 0, lastNow = 0;
  function go(T) {
    if (T === st.T) return;
    st.T = T;
    // the underline written so far fades away while the pen moves on
    if (st.ink && st.ink.p > .05) st.old = { x0: st.ink.x0, x1: st.ink.x0 + (st.ink.x1 - st.ink.x0) * st.ink.p, op: 1 };
    st.ink = null; st.amp = 0;
    if (REDUCE) {   // no motion: the underline and the pen simply appear in place
      st.old = null;
      if (T) { st.ink = { x0: T.x0, x1: T.x1, p: 1 }; st.px = T.x1; st.op = 1; st.lift = 0; st.rot = 30; } else st.op = 0;
      plan = null; render(); return;
    }
    const now = performance.now();
    if (!T) plan = { out: true, t0: now, op0: st.op };
    else {
      const from = st.op < .05 ? T.x0 - 22 : st.px;   // arriving from nowhere: glide in from just left
      plan = { T, t0: now, from, op0: st.op, move: clamp(160 + Math.abs(T.x0 - from) * .55, 160, 480), write: 240 + (T.x1 - T.x0) * 1.6 };
    }
    lastNow = now;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = 0;
    const dt = now - lastNow; lastNow = now;
    if (st.old) { st.old.op -= dt / 300; if (st.old.op <= 0) st.old = null; }
    if (plan && plan.out) {
      const u = clamp((now - plan.t0) / 260);
      st.op = plan.op0 * (1 - u); st.lift = u;
      if (u >= 1) plan = null;
    } else if (plan) {
      const { T } = plan, t = now - plan.t0;
      if (t < plan.move) {   // lifted, gliding to the start of the link
        const u = easeInOutCubic(t / plan.move);
        st.px = plan.from + (T.x0 - plan.from) * u;
        st.op = plan.op0 + (1 - plan.op0) * clamp(t / 160);
        st.lift = Math.sin(Math.PI * u); st.rot = 24;
      } else {               // writing: the nib draws the underline, a heartbeat running with it
        const u = clamp((t - plan.move) / plan.write), e = easeInOutSine(u);
        st.px = T.x0 + (T.x1 - T.x0) * e; st.op = 1; st.lift = 0; st.rot = 34;
        st.ink = { x0: T.x0, x1: T.x1, p: e };
        st.bx = st.px; st.amp = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), .6);
        if (u >= 1) { st.amp = 0; plan = null; }
      }
    }
    render();
    if (plan || st.old) raf = requestAnimationFrame(tick);
  }

  // pointing or tabbing to a link moves the pen there; leaving the nav returns it to the
  // section being read (or away, at the top of the page)
  let hovered = null, leave = 0;
  const forKey = key => items.find(it => it.key && it.key === key) || null;
  const back = () => { hovered = null; if (on()) go(forKey(reading())); };
  items.forEach(it => {
    const point = () => { clearTimeout(leave); hovered = it; if (on()) go(it); };
    it.li.addEventListener('mouseenter', point);
    it.li.addEventListener('focusin', point);
  });
  navEl.addEventListener('mouseleave', () => { leave = setTimeout(back, 350); });
  navEl.addEventListener('focusout', e => { if (!navEl.contains(e.relatedTarget)) back(); });
  onReading(key => { if (!hovered && on()) go(forKey(key)); }, false);
  addEventListener('scroll', () => { if (on()) drawRead(); }, { passive: true });

  // after a resize, a font swap or a switch of variant: settle at once into the finished state
  // (any motion in progress is dropped, including its heartbeat)
  railRefresh = () => {
    if (!on()) return;
    measure(); drawRead();
    const T = hovered || forKey(reading());
    cancelAnimationFrame(raf); raf = 0;
    st.T = undefined; st.ink = null; st.old = null; plan = null; st.amp = 0; st.bx = -999; st.lift = 0;
    if (T) { st.ink = { x0: T.x0, x1: T.x1, p: 1 }; st.px = T.x1; st.op = 1; st.rot = 30; st.T = T; } else { st.op = 0; st.T = null; }
    render();
  };
  addEventListener('resize', railRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(railRefresh);
  railRefresh();
})();

/* ---- phone dock: Services, About and Enquire open bottom sheets; the dock marks the part of
   the page being read */
(function dock() {
  const el = $('dock');
  if (!el) return;
  const items = [...el.querySelectorAll('.dock-item')];
  el.querySelectorAll('[data-sheet]').forEach(b => b.addEventListener('click', () => {
    const s = $(b.dataset.sheet);
    if (s && !s.open) { s.showModal(); root.style.overflow = 'hidden'; }
  }));
  document.querySelectorAll('.sheet').forEach(s => {
    s.addEventListener('close', () => { root.style.overflow = ''; });
    // a tap on the backdrop (outside the sheet), on a link, or on Close closes it
    s.addEventListener('click', e => { if (e.target === s || e.target.closest('a') || e.target.closest('[data-close]')) s.close(); });
  });
  onReading(key => items.forEach(i => i.setAttribute('aria-current', String(!!key && i.dataset.key === key))));
})();

/* ---- the nav lab's switcher */
(function lab() {
  const el = $('navLab');
  if (!el) return;
  if (matchMedia('(max-width: 899.98px)').matches) el.open = false;   // folded on phones
  const sync = () => el.querySelectorAll('.lab-row').forEach(row => {
    const v = row.dataset.set === 'nav' ? variant() : (root.dataset.dock || '0');
    row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('button[data-value]');
    if (!b) return;
    const set = b.closest('.lab-row').dataset.set;
    root.dataset[set] = b.dataset.value;
    const u = new URL(location.href); u.searchParams.set(set, b.dataset.value); history.replaceState(null, '', u);
    document.querySelectorAll('.has-dd > button').forEach(x => x.setAttribute('aria-expanded', 'false'));
    sync(); requestAnimationFrame(railRefresh);
  });
  sync();
})();

// review and test hook
window.mewritNav = { reading, refresh: () => railRefresh() };
