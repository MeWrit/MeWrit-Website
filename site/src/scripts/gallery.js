/* The Gallery (src/pages/gallery/[...path].astro): the filter by kind (talks and panels together; a year
   left with nothing to show goes too), and an album named in the address (#a12, from an event's page)
   marked when the page opens on it. */
const page = document.querySelector('.ga-page');
if (page) {
  const btns = [...page.querySelectorAll('.ev-kind')], albums = [...page.querySelectorAll('.ga-album')];
  const years = [...page.querySelectorAll('.ga-year')], empty = page.querySelector('.ev-empty');
  const fits = (a, k) => k === 'all' || (k === 'talk' ? ['talk', 'panel'].includes(a.dataset.kind) : a.dataset.kind === k);
  btns.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.kind;
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    albums.forEach(a => { a.hidden = !fits(a, k); });
    years.forEach(y => { y.hidden = !y.querySelector('.ga-album:not([hidden])'); });
    empty.hidden = albums.some(a => !a.hidden);
  }));
  const named = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (named && named.classList.contains('ga-album')) named.classList.add('ga-here');
}
