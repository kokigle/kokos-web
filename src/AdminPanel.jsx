import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { uploadImage } from "./cloudinary";
import { db } from "./App";
import ProductForm from "./ProductForm";

export default function AdminPanel() {
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

  // Estados de filtros
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

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

    return () => {
      unsubClients();
      unsubProducts();
      unsubCategories();
    };
  }, [authed]);

  // Funciones de autenticación
  const loginAdmin = () => {
    if (secret === "admin123") {
      setAuthed(true);
    } else {
      alert("Clave admin incorrecta");
    }
  };

  // Funciones de clientes
  const toggleState = (id, state) =>
    updateDoc(doc(db, "clients", id), { state });

  const deleteClient = async (id) => {
    if (confirm("¿Eliminar cliente?")) {
      await deleteDoc(doc(db, "clients", id));
    }
  };

  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    await addDoc(collection(db, "clients"), {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    });
    ev.target.reset();
    alert("Cliente agregado exitosamente");
  };

  // Funciones de productos
  const handleSubmitProduct = async (productData) => {
    setLoading(true);
    try {
      // Filtrar URLs existentes (no blob URLs)
      const existingUrls = (productData.multimedia || []).filter(
        (u) => typeof u === "string" && !u.startsWith("blob:")
      );

      const urls = [...existingUrls];

      // Subir archivos nuevos
      for (let file of productData.files || []) {
        const url = await uploadImage(file);
        if (url) urls.push(url);
      }

      // Eliminar duplicados
      const uniqueUrls = Array.from(new Set(urls));

      // Obtener categoría
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
        alert("Producto actualizado exitosamente");
      } else {
        await addDoc(collection(db, "products"), product);
        alert("Producto agregado exitosamente");
      }

      resetProductForm();
      setView("products");
    } catch (err) {
      console.error(err);
      alert("Error al guardar producto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = (id, stock) =>
    updateDoc(doc(db, "products", id), { stock });

  const deleteProduct = async (id) => {
    if (confirm("¿Eliminar producto?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setView("editProduct");
  };

  // Funciones de categorías
  const addSubcategory = async (catId, subName) => {
    if (!subName) return alert("Nombre vacío");
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    await updateDoc(doc(db, "categories", catId), {
      subcategories: arrayUnion(normalized),
    });
  };

  const removeSubcategory = async (catId, subName) => {
    if (confirm(`¿Eliminar subcategoría "${subName}"?`)) {
      await updateDoc(doc(db, "categories", catId), {
        subcategories: arrayRemove(subName),
      });
    }
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
        </nav>
      </aside>

      <main className="admin-content">
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
      </main>
    </div>
  );
}
