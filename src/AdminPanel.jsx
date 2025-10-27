import React, { useState, useEffect, useRef, useCallback } from "react";
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
  writeBatch,
  where, // <- Importar where
  getDocs, // <- Importar getDocs
} from "firebase/firestore";
import { uploadImage } from "./cloudinary";
import { db } from "./App";
import ProductForm from "./ProductForm";
import "./styles/admin-panel.css"; // Asegúrate que la ruta sea correcta
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPlus,
  FaTrash,
  FaPencilAlt,
} from "react-icons/fa";
// Helper para formatear dinero
const formatMoney = (n) =>
  `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

// --- NUEVO: Helper para construir el árbol de categorías ---
const buildCategoryTree = (categories) => {
  const map = {};
  const roots = [];
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  categories.forEach((cat) => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else {
      // Solo añadir nodos raíz si no tienen padre o si el padre no existe (manejo de datos huérfanos)
      if (!cat.parentId || !map[cat.parentId]) {
        roots.push(map[cat.id]);
      }
    }
  });
  // Ordenar hijos alfabéticamente
  Object.values(map).forEach((node) => {
    if (node.children) {
      // Verificar si 'children' existe
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};

// --- NUEVO: Helper para obtener la ruta de una categoría ---
const getCategoryPath = (categoryId, categoriesMap) => {
  const path = [];
  let current = categoriesMap[categoryId];
  while (current) {
    path.unshift(current.name); // Añadir al principio
    current = categoriesMap[current.parentId];
  }
  return path;
};

// --- NUEVO: Helper para obtener todos los IDs descendientes ---
const getDescendantIds = (categoryId, categoriesMap) => {
  let ids = [categoryId];
  // Convertir el mapa a un array de nodos para buscar
  const nodesArray = Object.values(categoriesMap);
  const node = nodesArray.find((c) => c.id === categoryId);

  // Encuentra los hijos directos del nodo actual en el mapa
  const children = nodesArray.filter((c) => c.parentId === categoryId);

  if (children.length > 0) {
    children.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id, categoriesMap));
    });
  }
  return ids;
};

export default function AdminPanel() {
  const mainContentRef = useRef(null);

  // Estados de autenticación
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  // Estados de datos
  const [clients, setClients] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({}); // <- Mapa para acceso rápido
  const [categoryTree, setCategoryTree] = useState([]); // <- Estructura de árbol
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
  const [approvalDiscount, setApprovalDiscount] = useState(0);

  // Estados para gestión de pedidos
  const [ordersTab, setOrdersTab] = useState("pending");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");

  // Estados de filtros
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState(""); // ID de hoja o nodo

  // Estados para editar inicio
  const [bannerImages, setBannerImages] = useState([]);
  const [homeCategories, setHomeCategories] = useState({
    img1: { url: "", redirect: "" },
    img2: { url: "", redirect: "" },
    img3: { url: "", redirect: "" },
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Estados para aumento de precios
  const [increasePercentage, setIncreasePercentage] = useState(0);
  const [roundingZeros, setRoundingZeros] = useState(0);
  const [priceCategoryFilterId, setPriceCategoryFilterId] = useState("");
  const [pricePreview, setPricePreview] = useState([]);

  // Estados para gestión de categorías
  const [editingCategory, setEditingCategory] = useState(null); // { id, name, parentId }
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState(null);

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

    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCategories = onSnapshot(
      query(collection(db, "categories"), orderBy("name")),
      (snap) => {
        const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(flatList);
        const map = {};
        flatList.forEach((cat) => (map[cat.id] = cat));
        setCategoriesMap(map);
        setCategoryTree(buildCategoryTree(flatList));
      }
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
      // Consider securely managing secrets
      setAuthed(true);
    } else {
      showNotification("Clave admin incorrecta", "error");
    }
  };

  // Funciones para gestión de usuarios pendientes
  const approveClient = async (clientId) => {
    showConfirm(
      `¿Aprobar este usuario con Lista ${approvalState} y ${approvalDiscount}% de descuento?`,
      async () => {
        setLoading(true);
        try {
          await updateDoc(doc(db, "clients", clientId), {
            status: "aprobado",
            state: approvalState,
            descuento: Number(approvalDiscount) || 0,
          });
          showNotification(
            `Usuario aprobado con Lista ${approvalState} y ${approvalDiscount}% de descuento`,
            "success"
          );
          setExpandedClient(null);
        } catch (error) {
          console.error("Error approving client:", error);
          showNotification("Error al aprobar cliente.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const rejectClient = async (clientId) => {
    showConfirm(
      "¿Estás seguro de que deseas rechazar este usuario? Esto eliminará su cuenta.",
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "clients", clientId));
          showNotification("Usuario rechazado y eliminado", "info");
          setExpandedClient(null);
        } catch (error) {
          console.error("Error rejecting client:", error);
          showNotification("Error al rechazar cliente.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Funciones de clientes
  const toggleState = async (id, state) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "clients", id), { state });
      showNotification(`Lista actualizada a ${state}`);
    } catch (error) {
      console.error("Error updating client state:", error);
      showNotification("Error al actualizar la lista.", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateClientDiscount = async (id, newDiscount) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "clients", id), {
        descuento: Number(newDiscount) || 0,
      });
      showNotification(`Descuento actualizado a ${newDiscount}%`);
    } catch (error) {
      console.error("Error updating client discount:", error);
      showNotification("Error al actualizar el descuento.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este cliente?",
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "clients", id));
          showNotification("Cliente eliminado");
          setExpandedClient(null);
        } catch (error) {
          console.error("Error deleting client:", error);
          showNotification("Error al eliminar cliente.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };
  // Funciones de Pedidos
  const updateOrderStatus = async (orderId, newStatus) => {
    showConfirm(
      `¿Cambiar el estado de este pedido a "${newStatus.replace("_", " ")}"?`,
      async () => {
        setLoading(true);
        try {
          await updateDoc(doc(db, "orders", orderId), { status: newStatus });
          showNotification(
            `Pedido actualizado a "${newStatus.replace("_", " ")}"`
          );
        } catch (error) {
          console.error("Error updating order status:", error);
          showNotification("Error al actualizar estado del pedido.", "error");
        } finally {
          setLoading(false);
        }
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
      const categoryId = productData.category;
      const categoryPath = categoryId
        ? getCategoryPath(categoryId, categoriesMap)
        : [];

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
        categoryId: categoryId || "",
        categoryPath: categoryPath,
        bulto: productData.bulto || "",
        colors: productData.colors || [],
        medidas: productData.medidas || [],
      };
      // Remove legacy fields if they exist from form submission
      delete product.category;
      delete product.subcategory;

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

  const getFilteredProductsForPriceIncrease = () => {
    if (!priceCategoryFilterId) return products;
    const descendantIds = getDescendantIds(
      priceCategoryFilterId,
      categoriesMap
    );
    return products.filter((p) => descendantIds.includes(p.categoryId));
  };

  const handlePricePreview = () => {
    if (increasePercentage === 0) {
      showNotification("El porcentaje debe ser diferente a 0", "error");
      return;
    }
    const filtered = getFilteredProductsForPriceIncrease();
    if (filtered.length === 0) {
      showNotification(
        "No hay productos en la categoría seleccionada para previsualizar.",
        "info"
      );
      setPricePreview([]);
      return;
    }
    const factor = 1 + increasePercentage / 100;
    const roundingFactor = Math.pow(10, roundingZeros);

    const previewData = filtered.map((product) => {
      const newPrice1 = product.price_state1 * factor;
      const newPrice2 = product.price_state2 * factor;

      const roundedPrice1 =
        Math.round(newPrice1 / roundingFactor) * roundingFactor;
      const roundedPrice2 =
        Math.round(newPrice2 / roundingFactor) * roundingFactor;
      return {
        id: product.id,
        name: product.name,
        oldPrice1: product.price_state1,
        newPrice1: roundedPrice1,
        oldPrice2: product.price_state2,
        newPrice2: roundedPrice2,
      };
    });
    setPricePreview(previewData);
  };

  const handlePriceChange = (id, priceType, value) => {
    setPricePreview((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [priceType]: Number(value) } : p))
    );
  };

  const handlePriceIncrease = async () => {
    if (pricePreview.length === 0) {
      showNotification(
        "No hay precios previsualizados para actualizar",
        "error"
      );
      return;
    }

    showConfirm(
      `¿Estás seguro de que deseas actualizar los precios de ${pricePreview.length} productos? Esta acción es irreversible.`,
      async () => {
        setLoading(true);
        try {
          const batch = writeBatch(db);

          pricePreview.forEach((product) => {
            const productRef = doc(db, "products", product.id);
            batch.update(productRef, {
              price_state1: product.newPrice1,
              price_state2: product.newPrice2,
            });
          });

          await batch.commit();
          showNotification(
            `Precios actualizados para ${pricePreview.length} productos`,
            "success"
          );
          setPricePreview([]);
          setIncreasePercentage(0); // Reset percentage after applying
        } catch (error) {
          console.error("Error al actualizar precios:", error);
          showNotification("Error al actualizar precios", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const toggleStock = async (id, stock) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "products", id), { stock });
      showNotification(
        stock === 1
          ? "Producto marcado como disponible"
          : "Producto marcado sin stock"
      );
    } catch (error) {
      console.error("Error updating stock:", error);
      showNotification("Error al actualizar el stock.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este producto?",
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "products", id));
          showNotification("Producto eliminado");
        } catch (error) {
          console.error("Error deleting product:", error);
          showNotification("Error al eliminar el producto.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setView("editProduct");
  };

  // --- Funciones de categorías ---
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      showNotification("El nombre no puede estar vacío", "error");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: name,
        parentId: newCategoryParentId || null,
      });
      showNotification(`Categoría "${name}" agregada`);
      setNewCategoryName("");
      setNewCategoryParentId(null);
    } catch (error) {
      console.error("Error adding category:", error);
      showNotification("Error al agregar categoría", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.id) return;
    const name = newCategoryName.trim();
    if (!name) {
      showNotification("El nombre no puede estar vacío", "error");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: name,
        parentId: newCategoryParentId || null,
      });
      showNotification(`Categoría "${name}" actualizada`);
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryParentId(null);
    } catch (error) {
      console.error("Error updating category:", error);
      showNotification("Error al actualizar categoría", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    showConfirm(
      `¿Estás seguro de que deseas eliminar la categoría "${categoryName}" y TODAS sus subcategorías? Los productos asociados quedarán sin categoría.`,
      async () => {
        setLoading(true);
        try {
          const descendantIds = getDescendantIds(categoryId, categoriesMap);

          // 1. Desasociar productos
          const productsToUpdateQuery = query(
            collection(db, "products"),
            where("categoryId", "in", descendantIds)
          );
          const productsSnapshot = await getDocs(productsToUpdateQuery);
          const productBatch = writeBatch(db);
          productsSnapshot.forEach((productDoc) => {
            productBatch.update(doc(db, "products", productDoc.id), {
              categoryId: "",
              categoryPath: [],
            });
          });
          await productBatch.commit();

          // 2. Eliminar categorías
          const categoryBatch = writeBatch(db);
          descendantIds.forEach((id) => {
            categoryBatch.delete(doc(db, "categories", id));
          });
          await categoryBatch.commit();

          showNotification(
            `Categoría "${categoryName}" y sus subcategorías eliminadas`
          );
        } catch (error) {
          console.error("Error deleting category:", error);
          showNotification("Error al eliminar categoría", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryParentId(category.parentId || null);
    scrollTop(); // Scroll up to see the form
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryParentId(null);
  };

  // Funciones para editar inicio - Banner
  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
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
          const nextId = `banner_${Date.now()}_${index}`; // Use a more descriptive ID
          await setDoc(doc(db, "images/banner_images/urls", nextId), {
            url,
            redirect: "ninguno", // Default to 'ninguno'
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
      e.target.value = null; // Reset file input
    }
  };

  const updateBannerRedirect = async (id, redirect) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "images/banner_images/urls", id), { redirect });
      showNotification("Redirección actualizada");
    } catch (error) {
      console.error("Error updating banner redirect:", error);
      showNotification("Error al actualizar redirección.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteBannerImage = async (id) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen del banner?",
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "images/banner_images/urls", id));
          // No es necesario llamar a reorder aquí explícitamente si el useEffect ya escucha cambios
          showNotification("Imagen eliminada");
        } catch (error) {
          console.error("Error deleting banner image:", error);
          showNotification("Error al eliminar imagen.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Reordenar posiciones después de eliminar o al arrastrar
  useEffect(() => {
    if (!authed || view !== "editHome") return; // Solo reordenar si estamos en la vista correcta y autenticados

    const reorderBannerPositions = async () => {
      const needsReorder = bannerImages.some(
        (img, index) => (img.pos || 0) !== index + 1
      );
      if (!needsReorder) return;

      setLoading(true); // Indicar carga durante la reordenación
      try {
        const batch = writeBatch(db);
        bannerImages.forEach((img, index) => {
          batch.update(doc(db, "images/banner_images/urls", img.id), {
            pos: index + 1,
          });
        });
        await batch.commit();
        // No mostrar notificación aquí para evitar spam durante drag/drop
      } catch (err) {
        console.error("Error reordering banner:", err);
        showNotification("Error al reordenar banners", "error");
      } finally {
        setLoading(false);
      }
    };

    // Reordenar si el número de imágenes cambia (ej. al eliminar)
    reorderBannerPositions();
  }, [bannerImages.length, authed, view]); // Depender de la longitud para detectar eliminaciones

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necesario para permitir el drop
  };

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Optimistic UI update
    const newImages = [...bannerImages];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    setBannerImages(newImages); // Actualiza el estado local inmediatamente
    setDraggedIndex(null);

    // Actualizar Firestore en segundo plano
    setLoading(true);
    try {
      const batch = writeBatch(db);
      newImages.forEach((img, index) => {
        batch.update(doc(db, "images/banner_images/urls", img.id), {
          pos: index + 1,
        });
      });
      await batch.commit();
      showNotification("Orden del banner actualizado");
    } catch (err) {
      console.error("Error saving banner order:", err);
      showNotification("Error al guardar el nuevo orden", "error");
      // Revertir si falla? (Opcional, podría causar parpadeo)
      // const revertUnsub = onSnapshot(...) // Volver a cargar desde Firestore
    } finally {
      setLoading(false);
    }
  };

  // Funciones para categorías de inicio
  const handleHomeCategoryUpload = async (categoryKey, file) => {
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const currentData = homeCategories[categoryKey] || {};
        const newData = {
          url,
          redirect: currentData.redirect || "ninguno", // Conservar redirect existente o default
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
    setLoading(true);
    try {
      await updateDoc(doc(db, "images", categoryKey), { redirect });

      setHomeCategories((prev) => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          redirect: redirect,
        },
      }));

      showNotification("Redirección actualizada");
    } catch (error) {
      console.error("Error updating home category redirect:", error);
      showNotification("Error al actualizar redirección.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHomeCategoryImage = async (categoryKey) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta imagen?",
      async () => {
        setLoading(true);
        try {
          const newData = { url: "", redirect: "" };
          await setDoc(doc(db, "images", categoryKey), newData);

          setHomeCategories((prev) => ({
            ...prev,
            [categoryKey]: newData,
          }));

          showNotification("Imagen eliminada");
        } catch (error) {
          console.error("Error deleting home category image:", error);
          showNotification("Error al eliminar imagen.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Obtener todas las opciones de redirección
  const getRedirectOptions = useCallback(() => {
    const options = [
      { value: "ninguno", label: "Ninguno" },
      { value: "novedades", label: "Novedades" },
      // Agrega otras rutas estáticas si existen, p.ej. /nosotros, /contacto
      // { value: "/nosotros", label: "Nosotros" },
    ];
    const traverse = (nodes, prefix = "") => {
      nodes.forEach((node) => {
        const label = prefix ? `${prefix} > ${node.name}` : node.name;
        // Usar el ID como valor para redireccionar a la categoría
        options.push({ value: node.id, label: `Categoría: ${label}` });
        if (node.children && node.children.length > 0) {
          traverse(node.children, label);
        }
      });
    };
    traverse(categoryTree);
    return options;
  }, [categoryTree]);

  // Filtrar clientes
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

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    const searchLower = productSearch.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      (p.code || "").toLowerCase().includes(searchLower);

    let matchCategory = true;
    if (selectedFilterCategoryId) {
      const descendantIds = getDescendantIds(
        selectedFilterCategoryId,
        categoriesMap
      );
      matchCategory = descendantIds.includes(p.categoryId);
    }

    return matchSearch && matchCategory;
  });

  // Filtrar pedidos
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

  const CategoryTreeNode = ({ node, level = 0, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        style={{ marginLeft: `${level * 20}px` }}
        className="admin-panel-category-tree-node"
      >
        <div className="admin-panel-category-tree-item">
          <span
            onClick={() => hasChildren && setIsOpen(!isOpen)}
            style={{
              cursor: hasChildren ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {hasChildren ? (
              isOpen ? (
                <FaFolderOpen />
              ) : (
                <FaFolder />
              )
            ) : (
              <FaFile style={{ marginLeft: "18px", color: "#ccc" }} /> // Placeholder con ícono
            )}
            {node.name}
          </span>
          <div className="admin-panel-category-tree-actions">
            <button onClick={() => onEdit(node)} title="Editar">
              <FaPencilAlt />
            </button>
            <button
              onClick={() => onDelete(node.id, node.name)}
              title="Eliminar"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        {isOpen && hasChildren && (
          <div className="admin-panel-category-tree-children">
            {node.children.map((child) => (
              <CategoryTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const CategoryParentSelector = ({
    categories, // Lista plana de categorías
    categoryTree, // Árbol para estructura
    categoriesMap, // Mapa para lookup rápido
    value, // ID del padre seleccionado (puede ser null)
    onChange, // Función para manejar cambio
    currentCategoryId = null, // ID de la categoría que se está editando (para evitar ciclos)
  }) => {
    const options = [{ id: null, name: "Raíz (sin padre)", level: 0 }];

    const buildOptions = (nodes, level = 0) => {
      nodes.forEach((node) => {
        // Prevenir seleccionarse a sí mismo o a sus descendientes
        let isDescendant = false;
        if (currentCategoryId) {
          const descendants = getDescendantIds(node.id, categoriesMap);
          isDescendant = descendants.includes(currentCategoryId);
        }

        if (node.id !== currentCategoryId && !isDescendant) {
          options.push({ id: node.id, name: node.name, level });
          const children = categories.filter((c) => c.parentId === node.id); // Encuentra hijos en la lista plana
          children.sort((a, b) => a.name.localeCompare(b.name)); // Ordena hijos
          if (children.length > 0) {
            buildOptions(children, level + 1);
          }
        }
      });
    };

    // Construye las opciones desde el árbol para mantener la jerarquía visual
    const sortedRoots = categoryTree.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    buildOptions(sortedRoots); // Usa el árbol ordenado

    return (
      <select
        value={value === null ? "" : value}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value)
        }
        className="admin-panel-filter-select" // Reutiliza estilo existente
      >
        {options.map((opt) => (
          <option key={opt.id || "root"} value={opt.id === null ? "" : opt.id}>
            {"--".repeat(opt.level) + " " + opt.name}
          </option>
        ))}
      </select>
    );
  };

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
            onClick={() => {
              setView("orders");
              setExpandedOrder(null);
            }}
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
            className={view === "increasePrices" ? "admin-panel-active" : ""}
            onClick={() => {
              setView("increasePrices");
              setPricePreview([]); // Reset preview when switching view
              setIncreasePercentage(0);
            }}
          >
            💲 Aumento de Precios
          </button>
          <button
            className={view === "categories" ? "admin-panel-active" : ""}
            onClick={() => {
              setView("categories");
              cancelEditingCategory(); // Reset form when switching to categories view
            }}
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
        {/* Dashboard */}
        {view === "dashboard" && (
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
                    <div
                      key={rootNode.id}
                      className="admin-panel-category-item"
                    >
                      <strong>{rootNode.name}</strong>
                      <span className="admin-panel-badge">
                        {getDescendantIds(rootNode.id, categoriesMap).length -
                          1}{" "}
                        subcategorías
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clients */}
        {view === "clients" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Clientes</h2>

            {/* Tabs */}
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
                    <div key={c.id} className="admin-panel-client-card-new">
                      {/* Summary */}
                      <div
                        className="admin-panel-client-summary"
                        onClick={() =>
                          setExpandedClient(
                            expandedClient === c.id ? null : c.id
                          )
                        }
                      >
                        <div className="admin-panel-client-main-info">
                          <h4>{c.razonSocial || c.nombre || "Sin Nombre"}</h4>
                          <p className="admin-panel-client-email">{c.email}</p>
                          <div className="admin-panel-client-badges">
                            <span className="admin-panel-admin-badge admin-panel-admin-badge-pending">
                              Pendiente
                            </span>
                            <span className="admin-panel-admin-badge admin-panel-admin-badge-info">
                              {c.posicionFiscal || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="admin-panel-expand-icon">
                          {expandedClient === c.id ? "▲" : "▼"}
                        </div>
                      </div>
                      {/* Details (Expanded) */}
                      {expandedClient === c.id && (
                        <div className="admin-panel-client-details">
                          {/* ... grid con detalles ... */}
                          <div className="admin-panel-detail-grid">
                            <div className="admin-panel-detail-item">
                              <strong>Nombre:</strong>{" "}
                              <span>{c.nombre || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Apellido:</strong>{" "}
                              <span>{c.apellido || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>CUIT:</strong>{" "}
                              <span>{c.cuit || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Teléfono:</strong>{" "}
                              <span>{c.telefonoMovil || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Provincia:</strong>{" "}
                              <span>{c.provincia || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Ciudad:</strong>{" "}
                              <span>{c.ciudad || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Código Postal:</strong>{" "}
                              <span>{c.codigoPostal || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Registro:</strong>{" "}
                              <span>
                                {c.createdAt
                                  ? new Date(c.createdAt).toLocaleDateString(
                                      "es-AR"
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                          {/* Approval Section */}
                          <div className="admin-panel-approval-section">
                            {/* ... controles de aprobación ... */}
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
                                {" "}
                                {/* Inline style for quick fix */}
                                <label
                                  style={{
                                    fontSize: "12px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Descuento (%)
                                </label>
                                <input
                                  type="number"
                                  value={approvalDiscount}
                                  onChange={(e) =>
                                    setApprovalDiscount(e.target.value)
                                  }
                                  placeholder="0"
                                  className="admin-panel-login-input"
                                />{" "}
                                {/* Reusing login input style */}
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

            {clientsTab === "aprobados" && (
              <div className="admin-panel-clients-list">
                {approvedClients.length === 0 ? (
                  <div className="admin-panel-empty-state">
                    <div className="admin-panel-empty-icon">✅</div>
                    <p>No hay clientes aprobados aún</p>
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
                          <p className="admin-panel-client-email">{c.email}</p>
                          <div className="admin-panel-client-badges">
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
                            {/* ... Client details like pending ... */}
                            <div className="admin-panel-detail-item">
                              <strong>Nombre:</strong>{" "}
                              <span>{c.nombre || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Apellido:</strong>{" "}
                              <span>{c.apellido || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>CUIT:</strong>{" "}
                              <span>{c.cuit || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Teléfono:</strong>{" "}
                              <span>{c.telefonoMovil || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Provincia:</strong>{" "}
                              <span>{c.provincia || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Ciudad:</strong>{" "}
                              <span>{c.ciudad || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Código Postal:</strong>{" "}
                              <span>{c.codigoPostal || "N/A"}</span>
                            </div>
                            <div className="admin-panel-detail-item">
                              <strong>Registro:</strong>{" "}
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
                                  style={{
                                    marginBottom: 0,
                                    whiteSpace: "nowrap",
                                  }}
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
                                  className="admin-panel-login-input" /* Reusing style */
                                  style={{
                                    maxWidth: "80px",
                                    padding: "8px 10px",
                                  }}
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
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Orders */}
        {view === "orders" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Pedidos</h2>
            {/* Order Tabs */}
            <div className="admin-panel-clients-tabs">
              <button
                className={`admin-panel-clients-tab ${
                  ordersTab === "pending"
                    ? "admin-panel-clients-tab-active"
                    : ""
                }`}
                onClick={() => {
                  setOrdersTab("pending");
                  setExpandedOrder(null);
                }}
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
                onClick={() => {
                  setOrdersTab("in_progress");
                  setExpandedOrder(null);
                }}
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
                onClick={() => {
                  setOrdersTab("completed");
                  setExpandedOrder(null);
                }}
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
                onClick={() => {
                  setOrdersTab("cancelled");
                  setExpandedOrder(null);
                }}
              >
                Cancelados (
                {orders.filter((o) => o.status === "cancelled").length})
              </button>
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
                    No hay pedidos en estado "{ordersTab.replace("_", " ")}"{" "}
                    {orderSearch && " que coincidan con la búsqueda"}.
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const client = clients.find((c) => c.id === order.clientId);
                  const total = order.items.reduce(
                    (sum, item) =>
                      sum + (item.finalPrice ?? item.price) * item.qty,
                    0
                  ); // Use finalPrice if available
                  return (
                    <div key={order.id} className="admin-panel-order-card">
                      {/* Order Summary */}
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
                          <p>
                            {client?.razonSocial ||
                              order.clientEmail ||
                              "Cliente Desconocido"}
                          </p>
                          <span>
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
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
                      {/* Order Details (Expanded) */}
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
                              <div
                                key={item.id}
                                className="admin-panel-order-item"
                              >
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
                                    {formatMoney(item.finalPrice ?? item.price)}{" "}
                                    c/u
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
                                onClick={() =>
                                  updateOrderStatus(order.id, "pending")
                                }
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
        )}

        {/* Products */}
        {view === "products" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Productos</h2>
            {/* Product Filters */}
            <div className="admin-panel-filters-section">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, código o descripción..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="admin-panel-search-input"
              />
              <div className="admin-panel-filter-row">
                <CategoryParentSelector
                  categories={categories}
                  categoryTree={categoryTree}
                  categoriesMap={categoriesMap}
                  value={selectedFilterCategoryId}
                  onChange={(id) => setSelectedFilterCategoryId(id)}
                />
                <button
                  onClick={() => setSelectedFilterCategoryId("")}
                  className="admin-panel-btn-small"
                >
                  Quitar Filtro Cat.
                </button>
              </div>
            </div>
            {/* Products List */}
            <div className="admin-panel-products-list">
              {filteredProducts.length === 0 ? (
                <div className="admin-panel-empty-state">
                  <p>
                    No hay productos{" "}
                    {productSearch || selectedFilterCategoryId
                      ? "que coincidan con los filtros"
                      : ""}
                    .
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className="admin-panel-product-card-admin">
                    <div className="admin-panel-product-info">
                      <h4>{p.name}</h4>
                      <p className="admin-panel-product-code">
                        Código: {p.code || "N/A"}
                      </p>
                      <p className="admin-panel-product-category">
                        {p.categoryPath && p.categoryPath.length > 0
                          ? p.categoryPath.join(" > ")
                          : "Sin categoría"}
                      </p>
                      <div className="admin-panel-product-prices">
                        <span>Lista 1: {formatMoney(p.price_state1)}</span>
                        <span>Lista 2: {formatMoney(p.price_state2)}</span>
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
                          onClick={() =>
                            toggleStock(p.id, p.stock === 1 ? 0 : 1)
                          }
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
                ))
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Product Form */}
        {(view === "addProduct" ||
          (view === "editProduct" && editingProduct)) && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h2>
            <ProductForm
              initialData={editingProduct || {}}
              categoriesMap={categoriesMap}
              categoryTree={categoryTree}
              onSubmit={handleSubmitProduct}
              loading={loading}
              onCancel={() => {
                resetProductForm();
                setView("products");
              }}
            />
          </div>
        )}

        {/* Increase Prices */}
        {view === "increasePrices" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Aumento de Precios General</h2>
            <div className="admin-panel-form-section">
              <h3 className="admin-panel-section-title">
                Configuración de Aumento
              </h3>
              <div className="admin-panel-form-grid">
                <div className="admin-panel-form-group">
                  <label>Porcentaje de Aumento/Disminución (%)</label>
                  <input
                    type="number"
                    value={increasePercentage}
                    onChange={(e) => setIncreasePercentage(e.target.value)}
                    placeholder="Ej: 15 (para aumento), -10 (para disminución)"
                  />
                </div>
                <div className="admin-panel-form-group">
                  <label>Redondear a (cantidad de ceros)</label>
                  <select
                    value={roundingZeros}
                    onChange={(e) => setRoundingZeros(Number(e.target.value))}
                    className="admin-panel-filter-select" // Reusing style
                  >
                    <option value={0}>Sin redondeo (ej: $123.45)</option>
                    <option value={1}>Terminación en 0 (ej: $120)</option>
                    <option value={2}>Terminación en 00 (ej: $100)</option>
                    <option value={3}>Terminación en 000 (ej: $1000)</option>
                  </select>
                </div>
              </div>
              <div className="admin-panel-filter-row">
                <CategoryParentSelector
                  categories={categories}
                  categoryTree={categoryTree}
                  categoriesMap={categoriesMap}
                  value={priceCategoryFilterId}
                  onChange={(id) => {
                    setPriceCategoryFilterId(id);
                    setPricePreview([]); // Reset preview on filter change
                  }}
                />
                <button
                  onClick={() => {
                    setPriceCategoryFilterId("");
                    setPricePreview([]);
                  }}
                  className="admin-panel-btn-small"
                >
                  Quitar Filtro Cat.
                </button>
              </div>
              <div className="admin-panel-form-actions">
                <button
                  onClick={handlePricePreview}
                  className="admin-panel-btn-cancel"
                  disabled={loading}
                >
                  Previsualizar Cambios
                </button>
                <button
                  onClick={handlePriceIncrease}
                  className="admin-panel-btn-submit"
                  disabled={loading || pricePreview.length === 0}
                >
                  {loading ? "Actualizando..." : "Aplicar Cambios"}
                </button>
              </div>
            </div>

            {pricePreview.length > 0 && (
              <div className="admin-panel-form-section">
                <h3 className="admin-panel-section-title">
                  Previsualización ({pricePreview.length} productos)
                </h3>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f0f2f5" }}>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Producto
                        </th>
                        <th style={{ padding: "8px", textAlign: "right" }}>
                          Lista 1 Actual
                        </th>
                        <th style={{ padding: "8px", textAlign: "right" }}>
                          Lista 1 Nueva
                        </th>
                        <th style={{ padding: "8px", textAlign: "right" }}>
                          Lista 2 Actual
                        </th>
                        <th style={{ padding: "8px", textAlign: "right" }}>
                          Lista 2 Nueva
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricePreview.map((p) => (
                        <tr
                          key={p.id}
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={{ padding: "8px" }}>{p.name}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            {formatMoney(p.oldPrice1)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <input
                              type="number"
                              value={p.newPrice1}
                              onChange={(e) =>
                                handlePriceChange(
                                  p.id,
                                  "newPrice1",
                                  e.target.value
                                )
                              }
                              className="admin-panel-price-input" // Add a specific class if needed
                              style={{
                                textAlign: "right",
                                width: "100px",
                                padding: "4px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            {formatMoney(p.oldPrice2)}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right" }}>
                            <input
                              type="number"
                              value={p.newPrice2}
                              onChange={(e) =>
                                handlePriceChange(
                                  p.id,
                                  "newPrice2",
                                  e.target.value
                                )
                              }
                              className="admin-panel-price-input" // Add a specific class if needed
                              style={{
                                textAlign: "right",
                                width: "100px",
                                padding: "4px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {view === "categories" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Gestión de Categorías</h2>
            {/* Add/Edit Form */}
            <div
              className="admin-panel-form-section"
              style={{ marginBottom: "30px" }}
            >
              <h3 className="admin-panel-section-title">
                {editingCategory
                  ? `Editando "${editingCategory.name}"`
                  : "Nueva Categoría"}
              </h3>
              <div className="admin-panel-form-grid">
                <div className="admin-panel-form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                    required
                    className="admin-panel-login-input" // Reusing style
                  />
                </div>
                <div className="admin-panel-form-group">
                  <label>Categoría Padre</label>
                  <CategoryParentSelector
                    categories={categories} // Lista plana
                    categoryTree={categoryTree} // Árbol
                    categoriesMap={categoriesMap} // Mapa
                    value={newCategoryParentId}
                    onChange={setNewCategoryParentId}
                    currentCategoryId={editingCategory?.id}
                  />
                </div>
              </div>
              <div className="admin-panel-form-actions">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={cancelEditingCategory}
                    className="admin-panel-btn-cancel"
                    disabled={loading}
                  >
                    Cancelar Edición
                  </button>
                )}
                <button
                  type="button"
                  onClick={
                    editingCategory ? handleUpdateCategory : handleAddCategory
                  }
                  className="admin-panel-btn-submit"
                  disabled={loading || !newCategoryName.trim()}
                >
                  {loading
                    ? "Guardando..."
                    : editingCategory
                    ? "Actualizar"
                    : "Agregar"}
                </button>
              </div>
            </div>
            {/* Category Tree */}
            <div className="admin-panel-categories-tree">
              <h3 className="admin-panel-section-title">Estructura</h3>
              {categoryTree.length === 0 ? (
                <p className="admin-panel-empty-message">
                  No hay categorías creadas.
                </p>
              ) : (
                categoryTree.map((rootNode) => (
                  <CategoryTreeNode
                    key={rootNode.id}
                    node={rootNode}
                    onEdit={startEditingCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Edit Home */}
        {view === "editHome" && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">Editar Página de Inicio</h2>
            {/* Banner Section */}
            <div className="admin-panel-home-section">
              <h3 className="admin-panel-section-title">
                Banner Principal (Carrusel)
              </h3>
              <div className="admin-panel-banner-upload-section">
                <label className="admin-panel-btn-upload">
                  📤 Subir Imágenes
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBannerUpload}
                    style={{ display: "none" }}
                    disabled={loading}
                  />
                </label>
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}
                >
                  Puedes arrastrar las imágenes para reordenarlas.
                </p>
              </div>
              <div className="admin-panel-banner-images-list">
                {bannerImages.length === 0 ? (
                  <p className="admin-panel-empty-message">
                    No hay imágenes en el banner.
                  </p>
                ) : (
                  bannerImages.map((img, index) => (
                    <div
                      key={img.id}
                      className="admin-panel-banner-image-item"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      style={{ opacity: draggedIndex === index ? 0.5 : 1 }} // Visual feedback for dragging
                    >
                      <div className="admin-panel-drag-handle">⋮⋮</div>
                      <img src={img.url} alt={`Banner ${index + 1}`} />
                      <div className="admin-panel-banner-controls">
                        <select
                          value={img.redirect || "ninguno"}
                          onChange={(e) =>
                            updateBannerRedirect(img.id, e.target.value)
                          }
                          className="admin-panel-redirect-select"
                        >
                          {getRedirectOptions().map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
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
                  ))
                )}
              </div>
            </div>
            {/* Home Categories Section */}
            <div className="admin-panel-home-section">
              <h3 className="admin-panel-section-title">
                Categorías Destacadas (3 Imágenes)
              </h3>
              <div className="admin-panel-home-categories-grid">
                {["img1", "img2", "img3"].map((key, index) => (
                  <div key={key} className="admin-panel-home-category-card">
                    <h4>Categoría {index + 1}</h4>
                    {homeCategories[key]?.url ? (
                      <div className="admin-panel-home-category-preview">
                        <img
                          src={homeCategories[key].url}
                          alt={`Categoría Destacada ${index + 1}`}
                        />
                        <button
                          onClick={() => deleteHomeCategoryImage(key)}
                          className="admin-panel-btn-remove"
                          title="Eliminar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="admin-panel-home-category-empty">
                        <label className="admin-panel-btn-upload-small">
                          📤 Subir
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
                      value={homeCategories[key]?.redirect || "ninguno"}
                      onChange={(e) =>
                        updateHomeCategoryRedirect(key, e.target.value)
                      }
                      className="admin-panel-redirect-select-full"
                      disabled={!homeCategories[key]?.url || loading}
                    >
                      {getRedirectOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
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
