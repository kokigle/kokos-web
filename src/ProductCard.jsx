// ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./App";
import "./styles/products-list.css";
import "./styles/product-page.css";
export default function ProductCard({ p }) {
  const [hovered, setHovered] = useState(null);
  const { user } = useAuth();

  // Precio según estado del usuario
  let priceContent;
  if (!user) {
    priceContent = (
      <p style={{ fontSize: 14, color: "#888" }}>
        <em>Inicia sesión para ver el precio</em>
      </p>
    );
  } else {
    const price = user.state === 2 ? p.price_state2 : p.price_state1;
    priceContent = (
      <p
        className="product-price"
        style={{
          fontWeight: 700,
          color: "#28a745",
          fontSize: 18,
        }}
      >
        ${price?.toLocaleString()}
      </p>
    );
  }

  const mainImg = p.multimedia?.[0] || "https://via.placeholder.com/300";
  const hoverImg = p.multimedia?.[1] || mainImg;

  return (
    <div
      key={p.id}
      className="product-card"
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(27,31,56,0.08)",
        padding: 16,
        transition: "box-shadow 0.3s, transform 0.3s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 300, // 👈 antes 420
      }}
      onMouseEnter={() => setHovered(p.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <div>
        <div
          className="product-img-wrapper"
          style={{
            marginBottom: 12,
            position: "relative",
            height: 160, // 👈 antes 220
            overflow: "hidden",
            borderRadius: 12,
            background: "#f9f9fb",
            boxShadow: "0 1px 6px rgba(27,31,56,0.06)",
          }}
        >
          <Link
            to={`/product/${p.id}`}
            style={{ display: "block", height: "100%" }}
          >
            <img
              src={hovered === p.id ? hoverImg : mainImg}
              alt={p.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 12,
                transition: "opacity 0.5s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </Link>
          {p.stock === 0 && (
            <div
              className="out-of-stock"
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#ff4d4f",
                color: "#fff",
                borderRadius: 6,
                padding: "4px 10px",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              SIN STOCK
            </div>
          )}
        </div>

        <h3
          className="product-name"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#009ca6",
            margin: "8px 0",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <Link
            to={`/product/${p.id}`}
            style={{ color: "#009ca6", textDecoration: "none" }}
          >
            {p.name}
          </Link>
        </h3>

        <p
          className="product-code"
          style={{ fontSize: 13, color: "#888", marginBottom: 8 }}
        >
          Código: {p.code}
        </p>
        {priceContent}
      </div>

      <Link
        to={`/product/${p.id}`}
        className={`btn ${p.stock === 0 ? "disabled" : ""}`}
        style={{
          background: p.stock === 0 ? "#eee" : "#009ca6",
          color: p.stock === 0 ? "#aaa" : "#fff",
          borderRadius: 8,
          fontWeight: 700,
          marginTop: 12,
          textDecoration: "none",
          padding: "10px 0",
          textAlign: "center",
        }}
      >
        {p.stock === 0 ? "SIN STOCK" : "VER PRODUCTO"}
      </Link>
    </div>
  );
}
