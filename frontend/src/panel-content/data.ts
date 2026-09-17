export interface ProjectCard {
  id: string;
  title: string;
  paragraphs: readonly string[];
  href?: string;
}

const placeholderProject = (id: string): ProjectCard => ({
  id,
  title: 'Place holder planet for future projects',
  paragraphs: [],
});

export const personalProjects: readonly ProjectCard[] = [
  {
    id: 'review-vscode-extension',
    title: 'Review VS Code Extension',
    paragraphs: [
      'VS Code extension for keeping control of fast code changes in the era of coding agents, with line-by-line review of live updates without constant Git commits.',
    ],
    href: 'https://github.com/Laughcheeta1/PersonalPortfolio',
  },
  {
    id: 'vcow',
    title: 'VCOW',
    paragraphs: [
      'A CREATE-X project that pivoted from vertical farming for cattle-raising into a crowdfunding platform for cattle projects after interviews with farmers and investors.',
    ],
  },
  {
    id: 'employee-absence-management',
    title: 'Employee Absence Management',
    paragraphs: [
      'Web application enabling employers to manage employee absences. Defined requirements, architecture, database, and backend service layers.',
      'Monolith architecture using Next.js and GraphQL backed by Supabase.',
    ],
  },
  {
    id: 'lookup',
    title: 'Lookup',
    paragraphs: [
      'Multi-brand clothing catalog with CSV inventory upload plus store and product geolocation.',
      'REST microservice architecture using Spring Boot, NestJS, React, Vite, and MongoDB.',
    ],
  },
  {
    id: 'personal-portfolio',
    title: 'Personal Portfolio',
    paragraphs: [
      'This little island: a Three.js world, a conversational guide, and a portfolio designed as a place to explore.',
    ],
  },
  placeholderProject('personal-project-placeholder-review-slot'),
  placeholderProject('personal-project-placeholder-hackathon-slot'),
];

export const workProjects: readonly ProjectCard[] = [
  placeholderProject('work-project-placeholder-legal'),
  placeholderProject('work-project-placeholder-rpa'),
  placeholderProject('work-project-placeholder-medical-scales'),
  placeholderProject('work-project-placeholder-medical-decision-support'),
  placeholderProject('work-project-placeholder-evaluations'),
  {
    id: 'rpa-emr-chrome-integrations',
    title: 'RPA Integration Agent & EMR Mapping Agent & Chrome Extension for RPA Integrations',
    paragraphs: [
      'AI agent built to automate and test RPA system integrations.',
      'Agent that maps any electronic medical record to a standard format from its HTML file.',
      'Chrome extension compatible with Manifest V2 and V3 for RPA integrations.',
    ],
  },
  placeholderProject('work-project-placeholder-chrome'),
  placeholderProject('work-project-placeholder-codebase'),
  placeholderProject('work-project-placeholder-forward-deployed'),
];

export interface TimelineEntry {
  id: string;
  start: string;
  end: string | null;
  kicker: string;
  role: string;
  company: string;
  period: string;
  copy?: string;
  current?: boolean;
}

