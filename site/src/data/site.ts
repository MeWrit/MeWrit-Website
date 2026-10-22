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
// `soon`: a page still to come, shown marked Soon and not as a link
export type NavLink = { label: string; href: string; note?: string; art?: string; key?: string; ext?: boolean; soon?: boolean };
export type NavItem = NavLink | { label: string; id: string; key?: string; href?: string; items: NavLink[] };

// desktop navigation (the dropdowns show a short note under each): Home; About (who we are, why MeWriT,
// the leadership); the five practices; the expertise behind them (publications, therapeutic areas); the
// showcase (events and the gallery). Get in touch is the header's button, so no Contact link beside it,
// and the Academy a second, quieter button beside it (SiteHeader.astro). The user, 2026-10-21: the old
// menu was "redundant and a lot in the wrong place": Trainings repeated the Training practice, Contact the
// button; Practices itself leads to the five practices, its panel opening on the pointer only; Leadership
// for Dr Hetal and Dr Amit; Expertise for the publications and the therapeutic areas. 2026-10-22: a Home
// item, the Academy as a button "not the same as get in touch", Events and Gallery "under a showcase menu
// dropdown", shown now and marked Soon until their pages exist, then "who we are, why mewrit and
// leadership in an about dropdown". Its places in the home page's film (/#who, /#practices,
// /#regulatory-writing ...) are the ids index.astro gives those scenes: experience.js opens the film
// there, or goes there at once on the home page, and marks the entry for the part of the film on screen
// (`key`; a dropdown's entry answers to its items' keys too, so About is marked for who we are and why
// MeWriT). The phone menu (SiteMenu.astro) holds the same entries as tiles
export const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About', id: 'dd-about', key: 'about', items: [
      { label: 'Who we are', note: 'Medical writers, therapeutic-area experts and biostatisticians', href: '/#who', key: 'who' },
      { label: 'Why MeWriT', note: 'Scientific rigour, guideline discipline, and what clients say', href: '/#why', key: 'why' },
      { label: 'Leadership', note: 'Dr Hetal Shah and Dr Amit Shah, who lead MeWriT', href: '/leadership/', key: 'leadership' },
    ],
  },
  {
    label: 'Practices', id: 'dd-practices', key: 'practices', href: '/#practices', items: [
      { label: 'Regulatory writing', note: 'Clinical trial and regulatory documentation', href: '/#regulatory-writing', art: 'protocol' },
      { label: 'Scientific publications', note: 'Manuscripts, reviews and congress materials', href: '/#scientific-publications', art: 'chart' },
      { label: 'Medical communications', note: 'Strategic medical communications', href: '/#medical-communications', art: 'slides' },
      { label: 'Training', note: 'Structured workshops and the MeWriT Academy', href: '/#training', art: 'person' },
      { label: 'AI/ML advisory', note: 'Domain expertise for AI and ML in medical writing', href: '/#ai-ml-advisory', art: 'chips' },
    ],
  },
  {
    label: 'Expertise', id: 'dd-expertise', key: 'expertise', items: [
      { label: 'Publications', note: 'Papers, chapters, reviews and congress presentations, and the published work we supported', href: '/publications/', art: 'paper' },
      { label: 'Therapeutic areas', note: 'From oncology and cardiology to vaccines and medical devices', href: '/therapeutic-areas/', art: 'chips' },
    ],
  },
  {
    label: 'Showcase', id: 'dd-showcase', key: 'showcase', items: [
      // (Soon wherever their record is not built: src/data/showcase.ts)
      { label: 'Events', note: 'Workshops, conferences and webinars', href: '/events/', soon: true },
      { label: 'Gallery', note: 'Pictures from the workshops and conferences', href: '/gallery/', soon: true },
    ],
  },
];

// the nav lab's experimental layouts (spine, tabs, dock, comments, corners) use these entries;
// `note` is the short line the margin comments show
export const navEntries = [
  // (the old home's places, #founder, #services and #trainings, are gone: each leads to the new site's own)
  { label: 'About', href: '/leadership/', key: 'about', note: 'Dr Hetal Shah and team' },
  { label: 'Services', href: '/#practices', key: 'services', note: 'Protocols to publications' },
  { label: 'Trainings', href: '/#training', key: 'trainings', note: 'Classroom and online' },
  { label: 'Gallery', href: '#', key: 'gallery', note: 'Workshops and conferences' },
  { label: 'Contact', href: '/#contact', key: 'contact', note: 'Start a project' },
];

