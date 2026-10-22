// The people who lead MeWriT, for the Leadership page (src/pages/leadership/index.astro; the user,
// 2026-10-21: "its not only dr hetal shah it is also dr amit shah so make it a leadership tab").
// Dr Hetal Shah's words are the site's own (data/home.ts, founder); her full profile has its own page.
// Dr Amit Shah's come from the current mewrit.com leadership page, as given in "MeWriT Website Text for
// Editing.docx" (Page 2, Part 3), with the institutions he trained at left out until Dr Hetal approves
// naming institutions (the source names them). His photograph is the current site's
// (mewrit.com/images/amit.jpg, src/assets/amit-shah.jpg; the user, 2026-10-21: "you can also get dr
// amit's photo from the current mewrit site"); initials stand in for anyone without one.
import { founder } from './home';

export type Leader = {
  id: string; name: string; role: string; bio: string[]; chips: string[];
  photo?: boolean; initials?: string; profile?: string;
};

export const leadership = {
  title: 'Leadership',
  line: 'The scientist and the clinician who lead MeWriT’s work.',
  leaders: [
    {
      id: 'hetal-shah', name: founder.name, role: founder.role, bio: [founder.bio], chips: founder.chips,
      photo: true, profile: '/hetal/',
    },
    {
      id: 'amit-shah', name: 'Dr Amit Shah', role: 'Chief Medical Expert', initials: 'AS', photo: true,
      bio: [
        'A medically qualified surgeon specialising in GI surgery, with over 15 years of clinical practice and a Master’s in hepato-biliary and pancreatic surgery.',
        'At MeWriT he is the medical and surgical expert behind medical queries, clinical discussions and therapeutic-area support for the consultants writing clinical research documents and publications. He works with sponsor teams on clinical trial discussions and with doctor-authors on publication planning, and offers independent healthcare consulting tailored to clients’ and patients’ needs.',
      ],
      chips: ['GI surgeon', '15+ years in clinical practice', 'Hepato-biliary and pancreatic surgery'],
    },
  ] as Leader[],
};
