export interface ProjectCard {
  title: string;
  paragraphs: readonly string[];
  tag: string;
}

export const personalProjects: readonly ProjectCard[] = [
  {
    title: 'NAO Aeronautics',
    paragraphs: [
      'Logistics startup concept bringing city resources to remote areas. Designed the business plan, made investor pitches, interviewed specialists in mining and defense, networked at startup festivals, and developed a prototype.',
    ],
    tag: 'VENTURE CONCEPT',
  },
  {
    title: 'VCOW',
    paragraphs: [
      'A CREATE-X project that pivoted from vertical farming for cattle-raising into a crowdfunding platform for cattle projects after interviews with farmers and investors.',
    ],
    tag: 'PRODUCT DISCOVERY',
  },
  {
    title: 'Employee Absence Management',
    paragraphs: [
      'Web application enabling employers to manage employee absences. Defined requirements, architecture, database, and backend service layers.',
      'Monolith architecture using Next.js and GraphQL backed by Supabase.',
    ],
    tag: 'WEB APPLICATION',
  },
  {
    title: 'Lookup',
    paragraphs: [
      'Multi-brand clothing catalog with CSV inventory upload plus store and product geolocation.',
      'REST microservice architecture using Spring Boot, NestJS, React, Vite, and MongoDB.',
    ],
    tag: 'MICROSERVICES',
  },
  {
    title: 'Personal Portfolio',
    paragraphs: [
      'This little island: a Three.js world, a conversational guide, and a portfolio designed as a place to explore.',
    ],
    tag: 'IN PROGRESS',
  },
  {
    title: 'Review VS Code Extension',
    paragraphs: [
      'VS Code extension for keeping control of fast code changes in the era of coding agents, with line-by-line review of live updates without constant Git commits.',
    ],
    tag: 'VS CODE EXTENSION',
  },
  {
    title: 'EIA University Hackathon',
    paragraphs: [
      'Organized a startup business-model and MVP hackathon with sponsorship from mc2.',
    ],
    tag: 'COMMUNITY',
  },
];

export const workProjects: readonly ProjectCard[] = [
  {
    title: 'Legal_IA',
    paragraphs: [
      'Created and deployed an AI web application now in use by a legal professional. Lawyers manage their knowledge bases, clients, and documents, then ask an AI agent questions about that private context.',
      "Administrator pages let the owner independently change each agent's LLM provider, model, and prompt, keeping the product maintainable without engineering intervention.",
    ],
    tag: 'DEPLOYED AI PRODUCT',
  },
  {
    title: 'RPA Integration Agent',
    paragraphs: ['AI agent built to automate and test RPA system integrations.'],
    tag: 'AI AGENTS',
  },
  {
    title: 'Medical Scales Calculator',
    paragraphs: ['AI agent that calculates complex medical scales from consultation context and chat.'],
    tag: 'AI AGENTS',
  },
  {
    title: 'Medical Decision Support Agent',
    paragraphs: ['AI agent system for medical decision support.'],
    tag: 'AI AGENTS',
  },
  {
    title: 'AI Agent Tests and Evaluations',
    paragraphs: ['Tests and evaluations for AI agent systems.'],
    tag: 'EVALUATION',
  },
  {
    title: 'EMR Mapping Agent',
    paragraphs: ['Agent that maps any electronic medical record to a standard format from its HTML file.'],
    tag: 'PYTHON · LLMS',
  },
  {
    title: 'Chrome Extension for RPA Integrations',
    paragraphs: ['Chrome extension compatible with Manifest V2 and V3 for RPA integrations.'],
    tag: 'CHROME EXTENSIONS',
  },
  {
    title: 'Codebase Migration',
    paragraphs: ['Supported codebase migration as part of Telepatia’s engineering work.'],
    tag: 'ENGINEERING',
  },
  {
    title: 'Forward-Deployed Engineering',
    paragraphs: ['Worked directly with large corporate customers to support product integrations and delivery.'],
    tag: 'CUSTOMER SUPPORT',
  },
];

export interface TimelineEntry {
  id: string;
  side: 'left' | 'right';
  start: string;
  end: string;
  kicker: string;
  role: string;
  company: string;
  period: string;
  copy: string;
  current?: boolean;
}

