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

// --- IMPORTACIONES PARA PDF ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/logo.png";

import {
  FaUserCircle,
  FaClipboardList,
  FaUserEdit,
  FaShieldAlt,
  FaSignOutAlt,
  FaFilePdf,
  FaArrowLeft,
  FaShoppingBag,
  FaHistory,
  FaSearch, // Agregado para el buscador
} from "react-icons/fa";
import "./styles/my-account.css";

import { EyeIcon } from "./icons/EyeIcon";
import { EyeSlashIcon } from "./icons/EyeSlashIcon";

// --- Sub-componente para el Resumen ---
const AccountDashboard = ({ user, orders }) => {
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_progress"
  ).length;
  const historicalOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled"
  ).length;
  const totalSpent = orders
    .filter((o) => o.status === "completed")
    .reduce(
      (acc, order) =>
        acc + order.items.reduce((sum, item) => sum + item.price * item.qty, 0),
      0
    );

  return (
    <div className="my-account-widget">
      <h3 className="my-account-widget-title">Resumen de la Cuenta</h3>
      <p className="my-account-welcome-message">
        ¡Hola, <strong>{user?.nombre || user?.razonSocial}</strong>! Desde aquí
        puedes gestionar tu cuenta y tus pedidos.
      </p>
      <div className="my-account-status-badge">
        <span>Tu cuenta está:</span>
        <strong>{user?.status}</strong>
      </div>
      <div className="my-account-quick-stats">
        <div className="my-account-stat-item">
          <FaShoppingBag />
          <span>Pedidos Activos</span>
          <strong>{activeOrders}</strong>
        </div>
        <div className="my-account-stat-item">
          <FaHistory />
          <span>Historial de Pedidos</span>
          <strong>{historicalOrders}</strong>
        </div>
      </div>
    </div>
  );
};

