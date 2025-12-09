import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  writeBatch,
  where,
  getDocs,
} from "firebase/firestore";
import { uploadImage } from "./cloudinary";
import { db } from "./App";
import ProductForm from "./ProductForm"; // Asumiendo que ProductForm está en src/
import AdminSidebar from "./components/admin/AdminSidebar";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminClients from "./components/admin/AdminClients";
import AdminOrders from "./components/admin/AdminOrders";
import AdminProducts from "./components/admin/AdminProducts";
import AdminCategories from "./components/admin/AdminCategories";
import AdminEditHome from "./components/admin/AdminEditHome";
import AdminIncreasePrices from "./components/admin/AdminIncreasePrices";
import AdminNotifications from "./components/admin/AdminNotifications";
import {
  buildCategoryTree,
  getCategoryPath,
  getDescendantIds,
} from "./utils/categoryutils"; // Importar helpers

import "./styles/admin-panel.css";

export default function AdminPanel() {
  const mainContentRef = useRef(null);

  // Estados de autenticación
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);

  // Estados de datos
  const [clients, setClients] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [categoryTree, setCategoryTree] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Keep flat list for selectors
  const [orders, setOrders] = useState([]);

  // Estados de UI
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Estados específicos de vistas (pasados como props)
  const [clientSearch, setClientSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState("");
  const [bannerImages, setBannerImages] = useState([]);
  const [homeCategories, setHomeCategories] = useState({
    img1: {},
    img2: {},
    img3: {},
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [increasePercentage, setIncreasePercentage] = useState(0);
  const [roundingZeros, setRoundingZeros] = useState(0);
  const [priceCategoryFilterId, setPriceCategoryFilterId] = useState("");
  const [pricePreview, setPricePreview] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState(null);

  // --- Funciones (showNotification, showConfirm, etc. como antes) ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancelConfirm = () => {
    // Renombrado para evitar conflicto
    setConfirmDialog(null);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    // No es necesario resetear formData aquí, ProductForm lo maneja con useEffect
  };

  const scrollTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollTop();
  }, [view]);

  useEffect(() => {
    if (view === "addProduct") {
      resetProductForm();
    }
  }, [view]);

  // --- Suscripciones a Firestore (como antes) ---
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
        setCategories(flatList); // Guardar lista plana
        const map = {};
        flatList.forEach((cat) => (map[cat.id] = cat));
        setCategoriesMap(map); // Guardar mapa
        setCategoryTree(buildCategoryTree(flatList)); // Crear árbol
      }
    );

    const qOrders = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // Suscripción al Banner
    const unsubBanner = onSnapshot(
      collection(db, "images/banner_images/urls"),
      (snap) => {
        const images = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.pos || 0) - (b.pos || 0));
        setBannerImages(images);
      }
    );

    // Carga inicial de Home Categories
    const loadHomeCategories = async () => {
      const cats = { img1: {}, img2: {}, img3: {} };
      try {
        for (let i = 1; i <= 3; i++) {
          const docRef = doc(db, "images", `img${i}`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            cats[`img${i}`] = docSnap.data();
          } else {
            cats[`img${i}`] = { url: "", redirect: "" }; // Default empty object
          }
        }
        setHomeCategories(cats);
      } catch (error) {
        console.error("Error loading home categories:", error);
        // Set defaults even if loading fails
        setHomeCategories({
          img1: { url: "", redirect: "" },
          img2: { url: "", redirect: "" },
          img3: { url: "", redirect: "" },
        });
      }
    };
    loadHomeCategories();

    return () => {
      unsubClients();
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubBanner();
      // No hay unsub para loadHomeCategories ya que es una carga única
    };
  }, [authed]);

  // --- Funciones de Lógica (loginAdmin, approveClient, etc. como antes, pero ajustadas para usar showNotification/showConfirm) ---
  const loginAdmin = () => {
    if (secret === "admin123") {
      // Consider securely managing secrets
      setAuthed(true);
    } else {
      showNotification("Clave admin incorrecta", "error");
    }
  };

  const approveClient = async (clientId, state, discount) => {
    showConfirm(
      `¿Aprobar este usuario con Lista ${state} y ${discount}% de descuento?`,
      async () => {
        setLoading(true);
        try {
          await updateDoc(doc(db, "clients", clientId), {
            status: "aprobado",
            state: state, // Usar el estado pasado
            descuento: Number(discount) || 0, // Usar el descuento pasado
          });
          showNotification(
            `Usuario aprobado con Lista ${state} y ${discount}% de descuento`
          );
          // No necesitas setExpandedClient(null) aquí si AdminClients maneja su propio estado expandido
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
          // No necesitas setExpandedClient(null) aquí
        } catch (error) {
          console.error("Error rejecting client:", error);
          showNotification("Error al rechazar cliente.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

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
      const discountValue = Number(newDiscount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        showNotification("Porcentaje de descuento inválido (0-100).", "error");
        return; // Salir si el valor no es válido
      }
      await updateDoc(doc(db, "clients", id), { descuento: discountValue });
      showNotification(`Descuento actualizado a ${discountValue}%`);
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
          // No necesitas setExpandedClient(null) aquí
        } catch (error) {
          console.error("Error deleting client:", error);
          showNotification("Error al eliminar cliente.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

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
          // No necesitas setExpandedOrder(null) aquí
        } catch (error) {
          console.error("Error updating order status:", error);
          showNotification("Error al actualizar estado del pedido.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSubmitProduct = async (productData) => {
    setLoading(true);
    try {
      // Procesar imágenes como antes...
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

      const categoryId = productData.category; // Ya es categoryId
      const categoryPath = categoryId
        ? getCategoryPath(categoryId, categoriesMap)
        : []; // Usar helper

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
        categoryId: categoryId || "", // Guardar categoryId
        categoryPath: categoryPath, // Guardar ruta calculada
        bulto: productData.bulto || "",
        colors: productData.colors || [],
        medidas: productData.medidas || [],
      };
      // Eliminar campos antiguos si existen en productData (defensivo)
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
      setView("products"); // Volver a la lista
    } catch (err) {
      console.error(err);
      showNotification("Error al guardar producto: " + err.message, "error");
    } finally {
      setLoading(false);
    }
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
    scrollTop(); // Asegurarse de que el form sea visible
  };

  // --- Funciones de Categorías (como antes) ---
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
      setNewCategoryParentId(null); // Reset parent selector
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
    if (newCategoryParentId === editingCategory.id) {
      showNotification("Una categoría no puede ser su propio padre.", "error");
      return;
    }
    // Add check to prevent making a category a child of its own descendant
    if (newCategoryParentId) {
      const descendants = getDescendantIds(editingCategory.id, categoriesMap);
      if (descendants.includes(newCategoryParentId)) {
        showNotification(
          "No puedes mover una categoría dentro de una de sus subcategorías.",
          "error"
        );
        return;
      }
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: name,
        parentId: newCategoryParentId || null,
      });
      showNotification(`Categoría "${name}" actualizada`);
      cancelEditingCategory(); // Resetear estado de edición
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
              categoryId: "", // O null, según prefieras
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
          cancelEditingCategory(); // Si se estaba editando una categoría eliminada
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

  // --- Funciones Editar Inicio (Banner y Categorías Home - como antes) ---
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
          // Usar un ID más único y predecible podría ser mejor si necesitas referenciarlo
          const docRef = doc(collection(db, "images/banner_images/urls"));
          await setDoc(docRef, { url, redirect: "ninguno", pos: nextPos });
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
          // La reordenación se hará por el useEffect que escucha bannerImages.length
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

  // Reordenar banner (ajustado para useEffect)
  useEffect(() => {
    if (!authed || view !== "editHome" || bannerImages.length === 0) return;

    const reorderBannerPositions = async () => {
      // Comprobar si realmente necesita reordenar
      const needsReorder = bannerImages.some(
        (img, index) => (img.pos || 0) !== index + 1
      );
      if (!needsReorder) return;

      console.log("Reordenando posiciones del banner...");
      // setLoading(true); // Opcional: mostrar loading durante reordenamiento
      try {
        const batch = writeBatch(db);
        bannerImages.forEach((img, index) => {
          // Solo actualizar si la posición es incorrecta
          if ((img.pos || 0) !== index + 1) {
            batch.update(doc(db, "images/banner_images/urls", img.id), {
              pos: index + 1,
            });
          }
        });
        await batch.commit();
        console.log("Reordenación completada.");
      } catch (err) {
        console.error("Error reordering banner:", err);
        showNotification("Error al reordenar banners", "error");
      } finally {
        // setLoading(false);
      }
    };

    // Usar un pequeño retraso para evitar ejecuciones múltiples rápidas
    const timer = setTimeout(reorderBannerPositions, 500);
    return () => clearTimeout(timer);
  }, [bannerImages, authed, view]); // Depender de bannerImages completo

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
    // Actualizar pos temporalmente para la UI antes del guardado
    const updatedImagesForUI = newImages.map((img, index) => ({
      ...img,
      pos: index + 1,
    }));
    setBannerImages(updatedImagesForUI); // Actualiza estado local con nuevas posiciones
    setDraggedIndex(null);

    // La actualización de Firestore ahora la maneja el useEffect
    // No es necesario llamar a setLoading o batch.commit aquí directamente
    showNotification("Orden actualizado. Guardando...", "info"); // Notificación opcional
  };

  const handleHomeCategoryUpload = async (categoryKey, file) => {
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        const currentData = homeCategories[categoryKey] || {};
        const newData = { url, redirect: currentData.redirect || "ninguno" };
        await setDoc(doc(db, "images", categoryKey), newData);
        // Actualizar estado local
        setHomeCategories((prev) => ({ ...prev, [categoryKey]: newData }));
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
      // Actualizar estado local
      setHomeCategories((prev) => ({
        ...prev,
        [categoryKey]: { ...prev[categoryKey], redirect: redirect },
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
          const newData = { url: "", redirect: "" }; // Resetear
          await setDoc(doc(db, "images", categoryKey), newData);
          // Actualizar estado local
          setHomeCategories((prev) => ({ ...prev, [categoryKey]: newData }));
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

  // --- Funciones Aumento de Precios ---
  const getFilteredProductsForPriceIncrease = () => {
    if (!priceCategoryFilterId) return products;
    const descendantIds = getDescendantIds(
      priceCategoryFilterId,
      categoriesMap
    );
    return products.filter((p) => descendantIds.includes(p.categoryId));
  };

  const handlePricePreview = () => {
    const percentage = parseFloat(increasePercentage);
    if (isNaN(percentage) || percentage === 0) {
      showNotification(
        "El porcentaje debe ser un número diferente a 0.",
        "error"
      );
      setPricePreview([]);
      return;
    }

    const filtered = getFilteredProductsForPriceIncrease();
    if (filtered.length === 0) {
      showNotification(
        "No hay productos en la categoría seleccionada.",
        "info"
      );
      setPricePreview([]);
      return;
    }

    const factor = 1 + percentage / 100;
    const roundingFactor = Math.pow(10, roundingZeros);

    const previewData = filtered.map((product) => {
      const newPrice1 = product.price_state1 * factor;
      const newPrice2 = product.price_state2 * factor;

      // Redondeo: dividir, redondear, multiplicar
      const roundedPrice1 =
        roundingFactor === 1
          ? Math.round(newPrice1)
          : Math.round(newPrice1 / roundingFactor) * roundingFactor;
      const roundedPrice2 =
        roundingFactor === 1
          ? Math.round(newPrice2)
          : Math.round(newPrice2 / roundingFactor) * roundingFactor;

      // Asegurarse de que los precios no sean negativos
      const finalPrice1 = Math.max(0, roundedPrice1);
      const finalPrice2 = Math.max(0, roundedPrice2);

      return {
        id: product.id,
        name: product.name,
        oldPrice1: product.price_state1,
        newPrice1: finalPrice1,
        oldPrice2: product.price_state2,
        newPrice2: finalPrice2,
      };
    });
    setPricePreview(previewData);
    showNotification(
      `Previsualización generada para ${previewData.length} productos.`
    );
  };

  const handlePriceChange = (id, priceType, value) => {
    // Validar que el valor sea un número no negativo
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) {
      showNotification("El precio debe ser un número positivo.", "error");
      return; // No actualizar si no es válido
    }
    setPricePreview((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [priceType]: numericValue } : p))
    );
  };

  const handlePriceIncrease = async () => {
    if (pricePreview.length === 0) {
      showNotification("Primero debes previsualizar los cambios.", "error");
      return;
    }
    showConfirm(
      `¿Estás seguro de que deseas actualizar los precios de ${pricePreview.length} productos según la previsualización? Esta acción es irreversible.`,
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
            `Precios actualizados para ${pricePreview.length} productos.`
          );
          setPricePreview([]); // Limpiar previsualización
          setIncreasePercentage(0); // Opcional: resetear porcentaje
        } catch (error) {
          console.error("Error al actualizar precios:", error);
          showNotification("Error al actualizar precios.", "error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // --- useCallback para getRedirectOptions ---
  const getRedirectOptions = useCallback(() => {
    const options = [
      { value: "ninguno", label: "Ninguno" },
      { value: "novedades", label: "Novedades" },
      // Agrega otras rutas estáticas si es necesario
    ];
    const traverse = (nodes, prefix = "") => {
      nodes.forEach((node) => {
        const label = prefix ? `${prefix} > ${node.name}` : node.name;
        // Usar el ID como valor
        options.push({ value: node.id, label: `Categoría: ${label}` });
        if (node.children && node.children.length > 0) {
          traverse(node.children, label);
        }
      });
    };
    traverse(categoryTree); // Usar el árbol
    return options;
  }, [categoryTree]); // Depender del árbol

  // --- Filtrado (movido fuera de useEffect para que esté siempre actualizado) ---
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

  const filteredProducts = products.filter((p) => {
    const searchLower = productSearch.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      (p.code || "").toLowerCase().includes(searchLower);

    let matchCategory = true;
    if (selectedFilterCategoryId && Object.keys(categoriesMap).length > 0) {
      // Check if map is loaded
      const descendantIds = getDescendantIds(
        selectedFilterCategoryId,
        categoriesMap
      ); // Use helper
      matchCategory = descendantIds.includes(p.categoryId); // Check categoryId
    }

    return matchSearch && matchCategory;
  });

  // --- Renderizado ---

  if (!authed) {
    return (
      <AdminLogin
        secret={secret}
        setSecret={setSecret}
        loginAdmin={loginAdmin}
      />
    );
  }

  return (
    <div className="admin-panel-layout">
      <AdminNotifications
        notification={notification}
        confirmDialog={confirmDialog}
        handleCancel={handleCancelConfirm}
        handleConfirm={handleConfirm}
        loading={loading}
      />

      <AdminSidebar
        view={view}
        setView={setView}
        resetProductForm={resetProductForm}
      />

      <main className="admin-panel-content" ref={mainContentRef}>
        {view === "dashboard" && (
          <AdminDashboard
            pendingClients={pendingClients}
            approvedClients={approvedClients}
            products={products}
            orders={orders}
            categoryTree={categoryTree}
            categoriesMap={categoriesMap}
          />
        )}
        {view === "clients" && (
          <AdminClients
            clients={clients} // Pasar lista completa
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            approveClient={approveClient} // Pasar handlers
            rejectClient={rejectClient}
            toggleState={toggleState}
            updateClientDiscount={updateClientDiscount}
            deleteClient={deleteClient}
          />
        )}
        {view === "orders" && (
          <AdminOrders
            orders={orders}
            clients={clients}
            updateOrderStatus={updateOrderStatus}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
          />
        )}
        {view === "products" && (
          <AdminProducts
            products={filteredProducts} // Pasar productos filtrados
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            selectedFilterCategoryId={selectedFilterCategoryId}
            setSelectedFilterCategoryId={setSelectedFilterCategoryId}
            categories={categories} // Pasar lista plana
            categoryTree={categoryTree} // Pasar árbol
            categoriesMap={categoriesMap} // Pasar mapa
            toggleStock={toggleStock}
            editProduct={editProduct}
            deleteProduct={deleteProduct}
          />
        )}
        {(view === "addProduct" ||
          (view === "editProduct" && editingProduct)) && (
          <div className="admin-panel-card">
            <h2 className="admin-panel-title">
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h2>
            <ProductForm
              initialData={editingProduct || {}}
              categoriesMap={categoriesMap}
              categoryTree={categoryTree} // Pasar árbol al form
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
          <AdminCategories
            categoryTree={categoryTree}
            categories={categories} // Pasar lista plana
            categoriesMap={categoriesMap} // Pasar mapa
            editingCategory={editingCategory}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryParentId={newCategoryParentId}
            setNewCategoryParentId={setNewCategoryParentId}
            handleAddCategory={handleAddCategory}
            handleUpdateCategory={handleUpdateCategory}
            startEditingCategory={startEditingCategory}
            handleDeleteCategory={handleDeleteCategory}
            cancelEditingCategory={cancelEditingCategory}
            loading={loading}
          />
        )}
        {view === "editHome" && (
          <AdminEditHome
            bannerImages={bannerImages}
            handleBannerUpload={handleBannerUpload}
            updateBannerRedirect={updateBannerRedirect}
            deleteBannerImage={deleteBannerImage}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            draggedIndex={draggedIndex}
            homeCategories={homeCategories}
            handleHomeCategoryUpload={handleHomeCategoryUpload}
            updateHomeCategoryRedirect={updateHomeCategoryRedirect}
            deleteHomeCategoryImage={deleteHomeCategoryImage}
            getRedirectOptions={getRedirectOptions} // Pasar la función
            loading={loading}
          />
        )}
        {view === "increasePrices" && (
          <AdminIncreasePrices
            increasePercentage={increasePercentage}
            setIncreasePercentage={setIncreasePercentage}
            roundingZeros={roundingZeros}
            setRoundingZeros={setRoundingZeros}
            priceCategoryFilterId={priceCategoryFilterId}
            setPriceCategoryFilterId={setPriceCategoryFilterId}
            pricePreview={pricePreview}
            handlePricePreview={handlePricePreview}
            handlePriceIncrease={handlePriceIncrease}
            handlePriceChange={handlePriceChange}
            categories={categories}
            categoryTree={categoryTree}
            categoriesMap={categoriesMap}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
