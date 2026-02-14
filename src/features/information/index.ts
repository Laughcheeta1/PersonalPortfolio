import educationJson from './data/education.json';
import honorsJson from './data/honors.json';
import personalJson from './data/personal.json';
import projectsJson from './data/projects.json';
import skillsJson from './data/skills.json';
import workJson from './data/work.json';

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

const skillsRepository = skillsJson as unknown as SkillsRepository;
const personalInformation = personalJson as unknown as PersonalInformation;
const workExperience = workJson as unknown as WorkExperience;
const education = educationJson as unknown as Education;
const projectsDone = projectsJson as unknown as ProjectsDone;
const honorsAndAwards = honorsJson as unknown as HonorsAndAwards;

export const professionalProfile: ProfessionalProfile = {
  personalInformation,
  workExperience,
  education,
  projectsDone,
  honorsAndAwards,
  skillsRepository,
};

function toSceneItems(
  items: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    details: string;
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

export const sceneInformationCategories: InformationSceneCategory[] = [
  category('work', 'Work', 0, [
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
  category('personal', 'Personal', 5, [
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
        return {
          id: `language-${slug}`,
          slug,
          title: language,
          summary: `I speak ${language}.`,
          details: `${language} is one of my spoken languages.`,
          skills: [],
        };
      }),
    },
  ]),
];

export function findCategoryById(categoryId: CategoryId): InformationSceneCategory | undefined {
  return sceneInformationCategories.find((entry) => entry.id === categoryId);
}

export function normalizeNavigationTarget(target: SceneNavigationTarget): SceneNavigationTarget {
  return {
    categoryId: target.categoryId,
    subcategoryId: target.subcategoryId,
    itemId: target.itemId,
  };
}

export function validateSceneCategoryMappings(modelCount: number): string[] {
  const issues: string[] = [];
  const usedModelIndices = new Set<number>();

  for (const category of sceneInformationCategories) {
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
