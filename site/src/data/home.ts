// Home page copy. Lorem ipsum marks text still to come from Dr Hetal Shah's edited
// Word document; replace it here and the page updates. Plain text everywhere except
// fields ending in "Html", which may hold simple inline tags such as <em>.
import type { IconName } from './icons';
import { contact } from './site';

export type Cta = { label: string; href: string; style: 'primary' | 'outline' };

export const hero = {
  eyebrow: 'Medical writing & training',
  titleHtml: 'We write your <em>science</em> right.',
  lead: 'Founder-led medical writing and training for pharma, CROs, device companies and academia.',
  ctas: [
    { label: 'Get in touch', href: '/#contact', style: 'primary' },
    { label: 'Explore trainings', href: '/#trainings', style: 'outline' },
  ] as Cta[],
  founder: { name: 'Led by Dr Hetal Shah', role: 'PhD Pharmacologist · 22+ years in clinical research' },
  // the two small cards that float by the heartbeat panel on desktop
  cards: {
    compliant: { title: 'Guideline compliant', text: 'ICH · ICMJE · GPP · CONSORT' },
    ready: { title: 'Submission-ready', text: 'Protocols · CSRs · Manuscripts' },
  },
  panelDescription: 'A heartbeat line of clinical data flows into a document that writes itself, line by line, and passes quality control.',
  // the numbers bar at the foot of the hero (desktop)
  stats: [
    { value: '22+', label: 'years in clinical research' },
    { value: '70+', label: 'publications and presentations' },
    { value: '3,000+', label: 'professionals trained' },
    { value: '17', label: 'therapeutic areas' },
  ],
};

// the same numbers as a block after the hero (phones and tablets)
export const stats = [
  { value: '22+', label: 'years in clinical research and writing' },
  { value: '70+', label: 'publications and presentations' },
  { value: '3,000+', label: 'professionals trained since 2008' },
  { value: '17', label: 'therapeutic areas' },
];

export const founder = {
  eyebrow: 'Meet the founder',
  name: 'Dr Hetal Shah',
  role: 'Founder & Director',
  bio: 'A PhD Pharmacologist and Gold (Double) Medalist with more than 22 years in clinical research and medical writing across clinical sites and CROs.',
  chips: ['Section Editor, PICR', 'ISCR life member', 'DIA Global Mentor', 'GCP trained'],
  link: { label: 'Read full profile', href: '#' },
  recognition: [
    { icon: 'medal', label: 'ISCR Hall of Fame Award' },
    { icon: 'medal', label: 'Woman Entrepreneur in Pharma & Healthcare' },
    { icon: 'mortarboard', label: 'NSRCEL, IIM Bangalore' },
    { icon: 'mortarboard', label: 'Goldman Sachs 10,000 Women' },
    { icon: 'people', label: 'NITI Aayog WEP Mentor' },
  ] as { icon: IconName; label: string }[],
};

export const services = {
  eyebrow: 'What we do',
  title: 'Services across the drug development cycle',
  items: [
    { icon: 'doc-check', title: 'Regulatory Documentation', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.', more: 'Explore service', href: '#' },
    { icon: 'doc-lines', title: 'Scientific Publications', text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.', more: 'Explore service', href: '#' },
    { icon: 'chat', title: 'Medical Communications', text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.', more: 'Explore service', href: '#' },
    { icon: 'cap', title: 'Trainings & Workshops', text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui.', more: 'See trainings', href: '/#trainings' },
    { icon: 'flask', title: 'Research Support', text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.', more: 'Explore service', href: '#' },
    { icon: 'pen', title: 'Quality Review', text: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit.', more: 'Ask about QC', href: '/#contact' },
  ] as { icon: IconName; title: string; text: string; more: string; href: string }[],
};

export const why = {
  eyebrow: 'Why MeWriT',
  title: 'Boutique attention, industry-grade rigour',
  lead: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  points: [
    { title: 'Founder-led', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing.' },
    { title: 'Guideline compliant', text: 'Sed do eiusmod tempor incididunt ut labore.' },
    { title: 'Clinical expertise on call', text: 'Ut enim ad minim veniam, quis nostrud.' },
    { title: "A trainer's clarity", text: 'Duis aute irure dolor in reprehenderit.' },
  ],
};

export const areas = {
  eyebrow: 'Therapeutic experience',
  title: 'Seventeen areas and counting',
  // phones show the first nine until "Show all" is pressed (see .areas in sections.css)
  list: [
    'Oncology', 'Cardiology', 'Respiratory disorders', 'Autoimmune diseases', 'Gastroenterology',
    'Metabolic & endocrine disorders', 'Diabetes', 'Infectious diseases', 'Vaccines', 'Orthopaedics',
    'Gynaecology & reproductive disorders', 'Paediatrics', 'Ophthalmology', 'In-vitro diagnostics',
    'Medical devices', 'Food & nutraceuticals', 'COVID-19',
  ],
};

export const trainings = {
  eyebrow: 'Trainings',
  title: 'Learn to do it right the first time',
  cards: [
    {
      tag: 'Teams & institutes', title: 'In-person classroom training', warm: false,
      meta: ['Basic & advanced', 'Customised', 'Hands-on'],
      modules: ['Lorem ipsum', 'Dolor sit amet', 'Consectetur', 'Adipiscing elit', 'Sed do eiusmod'],
      cta: { label: 'Enquire for your team', href: '/#contact', style: 'primary' } as Cta,
    },
    {
      tag: 'Individuals', title: 'MeWriT Academy online', warm: true,
      meta: ['Starters & experienced', 'Certification'],
      modules: ['Tempor incididunt', 'Ut labore', 'Et dolore'],
      cta: { label: 'Visit the Academy', href: contact.academy, style: 'outline' } as Cta,
    },
  ],
};

export const howWeWork = {
  eyebrow: 'How we work',
  title: 'From brief to submission',
  steps: [
    { title: 'Brief & scoping', text: 'Lorem ipsum dolor sit amet, consectetur.' },
    { title: 'Research & drafting', text: 'Sed do eiusmod tempor incididunt.' },
    { title: 'Review cycles', text: 'Ut enim ad minim veniam, quis nostrud.' },
    { title: 'Final delivery', text: 'Duis aute irure dolor in reprehenderit.' },
  ],
};

export const testimonials = {
  eyebrow: 'Testimonials',
  title: 'Clients & collaborators commend',
  quotes: [
    { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.', by: 'Director, research consultancy firm' },
    { text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.', by: 'Senior Partner, writing consultancy' },
    { text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.', by: 'Business Development Executive, CRO' },
    { text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.', by: 'Medical device company' },
  ],
};

export const enquiry = {
  eyebrow: 'Start a project',
  title: 'Tell us about your document or training need',
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  needs: ['Regulatory documents', 'Scientific publication', 'Medical communications', 'Training or workshop', 'Research support', 'Something else'],
  thanks: 'Thank you. We will be in touch shortly.',
  note: 'Sample form for design review: nothing is sent.',
};

export const footerBlurb = 'Lorem ipsum dolor sit amet, consectetur.';
