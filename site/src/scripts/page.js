/* Page behaviour: menu, header, phone action bar, areas toggle, testimonials carousel,
   enquiry form, scroll reveal and the entrance when there is no intro. */
import { $, REDUCE, STATIC } from './shared.js';

const root = document.documentElement;

// menu: native dialog (focus trap, Esc, top layer). overflow:hidden on <html> unsticks
// nothing visible: the full-screen dialog covers the page, and it is restored on close.
const menu = $('menu');
$('menuOpen').addEventListener('click', () => { menu.showModal(); root.style.overflow = 'hidden'; });
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
new IntersectionObserver(([e]) => { ctasGone = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe($('heroCtas'));
new IntersectionObserver(([e]) => { formNear = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe($('contact'));
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
