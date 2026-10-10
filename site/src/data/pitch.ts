// The pitch sections that follow the experience (src/components/pitch/PitchSections.astro), in page
// order: the five practices, the experience in numbers, why MeWriT and how we work, where we work,
// training and the MeWriT Academy, the acknowledgements in print, who leads the work, and the
// enquiry. Every figure, name and quote comes from MeWriT's own deck (July 2026) and CV (Aug 2026).
import { contact } from './site';
import { href } from '../lib/url';
import { YEARS, YEARS_WORD_CAP } from './years';

export type PitchLink = { label: string; href: string; external?: boolean };
export type Practice = {
  id: string; num: string; name: string; full: string; lead: string; items: string[];
  audience: string; standards: string[]; link: PitchLink;
};
export type Figure = { value: string; label: string };
export type Point = { title: string; text: string };
export type Quote = { text: string; source: string };

// the training topics: the training practice lists them, and the training section repeats them
// as its module list with a few more
const trainingTopics = [
  'Essentials of medical writing', 'Scientific writing skills', 'Literature search, referencing styles and tools',
  'Clinical research, trials and good clinical practice', 'Protocols and informed consent documents',
  "Compiling an investigator's brochure", 'Authoring clinical study reports', 'Understanding the CTD modules',
  'Publication ethics and ICMJE', 'Original research papers, reviews and case reports', 'Abstracts, posters and presentations',
];

export const practices = {
  eyebrow: 'What we offer',
  title: 'Five practices. Choose what you need.',
  lead: 'Each one stands on its own, and many clients use more than one. Writing is priced per project, advisory and expert review by the hour, training by topics and duration.',
  list: [
    {
      id: 'regulatory', num: '01', name: 'Regulatory writing', full: 'Clinical trial and regulatory documentation',
      lead: 'Submission-ready documents for sponsors and CROs, for every trial design and every major regulator.',
      items: ['Study protocols, all designs', 'Informed consent documents', "Investigator's brochures", 'Clinical study reports, ICH E3', 'CTD modules 2.4 to 2.7: overviews and summaries', 'Marketing authorisation dossiers', 'Patient and event narratives', 'CIPs and CERs for devices', 'Responses to regulatory queries'],
      audience: 'Pharma and biotech sponsors, CROs, device and nutraceutical makers',
      standards: ['ICH E3', 'ICH E6 (R3) GCP', 'CTD, NTA 2B', 'FDA, EMA, MHRA, CDSCO, ASEAN'],
      link: { label: 'Discuss a document', href: href('/#contact') },
    },
    {
      id: 'publications', num: '02', name: 'Scientific publications', full: 'Manuscripts, reviews and congress materials',
      lead: 'Publication-ready manuscripts and congress materials, with writing support acknowledged the way the guidelines ask.',
      items: ['Original research manuscripts', 'Literature reviews', 'Case reports and case series', 'Medical data analysis', 'Abstracts', 'Posters', 'Congress presentations'],
      audience: 'Clinicians, investigators, academic researchers, medical affairs teams',
      standards: ['ICMJE', 'GPP'],
      link: { label: 'Discuss a publication', href: href('/#contact') },
    },
    {
      id: 'communications', num: '03', name: 'Medical communications', full: 'Strategic medical communications',
      lead: 'Communications built on sound science: evidence that reads clearly to clinicians, payers and regulators.',
      items: ['Position papers', 'Consensus documents', 'Real-world evidence: protocols, reports and publications', 'Expert statements', 'Writing support to medical professionals', 'Educational materials and slide kits'],
      audience: 'Medical affairs teams, professional societies, task forces, clinicians',
      standards: ['GPP', 'ICMJE'],
      link: { label: 'Discuss a communication', href: href('/#contact') },
    },
    {
      id: 'training', num: '04', name: 'Training', full: 'Structured workshops and the MeWriT Academy',
      lead: 'Hands-on workshops, basic to advanced, tailored to the audience. 3,000+ professionals trained since 2008.',
      items: trainingTopics,
      audience: 'Pharma and CRO teams, hospitals and institutes, residents, pharmacy and medical students',
      standards: ['Half-day and full-day', '2 to 3 day advanced'],
      link: { label: 'Visit the Academy', href: contact.academy, external: true },
    },
    {
      id: 'ai', num: '05', name: 'AI/ML advisory', full: 'Domain expertise for AI and ML in medical writing',
      lead: 'Domain judgement for teams building AI for medical writing: what good looks like, and where the model falls short.',
      items: ['Subject-matter expertise for AI/ML solution teams', 'Human-in-the-loop review of generated content for accuracy, relevance and quality', 'Functionality and usability testing', 'Recommendations for development', 'Expert webinars'],
      audience: 'Health-tech and clinical-trial software teams, AI product teams',
      standards: ['Human in the loop', 'Hourly advisory'],
      link: { label: 'Talk to us', href: href('/#contact') },
    },
  ] as Practice[],
};

