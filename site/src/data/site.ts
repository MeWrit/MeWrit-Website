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

export type NavLink = { label: string; href: string; note?: string };
export type NavItem = NavLink | { label: string; id: string; items: NavLink[] };

// desktop navigation (dropdowns show a short note under each link)
export const nav: NavItem[] = [
  {
    label: 'About', id: 'dd-about', items: [
      { label: 'Our Leadership', note: 'Dr Hetal Shah and team', href: '/#founder' },
      { label: 'Therapeutic Areas', note: '17 areas of experience', href: '/#areas' },
      { label: 'Publications', note: 'Papers, chapters, acknowledgements', href: '#' },
    ],
  },
  {
    label: 'Services', id: 'dd-svc', items: [
      { label: 'Regulatory Documentation', note: 'Protocols, CSRs, CTD modules', href: '/#services' },
      { label: 'Scientific Publications', note: 'Manuscripts, abstracts, posters', href: '/#services' },
      { label: 'Medical Communications', note: 'Slide decks, leaflets, grants', href: '/#services' },
      { label: 'Research Support', note: 'EC/IRB support, expert referrals', href: '/#services' },
    ],
  },
  { label: 'Trainings', href: '/#trainings' },
  { label: 'Gallery & Events', href: '#' },
  { label: 'Contact', href: '/#contact' },
];

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
