// Header.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./App";
import { db } from "./App";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "./assets/logo.png";

export default function Header() {
  const { user, logout } = useAuth();
  const [subcategories, setSubcategories] = useState([]);

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

  return (
    <header className="kokos-header">
      <div className="kokos-header-top">
        <div className="kokos-logo">
          <Link to="/">
            <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
          </Link>
        </div>
        <div className="kokos-account">
          <Link to="/cart" className="cart-link">
            MI CARRITO 🛒
          </Link>
          {user ? (
            <div>
              {user.email}{" "}
              <button onClick={logout} className="logout-btn">
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">
              CREAR CUENTA / INICIAR SESIÓN
            </Link>
          )}
          <div className="kokos-search">
            <form>
              <input type="text" placeholder="BUSCAR" />
              <button type="submit">🔍</button>
            </form>
          </div>
        </div>
      </div>
      <nav className="kokos-menu">
        <div className="menu-item">
          <Link to="/products?category=jugueteria">JUGUETERÍA</Link>
          <div className="submenu">
            {subcategories.map((sub) => (
              <Link
                key={sub}
                to={`/products?category=jugueteria&subcategory=${sub}`}
              >
                {sub.replace(/_/g, " ").toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        <Link to="/nosotros">NOSOTROS</Link>
        <Link to="/novedades">NOVEDADES</Link>
        <Link to="/contacto">CONTACTO</Link>
      </nav>
    </header>
  );
}
