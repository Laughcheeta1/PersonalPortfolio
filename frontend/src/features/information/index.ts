import type { Locale } from '../i18n/messages';
import educationEnJson from './data/education.json';
import honorsEnJson from './data/honors.json';
import personalEnJson from './data/personal.json';
import projectsEnJson from './data/projects.json';
import skillsEnJson from './data/skills.json';
import workEnJson from './data/work.json';
import educationEsJson from './data/es/education.json';
import honorsEsJson from './data/es/honors.json';
import personalEsJson from './data/es/personal.json';
import projectsEsJson from './data/es/projects.json';
import skillsEsJson from './data/es/skills.json';
import workEsJson from './data/es/work.json';
import educationFrJson from './data/fr/education.json';
import honorsFrJson from './data/fr/honors.json';
import personalFrJson from './data/fr/personal.json';
import projectsFrJson from './data/fr/projects.json';
import skillsFrJson from './data/fr/skills.json';
import workFrJson from './data/fr/work.json';
import educationZhJson from './data/zh/education.json';
import honorsZhJson from './data/zh/honors.json';
import personalZhJson from './data/zh/personal.json';
import projectsZhJson from './data/zh/projects.json';
import skillsZhJson from './data/zh/skills.json';
import workZhJson from './data/zh/work.json';

import type {
  CategoryId,
  Education,
  HonorsAndAwards,
  InformationSceneCategory,
  InformationSceneItem,
  InformationSceneSubcategory,
  PersonalInformation,
  ProfessionalProfile,
  ProjectsDone,
  SceneNavigationTarget,
  SkillsRepository,
  WorkExperience,
} from './models';

type DataBundle = {
  skillsRepository: SkillsRepository;
  personalInformation: PersonalInformation;
  workExperience: WorkExperience;
  education: Education;
  projectsDone: ProjectsDone;
  honorsAndAwards: HonorsAndAwards;
};

function toDataBundle(bundle: {
  skillsRepository: unknown;
  personalInformation: unknown;
  workExperience: unknown;
  education: unknown;
  projectsDone: unknown;
  honorsAndAwards: unknown;
}): DataBundle {
  return {
    skillsRepository: bundle.skillsRepository as SkillsRepository,
    personalInformation: bundle.personalInformation as PersonalInformation,
    workExperience: bundle.workExperience as WorkExperience,
    education: bundle.education as Education,
    projectsDone: bundle.projectsDone as ProjectsDone,
    honorsAndAwards: bundle.honorsAndAwards as HonorsAndAwards,
  };
}

const DATA_BY_LOCALE: Record<Locale, DataBundle> = {
  en: toDataBundle({
    skillsRepository: skillsEnJson,
    personalInformation: personalEnJson,
    workExperience: workEnJson,
    education: educationEnJson,
    projectsDone: projectsEnJson,
    honorsAndAwards: honorsEnJson,
  }),
  es: toDataBundle({
    skillsRepository: skillsEsJson,
    personalInformation: personalEsJson,
    workExperience: workEsJson,
    education: educationEsJson,
    projectsDone: projectsEsJson,
    honorsAndAwards: honorsEsJson,
  }),
  fr: toDataBundle({
    skillsRepository: skillsFrJson,
    personalInformation: personalFrJson,
    workExperience: workFrJson,
    education: educationFrJson,
    projectsDone: projectsFrJson,
    honorsAndAwards: honorsFrJson,
  }),
  zh: toDataBundle({
    skillsRepository: skillsZhJson,
    personalInformation: personalZhJson,
    workExperience: workZhJson,
    education: educationZhJson,
    projectsDone: projectsZhJson,
    honorsAndAwards: honorsZhJson,
  }),
};

function toSceneItems(
  items: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    details: string;
    enhanced?: boolean;
    skills: number[];
    links?: { repoUrl?: string; liveUrl?: string; externalUrl?: string };
  }>,
): InformationSceneItem[] {
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    details: item.details,
    enhanced: item.enhanced,
    skills: item.skills,
    links: item.links,
  }));
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function category(
  id: CategoryId,
  label: string,
  modelIndex: number,
  subcategories: InformationSceneSubcategory[],
): InformationSceneCategory {
  return { id, label, modelIndex, subcategories };
}

export function getProfessionalProfile(locale: Locale): ProfessionalProfile {
  const data = DATA_BY_LOCALE[locale] ?? DATA_BY_LOCALE.en;
  return {
    personalInformation: data.personalInformation,
    workExperience: data.workExperience,
    education: data.education,
    projectsDone: data.projectsDone,
    honorsAndAwards: data.honorsAndAwards,
    skillsRepository: data.skillsRepository,
  };
}

