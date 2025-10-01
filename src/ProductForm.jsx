import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ProductForm({
  initialData = {},
  categories,
  onSubmit,
  loading,
  onCancel,
}) {
  // Estado inicial limpio
  const getInitialState = () => ({
    id: initialData?.id || null,
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    price_state1: initialData?.price_state1 || "",
    price_state2: initialData?.price_state2 || "",
    stock: initialData?.stock !== undefined ? initialData.stock : 1,
    cant_min: initialData?.cant_min || 1,
    ean: initialData?.ean || "",
    category: initialData?.categoryId || "",
    subcategory: initialData?.subcategory || "",
    bulto: initialData?.bulto || "",
    colors: initialData?.colors || [],
  });

  const [formData, setFormData] = useState(getInitialState());
  const [multimedia, setMultimedia] = useState(initialData?.multimedia || []);
  const [videos, setVideos] = useState(initialData?.videos || []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newColor, setNewColor] = useState("");
  const [newVideo, setNewVideo] = useState("");

  // Sincronizar cuando cambia initialData
  useEffect(() => {
    const newState = getInitialState();
    setFormData(newState);
    setMultimedia(initialData?.multimedia || []);
    setVideos(initialData?.videos || []);
    setSelectedFiles([]);
    setNewColor("");
    setNewVideo("");
  }, [initialData?.id]); // Solo cuando cambia el ID del producto

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      fileKey: `${file.name}-${file.size}-${
        file.lastModified
      }-${Math.random()}`,
    }));
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMultimedia = (index) => {
    setMultimedia((prev) => prev.filter((_, i) => i !== index));
  };

  const addColor = () => {
    const trimmed = newColor.trim();
    if (trimmed && !formData.colors.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, trimmed],
      }));
      setNewColor("");
    }
  };

  const removeColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  const addVideo = () => {
    const trimmed = newVideo.trim();
    if (trimmed && !videos.includes(trimmed)) {
      setVideos((prev) => [...prev, trimmed]);
      setNewVideo("");
    }
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.name.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }
    if (!formData.category) {
      alert("Debe seleccionar una categoría");
      return;
    }

    // Preparar datos para enviar
    const productData = {
      ...formData,
      multimedia,
      videos,
      files: selectedFiles.map((f) => f.file),
      price_state1: Number(formData.price_state1) || 0,
      price_state2: Number(formData.price_state2) || 0,
      stock: Number(formData.stock),
      cant_min: Number(formData.cant_min) || 1,
    };

    onSubmit(productData);
  };

  const selectedCategory = categories.find((c) => c.id === formData.category);
  const subcategories = selectedCategory?.subcategories || [];

  // Drag & Drop reorder helper
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleDragEnd = (result, type) => {
    if (!result.destination) return;

    if (type === "files") {
      setSelectedFiles((prev) =>
        reorder(prev, result.source.index, result.destination.index)
      );
    }

    if (type === "multimedia") {
      setMultimedia((prev) =>
        reorder(prev, result.source.index, result.destination.index)
      );
    }
  };

  // cachear object URLs para performance
  const filePreviews = useMemo(
    () =>
      selectedFiles.map((f) => ({
        key: f.fileKey,
        url: URL.createObjectURL(f.file),
      })),
    [selectedFiles]
  );

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* Información básica */}
      <div className="form-section">
        <h3 className="section-title">Información básica</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Código *</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ej: KKS-001"
              required
            />
          </div>

          <div className="form-group">
            <label>EAN / Código de barras</label>
            <input
              name="ean"
              value={formData.ean}
              onChange={handleChange}
              placeholder="Código de barras"
            />
          </div>

          <div className="form-group full-width">
            <label>Nombre del producto *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre completo del producto"
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción detallada del producto"
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Categorización */}
      <div className="form-section">
        <h3 className="section-title">Categorización</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Categoría *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subcategoría</label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              disabled={!formData.category}
            >
              <option value="">-- Seleccionar --</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Bulto</label>
            <input
              name="bulto"
              value={formData.bulto}
              onChange={handleChange}
              placeholder="Ej: Caja x 12 unidades"
            />
          </div>
        </div>
      </div>

      {/* Precios y stock */}
      <div className="form-section">
        <h3 className="section-title">Precios y stock</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Precio Estado 1 *</label>
            <input
              type="number"
              name="price_state1"
              value={formData.price_state1}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Precio Estado 2 *</label>
            <input
              type="number"
              name="price_state2"
              value={formData.price_state2}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Stock</label>
            <select name="stock" value={formData.stock} onChange={handleChange}>
              <option value="1">Disponible</option>
              <option value="0">Sin stock</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad mínima</label>
            <input
              type="number"
              name="cant_min"
              value={formData.cant_min}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="form-section">
        <h3 className="section-title">Colores disponibles</h3>
        <div className="colors-manager">
          <div className="color-input-group">
            <input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="Agregar color"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addColor())
              }
            />
            <button type="button" onClick={addColor} className="btn-add">
              + Agregar
            </button>
          </div>
          {formData.colors.length > 0 && (
            <div className="color-chips">
              {formData.colors.map((color) => (
                <span key={color} className="chip">
                  {color}
                  <button type="button" onClick={() => removeColor(color)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Multimedia */}
      <div className="form-section">
        <h3 className="section-title">Imágenes</h3>
        <div className="file-upload">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="file-input"
            style={{ display: "none" }}
          />
          <label htmlFor="file-input" className="btn-upload">
            📁 Seleccionar imágenes
          </label>
        </div>

        {/* Archivos nuevos seleccionados */}
        {selectedFiles.length > 0 && (
          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, "files")}
          >
            <Droppable droppableId="files-droppable" direction="horizontal">
              {(provided) => (
                <div
                  className="file-preview preview-grid"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {filePreviews.map((f, idx) => (
                    <Draggable key={f.key} draggableId={f.key} index={idx}>
                      {(provided) => (
                        <div
                          className="preview-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <img
                            src={f.url}
                            loading="lazy"
                            alt={`preview-${idx}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="btn-remove"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Multimedia existente */}
        {multimedia.length > 0 && (
          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, "multimedia")}
          >
            <Droppable
              droppableId="multimedia-droppable"
              direction="horizontal"
            >
              {(provided) => (
                <div
                  className="file-preview preview-grid"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {multimedia.map((url, idx) => (
                    <Draggable key={url} draggableId={url} index={idx}>
                      {(provided) => (
                        <div
                          className="preview-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <img src={url} alt={`existing-${idx}`} />
                          <button
                            type="button"
                            onClick={() => removeMultimedia(idx)}
                            className="btn-remove"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Videos */}
      <div className="form-section">
        <h3 className="section-title">Videos (YouTube)</h3>
        <div className="colors-manager">
          <div className="color-input-group">
            <input
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
              placeholder="URL de YouTube"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addVideo())
              }
            />
            <button type="button" onClick={addVideo} className="btn-add">
              + Agregar
            </button>
          </div>
          {videos.length > 0 && (
            <div className="video-list">
              {videos.map((url, idx) => (
                <div key={idx} className="video-item">
                  <span className="video-url">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="btn-remove-inline"
                  >
                    × Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : initialData?.id
            ? "Actualizar producto"
            : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
