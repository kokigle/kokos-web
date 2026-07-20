// src/contexts/FirestoreContext.jsx
// Centralized Firestore subscriptions — single source of truth for shared data.
// Eliminates duplicate onSnapshot listeners across Header, ProductsList, Home, and AdminPanel.
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { buildCategoryTree } from "../utils/categoryutils";

const FirestoreContext = createContext(null);

export function useFirestoreData() {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error("useFirestoreData must be used within a FirestoreProvider");
  }
  return context;
}

export function FirestoreProvider({ children }) {
  // --- Products ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // --- Categories ---
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // --- Banner Images ---
  const [bannerImages, setBannerImages] = useState([]);

  // --- Home Category Images (img1, img2, img3) ---
  const [categoryImages, setCategoryImages] = useState({
    img1: { url: "", redirect: "" },
    img2: { url: "", redirect: "" },
    img3: { url: "", redirect: "" },
  });

  useEffect(() => {
    // 1. Products — single subscription for the entire app
    const qProducts = query(collection(db, "products"), orderBy("name"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setProductsLoading(false);
    });

    // 2. Categories — single subscription, builds flat list + map + tree
    const qCategories = query(collection(db, "categories"), orderBy("name"));
    const unsubCategories = onSnapshot(qCategories, (snap) => {
      const flatList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(flatList);

      const map = {};
      flatList.forEach((cat) => (map[cat.id] = cat));
      setCategoriesMap(map);

      setCategoryTree(buildCategoryTree(flatList));
      setCategoriesLoading(false);
    });

    // 3. Banner images — sorted by position
    const unsubBanner = onSnapshot(
      collection(db, "images/banner_images/urls"),
      (snap) => {
        const images = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.pos || 0) - (b.pos || 0));
        setBannerImages(images);
      }
    );

    // 4. Category images for Home page — ONE subscription instead of the
    //    previous THREE that each listened to the entire collection
    const unsubCatImages = onSnapshot(collection(db, "images"), (snap) => {
      const imgs = {
        img1: { url: "", redirect: "" },
        img2: { url: "", redirect: "" },
        img3: { url: "", redirect: "" },
      };
      snap.docs.forEach((d) => {
        if (["img1", "img2", "img3"].includes(d.id)) {
          imgs[d.id] = d.data();
        }
      });
      setCategoryImages(imgs);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanner();
      unsubCatImages();
    };
  }, []);

  const value = {
    products,
    productsLoading,
    categories,
    categoriesMap,
    categoryTree,
    categoriesLoading,
    bannerImages,
    setBannerImages, // Exposed for AdminPanel optimistic drag-reorder
    categoryImages,
    setCategoryImages, // Exposed for AdminPanel optimistic updates
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}