export const workTimeline: readonly TimelineEntry[] = [
  {
    id: 'stealth-startup',
    start: '2026-03-01',
    end: null,
    kicker: 'Current role · companies',
    role: 'Co-Founder',
    company: 'Stealth Startup · Colombia',
    period: 'March 2026 — present',
    copy: 'Co-Founder of a technology startup operating in stealth in Colombia.',
    current: true,
  },
  {
    id: 'telepatia',
    start: '2025-08-01',
    end: '2026-02-28',
    kicker: 'Companies',
    role: 'Founding Team · AI Engineer Intern',
    company: 'Telepatia AI',
    period: 'August 2025 — February 2026',
    copy: 'Worked on AI agents for RPA integration testing, complex medical-scale calculation, and medical decision support; created tests and evaluations, built a Manifest V2/V3 Chrome extension, supported codebase migration, and worked as a forward-deployed engineer providing direct support to large corporate customers.',
  },
  {
    id: 'data-structures-tutor',
    start: '2024-09-01',
    end: '2025-07-31',
    kicker: 'Teaching',
    role: 'Data Structures Class Private Tutor',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'September 2024 — July 2025',
  },
  {
    id: 'programming-fundamentals-tutor',
    start: '2023-06-01',
    end: '2023-11-30',
    kicker: 'Teaching',
    role: 'Programming Fundamentals Tutor',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'June 2023 — November 2023',
    copy: 'Selected as tutor for the programming fundamentals classes in the university',
  },
  {
    id: 'systems-representative',
    start: '2025-09-01',
    end: '2026-09-30',
    kicker: 'Leadership',
    role: 'Systems Engineering Student Representative',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'September 2025 — September 2026',
    copy: 'Helped, through student petition pressure, institute the program director the students wanted.\n\nExecuted three hackathons focused on:\n* business-model creation and V0s of startups\n* infrastructure\n* biotechnology and AI.',
  },
  {
    id: 'mc2-ambassador',
    start: '2025-03-01',
    end: '2025-09-30',
    kicker: 'Leadership & entrepreneurship',
    role: 'University Ambassador and Entrepreneur',
    company: 'mc^2',
    period: 'March 2025 — September 2025',
    copy: 'Represented mc^2 at EIA, fostered connections, organized a hackathon, and facilitated university partnerships.',
  },
  {
    id: 'nao-aeronautics',
    start: '2023-08-01',
    end: '2025-09-30',
    kicker: 'Leadership & entrepreneurship',
    role: 'CEO and Founder',
    company: 'NAO Aeronautics',
    period: 'August 2023 — September 2025',
    copy: 'Logistics startup concept bringing city resources to remote areas. Designed the business plan, made investor pitches, interviewed specialists in mining and defense, networked at startup festivals, and developed a prototype.',
  },
];

export type EducationEntryType = 'language' | 'course' | 'university';

export interface EducationEntry {
  id: string;
  title: string;
  provider: string;
  date: string;
  copy?: string;
  type: EducationEntryType;
}

export interface EducationLayer {
  id: string;
  label: string;
  role: 'input' | 'hidden' | 'output';
  entries: readonly EducationEntry[];
}

export const educationLayers: readonly EducationLayer[] = [
  {
    id: 'languages',
    label: 'Languages',
    role: 'input',
    entries: [
      {
        id: 'spanish',
        title: 'Spanish',
        provider: 'Language proficiency',
        date: 'Native/bilingual proficiency',
        copy: 'Native or bilingual proficiency.',
        type: 'language',
      },
      {
        id: 'english',
        title: 'English',
        provider: 'Language proficiency',
        date: 'Native/bilingual proficiency',
        copy: 'Native or bilingual proficiency.',
        type: 'language',
      },
    ],
  },
  {
    id: 'courses-and-certifications-01',
    label: 'Courses and certifications',
    role: 'hidden',
    entries: [
      {
        id: 'ruta-n-tech-marathon',
        title: 'Ruta N Tech Marathon',
        provider: 'Ruta N Medellín',
        date: 'September 2023',
        copy: 'Competitive programming marathon',
        type: 'course',
      },
      {
        id: 'perficient-tech-camp',
        title: 'Perficient Tech Camp 2023',
        provider: 'Perficient Latin America',
        date: 'December 2023',
        copy: 'Web development training program',
        type: 'course',
      },
      {
        id: 'cs50x',
        title: 'CS50x',
        provider: 'Harvard University',
        date: 'June 2024',
        copy: 'Harvard University introduction to computer science course.',
        type: 'course',
      },
      {
        id: 'cs50-ai',
        title: 'CS50 AI',
        provider: 'Harvard University',
        date: 'July 2024',
        copy: 'Harvard University artificial intelligence course.',
        type: 'course',
      },
      {
        id: 'create-x',
        title: 'Create-X',
        provider: 'Georgia Institute of Technology',
        date: 'October 2024',
        copy: 'Startup-building program from the Georgia Institute of Technology.',
        type: 'course',
      },
    ],
  },
  {
    id: 'courses-and-certifications-02',
    label: 'Courses and certifications',
    role: 'hidden',
    entries: [
      {
        id: 'supervised-machine-learning',
        title: 'Supervised Machine Learning: Regression and Classification',
        provider: 'Stanford University & DeepLearning.AI',
        date: 'January 2025',
        type: 'course',
      },
      {
        id: 'mc2-builders',
        title: 'mc^2 Builders Program',
        provider: 'mc^2',
        date: 'Completed May 2025',
        copy: 'Entrepreneurship and startup-building program',
        type: 'course',
      },
      {
        id: 'python-advanced',
        title: 'Python Advanced Course',
        provider: 'SoftServe',
        date: 'March–July 2025',
        type: 'course',
      },
      {
        id: 'advanced-learning-algorithms',
        title: 'Advanced Learning Algorithms',
        provider: 'DeepLearning.AI',
        date: 'April 2026',
        type: 'course',
      },
    ],
  },
  {
    id: 'formal-education',
    label: 'Formal education',
    role: 'output',
    entries: [
      {
        id: 'eia-systems-engineering',
        title: 'Systems Engineering and Computing',
        provider: 'Universidad EIA / Escuela de Ingeniería de Antioquia',
        date: 'January 2022 – November 2026; in progress',
        type: 'university',
      },
      {
        id: 'data-analytics-diplomat',
        title: 'Data Analytics Diploma',
        provider: 'Escuela de Ingeniería de Antioquia',
        date: 'Completed November 2023',
        type: 'university',
      },
      {
        id: 'leadership-diplomat',
        title: 'Leadership Diploma',
        provider: 'Escuela de Ingeniería de Antioquia',
        date: 'May 2026',
        type: 'university',
      },
    ],
  },
];

