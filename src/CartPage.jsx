import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, db, formatMoney } from "./App";
import { collection, addDoc } from "firebase/firestore";
import styles from "./styles/cart-page.module.css";

const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

const DEFAULT_PRODUCT_IMAGE = "data:image/svg+xml,...";

export default function CartPage() {
  const { user, cart, removeFromCart, changeCartQty, clearCart } = useAuth();
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const shareCart = () => {
    const encodedCart = cart.map((item) => `${item.id}:${item.qty}`).join(",");
    const url = `${window.location.origin}/cart?cart=${encodedCart}`;
    navigator.clipboard.writeText(url);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  const handleCheckoutClick = () => {
    if (!user) return alert("Debes iniciar sesión para comprar.");
    setShowConfirmModal(true);
  };

  const confirmCheckout = async () => {
    setIsProcessing(true);
    try {
      const order = {
        clientEmail: user.email,
        clientId: user.id,
        items: cart.map((item) => ({
          ...item,
          finalPrice: item.price * (1 - (user.descuento || 0) / 100),
        })),
        comments: comments.trim() || "",
        createdAt: new Date().toISOString(),
        status: "pending",
        discountApplied: user.descuento || 0,
      };

      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, order);

      try {
        const { default: emailjs } = await import("@emailjs/browser");
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: user.email,
            order_id: docRef.id,
            client_email: user.email,
            order_json: JSON.stringify(cart, null, 2),
            comments: comments.trim() || "Sin comentarios",
          },
          EMAILJS_USER_ID
        );
      } catch (e) {
        console.warn("EmailJS send failed: ", e);
      }

      setShowConfirmModal(false);
      alert(
        "¡Pedido creado exitosamente! Recibirás un correo de confirmación."
      );
      setComments("");
      clearCart();
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      alert(
        "Hubo un error al procesar tu pedido. Por favor, intenta nuevamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelCheckout = () => {
    setShowConfirmModal(false);
  };

  const total = cart.reduce((s, it) => {
    const discountedPrice = it.price * (1 - (user?.descuento || 0) / 100);
    return s + it.qty * discountedPrice;
  }, 0);

  const renderContent = () => {
    if (cart.length === 0) {
      return (
        <div className={styles.cartPageEmpty}>
          <svg
            className={styles.cartPageEmptyIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h3 className={styles.cartPageEmptyTitle}>Tu carrito está vacío</h3>
          <p className={styles.cartPageEmptyText}>
            Agrega productos para comenzar tu compra mayorista
          </p>
          <Link to="/products" className={styles.cartPageEmptyLink}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Añadir productos
          </Link>
        </div>
      );
    }

    if (!user) {
      return (
        <div className={styles.cartPageLoginPrompt}>
          <svg
            className={styles.cartPageLoginIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3 className={styles.cartPageLoginTitle}>
            Inicia sesión para ver tu carrito
          </h3>
          <p className={styles.cartPageLoginText}>
            Los precios y detalles de tu pedido son exclusivos para clientes
            mayoristas.
          </p>
          <Link to="/login" className={styles.cartPageLoginBtn}>
            Iniciar Sesión
          </Link>
        </div>
      );
    }

    return (
      <div className={styles.cartPageContent}>
        <div className={styles.cartPageItemsContainer}>
          <div className={styles.cartPageStickyHeader}>
            <div className={styles.cartHeaderImage}></div>
            <div className={styles.cartHeaderDesc}>Cod. y Desc.</div>
            <div className={styles.cartHeaderQty}>Cantidad</div>
            <div className={styles.cartHeaderPrice}>Precio Unit.</div>
            <div className={styles.cartHeaderDiscount}>Desc.</div>
            <div className={styles.cartHeaderSubtotal}>Subtotal</div>
            <div className={styles.cartHeaderActions}></div>
          </div>
          <div className={styles.cartPageItems}>
            {cart.map((it) => {
              const discountedPrice =
                it.price * (1 - (user?.descuento || 0) / 100);
              const subtotal = discountedPrice * it.qty;
              return (
                <div key={it.id} className={styles.cartPageItem}>
                  <div className={styles.cartItemImage}>
                    <Link
                      to={`/product/${it.id}`}
                      className={styles.cartPageItemImageLink}
                    >
                      <img
                        src={it.image || DEFAULT_PRODUCT_IMAGE}
                        alt={it.name || "Producto"}
                        className={styles.cartPageItemImage}
                        onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                      />
                    </Link>
                  </div>
                  <div className={styles.cartItemDesc}>
                    <small>Código: {it.code}</small>
                    <Link
                      to={`/product/${it.id}`}
                      className={styles.cartPageItemNameLink}
                    >
                      <h3 className={styles.cartPageItemName}>
                        {it.name || "Cargando..."}
                      </h3>
                    </Link>
                  </div>

                  <div className={styles.cartItemQty}>
                    <div className={styles.cartPageQuantityControls}>
                      <button
                        className={styles.cartPageQuantityBtn}
                        onClick={() => changeCartQty(it.id, it.qty - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={it.cant_min || 1}
                        value={it.qty}
                        onChange={(e) => changeCartQty(it.id, e.target.value)}
                        className={styles.cartPageQuantityInput}
                      />
                      <button
                        className={styles.cartPageQuantityBtn}
                        onClick={() => changeCartQty(it.id, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className={styles.cartItemPrice}>
                    ${formatMoney(it.price)}
                  </div>
                  <div className={styles.cartItemDiscount}>
                    {user?.descuento || 0}%
                  </div>
                  <div className={styles.cartItemSubtotal}>
                    ${formatMoney(subtotal)}
                  </div>
                  <div className={styles.cartItemActions}>
                    <button
                      onClick={() => removeFromCart(it.id)}
                      className={styles.cartPageRemoveBtn}
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
              );
            })}
          </div>
        </div>
        <div className={styles.cartPageSummary}>
          <div className={styles.cartPageSummaryCard}>
            <h3 className={styles.cartPageSummaryTitle}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Resumen de compra
            </h3>

            <div className={styles.cartPageSummaryRow}>
              <span>
                Subtotal ({cart.length}{" "}
                {cart.length === 1 ? "producto" : "productos"})
              </span>
              <span>${formatMoney(total)}</span>
            </div>

            {user?.descuento > 0 && (
              <div className={styles.cartPageDiscountBadge}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Descuento aplicado: {user.descuento}%
              </div>
            )}

            <div className={styles.cartPageSummaryDivider}></div>

            <div className={styles.cartPageSummaryTotal}>
              <span>Total</span>
              <span className={styles.cartPageTotalAmount}>
                ${formatMoney(total)}
              </span>
            </div>

            <div className={styles.cartPageTaxNote}>+ IVA</div>

            <div className={styles.cartPageCommentsSection}>
              <label
                htmlFor="order-comments"
                className={styles.cartPageCommentsLabel}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Comentarios o aclaraciones
              </label>
              <textarea
                id="order-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ej: Necesito entrega urgente, horario de recepción preferido, instrucciones especiales..."
                className={styles.cartPageCommentsTextarea}
                maxLength={500}
              />
              <div className={styles.cartPageCommentsCounter}>
                {comments.length}/500 caracteres
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className={styles.cartPageCheckoutBtn}
              disabled={isProcessing}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {isProcessing ? "Procesando..." : "Finalizar compra"}
            </button>

            <button onClick={shareCart} className={styles.cartPageShareBtn}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Compartir Carrito
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.cartPageContainer}>
      <div className={styles.cartPageHeader}>
        <h2 className={styles.cartPageTitle}>
          <svg
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
        {cart.length > 0 && user && (
          <div className={styles.cartPageHeaderInfo}>
            <span className={styles.cartPageItemsBadge}>
              {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
          </div>
        )}
      </div>
      {renderContent()}

      {showCopyToast && (
        <div className={styles.cartPageToast}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          ¡Enlace del carrito copiado!
        </div>
      )}

      {showConfirmModal && (
        <div className={styles.cartModalOverlay} onClick={cancelCheckout}>
          <div
            className={styles.cartModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cartModalHeader}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3>Confirmar pedido</h3>
            </div>
            <div className={styles.cartModalBody}>
              <p>¿Estás seguro de que querés finalizar este pedido?</p>
              <div className={styles.cartModalSummary}>
                <div className={styles.cartModalSummaryRow}>
                  <span>Total de productos:</span>
                  <strong>{cart.length}</strong>
                </div>
                <div className={styles.cartModalSummaryRow}>
                  <span>Monto total:</span>
                  <strong className={styles.cartModalTotalHighlight}>
                    ${formatMoney(total)} + IVA
                  </strong>
                </div>
                {comments.trim() && (
                  <div className={styles.cartModalComments}>
                    <span>Comentarios:</span>
                    <p>"{comments}"</p>
                  </div>
                )}
              </div>
              <p className={styles.cartModalNote}>
                Recibirás un correo de confirmación con los detalles de tu
                pedido.
              </p>
            </div>
            <div className={styles.cartModalActions}>
              <button
                onClick={cancelCheckout}
                className={styles.cartModalBtnCancel}
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={confirmCheckout}
                className={styles.cartModalBtnConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className={styles.cartModalSpinner}></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirmar pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
