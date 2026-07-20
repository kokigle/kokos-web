// src/App.jsx
import "./styles/reset-y-base.css";

import React, { useEffect, useState, createContext, useContext, lazy, Suspense } from "react";
import { WhatsappIcon } from "./icons/WhatsappIcon";
import Header from "./Header";
import Footer from "./Footer";
import Login from "./Login";
import ProductsList from "./ProductsList";
import ProductPage from "./ProductPage";
import Home from "./Home";
import ScrollTop from "./ScrollTop";
import FloatingCartButton from "./FloatingCartButton";

// --- Lazy-loaded components (code splitting) ---
const CartPage = lazy(() => import("./CartPage"));
const AdminPanel = lazy(() => import("./AdminPanel"));
const NotFound = lazy(() => import("./NotFound"));
const Nosotros = lazy(() => import("./Nosotros"));
const Register = lazy(() => import("./Register"));
const MyAccount = lazy(() => import("./MyAccount"));
const Contacto = lazy(() => import("./Contacto"));
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "./firebase";

// Re-export db for backward compatibility with existing imports
export { db } from "./firebase";

const LoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '16px' }}>
    <p style={{ color: '#888', fontSize: '16px' }}>Cargando...</p>
  </div>
);

// --- CONTEXTO DE AUTENTICACIÓN Y CARRITO ---
export const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export const formatMoney = (n) =>
  `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

// --- COMPONENTE PRINCIPAL DE LA APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);

  // Cargar usuario y carrito desde localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("kokos_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("kokos_user");
      }
    }

    const savedCart = localStorage.getItem("wh_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("wh_cart");
      }
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("wh_cart", JSON.stringify(cart));
  }, [cart]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      const q = query(collection(db, "clients"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        const clientData = { id: clientDoc.id, ...clientDoc.data() };

        if (clientData.status === "pendiente") {
          await auth.signOut();
          return {
            success: false,
            message: "Tu cuenta está pendiente de aprobación.",
          };
        }

        setUser(clientData);
        localStorage.setItem("kokos_user", JSON.stringify(clientData));
        return { success: true, client: clientData };
      }
      return { success: false, message: "Usuario no encontrado" };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]); // Limpiar estado del carrito
    localStorage.removeItem("kokos_user");
    localStorage.removeItem("wh_cart"); // Limpiar localStorage
  };

  // --- FUNCIONES DEL CARRITO ---
  const addToCart = (product, qty) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      } else {
        return [...prevCart, { ...product, qty }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const changeCartQty = (productId, newQty) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const validQty = Math.max(item.cant_min || 1, Number(newQty) || 1);
          return { ...item, qty: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    setUser,
    cart,
    addToCart,
    removeFromCart,
    changeCartQty,
    clearCart,
  };

  return (
    <AuthContext.Provider value={value}>
      <Router>
        <ScrollTop />
        <Header />
        <main>
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/my-account/*" element={<MyAccount />} />
          </Routes>
          </Suspense>
          <FloatingCartButton />
          <a
            href="https://wa.me/5491145457891?text=Hola!%20Quisiera%20consultar%20sobre%20sus%20productos."
            className="whatsapp-fab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <WhatsappIcon style={{ width: 32, height: 32 }} />
          </a>
        </main>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}
