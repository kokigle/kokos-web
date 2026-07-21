import React from "react";
import styles from "../../styles/admin-panel.module.css";

const AdminEditHome = ({
  bannerImages,
  handleBannerUpload,
  updateBannerRedirect,
  deleteBannerImage,
  handleDragStart,
  handleDragOver,
  handleDrop,
  draggedIndex,
  homeCategories,
  handleHomeCategoryUpload,
  updateHomeCategoryRedirect,
  deleteHomeCategoryImage,
  getRedirectOptions, // Pasar la función como prop
  loading,
}) => {
  const redirectOptions = getRedirectOptions(); // Obtener opciones dentro del componente

  return (
    <div className={styles.adminPanelCard}>
      <h2 className={styles.adminPanelTitle}>Editar Página de Inicio</h2>

      {/* Banner Section */}
      <div className={styles.adminPanelHomeSection}>
        <h3 className={styles.adminPanelSectionTitle}>
          Banner Principal (Carrusel)
        </h3>
        <div className={styles.adminPanelBannerUploadSection}>
          <label className={styles.adminPanelBtnUpload}>
            📤 Subir Imágenes
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBannerUpload}
              style={{ display: "none" }}
              disabled={loading}
            />
          </label>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Puedes arrastrar las imágenes para reordenarlas.
          </p>
        </div>
        <div className={styles.adminPanelBannerImagesList}>
          {bannerImages.length === 0 ? (
            <p className={styles.adminPanelEmptyMessage}>
              No hay imágenes en el banner.
            </p>
          ) : (
            bannerImages.map((img, index) => (
              <div
                key={img.id}
                className={styles.adminPanelBannerImageItem}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                style={{ opacity: draggedIndex === index ? 0.5 : 1 }}
              >
                <div className={styles.adminPanelDragHandle}>⋮⋮</div>
                <img src={img.url} alt={`Banner ${index + 1}`} />
                <div className={styles.adminPanelBannerControls}>
                  <select
                    value={img.redirect || "ninguno"}
                    onChange={(e) =>
                      updateBannerRedirect(img.id, e.target.value)
                    }
                    className={styles.adminPanelRedirectSelect}
                  >
                    {redirectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteBannerImage(img.id)}
                    className={styles.adminPanelBtnRemoveInline}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Home Categories Section */}
      <div className={styles.adminPanelHomeSection}>
        <h3 className={styles.adminPanelSectionTitle}>
          Categorías Destacadas (3 Imágenes)
        </h3>
        <div className={styles.adminPanelHomeCategoriesGrid}>
          {["img1", "img2", "img3"].map((key, index) => (
            <div key={key} className={styles.adminPanelHomeCategoryCard}>
              <h4>Categoría {index + 1}</h4>
              {homeCategories[key]?.url ? (
                <div className={styles.adminPanelHomeCategoryPreview}>
                  <img
                    src={homeCategories[key].url}
                    alt={`Categoría Destacada ${index + 1}`}
                  />
                  <button
                    onClick={() => deleteHomeCategoryImage(key)}
                    className={styles.adminPanelBtnRemove}
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className={styles.adminPanelHomeCategoryEmpty}>
                  <label className={styles.adminPanelBtnUploadSmall}>
                    📤 Subir
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files[0] &&
                        handleHomeCategoryUpload(key, e.target.files[0])
                      }
                      style={{ display: "none" }}
                      disabled={loading}
                    />
                  </label>
                </div>
              )}
              <select
                value={homeCategories[key]?.redirect || "ninguno"}
                onChange={(e) =>
                  updateHomeCategoryRedirect(key, e.target.value)
                }
                className={styles.adminPanelRedirectSelectFull}
                disabled={!homeCategories[key]?.url || loading}
              >
                {redirectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminEditHome;
