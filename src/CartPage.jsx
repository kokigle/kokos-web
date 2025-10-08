// CartPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "./App";
import { db, formatMoney } from "./App";
import emailjs from "@emailjs/browser";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import "./styles/cart-page.css";

const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
                  // ✨ NUEVO: Añadimos la imagen desde Firestore
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

  // ... (El resto de la lógica y funciones se mantienen igual)

  useEffect(() => {
    if (isLoading) return;

    if (cart.length > 0) {
      const encodedCart = cart
        .map((item) => `${item.id}:${item.qty}`)
        .join(",");
      navigate(`?cart=${encodedCart}`, { replace: true });
      if (user) {
        localStorage.setItem("wh_cart", JSON.stringify(cart));
      }
    } else {
      navigate("/cart", { replace: true });
      localStorage.removeItem("wh_cart");
    }
  }, [cart, navigate, isLoading, user]);

  const remove = (id) => setCart((c) => c.filter((x) => x.id !== id));

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
    alert("Pedido creado.");
    setCart([]);
  };

  const total = cart.reduce((s, it) => s + it.qty * (it.price || 0), 0);

  if (isLoading) {
    return (
      <div className="cart-page-container">
        <div className="cart-page-loading">
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
            Agrega productos para comenzar tu compra
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
            Los precios y detalles de tu pedido son exclusivos para clientes.
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
              {/* ✨ IMAGEN DEL PRODUCTO */}
              <img
                src={it.image || "https://via.placeholder.com/100"} // Placeholder si no hay imagen
                alt={it.name}
                className="cart-page-item-image"
              />
              <div className="cart-page-item-details">
                <div className="cart-page-item-info">
                  <h3 className="cart-page-item-name">
                    {it.name || "Cargando..."}
                  </h3>
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
                    <input
                      type="number"
                      min={it.cant_min || 1}
                      value={it.qty}
                      onChange={(e) => changeQty(it.id, e.target.value)}
                      className="cart-page-quantity-input"
                    />
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
            <button onClick={checkout} className="cart-page-checkout-btn">
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
          ¡Enlace del carrito copiado al portapapeles!
        </div>
      )}
    </div>
  );
}
