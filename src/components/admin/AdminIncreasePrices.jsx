import React from "react";
import styles from "../../styles/admin-panel.module.css";
import CategoryParentSelector from "./CategoryParentSelector"; // Importar selector

// Helper para formatear dinero (puede estar en utils)
const formatMoney = (n) =>
  `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

const AdminIncreasePrices = ({
  increasePercentage,
  setIncreasePercentage,
  roundingZeros,
  setRoundingZeros,
  priceCategoryFilterId,
  setPriceCategoryFilterId,
  pricePreview,
  handlePricePreview,
  handlePriceIncrease,
  handlePriceChange, // Nueva prop
  categories,
  categoryTree,
  categoriesMap,
  loading,
}) => {
  return (
    <div className={styles.adminPanelCard}>
      <h2 className={styles.adminPanelTitle}>Aumento de Precios General</h2>
      <div className={styles.adminPanelFormSection}>
        <h3 className={styles.adminPanelSectionTitle}>Configuración de Aumento</h3>
        <div className={styles.adminPanelFormGrid}>
          <div className={styles.adminPanelFormGroup}>
            <label>Porcentaje de Aumento/Disminución (%)</label>
            <input
              type="number"
              value={increasePercentage}
              onChange={(e) => setIncreasePercentage(e.target.value)}
              placeholder="Ej: 15 (aumento), -10 (disminución)"
            />
          </div>
          <div className={styles.adminPanelFormGroup}>
            <label>Redondear a (cantidad de ceros)</label>
            <select
              value={roundingZeros}
              onChange={(e) => setRoundingZeros(Number(e.target.value))}
              className={styles.adminPanelFilterSelect}
            >
              <option value={0}>Sin redondeo (ej: $123.45)</option>
              <option value={1}>Terminación en 0 (ej: $120)</option>
              <option value={2}>Terminación en 00 (ej: $100)</option>
              <option value={3}>Terminación en 000 (ej: $1000)</option>
            </select>
          </div>
        </div>
        <div className={styles.adminPanelFilterRow} style={{ marginTop: "20px" }}>
          <CategoryParentSelector
            categories={categories}
            categoryTree={categoryTree}
            categoriesMap={categoriesMap}
            value={priceCategoryFilterId}
            onChange={(id) => setPriceCategoryFilterId(id)} // No resetear preview aquí
            currentCategoryId={null}
          />
          <button
            onClick={() => setPriceCategoryFilterId("")} // No resetear preview aquí
            className={styles.adminPanelBtnSmall}
          >
            Quitar Filtro Cat.
          </button>
        </div>
        <div className={styles.adminPanelFormActions}>
          <button
            onClick={handlePricePreview}
            className={styles.adminPanelBtnCancel} // Estilo de cancelar para preview
            disabled={loading}
          >
            Previsualizar Cambios
          </button>
          <button
            onClick={handlePriceIncrease}
            className={styles.adminPanelBtnSubmit}
            disabled={loading || pricePreview.length === 0}
          >
            {loading ? "Actualizando..." : "Aplicar Cambios"}
          </button>
        </div>
      </div>

      {pricePreview.length > 0 && (
        <div className={styles.adminPanelFormSection}>
          <h3 className={styles.adminPanelSectionTitle}>
            Previsualización ({pricePreview.length} productos)
          </h3>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f2f5" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>
                    Producto
                  </th>
                  <th style={{ padding: "8px", textAlign: "right" }}>
                    Lista 1 Actual
                  </th>
                  <th style={{ padding: "8px", textAlign: "right" }}>
                    Lista 1 Nueva
                  </th>
                  <th style={{ padding: "8px", textAlign: "right" }}>
                    Lista 2 Actual
                  </th>
                  <th style={{ padding: "8px", textAlign: "right" }}>
                    Lista 2 Nueva
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricePreview.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>{p.name}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      {formatMoney(p.oldPrice1)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <input
                        type="number"
                        value={p.newPrice1}
                        onChange={(e) =>
                          handlePriceChange(p.id, "newPrice1", e.target.value)
                        }
                        className={styles.adminPanelPriceInput}
                        style={{
                          textAlign: "right",
                          width: "100px",
                          padding: "4px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      {formatMoney(p.oldPrice2)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <input
                        type="number"
                        value={p.newPrice2}
                        onChange={(e) =>
                          handlePriceChange(p.id, "newPrice2", e.target.value)
                        }
                        className={styles.adminPanelPriceInput}
                        style={{
                          textAlign: "right",
                          width: "100px",
                          padding: "4px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncreasePrices;
