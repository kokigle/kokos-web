// src/FloatingCartButton.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./App";
import "./styles/floating-cart-button.css";

export default function FloatingCartButton() {
  const { user, cart } = useAuth(); // Obtenemos el carrito directamente del contexto
  const location = useLocation();

  const uniqueProductsCount = cart.length;
  const totalUnitsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // No mostrar si no hay usuario, estamos en el carrito, o el carrito está vacío
  const hiddenRoutes = ["/cart", "/login", "/register", "/checkout"];
  const shouldHide =
    !user || hiddenRoutes.includes(location.pathname) || cart.length === 0;

  if (shouldHide) {
    return null;
  }

  return (
    <Link
      to="/cart"
      className={`floating-cart-button ${
        uniqueProductsCount > 0 ? "floating-cart-visible" : ""
      }`}
      aria-label={`Ver carrito con ${uniqueProductsCount} productos`}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span
        className="floating-cart-badge"
        title={`${totalUnitsCount} unidades totales`}
      >
        {uniqueProductsCount}
      </span>
      <span className="floating-cart-text">
        {uniqueProductsCount === 1
          ? "1 producto"
          : `${uniqueProductsCount} productos`}
      </span>
    </Link>
  );
}
