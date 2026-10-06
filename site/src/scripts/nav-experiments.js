/* Nav lab, new positions for the navigation (styles in src/styles/nav-experiments.css):
   spine, tabs, dock, ask, comments and corners, picked by data-nav on <html>. Every layout
   marks the entry being read; the corner frame also says where you are and what comes next;
   the ask bar searches what a visitor needs written and takes them to a prefilled enquiry. */
import { $, REDUCE } from './shared.js';
import { onReading } from './nav-spy.js';
import { navEntries, askIndex } from '../data/site';
import { href } from '../lib/url';

// ---- every layout: mark the entry being read
const marked = [...document.querySelectorAll('.spine-item, .tab, .deskdock a[data-key], .comment, .corner-index a')];
onReading(key => marked.forEach(el => el.setAttribute('aria-current', String(!!key && el.dataset.key === key))));

// ---- corner frame: which entry you are in (bottom right) and a link to the next one
(function corners() {
  const n = $('hereN'), name = $('hereName'), next = $('hereNext');
  if (!n || !name || !next) return;
  const label = next.querySelector('span');
  onReading(key => {
    const i = navEntries.findIndex(e => e.key === key);   // -1 at the top of the page
    n.textContent = String(i + 1).padStart(2, '0');
    name.textContent = i < 0 ? 'Welcome' : navEntries[i].label;
    const after = navEntries.find((e, j) => j > i && e.href !== '#');   // the next entry on this page
    next.hidden = !after;
    if (after) { next.href = href(after.href); label.textContent = 'Next: ' + after.label; }
  });
  // the index closes after a choice, or a click anywhere else
  const index = document.querySelector('.corner-index');
  if (index) {
    index.addEventListener('click', e => { if (e.target.closest('a')) index.open = false; });
    document.addEventListener('click', e => { if (index.open && !index.contains(e.target)) index.open = false; });
  }
})();

// ---- ask bar: "What do you need written?"
(function ask() {
  const input = $('askInput'), pop = $('askPop'), list = $('askList'), menuBtn = $('askMenuBtn'), menu = $('askMenu');
  if (!input || !pop || !list) return;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // every typed word must match the start of a word in the entry (or appear inside it)
  function search(q) {
    const words = norm(q).split(' ').filter(Boolean);
    if (!words.length) return [];
    return askIndex.map(e => {
      const hay = norm(e.label + ' ' + e.terms), parts = hay.split(' ');
      let score = 0;
      for (const w of words) {
        if (parts.some(p => p.startsWith(w))) score += 2;
        else if (hay.includes(w)) score += 1;
        else return null;
      }
      return { e, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 6).map(r => r.e);
  }
  let options = [], active = -1;
  function render() {
    const q = input.value.trim();
    options = search(q);
    if (q && !options.length) options = [{ label: q, section: 'Tell us about it', need: 'Something else', free: true }];
    if (active >= options.length) active = options.length - 1;
    list.replaceChildren(...options.map((e, i) => {
      const li = document.createElement('li');
      li.className = 'ask-opt'; li.id = 'askOpt' + i;
      li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      const text = document.createElement('span'), b = document.createElement('b'), small = document.createElement('small'), go = document.createElement('span');
      b.textContent = e.free ? `"${e.label}"` : e.label;
      small.textContent = e.free ? e.section : 'in ' + e.section;
      go.className = 'go'; go.textContent = e.href && e.href.startsWith('http') ? 'Open' : 'Enquire';
      text.append(b, small); li.append(text, go);
      li.addEventListener('mousedown', ev => { ev.preventDefault(); choose(e); });   // before the field loses focus
      return li;
    }));
    list.hidden = !options.length;
    input.setAttribute('aria-activedescendant', active >= 0 ? 'askOpt' + active : '');
  }
  const open = () => { pop.hidden = false; input.setAttribute('aria-expanded', 'true'); };
  const close = () => { pop.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
  // a chosen document goes to the enquiry form, already filled in
  function choose(e) {
    close(); input.blur();
    if (e.href && e.href.startsWith('http')) { location.href = e.href; return; }
    const form = $('enquiry');
    if (!form) { location.href = href('/#contact'); return; }
    const need = form.querySelector('select[name="need"]'), msg = form.querySelector('textarea[name="msg"]');
    if (need && e.need) need.value = e.need;
    if (msg) msg.value = 'We need help with: ' + e.label + '.';
    $('contact').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { const n = form.querySelector('input[name="name"]'); if (n) n.focus({ preventScroll: true }); }, REDUCE ? 0 : 700);
  }
  input.addEventListener('focus', () => { render(); open(); });
  input.addEventListener('input', () => { active = -1; render(); open(); });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!options.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = options[Math.max(0, active)];
      if (pick) choose(pick);
    } else if (e.key === 'Escape') { close(); input.blur(); }
  });
  pop.querySelectorAll('[data-q]').forEach(chip => chip.addEventListener('mousedown', ev => {
    ev.preventDefault(); input.value = chip.dataset.q; active = 0; render(); open();
  }));
  // Menu: the plain list, for anyone who would rather browse
  if (menuBtn && menu) {
    const setMenu = on => { menu.hidden = !on; menuBtn.setAttribute('aria-expanded', String(on)); };
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== menuBtn) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  }
})();
