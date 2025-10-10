// src/MyAccount.jsx
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useAuth, db, formatMoney } from "./App";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import "./styles/my-account.css";

// --- Sub-componente para el Resumen ---
const AccountDashboard = ({ user }) => (
  <div className="my-account-widget">
    <h3 className="my-account-widget-title">Resumen de la Cuenta</h3>
    <p className="my-account-welcome-message">
      ¡Hola, {user?.nombre || user?.razonSocial}!
    </p>
    <div className="my-account-status-badge">
      <span>Tu nivel de cliente es:</span>
      <strong>Estado {user?.state || 1}</strong>
    </div>
    <div className="my-account-quick-stats">
      <div className="my-account-stat-item">
        <span>Pedidos Activos</span>
        <strong>0</strong> {/* Dato de ejemplo */}
      </div>
      <div className="my-account-stat-item">
        <span>Pedidos Históricos</span>
        <strong>0</strong> {/* Dato de ejemplo */}
      </div>
    </div>
  </div>
);

// --- Sub-componente para MIS PEDIDOS (AHORA CON LÓGICA) ---
const AccountOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("clientId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, [user]);

  if (loading) {
    return (
      <div className="my-account-widget">
        <h3 className="my-account-widget-title">Mis Pedidos</h3>
        <div className="my-account-loading-section">Cargando pedidos...</div>
      </div>
    );
  }

  // --- VISTA DETALLADA DE UN PEDIDO ---
  if (selectedOrder) {
    const total = selectedOrder.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    return (
      <div className="my-account-widget">
        <button
          onClick={() => setSelectedOrder(null)}
          className="my-account-back-button"
        >
          ← Volver a Mis Pedidos
        </button>
        <h3 className="my-account-widget-title">
          Detalle del Pedido #{selectedOrder.id.substring(0, 7)}
        </h3>
        <div className="my-account-order-detail-meta">
          <div>
            <span>Fecha:</span>{" "}
            {new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")}
          </div>
          <div>
            <span>Estado:</span>{" "}
            <span
              className={`my-account-order-status my-account-order-status-${selectedOrder.status}`}
            >
              {selectedOrder.status}
            </span>
          </div>
          <div>
            <span>Total:</span> <strong>${formatMoney(total)}</strong>
          </div>
        </div>
        <div className="my-account-order-detail-items">
          {selectedOrder.items.map((item) => (
            <div key={item.id} className="my-account-order-detail-item">
              <img
                src={item.image}
                alt={item.name}
                className="my-account-order-item-image"
              />
              <div className="my-account-order-item-info">
                <span className="my-account-order-item-name">{item.name}</span>
                <span className="my-account-order-item-qty">
                  {item.qty} x ${formatMoney(item.price)}
                </span>
              </div>
              <span className="my-account-order-item-subtotal">
                ${formatMoney(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- VISTA DE LISTA DE PEDIDOS ---
  return (
    <div className="my-account-widget">
      <h3 className="my-account-widget-title">Mis Pedidos</h3>
      {orders.length === 0 ? (
        <p className="my-account-empty-section">
          Aún no has realizado ningún pedido.
        </p>
      ) : (
        <div className="my-account-orders-list">
          {orders.map((order) => {
            const total = order.items.reduce(
              (sum, item) => sum + item.price * item.qty,
              0
            );
            return (
              <div
                key={order.id}
                className="my-account-order-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="my-account-order-info">
                  <span className="my-account-order-id">
                    Pedido #{order.id.substring(0, 7)}
                  </span>
                  <span className="my-account-order-date">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="my-account-order-status-total">
                  <span
                    className={`my-account-order-status my-account-order-status-${order.status}`}
                  >
                    {order.status}
                  </span>
                  <span className="my-account-order-total">
                    ${formatMoney(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ... (resto de los componentes como AccountDetails y AccountSecurity)
const AccountDetails = ({ user }) => (
  <div className="my-account-widget">
    <h3 className="my-account-widget-title">Datos de la Cuenta</h3>
    <form className="my-account-form">
      <div className="my-account-form-grid">
        {/* Datos Personales */}
        <div className="my-account-form-group">
          <label>Nombre</label>
          <input
            type="text"
            readOnly
            value={user?.nombre || ""}
            className="my-account-input"
          />
        </div>
        <div className="my-account-form-group">
          <label>Apellido</label>
          <input
            type="text"
            readOnly
            value={user?.apellido || ""}
            className="my-account-input"
          />
        </div>
        {/* Datos de la Empresa */}
        <div className="my-account-form-group my-account-form-group-full">
          <label>Razón Social</label>
          <input
            type="text"
            readOnly
            value={user?.razonSocial || ""}
            className="my-account-input"
          />
        </div>
        <div className="my-account-form-group">
          <label>CUIT</label>
          <input
            type="text"
            readOnly
            value={user?.cuit || ""}
            className="my-account-input"
          />
        </div>
        <div className="my-account-form-group">
          <label>Posición Fiscal</label>
          <input
            type="text"
            readOnly
            value={user?.posicionFiscal || ""}
            className="my-account-input"
          />
        </div>
        {/* Datos de Contacto */}
        <div className="my-account-form-group">
          <label>Email</label>
          <input
            type="email"
            readOnly
            value={user?.email || ""}
            className="my-account-input"
          />
        </div>
        <div className="my-account-form-group">
          <label>Teléfono</label>
          <input
            type="tel"
            readOnly
            value={user?.telefonoMovil || ""}
            className="my-account-input"
          />
        </div>
      </div>
      <div className="my-account-form-actions">
        <button type="button" className="my-account-button-disabled" disabled>
          Editar Datos (Próximamente)
        </button>
      </div>
    </form>
  </div>
);

const AccountSecurity = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      // Validación simple
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setSuccess("¡Contraseña actualizada con éxito!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("La contraseña actual es incorrecta.");
      } else {
        setError("Ocurrió un error. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-account-widget">
      <h3 className="my-account-widget-title">Seguridad</h3>
      <form onSubmit={handleSubmit} className="my-account-form">
        <div className="my-account-form-group">
          <label>Contraseña Actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="my-account-input"
            required
          />
        </div>
        <div className="my-account-form-group">
          <label>Nueva Contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="my-account-input"
            required
          />
        </div>
        <div className="my-account-form-group">
          <label>Confirmar Nueva Contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="my-account-input"
            required
          />
        </div>

        {error && <p className="my-account-form-error">{error}</p>}
        {success && <p className="my-account-form-success">{success}</p>}

        <div className="my-account-form-actions">
          <button
            type="submit"
            className="my-account-button"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Componente Principal ---
export default function MyAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="my-account-container">
      <div className="my-account-layout">
        <aside className="my-account-sidebar">
          <nav className="my-account-nav">
            <NavLink
              to="/my-account"
              end
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              Resumen
            </NavLink>
            <NavLink
              to="/my-account/orders"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              Mis Pedidos
            </NavLink>
            <NavLink
              to="/my-account/details"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              Datos de la Cuenta
            </NavLink>
            <NavLink
              to="/my-account/security"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              Seguridad
            </NavLink>
            <button
              onClick={handleLogout}
              className="my-account-nav-link my-account-logout-button"
            >
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        <main className="my-account-content">
          <Routes>
            <Route index element={<AccountDashboard user={user} />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="details" element={<AccountDetails user={user} />} />
            <Route path="security" element={<AccountSecurity />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
