/* The gallery's review page (src/components/showcase/GalleryReview.astro, dev server only). Each album
   image shows the photos found in it as numbered boxes; Right, Keep whole, or Draw (drag a box round each
   photo, press Draw again to finish; a box's x removes it) marks it, and Reset forgets the mark. The marks
   stay in this browser (localStorage). Copy changes puts them as text on the clipboard (and in a box to
   copy by hand, the dev server being plain http): the images to keep whole, the boxes drawn, in each
   image's own pixels, and the images marked right; nothing of the photos themselves. A filter shows all,
   those to check, those cut, or those whole. */
const KEY = 'mewrit-gallery-review-1';
const list = document.querySelector('.rv-list');
if (list) start();

function start() {
  let marks = {};
  try { marks = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { marks = {}; }
  const items = [...list.querySelectorAll('.rv-item')];
  const progressEl = document.querySelector('.rv-progress');
  const progress = () => { progressEl.textContent = `${items.filter(i => marks[i.dataset.file]).length} of ${items.length} marked`; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (e) { /* storage off: the marks last this visit */ } progress(); };
  const pct = (v, of) => `${(v / of * 100).toFixed(3)}%`;

  items.forEach(item => {
    const f = item.dataset.file, W = +item.dataset.w, H = +item.dataset.h;
    const pic = item.querySelector('.rv-pic'), layer = item.querySelector('.rv-layer'), state = item.querySelector('.rv-state');
    const found = JSON.parse(pic.dataset.boxes || '[]');
    let drawing = false, mine = [];
    function render() {
      const m = marks[f];
      const boxes = drawing ? mine : m && m.verdict === 'boxes' ? m.boxes : m && m.verdict === 'whole' ? [] : found;
      layer.innerHTML = boxes.map((b, k) => `<div class="rv-box${drawing || (m && m.verdict === 'boxes') ? ' rv-mine' : ''}" style="left:${pct(b[0], W)};top:${pct(b[1], H)};width:${pct(b[2], W)};height:${pct(b[3], H)}"><span>${k + 1}</span>${drawing ? `<button type="button" class="rv-x" data-k="${k}" aria-label="Remove box ${k + 1}">×</button>` : ''}</div>`).join('');
      item.classList.toggle('rv-drawing', drawing);
      item.dataset.marked = m ? m.verdict : '';
      state.textContent = drawing ? 'Drag a box round each photo, then press Draw again to finish'
        : !m ? '' : m.verdict === 'right' ? 'Marked right' : m.verdict === 'whole' ? 'Keep whole' : `${m.boxes.length} photo${m.boxes.length === 1 ? '' : 's'} drawn`;
    }
    item.querySelector('.rv-acts').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'right') { drawing = false; marks[f] = { verdict: 'right' }; }
      else if (act === 'whole') { drawing = false; marks[f] = { verdict: 'whole' }; }
      else if (act === 'reset') { drawing = false; delete marks[f]; }
      else if (act === 'draw') {
        if (!drawing) { drawing = true; mine = []; }
        else { drawing = false; marks[f] = mine.length ? { verdict: 'boxes', boxes: mine } : { verdict: 'whole' }; }
      }
      save();
      render();
    });
    // a box: press, drag and let go on the picture
    let from = null, temp = null;
    const toPx = ev => { const r = pic.getBoundingClientRect(); return [Math.max(0, Math.min(W, (ev.clientX - r.left) / r.width * W)), Math.max(0, Math.min(H, (ev.clientY - r.top) / r.height * H))]; };
    const boxOf = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])];
    pic.addEventListener('pointerdown', e => {
      if (!drawing || e.target.closest('.rv-x')) return;
      e.preventDefault();
      pic.setPointerCapture(e.pointerId);
      from = toPx(e);
      temp = document.createElement('div');
      temp.className = 'rv-box rv-mine';
      layer.append(temp);
    });
    pic.addEventListener('pointermove', e => {
      if (!from) return;
      const b = boxOf(from, toPx(e));
      Object.assign(temp.style, { left: pct(b[0], W), top: pct(b[1], H), width: pct(b[2], W), height: pct(b[3], H) });
    });
    pic.addEventListener('pointerup', e => {
      if (!from) return;
      const b = boxOf(from, toPx(e)).map(Math.round);
      from = null;
      temp = null;
      if (b[2] > W * .03 && b[3] > H * .03) mine.push(b);
      render();
    });
    layer.addEventListener('click', e => {
      const x = e.target.closest('.rv-x');
      if (!x) return;
      mine.splice(+x.dataset.k, 1);
      render();
    });
    render();
  });

  // the filter: all, those to check, those cut, those whole
  const btns = [...document.querySelectorAll('.rv-bar .ev-kind')];
  btns.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.show;
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    items.forEach(i => { i.hidden = !(k === 'all' || (k === 'check' && i.dataset.check) || (k === 'cut' && i.dataset.cut) || (k === 'whole' && !i.dataset.cut)); });
  }));

  // Copy changes: the marks as text, never the photos
  const out = document.querySelector('.rv-out');
  document.querySelector('.rv-copy').addEventListener('click', async () => {
    const changes = {}, right = [];
    for (const [f, m] of Object.entries(marks)) {
      if (m.verdict === 'whole') changes[f] = { whole: true };
      else if (m.verdict === 'boxes') changes[f] = { boxes: m.boxes };
      else if (m.verdict === 'right') right.push(f);
    }
    const text = JSON.stringify({ changes, right });
    out.hidden = false;
    out.value = text;
    out.select();
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; } else ok = document.execCommand('copy'); } catch (e) { ok = false; }
    progressEl.textContent = ok ? 'Copied: paste it to Claude' : 'Select the text below and copy it';
  });
  progress();
}
