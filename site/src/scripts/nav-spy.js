/* Which part of the page is being read: "about", "services", "trainings", "contact", or null
   at the top. Shared by the nav lab's layouts, which mark the matching entry. A section counts
   as being read while it crosses a thin band just above the middle of the screen. */
const SECTIONS = [['founder', 'about'], ['areas', 'about'], ['services', 'services'], ['trainings', 'trainings'], ['contact', 'contact']];
const inView = new Set(), readers = [];
let current = null;
const spy = new IntersectionObserver(es => {
  es.forEach(e => (e.isIntersecting ? inView.add(e.target.id) : inView.delete(e.target.id)));
  let key = null;
  for (const [id, k] of SECTIONS) if (inView.has(id)) key = k;   // the last one in page order
  if (key !== current) { current = key; readers.forEach(f => f(key)); }
}, { rootMargin: '-45% 0px -50% 0px' });
SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) spy.observe(el); });

export const reading = () => current;
// call fn with every change; with now (the default) also at once with the current value
export const onReading = (fn, now = true) => { readers.push(fn); if (now) fn(current); };
