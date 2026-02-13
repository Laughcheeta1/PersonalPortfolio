// Base primitives
export type ISODateString = string;
export type SkillId = number;
export type CategoryId = 'work' | 'education' | 'projects' | 'honors' | 'skills' | 'personal';

export interface LinkSet {
  repoUrl?: string;
  liveUrl?: string;
  externalUrl?: string;
}

export interface BaseInformationEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  details: string;
  skills: SkillId[];
  links?: LinkSet;
}

// General things
export interface Achievement extends BaseInformationEntry {
  date?: ISODateString;
}

// Work
export interface WorkRole extends BaseInformationEntry {
  startDate: ISODateString;
  endDate?: ISODateString;
  achievements: Achievement[];
}

export interface CompanyWorkExperienceEntry extends BaseInformationEntry {
  companyName: string;
  startDate: ISODateString;
  endDate?: ISODateString;
  roles: WorkRole[];
}

export interface EntrepreneurshipExperienceEntry extends BaseInformationEntry {
  ventureName: string;
  startDate: ISODateString;
  endDate?: ISODateString;
}

export interface IndependentWorkExperienceEntry extends BaseInformationEntry {
  clientOrProductName: string;
  startDate: ISODateString;
  endDate?: ISODateString;
}

export interface WorkExperience {
  companies: CompanyWorkExperienceEntry[];
  entrepreneurship: EntrepreneurshipExperienceEntry[];
  independentWork: IndependentWorkExperienceEntry[];
}

// Education
export interface UniversityEducation extends BaseInformationEntry {
  institution: string;
  degree: string;
  startDate: ISODateString;
  endDate?: ISODateString;
}

export interface CourseEducation extends BaseInformationEntry {
  provider: string;
  completionDate: ISODateString;
}

export interface Education {
  universityEducations: UniversityEducation[];
  courseEducations: CourseEducation[];
}

// Projects
export interface Project extends BaseInformationEntry {
  architectureExplanation?: string;
  technologies: string[];
}

export interface ProjectsDone {
  personalProjects: Project[];
  workProjects: Project[];
}

// Personal Information
export type AvailabilityStatus =
  | 'available'
  | 'open_to_offers'
  | 'not_available'
  | 'student_open_to_internships';

export type Hobby = BaseInformationEntry;

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
  slug: string;
  name: string;
  category: string;
  summary: string;
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

// Scene / navigation models
export interface InformationSceneItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  details: string;
  skills: SkillId[];
  links?: LinkSet;
}

export interface InformationSceneSubcategory {
  id: string;
  label: string;
  items: InformationSceneItem[];
}

export interface InformationSceneCategory {
  id: CategoryId;
  label: string;
  modelIndex: number;
  subcategories: InformationSceneSubcategory[];
}

export interface SceneNavigationTarget {
  categoryId: CategoryId;
  subcategoryId?: string;
  itemId?: string;
}

export interface InformationItemSelection {
  categoryId: CategoryId;
  subcategoryId: string;
  item: InformationSceneItem;
}
