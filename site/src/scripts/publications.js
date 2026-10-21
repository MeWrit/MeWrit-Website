/* The Publications page (src/pages/publications.astro): its filters, and the search's highlights. A kind
   (Acknowledged, one of Dr Hetal Shah's own kinds, or all), a search and a year narrow the cards together;
   a part with none left goes, with its heading; the count says how many show, and a line says so when none
   do. The search looks in what each card shows (its title, authors, journal and the acknowledgement's
   words), and every place it finds the words is highlighted, as a browser's find in page does (the user,
   2026-10-21): with the CSS Custom Highlight API where there is one (nothing in the page changes), else
   each match wrapped in a <mark>; the count adds how many places. The choice is kept in the address
   (?kind=, ?q=, ?year=), so a filtered list can be linked to and survives a refresh. */
const root = document.querySelector('.pb-page');
if (root) {
  const cards = [...root.querySelectorAll('.pb-card')], kinds = [...root.querySelectorAll('.pb-kind-btn')], secs = [...root.querySelectorAll('.pb-sec')];
  const search = root.querySelector('.pb-search input'), year = root.querySelector('.pb-year select');
  const count = root.querySelector('.pb-count'), empty = root.querySelector('.pb-empty');
  // what each card shows that the search reads
  const fieldsOf = new Map(cards.map(c => [c, [...c.querySelectorAll('h3, .pb-authors, .pb-source, .pb-quote p')]]));
  const HL = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function';
  const found = HL ? new Highlight() : null;
  if (HL) CSS.highlights.set('pb-find', found);
  const params = new URLSearchParams(location.search);
  let kind = params.get('kind') || 'all';
  if (!kinds.some(b => b.dataset.kind === kind)) kind = 'all';
  if (params.get('q')) search.value = params.get('q');
  if (params.get('year') && [...year.options].some(o => o.value === params.get('year'))) year.value = params.get('year');

  // an element's text as one string, and where each of its text nodes starts in it
  function textOf(el) {
    const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let flat = '', n;
    while ((n = w.nextNode())) { nodes.push({ node: n, start: flat.length }); flat += n.data; }
    return { nodes, flat };
  }
  // (a place in the string, as a text node and an offset in it)
  const at = (nodes, i) => { let k = nodes.length - 1; while (k > 0 && nodes[k].start > i) k--; return [nodes[k].node, i - nodes[k].start]; };
  // the <mark> way, for a browser without highlights: undone each time, then each match inside one text
  // node wrapped (a match across two, as over a bold name, is left plain there)
  function unmark() {
    root.querySelectorAll('mark.pb-find').forEach(m => { const p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
  }
  function markIn(el, q) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), hits = [];
    let n;
    while ((n = w.nextNode())) hits.push(n);
    hits.forEach(node => {
      let low = node.data.toLowerCase(), i = low.indexOf(q);
      while (i >= 0) {
        const hit = node.splitText(i), rest = hit.splitText(q.length), m = document.createElement('mark');
        m.className = 'pb-find'; hit.parentNode.replaceChild(m, hit); m.append(hit);
        node = rest; low = node.data.toLowerCase(); i = low.indexOf(q);
      }
    });
  }
  function apply() {
    const q = search.value.trim().toLowerCase(), y = year.value;
    if (HL) found.clear(); else unmark();
    let n = 0, places = 0;
    cards.forEach(c => {
      let show = (kind === 'all' || c.dataset.kind === kind) && (!y || c.dataset.year === y);
      if (show && q) {
        let hits = 0;
        fieldsOf.get(c).forEach(el => {
          const { nodes, flat } = textOf(el), low = flat.toLowerCase();
          for (let i = low.indexOf(q); i >= 0 && nodes.length; i = low.indexOf(q, i + q.length)) {
            hits++;
            if (HL) { const r = new Range(), [a, ao] = at(nodes, i), [b, bo] = at(nodes, i + q.length); r.setStart(a, ao); r.setEnd(b, bo); found.add(r); }
          }
          if (!HL && low.includes(q)) markIn(el, q);
        });
        show = hits > 0; places += hits;
      }
      c.hidden = !show; if (show) n++;
    });
    secs.forEach(s => { s.hidden = !s.querySelector('.pb-card:not([hidden])'); });
    kinds.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    count.textContent = `${n} ${n === 1 ? 'publication' : 'publications'}` + (q && places ? `, ${places} ${places === 1 ? 'match' : 'matches'}` : '');
    empty.hidden = n > 0;
    // (kept in the address, without a new history entry, and only when it changes)
    const p = new URLSearchParams();
    if (kind !== 'all') p.set('kind', kind);
    if (q) p.set('q', search.value.trim());
    if (y) p.set('year', y);
    const to = location.pathname + (p.toString() ? '?' + p : '') + location.hash;
    if (to !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', to);
  }
  kinds.forEach(b => b.addEventListener('click', () => { kind = b.dataset.kind; apply(); }));
  search.addEventListener('input', apply);
  year.addEventListener('change', apply);
  apply();
}
