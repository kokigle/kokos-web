// CartPage.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "./App";
import { db, formatMoney } from "./App";
import emailjs from "@emailjs/browser";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import "./styles/cart-page.css";

const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

// Placeholder local que siempre funciona
const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Cpath fill='%23999' d='M30 35h40v5H30zm0 15h40v5H30zm0 15h25v5H30z'/%3E%3Ccircle fill='%23ddd' cx='50' cy='25' r='8'/%3E%3C/svg%3E";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true);
      setError(null);
      const cartParam = searchParams.get("cart");

      if (cartParam) {
        try {
          const decodedItems = cartParam
            .split(",")
            .map((item) => {
              const [id, qty] = item.split(":");
              return { id, qty: Number(qty) };
            })
            .filter((item) => item.id && item.qty > 0);

          if (!user) {
            setCart(decodedItems);
            setIsLoading(false);
            return;
          }

          const productPromises = decodedItems.map((item) =>
            getDoc(doc(db, "products", item.id))
          );
          const productSnapshots = await Promise.all(productPromises);
          const hydratedCart = productSnapshots
            .map((snapshot, index) => {
              if (snapshot.exists()) {
                const productData = snapshot.data();
                const price =
                  user?.state === 2
                    ? productData.price_state2
                    : productData.price_state1;
                return {
                  id: snapshot.id,
                  name: productData.name,
                  price,
                  qty: decodedItems[index].qty,
                  cant_min: productData.cant_min || 1,
                  image: productData.multimedia?.[0] || null,
                };
              }
              return null;
            })
            .filter(Boolean);
          setCart(hydratedCart);
          localStorage.setItem("wh_cart", JSON.stringify(hydratedCart));
        } catch (e) {
          console.error("Fallo al parsear o buscar el carrito desde la URL", e);
          setError("No se pudo cargar el carrito compartido.");
          localStorage.removeItem("wh_cart");
        }
      } else {
        try {
          const raw = localStorage.getItem("wh_cart");
          const localCart = raw ? JSON.parse(raw) : [];
          if (!user) {
            const cartWithoutPrices = localCart.map(
              ({ price, ...rest }) => rest
            );
            setCart(cartWithoutPrices);
          } else {
            setCart(localCart);
          }
        } catch {
          setCart([]);
        }
      }
      setIsLoading(false);
    };
    initializeCart();
  }, [searchParams, user]);

  useEffect(() => {
    if (isLoading) return;

    if (cart.length > 0) {
      const encodedCart = cart
        .map((item) => `${item.id}:${item.qty}`)
        .join(",");
      // No usar navigate aquí para evitar loops
      window.history.replaceState(null, "", `?cart=${encodedCart}`);
      if (user) {
        localStorage.setItem("wh_cart", JSON.stringify(cart));
      }
    } else {
      window.history.replaceState(null, "", "/cart");
      localStorage.removeItem("wh_cart");
    }

    // Disparar eventos para actualizar el botón flotante
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("storage"));
  }, [cart, isLoading, user]);

  const remove = (id) => {
    setCart((c) => c.filter((x) => x.id !== id));
  };

  const changeQty = (id, qty) => {
    setCart((c) =>
      c.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(item.cant_min || 1, Number(qty) || 1);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const shareCart = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyToast(true);
    setTimeout(() => {
      setShowCopyToast(false);
    }, 3000);
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
    setCart([]);
  };

  const total = cart.reduce((s, it) => s + it.qty * (it.price || 0), 0);

  if (isLoading) {
    return (
      <div className="cart-page-container">
        <div className="cart-page-loading">
          <div className="cart-page-spinner"></div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );
  }

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
            Explorar productos
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
              {/* ✨ IMAGEN CLICKEABLE */}
              <Link
                to={`/product/${it.id}`}
                className="cart-page-item-image-link"
              >
                <img
                  src={it.image || DEFAULT_PRODUCT_IMAGE}
                  alt={it.name || "Producto"}
                  className="cart-page-item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PRODUCT_IMAGE;
                  }}
                />
              </Link>

              <div className="cart-page-item-details">
                <div className="cart-page-item-info">
                  {/* ✨ NOMBRE CLICKEABLE */}
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
                    <label className="cart-page-quantity-label">
                      Cantidad:
                    </label>
                    <div className="cart-page-quantity-controls">
                      <button
                        className="cart-page-quantity-btn"
                        onClick={() =>
                          changeQty(it.id, Math.max(1, it.qty - 1))
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={it.cant_min || 1}
                        value={it.qty}
                        onChange={(e) =>
                          changeQty(it.id, Math.max(1, Number(e.target.value)))
                        }
                        className="cart-page-quantity-input"
                      />
                      <button
                        className="cart-page-quantity-btn"
                        onClick={() => changeQty(it.id, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-page-item-subtotal">
                    <span className="cart-page-subtotal-label">Subtotal:</span>
                    <span className="cart-page-subtotal-amount">
                      ${formatMoney(it.price * it.qty)}
                    </span>
                  </div>

                  <button
                    onClick={() => remove(it.id)}
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
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
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
                ${formatMoney(total)}
              </span>
            </div>

            <div className="cart-page-summary-note">💼 Compra mayorista</div>

            <button onClick={checkout} className="cart-page-checkout-btn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Finalizar compra
            </button>

            <button onClick={shareCart} className="cart-page-share-btn">
              🔗 Compartir Carrito
            </button>

            <Link to="/products" className="cart-page-continue-shopping">
              ← Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <h2 className="cart-page-title">
          <svg
            className="cart-page-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Mi Carrito
        </h2>
        <div className="cart-page-items-count">
          {cart.length} {cart.length === 1 ? "producto" : "productos"}
        </div>
      </div>

      {error && <div className="cart-page-error">{error}</div>}
      {!error && renderContent()}

      {showCopyToast && (
        <div className="cart-page-toast">
          ✅ ¡Enlace del carrito copiado al portapapeles!
        </div>
      )}
    </div>
  );
}
