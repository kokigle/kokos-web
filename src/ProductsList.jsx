// ProductsList.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "./App";
import { db } from "./App";
import "./styles/products-list.css";
// Eliminamos FaFolder, FaFolderOpen, FaFile
import { ChevronLeft, ChevronRight, ArrowUpDown, Filter, ChevronDown } from "lucide-react";

// --- Helper igual ---
const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else if (!cat.parentId) {
      roots.push(map[cat.id]);
    }
  });
  Object.values(map).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};

const getDescendantIds = (categoryId, categoriesMap) => {
  let ids = [categoryId];
  const nodesArray = Object.values(categoriesMap);
  const children = nodesArray.filter((c) => c.parentId === categoryId);
  if (children.length > 0) {
    children.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id, categoriesMap));
    });
  }
  return ids;
};

// --- Componente de Árbol PROFESIONAL ---
const CategoryTreeNode = ({ node, level, selectedCategoryId, onSelect, openNodes, toggleNode }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = openNodes[node.id];
  const isSelected = selectedCategoryId === node.id;

  return (
    <div className="category-tree-node">
      <div 
        className={`category-tree-content ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }} // Indentación sutil
        onClick={() => onSelect(node.id)}
      >
        {/* Botón de expansión solo si tiene hijos */}
        <span 
          className="category-tree-toggle"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              toggleNode(node.id);
            }
          }}
        >
          {hasChildren && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        <span className="category-tree-label">{node.name}</span>
      </div>

      {hasChildren && isOpen && (
        <div className="category-tree-children">
          {node.children.map(child => (
            <CategoryTreeNode 
              key={child.id} 
              node={child} 
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              openNodes={openNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryFilterTree = ({ categoryTree, selectedCategoryId, onSelectCategory }) => {
  const [openNodes, setOpenNodes] = useState({});

  const toggleNode = (nodeId) => {
    setOpenNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Lógica para abrir ancestros automáticamente
  useEffect(() => {
    if (selectedCategoryId && categoryTree.length > 0) {
      const map = {};
      const buildMap = (nodes) => {
        nodes.forEach((n) => {
          map[n.id] = n;
          if (n.children) buildMap(n.children);
        });
      };
      buildMap(categoryTree);

      const ancestors = {};
      let current = map[selectedCategoryId];
      while (current && current.parentId) {
        ancestors[current.parentId] = true;
        // Búsqueda simple en el mapa
        const parentId = current.parentId;
        current = map[parentId]; 
      }
      setOpenNodes((prev) => ({ ...prev, ...ancestors }));
    }
  }, [selectedCategoryId, categoryTree]);

  return (
    <div className="products-list-category-filter-tree">
      {categoryTree.map((node) => (
        <CategoryTreeNode
          key={node.id}
          node={node}
          level={0}
          selectedCategoryId={selectedCategoryId}
          onSelect={onSelectCategory}
          openNodes={openNodes}
          toggleNode={toggleNode}
        />
      ))}
    </div>
  );
};

// --- FIN Componente ---

export default function ProductsList() {
    // ... (El resto de la lógica de ProductsList se mantiene EXACTAMENTE IGUAL)
    // Solo cambia la sección del render del CategoryFilterTree
    
    // Para simplificar, copia todo el contenido desde `const [products, setProducts]...` hasta el final del archivo original.
    // La única diferencia es que ahora `CategoryFilterTree` ya no usa carpetas.
    
    // AQUI COPIO EL CUERPO PRINCIPAL PARA QUE ESTÉ COMPLETO EL ARCHIVO:
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [categoriesMap, setCategoriesMap] = useState({});
    const [categoryTree, setCategoryTree] = useState([]);
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
    const itemsPerPage = 9;
  
    const [showMobileFilters, setShowMobileFilters] = useState(false);
  
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hovered, setHovered] = useState(null);
  
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const categoryIdParam = params.get("categoryId");
      const searchParam = params.get("search");
      const minPriceParam = params.get("minPrice");
      const maxPriceParam = params.get("maxPrice");
  
      const urlFilters = {
        search: searchParam || "",
        categoryId: categoryIdParam || "",
        minPrice: minPriceParam || "",
        maxPrice: maxPriceParam || "",
      };
  
      setPendingFilters(urlFilters);
      setAppliedFilters(urlFilters);
  
      const qCategories = query(collection(db, "categories"), orderBy("name"));
      const unsubCategories = onSnapshot(qCategories, (snap) => {
        const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllCategories(flatList);
        const map = {};
        flatList.forEach((cat) => (map[cat.id] = cat));
        setCategoriesMap(map);
        setCategoryTree(buildCategoryTree(flatList));
      });
  
      const qProducts = query(collection(db, "products"), orderBy("name"));
      const unsubProducts = onSnapshot(qProducts, (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
  
      return () => {
        unsubCategories();
        unsubProducts();
      };
    }, [location.search]); 
  
    useEffect(() => {
      let result = [...products];
      const { categoryId, search, minPrice, maxPrice } = appliedFilters;
  
      if (categoryId && Object.keys(categoriesMap).length > 0) {
        const descendantIds = getDescendantIds(categoryId, categoriesMap);
        result = result.filter((p) => descendantIds.includes(p.categoryId));
      }
  
      if (search.trim()) {
        const normalizeText = (text) =>
          text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        const searchTerms = normalizeText(search.trim()).split(/\s+/);
        result = result.filter((p) => {
          const searchableText = `${normalizeText(p.name || "")} ${normalizeText(
            p.code || ""
          )}`;
          return searchTerms.every((term) => searchableText.includes(term));
        });
      }
  
      if (minPrice || maxPrice) {
        result = result.filter((p) => {
          const price = user?.state === 2 ? p.price_state2 : p.price_state1;
          if (price === undefined || price === null) return false; 
          const numericPrice = Number(price);
          const min = minPrice ? parseFloat(minPrice) : -Infinity;
          const max = maxPrice ? parseFloat(maxPrice) : Infinity;
          return numericPrice >= min && numericPrice <= max;
        });
      }
  
      if (sortBy === "az") {
        result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "za") {
        result.sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy.startsWith("price-") && user) {
        const sortOrder = sortBy === "price-asc" ? 1 : -1;
        result.sort((a, b) => {
          const priceA = user.state === 2 ? a.price_state2 : a.price_state1;
          const priceB = user.state === 2 ? b.price_state2 : b.price_state1;
          const numPriceA = priceA ?? (sortOrder === 1 ? Infinity : -Infinity);
          const numPriceB = priceB ?? (sortOrder === 1 ? Infinity : -Infinity);
          return (numPriceA - numPriceB) * sortOrder;
        });
      }
  
      setFiltered(result);
      setCurrentPage(1);
    }, [products, appliedFilters, user, sortBy, categoriesMap]);
  
    const handleApplyFilters = () => {
      setAppliedFilters({ ...pendingFilters });
      setShowMobileFilters(false);
  
      const newParams = new URLSearchParams();
      if (pendingFilters.categoryId)
        newParams.set("categoryId", pendingFilters.categoryId);
      if (pendingFilters.search.trim())
        newParams.set("search", pendingFilters.search.trim());
      if (pendingFilters.minPrice)
        newParams.set("minPrice", pendingFilters.minPrice);
      if (pendingFilters.maxPrice)
        newParams.set("maxPrice", pendingFilters.maxPrice);
  
      navigate(`?${newParams.toString()}`, { replace: true });
    };
  
    const handleClearFilters = () => {
      const cleared = { search: "", minPrice: "", maxPrice: "", categoryId: "" };
      setPendingFilters(cleared);
      setAppliedFilters(cleared);
      setSortBy("");
      setShowMobileFilters(false);
      navigate("", { replace: true }); 
    };
  
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filtered.slice(startIndex, endIndex);
  
    const goToPage = (page) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  
    useEffect(() => {
      currentProducts.forEach((p) => {
        if (p.multimedia && p.multimedia.length > 1) {
          const img = new Image();
          img.src = p.multimedia[1];
        }
      });
    }, [currentProducts]);
  
    const getCurrentCategoryName = () => {
      if (appliedFilters.categoryId && categoriesMap[appliedFilters.categoryId]) {
        return categoriesMap[appliedFilters.categoryId].name;
      }
      return "Todos los Productos";
    };
  
    return (
      <div className="products-list-page">
        <div className="products-list-header">
          <h1 className="products-list-title">{getCurrentCategoryName()}</h1>
          <p className="products-list-subtitle">
            Explora nuestra selección completa
          </p>
        </div>
  
        <button
          className="products-list-mobile-filter-btn" 
          onClick={() => setShowMobileFilters(true)}
        >
          <Filter size={18} /> Filtrar (
          {Object.values(appliedFilters).filter((v) => v).length})
        </button>
  
        <div className="products-list-layout">
          <aside
            className={`products-list-filters-sidebar ${
              showMobileFilters ? "products-list-mobile-visible" : "" 
            }`}
          >
            <button
              className="products-list-mobile-close-btn" 
              onClick={() => setShowMobileFilters(false)}
            >
              ✕
            </button>
  
            <h3 className="products-list-filters-title">Filtros</h3>
  
            <div className="products-list-filters-list">
              <div className="products-list-filter-group">
                <label>Categoría</label>
                <CategoryFilterTree
                  categoryTree={categoryTree}
                  selectedCategoryId={pendingFilters.categoryId}
                  onSelectCategory={(id) =>
                    setPendingFilters((prev) => ({ ...prev, categoryId: id }))
                  }
                />
              </div>
  
              <div className="products-list-filter-group products-list-filter-price">
                <label>Precio</label>
                <div className="products-list-price-inputs">
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
                    min="0" 
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
                    min="0" 
                  />
                </div>
              </div>
            </div>
  
            <div className="products-list-filters-actions">
              <button
                onClick={handleApplyFilters}
                className="products-list-btn-apply-filters"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleClearFilters}
                className="products-list-btn-clear-filters"
              >
                Limpiar Todo
              </button>
            </div>
          </aside>
  
          <div className="products-list-content">
            <div className="products-list-toolbar">
              <div className="products-list-results-count">
                Mostrando <strong>{currentProducts.length}</strong> de{" "}
                <strong>{filtered.length}</strong> productos
              </div>
              <div className="products-list-sort-section">
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
                      priceContent =
                        price !== undefined && price !== null ? (
                          <p className="products-list-price">
                            ${price?.toLocaleString()}
                          </p>
                        ) : (
                          <p className="products-list-login-msg">
                            Precio no disponible
                          </p>
                        );
                    }
  
                    const images =
                      p.multimedia?.length > 0
                        ? p.multimedia
                        : ["https://via.placeholder.com/300"];
                    const mainImg = images[0];
                    const hoverImg = images[1] || mainImg;
  
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
                          <p className="products-list-code">
                            Código: {p.code}
                          </p>
                          {priceContent}
                        </div>
                        <Link
                          to={`/product/${p.id}`}
                          className={`products-list-btn-view ${
                            p.stock === 0 ? "products-list-disabled" : ""
                          }`}
                        >
                          {p.stock === 0 ? "Sin Stock" : "Ver Producto"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
  
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
  
        {showMobileFilters && (
          <div
            className="products-list-mobile-filter-overlay"
            onClick={() => setShowMobileFilters(false)}
          ></div>
        )}
      </div>
    );
  }