export const workTimeline: readonly TimelineEntry[] = [
  {
    id: 'stealth-startup',
    side: 'left',
    start: '2026-03-01',
    end: '2026-09-30',
    kicker: 'Current role · companies',
    role: 'AI Engineer',
    company: 'Stealth Startup · Colombia',
    period: 'March 2026 — present',
    copy: 'Current AI Engineer role at a technology startup operating in stealth.',
    current: true,
  },
  {
    id: 'telepatia',
    side: 'left',
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
    side: 'left',
    start: '2024-09-01',
    end: '2025-07-31',
    kicker: 'Teaching',
    role: 'Data Structures Class Private Tutor',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'September 2024 — July 2025',
    copy: 'Tutored students in Data Structures and developed personalized study plans to support different learning styles and paces.',
  },
  {
    id: 'programming-fundamentals-tutor',
    side: 'left',
    start: '2023-06-01',
    end: '2023-11-30',
    kicker: 'Teaching',
    role: 'Programming Fundamentals Tutor',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'June 2023 — November 2023',
    copy: 'Tutored students in programming fundamentals, helping them grasp coding concepts through clear explanations and approachable guidance.',
  },
  {
    id: 'systems-representative',
    side: 'right',
    start: '2025-09-01',
    end: '2026-09-30',
    kicker: 'Leadership',
    role: 'Systems Engineering Student Representative',
    company: 'Escuela de Ingeniería de Antioquia',
    period: 'September 2025 — September 2026',
    copy: 'Helped, through student petition pressure, institute the program director the students wanted. Executed three hackathons focused on business-model creation and V0s of startups, infrastructure, and biotechnology and AI.',
  },
  {
    id: 'mc2-ambassador',
    side: 'right',
    start: '2025-03-01',
    end: '2025-09-30',
    kicker: 'Leadership & entrepreneurship',
    role: 'University Ambassador and Entrepreneur',
    company: 'mc^2',
    period: 'March 2025 — September 2025',
    copy: 'Represented mc^2 at EIA, fostered connections, organized conferences, hackathons, and networking events, and facilitated university partnerships.',
  },
  {
    id: 'nao-aeronautics',
    side: 'right',
    start: '2023-08-01',
    end: '2025-09-30',
    kicker: 'Leadership & entrepreneurship',
    role: 'CEO and Founder',
    company: 'NAO Aeronautics',
    period: 'August 2023 — September 2025',
    copy: 'Designed the business plan, made investor pitches, interviewed specialists in mining and defense, networked at startup festivals, and designed and developed a prototype.',
  },
];

export type EducationEntryType = 'language' | 'course' | 'general' | 'university' | 'formal';

export interface EducationEntry {
  id: string;
  title: string;
  provider: string;
  date: string;
  copy: string;
  type: EducationEntryType;
}

export interface EducationLayer {
  id: string;
  label: string;
  descriptor: string;
  role: 'input' | 'hidden' | 'university' | 'output';
  entries: readonly EducationEntry[];
}

