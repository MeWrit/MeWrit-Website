// Site-wide details: contact points, navigation and page meta.
// Links use "/#section" so they work from any future page, not just the home page.

export const site = {
  name: 'MeWriT',
  title: 'MeWriT | Medical Writing & Training',
  description: 'Founder-led medical writing and training consultancy in Ahmedabad, India.',
  themeColor: '#FBFCFE',
};

export const contact = {
  phoneDisplay: '+91 97277 16506',
  phoneHref: 'tel:+919727716506',
  whatsapp: 'https://api.whatsapp.com/send?phone=919727716506',
  email: 'hetal@mewrit.com',
  linkedin: 'https://www.linkedin.com/company/mewrit',
  academy: 'https://academy.mewrit.com/',
};

// `art` picks the small illustration a link gets in the floating capsule's rich panels;
// `key` ties a top-level entry to the page section it leads to (for the nav that follows
// where you are reading)
export type NavLink = { label: string; href: string; note?: string; art?: string; key?: string };
export type NavItem = NavLink | { label: string; id: string; key?: string; items: NavLink[] };

// desktop navigation (dropdowns show a short note under each link)
export const nav: NavItem[] = [
  {
    label: 'About', id: 'dd-about', key: 'about', items: [
      { label: 'Our Leadership', note: 'Dr Hetal Shah and team', href: '/#founder', art: 'person' },
      { label: 'Therapeutic Areas', note: '17 areas of experience', href: '/#areas', art: 'chips' },
      { label: 'Publications', note: 'Papers, chapters, acknowledgements', href: '#', art: 'paper' },
    ],
  },
  {
    label: 'Services', id: 'dd-svc', key: 'services', items: [
      { label: 'Regulatory Documentation', note: 'Protocols, CSRs, CTD modules', href: '/#services', art: 'protocol' },
      { label: 'Scientific Publications', note: 'Manuscripts, abstracts, posters', href: '/#services', art: 'chart' },
      { label: 'Medical Communications', note: 'Slide decks, leaflets, grants', href: '/#services', art: 'slides' },
      { label: 'Research Support', note: 'EC/IRB support, expert referrals', href: '/#services', art: 'check' },
    ],
  },
  { label: 'Trainings', href: '/#trainings', key: 'trainings' },
  { label: 'Gallery & Events', href: '#' },
  { label: 'Contact', href: '/#contact', key: 'contact' },
];

// the phone dock (nav lab): the sheets its buttons open
export const dock = {
  services: [
    { label: 'Regulatory Documentation', note: 'Protocols, CSRs, CTD modules', href: '/#services' },
    { label: 'Scientific Publications', note: 'Manuscripts, abstracts, posters', href: '/#services' },
    { label: 'Medical Communications', note: 'Slide decks, leaflets, grants', href: '/#services' },
    { label: 'Research Support', note: 'EC/IRB support, expert referrals', href: '/#services' },
    { label: 'Quality Review', note: 'An expert second read', href: '/#services' },
  ],
  about: [
    { label: 'Our Leadership', note: 'Dr Hetal Shah and team', href: '/#founder' },
    { label: 'Therapeutic Areas', note: '17 areas of experience', href: '/#areas' },
    { label: 'Publications', note: 'Papers, chapters, acknowledgements', href: '#' },
    { label: 'Gallery & Events', note: 'Workshops and conferences', href: '#' },
    { label: 'MeWriT Academy', note: 'Online courses', href: contact.academy },
  ],
};

// phone menu
export const mobileNav: NavItem[] = [
  {
    label: 'About', id: 'm-about', items: [
      { label: 'Our Leadership', href: '/#founder' },
      { label: 'Therapeutic Areas', href: '/#areas' },
      { label: 'Publications', href: '#' },
    ],
  },
  {
    label: 'Services', id: 'm-svc', items: [
      { label: 'Regulatory Documentation', href: '/#services' },
      { label: 'Scientific Publications', href: '/#services' },
      { label: 'Medical Communications', href: '/#services' },
      { label: 'Trainings', href: '/#trainings' },
      { label: 'Research Support', href: '/#services' },
    ],
  },
  { label: 'Trainings', href: '/#trainings' },
  { label: 'Gallery & Events', href: '#' },
  { label: 'Contact', href: '/#contact' },
  { label: 'MeWriT Academy', href: contact.academy },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Services', links: [
      { label: 'Regulatory', href: '/#services' },
      { label: 'Publications', href: '/#services' },
      { label: 'Med Comms', href: '/#services' },
      { label: 'Trainings', href: '/#trainings' },
    ],
  },
  {
    title: 'Company', links: [
      { label: 'Leadership', href: '/#founder' },
      { label: 'Publications', href: '#' },
      { label: 'Gallery', href: '#' },
      { label: 'Academy', href: contact.academy },
    ],
  },
  {
    title: 'Contact', links: [
      { label: contact.email, href: `mailto:${contact.email}` },
      { label: contact.phoneDisplay, href: contact.phoneHref },
      { label: 'LinkedIn', href: contact.linkedin },
    ],
  },
];
