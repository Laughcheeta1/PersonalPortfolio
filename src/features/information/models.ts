// Base primitives
export type ISODateString = string;
export type SkillId = number;

// General things
export interface Achievement {
  name: string;
  description: string;
  date?: ISODateString;
}

// Work
export interface WorkRole {
  title: string;
  description: string;
  achievements: Achievement[];
  startDate: ISODateString;
  endDate?: ISODateString;
  skills: SkillId[];
}

export interface CompanyWorkExperienceEntry {
  companyName: string;
  roles: WorkRole[];
}

export interface EntrepreneurialExperienceEntry {
  startupName: string;
  description: string;
}

export interface IndependentWorkExperienceEntry {
  name: string;
  description: string;
}

export interface WorkExperience {
  workExperiences: CompanyWorkExperienceEntry[];
  entrepreneurialExperiences: EntrepreneurialExperienceEntry[];
  independentWorkExperiences: IndependentWorkExperienceEntry[];
}

// Education
export interface UniversityEducation {
  institution: string;
  degree: string;
  startDate: ISODateString;
  endDate: ISODateString;
  skills: SkillId[];
}

export interface CourseEducation {
  name: string;
  description: string;
  completionDate: ISODateString;
  skills: SkillId[];
}

export interface Education {
  universityEducations: UniversityEducation[];
  courseEducations: CourseEducation[];
}

// Projects
export interface Project {
  name: string;
  description: string;
  architectureExplanation?: string;
  repoUrl?: string;
  liveUrl?: string;
  technologies: string[];
  skills: SkillId[];
}

export interface ProjectsDone {
  personalProjects: Project[];
}

// Personal Information
export type AvailabilityStatus =
  | 'available'
  | 'open_to_offers'
  | 'not_available'
  | 'student_open_to_internships';

export interface Hobby {
  name: string;
  description: string;
  skills: SkillId[];
}

export interface PersonalInformation {
  headline: string;
  summary: string;
  availability: AvailabilityStatus;
  githubUrl?: string;
  linkedinUrl?: string;
  hobbies: Hobby[];
  languagesSpoken: string[];
}

// Skills
export interface Skill {
  id: SkillId;
  name: string;
}

export type SkillsRepository = Record<SkillId, Skill>;

// Honors And Awards
export interface HonorsAndAwards {
  awards: Achievement[];
  honors: Achievement[];
}

// Root professional profile
export interface ProfessionalProfile {
  personalInformation: PersonalInformation;
  workExperience: WorkExperience;
  education: Education;
  projectsDone: ProjectsDone;
  honorsAndAwards: HonorsAndAwards;
  skillsRepository: SkillsRepository;
}
