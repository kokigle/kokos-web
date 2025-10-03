// ProductsList.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./App";
import { db } from "./App";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import "./styles/products-list.css";

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
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 filas de 3 productos

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(null);

  // 🔹 Leer parámetros desde la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");

    // Si hay subcategoría en URL, ponerla en el filtro
    if (subcategory) {
      setPendingFilters((prev) => ({ ...prev, sub: subcategory }));
      setAppliedFilters((prev) => ({ ...prev, sub: subcategory }));
    }

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

  // 🔹 Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...products];
    const { sub, search, minStock, minPrice, maxPrice } = appliedFilters;

    if (sub) {
      result = result.filter((p) => p.subcategory === sub);
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

    // Aplicar ordenamiento
    if (sortBy === "az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "za") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "price-asc" && user) {
      result.sort((a, b) => {
        const priceA = user.state === 2 ? a.price_state2 : a.price_state1;
        const priceB = user.state === 2 ? b.price_state2 : b.price_state1;
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc" && user) {
      result.sort((a, b) => {
        const priceA = user.state === 2 ? a.price_state2 : a.price_state1;
        const priceB = user.state === 2 ? b.price_state2 : b.price_state1;
        return priceB - priceA;
      });
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [products, appliedFilters, user, sortBy]);

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

  // Limpiar filtros
  const handleClearFilters = () => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");

    setPendingFilters({
      search: "",
      minStock: "",
      sub: "",
      minPrice: "",
      maxPrice: "",
    });
    setAppliedFilters({
      search: "",
      minStock: "",
      sub: "",
      minPrice: "",
      maxPrice: "",
    });

    navigate({ search: category ? `category=${category}` : "" });
  };

  // Paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filtered.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="products-list-page">
      {/* Header */}
      <div className="products-list-header">
        <h1 className="products-list-title">Catálogo de Productos</h1>
        <p className="products-list-subtitle">
          Explora nuestra selección completa
        </p>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="products-list-layout">
        {/* Sidebar de Filtros */}
        <aside className="products-filters-sidebar">
          <h3 className="products-filters-title">Filtros</h3>

          <div className="products-filters-list">
            {subcategories.length > 0 && (
              <div className="products-filter-group">
                <label>Subcategoría</label>
                <select
                  value={pendingFilters.sub}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      sub: e.target.value,
                    })
                  }
                >
                  <option value="">Todas</option>
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="products-filter-group">
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Nombre del producto..."
                value={pendingFilters.search}
                onChange={(e) =>
                  setPendingFilters({
                    ...pendingFilters,
                    search: e.target.value,
                  })
                }
              />
            </div>

            <div className="products-filter-group">
              <label>Stock mínimo</label>
              <input
                type="number"
                placeholder="Ej: 5"
                value={pendingFilters.minStock}
                onChange={(e) =>
                  setPendingFilters({
                    ...pendingFilters,
                    minStock: e.target.value,
                  })
                }
              />
            </div>

            <div className="products-filter-group products-filter-price">
              <label>Precio</label>
              <div className="products-price-inputs">
                <input
                  type="number"
                  placeholder="Mín"
                  value={pendingFilters.minPrice}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      minPrice: e.target.value,
                    })
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={pendingFilters.maxPrice}
                  onChange={(e) =>
                    setPendingFilters({
                      ...pendingFilters,
                      maxPrice: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="products-filters-actions">
            <button onClick={handleSearch} className="products-btn-primary">
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="products-btn-secondary"
            >
              Limpiar
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <div className="products-list-content">
          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="products-results-count">
              Mostrando <strong>{currentProducts.length}</strong> de{" "}
              <strong>{filtered.length}</strong> productos
            </div>

            <div className="products-sort-section">
              <ArrowUpDown size={18} />
              <label>Ordenar:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Relevancia</option>
                <option value="az">A - Z</option>
                <option value="za">Z - A</option>
                {user && <option value="price-asc">Menor precio</option>}
                {user && <option value="price-desc">Mayor precio</option>}
              </select>
            </div>
          </div>

          {/* Grid de Productos */}
          {currentProducts.length === 0 ? (
            <div className="products-list-no-results">
              <p>No se encontraron productos con los filtros seleccionados</p>
            </div>
          ) : (
            <>
              <div className="products-list-grid">
                {currentProducts.map((p) => {
                  let priceContent;
                  if (!user) {
                    priceContent = (
                      <p className="products-list-login-msg">
                        Inicia sesión para ver precios
                      </p>
                    );
                  } else {
                    const price =
                      user.state === 2 ? p.price_state2 : p.price_state1;
                    priceContent = (
                      <p className="products-list-price">
                        ${price?.toLocaleString()}
                      </p>
                    );
                  }

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
                      className="products-list-card"
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="products-list-image-container">
                        <Link to={`/product/${p.id}`}>
                          <img
                            src={hovered === p.id ? hoverImg : mainImg}
                            alt={p.name}
                            className="products-list-image"
                          />
                        </Link>
                        {p.stock === 0 && (
                          <span className="products-list-badge-out-stock">
                            Sin Stock
                          </span>
                        )}
                      </div>

                      <div className="products-list-info">
                        <Link
                          to={`/product/${p.id}`}
                          className="products-list-name"
                        >
                          {p.name}
                        </Link>
                        <p className="products-list-code">Código: {p.code}</p>
                        {priceContent}
                      </div>

                      <Link
                        to={`/product/${p.id}`}
                        className={`products-list-btn-buy ${
                          p.stock === 0 ? "products-list-disabled" : ""
                        }`}
                      >
                        {p.stock === 0 ? "Sin Stock" : "Ver Producto"}
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="products-list-pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="products-list-pagination-btn"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="products-list-pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`products-list-pagination-number ${
                                page === currentPage
                                  ? "products-list-active"
                                  : ""
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="products-list-pagination-ellipsis"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="products-list-pagination-btn"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
