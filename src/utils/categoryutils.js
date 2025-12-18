// src/utils/categoryUtils.js

// Construye un árbol jerárquico a partir de una lista plana de categorías
export const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else if (!cat.parentId) {
      roots.push(map[cat.id]);
    }
  });
  // Ordenar hijos alfabéticamente
  Object.values(map).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};

// Obtiene la ruta (nombres) de una categoría hasta la raíz
export const getCategoryPath = (categoryId, categoriesMap) => {
  const path = [];
  let current = categoriesMap[categoryId];
  while (current) {
    path.unshift(current.name);
    current = categoriesMap[current.parentId];
  }
  return path;
};

// Obtiene todos los IDs descendientes de una categoría (incluyendo el propio ID)
export const getDescendantIds = (categoryId, categoriesMap) => {
  let ids = [categoryId];
  const nodesArray = Object.values(categoriesMap); // Convert map to array for easier filtering
  const children = nodesArray.filter((c) => c.parentId === categoryId);

  if (children.length > 0) {
    children.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id, categoriesMap));
    });
  }
  return ids;
};
