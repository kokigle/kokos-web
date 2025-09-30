// Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="kokos-footer">
      <div className="footer-container">
        <div className="footer-logo">
          <img src={logo} alt="Kokos Logo" className="kokos-logo-img" />
        </div>
        <div className="footer-col">
          <h4>Contacto</h4>
          <p>
            <FaWhatsapp /> 1145457891
          </p>
          <p>
            <FaEnvelope /> infokokos@gmail.com
          </p>
          <p>
            <FaMapMarkerAlt /> Buenos Aires, Argentina
          </p>
        </div>
        <div className="footer-col">
          <h4>Mi Cuenta</h4>
          <p>
            <Link to="/login">Registro / Login</Link>
          </p>
          <p>
            <Link to="/cart">Mi Carrito</Link>
          </p>
        </div>
        <div className="footer-col">
          <h4>Sobre Nosotros</h4>
          <p>
            <Link to="/nosotros">KOKOS Argentina</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