// --- Sub-componente para MIS PEDIDOS ---
const AccountOrders = ({ orders, loading, user }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = más recientes, 'asc' = más antiguos

  const downloadOrderAsPDF = (order, client) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 0;

      // ---- ENCABEZADO ----
      const addHeader = () => {
        doc.addImage(logo, "PNG", margin, 12, 50, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text("Nota de Pedido", pageWidth - margin, 20, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
          `Pedido N°: ${order.id.substring(0, 7).toUpperCase()}`,
          pageWidth - margin,
          26,
          { align: "right" }
        );
        doc.text(
          `Fecha: ${new Date(order.createdAt).toLocaleDateString("es-AR")}`,
          pageWidth - margin,
          31,
          { align: "right" }
        );
        currentY = 40;
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
      };

      // ---- PIE DE PÁGINA ----
      const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
          doc.text(
            "KOKOS Argentina - De Argimpex S.A.",
            margin,
            pageHeight - 10
          );
        }
      };

      addHeader();

      // ---- INFO DEL CLIENTE ----
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text("Cliente:", margin, currentY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(client.razonSocial || client.nombre, margin + 20, currentY);
      currentY += 5;
      doc.text(client.email, margin + 20, currentY);
      currentY += 5;
      doc.text(`CUIT: ${client.cuit || "N/A"}`, margin + 20, currentY);
      currentY += 10;

      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // ---- TABLA DE PRODUCTOS ----
      const tableColumn = ["CÓDIGO", "DESCRIPCIÓN", "CANT.", "PRECIO", "TOTAL"];
      const tableRows = order.items.map((item) => [
        item.code || "N/A",
        item.name || "Producto sin nombre",
        item.qty || 0,
        `$${formatMoney(item.price || 0)}`,
        `$${formatMoney((item.price || 0) * (item.qty || 0))}`,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: "striped",
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      let finalY = doc.lastAutoTable.finalY;

      // ---- TOTALES ----
      const total = order.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 0),
        0
      );
      currentY = finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40);
      doc.text("TOTAL:", pageWidth - margin - 40, currentY, { align: "left" });
      doc.text(`$${formatMoney(total)}`, pageWidth - margin, currentY, {
        align: "right",
      });
      currentY += 15;

      // ---- FORMA DE PAGO ----
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Forma de Pago: Cheque a 30 días", margin, currentY);

      addFooter();
      doc.save(`pedido-${order.id.substring(0, 7)}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert(
        "Hubo un error al generar el PDF. Por favor, revisa la consola del desarrollador (F12)."
      );
    }
  };

  // --- Lógica de filtrado y ordenamiento ---
  const filteredAndSortedOrders = [...orders]
    .filter((order) => {
      // Filtrar por ID (buscando en los primeros caracteres o el ID completo)
      const orderId = order.id.toUpperCase();
      const term = searchTerm.toUpperCase();
      return orderId.includes(term);
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="my-account-widget">
        <h3 className="my-account-widget-title">Mis Pedidos</h3>
        <div className="my-account-loading-section">Cargando pedidos...</div>
      </div>
    );
  }

  if (selectedOrder) {
    const total = selectedOrder.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );
    return (
      <div className="my-account-widget">
        <button
          onClick={() => setSelectedOrder(null)}
          className="my-account-back-button"
        >
          <FaArrowLeft /> Volver a Mis Pedidos
        </button>
        <div>
          <h3 className="my-account-widget-title" style={{ marginTop: "20px" }}>
            Detalle del Pedido #{selectedOrder.id.substring(0, 7).toUpperCase()}
          </h3>
          <div className="my-account-order-detail-meta">
            <div>
              <span>Fecha:</span>
              <strong>
                {new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")}
              </strong>
            </div>
            <div>
              <span>Estado:</span>
              <strong
                className={`my-account-order-status my-account-order-status-${selectedOrder.status}`}
              >
                {selectedOrder.status.replace("_", " ")}
              </strong>
            </div>
            <div>
              <span>Total:</span> <strong>{formatMoney(total)}</strong>
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
                  <span className="my-account-order-item-name">
                    {item.name}
                  </span>
                  <span className="my-account-order-item-qty">
                    {item.qty} x {formatMoney(item.price)}
                  </span>
                </div>
                <span className="my-account-order-item-subtotal">
                  {formatMoney(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="my-account-form-actions">
          <button
            onClick={() => downloadOrderAsPDF(selectedOrder, user)}
            className="my-account-button"
          >
            <FaFilePdf /> Descargar PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-account-widget">
      <h3 className="my-account-widget-title">Mis Pedidos</h3>
      
      {/* --- Controles de Filtro y Orden --- */}
      <div className="my-account-orders-controls">
        <div className="my-account-search-wrapper">
          <FaSearch className="my-account-search-icon" />
          <input
            type="text"
            placeholder="Buscar por N° de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="my-account-search-input"
          />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="my-account-sort-select"
        >
          <option value="desc">Más recientes</option>
          <option value="asc">Más antiguos</option>
        </select>
      </div>

      {filteredAndSortedOrders.length === 0 ? (
        <p className="my-account-empty-section">
          {searchTerm ? "No se encontraron pedidos con ese criterio." : "Aún no has realizado ningún pedido."}
        </p>
      ) : (
        <div className="my-account-orders-list">
          {filteredAndSortedOrders.map((order) => {
            const total = order.items.reduce(
              (sum, item) => sum + (item.price || 0) * (item.qty || 0),
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
                    Pedido #{order.id.substring(0, 7).toUpperCase()}
                  </span>
                  <span className="my-account-order-date">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="my-account-order-status-total">
                  <span
                    className={`my-account-order-status my-account-order-status-${order.status}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                  <span className="my-account-order-total">
                    {formatMoney(total)}
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

// --- Sub-componente DATOS DE LA CUENTA ---
const AccountDetails = ({ user }) => (
  <div className="my-account-widget">
    <h3 className="my-account-widget-title">Datos de la Cuenta</h3>
    <form className="my-account-form">
      <div className="my-account-form-grid">
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

// --- Sub-componente SEGURIDAD ---
const AccountSecurity = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
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
          <div className="password-input-wrapper">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="my-account-input"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </span>
          </div>
        </div>
        <div className="my-account-form-group">
          <label>Nueva Contraseña</label>
          <div className="password-input-wrapper">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="my-account-input"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </span>
          </div>
        </div>
        <div className="my-account-form-group">
          <label>Confirmar Nueva Contraseña</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="my-account-input"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            >
              {showConfirmNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </span>
          </div>
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
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingOrders(true);
    const q = query(
      collection(db, "orders"),
      where("clientId", "==", user.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false)
    );
    return () => unsubscribe();
  }, [user]);

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
          <div className="my-account-user-profile">
            <FaUserCircle className="my-account-user-avatar" />
            <div className="my-account-user-info">
              <h4>{user.nombre || user.razonSocial}</h4>
              <p>{user.email}</p>
            </div>
          </div>
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
              <FaUserCircle /> Resumen
            </NavLink>
            <NavLink
              to="/my-account/orders"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              <FaClipboardList /> Mis Pedidos
            </NavLink>
            <NavLink
              to="/my-account/details"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              <FaUserEdit /> Datos de la Cuenta
            </NavLink>
            <NavLink
              to="/my-account/security"
              className={({ isActive }) =>
                isActive
                  ? "my-account-nav-link my-account-nav-link-active"
                  : "my-account-nav-link"
              }
            >
              <FaShieldAlt /> Seguridad
            </NavLink>
            <button
              onClick={handleLogout}
              className="my-account-nav-link my-account-logout-button"
            >
              <FaSignOutAlt /> Cerrar Sesión
            </button>
          </nav>
        </aside>
        <main className="my-account-content">
          <Routes>
            <Route
              index
              element={<AccountDashboard user={user} orders={orders} />}
            />
            <Route
              path="orders"
              element={
                <AccountOrders
                  orders={orders}
                  loading={loadingOrders}
                  user={user}
                />
              }
            />
            <Route path="details" element={<AccountDetails user={user} />} />
            <Route path="security" element={<AccountSecurity />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}