// The words of the home page's film (src/pages/index.astro), one entry per scene, matched to the scenes
// in src/scripts/xp/scenes.js by id: three screens that say what MeWriT is, who writes and why it is
// chosen (with the figures in them); the five practices to choose from; each practice by day, with a
// way into its own page; and the close. The copy and its figures come from the MeWriT deck (July 2026)
// and Dr Hetal's CV; Dr Hetal to confirm. The business is not posed as founder-led: she is a compact
// "led by" line. The two scenes whose picture or figures are illustrative say so on the page (their
// `note` in scenes.js).

import { YEARS, YEARS_WORD_CAP } from './years';

export type XpFigure = { value: string; label: string; href?: string };
export type XpPoint = { title: string; text: string };
export type XpQuote = { quote: string; by: string };
export type XpScene = {
  id: string; kicker: string; title: string; text: string; docs?: string[]; hint?: string; cta?: boolean;
  lead?: string; figures?: XpFigure[]; points?: XpPoint[]; hub?: boolean; more?: string; quotes?: XpQuote[]; academy?: boolean;
};

// the practices' slugs: each practice's place in the film (/#regulatory-writing ...: the menus and the
// foot link there), and its own page's address (/practices/<slug>/: src/data/practices.ts; Training has
// none, the MeWriT Academy being its home for now)
export const practicePages = ['regulatory-writing', 'scientific-publications', 'medical-communications', 'training', 'ai-ml-advisory'];

