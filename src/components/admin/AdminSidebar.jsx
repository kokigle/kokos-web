import React from "react";

const AdminSidebar = ({ view, setView, resetProductForm }) => {
  const handleSetView = (newView) => {
    if (newView === "addProduct") {
      resetProductForm();
    }
    setView(newView);
  };

  return (
    <aside className="admin-panel-sidebar">
      <div className="admin-panel-brand">
        <h3>KOKOS Admin</h3>
      </div>
      <nav className="admin-panel-nav">
        <button
          className={view === "dashboard" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={view === "clients" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("clients")}
        >
          👥 Clientes
        </button>
        <button
          className={view === "orders" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("orders")}
        >
          🛒 Pedidos
        </button>
        <button
          className={view === "products" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("products")}
        >
          📦 Productos
        </button>
        <button
          className={view === "addProduct" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("addProduct")}
        >
          ➕ Agregar Producto
        </button>
        <button
          className={view === "increasePrices" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("increasePrices")}
        >
          💲 Aumento de Precios
        </button>
        <button
          className={view === "categories" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("categories")}
        >
          🏷️ Categorías
        </button>
        <button
          className={view === "editHome" ? "admin-panel-active" : ""}
          onClick={() => handleSetView("editHome")}
        >
          🏠 Editar inicio
        </button>
        {/* Puedes añadir más botones si es necesario */}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
