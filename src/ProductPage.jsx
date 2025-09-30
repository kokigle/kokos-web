// ProductPage.jsx
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

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainMedia, setMainMedia] = useState(null);
  const [related, setRelated] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [thumbIndex, setThumbIndex] = useState(0); // carrusel de thumbnails
  const { user } = useAuth();

  useEffect(() => {
    const docRef = doc(db, "products", id);
    getDoc(docRef).then((d) => {
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
        setProduct(null);
      }
    });
  }, [id]);

  // autoplay relacionados
  useEffect(() => {
    if (related.length > 1) {
      const interval = setInterval(() => {
        setStartIndex((prev) => (prev + 1) % related.length);
      }, 4000); // cada 4 segundos
      return () => clearInterval(interval);
    }
  }, [related]);

  if (product === null) return <div>Producto no encontrado</div>;
  if (!product) return <div>Cargando...</div>;

  const price = user?.state === 2 ? product.price_state2 : product.price_state1;
  const inStock = product.stock === 1;

  // Helpers
  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.pathname.includes("/shorts/")) {
        return { id: u.pathname.split("/shorts/")[1], vertical: true };
      }
      if (u.searchParams.get("v")) {
        return { id: u.searchParams.get("v"), vertical: false };
      }
    } catch (e) {
      return { id: null, vertical: false };
    }
    return { id: null, vertical: false };
  };

  // Carousel relacionados
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

  // Carousel thumbnails
  const thumbs = [
    ...(product.multimedia || []).map((img) => ({ type: "image", url: img })),
    ...(product.videos || []).map((video) => ({ type: "video", url: video })),
  ];
  const showThumbs =
    thumbs.length > 4
      ? [...thumbs, ...thumbs].slice(thumbIndex, thumbIndex + 4)
      : thumbs;

  const nextThumb = () => {
    setThumbIndex((prev) => (prev + 1) % thumbs.length);
  };
  const prevThumb = () => {
    setThumbIndex((prev) => (prev - 1 + thumbs.length) % thumbs.length);
  };

  return (
    <div
      className="product-page"
      style={{
        background: "#f8f9fa",
        borderRadius: 16,
        boxShadow: "0 6px 24px rgba(27,31,56,0.08)",
        padding: "32px 24px",
        margin: "32px auto",
        maxWidth: 1200,
      }}
    >
      <div
        className="gallery"
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(27,31,56,0.06)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div
          className="main-media"
          style={{ boxShadow: "0 2px 8px rgba(27,31,56,0.08)" }}
        >
          {mainMedia?.type === "image" && (
            <img
              className="main-img"
              src={mainMedia.url}
              alt="Producto"
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(27,31,56,0.08)",
              }}
            />
          )}
          {mainMedia?.type === "video" &&
            (() => {
              const { id: videoId, vertical } = getYouTubeId(mainMedia.url);
              if (!videoId) return <p>Video inválido</p>;
              return vertical ? (
                <div className="short-container">
                  <div
                    className="short-bg"
                    style={{
                      backgroundImage: `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`,
                    }}
                  ></div>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video vertical"
                    style={{ borderRadius: 12 }}
                  ></iframe>
                </div>
              ) : (
                <iframe
                  className="video-normal"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video del producto"
                  style={{ borderRadius: 12 }}
                ></iframe>
              );
            })()}
        </div>
        {thumbs.length > 0 && (
          <div className="thumb-carousel" style={{ marginTop: 24 }}>
            {thumbs.length > 4 && (
              <button className="arrow left" onClick={prevThumb}>
                ❮
              </button>
            )}
            <div className="thumb-grid">
              {showThumbs.map((t, idx) => {
                if (t.type === "image") {
                  return (
                    <img
                      key={idx}
                      src={t.url}
                      alt={`thumb-${idx}`}
                      onClick={() => setMainMedia(t)}
                      style={{
                        borderRadius: 8,
                        boxShadow: "0 1px 4px rgba(27,31,56,0.08)",
                        cursor: "pointer",
                        border: "2px solid #eee",
                      }}
                    />
                  );
                } else {
                  const { id: vid } = getYouTubeId(t.url);
                  return (
                    <div
                      key={idx}
                      className="video-thumb"
                      onClick={() => setMainMedia(t)}
                      style={{
                        borderRadius: 8,
                        boxShadow: "0 1px 4px rgba(27,31,56,0.08)",
                        cursor: "pointer",
                        border: "2px solid #eee",
                        position: "relative",
                      }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${vid}/0.jpg`}
                        alt={`video-${idx}`}
                        style={{ borderRadius: 8 }}
                      />
                      <span
                        className="play-icon"
                        style={{
                          position: "absolute",
                          top: "30%",
                          left: "35%",
                          fontSize: "2rem",
                          color: "#009ca6",
                          textShadow: "0px 0px 5px #fff",
                          pointerEvents: "none",
                        }}
                      >
                        ▶
                      </span>
                    </div>
                  );
                }
              })}
            </div>
            {thumbs.length > 4 && (
              <button className="arrow right" onClick={nextThumb}>
                ❯
              </button>
            )}
          </div>
        )}
      </div>
      <div
        className="info"
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(27,31,56,0.06)",
          padding: 32,
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#009ca6",
            marginBottom: 12,
          }}
        >
          {product.name}
        </h1>
        <p style={{ fontSize: 18, color: "#444", marginBottom: 18 }}>
          {product.description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 18,
          }}
        >
          {user ? (
            <>
              <span
                className="price"
                style={{ fontSize: 28, fontWeight: 700, color: "#28a745" }}
              >
                ${price.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: inStock ? "#28a745" : "#ff4d4f",
                  fontWeight: 600,
                }}
              >
                {inStock ? "En stock" : "Sin stock"}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 16, color: "#888" }}>
              <em>Inicia sesión para ver el precio</em>
            </span>
          )}
        </div>
        {user && inStock && <AddToCart product={product} />}
        {user && !inStock && (
          <button
            disabled
            className="btn"
            style={{ background: "#eee", color: "#aaa", cursor: "not-allowed" }}
          >
            Sin stock
          </button>
        )}
      </div>
      {related.length > 0 && (
        <div
          className="related-section"
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 12px rgba(27,31,56,0.06)",
            padding: 24,
            marginTop: 32,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#009ca6",
              marginBottom: 18,
            }}
          >
            Productos en la misma categoría
          </h2>
          <div className="carousel">
            {related.length > 5 && (
              <button className="arrow left" onClick={prevSlide}>
                ❮
              </button>
            )}
            <div
              className="related-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)", // 👈 siempre 4 columnas
                gap: 24,
              }}
            >
              {showRelated.map((p, idx) => (
                <ProductCard key={p.id + idx} p={p} />
              ))}
            </div>
            {related.length > 5 && (
              <button className="arrow right" onClick={nextSlide}>
                ❯
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------
// AddToCart
// ----------------------
function AddToCart({ product }) {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  const add = () => {
    const raw = localStorage.getItem("wh_cart");
    const cart = raw ? JSON.parse(raw) : [];
    const price =
      user?.state === 2 ? product.price_state2 : product.price_state1;
    const existing = cart.find((c) => c.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: product.id, name: product.name, price, qty });
    localStorage.setItem("wh_cart", JSON.stringify(cart));
    navigate("/cart");
  };

  return (
    <div>
      <label>Cantidad:</label>
      <input
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
        type="number"
        min="1"
      />
      <button onClick={add} className="btn">
        Agregar al carrito
      </button>
    </div>
  );
}
