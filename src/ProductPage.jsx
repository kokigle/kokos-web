// src/ProductPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "./App";
import { db } from "./App";
import ProductCard from "./ProductCard";
import FloatingCartButton from "./FloatingCartButton";
import "./styles/product-page.css";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainMedia, setMainMedia] = useState(null);
  const [related, setRelated] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  // NUEVO ESTADO PARA EL VIDEO MODAL
  const [activeVideo, setActiveVideo] = useState(null); 
  const { user } = useAuth();

  useEffect(() => {
    if (!product) return;
    const imagesToPreload = [];
    if (product.multimedia?.length > 0) {
      imagesToPreload.push(...product.multimedia);
    }
    // Preload video thumbnails
    if (product.videos?.length > 0) {
      product.videos.forEach((videoUrl) => {
        const { id: videoId } = getYouTubeId(videoUrl);
        if (videoId) {
          imagesToPreload.push(`https://img.youtube.com/vi/${videoId}/0.jpg`);
          imagesToPreload.push(
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          );
        }
      });
    }
    // ...resto del preloader (sin cambios)...
    if (related.length > 0) {
      related.slice(0, 4).forEach((relProduct) => {
        if (relProduct.multimedia?.length >= 2) {
          imagesToPreload.push(relProduct.multimedia[0]);
          imagesToPreload.push(relProduct.multimedia[1]);
        } else if (relProduct.multimedia?.length === 1) {
          imagesToPreload.push(relProduct.multimedia[0]);
        }
      });
    }
    let loadedCount = 0;
    const totalImages = imagesToPreload.length;
    if (totalImages === 0) {
      setImagesLoaded(true);
      return;
    }
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });
  }, [product, related]);

  const getYouTubeId = (url) => {
    try {
      if (!url) return { id: null, vertical: false };
      const u = new URL(url);
      
      // Caso 1: Shorts (ej: youtube.com/shorts/ID)
      if (u.pathname.includes("/shorts/")) {
        const pathParts = u.pathname.split("/shorts/");
        // Eliminar posibles parámetros extra después del ID
        const id = pathParts[1].split("?")[0].split("&")[0];
        return { id, vertical: true };
      }
      
      // Caso 2: URL estándar (ej: youtube.com/watch?v=ID)
      if (u.searchParams.get("v")) {
        return { id: u.searchParams.get("v"), vertical: false };
      }
      
      // Caso 3: URL corta (ej: youtu.be/ID)
      if (u.hostname === "youtu.be") {
        return { id: u.pathname.slice(1), vertical: false };
      }
      
      // Caso 4: Embed directo (ej: youtube.com/embed/ID)
      if (u.pathname.includes("/embed/")) {
        return { id: u.pathname.split("/embed/")[1], vertical: false };
      }

    } catch (e) {
      console.error("Error parseando URL de video:", url, e);
      return { id: null, vertical: false };
    }
    return { id: null, vertical: false };
  };

  useEffect(() => {
    // --- CORRECCIÓN DEL ERROR "n is undefined" ---
    // Si no hay ID (ej. carga inicial extraña), no ejecutamos la llamada a Firebase
    if (!id) return; 

    const docRef = doc(db, "products", id);
    getDoc(docRef)
      .then((d) => {
        if (d.exists()) {
          const data = { id: d.id, ...d.data() };
          setProduct(data);
          if (data.multimedia?.length > 0) {
            setMainMedia({ type: "image", url: data.multimedia[0] });
          } else if (data.videos?.length > 0) {
            setMainMedia({ type: "video", url: data.videos[0] });
          }
          if (data.subcategory) {
            const q = query(
              collection(db, "products"),
              where("subcategory", "==", data.subcategory)
            );
            const unsub = onSnapshot(q, (snap) => {
              const prods = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setRelated(prods.filter((p) => p.id !== data.id));
            });
            return () => unsub();
          }
        } else {
          setProduct("not-found");
        }
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
        setProduct("not-found");
      });
  }, [id]);

  useEffect(() => {
    if (related.length > 1) {
      const interval = setInterval(() => {
        setStartIndex((prev) => (prev + 1) % related.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [related]);

  // Función para cerrar modal de video
  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  if (!product)
    return (
      <div className="product-page-loading">
        <div className="product-page-spinner"></div>
        <p>Cargando producto...</p>
      </div>
    );

  if (product === "not-found")
    return (
      <div className="product-page-not-found">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no existe o ha sido eliminado</p>
        <Link to="/" className="product-page-back-btn">
          Volver al inicio
        </Link>
      </div>
    );

  const price = user?.state === 2 ? product.price_state2 : product.price_state1;
  const inStock = product.stock === 1;

  const showRelated =
    related.length > 4
      ? [...related, ...related].slice(startIndex, startIndex + 4)
      : related;

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % related.length);
  };
  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + related.length) % related.length);
  };

  const thumbs = [
    ...(product.multimedia || []).map((img) => ({ type: "image", url: img })),
    ...(product.videos || []).map((video) => ({ type: "video", url: video })),
  ];
  const showThumbs =
    thumbs.length > 4
      ? [...thumbs, ...thumbs].slice(thumbIndex, thumbIndex + 4)
      : thumbs;

  const nextThumb = () => {
    const newIndex = (thumbIndex + 1) % thumbs.length;
    setThumbIndex(newIndex);
    setMainMedia(thumbs[newIndex]);
  };
  const prevThumb = () => {
    const newIndex = (thumbIndex - 1 + thumbs.length) % thumbs.length;
    setThumbIndex(newIndex);
    setMainMedia(thumbs[newIndex]);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShowCopyToast(true);
    setShowShareModal(false);
    setTimeout(() => {
      setShowCopyToast(false);
    }, 3000);
  };

  return (
    <div className="product-page-container">
      <div
        className="product-page-wrapper"
        style={{ opacity: imagesLoaded ? 1 : 0 }}
      >
        <div className="product-page-main">
          <div className="product-page-gallery">
            <div className="product-page-main-media">
              {thumbs.length > 1 && (
                <button
                  className="product-page-main-arrow product-page-main-arrow-left"
                  onClick={prevThumb}
                >
                  ❮
                </button>
              )}
              {mainMedia?.type === "image" && (
                <img
                  className="product-page-main-img"
                  src={mainMedia.url}
                  alt={product.name}
                />
              )}
              
              {/* --- CAMBIO PRINCIPAL: Renderizado del video --- */}
              {mainMedia?.type === "video" &&
                (() => {
                  const { id: videoId, vertical } = getYouTubeId(mainMedia.url);
                  if (!videoId) return <p>Video inválido</p>;
                  
                  // En lugar de iframe directo, mostramos portada + botón play
                  return (
                    <div 
                      className="product-page-video-trigger"
                      onClick={() => setActiveVideo(mainMedia.url)}
                    >
                       <img 
                         src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                         alt="Video cover"
                         className={`product-page-video-cover ${vertical ? 'is-vertical' : ''}`}
                       />
                       <div className="product-page-play-overlay-btn">
                          <svg viewBox="0 0 24 24" fill="currentColor" height="48" width="48">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                       </div>
                    </div>
                  );
                })()}
              
              {thumbs.length > 1 && (
                <button
                  className="product-page-main-arrow product-page-main-arrow-right"
                  onClick={nextThumb}
                >
                  ❯
                </button>
              )}
            </div>
            
            {/* Carrusel de Miniaturas */}
            {thumbs.length > 0 && (
              <div className="product-page-thumb-carousel">
                <div className="product-page-thumb-grid">
                  {showThumbs.map((t, idx) => {
                    if (t.type === "image") {
                      return (
                        <img
                          key={idx}
                          src={t.url}
                          alt={`thumb-${idx}`}
                          className={`product-page-thumb ${
                            mainMedia?.url === t.url
                              ? "product-page-thumb-active"
                              : ""
                          }`}
                          onClick={() => setMainMedia(t)}
                        />
                      );
                    } else {
                      const { id: vid } = getYouTubeId(t.url);
                      return (
                        <div
                          key={idx}
                          className={`product-page-video-thumb ${
                            mainMedia?.url === t.url
                              ? "product-page-thumb-active"
                              : ""
                          }`}
                          onClick={() => setMainMedia(t)}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${vid}/0.jpg`}
                            alt={`video-${idx}`}
                          />
                          <span className="product-page-play-icon">▶</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
            
            {product.description && (
              <div className="product-page-description-box">
                <h3 className="product-page-description-title">Descripción</h3>
                <p className="product-page-description">
                  {product.description}
                </p>
              </div>
            )}
          </div>
          
          <div className="product-page-info">
             {/* ... (Todo el contenido de info del producto se mantiene igual) ... */}
            <div className="product-page-header">
              <h1 className="product-page-title">{product.name}</h1>
              <div className="product-page-meta-actions">
                <div className="product-page-meta">
                  {product.code && (
                    <span className="product-page-code">
                      Código: {product.code}
                    </span>
                  )}
                  {product.ean && (
                    <span className="product-page-ean">EAN: {product.ean}</span>
                  )}
                </div>
                <button
                  className="product-page-share-btn"
                  onClick={handleShare}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
            <div className="product-page-specs">
              {product.colors && product.colors.length > 0 && (
                <div className="product-page-spec-item">
                  <div className="product-page-spec-label">
                    <span className="product-page-spec-icon">🎨</span>
                    <span>Colores disponibles</span>
                  </div>
                  <div className="product-page-colors">
                    {product.colors.map((color, idx) => (
                      <span key={idx} className="product-page-color-tag">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {product.medidas && product.medidas.length > 0 && (
                <div className="product-page-spec-item">
                  <div className="product-page-spec-label">
                    <span className="product-page-spec-icon">📏</span>
                    <span>Medidas</span>
                  </div>
                  <div className="product-page-spec-value">
                    {product.medidas.join(" / ")}
                  </div>
                </div>
              )}
              {product.bulto && (
                <div className="product-page-spec-item">
                  <div className="product-page-spec-label">
                    <span className="product-page-spec-icon">📦</span>
                    <span>Unidades por bulto</span>
                  </div>
                  <div className="product-page-spec-value">
                    {product.bulto} unidades
                  </div>
                </div>
              )}
              {product.cant_min && (
                <div className="product-page-spec-item">
                  <div className="product-page-spec-label">
                    <span className="product-page-spec-icon">📊</span>
                    <span>Cantidad mínima de compra</span>
                  </div>
                  <div className="product-page-spec-value">
                    {product.cant_min} unidades
                  </div>
                </div>
              )}
            </div>
            <div className="product-page-purchase">
              {user ? (
                <>
                  <div className="product-page-price-section">
                    <div className="product-page-price-wrapper">
                      <span className="product-page-price-label">
                        Precio mayorista
                      </span>
                      <span className="product-page-price">
                        ${price.toLocaleString()} + IVA
                      </span>
                    </div>
                    <div
                      className={`product-page-stock ${
                        inStock
                          ? "product-page-stock-available"
                          : "product-page-stock-unavailable"
                      }`}
                    >
                      <span className="product-page-stock-dot"></span>
                      {inStock ? "En stock" : "Sin stock"}
                    </div>
                  </div>
                  {inStock && <AddToCart product={product} />}
                  {!inStock && (
                    <button disabled className="product-page-btn-disabled">
                      Sin stock
                    </button>
                  )}
                </>
              ) : (
                <div className="product-page-login-prompt">
                  <p>Inicia sesión para ver precios y realizar pedidos</p>
                  <Link to="/login" className="product-page-login-btn">
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <div className="product-page-related">
            <h2 className="product-page-related-title">
              Productos de la misma categoría
            </h2>
            <div className="product-page-carousel">
              {related.length > 4 && (
                <button
                  className="product-page-arrow product-page-arrow-left"
                  onClick={prevSlide}
                >
                  ❮
                </button>
              )}
              <div className="product-page-related-grid">
                {showRelated.map((p, idx) => (
                  <ProductCard key={p.id + idx} p={p} />
                ))}
              </div>
              {related.length > 4 && (
                <button
                  className="product-page-arrow product-page-arrow-right"
                  onClick={nextSlide}
                >
                  ❯
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <FloatingCartButton />

      {/* --- MODAL DE VIDEO CORREGIDO --- */}
      {activeVideo && (
        <div 
          className="product-page-video-modal-overlay" 
          onClick={closeVideoModal}
        >
           <div 
             className="product-page-video-modal-content" 
             onClick={e => e.stopPropagation()}
           >
              <button 
                className="product-page-video-modal-close" 
                onClick={closeVideoModal}
              >
                ×
              </button>
              {(() => {
                  const { id: videoId, vertical } = getYouTubeId(activeVideo);
                  
                  if (!videoId) {
                    return <div style={{color: 'white', padding: '2rem', textAlign: 'center'}}>No se pudo cargar el video. ID no válido.</div>;
                  }

                  return (
                    <div className={`product-page-video-frame-container ${vertical ? 'is-vertical-modal' : ''}`}>
                      <iframe
                        width="100%"
                        height="100%"
                        // Usamos youtube-nocookie para evitar bloqueos de terceros
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        // Lista de permisos estándar y simplificada
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                    </div>
                  );
              })()}
           </div>
        </div>
      )}

      {showShareModal && (
        <div
          className="product-page-modal-overlay"
          onClick={() => setShowShareModal(false)}
        >
          {/* ... Modal de compartir existente ... */}
           <div
            className="product-page-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="product-page-modal-title">Compartir producto</h3>
            <p className="product-page-modal-text">
              Comparte este producto con otros clientes
            </p>
            <div className="product-page-modal-url">{window.location.href}</div>
            <div className="product-page-modal-actions">
              <button
                className="product-page-modal-btn-copy"
                onClick={copyToClipboard}
              >
                Copiar enlace
              </button>
              <button
                className="product-page-modal-btn-cancel"
                onClick={() => setShowShareModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showCopyToast && (
        <div className="product-page-toast">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>¡Enlace copiado al portapapeles!</span>
        </div>
      )}
    </div>
  );
}

function AddToCart({ product }) {
  const { user, addToCart } = useAuth();
  const [qty, setQty] = useState(product.cant_min || 1);

  const handleAddToCart = () => {
    const price =
      user?.state === 2 ? product.price_state2 : product.price_state1;

    const productData = {
      id: product.id,
      code: product.code,
      name: product.name,
      price,
      cant_min: product.cant_min || 1,
      image: product.multimedia?.[0] || null,
    };

    addToCart(productData, qty);
    setQty(product.cant_min || 1);
  };

  return (
    <div className="product-page-add-to-cart">
      <div className="product-page-quantity">
        <label className="product-page-quantity-label">Cantidad:</label>
        <div className="product-page-quantity-controls">
          <button
            className="product-page-quantity-btn"
            onClick={() => setQty(Math.max(product.cant_min || 1, qty - 1))}
          >
            −
          </button>
          <input
            className="product-page-quantity-input"
            value={qty}
            onChange={(e) =>
              setQty(Math.max(product.cant_min || 1, Number(e.target.value)))
            }
            type="number"
            min={product.cant_min || 1}
          />
          <button
            className="product-page-quantity-btn"
            onClick={() => setQty(qty + 1)}
          >
            +
          </button>
        </div>
      </div>
      {product.cant_min && qty < product.cant_min && (
        <p className="product-page-min-warning">
          ⚠️ Mínimo: {product.cant_min} unidades
        </p>
      )}
      <button
        onClick={handleAddToCart}
        className="product-page-btn-add"
        disabled={product.cant_min && qty < product.cant_min}
      >
        🛒 Agregar al carrito
      </button>
    </div>
  );
}