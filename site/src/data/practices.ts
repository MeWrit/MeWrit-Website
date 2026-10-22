// The practices' own pages (src/pages/practices/[slug].astro), where each practice's section of the home
// page's film leads (its Know more). For a reader who wants the detail (the user, 2026-10-23: "information
// the reader would expect and would want to read ... without giving away much of the trade secrets, but
// all still relevant and connected to the business"): what each kind of document covers (designs, phases,
// products, markets, the standard it is written to) and how MeWriT works with a client's team; never the
// internal templates, checklists, review stages, tools, team make-up or rates. Drawn from the MeWriT deck
// (July 2026), the current site's service pages and testimonials ("MeWriT Website Text for Editing.docx",
// pages 5 to 10, every item kept: the user, 2026-10-23) and Dr Hetal's CV (August 2026); the old site's
// Research support is a section of Regulatory writing. Training has no page of its own: the MeWriT Academy
// is its home until the LMS is settled. Testimonials are excerpts, word for word, attributed by role as on
// the home page (an association and a university withheld until Dr Hetal approves naming them). Dr Hetal
// to confirm the copy.

export type PracticeItem = { name: string; text: string };
export type PracticeGroup = { title: string; line: string; items: PracticeItem[] };
export type PracticeNote = { title: string; text: string };
export type PracticeQuote = { quote: string; by: string };
export type Practice = {
  slug: string; n: string; name: string;
  scene: string; shot?: 'a' | 'b';   // the film's scene whose shape draws itself in the page's night band
  line: string;                      // under the title, in the band
  intro: string;                     // what the practice is, and who asks for it
  who: string[];
  write: { kicker: string; title: string; groups: PracticeGroup[] };
  support?: { kicker: string; title: string; line: string; items: string[] };
  standards?: { kicker: string; title: string; sets: { label: string; items: string[] }[] };
  team: { kicker: string; title: string; notes: PracticeNote[] };
  quotes: PracticeQuote[];
  related: { label: string; note: string; href: string }[];
};

// how MeWriT works with a client's team, where it is the same in every practice
const CONFIDENTIAL: PracticeNote = { title: 'Confidential throughout', text: 'Your data, documents and product details stay confidential, and are used only for the work agreed.' };
const ANYWHERE: PracticeNote = { title: 'Wherever your team is', text: 'We work remotely with sponsors, CROs and researchers in India and abroad, across time zones, and in person in Ahmedabad.' };

