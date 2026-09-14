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

export interface EducationEntry {
  id: string;
  title: string;
  copy: string;
  label: string;
  type: 'education' | 'language';
}

export const educationEntries: readonly EducationEntry[] = [
  {
    id: 'eia-systems-engineering',
    title: 'Systems Engineering and Computing · Universidad EIA',
    copy: 'Undergraduate program.',
    label: 'January 2022 — November 2026',
    type: 'education',
  },
  { id: 'create-x', title: 'Create-X', copy: 'Startup-building program.', label: 'certification', type: 'education' },
  {
    id: 'mc2-builders',
    title: 'mc^2 Builders Program',
    copy: 'Entrepreneurship and startup-building program.',
    label: 'certification',
    type: 'education',
  },
  {
    id: 'perficient-tech-camp',
    title: 'Certification Perficient Tech Camp 2023',
    copy: 'Technology training program.',
    label: 'certification',
    type: 'education',
  },
  {
    id: 'cs50-ai',
    title: 'CS50 AI',
    copy: 'Artificial intelligence course.',
    label: 'certification',
    type: 'education',
  },
  {
    id: 'supervised-machine-learning',
    title: 'Supervised Machine Learning: Regression and Classification',
    copy: 'Supervised machine learning certification.',
    label: 'certification',
    type: 'education',
  },
];

export const languageEntries: readonly EducationEntry[] = [
  {
    id: 'spanish',
    title: 'Spanish',
    copy: 'Native or bilingual proficiency.',
    label: 'language',
    type: 'language',
  },
  {
    id: 'english',
    title: 'English',
    copy: 'Native or bilingual proficiency.',
    label: 'language',
    type: 'language',
  },
];

export interface ProfileLine {
  label: string;
  value: string;
}

export const profileLines: readonly ProfileLine[] = [
  { label: 'Name', value: 'Santiago Yepes Mesa' },
  { label: 'Role', value: 'AI Engineer · Founder' },
  { label: 'Location', value: 'Medellín Metropolitan Area' },
  { label: 'Availability', value: 'Open to offers' },
  { label: 'Languages', value: 'Spanish · English · Native or bilingual' },
  { label: 'Top skills', value: 'Leadership · Microsoft Excel · Microsoft Power BI' },
];

export const personalInterests: readonly ProfileLine[] = [
  { label: 'Reading', value: 'Technology books and articles' },
  { label: 'Gym activities', value: 'Lifting weights and running' },
  { label: 'Making gifts and surprise parties', value: 'For friends and family' },
  { label: 'Motorcycle driving', value: 'Finding a different route home' },
];

export interface Hobby {
  id: string;
  number: string;
  title: string;
  copy: string;
}

export const hobbies: readonly Hobby[] = [
  {
    id: 'reading',
    number: '01',
    title: 'Reading',
    copy: 'Books and articles about technology—especially the ones that turn a familiar problem sideways.',
  },
  {
    id: 'gym',
    number: '02',
    title: 'Gym activities',
    copy: 'Lifting weights and running. Repetition, patience, and showing up also belong in the engineering toolkit.',
  },
  {
    id: 'gifts',
    number: '03',
    title: 'Gifts and surprise parties',
    copy: 'Making gifts and surprise parties for friends and family.',
  },
  {
    id: 'motorcycle',
    number: '04',
    title: 'Motorcycle driving',
    copy: 'Driving motorcycles and taking the scenic route when the destination can wait.',
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

export interface SecretPanel {
  theme: string;
  eyebrow: string;
  icon: string;
  title: string;
  copy: string;
  signature: string;
}

export const secretPanels: Readonly<Record<string, SecretPanel>> = {
  starship: {
    theme: 'secret-launch',
    eyebrow: 'classified · behind the launchpad',
    icon: '🚀',
    title: 'You found the other side.',
    copy: 'Every ambitious project begins with a suspicious amount of tabs, snacks, and “one last tiny improvement.”',
    signature: 'No astronauts were harmed in this portfolio',
  },
  f22: {
    theme: 'secret-flight',
    eyebrow: 'classified · turbulence ahead',
    icon: '✈︎',
    title: 'Plot twist: the runway is optional.',
    copy: 'A good plan is helpful. A curious teammate, a whiteboard, and enough coffee are the emergency equipment.',
    signature: 'Please return the aircraft with full imagination',
  },
  'neural-network': {
    theme: 'secret-node',
    eyebrow: 'private connection',
    icon: '✺',
    title: 'Knowledge is just curiosity with a memory.',
    copy: 'If you ever find a missing node, it is probably off learning something new—or taking a very serious snack break.',
    signature: 'signal still strong',
  },
  roses: {
    theme: 'secret-garden',
    eyebrow: 'quietly hidden in the petals',
    icon: '✿',
    title: 'Plot twist: the flower has opinions.',
    copy: 'Some ideas need a spreadsheet. Others need cake, a dramatic walk, and exactly the right playlist.',
    signature: 'water the curiosity',
  },
  'victory-statue': {
    theme: 'secret-pedestal',
    eyebrow: 'inscription on the hidden side',
    icon: '♛',
    title: 'The statue demands snacks.',
    copy: 'Victory is temporary. The post-hackathon pizza order is a permanent architectural decision.',
    signature: 'please applaud responsibly',
  },
  'squat-rack': {
    theme: 'secret-training',
    eyebrow: 'unauthorized training log',
    icon: '⚙',
    title: 'One more repetition.',
    copy: 'The official unit of progress is not kilograms. It is “I came back after debugging that thing.”',
    signature: 'stretch before refactoring',
  },
  'pergamon-library': {
    theme: 'secret-archive',
    eyebrow: 'sealed archive · do not cite',
    icon: '📜',
    title: 'The architect misplaced the blueprint.',
    copy: 'Construction resumes immediately after someone remembers which drawer contains the “final-final-real” version.',
    signature: 'knowledge is under renovation',
  },
};
