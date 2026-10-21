/* The foot (src/components/SiteFoot.astro): its button opens and closes the colophon; a link to #contact
   anywhere on the page opens it (rather than jumping); at the end of the home page's film, and only
   there (the page marks itself, data-foot-auto), it opens by itself; on every other page it stays closed
   unless the reader opens it (the user, 2026-10-21). It gives way as soon as the reader turns back to
   the page (the user, 2026-10-21):
   a tap anywhere outside it, the page scrolled, or a wheel or a swipe outside it (also on a page that
   does not scroll); Escape closes it too. Closed by the reader at the page's end, it stays closed until
   the reader has left the end. The film asks it to close when it jumps (window.mewritFoot). Its map is
   loaded the first time it opens, not with every page. */
const foot = document.querySelector('.sf');
if (foot) {
  const btn = foot.querySelector('.sf-toggle'), panel = foot.querySelector('.sf-panel'), map = foot.querySelector('.sf-map iframe[data-src]');
  const auto = !!document.querySelector('[data-foot-auto]');
  const isOpen = () => foot.dataset.open === 'true';
  const atEnd = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
  // who opened it ('reader', or 'end' when the page's end did); the scroll when it opened; and whether
  // the reader closed it at the end (it does not open there again until they have left the end)
  let by = '', openY = 0, held = false;
  const set = (open, who = '') => {
    foot.dataset.open = open ? 'true' : 'false';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    if (open && map && !map.src) map.src = map.dataset.src;
    by = open ? who : '';
    if (open) openY = scrollY;
  };
  const dismiss = () => { if (!isOpen()) return; if (atEnd()) held = true; set(false); };
  btn.addEventListener('click', () => { if (isOpen()) dismiss(); else set(true, 'reader'); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { dismiss(); btn.focus(); } });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="#contact"]');
    if (!a || foot.contains(a)) return;
    e.preventDefault(); set(true, 'reader');
  });
  // a tap or a click anywhere outside it
  document.addEventListener('pointerdown', e => { if (isOpen() && !foot.contains(e.target)) dismiss(); }, true);
  // a wheel or a swipe outside it (opened by the page's end, it waits for the page to leave the end)
  const turnAway = e => { if (isOpen() && by !== 'end' && !foot.contains(e.target)) dismiss(); };
  addEventListener('wheel', turnAway, { passive: true });
  addEventListener('touchmove', turnAway, { passive: true });
  // the page scrolled: opened by the reader, it closes once the page has moved a little; opened by the
  // end, once the page leaves the end; closed, it opens by itself at the end
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const e = atEnd(), end = auto && e;
      if (!e) held = false;
      if (isOpen()) { if (by === 'end' ? !end : Math.abs(scrollY - openY) > 24) set(false); }
      else if (end && !held) set(true, 'end');
    });
  }, { passive: true });
  if (location.hash === '#contact') set(true, 'reader');
  window.mewritFoot = { open: () => set(true, 'reader'), close: () => set(false), get isOpen() { return isOpen(); } };
}