export const educationLayers: readonly EducationLayer[] = [
  {
    id: 'languages',
    label: 'Languages',
    descriptor: 'Input layer',
    role: 'input',
    entries: [
      {
        id: 'spanish',
        title: 'Spanish',
        provider: 'Language proficiency',
        date: 'Native / bilingual',
        copy: 'Native or bilingual proficiency.',
        type: 'language',
      },
      {
        id: 'english',
        title: 'English',
        provider: 'Language proficiency',
        date: 'Native / bilingual',
        copy: 'Native or bilingual proficiency.',
        type: 'language',
      },
    ],
  },
  {
    id: 'technical-courses',
    label: 'Technical courses',
    descriptor: 'Hidden layer 01',
    role: 'hidden',
    entries: [
      {
        id: 'perficient-tech-camp',
        title: 'Certification Perficient Tech Camp 2023',
        provider: 'Perficient Latin America',
        date: 'December 2023',
        copy: 'Technology training program completed through Perficient Latin America.',
        type: 'course',
      },
      {
        id: 'supervised-machine-learning',
        title: 'Supervised Machine Learning: Regression and Classification',
        provider: 'DeepLearning.AI',
        date: 'January 2025',
        copy: 'Supervised machine learning course covering regression and classification.',
        type: 'course',
      },
      {
        id: 'python-advanced',
        title: 'Python Advanced Course',
        provider: 'SoftServe',
        date: 'July 2025',
        copy: 'Advanced Python course completed through SoftServe.',
        type: 'course',
      },
      {
        id: 'advanced-learning-algorithms',
        title: 'Advanced Learning Algorithms',
        provider: 'DeepLearning.AI',
        date: 'April 2026',
        copy: 'Advanced learning algorithms course completed through DeepLearning.AI.',
        type: 'course',
      },
    ],
  },
  {
    id: 'general-learning',
    label: 'General learning',
    descriptor: 'Hidden layer 02',
    role: 'hidden',
    entries: [
      {
        id: 'ruta-n-tech-marathon',
        title: 'Certification Ruta N Tech Marathon',
        provider: 'Ruta N Medellín',
        date: 'September 2023',
        copy: 'Technology and innovation marathon certification from Ruta N Medellín.',
        type: 'general',
      },
      {
        id: 'mc2-builders',
        title: 'mc^2 Builders Program',
        provider: 'mc^2',
        date: 'May 2025',
        copy: 'Entrepreneurship and startup-building program completed through mc^2.',
        type: 'general',
      },
    ],
  },
  {
    id: 'university-learning',
    label: 'University learning',
    descriptor: 'University layer',
    role: 'university',
    entries: [
      {
        id: 'icpc-2023',
        title: 'Participation ICPC 2023',
        provider: 'ICPC – International Collegiate Programming Contest',
        date: 'October 2023',
        copy: 'Participation in the 2023 International Collegiate Programming Contest.',
        type: 'university',
      },
      {
        id: 'cs50x',
        title: 'CS50x',
        provider: 'Harvard University',
        date: 'June 2024',
        copy: 'Harvard University introduction to computer science course.',
        type: 'university',
      },
      {
        id: 'cs50-ai',
        title: 'CS50 AI',
        provider: 'Harvard University',
        date: 'July 2024',
        copy: 'Harvard University artificial intelligence course.',
        type: 'university',
      },
      {
        id: 'create-x',
        title: 'Create-X',
        provider: 'Georgia Institute of Technology',
        date: 'October 2024',
        copy: 'Startup-building program from the Georgia Institute of Technology.',
        type: 'university',
      },
    ],
  },
  {
    id: 'formal-education',
    label: 'Formal education',
    descriptor: 'Output layer',
    role: 'output',
    entries: [
      {
        id: 'eia-systems-engineering',
        title: 'Systems Engineering',
        provider: 'Escuela de Ingeniería de Antioquia',
        date: 'January 2022 — November 2026',
        copy: 'University degree in Systems Engineering, in progress at Escuela de Ingeniería de Antioquia.',
        type: 'formal',
      },
      {
        id: 'data-analytics-diplomat',
        title: 'Data Analytics Diplomat',
        provider: 'Escuela de Ingeniería de Antioquia',
        date: 'November 2023',
        copy: 'Data analytics diploma from Escuela de Ingeniería de Antioquia.',
        type: 'formal',
      },
      {
        id: 'icpc-2024',
        title: 'Participation ICPC 2024',
        provider: 'ICPC – International Collegiate Programming Contest',
        date: 'October 2024',
        copy: 'Participation in the 2024 International Collegiate Programming Contest.',
        type: 'formal',
      },
      {
        id: 'leadership-diplomat',
        title: 'Leadership Diplomat',
        provider: 'Escuela de Ingeniería de Antioquia',
        date: 'May 2026',
        copy: 'Leadership diploma from Escuela de Ingeniería de Antioquia.',
        type: 'formal',
      },
    ],
  },
];

export interface Hobby {
  id: string;
  number: string;
  title: string;
  copy: string;
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
    copy: 'Following questions wherever they lead—through technology, ideas, and the small details that make the world feel larger.',
    star: { x: '20%', y: '22%', size: 27, delay: 0 },
  },
  {
    id: 'gym',
    number: '02',
    title: 'Gym',
    copy: 'Lifting weights and running. Repetition, patience, and showing up turn effort into momentum.',
    star: { x: '48%', y: '14%', size: 23, delay: 1.1 },
  },
  {
    id: 'gifts',
    number: '03',
    title: 'Making Gifts and surprise parties',
    copy: 'Planning handmade gifts and surprise parties for friends and family. The surprise is part of the craft.',
    star: { x: '68%', y: '42%', size: 25, delay: 2.2 },
  },
  {
    id: 'motorcycle',
    number: '04',
    title: 'Motorcycle driving',
    copy: 'Riding motorcycles and taking a different route home whenever there is time to explore.',
    star: { x: '81%', y: '23%', size: 29, delay: .6 },
  },
  {
    id: 'working',
    number: '05',
    title: 'Working',
    copy: 'Yes, really. I truly love working—the satisfaction of solving hard problems and making something useful keeps me energized.',
    star: { x: '34%', y: '39%', size: 31, delay: 1.8 },
  },
];

