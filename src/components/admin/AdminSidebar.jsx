import React from "react";
import styles from "../../styles/admin-panel.module.css";

const AdminSidebar = ({ view, setView, resetProductForm }) => {
  const handleSetView = (newView) => {
    if (newView === "addProduct") {
      resetProductForm();
    }
    setView(newView);
  };

  return (
    <aside className={styles.adminPanelSidebar}>
      <div className={styles.adminPanelBrand}>
        <h3>KOKOS Admin</h3>
      </div>
      <nav className={styles.adminPanelNav}>
        <button
          className={view === "dashboard" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={view === "clients" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("clients")}
        >
          👥 Clientes
        </button>
        <button
          className={view === "orders" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("orders")}
        >
          🛒 Pedidos
        </button>
        <button
          className={view === "products" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("products")}
        >
          📦 Productos
        </button>
        <button
          className={view === "addProduct" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("addProduct")}
        >
          ➕ Agregar Producto
        </button>
        <button
          className={view === "increasePrices" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("increasePrices")}
        >
          💲 Aumento de Precios
        </button>
        <button
          className={view === "categories" ? styles.adminPanelActive : ""}
          onClick={() => handleSetView("categories")}
        >
          🏷️ Categorías
        </button>
        <button
          className={view === "editHome" ? styles.adminPanelActive : ""}
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
