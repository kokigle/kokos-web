import React from "react";
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
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Gestión de Categorías</h2>

      {/* Add/Edit Form */}
      <div
        className="admin-panel-form-section"
        style={{ marginBottom: "30px" }}
      >
        <h3 className="admin-panel-section-title">
          {editingCategory
            ? `Editando "${editingCategory.name}"`
            : "Nueva Categoría"}
        </h3>
        <div className="admin-panel-form-grid">
          <div className="admin-panel-form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              required
              className="admin-panel-login-input" // Reusing style
            />
          </div>
          <div className="admin-panel-form-group">
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
        <div className="admin-panel-form-actions">
          {editingCategory && (
            <button
              type="button"
              onClick={cancelEditingCategory}
              className="admin-panel-btn-cancel"
              disabled={loading}
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="button"
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            className="admin-panel-btn-submit"
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
      <div className="admin-panel-categories-tree">
        <h3 className="admin-panel-section-title">Estructura</h3>
        {categoryTree.length === 0 ? (
          <p className="admin-panel-empty-message">
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