export interface Hobby {
  id: string;
  number: string;
  title: string;
  copy?: string;
  star: {
    x: string;
    y: string;
    size: number;
    delay: number;
  };
}

export const hobbies: readonly Hobby[] = [
  {
    id: 'learning',
    number: '01',
    title: 'Learning new things',
    star: { x: '20%', y: '22%', size: 27, delay: 0 },
  },
  {
    id: 'gym',
    number: '02',
    title: 'Gym',
    star: { x: '48%', y: '14%', size: 23, delay: 1.1 },
  },
  {
    id: 'gifts',
    number: '03',
    title: 'Making Gifts and surprise parties',
    star: { x: '68%', y: '42%', size: 25, delay: 2.2 },
  },
  {
    id: 'motorcycle',
    number: '04',
    title: 'Listening to Fredy Vega Podcasts',
    star: { x: '81%', y: '23%', size: 29, delay: .6 },
  },
  {
    id: 'working',
    number: '05',
    title: 'Working',
    copy: 'Really. I personaly work for the love of the game',
    star: { x: '34%', y: '39%', size: 31, delay: 1.8 },
  },
];

export interface Achievement {
  title: string;
  copy?: string;
  date: string;
  group: 'Awards' | 'Honors';
}

export const achievements: readonly Achievement[] = [
  {
    group: 'Awards',
    title: "First Place — Sistecredito's Third Hackathon",
    copy: 'The challenge was focused on software development.',
    date: '2024-11',
  },
  {
    group: 'Awards',
    title: 'First Place — Sistecredito Hackathon',
    copy: 'The hackathon was about making an efficient system for detecting fraudulent transactions via classification algorithms.',
    date: '2024-08',
  },
  {
    group: 'Awards',
    title: "First Place — ISA Intercolombia's Hackathon",
    copy: 'This one is pretty interesting. More about it in my LinkedIn',
    date: '2024-05',
  },
  {
    group: 'Awards', title: 'Regional ICPC EIA Representative',
    copy: 'My team advanced to the regional round of ICPC.', date: '2024',
  },
  {
    group: 'Awards', title: 'Local ICPC EIA Representative',
    copy: 'Represented EIA University in ICPC.', date: '2023',
  },
  {
    group: 'Awards', title: 'Local ICPC EIA Representative',
    copy: 'Represented EIA University in ICPC.', date: '2022',
  },
  {
    group: 'Honors', title: 'Recognition of Leadership — EIA University',
    date: '2026-02',
  },
  {
    group: 'Honors', title: "Mentor and Judge — Sistecredito's Fourth Hackathon",
    copy: "Asked to be a mentor and judge for Sistecredito's fourth hackathon.", date: '2025-03',
  },
  {
    group: 'Honors',
    title: 'Deans List — Second Semester',
    date: '2023-02',
  },
  {
    group: 'Honors',
    title: 'Deans List — First Semester',
    date: '2022-10',
  },
];

export type FitnessStatAccent = 'strength' | 'running' | 'cycling' | 'swimming';

