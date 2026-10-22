/* The photos, one at a time over the whole screen (src/components/PhotoViewer.astro). A link marked data-vw
   opens it at its photo, among the photos of the block it sits in (data-vw-set); its own address is the
   full photo, its data-vw-cap the caption, its data-vw-ev the event's page. The previous and the next by
   the arrows, the keyboard's arrow keys, or a swipe; Close, Escape or a tap outside the photo closes it, and
   the focus goes back to the photo it opened from. The photos either side are fetched ahead. */
const dlg = document.getElementById('photoViewer');
if (dlg) start();

function start() {
  const img = dlg.querySelector('.vw-img'), count = dlg.querySelector('.vw-count'), cap = dlg.querySelector('.vw-t'), ev = dlg.querySelector('.vw-ev');
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let set = [], i = 0, from = null;

  function show(n, dir = 0) {
    i = (n + set.length) % set.length;
    const a = set[i];
    img.classList.remove('in', 'from-l', 'from-r');
    img.src = a.href;
    img.alt = a.dataset.vwAlt || '';
    cap.textContent = a.dataset.vwCap || '';
    if (a.dataset.vwEv) { ev.href = a.dataset.vwEv; ev.hidden = false; } else ev.hidden = true;
    count.textContent = set.length > 1 ? `${i + 1} of ${set.length}` : '';
    dlg.classList.toggle('vw-one', set.length < 2);
    if (!REDUCE) { if (dir) img.classList.add(dir > 0 ? 'from-r' : 'from-l'); void img.offsetWidth; }
    img.classList.add('in');
    // (the neighbours, ahead of time)
    [i - 1, i + 1].forEach(k => { const b = set[(k + set.length) % set.length]; if (b) { const p = new Image(); p.src = b.href; } });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-vw]');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const box = a.closest('[data-vw-set]');
    set = box ? [...box.querySelectorAll('a[data-vw]')] : [a];
    e.preventDefault();
    from = a;
    show(set.indexOf(a));
    dlg.showModal();
    document.documentElement.style.overflow = 'hidden';
  });
  dlg.querySelector('.vw-prev').addEventListener('click', () => show(i - 1, -1));
  dlg.querySelector('.vw-next').addEventListener('click', () => show(i + 1, 1));
  dlg.querySelector('.vw-close').addEventListener('click', () => dlg.close());
  // (a tap on the dark around the photo closes it)
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('vw-stage')) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1, 1); }
  });
  dlg.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    img.removeAttribute('src');
    if (from) from.focus({ preventScroll: true });
  });
  // a swipe: sideways more than 50px, and more sideways than up or down
  let x0 = null, y0 = 0;
  dlg.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
  dlg.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && set.length > 1) show(dx < 0 ? i + 1 : i - 1, dx < 0 ? 1 : -1);
  });
}
