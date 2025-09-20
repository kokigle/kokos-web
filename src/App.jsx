// App.jsx
import React, { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  query, where, addDoc, updateDoc, onSnapshot,arrayUnion,
  arrayRemove,
  deleteDoc} from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { uploadImage } from "./cloudinary";
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
  measurementId: "G-SX009W4G8Z"
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
const formatMoney = (n) => `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

// ----------------------
// App principal
// ----------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email) => {
    setLoading(true);
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docu = snap.docs[0];
      const data = docu.data();
      setUser({ id: docu.id, email: data.email, state: data.state || 1 });
    } else {
      setUser(null);
    }
    setLoading(false);
    return !snap.empty;
  };

  const logout = () => setUser(null);

  const value = { user, login, logout, loading, setUser };

  return (
    <AuthContext.Provider value={value}>
      <Router>
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}


import logo from "./assets/logo.png";

function Header() {
  const { user, logout } = useAuth();
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    // Traemos todas las subcategorías de productos donde category = "jugueteria"
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
        {/* Logo */}
        <div className="kokos-logo">
          <Link to="/">
            <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
          </Link>
        </div>

        {/* Buscador */}
        <div className="kokos-search">
          <form>
            <input type="text" placeholder="BUSCAR" />
            <button type="submit">🔍</button>
          </form>
        </div>

        {/* Cuenta y carrito */}
        <div className="kokos-account">
          <Link to="/cart" className="cart-link">MI CARRITO 🛒</Link>
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
        </div>
      </div>

      {/* Menú */}
      <nav className="kokos-menu">
        <div className="menu-item">
          <Link to="/products?category=jugueteria">JUGUETERÍA</Link>
          {/* Submenú */}
          <div className="submenu">
            {subcategories.map((sub) => (
              <Link key={sub} to={`/products?category=jugueteria&subcategory=${sub}`}>
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

import banner from "./assets/banner.png";

function Home() {
  return (
    <div className="kokos-home">
      <section className="home-banner">
        <img src={banner} alt="Banner Kokos" className="banner-img" />
      </section>
    </div>
  );
}

import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  return (
    <footer className="kokos-footer">
      <div className="footer-container">
        {/* Logo */}
        <div className="footer-logo">
          <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
        </div>

        {/* Contacto */}
        <div className="footer-col">
          <h4>Contacto</h4>
          <p><FaWhatsapp /> 1145457891</p>
          <p><FaEnvelope /> infokokos@gmail.com</p>
          <p><FaMapMarkerAlt /> Buenos Aires, Argentina</p>
        </div>

        {/* Mi Cuenta */}
        <div className="footer-col">
          <h4>Mi Cuenta</h4>
          <p>Registro / Login</p>
          <p>Mi Cuenta</p>
          <p>Mi Carrito</p>
        </div>

        {/* Sobre Nosotros */}
        <div className="footer-col">
          <h4>Sobre Nosotros</h4>
          <p>KOKOS Argentina</p>
        </div>
      </div>
    </footer>
  );
}




// ----------------------
// Login
// ----------------------
function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    const found = await login(email.trim().toLowerCase());
    if (found) navigate("/");
    else setMessage("No estás registrado. Si quieres registrarte completa el formulario de registro.");
  };

  return (
    <div className="card" style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <button className="btn" disabled={loading}>
          {loading ? "Buscando..." : "Entrar"}
        </button>
      </form>

      {message && (
        <div className="card" style={{ background: "#fffbe6" }}>
          <p>{message}</p>
          <a href={GOOGLE_FORM_LINK} target="_blank" rel="noreferrer">
            Ir al formulario de registro
          </a>
        </div>
      )}
    </div>
  );
}

// ----------------------
// Products list
// ----------------------
import { useLocation } from "react-router-dom";

function ProductsList() {
  const [products, setProducts] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const subcategory = params.get("subcategory");

    let q = collection(db, "products");
    if (category && subcategory) {
      q = query(q, where("category", "==", category), where("subcategory", "==", subcategory));
    } else if (category) {
      q = query(q, where("category", "==", category));
    }

    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [location.search]);

  return (
    <div>
      <h2>Productos</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p.id} className="card">
            <img
              src={(p.multimedia && p.multimedia[0]) || "https://via.placeholder.com/300"}
              alt={p.name}
              style={{ width: "100%", height: "160px", objectFit: "cover" }}
            />
            <h3>{p.name}</h3>
            <p>{p.description?.slice(0, 70)}</p>
            <Link to={`/product/${p.id}`}>Ver producto</Link>
          </div>
        ))}
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
              src={`https://www.youtube.com/embed/${mainMedia.url.split("v=")[1]}`}
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
              <button disabled className="btn">Sin stock</button>
            )}
          </>
        ) : (
          <p><em>Inicia sesión para ver el precio</em></p>
        )}
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <div className="related-section">
          <h2>Productos en la misma categoría</h2>
          <div className="related-scroll">
            {related.map((p) => (
              <div key={p.id} className="related-card">
                <img
                  src={(p.multimedia && p.multimedia[0]) || "https://via.placeholder.com/200"}
                  alt={p.name}
                />
                <h3>{p.name}</h3>
                <p className="price">${p.price_state1?.toLocaleString()}</p>
                <Link to={`/product/${p.id}`} className="btn-small">
                  Ver producto
                </Link>
              </div>
            ))}
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
  const changeQty = (id, qty) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty } : x)));

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
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: user.email,
        order_id: docRef.id,
        client_email: user.email,
        order_json: JSON.stringify(cart, null, 2),
      }, EMAILJS_USER_ID);
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
        <div>El carrito está vacío. <Link to="/products">Ver productos</Link></div>
      ) : (
        <div>
          {cart.map((it) => (
            <div key={it.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div>{it.name}</div>
                <div>${formatMoney(it.price)} x {it.qty}</div>
              </div>
              <div>
                <input type="number" min="1" value={it.qty} onChange={(e) => changeQty(it.id, Number(e.target.value))} />
                <button onClick={() => remove(it.id)} className="btn">Quitar</button>
              </div>
            </div>
          ))}
          <div><strong>Total: ${formatMoney(total)}</strong></div>
          <button onClick={checkout} className="btn">Finalizar compra</button>
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
    const price = user?.state === 2 ? product.price_state2 : product.price_state1;
    const existing = cart.find((c) => c.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: product.id, name: product.name, price, qty });
    localStorage.setItem("wh_cart", JSON.stringify(cart));
    navigate("/cart");
  };

  return (
    <div>
      <label>Cantidad:</label>
      <input value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} type="number" min="1" />
      <button onClick={add} className="btn">Agregar al carrito</button>
    </div>
  );
}

