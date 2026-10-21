/* The contact page (src/pages/contact.astro): the enquiry form and the copy buttons.
   The form checks what it needs (a name, an email that looks like one, a message), each trouble shown
   under its field and read out, then sends: to the form service when there is one (data-endpoint,
   site.ts formEndpoint), and says so; otherwise it writes the enquiry out as an email in the visitor's
   own mail app, and offers WhatsApp too. The copy buttons put the email address or the number on the
   clipboard, and say "Copied" for a moment. */
const form = document.getElementById('ctForm');
if (form) start();

function start() {
  const status = form.querySelector('.ct-status'), endpoint = form.dataset.endpoint || '', to = form.dataset.email, wa = form.dataset.wa;
  const val = n => String(new FormData(form).get(n) || '').trim();
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // a field's trouble, shown under it and read out (or cleared)
  function mark(name, msg) {
    const el = form.elements.namedItem(name), box = el && el.closest('.ct-field');
    if (!box) return;
    let err = box.querySelector('.ct-err');
    box.classList.toggle('bad', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg && !err) { err = document.createElement('span'); err.className = 'ct-err'; err.id = `ct-err-${name}`; box.append(err); el.setAttribute('aria-describedby', err.id); }
    if (err) err.textContent = msg || '';
  }
  function check() {
    const troubles = [
      ['name', val('name') ? '' : 'Your name, please'],
      ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')) ? '' : 'An email we can reply to'],
      ['message', val('message') ? '' : 'A line or two about what you need'],
    ];
    troubles.forEach(([n, m]) => mark(n, m));
    const first = troubles.find(([, m]) => m);
    return first ? form.elements.namedItem(first[0]) : null;
  }
  // once a field has been flagged, it clears as soon as it is put right
  form.addEventListener('input', e => { const box = e.target.closest('.ct-field'); if (box && box.classList.contains('bad')) check(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = check();
    if (bad) { bad.focus(); return; }
    const about = new FormData(form).getAll('about'), name = val('name');
    const lines = [`Name: ${name}`, `Email: ${val('email')}`];
    if (val('org')) lines.push(`Organisation: ${val('org')}`);
    if (val('phone')) lines.push(`Phone: ${val('phone')}`);
    if (about.length) lines.push(`About: ${about.join(', ')}`);
    lines.push('', val('message'));
    const text = lines.join('\n'), subject = `Enquiry${about.length ? `: ${about.join(', ')}` : ''} (${name})`;
    if (endpoint) {
      status.textContent = 'Sending...';
      try {
        const r = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.textContent = 'Thank you. Your enquiry is with us, and we will reply by email.';
      } catch (err) {
        status.innerHTML = `It could not be sent just now. Please write to <a href="mailto:${esc(to)}">${esc(to)}</a>.`;
      }
      return;
    }
    // no form service: the enquiry written out as an email in the visitor's mail app
    location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    status.innerHTML = `Your email app should open with the enquiry written out, ready to send. Not opening? Write to <a href="mailto:${esc(to)}">${esc(to)}</a>, or <a href="${esc(wa)}&text=${encodeURIComponent(text)}" target="_blank" rel="noopener">send it on WhatsApp</a>.`;
  });

  // the clipboard: the browser's own where the page is served securely, otherwise the older copy command
  // (a page over plain http, like the review server, has no navigator.clipboard)
  async function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; }
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
  document.querySelectorAll('.ct-copy').forEach(b => b.addEventListener('click', async () => {
    try {
      if (!(await copyText(b.dataset.copy))) return;
      b.dataset.done = '';
      setTimeout(() => { delete b.dataset.done; }, 1600);
    } catch (err) { /* no clipboard here: the tile itself still writes or calls */ }
  }));
}
