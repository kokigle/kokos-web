import React from "react";
import styles from "../../styles/admin-panel.module.css";
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
    <div className={styles.adminPanelCard}>
      <h2 className={styles.adminPanelTitle}>Gestión de Productos</h2>

      {/* Product Filters */}
      <div className={styles.adminPanelFiltersSection}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, código o descripción..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className={styles.adminPanelSearchInput}
        />
        <div className={styles.adminPanelFilterRow}>
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
            className={styles.adminPanelBtnSmall}
          >
            Quitar Filtro Cat.
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className={styles.adminPanelProductsList}>
        {products.length === 0 ? (
          <div className={styles.adminPanelEmptyState}>
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
            <div key={p.id} className={styles.adminPanelProductCardAdmin}>
              <div className={styles.adminPanelProductInfo}>
                <h4>{p.name}</h4>
                <p className={styles.adminPanelProductCode}>
                  Código: {p.code || "N/A"}
                </p>
                <p className={styles.adminPanelProductCategory}>
                  {p.categoryPath && p.categoryPath.length > 0
                    ? p.categoryPath.join(" > ")
                    : "Sin categoría"}
                </p>
                <div className={styles.adminPanelProductPrices}>
                  <span>Lista 1: {formatMoney(p.price_state1)}</span>
                  <span>Lista 2: {formatMoney(p.price_state2)}</span>
                </div>
              </div>
              <div className={styles.adminPanelProductActions}>
                <span
                  className={`${styles.adminPanelStockBadge} ${
                    p.stock === 1
                      ? styles.adminPanelInStock
                      : styles.adminPanelOutStock
                  }`}
                >
                  {p.stock === 1 ? "En stock" : "Sin stock"}
                </span>
                <div className={styles.adminPanelActionButtons}>
                  <button
                    onClick={() => toggleStock(p.id, p.stock === 1 ? 0 : 1)}
                    className={styles.adminPanelBtnSmall}
                  >
                    {p.stock === 1 ? "Marcar sin stock" : "Marcar disponible"}
                  </button>
                  <button
                    onClick={() => editProduct(p)}
                    className={`${styles.adminPanelBtnSmall} ${styles.adminPanelBtnEdit}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className={`${styles.adminPanelBtnSmall} ${styles.adminPanelBtnDanger}`}
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