// ----------------------
// Admin Panel
// ----------------------
//

function AdminPanel() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // {id,name,subcategories:[]}
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  // filtros
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  useEffect(() => {
    if (!authed) return;
    const ccol = collection(db, "clients");
    const pcol = collection(db, "products");
    const unsubC = onSnapshot(ccol, (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubP = onSnapshot(pcol, (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const catCol = collection(db, "categories");
    const unsubCat = onSnapshot(catCol, (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubC();
      unsubP();
      unsubCat();
    };
  }, [authed]);
  useEffect(() => {
    if (editingProduct) {
      // Si estamos editando un producto, cargamos sus imágenes en el estado
      setUploadedUrls(editingProduct.multimedia || []);
      setSelectedCategory(
        categories.find((c) => c.name === editingProduct.category)?.id || ""
      );
    }
  }, [editingProduct, categories]);


  const loginAdmin = () => {
    if (secret === "admin123") setAuthed(true);
    else alert("Clave admin incorrecta");
  };

  const toggleState = async (clientId, newState) => {
    const ref = doc(db, "clients", clientId);
    await updateDoc(ref, { state: newState });
  };

  const deleteClient = async (clientId) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await deleteDoc(doc(db, "clients", clientId));
  };

  const deleteProduct = async (prodId) => {
    if (!confirm("¿Eliminar producto?")) return;
    await deleteDoc(doc(db, "products", prodId));
  };

  const toggleStock = async (prodId, newStock) => {
    const ref = doc(db, "products", prodId);
    try {
      await updateDoc(ref, { stock: newStock });
    } catch (e) {
      console.error(e);
      alert("Error actualizando stock");
    }
  };

  // --------- Productos ----------
  const addProduct = async (ev) => {
  ev.preventDefault();
  setLoading(true);

  try {
    // Subimos las imágenes a Cloudinary
    const urls = [];
    for (let file of selectedFiles) {
      const url = await uploadImage(file);
      urls.push(url);
    }

    const data = new FormData(ev.target);
    const videos = (data.get("videos") || "")
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

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
      category: categories.find((c) => c.id === selectedCategory)?.name || "",
      subcategory: data.get("subcategory") || "",
    };

    await addDoc(collection(db, "products"), product);
    alert("Producto agregado");
    setSelectedFiles([]);
    setUploadedUrls([]);
    ev.target.reset();
    setSelectedCategory("");
    setView("products");
  } catch (err) {
    console.error(err);
    alert("Error subiendo producto");
  } finally {
    setLoading(false);
  }
};



  const updateProduct = async (ev) => {
  ev.preventDefault();
  setLoading(true);

  try {
    const newUrls = [...uploadedUrls];
    for (let file of selectedFiles) {
      const url = await uploadImage(file);
      newUrls.push(url);
    }

    const data = new FormData(ev.target);
    const videos = (data.get("videos") || "")
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const product = {
      code: data.get("code"),
      name: data.get("name"),
      description: data.get("description"),
      multimedia: newUrls,
      videos, // 👈 nuevo campo
      price_state1: Number(data.get("price1")) || 0,
      price_state2: Number(data.get("price2")) || 0,
      stock: Number(data.get("stock")) || 0,
      cant_min: Number(data.get("cant_min")) || 1,
      ean: data.get("ean"),
      category: categories.find((c) => c.id === selectedCategory)?.name || "",
      subcategory: data.get("subcategory") || "",
    };

    const ref = doc(db, "products", editingProduct.id);
    await updateDoc(ref, product);

    alert("Producto actualizado");
    setEditingProduct(null);
    setSelectedFiles([]);
    setUploadedUrls([]);
    setSelectedCategory("");
    setView("products");
  } catch (err) {
    console.error(err);
    alert("Error actualizando producto");
  } finally {
    setLoading(false);
  }
};


  // --------- Clientes ----------
  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    const client = {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    };
    await addDoc(collection(db, "clients"), client);
    ev.target.reset();
    alert("Cliente agregado");
  };

  // --------- Categorías ----------
  const addSubcategory = async (catId, subName) => {
    if (!subName) return alert("Nombre de subcategoría vacío");
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    const ref = doc(db, "categories", catId);
    try {
      await updateDoc(ref, { subcategories: arrayUnion(normalized) });
      alert(`Subcategoría "${normalized}" añadida`);
    } catch (e) {
      console.error(e);
      alert("Error añadiendo subcategoría");
    }
  };

  const removeSubcategory = async (catId, subName) => {
    if (!confirm(`Eliminar subcategoría "${subName}"?`)) return;
    const ref = doc(db, "categories", catId);
    try {
      await updateDoc(ref, { subcategories: arrayRemove(subName) });
      alert("Subcategoría eliminada");
    } catch (e) {
      console.error(e);
      alert("Error eliminando subcategoría.");
    }
  };

  // --- filtros ---
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
            <li className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</li>
            <li className={view === "clients" ? "active" : ""} onClick={() => setView("clients")}>Clientes</li>
            <li className={view === "products" ? "active" : ""} onClick={() => setView("products")}>Productos</li>
            <li className={view === "addProduct" ? "active" : ""} onClick={() => { setEditingProduct(null); setView("addProduct"); }}>Agregar Producto</li>
            <li className={view === "categories" ? "active" : ""} onClick={() => setView("categories")}>Categorías / Subcategorías</li>
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
                  <div><strong>{c.email}</strong></div>
                  <div>Estado: {c.state}</div>
                </div>
                <div>
                  <button onClick={() => toggleState(c.id, 1)} className="btn">Estado 1</button>
                  <button onClick={() => toggleState(c.id, 2)} className="btn">Estado 2</button>
                  <button onClick={() => deleteClient(c.id)} className="btn danger">Eliminar</button>
                </div>
              </div>
            ))}

            <hr />
            <h4>Agregar cliente</h4>
            <form onSubmit={addClient} className="stack">
              <input name="email" placeholder="Email del cliente" required />
              <input name="state" placeholder="Estado (1 o 2)" defaultValue="1" />
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
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
              >
                <option value="">-- todas las subcategorías --</option>
                {categories.find((c) => c.name === filterCategory)?.subcategories?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {filteredProducts.map((p) => (
              <div key={p.id} className="product-row row-between">
                <div>
                  <strong>{p.name}</strong> <span style={{ fontSize: 12, color: "#555" }}>({p.code})</span>
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
                    <button onClick={() => toggleStock(p.id, 1)} className="btn small">Stock Sí</button>
                    <button onClick={() => toggleStock(p.id, 0)} className="btn small">Stock No</button>
                    <button onClick={() => { setEditingProduct(p); setSelectedCategory(categories.find(c => c.name === p.category)?.id || ""); setView("editProduct"); }} className="btn small">Editar</button>
                    <button onClick={() => deleteProduct(p.id)} className="btn danger small">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AGREGAR PRODUCTO */}
{view === "addProduct" && (
  <div className="card">
    <h2>Agregar producto</h2>
    <form onSubmit={addProduct} className="stack">
      <label>Código del producto</label>
      <input name="code" placeholder="Código" required />

      <label>Nombre del producto</label>
      <input name="name" placeholder="Nombre" required />

      <label>Descripción</label>
      <textarea name="description" placeholder="Descripción" />

      <label>Imágenes del producto</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setSelectedFiles([...e.target.files])}
      />
      <label>Videos de YouTube (uno por línea)</label>
      <textarea
        name="videos"
        placeholder="https://www.youtube.com/watch?v=xxxxxx"
      />
      <label>Precio para clientes en estado 1</label>
      <input name="price1" placeholder="Precio estado 1" />

      <label>Precio para clientes en estado 2</label>
      <input name="price2" placeholder="Precio estado 2" />

      <label>Cantidad mínima de compra</label>
      <input name="cant_min" placeholder="Cantidad mínima de compra" defaultValue="1" />

      <label>EAN (13 números)</label>
      <input name="ean" placeholder="EAN (13 números)" pattern="\d{13}" />

      <label>Stock disponible (1 = Sí, 0 = No)</label>
      <input name="stock" placeholder="Stock (1 o 0)" />

      <label>Categoría</label>
      <select
        name="category"
        required
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="" disabled>-- seleccionar --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label>Subcategoría</label>
      <select name="subcategory" defaultValue="">
        <option value="">-- sin subcategoría --</option>
        {categories.find((c) => c.id === selectedCategory)?.subcategories?.map((s) => (
          <option key={`${selectedCategory}_${s}`} value={s}>{s}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" disabled={loading}>
          {loading ? "Agregando..." : "Agregar"}
        </button>
        <button
          type="button"
          className="btn outline"
          onClick={() => {
            ev.target.reset(); // dentro del addProduct
            setSelectedCategory("");
          }}
        >
          Limpiar
        </button>
      </div>
    </form>
  </div>
)}

        {/* EDITAR PRODUCTO */}
{view === "editProduct" && editingProduct && (
  <div className="card">
    <h2>Editar producto</h2>
    <form onSubmit={updateProduct} className="stack">
      <label>Código del producto</label>
      <input name="code" defaultValue={editingProduct.code} required />

      <label>Nombre del producto</label>
      <input name="name" defaultValue={editingProduct.name} required />

      <label>Descripción</label>
      <textarea name="description" defaultValue={editingProduct.description} />

      <label>Imágenes actuales</label>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {uploadedUrls.map((url, idx) => (
          <div key={idx} style={{ position: "relative" }}>
            <img src={url} alt="preview" width="100" />
            <button
              type="button"
              onClick={() =>
                setUploadedUrls(uploadedUrls.filter((_, i) => i !== idx))
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
        ))}
      </div>

<label>Subir nuevas imágenes</label>
<input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => setSelectedFiles([...e.target.files])}
/>
      <label>Videos de YouTube (uno por línea)</label>
      <textarea
        name="videos"
        defaultValue={(editingProduct.videos || []).join("\n")}
        placeholder="https://www.youtube.com/watch?v=xxxxxx"
      />

      <label>Precio para clientes en estado 1</label>
      <input name="price1" defaultValue={editingProduct.price_state1} />

      <label>Precio para clientes en estado 2</label>
      <input name="price2" defaultValue={editingProduct.price_state2} />

      <label>Cantidad mínima de compra</label>
      <input name="cant_min" defaultValue={editingProduct.cant_min || 1} />

      <label>EAN (13 números)</label>
      <input name="ean" pattern="\d{13}" defaultValue={editingProduct.ean} />

      <label>Stock disponible (1 = Sí, 0 = No)</label>
      <input name="stock" defaultValue={editingProduct.stock} />

      <label>Categoría</label>
      <select
        name="category"
        required
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="" disabled>-- seleccionar --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label>Subcategoría</label>
      <select name="subcategory" defaultValue={editingProduct.subcategory || ""}>
        <option value="">-- sin subcategoría --</option>
        {categories.find((c) => c.id === selectedCategory)?.subcategories?.map((s) => (
          <option key={`${selectedCategory}_${s}`} value={s}>{s}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          className="btn outline"
          onClick={() => {
            setEditingProduct(null);
            setSelectedCategory("");
            setView("products");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
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
                      const sub = ev.target.sub.value;
                      addSubcategory(c.id, sub);
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