export const practices: Practice[] = [
  {
    slug: 'regulatory-writing', n: '01', name: 'Regulatory writing', scene: 'reg-dossier',
    line: 'The documents a clinical programme runs on and is judged by: protocols and consent forms, study reports, dossiers, and the answers to a regulator’s questions.',
    intro: 'We write the documents a trial starts with, the reports that close it and the dossiers that carry a product to approval, each to the guidelines it will be judged by. Sponsors, CROs, device and nutraceutical makers and investigators bring us a single document or a whole set, for submissions in India and abroad.',
    who: ['Pharma and biotech sponsors', 'CROs', 'Medical device makers', 'Nutraceutical makers', 'Investigators and academic sites'],
    write: {
      kicker: 'What we write', title: 'From the first protocol to the last query',
      groups: [
        {
          title: 'Trial documents', line: 'What a study needs before its first participant, and while it runs.',
          items: [
            { name: 'Protocols and synopses', text: 'Synopses, full protocols and amendments for every design and phase: phase I to IV, bioavailability and bioequivalence, post-marketing surveillance, registries, real-world studies and investigator-initiated trials.' },
            { name: 'Investigator’s brochures', text: 'New brochures and their annual updates, the nonclinical and clinical data brought together for the investigator.' },
            { name: 'Informed consent', text: 'Participant information and consent documents that participants can follow and ethics committees can approve.' },
            { name: 'Case report forms and patient materials', text: 'Input to case report forms, and what participants see: advertisements, patient cards and diaries.' },
            { name: 'Prescribing information', text: 'Prescribing information, written from the product’s clinical data.' },
          ],
        },
        {
          title: 'Clinical study reports', line: 'The full account of a completed study, written to ICH E3.',
          items: [
            { name: 'Clinical study reports', text: 'For all phases, drug classes and vaccines, for NDA, IND, BLA and EMA submissions.' },
            { name: 'Reports ready for disclosure', text: 'Reports written with the public disclosure of trial results in mind, following the CORE Reference.' },
            { name: 'Patient and event narratives', text: 'Narratives of serious and significant adverse events and deaths, for the report and the submission.' },
          ],
        },
        {
          title: 'Submission dossiers', line: 'The Common Technical Document, and the applications built on it.',
          items: [
            { name: 'CTD Module 2', text: 'Clinical and nonclinical overviews and summaries (Modules 2.4 to 2.7), with their expert statements.' },
            { name: 'Modules 4 and 5', text: 'The nonclinical and clinical sections beneath the summaries.' },
            { name: 'Marketing authorisation dossiers', text: 'For drugs, biologics, biosimilars, devices and nutraceuticals: NDA and ANDA for the FDA; generic, bibliographic and hybrid applications for the EU; and dossiers for the MHRA, CDSCO, ASEAN and other markets.' },
            { name: 'Updates and gap analyses', text: 'An existing CTD brought up to date, and checked for gaps against current requirements.' },
          ],
        },
        {
          title: 'Safety writing', line: 'The documents that follow a product’s safety through development and after approval.',
          items: [
            { name: 'Aggregate safety reports', text: 'Development safety update reports (DSURs), periodic reports (PSURs and PBRERs) and annual safety reports.' },
            { name: 'Risk management plans', text: 'EU risk management plans, and other pharmacovigilance documents.' },
            { name: 'Integrated safety summaries', text: 'Integrated summaries of safety, and updates for data safety monitoring boards.' },
          ],
        },
        {
          title: 'Regulators’ questions', line: 'When an authority asks, an answer it can accept.',
          items: [
            { name: 'Responses to queries', text: 'The query interpreted, and a clear, well-supported response drafted and finalised from the study results and supporting documents, for the FDA, EMA, MHRA, TGA, CDSCO and others.' },
            { name: 'Briefing documents', text: 'Briefing documents for meetings with regulators, and the write-ups around them.' },
          ],
        },
        {
          title: 'Medical devices', line: 'The clinical documents for device studies and approvals.',
          items: [
            { name: 'Clinical investigation plans', text: 'CIPs for clinical studies of devices.' },
            { name: 'Clinical evaluation reports', text: 'CERs for diagnostic and therapeutic devices.' },
          ],
        },
        {
          title: 'Alongside the documents', line: 'The work that sits next to the writing.',
          items: [
            { name: 'Statistical analysis plans', text: 'Written together with your biostatisticians.' },
            { name: 'Feasibility reports', text: 'Feasibility survey reports and disease demographics, for planning a study.' },
            { name: 'Quality check and review', text: 'An independent quality check or scientific review of a document written elsewhere.' },
          ],
        },
      ],
    },
    support: {
      kicker: 'Beyond the writing', title: 'Expert review and research support',
      line: 'A clinical pharmacologist’s opinion, and support for the people running a study.',
      items: [
        'A clinical pharmacologist’s expert opinion on study design and reporting, and independent review of study reports and dossiers.',
        'Centralised ethics committee and IRB support for clinicians and investigative sites, and eligible members for ethics committees.',
        'Clinical trial experts for hospitals and healthcare set-ups.',
        'Recommendations for ethics committees, CROs, biostatistics, data management and therapeutic-area experts for a study’s conduct.',
        'Referrals for medical and surgical consultations.',
      ],
    },
    standards: {
      kicker: 'Standards', title: 'Written to the rules it will be judged by',
      sets: [
        { label: 'Guidelines', items: ['ICH E3, study reports', 'ICH E6 (R3), good clinical practice', 'ICH E2C (R2) and E2F, safety reports', 'ICH M4, the CTD', 'EU Notice to Applicants, Volume 2B', 'ASEAN CTD', 'India’s New Drugs and Clinical Trials Rules, 2019'] },
        { label: 'Authorities', items: ['FDA, United States', 'EMA, European Union', 'MHRA, United Kingdom', 'TGA, Australia', 'CDSCO, India', 'ASEAN markets'] },
      ],
    },
    team: {
      kicker: 'Working with you', title: 'Working with your team',
      notes: [
        { title: 'Your templates and style', text: 'We write in your templates, to your style guide and SOPs, or propose a structure where you have none.' },
        { title: 'Alongside your experts', text: 'We work with your biostatisticians, data managers, medical monitors and regulatory team, and bring in therapeutic-area experts and biostatisticians of our own where you need them.' },
        { title: 'Reviews you can follow', text: 'Drafts go to your reviewers in rounds agreed at the start, and each round’s comments are resolved in the next version, through to sign-off.' },
        CONFIDENTIAL,
        ANYWHERE,
      ],
    },
    quotes: [
      { quote: 'We have worked together on a wide range of clinical documents, especially Clinical Study Reports, Case Narratives, and the various summary documents for the Common Technical Document. I have always found her work to be of exceptionally high quality, delivered in a timely manner, and communication was straightforward and easy.', by: 'Senior partner, writing consultancy, Germany' },
      { quote: 'Ms. Shah has sound expertise at her disposal, which she continually employed with great success in her fields of activity (preclinical and clinical documentation for EU marketing authorizations). … She unfailingly completed her set tasks to our complete satisfaction.', by: 'Research consultancy firm, Germany' },
      { quote: 'Hetal Shah has been able to understand the intricacies of complex assignments, is able to meet time lines and give out perfect jobs, acceptable to the customer and the international regulatory authorities.', by: 'Director, research consultancy firm, India' },
    ],
    related: [
      { label: 'Therapeutic areas', note: 'Where we have written, area by area', href: '/therapeutic-areas/' },
      { label: 'Scientific publications', note: 'From the study report to the paper', href: '/practices/scientific-publications/' },
      { label: 'Medical communications', note: 'Real-world evidence, position papers, expert statements', href: '/practices/medical-communications/' },
    ],
  },
  {
    slug: 'scientific-publications', n: '02', name: 'Scientific publications', scene: 'pub-manuscript',
    line: 'Original research, reviews, case reports and congress work, written to ICMJE and GPP and styled to the journal, from the first search to acceptance.',
    intro: 'We write for clinicians, investigators and companies with results to publish: research papers, reviews, case reports, abstracts and posters, each to the journal’s or the congress’s own rules and to the ethics of publication. The authors keep the work and its conclusions; our support is acknowledged the way the guidelines ask.',
    who: ['Clinicians and residents', 'Investigators and academic institutions', 'Pharma medical affairs', 'CROs', 'Professional societies'],
    write: {
      kicker: 'What we write', title: 'From the first search to acceptance',
      groups: [
        {
          title: 'Research papers', line: 'Your study, written up for the journal that suits it.',
          items: [
            { name: 'Original research manuscripts', text: 'From primary and secondary data, for national and international journals.' },
            { name: 'Case reports and series', text: 'From the case notes to a paper ready to submit.' },
            { name: 'Short communications and letters', text: 'Brief communications, and letters to the editor.' },
          ],
        },
        {
          title: 'Reviews', line: 'What the literature says, searched thoroughly and cited carefully.',
          items: [
            { name: 'Narrative reviews', text: 'A field’s evidence brought together and discussed.' },
            { name: 'Systematic reviews and meta-analyses', text: 'A defined search and selection, and pooled analyses with biostatisticians.' },
            { name: 'Literature searches', text: 'Systematic searches of the biomedical literature, for a review or for any of the work here.' },
          ],
        },
        {
          title: 'Congress work', line: 'Results presented at national and international meetings.',
          items: [
            { name: 'Abstracts', text: 'Written to each congress’s word limits and rules.' },
            { name: 'Posters', text: 'Laid out from the accepted abstract, for the congress hall.' },
            { name: 'Presentations', text: 'Slides for oral and congress presentations.' },
          ],
        },
        {
          title: 'Data', line: 'The numbers behind the paper.',
          items: [
            { name: 'Data analysis and reporting', text: 'Medical and clinical data analysed and reported, with biostatisticians where the study needs them.' },
          ],
        },
        {
          title: 'Through to acceptance', line: 'The work around and after the first draft.',
          items: [
            { name: 'Publication planning', text: 'Which results to publish, where and when, across a study or a programme.' },
            { name: 'Journal choice and styling', text: 'Choosing the journal, and styling the paper to its instructions for authors.' },
            { name: 'Submission and peer review', text: 'Submission, reviewers’ comments and revisions, and resubmission after a rejection.' },
            { name: 'Editing and proofreading', text: 'Editing and proofreading a manuscript you have written.' },
          ],
        },
      ],
    },
    standards: {
      kicker: 'Standards', title: 'Written to the rules journals use',
      sets: [
        { label: 'Guidelines', items: ['ICMJE recommendations', 'Good Publication Practice (GPP)', 'CONSORT and the other reporting guidelines', 'Each journal’s instructions for authors'] },
        { label: 'Publication ethics', items: ['Authorship as ICMJE defines it', 'Writing support acknowledged', 'Conflicts of interest disclosed'] },
      ],
    },
    team: {
      kicker: 'Working with you', title: 'Working with your team',
      notes: [
        { title: 'The authors’ paper', text: 'The authors own the paper and its conclusions; we write with them, and our support is acknowledged.' },
        { title: 'Your data, your statisticians', text: 'We work from your data and your statisticians’ analyses, or bring in a biostatistician where the study needs one.' },
        { title: 'Every author heard', text: 'Each draft goes to all the authors, and their comments are brought together in the next version.' },
        { title: 'Confidential until published', text: 'Unpublished results stay confidential until the paper is out.' },
        ANYWHERE,
      ],
    },
    quotes: [
      { quote: 'I have worked with Dr Hetal Shah for long 2 years on a project which culminated in 2 poster publication in both national and international forum and 1 international publication. I can only say without her this would not have been possible', by: 'Senior medical professional, India' },
      { quote: 'Hetal loves medical writing and is very good at it! She is a dependable resource with a strong work ethics who researches, analyses and then writes her documents and therefore executes well written documents.', by: 'Director, research consultancy firm, India' },
    ],
    related: [
      { label: 'Publications', note: 'Papers whose authors acknowledge our writing support, and her own', href: '/publications/' },
      { label: 'Medical communications', note: 'Position papers, consensus documents, real-world evidence', href: '/practices/medical-communications/' },
      { label: 'Therapeutic areas', note: 'Where we have written, area by area', href: '/therapeutic-areas/' },
    ],
  },
  {
    // (the practice's curves: its terrain, fitted for the film's sweep as it turns, stands too small in a band)
    slug: 'medical-communications', n: '03', name: 'Medical communications', scene: 'med-narrative',
    line: 'Position papers, consensus documents, real-world evidence and educational material: the evidence put in the form its readers need.',
    intro: 'Medical communications carries evidence to the people who act on it: a society setting out its position, a panel agreeing on practice, a medical affairs team presenting its data, a doctor explaining it to colleagues and patients. We write each piece from the evidence, referenced, so it holds when an expert reads it.',
    who: ['Professional societies and expert panels', 'Pharma medical affairs', 'Medical device makers', 'Nutraceutical makers', 'Hospitals and clinicians'],
    write: {
      kicker: 'What we write', title: 'Evidence, in the form its readers need',
      groups: [
        {
          title: 'Positions and consensus', line: 'Where experts set out what they think, and why.',
          items: [
            { name: 'Position papers', text: 'For societies, task forces and expert groups.' },
            { name: 'Consensus documents', text: 'An expert panel’s views brought together in one agreed document.' },
            { name: 'Expert statements', text: 'Statements that carry weight because the science behind them is sound.' },
          ],
        },
        {
          title: 'Real-world evidence', line: 'Medicines and devices in everyday practice, studied from start to finish.',
          items: [
            { name: 'RWE protocols', text: 'Protocols for real-world and registry studies.' },
            { name: 'Reports and publications', text: 'The study report, and the papers that follow it.' },
          ],
        },
        {
          title: 'For doctors', line: 'Scientific and educational material for healthcare professionals.',
          items: [
            { name: 'Scientific presentations and slide kits', text: 'For scientific meetings and medical education.' },
            { name: 'Educational modules', text: 'Educational slide decks and training modules.' },
            { name: 'Conference data presentations', text: 'Data prepared for presentation at medical conferences.' },
            { name: 'Physician booklets and newsletters', text: 'Physician information booklets, and study newsletters.' },
          ],
        },
        {
          title: 'For patients and the public', line: 'Health information people can follow.',
          items: [
            { name: 'Patient information leaflets', text: 'What a patient needs to know about a medicine or a condition, in plain words.' },
            { name: 'Health articles', text: 'For newspapers and magazines, and for blogs.' },
          ],
        },
        {
          title: 'Support for professionals', line: 'Help for doctors and researchers with their own writing.',
          items: [
            { name: 'Writing support', text: 'For medical professionals, from the first draft to the final one.' },
            { name: 'Grant applications', text: 'Research grant applications.' },
          ],
        },
        {
          title: 'Products and operations', line: 'For companies bringing a product to market, and running their teams.',
          items: [
            { name: 'Sales literature', text: 'Sales literature for newly launched medicines.' },
            { name: 'Standard operating procedures', text: 'SOPs for clinical research and medical writing teams.' },
          ],
        },
      ],
    },
    standards: {
      kicker: 'Standards', title: 'Written from the evidence',
      sets: [
        { label: 'Every piece', items: ['Referenced to the published evidence', 'Balanced in what it claims', 'ICMJE and GPP for anything published'] },
      ],
    },
    team: {
      kicker: 'Working with you', title: 'Working with your team',
      notes: [
        { title: 'Your panel’s voice', text: 'For a position paper or a consensus document, we work with the panel’s experts and bring their views together in one voice.' },
        { title: 'With your statisticians', text: 'We work alongside statisticians and clinical experts, so results become conclusions that are clear, balanced and defensible.' },
        { title: 'Your house style', text: 'We write to your templates, house style and review process.' },
        CONFIDENTIAL,
        ANYWHERE,
      ],
    },
    quotes: [
      { quote: 'Working with Dr. Hetal Shah is a great pleasure… She is always responsive and asked the right questions to understand our subject matter. Her knowledge of subject is in depth and there is so much value addition that she brings with her work. She is very professional and a pleasure to deal with.', by: 'Medical device company, India' },
    ],
    related: [
      { label: 'Scientific publications', note: 'Research papers, reviews, congress work', href: '/practices/scientific-publications/' },
      { label: 'Publications', note: 'Papers whose authors acknowledge our writing support', href: '/publications/' },
      { label: 'Therapeutic areas', note: 'Where we have written, area by area', href: '/therapeutic-areas/' },
    ],
  },
  {
    slug: 'ai-ml-advisory', n: '05', name: 'AI/ML advisory', scene: 'ai',
    line: 'Subject-matter expertise and expert human review, for teams building or using AI in medical writing.',
    intro: 'AI can draft a protocol section or summarise a study in seconds; whether the result is right is a matter of domain judgement. We bring that judgement to the teams building AI tools for medical writing and to the teams using them: guidance while a tool takes shape, and an expert reading of what it writes.',
    who: ['AI and ML product teams', 'Clinical research technology companies', 'Pharma and CRO teams using AI tools', 'Conference and webinar organisers'],
    write: {
      kicker: 'What we do', title: 'Domain judgement, in the loop',
      groups: [
        {
          title: 'While a tool is built', line: 'Domain expertise for the people building it.',
          items: [
            { name: 'Subject-matter expertise', text: 'What a protocol, a study report or a manuscript must contain, which guidelines govern it, and what correct looks like.' },
            { name: 'Testing', text: 'Functionality and usability, tested the way a medical writer would use the tool.' },
            { name: 'Recommendations', text: 'Suggestions for the tool’s development, from the writer’s side.' },
          ],
        },
        {
          title: 'When it writes', line: 'A qualified reader for generated content.',
          items: [
            { name: 'Expert human-in-the-loop review', text: 'Generated content reviewed for accuracy, relevance and quality.' },
          ],
        },
        {
          title: 'Sharing what we know', line: 'For teams, and for audiences.',
          items: [
            { name: 'Expert webinars and talks', text: 'On AI in protocol writing, on turning trial data into real-world impact, and on AI in publication work.' },
          ],
        },
      ],
    },
    team: {
      kicker: 'Working with you', title: 'What we hold to',
      notes: [
        { title: 'A person stays accountable', text: 'Generated text is read by a qualified expert before anyone relies on it.' },
        { title: 'The same yardstick', text: 'Output is judged against the standards a human writer’s work is judged by: ICH, the CTD, ICMJE and GPP.' },
        { title: 'Confidential with data', text: 'Source data, documents and the tool itself stay confidential, used only for the work agreed.' },
        { title: 'With your teams', text: 'Alongside your product, data science and medical teams, remotely and across time zones.' },
      ],
    },
    quotes: [],
    related: [
      { label: 'Regulatory writing', note: 'The documents these tools write', href: '/practices/regulatory-writing/' },
      { label: 'Scientific publications', note: 'Research papers, reviews, congress work', href: '/practices/scientific-publications/' },
      { label: 'Medical communications', note: 'Position papers, consensus documents, real-world evidence', href: '/practices/medical-communications/' },
    ],
  },
];

// the film's practices (scenes.js CHAPTERS, in order) that have a page of their own
export const practiceSlugs = practices.map(p => p.slug);
