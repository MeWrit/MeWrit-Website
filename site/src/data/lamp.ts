// The lamplight film's words (src/pages/lamplight/index.astro) and its one inner page
// (src/pages/lamplight/regulatory-writing.astro). Draft copy, in the order of the MeWriT deck (July
// 2026) as set in site/docs/redesign-plan.md, section 10.2; figures from the deck and the CV; the inner
// page's words from the pitch data (src/data/pitch.ts). No institution, company or client names.
// Each chapter's cards are the digital layer: what is happening to the work, as it happens
// (illustrative states, not claims).
import { practices, why, enquiry } from './pitch';
import { contact, office } from './site';
import { href } from '../lib/url';
import { YEARS_WORD_CAP } from './years';

export type LampAction = { label: string; href: string; kind?: 'scroll' | 'open' };
export type LampCard = { k: string; t: string; live?: boolean; ai?: boolean };
export type LampChapter = { id: string; num: string; name: string; headline: string; line: string; note?: number; action?: LampAction; cards?: LampCard[] };

export const lamp = {
  title: 'A document, read by lamplight',
  description: 'MeWriT, specialist medical writing and scientific communication, in one film: by day the study, by night the archive, the record and the reading room.',
  shortTitle: 'Writing Science Right',
  chapters: [
    { id: 'title-page', num: '00', name: 'Title page', headline: 'Writing Science Right', line: "Specialist medical writing and scientific communication: expert judgement, with today's tools.", action: { label: 'Begin reading', href: '#contents', kind: 'scroll' },
      cards: [{ k: 'Draft 3', t: 'Saved to the cloud · just now', live: true }, { k: 'Reviewer', t: 'Checked against ICH E3 ✓' }, { k: '✦ Assistant', t: '42 of 42 references verified', ai: true }] },
    { id: 'contents', num: '01', name: 'Contents', headline: 'Five practices', line: 'Choose one, or read on.' },
    { id: 'on-the-record', num: '02', name: 'On the record', headline: `${YEARS_WORD_CAP} years, on the record`, line: '100+ trial documents, 30+ clinical study reports, 70+ publications, 3,000+ professionals trained.', note: 1, action: { label: 'Publications', href: '#publications' },
      cards: [{ k: '✦ Citation map', t: '70+ publications · 25 acknowledgements', ai: true }] },
    { id: 'regulatory-writing', num: '03', name: 'Regulatory writing', headline: 'Submission-ready, to the letter', line: 'Protocols, clinical study reports, CTD modules and responses to regulators, for sponsors and CROs.', action: { label: 'Regulatory writing', href: href('/lamplight/regulatory-writing/'), kind: 'open' },
      cards: [{ k: 'eCTD · Module 2.7', t: 'Validated ✓' }, { k: 'Submission', t: 'Ready for e-submission', live: true }] },
    { id: 'scientific-publications', num: '04', name: 'Scientific publications', headline: 'From manuscript to acceptance', line: 'Original research, reviews, case reports, abstracts and posters, written to ICMJE and GPP.', action: { label: 'Scientific publications', href: '#scientific-publications' },
      cards: [{ k: 'Journal', t: 'Accepted ✓', live: true }, { k: '✦ ICMJE checklist', t: 'Complete · writing support acknowledged', ai: true }] },
    { id: 'medical-communications', num: '05', name: 'Medical communications', headline: 'Evidence, given a voice', line: 'Position papers, consensus documents, real-world evidence and expert statements.', action: { label: 'Medical communications', href: '#medical-communications' },
      cards: [{ k: 'Consensus statement', t: 'Panel comments resolved ✓' }, { k: '✦ Evidence map', t: 'Studies graded, gaps flagged', ai: true }] },
    { id: 'training', num: '06', name: 'Training', headline: 'Learn to write it yourself', line: 'Hands-on workshops, basic to advanced, half-day and full-day. 3,000+ professionals trained since 2008.', action: { label: 'MeWriT Academy', href: '#training' },
      cards: [{ k: 'Workshop', t: 'Registrations open', live: true }, { k: 'Certificate', t: 'Issued on completion' }] },
    // its cards are in the editor on the display, which the chapter sees up close (index.astro)
    { id: 'ai-ml-advisory', num: '07', name: 'AI/ML advisory', headline: 'Expertise, in the loop', line: 'Domain expertise for AI and ML in medical writing: human-in-the-loop review of generated content.', action: { label: 'AI/ML advisory', href: '#ai-ml-advisory' } },
    { id: 'how-we-work', num: '08', name: 'How we work', headline: 'Two ways to work together', line: 'A fixed fee for each project, or hourly advisory consulting; training tailored in topics and duration.', action: { label: 'Start a project', href: href('/#contact') },
      cards: [{ k: 'Fixed fee', t: 'Per project, agreed up front' }, { k: 'Advisory', t: 'Hourly, as you need it' }] },
    { id: 'correspondence', num: '09', name: 'Correspondence', headline: 'Tell us what you need written', line: 'Trusted for operational excellence. Chosen for uncompromised scientific rigour.', action: { label: 'Start a project', href: href('/#contact') },
      cards: [{ k: 'Online', t: 'Book a video consultation', live: true }] },
  ] as LampChapter[],
  // the contents chapter's table: the five practices, each going to its chapter in the film; the page
  // numbers are the chapters'
  contents: [
    { num: '01', name: 'Regulatory writing', page: '3', href: '#regulatory-writing', go: 'regulatory-writing' },
    { num: '02', name: 'Scientific publications', page: '4', href: '#scientific-publications', go: 'scientific-publications' },
    { num: '03', name: 'Medical communications', page: '5', href: '#medical-communications', go: 'medical-communications' },
    { num: '04', name: 'Training', page: '6', href: '#training', go: 'training' },
    { num: '05', name: 'AI/ML advisory', page: '7', href: '#ai-ml-advisory', go: 'ai-ml-advisory' },
  ],
  footnote: 'Figures from MeWriT records, July 2026.',
  // the last chapter is the footer: the office, the ways to write, the pages, the legal line
  reach: [
    { label: contact.email, href: `mailto:${contact.email}` },
    { label: contact.phoneDisplay, href: contact.phoneHref },
  ] as { label: string; href: string; external?: boolean }[],
  office,
  pages: [
    { label: 'Regulatory writing', href: href('/lamplight/regulatory-writing/') },
    { label: 'Contents', href: '#contents', go: 'contents' },
    { label: 'Title page', href: '#title-page', go: 'title-page' },
  ],
  legal: 'Privacy Policy · Terms',
};

