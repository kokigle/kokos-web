// src/ProductForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { FaFolder, FaFolderOpen, FaFile } from "react-icons/fa";

const CategorySelector = ({ categoryTree, selectedCategoryId, onSelect }) => {
  const [openNodes, setOpenNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleNode = (nodeId, e) => {
    e.stopPropagation();
    setOpenNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Inicializar nodos raíz abiertos
  useEffect(() => {
    const initialOpen = {};
    categoryTree.forEach((root) => (initialOpen[root.id] = true));
    setOpenNodes(initialOpen);
  }, [categoryTree]);

  // Filtrar árbol por búsqueda
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

export default function ProductForm({
  initialData = {},
  categoriesMap, // <- Recibe Mapa
  categoryTree, // <- Recibe Árbol
  onSubmit,
  loading,
  onCancel,
}) {
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
    category: initialData?.categoryId || "", // <- CAMBIO: Usa categoryId
    bulto: initialData?.bulto || "",
    colors: initialData?.colors || [],
    medidas: initialData?.medidas || [],
  });

  const [formData, setFormData] = useState(getInitialState());
  const [multimedia, setMultimedia] = useState(initialData?.multimedia || []);
  const [videos, setVideos] = useState(initialData?.videos || []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newColor, setNewColor] = useState("");
  const [newVideo, setNewVideo] = useState("");
  const [newMedida, setNewMedida] = useState("");

  useEffect(() => {
    const newState = getInitialState();
    setFormData(newState);
    setMultimedia(initialData?.multimedia || []);
    setVideos(initialData?.videos || []);
    setSelectedFiles([]);
    setNewColor("");
    setNewVideo("");
    setNewMedida("");
  }, [initialData?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (categoryId) => {
    setFormData((prev) => ({ ...prev, category: categoryId }));
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

  const addMedida = () => {
    const trimmed = newMedida.trim();
    if (trimmed && !formData.medidas.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        medidas: [...prev.medidas, trimmed],
      }));
      setNewMedida("");
    }
  };

  const removeMedida = (medida) => {
    setFormData((prev) => ({
      ...prev,
      medidas: prev.medidas.filter((m) => m !== medida),
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

    if (!formData.name.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }
    if (!formData.category) {
      alert("Debe seleccionar una categoría");
      return;
    }

    if (!formData.category) {
      alert("Debe seleccionar una categoría final (hoja) para el producto.");
      // Opcional: Podrías permitir guardar sin categoría o validar que sea hoja
      // const selectedCat = categoriesMap[formData.category];
      // if (!selectedCat || (selectedCat.children && selectedCat.children.length > 0)) {
      //    alert("Debe seleccionar una categoría final (sin subcategorías).");
      //    return;
      // }
      return; // Por ahora, requerir una categoría
    }

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

  const filePreviews = useMemo(
    () =>
      selectedFiles.map((f) => ({
        key: f.fileKey,
        url: URL.createObjectURL(f.file),
      })),
    [selectedFiles]
  );

  return (
    <form onSubmit={handleSubmit} className="admin-panel-product-form">
      {/* Información básica */}
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Información básica</h3>
        <div className="admin-panel-form-grid">
          <div className="admin-panel-form-group">
            <label>Código *</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ej: KKS-001"
              required
            />
          </div>

          <div className="admin-panel-form-group">
            <label>EAN / Código de barras</label>
            <input
              name="ean"
              value={formData.ean}
              onChange={handleChange}
              placeholder="Código de barras"
            />
          </div>

          <div className="admin-panel-form-group admin-panel-full-width">
            <label>Nombre del producto *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre completo del producto"
              required
            />
          </div>

          <div className="admin-panel-form-group admin-panel-full-width">
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
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Categorización</h3>
        <div className="admin-panel-form-grid">
          <div className="admin-panel-form-group admin-panel-full-width">
            <label>Categoría *</label>
            <CategorySelector
              categoryTree={categoryTree || []}
              selectedCategoryId={formData.category}
              onSelect={handleCategorySelect}
            />
          </div>

          <div className="admin-panel-form-group">
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
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Precios y stock</h3>
        <div className="admin-panel-form-grid">
          <div className="admin-panel-form-group">
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

          <div className="admin-panel-form-group">
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

          <div className="admin-panel-form-group">
            <label>Stock</label>
            <select name="stock" value={formData.stock} onChange={handleChange}>
              <option value="1">Disponible</option>
              <option value="0">Sin stock</option>
            </select>
          </div>

          <div className="admin-panel-form-group">
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

      {/* Especificaciones */}
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Especificaciones</h3>
        <div className="admin-panel-form-grid">
          <div className="admin-panel-form-group admin-panel-full-width">
            <label>Colores</label>
            <div className="admin-panel-colors-manager">
              <div className="admin-panel-color-input-group">
                <input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Agregar color"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addColor())
                  }
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="admin-panel-btn-add"
                >
                  + Agregar
                </button>
              </div>
              {formData.colors.length > 0 && (
                <div className="admin-panel-color-chips">
                  {formData.colors.map((color) => (
                    <span key={color} className="admin-panel-chip">
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
          <div className="admin-panel-form-group admin-panel-full-width">
            <label>Medidas</label>
            <div className="admin-panel-colors-manager">
              <div className="admin-panel-color-input-group">
                <input
                  value={newMedida}
                  onChange={(e) => setNewMedida(e.target.value)}
                  placeholder="Agregar medida (ej: 20x30cm)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addMedida())
                  }
                />
                <button
                  type="button"
                  onClick={addMedida}
                  className="admin-panel-btn-add"
                >
                  + Agregar
                </button>
              </div>
              {formData.medidas.length > 0 && (
                <div className="admin-panel-color-chips">
                  {formData.medidas.map((medida) => (
                    <span key={medida} className="admin-panel-chip">
                      {medida}
                      <button
                        type="button"
                        onClick={() => removeMedida(medida)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Multimedia */}
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Imágenes</h3>
        <div className="admin-panel-file-upload">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="file-input"
            style={{ display: "none" }}
          />
          <label htmlFor="file-input" className="admin-panel-btn-upload">
            📁 Seleccionar imágenes
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, "files")}
          >
            <Droppable droppableId="files-droppable" direction="horizontal">
              {(provided) => (
                <div
                  className="admin-panel-file-preview admin-panel-preview-grid"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {filePreviews.map((f, idx) => (
                    <Draggable key={f.key} draggableId={f.key} index={idx}>
                      {(provided) => (
                        <div
                          className="admin-panel-preview-item"
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
                            className="admin-panel-btn-remove"
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
                  className="admin-panel-file-preview admin-panel-preview-grid"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {multimedia.map((url, idx) => (
                    <Draggable key={url} draggableId={url} index={idx}>
                      {(provided) => (
                        <div
                          className="admin-panel-preview-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <img src={url} alt={`existing-${idx}`} />
                          <button
                            type="button"
                            onClick={() => removeMultimedia(idx)}
                            className="admin-panel-btn-remove"
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
      <div className="admin-panel-form-section">
        <h3 className="admin-panel-section-title">Videos (YouTube)</h3>
        <div className="admin-panel-colors-manager">
          <div className="admin-panel-color-input-group">
            <input
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
              placeholder="URL de YouTube"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addVideo())
              }
            />
            <button
              type="button"
              onClick={addVideo}
              className="admin-panel-btn-add"
            >
              + Agregar
            </button>
          </div>
          {videos.length > 0 && (
            <div className="admin-panel-video-list">
              {videos.map((url, idx) => (
                <div key={idx} className="admin-panel-video-item">
                  <span className="admin-panel-video-url">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="admin-panel-btn-remove-inline"
                  >
                    × Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-panel-form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="admin-panel-btn-cancel"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="admin-panel-btn-submit"
          disabled={loading}
        >
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
