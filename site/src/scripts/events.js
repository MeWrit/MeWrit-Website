/* Events (src/components/showcase/EventsIndex.astro): the record's filters by kind (a year left with
   nothing to show goes too); the small calendar, a month at a time, Monday first, the record's days marked
   (MeWriT's own in the logo's orange) and a marked day's events listed under it; and a last check in the
   visitor's own calendar: a "next" workshop whose last day has passed since the page was built reads as
   the most recent one, its registration closed. */
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TODAY = keyOf(new Date());

const rec = document.querySelector('.ev-rec');
if (rec) {
  const btns = [...rec.querySelectorAll('.ev-kind')], rows = [...rec.querySelectorAll('.ev-row')];
  const years = [...rec.querySelectorAll('.ev-year')], empty = rec.querySelector('.ev-empty');
  const apply = k => {
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === k)));
    rows.forEach(r => { r.hidden = !(k === 'all' || (k === 'mewrit' ? r.dataset.mewrit === '1' : r.dataset.kind === k)); });
    years.forEach(y => { y.hidden = !y.querySelector('.ev-row:not([hidden])'); });
    empty.hidden = rows.some(r => !r.hidden);
  };
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.kind)));
}

const cal = document.querySelector('.ev-cal');
if (cal) {
  const marks = JSON.parse(cal.dataset.marks || '[]');
  const grid = cal.querySelector('.ev-cal-grid'), title = cal.querySelector('.ev-cal-m'), list = cal.querySelector('.ev-cal-list');
  const now = new Date(), start = cal.dataset.start;
  // (it opens on the next workshop's month, or on this month)
  let y = start ? +start.slice(0, 4) : now.getFullYear(), m = start ? +start.slice(5, 7) - 1 : now.getMonth();
  const on = k => marks.filter(x => x.s <= k && k <= x.e);
  const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  function draw() {
    title.textContent = new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let html = WD.map(d => `<span class="ev-cal-wd" aria-hidden="true">${d}</span>`).join('');
    for (let i = 0; i < lead; i++) html += '<span aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`, here = on(k), cls = k === TODAY ? ' today' : '';
      html += here.length
        ? `<button type="button" class="ev-cal-d has${here.some(x => x.m) ? ' ours' : ''}${cls}" data-k="${k}" aria-label="${d} ${esc(title.textContent)}: ${here.length} event${here.length > 1 ? 's' : ''}">${d}</button>`
        : `<span class="ev-cal-d${cls}">${d}</span>`;
    }
    grid.innerHTML = html;
    list.innerHTML = '';
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    grid.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    list.innerHTML = on(b.dataset.k).map(x => `<li><a href="${esc(x.u)}">${esc(x.t)}</a></li>`).join('');
  });
  cal.querySelectorAll('.ev-cal-go').forEach(b => b.addEventListener('click', () => {
    m += +b.dataset.go;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    draw();
  }));
  draw();
}

// a "next" workshop already over in the visitor's calendar (the page was built before its day)
const nx = document.querySelector('.ev-next:not(.ev-past)');
if (nx && nx.dataset.last && nx.dataset.last.length === 10 && nx.dataset.last < TODAY) {
  nx.classList.add('ev-past');
  const k = nx.querySelector('.sc-k'), reg = nx.querySelector('.ev-acts .btn-primary');
  if (k) k.textContent = 'Our most recent workshop';
  if (reg) { const s = document.createElement('span'); s.className = 'ev-closed'; s.textContent = 'Registration closed'; reg.replaceWith(s); }
}
