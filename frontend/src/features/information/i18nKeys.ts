import type { CategoryId } from './models';

export const CATEGORY_KEY_BY_ID: Record<CategoryId, string> = {
  work: 'category.work',
  education: 'category.education',
  projects: 'category.projects',
  honors: 'category.honors',
  skills: 'category.skills',
  personal: 'category.personal',
};

export const SUBCATEGORY_KEY_BY_ID: Record<string, string> = {
  companies: 'subcategory.companies',
  entrepreneurship: 'subcategory.entrepreneurship',
  'independent-work': 'subcategory.independent-work',
  university: 'subcategory.university',
  courses: 'subcategory.courses',
  'personal-projects': 'subcategory.personal-projects',
  'work-projects': 'subcategory.work-projects',
  awards: 'subcategory.awards',
  honors: 'subcategory.honors',
  'skills-list': 'subcategory.skills-list',
  profile: 'subcategory.profile',
  hobbies: 'subcategory.hobbies',
  languages: 'subcategory.languages',
};

export const CATEGORY_IDS = Object.keys(CATEGORY_KEY_BY_ID) as CategoryId[];
export const SUBCATEGORY_IDS = Object.keys(SUBCATEGORY_KEY_BY_ID);

