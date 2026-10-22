/* The header's menu on the film's pages (SiteHeader.astro; styles in foot.css).
   Every panel opens on the pointer alone and closes as the pointer leaves (the user, 2026-10-23: "make
   all header dropdowns hover only"); pressing an entry holds nothing open. A panel goes the moment a link
   in it (or Practices itself) is chosen, staying gone until the pointer has left the entry (the user,
   2026-10-21: "should disappear when the user clicks any of the practices"); the link chosen gives up its
   focus, which would otherwise hold the panel open.
   One orange line under the menu (the user, 2026-10-21: "have the underlines flow smoothly between the
   elements"): it rests under the entry for where the reader is (aria-current: set by experience.js as the
   film moves, or by the page for a page of its own), glides to an entry pointed at or focused and back
   when the pointer leaves, and glides from entry to entry as the reader moves through the film. It spans
   the entry's words (its box less its padding); it appears and goes by fading, in place. */
const hoverable = matchMedia('(hover: hover)');
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
  // an entry that is a button (About, Expertise, Showcase): with a mouse its panel is the pointer's alone
  // (the user, 2026-10-23: hover only, foot.css), so pressing it holds nothing open (page.js's toggle is
  // stopped before it), and it says its panel is open while the pointer or the keyboard's focus is in it.
  // A touch screen keeps page.js's tap to open
  const top = li.querySelector(':scope > button');
  if (!top) return;
  const say = on => top.setAttribute('aria-expanded', on ? 'true' : 'false');
  li.addEventListener('click', e => { if (hoverable.matches && top.contains(e.target)) e.stopPropagation(); }, true);
  li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') say(true); });
  li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') say(false); });
  li.addEventListener('focusin', () => { if (hoverable.matches && li.querySelector(':focus-visible')) say(true); });
  li.addEventListener('focusout', e => { if (hoverable.matches && !li.contains(e.relatedTarget)) say(false); });
});

const navEl = document.querySelector('.nav-desktop'), line = navEl && navEl.querySelector('.nav-line');
if (line && document.documentElement.dataset.foot === 'film') {
  const items = [...navEl.querySelectorAll(':scope > ul > li > :is(a,button)')];
  const wide = matchMedia('(min-width: 1280px)');   // (where the menu stands in the bar: foot.css)
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
