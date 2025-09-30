// NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
      Página no encontrada. <Link to="/">Volver al inicio</Link>
    </div>
  );
}