export const experience = {
  title: 'Specialist medical writing and scientific communication',
  description: 'MeWriT is a specialist medical writing and scientific communication consultancy: regulatory writing, scientific publications, medical communications, training and AI/ML advisory for the clinical research and healthcare sector.',
  scenes: [
    {
      id: 'open', kicker: 'MeWriT · Medical writing', title: 'Written to withstand scrutiny',
      text: 'A specialist medical writing and scientific communication consultancy for pharma, biotech, CROs, device makers and clinician-researchers: documents that regulators, journals and clinicians can act on.',
    },
    {
      id: 'who', kicker: 'Who we are', title: 'Scientists who write',
      text: 'Medical writers, therapeutic-area experts and biostatisticians who understand the science behind every sentence, so a document holds when it is read closely.',
      lead: 'Led by Dr Hetal Shah, PhD (Pharmacology), in clinical research and medical writing since 2003.',
      // (two lead to the Expertise pages: the user, 2026-10-21; the narratives and the trained are on the
      // dossier's and the training's shapes)
      figures: [
        { value: `${YEARS}+`, label: 'years in clinical research and medical writing' },
        { value: '100+', label: 'essential trial documents' },
        { value: '70+', label: 'publications and presentations', href: '/publications/' },
        { value: '17', label: 'therapeutic areas', href: '/therapeutic-areas/' },
      ],
    },
    {
      id: 'why', kicker: 'Why MeWriT', title: 'Chosen for scientific rigour',
      text: 'Trusted for operational excellence, from a single narrative to a full dossier.',
      points: [
        { title: 'Scientific rigour', text: 'Written by people who understand the science: study design, interpretation and compliance, not just the words.' },
        { title: 'Guideline discipline', text: 'ICH E3 and E6 (R3), CTD, ICMJE and GPP: built to the standard each document is judged by.' },
        { title: 'Fit for purpose', text: 'Tailored to the document, the audience and the deadline, with a fixed fee per project.' },
      ],
    },
    {
      // why others chose MeWriT (the user, 2026-10-21: testimonials in the Why MeWriT section, "why they
      // should choose mewrit and why others chose it"): the clients' testimonials on the current site
      // ("MeWriT Website Text for Editing.docx"), each an exact excerpt, one at a time (experience.js);
      // attributions by role, as the site gives them, less an association's name (permission pending: the
      // first is credited there as a former EMWA President). The colleagues' and mentor's are left for now
      id: 'voices', kicker: 'In their words', title: 'Why clients choose MeWriT',
      text: 'Clients on working with Dr Hetal Shah, who leads MeWriT.',
      quotes: [
        { quote: 'I have always found her work to be of exceptionally high quality, delivered in a timely manner, and communication was straightforward and easy.', by: 'Senior partner, writing consultancy, Germany' },
        { quote: 'Hetal Shah has been able to understand the intricacies of complex assignments, is able to meet time lines and give out perfect jobs, acceptable to the customer and the international regulatory authorities.', by: 'Director, research consultancy firm, India' },
        { quote: 'She is always responsive and asked the right questions to understand our subject matter. Her knowledge of subject is in depth and there is so much value addition that she brings with her work.', by: 'Medical device company, India' },
        { quote: 'She unfailingly completed her set tasks to our complete satisfaction. Reliable and concise work was consistently displayed.', by: 'Research consultancy firm, Germany' },
        { quote: 'Hetal loves medical writing and is very good at it! She is a dependable resource with a strong work ethics who researches, analyses and then writes her documents and therefore executes well written documents.', by: 'Director, research consultancy firm, India' },
      ],
    },
    {
      id: 'practices', kicker: 'Five practices', title: 'Choose what you need',
      text: 'Each practice stands on its own, and many clients use more than one.',
      hub: true,
    },
    {
      id: 'reg-designs', kicker: '01 · Regulatory writing', title: 'Every trial design, documented',
      text: "Protocols for every design, from first-in-human to phase IV, bioequivalence, registries and investigator-initiated trials, with the consent documents, investigator's brochures and patient materials that go with them. Written so sites can run them and ethics committees can approve them.",
      docs: ['Protocols, all designs', 'Informed consent', "Investigator's brochures", 'Patient materials'],
      more: 'regulatory-writing',
    },
    {
      id: 'reg-dossier', kicker: '01 · Regulatory writing', title: 'Submission-ready, to the letter',
      text: 'Clinical study reports to ICH E3, CTD clinical and nonclinical overviews and summaries, marketing authorisation dossiers, patient narratives, device CIPs and CERs, and responses to regulatory queries, for FDA, EMA, MHRA, CDSCO and ASEAN submissions.',
      docs: ['Clinical study reports', 'CTD 2.4 to 2.7', 'MAA dossiers', 'Narratives', 'CIPs and CERs', 'Regulatory responses'],
      more: 'regulatory-writing',
    },
    {
      id: 'pub-literature', kicker: '02 · Scientific publications', title: 'Read everything. Cite what holds',
      text: 'Literature reviews, original research manuscripts, case reports and medical data analysis, written to ICMJE and GPP, with writing support acknowledged the way the guidelines ask. From the first search to the final proof.',
      docs: ['Original research manuscripts', 'Literature reviews', 'Case reports', 'Medical data analysis'],
      more: 'scientific-publications',
    },
    {
      id: 'pub-manuscript', kicker: '02 · Scientific publications', title: 'Written right, through peer review',
      text: "Abstracts, posters and congress presentations, and the manuscript seen through submission, reviewers' comments and acceptance, styled to the journal every time.",
      docs: ['Abstracts', 'Posters', 'Congress presentations', 'Journal styling'],
      more: 'scientific-publications',
    },
    {
      id: 'med-evidence', kicker: '03 · Medical communications', title: 'Real-world evidence, given shape',
      text: 'Real-world evidence from protocol to report to publication, position papers and consensus documents for societies and task forces, and expert statements that carry weight because the science behind them is sound.',
      docs: ['RWE protocols, reports and publications', 'Position papers', 'Consensus documents', 'Expert statements'],
      more: 'medical-communications',
    },
    {
      id: 'med-narrative', kicker: '03 · Medical communications', title: 'From data to decision-ready narratives',
      text: 'Numbers help only when they are read correctly. We work alongside statisticians and clinical experts so that efficacy and safety results become conclusions that are clear, balanced and defensible, in the format the reader needs: paper, slide kit or statement.',
      docs: ['Data interpretation', 'Writing support to medical professionals', 'Slide kits and educational materials'],
      more: 'medical-communications',
    },
    {
      id: 'training', kicker: '04 · Training · MeWriT Academy', title: 'Learn to write it yourself',
      text: 'Structured, hands-on workshops in medical writing and clinical research, basic to advanced, from half a day to three days, tailored to the audience: pharma and CRO teams, clinicians and residents, pharmacy and medical students. Open workshops and courses through the MeWriT Academy.',
      docs: ['Essentials of medical writing', 'Clinical study reports', 'Scientific publications', 'GCP for medical writers', 'CTD modules'],
      more: 'training', academy: true,
    },
    {
      id: 'ai', kicker: '05 · AI/ML advisory', title: 'Domain expertise, in the loop',
      text: `For teams building AI and ML for medical writing: subject-matter expertise for solution teams, human-in-the-loop review of generated content for accuracy, relevance and quality, usability testing, and expert webinars. ${YEARS_WORD_CAP} years of clinical research judgement, applied to what the model writes.`,
      docs: ['SME for AI/ML solution teams', 'Expert HITL support', 'Usability and quality review', 'Expert webinars'],
      more: 'ai-ml-advisory',
    },
    {
      id: 'close', kicker: 'MeWriT · Ahmedabad, India', title: 'Writing Science Right',
      text: 'Tell us what you need written, taught or reviewed, and we will take it from there.',
      cta: true,
    },
  ] as XpScene[],
};
