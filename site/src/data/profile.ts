// Dr Hetal Shah's card (src/pages/hetal/index.astro, at /hetal/: the link on her NFC card) and her
// contact file (src/pages/hetal/Dr-Hetal-Shah.vcf.ts). Everything here is from her CV ("Dr Hetal Shah
// [Founder, MeWriT] CV Aug2026.pdf"; the page it is on given beside each part), shortened, never added to.
// Left out on purpose: her date of birth and age, her pharmacist registration number, the trial named in
// the CV, and the names of the companies she has worked for or trained and the institutions she has
// trained at (names wait for her permission: the companies are described by what they are instead).
// Her publications are the site's own list (src/data/publications.json).
import { contact, office } from './site';
import type { IconName } from './icons';

export const profile = {
  name: 'Dr Hetal Shah',
  given: 'Hetal', family: 'Shah', prefix: 'Dr', suffix: 'PhD',
  credentials: 'PhD (Pharmacology)',
  role: 'Founder & Director, MeWriT',
  title: 'Founder & Director',
  subtitle: 'Subject Matter Expert, Medical Writing',
  org: 'MeWriT Healthcare Consulting',
  place: 'Ahmedabad, India',
  line: 'Medical writing, training and scientific communication for pharma, biotech and CROs.',
  phone: contact.phoneDisplay, phoneHref: contact.phoneHref, email: contact.email,
  // (her own LinkedIn, from the CV's letterhead; MeWriT's company page beside it)
  linkedin: 'https://www.linkedin.com/in/drhetalshah', linkedinMewrit: contact.linkedin,
  website: 'https://mewrit.com',
  whatsapp: `${contact.whatsapp}&text=${encodeURIComponent('Hello Dr Hetal, I came across your card and would like to connect.')}`,
  office,

  // (no figures on the card: the user, 2026-10-22, found them "very overused" across the site)

  // ---- the curated profile (the user, 2026-10-22: "profiles are not literal copies of CVs"; chose a
  // curated profile): who she is in a few lines, what she is known for, her five most notable honours,
  // where she serves now, three recent talks, three papers, one client's words. The rest of her record
  // stays in her CV and on the Publications page.
  // p. 1: who she is (the serif line, its middle in the logo's orange)
  intro: {
    lede: ['A pharmacologist ', 'who writes', '.'],
    text: [
      'Dr Hetal Shah founded MeWriT in 2017, a boutique practice in Ahmedabad that writes and trains for pharmaceutical, biotech and CRO clients around the world.',
      'A PhD pharmacologist and double gold medallist, she brings over two decades in clinical research and medical writing, with hands-on experience at clinical sites and in CROs.',
    ],
  },
  // pp. 1, 3, 10: the three practices she is known for, each leading to its place in the home page's film
  knownFor: [
    { title: 'Regulatory writing', text: 'Protocols, investigator’s brochures, clinical study reports to ICH E3, CTD summaries, narratives and responses to regulators.', anchor: 'regulatory-writing' },
    { title: 'Scientific publications', text: 'Original research, reviews, abstracts, posters and consensus statements, written to ICMJE and GPP.', anchor: 'scientific-publications' },
    { title: 'Training and mentoring', text: 'Workshops in medical writing and clinical research, from basic to advanced, shaped to the audience.', anchor: 'training' },
  ],
  // pp. 1, 4, 6, 9: the five most notable, in science and in business, each its icon and, where there is
  // one, a link to the body behind it (each opened once after its site's robots.txt and confirmed by its
  // title, scratchpad page_title.js, 2026-10-22; acc.org refuses checks, so the ACC finalist leads to her
  // presentation in the site's publications; the medals have no page)
  honours: [
    { year: '2026', title: 'Goldman Sachs 10,000 Women', text: 'Chosen for the fully funded programme, March 2026 cohort, at IIM Ahmedabad', icon: 'briefcase', url: 'https://www.goldmansachs.com/worldwide/india/10000-women', link: 'goldmansachs.com' },
    { year: '2021 to 2023', title: 'ISCR Hall of Fame Award, three years in a row', text: 'From the Indian Society for Clinical Research, for her contributions to its Medical Writing Council', icon: 'trophy', url: 'https://www.iscr.org/', link: 'iscr.org' },
    { year: '2019', title: 'Woman Entrepreneur in Pharma & Healthcare', text: 'Felicitated by the AIC-LMCP Foundation, supported by the Atal Innovation Mission, Government of India', icon: 'star', url: 'https://aiclmcp.org/', link: 'aiclmcp.org' },
    { year: '2006', title: 'Young Investigator’s Awards finalist', text: 'American College of Cardiology Conference, Atlanta', icon: 'heart-pulse', url: '/publications/?q=Young%20Investigator', link: 'Her presentation', internal: true },
    { year: 'M. Pharm (Pharmacology)', title: 'Double gold medallist', text: 'Two gold medals from Gujarat University, for standing first in M. Pharm (Pharmacology)', icon: 'medal' },
  ] as { year: string; title: string; text: string; icon: IconName; url?: string; link?: string; internal?: boolean }[],
  // pp. 1, 2, 8: where she serves now
  now: [
    { title: 'Section Editor, Medical Writing', where: 'Perspectives in Clinical Research', text: 'The journal of the Indian Society for Clinical Research, since June 2025' },
    { title: 'Medical Writing Council', where: 'Indian Society for Clinical Research', text: 'A member since 2019 and its co-chair from September 2024 to March 2025; on the RWE Council in 2026' },
    { title: 'Medical writing mentor', where: 'DIA Global Mentorship Program', text: 'A DIA member, June 2025 to June 2027' },
  ],
  // pp. 11 to 15: three recent talks (the webinar's host, a company, not named)
  talks: [
    { when: 'Jul 2026', title: 'Communicating Real-world and Clinical Evidence: from Data to Decision-ready Narratives', role: 'Scientific Programme Co-chair and session chair', where: 'DIA India Medical Writing and Scientific Communication Conference, Bengaluru' },
    { when: 'Jun 2026', title: 'Understanding the Clinical Trial Blueprint: Protocol Writing Practices Today', role: 'Keynote speaker and AI/ML domain expert', where: 'Webinar' },
    { when: 'Jul 2025', title: 'Acknowledging Medical Writers in Journal Publications', role: 'Panellist', where: 'DIA Medical Writing Conference, Bengaluru' },
  ],
  // three of her papers, found in src/data/publications.json by the start of their titles
  selected: ['Accountability or acknowledgment?', 'Wireless acoustic communication', 'Intracoronary boluses of adenosine'],
  // one client's words, found among the home page's testimonials (src/data/experience.ts, voices) by its start
  quote: 'Hetal loves medical writing',
};
