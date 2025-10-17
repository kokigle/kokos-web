// src/CartPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, db, formatMoney } from "./App";
import emailjs from "@emailjs/browser";
import { collection, addDoc } from "firebase/firestore";
import "./styles/cart-page.css";

const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

const DEFAULT_PRODUCT_IMAGE = "data:image/svg+xml,..."; // (Tu placeholder SVG)

export default function CartPage() {
  const { user, cart, removeFromCart, changeCartQty, clearCart } = useAuth();
  const [showCopyToast, setShowCopyToast] = useState(false);

  const shareCart = () => {
    const encodedCart = cart.map((item) => `${item.id}:${item.qty}`).join(",");
    const url = `${window.location.origin}/cart?cart=${encodedCart}`;
    navigator.clipboard.writeText(url);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  const checkout = async () => {
    if (!user) return alert("Debes iniciar sesión para comprar.");
    const order = {
      clientEmail: user.email,
      clientId: user.id,
      items: cart,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, order);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: user.email,
          order_id: docRef.id,
          client_email: user.email,
          order_json: JSON.stringify(cart, null, 2),
        },
        EMAILJS_USER_ID
      );
    } catch (e) {
      console.warn("EmailJS send failed: ", e);
    }

    alert("Pedido creado exitosamente. Recibirás un correo de confirmación.");
    clearCart();
  };

  const total = cart.reduce((s, it) => s + it.qty * (it.price || 0), 0);

  const renderContent = () => {
    if (cart.length === 0) {
      return (
        <div className="cart-page-empty">
          <svg
            className="cart-page-empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3 className="cart-page-empty-title">Tu carrito está vacío</h3>
          <p className="cart-page-empty-text">
            Agrega productos para comenzar tu compra mayorista
          </p>
          <Link to="/products" className="cart-page-empty-link">
            Añadir productos
          </Link>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="cart-page-login-prompt">
          <svg
            className="cart-page-login-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3 className="cart-page-login-title">
            Inicia sesión para ver tu carrito
          </h3>
          <p className="cart-page-login-text">
            Los precios y detalles de tu pedido son exclusivos para clientes
            mayoristas.
          </p>
          <Link to="/login" className="cart-page-login-btn">
            Iniciar Sesión
          </Link>
        </div>
      );
    }
    return (
      <div className="cart-page-content">
        <div className="cart-page-items">
          {cart.map((it) => (
            <div key={it.id} className="cart-page-item">
              <Link
                to={`/product/${it.id}`}
                className="cart-page-item-image-link"
              >
                <img
                  src={it.image || DEFAULT_PRODUCT_IMAGE}
                  alt={it.name || "Producto"}
                  className="cart-page-item-image"
                  onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                />
              </Link>
              <div className="cart-page-item-details">
                <div className="cart-page-item-info">
                  <Link
                    to={`/product/${it.id}`}
                    className="cart-page-item-name-link"
                  >
                    <h3 className="cart-page-item-name">
                      {it.name || "Cargando..."}
                    </h3>
                  </Link>
                  <div className="cart-page-item-price">
                    ${formatMoney(it.price)}
                    <span className="cart-page-item-price-label">
                      {" "}
                      por unidad
                    </span>
                  </div>
                </div>
                <div className="cart-page-item-actions">
                  <div className="cart-page-item-quantity">
                    <div className="cart-page-quantity-controls">
                      <button
                        className="cart-page-quantity-btn"
                        onClick={() => changeCartQty(it.id, it.qty - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={it.cant_min || 1}
                        value={it.qty}
                        onChange={(e) => changeCartQty(it.id, e.target.value)}
                        className="cart-page-quantity-input"
                      />
                      <button
                        className="cart-page-quantity-btn"
                        onClick={() => changeCartQty(it.id, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-page-item-subtotal">
                    <span className="cart-page-subtotal-amount">
                      ${formatMoney(it.price * it.qty)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(it.id)}
                    className="cart-page-remove-btn"
                    title="Eliminar producto"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-page-summary">
          <div className="cart-page-summary-card">
            <h3 className="cart-page-summary-title">Resumen de compra</h3>
            <div className="cart-page-summary-row">
              <span>
                Subtotal ({cart.length}{" "}
                {cart.length === 1 ? "producto" : "productos"})
              </span>
              <span>${formatMoney(total)}</span>
            </div>
            <div className="cart-page-summary-divider"></div>
            <div className="cart-page-summary-total">
              <span>Total</span>
              <span className="cart-page-total-amount">
                ${formatMoney(total)} + IVA
              </span>
            </div>
            <button onClick={checkout} className="cart-page-checkout-btn">
              Finalizar compra
            </button>
            <button onClick={shareCart} className="cart-page-share-btn">
              🔗 Compartir Carrito
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <h2 className="cart-page-title">Mi Carrito</h2>
      </div>
      {renderContent()}
      {showCopyToast && (
        <div className="cart-page-toast">✅ ¡Enlace del carrito copiado!</div>
      )}
    </div>
  );
}
