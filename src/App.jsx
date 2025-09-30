//TODO: Separar en ProductsList.jsx, ProductPage.jsx, CartPage.jsx, AdminPanel.jsx, SetPassword.jsx, Login.jsx, NotFound.jsx, Header.jsx, Footer.jsx.
// App.jsx
import React, { useEffect, useState, createContext, useContext } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Login from "./Login";
import SetPassword from "./SetPassword";
import ProductsList from "./ProductsList";
import ProductPage from "./ProductPage";
import CartPage from "./CartPage";
import AdminPanel from "./AdminPanel";
import NotFound from "./NotFound";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import emailjs from "@emailjs/browser";
import { uploadImage } from "./cloudinary";
import logo from "./assets/logo.png";
import banner from "./assets/banner.png";
import smallImg from "./assets/smallImg.png";
import bigImg from "./assets/bigImg.png";
import img1 from "./assets/img1.png";
import img2 from "./assets/img2.png";
import img3 from "./assets/img3.png";
import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaLock } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

const GOOGLE_FORM_LINK = "https://forms.gle/YOUR_FORM_LINK";
const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

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
        </main>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}

function Home() {
  return (
    <div className="kokos-home">
      {/* Fila 1: Banner */}
      <section className="home-banner">
        <img src={banner} alt="Banner Kokos" className="banner-img" />
      </section>

      {/* Fila 2: Imagen pequeña centrada */}
      <section className="home-row2">
        <img src={smallImg} alt="Imagen pequeña" className="small-img" />
      </section>

      {/* Fila 3: 3 columnas con imágenes */}
      <section className="home-row3">
        <div className="img-grid">
          <img src={img1} alt="Imagen 1" />
          <img src={img2} alt="Imagen 2" />
          <img src={img3} alt="Imagen 3" />
        </div>
      </section>

      {/* Fila 4: Imagen centrada */}
      <section className="home-row4">
        <img src={bigImg} alt="Imagen grande" className="big-img" />
      </section>
    </div>
  );
}
