import React, { useState } from "react";

// Helper para formatear dinero (puedes moverlo a utils si lo usas en más sitios)
const formatMoney = (n) =>
  `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

const AdminOrders = ({
  orders,
  clients,
  updateOrderStatus,
  orderSearch,
  setOrderSearch,
}) => {
  const [ordersTab, setOrdersTab] = useState("pending");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const filteredOrders = orders.filter((order) => {
    if (order.status !== ordersTab) return false;
    if (orderSearch.trim() === "") return true;
    const searchTerm = orderSearch.toLowerCase();
    const client = clients.find((c) => c.id === order.clientId);
    const matchOrderId = order.id.toLowerCase().includes(searchTerm);
    const matchClientName = client?.razonSocial
      ?.toLowerCase()
      .includes(searchTerm);
    const matchClientEmail = client?.email?.toLowerCase().includes(searchTerm);
    return matchOrderId || matchClientName || matchClientEmail;
  });

  return (
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Gestión de Pedidos</h2>

      {/* Order Tabs */}
      <div className="admin-panel-clients-tabs">
        {["pending", "in_progress", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            className={`admin-panel-clients-tab ${
              ordersTab === status ? "admin-panel-clients-tab-active" : ""
            }`}
            onClick={() => {
              setOrdersTab(status);
              setExpandedOrder(null);
            }}
          >
            {status.replace("_", " ")} (
            {orders.filter((o) => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Order Search */}
      <div className="admin-panel-search-box">
        <input
          type="text"
          placeholder="🔍 Buscar por N° pedido, razón social o email..."
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          className="admin-panel-search-input"
        />
      </div>

      {/* Orders List */}
      <div className="admin-panel-orders-list">
        {filteredOrders.length === 0 ? (
          <div className="admin-panel-empty-state">
            <p>
              No hay pedidos en estado "{ordersTab.replace("_", " ")}"
              {orderSearch && " que coincidan con la búsqueda"}.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const client = clients.find((c) => c.id === order.clientId);
            const total = order.items.reduce(
              (sum, item) => sum + (item.finalPrice ?? item.price) * item.qty,
              0
            );
            return (
              <div key={order.id} className="admin-panel-order-card">
                <div
                  className="admin-panel-order-summary"
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )
                  }
                >
                  <div className="admin-panel-order-main-info">
                    <h4>Pedido #{order.id.substring(0, 7).toUpperCase()}</h4>
                    <p>
                      {client?.razonSocial ||
                        order.clientEmail ||
                        "Cliente Desconocido"}
                    </p>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="admin-panel-order-meta">
                    <span>{order.items.length} item(s)</span>
                    <strong>{formatMoney(total)}</strong>
                    <div
                      className={`admin-panel-order-status-badge admin-panel-order-status-${order.status}`}
                    >
                      {order.status.replace("_", " ")}
                    </div>
                  </div>
                  <div className="admin-panel-expand-icon">
                    {expandedOrder === order.id ? "▲" : "▼"}
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="admin-panel-order-details">
                    <h5>Detalle del Cliente</h5>
                    <div className="admin-panel-order-client-details">
                      <p>
                        <strong>Razón Social:</strong>{" "}
                        {client?.razonSocial || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {client?.email || "N/A"}
                      </p>
                      <p>
                        <strong>Teléfono:</strong>{" "}
                        {client?.telefonoMovil || "N/A"}
                      </p>
                      <p>
                        <strong>CUIT:</strong> {client?.cuit || "N/A"}
                      </p>
                      <p>
                        <strong>Lista Asignada:</strong>{" "}
                        {client?.state || "N/A"}
                      </p>
                      <p>
                        <strong>Descuento Aplicado:</strong>{" "}
                        {order.discountApplied || 0}%
                      </p>
                    </div>
                    <h5>Productos</h5>
                    <div className="admin-panel-order-items-list">
                      {order.items.map((item) => (
                        <div key={item.id} className="admin-panel-order-item">
                          <img
                            src={item.image || "placeholder.png"}
                            alt={item.name}
                          />
                          <div className="admin-panel-order-item-info">
                            <span>{item.name}</span>
                            <small>Cod: {item.code}</small>
                          </div>
                          <div className="admin-panel-order-item-pricing">
                            <span>
                              {item.qty} x {formatMoney(item.price)} (
                              {order.discountApplied || 0}% off) ={" "}
                              {formatMoney(item.finalPrice ?? item.price)} c/u
                            </span>
                            <strong>
                              {formatMoney(
                                (item.finalPrice ?? item.price) * item.qty
                              )}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.comments && (
                      <>
                        <h5>Comentarios del Cliente</h5>
                        <p
                          style={{
                            fontStyle: "italic",
                            background: "#eee",
                            padding: "10px",
                            borderRadius: "5px",
                          }}
                        >
                          {order.comments}
                        </p>
                      </>
                    )}
                    <div className="admin-panel-order-actions">
                      <h5>Cambiar Estado</h5>
                      <div className="admin-panel-order-status-buttons">
                        <button
                          onClick={() => updateOrderStatus(order.id, "pending")}
                          className="admin-panel-btn-small"
                          disabled={order.status === "pending"}
                        >
                          A Pendiente
                        </button>
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "in_progress")
                          }
                          className="admin-panel-btn-small"
                          disabled={order.status === "in_progress"}
                        >
                          A En Proceso
                        </button>
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "completed")
                          }
                          className="admin-panel-btn-small admin-panel-btn-approve"
                          disabled={order.status === "completed"}
                        >
                          A Completado
                        </button>
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "cancelled")
                          }
                          className="admin-panel-btn-small admin-panel-btn-danger"
                          disabled={order.status === "cancelled"}
                        >
                          A Cancelado
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
