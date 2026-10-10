// The words of the experience page (src/pages/experience.astro), one entry per scene, matched to
// the scenes in src/scripts/xp/scenes.js by id: an opening, the five practices a client chooses
// from (often more than one), and the close. The copy and its figures come from the MeWriT deck
// (July 2026) and Dr Hetal's CV; Dr Hetal to confirm. The two scenes whose picture or figures are
// illustrative say so on the page (their `note` in scenes.js).

import { YEARS_WORD_CAP } from './years';

export type XpScene = { id: string; kicker: string; title: string; text: string; docs?: string[]; hint?: string; cta?: boolean };

export const experience = {
  title: 'Specialist medical writing and scientific communication',
  description: 'MeWriT is a specialist medical writing and scientific communication consultancy: regulatory writing, scientific publications, medical communications, training and AI/ML advisory for the clinical research and healthcare sector.',
  scenes: [
    {
      id: 'open', kicker: 'MeWriT · Specialist medical writing', title: 'Written to withstand scrutiny',
      text: 'MeWriT is a specialist medical writing and scientific communication consultancy for pharma, biotech, CROs, device makers and clinician-researchers. Five practices, one standard: documents that regulators, journals and clinicians can act on.',
    },
    {
      id: 'practices', kicker: 'Five practices', title: 'Choose what you need',
      text: 'Each practice stands on its own. Sponsors and CROs come for regulatory documents, clinicians for publications, medical affairs teams for communications, institutions for training, and AI teams for domain expertise. Many come for more than one.',
      hint: 'Click a practice to go to it, or keep scrolling.',
    },
    {
      id: 'reg-designs', kicker: '01 · Regulatory writing', title: 'Every trial design, documented',
      text: "Protocols for every design, from first-in-human to phase IV, bioequivalence, registries and investigator-initiated trials, with the consent documents, investigator's brochures and patient materials that go with them. Written so sites can run them and ethics committees can approve them.",
      docs: ['Protocols, all designs', 'Informed consent', "Investigator's brochures", 'Patient materials'],
    },
    {
      id: 'reg-dossier', kicker: '01 · Regulatory writing', title: 'Submission-ready, to the letter',
      text: 'Clinical study reports to ICH E3, CTD clinical and nonclinical overviews and summaries, marketing authorisation dossiers, patient narratives, device CIPs and CERs, and responses to regulatory queries, for FDA, EMA, MHRA, CDSCO and ASEAN submissions.',
      docs: ['Clinical study reports', 'CTD 2.4 to 2.7', 'MAA dossiers', 'Narratives', 'CIPs and CERs', 'Regulatory responses'],
    },
    {
      id: 'pub-literature', kicker: '02 · Scientific publications', title: 'Read everything. Cite what holds',
      text: 'Literature reviews, original research manuscripts, case reports and medical data analysis, written to ICMJE and GPP, with writing support acknowledged the way the guidelines ask. From the first search to the final proof.',
      docs: ['Original research manuscripts', 'Literature reviews', 'Case reports', 'Medical data analysis'],
    },
    {
      id: 'pub-manuscript', kicker: '02 · Scientific publications', title: 'Written right, through peer review',
      text: "Abstracts, posters and congress presentations, and the manuscript seen through submission, reviewers' comments and acceptance, styled to the journal every time.",
      docs: ['Abstracts', 'Posters', 'Congress presentations', 'Journal styling'],
    },
    {
      id: 'med-evidence', kicker: '03 · Medical communications', title: 'Real-world evidence, given shape',
      text: 'Real-world evidence from protocol to report to publication, position papers and consensus documents for societies and task forces, and expert statements that carry weight because the science behind them is sound.',
      docs: ['RWE protocols, reports and publications', 'Position papers', 'Consensus documents', 'Expert statements'],
    },
    {
      id: 'med-narrative', kicker: '03 · Medical communications', title: 'From data to decision-ready narratives',
      text: 'Numbers help only when they are read correctly. We work alongside statisticians and clinical experts so that efficacy and safety results become conclusions that are clear, balanced and defensible, in the format the reader needs: paper, slide kit or statement.',
      docs: ['Data interpretation', 'Writing support to medical professionals', 'Slide kits and educational materials'],
    },
    {
      id: 'training', kicker: '04 · Training · MeWriT Academy', title: 'Learn to write it yourself',
      text: 'Structured, hands-on workshops in medical writing and clinical research, basic to advanced, from half a day to three days, tailored to the audience: pharma and CRO teams, clinicians and residents, pharmacy and medical students. Open workshops and courses through the MeWriT Academy.',
      docs: ['Essentials of medical writing', 'Clinical study reports', 'Scientific publications', 'GCP for medical writers', 'CTD modules'],
    },
    {
      id: 'ai', kicker: '05 · AI/ML advisory', title: 'Domain expertise, in the loop',
      text: `For teams building AI and ML for medical writing: subject-matter expertise for solution teams, human-in-the-loop review of generated content for accuracy, relevance and quality, usability testing, and expert webinars. ${YEARS_WORD_CAP} years of clinical research judgement, applied to what the model writes.`,
      docs: ['SME for AI/ML solution teams', 'Expert HITL support', 'Usability and quality review', 'Expert webinars'],
    },
    {
      id: 'close', kicker: 'MeWriT · Ahmedabad, India', title: 'Writing Science Right',
      text: 'Trusted for operational excellence. Chosen for uncompromised scientific rigour. Tell us which practice you need, and we will take it from there.',
      cta: true,
    },
  ] as XpScene[],
};