export interface FitnessStat {
  id: string;
  label: string;
  value: string;
  detail: string;
  accent: FitnessStatAccent;
}

export const fitnessStats: readonly FitnessStat[] = [
  {
    id: 'deadlift',
    label: 'Deadlift',
    value: '120 kg',
    detail: '',
    accent: 'strength',
  },
  {
    id: 'squat',
    label: 'Squat',
    value: '100 kg',
    detail: '',
    accent: 'strength',
  },
  {
    id: 'bench-press',
    label: 'Bench press',
    value: '75 kg × 2 reps',
    detail: '',
    accent: 'strength',
  },
  {
    id: 'five-kilometre-run',
    label: '5 km run',
    value: '< 20 min',
    detail: 'A sub-twenty-minute run.',
    accent: 'running',
  },
  {
    id: 'longest-run',
    label: 'Longest run',
    value: '15 km',
    detail: 'After 40 minutes on a static bike.',
    accent: 'running',
  },
  {
    id: 'longest-bike-ride',
    label: 'Longest bike ride',
    value: '61 km',
    detail: '',
    accent: 'cycling',
  },
  {
    id: 'swim',
    label: 'Swim',
    value: '25 m',
    detail: 'Without getting completely gassed out 🤙',
    accent: 'swimming',
  },
];

export interface ProfileMemoryPanel {
  theme: string;
  title: string;
  song: string;
  embedUrl: string;
  story: string;
}

export const profileMemory: ProfileMemoryPanel = {
  theme: 'secret-garden',
  title: 'Fun fact:',
  song: 'Baile Inolvidable - Bad Bunny',
  embedUrl: 'https://www.youtube-nocookie.com/embed/a1Femq4NPxs?list=RDa1Femq4NPxs&start=1',
  story: 'I paid 366 USD just to be able to go to his concert and hear it live ... I would do it again.',
};

export interface SecretPanel {
  theme: string;
  eyebrow: string;
  icon: string;
  title: string;
  copy: string;
  signature: string;
  additionalCopy?: string;
  image?: {
    src: string;
    alt: string;
  };
}

export const secretPanels: Readonly<Record<string, SecretPanel>> = {
  starship: {
    theme: 'secret-launch',
    eyebrow: '',
    icon: '🚀',
    title: 'Ship Baby Ship!',
    copy: "I loved so much Telepatia's CEO motto that I now have it as my phone wallpaper.",
    signature: '',
  },
  f22: {
    theme: 'secret-flight',
    eyebrow: '',
    icon: '',
    title: 'I live by two sacred phrases in my life:',
    copy: '1. Either you come and give it all, or do not come',
    signature: '2. Not really a phrase, but rather this image:',
    image: {
      src: 'panels/f22/so_you_want_pilot.png',
      alt: 'A pilot in a cockpit holding a sign that reads “So You Want to Be a Pilot.”',
    },
  },
  'neural-network': {
    theme: 'secret-node',
    eyebrow: '',
    icon: '✺',
    title: 'The infinite Why.',
    copy: 'The thing I love most about AI is not the productivity and the possibility of just letting my wildest dreams come true quicker, but rather that I can finally ask infinite “Why” questions at someone, and that someone not getting angry at me for questioning everything.',
    signature: '',
  },
  'victory-statue': {
    theme: 'secret-pedestal',
    eyebrow: '',
    icon: '♛',
    title: 'A different kind of achievement.',
    copy: "In reality my greatest achievement comes to me when I find myself saying something that an old friend, or person I used to know, said. It reminds me that a small piece of everyone I've loved still lives with me, regardless of anything that may have happened between us.",
    additionalCopy: 'In another fun fact, I stopped participating in university hackathons because the program director asked me and my team to stop participating, and instead become mentors so that other people could win.',
    signature: '',
  },
  'squat-rack': {
    theme: 'secret-training',
    eyebrow: '',
    icon: '',
    title: 'Progress, not perfection.',
    copy: 'I want to use this panel to show a little bit about my stats. There is still a lot of room to grow, but I am happy with what I have accomplished:',
    signature: '',
  },
  'pergamon-library': {
    theme: 'secret-archive',
    eyebrow: '',
    icon: '📜',
    title: 'I WILL BE REMEMBERED BY HISTORY',
    copy: '',
    signature: '',
  },
};
