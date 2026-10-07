// The words of the experience page (src/pages/experience.astro), one entry per scene, matched to
// the scenes in src/scripts/xp/scenes.js by id. DRAFT copy, built on the services the site already
// lists; Dr Hetal to confirm. The figures the scenes show are illustrative.

export type XpScene = { id: string; kicker: string; title: string; text: string; docs?: string[]; cta?: boolean };

export const experience = {
  title: 'From molecule to manuscript',
  description: 'The work behind a medicine, and the writing that carries it: an interactive journey from drug development to publication.',
  scenes: [
    { id: 'open', kicker: 'MeWriT · Medical writing', title: 'From molecule to manuscript', text: 'The work behind a medicine, and the writing that carries it from the first molecule to the published paper. Scroll to follow it through.' },
    { id: 'drug', kicker: '01 · Drug development', title: 'It starts with a molecule', text: 'Before the first patient, a candidate needs its case made on paper: what it is, how it works and what the early studies showed.', docs: ["Investigator's brochures", 'Nonclinical overviews'] },
    { id: 'enrol', kicker: '02 · Clinical trials', title: 'Every trial is people first', text: 'Every trial starts as a protocol. We write protocols and informed consent documents that sites can follow and participants can understand.', docs: ['Protocols', 'Informed consent'] },
    { id: 'randomise', kicker: '02 · Clinical trials', title: 'Two arms, one question', text: 'Randomised and followed with equal care, with every change to the plan documented in amendments that ethics committees can approve.', docs: ['Amendments', 'EC and IRB submissions'] },
    { id: 'research', kicker: '03 · Medical research', title: 'Read everything. Cite what holds', text: 'Good research starts from the evidence already there. We search, screen and summarise the literature, and help shape research and grant proposals.', docs: ['Literature reviews', 'Grant applications', 'Research support'] },
    { id: 'data', kicker: '04 · Data & statistics', title: 'Data, given shape', text: 'Numbers help only when they are read correctly. We work alongside your statisticians on how the results are shown, in tables and figures that say what the data say.', docs: ['Tables and figures', 'Analysis plans'] },
    { id: 'analysis', kicker: '05 · Analysis', title: 'The difference, made clear', text: 'Interpretation is where the story is decided. We turn efficacy and safety results into conclusions that are clear and balanced.', docs: ['Efficacy', 'Safety', 'Interpretation'] },
    { id: 'reporting', kicker: '06 · Reporting', title: 'Every finding, on the record', text: 'Results become regulatory documents: clinical study reports written to ICH E3, and the CTD summaries that regulators read.', docs: ['Clinical study reports', 'CTD modules'] },
    { id: 'manuscript', kicker: '07 · Manuscript & publication', title: 'Written right', text: 'Finally, the work reaches the people who need it. We write manuscripts, abstracts and posters to ICMJE and GPP, and see them through peer review.', docs: ['Manuscripts', 'Abstracts', 'Posters'] },
    { id: 'publication', kicker: '07 · Manuscript & publication', title: 'Then the world reads it', text: 'Published, presented and cited: science that travels from Ahmedabad to the journals, congresses and clinics that need it.' },
    { id: 'close', kicker: 'MeWriT', title: 'Writing Science Right', text: 'Wherever your work is, from molecule to manuscript, tell us about it and we will take it from there.', cta: true },
  ] as XpScene[],
};
