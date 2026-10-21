/* The phone menu on the film's pages (src/components/SiteMenu.astro): the header's menu button opens it
   (data-phone="sheet" on <html>, Base.astro), Close or Escape closes it (it rises back), and choosing a
   link closes it at once, so the page can go where the link leads (on the home page a practice goes
   straight to its place in the film, experience.js). The page under it does not scroll while it is open. */
const root = document.documentElement;
const menu = document.getElementById('siteMenu'), btn = document.getElementById('menuOpen');
if (menu && btn) {
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rising = 0;
  const done = () => { clearTimeout(rising); rising = 0; menu.classList.remove('closing'); if (menu.open) menu.close(); };
  const close = () => {
    if (!menu.open || rising) return;
    if (REDUCE) { done(); return; }
    menu.classList.add('closing');
    rising = setTimeout(done, 340);
  };
  btn.addEventListener('click', () => {
    if (root.dataset.phone !== 'sheet' || menu.open) return;
    menu.classList.remove('closing');
    menu.showModal(); root.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('.sm-close').addEventListener('click', close);
  menu.addEventListener('cancel', e => { e.preventDefault(); close(); });   // Escape rises it back too
  menu.addEventListener('click', e => { if (e.target.closest('a')) done(); });
  menu.addEventListener('close', () => {
    clearTimeout(rising); rising = 0; menu.classList.remove('closing');
    root.style.overflow = ''; btn.setAttribute('aria-expanded', 'false');
  });
  // grown past 1100px (a window made wider, a tablet turned): the header's own links take over (foot.css)
  matchMedia('(max-width: 1099.98px)').addEventListener('change', e => { if (!e.matches) done(); });
}
