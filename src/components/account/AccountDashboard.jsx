import React from "react";
import { FaShoppingBag, FaHistory } from "react-icons/fa";

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

export default AccountDashboard;
