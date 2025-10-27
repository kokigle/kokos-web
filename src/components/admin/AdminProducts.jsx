import React from "react";
import CategoryParentSelector from "./CategoryParentSelector"; // Importar el selector
// Helper para formatear dinero (puede estar en utils)
const formatMoney = (n) =>
  `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

const AdminProducts = ({
  products,
  productSearch,
  setProductSearch,
  selectedFilterCategoryId,
  setSelectedFilterCategoryId,
  categories,
  categoryTree,
  categoriesMap,
  toggleStock,
  editProduct,
  deleteProduct,
}) => {
  return (
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Gestión de Productos</h2>

      {/* Product Filters */}
      <div className="admin-panel-filters-section">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, código o descripción..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="admin-panel-search-input"
        />
        <div className="admin-panel-filter-row">
          <CategoryParentSelector // Usar el componente selector
            categories={categories}
            categoryTree={categoryTree}
            categoriesMap={categoriesMap}
            value={selectedFilterCategoryId}
            onChange={(id) => setSelectedFilterCategoryId(id)}
            currentCategoryId={null} // No estamos editando una categoría aquí
          />
          <button
            onClick={() => setSelectedFilterCategoryId("")}
            className="admin-panel-btn-small"
          >
            Quitar Filtro Cat.
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="admin-panel-products-list">
        {products.length === 0 ? (
          <div className="admin-panel-empty-state">
            <p>
              No hay productos{" "}
              {productSearch || selectedFilterCategoryId
                ? "que coincidan con los filtros"
                : ""}
              .
            </p>
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="admin-panel-product-card-admin">
              <div className="admin-panel-product-info">
                <h4>{p.name}</h4>
                <p className="admin-panel-product-code">
                  Código: {p.code || "N/A"}
                </p>
                <p className="admin-panel-product-category">
                  {p.categoryPath && p.categoryPath.length > 0
                    ? p.categoryPath.join(" > ")
                    : "Sin categoría"}
                </p>
                <div className="admin-panel-product-prices">
                  <span>Lista 1: {formatMoney(p.price_state1)}</span>
                  <span>Lista 2: {formatMoney(p.price_state2)}</span>
                </div>
              </div>
              <div className="admin-panel-product-actions">
                <span
                  className={`admin-panel-stock-badge ${
                    p.stock === 1
                      ? "admin-panel-in-stock"
                      : "admin-panel-out-stock"
                  }`}
                >
                  {p.stock === 1 ? "En stock" : "Sin stock"}
                </span>
                <div className="admin-panel-action-buttons">
                  <button
                    onClick={() => toggleStock(p.id, p.stock === 1 ? 0 : 1)}
                    className="admin-panel-btn-small"
                  >
                    {p.stock === 1 ? "Marcar sin stock" : "Marcar disponible"}
                  </button>
                  <button
                    onClick={() => editProduct(p)}
                    className="admin-panel-btn-small admin-panel-btn-edit"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="admin-panel-btn-small admin-panel-btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