// the nav lab's ask bar: what a visitor might type, and where it leads. `need` is the matching
// choice in the enquiry form's "I need help with" list (src/data/home.ts)
export const askIndex = [
  { label: 'Clinical study report (CSR)', terms: 'csr clinical study report ich e3 regulatory', section: 'Regulatory Documentation', href: '/#regulatory-writing', need: 'Regulatory documents' },
  { label: 'Study protocol', terms: 'protocol study clinical trial regulatory', section: 'Regulatory Documentation', href: '/#regulatory-writing', need: 'Regulatory documents' },
  { label: 'CTD modules', terms: 'ctd module modules dossier submission regulatory', section: 'Regulatory Documentation', href: '/#regulatory-writing', need: 'Regulatory documents' },
  { label: 'Manuscript', terms: 'manuscript paper journal article publication', section: 'Scientific Publications', href: '/#scientific-publications', need: 'Scientific publication' },
  { label: 'Abstract or poster', terms: 'abstract poster conference congress publication', section: 'Scientific Publications', href: '/#scientific-publications', need: 'Scientific publication' },
  { label: 'Slide deck', terms: 'slides slide deck presentation', section: 'Medical Communications', href: '/#medical-communications', need: 'Medical communications' },
  { label: 'Leaflet', terms: 'leaflet brochure patient information', section: 'Medical Communications', href: '/#medical-communications', need: 'Medical communications' },
  { label: 'Grant application', terms: 'grant funding proposal application', section: 'Medical Communications', href: '/#medical-communications', need: 'Medical communications' },
  { label: 'EC or IRB submission support', terms: 'ec irb ethics committee submission research', section: 'Research Support', href: '/#practices', need: 'Research support' },
  { label: 'Quality review of a document', terms: 'qc quality review check edit proofread', section: 'Quality Review', href: '/#practices', need: 'Something else' },
  { label: 'Training for my team', terms: 'training workshop team course classroom in-person', section: 'Trainings', href: '/#training', need: 'Training or workshop' },
  { label: 'Online course (MeWriT Academy)', terms: 'online course academy learn certificate self-paced', section: 'MeWriT Academy', href: contact.academy, need: '' },
];
export const askChips = ['CSR', 'Protocol', 'Manuscript', 'Slide deck', 'Training'];

// the phone dock (nav lab): the sheets its buttons open
export const dock = {
  services: [
    { label: 'Regulatory Documentation', note: 'Protocols, CSRs, CTD modules', href: '/#regulatory-writing' },
    { label: 'Scientific Publications', note: 'Manuscripts, abstracts, posters', href: '/#scientific-publications' },
    { label: 'Medical Communications', note: 'Slide decks, leaflets, grants', href: '/#medical-communications' },
    { label: 'Research Support', note: 'EC/IRB support, expert referrals', href: '/#practices' },
    { label: 'Quality Review', note: 'An expert second read', href: '/#practices' },
  ],
  about: [
    { label: 'Our Leadership', note: 'Dr Hetal Shah and team', href: '/leadership/' },
    { label: 'Therapeutic Areas', note: '17 areas of experience', href: '/therapeutic-areas/' },
    { label: 'Publications', note: 'Papers, chapters, acknowledgements', href: '/publications/' },
    { label: 'Gallery', note: 'Workshops and conferences', href: '#' },
    { label: 'MeWriT Academy', note: 'Online courses', href: contact.academy },
  ],
};

// phone menu
export const mobileNav: NavItem[] = [
  {
    label: 'About', id: 'm-about', items: [
      { label: 'Our Leadership', href: '/leadership/' },
      { label: 'Therapeutic Areas', href: '/therapeutic-areas/' },
      { label: 'Publications', href: '/publications/' },
    ],
  },
  {
    label: 'Services', id: 'm-svc', items: [
      { label: 'Regulatory Documentation', href: '/#regulatory-writing' },
      { label: 'Scientific Publications', href: '/#scientific-publications' },
      { label: 'Medical Communications', href: '/#medical-communications' },
      { label: 'Trainings', href: '/#training' },
      { label: 'Research Support', href: '/#practices' },
    ],
  },
  { label: 'Trainings', href: '/#training' },
  { label: 'Gallery', href: '#' },
  { label: 'Contact', href: '/contact/' },
  { label: 'MeWriT Academy', href: contact.academy },
];

// the office, as the deck (July 2026) gives it, one line each
export const office = ['710, Santorini Square, Lane Opp. Star Bazar', 'Satellite, Ahmedabad 380015', 'Gujarat, India'];
// the office on Google Maps: found by its building (with the unit and the lane, Maps returns a list of
// places rather than one pin); the map embedded on the contact page and in the foot, and the
// directions its address opens. Both forms of link are allowed by Google's robots.txt (/maps?q=,
// /maps/dir/; checked 2026-10-21)
const officeMap = 'Santorini Square, Satellite, Ahmedabad 380015';
export const maps = {
  embed: `https://www.google.com/maps?q=${encodeURIComponent(officeMap)}&output=embed&hl=en&z=16`,
  directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeMap)}`,
};
// where the enquiry form posts (a form service's address); empty, the form writes the enquiry as an
// email in the visitor's own mail app instead (src/scripts/contact.js)
export const formEndpoint = '';

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
