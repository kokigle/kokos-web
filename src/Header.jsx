import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./App";
import { db } from "./App";
import logo from "./assets/logo.png";
import { Search } from "./icons/SearchIcon.jsx";
import "./styles/header-kokos.css";
import { ProfileIcon } from "./icons/ProfileIcon";
import { CartIcon } from "./icons/CartIcon.jsx";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      // Asegurarse de que el padre exista antes de intentar añadirlo
      map[cat.parentId].children.push(map[cat.id]);
    } else if (!cat.parentId) {
      // Solo añadir nodos raíz si no tienen padre
      roots.push(map[cat.id]);
    }
  });
  // Ordenar hijos alfabéticamente
  Object.values(map).forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};

// --- NUEVO: Componente Recursivo para Submenú ---
const SubmenuItem = ({ item, closeMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  // Construir la ruta completa para el Link
  // Asumimos que la estructura base es /products?categoryPath=cat1_cat2_cat3
  // O podrías usar categoryId si ProductsList lo maneja
  const categoryPathString = item.path ? item.path.join("_") : item.id; // Necesitaríamos añadir 'path' al construir el árbol
  const linkTo = `/products?categoryId=${item.id}`; // O usar categoryPathString si prefieres

  const handleToggle = (e) => {
    if (hasChildren && window.innerWidth <= 768) {
      // Solo prevenir en móvil si hay hijos
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      closeMobileMenu(); // Cierra en desktop o si no hay hijos
    }
  };

  return (
    <div
      className={`header-kokos-submenu-item ${
        hasChildren ? "has-children" : ""
      } ${isOpen ? "open" : ""}`}
    >
      <Link to={linkTo} onClick={handleToggle}>
        {item.name.replace(/_/g, " ").toUpperCase()}
        {hasChildren && (
          <span className="submenu-arrow">{isOpen ? "−" : "+"}</span>
        )}
      </Link>
      {hasChildren && (
        <div
          className="header-kokos-submenu-nested"
          style={{
            display: isOpen || window.innerWidth > 768 ? "block" : "none",
          }}
        >
          {item.children.map((child) => (
            <SubmenuItem
              key={child.id}
              item={child}
              closeMobileMenu={closeMobileMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Función para añadir 'path' a cada nodo del árbol
const addPathToTree = (nodes, currentPath = []) => {
  return nodes.map((node) => {
    const nodePath = [...currentPath, node.name]; // O node.id si prefieres path de IDs
    const newNode = { ...node, path: nodePath };
    if (node.children && node.children.length > 0) {
      newNode.children = addPathToTree(node.children, nodePath);
    }
    return newNode;
  });
};

export default function Header() {
  const { user, logout } = useAuth();
  const [categoryTree, setCategoryTree] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null); // Para manejar el dropdown móvil

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name")); // Ordenar raíces/nodos
    const unsub = onSnapshot(q, (snap) => {
      const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const tree = buildCategoryTree(flatList);
      const treeWithPath = addPathToTree(tree); // Añadir la ruta a cada nodo
      // Podrías filtrar aquí para obtener solo el árbol de "Juguetería" si es necesario
      // O pasar el árbol completo y que el componente SubmenuItem filtre
      setCategoryTree(treeWithPath);
    });
    return () => unsub();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchQuery.trim()) {
      // Podrías mantener la categoría actual si existe
      const params = new URLSearchParams(location.search);
      const categoryId = params.get("categoryId"); // <- Usar categoryId
      const newParams = new URLSearchParams();
      if (categoryId) {
        newParams.set("categoryId", categoryId);
      }
      newParams.set("search", searchQuery.trim());
      navigate(`/products?${newParams.toString()}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    localStorage.removeItem("wh_cart");
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("storage"));
  };

  const jugueteriaNode = categoryTree.find(
    (node) => node.name.toLowerCase() === "juguetería"
  ); // Ajusta el nombre si es diferente

  return (
    <header className="header-kokos-header">
      <div className="header-kokos-header-top">
        <div className="header-kokos-logo">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <img
              src={logo}
              alt="Kokos Logo"
              className="header-kokos-logo-img"
            />
          </Link>
        </div>

        <div className="header-kokos-search">
          {/* Asegúrate que este form no esté anidado dentro de otro form en el DOM final */}
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar productos"
              // Quita 'required' si lo tenías, no debería ser obligatorio para la navegación
            />
            <button type="submit" aria-label="Buscar">
              <Search />
            </button>
          </form>
        </div>

        <div className="header-kokos-actions">
          <Link
            to="/cart"
            className="header-kokos-action-btn header-kokos-cart-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="header-kokos-action-icon">
              <CartIcon />
            </span>
            <span className="header-kokos-action-text">Carrito</span>
          </Link>

          {user ? (
            <div className="header-kokos-user-dropdown">
              <button className="header-kokos-action-btn header-kokos-user-btn">
                <span className="header-kokos-action-icon">
                  <ProfileIcon />
                </span>
                <span className="header-kokos-action-text">Mi Cuenta</span>
              </button>
              <div className="header-kokos-user-menu">
                <div className="header-kokos-user-menu-header">
                  <span className="header-kokos-user-email-display">
                    {user.razonSocial}
                  </span>
                </div>
                {/* NUEVO ENLACE A MI CUENTA */}
                <Link
                  to="/my-account"
                  className="header-kokos-user-menu-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Cuenta
                </Link>
                <Link
                  to="/my-account/orders"
                  className="header-kokos-user-menu-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className="header-kokos-user-menu-item header-kokos-logout"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="header-kokos-action-btn header-kokos-login-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="header-kokos-action-icon">
                <ProfileIcon />
              </span>
              <span className="header-kokos-action-text">Iniciar Sesión</span>
            </Link>
          )}
        </div>

        <button
          className="header-kokos-mobile-menu-toggle"
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            setActiveDropdown(null); // Reset dropdown on menu toggle
          }}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav
        className={`header-kokos-menu ${
          mobileMenuOpen ? "header-kokos-mobile-open" : ""
        }`}
      >
        <Link
          to="/"
          className="header-kokos-menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          INICIO
        </Link>
        {/* Usamos onClick para manejar el dropdown en móvil */}
        {jugueteriaNode && ( // Solo mostrar si existe la categoría raíz
          <div className="header-kokos-dropdown-menu">
            <Link
              to={`/products?categoryId=${jugueteriaNode.id}`} // Enlace a la categoría raíz
              className="header-kokos-menu-link"
              onClick={(e) => {
                // Prevenir en móvil SI hay hijos para abrir el dropdown interno
                if (
                  window.innerWidth <= 768 &&
                  jugueteriaNode.children &&
                  jugueteriaNode.children.length > 0
                ) {
                  e.preventDefault();
                  // El toggle ahora lo maneja SubmenuItem, podríamos necesitar un estado aquí o refactorizar
                  // setActiveDropdown(activeDropdown === "jugueteria" ? null : "jugueteria"); // Mantener algo similar?
                } else {
                  setMobileMenuOpen(false);
                }
              }}
            >
              {jugueteriaNode.name.toUpperCase()}
            </Link>
            {jugueteriaNode.children && jugueteriaNode.children.length > 0 && (
              <div className="header-kokos-submenu">
                <div className="header-kokos-submenu-content">
                  {jugueteriaNode.children.map((subItem) => (
                    <SubmenuItem
                      key={subItem.id}
                      item={subItem}
                      closeMobileMenu={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <Link
          to="/nosotros"
          className="header-kokos-menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          NOSOTROS
        </Link>
        <Link
          to="/novedades"
          className="header-kokos-menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          NOVEDADES
        </Link>
        <Link
          to="/contacto"
          className="header-kokos-menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          CONTACTO
        </Link>

        {/* --- Menú Móvil Adicional --- */}
        {mobileMenuOpen && (
          <div className="header-kokos-mobile-actions">
            <hr />
            {user ? (
              <>
                <Link to="/my-account" onClick={() => setMobileMenuOpen(false)}>
                  Mi Cuenta
                </Link>
                <Link
                  to="/my-account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
                <button onClick={handleLogout}>Cerrar Sesión</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                Iniciar Sesión
              </Link>
            )}
            <hr />
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>
              Carrito
            </Link>
          </div>
        )}
        {/* --- Fin Menú Móvil Adicional --- */}
      </nav>
    </header>
  );
}
