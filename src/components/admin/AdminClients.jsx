import React, { useState } from "react";

// Componente para una Card de Cliente (reutilizable para pendientes y aprobados)
const ClientCard = ({
  client,
  expandedClient,
  setExpandedClient,
  children,
  tabSpecificBadges,
}) => (
  <div key={client.id} className="admin-panel-client-card-new">
    <div
      className="admin-panel-client-summary"
      onClick={() =>
        setExpandedClient(expandedClient === client.id ? null : client.id)
      }
    >
      <div className="admin-panel-client-main-info">
        <h4>{client.razonSocial || client.nombre || "Sin Nombre"}</h4>
        <p className="admin-panel-client-email">{client.email}</p>
        <div className="admin-panel-client-badges">
          {tabSpecificBadges} {/* Renderiza badges específicos del tab */}
          <span className="admin-panel-admin-badge admin-panel-admin-badge-info">
            {client.posicionFiscal || "N/A"}
          </span>
        </div>
      </div>
      <div className="admin-panel-expand-icon">
        {expandedClient === client.id ? "▲" : "▼"}
      </div>
    </div>
    {expandedClient === client.id && children}{" "}
    {/* Renderiza detalles y acciones si está expandido */}
  </div>
);

// Componente para Detalles del Cliente (reutilizable)
const ClientDetailsGrid = ({ client }) => (
  <div className="admin-panel-detail-grid">
    <div className="admin-panel-detail-item">
      <strong>Nombre:</strong> <span>{client.nombre || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Apellido:</strong> <span>{client.apellido || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>CUIT:</strong> <span>{client.cuit || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Teléfono:</strong> <span>{client.telefonoMovil || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Provincia:</strong> <span>{client.provincia || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Ciudad:</strong> <span>{client.ciudad || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Código Postal:</strong>{" "}
      <span>{client.codigoPostal || "N/A"}</span>
    </div>
    <div className="admin-panel-detail-item">
      <strong>Registro:</strong>{" "}
      <span>
        {client.createdAt
          ? new Date(client.createdAt).toLocaleDateString("es-AR")
          : "N/A"}
      </span>
    </div>
  </div>
);

// Componente Principal de Clientes
const AdminClients = ({
  clients,
  clientSearch,
  setClientSearch,
  approveClient,
  rejectClient,
  toggleState,
  updateClientDiscount,
  deleteClient,
}) => {
  const [clientsTab, setClientsTab] = useState("pendientes");
  const [expandedClient, setExpandedClient] = useState(null);
  const [approvalState, setApprovalState] = useState(1); // Estado local para el form de aprobación
  const [approvalDiscount, setApprovalDiscount] = useState(0); // Estado local

  const pendingClients = clients.filter(
    (c) =>
      c.status === "pendiente" &&
      (c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.razonSocial?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.nombre?.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const approvedClients = clients.filter(
    (c) =>
      c.status === "aprobado" &&
      (c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.razonSocial?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.nombre?.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  return (
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Gestión de Clientes</h2>

      {/* Tabs */}
      <div className="admin-panel-clients-tabs">
        <button
          className={`admin-panel-clients-tab ${
            clientsTab === "pendientes" ? "admin-panel-clients-tab-active" : ""
          }`}
          onClick={() => {
            setClientsTab("pendientes");
            setExpandedClient(null);
          }}
        >
          ⏳ Pendientes ({pendingClients.length})
        </button>
        <button
          className={`admin-panel-clients-tab ${
            clientsTab === "aprobados" ? "admin-panel-clients-tab-active" : ""
          }`}
          onClick={() => {
            setClientsTab("aprobados");
            setExpandedClient(null);
          }}
        >
          ✅ Aprobados ({approvedClients.length})
        </button>
      </div>

      {/* Search */}
      <div className="admin-panel-search-box">
        <input
          type="text"
          placeholder="🔍 Buscar por email, razón social o nombre..."
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          className="admin-panel-search-input"
        />
      </div>

      {/* Client Lists */}
      {clientsTab === "pendientes" && (
        <div className="admin-panel-clients-list">
          {pendingClients.length === 0 ? (
            <div className="admin-panel-empty-state">
              <div className="admin-panel-empty-icon">📭</div>
              <p>No hay usuarios pendientes de aprobación</p>
            </div>
          ) : (
            pendingClients.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                expandedClient={expandedClient}
                setExpandedClient={setExpandedClient}
                tabSpecificBadges={
                  <span className="admin-panel-admin-badge admin-panel-admin-badge-pending">
                    Pendiente
                  </span>
                }
              >
                {/* Detalles y Acciones para Pendientes */}
                <div className="admin-panel-client-details">
                  <ClientDetailsGrid client={c} />
                  <div className="admin-panel-approval-section">
                    <div className="admin-panel-approval-header">
                      <h4>Aprobar Usuario</h4>
                      <p>Selecciona la lista y el descuento</p>
                    </div>
                    <div className="admin-panel-approval-controls">
                      <div className="admin-panel-state-selector">
                        <button
                          className={`admin-panel-state-btn ${
                            approvalState === 1
                              ? "admin-panel-state-btn-active"
                              : ""
                          }`}
                          onClick={() => setApprovalState(1)}
                        >
                          Lista 1
                        </button>
                        <button
                          className={`admin-panel-state-btn ${
                            approvalState === 2
                              ? "admin-panel-state-btn-active"
                              : ""
                          }`}
                          onClick={() => setApprovalState(2)}
                        >
                          Lista 2
                        </button>
                      </div>
                      <div
                        className="admin-panel-form-group"
                        style={{ maxWidth: "120px" }}
                      >
                        <label
                          style={{ fontSize: "12px", marginBottom: "4px" }}
                        >
                          Descuento (%)
                        </label>
                        <input
                          type="number"
                          value={approvalDiscount}
                          onChange={(e) => setApprovalDiscount(e.target.value)}
                          placeholder="0"
                          className="admin-panel-login-input"
                        />
                      </div>
                      <div className="admin-panel-approval-actions">
                        <button
                          onClick={() =>
                            approveClient(c.id, approvalState, approvalDiscount)
                          } // Pasar estado local
                          className="admin-panel-btn-small admin-panel-btn-approve"
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => rejectClient(c.id)}
                          className="admin-panel-btn-small admin-panel-btn-danger"
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ClientCard>
            ))
          )}
        </div>
      )}

      {clientsTab === "aprobados" && (
        <div className="admin-panel-clients-list">
          {approvedClients.length === 0 ? (
            <div className="admin-panel-empty-state">
              <div className="admin-panel-empty-icon">✅</div>
              <p>No hay clientes aprobados aún</p>
            </div>
          ) : (
            approvedClients.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                expandedClient={expandedClient}
                setExpandedClient={setExpandedClient}
                tabSpecificBadges={
                  <>
                    <span
                      className={`admin-panel-admin-badge ${
                        c.state === 1
                          ? "admin-panel-admin-badge-state1"
                          : "admin-panel-admin-badge-state2"
                      }`}
                    >
                      Lista {c.state || 1}
                    </span>
                    {c.descuento > 0 && (
                      <span className="admin-panel-admin-badge admin-panel-admin-badge-info">
                        {c.descuento}% OFF
                      </span>
                    )}
                  </>
                }
              >
                {/* Detalles y Acciones para Aprobados */}
                <div className="admin-panel-client-details">
                  <ClientDetailsGrid client={c} />
                  <div className="admin-panel-client-actions-section">
                    <h4>Acciones</h4>
                    <div className="admin-panel-client-actions">
                      <button
                        onClick={() => toggleState(c.id, 1)}
                        className={`admin-panel-btn-small ${
                          c.state === 1 ? "admin-panel-active" : ""
                        }`}
                      >
                        Lista 1
                      </button>
                      <button
                        onClick={() => toggleState(c.id, 2)}
                        className={`admin-panel-btn-small ${
                          c.state === 2 ? "admin-panel-active" : ""
                        }`}
                      >
                        Lista 2
                      </button>
                      <div
                        className="admin-panel-form-group"
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{ marginBottom: 0, whiteSpace: "nowrap" }}
                        >
                          Desc %:
                        </label>
                        <input
                          type="number"
                          defaultValue={c.descuento || 0}
                          onBlur={(e) =>
                            updateClientDiscount(c.id, e.target.value)
                          }
                          placeholder="0"
                          className="admin-panel-login-input"
                          style={{ maxWidth: "80px", padding: "8px 10px" }}
                        />
                      </div>
                      <button
                        onClick={() => deleteClient(c.id)}
                        className="admin-panel-btn-small admin-panel-btn-danger"
                        style={{ marginLeft: "auto" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </ClientCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminClients;
