// App.jsx
import React, { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, getDoc, getDocs,
  query, where, addDoc, updateDoc, onSnapshot
} from "firebase/firestore";
import emailjs from "@emailjs/browser";

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
      </Router>
    </AuthContext.Provider>
  );
}

// ----------------------
// Header
// ----------------------
function Header() {
  const { user, logout } = useAuth();
  return (
    <header>
      <div className="container navbar">
        <Link to="/">Kokos Argentina</Link>
        <nav>
          <Link to="/products">Productos</Link>
          <Link to="/cart">Carrito</Link>
          {user ? (
            <span>
              {user.email} (Estado {user.state}){" "}
              <button onClick={logout} className="btn">Cerrar sesión</button>
            </span>
          ) : (
            <Link to="/login" className="btn">Iniciar sesión</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// ----------------------
// Home
// ----------------------
function Home() {
  return (
    <div>
      <h1>Tienda Mayorista</h1>
      <p>Bienvenido. Inicia sesión para ver precios según el estado que te asigne el administrador.</p>
      <Link to="/products" className="btn">Ver productos</Link>
    </div>
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
function ProductsList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const col = collection(db, "products");
    const unsub = onSnapshot(col, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

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
  const { user } = useAuth();

  useEffect(() => {
    const docRef = doc(db, "products", id);
    getDoc(docRef).then((d) => {
      if (d.exists()) setProduct({ id: d.id, ...d.data() });
      else setProduct(null);
    });
  }, [id]);

  if (product === null) return <div>Producto no encontrado</div>;
  if (!product) return <div>Cargando...</div>;

  const price = user?.state === 2 ? product.price_state2 : product.price_state1;
  const inStock = product.stock === 1;

  return (
    <div className="grid">
      <div>
        {(product.multimedia || []).map((m, idx) => (
          <img key={idx} src={m} alt={`${product.name}-${idx}`} style={{ width: "100%", maxHeight: "250px", objectFit: "contain" }} />
        ))}
      </div>
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        {user ? (
          <>
            <p><strong>${formatMoney(price)}</strong></p>
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
// ... (todo el import y configuración igual que antes)

function AdminPanel() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

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
    return () => {
      unsubC();
      unsubP();
    };
  }, [authed]);

  const loginAdmin = () => {
    if (secret === "admin123") setAuthed(true);
    else alert("Clave admin incorrecta");
  };

  const toggleState = async (clientId, newState) => {
    const ref = doc(db, "clients", clientId);
    await updateDoc(ref, { state: newState });
  };

  const addProduct = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    const product = {
      name: data.get("name"),
      description: data.get("description"),
      multimedia: data.get("multimedia")
        ? data
            .get("multimedia")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      price_state1: Number(data.get("price1")) || 0,
      price_state2: Number(data.get("price2")) || 0,
      stock: Number(data.get("stock")) || 0,
    };
    await addDoc(collection(db, "products"), product);
    ev.target.reset();
  };

  const addClient = async (ev) => {
    ev.preventDefault();
    const data = new FormData(ev.target);
    const client = {
      email: data.get("email"),
      state: Number(data.get("state")) || 1,
    };
    await addDoc(collection(db, "clients"), client);
    ev.target.reset();
  };

  if (!authed) {
    return (
      <div className="card" style={{ maxWidth: "400px", margin: "20px auto" }}>
        <h2>Panel admin</h2>
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Clave admin"
        />
        <button onClick={loginAdmin} className="btn">
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Sección clientes */}
      <div className="card">
        <h3>Clientes</h3>
        {clients.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div>
              <div>{c.email}</div>
              <div>Estado: {c.state}</div>
            </div>
            <div>
              <button
                onClick={() => toggleState(c.id, 1)}
                className="btn"
              >
                Estado 1
              </button>
              <button
                onClick={() => toggleState(c.id, 2)}
                className="btn"
              >
                Estado 2
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agregar cliente */}
      <div className="card">
        <h3>Agregar cliente</h3>
        <form onSubmit={addClient}>
          <input name="email" placeholder="Email del cliente" required />
          <input
            name="state"
            placeholder="Estado (1 o 2)"
            defaultValue="1"
          />
          <button className="btn">Agregar</button>
        </form>
      </div>

      {/* Sección agregar producto */}
      <div className="card">
        <h3>Agregar producto</h3>
        <form onSubmit={addProduct}>
          <input name="name" placeholder="Nombre" required />
          <textarea name="description" placeholder="Descripción" />
          <textarea
            name="multimedia"
            placeholder="URLs de multimedia (una por línea)"
          />
          <input name="price1" placeholder="Precio estado 1" />
          <input name="price2" placeholder="Precio estado 2" />
          <input name="stock" placeholder="Stock (1 o 0)" />
          <button className="btn">Agregar</button>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="card">
        <h3>Productos existentes</h3>
        {products.map((p) => (
          <div key={p.id} className="card">
            <div>{p.name}</div>
            <div>Stock: {p.stock}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ----------------------
// NotFound
// ----------------------
function NotFound() {
  return <div>404 - Not Found</div>;
}
