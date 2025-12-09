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
import { ChevronDown, ChevronRight } from "lucide-react"; // Flechas modernas

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

const SubmenuItem = ({ item, closeMobileMenu, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const linkTo = `/products?categoryId=${item.id}`;

  // En escritorio, dejamos que CSS :hover haga el trabajo para el flyout.
  // En móvil, usamos el click.
  const handleClick = (e) => {
    if (window.innerWidth <= 768 && hasChildren) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    } else {
      closeMobileMenu();
    }
  };

  return (
    <div
      className={`header-submenu-item ${hasChildren ? "has-children" : ""}`}
      // Eliminamos onMouseEnter/Leave de JS para que CSS maneje el hover puro
    >
      <Link 
        to={linkTo} 
        onClick={handleClick}
        className="header-submenu-link"
        // Quitamos padding dinámico en escritorio para alineación uniforme
        // En móvil podría ser útil, pero el CSS ya lo maneja bien.
      >
        <span className="header-submenu-text">
          {item.name.replace(/_/g, " ").toUpperCase()}
        </span>
        
        {hasChildren && (
          <span className="header-submenu-arrow-icon">
             {/* En desktop siempre es derecha porque expande a derecha */}
             {window.innerWidth > 768 ? <ChevronRight size={14} /> : (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
        )}
      </Link>
      
      {hasChildren && (
        <div
          className={`header-submenu-nested ${
            isOpen ? "visible" : "" /* 'visible' solo afecta a móvil ahora */
          }`}
        >
          {item.children.map((child) => (
            <SubmenuItem
              key={child.id}
              item={child}
              closeMobileMenu={closeMobileMenu}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const addPathToTree = (nodes, currentPath = []) => {
  return nodes.map((node) => {
    const nodePath = [...currentPath, node.name];
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
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const tree = buildCategoryTree(flatList);
      const treeWithPath = addPathToTree(tree);
      setCategoryTree(treeWithPath);
    });
    return () => unsub();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchQuery.trim()) {
      const params = new URLSearchParams(location.search);
      const categoryId = params.get("categoryId");
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
  );

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
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar productos"
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
            setActiveDropdown(null);
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
        {jugueteriaNode && (
          <div className="header-kokos-dropdown-menu">
            <Link
              to={`/products?categoryId=${jugueteriaNode.id}`}
              className="header-kokos-menu-link"
              onClick={(e) => {
                if (
                  window.innerWidth <= 768 &&
                  jugueteriaNode.children &&
                  jugueteriaNode.children.length > 0
                ) {
                  e.preventDefault();
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
      </nav>
    </header>
  );
}