// App.jsx
import React, { useEffect, useState, createContext, useContext } from "react";
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
const db = getFirestore(app);

// Contexto
const AuthContext = createContext();
function useAuth() {
  return useContext(AuthContext);
}

const formatMoney = (n) =>
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

// ----------------------
// Header
// ----------------------
function Header() {
  const { user, logout } = useAuth();
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    const col = collection(db, "products");
    const q = query(col, where("category", "==", "jugueteria"));
    const unsub = onSnapshot(q, (snap) => {
      const uniqueSubs = new Set();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.subcategory) uniqueSubs.add(data.subcategory);
      });
      setSubcategories([...uniqueSubs]);
    });
    return () => unsub();
  }, []);

  return (
    <header className="kokos-header">
      <div className="kokos-header-top">
        <div className="kokos-logo">
          <Link to="/">
            <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
          </Link>
        </div>
        <div className="kokos-account">
          <Link to="/cart" className="cart-link">
            MI CARRITO 🛒
          </Link>
          {user ? (
            <div>
              {user.email}{" "}
              <button onClick={logout} className="logout-btn">
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-link">
              CREAR CUENTA / INICIAR SESIÓN
            </Link>
          )}
          <div className="kokos-search">
            <form>
              <input type="text" placeholder="BUSCAR" />
              <button type="submit">🔍</button>
            </form>
          </div>
        </div>
      </div>
      <nav className="kokos-menu">
        <div className="menu-item">
          <Link to="/products?category=jugueteria">JUGUETERÍA</Link>
          <div className="submenu">
            {subcategories.map((sub) => (
              <Link
                key={sub}
                to={`/products?category=jugueteria&subcategory=${sub}`}
              >
                {sub.replace(/_/g, " ").toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        <Link to="/nosotros">NOSOTROS</Link>
        <Link to="/novedades">NOVEDADES</Link>
        <Link to="/contacto">CONTACTO</Link>
      </nav>
    </header>
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

// ----------------------
// Footer
// ----------------------
function Footer() {
  return (
    <footer className="kokos-footer">
      <div className="footer-container">
        <div className="footer-logo">
          <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
        </div>
        <div className="footer-col">
          <h4>Contacto</h4>
          <p>
            <FaWhatsapp /> 1145457891
          </p>
          <p>
            <FaEnvelope /> infokokos@gmail.com
          </p>
          <p>
            <FaMapMarkerAlt /> Buenos Aires, Argentina
          </p>
        </div>
        <div className="footer-col">
          <h4>Mi Cuenta</h4>
          <p>
            <Link to="/login">Registro / Login</Link>
          </p>
          <p>
            <Link to="/cart">Mi Carrito</Link>
          </p>
        </div>
        <div className="footer-col">
          <h4>Sobre Nosotros</h4>
          <p>
            <Link to="/nosotros">KOKOS Argentina</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [stepCompleted, setStepCompleted] = useState([false, false]);
  const navigate = useNavigate();

  useEffect(() => {
    setStepCompleted([!!email, !!password]);
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);

    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      navigate("/");
    } else if (result.setPassword) {
      navigate("/set-password", {
        state: { email, clientId: result.client.id },
      });
    } else {
      setMessage(result.message || "Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className="auth-card">
      <h2>Iniciar sesión</h2>
      <p className="info">Sigue estos pasos para acceder a tu cuenta</p>

      <div className={`step ${stepCompleted[0] ? "completed" : ""}`}>
        <span>1</span> Ingresa tu correo registrado
      </div>
      <div className={`step ${stepCompleted[1] ? "completed" : ""}`}>
        <span>2</span> Ingresa tu contraseña
      </div>

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <FaEnvelope />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuemail@ejemplo.com"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>

      {message && <div className="alert">{message}</div>}

      <div style={{ marginTop: "25px", textAlign: "center" }}>
        <p>
          <span>SI QUERÉS CREAR TU CUENTA LLENA FORMULARIO: </span>
          <p>
            <a
              href={GOOGLE_FORM_LINK}
              target="_blank"
              rel="noreferrer"
              className="link-text"
            >
              CLICK AQUI PARA IR AL FORMULARIO
            </a>
          </p>
        </p>
        <p>
          <span>SI YA FUISTE ACEPTADO Y NO TENES CONTRASEÑA: </span>
          <p>
            <Link to="/set-password" className="link-text">
              CLICK AQUI PARA CREAR TU CONTRASEÑA
            </Link>
          </p>
        </p>
      </div>
    </div>
  );
}

function SetPassword() {
  const { setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { email: locationEmail } = location.state || {};
  const [email, setEmail] = useState(locationEmail || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepCompleted, setStepCompleted] = useState([
    !!email,
    !!password,
    !!confirm,
  ]);

  useEffect(() => {
    setStepCompleted([!!email, !!password, !!confirm]);
  }, [email, password, confirm]);

  const validatePassword = (pwd) =>
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) return setError("Debes ingresar tu correo registrado.");

    // Validar existencia en Firestore
    const q = query(
      collection(db, "clients"),
      where("email", "==", email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return setError("Este correo no está registrado en nuestro sistema.");
    }

    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    if (!validatePassword(password))
      return setError(
        "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo."
      );

    setLoading(true);
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);

      const clientDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "clients", clientDoc.id), { hasPassword: true });

      const client = { id: clientDoc.id, ...clientDoc.data() };
      setUser(client);
      localStorage.setItem("kokos_user", JSON.stringify(client));

      navigate("/");
    } catch (err) {
      setError("Error al guardar contraseña: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-card">
      <h2>Crear tu contraseña</h2>
      <p className="info">Sigue estos pasos para asegurar tu cuenta</p>

      <div className={`step ${stepCompleted[0] ? "completed" : ""}`}>
        <span>1</span> Ingresa tu correo registrado
      </div>
      <div className={`step ${stepCompleted[1] ? "completed" : ""}`}>
        <span>2</span> Crea una contraseña segura
      </div>
      <div className={`step ${stepCompleted[2] ? "completed" : ""}`}>
        <span>3</span> Confirma tu contraseña
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <FaEnvelope />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tuemail@ejemplo.com"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Guardando..." : "Crear Contraseña"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ===============================
// Products List
// ===============================

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [pendingFilters, setPendingFilters] = useState({
    search: "",
    minStock: "",
    sub: "",
    minPrice: "",
    maxPrice: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minStock: "",
    sub: "",
    minPrice: "",
    maxPrice: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [categoryTitle, setCategoryTitle] = useState("Productos");
  const { user } = useAuth();

  // 🔹 Leer parámetros desde la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");

    // Setear título dinámico
    setCategoryTitle(
      subcategory
        ? subcategory.replace(/_/g, " ").toUpperCase()
        : category
        ? category.replace(/_/g, " ").toUpperCase()
        : "Productos"
    );

    // Traer productos de Firestore
    let q = collection(db, "products");
    if (category && subcategory) {
      q = query(
        q,
        where("category", "==", category),
        where("subcategory", "==", subcategory)
      );
    } else if (category) {
      q = query(q, where("category", "==", category));
    }

    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(prods);
    });

    return () => unsub();
  }, [location.search]);

  // 🔹 Traer subcategorías
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");

    if (!category) {
      setSubcategories([]);
      return;
    }

    const q = query(
      collection(db, "categories"),
      where("name", "==", category)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const catData = snap.docs[0].data();
        setSubcategories(catData.subcategories || []);
      }
    });

    return () => unsub();
  }, [location.search]);

  // 🔹 Aplicar filtros
  useEffect(() => {
    let result = [...products];
    const { subcategory, search, minStock, minPrice, maxPrice } =
      appliedFilters;

    if (subcategory) {
      result = result.filter((p) => p.subcategory === subcategory);
    }
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (minStock) {
      result = result.filter((p) => p.cant_min <= parseInt(minStock));
    }
    if (user) {
      result = result.filter((p) => {
        const price = user.state === 2 ? p.price_state2 : p.price_state1;
        if (!price) return false;
        if (minPrice && price < parseInt(minPrice)) return false;
        if (maxPrice && price > parseInt(maxPrice)) return false;
        return true;
      });
    }

    setFiltered(result);
  }, [products, appliedFilters, user]);

  // 🔹 Aplicar filtros y actualizar URL
  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters });

    const params = new URLSearchParams(location.search);
    Object.entries(pendingFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate({ search: params.toString() });
  };

  return (
    <div className="products-page">
      <h2 className="category-title">{categoryTitle}</h2>

      {/* 🔹 Filtros */}
      <div className="filters">
        <div className="filter-group">
          <h4>Subcategorías</h4>
          <select
            value={pendingFilters.subcategory}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                subcategory: e.target.value,
              })
            }
          >
            <option value="">-- todas las subcategorías --</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <h4>Buscar</h4>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={pendingFilters.search}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, search: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <h4>Cantidad mínima</h4>
          <input
            type="number"
            placeholder="Ej: 5"
            value={pendingFilters.minStock}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, minStock: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <h4>Precio</h4>
          <input
            type="number"
            placeholder="Mínimo"
            value={pendingFilters.minPrice}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, minPrice: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Máximo"
            value={pendingFilters.maxPrice}
            onChange={(e) =>
              setPendingFilters({ ...pendingFilters, maxPrice: e.target.value })
            }
          />
        </div>

        <div className="filter-group" style={{ alignSelf: "flex-end" }}>
          <button onClick={handleSearch} className="btn">
            BUSCAR
          </button>
        </div>
      </div>

      {/* 🔹 Grid fija 4 columnas */}
      <div className="products-grid-4">
        {filtered.map((p) => {
          let priceContent;
          if (!user) {
            priceContent = (
              <p>
                <em>Inicia sesión para ver el precio</em>
              </p>
            );
          } else {
            const price = user.state === 2 ? p.price_state2 : p.price_state1;
            priceContent = (
              <p className="product-price">${price?.toLocaleString()}</p>
            );
          }

          return (
            <div key={p.id} className="product-card">
              <div className="product-img-wrapper">
                <Link to={`/product/${p.id}`}>
                  <img
                    src={
                      (p.multimedia && p.multimedia[0]) ||
                      "https://via.placeholder.com/300"
                    }
                    alt={p.name}
                  />
                </Link>
                {p.stock === 0 && <div className="out-of-stock">SIN STOCK</div>}
              </div>
              <h3 className="product-name">
                <Link to={`/product/${p.id}`}>{p.name}</Link>
              </h3>
              <p className="product-code">Código: {p.code}</p>
              {priceContent}
              <Link
                to={`/product/${p.id}`}
                className={`btn ${p.stock === 0 ? "disabled" : ""}`}
              >
                {p.stock === 0 ? "SIN STOCK" : "COMPRAR"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------
// Product page
// ----------------------

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainMedia, setMainMedia] = useState(null);
  const [related, setRelated] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const docRef = doc(db, "products", id);
    getDoc(docRef).then((d) => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() };
        setProduct(data);

        // Imagen principal
        if (data.multimedia?.length > 0) {
          setMainMedia({ type: "image", url: data.multimedia[0] });
        } else if (data.videos?.length > 0) {
          setMainMedia({ type: "video", url: data.videos[0] });
        }

        // Productos relacionados por subcategoría
        if (data.subcategory) {
          const q = query(
            collection(db, "products"),
            where("subcategory", "==", data.subcategory)
          );
          const unsub = onSnapshot(q, (snap) => {
            const prods = snap.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .filter((p) => p.id !== data.id); // excluye el actual
            setRelated(prods);
          });
          return () => unsub();
        }
      } else {
        setProduct(null);
      }
    });
  }, [id]);

  if (product === null) return <div>Producto no encontrado</div>;
  if (!product) return <div>Cargando...</div>;

  const price = user?.state === 2 ? product.price_state2 : product.price_state1;
  const inStock = product.stock === 1;

  return (
    <div className="product-page">
      {/* Galería */}
      <div className="gallery">
        <div className="main-media">
          {mainMedia?.type === "image" && (
            <img src={mainMedia.url} alt="Producto" />
          )}
          {mainMedia?.type === "video" && (
            <iframe
              src={`https://www.youtube.com/embed/${
                mainMedia.url.split("v=")[1]
              }`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video del producto"
            ></iframe>
          )}
        </div>

        <div className="thumbnails">
          {(product.multimedia || []).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`thumb-${idx}`}
              onClick={() => setMainMedia({ type: "image", url: img })}
            />
          ))}
          {(product.videos || []).map((video, idx) => (
            <div
              key={idx}
              className="video-thumb"
              onClick={() => setMainMedia({ type: "video", url: video })}
            >
              <img
                src={`https://img.youtube.com/vi/${video.split("v=")[1]}/0.jpg`}
                alt={`video-${idx}`}
              />
              <span className="play-icon">▶</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info producto */}
      <div className="info">
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        {user ? (
          <>
            <p className="price">${price.toLocaleString()}</p>
            <p>{inStock ? "En stock" : "Sin stock"}</p>
            {inStock ? (
              <AddToCart product={product} />
            ) : (
              <button disabled className="btn">
                Sin stock
              </button>
            )}
          </>
        ) : (
          <p>
            <em>Inicia sesión para ver el precio</em>
          </p>
        )}
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <div className="related-section">
          <h2>Productos en la misma categoría</h2>
          <div className="related-grid">
            {related
              .sort(() => 0.5 - Math.random()) // random
              .slice(0, 4) // solo 4
              .map((p) => {
                let priceContent;
                if (!user) {
                  priceContent = (
                    <p>
                      <em>Inicia sesión para ver el precio</em>
                    </p>
                  );
                } else {
                  const price =
                    user.state === 2 ? p.price_state2 : p.price_state1;
                  priceContent = (
                    <p className="product-price">${price?.toLocaleString()}</p>
                  );
                }

                return (
                  <div key={p.id} className="related-card">
                    <img
                      src={
                        (p.multimedia && p.multimedia[0]) ||
                        "https://via.placeholder.com/200"
                      }
                      alt={p.name}
                    />
                    <h3>{p.name}</h3>
                    {priceContent}
                    <Link to={`/product/${p.id}`} className="btn-small">
                      Ver producto
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------
// Carrito
// ----------------------
function CartPage() {
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

// ----------------------
// AddToCart
// ----------------------
function AddToCart({ product }) {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  const add = () => {
    const raw = localStorage.getItem("wh_cart");
    const cart = raw ? JSON.parse(raw) : [];
    const price =
      user?.state === 2 ? product.price_state2 : product.price_state1;
    const existing = cart.find((c) => c.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: product.id, name: product.name, price, qty });
    localStorage.setItem("wh_cart", JSON.stringify(cart));
    navigate("/cart");
  };

  return (
    <div>
      <label>Cantidad:</label>
      <input
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
        type="number"
        min="1"
      />
      <button onClick={add} className="btn">
        Agregar al carrito
      </button>
    </div>
  );
}

// ----------------------
// Admin Panel
// ----------------------

function ProductForm({
  initialData = {},
  categories,
  uploadedUrls,
  setUploadedUrls,
  selectedFiles,
  setSelectedFiles,
  selectedCategory,
  setSelectedCategory,
  onSubmit,
  loading,
  onCancel,
}) {
  const isEdit = !!initialData.id;

  // 👇 Limpia automáticamente si no hay producto en edición (modo "Agregar")
  useEffect(() => {
    if (!isEdit) {
      setUploadedUrls([]);
      setSelectedFiles([]);
      setSelectedCategory("");
    }
  }, [isEdit, setUploadedUrls, setSelectedFiles, setSelectedCategory]);

  return (
    <form onSubmit={onSubmit} className="stack">
      <label>Código del producto</label>
      <input name="code" defaultValue={initialData.code || ""} required />

      <label>Nombre del producto</label>
      <input name="name" defaultValue={initialData.name || ""} required />

      <label>Descripción</label>
      <textarea
        name="description"
        defaultValue={initialData.description || ""}
      />

      <label>Imágenes actuales (arrastra para reordenar)</label>
      <DragDropContext
        onDragEnd={(result) => {
          if (!result.destination) return;
          const reordered = Array.from(uploadedUrls);
          const [removed] = reordered.splice(result.source.index, 1);
          reordered.splice(result.destination.index, 0, removed);
          setUploadedUrls(reordered);
        }}
      >
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div
              style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {uploadedUrls.map((url, idx) => (
                <Draggable key={url} draggableId={url} index={idx}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        position: "relative",
                        ...provided.draggableProps.style,
                      }}
                    >
                      <img src={url} alt="preview" width="100" />
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedUrls(
                            uploadedUrls.filter((_, i) => i !== idx)
                          )
                        }
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "red",
                          color: "white",
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <label>Subir nuevas imágenes</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const files = [...e.target.files];
          setSelectedFiles(files);
          const previews = files.map((f) => URL.createObjectURL(f));
          setUploadedUrls((prev) => [...prev, ...previews]);
        }}
      />

      <label>Videos de YouTube (uno por línea)</label>
      <textarea
        name="videos"
        defaultValue={(initialData.videos || []).join("\n")}
        placeholder="https://www.youtube.com/watch?v=xxxxxx"
      />

      <label>Precio para clientes en estado 1</label>
      <input name="price1" defaultValue={initialData.price_state1 || ""} />

      <label>Precio para clientes en estado 2</label>
      <input name="price2" defaultValue={initialData.price_state2 || ""} />

      <label>Cantidad mínima de compra</label>
      <input
        name="cant_min"
        defaultValue={initialData.cant_min || 1}
        placeholder="Cantidad mínima de compra"
      />

      <label>EAN (13 números)</label>
      <input
        name="ean"
        pattern="\d{13}"
        defaultValue={initialData.ean || ""}
        placeholder="EAN (13 números)"
      />

      <label>Stock disponible (1 = Sí, 0 = No)</label>
      <input name="stock" defaultValue={initialData.stock || ""} />

      <label>Categoría</label>
      <select
        name="category"
        required
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="" disabled>
          -- seleccionar --
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label>Subcategoría</label>
      <select name="subcategory" defaultValue={initialData.subcategory || ""}>
        <option value="">-- sin subcategoría --</option>
        {categories
          .find((c) => c.id === selectedCategory)
          ?.subcategories?.map((s) => (
            <option key={`${selectedCategory}_${s}`} value={s}>
              {s}
            </option>
          ))}
      </select>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" disabled={loading}>
          {loading
            ? isEdit
              ? "Guardando..."
              : "Agregando..."
            : isEdit
            ? "Guardar cambios"
            : "Agregar"}
        </button>

        {onCancel && (
          <button type="button" className="btn outline" onClick={onCancel}>
            Cancelar
          </button>
        )}

        {!isEdit && (
          <button
            type="button"
            className="btn outline"
            onClick={() => {
              setUploadedUrls([]);
              setSelectedFiles([]);
              setSelectedCategory("");
            }}
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}

function AdminPanel() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  // Reset cuando entro a agregar
  useEffect(() => {
    if (view === "addProduct" && !editingProduct) {
      setUploadedUrls([]);
      setSelectedFiles([]);
      setSelectedCategory("");
    }
  }, [view, editingProduct]);

  // Firestore listeners
  useEffect(() => {
    if (!authed) return;
    const unsubC = onSnapshot(collection(db, "clients"), (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubP = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubCat = onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubC();
      unsubP();
      unsubCat();
    };
  }, [authed]);

  // Cargar datos al editar
  useEffect(() => {
    if (editingProduct) {
      setUploadedUrls(editingProduct.multimedia || []);
      setSelectedFiles([]); // 👈 muy importante
      const cat = categories.find((c) => c.name === editingProduct.category);
      setSelectedCategory(cat?.id || "");
    }
  }, [editingProduct, categories]);

  // --- Auth ---
  const loginAdmin = () => {
    if (secret === "admin123") setAuthed(true);
    else alert("Clave admin incorrecta");
  };

  // --- Clientes ---
  const toggleState = (id, state) =>
    updateDoc(doc(db, "clients", id), { state });

  const deleteClient = async (id) => {
    if (confirm("¿Eliminar cliente?")) await deleteDoc(doc(db, "clients", id));
  };

  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    await addDoc(collection(db, "clients"), {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    });
    ev.target.reset();
    alert("Cliente agregado");
  };

  // --- Productos ---
  const handleSubmitProduct = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      const urls = [...uploadedUrls];
      for (let file of selectedFiles) {
        const url = await uploadImage(file);
        urls.push(url);
      }

      const data = new FormData(ev.target);
      const videos = (data.get("videos") || "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      const cat = categories.find((c) => c.id === selectedCategory);

      const product = {
        code: data.get("code"),
        name: data.get("name"),
        description: data.get("description"),
        multimedia: urls,
        videos,
        price_state1: Number(data.get("price1")) || 0,
        price_state2: Number(data.get("price2")) || 0,
        stock: Number(data.get("stock")) || 0,
        cant_min: Number(data.get("cant_min")) || 1,
        ean: data.get("ean"),
        category: cat?.name || "",
        categoryId: cat?.id || "",
        subcategory: data.get("subcategory") || "",
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), product);
        alert("Producto actualizado");
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, "products"), product);
        alert("Producto agregado");
      }

      setSelectedFiles([]);
      setUploadedUrls([]);
      setSelectedCategory("");
      setView("products");
    } catch (err) {
      console.error(err);
      alert("Error guardando producto");
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = (id, stock) =>
    updateDoc(doc(db, "products", id), { stock });

  const deleteProduct = async (id) => {
    if (confirm("¿Eliminar producto?"))
      await deleteDoc(doc(db, "products", id));
  };

  // --- Categorías ---
  const addSubcategory = (catId, subName) => {
    if (!subName) return alert("Nombre vacío");
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    return updateDoc(doc(db, "categories", catId), {
      subcategories: arrayUnion(normalized),
    });
  };

  const removeSubcategory = (catId, subName) => {
    if (confirm(`Eliminar subcategoría "${subName}"?`))
      updateDoc(doc(db, "categories", catId), {
        subcategories: arrayRemove(subName),
      });
  };

  // --- Filtros ---
  const filteredClients = clients.filter((c) =>
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description || "")
        .toLowerCase()
        .includes(productSearch.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchSub = !filterSubcategory || p.subcategory === filterSubcategory;
    return matchSearch && matchCategory && matchSub;
  });

  // --- Render ---
  if (!authed) {
    return (
      <div className="admin-card login-card">
        <h2>Panel admin</h2>
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Clave admin"
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={loginAdmin} className="btn">
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">
          <h3>KOKOS - Admin</h3>
        </div>
        <nav>
          <ul>
            <li
              className={view === "dashboard" ? "active" : ""}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={view === "clients" ? "active" : ""}
              onClick={() => setView("clients")}
            >
              Clientes
            </li>
            <li
              className={view === "products" ? "active" : ""}
              onClick={() => setView("products")}
            >
              Productos
            </li>
            <li
              className={view === "addProduct" ? "active" : ""}
              onClick={() => {
                setEditingProduct(null);
                setView("addProduct");
              }}
            >
              Agregar Producto
            </li>
            <li
              className={view === "categories" ? "active" : ""}
              onClick={() => setView("categories")}
            >
              Categorías / Subcategorías
            </li>
          </ul>
        </nav>
      </aside>

      <section className="admin-main">
        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div className="card">
            <h2>Dashboard</h2>
            <div className="grid-tiles">
              <div className="tile">Clientes: {clients.length}</div>
              <div className="tile">Productos: {products.length}</div>
              <div className="tile">Categorías: {categories.length}</div>
            </div>
            <h4>Subcategorías por categoría</h4>
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  {c.name}: {(c.subcategories || []).length} subcategorías
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CLIENTES */}
        {view === "clients" && (
          <div className="card">
            <h2>Clientes</h2>
            <input
              placeholder="Buscar cliente por email"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            {filteredClients.map((c) => (
              <div key={c.id} className="row-between">
                <div>
                  <div>
                    <strong>{c.email}</strong>
                  </div>
                  <div>Estado: {c.state}</div>
                </div>
                <div>
                  <button onClick={() => toggleState(c.id, 1)} className="btn">
                    Estado 1
                  </button>
                  <button onClick={() => toggleState(c.id, 2)} className="btn">
                    Estado 2
                  </button>
                  <button
                    onClick={() => deleteClient(c.id)}
                    className="btn danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <hr />
            <h4>Agregar cliente</h4>
            <form onSubmit={addClient} className="stack">
              <input name="email" placeholder="Email del cliente" required />
              <input
                name="state"
                placeholder="Estado (1 o 2)"
                defaultValue="1"
              />
              <button className="btn">Agregar</button>
            </form>
          </div>
        )}

        {/* PRODUCTOS */}
        {view === "products" && (
          <div className="card">
            <h2>Productos existentes</h2>
            <input
              placeholder="Buscar producto por nombre/desc/código"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setFilterSubcategory("");
                }}
              >
                <option value="">-- todas las categorías --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
              >
                <option value="">-- todas las subcategorías --</option>
                {categories
                  .find((c) => c.name === filterCategory)
                  ?.subcategories?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-row row-between">
                <div>
                  <strong>{p.name}</strong>{" "}
                  <span style={{ fontSize: 12, color: "#555" }}>
                    ({p.code})
                  </span>
                  <div style={{ fontSize: 13 }}>
                    {p.category} / {p.subcategory}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Precio1: {p.price_state1} | Precio2: {p.price_state2}
                  </div>
                </div>
                <div>
                  <div>Stock: {p.stock}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => toggleStock(p.id, 1)}
                      className="btn small"
                    >
                      Stock Sí
                    </button>
                    <button
                      onClick={() => toggleStock(p.id, 0)}
                      className="btn small"
                    >
                      Stock No
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setSelectedCategory(
                          categories.find((c) => c.name === p.category)?.id ||
                            ""
                        );
                        setView("editProduct");
                      }}
                      className="btn small"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="btn danger small"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AGREGAR / EDITAR PRODUCTO */}
        {(view === "addProduct" ||
          (view === "editProduct" && editingProduct)) && (
          <div className="card">
            <h2>{editingProduct ? "Editar producto" : "Agregar producto"}</h2>
            <ProductForm
              initialData={editingProduct || {}}
              categories={categories}
              uploadedUrls={uploadedUrls}
              setUploadedUrls={setUploadedUrls}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSubmit={handleSubmitProduct}
              loading={loading}
              onCancel={() => {
                setEditingProduct(null);
                setSelectedCategory("");
                setSelectedFiles([]); // 👈 limpiar acá también
                setView("products");
              }}
            />
          </div>
        )}

        {/* CATEGORÍAS */}
        {view === "categories" && (
          <div className="card">
            <h2>Categorías / Subcategorías</h2>
            <div className="stack">
              {categories.map((c) => (
                <div key={c.id} className="card small">
                  <div className="row-between">
                    <strong>{c.name}</strong>
                    <div>{(c.subcategories || []).length} subcategorías</div>
                  </div>
                  <div className="sub-list">
                    {(c.subcategories || []).map((s) => (
                      <div key={s} className="sub-item">
                        <span>{s}</span>
                        <button
                          className="btn danger small"
                          onClick={() => removeSubcategory(c.id, s)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    {(!c.subcategories || c.subcategories.length === 0) && (
                      <div className="muted">Sin subcategorías</div>
                    )}
                  </div>
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      addSubcategory(c.id, ev.target.sub.value);
                      ev.target.reset();
                    }}
                    className="row"
                  >
                    <input name="sub" placeholder="Nueva subcategoría" />
                    <button className="btn">Agregar subcategoría</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ----------------------
// NotFound
// ----------------------
function NotFound() {
  return <div>404 - Not Found</div>;
}
