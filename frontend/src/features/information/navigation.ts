import type { InformationSceneCategory, SceneNavigationTarget } from './models';

export function resolveNavigationTarget(
  categories: InformationSceneCategory[],
  target: SceneNavigationTarget,
): SceneNavigationTarget | null {
  const category = categories.find((entry) => entry.id === target.categoryId);
  if (!category) {
    return null;
  }

  if (!target.subcategoryId && !target.itemId) {
    return { categoryId: target.categoryId };
  }

  if (target.subcategoryId) {
    const subcategory = category.subcategories.find((entry) => entry.id === target.subcategoryId);
    if (!subcategory) {
      return null;
    }

    if (!target.itemId) {
      return { categoryId: target.categoryId, subcategoryId: target.subcategoryId };
    }

    const item = subcategory.items.find((entry) => entry.id === target.itemId || entry.slug === target.itemId);
    if (!item) {
      return null;
    }

    return {
      categoryId: target.categoryId,
      subcategoryId: target.subcategoryId,
      itemId: item.id,
    };
  }

  const itemMatch = category.subcategories
    .flatMap((subcategory) => subcategory.items.map((item) => ({ subcategoryId: subcategory.id, item })))
    .find(({ item }) => item.id === target.itemId || item.slug === target.itemId);

  if (!itemMatch) {
    return null;
  }

  return {
    categoryId: target.categoryId,
    subcategoryId: itemMatch.subcategoryId,
    itemId: itemMatch.item.id,
  };
}