// the inner page: the regulatory writing practice, opened from the film's chapter 02
const reg = practices.list[0];
export const regulatory = {
  name: reg.name,
  title: 'Regulatory writing',
  line: reg.lead,
  runningHead: 'Practices',
  folio: '2',
  write: { title: 'What we write', items: [...reg.items, 'Ethics committee and IRB submissions', 'Expert referrals for study design'], note: 'ICH E3 · ICH E6 (R3) · CTD' },
  standards: {
    title: 'Standards and regulators',
    standards: ['ICH E3 clinical study reports', 'ICH E6 (R3) good clinical practice', 'CTD and NTA 2B dossiers'],
    regulators: ['FDA', 'EMA', 'MHRA', 'CDSCO', 'ASEAN'],
    note: 'Written to the standard each document will be judged by',
  },
  experience: {
    title: 'Experience',
    figures: [{ value: '100+', label: 'trial documents' }, { value: '30+', label: 'ICH E3 clinical study reports' }, { value: '30+', label: 'CTD summaries' }, { value: '1,500+', label: 'narratives' }],
    note: 'Figures from MeWriT records, July 2026.',
  },
  how: { title: 'How an engagement runs', steps: why.how.steps, note: 'Writing: fixed fee per project' },
  related: {
    title: 'Related practices',
    links: [
      { label: 'Scientific publications', href: href('/lamplight/#scientific-publications') },
      { label: 'Medical communications', href: href('/lamplight/#contents') },
      { label: 'Training', href: href('/lamplight/#contents') },
      { label: 'AI/ML advisory', href: href('/lamplight/#contents') },
    ],
  },
  start: { title: 'Start a project', text: enquiry.text, button: { label: 'Start a project', href: href('/#contact') } },
};
