import React from "react";
import { getDescendantIds } from "../../utils/categoryutils"; // Asume que creas este archivo

const AdminDashboard = ({
  pendingClients,
  approvedClients,
  products,
  orders,
  categoryTree,
  categoriesMap,
}) => {
  // Asegúrate de que `getDescendantIds` esté disponible, ya sea importándola o definiéndola aquí.
  // Ejemplo de definición local si no quieres crear `utils`:
  const getDescendantIdsLocal = (categoryId, map) => {
    let ids = [categoryId];
    const nodesArray = Object.values(map);
    const children = nodesArray.filter((c) => c.parentId === categoryId);
    if (children.length > 0) {
      children.forEach((child) => {
        ids = ids.concat(getDescendantIdsLocal(child.id, map));
      });
    }
    return ids;
  };

  return (
    <div className="admin-panel-card">
      <h2 className="admin-panel-title">Dashboard</h2>
      <div className="admin-panel-dashboard-stats">
        {/* Stat Cards */}
        <div className="admin-panel-stat-card">
          <div className="admin-panel-stat-icon">⏳</div>
          <div className="admin-panel-stat-info">
            <h3>{pendingClients.length}</h3>
            <p>Usuarios Pendientes</p>
          </div>
        </div>
        <div className="admin-panel-stat-card">
          <div className="admin-panel-stat-icon">👥</div>
          <div className="admin-panel-stat-info">
            <h3>{approvedClients.length}</h3>
            <p>Clientes Aprobados</p>
          </div>
        </div>
        <div className="admin-panel-stat-card">
          <div className="admin-panel-stat-icon">📦</div>
          <div className="admin-panel-stat-info">
            <h3>{products.length}</h3>
            <p>Productos</p>
          </div>
        </div>
        <div className="admin-panel-stat-card">
          <div className="admin-panel-stat-icon">🛒</div>
          <div className="admin-panel-stat-info">
            <h3>{orders.filter((o) => o.status === "pending").length}</h3>
            <p>Pedidos Pendientes</p>
          </div>
        </div>
      </div>

      {/* Category Structure Preview */}
      <div className="admin-panel-dashboard-categories">
        <h3>Estructura de Categorías</h3>
        <div className="admin-panel-category-list">
          {categoryTree.length === 0 ? (
            <p className="admin-panel-empty-message">
              No hay categorías creadas.
            </p>
          ) : (
            categoryTree.map((rootNode) => (
              <div key={rootNode.id} className="admin-panel-category-item">
                <strong>{rootNode.name}</strong>
                <span className="admin-panel-badge">
                  {/* Usa la función local o importada */}
                  {getDescendantIdsLocal(rootNode.id, categoriesMap).length -
                    1}{" "}
                  subcategorías
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
