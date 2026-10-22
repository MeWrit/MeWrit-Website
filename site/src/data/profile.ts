// Dr Hetal Shah's profile (src/pages/hetal/index.astro, at /hetal/: the link on her NFC card) and her
// contact file (src/pages/hetal/Dr-Hetal-Shah.vcf.ts). Everything here is from her CV ("Dr Hetal Shah
// [Founder, MeWriT] CV Aug2026.pdf"; the page it is on given beside each part), shortened, never added to.
// Left out on purpose: her date of birth and age, her pharmacist registration number, the trial named in
// the CV, and the names of the companies she has worked for or trained and the institutions she has
// trained at (names wait for her permission: the companies are described by what they are instead).
// Her publications are the site's own list (src/data/publications.json).
import { contact, office } from './site';
import { YEARS } from './years';
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

  // (no figures on the profile: the user, 2026-10-22, found them "very overused" across the site)

  // pp. 1, 2, 8: where she serves now
  now: [
    { title: 'Section Editor, Medical Writing', where: 'Perspectives in Clinical Research', text: 'The journal of the Indian Society for Clinical Research, since June 2025' },
    { title: 'Medical Writing Council', where: 'Indian Society for Clinical Research', text: 'A member since 2019 and its co-chair from September 2024 to March 2025; on the RWE Council in 2026' },
    { title: 'Medical writing mentor', where: 'DIA Global Mentorship Program', text: 'A DIA member, June 2025 to June 2027' },
  ],
  // three of her papers, found in src/data/publications.json by the start of their titles
  selected: ['Accountability or acknowledgment?', 'Wireless acoustic communication', 'Intracoronary boluses of adenosine'],
  // one client's words, found among the home page's testimonials (src/data/experience.ts, voices) by its start
  quote: 'Hetal loves medical writing',

  // ---- her profile (the user, 2026-10-22: "make this more verbose": a reader who clicks Full profile on
  // the Leadership or home page must land on more than they left). Prose and short lists from the CV (its
  // pages beside each part). The companies she has worked for or trained, the institutions she studied or
  // trained at, and the trial the CV names stay unnamed until she approves naming them.
  // pp. 2, 6: her name as she signs it (Hetal Amit Shah), traced under her name by the film's pen
  signature: 'H. A. Shah',
  // pp. 1, 8, 10: who she is, in a paragraph and a half (the user, 2026-10-22: "cut the about copy to 1
  // or 1.5 para"; her path, her talks and her honours have their own sections)
  about: [
    `Dr Hetal Shah founded MeWriT in 2017, a boutique practice in Ahmedabad that brings specialised medical writing and training to pharmaceutical, biotech and CRO clients around the world. A PhD pharmacologist and double gold medallist with more than ${YEARS} years in clinical research and medical writing, she knows the work from both sides, having run studies at clinical sites and in CROs as well as writing for them.`,
    'Her writing follows a study from protocol to publication: more than thirty clinical study reports, over fifty CTD overviews and summaries for dossiers to the FDA, the EMA, the MHRA and ASEAN regulators, and the papers that report the results. Since 2008 she has also trained more than 3,000 professionals.',
  ],
  // p. 8: her path, the latest start first (the companies described by what they are)
  career: [
    { when: '2025 to now', title: 'Section Editor, Medical Writing', where: 'Perspectives in Clinical Research, the journal of the Indian Society for Clinical Research' },
    { when: '2017 to now', title: 'Founder & Principal Medical Writing Consultant', where: 'MeWriT Healthcare Consulting, Ahmedabad' },
    { when: '2016 to now', title: 'Independent medical writing consultant and clinical pharmacologist', where: 'For pharmaceutical and device companies and CROs in India and abroad; since 2021 also a contract medical writer for a UK-based CRO' },
    { when: '2012 to 2016', title: 'Consultant Medical Writer, then Chief, Medical Writing', where: 'A CRO in Ahmedabad; also contract medical advisor to a pharmaceutical company in Germany' },
    { when: '2008 to 2012', title: 'Manager, Site Startup', where: 'A global CRO in Ahmedabad: study team leader for India and Asia Pacific, and team manager for India' },
    { when: '2007 to 2016', title: 'Freelance medical writer', where: 'Remotely, for a medical writing consultancy in Germany' },
    { when: '2003 to 2008', title: 'Site coordinator to Manager, Clinical Research & Medical Writing', where: 'A clinical research company in Ahmedabad: site and study management, clinical research, medical writing and expert pharmacology' },
  ],
  // pp. 11 to 15: talks and workshops, the latest first (`earlier` folded away); hosts that are companies,
  // and the institutions she trained, not named
  speaking: [
    { when: 'Jul 2026', title: 'Communicating Real-world and Clinical Evidence: from Data to Decision-ready Narratives', role: 'Scientific Programme Co-chair, and chair of this session', where: 'DIA India Medical Writing and Scientific Communication Conference, Bengaluru' },
    { when: 'Jun 2026', title: 'Understanding the Clinical Trial Blueprint: Protocol Writing Practices Today', role: 'Keynote speaker and AI/ML domain expert', where: 'Webinar' },
    { when: 'Mar 2026', title: 'Scientific Writing Excellence: Structured Workflow, Publication Strategy, and AI Use', role: 'Workshop trainer', where: 'A scientific publication workshop for clinicians' },
    { when: 'Nov 2025', title: 'Principles of ICH GCP', role: 'Invited expert', where: 'A workshop on ICH GCP E6 (R3) and the New Drugs and Clinical Trials Rules, held with ISCR' },
    { when: 'Sep and Nov 2025', title: 'Clinical Study Report Writing; Scientific Publication Writing; GCP for Medical Writers', role: 'Lead trainer', where: 'MeWriT’s own workshops, in Ahmedabad and online' },
    { when: 'Jul 2025', title: 'Acknowledging Medical Writers in Journal Publications: Recognition, Reality and Reform', role: 'Panellist, and on “Shaping Your Career and Brand Identity in a Changing Medical Writing Landscape”', where: 'DIA Medical Writing Conference, Bengaluru' },
    { when: 'Mar 2025', title: 'Deciphering the ICMJE Guidance for Writing Your Research Paper', role: 'Invited expert', where: 'An online forum for some 1,900 postgraduate pharmacology students' },
    { when: 'Feb 2025', title: 'Leveraging AI to Transform Data into Real-World Impact: Opportunities and Challenges', role: 'Invited speaker', where: 'DIA India workshop, Mumbai' },
    { when: 'Jan 2025', title: 'Accelerating Submissions: Elevating the Role of Medical Writers', role: 'Session chair, and on the organising committees', where: 'ISCR Annual Conference, Mumbai' },
    { when: 'Feb 2024', title: 'Continued Professional Development for Medical Writers: One Size Does Not Fit All', role: 'Speaker', where: 'ISCR Annual Conference, Hyderabad', earlier: true },
    { when: 'Feb 2023', title: 'Independent Medical Writing Providers: Finding Your Niche!', role: 'Faculty and panel moderator', where: 'ISCR Annual Conference, medical writing track, Delhi', earlier: true },
    { when: 'Jul 2021', title: 'United Conference of Women in Pharma', role: 'Keynote speaker', where: 'An international conference, online', earlier: true },
    { when: 'Mar 2021', title: 'Effective Authoring of Clinical Study Reports in the Evolving Landscape of Data Transparency', role: 'Workshop leader', where: 'ISCR 2021 pre-conference workshop, online', earlier: true },
    { when: 'Nov 2019', title: 'Adopting the CORE Reference for Writing Disclosure-friendly CSRs', role: 'Workshop faculty', where: 'ISCR national workshop, Noida', earlier: true },
    { when: 'Oct 2019', title: 'Research Manuscript Writing', role: 'Workshop faculty', where: 'ISCR national workshop, Ahmedabad', earlier: true },
    { when: 'Jun 2014', title: 'Writing Overviews: Module 2.4 and 2.5 in the EU Context', role: 'Web tutorial', where: 'DIA India medical writing working group', earlier: true },
  ] as { when: string; title: string; role: string; where: string; earlier?: boolean }[],
  // pp. 1, 4, 11
  trained: 'Since 2008 she has trained more than 3,000 professionals, from clinicians and pharma and CRO teams to medical and pharmacy students, in India and abroad.',
  // pp. 1, 4, 6, 9: all eight honours, each its icon and, where there is one, the body behind it (each
  // site opened once after its robots.txt, 2026-10-22, scratchpad page_title.js)
  recognition: [
    { year: '2026', title: 'Goldman Sachs 10,000 Women', text: 'Chosen for the fully funded programme, March 2026 cohort, at IIM Ahmedabad', icon: 'briefcase', url: 'https://www.goldmansachs.com/worldwide/india/10000-women', link: 'goldmansachs.com' },
    { year: '2021 to 2023', title: 'ISCR Hall of Fame Award, three years in a row', text: 'From the Indian Society for Clinical Research, for her contributions to its Medical Writing Council', icon: 'trophy', url: 'https://www.iscr.org/', link: 'iscr.org' },
    { year: '2019', title: 'Woman Entrepreneur in Pharma & Healthcare', text: 'Felicitated by the AIC-LMCP Foundation, supported by the Atal Innovation Mission, Government of India', icon: 'star', url: 'https://aiclmcp.org/', link: 'aiclmcp.org' },
    { year: 'Mentor', title: 'NITI Aayog Women Entrepreneurship Platform', text: 'A registered mentor in the Government of India’s G20-aligned mentorship programme', icon: 'people', url: 'https://wep.gov.in/', link: 'wep.gov.in' },
    { year: 'Programme', title: 'NSRCEL Women Startup Program', text: 'Certified under the programme of IIM Bangalore’s startup incubator', icon: 'bulb', url: 'https://nsrcel.org/women-startup-program/', link: 'nsrcel.org' },
    { year: '2006', title: 'Young Investigator’s Awards finalist', text: 'American College of Cardiology Conference, Atlanta', icon: 'heart-pulse', url: '/publications/?q=Young%20Investigator', link: 'Her presentation', internal: true },
    { year: 'M. Pharm', title: 'Double gold medallist', text: 'Two gold medals from Gujarat University, for standing first in M. Pharm (Pharmacology)', icon: 'medal' },
    { year: '2004', title: 'Jindal Prize', text: 'A gold medal from the Indian Pharmacological Society, Gujarat chapter, for the same first place', icon: 'mortarboard' },
  ] as { year: string; title: string; text: string; icon: IconName; url?: string; link?: string; internal?: boolean }[],
  // p. 8: memberships (her council and mentoring roles are under `now`)
  memberships: [
    { title: 'Indian Society for Clinical Research', text: 'Life member; on the Western Chapter’s governance since 2019' },
    { title: 'DIA (Drug Information Association)', text: 'Member, June 2025 to June 2027' },
    { title: 'Indian Society of Training and Development', text: 'Life member since February 2026' },
    { title: 'Indian Pharmacological Society', text: 'Life member' },
    { title: 'Pharmacy Council of India', text: 'Registered pharmacist' },
  ],
  // p. 10: the therapeutic areas she has written in
  areas: ['Oncology', 'Haematology', 'Cardiovascular', 'Respiratory', 'Endocrinology and diabetes', 'Autoimmune', 'Nephrology and urology', 'Infectious diseases', 'Dermatology', 'Gastroenterology', 'Orthopaedics', 'Women’s health', 'Neurosciences', 'Immunology and vaccines', 'Biologics and biosimilars', 'Medical devices', 'Herbals and nutraceuticals'],
  // p. 6: her degrees (all three in Ahmedabad; the college not named yet), and p. 2: her languages
  education: [
    { degree: 'PhD (Pharmacology)', when: '2008', note: 'Thesis: the evaluation of drugs and devices in patients with acute myocardial infarction, chronic refractory angina and heart failure' },
    { degree: 'Advanced Diploma in Community Pharmacy Management', when: '2004', note: 'First position and a gold medal' },
    { degree: 'M. Pharm (Pharmacology)', when: '2003', note: 'First in Gujarat University, with two gold medals; a dissertation on atorvastatin with fenofibrate after coronary angioplasty' },
    { degree: 'B. Pharm', when: '2001', note: '' },
  ],
  languages: ['English (IELTS 7.5 of 9)', 'Gujarati', 'Hindi', 'French (introductory)'],
};
