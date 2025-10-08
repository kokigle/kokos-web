import React, { useState, useEffect, useRef } from "react"; // ✨ NUEVO: Importamos useRef
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { uploadImage } from "./cloudinary";
import { db } from "./App";
import ProductForm from "./ProductForm";
import "./styles/admin-panel.css";

export default function AdminPanel() {
  // ✨ NUEVO: Creamos una referencia para el contenedor principal del contenido
  const mainContentRef = useRef(null);

  // Estados de autenticación
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  // Estados de datos
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados de UI
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Estados de filtros
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  // Estados para editar inicio
  const [bannerImages, setBannerImages] = useState([]);
  const [homeCategories, setHomeCategories] = useState({
    img1: { url: "", redirect: "" },
    img2: { url: "", redirect: "" },
    img3: { url: "", redirect: "" },
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  // ✨ NUEVO: Función reutilizable para hacer scroll top en el panel de contenido
  const scrollTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: "smooth", // Scroll suave para una mejor UX
      });
    }
  };

  // ✨ NUEVO: useEffect que se ejecuta cada vez que cambia la vista para hacer scroll top
  useEffect(() => {
    scrollTop();
  }, [view]);

  // Función para mostrar notificaciones
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para mostrar diálogo de confirmación
  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  // Función para resetear el formulario completamente
  const resetProductForm = () => {
    setEditingProduct(null);
  };

  // Efecto para manejar el cambio de vista
  useEffect(() => {
    if (view === "addProduct") {
      resetProductForm();
    }
  }, [view]);

  // Suscripciones a Firestore
  useEffect(() => {
    if (!authed) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubBanner = onSnapshot(
      collection(db, "images/banner_images/urls"),
      (snap) => {
        const images = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.pos || 0) - (b.pos || 0));
        setBannerImages(images);
      }
    );

    const loadHomeCategories = async () => {
      const cats = { img1: {}, img2: {}, img3: {} };
      for (let i = 1; i <= 3; i++) {
        const docRef = doc(db, "images", `img${i}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          cats[`img${i}`] = docSnap.data();
        } else {
          cats[`img${i}`] = { url: "", redirect: "" };
        }
      }
      setHomeCategories(cats);
    };
    loadHomeCategories();

    return () => {
      unsubClients();
      unsubProducts();
      unsubCategories();
      unsubBanner();
    };
  }, [authed]);

  // Funciones de autenticación
  const loginAdmin = () => {
    if (secret === "admin123") {
      setAuthed(true);
    } else {
      showNotification("Clave admin incorrecta", "error");
    }
  };

  // Funciones de clientes
  const toggleState = async (id, state) => {
    await updateDoc(doc(db, "clients", id), { state });
    showNotification(`Estado actualizado a ${state}`);
  };

  const deleteClient = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este cliente?",
      async () => {
        await deleteDoc(doc(db, "clients", id));
        showNotification("Cliente eliminado");
      }
    );
  };

  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    await addDoc(collection(db, "clients"), {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    });
    ev.target.reset();
    showNotification("Cliente agregado exitosamente");
    scrollTop(); // ✨ NUEVO: Hacemos scroll top para ver la notificación y el nuevo cliente
  };

  // Funciones de productos
  const handleSubmitProduct = async (productData) => {
    setLoading(true);
    try {
      const existingUrls = (productData.multimedia || []).filter(
        (u) => typeof u === "string" && !u.startsWith("blob:")
      );

      const urls = [...existingUrls];

      if (productData.files && productData.files.length > 0) {
        const uploadPromises = productData.files.map((file) =>
          uploadImage(file)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        urls.push(...uploadedUrls.filter((url) => url));
      }

      const uniqueUrls = Array.from(new Set(urls));

      const cat = categories.find(
        (c) => String(c.id) === String(productData.category)
      );

      const product = {
        code: productData.code,
        name: productData.name,
        description: productData.description,
        multimedia: uniqueUrls,
        videos: productData.videos || [],
        price_state1: Number(productData.price_state1) || 0,
        price_state2: Number(productData.price_state2) || 0,
        stock: Number(productData.stock) || 0,
        cant_min: Number(productData.cant_min) || 1,
        ean: productData.ean,
        category: cat?.name || "",
        categoryId: cat?.id || "",
        subcategory: productData.subcategory || "",
        bulto: productData.bulto || "",
        colors: productData.colors || [],
      };

      if (productData.id) {
        await updateDoc(doc(db, "products", productData.id), product);
        showNotification("Producto actualizado exitosamente");
      } else {
        await addDoc(collection(db, "products"), product);
        showNotification("Producto agregado exitosamente");
      }

      resetProductForm();
      setView("products");
    } catch (err) {
      console.error(err);
      showNotification("Error al guardar producto: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (id, stock) => {
    await updateDoc(doc(db, "products", id), { stock });
    showNotification(
      stock === 1
        ? "Producto marcado como disponible"
        : "Producto marcado sin stock"
    );
  };

  const deleteProduct = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este producto?",
      async () => {
        await deleteDoc(doc(db, "products", id));
        showNotification("Producto eliminado");
      }
    );
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setView("editProduct");
  };

  // Funciones de categorías
  const addSubcategory = async (catId, subName) => {
    if (!subName) {
      showNotification("Nombre vacío", "error");
      return;
    }
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    await updateDoc(doc(db, "categories", catId), {
      subcategories: arrayUnion(normalized),
    });
    showNotification("Subcategoría agregada");
  };

  const removeSubcategory = async (catId, subName) => {
    showConfirm(
      `¿Estás seguro de que deseas eliminar la subcategoría "${subName}"?`,
      async () => {
        await updateDoc(doc(db, "categories", catId), {
          subcategories: arrayRemove(subName),
        });
        showNotification("Subcategoría eliminada");
      }
    );
  };

  // Funciones para editar inicio - Banner
  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    try {
      const currentMaxPos =
        bannerImages.length > 0
          ? Math.max(...bannerImages.map((img) => img.pos || 0))
          : 0;

      const uploadPromises = files.map(async (file, index) => {
        const url = await uploadImage(file);
        if (url) {
          const nextPos = currentMaxPos + index + 1;
          const nextId = `banner_images${Date.now()}_${index}`;
          await setDoc(doc(db, "images/banner_images/urls", nextId), {
            url,
            redirect: "novedades",
            pos: nextPos,
          });
        }
      });

      await Promise.all(uploadPromises);
      showNotification("Imágenes subidas exitosamente");
    } catch (err) {
      showNotification("Error al subir imágenes: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateBannerRedirect = async (id, redirect) => {
    await updateDoc(doc(db, "images/banner_images/urls", id), { redirect });
    showNotification("Redirección actualizada");
  };

  const deleteBannerImage = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen del banner?",
      async () => {
        await deleteDoc(doc(db, "images/banner_images/urls", id));
        await reorderBannerPositions();
        showNotification("Imagen eliminada");
      }
    );
  };

  const reorderBannerPositions = async () => {
    const remainingImages = bannerImages.filter((img) => img.id);
    const updatePromises = remainingImages.map((img, index) =>
      updateDoc(doc(db, "images/banner_images/urls", img.id), {
        pos: index + 1,
      })
    );
    await Promise.all(updatePromises);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...bannerImages];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    setBannerImages(newImages);
    setDraggedIndex(null);

    try {
      const updatePromises = newImages.map((img, index) =>
        updateDoc(doc(db, "images/banner_images/urls", img.id), {
          pos: index + 1,
        })
      );
      await Promise.all(updatePromises);
      showNotification("Orden actualizado");
    } catch (err) {
      showNotification("Error al reordenar: " + err.message, "error");
    }
  };

  // Funciones para categorías de inicio
  const handleHomeCategoryUpload = async (categoryKey, file) => {
    setLoading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const newData = {
          url,
          redirect: homeCategories[categoryKey]?.redirect || "novedades",
        };
        await setDoc(doc(db, "images", categoryKey), newData);

        setHomeCategories((prev) => ({
          ...prev,
          [categoryKey]: newData,
        }));

        showNotification("Imagen subida exitosamente");
      }
    } catch (err) {
      showNotification("Error al subir imagen: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateHomeCategoryRedirect = async (categoryKey, redirect) => {
    await updateDoc(doc(db, "images", categoryKey), { redirect });

    setHomeCategories((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        redirect: redirect,
      },
    }));

    showNotification("Redirección actualizada");
  };

  const deleteHomeCategoryImage = async (categoryKey) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen?",
      async () => {
        const newData = { url: "", redirect: "" };
        await setDoc(doc(db, "images", categoryKey), newData);

        setHomeCategories((prev) => ({
          ...prev,
          [categoryKey]: newData,
        }));

        showNotification("Imagen eliminada");
      }
    );
  };

  // Obtener todas las opciones de redirección
  const getRedirectOptions = () => {
    const options = ["ninguno", "novedades"];
    categories.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        options.push(sub);
      });
    });
    return options;
  };

  // Filtros
  const filteredClients = clients.filter((c) =>
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description || "")
        .toLowerCase()
        .includes(productSearch.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchSub = !filterSubcategory || p.subcategory === filterSubcategory;
    return matchSearch && matchCategory && matchSub;
  });

  // Pantalla de login
  if (!authed) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="login-header">
            <h2>Panel Administrativo</h2>
            <p>Ingrese la clave para continuar</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && loginAdmin()}
            placeholder="Clave de administrador"
            className="admin-login-input"
          />
          <button onClick={loginAdmin} className="admin-login-btn">
            Acceder
          </button>
        </div>
      </div>
    );
  }

  // Panel principal
  return (
    <div className="admin-layout">
      {/* Notificaciones */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Diálogo de Confirmación */}
      {confirmDialog && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-icon">⚠️</div>
            <h3>Confirmación</h3>
            <p>{confirmDialog.message}</p>
            <div className="confirm-actions">
              <button onClick={handleCancel} className="btn-confirm-cancel">
                Cancelar
              </button>
              <button onClick={handleConfirm} className="btn-confirm-ok">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Procesando...</p>
        </div>
      )}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h3>KOKOS Admin</h3>
        </div>
        <nav className="admin-nav">
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={view === "clients" ? "active" : ""}
            onClick={() => setView("clients")}
          >
            👥 Clientes
          </button>
          <button
            className={view === "products" ? "active" : ""}
            onClick={() => setView("products")}
          >
            📦 Productos
          </button>
          <button
            className={view === "addProduct" ? "active" : ""}
            onClick={() => {
              resetProductForm();
              setView("addProduct");
            }}
          >
            ➕ Agregar Producto
          </button>
          <button
            className={view === "categories" ? "active" : ""}
            onClick={() => setView("categories")}
          >
            🏷️ Categorías
          </button>
          <button
            className={view === "editHome" ? "active" : ""}
            onClick={() => setView("editHome")}
          >
            🏠 Editar inicio
          </button>
        </nav>
      </aside>

      {/* ✨ NUEVO: Asignamos la referencia al elemento <main> */}
      <main className="admin-content" ref={mainContentRef}>
        {view === "dashboard" && (
          <div className="admin-card">
            <h2 className="admin-title">Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{clients.length}</h3>
                  <p>Clientes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>{products.length}</h3>
                  <p>Productos</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏷️</div>
                <div className="stat-info">
                  <h3>{categories.length}</h3>
                  <p>Categorías</p>
                </div>
              </div>
            </div>

            <div className="dashboard-categories">
              <h3>Subcategorías por categoría</h3>
              <div className="category-list">
                {categories.map((c) => (
                  <div key={c.id} className="category-item">
                    <strong>{c.name}</strong>
                    <span className="badge">
                      {(c.subcategories || []).length} subcategorías
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "clients" && (
          <div className="admin-card">
            <h2 className="admin-title">Gestión de Clientes</h2>

            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por email..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="clients-list">
              {filteredClients.map((c) => (
                <div key={c.id} className="client-card">
                  <div className="client-info">
                    <h4>{c.email}</h4>
                    <span className={`client-state state-${c.state}`}>
                      Estado {c.state}
                    </span>
                  </div>
                  <div className="client-actions">
                    <button
                      onClick={() => toggleState(c.id, 1)}
                      className={`btn-small ${c.state === 1 ? "active" : ""}`}
                    >
                      Estado 1
                    </button>
                    <button
                      onClick={() => toggleState(c.id, 2)}
                      className={`btn-small ${c.state === 2 ? "active" : ""}`}
                    >
                      Estado 2
                    </button>
                    <button
                      onClick={() => deleteClient(c.id)}
                      className="btn-small btn-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="add-client-section">
              <h3>Agregar nuevo cliente</h3>
              <form onSubmit={addClient} className="add-client-form">
                <input
                  name="email"
                  type="email"
                  placeholder="Email del cliente"
                  required
                />
                <select name="state" defaultValue="1">
                  <option value="1">Estado 1</option>
                  <option value="2">Estado 2</option>
                </select>
                <button type="submit" className="btn-primary">
                  Agregar Cliente
                </button>
              </form>
            </div>
          </div>
        )}

        {view === "products" && (
          <div className="admin-card">
            <h2 className="admin-title">Gestión de Productos</h2>

            <div className="filters-section">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, código o descripción..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="search-input"
              />
              <div className="filter-row">
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterSubcategory("");
                  }}
                  className="filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
                  className="filter-select"
                  disabled={!filterCategory}
                >
                  <option value="">Todas las subcategorías</option>
                  {categories
                    .find((c) => c.name === filterCategory)
                    ?.subcategories?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="products-list">
              {filteredProducts.map((p) => (
                <div key={p.id} className="product-card-admin">
                  <div className="product-info">
                    <h4>{p.name}</h4>
                    <p className="product-code">Código: {p.code}</p>
                    <p className="product-category">
                      {p.category} {p.subcategory && `/ ${p.subcategory}`}
                    </p>
                    <div className="product-prices">
                      <span>Precio 1: ${p.price_state1}</span>
                      <span>Precio 2: ${p.price_state2}</span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <span
                      className={`stock-badge ${
                        p.stock === 1 ? "in-stock" : "out-stock"
                      }`}
                    >
                      {p.stock === 1 ? "En stock" : "Sin stock"}
                    </span>
                    <div className="action-buttons">
                      <button
                        onClick={() => toggleStock(p.id, p.stock === 1 ? 0 : 1)}
                        className="btn-small"
                      >
                        {p.stock === 1
                          ? "Marcar sin stock"
                          : "Marcar disponible"}
                      </button>
                      <button
                        onClick={() => editProduct(p)}
                        className="btn-small btn-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="btn-small btn-danger"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(view === "addProduct" ||
          (view === "editProduct" && editingProduct)) && (
          <div className="admin-card">
            <h2 className="admin-title">
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h2>
            <ProductForm
              initialData={editingProduct || {}}
              categories={categories}
              onSubmit={handleSubmitProduct}
              loading={loading}
              onCancel={() => {
                resetProductForm();
                setView("products");
              }}
            />
          </div>
        )}

        {view === "categories" && (
          <div className="admin-card">
            <h2 className="admin-title">Gestión de Categorías</h2>
            <div className="categories-list">
              {categories.map((c) => (
                <div key={c.id} className="category-card">
                  <div className="category-header">
                    <h3>{c.name}</h3>
                    <span className="badge">
                      {(c.subcategories || []).length} subcategorías
                    </span>
                  </div>
                  <div className="subcategories-list">
                    {(c.subcategories || []).map((s) => (
                      <div key={s} className="subcategory-item">
                        <span>{s}</span>
                        <button
                          onClick={() => removeSubcategory(c.id, s)}
                          className="btn-remove-sub"
                        >
                          × Eliminar
                        </button>
                      </div>
                    ))}
                    {(!c.subcategories || c.subcategories.length === 0) && (
                      <p className="empty-message">Sin subcategorías</p>
                    )}
                  </div>
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      addSubcategory(c.id, ev.target.sub.value);
                      ev.target.reset();
                    }}
                    className="add-subcategory-form"
                  >
                    <input
                      name="sub"
                      placeholder="Nueva subcategoría"
                      required
                    />
                    <button type="submit" className="btn-add-sub">
                      + Agregar
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "editHome" && (
          <div className="admin-card">
            <h2 className="admin-title">Editar Página de Inicio</h2>
            <div className="home-section">
              <h3 className="section-title">Banner del Inicio</h3>
              <div className="banner-upload-section">
                <label className="btn-upload">
                  📤 Subir imágenes al banner
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBannerUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </label>
              </div>
              <div className="banner-images-list">
                {bannerImages.map((img, index) => (
                  <div
                    key={img.id}
                    className="banner-image-item"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <img src={img.url} alt={`Banner ${index + 1}`} />
                    <div className="banner-controls">
                      <select
                        value={img.redirect}
                        onChange={(e) =>
                          updateBannerRedirect(img.id, e.target.value)
                        }
                        className="redirect-select"
                      >
                        {getRedirectOptions().map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteBannerImage(img.id)}
                        className="btn-remove-inline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-section">
              <h3 className="section-title">Categorías del Inicio (3)</h3>
              <div className="home-categories-grid">
                {["img1", "img2", "img3"].map((key, index) => (
                  <div key={key} className="home-category-card">
                    <h4>Categoría {index + 1}</h4>
                    {homeCategories[key]?.url ? (
                      <div className="home-category-preview">
                        <img src={homeCategories[key].url} alt={key} />
                        <button
                          onClick={() => deleteHomeCategoryImage(key)}
                          className="btn-remove"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="home-category-empty">
                        <label className="btn-upload-small">
                          📤 Subir imagen
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
                      value={homeCategories[key]?.redirect || "novedades"}
                      onChange={(e) =>
                        updateHomeCategoryRedirect(key, e.target.value)
                      }
                      className="redirect-select-full"
                      disabled={!homeCategories[key]?.url}
                    >
                      {getRedirectOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
