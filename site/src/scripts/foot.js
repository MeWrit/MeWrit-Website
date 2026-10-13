/* The foot (src/components/SiteFoot.astro): its button opens and closes the colophon; a link to #contact
   anywhere on the page opens it (rather than jumping); at the end of the page it opens by itself, and
   closes again when the reader scrolls back, unless the reader opened it. Escape closes it. The film
   asks it to close when it jumps (window.mewritFoot). */
const foot = document.querySelector('.sf');
if (foot) {
  const btn = foot.querySelector('.sf-toggle'), panel = foot.querySelector('.sf-panel');
  let by = '';
  const set = (open, who = '') => {
    foot.dataset.open = open ? 'true' : 'false';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    by = open ? who : '';
  };
  btn.addEventListener('click', () => set(foot.dataset.open !== 'true', 'reader'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && foot.dataset.open === 'true') { set(false); btn.focus(); } });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="#contact"]');
    if (!a || foot.contains(a)) return;
    e.preventDefault(); set(true, 'reader');
  });
  const atEnd = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; const end = atEnd(); if (end && !by) set(true, 'end'); else if (!end && by === 'end') set(false); });
  }, { passive: true });
  if (location.hash === '#contact') set(true, 'reader');
  window.mewritFoot = { open: () => set(true, 'reader'), close: () => set(false), get isOpen() { return foot.dataset.open === 'true'; } };
}