export const proof = {
  eyebrow: 'Experience',
  title: `${YEARS_WORD_CAP} years, on the record`,
  figures: [
    { value: `${YEARS}+`, label: 'years in clinical research and medical writing' },
    { value: '100+', label: 'essential trial documents' },
    { value: '30+', label: 'clinical study reports to ICH E3' },
    { value: '30+', label: 'CTD summaries for global submissions' },
    { value: '1,500+', label: 'patient and event narratives' },
    { value: '70+', label: 'publications and presentations' },
    { value: '25+', label: 'publications acknowledging our writing support' },
    { value: '3,000+', label: 'professionals trained' },
  ] as Figure[],
  note: 'Figures from MeWriT records, July 2026.',
};

// why MeWriT, then how a project runs. `terms` is one line of copy; the section shows its three
// parts as a list, the dots between them drawn by the stylesheet
export const why = {
  eyebrow: 'Why MeWriT',
  title: 'Trusted for operational excellence. Chosen for scientific rigour.',
  points: [
    { title: 'Scientific rigour', text: "Every document is written by people who understand the science: a pharmacologist's judgement on study design, interpretation and compliance, not just the words." },
    { title: 'Guideline discipline', text: "ICH E3 and E6 (R3), CTD and NTA 2B, ICMJE and GPP, and the regulators' own expectations: documents built to the standard they will be judged by." },
    { title: 'Fit for purpose', text: 'Tailor-made to the document, the audience and the deadline, from a single narrative to a full dossier, with a fixed fee per project.' },
    { title: 'Confidential by default', text: 'Participant centricity, data integrity and confidentiality are stated values, and the way of working.' },
    { title: 'Capability, not dependency', text: 'Training and mentorship so your own teams write better: 3,000+ professionals trained since 2008.' },
    { title: 'Responsible innovation', text: 'Domain expertise for the AI tools entering medical writing, with a human in the loop.' },
  ] as Point[],
  how: {
    eyebrow: 'How we work',
    title: 'From brief to final, without surprises',
    steps: [
      { title: 'Brief and scoping', text: 'A short call, the source documents, the audience and the deadline. You get a fixed fee per project, or an hourly plan for advisory and review.' },
      { title: 'Research and drafting', text: 'Literature, data and guidelines gathered and read; the first draft written to the template and the standard the document will be judged by.' },
      { title: 'Review cycles', text: 'Structured rounds with your clinical, statistical and regulatory reviewers, liaising with therapeutic experts, biostatisticians and data managers as needed.' },
      { title: 'Final and beyond', text: 'Styled, formatted and submission- or journal-ready, with support through regulatory queries or peer review.' },
    ] as Point[],
    terms: 'Writing: fixed fee per project · Advisory and expert review: by the hour · Training: by topics and duration',
  },
};

export const where = {
  eyebrow: 'Where we work',
  title: 'Fifteen therapeutic areas, one standard of care',
  areas: ['Oncology', 'Cardiology', 'Respiratory', 'Autoimmune', 'Dermatology', 'Gastroenterology', 'Diabetes', 'Infectious diseases, including COVID-19', 'Rheumatology', 'Orthopaedics', 'Gynaecology', 'Vaccines', 'Biologics and biosimilars', 'Medical devices', 'Nutraceuticals and food supplements'],
  columns: [
    { title: 'Who we work with', items: ['Pharma and biotech sponsors', 'CROs', 'Device and nutraceutical companies', 'Hospitals and academic institutions', 'Professional societies and task forces', 'Clinician-researchers', 'AI/ML solution teams'] },
    { title: 'Standards we write to', items: ['ICH E3 clinical study reports', 'ICH E6 (R3) good clinical practice', 'CTD and NTA 2B dossiers', 'ICMJE and GPP publications', 'FDA, EMA, MHRA, CDSCO and ASEAN requirements'] },
  ],
};

