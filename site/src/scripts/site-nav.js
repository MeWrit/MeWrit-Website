/* The header's menu on the film's pages (SiteHeader.astro; styles in foot.css): Practices' panel opens on
   the pointer, and goes the moment a practice in it (or Practices itself) is chosen, staying gone until
   the pointer has left the entry (the user, 2026-10-21: "should disappear when the user clicks any of
   the practices"); the link chosen gives up its focus, which would otherwise hold the panel open. */
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