export function getSceneInformationCategories(locale: Locale): InformationSceneCategory[] {
  const professionalProfile = getProfessionalProfile(locale);

  return [
    category('work', 'Work', 5, [
      {
        id: 'companies',
        label: 'Companies',
        items: toSceneItems(professionalProfile.workExperience.companies),
      },
      {
        id: 'entrepreneurship',
        label: 'Entrepreneurship',
        items: toSceneItems(professionalProfile.workExperience.entrepreneurship),
      },
      {
        id: 'independent-work',
        label: 'Independent Work',
        items: toSceneItems(professionalProfile.workExperience.independentWork),
      },
    ]),
    category('education', 'Education', 1, [
      {
        id: 'university',
        label: 'University',
        items: toSceneItems(professionalProfile.education.universityEducations),
      },
      {
        id: 'courses',
        label: 'Courses',
        items: toSceneItems(professionalProfile.education.courseEducations),
      },
    ]),
    category('projects', 'Projects', 2, [
      {
        id: 'personal-projects',
        label: 'Personal Projects',
        items: toSceneItems(professionalProfile.projectsDone.personalProjects),
      },
      {
        id: 'work-projects',
        label: 'Work Projects',
        items: toSceneItems(professionalProfile.projectsDone.workProjects),
      },
    ]),
    category('honors', 'Honors', 3, [
      {
        id: 'awards',
        label: 'Awards',
        items: toSceneItems(professionalProfile.honorsAndAwards.awards),
      },
      {
        id: 'honors',
        label: 'Honors',
        items: toSceneItems(professionalProfile.honorsAndAwards.honors),
      },
    ]),
    category('skills', 'Skills', 4, [
      {
        id: 'skills-list',
        label: 'Skills',
        items: Object.values(professionalProfile.skillsRepository).map((skill) => ({
          id: `skill-${skill.id}`,
          slug: skill.slug,
          title: skill.name,
          summary: skill.summary,
          details: `${skill.name} (${skill.category})`,
          skills: [skill.id],
        })),
      },
    ]),
    category('personal', 'Personal', 0, [
      {
        id: 'profile',
        label: 'Profile',
        items: [
          {
            id: 'personal-profile',
            slug: 'personal-profile',
            title: 'Personal Profile',
            summary: professionalProfile.personalInformation.summary,
            details: professionalProfile.personalInformation.headline,
            skills: [],
            links: {
              externalUrl: professionalProfile.personalInformation.linkedinUrl,
            },
          },
        ],
      },
      {
        id: 'hobbies',
        label: 'Hobbies',
        items: toSceneItems(professionalProfile.personalInformation.hobbies),
      },
      {
        id: 'languages',
        label: 'Languages',
        items: professionalProfile.personalInformation.languagesSpoken.map((language) => {
          const slug = toSlug(language);
          const languageSummaryByLocale: Record<Locale, string> = {
            en: `I speak ${language}.`,
            es: `Hablo ${language}.`,
            fr: `Je parle ${language}.`,
            zh: `我会说${language}。`,
          };
          const languageDetailsByLocale: Record<Locale, string> = {
            en: `${language} is one of my spoken languages.`,
            es: `${language} es uno de los idiomas que hablo.`,
            fr: `${language} est l'une des langues que je parle.`,
            zh: `${language} 是我会说的语言之一。`,
          };

          return {
            id: `language-${slug}`,
            slug,
            title: language,
            summary: languageSummaryByLocale[locale] ?? languageSummaryByLocale.en,
            details: languageDetailsByLocale[locale] ?? languageDetailsByLocale.en,
            skills: [],
          };
        }),
      },
    ]),
  ];
}

export const professionalProfile: ProfessionalProfile = getProfessionalProfile('en');
export const sceneInformationCategories: InformationSceneCategory[] = getSceneInformationCategories('en');

export function findCategoryById(
  categoryId: CategoryId,
  locale: Locale = 'en',
): InformationSceneCategory | undefined {
  return getSceneInformationCategories(locale).find((entry) => entry.id === categoryId);
}

export function normalizeNavigationTarget(target: SceneNavigationTarget): SceneNavigationTarget {
  return {
    categoryId: target.categoryId,
    subcategoryId: target.subcategoryId,
    itemId: target.itemId,
  };
}

export function validateSceneCategoryMappings(
  modelCount: number,
  categories: InformationSceneCategory[] = sceneInformationCategories,
): string[] {
  const issues: string[] = [];
  const usedModelIndices = new Set<number>();

  for (const category of categories) {
    if (category.modelIndex < 0 || category.modelIndex >= modelCount) {
      issues.push(
        `Category "${category.id}" points to modelIndex ${category.modelIndex}, but modelCount is ${modelCount}.`,
      );
    }

    if (usedModelIndices.has(category.modelIndex)) {
      issues.push(`Multiple categories share modelIndex ${category.modelIndex}.`);
    }
    usedModelIndices.add(category.modelIndex);
  }

  return issues;
}

