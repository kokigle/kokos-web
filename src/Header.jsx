// Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="kokos-header">
      <div className="kokos-header-top">
        <div className="kokos-logo">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
          </Link>
        </div>

        <div className="kokos-search">
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

        <div className="kokos-actions">
          <Link
            to="/cart"
            className="action-btn cart-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="action-icon">
              <CartIcon />
            </span>
            <span className="action-text">Carrito</span>
          </Link>

          {user ? (
            <div className="user-dropdown">
              <button className="action-btn user-btn">
                <span className="action-icon">
                  <ProfileIcon />
                </span>
                <span className="action-text">Mi Cuenta</span>
              </button>
              <div className="user-menu">
                <div className="user-menu-header">
                  <span className="user-email-display">{user.email}</span>
                </div>
                <Link
                  to="/orders"
                  className="user-menu-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className="user-menu-item logout"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="action-btn login-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="action-icon">
                <ProfileIcon />
              </span>
              <span className="action-text">Iniciar Sesión</span>
            </Link>
          )}
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav className={`kokos-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <Link
          to="/"
          className="menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          INICIO
        </Link>
        <div className="menu-item dropdown-menu">
          <Link
            to="/products?category=jugueteria"
            className="menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            JUGUETERÍA
          </Link>
          {subcategories.length > 0 && (
            <div className="submenu">
              <div className="submenu-content">
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
          className="menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          NOSOTROS
        </Link>
        <Link
          to="/novedades"
          className="menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          NOVEDADES
        </Link>
        <Link
          to="/contacto"
          className="menu-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          CONTACTO
        </Link>
      </nav>
    </header>
  );
}
