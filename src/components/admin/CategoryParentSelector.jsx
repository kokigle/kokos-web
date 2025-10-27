import React from "react";
import { getDescendantIds } from "../../utils/categoryutils"; // Asume que creas este archivo

const CategoryParentSelector = ({
  categories, // Lista plana
  categoryTree, // Árbol
  categoriesMap, // Mapa
  value,
  onChange,
  currentCategoryId = null,
}) => {
  // Asegúrate de que `getDescendantIds` esté disponible
  const getDescendantIdsLocal = (categoryId, map) => {
    let ids = [categoryId];
    const nodesArray = Object.values(map);
    const children = nodesArray.filter((c) => c.parentId === categoryId);
    if (children.length > 0) {
      children.forEach((child) => {
        ids = ids.concat(getDescendantIdsLocal(child.id, map));
      });
    }
    return ids;
  };

  const options = [{ id: null, name: "Raíz (sin padre)", level: 0 }];

  const buildOptions = (nodes, level = 0) => {
    nodes.forEach((node) => {
      let isDescendantOrSelf = false;
      if (currentCategoryId) {
        // Usa la función local o importada
        const descendants = getDescendantIdsLocal(node.id, categoriesMap);
        isDescendantOrSelf = descendants.includes(currentCategoryId);
      }

      if (node.id !== currentCategoryId && !isDescendantOrSelf) {
        options.push({ id: node.id, name: node.name, level });
        // Importante: Usar node.children del árbol para mantener el orden
        const childrenNodes = node.children || [];
        if (childrenNodes.length > 0) {
          // Ya están ordenados por buildCategoryTree
          buildOptions(childrenNodes, level + 1);
        }
      }
    });
  };

  // Construye las opciones desde el árbol ya ordenado
  buildOptions(categoryTree);

  return (
    <select
      value={value === null ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      className="admin-panel-filter-select"
    >
      {options.map((opt) => (
        <option key={opt.id || "root"} value={opt.id === null ? "" : opt.id}>
          {"--".repeat(opt.level) + " " + opt.name}
        </option>
      ))}
    </select>
  );
};

export default CategoryParentSelector;
