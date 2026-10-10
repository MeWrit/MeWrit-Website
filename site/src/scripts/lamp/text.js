/* The words' motion on the lamplight pages: headlines that rise line by line, and labels that type
   in like a typewriter (never a scramble). Shared by film.js and inner.js. */

// a headline cut into its lines as the browser lays them out, so each can rise on its own: each line
// a clipping span (.lp-ln) around the words (.lp-li, numbered --i). Run again when the width changes;
// the words stay real text, in order
export function splitLines(el) {
  const text = el.dataset.text || (el.dataset.text = el.textContent.trim().replace(/\s+/g, ' '));
  const words = text.split(' ').map(w => { const s = document.createElement('span'); s.textContent = w; return s; });
  el.replaceChildren();
  words.forEach((s, i) => { if (i) el.append(' '); el.append(s); });
  const lines = [];
  let top = null;
  words.forEach(s => { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 3) { lines.push([]); top = t; } lines[lines.length - 1].push(s.textContent); });
  el.replaceChildren();
  lines.forEach((ws, i) => {
    const ln = document.createElement('span'), li = document.createElement('span');
    ln.className = 'lp-ln'; li.className = 'lp-li'; li.style.setProperty('--i', i); li.textContent = ws.join(' ');
    ln.append(li); el.append(ln);
    if (i < lines.length - 1) el.append(' ');
  });
  return lines.length;
}

// labels that type in: type(el, text) starts one (at once without motion); tick(now) moves every one
// on, writing only when a letter is added. While a label types it carries .typing (a caret, in CSS)
export function typer(motion, cps = 42) {
  const jobs = new Map();
  return {
    type(el, text, now) {
      if (!el) return;
      if (!motion) { el.textContent = text; el.classList.remove('typing'); jobs.delete(el); return; }
      jobs.set(el, { text, at: now, shown: -1 });
      el.classList.add('typing');
    },
    tick(now) {
      jobs.forEach((j, el) => {
        const k = Math.max(0, Math.min(j.text.length, Math.floor((now - j.at) / 1000 * cps)));
        if (k !== j.shown) { j.shown = k; el.textContent = j.text.slice(0, k); }
        if (k >= j.text.length) { el.classList.remove('typing'); jobs.delete(el); }
      });
    },
  };
}
