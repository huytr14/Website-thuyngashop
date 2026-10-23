export type ShopCategory = {
  id: number; name: string; slug: string; description: string; parentId: number | null;
  image: string; sortOrder: number; isVisible: boolean; requiresDisclaimer: boolean;
};

export function categoryPath(category: Pick<ShopCategory, "id" | "name" | "parentId">, categories: Pick<ShopCategory, "id" | "name" | "parentId">[]) {
  const parent = categories.find((item) => item.id === category.parentId);
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export function categoryDescendants(category: ShopCategory, categories: ShopCategory[]) {
  return [category.id, ...categories.filter((item) => item.parentId === category.id).map((item) => item.id)];
}

export function visibleCategories(categories: ShopCategory[]) {
  const visibleRoots = new Set(categories.filter((item) => !item.parentId && item.isVisible).map((item) => item.id));
  return categories.filter((item) => item.isVisible && (!item.parentId || visibleRoots.has(item.parentId)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function requiresDisclaimer(categoryId: number | null, categories: ShopCategory[]) {
  const category = categories.find((item) => item.id === categoryId);
  return Boolean(category?.requiresDisclaimer || categories.find((item) => item.id === category?.parentId)?.requiresDisclaimer);
}
