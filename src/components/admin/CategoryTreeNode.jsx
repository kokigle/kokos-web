import React, { useState } from "react";
import styles from "../../styles/admin-panel.module.css";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";

const CategoryTreeNode = ({ node, level = 0, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Abrir solo el primer nivel por defecto
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      style={{ marginLeft: `${level * 20}px` }}
      className={styles.adminPanelCategoryTreeNode}
    >
      <div className={styles.adminPanelCategoryTreeItem}>
        <span
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          style={{
            cursor: hasChildren ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexGrow: 1,
          }}
        >
          {hasChildren ? (
            isOpen ? (
              <FaFolderOpen style={{ color: "#009ca6" }} />
            ) : (
              <FaFolder style={{ color: "#009ca6" }} />
            )
          ) : (
            <FaFile style={{ marginLeft: "18px", color: "#ccc" }} />
          )}
          {node.name}
        </span>
        <div className={styles.adminPanelCategoryTreeActions}>
          <button onClick={() => onEdit(node)} title="Editar">
            <FaPencilAlt />
          </button>
          <button onClick={() => onDelete(node.id, node.name)} title="Eliminar">
            <FaTrash />
          </button>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className={styles.adminPanelCategoryTreeChildren}>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeNode;
