import React, { useState } from "react";
import styles from "../../styles/admin-panel.module.css";

// Componente para una Card de Cliente (reutilizable para pendientes y aprobados)
const ClientCard = ({
  client,
  expandedClient,
  setExpandedClient,
  children,
  tabSpecificBadges,
}) => (
  <div key={client.id} className={styles.adminPanelClientCardNew}>
    <div
      className={styles.adminPanelClientSummary}
      onClick={() =>
        setExpandedClient(expandedClient === client.id ? null : client.id)
      }
    >
      <div className={styles.adminPanelClientMainInfo}>
        <h4>{client.razonSocial || client.nombre || "Sin Nombre"}</h4>
        <p className={styles.adminPanelClientEmail}>{client.email}</p>
        <div className={styles.adminPanelClientBadges}>
          {tabSpecificBadges} {/* Renderiza badges específicos del tab */}
          <span className={`${styles.adminPanelAdminBadge} ${styles.adminPanelAdminBadgeInfo}`}>
            {client.posicionFiscal || "N/A"}
          </span>
        </div>
      </div>
      <div className={styles.adminPanelExpandIcon}>
        {expandedClient === client.id ? "▲" : "▼"}
      </div>
    </div>
    {expandedClient === client.id && children}{" "}
    {/* Renderiza detalles y acciones si está expandido */}
  </div>
);

// Componente para Detalles del Cliente (reutilizable)
const ClientDetailsGrid = ({ client }) => (
  <div className={styles.adminPanelDetailGrid}>
    <div className={styles.adminPanelDetailItem}>
      <strong>Nombre:</strong> <span>{client.nombre || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>Apellido:</strong> <span>{client.apellido || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>CUIT:</strong> <span>{client.cuit || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>Teléfono:</strong> <span>{client.telefonoMovil || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>Provincia:</strong> <span>{client.provincia || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>Ciudad:</strong> <span>{client.ciudad || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
      <strong>Código Postal:</strong>{" "}
      <span>{client.codigoPostal || "N/A"}</span>
    </div>
    <div className={styles.adminPanelDetailItem}>
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
    <div className={styles.adminPanelCard}>
      <h2 className={styles.adminPanelTitle}>Gestión de Clientes</h2>

      {/* Tabs */}
      <div className={styles.adminPanelClientsTabs}>
        <button
          className={`${styles.adminPanelClientsTab} ${
            clientsTab === "pendientes" ? styles.adminPanelClientsTabActive : ""
          }`}
          onClick={() => {
            setClientsTab("pendientes");
            setExpandedClient(null);
          }}
        >
          ⏳ Pendientes ({pendingClients.length})
        </button>
        <button
          className={`${styles.adminPanelClientsTab} ${
            clientsTab === "aprobados" ? styles.adminPanelClientsTabActive : ""
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
      <div className={styles.adminPanelSearchBox}>
        <input
          type="text"
          placeholder="🔍 Buscar por email, razón social o nombre..."
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          className={styles.adminPanelSearchInput}
        />
      </div>

      {/* Client Lists */}
      {clientsTab === "pendientes" && (
        <div className={styles.adminPanelClientsList}>
          {pendingClients.length === 0 ? (
            <div className={styles.adminPanelEmptyState}>
              <div className={styles.adminPanelEmptyIcon}>📭</div>
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
                  <span className={`${styles.adminPanelAdminBadge} ${styles.adminPanelAdminBadgePending}`}>
                    Pendiente
                  </span>
                }
              >
                {/* Detalles y Acciones para Pendientes */}
                <div className={styles.adminPanelClientDetails}>
                  <ClientDetailsGrid client={c} />
                  <div className={styles.adminPanelApprovalSection}>
                    <div className={styles.adminPanelApprovalHeader}>
                      <h4>Aprobar Usuario</h4>
                      <p>Selecciona la lista y el descuento</p>
                    </div>
                    <div className={styles.adminPanelApprovalControls}>
                      <div className={styles.adminPanelStateSelector}>
                        <button
                          className={`${styles.adminPanelStateBtn} ${
                            approvalState === 1
                              ? styles.adminPanelStateBtnActive
                              : ""
                          }`}
                          onClick={() => setApprovalState(1)}
                        >
                          Lista 1
                        </button>
                        <button
                          className={`${styles.adminPanelStateBtn} ${
                            approvalState === 2
                              ? styles.adminPanelStateBtnActive
                              : ""
                          }`}
                          onClick={() => setApprovalState(2)}
                        >
                          Lista 2
                        </button>
                      </div>
                      <div
                        className={styles.adminPanelFormGroup}
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
                          className={styles.adminPanelLoginInput}
                        />
                      </div>
                      <div className={styles.adminPanelApprovalActions}>
                        <button
                          onClick={() =>
                            approveClient(c.id, approvalState, approvalDiscount)
                          } // Pasar estado local
                          className={`${styles.adminPanelBtnSmall} ${styles.adminPanelBtnApprove}`}
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => rejectClient(c.id)}
                          className={`${styles.adminPanelBtnSmall} ${styles.adminPanelBtnDanger}`}
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
        <div className={styles.adminPanelClientsList}>
          {approvedClients.length === 0 ? (
            <div className={styles.adminPanelEmptyState}>
              <div className={styles.adminPanelEmptyIcon}>✅</div>
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
                      className={`${styles.adminPanelAdminBadge} ${
                        c.state === 1
                          ? styles.adminPanelAdminBadgeState1
                          : styles.adminPanelAdminBadgeState2
                      }`}
                    >
                      Lista {c.state || 1}
                    </span>
                    {c.descuento > 0 && (
                      <span className={`${styles.adminPanelAdminBadge} ${styles.adminPanelAdminBadgeInfo}`}>
                        {c.descuento}% OFF
                      </span>
                    )}
                  </>
                }
              >
                {/* Detalles y Acciones para Aprobados */}
                <div className={styles.adminPanelClientDetails}>
                  <ClientDetailsGrid client={c} />
                  <div className={styles.adminPanelClientActionsSection}>
                    <h4>Acciones</h4>
                    <div className={styles.adminPanelClientActions}>
                      <button
                        onClick={() => toggleState(c.id, 1)}
                        className={`${styles.adminPanelBtnSmall} ${
                          c.state === 1 ? styles.adminPanelActive : ""
                        }`}
                      >
                        Lista 1
                      </button>
                      <button
                        onClick={() => toggleState(c.id, 2)}
                        className={`${styles.adminPanelBtnSmall} ${
                          c.state === 2 ? styles.adminPanelActive : ""
                        }`}
                      >
                        Lista 2
                      </button>
                      <div
                        className={styles.adminPanelFormGroup}
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
                          className={styles.adminPanelLoginInput}
                          style={{ maxWidth: "80px", padding: "8px 10px" }}
                        />
                      </div>
                      <button
                        onClick={() => deleteClient(c.id)}
                        className={`${styles.adminPanelBtnSmall} ${styles.adminPanelBtnDanger}`}
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
