// ProductsList.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "./App";
import { db } from "./App";
import "./styles/products-list.css";
import { ChevronLeft, ChevronRight, ArrowUpDown, Filter } from "lucide-react"; // Añadir Filter
import { FaFolder, FaFolderOpen, FaFile } from "react-icons/fa";
// --- NUEVO: Helper para construir árbol (igual que en Header/Admin) ---
const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });
  // Ordenar hijos alfabéticamente
  Object.values(map).forEach((node) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  });
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};
const getDescendantIds = (categoryId, categoriesMap) => {
  let ids = [categoryId];
  const node = Object.values(categoriesMap).find((c) => c.id === categoryId);
  if (node && node.children) {
    node.children.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id, categoriesMap));
    });
  }
  return ids;
};

// --- NUEVO: Componente para Filtro de Categorías en Árbol ---
const CategoryFilterTree = ({
  categoryTree,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [openNodes, setOpenNodes] = useState({});

  const toggleNode = (nodeId) => {
    setOpenNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Abre los nodos padres de la categoría seleccionada al montar
  useEffect(() => {
    if (selectedCategoryId) {
      const map = {};
      const buildMap = (nodes) => {
        nodes.forEach((n) => {
          map[n.id] = n;
          if (n.children) buildMap(n.children);
        });
      };
      buildMap(categoryTree);

      const getAncestors = (id) => {
        const ancestors = {};
        let current = map[id];
        while (current && current.parentId) {
          ancestors[current.parentId] = true;
          current = Object.values(map).find((c) => c.id === current.parentId); // Lento, mejor usar un mapa de IDs
        }
        return ancestors;
      };
      setOpenNodes((prev) => ({
        ...prev,
        ...getAncestors(selectedCategoryId),
      }));
    }
  }, [selectedCategoryId, categoryTree]);

  const renderNode = (node, level = 0) => (
    <div
      key={node.id}
      style={{ marginLeft: `${level * 15}px`, marginBottom: "3px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 8px",
          borderRadius: "4px",
          cursor: "pointer",
          background:
            selectedCategoryId === node.id ? "#e7f7f8" : "transparent",
          border:
            selectedCategoryId === node.id
              ? "1px solid #009ca6"
              : "1px solid transparent",
          fontWeight: selectedCategoryId === node.id ? "bold" : "normal",
          fontSize: "14px",
          color: selectedCategoryId === node.id ? "#007f85" : "#374151",
        }}
        onClick={() => onSelectCategory(node.id)}
      >
        {node.children && node.children.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
            style={{ display: "inline-block", width: "16px", color: "#9ca3af" }}
          >
            {openNodes[node.id] ? (
              <FaFolderOpen size={14} />
            ) : (
              <FaFolder size={14} />
            )}
          </span>
        )}
        {!node.children ||
          (node.children.length === 0 && (
            <span
              style={{
                display: "inline-block",
                width: "16px",
                color: "#cbd5e1",
              }}
            >
              <FaFile size={12} />
            </span>
          ))}
        <span>{node.name}</span>
      </div>
      {node.children && node.children.length > 0 && openNodes[node.id] && (
        <div style={{ marginTop: "3px" }}>
          {node.children.map((child) => renderNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="category-filter-tree">
      {categoryTree.map((node) => renderNode(node))}
    </div>
  );
};
// --- FIN NUEVO Componente ---

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  // --- CAMBIO: Estados para categorías ---
  const [allCategories, setAllCategories] = useState([]); // Lista plana
  const [categoriesMap, setCategoriesMap] = useState({}); // Mapa
  const [categoryTree, setCategoryTree] = useState([]); // Árbol
  // --- FIN CAMBIO ---
  const [pendingFilters, setPendingFilters] = useState({
    search: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
  });
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Reducido para mejor visualización

  const [showMobileFilters, setShowMobileFilters] = useState(false); // Para filtros móviles

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(null);

  // 🔹 SINCRONIZACIÓN: Leer parámetros desde la URL e inicializar filtros
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryIdParam = params.get("categoryId"); // <- CAMBIO
    const searchParam = params.get("search");
    const minPriceParam = params.get("minPrice");
    const maxPriceParam = params.get("maxPrice");

    // Actualizar filtros desde la URL
    const urlFilters = {
      search: searchParam || "",
      categoryId: categoryIdParam || "", // <- CAMBIO
      minPrice: minPriceParam || "",
      maxPrice: maxPriceParam || "",
    };

    setPendingFilters(urlFilters);
    setAppliedFilters(urlFilters);

    // Traer TODAS las categorías una vez
    const qCategories = query(collection(db, "categories"), orderBy("name"));
    const unsubCategories = onSnapshot(qCategories, (snap) => {
      const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllCategories(flatList);
      const map = {};
      flatList.forEach((cat) => (map[cat.id] = cat));
      setCategoriesMap(map);
      setCategoryTree(buildCategoryTree(flatList));
    });

    // Traer TODOS los productos una vez
    const qProducts = query(collection(db, "products"), orderBy("name"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []); // Solo se ejecuta al montar

  // 🔹 Aplicar filtros y ordenamiento (se ejecuta cuando cambian los productos o filtros aplicados)
  useEffect(() => {
    let result = [...products];
    const { categoryId, search, minPrice, maxPrice } = appliedFilters;

    // --- CAMBIO: Filtrar por categoryId (incluyendo descendientes) ---
    if (categoryId) {
      const descendantIds = getDescendantIds(categoryId, categoriesMap);
      result = result.filter((p) => descendantIds.includes(p.categoryId));
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

        // Concatenar todos los campos donde buscar
        const searchableText = `${productName} ${productCode}`;

        // Verificar que TODAS las palabras estén presentes en alguno de los campos
        return searchTerms.every((term) => searchableText.includes(term));
      });
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
    setCurrentPage(1); // Resetear página al filtrar/ordenar
  }, [products, appliedFilters, user, sortBy, categoriesMap]); // <- Añadir categoriesMap

  // 🔹 Aplicar filtros pendientes y actualizar URL
  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setShowMobileFilters(false); // Cerrar filtros móviles

    const newParams = new URLSearchParams();
    if (pendingFilters.categoryId)
      newParams.set("categoryId", pendingFilters.categoryId);
    if (pendingFilters.search.trim())
      newParams.set("search", pendingFilters.search.trim());
    if (pendingFilters.minPrice)
      newParams.set("minPrice", pendingFilters.minPrice);
    if (pendingFilters.maxPrice)
      newParams.set("maxPrice", pendingFilters.maxPrice);

    navigate({ search: newParams.toString() }, { replace: true });
  };

  // 🔹 MEJORADO: Limpiar filtros manteniendo solo la categoría
  // 🔹 Limpiar filtros
  const handleClearFilters = () => {
    const cleared = { search: "", minPrice: "", maxPrice: "", categoryId: "" };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setSortBy("");
    setShowMobileFilters(false);
    navigate({ search: "" }, { replace: true }); // Limpiar URL
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

  // Obtener nombre de categoría actual para título (NUEVO)
  const getCurrentCategoryName = () => {
    if (appliedFilters.categoryId && categoriesMap[appliedFilters.categoryId]) {
      return categoriesMap[appliedFilters.categoryId].name;
    }
    return "Todos los Productos"; // Título por defecto
  };

  return (
    <div className="products-list-page">
      {/* Header */}
      <div className="products-list-header">
        <h1 className="products-list-title">{getCurrentCategoryName()}</h1>
        <p className="products-list-subtitle">
          Explora nuestra selección completa
        </p>
      </div>
      {/* Botón Filtros Móvil (NUEVO) */}
      <button
        className="products-mobile-filter-btn"
        onClick={() => setShowMobileFilters(true)}
      >
        <Filter size={18} /> Filtrar (
        {Object.values(appliedFilters).filter((v) => v).length})
      </button>

      {/* Layout: Sidebar + Content */}
      <div className="products-list-layout">
        {/* Sidebar de Filtros */}
        <aside
          className={`products-filters-sidebar ${
            showMobileFilters ? "mobile-visible" : ""
          }`}
        >
          {/* Botón cerrar móvil */}
          <button
            className="products-mobile-close-btn"
            onClick={() => setShowMobileFilters(false)}
          >
            ✕
          </button>

          <h3 className="products-filters-title">Filtros</h3>

          <div className="products-filters-list">
            {/* --- CAMBIO: Filtro de Categoría Árbol --- */}
            <div className="products-filter-group">
              <label>Categoría</label>
              <CategoryFilterTree
                categoryTree={categoryTree}
                selectedCategoryId={pendingFilters.categoryId}
                onSelectCategory={(id) =>
                  setPendingFilters((prev) => ({ ...prev, categoryId: id }))
                }
              />
            </div>
            {/* --- FIN CAMBIO --- */}

            {/* Filtro de Precio (sin cambios estructurales) */}
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
            <button
              onClick={handleApplyFilters}
              className="products-btn-primary"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="products-btn-secondary"
            >
              Limpiar Todo
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
      {/* Overlay para cerrar filtros móviles */}
      {showMobileFilters && (
        <div
          className="products-mobile-filter-overlay"
          onClick={() => setShowMobileFilters(false)}
        ></div>
      )}
    </div>
  );
}
