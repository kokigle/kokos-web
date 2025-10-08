// FloatingCartButton.jsx
// Componente Global con todas las mejoras y correcciones

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./App";
import "./styles/floating-cart-button.css";

export default function FloatingCartButton() {
  const [cart, setCart] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const updateCart = () => {
      // Si no hay usuario, limpiar el carrito
      if (!user) {
        localStorage.removeItem("wh_cart");
        setCart([]);
        return;
      }

      const raw = localStorage.getItem("wh_cart");
      const cartData = raw ? JSON.parse(raw) : [];

      // Validar que el carrito tenga items válidos
      const validCart = cartData.filter(
        (item) => item && item.id && item.qty > 0
      );

      setCart(validCart);
    };

    updateCart();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updateCart();
    };

    window.addEventListener("storage", handleStorageChange);

    // Escuchar evento personalizado para cambios en la misma pestaña
    window.addEventListener("cartUpdated", handleStorageChange);

    // Polling reducido solo para casos extremos
    const interval = setInterval(updateCart, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  // Efecto para animación de entrada
  useEffect(() => {
    if (cart.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [cart]);

  // CORRECCIÓN: Contar productos únicos, no cantidades totales
  const uniqueProductsCount = cart.length;
  const totalUnitsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // No mostrar si:
  // - No hay usuario
  // - Estamos en la página del carrito
  // - No hay productos
  // - Estamos en login/register
  const hiddenRoutes = ["/cart", "/login", "/register", "/checkout"];
  const shouldHide =
    !user || hiddenRoutes.includes(location.pathname) || cart.length === 0;

  if (shouldHide) return null;

  return (
    <Link
      to="/cart"
      className={`floating-cart-button ${
        isVisible ? "floating-cart-visible" : ""
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
