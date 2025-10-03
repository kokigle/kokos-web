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
  const itemsPerPage = 9;

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(null);

  // 🔹 SINCRONIZACIÓN: Leer parámetros desde la URL e inicializar filtros
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let category = params.get("category");
    const subcategory = params.get("subcategory");
    const searchParam = params.get("search");
    const minStockParam = params.get("minStock");
    const minPriceParam = params.get("minPrice");
    const maxPriceParam = params.get("maxPrice");

    // Si no hay categoría pero hay búsqueda, establecer categoría por defecto
    if (!category && searchParam) {
      category = "jugueteria";
      // Actualizar la URL con la categoría por defecto
      const newParams = new URLSearchParams(location.search);
      newParams.set("category", category);
      navigate({ search: newParams.toString() }, { replace: true });
    }

    // Actualizar filtros desde la URL
    const urlFilters = {
      search: searchParam || "",
      minStock: minStockParam || "",
      sub: subcategory || "",
      minPrice: minPriceParam || "",
      maxPrice: maxPriceParam || "",
    };

    setPendingFilters(urlFilters);
    setAppliedFilters(urlFilters);

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
  }, [location.search, navigate]);

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
      } else {
        setSubcategories([]);
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
      // Función para normalizar texto (quitar tildes y convertir a minúsculas)
      const normalizeText = (text) => {
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      // Dividir el término de búsqueda en palabras y normalizarlas
      const searchTerms = normalizeText(search.trim()).split(/\s+/);

      result = result.filter((p) => {
        const productName = normalizeText(p.name || "");
        const productCode = normalizeText(p.code || "");
        const productDescription = normalizeText(p.description || "");

        // Concatenar todos los campos donde buscar
        const searchableText = `${productName} ${productCode} ${productDescription}`;

        // Verificar que TODAS las palabras estén presentes en alguno de los campos
        return searchTerms.every((term) => searchableText.includes(term));
      });
    }
    if (minStock) {
      result = result.filter((p) => p.cant_min <= parseInt(minStock));
    }
    if (user) {
      result = result.filter((p) => {
        const price = user.state === 2 ? p.price_state2 : p.price_state1;
        if (!price) return false;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
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

  // 🔹 MEJORADO: Aplicar filtros y actualizar URL manteniendo category
  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters });

    const params = new URLSearchParams(location.search);
    const category = params.get("category");

    // Crear nuevos parámetros
    const newParams = new URLSearchParams();

    // SIEMPRE mantener la categoría si existe
    if (category) {
      newParams.set("category", category);
    }

    // Agregar los demás filtros solo si tienen valor
    if (pendingFilters.sub) {
      newParams.set("subcategory", pendingFilters.sub);
    }
    if (pendingFilters.search.trim()) {
      newParams.set("search", pendingFilters.search.trim());
    }
    if (pendingFilters.minStock) {
      newParams.set("minStock", pendingFilters.minStock);
    }
    if (pendingFilters.minPrice) {
      newParams.set("minPrice", pendingFilters.minPrice);
    }
    if (pendingFilters.maxPrice) {
      newParams.set("maxPrice", pendingFilters.maxPrice);
    }

    navigate({ search: newParams.toString() }, { replace: true });
  };

  // 🔹 MEJORADO: Limpiar filtros manteniendo solo la categoría
  const handleClearFilters = () => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");

    const clearedFilters = {
      search: "",
      minStock: "",
      sub: "",
      minPrice: "",
      maxPrice: "",
    };

    setPendingFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setSortBy("");

    // Solo mantener category en la URL
    const newParams = new URLSearchParams();
    if (category) {
      newParams.set("category", category);
    }

    navigate({ search: newParams.toString() }, { replace: true });
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

  // 🔹 Precargar imágenes hover de los productos actuales
  useEffect(() => {
    currentProducts.forEach((p) => {
      if (p.multimedia && p.multimedia.length > 1) {
        const img = new Image();
        img.src = p.multimedia[1];
      }
    });
  }, [currentProducts]);

  return (
    <div className="products-list-page">
      {/* Header */}
      <div className="products-list-header">
        <h1 className="products-list-title">Jugueteria</h1>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                >
                  <option value="">Todas</option>
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub
                        .replace(/_/g, " ")
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
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