export interface Achievement {
  title: string;
  copy: string;
  group: 'Awards' | 'Honors';
}

export const achievements: readonly Achievement[] = [
  {
    group: 'Awards',
    title: 'First Place Hackathon · ISA Intercolombia',
    copy: 'First-place hackathon recognition.',
  },
  {
    group: 'Awards',
    title: 'First Place Hackathon · Sistecredito',
    copy: 'First-place hackathon recognition.',
  },
  {
    group: 'Awards',
    title: "First Place Hackathon · Sistecredito, Third Version",
    copy: "First-place recognition in Sistecredito's third hackathon.",
  },
  {
    group: 'Honors',
    title: 'Academic Recognition · First Semester',
    copy: 'Academic recognition for the first semester.',
  },
  {
    group: 'Honors',
    title: 'Academic Recognition · Second Semester',
    copy: 'Academic recognition for the second semester.',
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
    detail: 'A heavy pull, built one session at a time.',
    accent: 'strength',
  },
  {
    id: 'squat',
    label: 'Squat',
    value: '100 kg',
    detail: 'Leg day has entered the chat.',
    accent: 'strength',
  },
  {
    id: 'bench-press',
    label: 'Bench press',
    value: '75 kg × 2 reps',
    detail: 'Two clean repetitions in the log.',
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
    detail: '+1,000 m elevation · after years away from a real bicycle; I haven’t touched another since JAJAJA.',
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
  eyebrow: string;
  icon: string;
  title: string;
  song: string;
  videoUrl: string;
  embedUrl: string;
  story: string;
  closing: string;
}

export const profileMemory: ProfileMemoryPanel = {
  theme: 'secret-garden',
  eyebrow: 'fun fact · behind the profile',
  icon: '✿',
  title: 'Fun fact:',
  song: 'Baile Inolvidable - Bad Bunny',
  videoUrl: 'https://www.youtube.com/watch?v=a1Femq4NPxs&list=RDa1Femq4NPxs&start_radio=1',
  embedUrl: 'https://www.youtube-nocookie.com/embed/a1Femq4NPxs?list=RDa1Femq4NPxs&start=1',
  story: 'I paid 366 USD just to be able to go to his concert and hear it live.',
  closing: 'I would do it again.',
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
    eyebrow: 'classified · behind the launchpad',
    icon: '🚀',
    title: 'Ship Baby Ship!',
    copy: "I loved so much Telpatia's CEO motto that I now have it as my phone wallpaper.",
    signature: '',
  },
  f22: {
    theme: 'secret-flight',
    eyebrow: 'classified · turbulence ahead',
    icon: '✈︎',
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
    eyebrow: 'private connection',
    icon: '✺',
    title: 'The infinite Why.',
    copy: 'The thing I love most about AI is not the productivity and the possibility of just letting my wildest dreams come true quicker, but rather that I can finally ask infinite “Why” questions at someone, and that someone not getting angry at me for questioning everything.',
    signature: '',
  },
  'victory-statue': {
    theme: 'secret-pedestal',
    eyebrow: 'inscription on the hidden side',
    icon: '♛',
    title: 'A different kind of achievement.',
    copy: "In reality my greatest achievement comes to me when I find myself saying something that an old friend, or person I used to know, said. It reminds me that a small piece of everyone I've loved still lives with me, regardless of anything that may have happened between us.",
    additionalCopy: 'In another fun fact, I stopped participating in university hackathons because the program director asked me and my team to stop participating, and instead become mentors so that other people could win.',
    signature: '',
  },
  'squat-rack': {
    theme: 'secret-training',
    eyebrow: 'personal stats · still growing',
    icon: '↗',
    title: 'Progress, not perfection.',
    copy: 'I want to use this panel to show a little bit about my stats. There is still a lot of room to grow, but I am happy with what I have accomplished:',
    signature: 'keep showing up',
  },
  'pergamon-library': {
    theme: 'secret-archive',
    eyebrow: 'sealed archive · do not cite',
    icon: '📜',
    title: 'A desk full of ideas.',
    copy: 'My desk is constantly filled with post-it notes of things I have to do, and learning of things I have done.',
    additionalCopy: 'This is genuinely a problem, there are way too many post-its!',
    signature: '',
  },
};
