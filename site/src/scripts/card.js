/* Dr Hetal Shah's profile (src/pages/hetal/index.astro): Share, the QR code, Save contact, and the question.
   Save contact opens her contact file (./Dr-Hetal-Shah.vcf): on an iPhone the Add Contact screen with
   everything filled in, saved with one tap; on Android the file downloads and opens in Contacts (no website
   can add a contact without the visitor's tap), so a short line says what to do on the device in hand.
   The question: once the reader has spent ASK_AFTER on the page with it on screen (the time people spend
   on a web page on average), a sheet asks whether they would like to reach out (call, WhatsApp, email)
   and whether to save her contact (yes opens the contact file). It is not asked of someone who has saved
   her contact, and not again for 30 days after a no, or after they reached out (kept in this browser).
   Each Save contact also sends the event "nb:sign": the page's script traces her signature again with the
   film's pen (src/pages/hetal/index.astro), and a night band showing the film's page signs it again
   (src/scripts/band.js). */
const page = document.querySelector('.cd-page');
if (page) {
  // the cross-industry average time on a web page: 54 s (Contentsquare, 2021 Digital Experience Benchmark,
  // over 20 billion sessions; as reported by HubSpot); counted only while the page is on screen
  const ASK_AFTER = 54000, KEEP = 30 * 864e5, KEY = 'mewrit-card-hetal';
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const HINT = ios ? 'Her card opens with everything filled in: tap Create New Contact to save it.'
    : android ? 'Her card downloads: open it from the notification, and Contacts saves it in one tap.'
    : 'Her card downloads: open the file to add her to your contacts.';
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { /* storage off */ }
  const keep = (k) => { state[k] = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage off */ } };
  const recent = t => typeof t === 'number' && Date.now() - t < KEEP;

  const toast = document.querySelector('.cd-toast');
  let toastT = 0;
  function say(text) {
    if (!toast) return;
    toast.textContent = text; toast.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 4200);
  }
  const url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href;
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* (no clipboard on plain http) */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* none */ }
    ta.remove();
    return ok;
  }

  // Save contact (on the card, at the end, and the question's yes): the link does the work; this keeps a
  // note that it was saved, and says what to do next
  const ask = document.querySelector('.cd-ask');
  document.querySelectorAll('[data-save]').forEach(a => a.addEventListener('click', () => {
    keep('saved');
    document.dispatchEvent(new CustomEvent('nb:sign'));   // (her page, signed again)
    if (a.hasAttribute('data-yes') && ask) {
      ask.querySelector('[data-step="ask"]').hidden = true;
      const done = ask.querySelector('[data-step="done"]');
      done.querySelector('[data-hint]').textContent = HINT;
      done.hidden = false;
      done.querySelector('h2').focus();   // (read next, in place of the question)
    } else say(HINT);
  }));
  document.querySelectorAll('[data-reach]').forEach(a => a.addEventListener('click', () => keep('reached')));

  // Share: the phone's own share sheet where there is one, else the link copied
  const shareBtn = document.querySelector('[data-share]');
  if (shareBtn) shareBtn.addEventListener('click', async () => {
    const data = { title: document.title, text: 'Dr Hetal Shah, Founder & Director, MeWriT', url };
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    say(await copy(url) ? 'Link to her profile copied' : url);
  });

  // the dialogs: closed by their x, Done, the backdrop, or Esc
  const qrDlg = document.querySelector('.cd-qrdlg');
  const open = d => { if (d && !d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); } };
  const close = d => { if (d && d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } };
  document.querySelectorAll('.cd-dlg').forEach(d => {
    d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => close(d)));
    d.addEventListener('click', e => { if (e.target === d) close(d); });   // (a tap on the backdrop)
  });
  const qrBtn = document.querySelector('[data-qr]');
  if (qrBtn) qrBtn.addEventListener('click', () => open(qrDlg));
  const copyBtn = document.querySelector('[data-copy]');
  if (copyBtn) copyBtn.addEventListener('click', async () => say(await copy(url) ? 'Link to her profile copied' : url));

  // the question, after the average time on a page, with the page on screen
  if (ask && !state.saved && !recent(state.dismissed) && !recent(state.reached)) {
    let seen = 0, last = Date.now();
    const tick = setInterval(() => {
      const now = Date.now();
      if (!document.hidden) seen += now - last;
      last = now;
      // (not over the QR code someone is scanning; it waits for that to close)
      if (seen >= ASK_AFTER && !(qrDlg && qrDlg.open)) {
        clearInterval(tick);
        if (!state.saved && !recent(state.reached)) open(ask);
      }
    }, 1000);
    ask.querySelector('[data-no]').addEventListener('click', () => { keep('dismissed'); close(ask); });
    // closed any other way without saving (its x, Esc, the backdrop): not asked again for a while either
    ask.addEventListener('close', () => { if (!recent(state.saved)) keep('dismissed'); });
  }
}
