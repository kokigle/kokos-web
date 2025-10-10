// Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./App";
import { db } from "./App";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "./assets/logo.png";
import { Search } from "./icons/SearchIcon.jsx";
import "./styles/header-kokos.css";
import { ProfileIcon } from "./icons/ProfileIcon";
import { CartIcon } from "./icons/CartIcon.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const [subcategories, setSubcategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null); // Para manejar el dropdown móvil

  useEffect(() => {
    const col = collection(db, "products");
    const q = query(col, where("category", "==", "jugueteria"));
    const unsub = onSnapshot(q, (snap) => {
      const uniqueSubs = new Set();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.subcategory) uniqueSubs.add(data.subcategory);
      });
      setSubcategories([...uniqueSubs]);
    });
    return () => unsub();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Obtener parámetros actuales de la URL
      const params = new URLSearchParams(location.search);

      // Mantener la categoría si existe
      const category = params.get("category");

      // Crear nuevos parámetros con la búsqueda
      const newParams = new URLSearchParams();
      if (category) {
        newParams.set("category", category);
      }
      newParams.set("search", searchQuery.trim());

      // Navegar a products con los parámetros
      navigate(`/products?${newParams.toString()}`);
      setSearchQuery("");
      setMobileMenuOpen(false); // Cierra el menú móvil después de buscar
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    localStorage.removeItem("wh_cart");
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("storage"));
  };

  const toggleMobileDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

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
        <div
          className={`header-kokos-dropdown-menu ${
            activeDropdown === "jugueteria" ? "header-kokos-active" : ""
          }`}
        >
          <Link
            to="/products?category=jugueteria"
            className="header-kokos-menu-link"
            onClick={(e) => {
              // Previene la navegación inmediata en móvil para abrir el dropdown
              if (window.innerWidth <= 768 && subcategories.length > 0) {
                e.preventDefault();
                toggleMobileDropdown("jugueteria");
              } else {
                setMobileMenuOpen(false);
              }
            }}
          >
            JUGUETERÍA
          </Link>
          {subcategories.length > 0 && (
            <div className="header-kokos-submenu">
              <div className="header-kokos-submenu-content">
                {subcategories.map((sub) => (
                  <Link
                    key={sub}
                    to={`/products?category=jugueteria&subcategory=${encodeURIComponent(
                      sub
                    )}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {sub.replace(/_/g, " ").toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
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
      </nav>
    </header>
  );
}
