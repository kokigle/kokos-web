import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./App";
import { db } from "./App";
import { useFirestoreData } from "./contexts/FirestoreContext";
import logo from "./assets/logo.png";
import { Search } from "./icons/SearchIcon.jsx";
import styles from "./styles/header-kokos.module.css";
import { ProfileIcon } from "./icons/ProfileIcon";
import { CartIcon } from "./icons/CartIcon.jsx";
import { collection, query, orderBy } from "firebase/firestore";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Settings from "lucide-react/dist/esm/icons/settings";

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
      className={`${styles.headerSubmenuItem} ${hasChildren ? styles.hasChildren : ""}`}
    >
      <Link 
        to={linkTo} 
        onClick={handleClick}
        className={styles.headerSubmenuLink}
      >
        <span className={styles.headerSubmenuText}>
          {item.name.replace(/_/g, " ").toUpperCase()}
        </span>
        
        {hasChildren && (
          <span className={styles.headerSubmenuArrowIcon}>
             {window.innerWidth > 768 ? <ChevronRight size={14} /> : (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </span>
        )}
      </Link>
      
      {hasChildren && (
        <div
          className={`${styles.headerSubmenuNested} ${
            isOpen ? styles.visible : "" 
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
  const { user, logout, cart } = useAuth();
  const { categoryTree } = useFirestoreData();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Calculamos la cantidad de items únicos (igual que en FloatingCartButton)
  const cartCount = cart ? cart.length : 0;



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
    <header className={styles.headerKokosHeader}>
      <div className={styles.headerKokosHeaderTop}>
        <div className={styles.headerKokosLogo}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <img
              src={logo}
              alt="Kokos Logo"
              className={styles.headerKokosLogoImg}
            />
          </Link>
        </div>

        <div className={styles.headerKokosSearch}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              id="global-search-input"
              name="search"
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

        <div className={styles.headerKokosActions}>
          {/* BOTÓN CARRITO MODIFICADO */}
          <Link
            to="/cart"
            className={`${styles.headerKokosActionBtn} ${styles.headerKokosCartBtn}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className={styles.headerKokosActionIcon}>
              <CartIcon />
              {/* Badge de contador */}
              {cartCount > 0 && (
                <span className={styles.headerCartBadge}>{cartCount}</span>
              )}
            </span>
            <span className={styles.headerKokosActionText}>Carrito</span>
          </Link>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={styles.headerKokosActionBtn}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles.headerKokosActionIcon}>
                <Settings size={20} />
              </span>
              <span className={styles.headerKokosActionText} style={{ fontWeight: "bold" }}>Panel Admin</span>
            </Link>
          )}

          {user ? (
            <div className={styles.headerKokosUserDropdown}>
              <button className={`${styles.headerKokosActionBtn} ${styles.headerKokosUserBtn}`}>
                <span className={styles.headerKokosActionIcon}>
                  <ProfileIcon />
                </span>
                <span className={styles.headerKokosActionText}>Mi Cuenta</span>
              </button>
              <div className={styles.headerKokosUserMenu}>
                <div className={styles.headerKokosUserMenuHeader}>
                  <span className={styles.headerKokosUserEmailDisplay}>
                    {user.razonSocial}
                  </span>
                </div>
                <Link
                  to="/my-account"
                  className={styles.headerKokosUserMenuItem}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Cuenta
                </Link>
                <Link
                  to="/my-account/orders"
                  className={styles.headerKokosUserMenuItem}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>

                <button
                  onClick={handleLogout}
                  className={`${styles.headerKokosUserMenuItem} ${styles.headerKokosLogout}`}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className={`${styles.headerKokosActionBtn} ${styles.headerKokosLoginBtn}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles.headerKokosActionIcon}>
                <ProfileIcon />
              </span>
              <span className={styles.headerKokosActionText}>Iniciar Sesión</span>
            </Link>
          )}
        </div>

        <button
          className={styles.headerKokosMobileMenuToggle}
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
        className={`${styles.headerKokosMenu} ${
          mobileMenuOpen ? styles.headerKokosMobileOpen : ""
        }`}
      >
        <Link
          to="/"
          className={styles.headerKokosMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          INICIO
        </Link>
        {jugueteriaNode && (
          <div className={styles.headerKokosDropdownMenu}>
            <Link
              to={`/products?categoryId=${jugueteriaNode.id}`}
              className={styles.headerKokosMenuLink}
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
              <div className={styles.headerKokosSubmenu}>
                <div className={styles.headerKokosSubmenuContent}>
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
          className={styles.headerKokosMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          NOSOTROS
        </Link>
        <Link
          to="/novedades"
          className={styles.headerKokosMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          NOVEDADES
        </Link>
        <Link
          to="/contacto"
          className={styles.headerKokosMenuLink}
          onClick={() => setMobileMenuOpen(false)}
        >
          CONTACTO
        </Link>

        {mobileMenuOpen && (
          <div className={styles.headerKokosMobileActions}>
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
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ color: "#d9534f", fontWeight: "bold" }}
                  >
                    Panel Admin
                  </Link>
                )}
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