// AdminPanel.jsx (arreglada)
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  const resetProductForm = () => {
    setEditingProduct(null);
    setSelectedCategory("");
    setSelectedFiles([]);
    setUploadedUrls([]);
  };

  useEffect(() => {
    if (view === "addProduct" && !editingProduct) {
      resetProductForm();
    }
  }, [view, editingProduct]);

  useEffect(() => {
    if (!authed) return;
    const unsubC = onSnapshot(collection(db, "clients"), (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubP = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubCat = onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubC();
      unsubP();
      unsubCat();
    };
  }, [authed]);

  // Cuando se selecciona un producto para editar, cargamos sus multimedia y categoryId si existe
  useEffect(() => {
    if (editingProduct) {
      setUploadedUrls(editingProduct.multimedia || []);
      setSelectedFiles([]);
      // preferir categoryId si existe (es más exacto)
      const catId =
        editingProduct.categoryId ||
        categories.find((c) => c.name === editingProduct.category)?.id ||
        "";
      setSelectedCategory(catId);
    }
  }, [editingProduct, categories]);

  const loginAdmin = () => {
    if (secret === "admin123") setAuthed(true);
    else alert("Clave admin incorrecta");
  };

  const toggleState = (id, state) =>
    updateDoc(doc(db, "clients", id), { state });

  const deleteClient = async (id) => {
    if (confirm("¿Eliminar cliente?")) await deleteDoc(doc(db, "clients", id));
  };

  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    await addDoc(collection(db, "clients"), {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    });
    ev.target.reset();
    alert("Cliente agregado");
  };

  // ---------- Productos ----------
  const handleSubmitProduct = async (productData) => {
    setLoading(true);
    try {
      // Empezamos con las URLs ya existentes, pero FILTRAMOS previews locales (blob:)
      const existing = (productData.multimedia || []).filter(
        (u) => typeof u === "string" && !u.startsWith("blob:")
      );

      const urls = [...existing];

      // Subir solo los Files (archivos locales) que vienen en productData.files
      for (let file of productData.files || []) {
        const url = await uploadImage(file);
        if (url) urls.push(url);
      }

      // Eliminar duplicados exactos
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
        alert("Producto actualizado");
      } else {
        await addDoc(collection(db, "products"), product);
        alert("Producto agregado");
      }

      resetProductForm();
      setView("products");
    } catch (err) {
      console.error(err);
      alert("Error guardando producto");
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = (id, stock) =>
    updateDoc(doc(db, "products", id), { stock });

  const deleteProduct = async (id) => {
    if (confirm("¿Eliminar producto?"))
      await deleteDoc(doc(db, "products", id));
  };

  const addSubcategory = (catId, subName) => {
    if (!subName) return alert("Nombre vacío");
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    return updateDoc(doc(db, "categories", catId), {
      subcategories: arrayUnion(normalized),
    });
  };

  const removeSubcategory = (catId, subName) => {
    if (confirm(`Eliminar subcategoría "${subName}"?`))
      updateDoc(doc(db, "categories", catId), {
        subcategories: arrayRemove(subName),
      });
  };

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

  if (!authed) {
    return (
      <div
        className="admin-card login-card card"
        style={{
          boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
          borderRadius: 14,
        }}
      >
        <h2
          style={{
            color: "#009ca6",
            marginBottom: 18,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          Panel admin
        </h2>
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Clave admin"
          style={{
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #e7e9f0",
            padding: "12px 14px",
            fontSize: 16,
          }}
        />
        <button
          onClick={loginAdmin}
          className="btn"
          style={{ width: "100%", fontWeight: 700, fontSize: 16 }}
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="admin-layout" style={{ background: "#f6f7fb" }}>
      <aside
        className="admin-sidebar"
        style={{
          boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
          borderRadius: 14,
        }}
      >
        <div className="brand">
          <h3
            style={{
              color: "#009ca6",
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            KOKOS - Admin
          </h3>
        </div>
        <nav>
          <ul>
            <li
              className={view === "dashboard" ? "active" : ""}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={view === "clients" ? "active" : ""}
              onClick={() => setView("clients")}
            >
              Clientes
            </li>
            <li
              className={view === "products" ? "active" : ""}
              onClick={() => setView("products")}
            >
              Productos
            </li>
            <li
              className={view === "addProduct" ? "active" : ""}
              onClick={() => {
                resetProductForm();
                setView("addProduct");
              }}
            >
              Agregar Producto
            </li>
            <li
              className={view === "categories" ? "active" : ""}
              onClick={() => setView("categories")}
            >
              Categorías / Subcategorías
            </li>
          </ul>
        </nav>
      </aside>

      <section className="admin-main">
        {view === "dashboard" && (
          <div
            className="card"
            style={{
              boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
              borderRadius: 14,
            }}
          >
            <h2
              style={{
                color: "#009ca6",
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1,
              }}
            >
              Dashboard
            </h2>
            <div className="grid-tiles">
              <div className="tile" style={{ fontSize: 18 }}>
                Clientes: {clients.length}
              </div>
              <div className="tile" style={{ fontSize: 18 }}>
                Productos: {products.length}
              </div>
              <div className="tile" style={{ fontSize: 18 }}>
                Categorías: {categories.length}
              </div>
            </div>
            <h4 style={{ marginTop: 24, color: "#0b61ff", fontWeight: 600 }}>
              Subcategorías por categoría
            </h4>
            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
              {categories.map((c) => (
                <li key={c.id} style={{ fontSize: 15, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "#009ca6" }}>
                    {c.name}
                  </span>
                  :{" "}
                  <span style={{ color: "#555" }}>
                    {(c.subcategories || []).length} subcategorías
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === "clients" && (
          <div
            className="card"
            style={{
              boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
              borderRadius: 14,
            }}
          >
            <h2
              style={{
                color: "#009ca6",
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1,
              }}
            >
              Clientes
            </h2>
            <input
              placeholder="Buscar cliente por email"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #e7e9f0",
                padding: "10px 14px",
                fontSize: 15,
              }}
            />
            <div className="stack" style={{ gap: 10 }}>
              {filteredClients.map((c) => (
                <div
                  key={c.id}
                  className="row-between card"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,156,166,0.05)",
                    borderRadius: 10,
                    marginBottom: 0,
                    padding: "12px 18px",
                    background: "#fbfbff",
                  }}
                >
                  <div>
                    <div>
                      <strong style={{ fontSize: 16 }}>{c.email}</strong>
                    </div>
                    <div style={{ fontSize: 14, color: "#555" }}>
                      Estado: {c.state}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleState(c.id, 1)}
                      className="btn small"
                      style={{ minWidth: 80 }}
                    >
                      Estado 1
                    </button>
                    <button
                      onClick={() => toggleState(c.id, 2)}
                      className="btn small"
                      style={{ minWidth: 80 }}
                    >
                      Estado 2
                    </button>
                    <button
                      onClick={() => deleteClient(c.id)}
                      className="btn danger small"
                      style={{ minWidth: 80 }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <hr style={{ margin: "24px 0" }} />
            <h4 style={{ color: "#0b61ff", fontWeight: 600, marginBottom: 10 }}>
              Agregar cliente
            </h4>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                addClient(ev);
              }}
              className="stack"
              style={{ gap: 10 }}
            >
              <input
                name="email"
                placeholder="Email del cliente"
                required
                style={{
                  borderRadius: 8,
                  border: "1px solid #e7e9f0",
                  padding: "10px 14px",
                  fontSize: 15,
                }}
              />
              <input
                name="state"
                placeholder="Estado (1 o 2)"
                defaultValue="1"
                style={{
                  borderRadius: 8,
                  border: "1px solid #e7e9f0",
                  padding: "10px 14px",
                  fontSize: 15,
                }}
              />
              <button className="btn" style={{ fontWeight: 700, fontSize: 15 }}>
                Agregar
              </button>
            </form>
          </div>
        )}

        {view === "products" && (
          <div
            className="card"
            style={{
              boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
              borderRadius: 14,
            }}
          >
            <h2
              style={{
                color: "#009ca6",
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1,
              }}
            >
              Productos existentes
            </h2>
            <input
              placeholder="Buscar producto por nombre/desc/código"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #e7e9f0",
                padding: "10px 14px",
                fontSize: 15,
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setFilterSubcategory("");
                }}
                style={{
                  borderRadius: 8,
                  border: "1px solid #e7e9f0",
                  padding: "8px 12px",
                  fontSize: 15,
                }}
              >
                <option value="">-- todas las categorías --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                style={{
                  borderRadius: 8,
                  border: "1px solid #e7e9f0",
                  padding: "8px 12px",
                  fontSize: 15,
                }}
              >
                <option value="">-- todas las subcategorías --</option>
                {categories
                  .find((c) => c.name === filterCategory)
                  ?.subcategories?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>
            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="product-row row-between card"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,156,166,0.05)",
                    borderRadius: 10,
                    marginBottom: 0,
                    padding: "12px 18px",
                    background: "#fbfbff",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 16 }}>{p.name}</strong>{" "}
                    <span style={{ fontSize: 13, color: "#555" }}>
                      ({p.code})
                    </span>
                    <div
                      style={{ fontSize: 14, color: "#009ca6", marginTop: 2 }}
                    >
                      {p.category} / {p.subcategory}
                    </div>
                    <div style={{ fontSize: 14, color: "#555" }}>
                      Precio1: {p.price_state1} | Precio2: {p.price_state2}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 14, color: "#555", marginBottom: 6 }}
                    >
                      Stock: {p.stock}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => toggleStock(p.id, 1)}
                        className="btn small"
                        style={{ minWidth: 80 }}
                      >
                        Stock Sí
                      </button>
                      <button
                        onClick={() => toggleStock(p.id, 0)}
                        className="btn small"
                        style={{ minWidth: 80 }}
                      >
                        Stock No
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setSelectedCategory(
                            categories.find((c) => c.name === p.category)?.id ||
                              ""
                          );
                          setView("editProduct");
                        }}
                        className="btn small"
                        style={{ minWidth: 80 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="btn danger small"
                        style={{ minWidth: 80 }}
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
          <div
            className="card"
            style={{
              boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
              borderRadius: 14,
            }}
          >
            <h2
              style={{
                color: "#009ca6",
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1,
              }}
            >
              {editingProduct ? "Editar producto" : "Agregar producto"}
            </h2>
            <ProductForm
              initialData={editingProduct || {}}
              categories={categories}
              uploadedUrls={uploadedUrls}
              setUploadedUrls={setUploadedUrls}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
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
          <div
            className="card"
            style={{
              boxShadow: "0 8px 32px rgba(0,156,166,0.08)",
              borderRadius: 14,
            }}
          >
            <h2
              style={{
                color: "#009ca6",
                fontWeight: 700,
                marginBottom: 18,
                letterSpacing: 1,
              }}
            >
              Categorías / Subcategorías
            </h2>
            <div className="stack" style={{ gap: 14 }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="card small"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,156,166,0.05)",
                    borderRadius: 10,
                    marginBottom: 0,
                    padding: "12px 18px",
                    background: "#fbfbff",
                  }}
                >
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 16, color: "#009ca6" }}>
                      {c.name}
                    </strong>
                    <div style={{ fontSize: 14, color: "#555" }}>
                      {(c.subcategories || []).length} subcategorías
                    </div>
                  </div>
                  <div className="sub-list">
                    {(c.subcategories || []).map((s) => (
                      <div
                        key={s}
                        className="sub-item"
                        style={{
                          background: "#fff",
                          border: "1px solid #e7e9f0",
                          borderRadius: 8,
                          padding: "8px 12px",
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{s}</span>
                        <button
                          className="btn danger small"
                          onClick={() => removeSubcategory(c.id, s)}
                          style={{ minWidth: 80 }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    {(!c.subcategories || c.subcategories.length === 0) && (
                      <div className="muted" style={{ fontSize: 14 }}>
                        Sin subcategorías
                      </div>
                    )}
                  </div>
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      addSubcategory(c.id, ev.target.sub.value);
                      ev.target.reset();
                    }}
                    className="row"
                    style={{ marginTop: 10, gap: 10 }}
                  >
                    <input
                      name="sub"
                      placeholder="Nueva subcategoría"
                      style={{
                        borderRadius: 8,
                        border: "1px solid #e7e9f0",
                        padding: "8px 12px",
                        fontSize: 15,
                      }}
                    />
                    <button
                      className="btn"
                      style={{ fontWeight: 700, fontSize: 15 }}
                    >
                      Agregar subcategoría
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