export const training = {
  eyebrow: 'Training',
  title: 'Learn to write it yourself',
  lead: 'Classroom training with theory, live demonstrations and hands-on exercises, individually or in groups. Half-day and full-day sessions; two to three day advanced programmes. Topics are chosen with you; the common ones are listed here. Open workshops and courses run through the MeWriT Academy.',
  modules: [...trainingTopics, 'Guidelines and recommendations', 'Writing a narrative review of literature', 'Preparing a poster', 'Preparing a slide presentation'],
  deliveredFor: {
    title: 'Workshops delivered for',
    groups: [
      { label: 'Academia', items: ['Tata Memorial Hospital, Mumbai', 'Sri Jayadeva Institute of Cardiovascular Sciences, Bengaluru', 'Nepal Cancer Hospital, Kathmandu', 'National Forensic Sciences University, Gandhinagar', 'Delhi Pharmaceutical Sciences and Research University', 'Institute of Pharmacy, Nirma University', 'L. M. College of Pharmacy, Ahmedabad', 'SRM Medical College, Chennai', 'Chitkara University', 'Lovely Professional University', 'Indrashil University', 'Anand Pharmacy College', 'Indus University', 'Gujarat Technological University', 'Indira IVF Centre, Udaipur', 'PG Pharmacology Forum, India'] },
      { label: 'Industry', items: ['IQVIA', 'Syngene', 'Lupin, with ISCR', 'Allergan Aesthetics, AbbVie', 'Zydus Wellness, TatvaCare', 'Cliantha Research', 'Veeda Clinical Research', 'Meril Life Sciences', 'Serdia Pharma', 'Alceon Medtech Consulting', 'Docplexus', 'NovoBliss Research'] },
      { label: 'Also', items: ['MeWriT open workshops: CSR and publications 2025', 'GCP for medical writers 2025', 'ISCR workshops', 'DIA India medical writing conferences'] },
    ],
  },
  ctas: [
    { label: 'Visit the MeWriT Academy', href: contact.academy, external: true, style: 'primary' },
    { label: 'Ask about a workshop', href: href('/#contact'), style: 'outline' },
  ] as (PitchLink & { style: 'primary' | 'outline' })[],
};

// the acknowledgements, word for word as the journals printed them (the CV, section 9.1, lists them
// with their references)
export const acknowledged = {
  eyebrow: 'In print',
  title: 'What authors say, in their acknowledgements',
  lead: 'Medical writing support is acknowledged in 25+ published papers and posters. A few, as printed:',
  quotes: [
    { text: "The authors would like to acknowledge the medical writing support provided by Dr. Hetal Shah from MeWriT Healthcare Consulting, Ahmedabad, India in the development of this manuscript, and styling and formatting it to the journal's requirements.", source: 'Indian Journal of Ophthalmology, 2025' },
    { text: 'The authors thank Dr. Hetal Shah from MeWriT Healthcare Consulting, Ahmedabad, India for providing medical writing support in the development of this manuscript.', source: 'Arthritis Research & Therapy, 2024' },
    { text: 'The authors thank Dr. Hetal Shah, MeWriT Healthcare Consulting, Ahmedabad, India, for her professional medical writing support in developing this manuscript and for styling it per journal requirements.', source: 'Experimental and Clinical Transplantation, 2022' },
    { text: 'The authors would also like to acknowledge the medical writing and editorial support provided by Dr. Hetal Shah, Founder & Principal Consultant, MeWriT™ from Ahmedabad, India, in the preparation and revision of this manuscript in collaboration with all the authors and reviewers, and in styling the article as per journal requirements.', source: 'ACR Open Rheumatology, 2019' },
    { text: 'The Consensus Task Force would like to acknowledge the medical writing efforts of Dr. Hetal Shah, and ProAdWise Communications for their support in the development, revision, and publishing of this content.', source: 'Indian Consensus Statement on the Evaluation and Management of Insomnia Disorders, API and ISSR, 2022' },
  ] as Quote[],
};

export const credentials = {
  eyebrow: 'Who leads the work',
  title: `A principal consultant with ${YEARS} years in clinical research`,
  text: "MeWriT's principal consultant, Dr Hetal Shah, PhD (Pharmacology), has worked across clinical sites, CROs and medical writing since 2003, including as principal medical writer on India's landmark COVAXIN trial. She is Section Editor for Medical Writing at Perspectives in Clinical Research, a member of the ISCR Medical Writing Council (Hall of Fame 2021 to 2023), a DIA global mentor and subject-matter expert, and Scientific Programme Co-chair of DIA India's Medical Writing and Scientific Communication Conference 2026. Projects draw on an extended team of medical writers, therapeutic-area experts and biostatisticians.",
  link: { label: 'Full profile', href: href('/leadership/hetal-shah/') } as PitchLink,
  values: ['Scientific rigour', 'Participant centricity', 'Quality and excellence', 'Integrity', 'Confidentiality', 'Trust and collaboration'],
};

// the enquiry at the foot of the page (the same fields as the home page's, src/data/home.ts)
export const enquiry = {
  eyebrow: 'Start a project',
  title: 'Tell us what you need written, taught or reviewed',
  text: 'A short brief is enough to start: the document or training you need, the audience and the deadline. We will come back with a scope and a fixed fee.',
  needs: ['Regulatory document', 'Scientific publication', 'Medical communication', 'Training or workshop', 'AI/ML advisory', 'Something else'],
  thanks: 'Thank you. We will be in touch shortly.',
  note: 'Sample form for design review: nothing is sent.',
};
