// ProductsList.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, orderBy } from "firebase/firestore";
import { useAuth, db } from "./App";
import { useFirestoreData } from "./contexts/FirestoreContext";
import { optimizeImageUrl } from "./utils/cloudinaryHelper";
import stylesList from "./styles/products-list.module.css";
// Eliminamos FaFolder, FaFolderOpen, FaFile
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import Filter from "lucide-react/dist/esm/icons/filter";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";

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
    <div className={stylesList.categoryTreeNode}>
      <div 
        className={`${stylesList.categoryTreeContent} ${isSelected ? stylesList.selected : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }} // Indentación sutil
        onClick={() => onSelect(node.id)}
      >
        {/* Botón de expansión solo si tiene hijos */}
        <span 
          className={stylesList.categoryTreeToggle}
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

        <span className={stylesList.categoryTreeLabel}>{node.name}</span>
      </div>

      {hasChildren && isOpen && (
        <div className={stylesList.categoryTreeChildren}>
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
    <div className={stylesList.productsListCategoryFilterTree}>
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

const ProductCard = React.memo(({ p, user }) => {
  const [isHovered, setIsHovered] = useState(false);

  let priceContent;
  if (!user) {
    priceContent = (
      <p className={stylesList.productsListLoginMsg}>
        Inicia sesión para ver precios
      </p>
    );
  } else {
    const price = user.state === 2 ? p.price_state2 : p.price_state1;
    priceContent = price !== undefined && price !== null ? (
      <p className={stylesList.productsListPrice}>
        ${price?.toLocaleString()}
      </p>
    ) : (
      <p className={stylesList.productsListLoginMsg}>
        Precio no disponible
      </p>
    );
  }

  const images = p.multimedia?.length > 0 ? p.multimedia : ["https://via.placeholder.com/300"];
  const mainImg = images[0];
  const hoverImg = images[1] || mainImg;

  return (
    <div
      className={stylesList.productsListCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={stylesList.productsListImageContainer}>
        <Link to={`/product/${p.id}`}>
          <img
            src={optimizeImageUrl(isHovered ? hoverImg : mainImg, { width: 400 })}
            alt={p.name}
            loading="lazy"
            className={stylesList.productsListImage}
          />
        </Link>
        {p.stock === 0 && (
          <span className={stylesList.productsListBadgeOutStock}>
            Sin Stock
          </span>
        )}
      </div>
      <div className={stylesList.productsListInfo}>
        <Link to={`/product/${p.id}`} className={stylesList.productsListName}>
          {p.name}
        </Link>
        <p className={stylesList.productsListCode}>
          Código: {p.code}
        </p>
        {priceContent}
      </div>
      <Link
        to={`/product/${p.id}`}
        className={`${stylesList.productsListBtnView} ${p.stock === 0 ? stylesList.productsListDisabled : ""}`}
      >
        {p.stock === 0 ? "Sin Stock" : "Ver Producto"}
      </Link>
    </div>
  );
});

export default function ProductsList() {
    const { products, categories, categoriesMap, categoryTree } = useFirestoreData();
    const allCategories = categories; // Alias for backward compatibility
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

    }, [location.search]); 
  
    const filtered = React.useMemo(() => {
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
      return result;
    }, [products, appliedFilters, categoriesMap, sortBy, user]);
  
    useEffect(() => {
      setCurrentPage(1);
    }, [appliedFilters, sortBy]);

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
      <div className={stylesList.productsListPage}>
        <div className={stylesList.productsListHeader}>
          <h1 className={stylesList.productsListTitle}>{getCurrentCategoryName()}</h1>
          <p className={stylesList.productsListSubtitle}>
            Explora nuestra selección completa
          </p>
        </div>
  
        <button
          className={stylesList.productsListMobileFilterBtn} 
          onClick={() => setShowMobileFilters(true)}
        >
          <Filter size={18} /> Filtrar (
          {Object.values(appliedFilters).filter((v) => v).length})
        </button>
  
        <div className={stylesList.productsListLayout}>
          <aside
            className={`${stylesList.productsListFiltersSidebar} ${
              showMobileFilters ? stylesList.productsListMobileVisible : "" 
            }`}
          >
            <button
              className={stylesList.productsListMobileCloseBtn} 
              onClick={() => setShowMobileFilters(false)}
            >
              ✕
            </button>
  
            <h3 className={stylesList.productsListFiltersTitle}>Filtros</h3>
  
            <div className={stylesList.productsListFiltersList}>
              <div className={stylesList.productsListFilterGroup}>
                <label>Categoría</label>
                <CategoryFilterTree
                  categoryTree={categoryTree}
                  selectedCategoryId={pendingFilters.categoryId}
                  onSelectCategory={(id) =>
                    setPendingFilters((prev) => ({ ...prev, categoryId: id }))
                  }
                />
              </div>
  
              <div className={`${stylesList.productsListFilterGroup} ${stylesList.productsListFilterPrice}`}>
                <label>Precio</label>
                <div className={stylesList.productsListPriceInputs}>
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
  
            <div className={stylesList.productsListFiltersActions}>
              <button
                onClick={handleApplyFilters}
                className={stylesList.productsListBtnApplyFilters}
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleClearFilters}
                className={stylesList.productsListBtnClearFilters}
              >
                Limpiar Todo
              </button>
            </div>
          </aside>
  
          <div className={stylesList.productsListContent}>
            <div className={stylesList.productsListToolbar}>
              <div className={stylesList.productsListResultsCount}>
                Mostrando <strong>{currentProducts.length}</strong> de{" "}
                <strong>{filtered.length}</strong> productos
              </div>
              <div className={stylesList.productsListSortSection}>
                <ArrowUpDown size={18} />
                <label>Ordenar:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Ordenar productos"
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
              <div className={stylesList.productsListNoResults}>
                <p>No se encontraron productos con los filtros seleccionados</p>
              </div>
            ) : (
              <>
                <div className={stylesList.productsListGrid}>
                  {currentProducts.map((p) => (
                    <ProductCard key={p.id} p={p} user={user} />
                  ))}
                </div>
  
                {totalPages > 1 && (
                  <div className={stylesList.productsListPagination}>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={stylesList.productsListPaginationBtn}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className={stylesList.productsListPaginationNumbers}>
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
                                className={`${stylesList.productsListPaginationNumber} ${
                                  page === currentPage
                                    ? stylesList.productsListActive
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
                                className={stylesList.productsListPaginationEllipsis}
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
                      className={stylesList.productsListPaginationBtn}
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
            className={stylesList.productsListMobileFilterOverlay}
            onClick={() => setShowMobileFilters(false)}
          ></div>
        )}
      </div>
    );
  }