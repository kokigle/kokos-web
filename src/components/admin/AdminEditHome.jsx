import React from "react";

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
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Editar Página de Inicio</h2>

      {/* Banner Section */}
      <div className="admin-panel-home-section">
        <h3 className="admin-panel-section-title">
          Banner Principal (Carrusel)
        </h3>
        <div className="admin-panel-banner-upload-section">
          <label className="admin-panel-btn-upload">
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
        <div className="admin-panel-banner-images-list">
          {bannerImages.length === 0 ? (
            <p className="admin-panel-empty-message">
              No hay imágenes en el banner.
            </p>
          ) : (
            bannerImages.map((img, index) => (
              <div
                key={img.id}
                className="admin-panel-banner-image-item"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                style={{ opacity: draggedIndex === index ? 0.5 : 1 }}
              >
                <div className="admin-panel-drag-handle">⋮⋮</div>
                <img src={img.url} alt={`Banner ${index + 1}`} />
                <div className="admin-panel-banner-controls">
                  <select
                    value={img.redirect || "ninguno"}
                    onChange={(e) =>
                      updateBannerRedirect(img.id, e.target.value)
                    }
                    className="admin-panel-redirect-select"
                  >
                    {redirectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteBannerImage(img.id)}
                    className="admin-panel-btn-remove-inline"
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
      <div className="admin-panel-home-section">
        <h3 className="admin-panel-section-title">
          Categorías Destacadas (3 Imágenes)
        </h3>
        <div className="admin-panel-home-categories-grid">
          {["img1", "img2", "img3"].map((key, index) => (
            <div key={key} className="admin-panel-home-category-card">
              <h4>Categoría {index + 1}</h4>
              {homeCategories[key]?.url ? (
                <div className="admin-panel-home-category-preview">
                  <img
                    src={homeCategories[key].url}
                    alt={`Categoría Destacada ${index + 1}`}
                  />
                  <button
                    onClick={() => deleteHomeCategoryImage(key)}
                    className="admin-panel-btn-remove"
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="admin-panel-home-category-empty">
                  <label className="admin-panel-btn-upload-small">
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
                className="admin-panel-redirect-select-full"
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
