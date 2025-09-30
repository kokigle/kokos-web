// ProductForm.jsx (arreglada)
import React, { useEffect, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ProductForm({
  initialData = {},
  categories = [],
  uploadedUrls = [],
  setUploadedUrls,
  selectedFiles = [],
  setSelectedFiles,
  selectedCategory = "",
  setSelectedCategory,
  onSubmit,
  loading,
  onCancel,
}) {
  const isEdit = !!initialData.id;
  const [colorsInput, setColorsInput] = useState(
    (initialData.colors || []).join("\n")
  );
  const [bulto, setBulto] = useState(initialData.bulto || "");
  const fileInputRef = useRef(null);
  // Para controlar objectURLs creados localmente y revocarlos después
  const createdObjectUrlsRef = useRef([]);

  // Inicializar estados al montar / al cambiar initialData
  useEffect(() => {
    if (isEdit) {
      // Preferir categoryId si viene del producto (es lo más robusto).
      const catId =
        initialData.categoryId !== undefined && initialData.categoryId !== null
          ? String(initialData.categoryId)
          : initialData.category !== undefined && initialData.category !== null
          ? String(initialData.category)
          : "";
      setSelectedCategory(catId);

      // Copiamos multimedia tal cual (pueden ser URLs). No cargamos Files en edición.
      setUploadedUrls(
        initialData.multimedia ? [...initialData.multimedia] : []
      );
      setSelectedFiles([]);
      setColorsInput((initialData.colors || []).join("\n"));
      setBulto(initialData.bulto || "");
    } else {
      // Modo agregar
      setColorsInput("");
      setBulto("");
      setUploadedUrls([]);
      setSelectedFiles([]);
      setSelectedCategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initialData.id]);

  // Revocar objectURLs creados cuando el componente se desmonta
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      createdObjectUrlsRef.current = [];
    };
  }, []);

  // Al seleccionar archivos: deduplicar por name+size, crear previews y actualizar estados
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    // Dedup respecto a selectedFiles actuales por name+size
    const existingSet = new Set(
      (selectedFiles || []).map((f) => `${f.name}_${f.size}`)
    );
    const filtered = newFiles.filter(
      (f) => !existingSet.has(`${f.name}_${f.size}`)
    );
    if (!filtered.length) return;

    // Actualizamos selectedFiles (añadimos los Files nuevos)
    setSelectedFiles((prev) => [...(prev || []), ...filtered]);

    // Crear previews para los files nuevos
    const previews = filtered.map((f) => {
      const url = URL.createObjectURL(f);
      createdObjectUrlsRef.current.push(url);
      return url;
    });

    // Añadimos previews al array de uploadedUrls evitando duplicados exactos
    setUploadedUrls((prev = []) => {
      const set = new Set(prev.concat(previews));
      return Array.from(set);
    });

    // no resetear el input aquí (dejar al submit o al reset)
  };

  const handleRemovePreview = (idxToRemove) => {
    setUploadedUrls((prev = []) => {
      const next = [...prev];
      const [removed] = next.splice(idxToRemove, 1);
      // revocar si es blob
      try {
        if (removed && removed.startsWith && removed.startsWith("blob:"))
          URL.revokeObjectURL(removed);
      } catch (e) {}
      return next;
    });

    // si quieres, podríamos también eliminar el File asociado en selectedFiles, pero
    // no es trivial saber cuál archivo corresponde a qué preview si había URLs del servidor.
    // Aquí dejamos los Files como están (el backend solo subirá Files que estén en selectedFiles).
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setUploadedUrls((prev = []) => {
      const reordered = Array.from(prev);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      return reordered;
    });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const form = ev.target;

    const productData = {
      ...(isEdit ? { id: initialData.id } : {}),
      code: form.code.value.trim(),
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      videos: form.videos.value
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      price_state1: form.price1.value,
      price_state2: form.price2.value,
      cant_min: parseInt(form.cant_min.value || "1", 10),
      ean: form.ean.value,
      stock: parseInt(form.stock.value || "0", 10),
      // Guardar la categoría seleccionada (id, el padre convertirá a nombre)
      category: form.category.value,
      subcategory: form.subcategory.value,
      bulto,
      colors: colorsInput
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
      // multimedia: las URLs que se muestran actualmente en la UI (pueden incluir blob: previews)
      multimedia: uploadedUrls,
      // files: los File objects que se subirán (solo los Files locales recién seleccionados)
      files: selectedFiles,
    };

    try {
      const res = onSubmit(productData);
      if (res && typeof res.then === "function") {
        await res;
      }

      // limpiar formulario si todo OK
      form.reset();
      setColorsInput("");
      setBulto("");
      setUploadedUrls([]);
      setSelectedFiles([]);
      setSelectedCategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      // revocar objectURLs creados
      createdObjectUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      createdObjectUrlsRef.current = [];
    } catch (err) {
      console.error("Error al guardar producto:", err);
      // no limpiamos para que el usuario corrija
    }
  };

  // Obtener categoría actual (por id) para listar subcategorías
  const currentCategory = categories.find(
    (c) => String(c.id) === String(selectedCategory)
  );

  // Render: si un elemento de uploadedUrls no es string (ej: File), creamos objectURL temporal.
  // (Esto es defensivo; normalmente uploadedUrls debería ser array de strings.)
  const renderImageSrc = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    try {
      // si es File-like
      const url = URL.createObjectURL(item);
      createdObjectUrlsRef.current.push(url);
      return url;
    } catch {
      return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card stack"
      autoComplete="off"
      style={{
        maxWidth: 600,
        margin: "0 auto",
        boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
      }}
    >
      <h2
        style={{
          color: "#009ca6",
          marginBottom: 18,
          textAlign: "center",
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        Datos del producto
      </h2>
      <div className="stack" style={{ gap: 18 }}>
        <div className="row" style={{ gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Código</span>
            </label>
            <input name="code" defaultValue={initialData.code || ""} required />
          </div>
          <div style={{ flex: 2 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Nombre</span>
            </label>
            <input name="name" defaultValue={initialData.name || ""} required />
          </div>
        </div>

        <div className="row" style={{ gap: 18 }}>
          <div style={{ flex: 2 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Descripción</span>
            </label>
            <textarea
              name="description"
              defaultValue={initialData.description || ""}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Bulto</span>
            </label>
            <input
              name="bulto"
              value={bulto}
              onChange={(e) => setBulto(e.target.value)}
              placeholder="Bulto del producto"
            />
          </div>
        </div>

        <div className="row" style={{ gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Colores (uno por línea)</span>
            </label>
            <textarea
              name="colors"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder={`Ej: rojo\nazul\nverde`}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>EAN (13 números)</span>
            </label>
            <input
              name="ean"
              pattern="\d{13}"
              defaultValue={initialData.ean || ""}
              placeholder="EAN (13 números)"
            />
          </div>
        </div>

        <div className="row" style={{ gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Precio estado 1</span>
            </label>
            <input
              name="price1"
              defaultValue={initialData.price_state1 || ""}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Precio estado 2</span>
            </label>
            <input
              name="price2"
              defaultValue={initialData.price_state2 || ""}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Stock (1=Sí, 0=No)</span>
            </label>
            <input name="stock" defaultValue={initialData.stock || ""} />
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Cantidad mínima</span>
            </label>
            <input
              name="cant_min"
              defaultValue={initialData.cant_min || 1}
              placeholder="Cantidad mínima de compra"
            />
          </div>
        </div>

        <div className="row" style={{ gap: 18 }}>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Categoría</span>
            </label>
            <select
              name="category"
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="" disabled>
                -- seleccionar --
              </option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span style={{ fontWeight: 600 }}>Subcategoría</span>
            </label>
            <select
              name="subcategory"
              defaultValue={initialData.subcategory || ""}
            >
              <option value="">-- sin subcategoría --</option>
              {currentCategory?.subcategories?.map((s, i) => (
                <option key={`${selectedCategory}_${i}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <label style={{ fontWeight: 600 }}>
            Imágenes actuales (arrastra para reordenar)
          </label>
          <div
            style={{
              background: "#f6f7fb",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #e7e9f0",
            }}
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div
                    style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {(uploadedUrls || []).map((url, idx) => {
                      const src = renderImageSrc(url);
                      return (
                        <Draggable
                          key={`img-${idx}`}
                          draggableId={`img-${idx}`}
                          index={idx}
                        >
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              style={{
                                position: "relative",
                                ...prov.draggableProps.style,
                              }}
                            >
                              <img
                                src={src}
                                alt={`preview-${idx}`}
                                width="100"
                                style={{
                                  borderRadius: 8,
                                  border: "1px solid #dfeafc",
                                  boxShadow: "0 2px 8px rgba(0,156,166,0.08)",
                                  background: "#fff",
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePreview(idx)}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  background: "#ff4d4f",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: 24,
                                  height: 24,
                                  fontWeight: 700,
                                  fontSize: 16,
                                  cursor: "pointer",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Subir nuevas imágenes</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            style={{
              border: "1px solid #e7e9f0",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          />
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <label style={{ fontWeight: 600 }}>
            Videos de YouTube (uno por línea)
          </label>
          <textarea
            name="videos"
            defaultValue={(initialData.videos || []).join("\n")}
            placeholder="https://www.youtube.com/watch?v=xxxxxx"
          />
        </div>

        <div className="row" style={{ gap: 12, marginTop: 18 }}>
          <button className="btn" disabled={loading} style={{ minWidth: 120 }}>
            {loading
              ? isEdit
                ? "Guardando..."
                : "Agregando..."
              : isEdit
              ? "Guardar cambios"
              : "Agregar"}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn outline"
              onClick={onCancel}
              style={{ minWidth: 120 }}
            >
              Cancelar
            </button>
          )}
          {!isEdit && (
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                setUploadedUrls([]);
                setSelectedFiles([]);
                setSelectedCategory("");
                setColorsInput("");
                setBulto("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{ minWidth: 120 }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
