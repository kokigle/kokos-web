// ProductsList.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./App";
import { db } from "./App";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [pendingFilters, setPendingFilters] = useState({
    search: "",
    minStock: "",
    sub: "",
    minPrice: "",
    maxPrice: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minStock: "",
    sub: "",
    minPrice: "",
    maxPrice: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [categoryTitle, setCategoryTitle] = useState("Productos");
  const { user } = useAuth();

  // 🔹 Leer parámetros desde la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");

    // Setear título dinámico
    setCategoryTitle(
      subcategory
        ? subcategory.replace(/_/g, " ").toUpperCase()
        : category
        ? category.replace(/_/g, " ").toUpperCase()
        : "Productos"
    );

    // Traer productos de Firestore
    let q = collection(db, "products");
    if (category && subcategory) {
      q = query(
        q,
        where("category", "==", category),
        where("subcategory", "==", subcategory)
      );
    } else if (category) {
      q = query(q, where("category", "==", category));
    }

    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(prods);
    });

    return () => unsub();
  }, [location.search]);

  // 🔹 Traer subcategorías
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");

    if (!category) {
      setSubcategories([]);
      return;
    }

    const q = query(
      collection(db, "categories"),
      where("name", "==", category)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const catData = snap.docs[0].data();
        setSubcategories(catData.subcategories || []);
      }
    });

    return () => unsub();
  }, [location.search]);

  // 🔹 Aplicar filtros
  useEffect(() => {
    let result = [...products];
    const { subcategory, search, minStock, minPrice, maxPrice } =
      appliedFilters;

    if (subcategory) {
      result = result.filter((p) => p.subcategory === subcategory);
    }
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (minStock) {
      result = result.filter((p) => p.cant_min <= parseInt(minStock));
    }
    if (user) {
      result = result.filter((p) => {
        const price = user.state === 2 ? p.price_state2 : p.price_state1;
        if (!price) return false;
        if (minPrice && price < parseInt(minPrice)) return false;
        if (maxPrice && price > parseInt(maxPrice)) return false;
        return true;
      });
    }

    setFiltered(result);
  }, [products, appliedFilters, user]);

  // 🔹 Aplicar filtros y actualizar URL
  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters });

    const params = new URLSearchParams(location.search);
    Object.entries(pendingFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate({ search: params.toString() });
  };

  // Estado para hover de imagen
  const [hovered, setHovered] = useState(null);

  return (
    <div
      className="products-page"
      style={{
        background: "#f8f9fa",
        borderRadius: 16,
        boxShadow: "0 6px 24px rgba(27,31,56,0.08)",
        padding: "32px 24px",
        margin: "32px auto",
        maxWidth: 1200,
      }}
    >
      <h2
        className="category-title"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#009ca6",
          marginBottom: 24,
        }}
      >
        {categoryTitle}
      </h2>
      <div className="filters" style={{ marginBottom: 32 }}>
        {/* ...filtros igual... */}
        <div className="filter-group">
          <h4>Subcategorías</h4>
          <select
            value={pendingFilters.subcategory}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                subcategory: e.target.value,
              })
            }
          >
            <option value="">-- todas las subcategorías --</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <h4>Buscar</h4>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={pendingFilters.search}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, search: e.target.value })
            }
          />
        </div>
        <div className="filter-group">
          <h4>Cantidad mínima</h4>
          <input
            type="number"
            placeholder="Ej: 5"
            value={pendingFilters.minStock}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, minStock: e.target.value })
            }
          />
        </div>
        <div className="filter-group">
          <h4>Precio</h4>
          <input
            type="number"
            placeholder="Mínimo"
            value={pendingFilters.minPrice}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, minPrice: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Máximo"
            value={pendingFilters.maxPrice}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, maxPrice: e.target.value })
            }
          />
        </div>
        <div className="filter-group" style={{ alignSelf: "flex-end" }}>
          <button
            onClick={handleSearch}
            className="btn"
            style={{
              background: "#009ca6",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            BUSCAR
          </button>
        </div>
      </div>
      <div className="products-grid-4" style={{ gap: 32 }}>
        {filtered.map((p) => {
          let priceContent;
          if (!user) {
            priceContent = (
              <p style={{ fontSize: 15, color: "#888" }}>
                <em>Inicia sesión para ver el precio</em>
              </p>
            );
          } else {
            const price = user.state === 2 ? p.price_state2 : p.price_state1;
            priceContent = (
              <p
                className="product-price"
                style={{ fontWeight: 700, color: "#28a745", fontSize: 20 }}
              >
                ${price?.toLocaleString()}
              </p>
            );
          }

          // Imágenes para hover
          const images =
            p.multimedia && p.multimedia.length > 1
              ? p.multimedia
              : [
                  (p.multimedia && p.multimedia[0]) ||
                    "https://via.placeholder.com/300",
                ];
          const mainImg = images[0];
          const hoverImg = images[1] || images[0];

          return (
            <div
              key={p.id}
              className="product-card"
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(27,31,56,0.08)",
                padding: 20,
                transition: "box-shadow 0.3s, transform 0.3s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 420, // 👈 altura mínima igualada para todas
              }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div>
                <div
                  className="product-img-wrapper"
                  style={{
                    marginBottom: 16,
                    position: "relative",
                    height: 220,
                    overflow: "hidden",
                    borderRadius: 12,
                    background: "#f9f9fb",
                    boxShadow: "0 1px 6px rgba(27,31,56,0.06)",
                  }}
                >
                  <Link
                    to={`/product/${p.id}`}
                    style={{ display: "block", height: "100%" }}
                  >
                    <img
                      src={hovered === p.id ? hoverImg : mainImg}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: 12,
                        transition: "opacity 0.5s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </Link>
                  {p.stock === 0 && (
                    <div
                      className="out-of-stock"
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "#ff4d4f",
                        color: "#fff",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      SIN STOCK
                    </div>
                  )}
                </div>

                <h3
                  className="product-name"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#009ca6",
                    margin: "8px 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 3, // 👈 máximo 3 líneas
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  <Link
                    to={`/product/${p.id}`}
                    style={{ color: "#009ca6", textDecoration: "none" }}
                  >
                    {p.name}
                  </Link>
                </h3>

                <p
                  className="product-code"
                  style={{ fontSize: 13, color: "#888", marginBottom: 8 }}
                >
                  Código: {p.code}
                </p>
                {priceContent}
              </div>

              <Link
                to={`/product/${p.id}`}
                className={`btn ${p.stock === 0 ? "disabled" : ""}`}
                style={{
                  background: p.stock === 0 ? "#eee" : "#009ca6",
                  color: p.stock === 0 ? "#aaa" : "#fff",
                  borderRadius: 8,
                  fontWeight: 700,
                  marginTop: 12,
                  textDecoration: "none",
                  padding: "10px 0",
                  textAlign: "center",
                }}
              >
                {p.stock === 0 ? "SIN STOCK" : "COMPRAR"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
