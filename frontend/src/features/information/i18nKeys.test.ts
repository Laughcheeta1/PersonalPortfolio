import { describe, expect, test } from 'bun:test';

import { CATEGORY_IDS, SUBCATEGORY_IDS } from './i18nKeys';
import { getSceneInformationCategories } from './index';

describe('information i18n key maps', () => {
  test('category key map covers all scene categories', () => {
    const categories = getSceneInformationCategories('en');
    const categoryIds = categories.map((category) => category.id).sort();
    expect(CATEGORY_IDS.slice().sort()).toEqual(categoryIds);
  });

  test('subcategory key map covers all scene subcategories', () => {
    const categories = getSceneInformationCategories('en');
    const sceneSubcategoryIds = categories
      .flatMap((category) => category.subcategories.map((subcategory) => subcategory.id))
      .sort();
    expect(SUBCATEGORY_IDS.slice().sort()).toEqual(sceneSubcategoryIds);
  });
});

