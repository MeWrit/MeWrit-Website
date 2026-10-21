/* The header's menu on the film's pages (SiteHeader.astro; styles in foot.css).
   Practices' panel opens on the pointer, and goes the moment a practice in it (or Practices itself) is
   chosen, staying gone until the pointer has left the entry (the user, 2026-10-21: "should disappear when
   the user clicks any of the practices"); the link chosen gives up its focus, which would otherwise hold
   the panel open.
   One orange line under the menu (the user, 2026-10-21: "have the underlines flow smoothly between the
   elements"): it rests under the entry for where the reader is (aria-current: set by experience.js as the
   film moves, or by the page for a page of its own), glides to an entry pointed at or focused and back
   when the pointer leaves, and glides from entry to entry as the reader moves through the film. It spans
   the entry's words (its box less its padding); it appears and goes by fading, in place. */
document.querySelectorAll('.nav-desktop .has-dd').forEach(li => {
  li.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    li.classList.add('dd-off');
    a.blur();
  });
  li.addEventListener('pointerleave', () => li.classList.remove('dd-off'));
  // (from the keyboard the panel opens again once its entry has the focus anew)
  li.addEventListener('focusin', e => { if (e.target.matches('.dd-top, button')) li.classList.remove('dd-off'); });
});

const navEl = document.querySelector('.nav-desktop'), line = navEl && navEl.querySelector('.nav-line');
if (line && document.documentElement.dataset.foot === 'film') {
  const items = [...navEl.querySelectorAll(':scope > ul > li > :is(a,button)')];
  const wide = matchMedia('(min-width: 1100px)');
  let hover = null;
  const current = () => items.find(a => a.hasAttribute('aria-current') && a.getAttribute('aria-current') !== 'false') || null;
  function place(a, jump = false) {
    if (!a || !wide.matches) { line.classList.remove('on'); return; }
    const nr = navEl.getBoundingClientRect(), r = a.getBoundingClientRect(), cs = getComputedStyle(a);
    const pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
    const x = r.left - nr.left + pl, w = Math.max(0, r.width - pl - pr);
    // appearing (or after a resize): in place at once, then faded in; otherwise it glides
    const snap = jump || !line.classList.contains('on');
    if (snap) line.classList.add('jump');
    line.style.setProperty('--nl', x.toFixed(1) + 'px');
    line.style.setProperty('--nw', w.toFixed(1) + 'px');
    if (snap) { void line.offsetWidth; line.classList.remove('jump'); }
    line.classList.add('on');
  }
  items.forEach(a => {
    a.addEventListener('pointerenter', () => { hover = a; place(a); });
    a.addEventListener('focus', () => { hover = a; place(a); });
    a.addEventListener('blur', () => { if (hover === a) { hover = null; place(current()); } });
  });
  navEl.addEventListener('pointerleave', () => { hover = null; place(current()); });
  // the film marks where the reader is: the line follows, unless the pointer is on the menu
  new MutationObserver(() => { if (!hover) place(current()); }).observe(navEl, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  addEventListener('resize', () => place(hover || current(), true));
  wide.addEventListener('change', () => place(current(), true));
  // (the words' own fonts change their widths once loaded)
  if (document.fonts) document.fonts.ready.then(() => place(hover || current(), true));
  place(current(), true);
}
