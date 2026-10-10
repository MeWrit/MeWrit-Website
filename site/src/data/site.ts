// Site-wide details: contact points, navigation and page meta.
// Links use "/#section" so they work from any future page, not just the home page.

export const site = {
  name: 'MeWriT',
  title: 'MeWriT | Medical Writing & Training',
  description: 'Founder-led medical writing and training consultancy in Ahmedabad, India.',
  themeColor: '#EEF1F7',
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
  { label: 'Gallery', href: '#' },
  { label: 'Contact', href: '/#contact', key: 'contact' },
];

// the nav lab's experimental layouts (spine, tabs, dock, comments, corners) use these entries;
// `note` is the short line the margin comments show
export const navEntries = [
  { label: 'About', href: '/#founder', key: 'about', note: 'Dr Hetal Shah and team' },
  { label: 'Services', href: '/#services', key: 'services', note: 'Protocols to publications' },
  { label: 'Trainings', href: '/#trainings', key: 'trainings', note: 'Classroom and online' },
  { label: 'Gallery', href: '#', key: 'gallery', note: 'Workshops and conferences' },
  { label: 'Contact', href: '/#contact', key: 'contact', note: 'Start a project' },
];

// the nav lab's ask bar: what a visitor might type, and where it leads. `need` is the matching
// choice in the enquiry form's "I need help with" list (src/data/home.ts)
export const askIndex = [
  { label: 'Clinical study report (CSR)', terms: 'csr clinical study report ich e3 regulatory', section: 'Regulatory Documentation', href: '/#services', need: 'Regulatory documents' },
  { label: 'Study protocol', terms: 'protocol study clinical trial regulatory', section: 'Regulatory Documentation', href: '/#services', need: 'Regulatory documents' },
  { label: 'CTD modules', terms: 'ctd module modules dossier submission regulatory', section: 'Regulatory Documentation', href: '/#services', need: 'Regulatory documents' },
  { label: 'Manuscript', terms: 'manuscript paper journal article publication', section: 'Scientific Publications', href: '/#services', need: 'Scientific publication' },
  { label: 'Abstract or poster', terms: 'abstract poster conference congress publication', section: 'Scientific Publications', href: '/#services', need: 'Scientific publication' },
  { label: 'Slide deck', terms: 'slides slide deck presentation', section: 'Medical Communications', href: '/#services', need: 'Medical communications' },
  { label: 'Leaflet', terms: 'leaflet brochure patient information', section: 'Medical Communications', href: '/#services', need: 'Medical communications' },
  { label: 'Grant application', terms: 'grant funding proposal application', section: 'Medical Communications', href: '/#services', need: 'Medical communications' },
  { label: 'EC or IRB submission support', terms: 'ec irb ethics committee submission research', section: 'Research Support', href: '/#services', need: 'Research support' },
  { label: 'Quality review of a document', terms: 'qc quality review check edit proofread', section: 'Quality Review', href: '/#services', need: 'Something else' },
  { label: 'Training for my team', terms: 'training workshop team course classroom in-person', section: 'Trainings', href: '/#trainings', need: 'Training or workshop' },
  { label: 'Online course (MeWriT Academy)', terms: 'online course academy learn certificate self-paced', section: 'MeWriT Academy', href: contact.academy, need: '' },
];
export const askChips = ['CSR', 'Protocol', 'Manuscript', 'Slide deck', 'Training'];

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
    { label: 'Gallery', note: 'Workshops and conferences', href: '#' },
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
  { label: 'Gallery', href: '#' },
  { label: 'Contact', href: '/#contact' },
  { label: 'MeWriT Academy', href: contact.academy },
];

// the office, as the deck (July 2026) gives it, one line each
export const office = ['710, Santorini Square, Lane Opp. Star Bazar', 'Satellite, Ahmedabad 380015', 'Gujarat, India'];

// the dark footer's practices column (src/components/SiteFooter.astro): the experience page's own
// sections, and the Academy
export const footerPractices: NavLink[] = [
  { label: 'The five practices', href: '/experience/#practices' },
  { label: 'Training', href: '/experience/#trainings' },
  { label: 'Start a project', href: '/experience/#contact' },
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
