import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./App";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

import {
  FaUserCircle,
  FaClipboardList,
  FaUserEdit,
  FaShieldAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import "./styles/my-account.css";

import AccountDashboard from "./components/account/AccountDashboard";
import AccountOrders from "./components/account/AccountOrders";
import AccountDetails from "./components/account/AccountDetails";
import AccountSecurity from "./components/account/AccountSecurity";

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