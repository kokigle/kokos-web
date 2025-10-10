import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { uploadImage } from "./cloudinary";
import { db } from "./App";
import ProductForm from "./ProductForm";
import "./styles/admin-panel.css";

// Helper para formatear dinero
const formatMoney = (n) =>
  `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

export default function AdminPanel() {
  const mainContentRef = useRef(null);

  // Estados de autenticación
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  // Estados de datos
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  // Estados de UI
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Estados para gestión de clientes
  const [clientsTab, setClientsTab] = useState("pendientes");
  const [expandedClient, setExpandedClient] = useState(null);
  const [approvalState, setApprovalState] = useState(1);

  // Estados para gestión de pedidos
  const [ordersTab, setOrdersTab] = useState("pending");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState(""); // <-- NUEVO ESTADO PARA BÚSQUEDA

  // Estados de filtros
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  // Estados para editar inicio
  const [bannerImages, setBannerImages] = useState([]);
  const [homeCategories, setHomeCategories] = useState({
    img1: { url: "", redirect: "" },
    img2: { url: "", redirect: "" },
    img3: { url: "", redirect: "" },
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const scrollTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollTop();
  }, [view]);

  // Función para mostrar notificaciones
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Función para mostrar diálogo de confirmación
  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  // Función para resetear el formulario completamente
  const resetProductForm = () => {
    setEditingProduct(null);
  };

  // Efecto para manejar el cambio de vista
  useEffect(() => {
    if (view === "addProduct") {
      resetProductForm();
    }
  }, [view]);

  // Suscripciones a Firestore
  useEffect(() => {
    if (!authed) return;

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qOrders = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubBanner = onSnapshot(
      collection(db, "images/banner_images/urls"),
      (snap) => {
        const images = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.pos || 0) - (b.pos || 0));
        setBannerImages(images);
      }
    );

    const loadHomeCategories = async () => {
      const cats = { img1: {}, img2: {}, img3: {} };
      for (let i = 1; i <= 3; i++) {
        const docRef = doc(db, "images", `img${i}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          cats[`img${i}`] = docSnap.data();
        } else {
          cats[`img${i}`] = { url: "", redirect: "" };
        }
      }
      setHomeCategories(cats);
    };
    loadHomeCategories();

    return () => {
      unsubClients();
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubBanner();
    };
  }, [authed]);

  // Funciones de autenticación
  const loginAdmin = () => {
    if (secret === "admin123") {
      setAuthed(true);
    } else {
      showNotification("Clave admin incorrecta", "error");
    }
  };

  // Funciones para gestión de usuarios pendientes
  const approveClient = async (clientId) => {
    showConfirm(
      `¿Aprobar este usuario con Estado ${approvalState}?`,
      async () => {
        await updateDoc(doc(db, "clients", clientId), {
          status: "aprobado",
          state: approvalState,
        });
        showNotification(
          `Usuario aprobado con Estado ${approvalState}`,
          "success"
        );
        setExpandedClient(null);
      }
    );
  };

  const rejectClient = async (clientId) => {
    showConfirm(
      "¿Estás seguro de que deseas rechazar este usuario? Esto eliminará su cuenta.",
      async () => {
        await deleteDoc(doc(db, "clients", clientId));
        showNotification("Usuario rechazado y eliminado", "info");
        setExpandedClient(null);
      }
    );
  };

  // Funciones de clientes (actualizadas)
  const toggleState = async (id, state) => {
    await updateDoc(doc(db, "clients", id), { state });
    showNotification(`Estado actualizado a ${state}`);
  };

  const deleteClient = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este cliente?",
      async () => {
        await deleteDoc(doc(db, "clients", id));
        showNotification("Cliente eliminado");
        setExpandedClient(null);
      }
    );
  };
  // Funciones de Pedidos
  const updateOrderStatus = async (orderId, newStatus) => {
    showConfirm(
      `¿Cambiar el estado de este pedido a "${newStatus}"?`,
      async () => {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        showNotification(`Pedido actualizado a "${newStatus}"`);
      }
    );
  };

  // Funciones de productos
  const handleSubmitProduct = async (productData) => {
    setLoading(true);
    try {
      const existingUrls = (productData.multimedia || []).filter(
        (u) => typeof u === "string" && !u.startsWith("blob:")
      );

      const urls = [...existingUrls];

      if (productData.files && productData.files.length > 0) {
        const uploadPromises = productData.files.map((file) =>
          uploadImage(file)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        urls.push(...uploadedUrls.filter((url) => url));
      }

      const uniqueUrls = Array.from(new Set(urls));

      const cat = categories.find(
        (c) => String(c.id) === String(productData.category)
      );

      const product = {
        code: productData.code,
        name: productData.name,
        description: productData.description,
        multimedia: uniqueUrls,
        videos: productData.videos || [],
        price_state1: Number(productData.price_state1) || 0,
        price_state2: Number(productData.price_state2) || 0,
        stock: Number(productData.stock) || 0,
        cant_min: Number(productData.cant_min) || 1,
        ean: productData.ean,
        category: cat?.name || "",
        categoryId: cat?.id || "",
        subcategory: productData.subcategory || "",
        bulto: productData.bulto || "",
        colors: productData.colors || [],
      };

      if (productData.id) {
        await updateDoc(doc(db, "products", productData.id), product);
        showNotification("Producto actualizado exitosamente");
      } else {
        await addDoc(collection(db, "products"), product);
        showNotification("Producto agregado exitosamente");
      }

      resetProductForm();
      setView("products");
    } catch (err) {
      console.error(err);
      showNotification("Error al guardar producto: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (id, stock) => {
    await updateDoc(doc(db, "products", id), { stock });
    showNotification(
      stock === 1
        ? "Producto marcado como disponible"
        : "Producto marcado sin stock"
    );
  };

  const deleteProduct = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este producto?",
      async () => {
        await deleteDoc(doc(db, "products", id));
        showNotification("Producto eliminado");
      }
    );
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setView("editProduct");
  };

  // Funciones de categorías
  const addSubcategory = async (catId, subName) => {
    if (!subName) {
      showNotification("Nombre vacío", "error");
      return;
    }
    const normalized = subName.trim().toLowerCase().replace(/\s+/g, "_");
    await updateDoc(doc(db, "categories", catId), {
      subcategories: arrayUnion(normalized),
    });
    showNotification("Subcategoría agregada");
  };

  const removeSubcategory = async (catId, subName) => {
    showConfirm(
      `¿Estás seguro de que deseas eliminar la subcategoría "${subName}"?`,
      async () => {
        await updateDoc(doc(db, "categories", catId), {
          subcategories: arrayRemove(subName),
        });
        showNotification("Subcategoría eliminada");
      }
    );
  };

  // Funciones para editar inicio - Banner
  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    try {
      const currentMaxPos =
        bannerImages.length > 0
          ? Math.max(...bannerImages.map((img) => img.pos || 0))
          : 0;

      const uploadPromises = files.map(async (file, index) => {
        const url = await uploadImage(file);
        if (url) {
          const nextPos = currentMaxPos + index + 1;
          const nextId = `banner_images${Date.now()}_${index}`;
          await setDoc(doc(db, "images/banner_images/urls", nextId), {
            url,
            redirect: "novedades",
            pos: nextPos,
          });
        }
      });

      await Promise.all(uploadPromises);
      showNotification("Imágenes subidas exitosamente");
    } catch (err) {
      showNotification("Error al subir imágenes: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateBannerRedirect = async (id, redirect) => {
    await updateDoc(doc(db, "images/banner_images/urls", id), { redirect });
    showNotification("Redirección actualizada");
  };

  const deleteBannerImage = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen del banner?",
      async () => {
        await deleteDoc(doc(db, "images/banner_images/urls", id));
        await reorderBannerPositions();
        showNotification("Imagen eliminada");
      }
    );
  };

  const reorderBannerPositions = async () => {
    const remainingImages = bannerImages.filter((img) => img.id);
    const updatePromises = remainingImages.map((img, index) =>
      updateDoc(doc(db, "images/banner_images/urls", img.id), {
        pos: index + 1,
      })
    );
    await Promise.all(updatePromises);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...bannerImages];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    setBannerImages(newImages);
    setDraggedIndex(null);

    try {
      const updatePromises = newImages.map((img, index) =>
        updateDoc(doc(db, "images/banner_images/urls", img.id), {
          pos: index + 1,
        })
      );
      await Promise.all(updatePromises);
      showNotification("Orden actualizado");
    } catch (err) {
      showNotification("Error al reordenar: " + err.message, "error");
    }
  };

  // Funciones para categorías de inicio
  const handleHomeCategoryUpload = async (categoryKey, file) => {
    setLoading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const newData = {
          url,
          redirect: homeCategories[categoryKey]?.redirect || "novedades",
        };
        await setDoc(doc(db, "images", categoryKey), newData);

        setHomeCategories((prev) => ({
          ...prev,
          [categoryKey]: newData,
        }));

        showNotification("Imagen subida exitosamente");
      }
    } catch (err) {
      showNotification("Error al subir imagen: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateHomeCategoryRedirect = async (categoryKey, redirect) => {
    await updateDoc(doc(db, "images", categoryKey), { redirect });

    setHomeCategories((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        redirect: redirect,
      },
    }));

    showNotification("Redirección actualizada");
  };

  const deleteHomeCategoryImage = async (categoryKey) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen?",
      async () => {
        const newData = { url: "", redirect: "" };
        await setDoc(doc(db, "images", categoryKey), newData);

        setHomeCategories((prev) => ({
          ...prev,
          [categoryKey]: newData,
        }));

        showNotification("Imagen eliminada");
      }
    );
  };

  // Obtener todas las opciones de redirección
  const getRedirectOptions = () => {
    const options = ["ninguno", "novedades"];
    categories.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        options.push(sub);
      });
    });
    return options;
  };

  // Filtrar clientes pendientes y aprobados
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

  // Filtros de productos
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description || "")
        .toLowerCase()
        .includes(productSearch.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchSub = !filterSubcategory || p.subcategory === filterSubcategory;
    return matchSearch && matchCategory && matchSub;
  });
  // Filtrar pedidos por estado y búsqueda
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

  // Pantalla de login
  if (!authed) {
    return (
      <div className="admin-panel-login-container">
        <div className="admin-panel-login-card">
          <div className="admin-panel-login-header">
            <h2>Panel Administrativo</h2>
            <p>Ingrese la clave para continuar</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && loginAdmin()}
            placeholder="Clave de administrador"
            className="admin-panel-login-input"
          />
          <button onClick={loginAdmin} className="admin-panel-login-btn">
            Acceder
          </button>
        </div>
      </div>
    );
  }

  // Panel principal
  return (
    <div className="admin-panel-layout">
      {/* Notificaciones */}
      {notification && (
        <div
          className={`admin-panel-notification admin-panel-notification-${notification.type}`}
        >
          {notification.message}
        </div>
      )}

      {/* Diálogo de Confirmación */}
      {confirmDialog && (
        <div className="admin-panel-confirm-overlay">
          <div className="admin-panel-confirm-dialog">
            <div className="admin-panel-confirm-icon">⚠️</div>
            <h3>Confirmación</h3>
            <p>{confirmDialog.message}</p>
            <div className="admin-panel-confirm-actions">
              <button
                onClick={handleCancel}
                className="admin-panel-btn-confirm-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="admin-panel-btn-confirm-ok"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="admin-panel-loading-overlay">
          <div className="admin-panel-loading-spinner"></div>
          <p>Procesando...</p>
        </div>
      )}

      <aside className="admin-panel-sidebar">
        <div className="admin-panel-brand">
          <h3>KOKOS Admin</h3>
        </div>
        <nav className="admin-panel-nav">
          <button
            className={view === "dashboard" ? "admin-panel-active" : ""}
            onClick={() => setView("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={view === "clients" ? "admin-panel-active" : ""}
            onClick={() => {
              setView("clients");
              setExpandedClient(null);
            }}
          >
            👥 Clientes
          </button>
          <button
            className={view === "orders" ? "admin-panel-active" : ""}
            onClick={() => setView("orders")}
          >
            🛒 Pedidos
          </button>
          <button
            className={view === "products" ? "admin-panel-active" : ""}
            onClick={() => setView("products")}
          >
            📦 Productos
          </button>
          <button
            className={view === "addProduct" ? "admin-panel-active" : ""}
            onClick={() => {
              resetProductForm();
              setView("addProduct");
            }}
          >
            ➕ Agregar Producto
          </button>
          <button
            className={view === "categories" ? "admin-panel-active" : ""}
            onClick={() => setView("categories")}
          >
            🏷️ Categorías
          </button>
          <button
            className={view === "editHome" ? "admin-panel-active" : ""}
            onClick={() => setView("editHome")}
          >
            🏠 Editar inicio
          </button>
        </nav>
      </aside>

      <main className="admin-panel-content" ref={mainContentRef}>
        {view === "dashboard" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Dashboard</h2>
            <div className="admin-panel-dashboard-stats">
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
            </div>

            <div className="admin-panel-dashboard-categories">
              <h3>Subcategorías por categoría</h3>
              <div className="admin-panel-category-list">
                {categories.map((c) => (
                  <div key={c.id} className="admin-panel-category-item">
                    <strong>{c.name}</strong>
                    <span className="admin-panel-badge">
                      {(c.subcategories || []).length} subcategorías
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "clients" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Clientes</h2>

            {/* Tabs para Pendientes/Aprobados */}
            <div className="admin-panel-clients-tabs">
              <button
                className={`admin-panel-clients-tab ${
                  clientsTab === "pendientes"
                    ? "admin-panel-clients-tab-active"
                    : ""
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
                  clientsTab === "aprobados"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => {
                  setClientsTab("aprobados");
                  setExpandedClient(null);
                }}
              >
                ✅ Aprobados ({approvedClients.length})
              </button>
            </div>

            <div className="admin-panel-search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por email, razón social o nombre..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="admin-panel-search-input"
              />
            </div>

            {/* Lista de Clientes Pendientes */}
            {clientsTab === "pendientes" && (
              <div className="admin-panel-clients-list">
                {pendingClients.length === 0 ? (
                  <div className="admin-panel-empty-state">
                    <div className="admin-panel-empty-icon">📭</div>
                    <p>No hay usuarios pendientes de aprobación</p>
                  </div>
                ) : (
                  pendingClients.map((c) => (
                    <div key={c.id} className="admin-panel-client-card-new">
                      <div
                        className="admin-panel-client-summary"
                        onClick={() =>
                          setExpandedClient(
                            expandedClient === c.id ? null : c.id
                          )
                        }
                      >
                        <div className="admin-panel-client-main-info">
                          <h4>{c.razonSocial || "Sin razón social"}</h4>
                          <p className="admin-panel-client-email">{c.email}</p>
                          <div className="admin-panel-client-badges">
                            <span className="admin-panel-admin-badge admin-panel-admin-badge-pending">
                              Pendiente
                            </span>
                            <span className="admin-panel-admin-badge admin-panel-admin-badge-info">
                              {c.posicionFiscal || "Sin posición fiscal"}
                            </span>
                          </div>
                        </div>
                        <div className="admin-panel-expand-icon">
                          {expandedClient === c.id ? "▲" : "▼"}
                        </div>
                      </div>

                      {expandedClient === c.id && (
                        <div className="admin-panel-client-details">
                          <div className="admin-panel-detail-grid">
                            <div className="admin-panel-detail-item">
                              <strong>Nombre:</strong>
                              <span>{c.nombre || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Apellido:</strong>
                              <span>{c.apellido || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>CUIT:</strong>
                              <span>{c.cuit || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Teléfono:</strong>
                              <span>{c.telefonoMovil || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Provincia:</strong>
                              <span>{c.provincia || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Ciudad:</strong>
                              <span>{c.ciudad || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Código Postal:</strong>
                              <span>{c.codigoPostal || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Fecha de Registro:</strong>
                              <span>
                                {c.createdAt
                                  ? new Date(c.createdAt).toLocaleDateString(
                                      "es-AR"
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="admin-panel-approval-section">
                            <div className="admin-panel-approval-header">
                              <h4>Aprobar Usuario</h4>
                              <p>
                                Selecciona el estado con el que será aprobado
                              </p>
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
                                  Estado 1
                                </button>
                                <button
                                  className={`admin-panel-state-btn ${
                                    approvalState === 2
                                      ? "admin-panel-state-btn-active"
                                      : ""
                                  }`}
                                  onClick={() => setApprovalState(2)}
                                >
                                  Estado 2
                                </button>
                              </div>
                              <div className="admin-panel-approval-actions">
                                <button
                                  onClick={() => approveClient(c.id)}
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
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lista de Clientes Aprobados */}
            {clientsTab === "aprobados" && (
              <>
                <div className="admin-panel-clients-list">
                  {approvedClients.length === 0 ? (
                    <div className="admin-panel-empty-state">
                      <div className="admin-panel-empty-icon">📭</div>
                      <p>No hay clientes aprobados</p>
                    </div>
                  ) : (
                    approvedClients.map((c) => (
                      <div key={c.id} className="admin-panel-client-card-new">
                        <div
                          className="admin-panel-client-summary"
                          onClick={() =>
                            setExpandedClient(
                              expandedClient === c.id ? null : c.id
                            )
                          }
                        >
                          <div className="admin-panel-client-main-info">
                            <h4>{c.razonSocial || c.email}</h4>
                            <p className="admin-panel-client-email">
                              {c.email}
                            </p>
                            <div className="admin-panel-client-badges">
                              <span
                                className={`admin-panel-admin-badge ${
                                  c.state === 1
                                    ? "admin-panel-admin-badge-state1"
                                    : "admin-panel-admin-badge-state2"
                                }`}
                              >
                                Estado {c.state || 1}
                              </span>
                              {c.posicionFiscal && (
                                <span className="admin-panel-admin-badge admin-panel-admin-badge-info">
                                  {c.posicionFiscal}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="admin-panel-expand-icon">
                            {expandedClient === c.id ? "▲" : "▼"}
                          </div>
                        </div>

                        {expandedClient === c.id && (
                          <div className="admin-panel-client-details">
                            <div className="admin-panel-detail-grid">
                              <div className="admin-panel-detail-item">
                                <strong>Nombre:</strong>
                                <span>{c.nombre || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Apellido:</strong>
                                <span>{c.apellido || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Razón Social:</strong>
                                <span>{c.razonSocial || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Posición Fiscal:</strong>
                                <span>{c.posicionFiscal || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>CUIT:</strong>
                                <span>{c.cuit || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Teléfono:</strong>
                                <span>{c.telefonoMovil || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Provincia:</strong>
                                <span>{c.provincia || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Ciudad:</strong>
                                <span>{c.ciudad || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Código Postal:</strong>
                                <span>{c.codigoPostal || "N/A"}</span>
                              </div>
                              <div className="admin-panel-detail-item">
                                <strong>Fecha de Registro:</strong>
                                <span>
                                  {c.createdAt
                                    ? new Date(c.createdAt).toLocaleDateString(
                                        "es-AR"
                                      )
                                    : "N/A"}
                                </span>
                              </div>
                            </div>

                            <div className="admin-panel-client-actions-section">
                              <h4>Acciones</h4>
                              <div className="admin-panel-client-actions">
                                <button
                                  onClick={() => toggleState(c.id, 1)}
                                  className={`admin-panel-btn-small ${
                                    c.state === 1 ? "admin-panel-active" : ""
                                  }`}
                                >
                                  Estado 1
                                </button>
                                <button
                                  onClick={() => toggleState(c.id, 2)}
                                  className={`admin-panel-btn-small ${
                                    c.state === 2 ? "admin-panel-active" : ""
                                  }`}
                                >
                                  Estado 2
                                </button>
                                <button
                                  onClick={() => deleteClient(c.id)}
                                  className="admin-panel-btn-small admin-panel-btn-danger"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {view === "orders" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Pedidos</h2>
            <div className="admin-panel-clients-tabs">
              <button
                className={`admin-panel-clients-tab ${
                  ordersTab === "pending"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => setOrdersTab("pending")}
              >
                Pendientes (
                {orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                className={`admin-panel-clients-tab ${
                  ordersTab === "in_progress"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => setOrdersTab("in_progress")}
              >
                En Proceso (
                {orders.filter((o) => o.status === "in_progress").length})
              </button>
              <button
                className={`admin-panel-clients-tab ${
                  ordersTab === "completed"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => setOrdersTab("completed")}
              >
                Completados (
                {orders.filter((o) => o.status === "completed").length})
              </button>
              <button
                className={`admin-panel-clients-tab ${
                  ordersTab === "cancelled"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => setOrdersTab("cancelled")}
              >
                Cancelados (
                {orders.filter((o) => o.status === "cancelled").length})
              </button>
            </div>
            {/* **NUEVO: Barra de Búsqueda de Pedidos** */}
            <div className="admin-panel-search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por N° de pedido, razón social o email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="admin-panel-search-input"
              />
            </div>
            <div className="admin-panel-orders-list">
              {filteredOrders.length === 0 ? (
                <div className="admin-panel-empty-state">
                  <p>No hay pedidos que coincidan con la búsqueda.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const client = clients.find((c) => c.id === order.clientId);
                  const total = order.items.reduce(
                    (sum, item) => sum + item.price * item.qty,
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
                          <h4>
                            Pedido #{order.id.substring(0, 7).toUpperCase()}
                          </h4>
                          <p>{client?.razonSocial || order.clientEmail}</p>
                          <span>
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-AR"
                            )}
                          </span>
                        </div>
                        <div className="admin-panel-order-meta">
                          <span>{order.items.length} items</span>
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
                              {client?.razonSocial}
                            </p>
                            <p>
                              <strong>Email:</strong> {client?.email}
                            </p>
                            <p>
                              <strong>Teléfono:</strong> {client?.telefonoMovil}
                            </p>
                          </div>
                          <h5>Productos</h5>
                          <div className="admin-panel-order-items-list">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="admin-panel-order-item"
                              >
                                <img src={item.image} alt={item.name} />
                                <div className="admin-panel-order-item-info">
                                  <span>{item.name}</span>
                                  <small>Código: {item.code}</small>
                                </div>
                                <div className="admin-panel-order-item-pricing">
                                  <span>
                                    {item.qty} x {formatMoney(item.price)}
                                  </span>
                                  <strong>
                                    {formatMoney(item.qty * item.price)}
                                  </strong>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="admin-panel-order-actions">
                            <h5>Cambiar Estado</h5>
                            <div className="admin-panel-order-status-buttons">
                              {order.status !== "in_progress" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "in_progress")
                                  }
                                  className="admin-panel-btn-small"
                                >
                                  A "En Proceso"
                                </button>
                              )}
                              {order.status !== "completed" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "completed")
                                  }
                                  className="admin-panel-btn-small admin-panel-btn-approve"
                                >
                                  A "Completado"
                                </button>
                              )}
                              {order.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "cancelled")
                                  }
                                  className="admin-panel-btn-small admin-panel-btn-danger"
                                >
                                  A "Cancelado"
                                </button>
                              )}
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
        )}

        {view === "products" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Productos</h2>

            <div className="admin-panel-filters-section">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, código o descripción..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="admin-panel-search-input"
              />
              <div className="admin-panel-filter-row">
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterSubcategory("");
                  }}
                  className="admin-panel-filter-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
                  className="admin-panel-filter-select"
                  disabled={!filterCategory}
                >
                  <option value="">Todas las subcategorías</option>
                  {categories
                    .find((c) => c.name === filterCategory)
                    ?.subcategories?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="admin-panel-products-list">
              {filteredProducts.map((p) => (
                <div key={p.id} className="admin-panel-product-card-admin">
                  <div className="admin-panel-product-info">
                    <h4>{p.name}</h4>
                    <p className="admin-panel-product-code">Código: {p.code}</p>
                    <p className="admin-panel-product-category">
                      {p.category} {p.subcategory && `/ ${p.subcategory}`}
                    </p>
                    <div className="admin-panel-product-prices">
                      <span>Precio 1: ${p.price_state1}</span>
                      <span>Precio 2: ${p.price_state2}</span>
                    </div>
                  </div>
                  <div className="admin-panel-product-actions">
                    <span
                      className={`admin-panel-stock-badge ${
                        p.stock === 1
                          ? "admin-panel-in-stock"
                          : "admin-panel-out-stock"
                      }`}
                    >
                      {p.stock === 1 ? "En stock" : "Sin stock"}
                    </span>
                    <div className="admin-panel-action-buttons">
                      <button
                        onClick={() => toggleStock(p.id, p.stock === 1 ? 0 : 1)}
                        className="admin-panel-btn-small"
                      >
                        {p.stock === 1
                          ? "Marcar sin stock"
                          : "Marcar disponible"}
                      </button>
                      <button
                        onClick={() => editProduct(p)}
                        className="admin-panel-btn-small admin-panel-btn-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="admin-panel-btn-small admin-panel-btn-danger"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(view === "addProduct" ||
          (view === "editProduct" && editingProduct)) && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h2>
            <ProductForm
              initialData={editingProduct || {}}
              categories={categories}
              onSubmit={handleSubmitProduct}
              loading={loading}
              onCancel={() => {
                resetProductForm();
                setView("products");
              }}
            />
          </div>
        )}

        {view === "categories" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Categorías</h2>
            <div className="admin-panel-categories-list">
              {categories.map((c) => (
                <div key={c.id} className="admin-panel-category-card">
                  <div className="admin-panel-category-header">
                    <h3>{c.name}</h3>
                    <span className="admin-panel-badge">
                      {(c.subcategories || []).length} subcategorías
                    </span>
                  </div>
                  <div className="admin-panel-subcategories-list">
                    {(c.subcategories || []).map((s) => (
                      <div key={s} className="admin-panel-subcategory-item">
                        <span>{s}</span>
                        <button
                          onClick={() => removeSubcategory(c.id, s)}
                          className="admin-panel-btn-remove-sub"
                        >
                          × Eliminar
                        </button>
                      </div>
                    ))}
                    {(!c.subcategories || c.subcategories.length === 0) && (
                      <p className="admin-panel-empty-message">
                        Sin subcategorías
                      </p>
                    )}
                  </div>
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      addSubcategory(c.id, ev.target.sub.value);
                      ev.target.reset();
                    }}
                    className="admin-panel-add-subcategory-form"
                  >
                    <input
                      name="sub"
                      placeholder="Nueva subcategoría"
                      required
                    />
                    <button type="submit" className="admin-panel-btn-add-sub">
                      + Agregar
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "editHome" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Editar Página de Inicio</h2>
            <div className="admin-panel-home-section">
              <h3 className="admin-panel-section-title">Banner del Inicio</h3>
              <div className="admin-panel-banner-upload-section">
                <label className="admin-panel-btn-upload">
                  📤 Subir imágenes al banner
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBannerUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </label>
              </div>
              <div className="admin-panel-banner-images-list">
                {bannerImages.map((img, index) => (
                  <div
                    key={img.id}
                    className="admin-panel-banner-image-item"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                  >
                    <div className="admin-panel-drag-handle">⋮⋮</div>
                    <img src={img.url} alt={`Banner ${index + 1}`} />
                    <div className="admin-panel-banner-controls">
                      <select
                        value={img.redirect}
                        onChange={(e) =>
                          updateBannerRedirect(img.id, e.target.value)
                        }
                        className="admin-panel-redirect-select"
                      >
                        {getRedirectOptions().map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteBannerImage(img.id)}
                        className="admin-panel-btn-remove-inline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-panel-home-section">
              <h3 className="admin-panel-section-title">
                Categorías del Inicio (3)
              </h3>
              <div className="admin-panel-home-categories-grid">
                {["img1", "img2", "img3"].map((key, index) => (
                  <div key={key} className="admin-panel-home-category-card">
                    <h4>Categoría {index + 1}</h4>
                    {homeCategories[key]?.url ? (
                      <div className="admin-panel-home-category-preview">
                        <img src={homeCategories[key].url} alt={key} />
                        <button
                          onClick={() => deleteHomeCategoryImage(key)}
                          className="admin-panel-btn-remove"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="admin-panel-home-category-empty">
                        <label className="admin-panel-btn-upload-small">
                          📤 Subir imagen
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files[0] &&
                              handleHomeCategoryUpload(key, e.target.files[0])
                            }
                            style={{ display: "none" }}
                            disabled={loading}
                          />
                        </label>
                      </div>
                    )}
                    <select
                      value={homeCategories[key]?.redirect || "novedades"}
                      onChange={(e) =>
                        updateHomeCategoryRedirect(key, e.target.value)
                      }
                      className="admin-panel-redirect-select-full"
                      disabled={!homeCategories[key]?.url}
                    >
                      {getRedirectOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
