// The therapeutic areas MeWriT writes in, for the Therapeutic areas page (src/pages/therapeutic-areas.astro),
// as the current mewrit.com page lists them ("MeWriT Website Text for Editing.docx", Page 3), in its order;
// the line under the title is its paragraph, shortened. Seventeen in all: the figure Who we are links here by.
// Each leads to an overview of the area from the World Health Organization or the US National Institutes of
// Health (the user, 2026-10-21: "linked to credible info about the area... relevant... but should be
// credible"): WHO's health topics where it has one, else the NIH's (its institutes' pages, or MedlinePlus,
// the National Library of Medicine's). Each address read once after its site's robots.txt, all 200
// (scratchpad check_links.js); two NIH pages that refuse automated checks were swapped for MedlinePlus's.
// Icons: src/data/area-icons.ts.
export type Area = { name: string; icon: string; url: string; by: 'WHO' | 'NIH' };
export const SOURCES = { WHO: 'the World Health Organization', NIH: 'the US National Institutes of Health' } as const;

export const areas = {
  title: 'Therapeutic areas',
  line: 'Scientific and medical content for clinical trial documentation, regulatory applications and publications, across these areas and more.',
  note: 'Each links to an overview of the area from the World Health Organization (WHO) or the US National Institutes of Health (NIH).',
  list: [
    { name: 'Oncology', icon: 'oncology', url: 'https://www.who.int/health-topics/cancer', by: 'WHO' },
    { name: 'Cardiology', icon: 'cardiology', url: 'https://www.who.int/health-topics/cardiovascular-diseases', by: 'WHO' },
    { name: 'Respiratory disorders', icon: 'respiratory', url: 'https://www.who.int/health-topics/chronic-respiratory-diseases', by: 'WHO' },
    { name: 'Autoimmune diseases', icon: 'autoimmune', url: 'https://medlineplus.gov/autoimmunediseases.html', by: 'NIH' },
    { name: 'Gastroenterology', icon: 'gastro', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases', by: 'NIH' },
    { name: 'Metabolic and endocrine disorders', icon: 'metabolic', url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases', by: 'NIH' },
    { name: 'Diabetes', icon: 'diabetes', url: 'https://www.who.int/health-topics/diabetes', by: 'WHO' },
    { name: 'Infectious diseases', icon: 'infectious', url: 'https://medlineplus.gov/infections.html', by: 'NIH' },
    { name: 'Orthopaedics', icon: 'ortho', url: 'https://www.who.int/news-room/fact-sheets/detail/musculoskeletal-conditions', by: 'WHO' },
    { name: 'Gynaecology and other reproductive disorders', icon: 'gyn', url: 'https://www.who.int/health-topics/sexual-and-reproductive-health-and-rights', by: 'WHO' },
    { name: 'Vaccines', icon: 'vaccines', url: 'https://www.who.int/health-topics/vaccines-and-immunization', by: 'WHO' },
    { name: 'Paediatrics', icon: 'paeds', url: 'https://www.who.int/health-topics/child-health', by: 'WHO' },
    { name: 'Ophthalmology', icon: 'ophthalmo', url: 'https://www.who.int/health-topics/blindness-and-vision-loss', by: 'WHO' },
    { name: 'In-vitro diagnostics', icon: 'ivd', url: 'https://www.who.int/health-topics/in-vitro-diagnostics', by: 'WHO' },
    { name: 'Medical devices', icon: 'devices', url: 'https://www.who.int/health-topics/medical-devices', by: 'WHO' },
    { name: 'Food and nutraceuticals', icon: 'nutra', url: 'https://medlineplus.gov/dietarysupplements.html', by: 'NIH' },
    { name: 'COVID-19', icon: 'covid', url: 'https://www.who.int/health-topics/coronavirus', by: 'WHO' },
  ] as Area[],
};
