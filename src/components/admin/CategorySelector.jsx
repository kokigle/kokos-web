import React, { useState, useEffect } from "react";
import styles from "../../styles/admin-panel.module.css";

const CategorySelector = ({ categoryTree, selectedCategoryId, onSelect }) => {
  const [openNodes, setOpenNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleNode = (nodeId, e) => {
    e.stopPropagation();
    setOpenNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  useEffect(() => {
    const initialOpen = {};
    categoryTree.forEach((root) => (initialOpen[root.id] = true));
    setOpenNodes(initialOpen);
  }, [categoryTree]);

  const filterTree = (nodes, term) => {
    if (!term) return nodes;

    const filtered = [];
    nodes.forEach((node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase());
      const filteredChildren = node.children
        ? filterTree(node.children, term)
        : [];

      if (matches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    });
    return filtered;
  };

  const filteredTree = filterTree(categoryTree, searchTerm);

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategoryId === node.id;
    const isOpen = openNodes[node.id];

    return (
      <div
        key={node.id}
        className="category-selector-node"
        style={{ marginLeft: `${level * 16}px` }}
      >
        <div
          className={`category-selector-item ${isSelected ? "selected" : ""}`}
          onClick={() => onSelect(node.id)}
        >
          <div className="category-selector-item-content">
            {hasChildren && (
              <button
                className="category-selector-toggle"
                onClick={(e) => toggleNode(node.id, e)}
                type="button"
              >
                {isOpen ? "−" : "+"}
              </button>
            )}

            <span className="category-selector-item-icon">
              {hasChildren ? (isOpen ? "📂" : "📁") : "📄"}
            </span>

            <span className="category-selector-item-name">{node.name}</span>

            {isSelected && (
              <span className="category-selector-item-check">✓</span>
            )}
          </div>
        </div>

        {hasChildren && isOpen && (
          <div className="category-selector-children">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-selector-container">
      <div className="category-selector-search">
        <input
          type="text"
          placeholder="🔍 Buscar categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="category-selector-clear"
          >
            ✕
          </button>
        )}
      </div>

      <div className="category-selector-tree">
        {filteredTree.length === 0 ? (
          <div className="category-selector-empty">
            <p>
              {searchTerm
                ? "No se encontraron categorías"
                : "No hay categorías creadas"}
            </p>
          </div>
        ) : (
          filteredTree.map((node) => renderNode(node))
        )}
      </div>

      {selectedCategoryId && (
        <button
          type="button"
          onClick={() => onSelect("")}
          className="category-selector-deselect"
        >
          ✕ Quitar selección
        </button>
      )}
    </div>
  );
};

export default CategorySelector;
