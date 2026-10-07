/* Page behaviour: section links, menu, header, phone action bar, areas toggle, testimonials
   carousel, enquiry form, scroll reveal and the entrance when there is no intro. */
import { $, REDUCE, STATIC } from './shared.js';
import { href } from '../lib/url';

const root = document.documentElement;

// Links to the home page's sections ("/#services") lead there from any page. On a page that has
// the section itself (version B, the nav lab) they stay on that page.
const home = new URL(href('/'), location.href).pathname;
if (location.pathname !== home) document.querySelectorAll('a[href*="#"]').forEach(a => {
  const u = new URL(a.href, location.href);
  if (u.origin === location.origin && u.pathname === home && u.hash.length > 1 && document.getElementById(u.hash.slice(1))) a.setAttribute('href', u.hash);
});

// menu: native dialog (focus trap, Esc, top layer). overflow:hidden on <html> unsticks
// nothing visible: the full-screen dialog covers the page, and it is restored on close.
// With the floating capsule on phones the capsule opens its own card instead (nav-variants.js).
const menu = $('menu');
$('menuOpen').addEventListener('click', () => {
  if (root.dataset.phone === 'capsule') return;
  menu.showModal(); root.style.overflow = 'hidden';
});
const closeMenu = () => { if (menu.open) menu.close(); };
$('menuClose').addEventListener('click', closeMenu);
menu.addEventListener('close', () => { root.style.overflow = ''; });
menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

document.querySelectorAll('.has-dd > button').forEach(b => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.has-dd > button').forEach(x => x.setAttribute('aria-expanded', 'false'));
  b.setAttribute('aria-expanded', String(!open));
}));
document.addEventListener('click', e => { if (!e.target.closest('.has-dd')) document.querySelectorAll('.has-dd > button').forEach(x => x.setAttribute('aria-expanded', 'false')); });

// header: solid once scrolled; on phones it hides on scroll down and returns on scroll up
const header = $('siteHeader');
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  header.classList.toggle('is-solid', y > 8);
  if (y > 160 && y > lastY + 4) header.classList.add('is-hidden');
  else if (y < lastY - 4 || y < 160) header.classList.remove('is-hidden');
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// phone action bar
const bar = $('actionBar');
let ctasGone = false, formNear = false, typing = false;
const sync = () => bar.classList.toggle('show', ctasGone && !formNear && !typing);
// it appears once the page's own buttons have scrolled away (the hero's on the home page, the
// first row of buttons elsewhere), and steps aside near the enquiry form, if the page has one
const ctas = $('heroCtas') || document.querySelector('main .btn-row'), contactEl = $('contact');
if (ctas) new IntersectionObserver(([e]) => { ctasGone = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(ctas);
else { ctasGone = true; sync(); }
if (contactEl) new IntersectionObserver(([e]) => { formNear = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contactEl);
document.addEventListener('focusin', e => { if (e.target.matches('input,select,textarea')) { typing = true; sync(); } });
document.addEventListener('focusout', () => { typing = false; sync(); });

const chips = $('areaChips'), at = $('areasToggle');
if (chips && at) {
  const showAll = at.textContent;
  at.addEventListener('click', () => {
    const collapsed = chips.dataset.collapsed === 'true';
    chips.dataset.collapsed = String(!collapsed);
    at.setAttribute('aria-expanded', String(collapsed));
    at.textContent = collapsed ? 'Show fewer' : showAll;
  });
}

const car = $('carousel');
if (car) {
  const slides = [...car.children], dots = $('dots');
  slides.forEach((s, i) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', 'Testimonial ' + (i + 1));
    d.addEventListener('click', () => s.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
    dots.appendChild(d);
  });
  const setActive = i => [...dots.children].forEach((d, j) => d.setAttribute('aria-current', String(i === j)));
  setActive(0);
  const slideObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(slides.indexOf(e.target)); }), { root: car, threshold: .6 });
  slides.forEach(s => slideObs.observe(s));
  const step = dir => car.scrollBy({ left: dir * (slides[0].getBoundingClientRect().width + 14), behavior: 'smooth' });
  $('prev').addEventListener('click', () => step(-1));
  $('next2').addEventListener('click', () => step(1));
}

const form = $('enquiry');
if (form) form.addEventListener('submit', e => { e.preventDefault(); if (form.reportValidity()) form.classList.add('sent'); });

// calm scroll reveal
const reveals = document.querySelectorAll('.reveal');
if (STATIC || REDUCE || !('IntersectionObserver' in window)) reveals.forEach(r => r.classList.add('in'));
else {
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(r => ro.observe(r));
}

// without an intro, run the entrance right after first paint
if (!root.classList.contains('intro-on')) requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('pre-enter')));
