// App.jsx
import "./styles/reset-y-base.css";

import React, { useEffect, useState, createContext, useContext } from "react";
import { WhatsappIcon } from "./icons/WhatsappIcon";
import Header from "./Header";
import Footer from "./Footer";
import Login from "./Login";
import SetPassword from "./SetPassword";
import ProductsList from "./ProductsList";
import ProductPage from "./ProductPage";
import CartPage from "./CartPage";
import AdminPanel from "./AdminPanel";
import NotFound from "./NotFound";
import Home from "./Home";
import Nosotros from "./Nosotros";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// ----------------------
// CONFIG
// ----------------------
const firebaseConfig = {
  apiKey: "AIzaSyCum5WobSVztOyPE5fijSt4Edrig2k00v8",
  authDomain: "kokos-web.firebaseapp.com",
  projectId: "kokos-web",
  storageBucket: "kokos-web.firebasestorage.app",
  messagingSenderId: "714849880120",
  appId: "1:714849880120:web:ce985c1ce79ab668b33ecd",
  measurementId: "G-SX009W4G8Z",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Contexto
export const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export const formatMoney = (n) =>
  `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

// ----------------------
// App principal
// ----------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restaurar usuario de localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("kokos_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("kokos_user");
      }
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("email", "==", email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docu = snap.docs[0];
      const data = docu.data();
      const client = { id: docu.id, ...data };

      if (!data.hasPassword) {
        setLoading(false);
        return { success: false, setPassword: true, client };
      } else {
        try {
          const auth = getAuth();
          await signInWithEmailAndPassword(auth, email, password);

          setUser(client);
          localStorage.setItem("kokos_user", JSON.stringify(client));
          setLoading(false);
          return { success: true, client };
        } catch {
          setLoading(false);
          return { success: false, message: "Contraseña incorrecta." };
        }
      }
    }

    setLoading(false);
    return { success: false, message: "No estás registrado." };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kokos_user"); // ✅ limpio localStorage
  };

  const value = { user, login, logout, loading, setUser };

  return (
    <AuthContext.Provider value={value}>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <div className="container">
                  <Login />
                </div>
              }
            />
            <Route
              path="/products"
              element={
                <div className="container">
                  <ProductsList />
                </div>
              }
            />
            <Route
              path="/product/:id"
              element={
                <div className="container">
                  <ProductPage />
                </div>
              }
            />
            <Route
              path="/cart"
              element={
                <div className="container">
                  <CartPage />
                </div>
              }
            />
            <Route
              path="/admin"
              element={
                <div className="container">
                  <AdminPanel />
                </div>
              }
            />
            <Route
              path="/nosotros"
              element={
                <div className="container">
                  <Nosotros />
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div className="container">
                  <NotFound />
                </div>
              }
            />
            <Route
              path="/set-password"
              element={
                <div className="container">
                  <SetPassword />
                </div>
              }
            />
          </Routes>
          {/* Botón de WhatsApp siempre fijo */}
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
