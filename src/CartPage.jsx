// CartPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./App";
import { db, formatMoney } from "./App";
import emailjs from "@emailjs/browser";
import { collection, addDoc } from "firebase/firestore";

export default function CartPage() {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("wh_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem("wh_cart", JSON.stringify(cart));
  }, [cart]);

  const remove = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const changeQty = (id, qty) =>
    setCart((c) => c.map((x) => (x.id === id ? { ...x, qty } : x)));

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
    localStorage.removeItem("wh_cart");
  };

  const total = cart.reduce((s, it) => s + it.qty * (it.price || 0), 0);

  return (
    <div>
      <h2>Carrito</h2>
      {cart.length === 0 ? (
        <div>
          El carrito está vacío. <Link to="/products">Ver productos</Link>
        </div>
      ) : (
        <div>
          {cart.map((it) => (
            <div
              key={it.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <div>
                <div>{it.name}</div>
                <div>
                  ${formatMoney(it.price)} x {it.qty}
                </div>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  value={it.qty}
                  onChange={(e) => changeQty(it.id, Number(e.target.value))}
                />
                <button onClick={() => remove(it.id)} className="btn">
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <div>
            <strong>Total: ${formatMoney(total)}</strong>
          </div>
          <button onClick={checkout} className="btn">
            Finalizar compra
          </button>
        </div>
      )}
    </div>
  );
}
