import React from "react";
import styles from "../../styles/admin-panel.module.css";
import CategoryTreeNode from "./CategoryTreeNode"; // Importar nodo
import CategoryParentSelector from "./CategoryParentSelector"; // Importar selector

const AdminCategories = ({
  categoryTree,
  categories,
  categoriesMap,
  editingCategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryParentId,
  setNewCategoryParentId,
  handleAddCategory,
  handleUpdateCategory,
  startEditingCategory,
  handleDeleteCategory,
  cancelEditingCategory,
  loading,
}) => {
  return (
    <div className={styles.adminPanelCard}>
      <h2 className={styles.adminPanelTitle}>Gestión de Categorías</h2>

      {/* Add/Edit Form */}
      <div
        className={styles.adminPanelFormSection}
        style={{ marginBottom: "30px" }}
      >
        <h3 className={styles.adminPanelSectionTitle}>
          {editingCategory
            ? `Editando "${editingCategory.name}"`
            : "Nueva Categoría"}
        </h3>
        <div className={styles.adminPanelFormGrid}>
          <div className={styles.adminPanelFormGroup}>
            <label>Nombre *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              required
              className={styles.adminPanelLoginInput} // Reusing style
            />
          </div>
          <div className={styles.adminPanelFormGroup}>
            <label>Categoría Padre</label>
            <CategoryParentSelector // Usar el componente selector
              categories={categories}
              categoryTree={categoryTree}
              categoriesMap={categoriesMap}
              value={newCategoryParentId}
              onChange={setNewCategoryParentId}
              currentCategoryId={editingCategory?.id} // Pasar el ID actual
            />
          </div>
        </div>
        <div className={styles.adminPanelFormActions}>
          {editingCategory && (
            <button
              type="button"
              onClick={cancelEditingCategory}
              className={styles.adminPanelBtnCancel}
              disabled={loading}
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="button"
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            className={styles.adminPanelBtnSubmit}
            disabled={loading || !newCategoryName.trim()}
          >
            {loading
              ? "Guardando..."
              : editingCategory
              ? "Actualizar"
              : "Agregar"}
          </button>
        </div>
      </div>

      {/* Category Tree */}
      <div className={styles.adminPanelCategoriesTree}>
        <h3 className={styles.adminPanelSectionTitle}>Estructura</h3>
        {categoryTree.length === 0 ? (
          <p className={styles.adminPanelEmptyMessage}>
            No hay categorías creadas.
          </p>
        ) : (
          categoryTree.map((rootNode) => (
            <CategoryTreeNode // Usar el componente nodo
              key={rootNode.id}
              node={rootNode}
              onEdit={startEditingCategory}
              onDelete={handleDeleteCategory}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
